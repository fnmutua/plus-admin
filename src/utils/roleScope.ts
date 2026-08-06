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

/**
 * Accounts that use national/regional scope but must not receive "staff" shortcuts
 * (e.g. document delete, privileged filters). Not the same as public/guest — do not use
 * for public_scope vs national UI routing; see isPublicOrGuestRole.
 */
export function isReadOnlyNationalVisitorRole(role: RoleWithLocation | null | undefined): boolean {
  const n = String(role?.name ?? '').toLowerCase()
  return n === 'donor'
}

/** Any role with location_level === 'national', excluding public/guest and read-only visitors (donor). */
export function userHasPrivilegedNationalLocation(roles: RoleWithLocation[] | undefined | null): boolean {
  if (!Array.isArray(roles) || roles.length === 0) return false
  return roles.some(
    (r) =>
      !isPublicOrGuestRole(r) &&
      !isReadOnlyNationalVisitorRole(r) &&
      r.user_roles?.location_level === 'national'
  )
}

/** National or null (legacy) — excludes public/guest. */
export function userHasPrivilegedNationalOrNullLocation(roles: RoleWithLocation[] | undefined | null): boolean {
  if (!Array.isArray(roles) || roles.length === 0) return false
  return roles.some((r) => {
    if (isPublicOrGuestRole(r) || isReadOnlyNationalVisitorRole(r)) return false
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
      !isReadOnlyNationalVisitorRole(r) &&
      (r.user_roles?.location_level === 'national' || r.user_roles?.location_level === 'regional')
  )
}

/**
 * County scope for dashboards / maps: staff assigned at county level (not national/super).
 * Prefer roles[].user_roles over top-level user.county_id.
 */
export type UserCountyScopeRole = {
  name?: string
  user_roles?: {
    location_level?: string | null
    county_id?: number | string | null
  }
}

export function getUserDashboardCountyScope(
  userInfo: { roles?: UserCountyScopeRole[] } | null | undefined
): {
  isCountyStaff: boolean
  countyIds: number[]
  shouldDefaultToCounty: boolean
} {
  const roles = userInfo?.roles || []
  const isSuperAdmin = roles.some(
    (r) => r.name === 'super_admin' || r.name === 'root_admin'
  )
  const hasNational = userHasPrivilegedNationalLocation(roles)
  const countyIds = [
    ...new Set(
      roles
        .filter(
          (r) =>
            r.user_roles?.location_level === 'county' &&
            r.user_roles?.county_id != null &&
            r.user_roles?.county_id !== ''
        )
        .map((r) => Number(r.user_roles!.county_id))
        .filter((id) => Number.isFinite(id) && id > 0)
    ),
  ]
  const isCountyStaff = !isSuperAdmin && !hasNational && countyIds.length > 0
  return {
    isCountyStaff,
    countyIds,
    shouldDefaultToCounty: isCountyStaff,
  }
}

/**
 * Shape produced by `processedRoles` in SettlementDetails.vue (field null = national/regional).
 */
export type ProcessedSettlementRole = {
  field: string | null
  value: unknown
  roleName?: string
}

/**
 * Tab visibility / "view" access: any county or settlement-scoped role, or national/regional (non-public).
 * Scoped roles do not compare settlement ids (legacy behavior for showing tabs).
 */
export function settlementDetailsViewAccessForRole(role: ProcessedSettlementRole): boolean {
  if (role.field !== null) return true
  if (isPublicOrGuestRole({ name: role.roleName })) return false
  return true
}

/**
 * Edit/delete-style access: county/settlement roles must match the settlement; national/regional (non-public) match all.
 */
export function settlementDetailsMutationAccessForRole(
  settlement: { id?: unknown; county_id?: unknown },
  role: ProcessedSettlementRole
): boolean {
  if (role.field !== null) {
    if (role.field === 'settlement_id') return settlement.id === role.value
    if (role.field === 'county_id') return settlement.county_id === role.value
    return false
  }
  if (isPublicOrGuestRole({ name: role.roleName })) return false
  return true
}
