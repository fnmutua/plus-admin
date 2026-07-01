const axios = require('axios')

const SMS_URL = 'https://quicksms.advantasms.com/api/services/sendotp/'

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

module.exports = { formatPhoneNumber, sendSMS }
