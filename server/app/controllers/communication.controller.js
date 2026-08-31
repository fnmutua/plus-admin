/* eslint-disable prettier/prettier */
/**
 * Admin Communications controller.
 *
 * Lets an authorised admin send SMS and/or Email broadcasts to:
 *   - users matching one or more roles (optionally narrowed by county)
 *   - a specific list of user IDs
 *   - a free-form list of phone numbers / email addresses ('custom' mode)
 *
 * Each broadcast is persisted to `communication`, with one row per delivery
 * attempt in `communication_recipient`. Sending happens synchronously
 * (best-effort; partial failures are recorded, not thrown).
 */

const db = require('../models')
const { Op } = require('sequelize')
const nodemailer = require('nodemailer')
const notificationService = require('../services/notification.service')
const { sendSmsWithResult } = require('../utils/sms')
const ADMIN_SEND_ROLES = new Set(['admin', 'super_admin', 'root_admin'])
const ROLE_RANK_FALLBACK = {
  root_admin: 100,
  super_admin: 90,
  admin: 80,
  support: 70,
  monitoring: 65,
  staff: 60,
  consultant: 55,
  grm: 50,
  gbv: 50,
  donor: 20,
  public: 10
}

// Match incident.controller.js – Kenyan-centric phone normaliser, falls back to digits-only.
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null
  const cleaned = String(phoneNumber).replace(/\D/g, '')
  if (!cleaned) return null
  if (cleaned.startsWith('254')) return cleaned
  if (cleaned.startsWith('0')) return '254' + cleaned.substring(1)
  if (cleaned.startsWith('7') && cleaned.length === 9) return '254' + cleaned
  if (cleaned.length === 9) return '254' + cleaned
  return cleaned
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function isEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}
function isPhoneish(value) {
  if (!value) return false
  const cleaned = String(value).replace(/\D/g, '')
  return cleaned.length >= 9
}

// Lazily build a nodemailer transporter. We mirror the credentials used by
// incident.controller.js so existing env vars / fallbacks keep working.
let cachedTransporter = null
function getMailTransporter() {
  if (cachedTransporter) return cachedTransporter
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'kisip.mis@gmail.com',
      pass: process.env.EMAIL_PASS || 'ycoxaqavmfiqljjg'
    }
  })
  return cachedTransporter
}

async function sendEmail(address, subject, body) {
  if (!isEmail(address)) {
    return { ok: false, code: 'INVALID', message: 'Invalid email address' }
  }
  try {
    const transporter = getMailTransporter()
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'kisip.mis@gmail.com',
      to: address,
      subject: subject || 'Notification',
      text: body || '',
      html: body ? body.replace(/\n/g, '<br/>') : undefined
    })
    return { ok: true, code: '200', message: info && info.messageId ? info.messageId : 'Sent' }
  } catch (err) {
    return {
      ok: false,
      code: 'ERROR',
      message: (err && err.message) || 'Email provider error'
    }
  }
}

function uniqueInts(values) {
  return Array.from(
    new Set((Array.isArray(values) ? values : []).map((v) => Number(v)).filter((n) => Number.isFinite(n)))
  )
}

async function getSenderAccess(userId) {
  if (!userId) return null
  const user = await db.user.findByPk(userId, {
    attributes: ['id', 'name', 'username', 'email'],
    include: [
      {
        model: db.role,
        attributes: ['id', 'name', 'subordinates'],
        include: [{ model: db.permission, attributes: ['name'] }]
      }
    ]
  })
  if (!user) return null

  const roles = Array.isArray(user.roles) ? user.roles : []
  const roleNames = roles.map((r) => r.name).filter(Boolean)
  const roleIds = uniqueInts(roles.map((r) => r.id))
  const permissionSet = new Set(
    roles.flatMap((r) => (Array.isArray(r.permissions) ? r.permissions.map((p) => p.name).filter(Boolean) : []))
  )

  const userRoleRows = await db.models.user_roles.findAll({
    where: { userid: user.id },
    attributes: ['county_id']
  })
  const countyIds = uniqueInts(userRoleRows.map((r) => r.county_id))

  const isAdminOrAbove = roleNames.some((name) => ADMIN_SEND_ROLES.has(name))
  const hasSubordinateScope = permissionSet.has('communication:send_subordinates')
  const hasCountyScope = permissionSet.has('communication:send_county')

  return {
    user,
    roleNames,
    roleIds,
    permissionSet,
    countyIds,
    isAdminOrAbove,
    hasSubordinateScope,
    hasCountyScope
  }
}

