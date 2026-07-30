#!/usr/bin/env node
/**
 * Configure KeSMIS indicators for KISIP II results-framework rows that had no
 * indicator_category match (PDO outcomes, disaggregations, approved/adopted milestones).
 *
 * Usage:
 *   node server/scripts/configure-kisip2-missing-indicators.js [--dry-run]
 *
 * Idempotent: skips indicators/categories that already exist.
 */

'use strict';

const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB = {
  host: process.env.VUE_APP_DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT || 5432),
  user: process.env.VUE_APP_USER || 'postgres',
  password: process.env.VUE_APP_DB_PASSWORD || 'Admin@2011',
  database: process.env.VUE_APP_DB || 'kisip',
};

const INDICATOR_LEVEL = 'programme';
const DEFAULT_FREQUENCY = 4; // Annually — programme end targets
const CREATED_BY = 1;

/** New programme-level indicators (KISIP II RF rows without a prior KeSMIS match). */
const NEW_PROGRAMME_INDICATORS = [
  {
    kisipNo: 1,
    code: 'KISIP2-RF-01',
    name: 'Tenure security beneficiaries',
    type: 'outcome',
    format: 'number',
    unit: 'People',
    categoryTitle: 'Benefiting',
    categoryId: 41,
  },
  {
    kisipNo: 2,
    code: 'KISIP2-RF-02',
    name: 'Urban living conditions beneficiaries',
    type: 'outcome',
    format: 'number',
    unit: 'People',
    categoryTitle: 'Benefiting',
    categoryId: 41,
  },
  {
    kisipNo: 9,
    code: 'KISIP2-RF-09',
    name: 'Sewerage access beneficiaries',
    type: 'outcome',
    format: 'number',
    unit: 'People',
    categoryTitle: 'Benefiting',
    categoryId: 41,
  },
  {
    kisipNo: 12,
    code: 'KISIP2-RF-12',
    name: 'Beneficiary lists for titling',
    type: 'output',
    format: 'number',
    unit: 'No.',
    categoryTitle: 'Adopted',
    categoryId: 8,
  },
  {
    kisipNo: 18,
    code: 'KISIP2-RF-18',
    name: 'Women among youth engaged',
    type: 'outcome',
    format: 'percent',
    unit: '%',
    categoryTitle: 'Achieved',
    categoryId: 41,
  },
  {
    kisipNo: 19,
    code: 'KISIP2-RF-19',
    name: 'CDP women empowerment contribution',
    type: 'outcome',
    format: 'percent',
    unit: '%',
    categoryTitle: 'Achieved',
    categoryId: 41,
  },
  {
    kisipNo: 21,
    code: 'KISIP2-RF-21',
    name: 'Women among safety net identifications',
    type: 'outcome',
    format: 'percent',
    unit: '%',
    categoryTitle: 'Achieved',
    categoryId: 41,
  },
  {
    kisipNo: 26,
    code: 'KISIP2-RF-26',
    name: 'Counties with O&M budget provision',
    type: 'output',
    format: 'number',
    unit: 'No.',
    categoryTitle: 'Approved',
    categoryId: 8,
  },
  {
    kisipNo: 28,
    code: 'KISIP2-RF-28',
    name: 'Female SEC members share',
    type: 'outcome',
    format: 'percent',
    unit: '%',
    categoryTitle: 'Achieved',
    categoryId: 41,
  },
];

/** Extra programme-level category rows on existing master indicators. */
const EXTRA_PROGRAMME_CATEGORIES = [
  {
    kisipNo: 3,
    indicatorId: 31,
    indicatorName: 'County upgrading strategies',
    categoryTitle: 'Approved',
    categoryId: 8,
  },
];

async function findIndicator(client, spec) {
  const { rows } = await client.query(
    `
      SELECT id, name, level, format, unit
      FROM indicator
      WHERE name = $1
        AND level = $2
        AND format = $3
        AND COALESCE(unit, '') = COALESCE($4, '')
      ORDER BY id
      LIMIT 1
    `,
    [spec.name, INDICATOR_LEVEL, spec.format, spec.unit || ''],
  );
  return rows[0] || null;
}

async function findCategory(client, { indicatorId, categoryTitle, indicatorLevel }) {
  const { rows } = await client.query(
    `
      SELECT id, indicator_name, category_title, indicator_level
      FROM indicator_category
      WHERE indicator_id = $1
        AND category_title = $2
        AND indicator_level = $3
      ORDER BY id
      LIMIT 1
    `,
    [indicatorId, categoryTitle, indicatorLevel],
  );
  return rows[0] || null;
}

