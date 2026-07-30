#!/usr/bin/env node
/**
 * Import KISIP II programme end targets from the revised results framework workbook.
 *
 * Usage:
 *   node server/scripts/import-kisip2-indicator-targets.js [path-to-xlsx] [--dry-run]
 *   node server/scripts/import-kisip2-indicator-targets.js --programme-id 18 --fiscal-year end-target
 *
 * Default workbook: tools/KISIP_II_Indicators_and_Revised_Targets.xlsx
 * Default fiscal_year: end-target (project-life revised targets, not annual COB figures)
 * Default programme: KISIP2 (programmex id resolved from DB, fallback 18)
 *
 * Prerequisite for PDO / disaggregation rows:
 *   node server/scripts/configure-kisip2-missing-indicators.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB = {
  host: process.env.VUE_APP_DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT || 5432),
  user: process.env.VUE_APP_USER || 'postgres',
  password: process.env.VUE_APP_PASSWORD || 'Admin@2011',
  database: process.env.VUE_APP_DB || 'kisip',
};

const DEFAULT_WORKBOOK = path.join(
  __dirname,
  '../../tools/KISIP_II_Indicators_and_Revised_Targets.xlsx',
);

const DEFAULT_FISCAL_YEAR = 'end-target';
const DEFAULT_PROGRAMME_ID = 18;
const DELIVERY_UNIT = 'KISIP II';

/**
 * KISIP II indicator text → KeSMIS indicator_category lookup.
 * indicatorName / categoryTitle use SQL ILIKE (include % wildcards where helpful).
 */
const KPI_MATCHERS = [
  {
    test: /Registry Index Maps \(RIMs\)/i,
    indicatorName: 'Registry index maps',
    categoryTitle: 'Amended',
  },
  {
    test: /Titles recognizing women/i,
    indicatorName: 'Titles and leases',
    categoryTitle: 'Prepared',
    targetKind: 'percent',
  },
  {
    test: /New streetlights constructed/i,
    indicatorName: 'Street lights%',
    categoryTitle: 'Constructed',
  },
  {
    test: /Roads improved/i,
    indicatorName: 'Access roads',
    categoryTitle: 'Constructed',
  },
  {
    test: /Stormwater drains constructed/i,
    indicatorName: 'Storm water drainage',
    categoryTitle: 'Constructed',
  },
  {
    test: /new household water connections/i,
    indicatorName: 'Household water connections',
    categoryTitle: 'Installed',
  },
  {
    test: /Footpaths constructed/i,
    indicatorName: 'Footpaths',
    categoryTitle: 'Constructed',
  },
  {
    test: /topographical and engineering maps prepared/i,
    indicatorName: 'Topographical and engineering maps',
    categoryTitle: 'Prepared',
  },
  {
    test: /security floodlights constructed/i,
    indicatorName: 'Floodlights',
    categoryTitle: 'Constructed',
  },
  {
    test: /Land Use Development Plans prepared/i,
    indicatorName: 'LP&LUDPs',
    categoryTitle: 'Prepared',
  },
  {
    test: /Community investment subprojects co-implemented/i,
    indicatorName: 'CDP outputs',
    categoryTitle: 'Implemented',
  },
  {
    test: /Youth engaged through DPW and labour-intensive works/i,
    indicatorName: 'LICW works',
    categoryTitle: 'Implemented',
    notesSuffix: 'KISIP II RF combines DPW + LICW youth; stored on LICW works.',
  },
  {
    test: /Vulnerable people identified for social safety nets/i,
    indicatorName: 'Vulnerable persons',
    categoryTitle: 'Identified',
  },
  {
    test: /Community Development Plans prepared/i,
    indicatorName: 'Community development plans',
    categoryTitle: 'Prepared',
  },
  {
    test: /Informal settlements and slums mapped/i,
    indicatorName: 'Informal settlements',
    categoryTitle: 'Mapped',
  },
  {
    test: /GIS-based housing and urban-development information hubs/i,
    indicatorName: 'GIS and ICT infrastructure hubs',
    categoryTitle: 'Installed',
  },
  {
    test: /County slum upgrading and prevention strategies prepared/i,
    indicatorName: 'County upgrading strategies',
    categoryTitle: 'Prepared',
  },
  {
    test: /Registered grievances resolved within three months/i,
    indicatorName: 'Grievance resolutions',
    categoryTitle: 'Completed',
    targetKind: 'percent',
    notesSuffix: 'Resolution-rate target (% resolved within 3 months).',
  },
  {
    test: /National slum-upgrading strategy updated and adopted/i,
    indicatorName: 'National slum upgrading strategy',
    categoryTitle: 'Updated',
    targetKind: 'boolean',
  },
  {
    test: /People benefiting from enhanced tenure security/i,
    indicatorName: 'Tenure security beneficiaries',
    categoryTitle: 'Benefiting',
    indicatorLevel: 'programme',
  },
  {
    test: /People provided with improved urban living conditions/i,
    indicatorName: 'Urban living conditions beneficiaries',
    categoryTitle: 'Benefiting',
    indicatorLevel: 'programme',
  },
  {
    test: /County slum upgrading and prevention strategies approved and adopted/i,
    indicatorName: 'County upgrading strategies',
    categoryTitle: 'Approved',
    indicatorLevel: 'programme',
  },
  {
    test: /People accessing improved sewerage facilities/i,
    indicatorName: 'Sewerage access beneficiaries',
    categoryTitle: 'Benefiting',
    indicatorLevel: 'programme',
  },
  {
    test: /Settlements with adopted beneficiary lists for titling/i,
    indicatorName: 'Beneficiary lists for titling',
    categoryTitle: 'Adopted',
    indicatorLevel: 'programme',
  },
  {
    test: /Women among youth engaged/i,
    indicatorName: 'Women among youth engaged',
    categoryTitle: 'Achieved',
    indicatorLevel: 'programme',
    targetKind: 'percent',
  },
  {
    test: /women's empowerment/i,
    indicatorName: 'CDP women empowerment contribution',
    categoryTitle: 'Achieved',
    indicatorLevel: 'programme',
    targetKind: 'percent',
  },
  {
    test: /Women among people identified for safety nets/i,
    indicatorName: 'Women among safety net identifications',
    categoryTitle: 'Achieved',
    indicatorLevel: 'programme',
    targetKind: 'percent',
  },
  {
    test: /O&M budgetary provision for KISIP II infrastructure/i,
    indicatorName: 'Counties with O&M budget provision',
    categoryTitle: 'Approved',
    indicatorLevel: 'programme',
  },
  {
    test: /Female Settlement Executive Committee members/i,
    indicatorName: 'Female SEC members share',
    categoryTitle: 'Achieved',
    indicatorLevel: 'programme',
    targetKind: 'percent',
  },
];

