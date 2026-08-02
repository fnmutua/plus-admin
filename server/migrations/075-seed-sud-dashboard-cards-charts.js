'use strict';

/**
 * Seed / refresh SUD dashboard (title "SUD") with 4 KPI cards and recommended charts.
 * Idempotent — safe to re-run (matches by stable `code` fields).
 *
 * Run: npx sequelize-cli db:migrate
 * Or:  node server/scripts/run-migration.js 075-seed-sud-dashboard-cards-charts
 */

const SUD_DASHBOARD_TITLE = 'SUD';
const CREATED_BY = 1;

const PROGRAMME = {
  root: 19,
  housing: 16,
  markets: 17,
  infrastructure: 21,
};

const CARDS = [
  {
    code: 'sud-seed-card-total',
    title: 'Total Projects',
    description: 'All SUD project locations across Housing, Markets, and Infrastructure',
    icon: 'eos-icons:project',
    iconColor: '#841010',
    programmeId: PROGRAMME.root,
  },
  {
    code: 'sud-seed-card-housing',
    title: 'SUD Housing',
    description: 'Project locations under the SUD Housing programme',
    icon: 'mdi:home-city',
    iconColor: '#8F1B1B',
    programmeId: PROGRAMME.housing,
  },
  {
    code: 'sud-seed-card-markets',
    title: 'SUD Markets',
    description: 'Project locations under the SUD Markets programme',
    icon: 'mdi:storefront-outline',
    iconColor: '#1565C0',
    programmeId: PROGRAMME.markets,
  },
  {
    code: 'sud-seed-card-infrastructure',
    title: 'SUD Infrastructure',
    description: 'Project locations under the SUD Infrastructure programme',
    icon: 'mdi:road-variant',
    iconColor: '#2E7D32',
    programmeId: PROGRAMME.infrastructure,
  },
];

const SECTIONS = [
  {
    code: 'sud-seed-section-overview',
    title: 'Overview',
    description: 'National SUD portfolio summary',
    icon: 'mdi:view-dashboard-outline',
    iconColor: '#37474F',
  },
  {
    code: 'sud-seed-section-housing',
    title: 'Social Housing',
    description: 'Social housing projects and unit delivery',
    icon: 'mdi:home-group',
    iconColor: '#8F1B1B',
  },
  {
    code: 'sud-seed-section-markets',
    title: 'Markets',
    description: 'Markets and commercial facilities',
    icon: 'mdi:storefront',
    iconColor: '#1565C0',
  },
  {
    code: 'sud-seed-section-infrastructure',
    title: 'Infrastructure',
    description: 'Roads, drainage, lighting, and water infrastructure',
    icon: 'mdi:transmission-tower',
    iconColor: '#2E7D32',
  },
];

