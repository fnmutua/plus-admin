'use strict';

/**
 * Extend SUD dashboard with ~20 total charts — additional chart types and dimensions.
 * Idempotent (stable `code` fields). Run after 075.
 */

const SUD_DASHBOARD_TITLE = 'SUD';
const CREATED_BY = 1;

const PROGRAMME = {
  root: 19,
  housing: 16,
  markets: 17,
  infrastructure: 21,
};

const ROOT_FILTER = [{ field: 'programme_id', value: [PROGRAMME.root], operation: 'eq' }];
const HOUSING_FILTER = [{ field: 'programme_id', value: [PROGRAMME.housing], operation: 'eq' }];
const MARKETS_FILTER = [{ field: 'programme_id', value: [PROGRAMME.markets], operation: 'eq' }];
const INFRA_FILTER = [{ field: 'programme_id', value: [PROGRAMME.infrastructure], operation: 'eq' }];

/** Charts added by this migration (075 already seeds 8 base charts). */
const CHARTS = [
  // ── Overview — maps, donuts, region, progress, time, stacked, heatmap ──
  {
    code: 'sud-seed-chart-overview-map',
    sectionCode: 'sud-seed-section-overview',
    title: 'SUD portfolio map',
    description: 'Project location counts shaded by county on the Kenya map',
    category: 'Status',
    type: 7,
    card_model: 'project_location',
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  {
    code: 'sud-seed-chart-overview-status-donut',
    sectionCode: 'sud-seed-section-overview',
    title: 'Projects by implementation status',
    description: 'Share of SUD project locations by project status',
    category: 'Status',
    type: 10,
    card_model: 'project_location',
    x_axis: { field: 'project.status', label: 'Status' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  {
    code: 'sud-seed-chart-overview-region',
    sectionCode: 'sud-seed-section-overview',
    title: 'Projects by SUD region',
    description: 'Project locations grouped by regional tracker region',
    category: 'Status',
    type: 1,
    card_model: 'project_location',
    x_axis: { field: 'project.region', label: 'Region' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  {
    code: 'sud-seed-chart-overview-progress',
    sectionCode: 'sud-seed-section-overview',
    title: 'Average physical progress by county',
    description: 'Mean physical progress (%) across SUD project locations by county',
    category: 'Status',
    type: 1,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'physical_progress_pct', label: 'avg progress', aggregation: 'avg' },
    filters: ROOT_FILTER,
  },
  {
    code: 'sud-seed-chart-overview-timeline',
    sectionCode: 'sud-seed-section-overview',
    title: 'Project locations over time',
    description: 'Cumulative project locations added over time',
    category: 'Status',
    type: 5,
    card_model: 'project_location',
    time_field: 'createdAt',
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  {
    code: 'sud-seed-chart-overview-stacked-loc',
    sectionCode: 'sud-seed-section-overview',
    title: 'Locations by county and type',
    description: 'Stacked bar — county vs location type (county, ward, settlement, etc.)',
    category: 'Status',
    type: 9,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    series_field: { field: 'location_type', label: 'Location type' },
    filters: ROOT_FILTER,
  },
  {
    code: 'sud-seed-chart-overview-heatmap',
    sectionCode: 'sud-seed-section-overview',
    title: 'County × location type heatmap',
    description: 'Matrix of project location counts by county and location type',
    category: 'Status',
    type: 14,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    series_field: { field: 'location_type', label: 'Location type' },
    filters: ROOT_FILTER,
  },
  {
    code: 'sud-seed-chart-overview-component-pie',
    sectionCode: 'sud-seed-section-overview',
    title: 'Projects by component',
    description: 'Pie chart of SUD project locations by project component',
    category: 'Status',
    type: 3,
    card_model: 'project_location',
    x_axis: { field: 'component.title', label: 'Component' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  // ── Housing — gauge + location mix ──
  {
    code: 'sud-seed-chart-housing-gauge',
    sectionCode: 'sud-seed-section-housing',
    title: 'Housing share of SUD portfolio',
    description: 'Percentage of all SUD locations that belong to the Housing programme',
    category: 'Status',
    type: 15,
    card_model: 'project_location',
    y_axis: { field: 'id', label: 'Housing locations', aggregation: 'count' },
    filters: HOUSING_FILTER,
  },
  {
    code: 'sud-seed-chart-housing-loc-pie',
    sectionCode: 'sud-seed-section-housing',
    title: 'Housing locations by type',
    description: 'Distribution of housing project locations by geography level',
    category: 'Status',
    type: 3,
    card_model: 'project_location',
    x_axis: { field: 'location_type', label: 'Location type' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: HOUSING_FILTER,
  },
  {
    code: 'sud-seed-chart-housing-progress',
    sectionCode: 'sud-seed-section-housing',
    title: 'Housing progress by county',
    description: 'Average physical progress (%) for housing project locations',
    category: 'Status',
    type: 1,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'physical_progress_pct', label: 'avg progress', aggregation: 'avg' },
    filters: HOUSING_FILTER,
  },
  // ── Markets — stacked breakdown ──
  {
    code: 'sud-seed-chart-markets-stacked',
    sectionCode: 'sud-seed-section-markets',
    title: 'Markets locations by county (100% stacked)',
    description: 'Percentage breakdown of markets locations by county and location type',
    category: 'Status',
    type: 4,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    series_field: { field: 'location_type', label: 'Location type' },
    filters: MARKETS_FILTER,
  },
  {
    code: 'sud-seed-chart-markets-region',
    sectionCode: 'sud-seed-section-markets',
    title: 'Markets projects by region',
    description: 'Markets programme locations grouped by SUD region',
    category: 'Status',
    type: 1,
    card_model: 'project_location',
    x_axis: { field: 'project.region', label: 'Region' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: MARKETS_FILTER,
  },
  // ── Infrastructure — extra M&E + map ──
  {
    code: 'sud-seed-chart-infra-map',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Infrastructure portfolio map',
    description: 'Infrastructure project locations shaded by county',
    category: 'Status',
    type: 7,
    card_model: 'project_location',
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: INFRA_FILTER,
  },
  {
    code: 'sud-seed-chart-infra-play',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Children play areas constructed',
    description: 'Constructed children play areas (M&E) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [53],
  },
  {
    code: 'sud-seed-chart-infra-drainage',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Storm water drainage constructed',
    description: 'Storm water drainage works (M&E) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [23],
  },
  {
    code: 'sud-seed-chart-infra-water',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Household water connections',
    description: 'Piped water household connections (M&E) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [14],
  },
  {
    code: 'sud-seed-chart-infra-stacked-status',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Infrastructure by county and status',
    description: 'Stacked bar of infrastructure locations by county and project status',
    category: 'Status',
    type: 2,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    series_field: { field: 'project.status', label: 'Status' },
    filters: INFRA_FILTER,
  },
];

const CHART_FIXES = [
  {
    code: 'sud-seed-chart-housing-units',
    title: 'Social housing units constructed',
    description: 'Reported social housing units (category 93) by county',
    filters: [{ field: 'indicator_category_id', value: [93], operation: 'eq' }],
    removeIndicators: true,
  },
];

const SEED_CODES = CHARTS.map((c) => c.code);

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
  if (!rows.length) {
    throw new Error(`Dashboard "${SUD_DASHBOARD_TITLE}" not found.`);
  }
  return rows[0].id;
}

async function findSectionId(sequelize, dashboardId, sectionCode, transaction) {
  const titleMap = {
    'sud-seed-section-overview': 'Overview',
    'sud-seed-section-housing': 'Social Housing',
    'sud-seed-section-markets': 'Markets',
    'sud-seed-section-infrastructure': 'Infrastructure',
  };
  const [rows] = await sequelize.query(
    `SELECT id FROM dashboard_section
     WHERE dashboard_id = :dashboardId AND (code = :code OR title = :title)
     LIMIT 1`,
    {
      replacements: { dashboardId, code: sectionCode, title: titleMap[sectionCode] || sectionCode },
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
  const seriesField = chart.series_field ? JSON.stringify(chart.series_field) : null;
  const { sql: filtersSql, replacements: filterReplacements } = buildJsonbArraySql(chart.filters);
  const hasFilters = !!chart.filters?.length;

  const [existing] = await sequelize.query(
    `SELECT id FROM dashboard_section_chart
     WHERE code = :code OR (dashboard_section_id = :sectionId AND title = :title)
     LIMIT 1`,
    {
      replacements: { code: chart.code, sectionId, title: chart.title },
      transaction,
    },
  );

  let chartId;
  const commonReplacements = {
    sectionId,
    title: chart.title,
    description: chart.description,
    category: chart.category,
    type: chart.type,
    card_model: chart.card_model,
    x_axis: xAxis,
    y_axis: yAxis,
    series_field: seriesField,
    time_field: chart.time_field || null,
    filtered: hasFilters,
    code: chart.code,
    ...filterReplacements,
  };

  if (existing.length) {
    chartId = existing[0].id;
    await sequelize.query(
      `UPDATE dashboard_section_chart SET
         dashboard_section_id = :sectionId,
         title = :title,
         description = :description,
         category = :category,
         type = :type,
         card_model = :card_model,
         x_axis = :x_axis::jsonb,
         y_axis = :y_axis::jsonb,
         series_field = :series_field::jsonb,
         time_field = :time_field,
         filtered = :filtered,
         filters = ${filtersSql},
         ignore_empty = true,
         code = :code,
         "updatedAt" = NOW()
       WHERE id = :id`,
      { replacements: { id: chartId, ...commonReplacements }, transaction },
    );
  } else {
    const [inserted] = await sequelize.query(
      `INSERT INTO dashboard_section_chart (
         dashboard_section_id, title, description, category, type, card_model,
         x_axis, y_axis, series_field, time_field, filtered, filters, ignore_empty,
         code, "createdBy", "createdAt", "updatedAt"
       ) VALUES (
         :sectionId, :title, :description, :category, :type, :card_model,
         :x_axis::jsonb, :y_axis::jsonb, :series_field::jsonb, :time_field,
         :filtered, ${filtersSql}, true, :code, :createdBy, NOW(), NOW()
       ) RETURNING id`,
      {
        replacements: { ...commonReplacements, createdBy: CREATED_BY },
        transaction,
      },
    );
    chartId = inserted[0].id;
  }

  if (Array.isArray(chart.indicatorIds) && chart.indicatorIds.length) {
    await sequelize.query(
      `DELETE FROM chart_indicator WHERE dashboard_section_chart_id = :chartId`,
      { replacements: { chartId }, transaction },
    );
    for (const indicatorId of chart.indicatorIds) {
      await sequelize.query(
        `INSERT INTO chart_indicator (indicator_id, dashboard_section_chart_id)
         VALUES (:indicatorId, :chartId)
         ON CONFLICT (indicator_id, dashboard_section_chart_id) DO NOTHING`,
        { replacements: { indicatorId, chartId }, transaction },
      );
    }
  }

  return chartId;
}

async function fixExistingChart(sequelize, dashboardId, fix, transaction) {
  const [rows] = await sequelize.query(
    `SELECT c.id FROM dashboard_section_chart c
     JOIN dashboard_section s ON s.id = c.dashboard_section_id
     WHERE s.dashboard_id = :dashboardId AND c.code = :code
     LIMIT 1`,
    { replacements: { dashboardId, code: fix.code }, transaction },
  );
  if (!rows.length) return;

  const chartId = rows[0].id;
  await sequelize.query(
    `UPDATE dashboard_section_chart SET
       title = COALESCE(:title, title),
       description = COALESCE(:description, description),
       "updatedAt" = NOW()
     WHERE id = :id`,
    {
      replacements: {
        id: chartId,
        title: fix.title || null,
        description: fix.description || null,
      },
      transaction,
    },
  );

  if (fix.indicatorIds?.length) {
    await sequelize.query(
      `DELETE FROM chart_indicator WHERE dashboard_section_chart_id = :chartId`,
      { replacements: { chartId }, transaction },
    );
    for (const indicatorId of fix.indicatorIds) {
      await sequelize.query(
        `INSERT INTO chart_indicator (indicator_id, dashboard_section_chart_id)
         VALUES (:indicatorId, :chartId)
         ON CONFLICT (indicator_id, dashboard_section_chart_id) DO NOTHING`,
        { replacements: { indicatorId, chartId }, transaction },
      );
    }
  }
}

async function refreshSudBundle(dashboardId) {
  try {
    const { refreshDashboardBundle } = require('../app/services/nationalDashboardBundle');
    await refreshDashboardBundle(dashboardId);
    console.log(`[076] Refreshed Redis bundle for SUD dashboard ${dashboardId}`);
  } catch (err) {
    console.warn('[076] Bundle refresh skipped:', err.message);
  }
}

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const dashboardId = await findSudDashboardId(sequelize, transaction);
      console.log(`[076] Extending SUD dashboard id=${dashboardId}`);

      for (const fix of CHART_FIXES) {
        await fixExistingChart(sequelize, dashboardId, fix, transaction);
      }

      for (const chart of CHARTS) {
        const sectionId = await findSectionId(sequelize, dashboardId, chart.sectionCode, transaction);
        await upsertChart(sequelize, sectionId, chart, transaction);
      }

      await transaction.commit();
      console.log(`[076] Added/updated ${CHARTS.length} extended SUD charts (${CHARTS.length + 8} total with 075).`);

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
      const dashboardId = dash[0].id;

      await sequelize.query(
        `DELETE FROM chart_indicator ci
         USING dashboard_section_chart c
         JOIN dashboard_section s ON s.id = c.dashboard_section_id
         WHERE ci.dashboard_section_chart_id = c.id
           AND s.dashboard_id = :dashboardId
           AND c.code = ANY(:chartCodes)`,
        { replacements: { dashboardId, chartCodes: SEED_CODES }, transaction },
      );

      await sequelize.query(
        `DELETE FROM dashboard_section_chart c
         USING dashboard_section s
         WHERE c.dashboard_section_id = s.id
           AND s.dashboard_id = :dashboardId
           AND c.code = ANY(:chartCodes)`,
        { replacements: { dashboardId, chartCodes: SEED_CODES }, transaction },
      );

      await transaction.commit();
      console.log('[076] Removed extended SUD charts.');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
