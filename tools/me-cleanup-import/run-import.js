#!/usr/bin/env node
/**
 * Run M&E cleanup import (reads DB settings from repo root .env).
 *
 * Usage:
 *   node tools/me-cleanup-import/run-import.js              # dry-run
 *   node tools/me-cleanup-import/run-import.js --apply      # commit
 *   ./tools/me-cleanup-import/run-import.js --apply
 */

const fs = require('fs');
const path = require('path');

const {
  REPO_ROOT,
  PROJECTS_CLEAN_PATH,
  bootstrapModulePaths,
  loadRepoEnv,
} = require('./me-cleanup-shared');

bootstrapModulePaths();

function preflight() {
  if (!fs.existsSync(path.join(REPO_ROOT, 'node_modules/pg'))) {
    console.error(`Missing dependencies. Run 'npm install' in ${REPO_ROOT} first.`);
    process.exit(1);
  }

  if (!fs.existsSync(PROJECTS_CLEAN_PATH)) {
    console.error(`Workbook not found: ${PROJECTS_CLEAN_PATH}`);
    process.exit(1);
  }
}

preflight();

const envPath = loadRepoEnv();
process.chdir(REPO_ROOT);

const { main } = require('./import-me-cleanup');

main(envPath).catch((err) => {
  console.error('Import failed:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
