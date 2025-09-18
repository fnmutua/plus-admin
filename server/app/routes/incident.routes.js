const controller = require('../controllers/incident.controller')
const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  app.post('/api/v1/inc/code', controller.generateINCCode)
  app.post('/api/v1/inc/create', [], controller.createIncident)
  app.post('/api/v1/inc/list', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidents)
  app.post('/api/v1/inc/one', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentById)
  app.post('/api/v1/inc/update', [authJwt.verifyToken, hasPermission('incident:update')], controller.updateIncident)
  app.post('/api/v1/inc/delete', [authJwt.verifyToken, hasPermission('incident:delete')], controller.deleteIncident)
  app.post('/api/v1/inc/status', [authJwt.verifyToken, hasPermission('incident:update')], controller.updateIncidentStatus)

  // documents
  app.post('/api/v1/inc/upload', controller.uploadIncidentDocument)
  app.post('/api/v1/inc/documents', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentDocuments)
  app.post('/api/v1/inc/documents/one', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentDocumentById)
  app.post('/api/v1/inc/documents/delete', [authJwt.verifyToken, hasPermission('incident:delete')], controller.deleteIncidentDocument)
  app.post('/api/v1/inc/download', controller.downloadIncidentFile)

  // history tracking
  app.post('/api/v1/inc/history', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentHistory)
  app.post('/api/v1/inc/history/action', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentHistoryByAction)
}


