'use strict';

/**
 * Sync latest indicator report progress from project_location.physical_progress_pct
 * (populated by 066 from the SUD Regional Tracker workbook).
 */
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    const [result] = await sequelize.query(`
      UPDATE indicator_category_report r
      SET "cumProgress" = src.pct,
          progress = src.pct,
          "updatedAt" = NOW()
      FROM (
        SELECT DISTINCT ON (r2.indicator_category_id, r2.project_id)
          r2.id AS report_id,
          ROUND(pl.physical_progress_pct::numeric, 2) AS pct
        FROM indicator_category_report r2
        JOIN LATERAL (
          SELECT physical_progress_pct
          FROM project_location pl
          WHERE pl.project_id = r2.project_id
            AND pl.physical_progress_pct IS NOT NULL
          ORDER BY pl.id
          LIMIT 1
        ) pl ON TRUE
        WHERE COALESCE(LOWER(r2.status), '') <> 'rejected'
        ORDER BY r2.indicator_category_id, r2.project_id, r2.id DESC
      ) src
      WHERE r.id = src.report_id
        AND (
          r."cumProgress" IS NULL
          OR ROUND(r."cumProgress"::numeric, 2) <> src.pct
        )
      RETURNING r.id
    `);

    console.log(
      `[067] Synced indicator report progress from tracker-backed location progress: ${result.length} report(s) updated`,
    );
  },

  down: async () => {
    // Non-destructive data backfill; no rollback.
  },
};
