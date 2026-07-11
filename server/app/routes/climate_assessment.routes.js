const { authJwt } = require('../middleware')
const controller = require('../controllers/climate_assessment.controller')
const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.get('/api/v1/climate-assessment/questions/versions', [authJwt.verifyToken], controller.listQuestionVersions)
  app.get('/api/v1/climate-assessment/questions', [authJwt.verifyToken], controller.getQuestions)
  app.get('/api/v1/climate-assessment/by-settlement/:settlement_id', [authJwt.verifyToken, hasPermission('climate_assessment:read')], controller.getBySettlement)
  app.get('/api/v1/climate-assessment/:id/versions/:version_number', [authJwt.verifyToken, hasPermission('climate_assessment:read')], controller.getVersion)
  app.get('/api/v1/climate-assessment/:id/versions', [authJwt.verifyToken, hasPermission('climate_assessment:read')], controller.listVersions)
  app.get('/api/v1/climate-assessment', [authJwt.verifyToken, hasPermission('climate_assessment:read')], controller.list)
  app.get('/api/v1/climate-assessment/:id', [authJwt.verifyToken, hasPermission('climate_assessment:read')], controller.getOne)
  app.post('/api/v1/climate-assessment', [authJwt.verifyToken, hasPermission('climate_assessment:create')], controller.create)
  app.put('/api/v1/climate-assessment/:id', [authJwt.verifyToken, hasPermission('climate_assessment:update')], controller.update)
  app.post('/api/v1/climate-assessment/:id/compute-scores', [authJwt.verifyToken, hasPermission('climate_assessment:update')], controller.computeScores)
  app.delete('/api/v1/climate-assessment/:id', [authJwt.verifyToken, hasPermission('climate_assessment:delete')], controller.delete)
}
