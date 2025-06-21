const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");
const { hasPermission } = require('../middleware/permission');

module.exports = function(app) {

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
    //app.post('/api/v1/user/all',  [authJwt.verifyToken],controller.modelAllUsers) // retrired 


  app.post("/api/v1/user/all", [authJwt.verifyToken, hasPermission('user:read')], controller.modelAllUsers);
  app.post("/api/v1/user/county", [authJwt.verifyToken, hasPermission('user:read')], controller.modelCountyUsers);
  app.post("/api/v1/user/grm", [authJwt.verifyToken, hasPermission('user:read')], controller.modelGRMUsers);
  app.post("/api/v1/user/grm/location", [authJwt.verifyToken, hasPermission('user:read')], controller.getGRMUsersByLocation);

  


  app.post("/api/v1/user/admin", [authJwt.verifyToken, hasPermission('user:read')], controller.modelAdminUsers);

  
  app.post("/api/v1/user/keyword", [authJwt.verifyToken, hasPermission('user:read')], controller.modelPaginatedUsersfilterBykeyWord);
  app.post("/api/v1/user/name", [authJwt.verifyToken, hasPermission('user:read')], controller.modelUserByName);
  app.post("/api/v1/user/check",  controller.checkUser);
  app.post("/api/v1/user/multiple",  controller.checkUsers);
  app.post("/api/v1/user/delete", [authJwt.verifyToken, hasPermission('user:delete')], controller.deleteUserCascade);

  app.post("/api/v1/user/permissions", [authJwt.verifyToken], controller.getUserPermissions);

  //app.post("/api/v1/roles/all", [authJwt.verifyToken, hasPermission('role:assign')], controller.rolesController);

  app.post("/api/v1/feedback/add", controller.sendFeedback);
  app.post("/api/v1/feedback/all", [authJwt.verifyToken, hasPermission('feedback:read')], controller.getFeedback);

 // Gets county users
 //app.get('/api/v1/user/county', [authJwt.verifyToken], controller.modelCountyUsers)



  app.get(
    "/api/v1/user",
    [authJwt.verifyToken],
    controller.userBoard
  );


  
  app.get(
    "/api/v1/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

 
  app.get(
    "/api/v1/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  app.post(
    "/api/v1/user/logout",
    controller.Logout
  );


};