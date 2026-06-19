/* eslint-disable prettier/prettier */
const { authJwt } = require('../middleware')
const controller  = require('../controllers/chart.controller')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  /**
   * POST /api/v1/chart/render
   * Dispatches to a per-type optimised SQL query based on chart_type.
   *
   * Body:
   *   chart_type   number   1–12 — drives which SQL function runs
   *   model        string   Sequelize model/table name (ignored for type 8 pyramid)
   *   x_axis       object   { field, label? }        (bar / pie / treemap)
   *   y_axis       object   { field, aggregation, label? }
   *   series_field object?  { field, label? }         (grouped bars / stacked)
   *   time_field   string?  date column name          (line / multi-line)
   *   metric_fields string[]?  numeric columns        (multi-line type 12 only)
   *   filters      array?   [{ field, operation, value }]
   *   ignore_empty boolean? default true
   *
   * Response:
   *   { categories: string[], series: [{name, data}]|[{name,value}], code: '0000' }
   */
  app.post('/api/v1/chart/render', [authJwt.verifyToken], controller.renderChart)
}
