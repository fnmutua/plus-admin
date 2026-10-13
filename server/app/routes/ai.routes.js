'use strict'

const rateLimit = require('express-rate-limit')
const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')
const controller = require('../controllers/ai.controller')

// Every answered question costs a model call, so the ask endpoint is metered
// per user rather than left open the way the previous implementation was.
const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_PER_MINUTE) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  // verifyToken runs first, so req.userid is always set here; the IP is only
  // a defensive fallback and never a real bucket key.
  keyGenerator: (req) => String(req.userid || req.ip),
  message: { success: false, message: 'Too many AI requests. Please wait a moment.' }
})

const SETTINGS_PATH = '/api/ai/settings'

module.exports = function (app) {
  /**
   * @swagger
   * /api/ai/health:
   *   get:
   *     tags: [AI]
   *     summary: AI service health
   *     description: Reports database, chat provider and embedding provider status.
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Health report }
   */
  app.get('/api/ai/health', [authJwt.verifyToken], controller.health)

  /**
   * @swagger
   * /api/ai/providers:
   *   get:
   *     tags: [AI]
   *     summary: List configured AI providers
   *     description: Only providers this deployment can actually serve are returned.
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Provider list with the active selection }
   */
  app.get('/api/ai/providers', [authJwt.verifyToken], controller.providers)

  /**
   * @swagger
   * /api/ai/models:
   *   get:
   *     tags: [AI]
   *     summary: List models a provider will serve
   *     description: >
   *       Queried live from the provider, not a hardcoded list. Chat-capable models
   *       only, newest first, never more than the 10 most recent.
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: provider
   *         schema: { type: string, description: 'Provider id from the server catalog' }
   *       - in: query
   *         name: limit
   *         description: How many models to return, newest first. Capped at 10.
   *         schema: { type: integer, default: 10, minimum: 1, maximum: 10 }
   *     responses:
   *       200: { description: Model list, empty if the provider is unreachable }
   */
  app.get('/api/ai/models', [authJwt.verifyToken], controller.models)

  /**
   * @swagger
   * /api/ai/ask:
   *   post:
   *     tags: [AI]
   *     summary: Ask a question about indexed documents
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [question]
   *             properties:
   *               question:  { type: string }
   *               sessionId: { type: string, description: Conversation thread key }
   *               provider:  { type: string, description: 'Provider id from the server catalog' }
   *               model:     { type: string }
   *     responses:
   *       200: { description: Answer with cited sources and token usage }
   *       400: { description: Missing question or unconfigured provider }
   *       429: { description: Rate limited }
   *       503: { description: AI service unavailable }
   */
  app.post('/api/ai/ask', [authJwt.verifyToken, hasPermission('document:read'), askLimiter], controller.ask)

  /**
   * @swagger
   * /api/ai/session:
   *   delete:
   *     tags: [AI]
   *     summary: Clear a conversation thread
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Number of turns removed }
   */
  app.delete('/api/ai/session', [authJwt.verifyToken], controller.clearSession)

  /**
   * @swagger
   * /api/ai/stats:
   *   get:
   *     tags: [AI]
   *     summary: Index statistics
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Document, chunk and embedding counts }
   */
  app.get('/api/ai/stats', [authJwt.verifyToken, hasPermission('document:read')], controller.stats)

  /**
   * @swagger
   * /api/ai/documents:
   *   get:
   *     tags: [AI]
   *     summary: List indexed documents
   *     description: Every document in the AI index with its chunk and embedding counts, newest first.
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Indexed documents }
   *       503: { description: AI database unavailable }
   */
  app.get('/api/ai/documents', [authJwt.verifyToken, hasPermission('document:read')], controller.documents)

  /**
   * @swagger
   * /api/ai/index/{id}/reindex:
   *   post:
   *     tags: [AI]
   *     summary: Re-index one entry of the AI index
   *     description: >
   *       Takes the index id from GET /api/ai/documents. Uploads are re-read from
   *       their stored file, folder imports from their path on the server.
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Re-indexed, with the new chunk count }
   *       400: { description: Entry cannot be re-indexed from here }
   *       404: { description: Entry or its source file not found }
   *       422: { description: The file could not be read }
   */
  app.post('/api/ai/index/:id/reindex', [authJwt.verifyToken, hasPermission('document:update')], controller.reindexOne)

  /**
   * @swagger
   * /api/ai/documents/{documentId}/status:
   *   get:
   *     tags: [AI]
   *     summary: AI indexing status for one document
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: documentId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Indexing status }
   *       404: { description: Document not found }
   */
  app.get(
    '/api/ai/documents/:documentId/status',
    [authJwt.verifyToken, hasPermission('document:read')],
    controller.documentStatus
  )

  /**
   * @swagger
   * /api/ai/settings:
   *   get:
   *     tags: [AI]
   *     summary: Effective AI settings
   *     description: >
   *       Returns each setting with its current value, the environment default
   *       it falls back to, and whether an override is active. API keys are not
   *       returned — only whether each is configured.
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Settings, providers and credential presence }
   */
  app.get(SETTINGS_PATH, [authJwt.verifyToken, hasPermission('settings:read')], controller.getSettings)

  /**
   * @swagger
   * /api/ai/settings:
   *   put:
   *     tags: [AI]
   *     summary: Change AI settings
   *     description: >
   *       Applies immediately without a restart. Send overridden=false for a
   *       setting to revert it to its environment value.
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               settings:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     key:        { type: string }
   *                     value:      {}
   *                     overridden: { type: boolean }
   *     responses:
   *       200: { description: Updated settings plus a fresh health report }
   *       400: { description: Unknown key or value out of range }
   */
  app.put(SETTINGS_PATH, [authJwt.verifyToken, hasPermission('settings:update')], controller.updateSettings)

  /**
   * @swagger
   * /api/ai/reindex:
   *   post:
   *     tags: [AI]
   *     summary: Index existing documents
   *     description: Queues indexing in the background and returns immediately.
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               documentIds: { type: array, items: { type: integer } }
   *               processAll:  { type: boolean }
   *               force:       { type: boolean, description: Re-index already-indexed documents }
   *     responses:
   *       202: { description: Indexing queued }
   *       400: { description: Neither documentIds nor processAll supplied }
   */
  app.post('/api/ai/reindex', [authJwt.verifyToken, hasPermission('document:update')], controller.reindex)
}
