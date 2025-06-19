const { authJwt } = require("../middleware");
const controller = require("../controllers/roles.controller");
const { hasPermission } = require('../middleware/permission');
const permissionController = require('../controllers/permission.controller');

module.exports = function(app) {

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
    //app.post('/api/v1/user/all',  [authJwt.verifyToken],controller.modelAllUsers) // retrired 
  //   app.post("/api/v1/role/add", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.createRole);
  // app.post("/api/v1/role/all", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.getAllRoles);
  // app.post("/api/v1/role/one", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.getRoleById);
  // app.post("/api/v1/role/subordinate", [authJwt.verifyToken, authJwt.isSomeAdmin],controller.getSubordinateRoles);
  // app.post("/api/v1/role/edit", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.editRole);
  // app.post("/api/v1/role/delete", [authJwt.verifyToken, authJwt.isSuperAdmin],controller.deleteRole);

  // ... existing code ...
    app.post("/api/v1/role/add", [authJwt.verifyToken, hasPermission('role:assign')], controller.createRole);
    app.post("/api/v1/role/all", [authJwt.verifyToken, hasPermission('role:read')], controller.getAllRoles);
    app.post("/api/v1/role/one", [authJwt.verifyToken, hasPermission('role:read')], controller.getRoleById);
    app.post("/api/v1/role/subordinate", [authJwt.verifyToken], controller.getSubordinateRoles);
    //app.post("/api/v1/role/edit", [authJwt.verifyToken, hasPermission('role:assign')], controller.editRole);
    app.post("/api/v1/role/delete", [authJwt.verifyToken, hasPermission('role:assign')], controller.deleteRole);
// ... existing code ...

  // Role-Permission Endpoints (put these before the generic :roleId route)
  app.post('/api/v1/roles/permissions', [authJwt.verifyToken, hasPermission('roles:read')], controller.getRolePermissions);
  app.post('/api/v1/roles/permissions/update', [authJwt.verifyToken, hasPermission('roles:update')], controller.setRolePermissions);
  app.post('/api/v1/roles/permissions/add', [authJwt.verifyToken, hasPermission('roles:update')], controller.addRolePermission);
  app.post('/api/v1/roles/permissions/remove', [authJwt.verifyToken, hasPermission('roles:update')], controller.removeRolePermission);




  // RESTful Role Endpoints
  app.get('/api/v1/roles/all', [authJwt.verifyToken, hasPermission('roles:read')], controller.getAllRoles);
  app.post('/api/v1/roles/one', [authJwt.verifyToken, hasPermission('roles:read')], controller.getRoleById);
  app.post('/api/v1/roles/add', [authJwt.verifyToken, hasPermission('roles:create')], controller.createRole);
  app.post('/api/v1/roles/update', [authJwt.verifyToken, hasPermission('roles:update')], controller.editRole);
  app.post('/api/v1/roles/delete', [authJwt.verifyToken, hasPermission('roles:delete')], controller.deleteRole);

  // Permissions endpoint (move to permissions route if needed)
  app.get('/api/v1/permissions', [authJwt.verifyToken, hasPermission('roles:read')], permissionController.getAllPermissions);
};


//api/v1/roles/-99/permissions