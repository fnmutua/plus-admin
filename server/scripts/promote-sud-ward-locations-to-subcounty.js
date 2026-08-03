#!/usr/bin/env node
'use strict';

/**
 * Promote ward-level SUD project locations to subcounty (constituency) level.
 *
 * Usage:
 *   node server/scripts/promote-sud-ward-locations-to-subcounty.js --dry-run
 *   node server/scripts/promote-sud-ward-locations-to-subcounty.js
 */
require('dotenv').config();

const { Sequelize } = require('sequelize');
const { promoteSudWardLocationsToSubcounty } = require('../lib/promoteSudWardLocationsToSubcounty');

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const sequelize = new Sequelize(
    process.env.VUE_APP_DB,
    process.env.VUE_APP_USER,
    process.env.VUE_APP_PASSWORD,
    {
      host: process.env.VUE_APP_DB_HOST,
      port: process.env.VUE_APP_DB_PORT,
      dialect: 'postgres',
      logging: false,
    },
  );

  try {
    await sequelize.authenticate();
    console.log(dryRun ? 'DRY RUN — no rows will be updated\n' : 'Promoting SUD ward locations to subcounty…\n');

    const stats = await promoteSudWardLocationsToSubcounty(sequelize, { dryRun });

    console.log(`Candidates:           ${stats.candidates}`);
    console.log(`Would update / updated: ${stats.locationsUpdated}`);
    console.log(`Project scope → subcounty: ${stats.projectsScopeUpdated}`);
    console.log(`Skipped (no subcounty): ${stats.skippedNoSubcounty}`);
    console.log(`Duplicate conflicts:  ${stats.duplicateConflicts}`);

    const actionable = stats.changes.filter((c) => c.action !== 'skipped');
    if (actionable.length) {
      console.log('\nChanges:');
      for (const row of actionable) {
        console.log(
          `  loc #${row.locationId} project #${row.projectId} ${row.projectCode || '—'}` +
            ` | ward ${row.from?.ward_id} → subcounty ${row.subcountyName || row.to?.subcounty_id}` +
            (row.from?.county_id !== row.to?.county_id ? ` (county ${row.from?.county_id || '∅'} → ${row.to?.county_id || '∅'})` : ''),
        );
      }
    } else {
      console.log('\nNo ward-level SUD locations need promotion.');
    }

    const skipped = stats.changes.filter((c) => c.action === 'skipped');
    if (skipped.length) {
      console.log('\nSkipped:');
      for (const row of skipped) {
        console.log(`  loc #${row.locationId} project #${row.projectId}: ${row.reason}`);
      }
    }
  } catch (error) {
    console.error('Promotion failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
