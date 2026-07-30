import { ElMessage, ElMessageBox } from 'element-plus'
import { getCountyListApi } from '@/api/counties'

/**
 * New registrations arrive holding only the default `public` role, yet activation
 * only flips `isactive` and never consults roles — so accounts could be switched on
 * before anyone decided what they should be. These helpers gate that first
 * activation until a real role exists.
 *
 * Deactivation is never gated, and once a user holds an assigned role the check
 * stops applying, so reactivation is unaffected.
 */

/** Roles that grant nothing on their own; every new sign-up starts here. */
const UNASSIGNED_ROLE_NAMES = new Set(['public', 'guest'])

export function isAssignedRoleName(name: unknown): boolean {
  const n = String(name ?? '').trim().toLowerCase()
  return n !== '' && !UNASSIGNED_ROLE_NAMES.has(n)
}

// User rows carry `user_roles[].roleid` but no role name, and the
// subordinate-roles endpoint is filtered per admin and omits `public` entirely —
// so the unfiltered list is the only reliable way to recognise it.
let roleNamePromise: Promise<Record<number, string>> | null = null

export function loadRoleNameMap(force = false): Promise<Record<number, string>> {
  if (force) roleNamePromise = null
  if (!roleNamePromise) {
    roleNamePromise = getCountyListApi({
      params: {
        limit: 100,
        curUser: 1,
        model: 'roles',
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC',
      },
    })
      .then((res: any) => {
        const map: Record<number, string> = {}
        ;(res?.data || []).forEach((r: any) => {
          if (r?.id != null) map[Number(r.id)] = String(r.name ?? '')
        })
        return map
      })
      .catch((error) => {
        console.error('Failed to load role names:', error)
        // Don't cache a failure — a later attempt should retry
        roleNamePromise = null
        return {} as Record<number, string>
      })
  }
  return roleNamePromise
}

export function hasConfirmedRole(
  row: { user_roles?: Array<{ roleid?: number | string }> } | null | undefined,
  roleNameById: Record<number, string>
): boolean {
  const userRoles = Array.isArray(row?.user_roles) ? row!.user_roles! : []
  return userRoles.some((ur) => isAssignedRoleName(roleNameById[Number(ur?.roleid)]))
}

/** Distinct role names a row holds, public/guest excluded, in first-seen order. */
export function getAssignedRoleNames(
  row: { user_roles?: Array<{ roleid?: number | string }> } | null | undefined,
  roleNameById: Record<number, string>
): string[] {
  const userRoles = Array.isArray(row?.user_roles) ? row!.user_roles! : []
  const names = userRoles
    .map((ur) => roleNameById[Number(ur?.roleid)])
    .filter((name): name is string => isAssignedRoleName(name))
  return [...new Set(names)]
}

export type ActivationGateResult = 'ok' | 'cancelled' | 'assign-role'

/**
 * Call before activating. Returns 'ok' to proceed, 'assign-role' when the admin
 * chose to fix it now (open your edit dialog), or 'cancelled' to do nothing.
 *
 * An empty role map means the lookup failed; we allow activation rather than
 * blocking every admin on a transient API error.
 */
