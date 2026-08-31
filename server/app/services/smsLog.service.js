const db = require('../models')

const ADVANTA_RESPONSE_MESSAGES = {
  1001: 'Invalid sender id',
  1002: 'Network not allowed',
  1003: 'Invalid mobile number',
  1004: 'Low bulk credits',
  1005: 'Failed. System error',
  1006: 'Invalid credentials',
  1007: 'Failed. System error',
  1008: 'No Delivery Report',
  1009: 'Unsupported data type',
  1010: 'Unsupported request type',
  4090: 'Internal error. Try again after 5 minutes',
  4091: 'No Partner ID is set',
  4092: 'No API KEY provided',
  4093: 'Details not found',
}

const SOURCE_MODULE_LABELS = {
  auth: 'Authentication',
  grievance: 'Grievances',
  incident: 'Incidents',
  communication: 'Communications',
  community_issue: 'Community Issues',
  data_request: 'Data Requests',
  balance_alert: 'Balance Alert',
  user: 'Users'
}

function parseAdvantaResponse(data) {
  const resp = data?.responses?.[0]
  const topLevelCode = data?.['response-code'] ?? data?.responseCode ?? data?.response_code
  const codeRaw = resp?.['response-code'] ?? topLevelCode ?? '200'
  const code = String(codeRaw).trim()
  const description = resp?.['response-description'] || data?.['response-description'] || ''
  const ok =
    code === '200' ||
    code === '0' ||
    code === 'OK' ||
    code === '1000' ||
    description === 'Success'

  if (ok) {
    return {
      status: 'sent',
      providerCode: code,
      providerMessage: description || 'Success'
    }
  }

  const mapped = ADVANTA_RESPONSE_MESSAGES[Number(code)]
  const reason = mapped || description || `Provider error ${code}`
  return {
    status: 'failed',
    providerCode: code,
    providerMessage: reason
  }
}

function parseAdvantaAxiosError(error) {
  const status = error?.response?.status
  const data = error?.response?.data
  if (status) {
    const parsed = data ? parseAdvantaResponse(data) : null
    if (parsed && parsed.status === 'failed') return parsed
    return {
      status: 'failed',
      providerCode: String(status),
      providerMessage: `HTTP ${status}: ${JSON.stringify(data) || 'SMS gateway error'}`
    }
  }
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
    return { status: 'failed', providerCode: error.code, providerMessage: 'SMS gateway unreachable' }
  }
  if (error?.code === 'ETIMEDOUT') {
    return { status: 'failed', providerCode: error.code, providerMessage: 'SMS gateway timeout' }
  }
  return {
    status: 'failed',
    providerCode: 'ERROR',
    providerMessage: error?.message || 'Unknown network error'
  }
}

async function recordSmsLog(payload = {}) {
  if (!db.models.sms_log) return null

  const {
    sourceModule = 'unknown',
    sourceType = null,
    sourceId = null,
    senderShortcode = process.env.SMS_SHORTCODE || 'KISIP',
    destination = '',
    message = '',
    status = 'pending',
    providerCode = null,
    providerMessage = null,
    initiatedByUserId = null,
    sentAt = new Date()
  } = payload

  if (!destination || !message) return null

  try {
    return await db.models.sms_log.create({
      source_module: sourceModule,
      source_type: sourceType,
      source_id: sourceId,
      sender_shortcode: senderShortcode,
      destination,
      message,
      status,
      provider_code: providerCode,
      provider_message: providerMessage,
      initiated_by_user_id: initiatedByUserId,
      sent_at: sentAt
    })
  } catch (error) {
    console.error('[SMS Log] Failed to record SMS log:', error?.message || error)
    return null
  }
}

function getSourceModuleLabel(module) {
  return SOURCE_MODULE_LABELS[module] || module || 'Unknown'
}

module.exports = {
  SOURCE_MODULE_LABELS,
  parseAdvantaResponse,
  parseAdvantaAxiosError,
  recordSmsLog,
  getSourceModuleLabel
}
