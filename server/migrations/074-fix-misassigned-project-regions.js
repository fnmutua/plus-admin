'use strict';

const { fixMisassignedProjectRegions } = require('../lib/fixProjectRegions');

/**
 * Correct project.region when it disagrees with the dominant project_location
 * county (SUD Regional Tracker groupings), or when a legacy alias is stored.
 */
module.exports = {
  up: async (queryInterface) => {
    const stats = await fixMisassignedProjectRegions(queryInterface.sequelize, {
      dryRun: false,
    });

    console.log(
      `[074] Fixed misassigned project regions: ${stats.updated} updated ` +
        `(${stats.realignedFromCounty} county realign, ${stats.normalizedAlias} alias normalize), ` +
        `${stats.skippedAlreadyCorrect} already correct, ${stats.skippedNational} national skipped, ` +
        `${stats.skippedNoLocation} without location, ${stats.skippedUnmappedCounty} unmapped county, ` +
        `${stats.multiRegionConflicts} multi-region location sets`,
    );

    if (stats.changes.length) {
      console.log('[074] Sample changes (up to 25):');
      for (const row of stats.changes.slice(0, 25)) {
        console.log(
          `  #${row.projectId} ${row.projectCode || '—'} | ${row.from || '(empty)'} → ${row.to}` +
            (row.county ? ` (${row.county})` : ''),
        );
      }
      if (stats.changes.length > 25) {
        console.log(`  … and ${stats.changes.length - 25} more`);
      }
    }
  },

  down: async () => {
    // Non-destructive data correction; no rollback.
  },
};
