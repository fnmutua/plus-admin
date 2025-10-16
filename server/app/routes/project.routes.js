const { authJwt } = require("../middleware");
const controller = require("../controllers/project.controller");
const { hasPermission } = require('../middleware/permission');

module.exports = function(app) {

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
    //app.post('/api/v1/user/all',  [authJwt.verifyToken],controller.modelAllUsers) // retrired 

    /**
     * @swagger
     * /api/v1/project/task/add:
     *   post:
     *     tags: [Projects]
     *     summary: Create or update project task
     *     description: Create a new project task or update an existing one. Supports upsert functionality where existing tasks are updated if ID is provided, otherwise a new task is created. Automatically updates task progress calculations.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: integer
     *                 description: Task ID for updates (optional for new tasks)
     *                 example: 1
     *               name:
     *                 type: string
     *                 description: Task name
     *                 example: "Infrastructure Development"
     *               startDate:
     *                 type: string
     *                 format: date-time
     *                 description: Task start date
     *                 example: "2024-01-15T00:00:00.000Z"
     *               endDate:
     *                 type: string
     *                 format: date-time
     *                 description: Task end date
     *                 example: "2024-06-15T00:00:00.000Z"
     *               progress:
     *                 type: number
     *                 description: Task progress percentage (0-100)
     *                 example: 45.5
     *               status:
     *                 type: string
     *                 description: Task status
     *                 example: "In Progress"
     *                 enum: ["Not Started", "In Progress", "Completed", "On Hold"]
     *               project_id:
     *                 type: integer
     *                 description: Associated project ID
     *                 example: 1
     *               parentTaskId:
     *                 type: integer
     *                 description: Parent task ID for subtasks (optional)
     *                 example: 1
     *               time_spent:
     *                 type: number
     *                 description: Time spent percentage (auto-calculated)
     *                 example: 45.5
     *               code:
     *                 type: string
     *                 description: Unique task code
     *                 example: "TASK-001"
     *               description:
     *                 type: string
     *                 description: Task description
     *                 example: "Develop infrastructure components for the project"
     *               priority:
     *                 type: string
     *                 description: Task priority level
     *                 example: "High"
     *                 enum: ["Low", "Medium", "High", "Critical"]
     *               assignedTo:
     *                 type: integer
     *                 description: User ID assigned to the task
     *                 example: 1
     *               budget:
     *                 type: number
     *                 description: Task budget amount
     *                 example: 50000
     *               count:
     *                 type: integer
     *                 description: Number of records being processed
     *                 example: 1
     *     responses:
     *       200:
     *         description: Task created or updated successfully
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
     *                   description: Created or updated task data
     *                   properties:
     *                     id:
     *                       type: integer
     *                       example: 1
     *                     name:
     *                       type: string
     *                       example: "Infrastructure Development"
     *                     startDate:
     *                       type: string
     *                       format: date-time
     *                     endDate:
     *                       type: string
     *                       format: date-time
     *                     progress:
     *                       type: number
     *                       example: 45.5
     *                     status:
     *                       type: string
     *                       example: "In Progress"
     *                     project_id:
     *                       type: integer
     *                       example: 1
     *                     parentTaskId:
     *                       type: integer
     *                       example: 1
     *                     time_spent:
     *                       type: number
     *                       example: 45.5
     *                     code:
     *                       type: string
     *                       example: "TASK-001"
     *                     createdAt:
     *                       type: string
     *                       format: date-time
     *                     updatedAt:
     *                       type: string
     *                       format: date-time
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       400:
     *         description: Bad request - duplicate records or validation error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Duplicate records for project_task not allowed"
     *       401:
     *         description: Unauthorized - invalid token
     *       403:
     *         description: Forbidden - insufficient permissions (project:create)
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "An unexpected error occurred while creating or updating the record."
     */
    app.post("/api/v1/project/task/add", [authJwt.verifyToken, hasPermission('project:create')], controller.modelCreateOneRecord);

    /**
     * @swagger
     * /api/v1/project/task/del:
     *   post:
     *     tags: [Projects]
     *     summary: Delete project task
     *     description: Delete a project task by ID. Checks for dependencies in associated models before deletion. Cannot delete tasks that have dependent records.
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
     *                 description: Model name to delete from
     *                 example: "project_task"
     *               id:
     *                 type: integer
     *                 description: ID of the task to delete
     *                 example: 1
     *     responses:
     *       200:
     *         description: Task deleted successfully
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
     *                   example: "Model 'project_task' does not exist"
     *                 code:
     *                   type: string
     *                   example: "MODEL_NOT_FOUND"
     *       401:
     *         description: Unauthorized - invalid token
     *       403:
     *         description: Forbidden - insufficient permissions (project:delete)
     *       404:
     *         description: Task not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Record with id '1' does not exist in 'project_task' model"
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
     *                   example: "Cannot delete 'project_task' record, it has 5 dependent project_task(s)"
     *                 code:
     *                   type: string
     *                   example: "DEPENDENCY_FOUND"
     */
    app.post("/api/v1/project/task/del", [authJwt.verifyToken, hasPermission('project:delete')], controller.modelDeleteOneRecord);

    /**
     * @swagger
     * /api/v1/project/task/get:
     *   post:
     *     tags: [Projects]
     *     summary: Get tasks by project ID
     *     description: Retrieve all tasks associated with a specific project ID. Returns flat list of tasks ordered by start date.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - project_id
     *             properties:
     *               project_id:
     *                 type: integer
     *                 description: Project ID to fetch tasks for
     *                 example: 1
     *     responses:
     *       200:
     *         description: Tasks retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Tasks retrieved successfully"
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                         example: 1
     *                       name:
     *                         type: string
     *                         example: "Infrastructure Development"
     *                       startDate:
     *                         type: string
     *                         format: date-time
     *                         example: "2024-01-15T00:00:00.000Z"
     *                       endDate:
     *                         type: string
     *                         format: date-time
     *                         example: "2024-06-15T00:00:00.000Z"
     *                       progress:
     *                         type: number
     *                         example: 45.5
     *                       status:
     *                         type: string
     *                         example: "In Progress"
     *                       project_id:
     *                         type: integer
     *                         example: 1
     *                       time_spent:
     *                         type: number
     *                         example: 45.5
     *                       parentTaskId:
     *                         type: integer
     *                         example: 1
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       400:
     *         description: Bad request - project ID required
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Project ID is required"
     *       401:
     *         description: Unauthorized - invalid token
     *       403:
     *         description: Forbidden - insufficient permissions (project:read)
     *       404:
     *         description: No tasks found for project
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "No tasks found for this project"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "An unexpected error occurred while fetching tasks."
     */
    app.post("/api/v1/project/task/get", [authJwt.verifyToken, hasPermission('project:read')], controller.getTasksByProjectId);

    /**
     * @swagger
     * /api/v1/project/task/get/nested:
     *   post:
     *     tags: [Projects]
     *     summary: Get nested tasks by project ID
     *     description: Retrieve all tasks associated with a specific project ID in a hierarchical structure. Returns parent tasks with their nested subtasks recursively.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - project_id
     *             properties:
     *               project_id:
     *                 type: integer
     *                 description: Project ID to fetch nested tasks for
     *                 example: 1
     *     responses:
     *       200:
     *         description: Nested tasks retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Tasks retrieved successfully"
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                         example: 1
     *                       name:
     *                         type: string
     *                         example: "Infrastructure Development"
     *                       startDate:
     *                         type: string
     *                         format: date-time
     *                         example: "2024-01-15T00:00:00.000Z"
     *                       endDate:
     *                         type: string
     *                         format: date-time
     *                         example: "2024-06-15T00:00:00.000Z"
     *                       progress:
     *                         type: number
     *                         example: 45.5
     *                       status:
     *                         type: string
     *                         example: "In Progress"
     *                       project_id:
     *                         type: integer
     *                         example: 1
     *                       time_spent:
     *                         type: number
     *                         example: 45.5
     *                       parentTaskId:
     *                         type: integer
     *                         example: 1
     *                       createdAt:
     *                         type: string
     *                         format: date-time
     *                       Subtasks:
     *                         type: array
     *                         description: Nested subtasks
     *                         items:
     *                           type: object
     *                           properties:
     *                             id:
     *                               type: integer
     *                               example: 2
     *                             name:
     *                               type: string
     *                               example: "Subtask 1"
     *                             startDate:
     *                               type: string
     *                               format: date-time
     *                             endDate:
     *                               type: string
     *                               format: date-time
     *                             progress:
     *                               type: number
     *                               example: 30.0
     *                             status:
     *                               type: string
     *                               example: "In Progress"
     *                             project_id:
     *                               type: integer
     *                               example: 1
     *                             time_spent:
     *                               type: number
     *                               example: 30.0
     *                             parentTaskId:
     *                               type: integer
     *                               example: 1
     *                             createdAt:
     *                               type: string
     *                               format: date-time
     *                             Subtasks:
     *                               type: array
     *                               description: Further nested subtasks
     *                               items:
     *                                 type: object
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       400:
     *         description: Bad request - project ID required
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Project ID is required"
     *       401:
     *         description: Unauthorized - invalid token
     *       403:
     *         description: Forbidden - insufficient permissions (project:read)
     *       404:
     *         description: No tasks found for project
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "No tasks found for this project"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "An unexpected error occurred while fetching tasks."
     */
    app.post("/api/v1/project/task/get/nested", [authJwt.verifyToken, hasPermission('project:read')], controller.getNestedTasksByProjectId);

    /**
     * @swagger
     * /api/v1/project/task/import:
     *   post:
     *     tags: [Projects]
     *     summary: Import project tasks
     *     description: Import multiple project tasks in batch with upsert functionality. Supports hierarchical task structures with parent-child relationships. Handles both creation and updates based on task codes.
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
     *                 description: Model name for import
     *                 example: "project_task"
     *               data:
     *                 type: array
     *                 description: Array of task objects to import
     *                 items:
     *                   type: object
     *                   properties:
     *                     code:
     *                       type: string
     *                       description: Unique task code for upsert
     *                       example: "TASK-001"
     *                     name:
     *                       type: string
     *                       description: Task name
     *                       example: "Infrastructure Development"
     *                     startDate:
     *                       type: string
     *                       format: date-time
     *                       description: Task start date
     *                       example: "2024-01-15T00:00:00.000Z"
     *                     endDate:
     *                       type: string
     *                       format: date-time
     *                       description: Task end date
     *                       example: "2024-06-15T00:00:00.000Z"
     *                     progress:
     *                       type: number
     *                       description: Task progress percentage
     *                       example: 45.5
     *                     status:
     *                       type: string
     *                       description: Task status
     *                       example: "In Progress"
     *                     project_id:
     *                       type: integer
     *                       description: Associated project ID
     *                       example: 1
     *                     parent_task_code:
     *                       type: string
     *                       description: Parent task code for hierarchical structure
     *                       example: "TASK-000"
     *                     description:
     *                       type: string
     *                       description: Task description
     *                       example: "Develop infrastructure components"
     *                     priority:
     *                       type: string
     *                       description: Task priority
     *                       example: "High"
     *                     assignedTo:
     *                       type: integer
     *                       description: User ID assigned to task
     *                       example: 1
     *                     budget:
     *                       type: number
     *                       description: Task budget
     *                       example: 50000
     *     responses:
     *       200:
     *         description: Tasks imported successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Import/Update Successful"
     *                 code:
     *                   type: string
     *                   example: "0000"
     *                 insertedDocuments:
     *                   type: array
     *                   description: Array of imported/updated task documents
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                         example: 1
     *                       code:
     *                         type: string
     *                         example: "TASK-001"
     *                       name:
     *                         type: string
     *                         example: "Infrastructure Development"
     *                       startDate:
     *                         type: string
     *                         format: date-time
     *                       endDate:
     *                         type: string
     *                         format: date-time
     *                       progress:
     *                         type: number
     *                         example: 45.5
     *                       status:
     *                         type: string
     *                         example: "In Progress"
     *                       project_id:
     *                         type: integer
     *                         example: 1
     *                       parentTaskId:
     *                         type: integer
     *                         example: 1
     *                       createdAt:
     *                         type: string
     *                         format: date-time
     *                       updatedAt:
     *                         type: string
     *                         format: date-time
     *       401:
     *         description: Unauthorized - invalid token
     *       403:
     *         description: Forbidden - insufficient permissions (project:import)
     *       500:
     *         description: Import failed or internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "There are one or more duplicate records"
     *                 errors:
     *                   type: array
     *                   description: Array of error messages
     *                   items:
     *                     type: string
     *                     example: "Duplicate entry for code TASK-001"
     */
    app.post("/api/v1/project/task/import", [authJwt.verifyToken, hasPermission('project:import')], controller.modelImportDataUpsert);

    /**
     * @swagger
     * /api/v1/project/details:
     *   post:
     *     tags: [Projects]
     *     summary: Get project details
     *     description: Retrieve detailed information about a specific project including contractor information.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: integer
     *                 description: Project ID
     *                 example: 1
     *               code:
     *                 type: string
     *                 description: Project code
     *                 example: "PROJ-001"
     *     responses:
     *       200:
     *         description: Project details retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Project details retrieved successfully"
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                       example: 1
     *                     title:
     *                       type: string
     *                       example: "Infrastructure Development Project"
     *                     project_code:
     *                       type: string
     *                       example: "INFRA-2024"
     *                     code:
     *                       type: string
     *                       example: "PROJ-001"
     *                     status:
     *                       type: string
     *                       example: "Active"
     *                     description:
     *                       type: string
     *                       example: "Development of infrastructure components"
     *                     start_date:
     *                       type: string
     *                       format: date-time
     *                     end_date:
     *                       type: string
     *                       format: date-time
     *                     cost:
     *                       type: integer
     *                       example: 1000000
     *                     contractor:
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: integer
     *                           example: 1
     *                         name:
     *                           type: string
     *                           example: "ABC Construction Ltd"
     *                         contract_number:
     *                           type: string
     *                           example: "CON-2024-001"
     *                         address:
     *                           type: string
     *                           example: "123 Main Street, Nairobi"
     *                         phone:
     *                           type: string
     *                           example: "+254700000000"
     *                         code:
     *                           type: string
     *                           example: "CON-001"
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       400:
     *         description: Bad request - project ID or code required
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Project ID or code is required"
     *       401:
     *         description: Unauthorized - invalid token
     *       403:
     *         description: Forbidden - insufficient permissions (project:read)
     *       404:
     *         description: Project not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Project not found"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "An unexpected error occurred while fetching project details."
     */
    app.post("/api/v1/project/details", [authJwt.verifyToken, hasPermission('project:read')], controller.getProjectDetails);

    /**
     * @swagger
     * /api/v1/project/location/details:
     *   post:
     *     tags: [Projects]
     *     summary: Get project location details
     *     description: Retrieve detailed information about project locations including county, ward, settlement details, project information, contractor details, and calculated centroid coordinates for polygon geometries.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               project_id:
     *                 type: integer
     *                 description: Project ID
     *                 example: 1
     *               project_code:
     *                 type: string
     *                 description: Project code
     *                 example: "PROJ-001"
     *     responses:
     *       200:
     *         description: Project location details retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Project location details retrieved successfully"
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       project_id:
     *                         type: integer
     *                         example: 1
     *                       ward_id:
     *                         type: integer
     *                         example: 1
     *                       settlement_id:
     *                         type: integer
     *                         example: 1
     *                       subcounty_id:
     *                         type: integer
     *                         example: 1
     *                       county_id:
     *                         type: integer
     *                         example: 1
     *                       location_name:
     *                         type: string
     *                         example: "Main Site"
     *                       location_type:
     *                         type: string
     *                         example: "settlement"
     *                         enum: ["county", "subcounty", "ward", "settlement"]
     *                       centroid:
     *                         type: object
     *                         properties:
     *                           latitude:
     *                             type: number
     *                             example: -1.2921
     *                           longitude:
     *                             type: number
     *                             example: 36.8219
     *                       project:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: integer
     *                             example: 1
     *                           title:
     *                             type: string
     *                             example: "Infrastructure Development Project"
     *                           project_code:
     *                             type: string
     *                             example: "INFRA-2024"
     *                           code:
     *                             type: string
     *                             example: "PROJ-001"
     *                           status:
     *                             type: string
     *                             example: "Active"
     *                           description:
     *                             type: string
     *                             example: "Development of infrastructure components"
     *                           contractor:
     *                             type: object
     *                             properties:
     *                               id:
     *                                 type: integer
     *                                 example: 1
     *                               name:
     *                                 type: string
     *                                 example: "ABC Construction Ltd"
     *                               contract_number:
     *                                 type: string
     *                                 example: "CON-2024-001"
     *                               address:
     *                                 type: string
     *                                 example: "123 Main Street, Nairobi"
     *                               phone:
     *                                 type: string
     *                                 example: "+254700000000"
     *                               code:
     *                                 type: string
     *                                 example: "CON-001"
     *                       county:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: integer
     *                             example: 1
     *                           name:
     *                             type: string
     *                             example: "Nairobi"
     *                           code:
     *                             type: string
     *                             example: "047"
     *                       subcounty:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: integer
     *                             example: 1
     *                           name:
     *                             type: string
     *                             example: "Westlands"
     *                           code:
     *                             type: string
     *                             example: "047001"
     *                       ward:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: integer
     *                             example: 1
     *                           name:
     *                             type: string
     *                             example: "Parklands"
     *                           code:
     *                             type: string
     *                             example: "047001001"
     *                       settlement:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: integer
     *                             example: 1
     *                           name:
     *                             type: string
     *                             example: "Parklands Estate"
     *                           code:
     *                             type: string
     *                             example: "SET-001"
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       400:
     *         description: Bad request - project ID or code required
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Project ID or code is required"
     *       401:
     *         description: Unauthorized - invalid token
     *       403:
     *         description: Forbidden - insufficient permissions (project:read)
     *       404:
     *         description: No project locations found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "No project locations found"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "An unexpected error occurred while fetching project location details."
     */
   // app.post("/api/v1/project/location/details", [authJwt.verifyToken, hasPermission('project:read')], controller.getProjectLocationDetails);
    app.post("/api/v1/project/location/details", [], controller.getProjectLocationDetails);

    /**
     * @swagger
     * /api/v1/project/team/add:
     *   post:
     *     tags: [Projects]
     *     summary: Create or update a project team member
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: integer
     *               project_id:
     *                 type: integer
     *                 example: 1
     *               name:
     *                 type: string
     *               phone:
     *                 type: string
     *               email:
     *                 type: string
     *               role:
     *                 type: string
     *                 enum: ["Project Manager", "Regional Lead", "CDH", "Clerk of Works", "Other"]
     *               code:
     *                 type: string
     *     responses:
     *       200:
     *         description: Team member created or updated
     *       400:
     *         description: Validation or duplicate error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       500:
     *         description: Server error
     */
    app.post('/api/v1/project/team/add', [], controller.addProjectTeamMember);

    /**
     * @swagger
     * /api/v1/project/clock-in:
     *   post:
     *     tags: [Projects]
     *     summary: Clock in a team member to a project
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - project_id
     *               - team_member_id
     *             properties:
     *               project_id:
     *                 type: integer
     *                 example: 1
     *               team_member_id:
     *                 type: integer
     *                 example: 5
     *               geom:
     *                 type: object
     *                 description: GPS coordinates as GeoJSON geometry
     *                 example: {"type": "Point", "coordinates": [-1.2921, 36.8219]}
     *               notes:
     *                 type: string
     *                 example: "Starting work on foundation"
     *     responses:
     *       200:
     *         description: Team member clocked in successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Team member clocked in successfully"
     *                 data:
     *                   type: object
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       400:
     *         description: Validation error or already clocked in
     *       404:
     *         description: Team member not found for project
     *       500:
     *         description: Server error
     */
    app.post('/api/v1/project/clock-in', [], controller.clockInTeamMember);

    /**
     * @swagger
     * /api/v1/project/clock-out:
     *   post:
     *     tags: [Projects]
     *     summary: Clock out a team member from a project
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - project_id
     *               - team_member_id
     *             properties:
     *               project_id:
     *                 type: integer
     *                 example: 1
     *               team_member_id:
     *                 type: integer
     *                 example: 5
     *               notes:
     *                 type: string
     *                 example: "Completed foundation work"
     *     responses:
     *       200:
     *         description: Team member clocked out successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Team member clocked out successfully"
     *                 data:
     *                   type: object
     *                   properties:
     *                     total_hours:
     *                       type: number
     *                       example: 8.5
     *                     overtime_hours:
     *                       type: number
     *                       example: 0.5
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       400:
     *         description: Validation error
     *       404:
     *         description: No active clock-in session found
     *       500:
     *         description: Server error
     */
    app.post('/api/v1/project/clock-out', [], controller.clockOutTeamMember);

    /**
     * @swagger
     * /api/v1/project/clock-history:
     *   get:
     *     tags: [Projects]
     *     summary: Get clock-in history for team members or projects
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: project_id
     *         schema:
     *           type: integer
     *         description: Filter by project ID
     *         example: 1
     *       - in: query
     *         name: team_member_id
     *         schema:
     *           type: integer
     *         description: Filter by team member ID
     *         example: 5
     *       - in: query
     *         name: start_date
     *         schema:
     *           type: string
     *           format: date
     *         description: Start date for date range filter
     *         example: "2024-01-01"
     *       - in: query
     *         name: end_date
     *         schema:
     *           type: string
     *           format: date
     *         description: End date for date range filter
     *         example: "2024-01-31"
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [active, completed, cancelled]
     *         description: Filter by clock-in status
     *         example: "completed"
     *     responses:
     *       200:
     *         description: Clock-in history retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Clock-in history retrieved successfully"
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                       clock_in_time:
     *                         type: string
     *                         format: date-time
     *                       clock_out_time:
     *                         type: string
     *                         format: date-time
     *                       total_hours:
     *                         type: number
     *                       overtime_hours:
     *                         type: number
     *                       status:
     *                         type: string
     *                       teamMember:
     *                         type: object
     *                         properties:
     *                           name:
     *                             type: string
     *                           role:
     *                             type: string
     *                       project:
     *                         type: object
     *                         properties:
     *                           title:
     *                             type: string
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       500:
     *         description: Server error
     */
    app.get('/api/v1/project/clock-history', [], controller.getClockInHistory);

    /**
     * @swagger
     * /api/v1/project/active-clockins:
     *   get:
     *     tags: [Projects]
     *     summary: Get currently active clock-ins for a project
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: project_id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Project ID to get active clock-ins for
     *         example: 1
     *     responses:
     *       200:
     *         description: Active clock-ins retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Active clock-ins retrieved successfully"
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                       clock_in_time:
     *                         type: string
     *                         format: date-time
     *                       work_date:
     *                         type: string
     *                         format: date
     *                       teamMember:
     *                         type: object
     *                         properties:
     *                           name:
     *                             type: string
     *                           role:
     *                             type: string
     *                           phone:
     *                             type: string
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       400:
     *         description: Project ID is required
     *       500:
     *         description: Server error
     */
    app.get('/api/v1/project/active-clockins', [], controller.getActiveClockIns);

};