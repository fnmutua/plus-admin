'use strict';

const fs = require('fs');
const {
  TRACKER_FILE,
  loadTrackerEntries,
  buildProjectIndexes,
  findMatchingProject,
  getSocialHousingUnitEntries,
} = require('../lib/sudRegionalTrackerImport');

/** Kenya fiscal year (Jul–Jun), aligned with ProjectDetails monitoring tab. */
function getFiscalYear(date = new Date()) {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 6) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
}

const SOCIAL_HOUSING_INDICATOR = {
  indicatorName: 'Social housing units',
  categoryTitle: 'Constructed',
};

/**
 * Populate project-level indicator_target rows for social housing projects
 * using "No. of Units" from tools/SUD Regional Tracker (1).xlsx.
 */
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    if (!fs.existsSync(TRACKER_FILE)) {
      console.warn(`[069] Tracker file not found at ${TRACKER_FILE}; skipping backfill.`);
      return;
    }

    const entries = await loadTrackerEntries();
    const housingEntries = getSocialHousingUnitEntries(entries);
    if (!housingEntries.length) {
      console.warn('[069] No social housing unit rows parsed; skipping backfill.');
      return;
    }

    const [categoryRows] = await sequelize.query(
      `
        SELECT ic.id
        FROM indicator_category ic
        JOIN indicator i ON i.id = ic.indicator_id
        WHERE ic.indicator_name ILIKE $1
          AND ic.category_title ILIKE $2
        ORDER BY ic.id
        LIMIT 1
      `,
      {
        bind: [SOCIAL_HOUSING_INDICATOR.indicatorName, SOCIAL_HOUSING_INDICATOR.categoryTitle],
      },
    );
    const indicatorCategoryId = categoryRows[0]?.id;
    if (!indicatorCategoryId) {
      console.warn('[069] Social housing units indicator category not found; skipping backfill.');
      return;
    }

    const [projects] = await sequelize.query(`
      SELECT id, title, project_code
      FROM project
    `);
    const indexes = buildProjectIndexes(projects);
    const fiscalYear = getFiscalYear();

    const targetsByProject = new Map();
    const stats = {
      trackerHousingRows: housingEntries.length,
      matched: 0,
      unmatched: 0,
      upserted: 0,
      skippedDuplicate: 0,
      skippedNoUnits: 0,
    };

    for (const entry of housingEntries) {
      if (!entry.units) {
        stats.skippedNoUnits += 1;
        continue;
      }

      const project = findMatchingProject(entry, projects, indexes);
      if (!project) {
        stats.unmatched += 1;
        continue;
      }

      stats.matched += 1;
      const projectId = Number(project.id);
      const existing = targetsByProject.get(projectId);
      if (existing) {
        stats.skippedDuplicate += 1;
        if (entry.units > existing.units) {
          targetsByProject.set(projectId, { projectId, units: entry.units, entry });
        }
        continue;
      }

      targetsByProject.set(projectId, { projectId, units: entry.units, entry });
    }

    await sequelize.transaction(async (transaction) => {
      for (const { projectId, units, entry } of targetsByProject.values()) {
        const notes = `Backfilled from SUD Regional Tracker (${entry.sheetName}): ${entry.projectName.slice(0, 200)}`;

        const [, updateMeta] = await sequelize.query(
          `
            UPDATE indicator_target
            SET target_value = $3,
                target_kind = 'absolute',
                notes = $4,
                "updatedAt" = NOW()
            WHERE indicator_category_id = $1
              AND project_id = $2
              AND fiscal_year = $5
              AND scope_type = 'project'
              AND project_location_id IS NULL
          `,
          {
            bind: [indicatorCategoryId, projectId, units, notes, fiscalYear],
            transaction,
          },
        );

        if (!updateMeta?.rowCount) {
          await sequelize.query(
            `
              INSERT INTO indicator_target (
                indicator_category_id,
                fiscal_year,
                scope_type,
                project_id,
                target_value,
                target_kind,
                notes,
                "createdAt",
                "updatedAt"
              )
              VALUES ($1, $2, 'project', $3, $4, 'absolute', $5, NOW(), NOW())
            `,
            {
              bind: [indicatorCategoryId, fiscalYear, projectId, units, notes],
              transaction,
            },
          );
        }
        stats.upserted += 1;
      }
    });

    console.log(
      `[069] Housing unit targets (${fiscalYear}, ic#${indicatorCategoryId}): ` +
        `${stats.trackerHousingRows} tracker rows, ${stats.matched} matched, ` +
        `${stats.unmatched} unmatched, ${stats.skippedDuplicate} duplicate project rows, ` +
        `${stats.upserted} upserted.`,
    );
  },

  down: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    if (!fs.existsSync(TRACKER_FILE)) {
      console.warn(`[069] Tracker file not found; skipping down migration.`);
      return;
    }

    const [categoryRows] = await sequelize.query(
      `
        SELECT ic.id
        FROM indicator_category ic
        WHERE ic.indicator_name ILIKE $1
          AND ic.category_title ILIKE $2
        ORDER BY ic.id
        LIMIT 1
      `,
      {
        bind: [SOCIAL_HOUSING_INDICATOR.indicatorName, SOCIAL_HOUSING_INDICATOR.categoryTitle],
      },
    );
    const indicatorCategoryId = categoryRows[0]?.id;
    if (!indicatorCategoryId) return;

    const entries = getSocialHousingUnitEntries(await loadTrackerEntries());
    const [projects] = await sequelize.query('SELECT id, title, project_code FROM project');
    const indexes = buildProjectIndexes(projects);
    const projectIds = new Set();

    for (const entry of entries) {
      const project = findMatchingProject(entry, projects, indexes);
      if (project) projectIds.add(Number(project.id));
    }

    if (!projectIds.size) return;

    const ids = [...projectIds];
    await sequelize.query(
      `
        DELETE FROM indicator_target
        WHERE indicator_category_id = $1
          AND scope_type = 'project'
          AND project_id = ANY($2::int[])
          AND notes ILIKE 'Backfilled from SUD Regional Tracker%'
      `,
      { bind: [indicatorCategoryId, ids] },
    );
  },
};
