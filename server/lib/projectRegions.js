'use strict';

/** Canonical SUD regional tracker regions (aligned with src/constants/projectRegions.ts). */
const CANONICAL_REGION_ORDER = [
  'Central',
  'Coast & North Eastern',
  'Eastern',
  'Metropolitan',
  'Nairobi',
  'Nyanza',
  'Rift Valley - North',
  'Rift Valley - South',
  'West Rift Valley',
  'Western',
];

const REGION_ALIAS_TO_CANONICAL = {
  central: 'Central',
  'coast and north eastern': 'Coast & North Eastern',
  'coast and n eastern': 'Coast & North Eastern',
  'coast n eastern': 'Coast & North Eastern',
  eastern: 'Eastern',
  metropolitan: 'Metropolitan',
  'nairobi metro': 'Metropolitan',
  nairobi: 'Nairobi',
  nyanza: 'Nyanza',
  'rift valley north': 'Rift Valley - North',
  'rift valley - north': 'Rift Valley - North',
  'n rift': 'Rift Valley - North',
  'rift valley south': 'Rift Valley - South',
  'rift valley - south': 'Rift Valley - South',
  's rift': 'Rift Valley - South',
  'west rift valley': 'West Rift Valley',
  'west rift': 'West Rift Valley',
  western: 'Western',
};

function normalizeRegionKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[.&]/g, ' ')
    .replace(/[-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveCanonicalRegion(value) {
  const key = normalizeRegionKey(value);
  if (!key) return null;
  if (REGION_ALIAS_TO_CANONICAL[key]) return REGION_ALIAS_TO_CANONICAL[key];
  for (const region of CANONICAL_REGION_ORDER) {
    if (normalizeRegionKey(region) === key) return region;
  }
  return null;
}

function getMonitoringFiscalYear(date = new Date()) {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 6) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
}

function getCalendarQuarter(date = new Date()) {
  const month = date.getMonth();
  if (month <= 2) return 1;
  if (month <= 5) return 2;
  if (month <= 8) return 3;
  return 4;
}

module.exports = {
  CANONICAL_REGION_ORDER,
  resolveCanonicalRegion,
  getMonitoringFiscalYear,
  getCalendarQuarter,
};
