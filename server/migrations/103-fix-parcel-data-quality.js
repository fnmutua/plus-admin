'use strict';

/**
 * Clean up parcel data problems found in the October 2026 parcel review.
 *
 * Every rule is decided from the data at the time the migration runs, not from
 * a list of ids, so each environment gets the same treatment of its own rows:
 *
 *  1. Delete slivers: parcels drawn smaller than 1 m² whose recorded area is
 *     also under 1 m² (0.0001 ha) or missing.
 *  2. Delete exact duplicates: the same shape and parcel number loaded twice
 *     into one settlement. The oldest copy (lowest id) is kept.
 *  3. Repair invalid geometry with ST_MakeValid, keeping only the polygons.
 *  4. Fix area_ha:
 *       - values that are really square metres (within 25% of the drawn
 *         area in m²) are divided by 10,000;
 *       - missing, zero, or more than 10x off the drawn area: set to the
 *         drawn area.
 *  5. Land use: missing, or an id that is not in landuse_type (e.g. 10),
 *     becomes 0 (Residential).
 *  6. Move a parcel to the settlement it lies in when it is outside its own
 *     settlement and inside exactly one other. Linked beneficiary_parcel rows
 *     move with it.
 *
 * Parcels referenced by beneficiary_parcel are never deleted.
 *
 * Not changed, because they need someone who knows the site: parcels lying
 * outside every settlement (usually the settlement boundary is wrong),
 * parcel numbers of 0, shapes shared by parcels with different numbers, and
 * land uses that may be shifted by one in the 2023 load.
 *
 * Every parcel is copied to parcel_fix_103_backup before its first change,
 * and every change is listed in parcel_fix_103_log, so down() restores the
 * original rows exactly.
 */

