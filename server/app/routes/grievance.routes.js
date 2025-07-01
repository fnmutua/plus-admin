const controller = require('../controllers/grievance.controller')
const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })
 

  
  
  /**
   * @swagger
   * /api/v1/grv/code:
   *   post:
   *     tags: [Grievances]
   *     summary: Generate GRM code
   *     description: Generate a unique GRM (Grievance Redress Mechanism) code for new grievances
   *     responses:
   *       200:
   *         description: GRM code generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: string
   *                   example: GRM-2024-0001
   *                 message:
   *                   type: string
   *                   example: Code generated successfully.
   *       500:
   *         description: Internal server error
   */
  app.post('/api/v1/grv/code', controller.generateGRMCode)

  /**
   * @swagger
   * /api/v1/grv/create:
   *   post:
   *     tags: [Grievances]
   *     summary: Create grievance record
   *     description: Create a new grievance record with all required details
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GrievanceCreateRequest'
   *     responses:
   *       200:
   *         description: Grievance created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   *       500:
   *         description: Internal server error
   */
  app.post('/api/v1/grv/create', controller.createGrievanceRecord)

  /**
   * @swagger
   * /api/v1/grv/create/batch:
   *   post:
   *     tags: [Grievances]
   *     summary: Create batch grievance records
   *     description: Create multiple grievance records in a single request
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievances:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/GrievanceCreateRequest'
   *     responses:
   *       200:
   *         description: Batch grievances created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   *       500:
   *         description: Internal server error
   */
  app.post('/api/v1/grv/create/batch', controller.createGrievanceBatchRecords)
   

  


  /**
   * @swagger
   * /api/v1/grv/list:
   *   post:
   *     tags: [Grievances]
   *     summary: Get grievances list
   *     description: Retrieve list of grievances with filtering and pagination (requires authentication and grievance:read permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GrievanceListRequest'
   *     responses:
   *       200:
   *         description: Grievances retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Grievance'
   *                 total:
   *                   type: integer
   *                   description: Total number of grievances
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/grv/list', [authJwt.verifyToken, hasPermission('grievance:read')], controller.getGrievances)

  /**
   * @swagger
   * /api/v1/grv/one:
   *   post:
   *     tags: [Grievances]
   *     summary: Get grievance by ID
   *     description: Retrieve a specific grievance by its ID (requires authentication and grievance:read permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievanceId:
   *                 type: integer
   *                 description: Grievance ID
   *     responses:
   *       200:
   *         description: Grievance retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   $ref: '#/components/schemas/Grievance'
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/one', [authJwt.verifyToken, hasPermission('grievance:read')], controller.getGrievanceById)

  /**
   * @swagger
   * /api/v1/grv/public:
   *   post:
   *     tags: [Grievances]
   *     summary: Get grievance by public code
   *     description: Retrieve a grievance using its public code (no authentication required)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               pcode:
   *                 type: string
   *                 description: Public code of the grievance
   *     responses:
   *       200:
   *         description: Grievance retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   $ref: '#/components/schemas/Grievance'
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/public',   controller.getGrievanceByPublicId)

  /**
   * @swagger
   * /api/v1/grv/upload:
   *   post:
   *     tags: [Grievances]
   *     summary: Upload grievance document
   *     description: Upload documents/files to a specific grievance
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/GrievanceDocumentUploadRequest'
   *     responses:
   *       200:
   *         description: Document uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - invalid file or missing data
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/upload',   controller.uploadGrievanceDocument)

  /**
   * @swagger
   * /api/v1/grv/upload/pcode:
   *   post:
   *     tags: [Grievances]
   *     summary: Upload documents by grievance code
   *     description: Upload documents using grievance code instead of ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *                 description: Grievance code
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 description: Document files to upload
   *     responses:
   *       200:
   *         description: Documents uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - invalid file or missing data
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/upload/pcode',   controller.batchDocumentsUploadByGrievanceCode)
  /**
   * @swagger
   * /api/v1/grv/log:
   *   post:
   *     tags: [Grievances]
   *     summary: Log grievance action
   *     description: Log an action taken on a grievance
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GrievanceLogRequest'
   *     responses:
   *       200:
   *         description: Action logged successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/log',   controller.logGrievanceAction)

  /**
   * @swagger
   * /api/v1/grv/log/bulk:
   *   post:
   *     tags: [Grievances]
   *     summary: Bulk log grievance actions
   *     description: Log multiple actions for multiple grievances
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               logs:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/GrievanceLogRequest'
   *     responses:
   *       200:
   *         description: Actions logged successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   */
  app.post('/api/v1/grv/log/bulk',   controller.bulkLogGrievanceActions)

  /**
   * @swagger
   * /api/v1/grv/status:
   *   post:
   *     tags: [Grievances]
   *     summary: Get grievance status
   *     description: Retrieve the current status of a grievance
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievanceId:
   *                 type: integer
   *                 description: Grievance ID
   *     responses:
   *       200:
   *         description: Status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: Pending
   *                     current_level:
   *                       type: string
   *                       example: Level 1
   *                     current_status_date:
   *                       type: string
   *                       format: date-time
   *                     status_expiry_date:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/status',   controller.getGrievanceStatus)

  /**
   * @swagger
   * /api/v1/grv/status/update:
   *   post:
   *     tags: [Grievances]
   *     summary: Update grievance status
   *     description: Update the status of a grievance (requires authentication and grievance:update permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievanceId:
   *                 type: integer
   *                 description: Grievance ID
   *               status:
   *                 type: string
   *                 description: New status
   *               current_level:
   *                 type: string
   *                 description: New level
   *               reffered_to_officer:
   *                 type: integer
   *                 description: Officer ID to refer to
   *     responses:
   *       200:
   *         description: Status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/status/update', [authJwt.verifyToken, hasPermission('grievance:update')],  controller.updateGrievanceStatus)

  /**
   * @swagger
   * /api/v1/grv/update:
   *   post:
   *     tags: [Grievances]
   *     summary: Update grievance
   *     description: Update grievance details (requires authentication and grievance:update permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GrievanceUpdateRequest'
   *     responses:
   *       200:
   *         description: Grievance updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/update', [authJwt.verifyToken, hasPermission('grievance:update')],  controller.updateGrievance)

  /**
   * @swagger
   * /api/v1/grv/update/bulk:
   *   post:
   *     tags: [Grievances]
   *     summary: Bulk update referred to officer
   *     description: Bulk update the referred officer for multiple grievances (requires authentication and grievance:update permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievanceIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of grievance IDs
   *               reffered_to_officer:
   *                 type: integer
   *                 description: Officer ID to refer to
   *     responses:
   *       200:
   *         description: Grievances updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/grv/update/bulk', [authJwt.verifyToken, hasPermission('grievance:update')],  controller.bulkUpdateReferredToOfficer)

  /**
   * @swagger
   * /api/v1/grv/upsert:
   *   post:
   *     tags: [Grievances]
   *     summary: Import grievances
   *     description: Import grievances from external data source (upsert operation)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievances:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/GrievanceCreateRequest'
   *     responses:
   *       200:
   *         description: Grievances imported successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   */
  app.post('/api/v1/grv/upsert',   controller.modelImportGrievances)

  /**
   * @swagger
   * /api/v1/grv/keyword:
   *   post:
   *     tags: [Grievances]
   *     summary: Search grievances by keyword
   *     description: Search grievances using keywords (requires authentication and grievance:read permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               keyword:
   *                 type: string
   *                 description: Search keyword
   *               page:
   *                 type: integer
   *                 description: Page number
   *               limit:
   *                 type: integer
   *                 description: Number of items per page
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Grievance'
   *                 total:
   *                   type: integer
   *                   description: Total number of results
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/grv/keyword',[authJwt.verifyToken, hasPermission('grievance:read')],   controller.getGrievancesByKeyword)

  /**
   * @swagger
   * /api/v1/grv/phone:
   *   post:
   *     tags: [Grievances]
   *     summary: Get grievances by user phone
   *     description: Retrieve grievances associated with a specific phone number (requires authentication and grievance:read permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               phone:
   *                 type: string
   *                 description: Phone number
   *     responses:
   *       200:
   *         description: Grievances retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Grievance'
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  app.post('/api/v1/grv/phone', [authJwt.verifyToken, hasPermission('grievance:read')],  controller.getGrievanceByUserPhone)

  /**
   * @swagger
   * /api/v1/grv/history:
   *   post:
   *     tags: [Grievances]
   *     summary: Get grievance history
   *     description: Retrieve the history/logs of a specific grievance (requires authentication and grievance:read permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievanceId:
   *                 type: integer
   *                 description: Grievance ID
   *     responses:
   *       200:
   *         description: History retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       grievance_id:
   *                         type: integer
   *                       action:
   *                         type: string
   *                       description:
   *                         type: string
   *                       user_id:
   *                         type: integer
   *                       created_at:
   *                         type: string
   *                         format: date-time
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/history', [authJwt.verifyToken, hasPermission('grievance:read')],  controller.getGrievanceHistoryByGrievanceId)

  /**
   * @swagger
   * /api/v1/grv/self/escalate:
   *   post:
   *     tags: [Grievances]
   *     summary: Self-escalate grievance
   *     description: Allow complainant to escalate their own grievance
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievanceId:
   *                 type: integer
   *                 description: Grievance ID
   *               reason:
   *                 type: string
   *                 description: Reason for escalation
   *     responses:
   *       200:
   *         description: Grievance escalated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/self/escalate',   controller.updateGrievanceStatusByComplainant)

  /**
   * @swagger
   * /api/v1/grv/reminder:
   *   post:
   *     tags: [Grievances]
   *     summary: Send grievance reminder
   *     description: Send reminder notifications for pending grievances (requires authentication and grievance:read permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievanceId:
   *                 type: integer
   *                 description: Grievance ID
   *               message:
   *                 type: string
   *                 description: Reminder message
   *     responses:
   *       200:
   *         description: Reminder sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/reminder', [authJwt.verifyToken, hasPermission('grievance:read')],   controller.sendReminder)

  /**
   * @swagger
   * /api/v1/grv/delete:
   *   post:
   *     tags: [Grievances]
   *     summary: Delete grievance
   *     description: Delete a grievance and all associated data (requires authentication and grievance:delete permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievanceId:
   *                 type: integer
   *                 description: Grievance ID to delete
   *     responses:
   *       200:
   *         description: Grievance deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/delete', [authJwt.verifyToken, hasPermission('grievance:delete')],  controller.deleteCascadeGrievance)

  /**
   * @swagger
   * /api/v1/grv/revert:
   *   post:
   *     tags: [Grievances]
   *     summary: Revert grievance edits
   *     description: Revert changes made to a grievance (requires authentication and grievance:update permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               grievanceId:
   *                 type: integer
   *                 description: Grievance ID
   *               version:
   *                 type: integer
   *                 description: Version to revert to
   *     responses:
   *       200:
   *         description: Grievance reverted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Grievance not found
   */
  app.post('/api/v1/grv/revert', [authJwt.verifyToken, hasPermission('grievance:update')],  controller.revertEdits)

  /**
   * @swagger
   * /api/v1/grv/download:
   *   post:
   *     tags: [Grievances]
   *     summary: Download grievance file
   *     description: Download a file associated with a grievance
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               filename:
   *                 type: string
   *                 description: Name of the file to download
   *     responses:
   *       200:
   *         description: File downloaded successfully
   *         content:
   *           application/octet-stream:
   *             schema:
   *               type: string
   *               format: binary
   *       404:
   *         description: File not found
   */
  app.post(
    "/api/v1/grv/download",  controller.downloadFile
  );

}
