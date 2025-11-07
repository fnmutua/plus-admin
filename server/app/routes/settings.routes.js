const controller = require('../controllers/settings.controller')
const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')

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
  
  console.log('Settings routes registered: /api/v1/settings/all, /api/v1/settings/get, /api/v1/settings/update, /api/v1/settings/bulk-update')
}

