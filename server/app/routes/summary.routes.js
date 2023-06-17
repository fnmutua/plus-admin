/* eslint-disable prettier/prettier */
const { authJwt } = require('../middleware')
const controller = require('../controllers/summary.controller')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  // Gets the  table names
  app.post('/api/v1/summary/byfield',  [authJwt.verifyToken], controller.sumModelByColumn)
  app.post('/api/v1/summary/byfield/simple',[authJwt.verifyToken],   controller.SimpleSumModelByColumn)
  app.post('/api/v1/summary/byfield/nested', [authJwt.verifyToken],  controller.sumModelByColumnAssociated)
  app.post('/api/v1/summary/byfield/include',  [authJwt.verifyToken], controller.nestedSumModelByColumn)
  app.post('/api/v1/summary/byfield/multiple',  [authJwt.verifyToken],controller.sumModelAssociatedMultipleModels)
  app.post('/api/v1/summary/group/multiple',  [authJwt.verifyToken],controller.sumGroupByMultipleColumns)
  app.post('/api/v1/summary/group/app',  [authJwt.verifyToken], controller.appGetSummaryCombined)

  
 
  
}