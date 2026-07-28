const { authJwt } = require('../middleware')
const controller = require('../controllers/dashboardBundle.controller')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  /**
   * National dashboard — single cached payload (cards + all chart data).
   * Redis TTL 10 minutes; refreshed in background by scheduler.
   */
  app.get('/api/v1/dashboard/national/bundle', [authJwt.verifyToken], controller.getNationalDashboardBundle)

  /** Admin/cron: force rebuild */
  app.post('/api/v1/dashboard/national/bundle/refresh', [authJwt.verifyToken], controller.refreshNationalDashboardBundle)

  /** Dashboard choropleth admin boundaries (county / subcounty / ward geo) — before :id routes */
  app.get('/api/v1/dashboard/geo/bundle', [authJwt.verifyToken], controller.getDashboardGeoBundle)

  /** Map views — single cached payload for national (no filters) */
  app.get('/api/v1/dashboard/map/landing/bundle', [authJwt.verifyToken], controller.getLandingMapBundle)
  app.get('/api/v1/dashboard/map/projects/bundle', [authJwt.verifyToken], controller.getProjectMapBundle)

  /** Intervention / dynamic dashboards — cached national bundle by dashboard id */
  app.get('/api/v1/dashboard/:id/bundle', [authJwt.verifyToken], controller.getDashboardBundle)
  app.post('/api/v1/dashboard/:id/bundle/refresh', [authJwt.verifyToken], controller.refreshDashboardBundle)
}
