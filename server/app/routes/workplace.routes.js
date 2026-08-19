const { authJwt } = require('../middleware')
const controller = require('../controllers/workplace.controller')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  app.get(
    '/api/v1/workplace/stats',
    [authJwt.verifyToken, authJwt.isSomeAdmin],
    controller.getAdminStats
  )

  app.get(
    '/api/v1/workplace/active-sessions',
    [authJwt.verifyToken, authJwt.isSomeAdmin],
    controller.getActiveSessions
  )

  app.post(
    '/api/v1/workplace/login-attempts',
    [authJwt.verifyToken, authJwt.isSomeAdmin],
    controller.getLoginAttempts
  )

  app.post(
    '/api/v1/workplace/mutations',
    [authJwt.verifyToken, authJwt.isSomeAdmin],
    controller.getMutations
  )

  app.get(
    '/api/v1/workplace/traffic',
    [authJwt.verifyToken, authJwt.isSomeAdmin],
    controller.getTraffic
  )

  app.get(
    '/api/v1/workplace/scope',
    [authJwt.verifyToken, authJwt.isSomeAdmin],
    controller.getScope
  )
}
