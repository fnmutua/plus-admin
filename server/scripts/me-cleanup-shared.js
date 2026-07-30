/**
 * Shared helpers for M&E cleanup exports (projects-clean.xlsx).
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PROJECTS_CLEAN_PATH = path.join(
  process.cwd(),
  'data',
  'exports',
  'projects-clean.xlsx'
);

const DB = {
  host: process.env.VUE_APP_DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT || 5432),
  user: process.env.VUE_APP_USER || 'postgres',
  password: process.env.VUE_APP_PASSWORD || 'Admin@2011',
  database: process.env.VUE_APP_DB || 'kisip',
};

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

const CODE_ALIASES = {
  AC9: 'AC1',
  AC24: 'AC20',
  AC26: 'AC14',
  AC30: 'AC10',
  AC37: 'AC19',
  AC40: 'AC39',
  AC43: 'AC19',
  AC44: 'AC19',
  AC46: 'AC23',
  AC48: 'AC31',
  AC49: 'AC19',
};

function isUuidCode(code) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(code || '')
  );
}

function normalizeActivityCode(code) {
  let current = String(code || '').trim();
  if (!current) return current;

  const seen = new Set();
  while (CODE_ALIASES[current] && !seen.has(current)) {
    seen.add(current);
    current = CODE_ALIASES[current];
  }
  return current;
}

function resolveCanonicalActivityId(activityId, mergeMap = ACTIVITY_MERGES) {
  let currentId = Number(activityId);
  if (!currentId) return null;

  const seen = new Set();
  while (mergeMap[currentId] && !seen.has(currentId)) {
    seen.add(currentId);
    currentId = mergeMap[currentId];
  }
  return currentId;
}

function exportActivityCode(activity, mergeMap = ACTIVITY_MERGES) {
  if (!activity) return '';
  const canonicalId = activity.id
    ? resolveCanonicalActivityId(activity.id, mergeMap)
    : null;
  const code = activity.activity_code || activity.code || '';
  if (code.startsWith('AC-')) return normalizeActivityCode(code);
  if (canonicalId && (isUuidCode(code) || !code.startsWith('AC'))) {
    return normalizeActivityCode(`AC${canonicalId}`);
  }
  return normalizeActivityCode(code);
}

function loadWorkbook(outputPath = PROJECTS_CLEAN_PATH) {
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Workbook not found: ${outputPath}. Run export-projects-cleanup.js first.`);
  }
  return XLSX.readFile(outputPath);
}

function loadCleanProjects(workbook) {
  const sheet = workbook.Sheets.projects;
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet).filter((row) => {
    const keep = String(row.keep || 'Y').trim().toUpperCase();
    return keep !== 'N';
  });
}

function loadMasterActivities(workbook) {
  const sheet = workbook.Sheets.activities;
  if (!sheet) {
    throw new Error('activities sheet missing. Run export-activities-cleanup.js first.');
  }
  return XLSX.utils.sheet_to_json(sheet);
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

function rowsToSheet(rows, headers) {
  const data = [headers, ...rows.map((row) => headers.map((key) => row[key] ?? ''))];
  return XLSX.utils.aoa_to_sheet(data);
}

function removeSheet(workbook, name) {
  const idx = workbook.SheetNames.indexOf(name);
  if (idx >= 0) {
    workbook.SheetNames.splice(idx, 1);
    delete workbook.Sheets[name];
  }
}

function readMetaRows(workbook) {
  const sheet = workbook.Sheets._meta;
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
}

module.exports = {
  PROJECTS_CLEAN_PATH,
  DB,
  ACTIVITY_MERGES,
  CODE_ALIASES,
  isUuidCode,
  normalizeActivityCode,
  resolveCanonicalActivityId,
  exportActivityCode,
  loadWorkbook,
  loadCleanProjects,
  loadMasterActivities,
  loadActivityMergeMap,
  rowsToSheet,
  removeSheet,
  readMetaRows,
};
