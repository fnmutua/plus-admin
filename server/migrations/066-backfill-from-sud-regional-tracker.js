'use strict';

const fs = require('fs');
const {
  TRACKER_FILE,
  loadTrackerEntries,
  buildProjectIndexes,
  findMatchingProject,
  sameDate,
  regionsEqual,
  countyIdForName,
} = require('../lib/sudRegionalTrackerImport');

/**
 * Align project / location / indicator-report data with the authoritative
 * SUD Regional Tracker workbook (tools/SUD Regional Tracker (1).xlsx).
 */
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    if (!fs.existsSync(TRACKER_FILE)) {
      console.warn(`[066] Tracker file not found at ${TRACKER_FILE}; skipping backfill.`);
      return;
    }

    const entries = await loadTrackerEntries();
    if (!entries.length) {
      console.warn('[066] No tracker rows parsed; skipping backfill.');
      return;
    }

    const [projects] = await sequelize.query(`
      SELECT id, title, project_code, region, cost, start_date, end_date
      FROM project
    `);
    const [counties] = await sequelize.query('SELECT id, name FROM county');
    const [locations] = await sequelize.query(`
      SELECT pl.id, pl.project_id, pl.county_id, pl.physical_progress_pct, c.name AS county_name
      FROM project_location pl
      LEFT JOIN county c ON c.id = pl.county_id
      ORDER BY pl.project_id, pl.id
    `);

    const indexes = buildProjectIndexes(projects);
    const locationsByProject = new Map();
    for (const loc of locations) {
      const pid = Number(loc.project_id);
      if (!locationsByProject.has(pid)) locationsByProject.set(pid, []);
      locationsByProject.get(pid).push(loc);
    }

    const stats = {
      trackerRows: entries.length,
      matched: 0,
      unmatched: 0,
      projectRegion: 0,
      projectCost: 0,
      projectStartDate: 0,
      projectEndDate: 0,
      projectCode: 0,
      locationProgress: 0,
      locationCounty: 0,
      indicatorReports: 0,
      skippedDuplicate: 0,
    };

    const seenProjectIds = new Set();

    await sequelize.transaction(async (transaction) => {
      for (const entry of entries) {
        const project = findMatchingProject(entry, projects, indexes);
        if (!project) {
          stats.unmatched += 1;
          continue;
        }

        if (seenProjectIds.has(project.id)) {
          stats.skippedDuplicate += 1;
          continue;
        }
        seenProjectIds.add(project.id);
        stats.matched += 1;

        if (entry.region && !regionsEqual(project.region, entry.region)) {
          await sequelize.query(
            `
            UPDATE project
            SET region = :region, "updatedAt" = NOW()
            WHERE id = :projectId
            `,
            { replacements: { region: entry.region, projectId: project.id }, transaction },
          );
          stats.projectRegion += 1;
          project.region = entry.region;
        }

        if (entry.cost != null) {
          const currentCost = project.cost == null ? null : Number(project.cost);
          if (currentCost == null || Math.abs(currentCost - entry.cost) > 1) {
            await sequelize.query(
              `
              UPDATE project
              SET cost = :cost, "updatedAt" = NOW()
              WHERE id = :projectId
              `,
              { replacements: { cost: entry.cost, projectId: project.id }, transaction },
            );
            stats.projectCost += 1;
            project.cost = entry.cost;
          }
        }

        if (entry.startDate && !sameDate(project.start_date, entry.startDate)) {
          await sequelize.query(
            `
            UPDATE project
            SET start_date = :startDate, "updatedAt" = NOW()
            WHERE id = :projectId
            `,
            {
              replacements: { startDate: entry.startDate, projectId: project.id },
              transaction,
            },
          );
          stats.projectStartDate += 1;
          project.start_date = entry.startDate;
        }

        if (entry.endDate && !sameDate(project.end_date, entry.endDate)) {
          await sequelize.query(
            `
            UPDATE project
            SET end_date = :endDate, "updatedAt" = NOW()
            WHERE id = :projectId
            `,
            { replacements: { endDate: entry.endDate, projectId: project.id }, transaction },
          );
          stats.projectEndDate += 1;
          project.end_date = entry.endDate;
        }

        if (entry.contractNo && (!project.project_code || !String(project.project_code).trim())) {
          await sequelize.query(
            `
            UPDATE project
            SET project_code = :projectCode, "updatedAt" = NOW()
            WHERE id = :projectId
            `,
            {
              replacements: { projectCode: entry.contractNo, projectId: project.id },
              transaction,
            },
          );
          stats.projectCode += 1;
          project.project_code = entry.contractNo;
        }

        const completionPct = entry.completionPct;
        const projectLocs = locationsByProject.get(Number(project.id)) || [];
        let targetLoc = null;

        if (entry.county) {
          const countyId = countyIdForName(counties, entry.county);
          if (countyId != null) {
            targetLoc =
              projectLocs.find((loc) => Number(loc.county_id) === countyId) || projectLocs[0] || null;
            if (targetLoc && Number(targetLoc.county_id) !== countyId) {
              await sequelize.query(
                `
                UPDATE project_location
                SET county_id = :countyId, "updatedAt" = NOW()
                WHERE id = :locationId
                `,
                {
                  replacements: { countyId, locationId: targetLoc.id },
                  transaction,
                },
              );
              stats.locationCounty += 1;
              targetLoc.county_id = countyId;
            }
          }
        }

        if (!targetLoc && projectLocs.length) {
          targetLoc = projectLocs[0];
        }

        if (targetLoc && completionPct != null) {
          const currentPct =
            targetLoc.physical_progress_pct == null
              ? null
              : Number(targetLoc.physical_progress_pct);
          if (currentPct == null || Math.abs(currentPct - completionPct) > 0.5) {
            await sequelize.query(
              `
              UPDATE project_location
              SET physical_progress_pct = :pct, "updatedAt" = NOW()
              WHERE id = :locationId
              `,
              {
                replacements: {
                  pct: Math.round(completionPct * 100) / 100,
                  locationId: targetLoc.id,
                },
                transaction,
              },
            );
            stats.locationProgress += 1;
          }

          const [reportUpdate] = await sequelize.query(
            `
            UPDATE indicator_category_report r
            SET "cumProgress" = :pct,
                progress = :pct,
                "updatedAt" = NOW()
            FROM indicator_category ic
            WHERE r.indicator_category_id = ic.id
              AND r.project_id = :projectId
              AND COALESCE(LOWER(r.status), '') <> 'rejected'
              AND (
                ic.indicator_name ~* 'completion|physical progress|handover'
                OR ic.category_title ~* 'completion|physical progress|handover'
              )
              AND r.id IN (
                SELECT DISTINCT ON (r2.indicator_category_id) r2.id
                FROM indicator_category_report r2
                JOIN indicator_category ic2 ON ic2.id = r2.indicator_category_id
                WHERE r2.project_id = :projectId
                  AND COALESCE(LOWER(r2.status), '') <> 'rejected'
                  AND (
                    ic2.indicator_name ~* 'completion|physical progress|handover'
                    OR ic2.category_title ~* 'completion|physical progress|handover'
                  )
                ORDER BY r2.indicator_category_id, r2.id DESC
              )
            RETURNING r.id
            `,
            {
              replacements: {
                pct: Math.round(completionPct * 100) / 100,
                projectId: project.id,
              },
              transaction,
            },
          );
          stats.indicatorReports += reportUpdate.length;
        }
      }
    });

    console.log(
      `[066] SUD tracker backfill: ${stats.trackerRows} tracker rows, ${stats.matched} matched, ${stats.unmatched} unmatched, ${stats.skippedDuplicate} duplicate tracker rows skipped`,
    );
    console.log(
      `[066] Updates — region: ${stats.projectRegion}, cost: ${stats.projectCost}, start: ${stats.projectStartDate}, end: ${stats.projectEndDate}, code: ${stats.projectCode}, location progress: ${stats.locationProgress}, location county: ${stats.locationCounty}, indicator reports: ${stats.indicatorReports}`,
    );
  },

  down: async () => {
    // Non-destructive data backfill; no rollback.
  },
};
