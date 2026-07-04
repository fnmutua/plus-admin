/* eslint-disable prettier/prettier */
const { authJwt } = require('../middleware')
const controller = require('../controllers/tables.controller')
const { hasDynamicPermission, hasPermission } = require('../middleware/permission')
const dataRequestController = require('../controllers/data_request.controller')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    res.header('Access-Control-Expose-Headers', 'X-Share-Link, x-share-link')
    next()
  })

  /**
   * @swagger
   * /api/v1/tables:
   *   post:
   *     tags: [Data]
   *     summary: Get table/model information
   *     description: Retrieve metadata and field information for a specific model/table.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *     responses:
   *       200:
   *         description: Table information retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 fields:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of field definitions
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - model not found
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/tables', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelBoard)

  /**
   * @swagger
   * /api/v1/routes:
   *   post:
   *     tags: [Data]
   *     summary: Get available routes
   *     description: Retrieve list of available API routes and their configurations.
   *     responses:
   *       200:
   *         description: Routes retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 routes:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of route definitions
   *                 code:
   *                   type: string
   *                   example: "0000"
   */
  app.post('/api/v1/routes',  controller.GetRoutes)

  app.get('/api/v1/page-visits/stats', [authJwt.verifyToken, hasPermission('logs:read')], controller.getPageVisitStats)

    /**
   * @swagger
   * /api/v1/data:
   *   get:
   *     tags: [Data]
   *     summary: Get data records with filtering
   *     description: Retrieve data records from any model with optional filtering, sorting, and pagination.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: true
   *         description: Name of the model/table to query
   *         schema:
   *           type: string
   *         example: "user"
   *       - name: filter
   *         in: query
   *         required: false
   *         description: JSON string of filter conditions
   *         schema:
   *           type: string
   *         example: '{"status": "active"}'
   *       - name: sort
   *         in: query
   *         required: false
   *         description: Sort field and direction
   *         schema:
   *           type: string
   *         example: "name ASC"
   *       - name: limit
   *         in: query
   *         required: false
   *         description: Number of records to return
   *         schema:
   *           type: integer
   *         example: 10
   *       - name: offset
   *         in: query
   *         required: false
   *         description: Number of records to skip
   *         schema:
   *           type: integer
   *         example: 0
   *     responses:
   *       200:
   *         description: Data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records
   *                 total:
   *                   type: integer
   *                   description: Total number of records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or filter
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/data', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelData)

  /**
   * @swagger
   * /api/v1/data/all:
   *   get:
   *     tags: [Data]
   *     summary: Get all data records with geometry
   *     description: Retrieve all records from a model including geographic data.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: true
   *         description: Name of the model/table to query
   *         schema:
   *           type: string
   *         example: "settlement"
   *     responses:
   *       200:
   *         description: All data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records with geometry
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.get('/api/v1/data/all', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllData)
  
  /**
   * @swagger
   * /api/v1/data/all/nogeo:
   *   get:
   *     tags: [Data]
   *     summary: Get all data records without geometry
   *     description: Retrieve all records from a model excluding geographic data for better performance.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: true
   *         description: Name of the model/table to query
   *         schema:
   *           type: string
   *         example: "user"
   *     responses:
   *       200:
   *         description: All data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records without geometry
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.get('/api/v1/data/all/nogeo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllDataNoGeo)
  
  /**
   * @swagger
   * /api/v1/data/code:
   *   get:
   *     tags: [Data]
   *     summary: Get record by code
   *     description: Retrieve a record by its unique code identifier.
   *     parameters:
   *       - name: model
   *         in: query
   *         required: true
   *         description: Name of the model/table to query
   *         schema:
   *           type: string
   *         example: "user"
   *       - name: code
   *         in: query
   *         required: true
   *         description: Unique code of the record
   *         schema:
   *           type: string
   *         example: "USR001"
   *     responses:
   *       200:
   *         description: Record retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   description: Record data
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or code
   *       404:
   *         description: Record not found
   */
  app.get('/api/v1/data/code',   controller.modelGetByCode)

  /**
   * @swagger
   * /api/v1/data/filter:
   *   get:
   *     tags: [Data]
   *     summary: Get filtered data records
   *     description: Retrieve filtered records from a model based on query parameters.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: true
   *         description: Name of the model/table to query
   *         schema:
   *           type: string
   *         example: "user"
   *       - name: filter
   *         in: query
   *         required: false
   *         description: Filter conditions as query parameters
   *         schema:
   *           type: string
   *         example: "status=active&role=admin"
   *     responses:
   *       200:
   *         description: Filtered data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of filtered records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or filter
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.get('/api/v1/data/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelAllDatafilter)

  /**
   * @swagger
   * /api/v1/data/paginated/filter:
   *   post:
   *     tags: [Data]
   *     summary: Get paginated filtered data
   *     description: Retrieve paginated records from a model with keyword filtering and sorting.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to query
   *                 example: "user"
   *               keyword:
   *                 type: string
   *                 description: Search keyword
   *                 example: "john"
   *               page:
   *                 type: integer
   *                 description: Page number (1-based)
   *                 example: 1
   *               limit:
   *                 type: integer
   *                 description: Number of records per page
   *                 example: 10
   *               sortBy:
   *                 type: string
   *                 description: Field to sort by
   *                 example: "name"
   *               sortOrder:
   *                 type: string
   *                 enum: [ASC, DESC]
   *                 description: Sort order
   *                 example: "ASC"
   *     responses:
   *       200:
   *         description: Paginated data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records
   *                 total:
   *                   type: integer
   *                   description: Total number of records
   *                 page:
   *                   type: integer
   *                   description: Current page number
   *                 limit:
   *                   type: integer
   *                   description: Records per page
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or parameters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/paginated/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterBykeyWord)
  
  /**
   * @swagger
   * /api/v1/data/lookup:
   *   post:
   *     tags: [Data]
   *     summary: Lookup data records
   *     description: Search for records using lookup functionality with various criteria.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to query
   *                 example: "user"
   *               searchTerm:
   *                 type: string
   *                 description: Search term for lookup
   *                 example: "john"
   *               fields:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Fields to search in
   *                 example: ["name", "email"]
   *     responses:
   *       200:
   *         description: Lookup results retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of matching records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or search criteria
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/lookup', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelLookup)

  /**
   * @swagger
   * /api/v1/data/paginated:
   *   get:
   *     tags: [Data]
   *     summary: Get paginated data records
   *     description: Retrieve paginated records from a model with basic pagination.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: true
   *         description: Name of the model/table to query
   *         schema:
   *           type: string
   *         example: "user"
   *       - name: page
   *         in: query
   *         required: false
   *         description: Page number (1-based)
   *         schema:
   *           type: integer
   *         example: 1
   *       - name: limit
   *         in: query
   *         required: false
   *         description: Number of records per page
   *         schema:
   *           type: integer
   *         example: 10
   *     responses:
   *       200:
   *         description: Paginated data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records
   *                 total:
   *                   type: integer
   *                   description: Total number of records
   *                 page:
   *                   type: integer
   *                   description: Current page number
   *                 limit:
   *                   type: integer
   *                   description: Records per page
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.get('/api/v1/data/paginated', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedData)

  /**
   * @swagger
   * /api/v1/data/column/paginated:
   *   post:
   *     tags: [Data]
   *     summary: Get paginated data filtered by column
   *     description: Retrieve paginated records from a model with column-based filtering and sorting.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to query
   *                 example: "user"
   *               filters:
   *                 type: object
   *                 description: Column-based filter conditions
   *                 example:
   *                   status: "active"
   *                   role: "admin"
   *               page:
   *                 type: integer
   *                 description: Page number (1-based)
   *                 example: 1
   *               limit:
   *                 type: integer
   *                 description: Number of records per page
   *                 example: 10
   *               sortBy:
   *                 type: string
   *                 description: Field to sort by
   *                 example: "name"
   *               sortOrder:
   *                 type: string
   *                 enum: [ASC, DESC]
   *                 description: Sort order
   *                 example: "ASC"
   *     responses:
   *       200:
   *         description: Paginated data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records
   *                 total:
   *                   type: integer
   *                   description: Total number of records
   *                 page:
   *                   type: integer
   *                   description: Current page number
   *                 limit:
   *                   type: integer
   *                   description: Records per page
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or filters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/column/paginated', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumn)
  
  /**
   * @swagger
   * /api/v1/data/column/paginated/nogeo:
   *   post:
   *     tags: [Data]
   *     summary: Get paginated data filtered by column without geometry
   *     description: Retrieve paginated records from a model with column-based filtering, excluding geographic data.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to query
   *                 example: "user"
   *               filters:
   *                 type: object
   *                 description: Column-based filter conditions
   *                 example:
   *                   status: "active"
   *                   role: "admin"
   *               page:
   *                 type: integer
   *                 description: Page number (1-based)
   *                 example: 1
   *               limit:
   *                 type: integer
   *                 description: Number of records per page
   *                 example: 10
   *               sortBy:
   *                 type: string
   *                 description: Field to sort by
   *                 example: "name"
   *               sortOrder:
   *                 type: string
   *                 enum: [ASC, DESC]
   *                 description: Sort order
   *                 example: "ASC"
   *     responses:
   *       200:
   *         description: Paginated data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records without geometry
   *                 total:
   *                   type: integer
   *                   description: Total number of records
   *                 page:
   *                   type: integer
   *                   description: Current page number
   *                 limit:
   *                   type: integer
   *                   description: Records per page
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or filters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/column/paginated/nogeo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumnNoGeo)
  
  /**
   * @swagger
   * /api/v1/data/column/duplicate:
   *   post:
   *     tags: [Data]
   *     summary: Find potential duplicate records
   *     description: Search for potential duplicate records based on specified criteria.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - criteria
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to search
   *                 example: "user"
   *               criteria:
   *                 type: object
   *                 description: Duplicate detection criteria
   *                 example:
   *                   fields: ["email", "phone"]
   *                   threshold: 0.8
   *     responses:
   *       200:
   *         description: Potential duplicates found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 duplicates:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of potential duplicate groups
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or criteria
   */
  app.post('/api/v1/data/column/duplicate',  controller.findPotentialDuplicates)
  
  /**
   * @swagger
   * /api/v1/data/merge:
   *   post:
   *     tags: [Data]
   *     summary: Merge duplicate records
   *     description: Merge duplicate records by keeping the primary record and updating references.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - primaryId
   *               - duplicateIds
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *               primaryId:
   *                 type: integer
   *                 description: ID of the primary record to keep
   *                 example: 1
   *               duplicateIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of duplicate record IDs to merge
   *                 example: [2, 3, 4]
   *     responses:
   *       200:
   *         description: Records merged successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Records merged successfully"
   *                 mergedCount:
   *                   type: integer
   *                   description: Number of records merged
   *                   example: 3
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or IDs
   *       404:
   *         description: One or more records not found
   */
  app.post('/api/v1/data/merge',  controller.mergeDuplicates)

  /**
   * @swagger
   * /api/v1/data/download/all:
   *   post:
   *     tags: [Data]
   *     summary: Download all data records
   *     description: Export all records from a model for download in various formats.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to export
   *                 example: "user"
   *               format:
   *                 type: string
   *                 enum: [csv, excel, json]
   *                 description: Export format
   *                 example: "csv"
   *               filters:
   *                 type: object
   *                 description: Optional filter conditions
   *                 example:
   *                   status: "active"
   *     responses:
   *       200:
   *         description: Data exported successfully
   *         content:
   *           application/octet-stream:
   *             schema:
   *               type: string
   *               format: binary
   *             description: Exported file
   *       400:
   *         description: Bad request - invalid model or format
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/download/all', [authJwt.verifyToken, hasDynamicPermission('export')], controller.getAllListforDownload)

  /**
   * @swagger
   * /api/v1/data/column/mm:
   *   post:
   *     tags: [Data]
   *     summary: Get paginated data with many-to-many relationships
   *     description: Retrieve paginated records with many-to-many relationship filtering.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to query
   *                 example: "user"
   *               filters:
   *                 type: object
   *                 description: Many-to-many filter conditions
   *                 example:
   *                   roles: [1, 2, 3]
   *                   permissions: ["read", "write"]
   *               page:
   *                 type: integer
   *                 description: Page number (1-based)
   *                 example: 1
   *               limit:
   *                 type: integer
   *                 description: Number of records per page
   *                 example: 10
   *     responses:
   *       200:
   *         description: Paginated data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records with M2M relationships
   *                 total:
   *                   type: integer
   *                   description: Total number of records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or filters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/column/mm', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumnM2M)
  
  /**
   * @swagger
   * /api/v1/hh/column/paginated:
   *   post:
   *     tags: [Data]
   *     summary: Get paginated household data filtered by column
   *     description: Retrieve paginated household records with column-based filtering.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the household model/table to query
   *                 example: "household"
   *               filters:
   *                 type: object
   *                 description: Column-based filter conditions
   *                 example:
   *                   settlement_id: 1
   *                   status: "active"
   *               page:
   *                 type: integer
   *                 description: Page number (1-based)
   *                 example: 1
   *               limit:
   *                 type: integer
   *                 description: Number of records per page
   *                 example: 10
   *     responses:
   *       200:
   *         description: Paginated household data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of household records
   *                 total:
   *                   type: integer
   *                   description: Total number of records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or filters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/hh/column/paginated', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelPaginatedDatafilterByColumn);

  /**
   * @swagger
   * /api/v1/data/all/geo:
   *   post:
   *     tags: [Data]
   *     summary: Get all geographic data
   *     description: Retrieve all records with geographic data from a model.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to query
   *                 example: "settlement"
   *               filters:
   *                 type: object
   *                 description: Optional filter conditions
   *                 example:
   *                   status: "active"
   *     responses:
   *       200:
   *         description: Geographic data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records with geometry
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/all/geo', [authJwt.verifyToken ], controller.modelAllGeo)
  
  /**
   * @swagger
   * /api/v1/data/stream/geo:
   *   get:
   *     tags: [Data]
   *     summary: Stream geographic data
   *     description: Stream geographic data from a model for real-time applications.
   *     parameters:
   *       - name: model
   *         in: query
   *         required: true
   *         description: Name of the model/table to stream
   *         schema:
   *           type: string
   *         example: "settlement"
   *     responses:
   *       200:
   *         description: Geographic data stream
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Stream of geographic records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model
   */
  app.get('/api/v1/data/stream/geo',  controller.streamAllGeo)

  /**
   * @swagger
   * /api/v1/data/optimized/settlements:
   *   get:
   *     tags: [Data]
   *     summary: Get optimized settlements with pre-computed centroids
   *     description: Retrieve settlements with server-side filtering and centroids computed on backend for better performance.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: false
   *         description: Model name (default: settlement)
   *         schema:
   *           type: string
   *       - name: filters
   *         in: query
   *         required: false
   *         description: JSON array of filter field names
   *         schema:
   *           type: string
   *       - name: filterValues
   *         in: query
   *         required: false
   *         description: JSON array of filter values (corresponding to filters)
   *         schema:
   *           type: string
   *       - name: includeCentroids
   *         in: query
   *         required: false
   *         description: Compute centroids for non-point geometries (default: true)
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Optimized settlements retrieved successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/data/optimized/settlements', [authJwt.verifyToken], controller.getOptimizedSettlements)

  /**
   * @swagger
   * /api/v1/data/optimized/batch-geo:
   *   post:
   *     tags: [Data]
   *     summary: Get batch geometries for multiple IDs
   *     description: Retrieve geometries for multiple records at once (counties, subcounties, etc.) for better performance.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Model name (county, subcounty, etc.)
   *               ids:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of IDs to fetch geometries for (optional, fetches all if not provided)
   *     responses:
   *       200:
   *         description: Batch geometries retrieved successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  app.post('/api/v1/data/optimized/batch-geo', [authJwt.verifyToken], controller.getBatchGeometries)

  /**
   * @swagger
   * /api/v1/data/optimized/counties:
   *   get:
   *     tags: [Data]
   *     summary: Get counties list (optimized, no geometry)
   *     description: Retrieve counties list without geometry for better performance in dropdowns.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: false
   *         description: Model name (default: county)
   *         schema:
   *           type: string
   *       - name: filters
   *         in: query
   *         required: false
   *         description: JSON array of filter field names
   *         schema:
   *           type: string
   *       - name: filterValues
   *         in: query
   *         required: false
   *         description: JSON array of filter values
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Counties list retrieved successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/data/optimized/counties', [authJwt.verifyToken], controller.getCountiesList)

  /**
   * @swagger
   * /api/v1/data/optimized/subcounties:
   *   get:
   *     tags: [Data]
   *     summary: Get subcounties list for a county (optimized, no geometry)
   *     description: Retrieve subcounties list for a specific county without geometry for better performance.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: false
   *         description: Model name (default: subcounty)
   *         schema:
   *           type: string
   *       - name: county_id
   *         in: query
   *         required: true
   *         description: County ID to get subcounties for
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Subcounties list retrieved successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/data/optimized/subcounties', [authJwt.verifyToken], controller.getSubcountiesList)

  app.get('/api/v1/data/optimized/wards', [authJwt.verifyToken], controller.getWardsList)

  /**
   * @swagger
   * /api/v1/data/optimized/project-locations:
   *   get:
   *     tags: [Data]
   *     summary: Get optimized project locations with pre-computed centroids
   *     description: Retrieve project locations with server-side filtering and centroids computed on backend for better performance.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: false
   *         description: Model name (default: project_location)
   *         schema:
   *           type: string
   *       - name: filters
   *         in: query
   *         required: false
   *         description: JSON array of filter field names
   *         schema:
   *           type: string
   *       - name: filterValues
   *         in: query
   *         required: false
   *         description: JSON array of filter values (corresponding to filters)
   *         schema:
   *           type: string
   *       - name: includeCentroids
   *         in: query
   *         required: false
   *         description: Compute centroids for non-point geometries (default: true)
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Optimized project locations retrieved successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/data/optimized/project-locations', [authJwt.verifyToken], controller.getOptimizedProjectLocations)

  /**
   * @swagger
   * /api/v1/data/optimized/implementers:
   *   get:
   *     tags: [Data]
   *     summary: Get implementers list (optimized, no geometry)
   *     description: Retrieve programme_implementation list without geometry for better performance in dropdowns.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: false
   *         description: Model name (default: programme_implementation)
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Implementers list retrieved successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/data/optimized/implementers', [authJwt.verifyToken], controller.getImplementersList)

  /**
   * @swagger
   * /api/v1/data/optimized/programmes:
   *   get:
   *     tags: [Data]
   *     summary: Get programmes list (programmex, optimized, no geometry)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Programmes list retrieved successfully
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/data/optimized/programmes', [authJwt.verifyToken], controller.getProgrammesList)

  /**
   * @swagger
   * /api/v1/data/optimized/components:
   *   get:
   *     tags: [Data]
   *     summary: Get components list for a programme (optimized, no geometry)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: programme_id
   *         in: query
   *         required: false
   *         description: Filter components by programme (implementer) ID
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Components list retrieved successfully
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/data/optimized/components', [authJwt.verifyToken], controller.getComponentsList)
  
  /**
   * @swagger
   * /api/v1/data/geo/minimal:
   *   get:
   *     tags: [Data]
   *     summary: Get minimal geographic data
   *     description: Retrieve minimal geographic data for performance optimization.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: model
   *         in: query
   *         required: true
   *         description: Name of the model/table to query
   *         schema:
   *           type: string
   *         example: "settlement"
   *     responses:
   *       200:
   *         description: Minimal geographic data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of minimal geographic records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.get('/api/v1/data/geo/minimal', [authJwt.verifyToken, hasDynamicPermission('read')], controller.streamMinimalGeo)

  /**
   * @swagger
   * /api/v1/data/one/geo:
   *   post:
   *     tags: [Data]
   *     summary: Get single record with geographic data
   *     description: Retrieve a single record with its geographic data by ID.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - id
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "settlement"
   *               id:
   *                 type: integer
   *                 description: ID of the record
   *                 example: 1
   *     responses:
   *       200:
   *         description: Record with geographic data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   description: Record with geometry
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or ID
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Record not found
   */
  app.post('/api/v1/data/one/geo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelOneGeo)
  app.post('/api/v1/data/settlements/with-boundary-geometry', [authJwt.verifyToken], controller.getSettlementsWithBoundaryGeometry)
  app.post('/api/v1/data/settlements/overture-buildings', [authJwt.verifyToken], controller.fetchOvertureBuildings)
  app.post('/api/v1/data/settlements/:settlementId/overture-structures', [authJwt.verifyToken], controller.createOvertureStructuresForSettlement)
  app.post('/api/v1/data/settlements/neighbors', [authJwt.verifyToken], controller.getNeighboringSettlements)
  app.post('/api/v1/data/settlements/in-bbox', [authJwt.verifyToken], controller.getSettlementsInBbox)
  app.post('/api/v1/data/settlements/imagery', [authJwt.verifyToken], controller.getSettlementImageryLayers)
  app.post('/api/v1/data/settlements/density-typology/compute', [authJwt.verifyToken], controller.computeSettlementDensityTypology)
  app.post('/api/v1/data/settlements/density-typology/apply', [authJwt.verifyToken], controller.applyDensityTypology)
  app.post('/api/v1/data/settlements/survey-household-size/apply', [authJwt.verifyToken], controller.applySurveyHouseholdSize)
  app.post('/api/v1/data/settlements/population-estimate/apply', [authJwt.verifyToken], controller.applyPopulationEstimate)
  app.post('/api/v1/data/settlements/population-estimate/job/start', [authJwt.verifyToken], controller.createPopulationEstimateJob)
  app.post('/api/v1/data/settlements/population-estimate/job/status', [authJwt.verifyToken], controller.getPopulationEstimateJobStatus)
  app.post('/api/v1/data/settlements/population-growth-rates/list', [authJwt.verifyToken], controller.getCountyPopulationGrowthRates)
  app.post('/api/v1/data/settlements/population-growth-rates/save', [authJwt.verifyToken], controller.bulkUpsertCountyPopulationGrowthRates)
  app.post('/api/v1/data/settlements/population-growth-rates/import-excel', [authJwt.verifyToken], controller.importCountyPopulationGrowthRatesExcel)
  app.post('/api/v1/data/settlements/population-baseline/seed', [authJwt.verifyToken], controller.seedSettlementPopulationBaseline)
  app.post('/api/v1/data/settlements/population-baseline/import-excel', [authJwt.verifyToken], controller.importSettlementPopulationBaselineExcel)
  app.post('/api/v1/data/settlements/population-projection/apply', [authJwt.verifyToken], controller.applySettlementPopulationProjection)
  app.post('/api/v1/data/admin-units-from-coords', [authJwt.verifyToken], controller.getAdminUnitsFromCoordinates)

  /**
   * @swagger
   * /api/v1/data/subset/geo:
   *   post:
   *     tags: [Data]
   *     summary: Get subset of geographic data
   *     description: Retrieve a subset of records with geographic data based on criteria.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to query
   *                 example: "settlement"
   *               filters:
   *                 type: object
   *                 description: Filter conditions for subset
   *                 example:
   *                   county_id: 1
   *                   status: "active"
   *     responses:
   *       200:
   *         description: Geographic subset retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of filtered geographic records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or filters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/subset/geo', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSelectGeo)
  
  /**
   * @swagger
   * /api/v1/data/subset/geo/parcel:
   *   post:
   *     tags: [Data]
   *     summary: Get parcel geographic data subset
   *     description: Retrieve a subset of parcel records with geographic data.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the parcel model/table
   *                 example: "parcel"
   *               filters:
   *                 type: object
   *                 description: Filter conditions for parcel subset
   *                 example:
   *                   settlement_id: 1
   *                   status: "active"
   *     responses:
   *       200:
   *         description: Parcel geographic subset retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of filtered parcel records with geometry
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or filters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/subset/geo/parcel', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSelectParcelGeo)
  
  /**
   * @swagger
   * /api/v1/data/geo/multiple:
   *   post:
   *     tags: [Data]
   *     summary: Get multiple settlement map data
   *     description: Retrieve geographic data for multiple settlements for mapping purposes.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - settlementIds
   *             properties:
   *               settlementIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of settlement IDs
   *                 example: [1, 2, 3]
   *     responses:
   *       200:
   *         description: Multiple settlement map data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of settlement map data
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid settlement IDs
   *       401:
   *         description: Unauthorized - invalid token
   */
  app.post('/api/v1/data/geo/multiple', [authJwt.verifyToken], controller.getSettlementMapData)

  /**
   * @swagger
   * /api/v1/data/download/geo/zip:
   *   post:
   *     tags: [Data]
   *     summary: Download geospatial data for multiple settlements as zip
   *     description: Downloads all geospatial data (settlements, roads, facilities, etc.) for specified settlements as a zip file containing GeoJSON files. Excludes documents.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - settlementIds
   *             properties:
   *               settlementIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of settlement IDs to download
   *               filters:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Optional filter fields
   *               filterValues:
   *                 type: array
   *                 items:
   *                   type: array
   *                 description: Optional filter values
   *     responses:
   *       200:
   *         description: Zip file with geospatial data
   *         content:
   *           application/zip:
   *             schema:
   *               type: string
   *               format: binary
   *       400:
   *         description: Bad request - missing or invalid settlement IDs
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Server error
   */
  app.post('/api/v1/data/download/geo/zip', [authJwt.verifyToken, hasPermission('settlement:downloadGeo')], controller.downloadSettlementsGeoDataZip)

  /**
   * @swagger
   * /api/v1/data/one:
   *   post:
   *     tags: [Data]
   *     summary: Get single record by ID
   *     description: Retrieve a single record by its ID from any model.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - id
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *               id:
   *                 type: integer
   *                 description: ID of the record
   *                 example: 1
   *     responses:
   *       200:
   *         description: Record retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   description: Record data
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or ID
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Record not found
   */
  app.post('/api/v1/data/one', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelOneRecord)
  
  /**
   * @swagger
   * /api/v1/data/one/code:
   *   post:
   *     tags: [Data]
   *     summary: Get single record by code
   *     description: Retrieve a single record by its unique code from any model.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - code
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *               code:
   *                 type: string
   *                 description: Unique code of the record
   *                 example: "USR001"
   *     responses:
   *       200:
   *         description: Record retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   description: Record data
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or code
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Record not found
   */
  app.post('/api/v1/data/one/code', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelOneRecordByCode)

    /**
   * @swagger
   * /api/v1/data/edit:
   *   post:
   *     tags: [Data]
   *     summary: Update a data record
   *     description: Update an existing record by ID with validation and permission checking.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - id
   *               - data
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to update
   *                 example: "user"
   *               id:
   *                 type: integer
   *                 description: ID of the record to update
   *                 example: 1
   *               data:
   *                 type: object
   *                 description: Updated record data
   *                 example:
   *                   name: "John Doe Updated"
   *                   email: "john.updated@example.com"
   *               count:
   *                 type: integer
   *                 description: Number of records being processed
   *                 example: 1
   *     responses:
   *       200:
   *         description: Record updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Record Updated Successfully"
   *                 total:
   *                   type: integer
   *                   description: Number of records processed
   *                   example: 1
   *                 data:
   *                   type: object
   *                   description: Updated record data
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - validation error
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Record not found
   *       500:
   *         description: Internal server error
   */
  app.post('/api/v1/data/edit', [authJwt.verifyToken, hasDynamicPermission('update')], controller.modelEditOneRecord)

  /**
   * @swagger
   * /api/v1/data/import:
   *   post:
   *     tags: [Data]
   *     summary: Import data records
   *     description: Import data records from various file formats with validation.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - file
   *               - model
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Data file to import (CSV, Excel, JSON)
   *               model:
   *                 type: string
   *                 description: Name of the model/table to import into
   *                 example: "user"
   *               options:
   *                 type: object
   *                 description: Import options
   *                 example:
   *                   skipDuplicates: true
   *                   validateOnly: false
   *     responses:
   *       200:
   *         description: Data imported successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Data imported successfully"
   *                 importedCount:
   *                   type: integer
   *                   description: Number of records imported
   *                   example: 100
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of import errors
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid file or model
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/import', [authJwt.verifyToken, hasDynamicPermission('import')], controller.modelImportData)
  
  /**
   * @swagger
   * /api/v1/data/import/upsert:
   *   post:
   *     tags: [Data]
   *     summary: Import data with upsert functionality
   *     description: Import data records with upsert (insert or update) functionality based on unique keys.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - file
   *               - model
   *               - uniqueKeys
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Data file to import
   *               model:
   *                 type: string
   *                 description: Name of the model/table to import into
   *                 example: "user"
   *               uniqueKeys:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of unique key fields for upsert
   *                 example: ["email", "phone"]
   *               dryRun:
   *                 type: boolean
   *                 description: When true, validate and simulate upsert without persisting changes
   *                 example: true
   *     responses:
   *       200:
   *         description: Data imported with upsert successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Data imported with upsert successfully"
   *                 insertedCount:
   *                   type: integer
   *                   description: Number of new records inserted
   *                   example: 50
   *                 updatedCount:
   *                   type: integer
   *                   description: Number of existing records updated
   *                   example: 30
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid file, model, or unique keys
   *       401:
   *         description: Unauthorized - invalid token
   */
  app.post('/api/v1/data/import/upsert', [authJwt.verifyToken], controller.modelImportDataUpsert)
  
    /**
   * @swagger
   * /api/v1/data/create:
   *   post:
   *     tags: [Data]
   *     summary: Create a new data record
   *     description: Create a new record in any model with validation and duplicate checking. Supports bulk creation with upsert functionality.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - data
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to create record in
   *                 example: "user"
   *               data:
   *                 type: object
   *                 description: Record data to create
   *                 example:
   *                   name: "John Doe"
   *                   email: "john@example.com"
   *                   phone: "254712345678"
   *               count:
   *                 type: integer
   *                 description: Number of records being processed
   *                 example: 1
   *     responses:
   *       200:
   *         description: Record created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Record Created Successfully"
   *                 total:
   *                   type: integer
   *                   description: Number of records processed
   *                   example: 1
   *                 data:
   *                   type: object
   *                   description: Created record data
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - validation error or duplicate record
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Duplicate records for user not allowed"
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "An unexpected error occurred while creating the record."
   */
  app.post('/api/v1/data/create', [authJwt.verifyToken, hasDynamicPermission('create')], controller.modelCreateOneRecord)
  app.post('/api/v1/data/create/check', [authJwt.verifyToken, hasDynamicPermission('create')], controller.checkPotentialDuplicates)

    /**
   * @swagger
   * /api/v1/data/delete:
   *   post:
   *     tags: [Data]
   *     summary: Delete a data record
   *     description: Delete a record by ID with dependency checking. Cannot delete records that have dependent records.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - id
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to delete from
   *                 example: "user"
   *               id:
   *                 type: integer
   *                 description: ID of the record to delete
   *                 example: 1
   *     responses:
   *       200:
   *         description: Record deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Delete successful"
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - model not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Model 'user' does not exist"
   *                 code:
   *                   type: string
   *                   example: "MODEL_NOT_FOUND"
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Record not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Record with id '1' does not exist in 'user' model"
   *                 code:
   *                   type: string
   *                   example: "RECORD_NOT_FOUND"
   *       500:
   *         description: Internal server error or dependency found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Cannot delete 'user' record, it has 5 dependent records"
   *                 code:
   *                   type: string
   *                   example: "DEPENDENCY_FOUND"
   */
  app.post('/api/v1/data/delete', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.modelDeleteOneRecord)
  app.post('/api/v1/data/delete/many', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.modelDeleteRecords)
  app.post('/api/v1/data/delete/keys', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.modelDeleteByFields)

  /**
   * @swagger
   * /api/v1/data/count:
   *   post:
   *     tags: [Data]
   *     summary: Count all records
   *     description: Get the total count of records in a model.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to count
   *                 example: "user"
   *     responses:
   *       200:
   *         description: Count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *                   description: Total number of records
   *                   example: 1000
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/count', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelCountAll)

  /**
   * @swagger
   * /api/v1/data/count/distinct:
   *   post:
   *     tags: [Data]
   *     summary: Count distinct values
   *     description: Count distinct values in a specific field of a model.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - field
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *               field:
   *                 type: string
   *                 description: Field to count distinct values for
   *                 example: "role"
   *     responses:
   *       200:
   *         description: Distinct count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *                   description: Number of distinct values
   *                   example: 5
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or field
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/count/distinct', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelCountDistinct)

  /**
   * @swagger
   * /api/v1/data/count/filter:
   *   post:
   *     tags: [Data]
   *     summary: Count filtered records
   *     description: Count records in a model based on filter conditions.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to count
   *                 example: "user"
   *               filters:
   *                 type: object
   *                 description: Filter conditions
   *                 example:
   *                   status: "active"
   *                   role: "admin"
   *     responses:
   *       200:
   *         description: Filtered count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *                   description: Number of filtered records
   *                   example: 150
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or filters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/count/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelCountFilter)

  /**
   * @swagger
   * /api/v1/data/sum:
   *   post:
   *     tags: [Data]
   *     summary: Sum numeric field values
   *     description: Calculate the sum of a numeric field across all records in a model.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - field
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "transaction"
   *               field:
   *                 type: string
   *                 description: Numeric field to sum
   *                 example: "amount"
   *     responses:
   *       200:
   *         description: Sum calculated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 sum:
   *                   type: number
   *                   description: Sum of the field values
   *                   example: 50000.50
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or field
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/sum', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSumAll)

  /**
   * @swagger
   * /api/v1/data/sum/filter:
   *   post:
   *     tags: [Data]
   *     summary: Sum filtered numeric field values
   *     description: Calculate the sum of a numeric field for filtered records in a model.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - field
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "transaction"
   *               field:
   *                 type: string
   *                 description: Numeric field to sum
   *                 example: "amount"
   *               filters:
   *                 type: object
   *                 description: Filter conditions
   *                 example:
   *                   status: "completed"
   *                   date: "2024-01-01"
   *     responses:
   *       200:
   *         description: Filtered sum calculated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 sum:
   *                   type: number
   *                   description: Sum of the filtered field values
   *                   example: 25000.25
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model, field, or filters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/sum/filter', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelSumFiltered)

    /**
   * @swagger
   * /api/v1/upload:
   *   post:
   *     tags: [Data]
   *     summary: Upload a single document
   *     description: Upload a single document file with metadata and validation.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - file
   *               - model
   *               - record_id
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Document file to upload
   *               model:
   *                 type: string
   *                 description: Model name for the document
   *                 example: "user"
   *               record_id:
   *                 type: integer
   *                 description: ID of the record to attach document to
   *                 example: 1
   *               description:
   *                 type: string
   *                 description: Document description
   *                 example: "User profile photo"
   *               category:
   *                 type: string
   *                 description: Document category
   *                 example: "profile"
   *     responses:
   *       200:
   *         description: Document uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Document uploaded successfully"
   *                 filePath:
   *                   type: string
   *                   description: Path where file was saved
   *                   example: "/uploads/user/profile_photo.jpg"
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - missing required fields or invalid file
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       500:
   *         description: Internal server error during upload
   */
  app.post('/api/v1/upload', [authJwt.verifyToken, hasPermission('document:create')], controller.modelUpload)
    /**
   * @swagger
   * /api/v1/upload/batch:
   *   post:
   *     tags: [Data]
   *     summary: Upload multiple documents in batch
   *     description: Upload multiple document files in a single request with metadata and validation.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - files
   *               - model
   *               - record_id
   *             properties:
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 description: Array of document files to upload
   *               model:
   *                 type: string
   *                 description: Model name for the documents
   *                 example: "user"
   *               record_id:
   *                 type: integer
   *                 description: ID of the record to attach documents to
   *                 example: 1
   *               descriptions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of document descriptions
   *                 example: ["Profile photo", "ID document", "Certificate"]
   *               categories:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of document categories
   *                 example: ["profile", "identification", "certificate"]
   *     responses:
   *       200:
   *         description: Documents uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Documents uploaded successfully"
   *                 uploadedFiles:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       originalName:
   *                         type: string
   *                         example: "profile_photo.jpg"
   *                       filePath:
   *                         type: string
   *                         example: "/uploads/user/profile_photo.jpg"
   *                       size:
   *                         type: integer
   *                         example: 1024000
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - missing required fields or invalid files
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       500:
   *         description: Internal server error during upload
   */
  app.post('/api/v1/upload/batch', [authJwt.verifyToken, hasPermission('document:create')], controller.batchDocumentsUpload)
  app.post('/api/v1/upload/check', [authJwt.verifyToken, hasPermission('document:read')], controller.checkDocuments)
  app.post('/api/v1/upload/cover', [authJwt.verifyToken, hasPermission('document:create')], controller.batchDocumentsUploadCover)
  app.post('/api/v1/upload/batch/pcode', [authJwt.verifyToken, hasPermission('document:create')], controller.batchDocumentsUploadByParentCode)
  app.post('/api/v1/upload/documentation', [authJwt.verifyToken, hasPermission('document:create')], controller.ReportDocumentationUpload)
  app.post('/api/v1/upload/delete', [authJwt.verifyToken, hasPermission('document:delete')], controller.RemoveDocument)

  app.post('/api/v1/documents/raw', [authJwt.verifyToken, hasPermission('document:read')], controller.getRawDocuments)
  app.post('/api/v1/documents/raw/delete', [authJwt.verifyToken, hasPermission('document:delete')], controller.DeleteRawDocuments)
  app.post('/api/v1/download', [authJwt.verifyToken, hasPermission('document:read')], controller.downloadFile)
  // Get photo/image for display
  app.post('/api/v1/photo', [authJwt.verifyToken, hasPermission('document:read')], controller.getPhoto)
  // Create a document share link and send email (requires update, not read-only / public)
  app.post('/api/v1/documents/share', [authJwt.verifyToken, hasPermission('document:update')], controller.createDocumentShare)
  
  // Get all document shares (for current user or all if admin)
  app.get('/api/v1/documents/shares', [authJwt.verifyToken, hasPermission('document:update')], controller.getDocumentShares)
  
  // Revoke a document share
  app.post('/api/v1/documents/share/revoke', [authJwt.verifyToken, hasPermission('document:update')], controller.revokeDocumentShare)

  // Unrevoke a document share
  app.post('/api/v1/documents/share/unrevoke', [authJwt.verifyToken, hasPermission('document:update')], controller.unrevokeDocumentShare)

  // Public share access (no auth)
  app.get('/api/public/share/:token', controller.getPublicShare)
  app.get('/api/public/share/:token/download/:documentId', controller.downloadSharedFile)
  app.post('/api/public/share/:token/download-zip', controller.downloadSharedZip)

  // Public files (no auth) – like logo
  app.get('/api/public/tool-a', controller.getPublicToolA)

  // Page visit tracking (no auth) – landing analytics
  app.post('/api/public/track-visit', controller.trackPageVisit)

  // Data request form (no auth) – public landing page
  app.post('/api/public/data-request', dataRequestController.createPublicDataRequest)

  // Data request management (auth required)
  app.get('/api/v1/data-requests', [authJwt.verifyToken], dataRequestController.getDataRequests)
  app.get('/api/v1/data-requests/:id', [authJwt.verifyToken], dataRequestController.getDataRequestById)
  app.put('/api/v1/data-requests/:id/status', [authJwt.verifyToken], dataRequestController.updateDataRequestStatus)

  // Data request documents (auth required)
  app.get('/api/v1/data-requests/:id/documents', [authJwt.verifyToken], dataRequestController.getDataRequestDocuments)
  app.post('/api/v1/data-requests/:id/documents', [authJwt.verifyToken], dataRequestController.uploadDataRequestDocument)
  app.post('/api/v1/data-requests/:id/documents/generate-form', [authJwt.verifyToken], dataRequestController.generateDataRequestFormDocument)
  app.delete('/api/v1/data-requests/:id/documents/:docId', [authJwt.verifyToken], dataRequestController.deleteDataRequestDocument)
  app.get('/api/v1/data-requests/:id/documents/:docId/download', [authJwt.verifyToken], dataRequestController.downloadDataRequestDocument)

  // Share data request documents with requester (auth required)
  app.post('/api/v1/data-requests/:id/share', [authJwt.verifyToken], dataRequestController.shareDataRequest)

  // Public: requester downloads shared data (no auth)
  app.get('/api/public/data-request/share/:token', dataRequestController.getPublicDataRequestShare)
  app.get('/api/public/data-request/share/:token/download/:docId', dataRequestController.downloadPublicDataRequestDocument)

  // Public: requester clarification thread (no auth)
  app.get('/api/public/data-request/clarify/:token', dataRequestController.getPublicDataRequestClarify)
  app.post('/api/public/data-request/clarify/:token', dataRequestController.postPublicDataRequestClarifyReply)

  // Data request clarifications (auth required)
  app.get('/api/v1/data-requests/:id/messages', [authJwt.verifyToken], dataRequestController.getDataRequestMessages)
  app.post('/api/v1/data-requests/:id/messages', [authJwt.verifyToken], dataRequestController.postDataRequestMessage)
  app.put('/api/v1/data-requests/:id/clarification-status', [authJwt.verifyToken], dataRequestController.updateClarificationStatus)

  // Public settlement register (no auth) – landing page
  app.get('/api/public/register/counties', controller.getPublicRegisterCounties)
  app.get('/api/public/register/subcounties', controller.getPublicRegisterSubcounties)
  app.get('/api/public/register/wards', controller.getPublicRegisterWards)
  app.get('/api/public/register/settlements', controller.getPublicRegisterSettlements)
  app.get('/api/public/register/settlements/map', controller.getPublicRegisterSettlementsMap)
  app.get('/api/public/register/settlements/:id/map', controller.getPublicRegisterSettlementMap)
  app.get('/api/public/register/settlements/:id', controller.getPublicRegisterSettlement)

  /**
   * @swagger
   * /api/v1/edit/revert:
   *   post:
   *     tags: [Data]
   *     summary: Revert edits
   *     description: Revert recent edits to a record or set of records.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - recordIds
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *               recordIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of record IDs to revert
   *                 example: [1, 2, 3]
   *               revertTo:
   *                 type: string
   *                 description: Timestamp to revert to
   *                 example: "2024-01-01T00:00:00Z"
   *     responses:
   *       200:
   *         description: Edits reverted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Edits reverted successfully"
   *                 revertedCount:
   *                   type: integer
   *                   description: Number of records reverted
   *                   example: 3
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or record IDs
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/edit/revert', [authJwt.verifyToken, hasDynamicPermission('update')], controller.revertEdits)
  
  /**
   * @swagger
   * /api/v1/edit/revertMerge:
   *   post:
   *     tags: [Data]
   *     summary: Revert a merge operation
   *     description: Restore a settlement that was merged into another settlement. This recreates the merged settlement and restores its data.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - history_id
   *             properties:
   *               history_id:
   *                 type: integer
   *                 description: ID of the merge history record to revert
   *                 example: 123
   *     responses:
   *       200:
   *         description: Merge reverted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Merge reverted successfully. Settlement restored."
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 restored_settlement:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     name:
   *                       type: string
   *       400:
   *         description: Bad request - invalid history record or already reverted
   *       404:
   *         description: History record or primary settlement not found
   *       500:
   *         description: Internal server error
   */
  app.post('/api/v1/edit/revertMerge', [authJwt.verifyToken, hasDynamicPermission('update')], controller.revertMerge)
  
  /**
   * @swagger
   * /api/v1/delete/cascade:
   *   post:
   *     tags: [Data]
   *     summary: Delete records with cascade
   *     description: Delete records and their dependent records in a cascading manner.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - recordIds
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *               recordIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of record IDs to delete
   *                 example: [1, 2, 3]
   *     responses:
   *       200:
   *         description: Records deleted with cascade successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Records deleted with cascade successfully"
   *                 deletedCount:
   *                   type: integer
   *                   description: Number of records deleted
   *                   example: 5
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or record IDs
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/delete/cascade', [authJwt.verifyToken, hasDynamicPermission('delete')], controller.deleteCascade)

  /**
   * @swagger
   * /api/v1/models/list:
   *   get:
   *     tags: [Data]
   *     summary: List available models
   *     description: Get a list of all available models/tables in the system.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Models list retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 models:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of available models
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       401:
   *         description: Unauthorized - invalid token
   */
  app.get('/api/v1/models/list', [authJwt.verifyToken], controller.listModels)

  /**
   * @swagger
   * /api/v1/data/intersect:
   *   post:
   *     tags: [Data]
   *     summary: Intersect geometry with model
   *     description: Find records that intersect with a given geometry.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - geometry
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table to search
   *                 example: "settlement"
   *               geometry:
   *                 type: object
   *                 description: Geometry object for intersection
   *                 example:
   *                   type: "Polygon"
   *                   coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
   *     responses:
   *       200:
   *         description: Intersecting records found successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of intersecting records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or geometry
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/intersect', [authJwt.verifyToken, hasDynamicPermission('read')], controller.intersectGeometryWithModel)
  
  /**
   * @swagger
   * /api/v1/data/many/code:
   *   post:
   *     tags: [Data]
   *     summary: Get multiple records by codes
   *     description: Retrieve multiple records by their unique codes.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - codes
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *               codes:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of unique codes
   *                 example: ["USR001", "USR002", "USR003"]
   *     responses:
   *       200:
   *         description: Records retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of records
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or codes
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/data/many/code', [authJwt.verifyToken, hasDynamicPermission('read')], controller.modelManyRecordsByCodes)

  /**
   * @swagger
   * /api/v1/model/fields:
   *   post:
   *     tags: [Data]
   *     summary: Get model fields information
   *     description: Retrieve detailed field information for a specific model.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *     responses:
   *       200:
   *         description: Model fields information retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 fields:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of field definitions
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model
   *       401:
   *         description: Unauthorized - invalid token
   */
  app.post('/api/v1/model/fields', [authJwt.verifyToken], controller.modelBoard)
  
  /**
   * @swagger
   * /api/v1/docs/search:
   *   post:
   *     tags: [Data]
   *     summary: Search documentation repository
   *     description: Search through the documentation repository for relevant content.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - query
   *             properties:
   *               query:
   *                 type: string
   *                 description: Search query
   *                 example: "user authentication"
   *               filters:
   *                 type: object
   *                 description: Search filters
   *                 example:
   *                   category: "api"
   *                   tags: ["auth", "user"]
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 results:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of search results
   *                 total:
   *                   type: integer
   *                   description: Total number of results
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid query
   */
  app.post('/api/v1/docs/search',  controller.filterRepository)

  /**
   * @swagger
   * /api/v1/docs/repository:
   *   post:
   *     tags: [Data]
   *     summary: Get optimized document repository data
   *     description: Get documents with category counts, pagination, and search in a single optimized call.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               page:
   *                 type: integer
   *                 description: Page number for pagination
   *                 example: 1
   *               limit:
   *                 type: integer
   *                 description: Number of items per page
   *                 example: 10
   *               searchTerm:
   *                 type: string
   *                 description: Search term for documents
   *                 example: "report"
   *               categoryFilter:
   *                 type: integer
   *                 description: Filter by document category ID
   *                 example: 1
   *               userFilters:
   *                 type: array
   *                 description: User permission filters
   *                 items:
   *                   type: object
   *                   properties:
   *                     field:
   *                       type: string
   *                     value:
   *                       type: any
   *               sortBy:
   *                 type: string
   *                 description: Field to sort by
   *                 example: "createdAt"
   *               sortOrder:
   *                 type: string
   *                 description: Sort order (ASC or DESC)
   *                 example: "DESC"
   *     responses:
   *       200:
   *         description: Document repository data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     documents:
   *                       type: array
   *                       items:
   *                         type: object
   *                     categoryCounts:
   *                       type: object
   *                       description: Document counts by category and type
   *                     totalDocuments:
   *                       type: integer
   *                       description: Total number of documents
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         currentPage:
   *                           type: integer
   *                         totalPages:
   *                           type: integer
   *                         totalItems:
   *                           type: integer
   *                         itemsPerPage:
   *                           type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid parameters
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post('/api/v1/docs/repository', [authJwt.verifyToken, hasPermission('document:read')], controller.getDocumentRepository)
  app.get('/api/v1/docs/uploaders', [authJwt.verifyToken, hasPermission('document:read')], controller.getDocumentUploaders)
  app.post('/api/v1/docs/link', [authJwt.verifyToken, hasPermission('document:create')], controller.linkDocument)
  app.post('/api/v1/docs/unlink', [authJwt.verifyToken, hasPermission('document:delete')], controller.unlinkDocument)
  app.post('/api/v1/docs/linked', [authJwt.verifyToken, hasPermission('document:read')], controller.getLinkedDocuments)
  app.post('/api/v1/docs/association-snapshot', [authJwt.verifyToken, hasPermission('document:read')], controller.getDocumentAssociationSnapshot)

  /**
   * @swagger
   * /api/v1/fields/options:
   *   post:
   *     tags: [Data]
   *     summary: Get field options
   *     description: Retrieve unique values for a specific field in a model.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - model
   *               - field
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the model/table
   *                 example: "user"
   *               field:
   *                 type: string
   *                 description: Field name to get options for
   *                 example: "role"
   *               filters:
   *                 type: object
   *                 description: Optional filter conditions
   *                 example:
   *                   status: "active"
   *     responses:
   *       200:
   *         description: Field options retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 options:
   *                   type: array
   *                   items:
   *                     type: string
   *                   description: Array of unique field values
   *                   example: ["admin", "user", "moderator"]
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - invalid model or field
   */
  app.post(
    "/api/v1/fields/options",   controller.getFieldQUnique
  );

  // Document AI Processing Routes
  /**
   * @swagger
   * /api/v1/documents/ai/process:
   *   post:
   *     tags: [Document AI]
   *     summary: Process existing documents with AI
   *     description: Manually trigger AI processing for existing documents that were uploaded before AI integration.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               documentIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of specific document IDs to process
   *                 example: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-b789-123456789abc"]
   *               processAll:
   *                 type: boolean
   *                 description: Process all unprocessed documents
   *                 example: false
   *     responses:
   *       200:
   *         description: AI processing initiated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "AI processing completed: 5 processed, 0 failed, 0 skipped"
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 stats:
   *                   type: object
   *                   properties:
   *                     processed:
   *                       type: integer
   *                       description: Number of documents successfully processed
   *                       example: 5
   *                     failed:
   *                       type: integer
   *                       description: Number of documents that failed processing
   *                       example: 0
   *                     skipped:
   *                       type: integer
   *                       description: Number of documents skipped
   *                       example: 0
   *       400:
   *         description: Bad request - invalid parameters
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       500:
   *         description: Internal server error during processing
   */
  app.post('/api/v1/documents/ai/process', [authJwt.verifyToken, hasPermission('document:update')], controller.processExistingDocumentsWithAI)

  /**
   * @swagger
   * /api/v1/documents/{documentId}/ai/status:
   *   get:
   *     tags: [Document AI]
   *     summary: Get AI processing status for a document
   *     description: Check the AI processing status and details for a specific document.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documentId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the document to check
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: AI status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "AI status retrieved successfully"
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 documentId:
   *                   type: string
   *                   description: ID of the document
   *                   example: "123e4567-e89b-12d3-a456-426614174000"
   *                 documentName:
   *                   type: string
   *                   description: Name of the document
   *                   example: "sample.pdf"
   *                 aiStatus:
   *                   type: object
   *                   properties:
   *                     processed:
   *                       type: boolean
   *                       description: Whether the document has been processed with AI
   *                       example: true
   *                     chunks:
   *                       type: integer
   *                       description: Number of text chunks created
   *                       example: 15
   *                     documentId:
   *                       type: string
   *                       description: AI document ID
   *                       example: "987fcdeb-51a2-43d1-b789-123456789abc"
   *                     warning:
   *                       type: string
   *                       description: Any warnings during processing
   *                       example: "Embeddings disabled"
   *                     processedAt:
   *                       type: string
   *                       format: date-time
   *                       description: When the document was processed
   *                       example: "2024-01-15T10:30:00Z"
   *       400:
   *         description: Bad request - missing document ID
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Document not found
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/documents/:documentId/ai/status', [authJwt.verifyToken, hasPermission('document:read')], controller.getDocumentAIStatus)

  /**
   * @swagger
   * /api/v1/documents/ai/stats:
   *   get:
   *     tags: [Document AI]
   *     summary: Get AI processing statistics
   *     description: Get overall statistics about document AI processing across the system.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: AI statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "AI processing statistics retrieved successfully"
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 stats:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                       description: Total number of documents
   *                       example: 100
   *                     processed:
   *                       type: integer
   *                       description: Number of documents processed with AI
   *                       example: 75
   *                     unprocessed:
   *                       type: integer
   *                       description: Number of documents not yet processed
   *                       example: 25
   *                     processingRate:
   *                       type: string
   *                       description: Percentage of documents processed
   *                       example: "75.00"
   *                 recentActivity:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Recent AI processing activity
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       500:
   *         description: Internal server error
   */
  app.get('/api/v1/documents/ai/stats', [authJwt.verifyToken, hasPermission('document:read')], controller.getAIProcessingStats)

  // AI Configuration and Provider Management Routes
  /**
   * @swagger
   * /api/ai/health:
   *   get:
   *     tags: [AI Configuration]
   *     summary: Check AI service health
   *     description: Check if the AI service is running and healthy.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: AI service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "AI service is healthy"
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: "healthy"
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-15T10:30:00Z"
   *       500:
   *         description: AI service is unhealthy
   */
  app.get('/api/ai/health', [authJwt.verifyToken], controller.getAIHealth)

  /**
   * @swagger
   * /api/ai/providers:
   *   get:
   *     tags: [AI Configuration]
   *     summary: Get available AI providers
   *     description: Retrieve list of available AI providers and their configurations.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: AI providers retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: "openai"
   *                       name:
   *                         type: string
   *                         example: "OpenAI"
   *                       description:
   *                         type: string
   *                         example: "OpenAI GPT models"
   *                       isAvailable:
   *                         type: boolean
   *                         example: true
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.get('/api/ai/providers', [authJwt.verifyToken], controller.getAIProviders)

  /**
   * @swagger
   * /api/ai/models:
   *   get:
   *     tags: [AI Configuration]
   *     summary: Get available AI models
   *     description: Retrieve list of available AI models for all providers.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: AI models retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: "gpt-3.5-turbo"
   *                       name:
   *                         type: string
   *                         example: "GPT-3.5 Turbo"
   *                       provider:
   *                         type: string
   *                         example: "openai"
   *                       maxTokens:
   *                         type: integer
   *                         example: 4096
   *                       isAvailable:
   *                         type: boolean
   *                         example: true
   *                       costPerToken:
   *                         type: number
   *                         example: 0.000002
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.get('/api/ai/models', [authJwt.verifyToken], controller.getAIModels)

  /**
   * @swagger
   * /api/ai/provider:
   *   post:
   *     tags: [AI Configuration]
   *     summary: Set active AI provider
   *     description: Set the active AI provider for the system.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - provider
   *             properties:
   *               provider:
   *                 type: string
   *                 description: ID of the AI provider to set as active
   *                 example: "openai"
   *     responses:
   *       200:
   *         description: AI provider set successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "AI provider set to OpenAI"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "openai"
   *                     name:
   *                       type: string
   *                       example: "OpenAI"
   *       400:
   *         description: Bad request - invalid provider
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post('/api/ai/provider', [authJwt.verifyToken], controller.setAIProvider)

  /**
   * @swagger
   * /api/ai/ask:
   *   post:
   *     tags: [AI Chat]
   *     summary: Ask AI about documents
   *     description: Send a question to the AI about documents and get a response with sources.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - question
   *             properties:
   *               question:
   *                 type: string
   *                 description: The question to ask about documents
   *                 example: "What are the main findings in the project reports?"
   *               sessionId:
   *                 type: string
   *                 description: Session ID for conversation continuity
   *                 example: "session_123"
   *               provider:
   *                 type: string
   *                 description: AI provider to use
   *                 example: "openai"
   *               model:
   *                 type: string
   *                 description: AI model to use
   *                 example: "gpt-3.5-turbo"
   *               documentIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Specific document IDs to search in
   *                 example: ["123", "456"]
   *     responses:
   *       200:
   *         description: AI response generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     answer:
   *                       type: string
   *                       example: "Based on the project reports, the main findings include..."
   *                     sources:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           filename:
   *                             type: string
   *                             example: "project_report_2024.pdf"
   *                           chunk:
   *                             type: string
   *                             example: "The project achieved 85% completion..."
   *                           similarity:
   *                             type: number
   *                             example: 0.92
   *                           documentId:
   *                             type: string
   *                             example: "123"
   *                     tokens:
   *                       type: integer
   *                       example: 1500
   *                     processingTime:
   *                       type: number
   *                       example: 2.5
   *                     confidence:
   *                       type: number
   *                       example: 0.85
   *                     sessionId:
   *                       type: string
   *                       example: "session_123"
   *       400:
   *         description: Bad request - missing question
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post('/api/ai/ask', [authJwt.verifyToken], controller.askAIDocument)
}

