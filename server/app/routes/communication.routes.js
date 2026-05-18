/* eslint-disable prettier/prettier */
const controller = require('../controllers/communication.controller')
const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  // Helpers for the Compose UI: roles, settlements, user search, and recipient preview.
  // All read-only — no provider calls, no DB writes.
  app.get(
    '/api/v1/communications/meta/roles',
    [authJwt.verifyToken, hasPermission('communication:read')],
    controller.listRolesForRecipients
  )
  app.get(
    '/api/v1/communications/meta/settlements',
    [authJwt.verifyToken, hasPermission('communication:read')],
    controller.listSettlementsForRecipients
  )
  app.get(
    '/api/v1/communications/meta/users',
    [authJwt.verifyToken, hasPermission('communication:read')],
    controller.searchUsersForRecipients
  )
  app.post(
    '/api/v1/communications/preview',
    [authJwt.verifyToken, hasPermission('communication:read')],
    controller.previewRecipients
  )

  // Send a new broadcast.
  app.post(
    '/api/v1/communications',
    [authJwt.verifyToken, hasPermission('communication:send')],
    controller.createCommunication
  )

  // Listing + detail (history / tracking).
  app.get(
    '/api/v1/communications',
    [authJwt.verifyToken, hasPermission('communication:read')],
    controller.listCommunications
  )
  app.get(
    '/api/v1/communications/:id',
    [authJwt.verifyToken, hasPermission('communication:read')],
    controller.getCommunicationById
  )

  // Retry a single failed recipient.
  app.post(
    '/api/v1/communications/:id/recipients/:recipientId/retry',
    [authJwt.verifyToken, hasPermission('communication:send')],
    controller.retryRecipient
  )
}
