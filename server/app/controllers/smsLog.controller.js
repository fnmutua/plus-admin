const db = require('../models')
const { Op } = require('sequelize')
const { SOURCE_MODULE_LABELS, getSourceModuleLabel } = require('../services/smsLog.service')

/**
 * GET /api/v1/sms-logs
 * Paginated SMS delivery log for admin tracking.
 */
exports.listSmsLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 200)
    const offset = (page - 1) * limit

    const where = {}
    if (req.query.source_module) where.source_module = req.query.source_module
    if (req.query.status && ['pending', 'sent', 'failed', 'disabled', 'skipped'].includes(req.query.status)) {
      where.status = req.query.status
    }
    if (req.query.destination) {
      where.destination = { [Op.iLike]: `%${String(req.query.destination).trim()}%` }
    }
    if (req.query.q) {
      const like = `%${String(req.query.q).trim()}%`
      where[Op.or] = [
        { destination: { [Op.iLike]: like } },
        { message: { [Op.iLike]: like } },
        { provider_message: { [Op.iLike]: like } }
      ]
    }
    if (req.query.from || req.query.to) {
      where.sent_at = {}
      if (req.query.from) where.sent_at[Op.gte] = new Date(req.query.from)
      if (req.query.to) {
        const to = new Date(req.query.to)
        to.setHours(23, 59, 59, 999)
        where.sent_at[Op.lte] = to
      }
    }

    const { count, rows } = await db.models.sms_log.findAndCountAll({
      where,
      order: [['sent_at', 'DESC'], ['id', 'DESC']],
      limit,
      offset
    })

    const initiatorIds = Array.from(new Set(rows.map((r) => r.initiated_by_user_id).filter(Boolean)))
    let initiatorMap = {}
    if (initiatorIds.length) {
      const users = await db.models.users.findAll({
        where: { id: { [Op.in]: initiatorIds } },
        attributes: ['id', 'name', 'username', 'email']
      })
      initiatorMap = users.reduce((acc, user) => {
        acc[user.id] = { id: user.id, name: user.name, username: user.username, email: user.email }
        return acc
      }, {})
    }

    return res.status(200).json({
      code: '0000',
      message: 'OK',
      results: {
        total: count,
        page,
        limit,
        sourceModules: Object.entries(SOURCE_MODULE_LABELS).map(([value, label]) => ({ value, label })),
        data: rows.map((row) => ({
          ...row.toJSON(),
          source_module_label: getSourceModuleLabel(row.source_module),
          initiator: initiatorMap[row.initiated_by_user_id] || null
        }))
      }
    })
  } catch (err) {
    console.error('[SMS Logs] listSmsLogs error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to load SMS logs' })
  }
}

/**
 * GET /api/v1/sms-logs/:id
 */
exports.getSmsLogById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ code: '4001', message: 'Invalid id' })
    }

    const row = await db.models.sms_log.findByPk(id)
    if (!row) return res.status(404).json({ code: '4040', message: 'Not found' })

    let initiator = null
    if (row.initiated_by_user_id) {
      initiator = await db.models.users.findByPk(row.initiated_by_user_id, {
        attributes: ['id', 'name', 'username', 'email']
      })
    }

    return res.status(200).json({
      code: '0000',
      message: 'OK',
      results: {
        ...row.toJSON(),
        source_module_label: getSourceModuleLabel(row.source_module),
        initiator
      }
    })
  } catch (err) {
    console.error('[SMS Logs] getSmsLogById error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to load SMS log' })
  }
}
