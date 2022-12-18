/* eslint-disable prettier/prettier */
const { authJwt } = require('../middleware')
const controller = require('../controllers/summary.controller')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  // Gets the  table names
  app.post('/api/v1/summary/byfield',   controller.sumModelByColumn)
  app.post('/api/v1/summary/byfield/simple',   controller.SimpleSumModelByColumn)
  app.post('/api/v1/summary/byfield/nested',   controller.sumModelByColumnAssociated)
  app.post('/api/v1/summary/byfield/include',   controller.nestedSumModelByColumn)
  app.post('/api/v1/summary/byfield/multiple',  controller.sumModelAssociatedMultipleModels)

  
 
  
}