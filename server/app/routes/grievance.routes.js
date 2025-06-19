 const controller = require('../controllers/grievance.controller')
  const { authJwt } = require('../middleware')
  const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })
 

  
  
  app.post('/api/v1/grv/code', controller.generateGRMCode)
  app.post('/api/v1/grv/create', controller.createGrievanceRecord)
  app.post('/api/v1/grv/create/batch', controller.createGrievanceBatchRecords)
   

  


  app.post('/api/v1/grv/list', [authJwt.verifyToken, hasPermission('grievance:read')], controller.getGrievances)
  app.post('/api/v1/grv/one', [authJwt.verifyToken, hasPermission('grievance:read')], controller.getGrievanceById)
  app.post('/api/v1/grv/public',   controller.getGrievanceByPublicId)
  app.post('/api/v1/grv/upload',   controller.uploadGrievanceDocument)
  app.post('/api/v1/grv/upload/pcode',   controller.batchDocumentsUploadByGrievanceCode)
  app.post('/api/v1/grv/log',   controller.logGrievanceAction)
  app.post('/api/v1/grv/log/bulk',   controller.bulkLogGrievanceActions)

  
  app.post('/api/v1/grv/status',   controller.getGrievanceStatus)
  app.post('/api/v1/grv/status/update', [authJwt.verifyToken, hasPermission('grievance:update')],  controller.updateGrievanceStatus)
 
  app.post('/api/v1/grv/update', [authJwt.verifyToken, hasPermission('grievance:update')],  controller.updateGrievance)
  app.post('/api/v1/grv/update/bulk', [authJwt.verifyToken, hasPermission('grievance:update')],  controller.bulkUpdateReferredToOfficer)

 
  
  app.post('/api/v1/grv/upsert',   controller.modelImportGrievances)
  app.post('/api/v1/grv/keyword',[authJwt.verifyToken, hasPermission('grievance:read')],   controller.getGrievancesByKeyword)
  app.post('/api/v1/grv/phone', [authJwt.verifyToken, hasPermission('grievance:read')],  controller.getGrievanceByUserPhone)
  app.post('/api/v1/grv/history', [authJwt.verifyToken, hasPermission('grievance:read')],  controller.getGrievanceHistoryByGrievanceId)
  app.post('/api/v1/grv/self/escalate',   controller.updateGrievanceStatusByComplainant)
  app.post('/api/v1/grv/reminder', [authJwt.verifyToken, hasPermission('grievance:read')],   controller.sendReminder)

  
  

  app.post('/api/v1/grv/delete', [authJwt.verifyToken, hasPermission('grievance:delete')],  controller.deleteCascadeGrievance)

  app.post('/api/v1/grv/revert', [authJwt.verifyToken, hasPermission('grievance:update')],  controller.revertEdits)

  
  app.post(
    "/api/v1/grv/download",  controller.downloadFile
  );

}
