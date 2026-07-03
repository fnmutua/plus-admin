const db = require('../models')
const Sequelize = require('sequelize')
const { Op } = require('sequelize')
const { formatPhoneNumber } = require('../utils/sms')

function normalizeDeliveryStatus(status) {
  const value = String(status || '').toLowerCase()
  if (!value) return 'pending'
  if (value === 'sent' || value === 'delivered' || value === 'success' || value.includes('success')) {
    return 'sent'
  }
  if (value === 'failed' || value.includes('fail') || value.includes('error') || value.includes('disable')) {
    return 'failed'
  }
  if (value === 'pending') return 'pending'
  return 'sent'
}

function normalizePhoneDigits(value) {
  if (!value) return ''
  try {
    return formatPhoneNumber(value) || ''
  } catch {
    let digits = String(value).replace(/\D/g, '')
    if (digits.startsWith('0')) digits = `254${digits.slice(1)}`
    if (!digits.startsWith('254') && digits.length <= 10) digits = `254${digits}`
    return digits
  }
}

// Compare on the last 9 digits (Kenyan subscriber number) so 0712..., 254712...,
// +254712... and 712... all match regardless of how the phone was stored.
function phoneMatchKey(value) {
  const digits = normalizePhoneDigits(value)
  if (!digits) return ''
  return digits.slice(-9)
}

async function findUserIdByAddress(channel, address) {
  if (!address) return null
  const normalizedChannel = String(channel || '').toLowerCase()

  if (normalizedChannel === 'email') {
    const target = String(address).trim().toLowerCase()
    if (!target) return null
    const user = await db.user.findOne({
      where: Sequelize.where(
        Sequelize.fn('lower', Sequelize.fn('trim', Sequelize.col('email'))),
        target
      ),
      attributes: ['id']
    })
    return user?.id || null
  }

  const target = phoneMatchKey(address)
  if (!target) return null

  const users = await db.user.findAll({
    where: { phone: { [Op.ne]: null } },
    attributes: ['id', 'phone']
  })

  for (const user of users) {
    if (phoneMatchKey(user.phone) === target) return user.id
  }
  return null
}

async function resolveUserId({ userId = null, channel = null, address = null } = {}) {
  if (userId != null) {
    const id = parseInt(userId, 10)
    if (!Number.isNaN(id) && id > 0) {
      const user = await db.user.findByPk(id, { attributes: ['id'] })
      if (user) return user.id
      console.warn(`[NotificationService] userId ${id} not found — falling back to address lookup`)
    }
  }
  if (channel && address) {
    return findUserIdByAddress(channel, address)
  }
  return null
}

async function buildUserNotificationWhere(userId, extraWhere = {}) {
  const user = await db.user.findByPk(userId, { attributes: ['id', 'phone', 'email'] })
  const orClauses = [{ user_id: userId }]

  if (user?.email) {
    const email = String(user.email).trim().toLowerCase()
    if (email) {
      orClauses.push(
        Sequelize.where(
          Sequelize.fn('lower', Sequelize.fn('trim', Sequelize.col('address'))),
          email
        )
      )
    }
  }

  if (user?.phone) {
    const phoneKey = phoneMatchKey(user.phone)
    if (phoneKey) {
      orClauses.push(
        Sequelize.and(
          { channel: 'sms' },
          Sequelize.where(
            Sequelize.fn(
              'right',
              Sequelize.fn('regexp_replace', Sequelize.col('address'), '[^0-9]', '', 'g'),
              9
            ),
            phoneKey
          )
        )
      )
    }
  }

  if (orClauses.length === 1) {
    return { ...extraWhere, user_id: userId }
  }
  return { ...extraWhere, [Op.or]: orClauses }
}

async function recordDelivery(payload = {}) {
  const {
    userId = null,
    channel,
    subject = null,
    body,
    sourceModule,
    sourceType = null,
    sourceId = null,
    status = 'pending',
    providerCode = null,
    providerMessage = null,
    address = null,
    sentAt = null,
    legacyTable = null,
    legacyId = null
  } = payload

  if (!channel || !body || !sourceModule) return null

  let resolvedUserId = await resolveUserId({ userId, channel, address })
  if (!resolvedUserId) {
    console.warn(
      `[NotificationService] No matching user for ${channel} notification (module=${sourceModule}, address=${address || 'n/a'}) — not stored`
    )
    return null
  }

  const where = { user_id: resolvedUserId }
  if (legacyTable && legacyId != null) {
    const existing = await db.models.user_notification.findOne({
      where: { legacy_table: legacyTable, legacy_id: legacyId }
    })
    if (existing) {
      await existing.update({
        status: normalizeDeliveryStatus(status),
        provider_code: providerCode,
        provider_message: providerMessage,
        sent_at: sentAt || existing.sent_at || new Date(),
        address: address || existing.address,
        updated_at: new Date()
      })
      return existing
    }
  }

  try {
    return await db.models.user_notification.create({
      user_id: resolvedUserId,
      channel: String(channel).toLowerCase(),
      subject,
      body,
      source_module: sourceModule,
      source_type: sourceType,
      source_id: sourceId,
      status: normalizeDeliveryStatus(status),
      provider_code: providerCode,
      provider_message: providerMessage,
      address,
      sent_at: sentAt || new Date(),
      legacy_table: legacyTable,
      legacy_id: legacyId,
      created_at: new Date(),
      updated_at: new Date()
    })
  } catch (error) {
    if (legacyTable && legacyId != null && error?.name === 'SequelizeUniqueConstraintError') {
      return db.models.user_notification.findOne({
        where: { legacy_table: legacyTable, legacy_id: legacyId }
      })
    }
    console.error('[NotificationService] recordDelivery error:', error?.message || error)
    return null
  }
}

async function recordFromCommunicationRecipient(recipient, communication) {
  if (!recipient || !communication) return null
  return recordDelivery({
    userId: recipient.user_id,
    channel: recipient.channel,
    subject: communication.subject,
    body: communication.body,
    sourceModule: 'communication',
    sourceType: 'broadcast',
    sourceId: communication.id,
    status: recipient.status,
    providerCode: recipient.provider_code,
    providerMessage: recipient.provider_message,
    address: recipient.address,
    sentAt: recipient.sent_at,
    legacyTable: 'communication_recipient',
    legacyId: recipient.id
  })
}

async function recordFromGrievanceNotification(notificationRow, recipientUserId = null) {
  if (!notificationRow) return null
  const channel = String(notificationRow.medium || '').toLowerCase().includes('mail') ? 'email' : 'sms'
  return recordDelivery({
    userId: recipientUserId,
    channel,
    subject: notificationRow.type || 'Grievance notification',
    body: notificationRow.message,
    sourceModule: 'grievance',
    sourceType: notificationRow.type || 'notification',
    sourceId: notificationRow.grievance_id,
    status: notificationRow.status,
    address: notificationRow.recipient,
    sentAt: notificationRow.createdAt || new Date(),
    legacyTable: 'grievance_notification',
    legacyId: notificationRow.id
  })
}

module.exports = {
  normalizeDeliveryStatus,
  phoneMatchKey,
  findUserIdByAddress,
  resolveUserId,
  buildUserNotificationWhere,
  recordDelivery,
  recordFromCommunicationRecipient,
  recordFromGrievanceNotification
}