export async function gateActivationOnRole(row: {
  name?: string
  user_roles?: Array<{ roleid?: number | string }>
}): Promise<ActivationGateResult> {
  const roleNameById = await loadRoleNameMap()
  if (!Object.keys(roleNameById).length) return 'ok'
  if (hasConfirmedRole(row, roleNameById)) return 'ok'

  try {
    await ElMessageBox.confirm(
      `${row?.name || 'This user'} has no role assigned yet — only the default public access. ` +
        'Assign a role before activating the account.',
      'Role not assigned',
      {
        confirmButtonText: 'Assign role now',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    return 'assign-role'
  } catch {
    return 'cancelled'
  }
}

const TOP_LEVEL_ADMIN_ROLE_NAMES = new Set(['root_admin', 'super_admin'])

/** Role names held by the logged-in admin (lowercase). */
export function getActorRoleNames(
  currentUser: { roles?: Array<{ name?: string }> } | null | undefined
): string[] {
  const roles = Array.isArray(currentUser?.roles) ? currentUser!.roles! : []
  return roles.map((r) => String(r?.name ?? '').trim().toLowerCase()).filter(Boolean)
}

export function actorIsRootAdmin(actorRoleNames: string[]): boolean {
  return actorRoleNames.includes('root_admin')
}

export function actorIsSuperAdmin(actorRoleNames: string[]): boolean {
  return actorRoleNames.includes('super_admin')
}

export function roleNameForId(
  roleId: number | string | null | undefined,
  roleNameById: Record<number, string>
): string {
  if (roleId == null || roleId === '') return ''
  return String(roleNameById[Number(roleId)] ?? '').trim().toLowerCase()
}

/**
 * Whether the actor may remove or reassign this role row on the target user.
 * - root_admin on another user: never (peer protection)
 * - super_admin on another user: only root_admin may change/remove
 */
export function canModifyUserRoleAssignment(options: {
  actorRoleNames: string[]
  targetUserId: number | string | null | undefined
  actorUserId: number | string | null | undefined
  roleId: number | string | null | undefined
  roleNameById: Record<number, string>
}): boolean {
  const { actorRoleNames, targetUserId, actorUserId, roleId, roleNameById } = options

  if (
    targetUserId != null &&
    actorUserId != null &&
    String(targetUserId) === String(actorUserId)
  ) {
    return true
  }

  const roleName = roleNameForId(roleId, roleNameById)
  if (!TOP_LEVEL_ADMIN_ROLE_NAMES.has(roleName)) return true

  if (roleName === 'root_admin') return false

  if (roleName === 'super_admin') return actorIsRootAdmin(actorRoleNames)

  return true
}

export function protectedRoleModificationMessage(
  roleId: number | string | null | undefined,
  roleNameById: Record<number, string>
): string {
  const roleName = roleNameForId(roleId, roleNameById)
  if (roleName === 'root_admin') {
    return 'Root admin role cannot be removed from another root admin.'
  }
  if (roleName === 'super_admin') {
    return 'Super admin role cannot be removed from another super admin.'
  }
  return 'This role assignment cannot be modified.'
}

/** Guarded splice for tmp_roles — shows an error and returns false when blocked. */
export function tryRemoveUserRoleRow(
  index: number,
  tmpRoles: { roleid?: number | string }[],
  context: {
    actorRoleNames: string[]
    targetUserId: number | string | null | undefined
    actorUserId: number | string | null | undefined
    roleNameById: Record<number, string>
  }
): boolean {
  const row = tmpRoles[index]
  if (
    !canModifyUserRoleAssignment({
      ...context,
      roleId: row?.roleid,
    })
  ) {
    ElMessage.error(protectedRoleModificationMessage(row?.roleid, context.roleNameById))
    return false
  }
  tmpRoles.splice(index, 1)
  return true
}

/**
 * Whether the actor may activate/deactivate the target user.
 * - root_admin accounts: only the same user (not peer root admins)
 * - super_admin accounts: only root_admin may toggle; super_admin peers cannot
 */
export function canActivateDeactivateUser(options: {
  actorRoleNames: string[]
  actorUserId: number | string | null | undefined
  targetUser: { id?: number | string; user_roles?: Array<{ roleid?: number | string }> } | null | undefined
  roleNameById: Record<number, string>
}): boolean {
  const { actorRoleNames, actorUserId, targetUser, roleNameById } = options

  if (
    targetUser?.id != null &&
    actorUserId != null &&
    String(targetUser.id) === String(actorUserId)
  ) {
    return true
  }

  const targetRoleNames = getAssignedRoleNames(targetUser, roleNameById).map((n) => n.toLowerCase())

  if (targetRoleNames.includes('root_admin')) return false

  if (targetRoleNames.includes('super_admin') && !actorIsRootAdmin(actorRoleNames)) {
    return false
  }

  return true
}

export function activateDeactivateBlockedMessage(
  targetUser: { user_roles?: Array<{ roleid?: number | string }> } | null | undefined,
  roleNameById: Record<number, string>
): string {
  const targetRoleNames = getAssignedRoleNames(targetUser, roleNameById).map((n) => n.toLowerCase())
  if (targetRoleNames.includes('root_admin')) {
    return 'You cannot activate or deactivate another root admin.'
  }
  if (targetRoleNames.includes('super_admin')) {
    return 'You cannot activate or deactivate another super admin.'
  }
  return 'You cannot change this user\'s activation status.'
}

/** Returns false and shows an error when peer activation rules block the action. */
export function assertCanActivateDeactivateUser(options: {
  actorRoleNames: string[]
  actorUserId: number | string | null | undefined
  targetUser: { id?: number | string; user_roles?: Array<{ roleid?: number | string }> } | null | undefined
  roleNameById: Record<number, string>
}): boolean {
  if (canActivateDeactivateUser(options)) return true
  ElMessage.error(activateDeactivateBlockedMessage(options.targetUser, options.roleNameById))
  return false
}