const BACKUP = 'parcel_fix_103_backup';
const LOG = 'parcel_fix_103_log';
const BENEFICIARY_BACKUP = 'parcel_fix_103_beneficiary_backup';

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    await sequelize.transaction(async (transaction) => {
      const run = (sql) => sequelize.query(sql, { transaction });
      const count = async (sql) => {
        const [[row]] = await run(sql);
        return Number(row.n);
      };

      await run(`CREATE TABLE IF NOT EXISTS ${BACKUP} AS SELECT * FROM parcel WHERE false`);
      await run(`ALTER TABLE ${BACKUP} DROP CONSTRAINT IF EXISTS ${BACKUP}_pkey`);
      await run(`ALTER TABLE ${BACKUP} ADD CONSTRAINT ${BACKUP}_pkey PRIMARY KEY (id)`);
      await run(`
        CREATE TABLE IF NOT EXISTS ${LOG} (
          id serial PRIMARY KEY,
          parcel_id integer NOT NULL,
          action text NOT NULL,
          detail text,
          "createdAt" timestamptz NOT NULL DEFAULT now()
        )
      `);
      await run(`
        CREATE TABLE IF NOT EXISTS ${BENEFICIARY_BACKUP} (
          id integer PRIMARY KEY,
          settlement_id integer
        )
      `);

      // Each step names its parcels in a temp table, backs them up (first
      // touch only), logs them, then runs its change statement(s).
      const step = async (name, selectSql, applySql) => {
        await run(`DROP TABLE IF EXISTS fix_targets`);
        await run(`CREATE TEMP TABLE fix_targets ON COMMIT DROP AS ${selectSql}`);
        await run(`
          INSERT INTO ${BACKUP}
          SELECT p.* FROM parcel p JOIN fix_targets t ON t.id = p.id
          ON CONFLICT (id) DO NOTHING
        `);
        await run(`INSERT INTO ${LOG} (parcel_id, action, detail) SELECT id, '${name}', detail FROM fix_targets`);
        const n = await count(`SELECT count(*) AS n FROM fix_targets`);
        if (n) {
          for (const sql of [].concat(applySql)) await run(sql);
        }
        console.log(`[103] ${name}: ${n} parcel(s)`);
      };

      const notLinked = (alias) =>
        `NOT EXISTS (SELECT 1 FROM beneficiary_parcel b WHERE b.parcel_id = ${alias}.id)`;

      // 1. Slivers
      await step(
        'delete sliver',
        `SELECT p.id, round(st_area(p.geom::geography)::numeric, 3) || ' m2' AS detail
           FROM parcel p
          WHERE p.geom IS NOT NULL
            AND st_area(p.geom::geography) < 1
            AND coalesce(p.area_ha, 0) < 0.0001
            AND ${notLinked('p')}`,
        `DELETE FROM parcel p USING fix_targets t WHERE p.id = t.id`
      );

      // 2. Exact duplicates
      await step(
        'delete duplicate',
        `SELECT dup.id, 'copy of parcel ' || keep.id AS detail
           FROM parcel dup
           JOIN LATERAL (
             SELECT k.id FROM parcel k
              WHERE k.id < dup.id
                AND k.settlement_id = dup.settlement_id
                AND lower(trim(k.parcel_no)) = lower(trim(dup.parcel_no))
                AND st_equals(k.geom, dup.geom)
              ORDER BY k.id LIMIT 1
           ) keep ON true
          WHERE dup.geom IS NOT NULL
            AND nullif(trim(dup.parcel_no), '') IS NOT NULL
            AND ${notLinked('dup')}`,
        `DELETE FROM parcel p USING fix_targets t WHERE p.id = t.id`
      );

      // 3. Invalid geometry
      await step(
        'repair geometry',
        `SELECT p.id, st_isvalidreason(p.geom) AS detail
           FROM parcel p
          WHERE p.geom IS NOT NULL
            AND NOT st_isvalid(p.geom)
            AND NOT st_isempty(st_collectionextract(st_makevalid(p.geom), 3))`,
        `UPDATE parcel p
            SET geom = st_collectionextract(st_makevalid(p.geom), 3)
           FROM fix_targets t WHERE p.id = t.id`
      );

      // 4. Areas, measured on the repaired geometry
      await step(
        'area_ha from m2',
        `SELECT p.id, p.area_ha || ' -> ' || round((p.area_ha / 10000)::numeric, 6) AS detail
           FROM parcel p
          WHERE p.area_ha > 0
            AND st_area(p.geom::geography) > 10
            AND abs(p.area_ha / st_area(p.geom::geography) - 1) < 0.25`,
        `UPDATE parcel p SET area_ha = p.area_ha / 10000 FROM fix_targets t WHERE p.id = t.id`
      );
      await step(
        'area_ha from geometry',
        `SELECT p.id, coalesce(p.area_ha::text, 'null') || ' -> ' || round((st_area(p.geom::geography) / 10000)::numeric, 6) AS detail
           FROM parcel p
          WHERE p.geom IS NOT NULL
            AND st_area(p.geom::geography) >= 1
            AND (
              p.area_ha IS NULL OR p.area_ha <= 0
              OR (st_area(p.geom::geography) / 10000) / p.area_ha > 10
              OR (st_area(p.geom::geography) / 10000) / p.area_ha < 0.1
            )`,
        `UPDATE parcel p SET area_ha = st_area(p.geom::geography) / 10000 FROM fix_targets t WHERE p.id = t.id`
      );

      // 5. Land use
      await step(
        'landuse to residential',
        `SELECT p.id, coalesce(p.landuse_id::text, 'null') || ' -> 0' AS detail
           FROM parcel p
          WHERE p.landuse_id IS NULL
             OR NOT EXISTS (SELECT 1 FROM landuse_type l WHERE l.id = p.landuse_id)`,
        `UPDATE parcel p SET landuse_id = 0 FROM fix_targets t WHERE p.id = t.id`
      );

      // 6. Wrong settlement
      await step(
        'move settlement',
        `WITH c AS (
           SELECT p.id, p.settlement_id, st_pointonsurface(p.geom) AS pt
             FROM parcel p
             JOIN settlement own ON own.id = p.settlement_id
            WHERE p.geom IS NOT NULL
              AND own.geom IS NOT NULL
              AND NOT st_intersects(own.geom, st_pointonsurface(p.geom))
         ), found AS (
           SELECT c.id, c.settlement_id, array_agg(s.id) AS ids
             FROM c JOIN settlement s ON s.geom IS NOT NULL AND st_intersects(s.geom, c.pt)
            GROUP BY c.id, c.settlement_id
         )
         SELECT id, settlement_id || ' -> ' || ids[1] AS detail, ids[1] AS new_settlement_id
           FROM found
          WHERE cardinality(ids) = 1`,
        [
          `INSERT INTO ${BENEFICIARY_BACKUP} (id, settlement_id)
             SELECT b.id, b.settlement_id FROM beneficiary_parcel b JOIN fix_targets t ON t.id = b.parcel_id
             ON CONFLICT (id) DO NOTHING`,
          `UPDATE beneficiary_parcel b SET settlement_id = t.new_settlement_id
             FROM fix_targets t WHERE b.parcel_id = t.id`,
          `UPDATE parcel p SET settlement_id = t.new_settlement_id
             FROM fix_targets t WHERE p.id = t.id`
        ]
      );
    });
  },

  down: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    await sequelize.transaction(async (transaction) => {
      const run = (sql) => sequelize.query(sql, { transaction });
      const [[exists]] = await run(`SELECT to_regclass('${BACKUP}') IS NOT NULL AS ok`);
      if (!exists.ok) return;

      const [columns] = await run(`
        SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'parcel' AND column_name <> 'id'
         ORDER BY ordinal_position
      `);
      const cols = columns.map((c) => `"${c.column_name}"`);

      await run(`
        UPDATE parcel p
           SET (${cols.join(', ')}) = (${cols.map((c) => `b.${c}`).join(', ')})
          FROM ${BACKUP} b WHERE p.id = b.id
      `);
      await run(`
        INSERT INTO parcel (id, ${cols.join(', ')})
        SELECT b.id, ${cols.map((c) => `b.${c}`).join(', ')}
          FROM ${BACKUP} b
         WHERE NOT EXISTS (SELECT 1 FROM parcel p WHERE p.id = b.id)
      `);
      await run(`
        UPDATE beneficiary_parcel b SET settlement_id = k.settlement_id
          FROM ${BENEFICIARY_BACKUP} k WHERE b.id = k.id
      `);

      await run(`DROP TABLE IF EXISTS ${BENEFICIARY_BACKUP}`);
      await run(`DROP TABLE IF EXISTS ${LOG}`);
      await run(`DROP TABLE ${BACKUP}`);
    });
  },
};
