const db = require('../models')
const { getRequestContext } = require('./requestContext')

const SENSITIVE_KEYS = new Set([
  'password',
  'resetPasswordToken',
  'token',
  'accessToken',
  'otp'
])

/**
 * User IDs that should not create audit_log rows.
 * Set in .env as a single id or comma-separated list, e.g.:
 *   AUDIT_SKIP_USER_ID=42
 *   AUDIT_SKIP_USER_ID=42,100,101
 */
function parseSkippedAuditUserIds() {
  const raw = process.env.AUDIT_SKIP_USER_ID || process.env.AUDIT_SKIP_USER_IDS || ''
  if (!String(raw).trim()) return new Set()
  return new Set(
    String(raw)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  )
}

const SKIPPED_AUDIT_USER_IDS = parseSkippedAuditUserIds()

function shouldSkipAuditForActor(actorId) {
  if (actorId == null || actorId === '') return false
  return SKIPPED_AUDIT_USER_IDS.has(String(actorId))
}

function sanitizeObject(input) {
  if (input == null) return input
  if (Array.isArray(input)) return input.map(sanitizeObject)
  if (typeof input !== 'object') return input

  const out = {}
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(key)) {
      out[key] = '[REDACTED]'
      continue
    }
    out[key] = sanitizeObject(value)
  }
  return out
}

function deriveResource(req) {
  if (!req) return 'unknown'
  const method = req.method || 'UNKNOWN'
  const originalUrl = req.originalUrl || req.url || '/'
  return `${method} ${originalUrl}`
}

function getActorFromContext() {
  const ctx = getRequestContext()
  const req = ctx && ctx.req ? ctx.req : null
  if (!req) return null

  const actorId = req.userid != null
    ? String(req.userid)
    : req.body && req.body.userId != null
      ? String(req.body.userId)
      : null

  const actorName = req.thisUser && req.thisUser.username
    ? req.thisUser.username
    : null

  return {
    req,
    actorId,
    actorName
  }
}

async function logAudit(payload) {
  try {
    const ctx = getRequestContext()
    if (ctx?.dryRun) return
    if (!db.auditLog) return

    const req = payload.req
    const actorFromReq = req && req.thisUser ? req.thisUser : null
    const actorFromContext = !payload.actorId && !actorFromReq ? getActorFromContext() : null

    const actorId = payload.actorId
      || (actorFromReq && actorFromReq.id != null ? String(actorFromReq.id) : null)
      || (actorFromContext && actorFromContext.actorId != null ? String(actorFromContext.actorId) : null)
      || (req && req.userid != null ? String(req.userid) : null)

    if (shouldSkipAuditForActor(actorId)) return

    const actorName = payload.actorName
      || (actorFromReq && actorFromReq.username ? actorFromReq.username : null)
      || (actorFromContext && actorFromContext.actorName ? actorFromContext.actorName : null)

    await db.auditLog.create({
      timestamp: new Date(),
      action: payload.action || 'unknown',
      actorType: payload.actorType || (actorId ? 'user' : 'anonymous'),
      actorId,
      actorName,
      actorRole: payload.actorRole || null,
      entityType: payload.entityType || 'unknown',
      entityId: payload.entityId != null ? String(payload.entityId) : null,
      resource: payload.resource || deriveResource(req),
      outcome: payload.outcome || 'success',
      statusCode: payload.statusCode || null,
      changes: sanitizeObject(payload.changes || null),
      metadata: sanitizeObject(payload.metadata || null)
    })
  } catch (err) {
    console.error('[audit] Failed to persist audit log:', err.message || err)
  }
}

function sanitizeSequelizeValues(values) {
  if (!values || typeof values !== 'object') return values
  // Convert Sequelize instances and avoid non-serializable metadata
  const plain = typeof values.toJSON === 'function' ? values.toJSON() : { ...values }
  return sanitizeObject(plain)
}

async function logAuditForModelEvent({
  modelName,
  action,
  instance,
  before,
  after,
  metadata
}) {
  const actor = getActorFromContext()
  const req = actor ? actor.req : null

  const entityId = after && after.id != null
    ? String(after.id)
    : instance && instance.id != null
      ? String(instance.id)
      : before && before.id != null
        ? String(before.id)
        : null

  await logAudit({
    req,
    action,
    actorType: actor && actor.actorId ? 'user' : 'anonymous',
    actorId: actor ? actor.actorId : null,
    actorName: actor ? actor.actorName : null,
    entityType: modelName,
    entityId,
    outcome: 'success',
    statusCode: 200,
    changes: {
      before: sanitizeSequelizeValues(before),
      after: sanitizeSequelizeValues(after)
    },
    metadata: metadata || null
  })
}

module.exports = {
  logAudit,
  logAuditForModelEvent
}
