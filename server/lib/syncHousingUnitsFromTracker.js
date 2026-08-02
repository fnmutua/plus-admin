'use strict';

/**
 * Sync social housing unit targets (indicator_target project scope) and AC-SH
 * activity links from the SUD Regional Tracker + housing-eligible DB projects.
 */

const fs = require('fs');
const {
  resolveTrackerFilePath,
  loadTrackerEntries,
  buildProjectIndexes,
  findMatchingProject,
  getSocialHousingUnitEntries,
} = require('./sudRegionalTrackerImport');
const { getMonitoringFiscalYear } = require('./projectRegions');
const {
  queryRows,
  resolveActivityIdByCode,
  resolveSocialHousingCategoryId,
} = require('./migrationSudHelpers');

const HOUSING_ACTIVITY_CODE = 'AC-SH';

const HOUSING_TITLE_REGEX =
  /social housing|housing units|bedsit|bedroom unit|met site|kamiti|kasarani|kibera|mariguini|sepu|mukuru|dormitor|design, build and finance|affordable housing|lpg fittings|excavation equipment|furnishing of social|hire of excavation/i;

const NON_HOUSING_EXCLUDE_REGEX =
  /floodlight|flood light|high mast|solar powered|water reticulation|borehole|multipurpose hall|njathani|nairobi river|climate workx|relocation of paps/i;

function isHousingEligibleTitle(title) {
  const t = String(title || '');
  if (NON_HOUSING_EXCLUDE_REGEX.test(t) && !HOUSING_TITLE_REGEX.test(t)) return false;
  return HOUSING_TITLE_REGEX.test(t);
}

async function resolveIds(sequelize, transaction) {
  const activityId = await resolveActivityIdByCode(sequelize, HOUSING_ACTIVITY_CODE, transaction);
  const categoryId = await resolveSocialHousingCategoryId(sequelize, transaction);
  return { activityId, categoryId };
}

async function upsertProjectUnitTarget(sequelize, { categoryId, projectId, units, fiscalYear, notes, transaction }) {
  const existing = await queryRows(
    sequelize,
    `
      SELECT id FROM indicator_target
      WHERE indicator_category_id = :categoryId
        AND project_id = :projectId
        AND fiscal_year = :fiscalYear
        AND scope_type = 'project'
        AND project_location_id IS NULL
      LIMIT 1
    `,
    { categoryId, projectId, fiscalYear },
    transaction,
  );

  if (existing.length) {
    await sequelize.query(
      `
        UPDATE indicator_target
        SET target_value = :units,
            target_kind = 'absolute',
            notes = :notes,
            "updatedAt" = NOW()
        WHERE id = :id
      `,
      {
        replacements: { id: existing[0].id, units, notes },
        transaction,
      },
    );
    return;
  }

  await sequelize.query(
    `
      INSERT INTO indicator_target (
        indicator_category_id, fiscal_year, scope_type, project_id,
        target_value, target_kind, notes, "createdAt", "updatedAt"
      )
      VALUES (:categoryId, :fiscalYear, 'project', :projectId, :units, 'absolute', :notes, NOW(), NOW())
    `,
    {
      replacements: { categoryId, fiscalYear, projectId, units, notes },
      transaction,
    },
  );
}

async function ensureAcShActivity(sequelize, projectId, activityId, transaction) {
  await sequelize.query(
    `
      INSERT INTO project_activity (project_id, activity_id, "createdAt", "updatedAt")
      VALUES (:projectId, :activityId, NOW(), NOW())
      ON CONFLICT (project_id, activity_id) DO NOTHING
    `,
    { replacements: { projectId, activityId }, transaction },
  );
}

/**
 * Backfill / refresh project unit targets from Regional Tracker xlsx.
 * Returns Set of project ids that received a unit target.
 */
