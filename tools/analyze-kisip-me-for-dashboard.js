#!/usr/bin/env node
/**
 * Parse tools/kisip-me-import.csv and summarize contracts/counties/indicators
 * that have PDO or Comp 1.1 values suitable for KISIP dashboard charts.
 *
 * Usage: node tools/analyze-kisip-me-for-dashboard.js [--json]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'kisip-me-import.csv');
const OUT_PATH = path.join(__dirname, 'kisip-dashboard-seed-analysis.json');

const PDO_METRICS = [
  { key: 'roads_km', label: 'Access roads (km)', categoryId: 15, indicatorId: 15 },
  { key: 'drainage_km', label: 'Stormwater drainage (km)', categoryId: 23, indicatorId: 23 },
  { key: 'water_pipeline_km', label: 'Water pipeline (km)', categoryId: 104, indicatorId: 60 },
  { key: 'water_connections', label: 'Household water connections', categoryId: 26, indicatorId: 26 },
  { key: 'highmast_lights', label: 'Floodlights', categoryId: 20, indicatorId: 20 },
  { key: 'streetlights', label: 'Street lights', categoryId: 21, indicatorId: 21 },
  { key: 'vending_platforms', label: 'Vending platforms', categoryId: 19, indicatorId: 19 },
  { key: 'sewer_connections', label: 'Sewer connections (km)', categoryId: 25, indicatorId: 25 },
  { key: 'footpaths_km', label: 'Footpaths (km)', categoryId: 17, indicatorId: 17 },
];

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else if (ch === '"') {
      inQuotes = true;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
}

function num(value) {
  if (value === '' || value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function analyze(rows) {
  const importRows = rows.filter((r) => r.keep === 'Y' && r.matched_project_id);
  const byCounty = new Map();
  const byContract = new Map();
  const indicatorTotals = {};

  for (const m of PDO_METRICS) {
    indicatorTotals[m.key] = { label: m.label, categoryId: m.categoryId, indicatorId: m.indicatorId, planned: 0, achieved: 0, settlements: 0 };
  }
  indicatorTotals.comp11_titles = { label: 'Titles prepared', categoryId: 8, indicatorId: 8, planned: 0, achieved: 0, settlements: 0 };

  for (const row of importRows) {
    const county = row.external_county || 'Unknown';
    const contract = row.effective_contract || row.external_contract || 'Unknown';

    if (!byCounty.has(county)) {
      byCounty.set(county, { county, settlements: 0, contracts: new Set(), indicators: {} });
    }
    const countyRec = byCounty.get(county);
    countyRec.settlements += 1;
    countyRec.contracts.add(contract);

    if (!byContract.has(contract)) {
      byContract.set(contract, { contract, counties: new Set(), settlements: 0, indicators: {} });
    }
    const contractRec = byContract.get(contract);
    contractRec.settlements += 1;
    contractRec.counties.add(county);

    for (const m of PDO_METRICS) {
      const planned = num(row[`${m.key}_planned`]);
      const achieved = num(row[`${m.key}_achieved`]);
      if (!planned && !achieved) continue;

      for (const bucket of [countyRec.indicators, contractRec.indicators, indicatorTotals]) {
        if (!bucket[m.key]) bucket[m.key] = { planned: 0, achieved: 0, settlements: 0 };
        bucket[m.key].planned += planned;
        bucket[m.key].achieved += achieved;
        bucket[m.key].settlements += 1;
      }
    }

    const titles = num(row.comp11_titles_expected);
    if (titles) {
      for (const bucket of [countyRec.indicators, contractRec.indicators, indicatorTotals]) {
        if (!bucket.comp11_titles) bucket.comp11_titles = { planned: 0, achieved: 0, settlements: 0 };
        bucket.comp11_titles.planned += titles;
        bucket.comp11_titles.settlements += 1;
      }
    }
  }

  const contracts = [...byContract.values()]
    .map((c) => ({
      contract: c.contract,
      counties: [...c.counties].sort(),
      settlements: c.settlements,
      indicators: c.indicators,
      score: Object.values(c.indicators).reduce((s, t) => s + t.planned + t.achieved, 0),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const counties = [...byCounty.values()]
    .map((c) => ({
      county: c.county,
      settlements: c.settlements,
      contracts: [...c.contracts].sort(),
      indicators: c.indicators,
      score: Object.values(c.indicators).reduce((s, t) => s + t.planned + t.achieved, 0),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const indicators = Object.entries(indicatorTotals)
    .map(([key, v]) => ({ key, ...v }))
    .filter((i) => i.planned || i.achieved)
    .sort((a, b) => b.planned + b.achieved - (a.planned + a.achieved));

  return {
    generatedAt: new Date().toISOString(),
    source: path.basename(CSV_PATH),
    importRows: importRows.length,
    contractsWithData: contracts.length,
    countiesWithData: counties.length,
    topContracts: contracts.slice(0, 12),
    topCounties: counties.slice(0, 15),
    indicators,
    dashboardSeedHints: {
      programmeId: 18,
      programmeTitle: 'KISIP2',
      dashboardTitle: 'KISIP',
      recommendedSections: ['Overview', 'Infrastructure delivery', 'Water & sanitation', 'Tenure (Comp 1.1)'],
      recommendedCards: indicators.slice(0, 4).map((i) => ({
        title: i.label,
        indicatorCategoryId: i.categoryId,
      })),
    },
  };
}

function main() {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCsv(csv);
  const report = analyze(rows);

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Import rows: ${report.importRows}`);
  console.log(`Contracts with indicator data: ${report.contractsWithData}`);
  console.log(`Counties with data: ${report.countiesWithData}`);
  console.log('\nTop indicators for charts:');
  for (const i of report.indicators) {
    console.log(`  - ${i.label}: planned=${i.planned}, achieved=${i.achieved}, settlements=${i.settlements}`);
  }
  console.log('\nTop contracts:');
  for (const c of report.topContracts.slice(0, 8)) {
    console.log(`  - ${c.contract} (${c.settlements} settlements, ${c.counties.length} counties)`);
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  }
}

main();
