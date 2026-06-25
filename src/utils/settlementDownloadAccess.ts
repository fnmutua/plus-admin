import { hasPermission, isSuperAdminUser } from '@/utils/documentPermissions'

export function isPublicSettlementUser(userInfo: any): boolean {
  return (userInfo?.roles ?? []).some((role: any) => {
    const name = String(role?.name ?? '').toLowerCase()
    return name === 'public' || name === 'guest'
  })
}

/** Toolbar geospatial / export actions on the settlement listing. */
export function canDownloadSettlementGeo(
  userInfo: any,
  showEditButtons = false
): boolean {
  if (!userInfo) return false
  if (isPublicSettlementUser(userInfo)) return false
  if (!hasPermission(userInfo, 'settlement:downloadGeo')) return false
  return (
    showEditButtons ||
    hasPermission(userInfo, 'settlement:export') ||
    hasPermission(userInfo, 'settlement:export_data')
  )
}

/** "All" scope — national / super / county admin or county staff (admin|staff role at county level). */
export function canSettlementDownloadAllScope(state: {
  userInfo: any
  isSuperAdmin: boolean
  isNationalStaff: boolean
  isCountyAdmin: boolean
}): boolean {
  if (isSuperAdminUser(state.userInfo) || state.isSuperAdmin) return true
  if (state.isNationalStaff) return true
  // County-level admin or staff — still limited to assigned county(ies) via role filters
  if (state.isCountyAdmin) return true
  return false
}

/** Deleted-tab exports require view-deleted permission unless super admin. */
export function canDownloadSettlementDeletedScope(userInfo: any): boolean {
  if (isSuperAdminUser(userInfo)) return true
  return hasPermission(userInfo, 'settlement:viewDeleted')
}
