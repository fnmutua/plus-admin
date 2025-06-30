/* eslint-disable prettier/prettier */
const { authJwt } = require('../middleware')
const controller = require('../controllers/tables.controller')
const { hasDynamicPermission, hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  app.post('/api/v1/tables', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelBoard)

  app.post('/api/v1/routes',  controller.GetRoutes)

  app.get('/api/v1/data', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelData)

  app.get('/api/v1/data/all', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllData)
  app.get('/api/v1/data/all/nogeo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllDataNoGeo)
  app.get('/api/v1/data/code',   controller.modelGetByCode)

  app.get('/api/v1/data/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllDatafilter)

  app.post('/api/v1/data/paginated/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterBykeyWord)
  app.post('/api/v1/data/lookup', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelLookup)

  app.get('/api/v1/data/paginated', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedData)

  app.post('/api/v1/data/column/paginated', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumn)
  app.post('/api/v1/data/column/paginated/nogeo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumnNoGeo)
  app.post('/api/v1/data/column/duplicate',  controller.findPotentialDuplicates)
  app.post('/api/v1/data/merge',  controller.mergeDuplicates)

  app.post('/api/v1/data/download/all', [authJwt.verifyToken, hasDynamicPermission('export')], controller.getAllListforDownload)

  app.post('/api/v1/data/column/mm', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumnM2M)
  
  app.post('/api/v1/hh/column/paginated', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumn);

  app.post('/api/v1/data/all/geo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllGeo)
  app.get('/api/v1/data/stream/geo',  controller.streamAllGeo)
  app.get('/api/v1/data/geo/minimal', [authJwt.verifyToken, hasDynamicPermission('read')], controller.streamMinimalGeo)

  app.post('/api/v1/data/one/geo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelOneGeo)

  app.post('/api/v1/data/subset/geo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSelectGeo)
  app.post('/api/v1/data/subset/geo/parcel', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSelectParcelGeo)
  app.post('/api/v1/data/geo/multiple', [authJwt.verifyToken], controller.getSettlementMapData)

  app.post('/api/v1/data/one', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelOneRecord)
  app.post('/api/v1/data/one/code', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelOneRecordByCode)

  app.post('/api/v1/data/edit', [authJwt.verifyToken, hasDynamicPermission('update')], controller.modelEditOneRecord)

  app.post('/api/v1/data/import', [authJwt.verifyToken, hasDynamicPermission('import')], controller.modelImportData)
  app.post('/api/v1/data/import/upsert', [authJwt.verifyToken], controller.modelImportDataUpsert)
  
  app.post('/api/v1/data/create', [authJwt.verifyToken, hasDynamicPermission('create')], controller.modelCreateOneRecord)
  app.post('/api/v1/data/create/check', [authJwt.verifyToken, hasDynamicPermission('create')], controller.checkPotentialDuplicates)

  app.post('/api/v1/data/delete', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.modelDeleteOneRecord)
  app.post('/api/v1/data/delete/many', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.modelDeleteRecords)
  app.post('/api/v1/data/delete/keys', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.modelDeleteByFields)

  app.post('/api/v1/data/count', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelCountAll)

  app.post('/api/v1/data/count/distinct', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelCountDistinct)

  app.post('/api/v1/data/count/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelCountFilter)

  app.post('/api/v1/data/sum', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSumAll)

  app.post('/api/v1/data/sum/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSumFiltered)

  app.post('/api/v1/upload', [authJwt.verifyToken, hasPermission('document:create')], controller.modelUpload)
  app.post('/api/v1/upload/batch', [authJwt.verifyToken, hasPermission('document:create')], controller.batchDocumentsUpload)
  app.post('/api/v1/upload/check', [authJwt.verifyToken, hasPermission('document:read')], controller.checkDocuments)
  app.post('/api/v1/upload/cover', [authJwt.verifyToken, hasPermission('document:create')], controller.batchDocumentsUploadCover)
  app.post('/api/v1/upload/batch/pcode', [authJwt.verifyToken, hasPermission('document:create')], controller.batchDocumentsUploadByParentCode)
  app.post('/api/v1/upload/documentation', [authJwt.verifyToken, hasPermission('document:create')], controller.ReportDocumentationUpload)
  app.post('/api/v1/upload/delete', [authJwt.verifyToken, hasPermission('document:delete')], controller.RemoveDocument)

  app.post('/api/v1/documents/raw', [authJwt.verifyToken, hasPermission('document:read')], controller.getRawDocuments)
  app.post('/api/v1/documents/raw/delete', [authJwt.verifyToken, hasPermission('document:delete')], controller.DeleteRawDocuments)
  app.post('/api/v1/download', [authJwt.verifyToken, hasPermission('document:read')], controller.downloadFile)

  app.post('/api/v1/edit/revert', [authJwt.verifyToken, hasDynamicPermission('update')], controller.revertEdits)
  app.post('/api/v1/delete/cascade', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.deleteCascade)

  app.get('/api/v1/models/list', [authJwt.verifyToken], controller.listModels)

  app.post('/api/v1/data/intersect', [authJwt.verifyToken, hasDynamicPermission('read')], controller.intersectGeometryWithModel)
  app.post('/api/v1/data/many/code', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelManyRecordsByCodes)

  app.post('/api/v1/model/fields', [authJwt.verifyToken], controller.modelBoard)
  app.post('/api/v1/docs/search',  controller.filterRepository)

  app.post(
    "/api/v1/fields/options",   controller.getFieldQUnique
  );
}

