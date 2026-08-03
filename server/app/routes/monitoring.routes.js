const { authJwt } = require('../middleware');
const { hasPermission } = require('../middleware/permission');
const controller = require('../controllers/monitoring.controller');

module.exports = function (app) {
  /**
   * POST /api/v1/monitoring/config
   * Body: { county_id: number }
   * Returns all M&E form options (locations, projects, activities, indicators) in one request.
   * Requires project_location:read (monitoring users have this).
   */
  app.post(
    '/api/v1/monitoring/config',
    [authJwt.verifyToken, hasPermission('project_location:read')],
    controller.getMonitoringConfig
  );

  /**
   * POST /api/v1/monitoring/baseline
   * Latest cumulative + configured targets for a project/location filing context.
   */
  app.post(
    '/api/v1/monitoring/baseline',
    [authJwt.verifyToken, hasPermission('indicator_category_report:read')],
    controller.getMonitoringBaseline
  );
};
