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

export function isNationalAdminUser(userInfo: any): boolean {
  return (userInfo?.roles ?? []).some(
    (r: any) =>
      (r?.name === 'admin' || r?.name === 'slum_upgrading') &&
      r?.user_roles?.location_level === 'national'
  )
}

export function getCountyAdminCountyIds(userInfo: any): Array<string | number> {
  return (userInfo?.roles ?? [])
    .filter(
      (r: any) =>
        r?.name === 'admin' &&
        r?.user_roles?.location_level === 'county' &&
        r?.user_roles?.county_id != null
    )
    .map((r: any) => r.user_roles.county_id)
}

export function isCountyAdminUser(userInfo: any): boolean {
  return getCountyAdminCountyIds(userInfo).length > 0
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
    ['admin', 'slum_upgrading', 'super_admin', 'root_admin'].includes(name)
  )
}

export function filterDashboardsForUser(userInfo: any, dashboards: any[]): any[] {
  if (isDashboardSettingsAdmin(userInfo)) return dashboards
  return dashboards.filter(
    (d) => d.createdBy === userInfo?.id || d.public === true
  )
}

/** Export dashboard charts nested by county — root/super admins, national admins, or county admins. */
export function canExportNestedDashboardCharts(userInfo: any): boolean {
  if (!hasPermission(userInfo, 'dashboard:exportNested')) return false
  if (isSuperAdminUser(userInfo)) return true
  return isNationalAdminUser(userInfo) || isCountyAdminUser(userInfo)
}

/** National-scope nested export (all counties) — root/super/national admin on national view. */
export function canUseNationalNestedDashboardExport(
  userInfo: any,
  isNationalDashboardView: boolean
): boolean {
  if (!canExportNestedDashboardCharts(userInfo)) return false
  if (!isNationalDashboardView) return false
  return isSuperAdminUser(userInfo) || isNationalAdminUser(userInfo)
}

/** County-scoped nested export — county admins for their assigned county(ies). */
export function canUseCountyNestedDashboardExport(userInfo: any): boolean {
  if (!canExportNestedDashboardCharts(userInfo)) return false
  if (isSuperAdminUser(userInfo) || isNationalAdminUser(userInfo)) return false
  return isCountyAdminUser(userInfo)
}

/** Make a dashboard public — root/super admins, or national-level admin only. */
export function canPublishDashboard(userInfo: any): boolean {
  if (!hasPermission(userInfo, 'dashboard:publish')) return false
  if (isSuperAdminUser(userInfo)) return true
  return (userInfo?.roles ?? []).some(
    (r: any) =>
      (r?.name === 'admin' || r?.name === 'slum_upgrading') &&
      r?.user_roles?.location_level === 'national'
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