function buildAllowedSubordinateRoleIds(access, allRoles) {
  if (!access || !access.hasSubordinateScope) return null
  const fromModel = new Set()
  for (const role of Array.isArray(access.user.roles) ? access.user.roles : []) {
    if (Array.isArray(role.subordinates)) {
      role.subordinates.forEach((id) => {
        if (Number.isFinite(id)) fromModel.add(Number(id))
      })
    }
  }
  if (fromModel.size > 0) return Array.from(fromModel)

  // Fallback hierarchy when `subordinates` is not configured.
  const senderRank = Math.max(...access.roleNames.map((r) => ROLE_RANK_FALLBACK[r] || -1), -1)
  if (senderRank < 0) return null
  const derived = allRoles
    .filter((r) => (ROLE_RANK_FALLBACK[r.name] || -1) < senderRank)
    .map((r) => Number(r.id))
    .filter((id) => Number.isFinite(id))
  return derived.length ? derived : null
}

function getRestrictedCountyIds(access) {
  if (!access || !access.hasCountyScope) return null
  // Root / super admins are global by design; never county-restrict them.
  if (access.roleNames.includes('root_admin') || access.roleNames.includes('super_admin')) {
    return null
  }
  // Ignore non-real county markers like 0/null.
  const valid = uniqueInts(access.countyIds).filter((id) => id > 0)
  return valid.length ? valid : null
}

/**
 * Resolve a recipient payload into an array of:
 *   { user_id, name, address, channel }
 *
 * Channel rules:
 *   - 'sms'   → only phone-bearing recipients
 *   - 'email' → only email-bearing recipients
 *   - 'both'  → emit one row per available channel for each user
 */
