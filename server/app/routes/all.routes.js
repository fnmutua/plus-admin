/* eslint-disable prettier/prettier */
const { authJwt } = require('../middleware')
const controller = require('../controllers/tables.controller')
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  // Gets the  table names
  app.post('/api/v1/tables',  [authJwt.verifyToken],controller.modelBoard)

  // Gets the  table names
  app.get('/api/v1/data', [authJwt.verifyToken], controller.modelData)

  // Gets the  All dataes
  app.get('/api/v1/data/all',  [authJwt.verifyToken],controller.modelAllData)

  // Gets the  All dataes
  app.get('/api/v1/data/filter',  [authJwt.verifyToken],controller.modelAllDatafilter)

  // filter by keyward-paginated
  app.post('/api/v1/data/paginated/filter', [authJwt.verifyToken], controller.modelPaginatedDatafilterBykeyWord)

  // Gets the  paginated data
  app.get('/api/v1/data/paginated',  [authJwt.verifyToken],controller.modelPaginatedData)

  // Gets the  data filtereed by column
  app.post('/api/v1/data/column/paginated', [authJwt.verifyToken], controller.modelPaginatedDatafilterByColumn)
  
  //*************special controller for Housheolds only!****************************
 // app.post('/api/v1/hh/column/paginated',  [authJwt.verifyToken], controller.modelPaginatedDatafilterByColumn)
  app.post('/api/v1/hh/column/paginated', [authJwt.verifyToken, authJwt.isAdmin],controller.modelPaginatedDatafilterByColumn);
  //******************************************


  // Gets the  All dataes
  app.post('/api/v1/data/all/geo',  controller.modelAllGeo)

  // Gets the  All dataes
  app.post('/api/v1/data/one/geo', [authJwt.verifyToken], controller.modelOneGeo)

  app.post('/api/v1/data/subset/geo',  [authJwt.verifyToken],controller.modelSelectGeo)

  // Gets the  table names
  app.post('/api/v1/data/one', [authJwt.verifyToken], controller.modelOneRecord)

  // Gets the  table names
  app.post('/api/v1/data/edit', [authJwt.verifyToken], controller.modelEditOneRecord)

  // Gets the  table names
  app.post('/api/v1/data/import', [authJwt.verifyToken], controller.modelImportData)
  app.post('/api/v1/data/import/upsert',  [authJwt.verifyToken],controller.modelImportDataUpsert)
  
  // create one record
  app.post('/api/v1/data/create',  [authJwt.verifyToken],controller.modelCreateOneRecord)

  // create one record
  app.post('/api/v1/data/delete', [authJwt.verifyToken], controller.modelDeleteOneRecord)

  // count records
  app.post('/api/v1/data/count',  [authJwt.verifyToken],controller.modelCountAll)

  // count Distinct records
  app.post('/api/v1/data/count/distinct', [authJwt.verifyToken], controller.modelCountDistinct)
  app.post('/api/v1/user/activate', [authJwt.verifyToken], controller.modelActivateUser)

  // Gets county users
  app.get('/api/v1/user/county', [authJwt.verifyToken], controller.modelCountyUsers)

  // Gets all users

  //app.post('/api/v1/user/all',  [authJwt.verifyToken],controller.modelAllUsers) // retrired 

  // count records with a filter
  app.post('/api/v1/data/count/filter',[authJwt.verifyToken],   controller.modelCountFilter)

  // sum a feild
  app.post('/api/v1/data/sum',  [authJwt.verifyToken],controller.modelSumAll)

  // sum filtreed
  app.post('/api/v1/data/sum/filter', [authJwt.verifyToken],  controller.modelSumFiltered)

  // sum filtreed
  app.post('/api/v1/upload', [authJwt.verifyToken], controller.modelUpload)

  app.post('/api/v1/upload/documentation', [authJwt.verifyToken], controller.ReportDocumentationUpload)
  app.post('/api/v1/upload/delete', [authJwt.verifyToken], controller.RemoveDocument)

  // get parent IDS
  app.post('/api/v1/data/parentids',  [authJwt.verifyToken],controller.modelGetParentIDS)

  
  app.post(
    "/api/v1/model/fields", [authJwt.verifyToken],
    controller.modelBoard
  );

}

