/**
 * List UI: user has `user_roles` loaded and none are still valid (same rule as login
 * `activeGrantWhere`: each grant is active if expires_at is null/empty or expires_at > now).
 */
export function isUserAccessFullyExpired(user: { user_roles?: unknown[] } | null | undefined): boolean {
  const grants = user?.user_roles
  if (!Array.isArray(grants) || grants.length === 0) return false

  const now = Date.now()
  const hasActiveGrant = grants.some((raw: any) => {
    const exp = raw?.expires_at
    if (exp == null || exp === '') return true
    const t = new Date(exp).getTime()
    return !Number.isNaN(t) && t > now
  })
  return !hasActiveGrant
}

/** `el-table` `row-class-name` — grays out rows with no active role grants. */
export function userListRowAccessClassName(data: { row: any }): string {
  return isUserAccessFullyExpired(data.row) ? 'user-list-row-access-expired' : ''
}