/** @type {Array<{ code: string, sectionCode: string, title: string, description: string, category: string, type: number, card_model: string, x_axis?: object, y_axis?: object, filters?: object[], indicatorIds?: number[] }>} */
const CHARTS = [
  {
    code: 'sud-seed-chart-overview-county',
    sectionCode: 'sud-seed-section-overview',
    title: 'SUD projects by county',
    description: 'Count of SUD project locations grouped by county',
    category: 'Status',
    type: 1,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: [{ field: 'programme_id', value: [PROGRAMME.root], operation: 'eq' }],
  },
  {
    code: 'sud-seed-chart-housing-county',
    sectionCode: 'sud-seed-section-housing',
    title: 'Housing projects by county',
    description: 'Housing programme project locations by county',
    category: 'Status',
    type: 1,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: [{ field: 'programme_id', value: [PROGRAMME.housing], operation: 'eq' }],
  },
  {
    code: 'sud-seed-chart-housing-units',
    sectionCode: 'sud-seed-section-housing',
    title: 'Social housing units constructed',
    description: 'Reported social housing units (M&E indicator) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    filters: [{ field: 'indicator_category_id', value: [93], operation: 'eq' }],
  },
  {
    code: 'sud-seed-chart-markets-county',
    sectionCode: 'sud-seed-section-markets',
    title: 'Markets projects by county',
    description: 'Markets programme project locations by county',
    category: 'Status',
    type: 1,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: [{ field: 'programme_id', value: [PROGRAMME.markets], operation: 'eq' }],
  },
  {
    code: 'sud-seed-chart-markets-facilities',
    sectionCode: 'sud-seed-section-markets',
    title: 'Markets & commercial facilities',
    description: 'Constructed markets and commercial facilities (M&E) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [19],
  },
  {
    code: 'sud-seed-chart-infra-county',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Infrastructure projects by county',
    description: 'Infrastructure programme project locations by county',
    category: 'Status',
    type: 1,
    card_model: 'project_location',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', label: 'count', aggregation: 'count' },
    filters: [{ field: 'programme_id', value: [PROGRAMME.infrastructure], operation: 'eq' }],
  },
  {
    code: 'sud-seed-chart-infra-floodlights',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Floodlights constructed',
    description: 'Security floodlights constructed (M&E) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [20],
  },
  {
    code: 'sud-seed-chart-infra-roads',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Access roads constructed (km)',
    description: 'Kilometres of access roads constructed (M&E) by county',
    category: 'Intervention',
    type: 1,
    card_model: 'indicator_category_report',
    indicatorIds: [15],
  },
];

const SEED_CODES = {
  cards: CARDS.map((c) => c.code),
  sections: SECTIONS.map((s) => s.code),
  charts: CHARTS.map((c) => c.code),
};

async function findSudDashboardId(sequelize, transaction) {
  const [rows] = await sequelize.query(
    `SELECT id FROM dashboard WHERE title = :title ORDER BY id LIMIT 1`,
    { replacements: { title: SUD_DASHBOARD_TITLE }, transaction },
  );
  if (!rows.length) {
    throw new Error(`Dashboard "${SUD_DASHBOARD_TITLE}" not found — create it first in Dashboard settings.`);
  }
  return rows[0].id;
}

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

