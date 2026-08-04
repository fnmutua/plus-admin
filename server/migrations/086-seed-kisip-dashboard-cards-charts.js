'use strict';

/**
 * Seed / refresh KISIP dashboard (title "KISIP") with 4 KPI cards and charts
 * derived from imported PDO / Comp 1.1 M&E data (tools/kisip-me-import.csv).
 *
 * Idempotent — safe to re-run (matches by stable `code` fields).
 *
 * Run: node server/scripts/run-migration.js 086-seed-kisip-dashboard-cards-charts
 *
 * Analysis source: node tools/analyze-kisip-me-for-dashboard.js
 */

const KISIP_DASHBOARD_TITLE = 'KISIP';
const CREATED_BY = 1;

/** KISIP2 programme (imported M&E reports and project locations). */
const PROGRAMME = {
  root: 18,
  infrastructure: 27,
};

const CAT = {
  titles: 8,
  roads: 15,
  footpaths: 17,
  vending: 19,
  floodlights: 20,
  streetlights: 21,
  drainage: 23,
  sewer: 25,
  waterConnections: 26,
  waterPipeline: 104,
};

const IND = {
  titles: 8,
  roads: 15,
  footpaths: 17,
  vending: 19,
  floodlights: 20,
  streetlights: 21,
  drainage: 23,
  sewer: 25,
  waterConnections: 26,
  waterPipeline: 60,
};

const ROOT_FILTER = [{ field: 'programme_id', value: [PROGRAMME.root], operation: 'eq' }];
const INFRA_FILTER = [{ field: 'component_id', value: [PROGRAMME.infrastructure], operation: 'eq' }];

/** Four headline PDO KPI cards (top indicators from imported M&E data). */
const CARDS = [
  {
    code: 'kisip-seed-card-roads',
    title: 'Access roads (km)',
    description: 'Kilometres of access roads constructed (PDO)',
    icon: 'mdi:road',
    iconColor: '#5D4037',
    indicatorCategoryId: CAT.roads,
  },
  {
    code: 'kisip-seed-card-drainage',
    title: 'Stormwater drainage (km)',
    description: 'Kilometres of stormwater drainage (PDO)',
    icon: 'mdi:pipe-leak',
    iconColor: '#00695C',
    indicatorCategoryId: CAT.drainage,
  },
  {
    code: 'kisip-seed-card-streetlights',
    title: 'Street lights',
    description: 'Reported street lights installed (PDO)',
    icon: 'mdi:lightbulb-on-outline',
    iconColor: '#F9A825',
    indicatorCategoryId: CAT.streetlights,
  },
  {
    code: 'kisip-seed-card-floodlights',
    title: 'Floodlights',
    description: 'High-mast floodlights installed (PDO)',
    icon: 'mdi:light-flood-down',
    iconColor: '#EF6C00',
    indicatorCategoryId: CAT.floodlights,
  },
];

/** Cards dropped from an earlier seed revision — removed on re-run. */
const REMOVED_CARD_CODES = [
  'kisip-seed-card-locations',
  'kisip-seed-card-infrastructure',
  'kisip-seed-card-water-connections',
  'kisip-seed-card-titles',
];

const KEEP_CARD_CODES = CARDS.map((c) => c.code);

const SECTIONS = [
  {
    code: 'kisip-seed-section-overview',
    title: 'Overview',
    description: 'KISIP portfolio and settlement coverage',
    icon: 'mdi:view-dashboard-outline',
    iconColor: '#37474F',
  },
  {
    code: 'kisip-seed-section-infrastructure',
    title: 'Infrastructure delivery',
    description: 'Roads, drainage, lighting, and markets (PDO)',
    icon: 'mdi:transmission-tower',
    iconColor: '#2E7D32',
  },
  {
    code: 'kisip-seed-section-water',
    title: 'Water & sanitation',
    description: 'Water pipelines, connections, and sewer (PDO)',
    icon: 'mdi:water',
    iconColor: '#0277BD',
  },
  {
    code: 'kisip-seed-section-tenure',
    title: 'Tenure (Comp 1.1)',
    description: 'Titles and leases prepared by county',
    icon: 'mdi:file-document-outline',
    iconColor: '#6A1B9A',
  },
];

