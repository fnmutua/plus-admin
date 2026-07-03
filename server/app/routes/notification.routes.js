const controller = require('../controllers/notification.controller')
const { authJwt } = require('../middleware')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  app.get(
    '/api/v1/notifications/me',
    [authJwt.verifyToken],
    controller.listMyNotifications
  )

  app.get(
    '/api/v1/notifications/me/unread-count',
    [authJwt.verifyToken],
    controller.getUnreadCount
  )

  app.post(
    '/api/v1/notifications/me/read-all',
    [authJwt.verifyToken],
    controller.markAllNotificationsRead
  )

  app.get(
    '/api/v1/notifications/me/:id',
    [authJwt.verifyToken],
    controller.getMyNotificationById
  )

  app.post(
    '/api/v1/notifications/me/:id/read',
    [authJwt.verifyToken],
    controller.markNotificationRead
  )
}
