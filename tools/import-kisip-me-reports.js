#!/usr/bin/env node
/**
 * Import KISIP M&E reports from tools/kisip-me-import.csv.
 *
 * Creates/updates indicator_category_report rows as Approved, and creates
 * missing project_location links for matched settlement + project pairs.
 *
 * Usage:
 *   node tools/import-kisip-me-reports.js [--apply] [csv-path]
 *
 * Default is dry-run. Pass --apply to commit.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const {
  bootstrapModulePaths,
  loadRepoEnv,
  getDB,
  REPO_ROOT,
} = require('./me-cleanup-import/me-cleanup-shared');
const {
  buildInfraProjectIndex,
  parseContractMeta,
} = require('./kisip-me-matching');
const { buildIndicatorReportFields } = require('../server/app/services/indicatorReportFields');

bootstrapModulePaths();
loadRepoEnv();
process.chdir(REPO_ROOT);

const DEFAULT_CSV = path.join(REPO_ROOT, 'tools/kisip-me-import.csv');
const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;
const csvPath = path.resolve(
  process.argv.find((arg) => arg.endsWith('.csv')) || DEFAULT_CSV,
);

const REPORT_DATE = new Date();
const PERIOD = 'Q4 FY 2025/2026';
const FISCAL_YEAR = '2025/2026';
const FILING_CODE = `KISIP-PDO-${REPORT_DATE.toISOString().slice(0, 10).replace(/-/g, '')}`;
const DEFAULT_PROGRAMME_IMPLEMENTATION_ID = 3;

/** CSV indicator prefix → indicator_category.id */
const INDICATOR_CATEGORY_BY_KEY = {
  roads_km: 15,
  drainage_km: 23,
  water_pipeline_km: 104,
  water_connections: 26,
  highmast_lights: 20,
  streetlights: 21,
  vending_platforms: 19,
  sewer_connections: 25,
  footpaths_km: 17,
};

const TITLES_CATEGORY_ID = 8;

const stats = {
  csv_rows: 0,
  skipped: 0,
  reports_upserted: 0,
  reports_created: 0,
  reports_updated: 0,
  targets_upserted: 0,
  project_locations_created: 0,
};

