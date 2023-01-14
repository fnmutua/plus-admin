const { authJwt } = require("../middleware");
const controller = require("../controllers/household.controller");


module.exports = function (app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  

  app.post("/api/v1/hh/add", [authJwt.verifyToken, authJwt.isStaffOrAdmin], controller.createHousehold);
  app.post("/api/v1/hh/update", [authJwt.verifyToken, authJwt.isStaffOrAdmin],controller.updateHousehold);
  app.post("/api/v1/hh/delete", [authJwt.verifyToken, authJwt.isStaffOrAdmin],controller.deleteOneHousehold);


  app.post("/api/v1/hh/viewAll", [authJwt.verifyToken, authJwt.isStaffOrAdmin], controller.getAllHouseholds);
  app.post("/api/v1/hh/viewOne", [authJwt.verifyToken, authJwt.isStaffOrAdmin],controller.getOneHousehold);
  app.post("/api/v1/hh/filter/column", [authJwt.verifyToken, authJwt.isStaffOrAdmin],controller.getHouseholdsfilterByColumn);
 
  app.post("/api/v1/hh/filter/keyword", [authJwt.verifyToken, authJwt.isStaffOrAdmin],controller.getHouseholdsfilterBykeyWord);
  app.post("/api/v1/hh/batch", [authJwt.verifyToken, authJwt.isStaffOrAdmin],controller.batchHouseholdImport);

  
  

};