const db = require('../models')

const MODULE = 'sms_balance_alert'

const DEFAULTS = {
  threshold: 500,
  hour: 8,
  minute: 0,
  timezone: 'Africa/Nairobi',
}

function buildCronExpression(minute, hour) {
  const m = Number.isFinite(Number(minute)) ? Number(minute) : DEFAULTS.minute
  const h = Number.isFinite(Number(hour)) ? Number(hour) : DEFAULTS.hour
  return `${m} ${h} * * *`
}

function parseConfigValue(raw) {
  if (!raw) return null
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') return null
    const threshold = Number(parsed.threshold)
    const hour = Number(parsed.hour)
    const minute = Number(parsed.minute)
    const timezone = parsed.timezone ? String(parsed.timezone) : DEFAULTS.timezone
    return {
      threshold: Number.isFinite(threshold) && threshold > 0 ? threshold : DEFAULTS.threshold,
      hour: Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULTS.hour,
      minute: Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : DEFAULTS.minute,
      timezone: timezone || DEFAULTS.timezone,
    }
  } catch {
    return null
  }
}

function envFallbackSettings() {
  const threshold = Number.parseFloat(process.env.SMS_BALANCE_ALERT_THRESHOLD || '')
  const hourMinute = String(process.env.SMS_BALANCE_ALERT_CRON || '0 8 * * *').split(' ')
  return {
    enabled: process.env.SMS_BALANCE_ALERT_ENABLED !== 'false',
    threshold: Number.isFinite(threshold) && threshold > 0 ? threshold : DEFAULTS.threshold,
    hour: Number.parseInt(hourMinute[1], 10) || DEFAULTS.hour,
    minute: Number.parseInt(hourMinute[0], 10) || DEFAULTS.minute,
    timezone: process.env.SMS_BALANCE_ALERT_TZ || DEFAULTS.timezone,
  }
}

async function getSmsBalanceAlertSettings() {
  try {
    const setting = await db.models.module_settings.findOne({ where: { module: MODULE } })
    const envFallback = envFallbackSettings()

    if (!setting) {
      return {
        ...envFallback,
        cron: buildCronExpression(envFallback.minute, envFallback.hour),
      }
    }

    const parsed = parseConfigValue(setting.config_value)
    const threshold = parsed?.threshold ?? envFallback.threshold
    const hour = parsed?.hour ?? envFallback.hour
    const minute = parsed?.minute ?? envFallback.minute
    const timezone = parsed?.timezone ?? envFallback.timezone

    return {
      enabled: setting.enabled !== false,
      threshold,
      hour,
      minute,
      timezone,
      cron: buildCronExpression(minute, hour),
    }
  } catch (error) {
    console.error('[SMS Balance Alert] Failed to load settings:', error.message || error)
    const envFallback = envFallbackSettings()
    return {
      ...envFallback,
      cron: buildCronExpression(envFallback.minute, envFallback.hour),
    }
  }
}

function serializeConfig({ threshold, hour, minute, timezone }) {
  return JSON.stringify({
    threshold: Number(threshold) || DEFAULTS.threshold,
    hour: Number(hour) ?? DEFAULTS.hour,
    minute: Number(minute) ?? DEFAULTS.minute,
    timezone: timezone || DEFAULTS.timezone,
  })
}

module.exports = {
  MODULE,
  DEFAULTS,
  buildCronExpression,
  parseConfigValue,
  serializeConfig,
  getSmsBalanceAlertSettings,
}
