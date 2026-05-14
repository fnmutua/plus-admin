/** Shared checks for linked-document actions (facilities, etc.). */

export function hasPermission(userInfo: any, perm: string): boolean {
  const p = userInfo?.permissions
  return Array.isArray(p) && (p.includes('*.*.*') || p.includes(perm))
}

export function isSuperAdminUser(userInfo: any): boolean {
  const roles = userInfo?.roles
  if (!Array.isArray(roles)) return false
  return roles.some((r: any) => {
    const n = String(r?.name ?? '').toLowerCase().trim()
    return n === 'super_admin' || n === 'root_admin'
  })
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
