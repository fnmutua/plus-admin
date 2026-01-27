/* eslint-disable prettier/prettier */
const { authJwt } = require('../middleware')
const controller = require('../controllers/summary.controller')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  /**
   * @swagger
   * /api/v1/summary/byfield:
   *   post:
   *     tags: [Summary]
   *     summary: Summarize data by field with optional grouping and filtering
   *     description: Generate summary statistics for a model by aggregating data using specified functions (sum, count, avg, etc.) with optional grouping and filtering. Supports Redis caching for performance.
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
   *               - summaryField
   *               - summaryFunction
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the database model/table to summarize
   *                 example: grievance
   *               summaryField:
   *                 type: string
   *                 description: Field name to apply the summary function to
   *                 example: id
   *               summaryFunction:
   *                 type: string
   *                 description: SQL aggregation function (sum, count, avg, min, max)
   *                 example: count
   *                 enum: [sum, count, avg, min, max]
   *               groupField:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of field names to group by
   *                 example: ["status", "county_id"]
   *               filterColumn:
   *                 type: string
   *                 description: Column name to filter by
   *                 example: county_id
   *               filterValue:
   *                 type: string
   *                 description: Value to filter the column by
   *                 example: 1
   *               cache_key:
   *                 type: string
   *                 description: Redis cache key for storing results (optional)
   *                 example: grievance_count_by_status
   *     responses:
   *       200:
   *         description: Summary data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Total:
   *                   type: array
   *                   items:
   *                     type: object
   *                   description: Array of summary results
   *                   example: [{"status": "Pending", "count": 150}, {"status": "Resolved", "count": 75}]
   *                 fromCache:
   *                   type: boolean
   *                   description: Whether the result was retrieved from cache
   *                   example: false
   *                 cache_key:
   *                   type: string
   *                   description: Cache key used (if provided)
   *                   example: grievance_count_by_status
   *                 code:
   *                   type: string
   *                   example: '0000'
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error during data retrieval
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Fetching data failed
   */
  app.post('/api/v1/summary/byfield', [authJwt.verifyToken], controller.sumModelByColumn);

  /**
   * @swagger
   * /api/v1/summary/byfield/simple:
   *   post:
   *     tags: [Summary]
   *     summary: Simple summary by field with basic filtering
   *     description: Generate simple summary statistics for a model with basic filtering capabilities. Optimized for single-field aggregation without complex grouping.
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
   *               - summaryField
   *               - summaryFunction
   *             properties:
   *               model:
   *                 type: string
   *                 description: Name of the database model/table
   *                 example: grievance
   *               summaryField:
   *                 type: string
   *                 description: Field to aggregate
   *                 example: id
   *               summaryFunction:
   *                 type: string
   *                 description: Aggregation function
   *                 example: count
   *                 enum: [sum, count, avg, min, max]
   *               summaryFieldValue:
   *                 type: string
   *                 description: Value to filter the summary field by
   *                 example: Pending
   *               cache_key:
   *                 type: string
   *                 description: Redis cache key
   *                 example: simple_grievance_count
   *     responses:
   *       200:
   *         description: Simple summary data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Total:
   *                   type: array
   *                   items:
   *                     type: object
   *                   example: [{"count": 225}]
   *                 fromCache:
   *                   type: boolean
   *                   example: false
   *                 code:
   *                   type: string
   *                   example: '0000'
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post('/api/v1/summary/byfield/simple',[authJwt.verifyToken],   controller.SimpleSumModelByColumn)

  /**
   * @swagger
   * /api/v1/summary/byfield/nested:
   *   post:
   *     tags: [Summary]
   *     summary: Nested summary with associated models
   *     description: Generate summary statistics with nested associations. Groups data by a field and includes related model data in the results.
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
   *               - summaryField
   *               - summaryFunction
   *               - assoc_model
   *               - groupField
   *             properties:
   *               model:
   *                 type: string
   *                 description: Primary model name
   *                 example: grievance
   *               assoc_model:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of associated model names
   *                 example: ["county"]
   *               summaryField:
   *                 type: string
   *                 description: Field to aggregate
   *                 example: id
   *               summaryFunction:
   *                 type: string
   *                 description: Aggregation function
   *                 example: count
   *               groupField:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Fields to group by
   *                 example: ["county_id"]
   *               cache_key:
   *                 type: string
   *                 description: Redis cache key
   *                 example: nested_grievance_by_county
   *     responses:
   *       200:
   *         description: Nested summary data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Total:
   *                   type: array
   *                   items:
   *                     type: object
   *                   example: [{"county_id": 1, "count": 50, "county": {"name": "Nairobi"}}]
   *                 fromCache:
   *                   type: boolean
   *                   example: false
   *                 code:
   *                   type: string
   *                   example: '0000'
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
   app.post('/api/v1/summary/byfield/nested', [authJwt.verifyToken],  controller.sumModelByColumnAssociated)

  /**
   * @swagger
   * /api/v1/summary/byfield/include:
   *   post:
   *     tags: [Summary]
   *     summary: Summary with included associations
   *     description: Generate summary statistics with included associated model data. Similar to nested but with more flexible association handling.
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
   *               - summaryField
   *               - summaryFunction
   *               - assoc_model
   *               - groupField
   *             properties:
   *               model:
   *                 type: string
   *                 description: Primary model name
   *                 example: grievance
   *               assoc_model:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Associated model names
   *                 example: ["county", "settlement"]
   *               summaryField:
   *                 type: string
   *                 description: Field to aggregate
   *                 example: id
   *               summaryFunction:
   *                 type: string
   *                 description: Aggregation function
   *                 example: count
   *               groupField:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Fields to group by
   *                 example: ["county_id", "settlement_id"]
   *               cache_key:
   *                 type: string
   *                 description: Redis cache key
   *                 example: include_grievance_summary
   *     responses:
   *       200:
   *         description: Summary with included associations retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Total:
   *                   type: array
   *                   items:
   *                     type: object
   *                   example: [{"county_id": 1, "settlement_id": 5, "count": 25, "county": {"name": "Nairobi"}, "settlement": {"name": "Westlands"}}]
   *                 fromCache:
   *                   type: boolean
   *                   example: false
   *                 code:
   *                   type: string
   *                   example: '0000'
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
   app.post('/api/v1/summary/byfield/include',  [authJwt.verifyToken], controller.nestedSumModelByColumn)

  /**
   * @swagger
   * /api/v1/summary/byfield/multiple:
   *   post:
   *     tags: [Summary]
   *     summary: Multiple model summary with associations
   *     description: Generate complex summary statistics across multiple associated models. Supports deep associations and complex aggregation scenarios.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - models
   *               - summaryFields
   *               - summaryFunctions
   *             properties:
   *               models:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of model names to summarize
   *                 example: ["grievance", "household", "settlement"]
   *               summaryFields:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Fields to aggregate for each model
   *                 example: ["id", "population", "area"]
   *               summaryFunctions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Aggregation functions for each field
   *                 example: ["count", "sum", "avg"]
   *               associations:
   *                 type: array
   *                 items:
   *                   type: object
   *                 description: Model associations configuration
   *               cache_key:
   *                 type: string
   *                 description: Redis cache key
   *                 example: multiple_model_summary
   *     responses:
   *       200:
   *         description: Multiple model summary data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Total:
   *                   type: object
   *                   description: Summary results for each model
   *                   example: {"grievance": [{"count": 225}], "household": [{"sum": 1500}], "settlement": [{"avg": 45.5}]}
   *                 fromCache:
   *                   type: boolean
   *                   example: false
   *                 code:
   *                   type: string
   *                   example: '0000'
   *       500:
   *         description: Internal server error
   */
  app.post('/api/v1/summary/byfield/multiple', controller.sumModelAssociatedMultipleModels)

  /**
   * @swagger
   * /api/v1/summary/group/multiple:
   *   post:
   *     tags: [Summary]
   *     summary: Group by multiple columns
   *     description: Generate summary statistics grouped by multiple columns with support for complex grouping scenarios and associated models.
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
   *               - groupField
   *               - summaryField
   *               - summaryFunction
   *             properties:
   *               model:
   *                 type: string
   *                 description: Model name to summarize
   *                 example: grievance
   *               groupField:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Multiple fields to group by
   *                 example: ["county_id", "status", "current_level"]
   *               summaryField:
   *                 type: string
   *                 description: Field to aggregate
   *                 example: id
   *               summaryFunction:
   *                 type: string
   *                 description: Aggregation function
   *                 example: count
   *               assoc_model:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Associated models to include
   *                 example: ["county", "settlement"]
   *               cache_key:
   *                 type: string
   *                 description: Redis cache key
   *                 example: multi_group_grievance_summary
   *     responses:
   *       200:
   *         description: Multi-column grouped summary data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Total:
   *                   type: array
   *                   items:
   *                     type: object
   *                   example: [{"county_id": 1, "status": "Pending", "current_level": "Level 1", "count": 45}]
   *                 fromCache:
   *                   type: boolean
   *                   example: false
   *                 code:
   *                   type: string
   *                   example: '0000'
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
   app.post('/api/v1/summary/group/multiple',  [authJwt.verifyToken],controller.sumGroupByMultipleColumns)

  /**
   * @swagger
   * /api/v1/summary/group/app:
   *   post:
   *     tags: [Summary]
   *     summary: Application-specific combined summary
   *     description: Generate application-specific summary statistics combining multiple models and metrics. Optimized for dashboard and reporting use cases.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user
   *               - summaryType
   *             properties:
   *               user:
   *                 type: object
   *                 description: User object with permissions and location data
   *                 properties:
   *                   id:
   *                     type: integer
   *                     description: User ID
   *                   user_roles:
   *                     type: array
   *                     items:
   *                       type: object
   *                     description: User roles and permissions
   *               summaryType:
   *                 type: string
   *                 description: Type of summary to generate
   *                 example: dashboard
   *                 enum: [dashboard, report, analytics]
   *               filters:
   *                 type: object
   *                 description: Optional filters to apply
   *                 properties:
   *                   dateRange:
   *                     type: object
   *                     description: Date range filter
   *                   location:
   *                     type: object
   *                     description: Location-based filter
   *               cache_key:
   *                 type: string
   *                 description: Redis cache key
   *                 example: app_dashboard_summary
   *     responses:
   *       200:
   *         description: Application summary data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Total:
   *                   type: object
   *                   description: Combined summary data for the application
   *                   example: {"grievances": {"total": 225, "pending": 150, "resolved": 75}, "households": {"total": 1500}, "settlements": {"total": 45}}
   *                 fromCache:
   *                   type: boolean
   *                   example: false
   *                 code:
   *                   type: string
   *                   example: '0000'
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
   app.post('/api/v1/summary/group/app',  [authJwt.verifyToken], controller.appGetSummaryCombined)

  // Quick counts for app boot: settlements, projects, grievances per county
  /**
   * @swagger
   * /api/v1/summary/county/counts:
   *   post:
   *     tags: [Summary]
   *     summary: Quick counts for a county
   *     description: Returns counts of settlements, projects and grievances for a given county. Cached briefly for performance.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [county_id]
   *             properties:
   *               county_id:
   *                 type: integer
   *                 example: 47
   *               cache_key:
   *                 type: string
   *                 example: county_counts_47
   *     responses:
   *       200:
   *         description: Counts retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 counts:
   *                   type: object
   *                   properties:
   *                     settlements:
   *                       type: integer
   *                     projects:
   *                       type: integer
   *                     grievances:
   *                       type: integer
   *                 code:
   *                   type: string
   *                   example: '0000'
   */
  app.post('/api/v1/summary/county/counts', [authJwt.verifyToken], controller.countsByCounty)

  // Detailed facility counts for a county (used by mobile app ListPage)
  /**
   * @swagger
   * /api/v1/summary/county/facilities:
   *   post:
   *     tags: [Summary]
   *     summary: Facility counts for a county
   *     description: Returns counts for all key facilities (settlements, schools, health, water, sewer, power, security, environment, infrastructure, reports) for a given county.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [county_id]
   *             properties:
   *               county_id:
   *                 type: integer
   *                 example: 47
   *               cache_key:
   *                 type: string
   *                 example: county_facility_counts_47
   *     responses:
   *       200:
   *         description: Facility counts retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 counts:
   *                   type: object
   *                 code:
   *                   type: string
   *                   example: '0000'
   */
  app.post('/api/v1/summary/county/facilities', [authJwt.verifyToken], controller.countsByCountyFacilities)

 
  
}