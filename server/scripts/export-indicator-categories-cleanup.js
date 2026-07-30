/**
 * Append indicator_category config sheets to projects-clean.xlsx.
 * The `indicator_categories` sheet is the clean master list for import.
 * Action verbs live in category_title here (not in indicator names).
 *
 * Usage: node server/scripts/export-indicator-categories-cleanup.js [output-path]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');
const {
  PROJECTS_CLEAN_PATH,
  DB,
  resolveCanonicalActivityId,
  loadWorkbook,
  loadActivityMergeMap,
  rowsToSheet,
  removeSheet,
  readMetaRows,
} = require('./me-cleanup-shared');

const OUTPUT_DEFAULT = PROJECTS_CLEAN_PATH;

const INDICATOR_MERGES = {
  9: 1,
  24: 20,
  40: 2,
  41: 8,
  44: 15,
  39: 25,
  66: 65,
};

const INDICATOR_REMOVES = new Set([70]);

const CATEGORY_ID = {
  Male: 2,
  Female: 3,
  Planned: 4,
  Prepared: 5,
  Completed: 6,
  Installed: 29,
  Issued: 30,
  Amended: 32,
  Identified: 33,
  Constructed: 34,
  Implemented: 35,
  Mapped: 36,
  Updated: 37,
  Formed: 38,
  Achieved: 41,
  Ongoing: 27,
};

const FREQUENCY_ID = {
  Monthly: 2,
  Quarterly: 3,
  Annually: 4,
  'One-off': 6,
};

const PREPARED_CODES = new Set([
  'AC1', 'AC4', 'AC5', 'AC8', 'AC10', 'AC31', 'AC38', 'AC-RAP', 'AC-CAP',
  'AC-DESIGN', 'AC-FEAS', 'AC-BASE', 'AC-ESMP', 'AC-VAL', 'AC-LAND',
]);
const INSTALLED_CODES = new Set([
  'AC14', 'AC16', 'AC25', 'AC28', 'AC-WAT', 'AC-SEC', 'AC-FENC',
]);
const IMPLEMENTED_CODES = new Set([
  'AC12', 'AC13', 'AC36', 'AC-TRAIN', 'AC-MNE', 'AC-OHS', 'AC-SUP', 'AC-MAINT',
]);
const MAPPED_CODES = new Set(['AC29']);
const FORMED_CODES = new Set(['AC2']);
const AMENDED_CODES = new Set(['AC6']);
const ISSUED_CODES = new Set(['AC7']);
const COMPLETED_CODES = new Set(['AC3']);
const DEMOLISHED_CODES = new Set(['AC-DEMO']);
const RESETTLED_CODES = new Set(['AC-RESET']);

function loadMasterIndicators(workbook) {
  const sheet = workbook.Sheets.indicators;
  if (!sheet) {
    throw new Error('indicators sheet missing. Run export-indicators-cleanup.js first.');
  }
  return XLSX.utils.sheet_to_json(sheet).filter(
    (row) => String(row.keep || 'Y').toUpperCase() === 'Y' && row.master_list === 'Y'
  );
}

function resolveCanonicalIndicatorId(indicatorId) {
  let currentId = Number(indicatorId);
  if (!currentId) return null;
  const seen = new Set();
  while (INDICATOR_MERGES[currentId] && !seen.has(currentId)) {
    seen.add(currentId);
    currentId = INDICATOR_MERGES[currentId];
  }
  return currentId;
}

function getReportActions(indicator) {
  if (indicator.level === 'project') {
    if (/implementation/i.test(indicator.name)) {
      return [{ category_title: 'Achieved', frequency_name: 'Monthly' }];
    }
    return [
      { category_title: 'Male', frequency_name: 'Monthly' },
      { category_title: 'Female', frequency_name: 'Monthly' },
    ];
  }

  if (indicator.format === 'percent') {
    return [{ category_title: 'Achieved', frequency_name: 'Quarterly' }];
  }

  if (indicator.format === 'boolean') {
    return [{ category_title: 'Updated', frequency_name: 'Annually' }];
  }

  const code = indicator.activity_code;

  if (code === 'AC17') {
    return [
      { category_title: 'Planned', frequency_name: 'Quarterly' },
      { category_title: 'Constructed', frequency_name: 'One-off' },
    ];
  }

  if (PREPARED_CODES.has(code)) {
    return [{ category_title: 'Prepared', frequency_name: 'Quarterly' }];
  }
  if (INSTALLED_CODES.has(code)) {
    return [{ category_title: 'Installed', frequency_name: 'Quarterly' }];
  }
  if (IMPLEMENTED_CODES.has(code)) {
    return [{ category_title: 'Implemented', frequency_name: 'Quarterly' }];
  }
  if (MAPPED_CODES.has(code)) {
    return [{ category_title: 'Mapped', frequency_name: 'One-off' }];
  }
  if (FORMED_CODES.has(code)) {
    return [{ category_title: 'Formed', frequency_name: 'One-off' }];
  }
  if (AMENDED_CODES.has(code)) {
    return [{ category_title: 'Amended', frequency_name: 'One-off' }];
  }
  if (ISSUED_CODES.has(code)) {
    return [{ category_title: 'Issued', frequency_name: 'One-off' }];
  }
  if (COMPLETED_CODES.has(code)) {
    return [{ category_title: 'Completed', frequency_name: 'Quarterly' }];
  }
  if (DEMOLISHED_CODES.has(code)) {
    return [{ category_title: 'Completed', frequency_name: 'Quarterly' }];
  }
  if (RESETTLED_CODES.has(code)) {
    return [{ category_title: 'Completed', frequency_name: 'Quarterly' }];
  }

  return [{ category_title: 'Constructed', frequency_name: 'Quarterly' }];
}

function findExistingConfig(dbConfigs, indicatorId, categoryTitle) {
  return dbConfigs.find(
    (row) =>
      Number(row.indicator_id) === Number(indicatorId) &&
      String(row.category_title).trim() === categoryTitle
  );
}

function buildMasterCategoryList(masterIndicators, mergeMap, dbConfigs, categoryById, frequencyById) {
  const masterRows = [];
  const expectedKeys = new Set();
  const masterIndicatorIds = new Set(
    masterIndicators.filter((row) => row.id).map((row) => Number(row.id))
  );

  for (const indicator of masterIndicators) {
    const indicatorId = indicator.id ? Number(indicator.id) : null;
    const activityId = indicator.activity_id ? Number(indicator.activity_id) : null;
    const targetActivityId = activityId
      ? resolveCanonicalActivityId(activityId, mergeMap)
      : null;
    const actions = getReportActions(indicator);

    for (const action of actions) {
      const categoryId = CATEGORY_ID[action.category_title] || '';
      const frequencyId = FREQUENCY_ID[action.frequency_name] || FREQUENCY_ID.Quarterly;
      const key = `${indicatorId || indicator.indicator_code}:${action.category_title}`;
      expectedKeys.add(key);

      const existing = indicatorId
        ? findExistingConfig(dbConfigs, indicatorId, action.category_title)
        : null;

      let rowAction = 'keep';
      let notes = '';

      if (!indicatorId) {
        rowAction = 'add_new';
        notes = 'Create when indicator is added to DB';
      } else if (!existing) {
        rowAction = 'add_new';
        notes = 'Missing config — create on import';
      } else if (
        targetActivityId &&
        existing.activity_id &&
        Number(existing.activity_id) !== targetActivityId
      ) {
        rowAction = 'realign';
        notes = `Realign activity_id ${existing.activity_id} → ${targetActivityId}`;
      } else if (existing.indicator_name !== indicator.name) {
        notes = 'Update indicator_name to match master list';
      }

      masterRows.push({
        id: existing?.id || '',
        indicator_id: indicatorId || '',
        indicator_code: indicator.indicator_code || '',
        indicator_name: indicator.name,
        db_indicator_name: existing?.indicator_name || '',
        indicator_level: indicator.level || 'activity',
        activity_id: targetActivityId || activityId || '',
        activity_code: indicator.activity_code || '',
        category_id: categoryId,
        category_title: action.category_title,
        category_name: categoryById.get(categoryId) || action.category_title,
        frequency_id: existing?.frequency || frequencyId,
        frequency_name:
          frequencyById.get(Number(existing?.frequency || frequencyId)) ||
          action.frequency_name,
        master_list: 'Y',
        keep: 'Y',
        action: rowAction,
        notes,
      });
    }
  }

  const removeRows = [];
  for (const config of dbConfigs) {
    const canonicalIndId = resolveCanonicalIndicatorId(config.indicator_id);
    const shouldRemove =
      INDICATOR_REMOVES.has(config.indicator_id) ||
      INDICATOR_MERGES[config.indicator_id] ||
      !masterIndicatorIds.has(canonicalIndId);

    if (!shouldRemove) continue;

    removeRows.push({
      id: config.id,
      indicator_id: config.indicator_id,
      indicator_name: config.indicator_name,
      category_title: config.category_title,
      activity_id: config.activity_id,
      action: INDICATOR_REMOVES.has(config.indicator_id)
        ? 'remove_on_import'
        : 'remove_merged_indicator',
      notes: INDICATOR_REMOVES.has(config.indicator_id)
        ? 'Indicator removed from master list'
        : `Indicator ${config.indicator_id} merged into ${INDICATOR_MERGES[config.indicator_id]}`,
    });
  }

  masterRows.sort(
    (a, b) =>
      String(a.indicator_name).localeCompare(String(b.indicator_name)) ||
      String(a.category_title).localeCompare(String(b.category_title))
  );

  return { masterRows, removeRows, expectedKeys };
}

async function main() {
  const outputPath = path.resolve(process.argv[2] || OUTPUT_DEFAULT);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const workbook = loadWorkbook(outputPath);
  const masterIndicators = loadMasterIndicators(workbook);
  const mergeMap = loadActivityMergeMap(workbook);

  const client = new Client(DB);
  await client.connect();

  try {
    const { rows: dbConfigs } = await client.query(`
      SELECT ic.id, ic.indicator_level, ic.indicator_id, ic.indicator_name,
        ic.category_id, ic.activity_id, ic.category_title, ic.frequency, ic.code,
        ic.project_id, ic.project_location_id
      FROM indicator_category ic
      ORDER BY ic.indicator_id, ic.id
    `);

    const { rows: categories } = await client.query(
      'SELECT id, category, code FROM category ORDER BY id'
    );
    const { rows: frequencies } = await client.query(
      'SELECT id, frequency, code FROM frequency ORDER BY id'
    );

    const categoryById = new Map(categories.map((row) => [row.id, row.category]));
    const frequencyById = new Map(frequencies.map((row) => [row.id, row.frequency]));

    const { masterRows, removeRows } = buildMasterCategoryList(
      masterIndicators,
      mergeMap,
      dbConfigs,
      categoryById,
      frequencyById
    );

    const gaps = masterRows.filter((row) => row.action === 'add_new');

    const coverage = masterIndicators.map((indicator) => {
      const configs = masterRows.filter(
        (row) =>
          (indicator.id && Number(row.indicator_id) === Number(indicator.id)) ||
          row.indicator_code === indicator.indicator_code
      );
      return {
        indicator_id: indicator.id || '',
        indicator_code: indicator.indicator_code || '',
        indicator_name: indicator.name,
        activity_code: indicator.activity_code || '',
        config_count: configs.length,
        category_titles: configs.map((row) => row.category_title).join('; '),
        action: configs.length ? 'ok' : 'missing_config',
        notes: configs.length ? '' : 'No report config in master list',
      };
    });

    const existingMeta = readMetaRows(workbook);
    const meta = [
      ...existingMeta,
      [''],
      ['Indicator categories export'],
      ['Exported at', new Date().toISOString()],
      ['Master list (indicator_categories)', String(masterRows.length)],
      ['Configs to remove', String(removeRows.length)],
      ['New configs needed', String(gaps.length)],
      ['indicator_categories sheet', 'Master report config — category_title holds action verbs'],
    ];

    removeSheet(workbook, 'indicator_categories');
    removeSheet(workbook, 'indicator_category_removals');
    removeSheet(workbook, 'indicator_category_gaps');
    removeSheet(workbook, 'indicator_category_coverage');
    removeSheet(workbook, 'categories_ref');
    removeSheet(workbook, 'frequencies_ref');
    removeSheet(workbook, '_meta');

    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(masterRows, [
        'id',
        'indicator_id',
        'indicator_code',
        'indicator_name',
        'db_indicator_name',
        'indicator_level',
        'activity_id',
        'activity_code',
        'category_id',
        'category_title',
        'category_name',
        'frequency_id',
        'frequency_name',
        'master_list',
        'keep',
        'action',
        'notes',
      ]),
      'indicator_categories'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(removeRows, [
        'id',
        'indicator_id',
        'indicator_name',
        'category_title',
        'activity_id',
        'action',
        'notes',
      ]),
      'indicator_category_removals'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(gaps, [
        'indicator_id',
        'indicator_code',
        'indicator_name',
        'activity_code',
        'category_title',
        'frequency_name',
        'action',
        'notes',
      ]),
      'indicator_category_gaps'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(coverage, [
        'indicator_id',
        'indicator_code',
        'indicator_name',
        'activity_code',
        'config_count',
        'category_titles',
        'action',
        'notes',
      ]),
      'indicator_category_coverage'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(categories, ['id', 'category', 'code']),
      'categories_ref'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(frequencies, ['id', 'frequency', 'code']),
      'frequencies_ref'
    );
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(meta), '_meta');

    XLSX.writeFile(workbook, outputPath);

    const keepCount = masterRows.filter((row) => row.action === 'keep').length;
    const addCount = masterRows.filter((row) => row.action === 'add_new').length;
    const realignCount = masterRows.filter((row) => row.action === 'realign').length;

    console.log(`Appended to ${outputPath}`);
    console.log(`  indicator_categories:  ${masterRows.length} (${keepCount} keep + ${addCount} add + ${realignCount} realign)`);
    console.log(`  removals:            ${removeRows.length}`);
    console.log(`  coverage rows:       ${coverage.length}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
