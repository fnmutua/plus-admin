const { verifySignUp } = require('../middleware')
const controller = require('../controllers/auth.controller')
const { authJwt } = require('../middleware')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  app.post(
    '/api/auth/signup',[verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
    controller.signup
  )

  // app.post(
  //   '/api/auth/signup',[verifySignUp.checkRolesExisted],
  //   controller.signup
  // )


  app.post('/api/auth/update', [authJwt.verifyToken,authJwt.isAdminOrCountyAdmin], controller.updateUser)

  //app.post("/api/v1/user/county", [authJwt.verifyToken, authJwt.isAdminOrCountyAdmin],controller.modelCountyUsers);


  app.post('/api/auth/signin', controller.signin)
  app.post('/api/auth/reset', controller.reset)
  app.post('/api/auth/set', controller.updatePassword)
  app.get('/api/auth/county', controller.countyController)
  app.post('/api/auth/county/location', controller.countyByLocationController)


  app.post('/api/auth/county/post', controller.countyPostController)
  app.post('/api/auth/subcounty', controller.subCountyController)
  app.post('/api/auth/settlement', controller.settlementController)
  app.post('/api/auth/ward', controller.wardController)

  app.post('/api/auth/profile', controller.myProfile)

}
