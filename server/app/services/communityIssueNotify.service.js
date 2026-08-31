const db = require('../models')
const { sendSMS, formatPhoneNumber } = require('../utils/sms')
const { isCommunityIssueSMSEnabled } = require('../utils/smsSettings')
const notificationService = require('./notification.service')
const { getFrontendBaseUrl } = require('../utils/frontend-url')
const { ISSUE_TYPES } = require('../config/communityIssue')

function getPublicTrackingUrl(req, issue) {
  const base = getFrontendBaseUrl(req)
  const id = issue?.id
  if (!id) return `${base}/#/community-issues`
  return `${base}/#/community-issues/${id}`
}

function issueTypeLabel(value) {
  const match = ISSUE_TYPES.find((item) => item.value === value)
  return match?.label || value || 'N/A'
}

async function getSupportUsers() {
  return db.user.findAll({
    attributes: ['id', 'name', 'email', 'phone', 'isactive'],
    include: [
      {
        model: db.role,
        attributes: ['name'],
        where: { name: 'support' },
        through: { attributes: [] },
      },
    ],
  })
}

function roleAssignment(role) {
  return role?.user_roles || {}
}

/**
 * National admins/staff and county-scoped admins for the issue's county.
 */
async function getAdminAlertRecipients(issue) {
  const issueCountyId =
    issue?.county_id != null && issue.county_id !== '' ? Number(issue.county_id) : null

  const users = await db.user.findAll({
    where: { isactive: true },
    attributes: ['id', 'name', 'email', 'phone', 'isactive'],
    include: [
      {
        model: db.role,
        required: true,
        attributes: ['name'],
        through: { attributes: ['location_level', 'county_id'] },
      },
    ],
  })

  const recipients = new Map()

  for (const user of users) {
    if (!formatPhoneNumber(user?.phone)) continue

    const roles = user.roles || []
    const shouldNotify = roles.some((role) => {
      const assignment = roleAssignment(role)
      const level = assignment.location_level
      const roleCountyId =
        assignment.county_id != null && assignment.county_id !== ''
          ? Number(assignment.county_id)
          : null

      if (['root_admin', 'super_admin', 'support'].includes(role.name)) return true

      if (['admin', 'staff', 'slum_upgrading', 'monitoring'].includes(role.name)) {
        if (!level || level === 'national' || level === 'regional') return true
        if (level === 'county' && issueCountyId && roleCountyId === issueCountyId) return true
        return false
      }

      if (role.name === 'county_admin' && issueCountyId && roleCountyId === issueCountyId) {
        return true
      }

      if (role.name === 'grm' && level === 'county' && issueCountyId && roleCountyId === issueCountyId) {
        return true
      }

      return false
    })

    if (shouldNotify) {
      recipients.set(user.id, user)
    }
  }

  return [...recipients.values()]
}

async function loadIssueLocationNames(issue) {
  let settlementName = 'N/A'
  let countyName = ''

  if (issue?.settlement_id) {
    const settlement = await db.models.settlement.findByPk(issue.settlement_id, {
      attributes: ['id', 'name', 'county_id'],
      include: [
        {
          model: db.models.county,
          attributes: ['name'],
          required: false,
        },
      ],
    })
    if (settlement) {
      settlementName = settlement.name || settlementName
      countyName = settlement.county?.name || ''
    }
  }

  return { settlementName, countyName }
}

async function sendTrackedSms({
  phone,
  message,
  userId = null,
  sourceType,
  sourceId,
  addressForLog,
}) {
  const mobile = formatPhoneNumber(phone)
  if (!mobile || !message) return

  try {
    await sendSMS(mobile, message, {
      sourceModule: 'community_issue',
      sourceType,
      sourceId,
      initiatedByUserId: userId
    })
    await notificationService.recordDelivery({
      userId,
      channel: 'sms',
      body: message,
      sourceModule: 'community_issue',
      sourceType,
      sourceId,
      status: 'sent',
      address: addressForLog || mobile,
      sentAt: new Date(),
    })
  } catch (error) {
    console.error(`[community_issue] SMS failed (${sourceType}):`, error?.message || error)
    await notificationService.recordDelivery({
      userId,
      channel: 'sms',
      body: message,
      sourceModule: 'community_issue',
      sourceType,
      sourceId,
      status: 'failed',
      providerMessage: error?.message || String(error),
      address: addressForLog || mobile,
      sentAt: new Date(),
    })
  }
}

