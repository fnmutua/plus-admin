'use strict'

// Single source of truth for grievance status transitions, stage durations,
// escalation levels and who may act on a grievance. The UI asks the server for
// allowed statuses (POST /api/v1/grv/transitions) instead of hard-coding them.

const DAY_MS = 24 * 60 * 60 * 1000

const LEVELS = ['settlement', 'county', 'national']

// Statuses after which no further workflow action is possible from the UI.
const TERMINAL_STATUSES = new Set(['Closed', 'In Court', 'Deleted'])

// Statuses the expiry job should ignore (finished or parked cases).
const INACTIVE_STATUSES = new Set(['Closed', 'In Court', 'Deleted', 'Rejected', 'Resolved'])

const STAGE_DURATION_DAYS = {
  Open: 7,
  Sorting: 7,
  Investigation: 14,
  'Under Review': 14,
  Escalated: 14,
  Referred: 14,
  Returned: 14,
  ExternalReferral: 30,
  Resolved: 21,
  Rejected: 21,
  'In Court': 90,
  Closed: 42,
  Deleted: 30,
  // GBV workflow
  sorting: 7,
  refer_to_settlement: 14,
  refer_to_county: 14,
  refer_to_action_support: 14,
  update_feedback: 14
}
const DEFAULT_STAGE_DURATION_DAYS = 14

const ACTIVE_WORK_TARGETS = [
  'Investigation', 'Under Review', 'Escalated', 'Referred', 'Resolved', 'Rejected', 'ExternalReferral', 'Returned'
]

// Standard (non-GBV) workflow: from -> allowed next statuses (before level filters).
const STANDARD_TRANSITIONS = {
  Open: ACTIVE_WORK_TARGETS,
  Sorting: ACTIVE_WORK_TARGETS,
  Investigation: ACTIVE_WORK_TARGETS.filter((s) => s !== 'Investigation'),
  'Under Review': ACTIVE_WORK_TARGETS.filter((s) => s !== 'Under Review'),
  // Re-escalating / re-referring from the same status is allowed.
  Escalated: ACTIVE_WORK_TARGETS,
  Referred: ACTIVE_WORK_TARGETS,
  Returned: ACTIVE_WORK_TARGETS.filter((s) => s !== 'Returned'),
  ExternalReferral: ['Investigation', 'Under Review', 'Resolved', 'Rejected', 'Closed', 'Returned'],
  Resolved: ['Escalated', 'In Court', 'ExternalReferral', 'Closed', 'Returned'],
  Rejected: ['Under Review', 'Escalated', 'ExternalReferral', 'Closed', 'Returned'],
  Closed: [],
  'In Court': [],
  Deleted: []
}

// GBV workflow (mirrors GBVGrievanceDetails.vue).
const GBV_DEFAULT_TARGETS = ['refer_to_settlement', 'refer_to_county', 'Rejected']
const GBV_TRANSITIONS = {
  sorting: ['refer_to_settlement', 'refer_to_county'],
  refer_to_settlement: ['refer_to_action_support', 'refer_to_county'],
  refer_to_action_support: ['update_feedback'],
  update_feedback: ['Closed'],
  Closed: ['Referred', 'Rejected'],
  Resolved: ['Closed', 'Referred'],
  Deleted: []
}
const GBV_LEVEL_BY_STATUS = {
  refer_to_settlement: 'settlement',
  refer_to_action_support: 'settlement',
  refer_to_county: 'county'
}

const SUPER_ADMIN_ROLE_NAMES = new Set(['super_admin', 'root_admin'])
const GRM_ROLE_NAMES = new Set(['grm', 'gbv', 'admin', 'staff', 'demo'])

function getStageDurationMs(status) {
  const days = STAGE_DURATION_DAYS[status] ?? DEFAULT_STAGE_DURATION_DAYS
  return days * DAY_MS
}

function computeStatusDates(status, now = new Date()) {
  return {
    current_status_date: now,
    status_expiry_date: new Date(now.getTime() + getStageDurationMs(status))
  }
}

function normalizeLevel(level) {
  return LEVELS.includes(level) ? level : 'settlement'
}

/**
 * Level the grievance moves to for a given target status.
 * Escalation and return move exactly one step; everything else stays put.
 */
