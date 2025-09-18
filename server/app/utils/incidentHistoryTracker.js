const db = require('../models')

/**
 * Track incident history changes
 * @param {Object} params - Parameters for tracking
 * @param {number} params.incidentId - ID of the incident
 * @param {string} params.action - Action performed (created, updated, deleted, etc.)
 * @param {string} params.fieldName - Field that was changed (for updates)
 * @param {any} params.oldValue - Previous value
 * @param {any} params.newValue - New value
 * @param {number} params.changedBy - User ID who made the change
 * @param {string} params.changedByName - Name of the user who made the change
 * @param {string} params.changeReason - Reason for the change
 * @param {string} params.ipAddress - IP address of the user
 * @param {string} params.userAgent - User agent string
 */
const trackIncidentHistory = async (params) => {
  try {
    const {
      incidentId,
      action,
      fieldName = null,
      oldValue = null,
      newValue = null,
      changedBy = null,
      changedByName = null,
      changeReason = null,
      ipAddress = null,
      userAgent = null
    } = params

    await db.models.incident_history.create({
      incident_id: incidentId,
      action,
      field_name: fieldName,
      old_value: oldValue ? JSON.stringify(oldValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
      changed_by: changedBy,
      changed_by_name: changedByName,
      change_reason: changeReason,
      ip_address: ipAddress,
      user_agent: userAgent
    })
  } catch (error) {
    console.error('Error tracking incident history:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Track incident creation
 */
const trackIncidentCreation = async (incident, user, req) => {
  await trackIncidentHistory({
    incidentId: incident.id,
    action: 'created',
    changedBy: user?.id,
    changedByName: user?.name || user?.username,
    changeReason: 'Incident created',
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent')
  })
}

/**
 * Track incident updates by comparing old and new values
 */
const trackIncidentUpdate = async (oldIncident, newIncident, user, req) => {
  const fieldsToTrack = [
    'code', 'occurred_date', 'occurred_time', 'reported_date', 'reported_time',
    'reported_by', 'reporter_phone', 'site_supervisor', 'department',
    'location_text', 'worker_name', 'designation', 'incident_types',
    'mechanisms', 'indirect_causes', 'direct_causes', 'activity_leading',
    'description', 'consequences', 'immediate_action', 'severity',
    'status',
    'actions_to_avoid', 'prepared_by_name', 'prepared_by_job_title',
    'prepared_by_date'
  ]

  for (const field of fieldsToTrack) {
    const oldValue = oldIncident[field]
    const newValue = newIncident[field]

    // Check if the value actually changed
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await trackIncidentHistory({
        incidentId: newIncident.id,
        action: 'updated',
        fieldName: field,
        oldValue: oldValue,
        newValue: newValue,
        changedBy: user?.id,
        changedByName: user?.name || user?.username,
        changeReason: `Field '${field}' updated`,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent')
      })
    }
  }
}

/**
 * Track incident deletion
 */
const trackIncidentDeletion = async (incident, user, req) => {
  await trackIncidentHistory({
    incidentId: incident.id,
    action: 'deleted',
    changedBy: user?.id,
    changedByName: user?.name || user?.username,
    changeReason: 'Incident deleted',
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent')
  })
}

/**
 * Track status changes
 */
const trackStatusChange = async (incidentId, oldStatus, newStatus, user, req, reason = null) => {
  await trackIncidentHistory({
    incidentId,
    action: 'status_changed',
    fieldName: 'status',
    oldValue: oldStatus,
    newValue: newStatus,
    changedBy: user?.id,
    changedByName: user?.name || user?.username,
    changeReason: reason || `Status changed from '${oldStatus}' to '${newStatus}'`,
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent')
  })
}

module.exports = {
  trackIncidentHistory,
  trackIncidentCreation,
  trackIncidentUpdate,
  trackIncidentDeletion,
  trackStatusChange
}
