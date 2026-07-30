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

function isCanonicalActivityCode(code) {
  return /^(AC\d+|AC-[A-Z0-9-]+)$/i.test(String(code || '').trim());
}

function normalizeActivityCodeForImport(code, id) {
  const trimmed = String(code || '').trim();
  if (isCanonicalActivityCode(trimmed)) return trimmed;
  if (id) return `AC${id}`;
  return trimmed;
}

/** Drop parenthetical acronyms/clarifiers from activity titles — keep those in shortTitle. */
function cleanActivityTitle(title) {
  return String(title || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drop parenthetical acronyms and normalise legacy indicator names to noun phrases. */
function cleanIndicatorName(name) {
  let cleaned = cleanActivityTitle(name)
    .replace(/^Number of /i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const fixes = {
    'Vulnerable persons identified': 'Vulnerable persons',
    'CDPs implemented': 'CDP outputs',
    'Land parcels acquired': 'Land parcels',
    'Furnished housing units': 'Housing unit furnishings',
    'Registry index maps (RIMs)': 'Registry index maps',
    'Additional Classrooms': 'Education facility blocks',
    'Capacity Development Plans': 'Community development plans',
    'Market Sheds': 'Markets and commercial facilities',
    'Market Stalls': 'Markets and commercial facilities',
    'Storm Water Drains': 'Storm water drainage',
    'Vending platforms': 'Markets and commercial facilities',
  };
  return fixes[cleaned] || fixes[name] || cleaned;
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
  isCanonicalActivityCode,
  normalizeActivityCodeForImport,
  cleanActivityTitle,
  cleanIndicatorName,
  loadWorkbook,
  loadActivityMergeMap,
};
