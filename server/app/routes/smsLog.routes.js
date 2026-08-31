/* eslint-disable prettier/prettier */
const controller = require('../controllers/smsLog.controller')
const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  app.get(
    '/api/v1/sms-logs',
    [authJwt.verifyToken, hasPermission('sms_log:read')],
    controller.listSmsLogs
  )

  app.get(
    '/api/v1/sms-logs/:id',
    [authJwt.verifyToken, hasPermission('sms_log:read')],
    controller.getSmsLogById
  )
}