async function upsertCard(sequelize, dashboardId, card, transaction) {
  const filterItems = [
    { field: 'programme_id', value: [card.programmeId], operation: 'eq' },
  ];
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

  if (existing.length) {
    await sequelize.query(
      `UPDATE dashboard_card SET
         title = :title,
         description = :description,
         category = 'Status',
         icon = :icon,
         "iconColor" = :iconColor,
         aggregation = 'count',
         card_model = 'project_location',
         card_model_field = 'id',
         computation = 'absolute',
         filtered = true,
         filters = ${filtersSql},
         code = :code,
         "updatedAt" = NOW()
       WHERE id = :id`,
      {
        replacements: {
          id: existing[0].id,
          title: card.title,
          description: card.description,
          icon: card.icon,
          iconColor: card.iconColor,
          code: card.code,
          ...filterReplacements,
        },
        transaction,
      },
    );
    return existing[0].id;
  }

  const [inserted] = await sequelize.query(
    `INSERT INTO dashboard_card (
       dashboard_id, title, description, category, icon, "iconColor",
       aggregation, card_model, card_model_field, computation, filtered, filters,
       code, "createdBy", "createdAt", "updatedAt"
     ) VALUES (
       :dashboardId, :title, :description, 'Status', :icon, :iconColor,
       'count', 'project_location', 'id', 'absolute', true, ${filtersSql},
       :code, :createdBy, NOW(), NOW()
     ) RETURNING id`,
    {
      replacements: {
        dashboardId,
        title: card.title,
        description: card.description,
        icon: card.icon,
        iconColor: card.iconColor,
        code: card.code,
        createdBy: CREATED_BY,
        ...filterReplacements,
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
  const { sql: filtersSql, replacements: filterReplacements } = buildJsonbArraySql(chart.filters);
  const hasFilters = !!chart.filters?.length;

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
         filtered = :filtered,
         filters = ${filtersSql},
         ignore_empty = true,
         code = :code,
         "updatedAt" = NOW()
       WHERE id = :id`,
      {
        replacements: {
          id: chartId,
          sectionId,
          title: chart.title,
          description: chart.description,
          category: chart.category,
          type: chart.type,
          card_model: chart.card_model,
          x_axis: xAxis,
          y_axis: yAxis,
          filtered: hasFilters,
          code: chart.code,
          ...filterReplacements,
        },
        transaction,
      },
    );
  } else {
    const [inserted] = await sequelize.query(
      `INSERT INTO dashboard_section_chart (
         dashboard_section_id, title, description, category, type, card_model,
         x_axis, y_axis, filtered, filters, ignore_empty, code, "createdBy", "createdAt", "updatedAt"
       ) VALUES (
         :sectionId, :title, :description, :category, :type, :card_model,
         :x_axis::jsonb, :y_axis::jsonb, :filtered, ${filtersSql}, true, :code, :createdBy, NOW(), NOW()
       ) RETURNING id`,
      {
        replacements: {
          sectionId,
          title: chart.title,
          description: chart.description,
          category: chart.category,
          type: chart.type,
          card_model: chart.card_model,
          x_axis: xAxis,
          y_axis: yAxis,
          filtered: hasFilters,
          code: chart.code,
          createdBy: CREATED_BY,
          ...filterReplacements,
        },
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

async function removeLegacyDraftCharts(sequelize, dashboardId, transaction) {
  await sequelize.query(
    `DELETE FROM chart_indicator ci
     USING dashboard_section_chart c
     JOIN dashboard_section s ON s.id = c.dashboard_section_id
     WHERE ci.dashboard_section_chart_id = c.id
       AND s.dashboard_id = :dashboardId
       AND (c.title = 'wewe' OR (c.code IS NULL AND c.title ILIKE '%draft%'))`,
    { replacements: { dashboardId }, transaction },
  );

  await sequelize.query(
    `DELETE FROM dashboard_section_chart c
     USING dashboard_section s
     WHERE c.dashboard_section_id = s.id
       AND s.dashboard_id = :dashboardId
       AND (c.title = 'wewe' OR c.title = 'Number of Units')
       AND (c.code IS NULL OR c.code NOT LIKE 'sud-seed-%')`,
    { replacements: { dashboardId }, transaction },
  );
}

async function refreshSudBundle(dashboardId) {
  try {
    const { refreshDashboardBundle } = require('../app/services/nationalDashboardBundle');
    await refreshDashboardBundle(dashboardId);
    console.log(`[075] Refreshed Redis bundle for SUD dashboard ${dashboardId}`);
  } catch (err) {
    console.warn('[075] Bundle refresh skipped:', err.message);
  }
}

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const dashboardId = await findSudDashboardId(sequelize, transaction);
      console.log(`[075] Seeding SUD dashboard id=${dashboardId}`);

      for (const card of CARDS) {
        await upsertCard(sequelize, dashboardId, card, transaction);
      }

      const sectionIds = {};
      for (const section of SECTIONS) {
        sectionIds[section.code] = await upsertSection(sequelize, dashboardId, section, transaction);
      }

      await removeLegacyDraftCharts(sequelize, dashboardId, transaction);

      for (const chart of CHARTS) {
        const sectionId = sectionIds[chart.sectionCode];
        if (!sectionId) {
          throw new Error(`Missing section for chart ${chart.code}`);
        }
        await upsertChart(sequelize, sectionId, chart, transaction);
      }

      await transaction.commit();
      console.log(`[075] SUD dashboard: ${CARDS.length} cards, ${CHARTS.length} charts seeded.`);

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
           AND code = 'sud-seed-section-overview'`,
        { replacements: { dashboardId }, transaction },
      );

      await sequelize.query(
        `DELETE FROM dashboard_card
         WHERE dashboard_id = :dashboardId
           AND code = ANY(:cardCodes)`,
        { replacements: { dashboardId, cardCodes: SEED_CODES.cards }, transaction },
      );

      await transaction.commit();
      console.log('[075] Rolled back SUD seed cards/charts (Overview section removed if created here).');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
