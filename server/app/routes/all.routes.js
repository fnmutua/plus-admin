/* eslint-disable prettier/prettier */
const { authJwt } = require('../middleware')
const controller = require('../controllers/tables.controller')
const { hasDynamicPermission, hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  // Gets the  table names
  app.post('/api/v1/tables', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelBoard)
  app.post('/api/v1/routes',  controller.GetRoutes)

  // Gets the  table names
  app.get('/api/v1/data', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelData)

  // Gets the  All dataes
  app.get('/api/v1/data/all', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllData)
  app.get('/api/v1/data/all/nogeo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllDataNoGeo)
  app.get('/api/v1/data/code',   controller.modelGetByCode)

  // Gets the  All dataes
  app.get('/api/v1/data/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllDatafilter)

  // filter by keyward-paginated
  app.post('/api/v1/data/paginated/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterBykeyWord)
  app.post('/api/v1/data/lookup', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelLookup)

  // Gets the  paginated data
  app.get('/api/v1/data/paginated', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedData)

  // Gets the  data filtereed by column
  app.post('/api/v1/data/column/paginated', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumn)
  app.post('/api/v1/data/column/paginated/nogeo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumnNoGeo)
  //app.post('/api/v1/data/column/duplicate', [authJwt.verifyToken], controller.findPotentialDuplicates)
  app.post('/api/v1/data/column/duplicate',  controller.findPotentialDuplicates)
  app.post('/api/v1/data/merge',  controller.mergeDuplicates)

  


 app.post('/api/v1/data/download/all', [authJwt.verifyToken, hasDynamicPermission('export')], controller.getAllListforDownload)

 



  // Gets the  data filtereed by column for a Many2many relationship

  app.post('/api/v1/data/column/mm', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumnM2M)
  


  //*************special controller for Housheolds only!****************************
 // app.post('/api/v1/hh/column/paginated',  [authJwt.verifyToken], controller.modelPaginatedDatafilterByColumn)
  app.post('/api/v1/hh/column/paginated', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumn);
  //******************************************


  // Gets the  All dataes
  app.post('/api/v1/data/all/geo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllGeo)
  app.get('/api/v1/data/stream/geo',  controller.streamAllGeo)
  app.get('/api/v1/data/geo/minimal', [authJwt.verifyToken, hasDynamicPermission('read')], controller.streamMinimalGeo)

  // Gets the  All dataes
  app.post('/api/v1/data/one/geo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelOneGeo)

  app.post('/api/v1/data/subset/geo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSelectGeo)
  app.post('/api/v1/data/subset/geo/parcel', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSelectParcelGeo)



  
  // Gets the  table names
  app.post('/api/v1/data/one', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelOneRecord)
  app.post('/api/v1/data/one/code', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelOneRecordByCode)




  
  // Gets the  table names
  app.post('/api/v1/data/edit', [authJwt.verifyToken, hasDynamicPermission('update')], controller.modelEditOneRecord)

  // Gets the  table names
  app.post('/api/v1/data/import', [authJwt.verifyToken, hasDynamicPermission('import')], controller.modelImportData)
  app.post('/api/v1/data/import/upsert', [authJwt.verifyToken, hasDynamicPermission('import')], controller.modelImportDataUpsert)
  
  // create one record
  app.post('/api/v1/data/create', [authJwt.verifyToken, hasDynamicPermission('create')], controller.modelCreateOneRecord)
  app.post('/api/v1/data/create/check', [authJwt.verifyToken, hasDynamicPermission('create')], controller.checkPotentialDuplicates)

  // create one record
  app.post('/api/v1/data/delete', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.modelDeleteOneRecord)
  app.post('/api/v1/data/delete/many', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.modelDeleteRecords)
  app.post('/api/v1/data/delete/keys', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.modelDeleteByFields)

  
  // count records
  app.post('/api/v1/data/count', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelCountAll)

  // count Distinct records
  app.post('/api/v1/data/count/distinct', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelCountDistinct)

 
  // Gets all users

  //app.post('/api/v1/user/all',  [authJwt.verifyToken],controller.modelAllUsers) // retrired 

  // count records with a filter
  app.post('/api/v1/data/count/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelCountFilter)

  // sum a feild
  app.post('/api/v1/data/sum', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSumAll)

  // sum filtreed
  app.post('/api/v1/data/sum/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSumFiltered)

  // Document upload routes
  app.post('/api/v1/upload', [authJwt.verifyToken, hasPermission('document:create')], controller.modelUpload)
  app.post('/api/v1/upload/batch', [authJwt.verifyToken, hasPermission('document:create')], controller.batchDocumentsUpload)
  app.post('/api/v1/upload/check', [authJwt.verifyToken, hasPermission('document:read')], controller.checkDocuments)
  app.post('/api/v1/upload/cover', [authJwt.verifyToken, hasPermission('document:create')], controller.batchDocumentsUploadCover)
  app.post('/api/v1/upload/batch/pcode', [authJwt.verifyToken, hasPermission('document:create')], controller.batchDocumentsUploadByParentCode)
  app.post('/api/v1/upload/documentation', [authJwt.verifyToken, hasPermission('document:create')], controller.ReportDocumentationUpload)
  app.post('/api/v1/upload/delete', [authJwt.verifyToken, hasPermission('document:delete')], controller.RemoveDocument)

  // Document read/delete routes  
  app.post('/api/v1/documents/raw', [authJwt.verifyToken, hasPermission('document:read')], controller.getRawDocuments)
  app.post('/api/v1/documents/raw/delete', [authJwt.verifyToken, hasPermission('document:delete')], controller.DeleteRawDocuments)
  app.post('/api/v1/download', [authJwt.verifyToken, hasPermission('document:read')], controller.downloadFile)

  app.post('/api/v1/edit/revert', [authJwt.verifyToken, hasDynamicPermission('update')], controller.revertEdits)
  app.post('/api/v1/delete/cascade', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.deleteCascade)

  
  app.get('/api/v1/models/list', [authJwt.verifyToken, hasDynamicPermission('read')], controller.listModels)

  app.post('/api/v1/data/intersect', [authJwt.verifyToken, hasDynamicPermission('read')], controller.intersectGeometryWithModel)
  app.post('/api/v1/data/many/code', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelManyRecordsByCodes)


  


}

