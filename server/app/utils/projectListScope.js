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

function resolveLocationScopeFromAssignments(assignments) {
  const hasNationalLocation = (assignments || []).some(
    (row) => row.location_level === 'national' || row.location_level == null
  );

  if (hasNationalLocation) {
    return { isNationalLocation: true, countyIds: [], settlementIds: [] };
  }

  return {
    isNationalLocation: false,
    countyIds: uniqueInts(
      (assignments || [])
        .filter((row) => row.location_level === 'county' && row.county_id != null)
        .map((row) => row.county_id)
    ),
    settlementIds: uniqueInts(
      (assignments || [])
        .filter((row) => row.location_level === 'settlement' && row.settlement_id != null)
        .map((row) => row.settlement_id)
    ),
  };
}

function scopeLocationFields(assignments) {
  return resolveLocationScopeFromAssignments(assignments);
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

const SUD_PROGRAMME_PATTERN =
  /\bsud\b|slum upgrading|slum upgr|sdhud|mlhud\/sdhud|state department for housing/i;
const KISIP_PROGRAMME_PATTERN =
  /\bkisip\b|informal settlement improvement|informal settlements improvement/i;

function programmeSearchText(row) {
  return `${row?.title || ''} ${row?.acronym || ''} ${row?.code || ''}`.trim();
}

function classifyProgrammeFamilyFromText(text, directText) {
  const isSud = SUD_PROGRAMME_PATTERN.test(text);
  const isKisip = KISIP_PROGRAMME_PATTERN.test(text);
  if (isSud && !isKisip) return 'SUD';
  if (isKisip && !isSud) return 'KISIP';
  if (isSud && isKisip) {
    if (KISIP_PROGRAMME_PATTERN.test(directText || '')) return 'KISIP';
    if (SUD_PROGRAMME_PATTERN.test(directText || '')) return 'SUD';
  }
  return null;
}

/**
 * Resolve all programme IDs belonging to the SUD or KISIP family
 * (any node whose ancestor chain classifies as that family).
 * Used by the public project map filter.
 */
async function resolveProgrammeFamilyIds(family) {
  const key = String(family || '')
    .trim()
    .toLowerCase();
  if (key !== 'sud' && key !== 'kisip') return [];

  const rows = await db.sequelize.query(
    `SELECT id, title, acronym, code, "parentId" FROM programmex`,
    {
      type: db.sequelize.QueryTypes.SELECT,
      mapToModel: false,
    }
  );

  const byId = new Map();
  for (const row of rows) {
    const id = parseInt(row.id, 10);
    if (!isNaN(id)) byId.set(id, row);
  }

  const collectChainText = (startId) => {
    const parts = [];
    let direct = '';
    const visited = new Set();
    let id = startId;
    while (id != null && !visited.has(id)) {
      visited.add(id);
      const node = byId.get(id);
      if (!node) break;
      const text = programmeSearchText(node);
      if (!direct) direct = text;
      parts.push(text);
      const parentRaw = node.parentId;
      id =
        parentRaw != null && parentRaw !== ''
          ? parseInt(parentRaw, 10)
          : null;
      if (id != null && isNaN(id)) id = null;
    }
    return { text: parts.join(' '), direct };
  };

  const target = key === 'sud' ? 'SUD' : 'KISIP';
  const matchingIds = [];
  for (const [id] of byId) {
    const { text, direct } = collectChainText(id);
    if (classifyProgrammeFamilyFromText(text, direct) === target) {
      matchingIds.push(id);
    }
  }
  return matchingIds;
}

/**
 * Classify a single programme id as SUD / KISIP by walking its parent chain.
 */
async function classifyProgrammeFamily(programmeId) {
  const id = parseInt(programmeId, 10);
  if (!programmeId || isNaN(id)) return null;

  const rows = await db.sequelize.query(
    `WITH RECURSIVE chain AS (
       SELECT id, title, acronym, code, "parentId", 0 AS depth
       FROM programmex
       WHERE id = :id
       UNION ALL
       SELECT p.id, p.title, p.acronym, p.code, p."parentId", c.depth + 1
       FROM programmex p
       INNER JOIN chain c ON p.id = c."parentId"
       WHERE c.depth < 20
     )
     SELECT id, title, acronym, code FROM chain ORDER BY depth ASC`,
    {
      replacements: { id },
      type: db.sequelize.QueryTypes.SELECT,
      mapToModel: false,
    }
  );

  if (!rows.length) return null;
  const direct = programmeSearchText(rows[0]);
  const text = rows.map(programmeSearchText).join(' ');
  return classifyProgrammeFamilyFromText(text, direct);
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
      isNationalLocation: false,
    };
  }

  const assignments = await db.models.user_roles.findAll({
    where: { userid: userId, ...activeGrantWhere() },
    include: [{ model: db.role, attributes: ['id', 'name'] }],
  });

  const { isNationalLocation, countyIds, settlementIds } = scopeLocationFields(assignments);

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
      isNationalLocation: true,
    };
  }

  if (!roleIds.length) {
    return {
      bypass: true,
      scopeEnabled: false,
      programmeIds: [],
      expandedProgrammeIds: [],
      countyIds,
      settlementIds,
      isNationalLocation,
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
      countyIds: [],
      settlementIds: [],
      isNationalLocation: true,
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
    isNationalLocation,
    blocked: hasLimitedRoleWithNoProgrammes && baseProgrammeIds.length === 0,
  };
}

