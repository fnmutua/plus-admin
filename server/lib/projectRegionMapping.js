'use strict';

/** Canonical SUD regional tracker regions (matches src/constants/projectRegions.ts). */
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
  'coast and northeastern': 'Coast & North Eastern',
  eastern: 'Eastern',
  metropolitan: 'Metropolitan',
  'nairobi metro': 'Metropolitan',
  nairobi: 'Nairobi',
  nyanza: 'Nyanza',
  'rift valley north': 'Rift Valley - North',
  'rift valley - north': 'Rift Valley - North',
  'n rift': 'Rift Valley - North',
  nrift: 'Rift Valley - North',
  'rift valley south': 'Rift Valley - South',
  'rift valley - south': 'Rift Valley - South',
  's rift': 'Rift Valley - South',
  srift: 'Rift Valley - South',
  'south rift': 'Rift Valley - South',
  'south rift region': 'Rift Valley - South',
  'west rift valley': 'West Rift Valley',
  'west rift': 'West Rift Valley',
  western: 'Western',
};

const COUNTY_TO_REGION = {
  laikipia: 'Central',
  muranga: 'Central',
  nyandarua: 'Central',
  nyeri: 'Central',
  kirinyaga: 'Central',
  garissa: 'Coast & North Eastern',
  kilifi: 'Coast & North Eastern',
  kwale: 'Coast & North Eastern',
  lamu: 'Coast & North Eastern',
  mandera: 'Coast & North Eastern',
  marsabit: 'Coast & North Eastern',
  mombasa: 'Coast & North Eastern',
  'taita taveta': 'Coast & North Eastern',
  'tana river': 'Coast & North Eastern',
  wajir: 'Coast & North Eastern',
  embu: 'Eastern',
  isiolo: 'Eastern',
  kitui: 'Eastern',
  makueni: 'Eastern',
  meru: 'Eastern',
  'tharaka nithi': 'Eastern',
  kajiado: 'Metropolitan',
  machakos: 'Metropolitan',
  kiambu: 'Metropolitan',
  nairobi: 'Nairobi',
  'homa bay': 'Nyanza',
  homabay: 'Nyanza',
  kisumu: 'Nyanza',
  migori: 'Nyanza',
  siaya: 'Nyanza',
  'elgeyo marakwet': 'Rift Valley - North',
  nandi: 'Rift Valley - North',
  'trans nzoia': 'Rift Valley - North',
  'uasin gishu': 'Rift Valley - North',
  turkana: 'Rift Valley - North',
  'west pokot': 'Rift Valley - North',
  samburu: 'Rift Valley - North',
  baringo: 'Rift Valley - South',
  bomet: 'Rift Valley - South',
  kericho: 'Rift Valley - South',
  nakuru: 'Rift Valley - South',
  narok: 'Rift Valley - South',
  kisii: 'West Rift Valley',
  nyamira: 'West Rift Valley',
  bungoma: 'Western',
  busia: 'Western',
  kakamega: 'Western',
  vihiga: 'Western',
};

function normalizeCountyKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRegionKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/&/g, 'and')
    .replace(/['’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveCanonicalRegion(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const key = normalizeRegionKey(raw);
  const alias = REGION_ALIAS_TO_CANONICAL[key];
  if (alias) return alias;

  for (const region of CANONICAL_REGION_ORDER) {
    if (normalizeRegionKey(region) === key) return region;
  }

  return raw;
}

function regionsEqual(a, b) {
  const left = resolveCanonicalRegion(a);
  const right = resolveCanonicalRegion(b);
  if (!left || !right) return false;
  return left === right;
}

function inferRegionFromCountyName(countyName) {
  return COUNTY_TO_REGION[normalizeCountyKey(countyName)] || null;
}

function buildRegionByCountyId(counties) {
  const regionByCountyId = new Map();
  for (const county of counties || []) {
    const region = inferRegionFromCountyName(county.name);
    if (region) regionByCountyId.set(Number(county.id), region);
  }
  return regionByCountyId;
}

module.exports = {
  CANONICAL_REGION_ORDER,
  COUNTY_TO_REGION,
  normalizeCountyKey,
  normalizeRegionKey,
  resolveCanonicalRegion,
  regionsEqual,
  inferRegionFromCountyName,
  buildRegionByCountyId,
};
