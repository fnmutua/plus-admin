/**
 * Export the single canonical projects-clean.xlsx workbook.
 * Usage: node server/scripts/export-projects-cleanup.js [output-path]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');

const DB = {
  host: process.env.VUE_APP_DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT || 5432),
  user: process.env.VUE_APP_USER || 'postgres',
  password: process.env.VUE_APP_PASSWORD || 'Admin@2011',
  database: process.env.VUE_APP_DB || 'kisip',
};

const OUTPUT_DEFAULT = path.join(
  process.cwd(),
  'data',
  'exports',
  'projects-clean.xlsx'
);

const TEST_TITLE_RE =
  /(^|[^a-z])(test|dummy|sample|demo|placeholder|tets|asdf|foo|bar)([^a-z]|$)/i;

const STRUCTURED_CODE_RE =
  /^(KISIP|CPM|PS|SUD|MLPWHUD|SDHUD|MTIHUD|KE-|MH\/|MLHUD\/|MTIHUD\/)/i;

const PLACEHOLDER_CODES = new Set([
  '',
  'tbd',
  'tb d',
  'na',
  'n/a',
  'xxxx',
  'xxx',
  'tets',
  'eert',
  '00',
  '9',
  '10',
  '11',
  'rgjdikf',
  'tdb',
]);

// Ministry tender formats from housingandurban.go.ke (MLPWHUD/SDHUD/{dept}/{serial}/{FY})
const CONTRACT_FORMATS = {
  SUD: 'MLPWHUD/SDHUD/SUD/TBD',
  AHP: 'MLPWHUD/SDHUD/AHP/TBD',
  UDD: 'MLPWHUD/SDHUD/UDD/TBD',
  KISIP_CS: 'MLHUD/KISIP/CS/TBD',
  KISIP_INF: 'MLHUD/KISIP/INF/TBD',
  KISIP_MAPPING: 'KE-MOTI/CS-QCBS/TBD',
};

function normalizeTitle(title) {
  return String(title || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function looksLikeRandomCode(code) {
  if (!code) return false;
  if (STRUCTURED_CODE_RE.test(code)) return false;
  if (code.length > 24) return false;
  // nanoid-ish: mixed alnum, often 8-22 chars
  return /^[A-Za-z0-9_-]+$/.test(code) && /[A-Z]/.test(code) && /[a-z0-9]/.test(code);
}

function isPlaceholderCode(projectCode) {
  const normalized = String(projectCode || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  return PLACEHOLDER_CODES.has(normalized);
}

function isIncompleteContractCode(projectCode) {
  const code = String(projectCode || '').trim();
  if (!code || isPlaceholderCode(code)) return true;
  if (code === 'MLPWHUD') return true;
  if (/^MLPWHUD\/SDHUD\/(SUD|AHP|UDD)\/-{0,3}$/.test(code)) return true;
  if (/^MLPWHUD\/SDHUD\/(SUD|AHP|UDD)\/$/.test(code)) return true;
  return false;
}

function contractCodeScore(projectCode) {
  const code = String(projectCode || '').trim();
  if (isIncompleteContractCode(code)) return 0;

  if (/^MLPWHUD\/SDHUD\/(SUD|AHP|UDD)\/\d+\/\d{4}-\d{4}$/.test(code)) return 100;
  if (/^KE-MOTI-\d+-CS-QCBS$/i.test(code)) return 95;
  if (/^MLHUD\/KISIP\/CS\/[\dA-Z]+\/\d{4}-\d{4}$/.test(code)) return 90;
  if (/^MH\/KISIP\/CS\/\d+\/\d{4}-\d{4}$/.test(code)) return 90;
  if (/^KISIP\/SUD\/\d{4}\/\d+$/i.test(code)) return 85;
  if (/^MTIHUD(?:PW)?\/SDHUD\/SUD\/\d+\/\d{4}-\d{4}$/.test(code)) return 85;
  if (/^KE-[A-Z0-9 .-]+-CW-RF[BQ]/i.test(code)) return 75;
  if (/^SUD\/\d+(\/\d+)?$/i.test(code)) return 65;
  if (/^SDHUD\/SUD\/\d+$/i.test(code)) return 60;
  if (/^SDHUD\/\d+\/\d+$/.test(code)) return 55;

  return 50;
}

function isReliableContractCode(projectCode) {
  return contractCodeScore(projectCode) >= 50;
}

function buildTitleContractIndex(allRows) {
  const index = new Map();

  for (const row of allRows) {
    const code = String(row.project_code || '').trim();
    const score = contractCodeScore(code);
    if (score < 50) continue;

    const key = normalizeTitle(row.title);
    const existing = index.get(key);
    if (!existing || score > existing.score) {
      index.set(key, {
        code,
        score,
        from_id: row.id,
      });
    }
  }

  return index;
}

function bestContractFromRows(groupRows) {
  const sorted = [...groupRows].sort(
    (a, b) => contractCodeScore(b.project_code) - contractCodeScore(a.project_code)
  );
  const best = sorted.find((row) => isReliableContractCode(row.project_code));
  if (!best) return null;
  return {
    code: String(best.project_code).trim(),
    from_id: best.id,
  };
}

function resolveContractNumber(row, titleContractIndex, duplicatePeers = []) {
  const current = String(row.project_code || '').trim();

  if (isReliableContractCode(current)) {
    return {
      contract_no: current,
      contract_source: 'existing',
      contract_format: '',
      notes: '',
    };
  }

  const duplicateMatch = bestContractFromRows(duplicatePeers.length ? duplicatePeers : [row]);
  if (duplicateMatch && duplicateMatch.from_id !== row.id) {
    return {
      contract_no: duplicateMatch.code,
      contract_source: 'duplicate_group_match',
      contract_format: '',
      notes: `Matched project id ${duplicateMatch.from_id} in duplicate group`,
    };
  }

  const titleMatch = titleContractIndex.get(normalizeTitle(row.title));
  if (titleMatch && titleMatch.from_id !== row.id) {
    return {
      contract_no: titleMatch.code,
      contract_source: 'exact_title_match',
      contract_format: '',
      notes: `Matched project id ${titleMatch.from_id}`,
    };
  }

  const placeholder = suggestContractNumber(row);
  return {
    contract_no: placeholder.suggested,
    contract_source: 'format_placeholder',
    contract_format: placeholder.format_key,
    notes: placeholder.source,
  };
}

function isAffordableHousingProject(row) {
  const title = normalizeTitle(row.title);
  const programme = normalizeTitle(row.programme);
  const component = normalizeTitle(row.component);

  if (programme.includes('affordable housing')) return true;
  if (component === 'social' || component === 'institutional') {
    return /housing|bedsit|bedroom|met site|kamiti|kasarani|kibera|mariguini|sepu|ahp|gk prison|police station|prison/.test(
      title
    );
  }
  return /social housing|affordable housing|design, build and finance of housing|housing units/.test(
    title
  );
}

function isUrbanDevelopmentProject(row) {
  const title = normalizeTitle(row.title);
  return /floodlight|flood light|solar powered|borehole|water tower|water reticulation|lpg fittings|river cleaning|climate/.test(
    title
  );
}

function isKisipMappingProject(row) {
  const title = normalizeTitle(row.title);
  return /mapping of slums|mapping of slum/.test(title);
}

function isKisipInfrastructureProject(row) {
  const title = normalizeTitle(row.title);
  const programme = normalizeTitle(row.programme);
  const component = normalizeTitle(row.component);

  if (component !== 'infrastructurex') return false;
  if (programme.includes('kisip1') || programme.includes('kisip2')) return true;
  return /infrastructure upgrading|infrastructure upgrading works/.test(title);
}

function isKisipConsultancyProject(row) {
  const title = normalizeTitle(row.title);
  const programme = normalizeTitle(row.programme);
  const component = normalizeTitle(row.component);

  if (!programme.includes('kisip')) return false;
  if (component === 'planning/survey' || component === 'capacityx') return true;
  return /consultancy|planning and surveying|survey and planning|capacity development|community development plan|slum upgrading strategy|gis-based housing/.test(
    title
  );
}

function suggestContractNumber(row) {
  if (!isPlaceholderCode(row.project_code)) {
    return { suggested: '', format_key: '', source: '' };
  }

  if (isKisipMappingProject(row)) {
    return {
      suggested: CONTRACT_FORMATS.KISIP_MAPPING,
      format_key: 'KISIP_MAPPING',
      source: 'housingandurban.go.ke KE-MOTI mapping tenders',
    };
  }

  if (isKisipConsultancyProject(row)) {
    return {
      suggested: CONTRACT_FORMATS.KISIP_CS,
      format_key: 'KISIP_CS',
      source: 'housingandurban.go.ke MLHUD/KISIP/CS/{serial}/{FY}',
    };
  }

  if (isKisipInfrastructureProject(row)) {
    return {
      suggested: CONTRACT_FORMATS.KISIP_INF,
      format_key: 'KISIP_INF',
      source: 'KISIP infrastructure contract pattern',
    };
  }

  if (isAffordableHousingProject(row)) {
    return {
      suggested: CONTRACT_FORMATS.AHP,
      format_key: 'AHP',
      source: 'housingandurban.go.ke MLPWHUD/SDHUD/AHP/{serial}/{FY}',
    };
  }

  if (isUrbanDevelopmentProject(row)) {
    return {
      suggested: CONTRACT_FORMATS.UDD,
      format_key: 'UDD',
      source: 'housingandurban.go.ke MLPWHUD/SDHUD/UDD/{serial}/{FY}',
    };
  }

  const programme = normalizeTitle(row.programme);
  if (programme.includes('slum upgrading')) {
    return {
      suggested: CONTRACT_FORMATS.SUD,
      format_key: 'SUD',
      source: 'housingandurban.go.ke MLPWHUD/SDHUD/SUD/{serial}/{FY}',
    };
  }

  if (programme.includes('kisip')) {
    return {
      suggested: CONTRACT_FORMATS.KISIP_CS,
      format_key: 'KISIP_CS',
      source: 'housingandurban.go.ke MLHUD/KISIP/CS/{serial}/{FY}',
    };
  }

  return {
    suggested: CONTRACT_FORMATS.SUD,
    format_key: 'SUD',
    source: 'housingandurban.go.ke default SUD format',
  };
}

function isTestProject(row) {
  const title = String(row.title || '').trim();
  if (!title || title.length <= 3) return true;
  if (TEST_TITLE_RE.test(title)) return true;
  if (TEST_TITLE_RE.test(String(row.project_code || ''))) return true;
  return false;
}

function buildAutoFlag(row, duplicateGroup) {
  const flags = [];
  if (duplicateGroup) flags.push('DUPLICATE');
  if (isPlaceholderCode(row.project_code)) flags.push('MISSING_PROJECT_CODE');
  if (looksLikeRandomCode(row.code)) flags.push('RANDOM_INTERNAL_CODE');
  if (!row.location_count && !row.activity_count && !row.report_count) {
    flags.push('NO_LINKED_DATA');
  }
  return flags.join(', ');
}

function isCompletedStatus(status) {
  return /^complete(d)?$/i.test(String(status || '').trim());
}

function linkedDataScore(row) {
  return (
    Number(row.reports ?? row.report_count ?? 0) * 100 +
    Number(row.activities ?? row.activity_count ?? 0) * 10 +
    Number(row.locations ?? row.location_count ?? 0)
  );
}

function statusRank(status) {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'completed' || value === 'complete') return 0;
  if (value === 'ongoing') return 1;
  if (value === 'planned') return 2;
  if (value === 'suspended') return 3;
  return 4;
}

function pickDuplicateWinner(groupRows) {
  const sorted = [...groupRows].sort((a, b) => {
    const aCompleted = isCompletedStatus(a.status);
    const bCompleted = isCompletedStatus(b.status);
    if (aCompleted !== bCompleted) return aCompleted ? -1 : 1;

    const scoreDiff = linkedDataScore(b) - linkedDataScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    const statusDiff = statusRank(a.status) - statusRank(b.status);
    if (statusDiff !== 0) return statusDiff;

    return Number(a.id) - Number(b.id);
  });

  const winner = sorted[0];
  const reason = isCompletedStatus(winner.status)
    ? 'kept_completed_duplicate'
    : 'kept_best_available_no_completed';

  return { winner, losers: sorted.slice(1), reason };
}

function toCleanRow(row, titleContractIndex, duplicatePeers = []) {
  const contract = resolveContractNumber(row, titleContractIndex, duplicatePeers);

  return {
    id: row.id,
    title: row.title,
    project_code: row.project_code || '',
    contract_no: contract.contract_no,
    contract_source: contract.contract_source,
    contract_format: contract.contract_format,
    status: row.status,
    component: row.component || '',
    programme: row.programme || '',
    start_date: row.start_date
      ? new Date(row.start_date).toISOString().slice(0, 10)
      : '',
    end_date: row.end_date
      ? new Date(row.end_date).toISOString().slice(0, 10)
      : '',
    locations: row.location_count ?? row.locations ?? 0,
    activities: row.activity_count ?? row.activities ?? 0,
    reports: row.report_count ?? row.reports ?? 0,
    notes: contract.notes,
    keep: 'Y',
  };
}

function buildCleanSheet(cleanupRows, titleContractIndex) {
  const cleanHeaders = [
    'id',
    'title',
    'project_code',
    'contract_no',
    'contract_source',
    'contract_format',
    'status',
    'component',
    'programme',
    'start_date',
    'end_date',
    'locations',
    'activities',
    'reports',
    'notes',
    'keep',
  ];

  const clean = [];
  const byDuplicateGroup = new Map();

  for (const row of cleanupRows) {
    if (!row.duplicate_group) {
      clean.push(toCleanRow(row, titleContractIndex));
      continue;
    }
    if (!byDuplicateGroup.has(row.duplicate_group)) {
      byDuplicateGroup.set(row.duplicate_group, []);
    }
    byDuplicateGroup.get(row.duplicate_group).push(row);
  }

  for (const [, groupRows] of byDuplicateGroup) {
    const { winner } = pickDuplicateWinner(groupRows);
    clean.push(toCleanRow(winner, titleContractIndex, groupRows));
  }

  clean.sort((a, b) => String(a.title).localeCompare(String(b.title)));

  return { clean, cleanHeaders };
}

function rowsToSheet(rows, headers) {
  const data = [
    headers,
    ...rows.map((row) => headers.map((key) => row[key] ?? '')),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

async function main() {
  const outputPath = path.resolve(process.argv[2] || OUTPUT_DEFAULT);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const client = new Client(DB);
  await client.connect();

  try {
    const { rows } = await client.query(`
      SELECT
        p.id,
        trim(regexp_replace(p.title, E'[\\n\\r]+', ' ', 'g')) AS title,
        p.project_code,
        p.code,
        p.status,
        c.title AS component,
        pi.title AS programme,
        p.start_date,
        p.end_date,
        COALESCE(loc.location_count, 0)::int AS location_count,
        COALESCE(act.activity_count, 0)::int AS activity_count,
        COALESCE(rep.report_count, 0)::int AS report_count
      FROM project p
      LEFT JOIN component c ON c.id = p.component_id
      LEFT JOIN programme_implementation pi ON pi.id = p.implementation_id
      LEFT JOIN (
        SELECT project_id, COUNT(*) AS location_count
        FROM project_location
        GROUP BY project_id
      ) loc ON loc.project_id = p.id
      LEFT JOIN (
        SELECT project_id, COUNT(*) AS activity_count
        FROM project_activity
        GROUP BY project_id
      ) act ON act.project_id = p.id
      LEFT JOIN (
        SELECT project_id, COUNT(*) AS report_count
        FROM indicator_category_report
        WHERE project_id IS NOT NULL
        GROUP BY project_id
      ) rep ON rep.project_id = p.id
      ORDER BY p.title, p.id
    `);

    const titleGroups = new Map();
    for (const row of rows) {
      const key = normalizeTitle(row.title);
      if (!titleGroups.has(key)) titleGroups.set(key, []);
      titleGroups.get(key).push(row.id);
    }

    const duplicateGroups = new Map();
    let groupNo = 1;
    for (const [, ids] of titleGroups) {
      if (ids.length > 1) {
        const label = `DUP-${String(groupNo).padStart(3, '0')}`;
        groupNo += 1;
        for (const id of ids) duplicateGroups.set(id, label);
      }
    }

    const titleContractIndex = buildTitleContractIndex(rows);

    const excluded = [];
    const cleanup = [];

    for (const row of rows) {
      const duplicateGroup = duplicateGroups.get(row.id) || '';

      if (isTestProject(row)) {
        excluded.push(row.id);
        continue;
      }

      cleanup.push({
        ...row,
        duplicate_group: duplicateGroup,
      });
    }

    const { clean, cleanHeaders } = buildCleanSheet(cleanup, titleContractIndex);

    const matched = clean.filter((row) => row.contract_source === 'exact_title_match').length;
    const duplicateMatched = clean.filter((row) => row.contract_source === 'duplicate_group_match').length;
    const existing = clean.filter((row) => row.contract_source === 'existing').length;
    const placeholders = clean.filter((row) => row.contract_source === 'format_placeholder').length;

    const meta = [
      ['Projects clean workbook — single working file'],
      [''],
      ['Exported at', new Date().toISOString()],
      ['Total projects', String(clean.length)],
      ['Test excluded', String(excluded.length)],
      ['Duplicate groups collapsed', String(groupNo - 1)],
      [''],
      ['contract_no sources'],
      ['existing', String(existing), 'Already had a reliable contract number in DB'],
      ['exact_title_match', String(matched), 'Copied from another project with the same title'],
      ['duplicate_group_match', String(duplicateMatched), 'Copied from a duplicate row in the same group'],
      ['format_placeholder', String(placeholders), 'Ministry format ending /TBD — fill in manually'],
      [''],
      ['Edit contract_no and notes on the projects sheet, then re-import later.'],
      ['Format reference', 'https://housingandurban.go.ke/tenders/tenders-2/'],
      [''],
      ['Placeholder formats'],
      ['SUD', CONTRACT_FORMATS.SUD],
      ['AHP', CONTRACT_FORMATS.AHP],
      ['UDD', CONTRACT_FORMATS.UDD],
      ['KISIP_CS', CONTRACT_FORMATS.KISIP_CS],
      ['KISIP_INF', CONTRACT_FORMATS.KISIP_INF],
      ['KISIP_MAPPING', CONTRACT_FORMATS.KISIP_MAPPING],
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(clean, cleanHeaders),
      'projects'
    );
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(meta), '_meta');

    XLSX.writeFile(workbook, outputPath);

    const legacyPath = path.join(process.cwd(), 'data', 'exports', 'projects-cleanup.xlsx');
    if (fs.existsSync(legacyPath) && legacyPath !== outputPath) {
      fs.unlinkSync(legacyPath);
    }

    console.log(`Wrote ${outputPath}`);
    console.log(`  projects:     ${clean.length}`);
    console.log(`  existing:     ${existing}`);
    console.log(`  title_match:  ${matched}`);
    console.log(`  dup_match:    ${duplicateMatched}`);
    console.log(`  placeholders: ${placeholders}`);
    console.log(`  test_excluded:${excluded.length}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
