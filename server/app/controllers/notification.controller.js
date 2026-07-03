const db = require('../models')
const { Op } = require('sequelize')

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function buildSourceLabel(row) {
  const moduleLabels = {
    communication: 'Broadcast',
    grievance: 'GRM',
    auth: 'Account',
    incident: 'Incident',
    data_request: 'Data request',
    feedback: 'Feedback'
  }
  const moduleLabel = moduleLabels[row.source_module] || row.source_module
  if (row.source_type) return `${moduleLabel} · ${row.source_type}`
  return moduleLabel
}

function serializeNotification(row) {
  const plain = row.get ? row.get({ plain: true }) : row
  return {
    ...plain,
    createdAt: plain.created_at || plain.createdAt || null,
    updatedAt: plain.updated_at || plain.updatedAt || null,
    source_label: buildSourceLabel(plain),
    is_read: Boolean(plain.read_at)
  }
}

exports.listMyNotifications = async (req, res) => {
  try {
    const userId = req.userid
    if (!userId) {
      return res.status(401).json({ code: '4010', message: 'Unauthorized' })
    }

    const page = Math.max(parsePositiveInt(req.query.page, 1), 1)
    const limit = Math.min(Math.max(parsePositiveInt(req.query.limit, 20), 1), 100)
    const offset = (page - 1) * limit
    const channel = req.query.channel
    const status = req.query.status
    const sourceModule = req.query.source_module
    const searchTerm = String(req.query.q || '').trim()

    const where = { user_id: userId }
    if (channel && ['sms', 'email'].includes(channel)) where.channel = channel
    if (status && ['pending', 'sent', 'failed'].includes(status)) where.status = status
    if (sourceModule) where.source_module = sourceModule
    if (searchTerm) {
      where[Op.or] = [
        { body: { [Op.iLike]: `%${searchTerm}%` } },
        { subject: { [Op.iLike]: `%${searchTerm}%` } },
        { address: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    }

    const { count, rows } = await db.models.user_notification.findAndCountAll({
      where,
      order: [['sent_at', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset
    })

    const notifications = rows.map(serializeNotification)

    return res.status(200).json({
      code: '0000',
      message: 'OK',
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit) || 0,
          totalItems: count,
          itemsPerPage: limit
        }
      }
    })
  } catch (error) {
    console.error('[Notifications] listMyNotifications error:', error)
    return res.status(500).json({ code: '5000', message: error.message || 'Failed to load notifications' })
  }
}

exports.getMyNotificationById = async (req, res) => {
  try {
    const userId = req.userid
    const id = parsePositiveInt(req.params.id, null)
    if (!userId || !id) {
      return res.status(400).json({ code: '4000', message: 'Invalid request' })
    }

    const row = await db.models.user_notification.findOne({
      where: { id, user_id: userId }
    })
    if (!row) {
      return res.status(404).json({ code: '4040', message: 'Notification not found' })
    }

    if (!row.read_at) {
      row.read_at = new Date()
      row.updated_at = new Date()
      await row.save()
    }

    const plain = row.get({ plain: true })
    return res.status(200).json({
      code: '0000',
      message: 'OK',
      data: serializeNotification({ ...plain, read_at: plain.read_at || new Date() })
    })
  } catch (error) {
    console.error('[Notifications] getMyNotificationById error:', error)
    return res.status(500).json({ code: '5000', message: error.message || 'Failed to load notification' })
  }
}

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userid
    if (!userId) {
      return res.status(401).json({ code: '4010', message: 'Unauthorized' })
    }

    const count = await db.models.user_notification.count({
      where: { user_id: userId, read_at: null }
    })

    return res.status(200).json({
      code: '0000',
      message: 'OK',
      data: { unreadCount: count }
    })
  } catch (error) {
    console.error('[Notifications] getUnreadCount error:', error)
    return res.status(500).json({ code: '5000', message: error.message || 'Failed to load unread count' })
  }
}

exports.markNotificationRead = async (req, res) => {
  try {
    const userId = req.userid
    const id = parsePositiveInt(req.params.id, null)
    if (!userId || !id) {
      return res.status(400).json({ code: '4000', message: 'Invalid request' })
    }

    const [updated] = await db.models.user_notification.update(
      { read_at: new Date(), updated_at: new Date() },
      { where: { id, user_id: userId, read_at: null } }
    )

    return res.status(200).json({
      code: '0000',
      message: updated ? 'Marked as read' : 'Already read',
      data: { updated: Boolean(updated) }
    })
  } catch (error) {
    console.error('[Notifications] markNotificationRead error:', error)
    return res.status(500).json({ code: '5000', message: error.message || 'Failed to mark notification read' })
  }
}

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.userid
    if (!userId) {
      return res.status(401).json({ code: '4010', message: 'Unauthorized' })
    }

    const [updated] = await db.models.user_notification.update(
      { read_at: new Date(), updated_at: new Date() },
      { where: { user_id: userId, read_at: null } }
    )

    return res.status(200).json({
      code: '0000',
      message: 'All notifications marked as read',
      data: { updated }
    })
  } catch (error) {
    console.error('[Notifications] markAllNotificationsRead error:', error)
    return res.status(500).json({ code: '5000', message: error.message || 'Failed to mark notifications read' })
  }
}
