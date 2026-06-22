const db = require('../models')
const { Op } = db.Sequelize

function mapLegacyLogToAuditShape(log) {
  const statusText = String(log.status || '').toLowerCase()
  const outcome = statusText.includes('fail') ? 'failure' : 'success'
  return {
    id: log.id,
    timestamp: log.date || log.createdAt || null,
    action: (log.action || 'activity').toLowerCase(),
    actorType: 'user',
    actorId: log.userId != null ? String(log.userId) : null,
    actorName: log.userName || null,
    actorRole: null,
    entityType: log.table || 'logs',
    entityId: log.id != null ? String(log.id) : null,
    resource: log.source || 'legacy',
    outcome,
    statusCode: null,
    changes: null,
    metadata: {
      source: log.source || null,
      legacyStatus: log.status || null
    }
  }
}

/**
 * Merged audit timeline — same logic as admin Logs page (audit_log + legacy logs).
 */
async function queryMergedAuditLogs({
  page = 1,
  limit = 50,
  actor = '',
  action = '',
  entityType = '',
  entityId = '',
  outcome = '',
  from = null,
  to = null,
  actorIds = null
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))
  const offset = (pageNum - 1) * limitNum

  const where = {}
  if (actor) {
    where[Op.or] = [
      { actorName: { [Op.iLike]: `%${actor}%` } },
      { actorId: { [Op.iLike]: `%${actor}%` } }
    ]
  }
  if (action) where.action = action
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = String(entityId)
  if (outcome) where.outcome = outcome
  if (actorIds && actorIds.length) {
    where.actorId = { [Op.in]: actorIds.map(String) }
  }

  if (from || to) {
    where.timestamp = {}
    if (from) where.timestamp[Op.gte] = new Date(from)
    if (to) where.timestamp[Op.lte] = new Date(to)
  }

  const legacyWhere = {}
  if (actor) {
    legacyWhere[Op.or] = [
      { userName: { [Op.iLike]: `%${actor}%` } },
      { userId: { [Op.iLike]: `%${actor}%` } }
    ]
  }
  if (action) legacyWhere.action = { [Op.iLike]: `%${action}%` }
  if (outcome) {
    legacyWhere.status = outcome === 'failure'
      ? { [Op.iLike]: '%Fail%' }
      : { [Op.notILike]: '%Fail%' }
  }
  if (actorIds && actorIds.length) {
    legacyWhere.userId = { [Op.in]: actorIds.map(String) }
  }
  if (from || to) {
    legacyWhere.date = {}
    if (from) legacyWhere.date[Op.gte] = new Date(from)
    if (to) legacyWhere.date[Op.lte] = new Date(to)
  }

  // Merge both sources in memory, then paginate — DB-level offset on one table
  // produces empty/wrong pages after the merge sort.
  const MAX_MERGE_ROWS = 10000

  const [auditRows, legacyRows] = await Promise.all([
    db.auditLog.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: MAX_MERGE_ROWS
    }),
    db.models.logs.findAll({
      where: legacyWhere,
      order: [['date', 'DESC']],
      limit: MAX_MERGE_ROWS
    })
  ])

  const combined = [
    ...(auditRows || []).map((row) => row.toJSON()),
    ...(legacyRows || []).map(mapLegacyLogToAuditShape)
  ].sort(
    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  )

  const pagedCombined = combined.slice(offset, offset + limitNum)

  return {
    data: pagedCombined,
    total: combined.length,
    page: pageNum,
    limit: limitNum
  }
}

function normalizeLoginAttemptRow(row) {
  const legacyStatus = row.metadata?.legacyStatus
  const status = legacyStatus || row.outcome || row.status || '—'
  return {
    id: row.id,
    userId: row.actorId || row.userId,
    userName: row.actorName || row.userName || '—',
    action: row.action || 'login',
    status,
    outcome: row.outcome || null,
    source: row.metadata?.source || row.resource || row.source || '—',
    date: row.timestamp || row.date || null,
    loginTime: row.loginTime || null
  }
}

module.exports = {
  mapLegacyLogToAuditShape,
  queryMergedAuditLogs,
  normalizeLoginAttemptRow
}
