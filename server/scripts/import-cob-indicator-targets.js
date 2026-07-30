#!/usr/bin/env node
/**
 * Import programme-level annual targets from the SUD COB performance workbook.
 *
 * Usage:
 *   node server/scripts/import-cob-indicator-targets.js [path-to-xlsx] [--dry-run]
 *
 * Default workbook: tools/SUD COB REPORT Q4 FY 2025 2026.xlsx
 * Fiscal year inferred from report title (FY 2025/26 → 2025/2026).
 */

'use strict';

const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Same connection vars as the other M&E cleanup scripts (db.config.js / .env).
const DB = {
  host: process.env.VUE_APP_DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT || 5432),
  user: process.env.VUE_APP_USER || 'postgres',
  password: process.env.VUE_APP_PASSWORD || 'Admin@2011',
  database: process.env.VUE_APP_DB || 'kisip',
};

const DEFAULT_WORKBOOK = path.join(
  __dirname,
  '../../tools/SUD COB REPORT Q4 FY 2025 2026.xlsx',
);

// COB KPI text → master indicator name + category action (M&E cleanup conventions).
const KPI_MATCHERS = [
  {
    test: /social housing units/i,
    indicatorName: 'Social housing units',
    categoryTitle: 'Constructed',
    targetKind: 'percent',
    portfolioDenominator: 80909,
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /floodlights installed/i,
    indicatorName: 'Floodlights',
    categoryTitle: 'Installed',
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /markets constructed/i,
    indicatorName: 'Markets and commercial facilities',
    categoryTitle: 'Constructed',
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /classrooms constructed/i,
    indicatorName: 'Education facility blocks',
    categoryTitle: 'Constructed',
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /multipurpose halls/i,
    indicatorName: 'Education facility blocks',
    categoryTitle: 'Constructed',
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /domitor/i,
    indicatorName: 'Education facility blocks',
    categoryTitle: 'Constructed',
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /access roads constructed/i,
    indicatorName: 'Access roads',
    categoryTitle: 'Constructed',
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /social halls constructed/i,
    indicatorName: 'Social halls',
    categoryTitle: 'Constructed',
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /health centres constructed/i,
    indicatorName: 'Health facilities',
    categoryTitle: 'Constructed',
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /footbridges constructed/i,
    indicatorName: 'Bridges and footbridges',
    categoryTitle: 'Constructed',
    deliveryUnit: 'Slum Upgrading department',
  },
  {
    test: /Local Physical Development/i,
    indicatorName: 'LP&LUDPs',
    categoryTitle: 'Prepared',
    deliveryUnit: 'KISIP',
  },
  {
    test: /access road constructed/i,
    indicatorName: 'Access roads',
    categoryTitle: 'Constructed',
    deliveryUnit: 'KISIP',
  },
  {
    test: /youth engaged in Labour Intensive/i,
    indicatorName: 'LICW works',
    categoryTitle: 'Implemented',
    deliveryUnit: 'KISIP',
  },
];

function parseWorkbook(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  let fiscalYear = '2025/2026';
  for (const row of rows.slice(0, 8)) {
    const text = row.filter(Boolean).join(' ');
    const m = text.match(/FY\s*(\d{4})\s*\/\s*(\d{2,4})/i);
    if (m) {
      const end = m[2].length === 2 ? `20${m[2]}` : m[2];
      fiscalYear = `${m[1]}/${end}`;
      break;
    }
  }

  let headerIdx = rows.findIndex((row) =>
    row.some((cell) => String(cell || '').trim() === 'Annual Targets'),
  );
  if (headerIdx < 0) throw new Error('Could not find header row with Annual Targets');

  const headers = rows[headerIdx].map((h) => String(h || '').trim());
  const col = (name) => headers.indexOf(name);

  const parsed = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const kpi = row[col('Key Performance Indicators')];
    if (!kpi || String(kpi).includes('Key Performance')) continue;

    const target = Number(row[col('Annual Targets')]);
    if (!Number.isFinite(target)) continue;

    parsed.push({
      kpi: String(kpi).trim(),
      deliveryUnit: String(row[col('Delivery Unit')] || '').trim(),
      target,
      actual: row[col('Actual')],
      fiscalYear,
    });
  }

  return { fiscalYear, parsed };
}

function matchKpi(kpiText) {
  return KPI_MATCHERS.find((m) => m.test.test(kpiText));
}

