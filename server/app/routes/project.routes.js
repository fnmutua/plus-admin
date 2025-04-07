const { authJwt } = require("../middleware");
const controller = require("../controllers/project.controller");
module.exports = function(app) {

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
    //app.post('/api/v1/user/all',  [authJwt.verifyToken],controller.modelAllUsers) // retrired 


    app.post("/api/v1/project/task/add", [authJwt.verifyToken], controller.modelCreateOneRecord);
    app.post("/api/v1/project/task/del", [authJwt.verifyToken], controller.modelDeleteOneRecord);
    app.post("/api/v1/project/task/get", [authJwt.verifyToken], controller.getTasksByProjectId);
    app.post("/api/v1/project/task/get/nested", [authJwt.verifyToken], controller.getNestedTasksByProjectId);
    app.post("/api/v1/project/task/import", [authJwt.verifyToken], controller.modelImportDataUpsert);
 
    


};