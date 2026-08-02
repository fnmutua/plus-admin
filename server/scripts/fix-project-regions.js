#!/usr/bin/env node
'use strict';

/**
 * Fix projects tagged to the wrong SUD region.
 *
 * Usage:
 *   node server/scripts/fix-project-regions.js --dry-run
 *   node server/scripts/fix-project-regions.js
 *
 * Derives the expected region from the dominant project_location county
 * (same mapping as migration 065 / src/constants/projectRegions.ts).
 */
require('dotenv').config();

const { Sequelize } = require('sequelize');
const { fixMisassignedProjectRegions } = require('../lib/fixProjectRegions');

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
    console.log(dryRun ? 'DRY RUN — no rows will be updated\n' : 'Applying project region fixes…\n');

    const stats = await fixMisassignedProjectRegions(sequelize, { dryRun });

    console.log(`Scanned:              ${stats.scanned}`);
    console.log(`Would update / updated: ${stats.updated}`);
    console.log(`  County realign:       ${stats.realignedFromCounty}`);
    console.log(`  Alias normalize:      ${stats.normalizedAlias}`);
    console.log(`Already correct:      ${stats.skippedAlreadyCorrect}`);
    console.log(`National skipped:     ${stats.skippedNational}`);
    console.log(`No location:          ${stats.skippedNoLocation}`);
    console.log(`Unmapped county:      ${stats.skippedUnmappedCounty}`);
    console.log(`Multi-region warns:   ${stats.multiRegionConflicts}`);

    if (stats.changes.length) {
      console.log('\nChanges:');
      for (const row of stats.changes) {
        console.log(
          `  #${row.projectId} ${row.projectCode || '—'} | "${row.from || ''}" → "${row.to}"` +
            (row.county ? ` [${row.county}, ${row.locationCount} loc]` : '') +
            ` (${row.reason})`,
        );
      }
    } else {
      console.log('\nNo region corrections needed.');
    }
  } catch (error) {
    console.error('Fix failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
