const db = require('../models')
const { Op } = db.Sequelize

function mapLegacyLogToAuditShape(log) {
  const statusText = String(log.status || '').toLowerCase()
  const outcome = statusText.includes('fail') ? 'failure' : 'success'
  return {
    id: log.id,
    timestamp: log.date || log.createdAt || null,
    action: log.action || 'activity',
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

exports.getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      actor = '',
      action = '',
      entityType = '',
      entityId = '',
      outcome = '',
      from = '',
      to = ''
    } = req.body || {}

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

    if (from || to) {
      where.timestamp = {}
      if (from) where.timestamp[Op.gte] = new Date(from)
      if (to) where.timestamp[Op.lte] = new Date(to)
    }

    const result = await db.auditLog.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: limitNum,
      offset
    })

    // Also include legacy logs table so historical entries are visible in one timeline.
    const legacyWhere = {}
    if (actor) {
      legacyWhere[Op.or] = [
        { userName: { [Op.iLike]: `%${actor}%` } },
        { userId: { [Op.iLike]: `%${actor}%` } }
      ]
    }
    if (action) legacyWhere.action = { [Op.iLike]: `%${action}%` }
    if (outcome) {
      legacyWhere.status = outcome === 'failure' ? { [Op.iLike]: '%Fail%' } : { [Op.notILike]: '%Fail%' }
    }
    if (from || to) {
      legacyWhere.date = {}
      if (from) legacyWhere.date[Op.gte] = new Date(from)
      if (to) legacyWhere.date[Op.lte] = new Date(to)
    }

    const mergeFetchSize = offset + limitNum
    const legacyResult = await db.models.logs.findAndCountAll({
      where: legacyWhere,
      order: [['date', 'DESC']],
      limit: mergeFetchSize
    })

    const combined = [
      ...(result.rows || []).map((row) => row.toJSON()),
      ...(legacyResult.rows || []).map(mapLegacyLogToAuditShape)
    ].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())

    const pagedCombined = combined.slice(offset, offset + limitNum)
    const combinedTotal = Number(result.count || 0) + Number(legacyResult.count || 0)

    return res.status(200).send({
      code: '0000',
      message: 'Audit logs retrieved successfully',
      data: pagedCombined,
      total: combinedTotal,
      page: pageNum,
      limit: limitNum
    })
  } catch (error) {
    console.error('Error retrieving audit logs:', error)
    return res.status(500).send({
      code: '9999',
      message: 'Unable to retrieve audit logs',
      error: error.message
    })
  }
}
