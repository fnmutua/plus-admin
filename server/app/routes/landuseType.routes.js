'use strict'

const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')
const controller = require('../controllers/landuseType.controller')

const BASE = '/api/v1/landuse-types'

module.exports = function (app) {
  /**
   * @swagger
   * /api/v1/landuse-types:
   *   get:
   *     tags: [Land Use Types]
   *     summary: List parcel land-use types
   *     description: >
   *       Managed list for map legends, parcel colouring, and QGIS import matching.
   *       Active types only by default; pass includeInactive=true for the settings screen.
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: includeInactive
   *         schema: { type: boolean, default: false }
   *     responses:
   *       200: { description: Land-use types, in display order }
   */
  app.get(BASE, [authJwt.verifyToken], controller.list)

  app.post(BASE, [authJwt.verifyToken, hasPermission('landuse_type:manage')], controller.create)

  app.put(`${BASE}/:id`, [authJwt.verifyToken, hasPermission('landuse_type:manage')], controller.update)

  app.delete(`${BASE}/:id`, [authJwt.verifyToken, hasPermission('landuse_type:manage')], controller.remove)
}
