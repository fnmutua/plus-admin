const { verifySignUp } = require('../middleware')
const controller = require('../controllers/auth.controller')
const { authJwt } = require('../middleware')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  app.post(
    '/api/auth/signup',
    [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
    controller.signup
  )

  app.post('/api/auth/update', [authJwt.verifyToken], controller.updateUser)

  app.post('/api/auth/signin', controller.signin)
  app.post('/api/auth/reset', controller.reset)
  app.post('/api/auth/set', controller.updatePassword)
  app.post('/api/auth/county', controller.countyController)

}