const CHARTS = [
  // ── Overview ──
  {
    code: 'kisip-seed-chart-overview-county',
    sectionCode: 'kisip-seed-section-overview',
    title: 'KISIP project locations by county',
    description: 'Count of KISIP2 project locations grouped by county',
    category: 'Status',
    type: 1,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  {
    code: 'kisip-seed-chart-overview-map',
    sectionCode: 'kisip-seed-section-overview',
    title: 'KISIP portfolio map',
    description: 'Settlements and project sites shaded by county on the Kenya map',
    category: 'Status',
    type: 7,
    card_model: 'project_location',
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  {
    code: 'kisip-seed-chart-overview-component-donut',
    sectionCode: 'kisip-seed-section-overview',
    title: 'Portfolio by component',
    description: 'Share of KISIP2 locations across programme components',
    category: 'Status',
    type: 10,
    card_model: 'project_location',
    x_axis: { field: 'component.title', label: 'Component' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  {
    code: 'kisip-seed-chart-overview-status-pie',
    sectionCode: 'kisip-seed-section-overview',
    title: 'Projects by status',
    description: 'Implementation status of KISIP project locations',
    category: 'Status',
    type: 3,
    card_model: 'project_location',
    x_axis: { field: 'project.status', label: 'Status' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  {
    code: 'kisip-seed-chart-overview-county-treemap',
    sectionCode: 'kisip-seed-section-overview',
    title: 'County coverage treemap',
    description: 'Relative size of the KISIP footprint by county',
    category: 'Status',
    type: 11,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: ROOT_FILTER,
  },
  {
    code: 'kisip-seed-chart-overview-pdo-donut',
    sectionCode: 'kisip-seed-section-overview',
    title: 'PDO delivery mix',
    description: 'Share of total PDO achievement across infrastructure indicators',
    category: 'Status',
    type: 10,
    card_model: 'indicator_category_report',
    filters: [{ field: 'target_vs_achieved', value: ['kisip_pdo'], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-overview-pdo-bar',
    sectionCode: 'kisip-seed-section-overview',
    title: 'PDO target vs achieved',
    description: 'Planned vs reported totals across major PDO indicators',
    category: 'Status',
    type: 2,
    card_model: 'indicator_category_report',
    filters: [{ field: 'target_vs_achieved', value: ['kisip_pdo'], operation: 'eq' }],
  },
  // ── Infrastructure ──
  {
    code: 'kisip-seed-chart-infra-roads',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Access roads constructed (km)',
    description: 'Kilometres of access roads reported (PDO) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.roads],
    filters: [{ field: 'indicator_category_id', value: [CAT.roads], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-infra-map',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Infrastructure portfolio map',
    description: 'Infrastructure component locations shaded by county',
    category: 'Status',
    type: 7,
    card_model: 'project_location',
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: INFRA_FILTER,
  },
  {
    code: 'kisip-seed-chart-infra-streetlights-map',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Street lights heat map',
    description: 'Street lights reported (PDO) shaded by county',
    category: 'Intervention',
    type: 7,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'count', aggregation: 'sum' },
    indicatorIds: [IND.streetlights],
    filters: [{ field: 'indicator_category_id', value: [CAT.streetlights], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-infra-stacked-status',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Infrastructure by county and status',
    description: 'Stacked breakdown of infrastructure locations by implementation status',
    category: 'Status',
    type: 2,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    series_field: { field: 'project.status', label: 'Status' },
    filters: INFRA_FILTER,
  },
  {
    code: 'kisip-seed-chart-infra-drainage',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Stormwater drainage (km)',
    description: 'Kilometres of stormwater drainage (PDO) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.drainage],
    filters: [{ field: 'indicator_category_id', value: [CAT.drainage], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-infra-streetlights',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Street lights installed',
    description: 'Street lights reported (PDO) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.streetlights],
    filters: [{ field: 'indicator_category_id', value: [CAT.streetlights], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-infra-floodlights',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Floodlights installed',
    description: 'High-mast floodlights reported (PDO) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.floodlights],
    filters: [{ field: 'indicator_category_id', value: [CAT.floodlights], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-infra-vending',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Vending platforms',
    description: 'Markets and vending platforms (PDO) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.vending],
    filters: [{ field: 'indicator_category_id', value: [CAT.vending], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-infra-footpaths',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Footpaths (km)',
    description: 'Kilometres of footpaths (PDO) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.footpaths],
    filters: [{ field: 'indicator_category_id', value: [CAT.footpaths], operation: 'eq' }],
  },
  // ── Water & sanitation ──
  {
    code: 'kisip-seed-chart-water-map',
    sectionCode: 'kisip-seed-section-water',
    title: 'Water connections map',
    description: 'Household water connections (PDO) shaded by county',
    category: 'Intervention',
    type: 7,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'connections', aggregation: 'sum' },
    indicatorIds: [IND.waterConnections],
    filters: [{ field: 'indicator_category_id', value: [CAT.waterConnections], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-water-mix-pie',
    sectionCode: 'kisip-seed-section-water',
    title: 'Water & sewer delivery mix',
    description: 'Share of water pipeline, connections, and sewer achievement',
    category: 'Status',
    type: 3,
    card_model: 'indicator_category_report',
    filters: [{ field: 'target_vs_achieved', value: ['kisip_water'], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-water-pipeline',
    sectionCode: 'kisip-seed-section-water',
    title: 'Water pipeline (km)',
    description: 'Kilometres of water reticulation pipes (PDO) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.waterPipeline],
    filters: [{ field: 'indicator_category_id', value: [CAT.waterPipeline], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-water-connections',
    sectionCode: 'kisip-seed-section-water',
    title: 'Household water connections',
    description: 'Household water connections (PDO) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.waterConnections],
    filters: [{ field: 'indicator_category_id', value: [CAT.waterConnections], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-water-sewer',
    sectionCode: 'kisip-seed-section-water',
    title: 'Sewer connections (km)',
    description: 'Kilometres of sewer lines (PDO) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.sewer],
    filters: [{ field: 'indicator_category_id', value: [CAT.sewer], operation: 'eq' }],
  },
  // ── Tenure ──
  {
    code: 'kisip-seed-chart-tenure-map',
    sectionCode: 'kisip-seed-section-tenure',
    title: 'Titles planned map',
    description: 'Comp 1.1 titles planned shaded by county',
    category: 'Intervention',
    type: 7,
    card_model: 'indicator_category_report',
    y_axis: { field: 'target', label: 'titles planned', aggregation: 'sum' },
    indicatorIds: [IND.titles],
    filters: [{ field: 'indicator_category_id', value: [CAT.titles], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-tenure-county-donut',
    sectionCode: 'kisip-seed-section-tenure',
    title: 'Titles planned by county',
    description: 'Top counties by Comp 1.1 titles planned',
    category: 'Intervention',
    type: 10,
    card_model: 'indicator_category_report',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'target', label: 'titles planned', aggregation: 'sum' },
    indicatorIds: [IND.titles],
    filters: [{ field: 'indicator_category_id', value: [CAT.titles], operation: 'eq' }],
  },
  {
    code: 'kisip-seed-chart-tenure-titles',
    sectionCode: 'kisip-seed-section-tenure',
    title: 'Titles prepared by county',
    description: 'Titles and leases prepared (Comp 1.1) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [IND.titles],
    filters: [{ field: 'indicator_category_id', value: [CAT.titles], operation: 'eq' }],
  },
  // ── Target vs achieved gauges ──
  {
    code: 'kisip-tva-gauge-roads',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Roads progress',
    description: 'PDO target vs reported access roads',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [CAT.roads], operation: 'eq' },
    ],
  },
  {
    code: 'kisip-tva-gauge-drainage',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Drainage progress',
    description: 'PDO target vs reported drainage',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [CAT.drainage], operation: 'eq' },
    ],
  },
  {
    code: 'kisip-tva-gauge-streetlights',
    sectionCode: 'kisip-seed-section-infrastructure',
    title: 'Street lights progress',
    description: 'PDO target vs reported street lights',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [CAT.streetlights], operation: 'eq' },
    ],
  },
  {
    code: 'kisip-tva-gauge-water-connections',
    sectionCode: 'kisip-seed-section-water',
    title: 'Water connections progress',
    description: 'PDO target vs reported household water connections',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [CAT.waterConnections], operation: 'eq' },
    ],
  },
  {
    code: 'kisip-tva-gauge-titles',
    sectionCode: 'kisip-seed-section-tenure',
    title: 'Titles progress',
    description: 'Comp 1.1 target vs reported titles',
    category: 'Status',
    type: 15,
    card_model: 'indicator_category_report',
    y_axis: { field: 'amount', label: 'Progress', aggregation: 'sum' },
    filters: [
      { field: 'target_vs_achieved', value: ['single'], operation: 'eq' },
      { field: 'indicator_category_id', value: [CAT.titles], operation: 'eq' },
    ],
  },
];

const KEEP_CHART_CODES = CHARTS.map((c) => c.code);

const REMOVED_CHART_CODES = [
  'kisip-seed-chart-overview-me-county',
];

const SEED_CODES = {
  cards: CARDS.map((c) => c.code),
  sections: SECTIONS.map((s) => s.code),
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

async function findKisipDashboardId(sequelize, transaction) {
  const [rows] = await sequelize.query(
    `SELECT id FROM dashboard WHERE title = :title ORDER BY id LIMIT 1`,
    { replacements: { title: KISIP_DASHBOARD_TITLE }, transaction },
  );
  if (!rows.length) {
    throw new Error(`Dashboard "${KISIP_DASHBOARD_TITLE}" not found — create it first in Dashboard settings.`);
  }
  return rows[0].id;
}

async function pruneExtraCards(sequelize, dashboardId, transaction) {
  const codeReplacements = {};
  const codeParams = KEEP_CARD_CODES.map((code, index) => {
    const key = `keepCode${index}`;
    codeReplacements[key] = code;
    return `:${key}`;
  }).join(', ');

  const [removed] = await sequelize.query(
    `DELETE FROM dashboard_card
     WHERE dashboard_id = :dashboardId
       AND code NOT IN (${codeParams})
     RETURNING id, title, code`,
    { replacements: { dashboardId, ...codeReplacements }, transaction },
  );
  if (removed.length) {
    console.log(`[086] Removed ${removed.length} extra KISIP dashboard cards`);
  }
}

async function pruneExtraCharts(sequelize, dashboardId, transaction) {
  const codeReplacements = {};
  const codeParams = KEEP_CHART_CODES.map((code, index) => {
    const key = `keepChart${index}`;
    codeReplacements[key] = code;
    return `:${key}`;
  }).join(', ');

  await sequelize.query(
    `DELETE FROM chart_indicator ci
     USING dashboard_section_chart c
     JOIN dashboard_section s ON s.id = c.dashboard_section_id
     WHERE ci.dashboard_section_chart_id = c.id
       AND s.dashboard_id = :dashboardId
       AND c.code NOT IN (${codeParams})`,
    { replacements: { dashboardId, ...codeReplacements }, transaction },
  );

  const [removed] = await sequelize.query(
    `DELETE FROM dashboard_section_chart c
     USING dashboard_section s
     WHERE c.dashboard_section_id = s.id
       AND s.dashboard_id = :dashboardId
       AND c.code NOT IN (${codeParams})
     RETURNING c.id, c.title, c.code`,
    { replacements: { dashboardId, ...codeReplacements }, transaction },
  );
  if (removed.length) {
    console.log(`[086] Removed ${removed.length} extra KISIP dashboard charts`);
  }
}

async function upsertInterventionCard(sequelize, dashboardId, card, transaction) {
  const filterItems = card.filters || ROOT_FILTER;
  const { sql: filtersSql, replacements: filterReplacements } = buildJsonbArraySql(filterItems);

  const [existing] = await sequelize.query(
    `SELECT id FROM dashboard_card
     WHERE dashboard_id = :dashboardId
       AND (code = :code OR title = :title)
     LIMIT 1`,
    {
      replacements: { dashboardId, code: card.code, title: card.title },
      transaction,
    },
  );

  const common = {
    title: card.title,
    description: card.description,
    icon: card.icon,
    iconColor: card.iconColor,
    indicatorCategoryId: card.indicatorCategoryId,
    code: card.code,
    ...filterReplacements,
  };

  if (existing.length) {
    await sequelize.query(
      `UPDATE dashboard_card SET
         title = :title,
         description = :description,
         category = 'Intervention',
         icon = :icon,
         "iconColor" = :iconColor,
         aggregation = 'sum',
         card_model = 'indicator_category_report',
         card_model_field = 'amount',
         indicator_category_id = :indicatorCategoryId,
         computation = 'absolute',
         filtered = :filtered,
         filters = ${filtersSql},
         code = :code,
         "updatedAt" = NOW()
       WHERE id = :id`,
      {
        replacements: {
          id: existing[0].id,
          filtered: filterItems.length > 0,
          ...common,
        },
        transaction,
      },
    );
    return existing[0].id;
  }

  const [inserted] = await sequelize.query(
    `INSERT INTO dashboard_card (
       dashboard_id, title, description, category, icon, "iconColor",
       aggregation, card_model, card_model_field, indicator_category_id,
       computation, filtered, filters, code, "createdBy", "createdAt", "updatedAt"
     ) VALUES (
       :dashboardId, :title, :description, 'Intervention', :icon, :iconColor,
       'sum', 'indicator_category_report', 'amount', :indicatorCategoryId,
       'absolute', :filtered, ${filtersSql}, :code, :createdBy, NOW(), NOW()
     ) RETURNING id`,
    {
      replacements: {
        dashboardId,
        createdBy: CREATED_BY,
        filtered: filterItems.length > 0,
        ...common,
      },
      transaction,
    },
  );
  return inserted[0].id;
}

async function upsertSection(sequelize, dashboardId, section, transaction) {
  const [existing] = await sequelize.query(
    `SELECT id FROM dashboard_section
     WHERE dashboard_id = :dashboardId
       AND (code = :code OR title = :title)
     LIMIT 1`,
    {
      replacements: { dashboardId, code: section.code, title: section.title },
      transaction,
    },
  );

  if (existing.length) {
    await sequelize.query(
      `UPDATE dashboard_section SET
         title = :title,
         description = :description,
         icon = :icon,
         "iconColor" = :iconColor,
         code = :code,
         "updatedAt" = NOW()
       WHERE id = :id`,
      {
        replacements: {
          id: existing[0].id,
          title: section.title,
          description: section.description,
          icon: section.icon,
          iconColor: section.iconColor,
          code: section.code,
        },
        transaction,
      },
    );
    return existing[0].id;
  }

  const [inserted] = await sequelize.query(
    `INSERT INTO dashboard_section (
       dashboard_id, title, description, icon, "iconColor", code, "createdBy", "createdAt", "updatedAt"
     ) VALUES (
       :dashboardId, :title, :description, :icon, :iconColor, :code, :createdBy, NOW(), NOW()
     ) RETURNING id`,
    {
      replacements: {
        dashboardId,
        title: section.title,
        description: section.description,
        icon: section.icon,
        iconColor: section.iconColor,
        code: section.code,
        createdBy: CREATED_BY,
      },
      transaction,
    },
  );
  return inserted[0].id;
}

async function upsertChart(sequelize, sectionId, chart, transaction) {
  const xAxis = chart.x_axis ? JSON.stringify(chart.x_axis) : null;
  const yAxis = chart.y_axis ? JSON.stringify(chart.y_axis) : null;
  const seriesField = chart.series_field ? JSON.stringify(chart.series_field) : null;
  const { sql: filtersSql, replacements: filterReplacements } = buildJsonbArraySql(chart.filters);
  const hasFilters = !!chart.filters?.length;

  const replacements = {
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
    createdBy: CREATED_BY,
    ...filterReplacements,
  };

  const [existing] = await sequelize.query(
    `SELECT id FROM dashboard_section_chart
     WHERE code = :code
        OR (dashboard_section_id = :sectionId AND title = :title)
     LIMIT 1`,
    {
      replacements: { code: chart.code, sectionId, title: chart.title },
      transaction,
    },
  );

  let chartId;
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
      {
        replacements: { id: chartId, ...replacements },
        transaction,
      },
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
      { replacements, transaction },
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

async function refreshKisipBundle(dashboardId) {
  try {
    const { deleteCachedBundle, dashboardBundleKey } = require('../app/utils/dashboardBundleRedis');
    const { refreshDashboardBundle } = require('../app/services/nationalDashboardBundle');
    await deleteCachedBundle(dashboardBundleKey(dashboardId));
    await refreshDashboardBundle(dashboardId);
    console.log(`[086] Cleared cache and refreshed Redis bundle for KISIP dashboard ${dashboardId}`);
  } catch (err) {
    console.warn('[086] Bundle refresh skipped:', err.message);
  }
}

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const dashboardId = await findKisipDashboardId(sequelize, transaction);
      console.log(`[086] Seeding KISIP dashboard id=${dashboardId}`);

      await pruneExtraCards(sequelize, dashboardId, transaction);

      for (const card of CARDS) {
        await upsertInterventionCard(sequelize, dashboardId, card, transaction);
      }

      const sectionIds = {};
      for (const section of SECTIONS) {
        sectionIds[section.code] = await upsertSection(sequelize, dashboardId, section, transaction);
      }

      await pruneExtraCharts(sequelize, dashboardId, transaction);

      for (const chart of CHARTS) {
        const sectionId = sectionIds[chart.sectionCode];
        if (!sectionId) {
          throw new Error(`Missing section for chart ${chart.code}`);
        }
        await upsertChart(sequelize, sectionId, chart, transaction);
      }

      await transaction.commit();
      console.log(`[086] KISIP dashboard: ${CARDS.length} cards, ${CHARTS.length} charts seeded.`);

      await refreshKisipBundle(dashboardId);
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
        { replacements: { title: KISIP_DASHBOARD_TITLE }, transaction },
      );
      if (!dash.length) {
        await transaction.commit();
        return;
      }
      const dashboardId = dash[0].id;
      const allCardCodes = [...SEED_CODES.cards, ...REMOVED_CARD_CODES];

      await sequelize.query(
        `DELETE FROM chart_indicator ci
         USING dashboard_section_chart c
         JOIN dashboard_section s ON s.id = c.dashboard_section_id
         WHERE ci.dashboard_section_chart_id = c.id
           AND s.dashboard_id = :dashboardId
           AND c.code = ANY(:chartCodes)`,
        {
          replacements: { dashboardId, chartCodes: SEED_CODES.charts },
          transaction,
        },
      );

      await sequelize.query(
        `DELETE FROM dashboard_section_chart c
         USING dashboard_section s
         WHERE c.dashboard_section_id = s.id
           AND s.dashboard_id = :dashboardId
           AND c.code = ANY(:chartCodes)`,
        { replacements: { dashboardId, chartCodes: SEED_CODES.charts }, transaction },
      );

      await sequelize.query(
        `DELETE FROM dashboard_section
         WHERE dashboard_id = :dashboardId
           AND code = ANY(:sectionCodes)`,
        { replacements: { dashboardId, sectionCodes: SEED_CODES.sections }, transaction },
      );

      await sequelize.query(
        `DELETE FROM dashboard_card
         WHERE dashboard_id = :dashboardId
           AND code = ANY(:cardCodes)`,
        { replacements: { dashboardId, cardCodes: allCardCodes }, transaction },
      );

      await transaction.commit();
      console.log('[086] Rolled back KISIP seed cards, sections, and charts.');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
