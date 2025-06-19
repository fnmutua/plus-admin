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
  

  app.post("/api/v1/hh/add", [authJwt.verifyToken, hasPermission('household:create')], controller.createHousehold);
  app.post("/api/v1/hh/update", [authJwt.verifyToken, hasPermission('household:update')], controller.updateHousehold);
  app.post("/api/v1/hh/delete", [authJwt.verifyToken, hasPermission('household:delete')], controller.deleteOneHousehold);


  app.post("/api/v1/hh/viewAll", [authJwt.verifyToken, hasPermission('household:read')], controller.getAllHouseholds);
  app.post("/api/v1/hh/viewOne", [authJwt.verifyToken, hasPermission('household:read')], controller.getOneHousehold);
  app.post("/api/v1/hh/filter/column", [authJwt.verifyToken, hasPermission('household:read')], controller.getHouseholdsfilterByColumn);
 
  app.post("/api/v1/hh/filter/keyword", [authJwt.verifyToken, hasPermission('household:read')], controller.getHouseholdsfilterBykeyWord);
  app.post("/api/v1/hh/batch", [authJwt.verifyToken, hasPermission('household:import')], controller.batchHouseholdImport);

  
  

};