'use strict'

const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')
const controller = require('../controllers/settlementType.controller')

const BASE = '/api/v1/settlement-types'

module.exports = function (app) {
  /**
   * @swagger
   * /api/v1/settlement-types:
   *   get:
   *     tags: [Settlement Types]
   *     summary: List settlement types
   *     description: >
   *       The managed list behind every settlement type picker. Active types only
   *       by default; the management screen passes includeInactive=true and also
   *       receives how many settlements use each type.
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: includeInactive
   *         schema: { type: boolean, default: false }
   *     responses:
   *       200: { description: Settlement types, in display order }
   */
  app.get(BASE, [authJwt.verifyToken], controller.list)

  /**
   * @swagger
   * /api/v1/settlement-types:
   *   post:
   *     tags: [Settlement Types]
   *     summary: Add a settlement type
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [label]
   *             properties:
   *               label:       { type: string, description: Shown in pickers and stored on settlements }
   *               code:        { type: string, description: Stable slug; derived from the label when omitted }
   *               description: { type: string }
   *               active:      { type: boolean, default: true }
   *     responses:
   *       201: { description: Created }
   *       400: { description: Missing or duplicate label }
   */
  app.post(BASE, [authJwt.verifyToken, hasPermission('settlement_type:manage')], controller.create)

  /**
   * @swagger
   * /api/v1/settlement-types/{id}:
   *   put:
   *     tags: [Settlement Types]
   *     summary: Update a settlement type
   *     description: >
   *       Renaming the label also rewrites settlement.settlement_type for every
   *       settlement using the old label, in one transaction.
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200: { description: Updated, with how many settlements were renamed }
   *       400: { description: Missing or duplicate label }
   *       404: { description: Not found }
   */
  app.put(`${BASE}/:id`, [authJwt.verifyToken, hasPermission('settlement_type:manage')], controller.update)

  /**
   * @swagger
   * /api/v1/settlement-types/{id}:
   *   delete:
   *     tags: [Settlement Types]
   *     summary: Remove an unused settlement type
   *     description: Refused while settlements still use it; deactivate those instead.
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200: { description: Removed }
   *       404: { description: Not found }
   *       409: { description: Still in use }
   */
  app.delete(`${BASE}/:id`, [authJwt.verifyToken, hasPermission('settlement_type:manage')], controller.remove)
}