async function syncHousingUnitTargetsFromTracker(sequelize, transaction) {
  const stats = {
    trackerRows: 0,
    matched: 0,
    unmatched: 0,
    upserted: 0,
    skipped: false,
  };
  const projectIds = new Set();
  const { activityId, categoryId } = await resolveIds(sequelize, transaction);

  if (!activityId) {
    console.warn('[housing-sync] AC-SH activity not found; skipping target sync.');
    stats.skipped = true;
    return { stats, projectIds, activityId, categoryId };
  }

  if (!categoryId) {
    console.warn('[housing-sync] Social housing units indicator category not found; skipping target sync.');
    stats.skipped = true;
    return { stats, projectIds, activityId, categoryId };
  }

  const trackerPath = resolveTrackerFilePath();
  if (!fs.existsSync(trackerPath)) {
    console.warn(`[housing-sync] Tracker not found at ${trackerPath}; skipping target sync.`);
    stats.skipped = true;
    return { stats, projectIds, activityId, categoryId };
  }

  const entries = getSocialHousingUnitEntries(await loadTrackerEntries(trackerPath));
  stats.trackerRows = entries.length;

  const projects = await queryRows(
    sequelize,
    `SELECT id, title, project_code FROM project`,
    {},
    transaction,
  );
  const indexes = buildProjectIndexes(projects);
  const fiscalYear = getMonitoringFiscalYear();
  const targetsByProject = new Map();

  for (const entry of entries) {
    if (!entry.units || entry.units <= 0) continue;

    const project = findMatchingProject(entry, projects, indexes);
    if (!project) {
      stats.unmatched += 1;
      continue;
    }

    stats.matched += 1;
    const projectId = Number(project.id);
    const existing = targetsByProject.get(projectId);
    if (!existing || entry.units > existing.units) {
      targetsByProject.set(projectId, { projectId, units: entry.units, entry });
    }
  }

  for (const { projectId, units, entry } of targetsByProject.values()) {
    const notes = `Project target from SUD Regional Tracker (${entry.sheetName}): ${entry.projectName.slice(0, 200)}`;
    await upsertProjectUnitTarget(sequelize, {
      categoryId,
      projectId,
      units,
      fiscalYear,
      notes,
      transaction,
    });
    await ensureAcShActivity(sequelize, projectId, activityId, transaction);
    projectIds.add(projectId);
    stats.upserted += 1;
  }

  return { stats, projectIds, activityId, categoryId, fiscalYear };
}

/**
 * Link AC-SH on every housing-eligible project; remove unit targets from clear non-housing.
 */
async function syncHousingIndicatorConfig(sequelize, transaction, { activityId, categoryId } = {}) {
  const ids = await resolveIds(sequelize, transaction);
  const actId = activityId || ids.activityId;
  const catId = categoryId || ids.categoryId;
  if (!actId) return { linked: 0, cleaned: 0 };

  const projects = await queryRows(
    sequelize,
    `
      SELECT p.id, p.title, c.programme_id
      FROM project p
      JOIN component c ON c.id = p.component_id
    `,
    {},
    transaction,
  );

  let linked = 0;
  for (const row of projects) {
    const eligible =
      isHousingEligibleTitle(row.title)
      || (Number(row.programme_id) === 16 && !NON_HOUSING_EXCLUDE_REGEX.test(String(row.title || '')));

    if (!eligible) continue;

    const exists = await queryRows(
      sequelize,
      `SELECT 1 FROM project_activity WHERE project_id = :pid AND activity_id = :aid LIMIT 1`,
      { pid: row.id, aid: actId },
      transaction,
    );
    if (!exists.length) {
      await ensureAcShActivity(sequelize, row.id, actId, transaction);
      linked += 1;
    }
  }

  let cleaned = 0;
  if (catId) {
    const cleanedRows = await queryRows(
      sequelize,
      `
        DELETE FROM indicator_target it
        USING project p
        WHERE it.project_id = p.id
          AND it.indicator_category_id = :catId
          AND it.scope_type = 'project'
          AND p.title ~* :excludePattern
          AND NOT (p.title ~* :housingPattern)
        RETURNING it.project_id
      `,
      {
        catId,
        excludePattern: NON_HOUSING_EXCLUDE_REGEX.source,
        housingPattern: HOUSING_TITLE_REGEX.source,
      },
      transaction,
    );
    cleaned = cleanedRows.length;

    const targetRows = await queryRows(
      sequelize,
      `
        SELECT DISTINCT it.project_id
        FROM indicator_target it
        WHERE it.indicator_category_id = :catId AND it.scope_type = 'project'
      `,
      { catId },
      transaction,
    );

    for (const row of targetRows) {
      await ensureAcShActivity(sequelize, row.project_id, actId, transaction);
    }
  }

  return { linked, cleaned };
}

module.exports = {
  HOUSING_ACTIVITY_CODE,
  isHousingEligibleTitle,
  syncHousingUnitTargetsFromTracker,
  syncHousingIndicatorConfig,
};
