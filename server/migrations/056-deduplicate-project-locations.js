'use strict';

/**
 * Remove legacy duplicate project_location rows and scope-mismatched locations.
 *
 * The original unique index treats NULL ward_id/settlement_id as distinct, so
 * identical county/subcounty rows could be inserted repeatedly. This migration:
 * 1. Merges exact duplicates (keeps lowest id, reassigns FK references)
 * 2. Deletes locations that do not match project.implementation_scope
 * 3. Replaces the unique index with NULL-safe expressions
 */
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    const locationPartitionSql = `
      pl.project_id,
      COALESCE(pl.ward_id, -1),
      COALESCE(pl.settlement_id, -1),
      COALESCE(pl.subcounty_id, -1),
      COALESCE(pl.county_id, -1),
      COALESCE(pl.location_type, '')
    `;

    const duplicateMapCte = `
      WITH ranked AS (
        SELECT
          pl.id,
          MIN(pl.id) OVER (
            PARTITION BY ${locationPartitionSql}
          ) AS keeper_id,
          ROW_NUMBER() OVER (
            PARTITION BY ${locationPartitionSql}
            ORDER BY pl.id
          ) AS rn
        FROM project_location pl
      ),
      dup_map AS (
        SELECT id AS duplicate_id, keeper_id
        FROM ranked
        WHERE rn > 1
      )
    `;

    const [[beforeDup]] = await sequelize.query(`
      SELECT COUNT(*)::int AS duplicate_groups
      FROM (
        SELECT COUNT(*) AS cnt
        FROM project_location pl
        GROUP BY ${locationPartitionSql}
        HAVING COUNT(*) > 1
      ) d;
    `);

    const [[beforeMismatch]] = await sequelize.query(`
      SELECT COUNT(*)::int AS mismatch_rows
      FROM project_location pl
      JOIN project p ON p.id = pl.project_id
      WHERE p.implementation_scope = 'national'
         OR (
           p.implementation_scope IS NOT NULL
           AND p.implementation_scope <> 'national'
           AND pl.location_type IS DISTINCT FROM p.implementation_scope
         );
    `);

    console.log(
      `[056] Before cleanup: ${beforeDup.duplicate_groups} duplicate groups, ${beforeMismatch.mismatch_rows} scope-mismatch rows`
    );

    await sequelize.transaction(async (transaction) => {
      const childTables = [
        'project_beneficiary',
        'project_clockin',
        'indicator_category',
        'indicator_category_report',
      ];

      for (const table of childTables) {
        const [[{ exists }]] = await sequelize.query(
          `
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = '${table}'
                AND column_name = 'project_location_id'
            ) AS exists;
          `,
          { transaction }
        );

        if (!exists) continue;

        await sequelize.query(
          `
            ${duplicateMapCte}
            UPDATE "${table}" AS child
            SET project_location_id = d.keeper_id
            FROM dup_map d
            WHERE child.project_location_id = d.duplicate_id
              AND child.project_location_id IS DISTINCT FROM d.keeper_id;
          `,
          { transaction }
        );
      }

      const [, dedupeMeta] = await sequelize.query(
        `
          ${duplicateMapCte}
          DELETE FROM project_location pl
          USING dup_map d
          WHERE pl.id = d.duplicate_id;
        `,
        { transaction }
      );

      const [, mismatchMeta] = await sequelize.query(
        `
          DELETE FROM project_location pl
          USING project p
          WHERE pl.project_id = p.id
            AND (
              p.implementation_scope = 'national'
              OR (
                p.implementation_scope IS NOT NULL
                AND p.implementation_scope <> 'national'
                AND pl.location_type IS DISTINCT FROM p.implementation_scope
              )
            );
        `,
        { transaction }
      );

      console.log(
        `[056] Deleted ${dedupeMeta.rowCount ?? 0} duplicate rows and ${mismatchMeta.rowCount ?? 0} scope-mismatch rows`
      );

      await sequelize.query(`DROP INDEX IF EXISTS unique_project_location;`, { transaction });

      await sequelize.query(
        `
          CREATE UNIQUE INDEX unique_project_location ON project_location (
            project_id,
            (COALESCE(ward_id, -1)),
            (COALESCE(settlement_id, -1)),
            (COALESCE(subcounty_id, -1)),
            (COALESCE(county_id, -1)),
            (COALESCE(location_type, ''))
          );
        `,
        { transaction }
      );
    });

    const [[afterDup]] = await sequelize.query(`
      SELECT COUNT(*)::int AS duplicate_groups
      FROM (
        SELECT COUNT(*) AS cnt
        FROM project_location pl
        GROUP BY ${locationPartitionSql}
        HAVING COUNT(*) > 1
      ) d;
    `);

    const [[afterMismatch]] = await sequelize.query(`
      SELECT COUNT(*)::int AS mismatch_rows
      FROM project_location pl
      JOIN project p ON p.id = pl.project_id
      WHERE p.implementation_scope = 'national'
         OR (
           p.implementation_scope IS NOT NULL
           AND p.implementation_scope <> 'national'
           AND pl.location_type IS DISTINCT FROM p.implementation_scope
         );
    `);

    console.log(
      `[056] After cleanup: ${afterDup.duplicate_groups} duplicate groups, ${afterMismatch.mismatch_rows} scope-mismatch rows`
    );
  },

  down: async () => {
    // Destructive data cleanup; index shape change is not rolled back automatically.
  },
};
