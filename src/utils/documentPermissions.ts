/** Shared checks for linked-document actions (facilities, etc.). */

export function hasPermission(userInfo: any, perm: string): boolean {
  const p = userInfo?.permissions
  return Array.isArray(p) && (p.includes('*.*.*') || p.includes(perm))
}

export function isSuperAdminUser(userInfo: any): boolean {
  const roles = userInfo?.roles
  if (!Array.isArray(roles)) return false
  return roles.some((r: any) => {
    const n = String(r?.name ?? r ?? '').toLowerCase().trim()
    return n === 'super_admin' || n === 'root_admin'
  })
}

export function getRoleNames(userInfo: any): string[] {
  return (userInfo?.roles ?? [])
    .map((r: any) => (typeof r === 'string' ? r : r?.name))
    .filter(Boolean)
}

/** Settings dashboard list: admins and dashboard managers see all records. */
export function isDashboardSettingsAdmin(userInfo: any): boolean {
  if (isSuperAdminUser(userInfo)) return true
  if (
    hasPermission(userInfo, 'dashboard:create') ||
    hasPermission(userInfo, 'dashboard:update') ||
    hasPermission(userInfo, 'dashboard:delete')
  ) {
    return true
  }
  return getRoleNames(userInfo).some((name) =>
    ['admin', 'super_admin', 'root_admin'].includes(name)
  )
}

export function filterDashboardsForUser(userInfo: any, dashboards: any[]): any[] {
  if (isDashboardSettingsAdmin(userInfo)) return dashboards
  return dashboards.filter(
    (d) => d.createdBy === userInfo?.id || d.public === true
  )
}

/** Unlink document from a facility-linked entity (does not delete the file). */
export function canUnlinkDocumentFromFacility(userInfo: any): boolean {
  if (isSuperAdminUser(userInfo)) return true
  return (
    hasPermission(userInfo, 'document:update') ||
    hasPermission(userInfo, 'facility:update') ||
    hasPermission(userInfo, 'health_facility:update') ||
    hasPermission(userInfo, 'education_facility:update') ||
    hasPermission(userInfo, 'other_facility:update') ||
    hasPermission(userInfo, 'public_facility:update')
  )
}

export function canPermanentlyDeleteFacilityLinkedDocument(userInfo: any): boolean {
  if (isSuperAdminUser(userInfo)) return true
  return hasPermission(userInfo, 'document:delete')
}
