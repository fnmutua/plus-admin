const db = require('../models')
const { getSettingConfigValue } = require('./moduleSettingsCache')

const AUTH_JWT_EXPIRES_MODULE = 'auth_jwt_expires_seconds'
const AUTH_GUEST_EXPIRES_MODULE = 'auth_guest_expires_seconds'
const AUTH_IDLE_ENFORCEMENT_MODULE = 'auth_idle_enforcement'
const AUTH_IDLE_LOGOUT_MODULE = 'auth_idle_logout_seconds'
const AUTH_IDLE_WARNING_MODULE = 'auth_idle_warning_seconds'
const AUTH_IDLE_RENEWAL_MODULE = 'auth_idle_renewal_threshold_seconds'

const ENV_JWT_EXPIRES_SECONDS = parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '86400', 10)
const DEFAULT_GUEST_EXPIRES_SECONDS = 7200
const DEFAULT_IDLE_LOGOUT_SECONDS = 30 * 60
const DEFAULT_IDLE_WARNING_SECONDS = 5 * 60
const DEFAULT_IDLE_RENEWAL_SECONDS = 5 * 60

async function fetchModuleConfig(module) {
  try {
    const setting = await db.models.module_settings.findOne({ where: { module } })
    if (!setting || setting.enabled === false) return null
    return setting.config_value
  } catch (error) {
    console.error(`[authSettings] Failed to read ${module}:`, error.message || error)
    return null
  }
}

function parsePositiveSeconds(value, fallback) {
  const parsed = parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

async function getJwtExpiresInSeconds() {
  const raw = await getSettingConfigValue(
    AUTH_JWT_EXPIRES_MODULE,
    () => fetchModuleConfig(AUTH_JWT_EXPIRES_MODULE),
    null
  )
  return parsePositiveSeconds(raw, ENV_JWT_EXPIRES_SECONDS)
}

async function getGuestExpiresInSeconds() {
  const raw = await getSettingConfigValue(
    AUTH_GUEST_EXPIRES_MODULE,
    () => fetchModuleConfig(AUTH_GUEST_EXPIRES_MODULE),
    null
  )
  return parsePositiveSeconds(raw, DEFAULT_GUEST_EXPIRES_SECONDS)
}

async function isIdleEnforcementEnabled() {
  try {
    const setting = await db.models.module_settings.findOne({
      where: { module: AUTH_IDLE_ENFORCEMENT_MODULE }
    })
    if (!setting) return true
    return setting.enabled !== false
  } catch (error) {
    console.error('[authSettings] Failed to read idle enforcement:', error.message || error)
    return true
  }
}

async function getIdleLogoutSeconds() {
  const raw = await getSettingConfigValue(
    AUTH_IDLE_LOGOUT_MODULE,
    () => fetchModuleConfig(AUTH_IDLE_LOGOUT_MODULE),
    null
  )
  return parsePositiveSeconds(raw, DEFAULT_IDLE_LOGOUT_SECONDS)
}

async function getIdleWarningSeconds() {
  const raw = await getSettingConfigValue(
    AUTH_IDLE_WARNING_MODULE,
    () => fetchModuleConfig(AUTH_IDLE_WARNING_MODULE),
    null
  )
  return parsePositiveSeconds(raw, DEFAULT_IDLE_WARNING_SECONDS)
}

async function getIdleRenewalThresholdSeconds() {
  const raw = await getSettingConfigValue(
    AUTH_IDLE_RENEWAL_MODULE,
    () => fetchModuleConfig(AUTH_IDLE_RENEWAL_MODULE),
    null
  )
  return parsePositiveSeconds(raw, DEFAULT_IDLE_RENEWAL_SECONDS)
}

async function getSessionIdleConfig() {
  const enabled = await isIdleEnforcementEnabled()
  const idleLogoutSeconds = await getIdleLogoutSeconds()
  const idleWarningSeconds = await getIdleWarningSeconds()
  const idleRenewalThresholdSeconds = await getIdleRenewalThresholdSeconds()

  return {
    idleEnforcementEnabled: enabled,
    idleLogoutSeconds,
    idleWarningSeconds,
    idleRenewalThresholdSeconds,
    idleLogoutMs: idleLogoutSeconds * 1000,
    idleWarningMs: idleWarningSeconds * 1000,
    idleRenewalThresholdMs: idleRenewalThresholdSeconds * 1000
  }
}

module.exports = {
  AUTH_JWT_EXPIRES_MODULE,
  AUTH_GUEST_EXPIRES_MODULE,
  AUTH_IDLE_ENFORCEMENT_MODULE,
  AUTH_IDLE_LOGOUT_MODULE,
  AUTH_IDLE_WARNING_MODULE,
  AUTH_IDLE_RENEWAL_MODULE,
  ENV_JWT_EXPIRES_SECONDS,
  DEFAULT_GUEST_EXPIRES_SECONDS,
  DEFAULT_IDLE_LOGOUT_SECONDS,
  DEFAULT_IDLE_WARNING_SECONDS,
  DEFAULT_IDLE_RENEWAL_SECONDS,
  getJwtExpiresInSeconds,
  getGuestExpiresInSeconds,
  getSessionIdleConfig
}