function computeTargetLevel(targetStatus, currentLevel, { isgbv = false } = {}) {
  const level = normalizeLevel(currentLevel)
  if (isgbv && GBV_LEVEL_BY_STATUS[targetStatus]) {
    return GBV_LEVEL_BY_STATUS[targetStatus]
  }
  if (targetStatus === 'Escalated') {
    if (level === 'settlement') return 'county'
    if (level === 'county') return 'national'
    return null // cannot escalate beyond national
  }
  if (targetStatus === 'Returned') {
    if (level === 'national') return 'county'
    if (level === 'county') return 'settlement'
    return null // cannot return below settlement
  }
  return level
}

/**
 * Derive a user's GRM scope from their active roles (role.user_roles is the
 * join row carrying location_level / county_id / settlement_id).
 */
function getUserScope(roles = []) {
  const scope = {
    isSuperAdmin: false,
    hasGrmAccess: false,
    isNational: false,
    countyIds: new Set(),
    settlementIds: new Set()
  }
  for (const role of roles) {
    if (SUPER_ADMIN_ROLE_NAMES.has(role.name)) {
      scope.isSuperAdmin = true
      scope.hasGrmAccess = true
      continue
    }
    if (!GRM_ROLE_NAMES.has(role.name)) continue
    scope.hasGrmAccess = true
    const link = role.user_roles || {}
    const locationLevel = link.location_level
    if (locationLevel === 'county') {
      if (link.county_id != null) scope.countyIds.add(String(link.county_id))
    } else if (locationLevel === 'settlement') {
      if (link.settlement_id != null) scope.settlementIds.add(String(link.settlement_id))
    } else {
      // national, or no location restriction
      scope.isNational = true
    }
  }
  return scope
}

function hasNationalAuthority(scope) {
  return scope.isSuperAdmin || scope.isNational
}

/**
 * National users act on any grievance; county users on county/settlement
 * grievances in their county; settlement users on settlement grievances in
 * their settlement.
 */
function canActOnGrievance(scope, grievance) {
  if (!scope.hasGrmAccess || !grievance) return false
  if (hasNationalAuthority(scope)) return true
  const level = normalizeLevel(grievance.current_level)
  const countyId = grievance.county_id != null ? String(grievance.county_id) : null
  const settlementId = grievance.settlement_id != null ? String(grievance.settlement_id) : null
  if (countyId && scope.countyIds.has(countyId) && (level === 'county' || level === 'settlement')) {
    return true
  }
  if (settlementId && scope.settlementIds.has(settlementId) && level === 'settlement') {
    return true
  }
  return false
}

/**
 * Statuses the grievance may move to, after level rules. When a scope is given,
 * returns [] if that user may not act on the grievance at all.
 */
function getAllowedTransitions(grievance, scope = null) {
  if (!grievance) return []
  if (scope && !canActOnGrievance(scope, grievance)) return []
  const status = grievance.status
  const level = normalizeLevel(grievance.current_level)

  if (grievance.isgbv) {
    if (status === 'Deleted') return []
    return [...(GBV_TRANSITIONS[status] || GBV_DEFAULT_TARGETS)]
  }

  // Once resolved at settlement/county level, only national staff act further
  // (confirm, close, send back, escalate on appeal).
  if (status === 'Resolved' && scope && !hasNationalAuthority(scope)) return []

  const base = STANDARD_TRANSITIONS[status]
  // Unknown legacy statuses: allow the normal working set so they are not stuck.
  let allowed = base ? [...base] : [...ACTIVE_WORK_TARGETS]

  if (level === 'national') {
    allowed = allowed.filter((s) => s !== 'Escalated' && s !== 'Referred')
  }
  if (level === 'settlement') {
    allowed = allowed.filter((s) => s !== 'Returned')
  }
  if (!grievance.settlement_id && level === 'county') {
    // Nowhere to send it back to.
    allowed = allowed.filter((s) => s !== 'Returned')
  }
  return allowed
}

/**
 * Validate a requested status change. Returns
 *   { ok: true, finalStatus, targetLevel, autoClosed }
 * or { ok: false, httpStatus, code, message }.
 */
