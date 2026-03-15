const { authJwt } = require('../middleware');
const { hasPermission } = require('../middleware/permission');
const controller = require('../controllers/monitoring.controller');

module.exports = function (app) {
  /**
   * GET /api/v1/monitoring/config?county_id=X
   * Returns all M&E form options (locations, projects, activities, indicators) in one request.
   * Requires project_location:read (monitoring users have this).
   */
  app.get(
    '/api/v1/monitoring/config',
    [authJwt.verifyToken, hasPermission('project_location:read')],
    controller.getMonitoringConfig
  );
};
