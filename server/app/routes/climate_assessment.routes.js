const { authJwt } = require('../middleware')
const controller = require('../controllers/climate_assessment.controller')
const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.get('/api/v1/climate-assessment/questions', [authJwt.verifyToken], controller.getQuestions)
  app.get('/api/v1/climate-assessment', [authJwt.verifyToken, hasPermission('settlement:read')], controller.list)
  app.get('/api/v1/climate-assessment/:id', [authJwt.verifyToken, hasPermission('settlement:read')], controller.getOne)
  app.post('/api/v1/climate-assessment', [authJwt.verifyToken, hasPermission('settlement:create')], controller.create)
  app.put('/api/v1/climate-assessment/:id', [authJwt.verifyToken, hasPermission('settlement:update')], controller.update)
  app.post('/api/v1/climate-assessment/:id/compute-scores', [authJwt.verifyToken, hasPermission('settlement:update')], controller.computeScores)
  app.delete('/api/v1/climate-assessment/:id', [authJwt.verifyToken, hasPermission('settlement:delete')], controller.delete)
}
