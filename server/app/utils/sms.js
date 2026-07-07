const axios = require('axios')

const SMS_URL = 'https://quicksms.advantasms.com/api/services/sendotp/'
const SMS_BALANCE_URL = 'https://quicksms.advantasms.com/api/services/getbalance/'
const SMS_REQUEST_TIMEOUT_MS = 15000

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

async function sendSMS(phoneNumber, message) {
  const mobile = formatPhoneNumber(phoneNumber)
  if (!mobile || !message) {
    console.warn('[SMS] Invalid phone or message — skipping send')
    return null
  }

  const response = await axios.post(SMS_URL, {
    apikey: process.env.SMS_API_KEY,
    partnerID: process.env.SMS_PARTNER_ID || '12108',
    shortcode: process.env.SMS_SHORTCODE || 'KISIP',
    message,
    mobile
  })

  return response.data
}

async function getAccountBalance() {
  const apikey = process.env.SMS_API_KEY
  const partnerID = process.env.SMS_PARTNER_ID || '12108'

  if (!apikey) {
    return { ok: false, error: 'SMS_API_KEY is not configured' }
  }

  try {
    const response = await axios.post(
      SMS_BALANCE_URL,
      { apikey, partnerID },
      { timeout: SMS_REQUEST_TIMEOUT_MS }
    )
    const data = response.data || {}
    const code = String(
      data['response-code'] ?? data.responseCode ?? data.response_code ?? ''
    ).trim()

    if (code && code !== '200') {
      return {
        ok: false,
        code,
        error: ADVANTA_RESPONSE_MESSAGES[code] || `Advanta SMS error ${code}`,
        raw: data,
      }
    }

    const creditRaw = data.credit ?? data.balance ?? data.credits
    const balance = Number.parseFloat(String(creditRaw ?? '').replace(/,/g, ''))
    if (!Number.isFinite(balance)) {
      return {
        ok: false,
        error: 'Could not parse SMS balance from provider response',
        raw: data,
      }
    }

    return { ok: true, balance, raw: data }
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to fetch SMS balance',
    }
  }
}

module.exports = { formatPhoneNumber, sendSMS, getAccountBalance, ADVANTA_RESPONSE_MESSAGES }
