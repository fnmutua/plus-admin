'use strict';

const { promoteSudWardLocationsToSubcounty } = require('../lib/promoteSudWardLocationsToSubcounty');

/**
 * SUD tracker projects are constituency/subcounty-based. Ward-level locations
 * (location_type = 'ward') are promoted to subcounty granularity so filters
 * and dashboards group them correctly.
 */
module.exports = {
  up: async (queryInterface) => {
    const stats = await promoteSudWardLocationsToSubcounty(queryInterface.sequelize, {
      dryRun: false,
    });

    console.log(
      `[085] SUD ward→subcounty: ${stats.locationsUpdated} location(s) updated, ` +
        `${stats.projectsScopeUpdated} project scope(s) set to subcounty, ` +
        `${stats.skippedNoSubcounty} skipped (no subcounty), ` +
        `${stats.duplicateConflicts} duplicate conflict(s)`,
    );

    if (stats.changes.length) {
      console.log('[085] Sample changes (up to 15):');
      for (const row of stats.changes.filter((c) => c.action !== 'skipped').slice(0, 15)) {
        console.log(
          `  loc #${row.locationId} project #${row.projectId} ${row.projectCode || '—'}` +
            ` → subcounty ${row.subcountyName || row.to?.subcounty_id}` +
            (row.wardName ? ` (was ward ${row.wardName})` : ''),
        );
      }
    }
  },

  down: async () => {
    // Non-destructive data correction; no rollback.
  },
};
