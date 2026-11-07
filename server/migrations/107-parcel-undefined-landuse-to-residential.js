'use strict';

/**
 * Set parcel landuse_id to Residential (0) when it is missing or not a
 * known landuse_type id (Handbook 2025 §3.4.3 classes 0–10).
 *
 * Rows touched are copied to parcel_fix_107_landuse_backup so down() can
 * restore the previous landuse_id values.
 */

const BACKUP = 'parcel_fix_107_landuse_backup';

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    await sequelize.transaction(async (transaction) => {
      const run = (sql, replacements) =>
        sequelize.query(sql, { transaction, replacements });

      await run(`
        CREATE TABLE IF NOT EXISTS ${BACKUP} (
          id integer PRIMARY KEY,
          landuse_id integer NULL
        )
      `);

      await run(`
        INSERT INTO ${BACKUP} (id, landuse_id)
        SELECT p.id, p.landuse_id
          FROM parcel p
         WHERE p.landuse_id IS NULL
            OR NOT EXISTS (
                 SELECT 1 FROM landuse_type l WHERE l.id = p.landuse_id
               )
        ON CONFLICT (id) DO NOTHING
      `);

      const [[stats]] = await run(`
        SELECT COUNT(*)::int AS n FROM ${BACKUP}
      `);
      console.log(
        `[107] Setting ${stats.n} parcel(s) with undefined/invalid land use to Residential (0)`
      );

      await run(`
        UPDATE parcel p
           SET landuse_id = 0
          FROM ${BACKUP} b
         WHERE p.id = b.id
      `);
    });
  },

  down: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    await sequelize.transaction(async (transaction) => {
      const run = (sql) => sequelize.query(sql, { transaction });

      const [[exists]] = await run(`
        SELECT to_regclass('public.${BACKUP}') IS NOT NULL AS ok
      `);
      if (!exists.ok) return;

      await run(`
        UPDATE parcel p
           SET landuse_id = b.landuse_id
          FROM ${BACKUP} b
         WHERE p.id = b.id
      `);
      await run(`DROP TABLE IF EXISTS ${BACKUP}`);
    });
  },
};
