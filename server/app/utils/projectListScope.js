const db = require('../models');
const { Op } = require('sequelize');
const { literal } = require('sequelize');
const { activeGrantWhere } = require('./userRoleExpiry');

const BYPASS_ROLE_NAMES = new Set(['root_admin', 'super_admin']);

function uniqueInts(values) {
  return Array.from(
    new Set((Array.isArray(values) ? values : []).map((v) => Number(v)).filter((n) => Number.isFinite(n)))
  );
}

/**
 * Expand programme IDs to include all descendants in programmex hierarchy.
 */
async function expandProgrammeIds(rawIds) {
  const parsed = uniqueInts(rawIds);
  if (!parsed.length) return [];

  const rows = await db.sequelize.query(`SELECT id, "parentId" FROM programmex`, {
    type: db.sequelize.QueryTypes.SELECT,
    mapToModel: false,
  });

  const childrenByParent = new Map();
  for (const row of rows) {
    const id = parseInt(row.id, 10);
    const parentRaw = row.parentId;
    if (parentRaw != null && parentRaw !== '') {
      const parentId = parseInt(parentRaw, 10);
      if (!isNaN(parentId)) {
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push(id);
      }
    }
  }

  const expanded = new Set();
  const walk = (id) => {
    if (expanded.has(id)) return;
    expanded.add(id);
    for (const childId of childrenByParent.get(id) || []) walk(childId);
  };
  for (const id of parsed) walk(id);
  return [...expanded];
}

/**
 * Resolve programme/project visibility for a user from role assignments.
 *
 * Rules:
 * - root_admin / super_admin → bypass (see all)
 * - Role with no role_programme_access rows → unrestricted for that role
 * - If any active role is unrestricted → bypass
 * - Otherwise union programme IDs from restricted roles (expanded to descendants)
 * - County / settlement IDs from user_roles further limit project visibility
 */
async function getProjectProgrammeScope(userId) {
  if (!userId) {
    return {
      bypass: false,
      scopeEnabled: true,
      programmeIds: [],
      expandedProgrammeIds: [],
      countyIds: [],
      settlementIds: [],
    };
  }

  const assignments = await db.models.user_roles.findAll({
    where: { userid: userId, ...activeGrantWhere() },
    include: [{ model: db.role, attributes: ['id', 'name'] }],
  });

  const roleIds = uniqueInts(
    assignments.map((row) => row.roleid || row.role?.id).filter(Boolean)
  );

  if (
    assignments.some((row) => row.role && BYPASS_ROLE_NAMES.has(row.role.name))
  ) {
    return {
      bypass: true,
      scopeEnabled: false,
      programmeIds: [],
      expandedProgrammeIds: [],
      countyIds: [],
      settlementIds: [],
    };
  }

  const countyIds = uniqueInts(
    assignments
      .filter((row) => row.location_level === 'county' && row.county_id != null)
      .map((row) => row.county_id)
  );
  const settlementIds = uniqueInts(
    assignments
      .filter((row) => row.location_level === 'settlement' && row.settlement_id != null)
      .map((row) => row.settlement_id)
  );

  if (!roleIds.length) {
    return {
      bypass: true,
      scopeEnabled: false,
      programmeIds: [],
      expandedProgrammeIds: [],
      countyIds,
      settlementIds,
    };
  }

  const accessRows = await db.models.role_programme_access.findAll({
    where: { role_id: { [Op.in]: roleIds } },
    attributes: ['role_id', 'programme_id'],
    raw: true,
  });

  const rolesWithMeta = await db.role.findAll({
    where: { id: { [Op.in]: roleIds } },
    attributes: ['id', 'programme_scope_limited'],
    raw: true,
  });
  const limitedByRole = new Map(
    rolesWithMeta.map((row) => [Number(row.id), row.programme_scope_limited === true])
  );

  const programmesByRole = new Map();
  for (const row of accessRows) {
    const roleId = Number(row.role_id);
    if (!programmesByRole.has(roleId)) programmesByRole.set(roleId, []);
    programmesByRole.get(roleId).push(Number(row.programme_id));
  }

  let hasUnrestrictedRole = false;
  let hasLimitedRoleWithNoProgrammes = false;
  const programmeIds = new Set();

  for (const roleId of roleIds) {
    const isLimited = limitedByRole.get(roleId) === true;
    const ids = programmesByRole.get(roleId) || [];

    if (!isLimited) {
      hasUnrestrictedRole = true;
      break;
    }

    if (ids.length === 0) {
      hasLimitedRoleWithNoProgrammes = true;
      continue;
    }

    ids.forEach((id) => programmeIds.add(id));
  }

  if (hasUnrestrictedRole) {
    return {
      bypass: true,
      scopeEnabled: false,
      programmeIds: [],
      expandedProgrammeIds: [],
      countyIds,
      settlementIds,
    };
  }

  const baseProgrammeIds = [...programmeIds];
  const expandedProgrammeIds = baseProgrammeIds.length
    ? await expandProgrammeIds(baseProgrammeIds)
    : [];

  return {
    bypass: false,
    scopeEnabled: true,
    programmeIds: baseProgrammeIds,
    expandedProgrammeIds,
    countyIds,
    settlementIds,
    blocked: hasLimitedRoleWithNoProgrammes && baseProgrammeIds.length === 0,
  };
}