function isWorkbookArg(arg) {
  if (!arg || arg.startsWith('--') || arg.startsWith('#')) return false;
  if (/\.xlsx$/i.test(arg)) return true;
  return fs.existsSync(arg);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');

  let programmeId = null;
  let fiscalYear = DEFAULT_FISCAL_YEAR;
  let explicitWorkbook = null;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--programme-id' && args[i + 1]) {
      programmeId = Number(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--fiscal-year' && args[i + 1]) {
      fiscalYear = String(args[i + 1]);
      i += 1;
      continue;
    }
    if (isWorkbookArg(arg)) {
      explicitWorkbook = path.resolve(arg);
    }
  }

  const filePath = explicitWorkbook || DEFAULT_WORKBOOK;
  return { dryRun, filePath, programmeId, fiscalYear };
}

function parseWorkbook(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Workbook not found: ${filePath}\n` +
        `Expected tools/KISIP_II_Indicators_and_Revised_Targets.xlsx — pass a .xlsx path explicitly if needed.`,
    );
  }

  const wb = XLSX.readFile(filePath);
  const sheetName =
    wb.SheetNames.find((n) => /indicators and targets/i.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });

  const headerIdx = rows.findIndex((row) => String(row[0] || '').trim() === 'No.');
  if (headerIdx < 0) {
    throw new Error('Could not find header row (expected "No." in column A)');
  }

  const parsed = [];
  for (let i = headerIdx + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const no = row[0];
    const indicator = String(row[2] || '').trim();
    if (!no || !indicator) continue;

    parsed.push({
      no: Number(no),
      resultArea: String(row[1] || '').trim(),
      indicator,
      rawTarget: row[3],
      unit: String(row[4] || '').trim(),
      source: String(row[5] || '').trim(),
    });
  }

  return { sheetName, parsed };
}

function inferTargetKind(rawTarget, unit, matcherKind) {
  if (matcherKind) return matcherKind;
  const unitLower = String(unit || '').toLowerCase();
  if (unitLower.includes('yes / no') || unitLower === 'yes/no') return 'boolean';
  if (unitLower.includes('percent')) return 'percent';
  return 'absolute';
}

function normalizeTargetValue(rawTarget, targetKind) {
  if (targetKind === 'boolean') {
    const label = String(rawTarget || '').trim().toLowerCase();
    if (label === 'yes' || label === 'true' || label === '1') return 1;
    if (label === 'no' || label === 'false' || label === '0') return 0;
    return null;
  }

  const n = Number(rawTarget);
  if (!Number.isFinite(n)) return null;
  if (targetKind === 'percent' && Math.abs(n) <= 1) return n * 100;
  return n;
}

function matchKpi(indicatorText) {
  const matcher = KPI_MATCHERS.find((m) => m.test.test(indicatorText));
  if (!matcher) return { type: 'unmatched' };
  return { type: 'match', matcher };
}

async function findIndicatorCategory(client, matcher) {
  const namePattern = matcher.indicatorName.includes('%')
    ? matcher.indicatorName
    : matcher.indicatorName;

  const categoryTitles = matcher.categoryTitles || [matcher.categoryTitle].filter(Boolean);
  const levelFilter = matcher.indicatorLevel || null;

  for (const title of categoryTitles.length ? categoryTitles : [null]) {
    const levelClause = levelFilter ? 'AND ic.indicator_level = $3' : '';
    const params = levelFilter ? [namePattern, title, levelFilter] : [namePattern, title];

    const { rows } = title
      ? await client.query(
          `
            SELECT ic.id, ic.indicator_name, ic.category_title, ic.indicator_level
            FROM indicator_category ic
            WHERE ic.indicator_name ILIKE $1
              AND ic.category_title ILIKE $2
              ${levelClause}
            ORDER BY ic.id
            LIMIT 1
          `,
          params,
        )
      : await client.query(
          `
            SELECT ic.id, ic.indicator_name, ic.category_title, ic.indicator_level
            FROM indicator_category ic
            WHERE ic.indicator_name ILIKE $1
              ${levelFilter ? 'AND ic.indicator_level = $2' : ''}
            ORDER BY ic.id
            LIMIT 1
          `,
          levelFilter ? [namePattern, levelFilter] : [namePattern],
        );

    if (rows.length) return rows[0];
  }

  const { rows } = await client.query(
    `
      SELECT ic.id, ic.indicator_name, ic.category_title, ic.indicator_level
      FROM indicator_category ic
      WHERE ic.indicator_name ILIKE $1
      ${levelFilter ? 'AND ic.indicator_level = $2' : ''}
      ORDER BY ic.id
      LIMIT 1
    `,
    levelFilter ? [namePattern, levelFilter] : [namePattern],
  );
  return rows[0] || null;
}

async function resolveProgrammeId(client, explicitId) {
  if (explicitId && Number.isFinite(explicitId)) return Number(explicitId);

  const { rows } = await client.query(
    `
      SELECT id, title, acronym
      FROM programmex
      WHERE acronym ILIKE 'KISIP2'
         OR acronym ILIKE 'KISIP II'
         OR title ILIKE '%KISIP%II%'
      ORDER BY id
      LIMIT 1
    `,
  );
  return rows[0]?.id ?? DEFAULT_PROGRAMME_ID;
}

async function assertDatabaseReady(client) {
  const { rows } = await client.query(
    `
      SELECT
        to_regclass('public.indicator_category') IS NOT NULL AS has_indicator_category,
        to_regclass('public.indicator_target') IS NOT NULL AS has_indicator_target,
        to_regclass('public.programmex') IS NOT NULL AS has_programmex
    `,
  );
  const status = rows[0] || {};
  if (!status.has_indicator_category || !status.has_indicator_target) {
    throw new Error(
      `Connected to "${DB.database}" @ ${DB.host}, but required M&E tables are missing. ` +
        'Run migration 063-create-indicator-target.js and check VUE_APP_DB_* in .env.',
    );
  }
  if (!status.has_programmex) {
    throw new Error('programmex table is missing — cannot resolve KISIP II programme id.');
  }
}

function formatTargetDisplay(targetKind, targetValue) {
  if (targetKind === 'boolean') return targetValue >= 1 ? 'Yes' : 'No';
  if (targetKind === 'percent') return `${targetValue}%`;
  return String(targetValue);
}

async function upsertTarget(client, {
  categoryId,
  fiscalYear,
  programmeId,
  deliveryUnit,
  targetValue,
  targetKind,
  notes,
}) {
  const { rowCount } = await client.query(
    `
      UPDATE indicator_target
      SET target_value = $5,
          target_kind = $6,
          programme_id = $4,
          notes = $7,
          "updatedAt" = NOW()
      WHERE indicator_category_id = $1
        AND fiscal_year = $2
        AND scope_type = 'programme'
        AND COALESCE(programme_id, -1) = COALESCE($4, -1)
        AND COALESCE(delivery_unit, '') = COALESCE($3, '')
    `,
    [categoryId, fiscalYear, deliveryUnit, programmeId, targetValue, targetKind, notes],
  );

  if (rowCount === 0) {
    await client.query(
      `
        INSERT INTO indicator_target (
          indicator_category_id, fiscal_year, scope_type, programme_id, delivery_unit,
          target_value, target_kind, notes, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, 'programme', $3, $4, $5, $6, $7, NOW(), NOW())
      `,
      [categoryId, fiscalYear, programmeId, deliveryUnit, targetValue, targetKind, notes],
    );
  }
}

async function main() {
  const { dryRun, filePath, programmeId: cliProgrammeId, fiscalYear } = parseArgs(process.argv);
  const { sheetName, parsed } = parseWorkbook(filePath);

  console.log(`Workbook: ${filePath}`);
  console.log(`Sheet: ${sheetName}`);
  console.log(`Indicator rows: ${parsed.length}`);
  console.log(`Fiscal year key: ${fiscalYear}`);
  console.log(`Database: ${DB.database} @ ${DB.host}:${DB.port}`);

  const client = new Client(DB);
  await client.connect();
  await assertDatabaseReady(client);

  const programmeId = await resolveProgrammeId(client, cliProgrammeId);
  console.log(`Programme id: ${programmeId}${cliProgrammeId ? '' : ' (auto-resolved)'}`);

  let upserted = 0;
  let skipped = 0;
  let unmatched = 0;

  for (const row of parsed) {
    const match = matchKpi(row.indicator);

    if (match.type === 'unmatched') {
      console.warn(`  skip (#${row.no}, no matcher): ${row.indicator.slice(0, 70)}`);
      unmatched += 1;
      continue;
    }

    const { matcher } = match;
    const category = await findIndicatorCategory(client, matcher);
    if (!category) {
      console.warn(
        `  skip (#${row.no}, no category): ${matcher.indicatorName} / ${matcher.categoryTitle} ← ${row.indicator.slice(0, 50)}`,
      );
      skipped += 1;
      continue;
    }

    const targetKind = inferTargetKind(row.rawTarget, row.unit, matcher.targetKind);
    const targetValue = normalizeTargetValue(row.rawTarget, targetKind);
    if (targetValue == null) {
      console.warn(`  skip (#${row.no}, bad target): ${row.rawTarget} (${row.unit})`);
      skipped += 1;
      continue;
    }

    const notes = [
      `Imported from KISIP II RF (#${row.no}, ${row.resultArea})`,
      row.source,
      matcher.notesSuffix,
      row.indicator.slice(0, 240),
    ]
      .filter(Boolean)
      .join(' — ');

    const display = formatTargetDisplay(targetKind, targetValue);

    if (dryRun) {
      console.log(
        `  would upsert programme#${programmeId} target ${display} (${targetKind}) for ic#${category.id} (${category.indicator_name} ${category.category_title})`,
      );
      upserted += 1;
      continue;
    }

    await upsertTarget(client, {
      categoryId: category.id,
      fiscalYear,
      programmeId,
      deliveryUnit: DELIVERY_UNIT,
      targetValue,
      targetKind,
      notes,
    });

    console.log(
      `  ✓ #${row.no}: ${category.indicator_name} ${category.category_title} → ${display}`,
    );
    upserted += 1;
  }

  await client.end();
  console.log(
    `Done. Upserted ${upserted}, skipped ${skipped}, unmatched ${unmatched}${dryRun ? ' (dry run)' : ''}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
