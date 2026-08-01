'use strict';

const path = require('path');
const readXlsxFile = require('read-excel-file/node');

/** Regional tabs in tools/SUD Regional Tracker (1).xlsx → canonical project.region */
const SHEET_TO_REGION = {
  CENTRAL: 'Central',
  'COAST & N.EASTERN': 'Coast & North Eastern',
  EASTERN: 'Eastern',
  'NAIROBI METRO': 'Metropolitan',
  NAIROBI: 'Nairobi',
  NYANZA: 'Nyanza',
  'N.RIFT': 'Rift Valley - North',
  'S.RIFT': 'Rift Valley - South',
  'WEST RIFT': 'West Rift Valley',
  WESTERN: 'Western',
};

const TRACKER_FILE = path.join(__dirname, '..', '..', 'tools', 'SUD Regional Tracker (1).xlsx');

const SECTION_LABELS = new Set(['SOCIAL HOUSING', 'MARKETS', 'SOCIAL INFRASTRUCTURE']);

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeCountyKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitleKey(title) {
  return normalizeKey(title)
    .replace(/\b(proposed|construction of|the|and associated social infrastructure)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(text) {
  return new Set(
    normalizeKey(text)
      .split(' ')
      .filter((w) => w.length > 2),
  );
}

function titleSimilarity(a, b) {
  const ta = tokenSet(a);
  const tb = tokenSet(b);
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  for (const token of ta) {
    if (tb.has(token)) overlap += 1;
  }
  return overlap / Math.max(ta.size, tb.size);
}

function buildColumnMap(headerRow) {
  const col = { serial: 0 };
  (headerRow || []).forEach((cell, index) => {
    const key = normalizeKey(cell);
    if (!key) return;
    if (key === 's no' || key === 'sno') col.serial = index;
    else if (key.includes('project name')) col.projectName = index;
    else if (key === 'county') col.county = index;
    else if (key === 'constituency') col.constituency = index;
    else if (key.includes('project type')) col.projectType = index;
    else if (key.includes('no of units')) col.units = index;
    else if (key.includes('contract no')) col.contractNo = index;
    else if (key.includes('estimated cost')) col.cost = index;
    else if (key.includes('completion status')) col.completion = index;
    else if (key === 'start date') col.startDate = index;
    else if (key === 'end date' || key === 'revised end date') col.endDate = index;
    else if (key === 'location') col.location = index;
    else if (key === 'remarks') col.remarks = index;
  });
  return col;
}

function isDataRow(row, col) {
  if (!row || col.projectName == null) return false;
  const serial = row[col.serial ?? 0];
  const name = row[col.projectName];
  if (serial == null || name == null) return false;
  if (typeof serial !== 'number' && !/^\d+$/.test(String(serial).trim())) return false;

  const nameText = String(name).trim();
  if (nameText.length < 8) return false;

  const upper = nameText.toUpperCase();
  if (upper.includes('TOTAL FOR') || SECTION_LABELS.has(upper)) return false;
  return true;
}

function parseTrackerDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const text = String(value).trim();
  const longMatch = text.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (longMatch) {
    const parsed = new Date(`${longMatch[2]} ${longMatch[1]}, ${longMatch[3]}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseUnits(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const rounded = Math.round(value);
    return rounded > 0 ? rounded : null;
  }
  const text = String(value).trim();
  if (!/^[\d,.]+$/.test(text.replace(/\s/g, ''))) return null;
  const amount = Math.round(Number(text.replace(/,/g, '')));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseMoney(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  const text = String(value).trim();
  if (!/^[\d,.]+$/.test(text.replace(/\s/g, ''))) return null;
  const amount = Number(text.replace(/,/g, ''));
  return Number.isFinite(amount) ? Math.round(amount) : null;
}

/** Tracker stores completion as ratio (0.11) or percent (11). Returns 0–100. */
function parseCompletionPct(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value <= 1 && value >= 0 ? value * 100 : value;
  }
  const text = String(value).trim();
  if (!/^[\d.]+$/.test(text)) return null;
  const amount = Number(text);
  if (!Number.isFinite(amount)) return null;
  return amount <= 1 && amount >= 0 ? amount * 100 : amount;
}

function rowToEntry(row, col, region, sheetName, section = '') {
  const contractRaw = col.contractNo != null ? row[col.contractNo] : null;
  const contractNo =
    contractRaw == null || contractRaw === '' ? '' : String(contractRaw).trim();

  return {
    sheetName,
    region,
    section,
    projectName: String(row[col.projectName]).trim(),
    projectType:
      col.projectType != null && row[col.projectType] != null
        ? String(row[col.projectType]).trim()
        : '',
    units: col.units != null ? parseUnits(row[col.units]) : null,
    county: col.county != null && row[col.county] != null ? String(row[col.county]).trim() : '',
    constituency:
      col.constituency != null && row[col.constituency] != null
        ? String(row[col.constituency]).trim()
        : '',
    contractNo,
    cost: col.cost != null ? parseMoney(row[col.cost]) : null,
    completionPct: col.completion != null ? parseCompletionPct(row[col.completion]) : null,
    startDate: col.startDate != null ? parseTrackerDate(row[col.startDate]) : null,
    endDate: col.endDate != null ? parseTrackerDate(row[col.endDate]) : null,
    location:
      col.location != null && row[col.location] != null ? String(row[col.location]).trim() : '',
    remarks:
      col.remarks != null && row[col.remarks] != null ? String(row[col.remarks]).trim() : '',
  };
}

async function loadTrackerEntries(trackerPath = TRACKER_FILE) {
  const entries = [];

  for (const [sheetName, region] of Object.entries(SHEET_TO_REGION)) {
    const rows = await readXlsxFile(trackerPath, { sheet: sheetName });
    const headerIndex = rows.findIndex((row) =>
      (row || []).some((cell) => normalizeKey(cell).includes('project name')),
    );
    if (headerIndex < 0) continue;

    const col = buildColumnMap(rows[headerIndex]);
    let currentSection = '';
    for (let i = headerIndex + 1; i < rows.length; i += 1) {
      const row = rows[i];
      const nameCell =
        col.projectName != null && row[col.projectName] != null
          ? String(row[col.projectName]).trim()
          : '';
      if (nameCell && SECTION_LABELS.has(nameCell.toUpperCase())) {
        currentSection = nameCell.toUpperCase();
        continue;
      }
      if (!isDataRow(row, col)) continue;
      entries.push(rowToEntry(row, col, region, sheetName, currentSection));
    }
  }

  return entries;
}

function buildProjectIndexes(projects) {
  const byCode = new Map();
  const byTitle = new Map();

  for (const project of projects) {
    if (project.project_code) {
      byCode.set(normalizeKey(project.project_code), project);
    }
    byTitle.set(normalizeTitleKey(project.title), project);
    byTitle.set(normalizeKey(project.title), project);
  }

  return { byCode, byTitle };
}

function findMatchingProject(entry, projects, indexes) {
  if (entry.contractNo) {
    const byContract = indexes.byCode.get(normalizeKey(entry.contractNo));
    if (byContract) return byContract;
  }

  const exactTitle =
    indexes.byTitle.get(normalizeTitleKey(entry.projectName)) ||
    indexes.byTitle.get(normalizeKey(entry.projectName));
  if (exactTitle) return exactTitle;

  let best = null;
  let bestScore = 0.62;
  for (const project of projects) {
    const score = titleSimilarity(entry.projectName, project.title);
    if (score > bestScore) {
      bestScore = score;
      best = project;
    }
  }
  return best;
}

function sameDate(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
}

function regionsEqual(a, b) {
  return normalizeKey(a) === normalizeKey(b);
}

function countyIdForName(counties, countyName) {
  if (!countyName) return null;
  const key = normalizeCountyKey(countyName);
  if (!key || key.includes('mlpwhud') || key.includes('complete')) return null;

  for (const county of counties) {
    if (normalizeCountyKey(county.name) === key) return Number(county.id);
  }
  for (const county of counties) {
    const countyKey = normalizeCountyKey(county.name);
    if (countyKey.includes(key) || key.includes(countyKey)) return Number(county.id);
  }
  return null;
}

function subcountyIdForName(subcounties, countyId, constituencyName) {
  if (!countyId || !constituencyName) return null;
  const key = normalizeCountyKey(constituencyName);
  if (!key) return null;

  const inCounty = subcounties.filter((row) => Number(row.county_id) === Number(countyId));
  for (const subcounty of inCounty) {
    if (normalizeCountyKey(subcounty.name) === key) return Number(subcounty.id);
  }
  for (const subcounty of inCounty) {
    const subcountyKey = normalizeCountyKey(subcounty.name);
    if (subcountyKey.includes(key) || key.includes(subcountyKey)) return Number(subcounty.id);
  }
  return null;
}

function inferComponentId(entry) {
  const hay = `${entry.projectType || ''} ${entry.projectName}`.toLowerCase();
  if (hay.includes('social housing')) return 30;
  if (hay.includes('market')) return 35;
  return 37;
}

function inferStatusFromEntry(entry) {
  const remarks = normalizeKey(entry.remarks);
  if (remarks.includes('complete')) return 'Completed';
  if (remarks.includes('suspend')) return 'Suspended';
  if (remarks.includes('plan')) return 'Planned';
  return 'Ongoing';
}

function generateUniqueProjectCode(entry, existingCodes) {
  if (entry.contractNo) {
    const code = entry.contractNo.slice(0, 120);
    if (!existingCodes.has(normalizeKey(code))) return code;
  }

  let attempt = 0;
  while (attempt < 20) {
    const hash = normalizeKey(`${entry.projectName}|${entry.sheetName}|${attempt}`)
      .replace(/\s+/g, '-')
      .slice(0, 24);
    const code = `MLPWHUD/SDHUD/SUD/TRK-${hash || attempt}`;
    if (!existingCodes.has(normalizeKey(code))) return code;
    attempt += 1;
  }

  return `MLPWHUD/SDHUD/SUD/TRK-${Date.now()}`;
}

function generateInternalCode(entry) {
  const crypto = require('crypto');
  return crypto
    .createHash('sha1')
    .update(`${entry.contractNo}|${entry.projectName}|${entry.sheetName}`)
    .digest('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 9);
}

function isSocialHousingEntry(entry) {
  if (!entry) return false;
  if (String(entry.section || '').toUpperCase() === 'SOCIAL HOUSING') return true;
  return normalizeKey(entry.projectType).includes('social housing');
}

function getSocialHousingUnitEntries(entries) {
  return (entries || []).filter(
    (entry) => isSocialHousingEntry(entry) && entry.units != null && entry.units > 0,
  );
}

function getUnmatchedTrackerEntries(entries, projects) {
  const indexes = buildProjectIndexes(projects);
  const unmatched = [];
  const seen = new Set();

  for (const entry of entries) {
    if (findMatchingProject(entry, projects, indexes)) continue;

    const dedupeKey = `${normalizeKey(entry.contractNo)}|${normalizeTitleKey(entry.projectName)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    unmatched.push(entry);
  }

  return unmatched;
}

function sanitizeContractNo(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\.+$/, '');
}

function normalizeContractNo(value) {
  return sanitizeContractNo(value).toLowerCase();
}

function isPlaceholderContractNo(value) {
  const normalized = normalizeContractNo(value);
  if (!normalized) return true;
  if (normalized === 'tbd' || normalized === 'n/a' || normalized === 'na') return true;
  if (/\/tbd$/i.test(normalized)) return true;
  if (/\/trk-/i.test(normalized)) return true;
  if (/^kisip\/sud\/\d{4}\/\d{3,}$/i.test(normalized)) return true;
  if (/^mlpwhud\/sdhud\/(sud|ahp|udd)\/[-–—]+$/i.test(normalized)) return true;
  return false;
}

function shouldSyncProjectCode(currentCode, trackerCode) {
  const tracker = sanitizeContractNo(trackerCode);
  if (!tracker) return false;

  const current = sanitizeContractNo(currentCode);
  if (!current) return true;
  if (normalizeContractNo(current) === normalizeContractNo(tracker)) return false;
  if (isPlaceholderContractNo(current)) return true;

  return normalizeContractNo(current) !== normalizeContractNo(tracker);
}

function countyMatchesProject(entry, project) {
  const county = normalizeCountyKey(entry.county);
  if (!county) return true;

  const countyToken = county.replace(/\s*county\s*/g, ' ').trim();
  if (!countyToken) return true;

  const hay = normalizeKey(project.title);
  if (hay.includes(normalizeKey(countyToken))) return true;

  const words = countyToken.split(/\s+/).filter((word) => word.length > 3);
  if (words.length > 1) {
    return words.every((word) => hay.includes(normalizeKey(word)));
  }

  return false;
}

function scoreTrackerProjectMatch(entry, project) {
  let score = 0;
  const dbCode = sanitizeContractNo(project.project_code);
  const entryCode = sanitizeContractNo(entry.contractNo);

  if (dbCode && entryCode && normalizeContractNo(dbCode) === normalizeContractNo(entryCode)) {
    score += 120;
  }
  if (normalizeTitleKey(entry.projectName) === normalizeTitleKey(project.title)) {
    score += 80;
  }

  score += titleSimilarity(entry.projectName, project.title) * 60;

  if (countyMatchesProject(entry, project)) {
    score += 25;
  } else {
    score -= 100;
  }

  return score;
}

function setTrackerContractCandidate(map, project, contractNo, entry, score) {
  const projectId = Number(project.id);
  const existing = map.get(projectId);
  if (!existing || score > existing.score) {
    map.set(projectId, { contractNo, entry, project, score });
  }
}

/**
 * Map project id → authoritative tracker contract number (best county/title match).
 */
function buildTrackerContractByProject(entries, projects) {
  const indexes = buildProjectIndexes(projects);
  const byProject = new Map();
  const MIN_SCORE = 35;

  for (const entry of entries) {
    const contractNo = sanitizeContractNo(entry.contractNo);
    if (!contractNo) continue;

    const project = findMatchingProject(entry, projects, indexes);
    if (!project || !countyMatchesProject(entry, project)) continue;

    const score = scoreTrackerProjectMatch(entry, project);
    if (score < MIN_SCORE) continue;
    setTrackerContractCandidate(byProject, project, contractNo, entry, score);
  }

  return byProject;
}

module.exports = {
  TRACKER_FILE,
  SHEET_TO_REGION,
  normalizeKey,
  normalizeCountyKey,
  normalizeTitleKey,
  parseTrackerDate,
  parseUnits,
  parseMoney,
  parseCompletionPct,
  isSocialHousingEntry,
  getSocialHousingUnitEntries,
  loadTrackerEntries,
  buildProjectIndexes,
  findMatchingProject,
  sameDate,
  regionsEqual,
  countyIdForName,
  subcountyIdForName,
  inferComponentId,
  inferStatusFromEntry,
  generateUniqueProjectCode,
  generateInternalCode,
  getUnmatchedTrackerEntries,
  sanitizeContractNo,
  normalizeContractNo,
  isPlaceholderContractNo,
  shouldSyncProjectCode,
  buildTrackerContractByProject,
};