function mergeWhere(baseQuery, extraCondition) {
  const existing = baseQuery.where || {};
  if (!existing || Object.keys(existing).length === 0) {
    baseQuery.where = extraCondition;
    return;
  }
  baseQuery.where = { [Op.and]: [existing, extraCondition] };
}

function buildProjectProgrammeLiteral(tableName, programmeIds) {
  const ids = uniqueInts(programmeIds);
  if (!ids.length) {
    return literal('1 = 0');
  }
  return literal(
    `EXISTS (SELECT 1 FROM component c WHERE c.id = "${tableName}".component_id AND c.programme_id IN (${ids.join(', ')}))`
  );
}

function buildProjectCountyLiteral(tableName, countyIds) {
  const ids = uniqueInts(countyIds);
  if (!ids.length) return null;
  const parts = ids.map(
    (countyId) =>
      literal(
        `EXISTS (SELECT 1 FROM project_location pl WHERE pl.project_id = "${tableName}".id AND pl.county_id = ${countyId})`
      )
  );
  return parts.length === 1 ? parts[0] : { [Op.or]: parts };
}

function buildProjectSettlementLiteral(tableName, settlementIds) {
  const ids = uniqueInts(settlementIds);
  if (!ids.length) return null;
  const parts = ids.map(
    (settlementId) =>
      literal(
        `EXISTS (SELECT 1 FROM project_location pl WHERE pl.project_id = "${tableName}".id AND pl.settlement_id = ${settlementId})`
      )
  );
  return parts.length === 1 ? parts[0] : { [Op.or]: parts };
}

async function applyProgrammeProjectScopeToQuery(baseQuery, modelName, Model, userId) {
  const scope = await getProjectProgrammeScope(userId);
  if (scope.bypass) return scope;

  if (scope.blocked || (scope.scopeEnabled && !scope.expandedProgrammeIds.length)) {
    if (modelName === 'programme' || modelName === 'component' || modelName === 'project') {
      mergeWhere(baseQuery, literal('1 = 0'));
    }
    return scope;
  }

  const tableName = Model.tableName;

  if (modelName === 'programme') {
    if (!scope.expandedProgrammeIds.length) {
      baseQuery.where = { id: { [Op.in]: [] } };
      return scope;
    }
    mergeWhere(baseQuery, { id: { [Op.in]: scope.expandedProgrammeIds } });
    return scope;
  }

  if (modelName === 'component') {
    if (!scope.expandedProgrammeIds.length) {
      baseQuery.where = { id: { [Op.in]: [] } };
      return scope;
    }
    mergeWhere(baseQuery, { programme_id: { [Op.in]: scope.expandedProgrammeIds } });
    return scope;
  }

  if (modelName === 'project') {
    const conditions = [];

    if (scope.expandedProgrammeIds.length) {
      conditions.push(buildProjectProgrammeLiteral(tableName, scope.expandedProgrammeIds));
    } else if (scope.scopeEnabled) {
      conditions.push(literal('1 = 0'));
    }

    const countyCondition = buildProjectCountyLiteral(tableName, scope.countyIds);
    if (countyCondition) conditions.push(countyCondition);

    const settlementCondition = buildProjectSettlementLiteral(tableName, scope.settlementIds);
    if (settlementCondition) conditions.push(settlementCondition);

    if (conditions.length) {
      mergeWhere(baseQuery, { [Op.and]: conditions });
    }
  }

  return scope;
}

function buildOptimizedScopeSql(scope, modelName) {
  if (scope.bypass) return '';

  const parts = [];

  if (scope.expandedProgrammeIds.length) {
    const ids = scope.expandedProgrammeIds.join(', ');
    if (modelName === 'project_location' || modelName === 'project') {
      parts.push(
        `project_id IN (SELECT p.id FROM project p INNER JOIN component c ON p.component_id = c.id WHERE c.programme_id IN (${ids}))`
      );
    }
  } else if (scope.scopeEnabled) {
    parts.push('1 = 0');
  }

  if (modelName === 'project_location' || modelName === 'project') {
    if (scope.countyIds.length) {
      parts.push(`county_id IN (${scope.countyIds.join(', ')})`);
    }
    if (scope.settlementIds.length) {
      parts.push(`settlement_id IN (${scope.settlementIds.join(', ')})`);
    }
  }

  return parts.length ? parts.join(' AND ') : '';
}

module.exports = {
  expandProgrammeIds,
  getProjectProgrammeScope,
  applyProgrammeProjectScopeToQuery,
  buildOptimizedScopeSql,
};
