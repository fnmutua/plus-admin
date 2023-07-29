const { authJwt } = require("../middleware");
const controller = require("../controllers/roles.controller");
module.exports = function(app) {

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
    //app.post('/api/v1/user/all',  [authJwt.verifyToken],controller.modelAllUsers) // retrired 

    app.post("/api/v1/role/add", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.createRole);

  app.post("/api/v1/role/all", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.getAllRoles);
  app.post("/api/v1/role/one", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.getRoleById);
  app.post("/api/v1/role/subordinate", [authJwt.verifyToken, authJwt.isSomeAdmin],controller.getSubordinateRoles);


  app.post("/api/v1/role/edit", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.editRole);

  app.post("/api/v1/role/delete", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.deleteRole);
   


};