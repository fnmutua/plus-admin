'use strict';

/**
 * Shared M&E reporting primitives — single source of truth for targets and achievements.
 *
 * Data model (all filing paths converge here):
 *   indicator_target           — annual targets (programme COB scope + per-project scope)
 *   indicator_category_report  — quarterly / in-app filings (amount + cumAmount + status)
 *
 * In-app ProjectDetails, indicator_category_report admin, and regional report approval
 * all write to indicator_category_report. Regional reports read baselines from the same
 * table and project targets from indicator_target.
 */

const db = require('../models');
const { QueryTypes } = db.Sequelize;

const DEFAULT_FISCAL_YEAR = '2025/2026';
const COB_DELIVERY_UNIT = 'Slum Upgrading';

/** SQL fragment: reports that count as current baseline (not rejected). */
function baselineStatusSql(alias = 'r') {
  return `COALESCE(LOWER(${alias}.status), '') <> 'rejected'`;
}

function parseNum(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function parseAmount(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

/** Resolve stored target_value (handles percent + portfolio_denominator rows). */
function resolveTargetValue(row) {
  if (!row) return 0;
  const raw = parseNum(row.target_value);
  if (String(row.target_kind || '').toLowerCase() === 'percent' && row.portfolio_denominator != null) {
    return (parseNum(row.portfolio_denominator) * raw) / 100;
  }
  return raw;
}

/**
 * Programme-level target from indicator_target (COB / M&E import).
 * Used for portfolio / dashboard target vs achieved.
 */
async function loadProgrammeTarget(
  categoryId,
  fiscalYear = DEFAULT_FISCAL_YEAR,
  deliveryUnit = COB_DELIVERY_UNIT,
) {
  const rows = await db.sequelize.query(
    `
      SELECT target_value, target_kind, portfolio_denominator
      FROM indicator_target
      WHERE indicator_category_id = :categoryId
        AND scope_type = 'programme'
        AND fiscal_year = :fiscalYear
      ORDER BY
        CASE WHEN delivery_unit ILIKE :deliveryUnitPattern THEN 0 ELSE 1 END,
        id ASC
      LIMIT 1
    `,
    {
      replacements: {
        categoryId,
        fiscalYear,
        deliveryUnitPattern: `%${deliveryUnit}%`,
      },
      type: QueryTypes.SELECT,
    },
  );
  return resolveTargetValue(rows[0]);
}

/**
 * Per-project targets for a fiscal year (regional report form + approval).
 * scope_type = 'project' in indicator_target.
 */
async function loadProjectTargetsForProject(
  projectId,
  indicatorCategoryIds,
  fiscalYear,
  projectLocationId,
  transaction,
) {
  const ids = [...new Set(indicatorCategoryIds.map((id) => Number(id)).filter(Number.isFinite))];
  if (!ids.length) return new Map();

  const targets = await db.models.indicator_target.findAll({
    where: {
      project_id: Number(projectId),
      indicator_category_id: { [db.Sequelize.Op.in]: ids },
      fiscal_year: fiscalYear,
      scope_type: 'project',
    },
    order: [['id', 'DESC']],
    transaction,
  });

  const locId = projectLocationId != null ? Number(projectLocationId) : null;
  const byIndicator = new Map();
  for (const row of targets) {
    const icId = Number(row.indicator_category_id);
    if (byIndicator.has(icId)) continue;

    const rowLocId = row.project_location_id != null ? Number(row.project_location_id) : null;
    if (locId && rowLocId && rowLocId !== locId) continue;

    byIndicator.set(icId, {
      target: parseAmount(row.target_value),
      targetKind: String(row.target_kind || 'absolute'),
    });
  }
  return byIndicator;
}

/**
 * Latest cumulative achievement per indicator for one project (regional report baseline).
 * Matches validation rules: non-rejected reports only; prefers cumAmount over amount.
 */
async function loadLatestCumulativeByIndicator(
  projectId,
  indicatorCategoryIds,
  projectLocationId,
  transaction,
  excludeFilingCode = null,
) {
  const ids = [...new Set(indicatorCategoryIds.map((id) => Number(id)).filter(Number.isFinite))];
  if (!ids.length) return new Map();

  const excludeCode = excludeFilingCode ? String(excludeFilingCode) : null;
  const locId = projectLocationId != null ? Number(projectLocationId) : null;
  const statusSql = baselineStatusSql('r');

  const rows = await db.sequelize.query(
    `
      SELECT DISTINCT ON (r.indicator_category_id)
        r.indicator_category_id,
        COALESCE(r."cumAmount", r.amount, 0) AS cum_amount,
        COALESCE(r.amount, 0) AS amount,
        r.target,
        r.qualitative
      FROM indicator_category_report r
      WHERE r.project_id = :projectId
        AND r.indicator_category_id IN (:indicatorCategoryIds)
        AND ${statusSql}
        ${excludeCode ? "AND COALESCE(r.code, '') <> :excludeCode" : ''}
        ${locId ? 'AND (r.project_location_id = :locId OR r.project_location_id IS NULL)' : ''}
      ORDER BY r.indicator_category_id, r.id DESC
    `,
    {
      replacements: {
        projectId: Number(projectId),
        indicatorCategoryIds: ids,
        ...(excludeCode ? { excludeCode } : {}),
        ...(locId ? { locId } : {}),
      },
      type: QueryTypes.SELECT,
      ...(transaction ? { transaction } : {}),
    },
  );

  const byIndicator = new Map();
  for (const row of rows) {
    byIndicator.set(Number(row.indicator_category_id), {
      cumAmount: parseAmount(row.cum_amount) ?? 0,
      amount: parseAmount(row.amount) ?? 0,
      target: row.target != null ? parseAmount(row.target) : null,
      qualitative: row.qualitative,
    });
  }
  return byIndicator;
}

function buildLocationSql(location, tableAlias = 'icr') {
  const parts = [];
  const countyIds = location?.countyIds || [];
  const subcountyIds = location?.subcountyIds || [];
  const wardIds = location?.wardIds || [];

  if (wardIds.length) {
    parts.push(`${tableAlias}.ward_id IN (${wardIds.join(', ')})`);
  } else if (subcountyIds.length) {
    parts.push(`${tableAlias}.subcounty_id IN (${subcountyIds.join(', ')})`);
  } else if (countyIds.length) {
    parts.push(`${tableAlias}.county_id IN (${countyIds.join(', ')})`);
  }

  return parts.length ? `AND ${parts.join(' AND ')}` : '';
}

function buildProjectTargetLocationSql(location) {
  const countyIds = location?.countyIds || [];
  const subcountyIds = location?.subcountyIds || [];
  const wardIds = location?.wardIds || [];
  if (wardIds.length) {
    return `AND pl.ward_id IN (${wardIds.join(', ')})`;
  }
  if (subcountyIds.length) {
    return `AND pl.subcounty_id IN (${subcountyIds.join(', ')})`;
  }
  if (countyIds.length) {
    return `AND pl.county_id IN (${countyIds.join(', ')})`;
  }
  return '';
}

/**
 * Sum project-scoped unit targets (one row per project, latest fiscal year).
 * Used for housing — targets come from each project's indicator_target row.
 */
async function sumProjectTargets(categoryId, location = {}, transaction) {
  const needsJoin = buildProjectTargetLocationSql(location).length > 0;
  const locSql = buildProjectTargetLocationSql(location);

  const rows = await db.sequelize.query(
    `
      SELECT COALESCE(SUM(sub.target_value), 0)::numeric AS total
      FROM (
        SELECT DISTINCT ON (it.project_id)
          it.target_value::numeric AS target_value
        FROM indicator_target it
        ${needsJoin ? 'JOIN project_location pl ON pl.project_id = it.project_id' : ''}
        WHERE it.indicator_category_id = :categoryId
          AND it.scope_type = 'project'
          ${locSql}
        ORDER BY it.project_id, it.fiscal_year DESC, it.id DESC
      ) sub
    `,
    {
      replacements: { categoryId },
      type: QueryTypes.SELECT,
      ...(transaction ? { transaction } : {}),
    },
  );
  return parseNum(rows[0]?.total);
}

/**
 * National / portfolio achieved total for one indicator category.
 * Sums latest cumulative per (project_id, project_location_id) — same baseline concept
 * as loadLatestCumulativeByIndicator, rolled up across all projects.
 */
async function sumCategoryAchieved(categoryId, location = {}, transaction) {
  const locSql = buildLocationSql(location, 'icr');
  const statusSql = baselineStatusSql('icr');

  const rows = await db.sequelize.query(
    `
      SELECT COALESCE(SUM(latest.cum), 0)::numeric AS achieved
      FROM (
        SELECT DISTINCT ON (icr.project_id, COALESCE(icr.project_location_id, 0))
          COALESCE(icr."cumAmount", icr.amount, 0)::numeric AS cum
        FROM indicator_category_report icr
        WHERE icr.indicator_category_id = :categoryId
          AND ${statusSql}
          ${locSql}
        ORDER BY icr.project_id, COALESCE(icr.project_location_id, 0), icr.id DESC
      ) latest
    `,
    {
      replacements: { categoryId },
      type: QueryTypes.SELECT,
      ...(transaction ? { transaction } : {}),
    },
  );
  return parseNum(rows[0]?.achieved);
}

/** Parse dashboard chart filter objects into county / subcounty / ward id lists. */
function parseDashboardLocationFilters(filters) {
  const location = { countyIds: [], subcountyIds: [], wardIds: [] };
  if (!Array.isArray(filters)) return location;

  for (const item of filters) {
    if (!item?.field || !item?.operation) continue;
    const bare = String(item.field).split('.').pop();
    const vals = (Array.isArray(item.value) ? item.value : [item.value])
      .map((v) => parseInt(v, 10))
      .filter((v) => Number.isFinite(v));
    if (!vals.length) continue;

    if (bare === 'county_id' && ['eq', 'in', 'or'].includes(item.operation)) {
      location.countyIds.push(...vals);
    } else if (bare === 'subcounty_id' && ['eq', 'in', 'or'].includes(item.operation)) {
      location.subcountyIds.push(...vals);
    } else if (bare === 'ward_id' && ['eq', 'in', 'or'].includes(item.operation)) {
      location.wardIds.push(...vals);
    }
  }

  location.countyIds = [...new Set(location.countyIds)];
  location.subcountyIds = [...new Set(location.subcountyIds)];
  location.wardIds = [...new Set(location.wardIds)];
  return location;
}

module.exports = {
  DEFAULT_FISCAL_YEAR,
  COB_DELIVERY_UNIT,
  baselineStatusSql,
  parseNum,
  parseAmount,
  resolveTargetValue,
  loadProgrammeTarget,
  sumProjectTargets,
  loadProjectTargetsForProject,
  loadLatestCumulativeByIndicator,
  sumCategoryAchieved,
  parseDashboardLocationFilters,
  buildLocationSql,
};