async function notifyReporter(issue, req, { settlementName, countyName }) {
  if (!issue?.reporter_phone) return

  const reporterName = issue.reporter_name || 'Reporter'
  const location = countyName ? `${settlementName}, ${countyName}` : settlementName
  const trackUrl = getPublicTrackingUrl(req, issue)
  const message = `Dear ${reporterName}, your community issue report ${issue.code} was received (${location}). Track status: ${trackUrl} - KeSMIS`

  await sendTrackedSms({
    phone: issue.reporter_phone,
    message,
    sourceType: 'reporter_ack',
    sourceId: issue.id,
    addressForLog: issue.reporter_phone,
  })
}

async function notifyReporterStatusChange(issue, req, { oldStatus, newStatus, resolutionNote }) {
  if (!issue?.reporter_phone) return
  if (!newStatus || oldStatus === newStatus) return

  const reporterName = issue.reporter_name || 'Reporter'
  const trackUrl = getPublicTrackingUrl(req, issue)
  const noteSnippet = resolutionNote
    ? ` Note: ${String(resolutionNote).trim().slice(0, 120)}${String(resolutionNote).length > 120 ? '…' : ''}`
    : ''
  const message = `Dear ${reporterName}, your community issue ${issue.code} status is now ${newStatus}.${noteSnippet} Details: ${trackUrl} - KeSMIS`

  await sendTrackedSms({
    phone: issue.reporter_phone,
    message,
    sourceType: 'reporter_status_update',
    sourceId: issue.id,
    addressForLog: issue.reporter_phone,
  })
}

async function notifyAdminTeam(issue, req, { settlementName, countyName }) {
  const alertUsers = await getAdminAlertRecipients(issue)
  const activeUsers = (alertUsers || []).filter((user) => user?.isactive)
  if (!activeUsers.length) {
    console.log('[community_issue] No active admin users found for SMS alert')
    return
  }

  const frontendUrl = getFrontendBaseUrl(req)
  const adminUrl = `${frontendUrl}/#/data/community/issues`
  const location = countyName ? `${settlementName}, ${countyName}` : settlementName
  const severity = issue.severity || 'medium'
  const message = `KeSMIS: New community issue ${issue.code} in ${location}. Severity: ${severity}. Review: ${adminUrl}`

  await Promise.allSettled(
    activeUsers
      .filter((user) => formatPhoneNumber(user?.phone))
      .map((user) =>
        sendTrackedSms({
          phone: user.phone,
          message,
          userId: user.id,
          sourceType: 'admin_alert',
          sourceId: issue.id,
          addressForLog: user.phone,
        })
      )
  )
}

/**
 * Send SMS to reporter (if phone provided) and alert support team on new issue.
 * Non-blocking — failures are logged but do not fail the API request.
 */
async function notifyOnIssueCreated(req, issue) {
  if (!issue?.id) return

  const smsEnabled = await isCommunityIssueSMSEnabled()
  if (!smsEnabled) {
    console.log('[community_issue] SMS disabled for community_issue module — skipping notifications')
    return
  }

  try {
    const location = await loadIssueLocationNames(issue)
    await Promise.allSettled([
      notifyReporter(issue, req, location),
      notifyAdminTeam(issue, req, location),
    ])
  } catch (error) {
    console.error('[community_issue] notifyOnIssueCreated failed:', error?.message || error)
  }
}

/**
 * Notify reporter when staff update issue status.
 */
async function notifyOnIssueStatusChanged(req, issue, { oldStatus, newStatus, resolutionNote }) {
  if (!issue?.id) return

  const smsEnabled = await isCommunityIssueSMSEnabled()
  if (!smsEnabled) {
    console.log('[community_issue] SMS disabled — skipping status update notification')
    return
  }

  if (!newStatus || oldStatus === newStatus) return

  try {
    await notifyReporterStatusChange(issue, req, { oldStatus, newStatus, resolutionNote })
  } catch (error) {
    console.error('[community_issue] notifyOnIssueStatusChanged failed:', error?.message || error)
  }
}

module.exports = {
  notifyOnIssueCreated,
  notifyOnIssueStatusChanged,
  getPublicTrackingUrl,
  issueTypeLabel,
  getSupportUsers,
  getAdminAlertRecipients,
}
