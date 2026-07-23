const db = require('../models');
const { Op } = require('sequelize');
const { activeGrantWhere } = require('./userRoleExpiry');

/** Lower rank = broader visibility when `roles.subordinates` is empty. */
const ROLE_RANK_FALLBACK = {
  root_admin: 100,
  super_admin: 90,
  admin: 80,
  support: 70,
  monitoring: 65,
  staff: 60,
  consultant: 55,
  grm: 50,
  gbv: 50,
  donor: 20,
  public: 10,
};

const HIDDEN_FROM_LIST = new Set(['root_admin']);

const USERS_WITH_ANY_ROLE_SUBQUERY =
  '(SELECT DISTINCT userid FROM user_roles WHERE userid IS NOT NULL)';

function uniqueInts(values) {
  return Array.from(
    new Set((Array.isArray(values) ? values : []).map((v) => Number(v)).filter((n) => Number.isFinite(n)))
  );
}

/**
 * Role IDs the viewer may list (union of roles.subordinates + rank fallback below viewer).
 */
async function getViewerSubordinateRoleIds(userId) {
  if (!userId) return [];

  const viewer = await db.user.findByPk(userId, {
    include: [{ model: db.role, attributes: ['id', 'name', 'subordinates'] }],
  });
  if (!viewer) return [];

  const viewerRoles = Array.isArray(viewer.roles) ? viewer.roles : [];
  const allowed = new Set();

  for (const role of viewerRoles) {
    if (Array.isArray(role.subordinates)) {
      role.subordinates.forEach((id) => {
        if (Number.isFinite(Number(id))) allowed.add(Number(id));
      });
    }
  }

  const viewerRank = Math.max(
    ...viewerRoles.map((r) => ROLE_RANK_FALLBACK[r.name] ?? -1),
    -1
  );

  if (viewerRank >= 0) {
    const allRoles = await db.role.findAll({ attributes: ['id', 'name'] });
    for (const r of allRoles) {
      if (HIDDEN_FROM_LIST.has(r.name)) continue;
      if ((ROLE_RANK_FALLBACK[r.name] ?? -1) < viewerRank) {
        allowed.add(Number(r.id));
      }
    }
  }

  return [...allowed];
}

/**
 * User IDs that hold a role at or above the viewer (never show in subordinate lists).
 */
async function getUserIdsWithHigherOrEqualRoles(viewerId) {
  if (!viewerId) return [];

  const viewer = await db.user.findByPk(viewerId, {
    include: [{ model: db.role, attributes: ['id', 'name'] }],
  });
  if (!viewer) return [];

  const viewerRank = Math.max(
    ...(Array.isArray(viewer.roles) ? viewer.roles : []).map((r) => ROLE_RANK_FALLBACK[r.name] ?? -1),
    -1
  );
  if (viewerRank < 0) return [];

  const allRoles = await db.role.findAll({ attributes: ['id', 'name'] });
  const blockedRoleIds = allRoles
    .filter((r) => (ROLE_RANK_FALLBACK[r.name] ?? -1) >= viewerRank)
    .map((r) => r.id);

  if (blockedRoleIds.length === 0) return [];

  const rows = await db.models.user_roles.findAll({
    where: { roleid: { [Op.in]: blockedRoleIds } },
    attributes: ['userid'],
    raw: true,
  });
  return uniqueInts(rows.map((r) => r.userid)).filter((id) => id !== Number(viewerId));
}

/** County admin/staff scoped to one county in user_roles. */
async function getCountyAdminScope(userId) {
  const assignments = await db.models.user_roles.findAll({
    where: { userid: userId, ...activeGrantWhere() },
    include: [{ model: db.role, attributes: ['name'] }],
  });

  const countyAdminAssignment = assignments.find(
    (row) =>
      row.role &&
      ['admin', 'staff'].includes(row.role.name) &&
      row.location_level === 'county' &&
      row.county_id != null
  );

  if (!countyAdminAssignment) {
    return { isCountyAdmin: false, countyId: null };
  }

  return {
    isCountyAdmin: true,
    countyId: Number(countyAdminAssignment.county_id),
  };
}

/**
 * Build WHERE for user list: include users with no roles OR a listable subordinate role.
 */
async function buildUserListWhere(viewerId, options = {}) {
  const {
    searchString,
    filters = [],
    filterValues = [],
    normalizeFilter = (filter, value) => value,
  } = options;

  const allowedRoleIds = await getViewerSubordinateRoleIds(viewerId);
  const blockedUserIds = await getUserIdsWithHigherOrEqualRoles(viewerId);
  const { isCountyAdmin, countyId: adminCountyId } = await getCountyAdminScope(viewerId);

  const whereParts = [{ id: { [Op.ne]: viewerId } }];
  if (blockedUserIds.length > 0) {
    whereParts.push({ id: { [Op.notIn]: blockedUserIds } });
  }

  const visibilityOr = [];

  const noRoleCondition = {
    id: {
      [Op.notIn]: db.sequelize.literal(USERS_WITH_ANY_ROLE_SUBQUERY),
    },
  };
  if (isCountyAdmin && adminCountyId) {
    visibilityOr.push({
      [Op.and]: [noRoleCondition, { county_id: adminCountyId }],
    });
  } else {
    visibilityOr.push(noRoleCondition);
  }

  if (allowedRoleIds.length > 0) {
    const roleMatchWhere = { roleid: { [Op.in]: allowedRoleIds } };
    if (isCountyAdmin && adminCountyId) {
      roleMatchWhere.county_id = adminCountyId;
    }
    const rows = await db.models.user_roles.findAll({
      where: roleMatchWhere,
      attributes: ['userid'],
      raw: true,
    });
    const matchingUserIds = uniqueInts(rows.map((r) => r.userid));
    if (matchingUserIds.length > 0) {
      visibilityOr.push({ id: { [Op.in]: matchingUserIds } });
    }
  }

  whereParts.push({ [Op.or]: visibilityOr });

  if (searchString) {
    whereParts.push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${searchString}%` } },
        { username: { [Op.iLike]: `%${searchString}%` } },
        { email: { [Op.iLike]: `%${searchString}%` } },
        { phone: { [Op.iLike]: `%${searchString}%` } },
      ],
    });
  }

  if (filters.length === filterValues.length && filters.length > 0) {
    filters.forEach((filter, index) => {
      const value = filterValues[index];
      if (Array.isArray(value)) {
        whereParts.push({ [filter]: { [Op.in]: value } });
      } else {
        whereParts.push({ [filter]: { [Op.eq]: normalizeFilter(filter, value) } });
      }
    });
  }

  return whereParts.length === 1 ? whereParts[0] : { [Op.and]: whereParts };
}

/** Standard includes for user list responses (all user_roles for expiry UI). */
function userListIncludes() {
  return [
    {
      model: db.models.user_roles,
      required: false,
    },
    {
      model: db.models.county,
      attributes: ['id', 'name', 'code'],
      required: false,
    },
  ];
}

module.exports = {
  ROLE_RANK_FALLBACK,
  getViewerSubordinateRoleIds,
  getUserIdsWithHigherOrEqualRoles,
  getCountyAdminScope,
  buildUserListWhere,
  userListIncludes,
};