function planStatusChange({ grievance, requestedStatus, scope }) {
  if (!requestedStatus || typeof requestedStatus !== 'string') {
    return { ok: false, httpStatus: 400, code: '1001', message: 'New status is required' }
  }
  if (!canActOnGrievance(scope, grievance)) {
    return {
      ok: false,
      httpStatus: 403,
      code: '9999',
      message: 'You are not permitted to act on this grievance at its current level or location'
    }
  }
  const allowed = getAllowedTransitions(grievance, scope)
  if (!allowed.includes(requestedStatus)) {
    return {
      ok: false,
      httpStatus: 409,
      code: 'INVALID_TRANSITION',
      message: `Cannot change status from "${grievance.status}" to "${requestedStatus}" at ${normalizeLevel(grievance.current_level)} level`,
      allowed
    }
  }
  const targetLevel = computeTargetLevel(requestedStatus, grievance.current_level, { isgbv: !!grievance.isgbv })
  if (!targetLevel) {
    return {
      ok: false,
      httpStatus: 409,
      code: 'INVALID_TRANSITION',
      message: `Cannot ${requestedStatus === 'Escalated' ? 'escalate' : 'return'} a grievance at ${normalizeLevel(grievance.current_level)} level`,
      allowed
    }
  }
  if (targetLevel === 'settlement' && !grievance.settlement_id && !grievance.isgbv) {
    return {
      ok: false,
      httpStatus: 409,
      code: 'INVALID_TRANSITION',
      message: 'This grievance has no settlement to return it to',
      allowed
    }
  }

  // A national-level actor resolving a (non-GBV) grievance closes it directly;
  // settlement/county resolutions wait for national confirmation.
  const autoClosed = !grievance.isgbv && requestedStatus === 'Resolved' && hasNationalAuthority(scope)
  return {
    ok: true,
    finalStatus: autoClosed ? 'Closed' : requestedStatus,
    targetLevel,
    autoClosed
  }
}

// Statuses a national override may set. Deletion stays with the delete action.
const STANDARD_OVERRIDE_STATUSES = [
  'Sorting', 'Investigation', 'Under Review', 'Escalated', 'Referred', 'Returned',
  'ExternalReferral', 'Resolved', 'Rejected', 'In Court', 'Closed'
]
const GBV_OVERRIDE_STATUSES = [
  'Sorting', 'refer_to_settlement', 'refer_to_county', 'refer_to_action_support', 'update_feedback',
  'Referred', 'Resolved', 'Rejected', 'Closed'
]

function getOverrideStatuses(grievance, scope) {
  if (!grievance || !scope || !hasNationalAuthority(scope) || grievance.status === 'Deleted') return []
  return [...(grievance.isgbv ? GBV_OVERRIDE_STATUSES : STANDARD_OVERRIDE_STATUSES)]
}

/**
 * National override: move a grievance to any status/level, bypassing the
 * transition table and level rules. Returns the same shape as planStatusChange.
 */
function planStatusOverride({ grievance, requestedStatus, targetLevel, scope }) {
  if (!hasNationalAuthority(scope)) {
    return { ok: false, httpStatus: 403, code: '9999', message: 'Only national GRM staff can override a grievance status' }
  }
  if (grievance.status === 'Deleted') {
    return { ok: false, httpStatus: 409, code: 'INVALID_OVERRIDE', message: 'Restore a deleted grievance from its history instead of overriding it' }
  }
  const allowed = getOverrideStatuses(grievance, scope)
  if (!requestedStatus || !allowed.includes(requestedStatus)) {
    return { ok: false, httpStatus: 400, code: 'INVALID_OVERRIDE', message: `"${requestedStatus}" is not a status that can be set`, allowed }
  }

  let level
  if (targetLevel != null && targetLevel !== '') {
    if (!LEVELS.includes(targetLevel)) {
      return { ok: false, httpStatus: 400, code: 'INVALID_OVERRIDE', message: `"${targetLevel}" is not a valid level` }
    }
    level = targetLevel
  } else {
    level = computeTargetLevel(requestedStatus, grievance.current_level, { isgbv: !!grievance.isgbv }) || normalizeLevel(grievance.current_level)
  }

  if (level === 'settlement' && !grievance.settlement_id) {
    return { ok: false, httpStatus: 409, code: 'INVALID_OVERRIDE', message: 'This grievance has no settlement, so it cannot be placed at settlement level' }
  }
  if (requestedStatus === grievance.status && level === normalizeLevel(grievance.current_level)) {
    return { ok: false, httpStatus: 409, code: 'NO_CHANGE', message: 'The grievance already has this status and level' }
  }

  return { ok: true, finalStatus: requestedStatus, targetLevel: level, autoClosed: false, override: true }
}

module.exports = {
  getOverrideStatuses,
  planStatusOverride,
  LEVELS,
  TERMINAL_STATUSES,
  INACTIVE_STATUSES,
  STAGE_DURATION_DAYS,
  getStageDurationMs,
  computeStatusDates,
  computeTargetLevel,
  getUserScope,
  hasNationalAuthority,
  canActOnGrievance,
  getAllowedTransitions,
  planStatusChange
}
