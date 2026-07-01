const db = require('../models')

/**
 * Check if SMS sending is enabled for a specific module and get the user who disabled it
 * @param {string} module - Module name (e.g., 'sms_grievance_county', 'sms_grievance_national', 'sms_incident_county', 'sms_incident_national', 'sms_auth', etc.)
 * @returns {Promise<{enabled: boolean, disabledBy: object|null}>} - Returns enabled status and user who disabled it
 */
async function getSMSStatus(module) {
  try {
    // Ensure module name is trimmed and normalized
    const moduleName = (module || '').trim()
    if (!moduleName) {
      console.error(`[SMS Settings] Empty module name provided`)
      return { enabled: true, disabledBy: null }
    }
    
    const setting = await db.models.module_settings.findOne({
      where: { module: moduleName }
    })
    
    // If setting doesn't exist, default to enabled (backward compatibility)
    if (!setting) {
      console.log(`[SMS Settings] Module '${moduleName}' not found in database, defaulting to enabled`)
      return { enabled: true, disabledBy: null }
    }
    
    console.log(`[SMS Settings] Module '${moduleName}' found:`, { enabled: setting.enabled, id: setting.id, module: setting.module })
    
    // If enabled, return enabled with no disabledBy user
    if (setting.enabled === true) {
      return { enabled: true, disabledBy: null }
    }
    
    // If disabled, get the user who disabled it
    let disabledBy = null
    if (setting.updated_by) {
      try {
        const user = await db.user.findByPk(setting.updated_by, {
          attributes: ['id', 'name', 'username', 'email']
        })
        disabledBy = user ? {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email
        } : null
      } catch (userError) {
        console.error(`Error fetching user who disabled ${module}:`, userError)
      }
    }
    
    return { enabled: false, disabledBy }
  } catch (error) {
    console.error(`Error checking SMS setting for ${module}:`, error)
    // Default to enabled on error (fail open)
    return { enabled: true, disabledBy: null }
  }
}

/**
 * Check if SMS sending is enabled for a specific module (backward compatibility)
 * @param {string} module - Module name (e.g., 'sms_grievance_county', 'sms_grievance_national', 'sms_incident_county', 'sms_incident_national', 'sms_auth', etc.)
 * @returns {Promise<boolean>} - Returns true if enabled, false otherwise
 */
async function isSMSEnabled(module) {
  const status = await getSMSStatus(module)
  return status.enabled
}

/**
 * Check if SMS sending is enabled for grievance module at a specific level
 * @param {string} level - Level: 'county' or 'national'
 * @returns {Promise<boolean>} - Returns true if enabled, false otherwise
 */
async function isGrievanceSMSEnabled(level = 'county') {
  const module = level === 'national' ? 'sms_grievance_national' : 'sms_grievance_county'
  console.log(`[SMS Settings] Checking grievance SMS for level '${level}' -> module '${module}'`)
  return await isSMSEnabled(module)
}

/**
 * Get SMS status for grievance module at a specific level (includes user who disabled it)
 * @param {string} level - Level: 'county' or 'national'
 * @returns {Promise<{enabled: boolean, disabledBy: object|null}>}
 */
async function getGrievanceSMSStatus(level = 'county') {
  const module = level === 'national' ? 'sms_grievance_national' : 'sms_grievance_county'
  console.log(`[SMS Settings] Getting grievance SMS status for level '${level}' -> module '${module}'`)
  return await getSMSStatus(module)
}

/**
 * Check if SMS sending is enabled for incident module at a specific level
 * @param {string} level - Level: 'county' or 'national'
 * @returns {Promise<boolean>} - Returns true if enabled, false otherwise
 */
async function isIncidentSMSEnabled(level = 'county') {
  const module = level === 'national' ? 'sms_incident_national' : 'sms_incident_county'
  console.log(`[SMS Settings] Checking incident SMS for level '${level}' -> module '${module}'`)
  return await isSMSEnabled(module)
}

/**
 * Get SMS status for incident module at a specific level (includes user who disabled it)
 * @param {string} level - Level: 'county' or 'national'
 * @returns {Promise<{enabled: boolean, disabledBy: object|null}>}
 */
async function getIncidentSMSStatus(level = 'county') {
  const module = level === 'national' ? 'sms_incident_national' : 'sms_incident_county'
  console.log(`[SMS Settings] Getting incident SMS status for level '${level}' -> module '${module}'`)
  return await getSMSStatus(module)
}

/**
 * Check if SMS sending is enabled for auth module
 */
async function isAuthSMSEnabled() {
  return await isSMSEnabled('sms_auth')
}

/**
 * Get SMS status for auth module (includes user who disabled it)
 */
async function getAuthSMSStatus() {
  return await getSMSStatus('sms_auth')
}

/**
 * Check if SMS sending is enabled for user module
 */
async function isUserSMSEnabled() {
  return await isSMSEnabled('sms_user')
}

/**
 * Get SMS status for user module (includes user who disabled it)
 */
async function getUserSMSStatus() {
  return await getSMSStatus('sms_user')
}

/**
 * Check if SMS sending is enabled for feedback module
 */
async function isFeedbackSMSEnabled() {
  return await isSMSEnabled('sms_feedback')
}

/**
 * Get SMS status for feedback module (includes user who disabled it)
 */
async function getFeedbackSMSStatus() {
  return await getSMSStatus('sms_feedback')
}

/**
 * Check if SMS sending is enabled for data request module
 */
async function isDataRequestSMSEnabled() {
  return await isSMSEnabled('sms_data_request')
}

/**
 * Get SMS status for data request module
 */
async function getDataRequestSMSStatus() {
  return await getSMSStatus('sms_data_request')
}

module.exports = {
  isSMSEnabled,
  getSMSStatus,
  isGrievanceSMSEnabled,
  getGrievanceSMSStatus,
  isIncidentSMSEnabled,
  getIncidentSMSStatus,
  isAuthSMSEnabled,
  getAuthSMSStatus,
  isUserSMSEnabled,
  getUserSMSStatus,
  isFeedbackSMSEnabled,
  getFeedbackSMSStatus,
  isDataRequestSMSEnabled,
  getDataRequestSMSStatus
}