async function resolveRecipients({
  channel,
  recipientMode,
  recipientFilter,
  senderAccess,
  allowedSmsRoleIds,
  restrictedCountyIds
}) {
  const wantSms = channel === 'sms' || channel === 'both'
  const wantEmail = channel === 'email' || channel === 'both'
  const out = []

  if (recipientMode === 'roles') {
    const roleNames = Array.isArray(recipientFilter && recipientFilter.roles)
      ? recipientFilter.roles.filter(Boolean)
      : []
    if (!roleNames.length) return out

    // Resolve role names → role IDs.
    let roleRows = await db.role.findAll({
      where: { name: { [Op.in]: roleNames } },
      attributes: ['id', 'name']
    })
    if (wantSms && Array.isArray(allowedSmsRoleIds)) {
      roleRows = roleRows.filter((r) => allowedSmsRoleIds.includes(Number(r.id)))
    }
    const roleIds = roleRows.map((r) => r.id)
    if (!roleIds.length) return out

    // Find user_roles assignments for those roles, optionally narrowed by level, county, or settlement.
    const urWhere = { roleid: { [Op.in]: roleIds } }

    // Level filter: national | county | settlement
    const locationLevel = recipientFilter && recipientFilter.location_level
    if (locationLevel && ['national', 'county', 'settlement'].includes(locationLevel)) {
      urWhere.location_level = locationLevel
    }

    const explicitCountyId = recipientFilter && recipientFilter.county_id ? Number(recipientFilter.county_id) : null
    if (explicitCountyId) {
      urWhere.county_id = explicitCountyId
    } else if (Array.isArray(restrictedCountyIds) && restrictedCountyIds.length) {
      urWhere.county_id = { [Op.in]: restrictedCountyIds }
    }

    const explicitSettlementId = recipientFilter && recipientFilter.settlement_id ? Number(recipientFilter.settlement_id) : null
    if (explicitSettlementId) {
      urWhere.settlement_id = explicitSettlementId
    }

    const userRoleRows = await db.models.user_roles.findAll({
      where: urWhere,
      attributes: ['userid']
    })
    const userIds = Array.from(new Set(userRoleRows.map((r) => r.userid))).filter(Boolean)
    if (!userIds.length) return out

    const users = await db.models.users.findAll({
      where: { id: { [Op.in]: userIds }, isactive: true },
      attributes: ['id', 'name', 'username', 'email', 'phone']
    })
    for (const u of users) {
      if (senderAccess && Number(u.id) === Number(senderAccess.user.id)) continue
      if (wantSms && isPhoneish(u.phone)) {
        out.push({ user_id: u.id, name: u.name || u.username, address: u.phone, channel: 'sms' })
      }
      if (wantEmail && isEmail(u.email)) {
        out.push({ user_id: u.id, name: u.name || u.username, address: u.email, channel: 'email' })
      }
    }
    return out
  }

  if (recipientMode === 'users') {
    const userIds = Array.isArray(recipientFilter && recipientFilter.user_ids)
      ? recipientFilter.user_ids.map(Number).filter((n) => Number.isFinite(n))
      : []
    if (!userIds.length) return out
    let users = await db.models.users.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ['id', 'name', 'username', 'email', 'phone']
    })
    if (Array.isArray(restrictedCountyIds) && restrictedCountyIds.length) {
      const countyScopedRows = await db.models.user_roles.findAll({
        where: {
          userid: { [Op.in]: users.map((u) => u.id) },
          county_id: { [Op.in]: restrictedCountyIds }
        },
        attributes: ['userid']
      })
      const allowedUserIds = new Set(countyScopedRows.map((r) => Number(r.userid)))
      users = users.filter((u) => allowedUserIds.has(Number(u.id)))
    }

    let smsAllowedUserIds = null
    if (wantSms && Array.isArray(allowedSmsRoleIds)) {
      const smsScopedRows = await db.models.user_roles.findAll({
        where: {
          userid: { [Op.in]: users.map((u) => u.id) },
          roleid: { [Op.in]: allowedSmsRoleIds }
        },
        attributes: ['userid']
      })
      smsAllowedUserIds = new Set(smsScopedRows.map((r) => Number(r.userid)))
    }

    for (const u of users) {
      if (senderAccess && Number(u.id) === Number(senderAccess.user.id)) continue
      if (wantSms && isPhoneish(u.phone) && (!smsAllowedUserIds || smsAllowedUserIds.has(Number(u.id)))) {
        out.push({ user_id: u.id, name: u.name || u.username, address: u.phone, channel: 'sms' })
      }
      if (wantEmail && isEmail(u.email)) {
        out.push({ user_id: u.id, name: u.name || u.username, address: u.email, channel: 'email' })
      }
    }
    return out
  }

  if (recipientMode === 'custom') {
    // Free-form SMS bypasses role/county controls; block it when SMS channel is involved.
    if (wantSms) return out
    const raw = Array.isArray(recipientFilter && recipientFilter.addresses)
      ? recipientFilter.addresses
      : []
    for (const entry of raw) {
      const value = String(entry || '').trim()
      if (!value) continue
      if (wantEmail && isEmail(value)) {
        out.push({ user_id: null, name: null, address: value, channel: 'email' })
        continue
      }
      if (wantSms && isPhoneish(value)) {
        out.push({ user_id: null, name: null, address: value, channel: 'sms' })
        continue
      }
    }
    return out
  }

  return out
}

