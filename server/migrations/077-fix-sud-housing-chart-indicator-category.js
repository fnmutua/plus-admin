'use strict';

/**
 * Fix SUD housing units chart (wrong indicator 134 → category 106 CDP data).
 * Link category 93 (Social housing units / Constructed) explicitly.
 */

const HOUSING_CHART_CODE = 'sud-seed-chart-housing-units';
const HOUSING_CATEGORY_ID = 93;

const CATEGORY_FILTER = [
  { field: 'indicator_category_id', value: [HOUSING_CATEGORY_ID], operation: 'eq' },
];

function buildJsonbArraySql(items) {
  if (!items || !items.length) {
    return { sql: 'NULL', replacements: {} };
  }
  const replacements = {};
  const parts = items.map((item, index) => {
    const key = `f${index}`;
    replacements[key] = JSON.stringify(item);
    return `:${key}::jsonb`;
  });
  return { sql: `ARRAY[${parts.join(', ')}]`, replacements };
}

async function refreshSudBundle(dashboardId) {
  try {
    const { refreshDashboardBundle } = require('../app/services/nationalDashboardBundle');
    await refreshDashboardBundle(dashboardId);
    console.log(`[077] Refreshed Redis bundle for SUD dashboard ${dashboardId}`);
  } catch (err) {
    console.warn('[077] Bundle refresh skipped:', err.message);
  }
}

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();
    const { sql: filtersSql, replacements: filterReplacements } = buildJsonbArraySql(CATEGORY_FILTER);

    try {
      const [charts] = await sequelize.query(
        `SELECT c.id FROM dashboard_section_chart c
         JOIN dashboard_section s ON s.id = c.dashboard_section_id
         JOIN dashboard d ON d.id = s.dashboard_id
         WHERE d.title = 'SUD' AND c.code = :code
         LIMIT 1`,
        { replacements: { code: HOUSING_CHART_CODE }, transaction },
      );

      if (!charts.length) {
        console.warn('[077] Housing units chart not found; skipping.');
        await transaction.commit();
        return;
      }

      const chartId = charts[0].id;

      await sequelize.query(
        `DELETE FROM chart_indicator WHERE dashboard_section_chart_id = :chartId`,
        { replacements: { chartId }, transaction },
      );

      await sequelize.query(
        `UPDATE dashboard_section_chart SET
           title = 'Social housing units constructed',
           description = 'Reported social housing units (category 93) vs 37,503 project targets — no unit reports filed yet',
           filtered = true,
           filters = ${filtersSql},
           "updatedAt" = NOW()
         WHERE id = :id`,
        { replacements: { id: chartId, ...filterReplacements }, transaction },
      );

      await transaction.commit();
      console.log('[077] Fixed housing units chart → indicator_category_id 93 (removed wrong indicator 134 link).');

      const [dash] = await sequelize.query(
        `SELECT id FROM dashboard WHERE title = 'SUD' LIMIT 1`,
      );
      if (dash.length) await refreshSudBundle(dash[0].id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async () => {
    console.log('[077] down: no-op (manual restore indicator 134 link if needed).');
  },
};
