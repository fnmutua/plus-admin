/**
 * Append indicator_category_report master list to projects-clean.xlsx.
 * Aligns existing report data with indicators + indicator_categories master lists.
 *
 * Usage: node server/scripts/export-indicator-reports-cleanup.js [output-path]
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
  loadCleanProjects,
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

const REMOVED_CATEGORY_IDS = new Set();

function loadMasterIndicators(workbook) {
  const sheet = workbook.Sheets.indicators;
  if (!sheet) throw new Error('indicators sheet missing');
  return XLSX.utils.sheet_to_json(sheet).filter(
    (row) => String(row.keep || 'Y').toUpperCase() === 'Y' && row.master_list === 'Y'
  );
}

function loadMasterCategories(workbook) {
  const sheet = workbook.Sheets.indicator_categories;
  if (!sheet) throw new Error('indicator_categories sheet missing');
  return XLSX.utils.sheet_to_json(sheet).filter(
    (row) => String(row.keep || 'Y').toUpperCase() === 'Y' && row.master_list === 'Y'
  );
}

function loadCategoryRemovals(workbook) {
  const sheet = workbook.Sheets.indicator_category_removals;
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet);
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

function buildCategoryLookup(masterCategories) {
  const byIndicatorCategory = new Map();
  const byIndicatorAndTitle = new Map();

  for (const row of masterCategories) {
    if (row.id) byIndicatorCategory.set(Number(row.id), row);

    const indicatorId = row.indicator_id ? Number(row.indicator_id) : null;
    const key = indicatorId
      ? `${indicatorId}:${String(row.category_title).trim()}`
      : `${row.indicator_code}:${String(row.category_title).trim()}`;
    byIndicatorAndTitle.set(key, row);
  }

  return { byIndicatorCategory, byIndicatorAndTitle };
}

function buildIndicatorLookup(masterIndicators) {
  const byId = new Map();
  for (const row of masterIndicators) {
    if (row.id) byId.set(Number(row.id), row);
  }
  return byId;
}

const TITLE_FALLBACKS = {
  Installed: ['Constructed'],
  Constructed: ['Installed'],
};

function findTargetCategory(canonicalIndicatorId, categoryTitle, indicatorCode, lookup) {
  const title = String(categoryTitle).trim();
  const attempts = [title, ...(TITLE_FALLBACKS[title] || [])];

  for (const attempt of attempts) {
    const byId = lookup.byIndicatorAndTitle.get(`${canonicalIndicatorId}:${attempt}`);
    if (byId) return byId;
    if (indicatorCode) {
      const byCode = lookup.byIndicatorAndTitle.get(`${indicatorCode}:${attempt}`);
      if (byCode) return byCode;
    }
  }

  return null;
}

function loadProjectActivityMap(workbook) {
  const sheet = workbook.Sheets.project_activities;
  if (!sheet) return new Map();
  const map = new Map();
  for (const row of XLSX.utils.sheet_to_json(sheet)) {
    const projectId = Number(row.project_id);
    if (!projectId) continue;
    const codes = String(row.suggested_activity_codes || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean);
    map.set(projectId, codes);
  }
  return map;
}

function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const outputPath = path.resolve(process.argv[2] || OUTPUT_DEFAULT);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const workbook = loadWorkbook(outputPath);
  const cleanProjects = loadCleanProjects(workbook);
  const cleanProjectIds = new Set(cleanProjects.map((row) => Number(row.id)));
  const projectById = new Map(cleanProjects.map((row) => [Number(row.id), row]));
  const mergeMap = loadActivityMergeMap(workbook);
  const masterIndicators = loadMasterIndicators(workbook);
  const masterCategories = loadMasterCategories(workbook);
  const categoryRemovals = loadCategoryRemovals(workbook);

  for (const row of categoryRemovals) {
    if (row.id) REMOVED_CATEGORY_IDS.add(Number(row.id));
  }

  const categoryLookup = buildCategoryLookup(masterCategories);
  const indicatorLookup = buildIndicatorLookup(masterIndicators);
  const projectActivityMap = loadProjectActivityMap(workbook);
  const validIndicatorIds = new Set(
    masterIndicators.filter((row) => row.id).map((row) => Number(row.id))
  );

  const client = new Client(DB);
  await client.connect();

  try {
    const { rows: reports } = await client.query(`
      SELECT
        icr.id,
        icr.indicator_category_id,
        icr.county_id,
        icr.subcounty_id,
        icr.ward_id,
        icr.project_id,
        icr.activity_id,
        icr.programme_implementation_id,
        icr.settlement_id,
        icr.project_location_id,
        icr.period,
        icr.date,
        icr.amount,
        icr.qualitative,
        icr.target,
        icr.progress,
        icr.status,
        icr.comments,
        icr.documentation,
        icr.code,
        icr."cumProgress" AS cum_progress,
        icr."cumAmount" AS cum_amount,
        ic.indicator_id,
        ic.indicator_name AS db_indicator_name,
        ic.category_title,
        ic.indicator_level,
        ic.activity_id AS config_activity_id,
        p.title AS project_title,
        p.project_code
      FROM indicator_category_report icr
      LEFT JOIN indicator_category ic ON ic.id = icr.indicator_category_id
      LEFT JOIN project p ON p.id = icr.project_id
      ORDER BY icr.project_id NULLS LAST, ic.indicator_id, icr.id
    `);

    const masterRows = [];
    const removeRows = [];

    for (const report of reports) {
      const canonicalIndicatorId = resolveCanonicalIndicatorId(report.indicator_id);
      const masterIndicator = canonicalIndicatorId
        ? indicatorLookup.get(canonicalIndicatorId)
        : null;
      const targetCategory = findTargetCategory(
        canonicalIndicatorId,
        report.category_title,
        masterIndicator?.indicator_code,
        categoryLookup
      );

      const targetActivityId = report.activity_id
        ? resolveCanonicalActivityId(report.activity_id, mergeMap)
        : targetCategory?.activity_id
          ? Number(targetCategory.activity_id)
          : null;

      const project = report.project_id ? projectById.get(Number(report.project_id)) : null;
      const onCleanProject =
        !report.project_id || cleanProjectIds.has(Number(report.project_id));

      let action = 'keep';
      let keep = 'Y';
      let notes = '';

      if (INDICATOR_REMOVES.has(report.indicator_id)) {
        action = 'remove';
        keep = 'N';
        notes = 'Indicator removed from master list (use Skilled + Unskilled jobs)';
      } else if (INDICATOR_MERGES[report.indicator_id]) {
        action = 'realign';
        notes = `Indicator merged: ${report.indicator_id} → ${canonicalIndicatorId}`;
      } else if (REMOVED_CATEGORY_IDS.has(Number(report.indicator_category_id))) {
        action = 'remove';
        keep = 'N';
        notes = 'Indicator category config marked for removal';
      } else if (!onCleanProject) {
        action = 'remove';
        keep = 'N';
        notes = 'Project not in clean master list';
      } else if (!masterIndicator) {
        action = 'review';
        notes = 'Indicator not in master list';
      } else if (!targetCategory) {
        action = 'review';
        notes = 'No matching indicator_category in master list';
      } else if (
        Number(report.indicator_category_id) !== Number(targetCategory.id) &&
        targetCategory.id
      ) {
        action = 'realign';
        notes = `Relink indicator_category_id ${report.indicator_category_id} → ${targetCategory.id}`;
      } else if (
        targetActivityId &&
        report.activity_id &&
        Number(report.activity_id) !== targetActivityId
      ) {
        action = 'realign';
        notes = `Relink activity_id ${report.activity_id} → ${targetActivityId}`;
      } else if (masterIndicator.name !== report.db_indicator_name) {
        notes = 'Indicator renamed in master list';
      }

      const row = {
        id: report.id,
        indicator_category_id: report.indicator_category_id,
        target_indicator_category_id: targetCategory?.id || '',
        indicator_id: report.indicator_id,
        canonical_indicator_id: canonicalIndicatorId || '',
        indicator_code: masterIndicator?.indicator_code || '',
        indicator_name: masterIndicator?.name || report.db_indicator_name || '',
        db_indicator_name: report.db_indicator_name || '',
        category_title: report.category_title || '',
        indicator_level: report.indicator_level || masterIndicator?.level || '',
        activity_id: report.activity_id || '',
        target_activity_id: targetActivityId || '',
        activity_code: targetCategory?.activity_code || masterIndicator?.activity_code || '',
        project_id: report.project_id || '',
        project_title: project?.title || report.project_title || '',
        contract_no: project?.contract_no || report.project_code || '',
        programme_implementation_id: report.programme_implementation_id || '',
        project_location_id: report.project_location_id || '',
        county_id: report.county_id || '',
        subcounty_id: report.subcounty_id || '',
        ward_id: report.ward_id || '',
        settlement_id: report.settlement_id || '',
        period: report.period || '',
        date: formatDate(report.date),
        amount: report.amount,
        target: report.target ?? '',
        progress: report.progress,
        cumAmount: report.cum_amount ?? '',
        cumProgress: report.cum_progress ?? '',
        qualitative: report.qualitative || '',
        status: report.status || '',
        filing_code: report.code || '',
        master_list: keep,
        keep,
        action,
        notes,
      };

      if (action === 'remove') {
        removeRows.push({
          id: report.id,
          indicator_id: report.indicator_id,
          category_title: report.category_title,
          project_id: report.project_id,
          project_title: report.project_title,
          amount: report.amount,
          action: 'remove_on_import',
          notes,
        });
      } else {
        masterRows.push(row);
      }
    }

    const reportKeys = new Set(
      masterRows.map(
        (row) =>
          `${row.project_id}:${row.canonical_indicator_id}:${row.category_title}:${row.period}:${row.date}`
      )
    );

    const templateRows = [];
    for (const project of cleanProjects) {
      const projectId = Number(project.id);
      const suggestedCodes = projectActivityMap.get(projectId) || [];

      for (const category of masterCategories) {
        if (category.action === 'add_new' && !category.id) continue;
        if (!category.indicator_id) continue;
        if (category.indicator_level === 'project' || !category.activity_id) {
          if (category.indicator_level !== 'project') continue;
        } else if (
          suggestedCodes.length &&
          category.activity_code &&
          category.indicator_level === 'activity' &&
          !suggestedCodes.includes(category.activity_code)
        ) {
          continue;
        }

        if (category.indicator_level === 'activity' && !category.activity_id) continue;
        if (category.indicator_level === 'project') {
          // project-level indicators apply to all clean projects
        }

        const key = `${projectId}:${category.indicator_id}:${category.category_title}::`;
        const hasReport = masterRows.some(
          (row) =>
            Number(row.project_id) === projectId &&
            Number(row.canonical_indicator_id) === Number(category.indicator_id) &&
            row.category_title === category.category_title
        );

        if (!hasReport && validIndicatorIds.has(Number(category.indicator_id))) {
          templateRows.push({
            project_id: projectId,
            project_title: project.title,
            contract_no: project.contract_no || '',
            indicator_id: category.indicator_id,
            indicator_code: category.indicator_code,
            indicator_name: category.indicator_name,
            category_title: category.category_title,
            target_indicator_category_id: category.id || '',
            activity_id: category.activity_id || '',
            activity_code: category.activity_code || '',
            indicator_level: category.indicator_level,
            action: 'template',
            notes: category.id
              ? 'No report yet — template row for import/reference'
              : 'Create indicator_category first, then report',
          });
        }
      }
    }

    masterRows.sort((a, b) => {
      const pa = String(a.project_title).localeCompare(String(b.project_title));
      if (pa !== 0) return pa;
      return String(a.indicator_name).localeCompare(String(b.indicator_name));
    });

    const existingMeta = readMetaRows(workbook);
    const meta = [
      ...existingMeta,
      [''],
      ['Indicator reports export'],
      ['Exported at', new Date().toISOString()],
      ['Master list (indicator_reports)', String(masterRows.length)],
      ['Reports to remove', String(removeRows.length)],
      ['Template rows (no data yet)', String(templateRows.length)],
      ['indicator_reports sheet', 'Clean report data aligned to indicators + category config'],
    ];

    removeSheet(workbook, 'indicator_reports');
    removeSheet(workbook, 'indicator_report_removals');
    removeSheet(workbook, 'indicator_report_templates');
    removeSheet(workbook, '_meta');

    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(masterRows, [
        'id',
        'indicator_category_id',
        'target_indicator_category_id',
        'indicator_id',
        'canonical_indicator_id',
        'indicator_code',
        'indicator_name',
        'db_indicator_name',
        'category_title',
        'indicator_level',
        'activity_id',
        'target_activity_id',
        'activity_code',
        'project_id',
        'project_title',
        'contract_no',
        'programme_implementation_id',
        'project_location_id',
        'county_id',
        'subcounty_id',
        'ward_id',
        'settlement_id',
        'period',
        'date',
        'amount',
        'target',
        'progress',
        'cumAmount',
        'cumProgress',
        'qualitative',
        'status',
        'filing_code',
        'master_list',
        'keep',
        'action',
        'notes',
      ]),
      'indicator_reports'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(removeRows, [
        'id',
        'indicator_id',
        'category_title',
        'project_id',
        'project_title',
        'amount',
        'action',
        'notes',
      ]),
      'indicator_report_removals'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(templateRows.slice(0, 500), [
        'project_id',
        'project_title',
        'contract_no',
        'indicator_id',
        'indicator_code',
        'indicator_name',
        'category_title',
        'target_indicator_category_id',
        'activity_id',
        'activity_code',
        'indicator_level',
        'action',
        'notes',
      ]),
      'indicator_report_templates'
    );
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(meta), '_meta');

    XLSX.writeFile(workbook, outputPath);

    const keepCount = masterRows.filter((row) => row.action === 'keep').length;
    const realignCount = masterRows.filter((row) => row.action === 'realign').length;
    const reviewCount = masterRows.filter((row) => row.action === 'review').length;

    console.log(`Appended to ${outputPath}`);
    console.log(`  indicator_reports:     ${masterRows.length} (${keepCount} keep + ${realignCount} realign + ${reviewCount} review)`);
    console.log(`  report_removals:       ${removeRows.length}`);
    console.log(`  report_templates:      ${templateRows.length}${templateRows.length > 500 ? ' (500 exported)' : ''}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
