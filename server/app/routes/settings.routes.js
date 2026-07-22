const controller = require('../controllers/settings.controller')
const { authJwt } = require('../middleware')
const { hasPermission, hasAnyPermission } = require('../middleware/permission')

// Reference data for settlement vulnerability scoring — not full module settings.
const VULNERABILITY_READ_PERMISSIONS = [
  'settings:read',
  'settlement:read',
  'settlement:create',
  'settlement:update',
]
const { requireRootAdmin } = require('../middleware/requireRootAdmin')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  // Settings endpoints - only super_admin and root_admin can access
  app.get('/api/v1/settings/all', [authJwt.verifyToken, hasPermission('settings:read')], controller.getAllSettings)
  app.post('/api/v1/settings/get', [authJwt.verifyToken, hasPermission('settings:read')], controller.getSetting)
  app.post('/api/v1/settings/update', [authJwt.verifyToken, hasPermission('settings:update')], controller.updateSetting)
  app.post('/api/v1/settings/bulk-update', [authJwt.verifyToken, hasPermission('settings:update')], controller.bulkUpdateSettings)

  app.get(
    '/api/v1/settings/system',
    [authJwt.verifyToken, requireRootAdmin, hasPermission('system_settings:read')],
    controller.getSystemSettings
  )
  app.post(
    '/api/v1/settings/system/bulk-update',
    [authJwt.verifyToken, requireRootAdmin, hasPermission('system_settings:update')],
    controller.bulkUpdateSystemSettings
  )
  app.get(
    '/api/v1/settings/climate-question-config',
    [authJwt.verifyToken, hasPermission('settings:read')],
    controller.getClimateQuestionConfig
  )
  app.get(
    '/api/v1/settings/climate-question-config/versions',
    [authJwt.verifyToken, hasPermission('settings:read')],
    controller.listClimateQuestionConfigVersions
  )
  app.post(
    '/api/v1/settings/climate-question-config',
    [authJwt.verifyToken, hasPermission('settings:update')],
    controller.updateClimateQuestionConfig
  )
  app.post(
    '/api/v1/settings/climate-question-config/save-current',
    [authJwt.verifyToken, hasPermission('settings:update')],
    controller.updateClimateQuestionConfigCurrentVersion
  )

  app.get('/api/v1/settings/vulnerability-matrix', [authJwt.verifyToken, hasAnyPermission(VULNERABILITY_READ_PERMISSIONS)], controller.getVulnerabilityMatrix)
  app.post('/api/v1/settings/vulnerability-matrix', [authJwt.verifyToken, hasPermission('settings:update')], controller.bulkUpdateVulnerabilityMatrix)
  app.get('/api/v1/settings/vulnerability-rating-thresholds', [authJwt.verifyToken, hasAnyPermission(VULNERABILITY_READ_PERMISSIONS)], controller.getVulnerabilityRatingThresholds)
  app.post('/api/v1/settings/vulnerability-rating-thresholds', [authJwt.verifyToken, hasPermission('settings:update')], controller.bulkUpdateVulnerabilityRatingThresholds)
  app.post('/api/v1/settings/vulnerability-compute', [authJwt.verifyToken], controller.computeVulnerabilityScore)
  app.get(
    '/api/v1/settings/sms-balance',
    [authJwt.verifyToken, hasPermission('settings:read')],
    controller.getSmsBalance
  )
  app.post(
    '/api/v1/settings/sms-balance-check',
    [authJwt.verifyToken, requireRootAdmin, hasPermission('settings:read')],
    controller.runSmsBalanceAlertTest
  )

  // Data cleanup — normalize text field values across models (excludes users/roles)
  app.get(
    '/api/v1/settings/data-cleanup/models',
    [authJwt.verifyToken, hasPermission('settings:update')],
    controller.listCleanupModels
  )
  app.get(
    '/api/v1/settings/data-cleanup/fields',
    [authJwt.verifyToken, hasPermission('settings:update')],
    controller.listCleanupFields
  )
  app.post(
    '/api/v1/settings/data-cleanup/values',
    [authJwt.verifyToken, hasPermission('settings:update')],
    controller.listCleanupFieldValues
  )
  app.post(
    '/api/v1/settings/data-cleanup/replace',
    [authJwt.verifyToken, hasPermission('settings:update')],
    controller.replaceCleanupFieldValue
  )

  console.log('Settings routes registered: /api/v1/settings/all, /api/v1/settings/get, /api/v1/settings/update, /api/v1/settings/bulk-update, /api/v1/settings/vulnerability-matrix, /api/v1/settings/sms-balance, /api/v1/settings/sms-balance-check, /api/v1/settings/data-cleanup/*')
}