async function findIndicatorCategory(client, matcher) {
  const titles = [matcher.categoryTitle]
  if (matcher.categoryTitle === 'Installed') titles.push('Constructed')
  if (matcher.categoryTitle === 'Constructed') titles.push('Installed')

  for (const title of titles) {
    const { rows } = await client.query(
      `
        SELECT ic.id, ic.indicator_name, ic.category_title
        FROM indicator_category ic
        JOIN indicator i ON i.id = ic.indicator_id
        WHERE ic.indicator_name ILIKE $1
          AND ic.category_title ILIKE $2
        ORDER BY ic.id
        LIMIT 1
      `,
      [matcher.indicatorName, title],
    )
    if (rows.length) return rows[0]
  }

  // Last resort: match indicator name only (first category row).
  const { rows } = await client.query(
    `
      SELECT ic.id, ic.indicator_name, ic.category_title
      FROM indicator_category ic
      JOIN indicator i ON i.id = ic.indicator_id
      WHERE ic.indicator_name ILIKE $1
      ORDER BY ic.id
      LIMIT 1
    `,
    [matcher.indicatorName],
  )
  return rows[0] || null
}

async function assertDatabaseReady(client) {
  const { rows } = await client.query(
    `
      SELECT
        to_regclass('public.indicator_category') IS NOT NULL AS has_indicator_category,
        to_regclass('public.indicator_target') IS NOT NULL AS has_indicator_target
    `,
  )
  const status = rows[0] || {}
  if (!status.has_indicator_category) {
    throw new Error(
      `Connected to "${DB.database}" @ ${DB.host}, but indicator_category is missing. ` +
        'Check VUE_APP_DB_* in .env — this script must use the same database as the app.',
    )
  }
  if (!status.has_indicator_target) {
    throw new Error(
      'indicator_target table is missing. Run migration 063-create-indicator-target.js first.',
    )
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filePath = args.find((a) => !a.startsWith('--')) || DEFAULT_WORKBOOK;

  const { fiscalYear, parsed } = parseWorkbook(filePath);
  console.log(`Workbook: ${filePath}`);
  console.log(`Fiscal year: ${fiscalYear}`);
  console.log(`KPI rows: ${parsed.length}`);
  console.log(`Database: ${DB.database} @ ${DB.host}:${DB.port}`);

  const client = new Client(DB);
  await client.connect();
  await assertDatabaseReady(client);

  let upserted = 0;
  let skipped = 0;

  for (const row of parsed) {
    const matcher = matchKpi(row.kpi);
    if (!matcher) {
      console.warn(`  skip (no matcher): ${row.kpi.slice(0, 70)}`);
      skipped += 1;
      continue;
    }

    const category = await findIndicatorCategory(client, matcher);
    if (!category) {
      console.warn(
        `  skip (no category): ${matcher.indicatorName} / ${matcher.categoryTitle} ← ${row.kpi.slice(0, 50)}`,
      );
      skipped += 1;
      continue;
    }

    const deliveryUnit = row.deliveryUnit || matcher.deliveryUnit || null;
    const targetKind = matcher.targetKind || 'absolute';
    const portfolioDenominator = matcher.portfolioDenominator ?? null;
    const notes = `Imported from COB: ${row.kpi.slice(0, 240)}`;

    if (dryRun) {
      console.log(
        `  would upsert programme target ${targetKind}=${row.target} for ic#${category.id} (${category.indicator_name} ${category.category_title}) [${deliveryUnit}]`,
      );
      upserted += 1;
      continue;
    }

    const { rowCount } = await client.query(
      `
        UPDATE indicator_target
        SET target_value = $4,
            target_kind = $5,
            portfolio_denominator = $6,
            notes = $7,
            "updatedAt" = NOW()
        WHERE indicator_category_id = $1
          AND fiscal_year = $2
          AND scope_type = 'programme'
          AND COALESCE(delivery_unit, '') = COALESCE($3, '')
      `,
      [
        category.id,
        fiscalYear,
        deliveryUnit,
        row.target,
        targetKind,
        portfolioDenominator,
        notes,
      ],
    );

    if (rowCount === 0) {
      await client.query(
        `
          INSERT INTO indicator_target (
            indicator_category_id, fiscal_year, scope_type, delivery_unit,
            target_value, target_kind, portfolio_denominator, notes,
            "createdAt", "updatedAt"
          )
          VALUES ($1, $2, 'programme', $3, $4, $5, $6, $7, NOW(), NOW())
        `,
        [
          category.id,
          fiscalYear,
          deliveryUnit,
          row.target,
          targetKind,
          portfolioDenominator,
          notes,
        ],
      );
    }

    console.log(
      `  ✓ ${deliveryUnit}: ${category.indicator_name} ${category.category_title} → ${row.target}${targetKind === 'percent' ? '%' : ''}`,
    );
    upserted += 1;
  }

  await client.end();
  console.log(`Done. Upserted ${upserted}, skipped ${skipped}${dryRun ? ' (dry run)' : ''}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
