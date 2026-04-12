/**
 * Guest/public accounts often use location_level "national" for read-only scope.
 * They must not match UI logic intended for national staff (county bypass, privileged filters, etc.).
 */

export type RoleWithLocation = {
  name?: string
  user_roles?: { location_level?: string | null }
}

export function isPublicOrGuestRole(role: RoleWithLocation | null | undefined): boolean {
  const n = String(role?.name ?? '').toLowerCase()
  return n === 'public' || n === 'guest'
}

/** Any role with location_level === 'national', excluding public/guest. */
export function userHasPrivilegedNationalLocation(roles: RoleWithLocation[] | undefined | null): boolean {
  if (!Array.isArray(roles) || roles.length === 0) return false
  return roles.some((r) => !isPublicOrGuestRole(r) && r.user_roles?.location_level === 'national')
}

/** National or null (legacy) — excludes public/guest. */
export function userHasPrivilegedNationalOrNullLocation(roles: RoleWithLocation[] | undefined | null): boolean {
  if (!Array.isArray(roles) || roles.length === 0) return false
  return roles.some((r) => {
    if (isPublicOrGuestRole(r)) return false
    const lv = r.user_roles?.location_level
    return lv === 'national' || lv === null
  })
}

/** National or regional — excludes public/guest. */
export function userHasPrivilegedNationalOrRegionalLocation(roles: RoleWithLocation[] | undefined | null): boolean {
  if (!Array.isArray(roles) || roles.length === 0) return false
  return roles.some(
    (r) =>
      !isPublicOrGuestRole(r) &&
      (r.user_roles?.location_level === 'national' || r.user_roles?.location_level === 'regional')
  )
}