function log(msg) {
  console.log(msg);
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

function num(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isYes(value) {
  return String(value || 'Y').trim().toUpperCase() === 'Y';
}

function reportKey(projectId, settlementId, indicatorCategoryId) {
  return `${projectId}|${settlementId || ''}|${indicatorCategoryId}`;
}

function resolveImportProject(row, projects, infraIndex, counties) {
  const projectId = num(row.matched_project_id);
  if (!projectId) return null;

  const project = projects.get(projectId);
  if (!project) return null;

  if (row.source_type === 'pdo') {
    const title = String(project.title || '').toLowerCase();
    if (!title.includes('infrastructure upgrading')) {
      const meta = parseContractMeta(row.effective_contract || row.external_contract, row.external_county);
      const countyKey = String(row.external_county || '')
        .toLowerCase()
        .replace(/['’`]/g, '')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (meta.lot && countyKey) {
        const infra = infraIndex.byCountyLot.get(`${countyKey}|${meta.lot}`);
        if (infra) return infra;
      }
      const countyProjects = infraIndex.byCounty.get(countyKey) || [];
      if (countyProjects.length === 1) return countyProjects[0];
    }
  }

  return project;
}

function collectReportCandidates(rows) {
  const byKey = new Map();

  for (const row of rows) {
    stats.csv_rows += 1;
    if (!isYes(row.keep)) {
      stats.skipped += 1;
      continue;
    }

    const projectId = num(row.matched_project_id);
    const settlementId = num(row.matched_settlement_id);
    if (!projectId) {
      stats.skipped += 1;
      continue;
    }

    const comments = [
      `Imported from ${row.source_file || 'kisip-me-import.csv'}`,
      row.external_settlement ? `Settlement: ${row.external_settlement}` : null,
      row.external_county ? `County: ${row.external_county}` : null,
      row.effective_contract ? `Contract: ${row.effective_contract}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    if (row.source_type === 'comp11_titles') {
      const target = num(row.comp11_titles_expected);
      if (!settlementId || target == null) continue;
      mergeCandidate(byKey, {
        projectId,
        settlementId,
        countyId: num(row.matched_county_id),
        subcountyId: num(row.matched_subcounty_id),
        indicatorCategoryId: TITLES_CATEGORY_ID,
        planned: target,
        achieved: 0,
        comments: `${comments} | Comp 1.1 expected titles`,
        sourceType: row.source_type,
        effectiveContract: row.effective_contract || row.external_contract,
        externalContract: row.external_contract,
        externalCounty: row.external_county,
      });
      continue;
    }

    if (row.source_type !== 'pdo') continue;

    for (const key of Object.keys(INDICATOR_CATEGORY_BY_KEY)) {
      const planned = num(row[`${key}_planned`]);
      const achieved = num(row[`${key}_achieved`]);
      if (planned == null && achieved == null) continue;
      if ((planned ?? 0) === 0 && (achieved ?? 0) === 0) continue;

      mergeCandidate(byKey, {
        projectId,
        settlementId,
        countyId: num(row.matched_county_id),
        subcountyId: num(row.matched_subcounty_id),
        indicatorCategoryId: INDICATOR_CATEGORY_BY_KEY[key],
        planned: planned ?? 0,
        achieved: achieved ?? 0,
        comments,
        sourceType: row.source_type,
        effectiveContract: row.effective_contract || row.external_contract,
        externalContract: row.external_contract,
        externalCounty: row.external_county,
      });
    }
  }

  return [...byKey.values()];
}

function mergeCandidate(map, candidate) {
  const key = reportKey(
    candidate.projectId,
    candidate.settlementId,
    candidate.indicatorCategoryId,
  );
  const existing = map.get(key);
  if (!existing) {
    map.set(key, { ...candidate });
    return;
  }
  existing.planned = Math.max(existing.planned ?? 0, candidate.planned ?? 0);
  existing.achieved = Math.max(existing.achieved ?? 0, candidate.achieved ?? 0);
  if (!existing.settlementId && candidate.settlementId) {
    existing.settlementId = candidate.settlementId;
    existing.countyId = candidate.countyId;
    existing.subcountyId = candidate.subcountyId;
  }
}

async function ensureProjectLocation(client, projectId, settlementId, countyId, subcountyId) {
  const existing = await client.query(
    `
    SELECT id FROM project_location
    WHERE project_id = $1 AND settlement_id = $2
    LIMIT 1
    `,
    [projectId, settlementId],
  );
  if (existing.rows[0]?.id) return Number(existing.rows[0].id);

  if (DRY_RUN) {
    stats.project_locations_created += 1;
    return null;
  }

  const inserted = await client.query(
    `
    INSERT INTO project_location (
      project_id, settlement_id, county_id, subcounty_id,
      location_type, location_name, "createdAt", "updatedAt"
    )
    VALUES ($1, $2, $3, $4, 'settlement', $5, NOW(), NOW())
    RETURNING id
    `,
    [
      projectId,
      settlementId,
      countyId || null,
      subcountyId || null,
      `Imported for KISIP M&E (${settlementId})`,
    ],
  );
  stats.project_locations_created += 1;
  return Number(inserted.rows[0].id);
}

async function ensureIndicatorTarget(client, payload) {
  if (!payload.planned || payload.planned <= 0) return;

  if (DRY_RUN) {
    stats.targets_upserted += 1;
    return;
  }

  const updated = await client.query(
    `
    UPDATE indicator_target
    SET target_value = $4,
        target_kind = 'absolute',
        notes = $5,
        "updatedAt" = NOW()
    WHERE indicator_category_id = $1
      AND project_id = $2
      AND fiscal_year = $3
      AND scope_type = 'project'
      AND (
        ($6::int IS NULL AND project_location_id IS NULL)
        OR project_location_id = $6
      )
    `,
    [
      payload.indicatorCategoryId,
      payload.projectId,
      FISCAL_YEAR,
      payload.planned,
      `Imported planned value from KISIP PDO matrix (${PERIOD})`,
      payload.projectLocationId,
    ],
  );

  if (updated.rowCount) {
    stats.targets_upserted += 1;
    return;
  }

  await client.query(
    `
    INSERT INTO indicator_target (
      indicator_category_id, fiscal_year, scope_type, project_id,
      project_location_id, target_value, target_kind, notes, "createdAt", "updatedAt"
    )
    VALUES ($1, $2, 'project', $3, $4, $5, 'absolute', $6, NOW(), NOW())
    `,
    [
      payload.indicatorCategoryId,
      FISCAL_YEAR,
      payload.projectId,
      payload.projectLocationId,
      payload.planned,
      `Imported planned value from KISIP PDO matrix (${PERIOD})`,
    ],
  );
  stats.targets_upserted += 1;
}

async function upsertReport(client, payload, categoryMeta) {
  const meta = categoryMeta.get(payload.indicatorCategoryId) || {};
  const progressFields = buildIndicatorReportFields({
    cumAmount: payload.achieved,
    prevCumAmount: 0,
    target: payload.planned,
    targetKind: 'absolute',
    format: meta.format || '',
    qualitative: null,
  });
  if (!progressFields) return;

  const existing = await client.query(
    `
    SELECT id, status FROM indicator_category_report
    WHERE project_id = $1
      AND indicator_category_id = $2
      AND COALESCE(settlement_id, 0) = COALESCE($3::int, 0)
      AND COALESCE(LOWER(status), '') <> 'rejected'
    ORDER BY id DESC
    LIMIT 1
    `,
    [payload.projectId, payload.indicatorCategoryId, payload.settlementId],
  );

  const base = {
    indicator_category_id: payload.indicatorCategoryId,
    programme_implementation_id: payload.programmeImplementationId,
    project_id: payload.projectId,
    project_location_id: payload.projectLocationId,
    settlement_id: payload.settlementId,
    county_id: payload.countyId,
    subcounty_id: payload.subcountyId,
    activity_id: meta.activity_id || null,
    period: PERIOD,
    date: REPORT_DATE,
    target: progressFields.target ?? payload.planned ?? 0,
    amount: progressFields.amount,
    cumAmount: progressFields.cumAmount,
    progress: progressFields.progress,
    cumProgress: progressFields.cumProgress,
    qualitative: progressFields.qualitative,
    status: 'Approved',
    comments: payload.comments,
    code: FILING_CODE,
    reject_msg: null,
  };

  if (DRY_RUN) {
    stats.reports_upserted += 1;
    if (existing.rows[0]?.id) stats.reports_updated += 1;
    else stats.reports_created += 1;
    return;
  }

  if (existing.rows[0]?.id) {
    await client.query(
      `
      UPDATE indicator_category_report
      SET project_location_id = $2,
          settlement_id = $3,
          county_id = $4,
          subcounty_id = $5,
          activity_id = $6,
          period = $7,
          date = $8,
          target = $9,
          amount = $10,
          "cumAmount" = $11,
          progress = $12,
          "cumProgress" = $13,
          qualitative = $14,
          status = 'Approved',
          comments = $15,
          code = $16,
          reject_msg = NULL,
          "updatedAt" = NOW()
      WHERE id = $1
      `,
      [
        existing.rows[0].id,
        base.project_location_id,
        base.settlement_id,
        base.county_id,
        base.subcounty_id,
        base.activity_id,
        base.period,
        base.date,
        base.target,
        base.amount,
        base.cumAmount,
        base.progress,
        base.cumProgress,
        base.qualitative,
        base.comments,
        base.code,
      ],
    );
    stats.reports_updated += 1;
  } else {
    await client.query(
      `
      INSERT INTO indicator_category_report (
        indicator_category_id, programme_implementation_id, project_id,
        project_location_id, settlement_id, county_id, subcounty_id, activity_id,
        period, date, target, amount, progress, "cumProgress", "cumAmount",
        qualitative, status, comments, code, "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15,
        $16, 'Approved', $17, $18, NOW(), NOW()
      )
      `,
      [
        base.indicator_category_id,
        base.programme_implementation_id,
        base.project_id,
        base.project_location_id,
        base.settlement_id,
        base.county_id,
        base.subcounty_id,
        base.activity_id,
        base.period,
        base.date,
        base.target,
        base.amount,
        base.progress,
        base.cumProgress,
        base.cumAmount,
        base.qualitative,
        base.comments,
        base.code,
      ],
    );
    stats.reports_created += 1;
  }
  stats.reports_upserted += 1;
}

async function loadCategoryMeta(client) {
  const ids = [...new Set([...Object.values(INDICATOR_CATEGORY_BY_KEY), TITLES_CATEGORY_ID])];
  const result = await client.query(
    `
    SELECT ic.id, ic.activity_id, i.format, i.unit
    FROM indicator_category ic
    LEFT JOIN indicator i ON i.id = ic.indicator_id
    WHERE ic.id = ANY($1::int[])
    `,
    [ids],
  );
  return new Map(result.rows.map((row) => [Number(row.id), row]));
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  log(`${DRY_RUN ? 'DRY RUN' : 'APPLY'} — ${csvPath}`);
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const candidates = collectReportCandidates(rows);
  log(`  Report candidates after merge: ${candidates.length}`);

  const client = new Client(getDB());
  await client.connect();

  try {
    const [projectsRes, countiesRes, settlementsRes] = await Promise.all([
      client.query('SELECT id, title, implementation_id FROM project'),
      client.query('SELECT id, name FROM county'),
      client.query('SELECT id, county_id, subcounty_id FROM settlement'),
    ]);

    const projects = new Map(projectsRes.rows.map((p) => [Number(p.id), p]));
    const settlements = new Map(settlementsRes.rows.map((s) => [Number(s.id), s]));
    const infraIndex = buildInfraProjectIndex(projectsRes.rows);
    const categoryMeta = await loadCategoryMeta(client);

    if (!DRY_RUN) await client.query('BEGIN');

    for (const candidate of candidates) {
      const resolvedProject = resolveImportProject(
        {
          source_type: candidate.sourceType,
          matched_project_id: candidate.projectId,
          effective_contract: candidate.effectiveContract,
          external_contract: candidate.externalContract,
          external_county: candidate.externalCounty,
        },
        projects,
        infraIndex,
        countiesRes.rows,
      );
      const project = resolvedProject || projects.get(candidate.projectId);
      if (!project) continue;

      candidate.projectId = Number(project.id);
      candidate.programmeImplementationId =
        Number(project.implementation_id) || DEFAULT_PROGRAMME_IMPLEMENTATION_ID;

      if (candidate.settlementId) {
        const settlement = settlements.get(candidate.settlementId);
        if (settlement) {
          candidate.countyId = candidate.countyId || settlement.county_id;
          candidate.subcountyId = candidate.subcountyId || settlement.subcounty_id;
        }
        candidate.projectLocationId = await ensureProjectLocation(
          client,
          candidate.projectId,
          candidate.settlementId,
          candidate.countyId,
          candidate.subcountyId,
        );
      }

      await ensureIndicatorTarget(client, candidate);
      await upsertReport(client, candidate, categoryMeta);
    }

    if (!DRY_RUN) await client.query('COMMIT');

    log('\nDone.');
    log(`  CSV rows read: ${stats.csv_rows}`);
    log(`  Skipped rows: ${stats.skipped}`);
    log(`  Reports upserted: ${stats.reports_upserted}`);
    log(`    created: ${stats.reports_created}`);
    log(`    updated: ${stats.reports_updated}`);
    log(`  Indicator targets upserted: ${stats.targets_upserted}`);
    log(`  Project locations created: ${stats.project_locations_created}`);
    log(`  Filing code: ${FILING_CODE}`);
    if (DRY_RUN) log('\nRe-run with --apply to commit.');
  } catch (err) {
    if (!DRY_RUN) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr.message);
      }
    }
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
