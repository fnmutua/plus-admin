const nodemailer = require('nodemailer')
const db = require('../models')
const { getAccountBalance, sendSMS, formatPhoneNumber } = require('../utils/sms')
const { getSmsBalanceAlertSettings } = require('../utils/smsBalanceAlertSettings')

const User = db.user
const Role = db.role

async function getAlertThreshold() {
  const config = await getSmsBalanceAlertSettings()
  return config.threshold
}

function buildAlertMessage(balance, threshold) {
  return (
    `KeSMIS Alert: Advanta bulk SMS balance is low (${balance} credits remaining, ` +
    `threshold ${threshold}). Please top up to avoid SMS delivery failures.`
  )
}

function createMailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'kisip.mis@gmail.com',
      pass: process.env.EMAIL_PASS || 'ycoxaqavmfiqljjg',
    },
  })
}

async function getSupportAlertRecipients() {
  const users = await User.findAll({
    attributes: ['id', 'name', 'email', 'phone', 'isactive'],
    where: { isactive: true },
    include: [{
      model: Role,
      where: { name: 'support' },
      through: { attributes: [] },
    }],
  })

  const emails = []
  const smsTargets = []
  const seenEmails = new Set()
  const seenPhones = new Set()

  for (const user of users) {
    const email = user.email && String(user.email).trim()
    if (email && !seenEmails.has(email.toLowerCase())) {
      seenEmails.add(email.toLowerCase())
      emails.push({ id: user.id, name: user.name, email })
    }

    const phone = user.phone && String(user.phone).trim()
    if (!phone) continue
    try {
      const formatted = formatPhoneNumber(phone)
      if (formatted && !seenPhones.has(formatted)) {
        seenPhones.add(formatted)
        smsTargets.push({ id: user.id, phone: formatted, name: user.name })
      }
    } catch (error) {
      console.warn(`[SMS Balance Alert] Skipping invalid phone for user ${user.id}:`, error.message || error)
    }
  }

  return { emails, smsTargets }
}

async function notifySupportUsers({ balance, threshold }) {
  const message = buildAlertMessage(balance, threshold)
  const { emails, smsTargets } = await getSupportAlertRecipients()

  if (!emails.length && !smsTargets.length) {
    console.warn('[SMS Balance Alert] No active support users with email or phone found')
    return { emailsSent: 0, smsSent: 0 }
  }

  let emailsSent = 0
  let smsSent = 0

  if (emails.length) {
    const transporter = createMailTransporter()
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'kisip.mis@gmail.com'
    const subject = 'KeSMIS — Low bulk SMS balance'
    const html = `
      <p>Dear Support Team,</p>
      <p>The Advanta bulk SMS account balance is <strong>${balance}</strong> credits, which is below the configured threshold of <strong>${threshold}</strong>.</p>
      <p>Please top up the SMS account to avoid delivery failures for OTPs, grievance alerts, and other notifications.</p>
      <p>— KeSMIS automated monitor</p>
    `

    for (const recipient of emails) {
      try {
        await transporter.sendMail({
          from,
          to: recipient.email,
          subject,
          text: message,
          html,
        })
        emailsSent += 1
      } catch (error) {
        console.error(`[SMS Balance Alert] Email failed for ${recipient.email}:`, error.message || error)
      }
    }
  }

  for (const recipient of smsTargets) {
    try {
      await sendSMS(recipient.phone, message, {
        sourceModule: 'balance_alert',
        sourceType: 'low_balance',
        sourceId: recipient.id
      })
      smsSent += 1
    } catch (error) {
      console.error(`[SMS Balance Alert] SMS failed for user ${recipient.id}:`, error.message || error)
    }
  }

  return { emailsSent, smsSent }
}

async function runSmsBalanceAlertJob() {
  const config = await getSmsBalanceAlertSettings()

  if (!config.enabled) {
    console.log('[SMS Balance Alert] Job skipped — alerts disabled in module settings')
    return { skipped: true }
  }

  console.log('[SMS Balance Alert] Checking Advanta SMS balance...')
  const threshold = config.threshold
  const result = await getAccountBalance()

  if (!result.ok) {
    console.error('[SMS Balance Alert] Balance check failed:', result.error)
    return { ok: false, error: result.error }
  }

  const balance = result.balance
  console.log(`[SMS Balance Alert] Current balance: ${balance} (threshold: ${threshold})`)

  if (balance > threshold) {
    console.log('[SMS Balance Alert] Balance is healthy — no alert sent')
    return { ok: true, balance, threshold, alerted: false }
  }

  const notifyResult = await notifySupportUsers({ balance, threshold })
  console.log(
    `[SMS Balance Alert] Low balance alert sent — emails: ${notifyResult.emailsSent}, sms: ${notifyResult.smsSent}`
  )

  return {
    ok: true,
    balance,
    threshold,
    alerted: true,
    ...notifyResult,
  }
}

module.exports = { runSmsBalanceAlertJob, getAlertThreshold }