// De-dup so the same address isn't messaged twice on the same channel.
function dedupeRecipients(rows) {
  const seen = new Set()
  const out = []
  for (const r of rows) {
    const key = `${r.channel}::${(r.address || '').toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}

async function fanOutRecipients(communication, recipientRows) {
  let sent = 0
  let failed = 0
  for (const recipient of recipientRows) {
    let result
    if (recipient.channel === 'sms') {
      result = await sendSmsWithResult(recipient.address, communication.body, {
        sourceModule: 'communication',
        sourceType: 'broadcast',
        sourceId: communication.id,
        initiatedByUserId: communication.sender_id
      })
    } else {
      result = await sendEmail(recipient.address, communication.subject, communication.body)
    }
    recipient.status = result.ok ? 'sent' : 'failed'
    recipient.provider_code = result.code || null
    recipient.provider_message = result.message || null
    recipient.sent_at = new Date()
    await recipient.save()
    await notificationService.recordFromCommunicationRecipient(recipient, communication)
    if (result.ok) sent += 1
    else failed += 1
  }
  return { sent, failed }
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/communications/preview
 * Return the resolved recipients (no sending) so the UI can show a count
 * and per-user list before the admin commits.
 */
exports.previewRecipients = async (req, res) => {
  try {
    const { channel, recipient_mode, recipient_filter } = req.body || {}
    if (!channel || !['sms', 'email', 'both'].includes(channel)) {
      return res.status(400).json({ code: '4001', message: 'channel must be sms | email | both' })
    }
    if (!recipient_mode || !['roles', 'users', 'custom'].includes(recipient_mode)) {
      return res.status(400).json({ code: '4002', message: 'recipient_mode must be roles | users | custom' })
    }
    const senderAccess = await getSenderAccess(req.userid)
    if (!senderAccess || !senderAccess.isAdminOrAbove) {
      return res.status(403).json({ code: '4030', message: 'Only admin users and above can send communications' })
    }
    const allRoles = await db.role.findAll({ attributes: ['id', 'name'] })
    const allowedSmsRoleIds = buildAllowedSubordinateRoleIds(senderAccess, allRoles)
    const restrictedCountyIds = getRestrictedCountyIds(senderAccess)

    const resolved = dedupeRecipients(
      await resolveRecipients({
        channel,
        recipientMode: recipient_mode,
        recipientFilter: recipient_filter || {},
        senderAccess,
        allowedSmsRoleIds,
        restrictedCountyIds
      })
    )
    return res.status(200).json({
      code: '0000',
      message: 'OK',
      results: {
        total: resolved.length,
        bySms: resolved.filter((r) => r.channel === 'sms').length,
        byEmail: resolved.filter((r) => r.channel === 'email').length,
        recipients: resolved
      }
    })
  } catch (err) {
    console.error('[Communications] previewRecipients error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to preview recipients' })
  }
}

/**
 * POST /api/v1/communications
 * Create a broadcast and synchronously fan out delivery.
 */
exports.createCommunication = async (req, res) => {
  try {
    const { channel, subject, body, recipient_mode, recipient_filter } = req.body || {}

    if (!channel || !['sms', 'email', 'both'].includes(channel)) {
      return res.status(400).json({ code: '4001', message: 'channel must be sms | email | both' })
    }
    if (!recipient_mode || !['roles', 'users', 'custom'].includes(recipient_mode)) {
      return res.status(400).json({ code: '4002', message: 'recipient_mode must be roles | users | custom' })
    }
    if (!body || !String(body).trim()) {
      return res.status(400).json({ code: '4003', message: 'body is required' })
    }
    if ((channel === 'email' || channel === 'both') && (!subject || !String(subject).trim())) {
      return res.status(400).json({ code: '4004', message: 'subject is required for email broadcasts' })
    }
    const senderAccess = await getSenderAccess(req.userid)
    if (!senderAccess || !senderAccess.isAdminOrAbove) {
      return res.status(403).json({ code: '4030', message: 'Only admin users and above can send communications' })
    }
    if ((channel === 'sms' || channel === 'both') && recipient_mode === 'custom') {
      return res.status(400).json({
        code: '4006',
        message: 'Custom recipient mode cannot be used for SMS. Use role or user selection.'
      })
    }
    const allRoles = await db.role.findAll({ attributes: ['id', 'name'] })
    const allowedSmsRoleIds = buildAllowedSubordinateRoleIds(senderAccess, allRoles)
    const restrictedCountyIds = getRestrictedCountyIds(senderAccess)

    const resolved = dedupeRecipients(
      await resolveRecipients({
        channel,
        recipientMode: recipient_mode,
        recipientFilter: recipient_filter || {},
        senderAccess,
        allowedSmsRoleIds,
        restrictedCountyIds
      })
    )
    if (!resolved.length) {
      return res.status(400).json({ code: '4005', message: 'No deliverable recipients matched the selection' })
    }

    const communication = await db.models.communication.create({
      channel,
      subject: subject || null,
      body,
      recipient_mode,
      recipient_filter: recipient_filter || null,
      total_recipients: resolved.length,
      pending_count: resolved.length,
      sent_count: 0,
      failed_count: 0,
      status: 'sending',
      sender_id: req.userid || null
    })

    const recipientRows = await db.models.communication_recipient.bulkCreate(
      resolved.map((r) => ({
        communication_id: communication.id,
        user_id: r.user_id,
        name: r.name,
        channel: r.channel,
        address: r.address,
        status: 'pending'
      })),
      { returning: true }
    )

    const { sent, failed } = await fanOutRecipients(communication, recipientRows)

    let finalStatus = 'completed'
    if (sent === 0) finalStatus = 'failed'
    else if (failed > 0) finalStatus = 'partial'

    communication.sent_count = sent
    communication.failed_count = failed
    communication.pending_count = 0
    communication.status = finalStatus
    await communication.save()

    return res.status(200).json({
      code: '0000',
      message: 'Broadcast dispatched',
      results: {
        id: communication.id,
        total: resolved.length,
        sent,
        failed,
        status: finalStatus
      }
    })
  } catch (err) {
    console.error('[Communications] createCommunication error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to send broadcast' })
  }
}

/**
 * GET /api/v1/communications
 * Paginated list of past broadcasts.
 */
exports.listCommunications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200)
    const offset = (page - 1) * limit

    const where = {}
    if (req.query.channel && ['sms', 'email', 'both'].includes(req.query.channel)) {
      where.channel = req.query.channel
    }
    if (req.query.status) where.status = req.query.status
    if (req.query.q) {
      const like = `%${req.query.q}%`
      where[Op.or] = [{ subject: { [Op.iLike]: like } }, { body: { [Op.iLike]: like } }]
    }

    const { count, rows } = await db.models.communication.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    // Hydrate sender names so the table doesn't show bare IDs.
    const senderIds = Array.from(new Set(rows.map((r) => r.sender_id).filter(Boolean)))
    let senderMap = {}
    if (senderIds.length) {
      const senders = await db.models.users.findAll({
        where: { id: { [Op.in]: senderIds } },
        attributes: ['id', 'name', 'username', 'email']
      })
      senderMap = senders.reduce((acc, s) => {
        acc[s.id] = { id: s.id, name: s.name, username: s.username, email: s.email }
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
        data: rows.map((r) => ({
          ...r.toJSON(),
          sender: senderMap[r.sender_id] || null
        }))
      }
    })
  } catch (err) {
    console.error('[Communications] listCommunications error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to load broadcasts' })
  }
}

/**
 * GET /api/v1/communications/:id
 * Broadcast + per-recipient delivery rows.
 */
exports.getCommunicationById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ code: '4001', message: 'Invalid id' })
    }
    const record = await db.models.communication.findByPk(id, {
      include: [{ model: db.models.communication_recipient, as: 'recipients' }]
    })
    if (!record) return res.status(404).json({ code: '4040', message: 'Not found' })

    let sender = null
    if (record.sender_id) {
      sender = await db.models.users.findByPk(record.sender_id, {
        attributes: ['id', 'name', 'username', 'email']
      })
    }

    return res.status(200).json({
      code: '0000',
      message: 'OK',
      results: { ...record.toJSON(), sender }
    })
  } catch (err) {
    console.error('[Communications] getCommunicationById error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to load broadcast' })
  }
}

/**
 * POST /api/v1/communications/:id/recipients/:recipientId/retry
 * Re-attempt delivery for a single failed recipient and bump the parent counters.
 */
exports.retryRecipient = async (req, res) => {
  try {
    const commId = parseInt(req.params.id, 10)
    const recipientId = parseInt(req.params.recipientId, 10)
    if (!Number.isFinite(commId) || !Number.isFinite(recipientId)) {
      return res.status(400).json({ code: '4001', message: 'Invalid id' })
    }
    const communication = await db.models.communication.findByPk(commId)
    if (!communication) return res.status(404).json({ code: '4040', message: 'Communication not found' })

    const recipient = await db.models.communication_recipient.findOne({
      where: { id: recipientId, communication_id: commId }
    })
    if (!recipient) return res.status(404).json({ code: '4041', message: 'Recipient not found' })

    const wasFailed = recipient.status === 'failed'

    let result
    if (recipient.channel === 'sms') {
      result = await sendSmsWithResult(recipient.address, communication.body, {
        sourceModule: 'communication',
        sourceType: 'broadcast',
        sourceId: communication.id,
        initiatedByUserId: communication.sender_id
      })
    } else {
      result = await sendEmail(recipient.address, communication.subject, communication.body)
    }
    recipient.status = result.ok ? 'sent' : 'failed'
    recipient.provider_code = result.code || null
    recipient.provider_message = result.message || null
    recipient.sent_at = new Date()
    await recipient.save()
    await notificationService.recordFromCommunicationRecipient(recipient, communication)

    if (wasFailed && result.ok) {
      communication.failed_count = Math.max(0, (communication.failed_count || 0) - 1)
      communication.sent_count = (communication.sent_count || 0) + 1
      if (communication.failed_count === 0) communication.status = 'completed'
      await communication.save()
    }

    return res.status(200).json({
      code: '0000',
      message: 'Retry completed',
      results: {
        recipient: recipient.toJSON(),
        communication_status: communication.status,
        sent_count: communication.sent_count,
        failed_count: communication.failed_count
      }
    })
  } catch (err) {
    console.error('[Communications] retryRecipient error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to retry' })
  }
}

/**
 * GET /api/v1/communications/meta/users?q=...
 * Lightweight user search for the "specific users" recipient picker.
 * Returns up to 50 active users matching name / username / email.
 * Intentionally minimal payload (id, name, username, email, phone) so the
 * Compose form can render results in an <el-select> without dragging
 * roles/county joins along.
 */
exports.searchUsersForRecipients = async (req, res) => {
  try {
    const senderAccess = await getSenderAccess(req.userid)
    if (!senderAccess || !senderAccess.isAdminOrAbove) {
      return res.status(403).json({ code: '4030', message: 'Only admin users and above can send communications' })
    }
    const q = String(req.query.q || '').trim()
    const channel = String(req.query.channel || '').trim()
    const wantSms = channel === 'sms' || channel === 'both'
    const baseAttrs = ['id', 'name', 'username', 'email', 'phone']
    const baseWhere = { isactive: true }

    let users
    if (!q) {
      users = await db.models.users.findAll({
        where: baseWhere,
        attributes: baseAttrs,
        order: [['name', 'ASC']],
        limit: 50
      })
    } else {
      const like = `%${q}%`
      users = await db.models.users.findAll({
        where: {
          ...baseWhere,
          [Op.or]: [
            { name: { [Op.iLike]: like } },
            { username: { [Op.iLike]: like } },
            { email: { [Op.iLike]: like } },
            { phone: { [Op.iLike]: like } }
          ]
        },
        attributes: baseAttrs,
        order: [['name', 'ASC']],
        limit: 50
      })
    }

    const restrictedCountyIds = getRestrictedCountyIds(senderAccess)
    if (restrictedCountyIds && restrictedCountyIds.length) {
      const scopedRows = await db.models.user_roles.findAll({
        where: {
          userid: { [Op.in]: users.map((u) => u.id) },
          county_id: { [Op.in]: restrictedCountyIds }
        },
        attributes: ['userid']
      })
      const allowedUserIds = new Set(scopedRows.map((r) => Number(r.userid)))
      users = users.filter((u) => allowedUserIds.has(Number(u.id)))
    }

    if (wantSms && senderAccess.hasSubordinateScope) {
      const allRoles = await db.role.findAll({ attributes: ['id', 'name'] })
      const allowedSmsRoleIds = buildAllowedSubordinateRoleIds(senderAccess, allRoles)
      if (Array.isArray(allowedSmsRoleIds) && allowedSmsRoleIds.length) {
        const scopedSmsRows = await db.models.user_roles.findAll({
          where: {
            userid: { [Op.in]: users.map((u) => u.id) },
            roleid: { [Op.in]: allowedSmsRoleIds }
          },
          attributes: ['userid']
        })
        const smsAllowedUserIds = new Set(scopedSmsRows.map((r) => Number(r.userid)))
        users = users.filter((u) => smsAllowedUserIds.has(Number(u.id)))
      }
    }

    users = users.filter((u) => Number(u.id) !== Number(senderAccess.user.id))

    return res.status(200).json({
      code: '0000',
      message: 'OK',
      results: users
    })
  } catch (err) {
    console.error('[Communications] searchUsersForRecipients error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to search users' })
  }
}

/**
 * GET /api/v1/communications/meta/settlements?county_id=&q=
 * Lightweight settlement list for the "settlement level" recipient picker.
 * Returns up to 200 settlements matching optional county_id and name search.
 */
exports.listSettlementsForRecipients = async (req, res) => {
  try {
    const senderAccess = await getSenderAccess(req.userid)
    if (!senderAccess || !senderAccess.isAdminOrAbove) {
      return res.status(403).json({ code: '4030', message: 'Only admin users and above can send communications' })
    }
    const where = {}
    const countyId = req.query.county_id ? Number(req.query.county_id) : null
    if (countyId) where.county_id = countyId

    const q = String(req.query.q || '').trim()
    if (q) {
      where.name = { [Op.iLike]: `%${q}%` }
    }

    const settlements = await db.models.settlement.findAll({
      where,
      attributes: ['id', 'name', 'county_id'],
      order: [['name', 'ASC']],
      limit: 200
    })
    return res.status(200).json({ code: '0000', message: 'OK', results: settlements })
  } catch (err) {
    console.error('[Communications] listSettlementsForRecipients error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to load settlements' })
  }
}

/**
 * GET /api/v1/communications/meta/roles
 * Minimal helper so the Compose UI can populate the role selector without
 * pulling the full /api/v1/role payload.
 */
exports.listRolesForRecipients = async (req, res) => {
  try {
    const senderAccess = await getSenderAccess(req.userid)
    if (!senderAccess || !senderAccess.isAdminOrAbove) {
      return res.status(403).json({ code: '4030', message: 'Only admin users and above can send communications' })
    }
    const channel = String(req.query.channel || '').trim()
    const wantSms = channel === 'sms' || channel === 'both'

    let roles = await db.role.findAll({
      where: { isactive: { [Op.or]: [true, null] } },
      attributes: ['id', 'name', 'description'],
      order: [['name', 'ASC']]
    })
    if (wantSms && senderAccess.hasSubordinateScope) {
      const roleSubset = buildAllowedSubordinateRoleIds(senderAccess, roles)
      if (Array.isArray(roleSubset) && roleSubset.length) {
        const allowedSet = new Set(roleSubset.map((id) => Number(id)))
        roles = roles.filter((r) => allowedSet.has(Number(r.id)))
      }
    }
    return res.status(200).json({
      code: '0000',
      message: 'OK',
      results: roles
    })
  } catch (err) {
    console.error('[Communications] listRolesForRecipients error:', err)
    return res.status(500).json({ code: '5000', message: err.message || 'Failed to load roles' })
  }
}
