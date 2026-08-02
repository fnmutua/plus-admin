'use strict';

/**
 * SUD dashboard — target vs achieved charts in programme sections (COB FY 2025/2026).
 */

const SUD_DASHBOARD_TITLE = 'SUD';
const CREATED_BY = 1;

const PORTFOLIO_FILTER = [{ field: 'target_vs_achieved', value: ['portfolio'], operation: 'eq' }];

const SECTION_TITLE = {
  'sud-seed-section-overview': 'Overview',
  'sud-seed-section-housing': 'Social Housing',
  'sud-seed-section-markets': 'Markets',
  'sud-seed-section-infrastructure': 'Infrastructure',
};

const CHARTS = [
  {
    code: 'sud-tva-overview-bar',
    sectionCode: 'sud-seed-section-overview',
    title: 'COB targets vs achieved (all indicators)',
    description: 'Side-by-side comparison of annual COB targets and cumulative M&E reports',
    category: 'Status',
    type: 2,
    card_model: 'indicator_category_report',
    x_axis: { field: 'indicator', label: 'Indicator' },
    y_axis: { field: 'amount', label: 'value', aggregation: 'sum' },
    filters: PORTFOLIO_FILTER,
  },
  {
    code: 'sud-tva-gauge-housing',
    sectionCode: 'sud-seed-section-housing',
    title: 'Target vs achieved — social housing units',
    description: 'Project tracker targets (37,503 units) vs M&E reports',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [93], operation: 'eq' },
    ],
  },
  {
    code: 'sud-tva-gauge-markets',
    sectionCode: 'sud-seed-section-markets',
    title: 'Target vs achieved — markets',
    description: 'COB target 185 vs reported markets constructed',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [19], operation: 'eq' },
    ],
  },
  {
    code: 'sud-tva-gauge-roads',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — access roads (km)',
    description: 'COB target 15 km vs reported road construction',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [15], operation: 'eq' },
    ],
  },
  {
    code: 'sud-tva-gauge-floodlights',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — floodlights',
    description: 'COB target 50 vs reported floodlights (cumulative reports)',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [20], operation: 'eq' },
    ],
  },
  {
    code: 'sud-tva-gauge-footbridges',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — footbridges',
    description: 'COB target 2 vs reported footbridges',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [69], operation: 'eq' },
    ],
  },
  {
    code: 'sud-tva-gauge-halls',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — social halls',
    description: 'COB target 2 vs reported social halls',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [22], operation: 'eq' },
    ],
  },
  {
    code: 'sud-tva-gauge-health',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — health facilities',
    description: 'COB target 1 vs reported health facilities',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [18], operation: 'eq' },
    ],
  },
  {
    code: 'sud-tva-gauge-education',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — education blocks',
    description: 'COB target 3 vs reported education blocks',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [14], operation: 'eq' },
    ],
  },
];

const SEED_CODES = {
  charts: CHARTS.map((c) => c.code),
};

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

async function findSudDashboardId(sequelize, transaction) {
  const [rows] = await sequelize.query(
    `SELECT id FROM dashboard WHERE title = :title ORDER BY id LIMIT 1`,
    { replacements: { title: SUD_DASHBOARD_TITLE }, transaction },
  );
  if (!rows.length) throw new Error(`Dashboard "${SUD_DASHBOARD_TITLE}" not found.`);
  return rows[0].id;
}

async function findSectionId(sequelize, dashboardId, sectionCode, transaction) {
  const [rows] = await sequelize.query(
    `SELECT id FROM dashboard_section
     WHERE dashboard_id = :dashboardId
       AND (code = :code OR title = :title)
     LIMIT 1`,
    {
      replacements: {
        dashboardId,
        code: sectionCode,
        title: SECTION_TITLE[sectionCode] || sectionCode,
      },
      transaction,
    },
  );
  if (!rows.length) {
    throw new Error(`Section ${sectionCode} not found — run migration 075 first.`);
  }
  return rows[0].id;
}