async function createIndicator(client, spec, dryRun) {
  const existing = await findIndicator(client, spec);
  if (existing) {
    console.log(`  indicator exists: #${existing.id} ${existing.name} (${existing.level})`);
    return existing.id;
  }

  if (dryRun) {
    console.log(`  would create indicator: ${spec.name} [${spec.code}]`);
    return null;
  }

  const { rows } = await client.query(
    `
      INSERT INTO indicator (name, type, format, unit, level, code, "createdBy", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `,
    [spec.name, spec.type, spec.format, spec.unit, INDICATOR_LEVEL, spec.code, CREATED_BY],
  );
  const id = rows[0].id;
  console.log(`  ✓ created indicator #${id}: ${spec.name}`);
  return id;
}

async function createCategory(client, spec, dryRun) {
  const existing = await findCategory(client, spec);
  if (existing) {
    console.log(
      `  category exists: ic#${existing.id} ${existing.indicator_name} ${existing.category_title} (${existing.indicator_level})`,
    );
    return existing.id;
  }

  if (dryRun) {
    console.log(
      `  would create category: ${spec.indicatorName} / ${spec.categoryTitle} (${spec.indicatorLevel})`,
    );
    return null;
  }

  const { rows } = await client.query(
    `
      INSERT INTO indicator_category (
        indicator_level, indicator_id, indicator_name, category_id, activity_id,
        category_title, frequency, "createdBy", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `,
    [
      spec.indicatorLevel,
      spec.indicatorId,
      spec.indicatorName,
      spec.categoryId,
      spec.categoryTitle,
      spec.frequency ?? DEFAULT_FREQUENCY,
      CREATED_BY,
    ],
  );
  const id = rows[0].id;
  console.log(`  ✓ created category ic#${id}: ${spec.indicatorName} ${spec.categoryTitle}`);
  return id;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Database: ${DB.database} @ ${DB.host}:${DB.port}`);
  console.log(`Mode: ${dryRun ? 'dry run' : 'apply'}\n`);

  const client = new Client(DB);
  await client.connect();

  let indicatorsCreated = 0;
  let categoriesCreated = 0;

  console.log('=== New programme indicators ===');
  for (const spec of NEW_PROGRAMME_INDICATORS) {
    console.log(`\nKISIP #${spec.kisipNo}: ${spec.name}`);
    const before = await findIndicator(client, spec);
    const indicatorId = await createIndicator(client, spec, dryRun);
    if (!before && indicatorId) indicatorsCreated += 1;

    const resolvedIndicatorId = indicatorId || before?.id;
    if (!resolvedIndicatorId && dryRun) {
      categoriesCreated += 1;
      continue;
    }
    if (!resolvedIndicatorId) continue;

    const catBefore = await findCategory(client, {
      indicatorId: resolvedIndicatorId,
      categoryTitle: spec.categoryTitle,
      indicatorLevel: INDICATOR_LEVEL,
    });
    const categoryId = await createCategory(
      client,
      {
        indicatorId: resolvedIndicatorId,
        indicatorName: spec.name,
        categoryTitle: spec.categoryTitle,
        categoryId: spec.categoryId,
        indicatorLevel: INDICATOR_LEVEL,
      },
      dryRun,
    );
    if (!catBefore && categoryId) categoriesCreated += 1;
  }

  console.log('\n=== Extra programme categories on existing indicators ===');
  for (const spec of EXTRA_PROGRAMME_CATEGORIES) {
    console.log(`\nKISIP #${spec.kisipNo}: ${spec.indicatorName} / ${spec.categoryTitle}`);
    const catBefore = await findCategory(client, {
      indicatorId: spec.indicatorId,
      categoryTitle: spec.categoryTitle,
      indicatorLevel: INDICATOR_LEVEL,
    });
    const categoryId = await createCategory(
      client,
      {
        indicatorId: spec.indicatorId,
        indicatorName: spec.indicatorName,
        categoryTitle: spec.categoryTitle,
        categoryId: spec.categoryId,
        indicatorLevel: INDICATOR_LEVEL,
      },
      dryRun,
    );
    if (!catBefore && categoryId) categoriesCreated += 1;
    if (dryRun && !catBefore) categoriesCreated += 1;
  }

  await client.end();
  console.log(
    `\nDone. Indicators created: ${indicatorsCreated}, categories created: ${categoriesCreated}${dryRun ? ' (dry run)' : ''}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
