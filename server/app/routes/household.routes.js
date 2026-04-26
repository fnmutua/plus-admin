const { authJwt } = require("../middleware");
const controller = require("../controllers/household.controller");
const { hasPermission } = require('../middleware/permission');


module.exports = function (app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  

  app.post("/api/v1/hh/add", [authJwt.verifyToken, hasPermission('households:create')], controller.createHousehold);
  app.post("/api/v1/hh/update", [authJwt.verifyToken, hasPermission('households:update')], controller.updateHousehold);
  app.post("/api/v1/hh/delete", [authJwt.verifyToken, hasPermission('households:delete')], controller.deleteOneHousehold);


  app.post("/api/v1/hh/viewAll", [authJwt.verifyToken, hasPermission('households:read')], controller.getAllHouseholds);
  app.post("/api/v1/hh/viewOne", [authJwt.verifyToken, hasPermission('households:read')], controller.getOneHousehold);
  app.post("/api/v1/hh/filter/column", [authJwt.verifyToken, hasPermission('households:read')], controller.getHouseholdsfilterByColumn);
 
  app.post("/api/v1/hh/filter/keyword", [authJwt.verifyToken, hasPermission('households:read')], controller.getHouseholdsfilterBykeyWord);
  app.post("/api/v1/hh/batch", [authJwt.verifyToken, hasPermission('households:import')], controller.batchHouseholdImport);
  app.post("/api/v1/hh/export/excel/job/start", [authJwt.verifyToken, hasPermission('households:full_export')], controller.createHouseholdExportJob);
  app.post("/api/v1/hh/export/excel/job/status", [authJwt.verifyToken, hasPermission('households:full_export')], controller.getHouseholdExportJobStatus);
  app.post("/api/v1/hh/export/excel/job/download", [authJwt.verifyToken, hasPermission('households:full_export')], controller.downloadHouseholdExportJob);

  
  

};