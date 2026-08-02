'use strict';

/**
 * Location grouping on SUD charts must come from dashboard filters (county / subcounty / ward),
 * not fixed chart axes. Remove region charts (not a filter dimension) and clear hardcoded
 * county x_axis on simple Status bars so the summary path owns geography.
 */

const SUD_DASHBOARD_TITLE = 'SUD';

const REGION_CHART_CODES = [
  'sud-seed-chart-overview-region',
  'sud-seed-chart-markets-region',
];

/** Simple type-1 Status bars — geography from dashboard filterLevel, not x_axis. */
const CLEAR_X_AXIS_CHART_CODES = [
  'sud-seed-chart-overview-county',
  'sud-seed-chart-housing-county',
  'sud-seed-chart-markets-county',
  'sud-seed-chart-infra-county',
  'sud-seed-chart-overview-progress',
  'sud-seed-chart-housing-progress',
];

async function refreshSudBundle(dashboardId) {
  const { refreshSudBundleSafe } = require('../lib/migrationSudHelpers');
  await refreshSudBundleSafe(dashboardId, '080');
}

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const [dash] = await sequelize.query(
        `SELECT id FROM dashboard WHERE title = :title LIMIT 1`,
        { replacements: { title: SUD_DASHBOARD_TITLE }, transaction },
      );
      if (!dash.length) {
        console.warn('[080] SUD dashboard not found; skipping.');
        await transaction.commit();
        return;
      }
      const dashboardId = dash[0].id;

      if (REGION_CHART_CODES.length) {
        await sequelize.query(
          `DELETE FROM chart_indicator ci
           USING dashboard_section_chart c
           JOIN dashboard_section s ON s.id = c.dashboard_section_id
           WHERE ci.dashboard_section_chart_id = c.id
             AND s.dashboard_id = :dashboardId
             AND c.code IN (:chartCodes)`,
          { replacements: { dashboardId, chartCodes: REGION_CHART_CODES }, transaction },
        );

        const [deleted] = await sequelize.query(
          `DELETE FROM dashboard_section_chart c
           USING dashboard_section s
           WHERE c.dashboard_section_id = s.id
             AND s.dashboard_id = :dashboardId
             AND c.code IN (:chartCodes)
           RETURNING c.code`,
          { replacements: { dashboardId, chartCodes: REGION_CHART_CODES }, transaction },
        );
        console.log(`[080] Removed ${deleted.length} region chart(s).`);
      }

      const [cleared] = await sequelize.query(
        `UPDATE dashboard_section_chart c SET
           x_axis = NULL,
           "updatedAt" = NOW()
         FROM dashboard_section s
         WHERE c.dashboard_section_id = s.id
           AND s.dashboard_id = :dashboardId
           AND c.code IN (:chartCodes)
         RETURNING c.code`,
        { replacements: { dashboardId, chartCodes: CLEAR_X_AXIS_CHART_CODES }, transaction },
      );
      console.log(`[080] Cleared x_axis on ${cleared.length} chart(s).`);

      await transaction.commit();
      await refreshSudBundle(dashboardId);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async () => {
    console.warn('[080] down not implemented — re-run 075/076 to restore region/county x_axis charts.');
  },
};
