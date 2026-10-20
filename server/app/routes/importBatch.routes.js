'use strict'

const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')
const controller = require('../controllers/importBatch.controller')

const BASE = '/api/v1/import-batches'

module.exports = function (app) {
  /**
   * @swagger
   * /api/v1/import-batches:
   *   get:
   *     tags: [Data]
   *     summary: List bulk imports
   *     description: >
   *       Imports sent through /api/v1/data/import/upsert, newest first. Users
   *       with import:revert see every import; others see their own.
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: model
   *         schema: { type: string }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [active, partially_reverted, reverted] }
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 25, maximum: 100 }
   *     responses:
   *       200: { description: One page of imports }
   */
  app.get(BASE, [authJwt.verifyToken], controller.list)

  /**
   * @swagger
   * /api/v1/import-batches/{id}:
   *   get:
   *     tags: [Data]
   *     summary: One import, with each record it wrote and whether undo can apply to it
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: The import, a summary and its items }
   *       404: { description: Not found or not visible to this user }
   */
  app.get(`${BASE}/:id`, [authJwt.verifyToken], controller.detail)

  /**
   * @swagger
   * /api/v1/import-batches/{id}/features:
   *   get:
   *     tags: [Data]
   *     summary: The geometries an import wrote, as GeoJSON
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: FeatureCollection }
   *       404: { description: Not found or not visible to this user }
   */
  app.get(`${BASE}/:id/features`, [authJwt.verifyToken], controller.features)

  /**
   * @swagger
   * /api/v1/import-batches/{id}/revert:
   *   post:
   *     tags: [Data]
   *     summary: Undo an import, or preview the undo
   *     description: >
   *       Deletes the records the import created and restores the values it
   *       overwrote, in one transaction. Records edited since, referred to by
   *       other records, or changed again by a later import are skipped and
   *       reported as conflicts. With dryRun nothing changes.
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               dryRun:  { type: boolean, default: false }
   *               itemIds: { type: array, items: { type: integer }, description: Undo only these items }
   *     responses:
   *       200: { description: What was (or would be) undone, and the conflicts }
   *       403: { description: Missing import:revert }
   *       404: { description: Not found }
   */
  app.post(`${BASE}/:id/revert`, [authJwt.verifyToken, hasPermission('import:revert')], controller.revert)
}
