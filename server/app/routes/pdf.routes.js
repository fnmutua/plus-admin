const { authJwt } = require("../middleware");
const controller = require("../controllers/pdf.controller");
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
     * /api/v1/pdf:
     *   post:
     *     tags: [PDF]
     *     summary: Generate PDF document
     *     description: Generate a PDF document based on form data and template type. Supports filling PDF forms with dynamic data and embedding QR codes.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - type
     *               - grievance_id
     *             properties:
     *               type:
     *                 type: string
     *                 description: Type of PDF template to use (e.g., 'acknowledgement', 'acknowledgement2')
     *                 example: acknowledgement
     *               grievance_id:
     *                 type: string
     *                 description: Grievance ID for QR code generation
     *                 example: 6652e0486b49fb5075942951
     *               action_id:
     *                 type: string
     *                 description: Action ID associated with the document
     *                 example: action123
     *               name:
     *                 type: string
     *                 description: Complainant's name
     *                 example: John Doe
     *               phone:
     *                 type: string
     *                 description: Contact phone number
     *                 example: 254712345678
     *               address:
     *                 type: string
     *                 description: Physical address
     *                 example: 123 Main Street, Nairobi
     *               nature:
     *                 type: string
     *                 description: Nature of the grievance
     *                 example: Infrastructure
     *               description:
     *                 type: string
     *                 description: Detailed description of the grievance
     *                 example: Road in poor condition requiring immediate repair
     *               date_reported:
     *                 type: string
     *                 format: date
     *                 description: Date when grievance was reported
     *                 example: 2024-01-15
     *               status:
     *                 type: string
     *                 description: Current status of the grievance
     *                 example: Pending
     *               current_level:
     *                 type: string
     *                 description: Current processing level
     *                 example: Level 1
     *               isgbv:
     *                 type: boolean
     *                 description: Whether this is a GBV case
     *                 example: false
     *               self_reported:
     *                 type: boolean
     *                 description: Whether the grievance was self-reported
     *                 example: true
     *               reporter_name:
     *                 type: string
     *                 description: Name of reporter if not self-reported
     *                 example: Jane Smith
     *               reporter_phone:
     *                 type: string
     *                 description: Phone number of reporter
     *                 example: 254798765432
     *               witness:
     *                 type: string
     *                 description: Witness information
     *                 example: Witness statement details
     *               witness_phone:
     *                 type: string
     *                 description: Witness phone number
     *                 example: 254711223344
     *               plea:
     *                 type: string
     *                 description: Requested action or plea
     *                 example: Request for immediate road repair
     *               county:
     *                 type: string
     *                 description: County name
     *                 example: Nairobi County
     *               subcounty:
     *                 type: string
     *                 description: Subcounty name
     *                 example: Westlands Subcounty
     *               ward:
     *                 type: string
     *                 description: Ward name
     *                 example: Westlands Ward
     *               settlement:
     *                 type: string
     *                 description: Settlement name
     *                 example: Westlands Settlement
     *     responses:
     *       200:
     *         description: PDF generated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 code:
     *                   type: string
     *                   example: '0000'
     *                 message:
     *                   type: string
     *                   example: File generated and saved successfully
     *                 filePath:
     *                   type: string
     *                   description: Path where the PDF file was saved
     *                   example: /data/grievances/abc123def.pdf
     *       400:
     *         description: Bad request - missing required fields or invalid data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Missing required fields
     *       500:
     *         description: Internal server error during PDF generation
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Unable to generate document
     */
    app.post("/api/v1/pdf", controller.generatePDF);

    /**
     * @swagger
     * /api/v1/pdf/timeline:
     *   post:
     *     tags: [PDF]
     *     summary: Generate timeline PDF
     *     description: Generate a PDF document showing the timeline of events for a specific grievance. Creates a visual timeline with all actions, status changes, and events.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - events
     *               - grievance_code
     *               - type
     *             properties:
     *               events:
     *                 type: array
     *                 description: Array of timeline events
     *                 items:
     *                   type: object
     *                   properties:
     *                     date:
     *                       type: string
     *                       format: date-time
     *                       description: Date and time of the event
     *                       example: 2024-01-15T10:30:00Z
     *                     action:
     *                       type: string
     *                       description: Action taken or event description
     *                       example: Grievance received and acknowledged
     *                     status:
     *                       type: string
     *                       description: Status after the action
     *                       example: Pending
     *                     level:
     *                       type: string
     *                       description: Processing level
     *                       example: Level 1
     *                     officer:
     *                       type: string
     *                       description: Officer responsible for the action
     *                       example: John Smith
     *                     notes:
     *                       type: string
     *                       description: Additional notes or comments
     *                       example: Initial review completed
     *               grievance_code:
     *                 type: string
     *                 description: Unique grievance code
     *                 example: GRM-2024-0001
     *               grievance_id:
     *                 type: string
     *                 description: Grievance ID (optional, for backward compatibility)
     *                 example: 6652e0486b49fb5075942951
     *               type:
     *                 type: string
     *                 description: Type of timeline document
     *                 example: timeline
     *               details:
     *                 type: string
     *                 description: Additional details about the grievance
     *                 example: Detailed description of the grievance timeline
     *               status:
     *                 type: string
     *                 description: Current status of the grievance
     *                 example: In Progress
     *               settlement:
     *                 type: string
     *                 description: Settlement name where grievance occurred
     *                 example: Westlands Settlement
     *     responses:
     *       200:
     *         description: Timeline PDF generated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 code:
     *                   type: string
     *                   example: '0000'
     *                 message:
     *                   type: string
     *                   example: Timeline PDF generated successfully
     *                 filePath:
     *                   type: string
     *                   description: Path where the PDF file was saved
     *                   example: /data/grievances/timeline_abc123def.pdf
     *       400:
     *         description: Bad request - missing required fields or invalid data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Events array is required and cannot be empty
     *       500:
     *         description: Internal server error during PDF generation
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Unable to generate timeline document
     */
    app.post("/api/v1/pdf/timeline", controller.generateTimelinePDF);
 
 


};