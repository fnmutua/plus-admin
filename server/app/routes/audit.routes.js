const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')
const controller = require('../controllers/audit.controller')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  app.post(
    '/api/v1/audit/all',
    [authJwt.verifyToken, hasPermission('logs:read')],
    controller.getAuditLogs
  )
}
