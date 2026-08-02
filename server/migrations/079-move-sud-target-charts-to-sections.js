'use strict';

/**
 * Move Targets vs Achieved charts from the standalone tab into Overview / Housing /
 * Markets / Infrastructure sections, then remove the empty tab.
 */

const SUD_DASHBOARD_TITLE = 'SUD';
const TARGETS_SECTION_CODE = 'sud-seed-section-targets';

const CHART_MOVES = [
  { chartCode: 'sud-tva-overview-bar', sectionCode: 'sud-seed-section-overview', title: null },
  {
    chartCode: 'sud-tva-gauge-housing',
    sectionCode: 'sud-seed-section-housing',
    title: 'Target vs achieved — social housing units',
  },
  {
    chartCode: 'sud-tva-gauge-markets',
    sectionCode: 'sud-seed-section-markets',
    title: 'Target vs achieved — markets',
  },
  {
    chartCode: 'sud-tva-gauge-roads',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — access roads (km)',
  },
  {
    chartCode: 'sud-tva-gauge-floodlights',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — floodlights',
  },
  {
    chartCode: 'sud-tva-gauge-footbridges',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — footbridges',
  },
  {
    chartCode: 'sud-tva-gauge-halls',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — social halls',
  },
  {
    chartCode: 'sud-tva-gauge-health',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — health facilities',
  },
  {
    chartCode: 'sud-tva-gauge-education',
    sectionCode: 'sud-seed-section-infrastructure',
    title: 'Target vs achieved — education blocks',
  },
];

const SECTION_TITLE = {
  'sud-seed-section-overview': 'Overview',
  'sud-seed-section-housing': 'Social Housing',
  'sud-seed-section-markets': 'Markets',
  'sud-seed-section-infrastructure': 'Infrastructure',
};

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
    throw new Error(`Section ${sectionCode} not found on SUD dashboard.`);
  }
  return rows[0].id;
}

async function refreshSudBundle(dashboardId) {
  try {
    const { refreshDashboardBundle } = require('../app/services/nationalDashboardBundle');
    await refreshDashboardBundle(dashboardId);
    console.log(`[079] Refreshed Redis bundle for SUD dashboard ${dashboardId}`);
  } catch (err) {
    console.warn('[079] Bundle refresh skipped:', err.message);
  }
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
        console.warn('[079] SUD dashboard not found; skipping.');
        await transaction.commit();
        return;
      }
      const dashboardId = dash[0].id;

      const sectionCache = {};
      for (const move of CHART_MOVES) {
        if (!sectionCache[move.sectionCode]) {
          sectionCache[move.sectionCode] = await findSectionId(
            sequelize,
            dashboardId,
            move.sectionCode,
            transaction,
          );
        }

        const [updated] = await sequelize.query(
          `UPDATE dashboard_section_chart c SET
             dashboard_section_id = :sectionId,
             title = COALESCE(:title, c.title),
             "updatedAt" = NOW()
           FROM dashboard_section s
           WHERE c.dashboard_section_id = s.id
             AND s.dashboard_id = :dashboardId
             AND c.code = :chartCode
           RETURNING c.id`,
          {
            replacements: {
              sectionId: sectionCache[move.sectionCode],
              dashboardId,
              chartCode: move.chartCode,
              title: move.title,
            },
            transaction,
          },
        );

        if (updated.length) {
          console.log(`[079] Moved ${move.chartCode} → ${SECTION_TITLE[move.sectionCode]}`);
        }
      }

      await sequelize.query(
        `DELETE FROM dashboard_section
         WHERE dashboard_id = :dashboardId
           AND code = :code
           AND NOT EXISTS (
             SELECT 1 FROM dashboard_section_chart c
             WHERE c.dashboard_section_id = dashboard_section.id
           )`,
        {
          replacements: { dashboardId, code: TARGETS_SECTION_CODE },
          transaction,
        },
      );

      await transaction.commit();
      console.log('[079] Target vs achieved charts distributed across programme sections.');

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

      let [targetsSection] = await sequelize.query(
        `SELECT id FROM dashboard_section
         WHERE dashboard_id = :dashboardId AND code = :code LIMIT 1`,
        { replacements: { dashboardId, code: TARGETS_SECTION_CODE }, transaction },
      );

      if (!targetsSection.length) {
        const [inserted] = await sequelize.query(
          `INSERT INTO dashboard_section (
             dashboard_id, title, description, icon, "iconColor", code, "createdBy", "createdAt", "updatedAt"
           ) VALUES (
             :dashboardId, 'Targets vs Achieved',
             'COB FY 2025/2026 targets compared with reported M&E achievements',
             'mdi:target', '#6A1B9A', :code, 1, NOW(), NOW()
           ) RETURNING id`,
          { replacements: { dashboardId, code: TARGETS_SECTION_CODE }, transaction },
        );
        targetsSection = inserted;
      }

      const targetsSectionId = targetsSection[0].id;
      const chartCodes = CHART_MOVES.map((m) => m.chartCode);

      await sequelize.query(
        `UPDATE dashboard_section_chart c SET
           dashboard_section_id = :sectionId,
           "updatedAt" = NOW()
         FROM dashboard_section s
         WHERE c.dashboard_section_id = s.id
           AND s.dashboard_id = :dashboardId
           AND c.code = ANY(:chartCodes)`,
        {
          replacements: { sectionId: targetsSectionId, dashboardId, chartCodes },
          transaction,
        },
      );

      await transaction.commit();
      console.log('[079] Restored standalone Targets vs Achieved section.');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
