'use strict';

/**
 * Regional report submissions stored completion % in progress/cumProgress but left
 * amount/cumAmount at 0. Align stored amounts for M&E reporting.
 */
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    const [result] = await sequelize.query(`
      UPDATE indicator_category_report r
      SET amount = src.pct,
          "cumAmount" = src.pct,
          target = COALESCE(r.target, 100),
          "updatedAt" = NOW()
      FROM (
        SELECT
          r2.id AS report_id,
          ROUND(COALESCE(r2."cumProgress", r2.progress)::numeric, 2) AS pct
        FROM indicator_category_report r2
        WHERE r2.indicator_category_id = 47
          AND r2.qualitative IS NULL
          AND COALESCE(r2."cumProgress", r2.progress) IS NOT NULL
          AND (
            COALESCE(r2.amount, 0) = 0
            OR COALESCE(r2."cumAmount", 0) = 0
          )
      ) src
      WHERE r.id = src.report_id
        AND src.pct IS NOT NULL
      RETURNING r.id
    `);

    console.log(
      `[073] Aligned regional physical progress indicator amounts: ${result.length} report(s) updated`,
    );
  },

  down: async () => {
    // Non-destructive data backfill; no rollback.
  },
};
