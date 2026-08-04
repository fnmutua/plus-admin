#!/usr/bin/env node
/**
 * Extract KISIP M&E data from PDO Tracking Matrix + Comp 1.1 Titles workbook,
 * match to settlements and projects in KeSMIS, and write an import-ready CSV.
 *
 * Usage:
 *   node tools/export-kisip-me-match.js [output.csv]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');
const {
  bootstrapModulePaths,
  loadRepoEnv,
  getDB,
  REPO_ROOT,
} = require('./me-cleanup-import/me-cleanup-shared');
const {
  resolvePdoContracts,
  buildSettlementIndex,
  findMatchingSettlement,
  buildInfraProjectIndex,
  buildProjectsBySettlement,
  buildProjectIndexes,
  findMatchingProject,
  countyIdForName,
  subcountyIdForName,
  normalizeSettlementKey,
} = require('./kisip-me-matching');

bootstrapModulePaths();
loadRepoEnv();
process.chdir(REPO_ROOT);

const PDO_FILE = path.join(REPO_ROOT, 'tools/PDO Tracking Matrix  29-05-2026 NPCT.xlsx');
const TITLES_FILE = path.join(REPO_ROOT, 'tools/Comp 1.1 Approved Plans and Exp TITLES.docx');
const DEFAULT_OUT = path.join(REPO_ROOT, 'tools/kisip-me-import.csv');

const PDO_INDICATORS = [
  ['roads_km', 'Roads (km)', 4, 5, 'Access roads', 'Constructed', 'AC15'],
  ['drainage_km', 'Drainage (km)', 6, 7, 'Storm water drainage', 'Constructed', 'AC23'],
  ['water_pipeline_km', 'Water pipeline (km)', 8, 9, 'Water reticulation pipes', 'Constructed', 'AC42'],
  ['water_connections', 'Water connections', 10, 11, 'Household water connections', 'Installed', 'AC14'],
  ['ablution_blocks', 'Ablution blocks', 12, 13, 'Ablution blocks', 'Constructed', ''],
  ['highmast_lights', 'Highmast lights', 14, 15, 'Floodlights', 'Installed', 'AC20'],
  ['streetlights', 'Streetlights', 16, 17, 'Street lights and power connections', 'Constructed', 'AC21'],
  ['vending_platforms', 'Vending platforms', 18, 19, 'Markets and commercial facilities', 'Constructed', ''],
  ['sewer_connections', 'Sewer connections', 20, 21, 'Sewer lines', 'Installed', 'AC25'],
  ['water_kiosks', 'Water kiosks', 22, 23, 'Water kiosks', 'Installed', ''],
  ['footpaths_km', 'Footpaths (km)', 24, 25, 'Footpaths', 'Constructed', 'AC17'],
];

function num(value) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  return Number.isFinite(n) ? n : '';
}

function parsePdoWorkbook(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`PDO workbook not found: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const rows = [];

  for (const sheetName of wb.SheetNames) {
    if (sheetName === 'SUMMARY') continue;
    const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });
    let county = '';
    let contract = '';
    let financier = '';

    for (let i = 3; i < sheetRows.length; i += 1) {
      const r = sheetRows[i];
      const settlement = String(r[3] || '').trim();
      if (!settlement || /^total$/i.test(settlement)) continue;

      if (r[0]) county = String(r[0]).trim();
      if (r[1]) contract = String(r[1]).trim();
      if (r[2]) financier = String(r[2]).trim();

      const rec = {
        source_type: 'pdo',
        source_file: path.basename(filePath),
        source_sheet: sheetName,
        source_lot: '',
        external_county: county,
        external_subcounty: '',
        external_settlement: settlement,
        external_contract: contract,
        effective_contract: contract,
        external_financier: financier,
        external_cluster: sheetName.replace(/\s+/g, ' ').trim(),
      };

      for (const [key, , plannedCol, achievedCol] of PDO_INDICATORS) {
        rec[`${key}_planned`] = num(r[plannedCol]);
        rec[`${key}_achieved`] = num(r[achievedCol]);
      }
      rows.push(rec);
    }
  }
  return resolvePdoContracts(rows);
}

function parseTitlesDocx(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Titles document not found: ${filePath}`);

  const { execFileSync } = require('child_process');
  const py = `
import zipfile, json, re
from xml.etree import ElementTree as ET
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
path = ${JSON.stringify(filePath)}

def cell_text(tc):
    parts = []
    for t in tc.iter(W + 't'):
        if t.text: parts.append(t.text)
        if t.tail: parts.append(t.tail)
    return ''.join(parts).strip()

with zipfile.ZipFile(path) as z:
    root = ET.fromstring(z.read('word/document.xml'))
tbl = root.find('.//' + W + 'tbl')
rows = [[cell_text(tc) for tc in tr.findall(W + 'tc')] for tr in tbl.findall(W + 'tr')]

def pi(s):
    s = (s or '').replace(',','').strip()
    return int(s) if s.isdigit() else None

def clean_settlement(name):
    name = re.sub(r'([a-z])([A-Z])', r'\\1 \\2', name)
    if 'Miwani/' in name or 'Mgumo' in name:
        for part in ['Mazeras Centre', 'Miwani', 'Mgumo Wa Pasta']:
            pass
    return name.strip()

out = []
current_lot = current_cluster = None
last_county = last_sub = ''
for row in rows[1:]:
    while len(row) < 7: row.append('')
    c0, sub, no, settlement, cluster, titles_s, pop_s = row[:7]
    if c0.startswith('PHASE'):
        current_lot = c0
        continue
    if cluster.startswith('Cluster'): current_cluster = cluster
    t = pi(titles_s)
    if not settlement or not t or settlement == 'Total' or c0 in ('Cluster Total','LOT Total','GRAND TOTAL'):
        continue
    county = c0 or last_county
    sc = sub or last_sub
    if c0: last_county = c0
    if sub: last_sub = sub
    settlement = clean_settlement(settlement)
    if 'Mazeras' in settlement and 'Miwani' in settlement:
        settlement = 'Mazeras Centre'
    out.append({
        'source_lot': current_lot or '',
        'external_county': county,
        'external_subcounty': sc,
        'external_settlement': settlement,
        'external_cluster': current_cluster or cluster or '',
        'comp11_titles_expected': t,
        'comp11_population': pi(pop_s) or '',
    })
print(json.dumps(out))
`;
  const raw = execFileSync('python3', ['-c', py], { encoding: 'utf8' });
  const parsed = JSON.parse(raw.trim());
  return parsed.map((row) => ({
    source_type: 'comp11_titles',
    source_file: path.basename(filePath),
    source_sheet: '',
    source_lot: row.source_lot,
    external_county: row.external_county,
    external_subcounty: row.external_subcounty,
    external_settlement: row.external_settlement,
    external_contract: '',
    effective_contract: '',
    external_financier: '',
    external_cluster: row.external_cluster,
    comp11_titles_expected: row.comp11_titles_expected,
    comp11_population: row.comp11_population,
  }));
}

function findProjectLocation(projectLocations, projectId, settlementId) {
  if (!projectId || !settlementId) return null;
  const hit = projectLocations.find(
    (pl) => Number(pl.project_id) === Number(projectId) && Number(pl.settlement_id) === Number(settlementId),
  );
  return hit ? hit.id : null;
}

function mergeComp11Titles(pdoRows, titlesRows, counties, subcounties, settlementIndex) {
  const titlesBySettlement = new Map();
  for (const row of titlesRows) {
    const countyId = countyIdForName(counties, row.external_county);
    const subcountyId = subcountyIdForName(subcounties, countyId, row.external_subcounty);
    const { settlement } = findMatchingSettlement(
      row.external_settlement,
      countyId,
      subcountyId,
      settlementIndex,
      counties,
    );
    const mergeKey = settlement
      ? `sid:${settlement.id}`
      : `raw:${countyId}|${normalizeSettlementKey(row.external_settlement)}`;
    if (!titlesBySettlement.has(mergeKey)) {
      titlesBySettlement.set(mergeKey, {
        comp11_titles_expected: row.comp11_titles_expected,
        comp11_population: row.comp11_population,
        comp11_lot: row.source_lot,
        comp11_cluster: row.external_cluster,
      });
    }
  }

  for (const row of pdoRows) {
    const key = row.matched_settlement_id
      ? `sid:${row.matched_settlement_id}`
      : `raw:${row.matched_county_id}|${normalizeSettlementKey(row.external_settlement)}`;
    const hit = titlesBySettlement.get(key);
    if (hit) {
      row.comp11_titles_expected = hit.comp11_titles_expected;
      row.comp11_population = hit.comp11_population;
      row.comp11_lot = hit.comp11_lot;
      row.comp11_cluster = hit.comp11_cluster;
      titlesBySettlement.delete(key);
    }
  }
  return titlesBySettlement;
}

async function loadReferenceData(client) {
  const [countiesRes, subcountiesRes, settlementsRes, projectsRes, plRes] = await Promise.all([
    client.query('SELECT id, name FROM county ORDER BY name'),
    client.query('SELECT id, name, county_id FROM subcounty ORDER BY name'),
    client.query(`
      SELECT s.id, s.name, s.code, s.county_id, s.subcounty_id, c.name AS county_name, sc.name AS subcounty_name
      FROM settlement s
      JOIN county c ON c.id = s.county_id
      LEFT JOIN subcounty sc ON sc.id = s.subcounty_id
      ORDER BY s.name
    `),
    client.query(`
      SELECT p.id, p.title, p.project_code, p.component_id, p.status
      FROM project p
      ORDER BY p.id
    `),
    client.query(`
      SELECT pl.id, pl.project_id, pl.settlement_id, pl.county_id, pl.subcounty_id, pl.location_type
      FROM project_location pl
      WHERE pl.settlement_id IS NOT NULL
    `),
  ]);

  return {
    counties: countiesRes.rows,
    subcounties: subcountiesRes.rows,
    settlements: settlementsRes.rows,
    projects: projectsRes.rows,
    projectLocations: plRes.rows,
  };
}

function enrichRow(row, ctx) {
  const {
    counties,
    subcounties,
    settlementIndex,
    projects,
    projectIndexes,
    projectLocations,
    infraIndex,
    projectsBySettlement,
  } = ctx;

  const countyId = countyIdForName(counties, row.external_county);
  const subcountyId = subcountyIdForName(subcounties, countyId, row.external_subcounty);
  row.matched_county_id = countyId || '';
  row.matched_subcounty_id = subcountyId || '';

  const settMatch = findMatchingSettlement(
    row.external_settlement,
    countyId,
    subcountyId,
    settlementIndex,
    counties,
  );
  row.matched_settlement_id = settMatch.settlement?.id || '';
  row.matched_settlement_name = settMatch.settlement?.name || '';
  row.matched_settlement_code = settMatch.settlement?.code || '';
  row.settlement_match_method = settMatch.method;
  row.settlement_match_score = settMatch.score || '';

  const projMatch = findMatchingProject(
    row,
    projects,
    projectIndexes,
    infraIndex,
    projectsBySettlement,
    row.matched_settlement_id,
  );
  row.matched_project_id = projMatch.project?.id || '';
  row.matched_project_title = projMatch.project?.title || '';
  row.matched_project_code = projMatch.project?.project_code || '';
  row.project_match_method = projMatch.method;
  row.project_match_score = projMatch.score || '';
  row.effective_contract = row.effective_contract || row.external_contract || '';

  row.project_location_id =
    projMatch.projectLocationId ||
    findProjectLocation(projectLocations, row.matched_project_id, row.matched_settlement_id) ||
    '';

  const notes = [];
  if (!row.matched_settlement_id) notes.push('settlement unmatched');
  if (row.source_type === 'pdo' && !row.matched_project_id) notes.push('project unmatched');
  if (row.source_type === 'comp11_titles' && !row.matched_project_id) notes.push('planning project unmatched');
  if (row.effective_contract !== row.external_contract && row.external_contract) {
    notes.push(`contract resolved: ${row.effective_contract}`);
  }
  if (row.matched_settlement_id && row.matched_project_id && !row.project_location_id) {
    notes.push('no project_location link');
  }
  row.match_notes = notes.join('; ');
  row.keep = row.matched_settlement_id || row.matched_project_id ? 'Y' : 'N';
  return row;
}

function toCsvValue(value) {
  if (value == null || value === '') return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows, columns, outPath) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((col) => toCsvValue(row[col])).join(','));
  }
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const outPath = path.resolve(process.argv[2] || DEFAULT_OUT);
  console.log('Parsing source files...');
  const pdoRows = parsePdoWorkbook(PDO_FILE);
  const titlesRows = parseTitlesDocx(TITLES_FILE);
  console.log(`  PDO settlement rows: ${pdoRows.length}`);
  console.log(`  Comp 1.1 title rows: ${titlesRows.length}`);

  const client = new Client(getDB());
  await client.connect();
  console.log('Loading settlements and projects from database...');
  const ref = await loadReferenceData(client);
  await client.end();

  const settlementIndex = buildSettlementIndex(ref.settlements);
  const projectIndexes = buildProjectIndexes(ref.projects);
  const infraIndex = buildInfraProjectIndex(ref.projects);
  const projectsBySettlement = buildProjectsBySettlement(ref.projectLocations, ref.projects);
  const ctx = {
    ...ref,
    settlementIndex,
    projectIndexes,
    infraIndex,
    projectsBySettlement,
  };

  const enrichedPdo = pdoRows.map((row) => enrichRow({ ...row }, ctx));
  const remainingTitles = mergeComp11Titles(
    enrichedPdo,
    titlesRows,
    ref.counties,
    ref.subcounties,
    settlementIndex,
  );

  const comp11Only = titlesRows
    .filter((row) => {
      const countyId = countyIdForName(ref.counties, row.external_county);
      const subcountyId = subcountyIdForName(ref.subcounties, countyId, row.external_subcounty);
      const { settlement } = findMatchingSettlement(
        row.external_settlement,
        countyId,
        subcountyId,
        settlementIndex,
        ref.counties,
      );
      const key = settlement
        ? `sid:${settlement.id}`
        : `raw:${countyId}|${normalizeSettlementKey(row.external_settlement)}`;
      return remainingTitles.has(key);
    })
    .map((row) => {
      const base = {
        ...row,
        comp11_lot: row.source_lot,
        comp11_cluster: row.external_cluster,
      };
      for (const [key] of PDO_INDICATORS) {
        base[`${key}_planned`] = '';
        base[`${key}_achieved`] = '';
      }
      return enrichRow(base, ctx);
    });

  const allRows = [...enrichedPdo, ...comp11Only];

  const indicatorCols = PDO_INDICATORS.flatMap(([key]) => [`${key}_planned`, `${key}_achieved`]);
  const mappingCols = PDO_INDICATORS.flatMap(([key]) => [
    `${key}_indicator_name`,
    `${key}_category_title`,
    `${key}_activity_code`,
  ]);

  for (const row of allRows) {
    for (const [key, , , , indicatorName, categoryTitle, activityCode] of PDO_INDICATORS) {
      row[`${key}_indicator_name`] = indicatorName;
      row[`${key}_category_title`] = categoryTitle;
      row[`${key}_activity_code`] = activityCode;
    }
    if (!row.comp11_titles_expected) row.comp11_titles_expected = '';
    if (!row.comp11_population) row.comp11_population = '';
    if (!row.comp11_lot) row.comp11_lot = '';
    if (!row.comp11_cluster) row.comp11_cluster = '';
  }

  const columns = [
    'source_type',
    'source_file',
    'source_sheet',
    'source_lot',
    'external_county',
    'external_subcounty',
    'external_settlement',
    'external_contract',
    'effective_contract',
    'external_financier',
    'external_cluster',
    'matched_settlement_id',
    'matched_settlement_name',
    'matched_settlement_code',
    'settlement_match_method',
    'settlement_match_score',
    'matched_county_id',
    'matched_subcounty_id',
    'matched_project_id',
    'matched_project_title',
    'matched_project_code',
    'project_match_method',
    'project_match_score',
    'project_location_id',
    'comp11_titles_expected',
    'comp11_population',
    'comp11_lot',
    'comp11_cluster',
    ...indicatorCols,
    ...mappingCols,
    'keep',
    'match_notes',
  ];

  writeCsv(allRows, columns, outPath);

  const settMatched = allRows.filter((r) => r.matched_settlement_id).length;
  const projMatchedPdo = allRows.filter((r) => r.source_type === 'pdo' && r.matched_project_id).length;
  const projMatchedComp = allRows.filter((r) => r.source_type === 'comp11_titles' && r.matched_project_id).length;
  const plMatched = allRows.filter((r) => r.project_location_id).length;
  const pdoCount = allRows.filter((r) => r.source_type === 'pdo').length;
  const compCount = allRows.filter((r) => r.source_type === 'comp11_titles').length;

  console.log(`\nWrote ${allRows.length} rows → ${outPath}`);
  console.log(`  PDO rows: ${pdoCount}`);
  console.log(`  Comp 1.1 rows: ${compCount}`);
  console.log(`  Settlements matched: ${settMatched}/${allRows.length} (${Math.round((settMatched / allRows.length) * 100)}%)`);
  console.log(`  Projects matched (PDO): ${projMatchedPdo}/${pdoCount} (${Math.round((projMatchedPdo / pdoCount) * 100)}%)`);
  console.log(`  Projects matched (Comp 1.1): ${projMatchedComp}/${compCount}`);
  console.log(`  project_location links: ${plMatched}`);
  console.log(`  Unmatched settlements: ${allRows.filter((r) => !r.matched_settlement_id).length}`);
  console.log(`  PDO projects unmatched: ${pdoCount - projMatchedPdo}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
