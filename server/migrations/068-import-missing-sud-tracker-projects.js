'use strict';

const fs = require('fs');
const {
  TRACKER_FILE,
  loadTrackerEntries,
  buildProjectIndexes,
  findMatchingProject,
  countyIdForName,
  subcountyIdForName,
  inferComponentId,
  inferStatusFromEntry,
  generateUniqueProjectCode,
  generateInternalCode,
  getUnmatchedTrackerEntries,
  normalizeKey,
} = require('../lib/sudRegionalTrackerImport');

/** Kenya Slum Upgrading Programme — same programme used by existing SUD projects. */
const DEFAULT_IMPLEMENTATION_ID = 4;

/**
 * Insert projects that appear in tools/SUD Regional Tracker (1).xlsx but are
 * not yet in KeSMIS (no title / contract match).
 */
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    if (!fs.existsSync(TRACKER_FILE)) {
      console.warn(`[068] Tracker file not found at ${TRACKER_FILE}; skipping import.`);
      return;
    }

    const entries = await loadTrackerEntries();
    if (!entries.length) {
      console.warn('[068] No tracker rows parsed; skipping import.');
      return;
    }

    const [projects] = await sequelize.query(`
      SELECT id, title, project_code, code
      FROM project
    `);
    const [counties] = await sequelize.query('SELECT id, name FROM county');
    const [subcounties] = await sequelize.query('SELECT id, name, county_id FROM subcounty');
    const [existingCodes] = await sequelize.query('SELECT code FROM project');

    const usedProjectCodes = new Set(
      projects
        .map((row) => row.project_code)
        .filter(Boolean)
        .map((value) => normalizeKey(value)),
    );
    const usedInternalCodes = new Set(existingCodes.map((row) => String(row.code)));

    const unmatched = getUnmatchedTrackerEntries(entries, projects);
    const stats = {
      candidates: unmatched.length,
      inserted: 0,
      skippedStillMatched: 0,
      skippedNoCounty: 0,
      locations: 0,
    };

    await sequelize.transaction(async (transaction) => {
      for (const entry of unmatched) {
        const indexes = buildProjectIndexes(projects);
        if (findMatchingProject(entry, projects, indexes)) {
          stats.skippedStillMatched += 1;
          continue;
        }

        const countyId = countyIdForName(counties, entry.county);
        if (countyId == null) {
          stats.skippedNoCounty += 1;
          continue;
        }

        const subcountyId = subcountyIdForName(subcounties, countyId, entry.constituency);
        const projectCode = generateUniqueProjectCode(entry, usedProjectCodes);
        usedProjectCodes.add(normalizeKey(projectCode));

        let internalCode = generateInternalCode(entry);
        while (usedInternalCodes.has(internalCode)) {
          internalCode = generateInternalCode({ ...entry, sheetName: `${entry.sheetName}-${internalCode}` });
        }
        usedInternalCodes.add(internalCode);

        const componentId = inferComponentId(entry);
        const status = inferStatusFromEntry(entry);
        const description = `Imported from SUD Regional Tracker (${entry.sheetName}).`;

        const [inserted] = await sequelize.query(
          `
          INSERT INTO project (
            title,
            project_code,
            component_id,
            implementation_id,
            status,
            description,
            start_date,
            end_date,
            cost,
            "sourceFunding",
            implementation_scope,
            region,
            code,
            "createdAt",
            "updatedAt"
          ) VALUES (
            :title,
            :projectCode,
            :componentId,
            :implementationId,
            :status,
            :description,
            :startDate,
            :endDate,
            :cost,
            '{1}',
            :implementationScope,
            :region,
            :code,
            NOW(),
            NOW()
          )
          RETURNING id
          `,
          {
            replacements: {
              title: entry.projectName.slice(0, 255),
              projectCode,
              componentId,
              implementationId: DEFAULT_IMPLEMENTATION_ID,
              status,
              description,
              startDate: entry.startDate,
              endDate: entry.endDate,
              cost: entry.cost,
              implementationScope: subcountyId ? 'subcounty' : 'county',
              region: entry.region,
              code: internalCode,
            },
            transaction,
          },
        );

        const projectId = inserted[0]?.id;
        if (!projectId) continue;

        projects.push({
          id: projectId,
          title: entry.projectName,
          project_code: projectCode,
          code: internalCode,
        });
        stats.inserted += 1;

        const locationName =
          entry.location ||
          entry.constituency ||
          counties.find((row) => Number(row.id) === countyId)?.name ||
          entry.county;

        await sequelize.query(
          `
          INSERT INTO project_location (
            project_id,
            county_id,
            subcounty_id,
            location_name,
            location_type,
            physical_progress_pct,
            commencement_date,
            revised_completion_date,
            "createdAt",
            "updatedAt"
          ) VALUES (
            :projectId,
            :countyId,
            :subcountyId,
            :locationName,
            :locationType,
            :physicalProgressPct,
            :commencementDate,
            :revisedCompletionDate,
            NOW(),
            NOW()
          )
          `,
          {
            replacements: {
              projectId,
              countyId,
              subcountyId,
              locationName: String(locationName || '').slice(0, 255),
              locationType: subcountyId ? 'subcounty' : 'county',
              physicalProgressPct:
                entry.completionPct != null
                  ? Math.round(entry.completionPct * 100) / 100
                  : null,
              commencementDate: entry.startDate,
              revisedCompletionDate: entry.endDate,
            },
            transaction,
          },
        );
        stats.locations += 1;
      }
    });

    console.log(
      `[068] Tracker import: ${stats.inserted} project(s) created, ${stats.locations} location(s), ${stats.skippedNoCounty} skipped (county not resolved), ${stats.skippedStillMatched} skipped (already matched)`,
    );
  },

  down: async () => {
    // Non-destructive data import; manual cleanup if needed.
  },
};
