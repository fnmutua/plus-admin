/**
 * Shared helpers for M&E cleanup import (projects-clean.xlsx).
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PROJECTS_CLEAN_PATH = path.join(__dirname, 'projects-clean.xlsx');

const DB = {
  host: process.env.VUE_APP_DB_HOST || process.env.DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT || process.env.DB_PORT || 5432),
  user: process.env.VUE_APP_USER || process.env.DB_USER || 'postgres',
  password: process.env.VUE_APP_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.VUE_APP_DB || process.env.DB_NAME || 'kisip',
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
  PROJECTS_CLEAN_PATH,
  DB,
  isUuidCode,
  loadWorkbook,
  loadActivityMergeMap,
};
