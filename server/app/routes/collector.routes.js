const { authJwt } = require("../middleware");
const controller = require("../controllers/collector.controller");
module.exports = function(app) {

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
 

  app.get("/api/v1/collector/project", [authJwt.verifyToken, authJwt.isStaffOrAdmin],controller.modelGetProjects);
  app.post("/api/v1/collector", [authJwt.verifyToken, authJwt.isStaffOrAdmin],controller.modelLoginCollector);
 
 

  

};