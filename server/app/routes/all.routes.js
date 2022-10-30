/* eslint-disable prettier/prettier */
const { authJwt } = require('../middleware')
const controller = require('../controllers/tables.controller')
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  // Gets the  table names
  app.post('/api/v1/tables', controller.modelBoard)

  // Gets the  table names
  app.get('/api/v1/data', controller.modelData)

  // Gets the  All dataes
  app.get('/api/v1/data/all',  [authJwt.verifyToken],controller.modelAllData)

  // Gets the  All dataes
  app.get('/api/v1/data/filter', controller.modelAllDatafilter)

  // filter by keyward-paginated
  app.post('/api/v1/data/paginated/filter', controller.modelPaginatedDatafilterBykeyWord)

  // Gets the  paginated data
  app.get('/api/v1/data/paginated', controller.modelPaginatedData)

  // Gets the  data filtereed by column
  app.post('/api/v1/data/column/paginated', controller.modelPaginatedDatafilterByColumn)

  // Gets the  All dataes
  app.get('/api/v1/data/all/geo', controller.modelAllGeo)

  // Gets the  All dataes
  app.post('/api/v1/data/one/geo', controller.modelOneGeo)

  app.post('/api/v1/data/subset/geo', controller.modelSelectGeo)

  // Gets the  table names
  app.post('/api/v1/data/one', controller.modelOneRecord)

  // Gets the  table names
  app.post('/api/v1/data/edit', controller.modelEditOneRecord)

  // Gets the  table names
  app.post('/api/v1/data/import', controller.modelImportData)
  app.post('/api/v1/data/import/upsert', controller.modelImportDataUpsert)
  
  // create one record
  app.post('/api/v1/data/create', controller.modelCreateOneRecord)

  // create one record
  app.post('/api/v1/data/delete', controller.modelDeleteOneRecord)

  // count records
  app.post('/api/v1/data/count', controller.modelCountAll)

  // count Distinct records
  app.post('/api/v1/data/count/distinct', controller.modelCountDistinct)
  app.post('/api/v1/user/activate', controller.modelActivateUser)

  // Gets county users
  app.get('/api/v1/user/county', controller.modelCountyUsers)

  // Gets all users

  app.post('/api/v1/user/all', controller.modelAllUsers)

  // count records with a filter
  app.post('/api/v1/data/count/filter', controller.modelCountFilter)

  // sum a feild
  app.post('/api/v1/data/sum', controller.modelSumAll)

  // sum filtreed
  app.post('/api/v1/data/sum/filter', controller.modelSumFiltered)

  // sum filtreed
  app.post('/api/v1/upload', controller.modelUpload)
}
