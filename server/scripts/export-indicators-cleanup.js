/**
 * Append indicator sheets to projects-clean.xlsx.
 * The `indicators` sheet is the single clean master list used for DB import.
 * Action/progress wording belongs in indicator_category_report — not here.
 *
 * Usage: node server/scripts/export-indicators-cleanup.js [output-path]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');
const {
  PROJECTS_CLEAN_PATH,
  DB,
  isUuidCode,
  resolveCanonicalActivityId,
  exportActivityCode,
  loadWorkbook,
  loadMasterActivities,
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

const INDICATOR_REALIGNMENTS = {
  16: 39,
  54: 39,
  65: 16,
};

// Noun-phrase indicator names per activity — no action verbs (those go in reports).
const PRIMARY_INDICATOR = {
  AC1: { name: 'Topographical and engineering maps', format: 'number', unit: 'No.' },
  AC2: { name: 'SEC and GRC committees', format: 'number', unit: 'No.' },
  AC3: { name: 'Grievance resolutions', format: 'number', unit: 'No.' },
  AC4: { name: 'LP&LUDPs', format: 'number', unit: 'No.' },
  AC5: { name: 'Survey plans', format: 'number', unit: 'No.' },
  AC6: { name: 'Registry index maps (RIMs)', format: 'number', unit: 'No.' },
  AC7: { name: 'Regularization letters', format: 'number', unit: 'No.' },
  AC8: { name: 'Titles and leases', format: 'number', unit: 'No.' },
  AC10: { name: 'Community development plans', format: 'number', unit: 'No.' },
  AC11: { name: 'Vulnerable persons identified', format: 'number', unit: 'No.' },
  AC12: { name: 'LICW works', format: 'number', unit: 'No.' },
  AC13: { name: 'DPW works', format: 'number', unit: 'No.' },
  AC14: { name: 'Household water connections', format: 'number', unit: 'No.' },
  AC15: { name: 'Access roads', format: 'number', unit: 'Km' },
  AC16: { name: 'Household sanitation connections', format: 'number', unit: 'No.' },
  AC17: { name: 'Footpaths', format: 'number', unit: 'Km' },
  AC18: { name: 'Health facilities', format: 'number', unit: 'No.' },
  AC19: { name: 'Markets and commercial facilities', format: 'number', unit: 'No.' },
  AC20: { name: 'Floodlights', format: 'number', unit: 'No.' },
  AC21: { name: 'Street lights and power connections', format: 'number', unit: 'No.' },
  AC22: { name: 'Social halls', format: 'number', unit: 'No.' },
  AC23: { name: 'Storm water drainage', format: 'number', unit: 'Km' },
  AC25: { name: 'Sewer lines', format: 'number', unit: 'Km' },
  AC27: { name: 'National slum upgrading strategy', format: 'boolean', unit: 'Yes/No' },
  AC28: { name: 'GIS and ICT infrastructure hubs', format: 'number', unit: 'No.' },
  AC29: { name: 'Informal settlements', format: 'number', unit: 'No.' },
  AC31: { name: 'County upgrading strategies', format: 'number', unit: 'No.' },
  AC35: { name: 'Substructure and excavation works', format: 'number', unit: 'No.' },
  AC36: { name: 'CDPs implemented', format: 'number', unit: 'No.' },
  AC38: { name: 'ESIA reports', format: 'number', unit: 'No.' },
  AC39: { name: 'Education facility blocks', format: 'number', unit: 'No.' },
  AC41: { name: 'Civil works and greening', format: 'number', unit: 'No.' },
  AC42: { name: 'Water reticulation pipes', format: 'number', unit: 'Km' },
  AC51: { name: 'Solid waste collection points', format: 'number', unit: 'No.' },
  AC53: { name: 'Play areas', format: 'number', unit: 'No.' },
  AC50: { name: 'Public parks', format: 'number', unit: 'No.' },
  'AC-SH': { name: 'Social housing units', format: 'number', unit: 'No.' },
  'AC-WAT': { name: 'Boreholes and water towers', format: 'number', unit: 'No.' },
  'AC-RAP': { name: 'Resettlement action plans', format: 'number', unit: 'No.' },
  'AC-CAP': { name: 'Capacity development plans', format: 'number', unit: 'No.' },
  'AC-COMP': { name: 'Completion and handover', format: 'percent', unit: '%' },
  'AC-FURN': { name: 'Furnished housing units', format: 'number', unit: 'No.' },
  'AC-DESIGN': { name: 'Detailed engineering designs', format: 'number', unit: 'No.' },
  'AC-SUP': { name: 'Supervision milestones', format: 'number', unit: 'No.' },
  'AC-FEAS': { name: 'Feasibility studies', format: 'number', unit: 'No.' },
  'AC-REHAB': { name: 'Infrastructure rehabilitation works', format: 'number', unit: 'No.' },
  'AC-DEMO': { name: 'Structure demolitions', format: 'number', unit: 'No.' },
  'AC-RESET': { name: 'Household resettlements', format: 'number', unit: 'No.' },
  'AC-TRAIN': { name: 'Community training sessions', format: 'number', unit: 'No.' },
  'AC-FENC': { name: 'Boundary fencing', format: 'number', unit: 'Km' },
  'AC-SEC': { name: 'Security systems', format: 'number', unit: 'No.' },
  'AC-BRIDGE': { name: 'Bridges and footbridges', format: 'number', unit: 'No.' },
  'AC-LAND': { name: 'Land parcels acquired', format: 'number', unit: 'No.' },
  'AC-VAL': { name: 'Valuation and compensation assessments', format: 'number', unit: 'No.' },
  'AC-MAINT': { name: 'Maintenance obligations', format: 'percent', unit: '%' },
  'AC-INST': { name: 'Institutional facilities', format: 'number', unit: 'No.' },
  'AC-ESMP': { name: 'ESMPs', format: 'number', unit: 'No.' },
  'AC-BASE': { name: 'Baseline surveys', format: 'number', unit: 'No.' },
  'AC-MNE': { name: 'Monitoring and evaluation reports', format: 'number', unit: 'No.' },
  'AC-OHS': { name: 'OHS compliance inspections', format: 'number', unit: 'No.' },
};

// Extra indicators beyond the primary one per activity (e.g. progress).
const SECONDARY_INDICATORS = {
  AC25: [{ name: 'Sewer infrastructure progress', format: 'percent', unit: '%', db_id: 43 }],
  AC39: [{ name: 'Education facility progress', format: 'percent', unit: '%', db_id: 54 }],
};

const PROJECT_INDICATORS = {
  32: { name: 'Skilled jobs', type: 'outcome', format: 'number', unit: 'No.', level: 'project' },
  33: { name: 'Unskilled jobs', type: 'outcome', format: 'number', unit: 'No.', level: 'project' },
  53: { name: 'Implementation status', type: 'output', format: 'boolean', unit: 'Yes/No', level: 'project' },
};

// Redundant DB indicators to drop on import (covered by other master-list entries).
const INDICATOR_REMOVES = {
  70: 'Redundant — use Skilled jobs (32) + Unskilled jobs (33)',
};

// Map existing DB indicator id → activity code for primary indicators.
const DB_PRIMARY_MAP = {
  1: 'AC1', 2: 'AC2', 3: 'AC3', 4: 'AC4', 5: 'AC5', 6: 'AC6', 7: 'AC7', 8: 'AC8',
  10: 'AC10', 11: 'AC11', 12: 'AC12', 13: 'AC13', 14: 'AC39', 15: 'AC15', 17: 'AC17',
  18: 'AC18', 19: 'AC19', 20: 'AC20', 21: 'AC21', 22: 'AC22', 23: 'AC23', 25: 'AC25',
  26: 'AC14', 27: 'AC27', 28: 'AC28', 29: 'AC29', 31: 'AC31', 58: 'AC19', 59: 'AC38',
  60: 'AC42', 61: 'AC23', 65: 'AC16', 67: 'AC19', 69: 'AC50',
};

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

function resolveTargetActivityId(indicator, mergeMap) {
  if (INDICATOR_REALIGNMENTS[indicator.id]) return INDICATOR_REALIGNMENTS[indicator.id];
  if (!indicator.activity_id) return null;
  return resolveCanonicalActivityId(indicator.activity_id, mergeMap);
}

function makeIndicatorCode(id, activityCode) {
  if (id) return `IND${id}`;
  return activityCode ? `IND-${activityCode}` : '';
}

function findPrimaryDbIndicator(activityCode, dbIndicators, usedDbIds) {
  for (const [idStr, code] of Object.entries(DB_PRIMARY_MAP)) {
    const id = Number(idStr);
    if (code !== activityCode || usedDbIds.has(id) || INDICATOR_MERGES[id]) continue;
    const canonical = resolveCanonicalIndicatorId(id);
    const row = dbIndicators.find((item) => item.id === canonical);
    if (row) return row;
  }
  return null;
}

function buildMasterIndicatorList(masterActivities, mergeMap, dbIndicators, categoriesByIndicator) {
  const masterRows = [];
  const usedDbIds = new Set();

  for (const activity of masterActivities) {
    const activityId = activity.id ? Number(activity.id) : null;
    const activityCode = exportActivityCode(activity, mergeMap);
    const template = PRIMARY_INDICATOR[activityCode];
    if (!template) continue;

    const matchedDb = findPrimaryDbIndicator(activityCode, dbIndicators, usedDbIds);

    let action = 'keep';
    let notes = '';
    const rowId = matchedDb?.id || '';

    if (matchedDb) {
      usedDbIds.add(matchedDb.id);
      const targetActivityId = resolveTargetActivityId(matchedDb, mergeMap);
      if (targetActivityId && activityId && targetActivityId !== matchedDb.activity_id) {
        action = 'realign';
        notes = `Realign activity_id ${matchedDb.activity_id} → ${targetActivityId}`;
      }
    } else {
      action = activityId ? 'add_new' : 'add_with_activity';
      notes = activityId
        ? 'Create and link to activity on import'
        : 'Create when activity is added to DB';
    }

    masterRows.push({
      id: rowId,
      name: template.name,
      db_name: matchedDb?.name || '',
      type: 'output',
      format: template.format,
      unit: template.unit,
      level: 'activity',
      code: matchedDb?.code || '',
      indicator_code: rowId
        ? isUuidCode(matchedDb?.code)
          ? `IND${rowId}`
          : matchedDb?.code || `IND${rowId}`
        : makeIndicatorCode('', activityCode),
      activity_id: activityId || '',
      activity_code: activityCode,
      activity_title: activity.shortTitle || activity.title || '',
      category_count: matchedDb ? categoriesByIndicator.get(matchedDb.id) || 0 : 0,
      master_list: 'Y',
      keep: 'Y',
      action,
      notes,
    });

    for (const secondary of SECONDARY_INDICATORS[activityCode] || []) {
      const secDb = secondary.db_id
        ? dbIndicators.find((row) => row.id === secondary.db_id)
        : null;
      if (secDb) usedDbIds.add(secDb.id);

      masterRows.push({
        id: secDb?.id || '',
        name: secondary.name,
        db_name: secDb?.name || '',
        type: 'output',
        format: secondary.format,
        unit: secondary.unit,
        level: 'activity',
        code: secDb?.code || '',
        indicator_code: secDb?.id
          ? isUuidCode(secDb.code)
            ? `IND${secDb.id}`
            : secDb.code || `IND${secDb.id}`
          : makeIndicatorCode('', `${activityCode}-2`),
        activity_id: activityId || '',
        activity_code: activityCode,
        activity_title: activity.shortTitle || activity.title || '',
        category_count: secDb ? categoriesByIndicator.get(secDb.id) || 0 : 0,
        master_list: 'Y',
        keep: 'Y',
        action: secDb ? 'keep' : 'add_new',
        notes: secDb ? 'Secondary/progress indicator' : 'Create on import',
      });
    }
  }

  // Project-level indicators
  for (const [idStr, template] of Object.entries(PROJECT_INDICATORS)) {
    const id = Number(idStr);
    const db = dbIndicators.find((row) => row.id === id);
    usedDbIds.add(id);
    masterRows.push({
      id,
      name: template.name,
      db_name: db?.name || '',
      type: template.type,
      format: template.format,
      unit: template.unit,
      level: template.level,
      code: db?.code || '',
      indicator_code: isUuidCode(db?.code) ? `IND${id}` : db?.code || `IND${id}`,
      activity_id: '',
      activity_code: '',
      activity_title: '',
      category_count: categoriesByIndicator.get(id) || 0,
      master_list: 'Y',
      keep: 'Y',
      action: 'keep',
      notes: 'Project-level indicator',
    });
  }

  masterRows.sort((a, b) => {
    const levelOrder = { activity: 0, project: 1 };
    const la = levelOrder[a.level] ?? 0;
    const lb = levelOrder[b.level] ?? 0;
    if (la !== lb) return la - lb;
    return String(a.name).localeCompare(String(b.name));
  });

  return { masterRows, usedDbIds };
}

async function main() {
  const outputPath = path.resolve(process.argv[2] || OUTPUT_DEFAULT);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const workbook = loadWorkbook(outputPath);
  const masterActivities = loadMasterActivities(workbook);
  const mergeMap = loadActivityMergeMap(workbook);

  const client = new Client(DB);
  await client.connect();

  try {
    const { rows: dbIndicators } = await client.query(`
      SELECT i.id, i.name, i.type, i.format, i.unit, i.level, i.code, i.activity_id,
        a."shortTitle" AS activity_short_title
      FROM indicator i
      LEFT JOIN activity a ON a.id = i.activity_id
      ORDER BY COALESCE(i.activity_id, 999999), i.id
    `);

    const { rows: categoryCounts } = await client.query(`
      SELECT indicator_id, COUNT(*)::int AS category_count
      FROM indicator_category GROUP BY indicator_id
    `);
    const categoriesByIndicator = new Map(
      categoryCounts.map((row) => [row.indicator_id, row.category_count])
    );

    const { masterRows } = buildMasterIndicatorList(
      masterActivities,
      mergeMap,
      dbIndicators,
      categoriesByIndicator
    );

    const indicatorMergeRows = [];
    for (const ind of dbIndicators) {
      const mergeIntoId = INDICATOR_MERGES[ind.id];
      if (!mergeIntoId) continue;
      const targetActivityId = resolveTargetActivityId(ind, mergeMap);
      indicatorMergeRows.push({
        duplicate_id: ind.id,
        duplicate_name: ind.name,
        merge_into_id: mergeIntoId,
        canonical_name: dbIndicators.find((row) => row.id === mergeIntoId)?.name || '',
        duplicate_activity_id: ind.activity_id,
        target_activity_id: targetActivityId || '',
        action: 'merge_on_import',
        notes: `Merge into indicator id ${mergeIntoId}`,
      });
    }

    for (const [removeIdStr, reason] of Object.entries(INDICATOR_REMOVES)) {
      const removeId = Number(removeIdStr);
      const ind = dbIndicators.find((row) => row.id === removeId);
      if (!ind) continue;
      indicatorMergeRows.push({
        duplicate_id: removeId,
        duplicate_name: ind.name,
        merge_into_id: '',
        canonical_name: 'Skilled jobs (32) + Unskilled jobs (33)',
        duplicate_activity_id: ind.activity_id,
        target_activity_id: '',
        action: 'remove_on_import',
        notes: reason,
      });
    }

    const existingByActivity = new Map();
    for (const row of masterRows) {
      if (!row.activity_id || row.level !== 'activity') continue;
      const key = Number(row.activity_id);
      if (!existingByActivity.has(key)) existingByActivity.set(key, []);
      existingByActivity.get(key).push(row);
    }

    const activityIndicatorMap = masterActivities.map((activity) => {
      const activityId = activity.id ? Number(activity.id) : null;
      const activityCode = exportActivityCode(activity, mergeMap);
      const existing = activityId ? existingByActivity.get(activityId) || [] : [];
      const template = PRIMARY_INDICATOR[activityCode];

      return {
        activity_id: activityId || '',
        activity_code: activityCode,
        activity_title: activity.shortTitle || activity.title,
        indicator_count: existing.length,
        indicator_ids: existing.map((row) => row.id).filter(Boolean).join('; '),
        indicator_names: existing.map((row) => row.name).join('; '),
        suggested_indicator_name: template?.name || '',
        action: existing.length ? 'ok' : template ? 'add_indicator' : 'review',
        notes: existing.length ? '' : template ? 'In master list as add_new' : '',
      };
    });

    const proposedIndicators = masterRows
      .filter((row) => row.action === 'add_new' || row.action === 'add_with_activity')
      .map((row) => ({
        activity_id: row.activity_id,
        activity_code: row.activity_code,
        activity_title: row.activity_title,
        proposed_name: row.name,
        type: row.type,
        format: row.format,
        unit: row.unit,
        level: row.level,
        indicator_code: row.indicator_code,
        action: row.action,
        notes: row.notes,
      }));

    const indicatorGaps = [];
    for (const row of masterRows) {
      if (row.action === 'realign') {
        indicatorGaps.push({
          gap_type: 'misaligned_indicator',
          indicator_id: row.id,
          indicator_name: row.name,
          activity_id: row.activity_id,
          issue: `Realign to activity ${row.activity_id} (${row.activity_code})`,
          suggested_action: 'realign_on_import',
          notes: row.notes,
        });
      }
    }
    for (const row of activityIndicatorMap) {
      if (row.action === 'add_indicator') {
        indicatorGaps.push({
          gap_type: 'missing_indicator',
          indicator_id: '',
          indicator_name: row.suggested_indicator_name,
          activity_id: row.activity_id,
          issue: `No indicator for ${row.activity_code}`,
          suggested_action: 'create_indicator',
          notes: 'Included in master list as add_new',
        });
      }
    }

    const existingMeta = readMetaRows(workbook);
    const indicatorMeta = [
      [''],
      ['Indicators export'],
      ['Exported at', new Date().toISOString()],
      ['Master list (indicators sheet)', String(masterRows.length)],
      ['Merged duplicates', String(indicatorMergeRows.length)],
      ['indicators sheet', 'SINGLE clean master list for DB import — noun names only, no action verbs'],
      ['activity_indicators sheet', 'Per-activity coverage reference'],
      ['proposed_indicators sheet', 'Subset of master list rows with action add_new'],
      ['indicator_merges sheet', 'Duplicate DB indicators to merge on import'],
      ['indicator_gaps sheet', 'Realignments and gaps reference'],
    ];
    const meta = [...existingMeta, ...indicatorMeta];

    removeSheet(workbook, 'indicators');
    removeSheet(workbook, 'activity_indicators');
    removeSheet(workbook, 'proposed_indicators');
    removeSheet(workbook, 'indicator_merges');
    removeSheet(workbook, 'indicator_gaps');
    removeSheet(workbook, '_meta');

    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(masterRows, [
        'id',
        'name',
        'db_name',
        'type',
        'format',
        'unit',
        'level',
        'code',
        'indicator_code',
        'activity_id',
        'activity_code',
        'activity_title',
        'category_count',
        'master_list',
        'keep',
        'action',
        'notes',
      ]),
      'indicators'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(activityIndicatorMap, [
        'activity_id',
        'activity_code',
        'activity_title',
        'indicator_count',
        'indicator_ids',
        'indicator_names',
        'suggested_indicator_name',
        'action',
        'notes',
      ]),
      'activity_indicators'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(proposedIndicators, [
        'activity_id',
        'activity_code',
        'activity_title',
        'proposed_name',
        'type',
        'format',
        'unit',
        'level',
        'indicator_code',
        'action',
        'notes',
      ]),
      'proposed_indicators'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(indicatorMergeRows, [
        'duplicate_id',
        'duplicate_name',
        'merge_into_id',
        'canonical_name',
        'duplicate_activity_id',
        'target_activity_id',
        'action',
        'notes',
      ]),
      'indicator_merges'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(indicatorGaps, [
        'gap_type',
        'indicator_id',
        'indicator_name',
        'activity_id',
        'issue',
        'suggested_action',
        'notes',
      ]),
      'indicator_gaps'
    );
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(meta), '_meta');

    XLSX.writeFile(workbook, outputPath);

    const keepCount = masterRows.filter((r) => r.action === 'keep').length;
    const addCount = masterRows.filter((r) => r.action.startsWith('add')).length;

    console.log(`Appended to ${outputPath}`);
    console.log(`  master list:         ${masterRows.length} (${keepCount} existing + ${addCount} new)`);
    console.log(`  merged_duplicates:   ${indicatorMergeRows.length}`);
    console.log(`  activity_indicators: ${activityIndicatorMap.length}`);
    console.log(`  proposed_indicators: ${proposedIndicators.length}`);
    console.log(`  indicator_gaps:      ${indicatorGaps.length}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
