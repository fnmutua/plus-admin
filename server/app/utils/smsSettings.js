const db = require('../models')

/**
 * Check if SMS sending is enabled for a specific module and get the user who disabled it
 * @param {string} module - Module name (e.g., 'sms_grievance', 'sms_incident')
 * @returns {Promise<{enabled: boolean, disabledBy: object|null}>} - Returns enabled status and user who disabled it
 */
async function getSMSStatus(module) {
  try {
    const setting = await db.models.module_settings.findOne({
      where: { module }
    })
    
    // If setting doesn't exist, default to enabled (backward compatibility)
    if (!setting) {
      return { enabled: true, disabledBy: null }
    }
    
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
 * @param {string} module - Module name (e.g., 'sms_grievance', 'sms_incident')
 * @returns {Promise<boolean>} - Returns true if enabled, false otherwise
 */
async function isSMSEnabled(module) {
  const status = await getSMSStatus(module)
  return status.enabled
}

/**
 * Check if SMS sending is enabled for grievance module
 */
async function isGrievanceSMSEnabled() {
  return await isSMSEnabled('sms_grievance')
}

/**
 * Get SMS status for grievance module (includes user who disabled it)
 */
async function getGrievanceSMSStatus() {
  return await getSMSStatus('sms_grievance')
}

/**
 * Check if SMS sending is enabled for incident module
 */
async function isIncidentSMSEnabled() {
  return await isSMSEnabled('sms_incident')
}

/**
 * Get SMS status for incident module (includes user who disabled it)
 */
async function getIncidentSMSStatus() {
  return await getSMSStatus('sms_incident')
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
  getFeedbackSMSStatus
}

