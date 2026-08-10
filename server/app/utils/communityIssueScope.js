const db = require('../models')
const { Op } = require('sequelize')
const { getActiveRolesGetOptions } = require('./userRoleExpiry')
const { getCountyAdminScope } = require('./userListScope')

const NATIONAL_BYPASS_ROLES = new Set(['root_admin', 'super_admin', 'support'])

function roleAssignment(role) {
  return role?.user_roles || {}
}

async function getUserRolesForScope(userId) {
  if (!userId) return []
  const user = await db.user.findByPk(userId)
  if (!user) return []
  return user.getRoles(getActiveRolesGetOptions()) || []
}

async function hasNationalCommunityIssueAccess(userId) {
  const roles = await getUserRolesForScope(userId)
  return roles.some((role) => {
    if (NATIONAL_BYPASS_ROLES.has(role.name)) return true

    if (['admin', 'staff', 'slum_upgrading', 'monitoring', 'grm'].includes(role.name)) {
      const level = roleAssignment(role).location_level
      return !level || level === 'national' || level === 'regional'
    }

    return false
  })
}

async function getCountyScopeIds(userId) {
  const roles = await getUserRolesForScope(userId)
  const ids = new Set()

  const { isCountyAdmin, countyId } = await getCountyAdminScope(userId)
  if (isCountyAdmin && countyId) ids.add(Number(countyId))

  for (const role of roles) {
    const assignment = roleAssignment(role)
    const countyIdFromRole =
      assignment.county_id != null && assignment.county_id !== ''
        ? Number(assignment.county_id)
        : null

    if (role.name === 'county_admin' && countyIdFromRole) {
      ids.add(countyIdFromRole)
    }

    if (
      ['admin', 'staff', 'grm'].includes(role.name) &&
      assignment.location_level === 'county' &&
      countyIdFromRole
    ) {
      ids.add(countyIdFromRole)
    }
  }

  return [...ids].filter((id) => Number.isFinite(id) && id > 0)
}

async function applyCommunityIssueListScope(req, where = {}) {
  if (await hasNationalCommunityIssueAccess(req.userId)) {
    return where
  }

  const countyIds = await getCountyScopeIds(req.userId)
  if (!countyIds.length) {
    return { ...where, id: -1 }
  }

  return {
    ...where,
    county_id: countyIds.length === 1 ? countyIds[0] : { [Op.in]: countyIds },
  }
}

async function assertCommunityIssueAccess(req, issue) {
  if (!issue) return false
  if (await hasNationalCommunityIssueAccess(req.userId)) return true

  const countyIds = await getCountyScopeIds(req.userId)
  if (!countyIds.length) return false

  return countyIds.includes(Number(issue.county_id))
}

module.exports = {
  applyCommunityIssueListScope,
  assertCommunityIssueAccess,
  hasNationalCommunityIssueAccess,
  getCountyScopeIds,
}
