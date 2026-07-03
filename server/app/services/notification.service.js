const db = require('../models')
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
    return formatPhoneNumber(value)
  } catch {
    let digits = String(value).replace(/\D/g, '')
    if (digits.startsWith('0')) digits = `254${digits.slice(1)}`
    if (!digits.startsWith('254') && digits.length <= 10) digits = `254${digits}`
    return digits
  }
}

async function findUserIdByAddress(channel, address) {
  if (!address) return null
  const normalizedChannel = String(channel || '').toLowerCase()

  if (normalizedChannel === 'email') {
    const user = await db.user.findOne({
      where: { email: { [Op.iLike]: String(address).trim() } },
      attributes: ['id']
    })
    return user?.id || null
  }

  const target = normalizePhoneDigits(address)
  if (!target) return null

  const users = await db.user.findAll({
    where: { phone: { [Op.ne]: null } },
    attributes: ['id', 'phone']
  })

  for (const user of users) {
    if (normalizePhoneDigits(user.phone) === target) return user.id
  }
  return null
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

  let resolvedUserId = userId
  if (!resolvedUserId && address) {
    resolvedUserId = await findUserIdByAddress(channel, address)
  }
  if (!resolvedUserId) return null

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

async function recordFromGrievanceNotification(notificationRow) {
  if (!notificationRow) return null
  const channel = String(notificationRow.medium || '').toLowerCase().includes('mail') ? 'email' : 'sms'
  return recordDelivery({
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
  findUserIdByAddress,
  recordDelivery,
  recordFromCommunicationRecipient,
  recordFromGrievanceNotification
}