async function upsertChart(sequelize, sectionId, chart, transaction) {
  const xAxis = chart.x_axis ? JSON.stringify(chart.x_axis) : null;
  const yAxis = chart.y_axis ? JSON.stringify(chart.y_axis) : null;
  const { sql: filtersSql, replacements: filterReplacements } = buildJsonbArraySql(chart.filters);

  const [existing] = await sequelize.query(
    `SELECT id FROM dashboard_section_chart
     WHERE code = :code OR (dashboard_section_id = :sectionId AND title = :title)
     LIMIT 1`,
    { replacements: { code: chart.code, sectionId, title: chart.title }, transaction },
  );

  const replacements = {
    sectionId,
    title: chart.title,
    description: chart.description,
    category: chart.category,
    type: chart.type,
    card_model: chart.card_model,
    x_axis: xAxis,
    y_axis: yAxis,
    filtered: true,
    code: chart.code,
    createdBy: CREATED_BY,
    ...filterReplacements,
  };

  if (existing.length) {
    await sequelize.query(
      `UPDATE dashboard_section_chart SET
         dashboard_section_id = :sectionId, title = :title, description = :description,
         category = :category, type = :type, card_model = :card_model,
         x_axis = :x_axis::jsonb, y_axis = :y_axis::jsonb,
         filtered = true, filters = ${filtersSql}, ignore_empty = true,
         code = :code, "updatedAt" = NOW()
       WHERE id = :id`,
      { replacements: { id: existing[0].id, ...replacements }, transaction },
    );
    return existing[0].id;
  }

  const [inserted] = await sequelize.query(
    `INSERT INTO dashboard_section_chart (
       dashboard_section_id, title, description, category, type, card_model,
       x_axis, y_axis, filtered, filters, ignore_empty, code, "createdBy", "createdAt", "updatedAt"
     ) VALUES (
       :sectionId, :title, :description, :category, :type, :card_model,
       :x_axis::jsonb, :y_axis::jsonb, true, ${filtersSql}, true, :code, :createdBy, NOW(), NOW()
     ) RETURNING id`,
    { replacements, transaction },
  );
  return inserted[0].id;
}

async function refreshSudBundle(dashboardId) {
  try {
    const { refreshDashboardBundle } = require('../app/services/nationalDashboardBundle');
    await refreshDashboardBundle(dashboardId);
    console.log(`[078] Refreshed Redis bundle for SUD dashboard ${dashboardId}`);
  } catch (err) {
    console.warn('[078] Bundle refresh skipped:', err.message);
  }
}

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const dashboardId = await findSudDashboardId(sequelize, transaction);
      const sectionCache = {};

      for (const chart of CHARTS) {
        if (!sectionCache[chart.sectionCode]) {
          sectionCache[chart.sectionCode] = await findSectionId(
            sequelize,
            dashboardId,
            chart.sectionCode,
            transaction,
          );
        }
        await upsertChart(sequelize, sectionCache[chart.sectionCode], chart, transaction);
      }

      await transaction.commit();
      console.log(`[078] SUD target vs achieved charts seeded in programme sections (${CHARTS.length} charts).`);

      await refreshSudBundle(dashboardId);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const [dash] = await sequelize.query(
        `SELECT id FROM dashboard WHERE title = :title LIMIT 1`,
        { replacements: { title: SUD_DASHBOARD_TITLE }, transaction },
      );
      if (!dash.length) {
        await transaction.commit();
        return;
      }

      await sequelize.query(
        `DELETE FROM dashboard_section_chart c
         USING dashboard_section s
         WHERE c.dashboard_section_id = s.id
           AND s.dashboard_id = :dashboardId
           AND c.code = ANY(:chartCodes)`,
        {
          replacements: { dashboardId: dash[0].id, chartCodes: SEED_CODES.charts },
          transaction,
        },
      );

      await transaction.commit();
      console.log('[078] Removed target vs achieved charts.');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
