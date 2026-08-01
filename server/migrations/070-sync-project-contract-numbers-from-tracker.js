'use strict';

const fs = require('fs');
const {
  TRACKER_FILE,
  loadTrackerEntries,
  buildTrackerContractByProject,
  shouldSyncProjectCode,
  sanitizeContractNo,
} = require('../lib/sudRegionalTrackerImport');

/**
 * Align project.project_code with Contract No. from tools/SUD Regional Tracker (1).xlsx.
 * Updates empty/placeholder codes and replaces mismatched values with the tracker value.
 */
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    if (!fs.existsSync(TRACKER_FILE)) {
      console.warn(`[070] Tracker file not found at ${TRACKER_FILE}; skipping contract sync.`);
      return;
    }

    const entries = await loadTrackerEntries();
    if (!entries.length) {
      console.warn('[070] No tracker rows parsed; skipping contract sync.');
      return;
    }

    const [projects] = await sequelize.query(`
      SELECT id, title, project_code
      FROM project
    `);

    const contractByProject = buildTrackerContractByProject(entries, projects);
    const stats = {
      trackerRowsWithContract: entries.filter((entry) => sanitizeContractNo(entry.contractNo)).length,
      mappedProjects: contractByProject.size,
      updated: 0,
      alreadyAligned: 0,
      skippedNoChange: 0,
    };

    await sequelize.transaction(async (transaction) => {
      for (const [projectId, { contractNo, project }] of contractByProject.entries()) {
        if (!shouldSyncProjectCode(project.project_code, contractNo)) {
          if (sanitizeContractNo(project.project_code)) {
            stats.alreadyAligned += 1;
          } else {
            stats.skippedNoChange += 1;
          }
          continue;
        }

        await sequelize.query(
          `
            UPDATE project
            SET project_code = :projectCode,
                "updatedAt" = NOW()
            WHERE id = :projectId
          `,
          {
            replacements: {
              projectCode: contractNo,
              projectId: Number(projectId),
            },
            transaction,
          },
        );
        stats.updated += 1;
      }
    });

    console.log(
      `[070] Contract sync: ${stats.trackerRowsWithContract} tracker rows with contract, ` +
        `${stats.mappedProjects} projects mapped, ${stats.updated} updated, ` +
        `${stats.alreadyAligned} already aligned.`,
    );
  },

  down: async () => {
    // Non-destructive data sync; no rollback.
  },
};
