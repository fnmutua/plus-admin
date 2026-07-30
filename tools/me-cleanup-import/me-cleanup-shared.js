/**
 * Shared helpers for M&E cleanup import (projects-clean.xlsx).
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PROJECTS_CLEAN_PATH = path.join(__dirname, 'projects-clean.xlsx');
const REPO_ROOT = path.resolve(__dirname, '../..');

function loadRepoEnv(repoRoot = REPO_ROOT) {
  const envPath = path.join(repoRoot, '.env');
  if (fs.existsSync(envPath)) {
    const dotenv = require('dotenv');
    const envContent = fs.readFileSync(envPath, 'utf8').replace(/\r/g, '');
    Object.assign(process.env, dotenv.parse(envContent));
  } else {
    console.warn(`Warning: .env not found at ${envPath}`);
  }
  return envPath;
}

function bootstrapModulePaths(repoRoot = REPO_ROOT) {
  const nodeModules = path.join(repoRoot, 'node_modules');
  if (fs.existsSync(nodeModules)) {
    module.paths.unshift(nodeModules);
  }
}

function getDB() {
  return {
    host: process.env.VUE_APP_DB_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.VUE_APP_DB_PORT || process.env.DB_PORT || 5432),
    user: process.env.VUE_APP_USER || process.env.DB_USER || 'postgres',
    password: process.env.VUE_APP_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.VUE_APP_DB || process.env.DB_NAME || 'kisip',
  };
}

const ACTIVITY_MERGES = {
  9: 1,
  24: 20,
  26: 14,
  30: 10,
  37: 19,
  40: 39,
  43: 19,
  44: 19,
  46: 23,
  48: 31,
  49: 19,
};

function isUuidCode(code) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(code || '')
  );
}

function loadWorkbook(outputPath = PROJECTS_CLEAN_PATH) {
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Workbook not found: ${outputPath}`);
  }
  return XLSX.readFile(outputPath);
}

function loadActivityMergeMap(workbook) {
  const mergeMap = { ...ACTIVITY_MERGES };
  const sheet = workbook.Sheets.activity_merges;
  if (!sheet) return mergeMap;

  for (const row of XLSX.utils.sheet_to_json(sheet)) {
    const duplicateId = Number(row.duplicate_id);
    const targetId = Number(row.merge_into_id);
    if (duplicateId && targetId) mergeMap[duplicateId] = targetId;
  }
  return mergeMap;
}

module.exports = {
  REPO_ROOT,
  PROJECTS_CLEAN_PATH,
  bootstrapModulePaths,
  loadRepoEnv,
  getDB,
  isUuidCode,
  loadWorkbook,
  loadActivityMergeMap,
};
