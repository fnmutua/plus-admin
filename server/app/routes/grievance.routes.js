const { verifySignUp } = require('../middleware')
const controller = require('../controllers/grievance.controller')
const { authJwt } = require('../middleware')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })
 

  
  
  app.post('/api/grv/code', controller.generateGRMCode)
  app.post('/api/grv/create', controller.createGrievanceRecord)
  

  

}
