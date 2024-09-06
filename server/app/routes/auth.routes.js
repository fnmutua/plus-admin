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

  app.post('/api/auth/profile/update', [authJwt.verifyToken], controller.updateByUser)

  app.post('/api/auth/signin', controller.signin)
  app.post('/api/auth/reset', controller.reset)
  app.post('/api/auth/set', controller.updatePassword)
  app.get('/api/auth/county', controller.countyController)
  app.post('/api/auth/county/one', controller.getOneCountyController)
  app.post('/api/auth/county/location', controller.countyByLocationController)


  app.post('/api/auth/county/post', controller.countyPostController)
  app.post('/api/auth/subcounty', controller.subCountyController)
  app.post('/api/auth/settlement', controller.settlementController)
  app.post('/api/auth/ward', controller.wardController)

  app.post('/api/auth/profile', controller.myProfile)


  
  app.post('/api/auth/county/all', controller.countyAllController)
  app.post('/api/auth/subcounty/all', controller.subCountyAllController)
  app.post('/api/auth/ward/all', controller.wardAllController)
  app.post('/api/auth/settlement/all', controller.settlementAllController)
  app.post('/api/auth/settlement/bycounty', controller.settlementByCountyController)


 // Signups via APP
 app.post(
  '/api/app/signup',  [verifySignUp.checkDuplicatePhone],
  controller.signupViaApp
)

// Signin via APP
app.post(
'/api/app/signin',  
controller.signinViaApp
)

//verify OTP code 
app.post(
'/api/app/verify',  
controller.verifyCode
)



}