function isEmptyWhere(where) {
  if (!where || typeof where !== 'object') return true;
  return Object.keys(where).length === 0 && Object.getOwnPropertySymbols(where).length === 0;
}

function mergeWhere(baseQuery, extraCondition) {
  const existing = baseQuery.where || {};
  if (isEmptyWhere(existing)) {
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

function buildProjectCountyInLocationLiteral(tableName, countyId) {
  return literal(
    `EXISTS (
      SELECT 1 FROM project_location pl
      WHERE pl.project_id = "${tableName}".id
      AND (
        pl.county_id = ${countyId}
        OR pl.settlement_id IN (SELECT id FROM settlement WHERE county_id = ${countyId})
        OR pl.subcounty_id IN (SELECT id FROM subcounty WHERE county_id = ${countyId})
        OR pl.ward_id IN (
          SELECT w.id FROM ward w
          INNER JOIN subcounty sc ON sc.id = w.subcounty_id
          WHERE sc.county_id = ${countyId}
        )
      )
    )`
  );
}

function buildProjectCountyLiteral(tableName, countyIds) {
  const ids = uniqueInts(countyIds);
  if (!ids.length) return null;
  const parts = ids.map((countyId) => buildProjectCountyInLocationLiteral(tableName, countyId));
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

function buildProjectCreatedByLiteral(tableName, userId) {
  const uid = parseInt(userId, 10);
  if (!Number.isFinite(uid)) return null;
  return literal(`"${tableName}"."createdBy" = ${uid}`);
}

function buildProjectWithoutLocationCreatedByLiteral(tableName, userId) {
  const uid = parseInt(userId, 10);
  if (!Number.isFinite(uid)) return null;
  return literal(
    `(NOT EXISTS (SELECT 1 FROM project_location pl0 WHERE pl0.project_id = "${tableName}".id) AND "${tableName}"."createdBy" = ${uid})`
  );
}

function combineLocationScopeOrCreator(locationCondition, tableName, userId) {
  if (!locationCondition) return null;
  const creatorCondition = buildProjectCreatedByLiteral(tableName, userId);
  if (!creatorCondition) return locationCondition;
  return { [Op.or]: [locationCondition, creatorCondition] };
}

function shouldUseCreatorLocationFallback(scope) {
  if (!scope || scope.bypass || scope.isNationalLocation) return false;
  return scope.countyIds.length > 0 || scope.settlementIds.length > 0;
}

function buildProjectCountyVisibilityCondition(tableName, countyIds, userId) {
  const countyCondition = buildProjectCountyLiteral(tableName, countyIds);
  if (!countyCondition) return null;
  return combineLocationScopeOrCreator(countyCondition, tableName, userId);
}

function buildProjectSettlementVisibilityCondition(tableName, settlementIds, userId) {
  const settlementCondition = buildProjectSettlementLiteral(tableName, settlementIds);
  if (!settlementCondition) return null;
  return combineLocationScopeOrCreator(settlementCondition, tableName, userId);
}

function buildProjectCountyExistsLiteral(tableName, countyIds, userId, options = {}) {
  const { creatorFallback = false } = options;
  const ids = uniqueInts(countyIds);
  if (!ids.length) return null;
  const matchParts = ids.map((countyId) => buildProjectCountyInLocationLiteral(tableName, countyId));
  const locationMatch = matchParts.length === 1 ? matchParts[0] : { [Op.or]: matchParts };
  if (creatorFallback) {
    return combineLocationScopeOrCreator(locationMatch, tableName, userId);
  }
  return locationMatch;
}

function buildProjectSettlementExistsLiteral(tableName, settlementIds, userId, options = {}) {
  const { creatorFallback = false } = options;
  const ids = uniqueInts(settlementIds);
  if (!ids.length) return null;
  const matchParts = ids.map(
    (settlementId) =>
      literal(
        `EXISTS (SELECT 1 FROM project_location pl WHERE pl.project_id = "${tableName}".id AND pl.settlement_id = ${settlementId})`
      )
  );
  const locationMatch = matchParts.length === 1 ? matchParts[0] : { [Op.or]: matchParts };
  if (creatorFallback) {
    return combineLocationScopeOrCreator(locationMatch, tableName, userId);
  }
  return locationMatch;
}

function buildProjectSubcountyInLocationLiteral(tableName, subcountyId) {
  return literal(
    `EXISTS (
      SELECT 1 FROM project_location pl
      WHERE pl.project_id = "${tableName}".id
      AND COALESCE(
        pl.subcounty_id,
        (SELECT w.subcounty_id FROM ward w WHERE w.id = pl.ward_id),
        (SELECT s.subcounty_id FROM settlement s WHERE s.id = pl.settlement_id)
      ) = ${subcountyId}
    )`
  );
}

function buildProjectWardInLocationLiteral(tableName, wardId) {
  return literal(
    `EXISTS (
      SELECT 1 FROM project_location pl
      WHERE pl.project_id = "${tableName}".id
      AND (
        pl.ward_id = ${wardId}
        OR pl.settlement_id IN (SELECT id FROM settlement WHERE ward_id = ${wardId})
      )
    )`
  );
}

function buildProjectSubcountyExistsLiteral(tableName, subcountyIds, userId, options = {}) {
  const { creatorFallback = false } = options;
  const ids = uniqueInts(subcountyIds);
  if (!ids.length) return null;
  const matchParts = ids.map((subcountyId) => buildProjectSubcountyInLocationLiteral(tableName, subcountyId));
  const locationMatch = matchParts.length === 1 ? matchParts[0] : { [Op.or]: matchParts };
  if (creatorFallback) {
    return combineLocationScopeOrCreator(locationMatch, tableName, userId);
  }
  return locationMatch;
}

function buildProjectWardExistsLiteral(tableName, wardIds, userId, options = {}) {
  const { creatorFallback = false } = options;
  const ids = uniqueInts(wardIds);
  if (!ids.length) return null;
  const matchParts = ids.map((wardId) => buildProjectWardInLocationLiteral(tableName, wardId));
  const locationMatch = matchParts.length === 1 ? matchParts[0] : { [Op.or]: matchParts };
  if (creatorFallback) {
    return combineLocationScopeOrCreator(locationMatch, tableName, userId);
  }
  return locationMatch;
}

async function ensureDefaultProjectLocationForCreator(projectId, userId, source = {}) {
  if (!projectId || !userId) return;

  const existing = await db.models.project_location.count({
    where: { project_id: projectId },
  });
  if (existing > 0) return;

  const toInt = (value) => {
    if (value == null || value === '') return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  let payload = {
    project_id: projectId,
    county_id: toInt(source.county_id),
    subcounty_id: toInt(source.subcounty_id),
    ward_id: toInt(source.ward_id),
    settlement_id: toInt(source.settlement_id),
    geom: source.geom || null,
  };

  if (Array.isArray(source.Location) && source.Location.length) {
    const loc = source.Location;
    if (!payload.county_id && loc[0] != null) payload.county_id = toInt(loc[0]);
    if (!payload.subcounty_id && loc[1] != null) payload.subcounty_id = toInt(loc[1]);
    if (!payload.ward_id && loc[2] != null) payload.ward_id = toInt(loc[2]);
    if (!payload.settlement_id && loc[3] != null) payload.settlement_id = toInt(loc[3]);
  }

  if (!payload.county_id && !payload.subcounty_id && !payload.ward_id && !payload.settlement_id) {
    const assignments = await db.models.user_roles.findAll({
      where: { userid: userId, ...activeGrantWhere() },
    });

    const settlementRole = assignments.find(
      (row) => row.location_level === 'settlement' && row.settlement_id != null
    );
    const countyRole = assignments.find(
      (row) => row.location_level === 'county' && row.county_id != null
    );

    if (settlementRole) {
      payload.settlement_id = toInt(settlementRole.settlement_id);
      payload.location_type = 'settlement';
    } else if (countyRole) {
      payload.county_id = toInt(countyRole.county_id);
      payload.location_type = 'county';
    } else {
      return;
    }
  }

  if (!payload.location_type) {
    if (payload.settlement_id) payload.location_type = 'settlement';
    else if (payload.ward_id) payload.location_type = 'ward';
    else if (payload.subcounty_id) payload.location_type = 'subcounty';
    else if (payload.county_id) payload.location_type = 'county';
  }

  if (!payload.location_name || String(payload.location_name).trim() === '') {
    if (payload.settlement_id) {
      const settlement = await db.models.settlement.findByPk(payload.settlement_id, {
        attributes: ['name'],
        raw: true,
      });
      payload.location_name = settlement?.name || null;
    } else if (payload.ward_id) {
      const ward = await db.models.ward.findByPk(payload.ward_id, {
        attributes: ['name'],
        raw: true,
      });
      payload.location_name = ward?.name || null;
    } else if (payload.subcounty_id) {
      const subcounty = await db.models.subcounty.findByPk(payload.subcounty_id, {
        attributes: ['name'],
        raw: true,
      });
      payload.location_name = subcounty?.name || null;
    } else if (payload.county_id) {
      const county = await db.models.county.findByPk(payload.county_id, {
        attributes: ['name'],
        raw: true,
      });
      payload.location_name = county?.name || null;
    }
  }

  try {
    await db.models.project_location.create(payload);
  } catch (err) {
    console.warn(`Default project_location for project ${projectId} failed:`, err.message);
  }
}

async function applyProgrammeProjectScopeToQuery(baseQuery, modelName, Model, userId, preloadedScope = null) {
  const scope = preloadedScope || (await getProjectProgrammeScope(userId));
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

    if (!scope.isNationalLocation) {
      const countyCondition = buildProjectCountyVisibilityCondition(
        tableName,
        scope.countyIds,
        userId
      );
      if (countyCondition) conditions.push(countyCondition);

      const settlementCondition = buildProjectSettlementVisibilityCondition(
        tableName,
        scope.settlementIds,
        userId
      );
      if (settlementCondition) conditions.push(settlementCondition);
    }

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
    if (!scope.isNationalLocation && scope.countyIds.length) {
      parts.push(`county_id IN (${scope.countyIds.join(', ')})`);
    }
    if (!scope.isNationalLocation && scope.settlementIds.length) {
      parts.push(`settlement_id IN (${scope.settlementIds.join(', ')})`);
    }
  }

  return parts.length ? parts.join(' AND ') : '';
}

module.exports = {
  expandProgrammeIds,
  resolveProgrammeFamilyIds,
  classifyProgrammeFamily,
  getProjectProgrammeScope,
  applyProgrammeProjectScopeToQuery,
  buildOptimizedScopeSql,
  buildProjectCountyExistsLiteral,
  buildProjectSettlementExistsLiteral,
  buildProjectSubcountyExistsLiteral,
  buildProjectWardExistsLiteral,
  ensureDefaultProjectLocationForCreator,
  shouldUseCreatorLocationFallback,
};
