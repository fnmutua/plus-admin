import { hasPermission, isSuperAdminUser } from '@/utils/documentPermissions'

/** Roles that participate in GRM / grievance location scoping (same family as Open.vue getUserRoles). */
const GRIEVANCE_SCOPE_ROLE_NAMES = new Set(['grm', 'admin', 'root_admin', 'super_admin', 'staff'])

export function normGrievanceRoleName(role: any): string {
  return String(role?.name ?? '').toLowerCase().trim()
}

export function isGrievanceFilterEligibleRole(role: any): boolean {
  return GRIEVANCE_SCOPE_ROLE_NAMES.has(normGrievanceRoleName(role))
}

/**
 * National (or unset) location for GRM-related roles, from cached userInfo.
 * Aligns with Sett.vue / getUserRoles national branch (public/guest excluded).
 */
export function userHasNationalLocationScopeFromRoles(userInfo: any): boolean {
  const roles = userInfo?.roles
  if (!Array.isArray(roles)) return false
  for (const role of roles) {
    const rn = normGrievanceRoleName(role)
    if (!GRIEVANCE_SCOPE_ROLE_NAMES.has(rn)) continue
    if (rn === 'public' || rn === 'guest') continue
    const level = role.user_roles?.location_level
    if (level === 'national' || level === null || level === undefined) return true
  }
  return false
}

/**
 * Whether the grievance filter drawer should show the county control.
 * Uses permission helpers like other modules (Sett.vue shouldShowCountyFilter + hasPermission wildcards).
 */
export function canShowGrievanceCountyFilter(
  userInfo: any,
  state: {
    isNationalStaff: boolean
    isCountyStaff: boolean
    assignedCountyRoleIds: Array<string | number>
  }
): boolean {
  if (isSuperAdminUser(userInfo)) return true
  if (hasPermission(userInfo, '*.*.*')) return true
  if (userHasNationalLocationScopeFromRoles(userInfo)) return true
  if (state.isNationalStaff) return true
  if (state.isCountyStaff && state.assignedCountyRoleIds.length > 1) return true
  return false
}
