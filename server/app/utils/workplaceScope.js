const db = require('../models')
const { Op } = db.Sequelize
const { getActiveRolesGetOptions } = require('./userRoleExpiry')

const PLATFORM_ADMIN_ROLES = new Set(['admin', 'root_admin', 'super_admin'])

/**
 * Resolve whether the user may access the admin workplace and their data scope.
 */
async function resolveWorkplaceScope(userId) {
  const user = await db.user.findByPk(userId, {
    include: [
      {
        model: db.role,
        ...getActiveRolesGetOptions(),
        through: { attributes: ['location_level', 'county_id', 'settlement_id'] }
      }
    ]
  })

  if (!user) {
    return { canAccess: false }
  }

  const roles = user.roles || []
  const isSuperOrRoot = roles.some((r) => r.name === 'super_admin' || r.name === 'root_admin')
  const nationalAdminRole = roles.find(
    (r) => r.name === 'admin' && r.user_roles?.location_level === 'national'
  )
  const countyAdminRole = roles.find(
    (r) => r.name === 'admin' && r.user_roles?.location_level === 'county'
  )

  const canAccess = isSuperOrRoot || !!nationalAdminRole || !!countyAdminRole
  if (!canAccess) {
    return { canAccess: false }
  }

  const isNational = isSuperOrRoot || !!nationalAdminRole
  const countyId = isNational ? null : countyAdminRole?.user_roles?.county_id ?? user.county_id ?? null

  let countyName = null
  if (countyId) {
    const county = await db.models.county.findByPk(countyId, { attributes: ['id', 'name'] })
    countyName = county?.name || null
  }

  return {
    canAccess: true,
    isNational,
    countyId,
    countyName,
    scopeLabel: isNational ? 'National' : countyName ? `${countyName} County` : 'County'
  }
}

/** Users visible within admin workplace scope (distinct user ids). */
async function getScopedUserIdList(scope) {
  if (scope.isNational) {
    return null
  }

  if (!scope.countyId) {
    return []
  }

  const roleRows = await db.models.user_roles.findAll({
    where: { county_id: scope.countyId },
    attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('userid')), 'userid']],
    raw: true
  })

  const directCountyUsers = await db.models.users.findAll({
    where: { county_id: scope.countyId },
    attributes: ['id'],
    raw: true
  })

  const ids = new Set([
    ...roleRows.map((r) => String(r.userid)),
    ...directCountyUsers.map((u) => String(u.id))
  ])

  return [...ids]
}

function scopedUserWhere(scope, userIds) {
  if (scope.isNational) {
    return {}
  }
  if (!userIds || userIds.length === 0) {
    return { id: -1 }
  }
  return { id: { [Op.in]: userIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n)) } }
}

function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return startOfDay(d)
}

function startOfMonth(date = new Date()) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfYear(date = new Date()) {
  const d = new Date(date)
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function newAccountsPeriodStart(period = 'week') {
  switch (period) {
    case 'month':
      return startOfMonth()
    case 'year':
      return startOfYear()
    case 'week':
    default:
      return daysAgo(7)
  }
}

module.exports = {
  PLATFORM_ADMIN_ROLES,
  resolveWorkplaceScope,
  getScopedUserIdList,
  scopedUserWhere,
  startOfDay,
  endOfDay,
  daysAgo,
  startOfMonth,
  startOfYear,
  newAccountsPeriodStart
}
