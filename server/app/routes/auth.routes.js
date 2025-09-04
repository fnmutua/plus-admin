const { verifySignUp } = require('../middleware')
const controller = require('../controllers/auth.controller')
const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  /**
   * @swagger
   * /api/auth/signup:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Register a new user
   *     description: Create a new user account with validation for duplicate username/email and roles
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SignupRequest'
   *     responses:
   *       200:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   *       409:
   *         description: Conflict - username or email already exists
   */
  app.post(
    '/api/auth/signup',[verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
    controller.signup
  )

  // app.post(
  //   '/api/auth/signup',[verifySignUp.checkRolesExisted],
  //   controller.signup
  // )

  /**
   * @swagger
   * /api/auth/update:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Update user information
   *     description: Update user details (requires authentication and user:update permission)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: ID of the user to update
   *               name:
   *                 type: string
   *                 description: User's full name
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User's email address
   *               phone:
   *                 type: string
   *                 description: User's phone number
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: User not found
   */
  app.post('/api/auth/update', [authJwt.verifyToken, hasPermission('user:update')], controller.updateUser)

  //app.post("/api/v1/user/county", [authJwt.verifyToken, authJwt.isAdminOrCountyAdmin],controller.modelCountyUsers);

  /**
   * @swagger
   * /api/auth/profile/update:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Update current user's profile
   *     description: Update the authenticated user's own profile information
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: User's full name
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User's email address
   *               phone:
   *                 type: string
   *                 description: User's phone number
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   */
  app.post('/api/auth/profile/update', [authJwt.verifyToken], controller.updateByUser)

  /**
   * @swagger
   * /api/v1/user/activate:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Activate a user account
   *     description: Activate a user account (requires authentication)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: ID of the user to activate
   *     responses:
   *       200:
   *         description: User activated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   *       404:
   *         description: User not found
   */
  app.post('/api/v1/user/activate', [authJwt.verifyToken], controller.modelActivateUser)

  /**
   * @swagger
   * /api/auth/signin:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: User login
   *     description: Authenticate user and return JWT token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Invalid credentials or inactive account
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/api/auth/signin', controller.signin)

  /**
   * @swagger
   * /api/auth/reset:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Reset password
   *     description: Send password reset email/SMS
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User's email address
   *     responses:
   *       200:
   *         description: Password reset email sent
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/api/auth/reset', controller.reset)

  /**
   * @swagger
   * /api/auth/set:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Update password
   *     description: Update user password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: User ID
   *               newPassword:
   *                 type: string
   *                 description: New password
   *               resetToken:
   *                 type: string
   *                 description: Password reset token
   *     responses:
   *       200:
   *         description: Password updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Invalid reset token
   *       404:
   *         description: User not found
   */
  app.post('/api/auth/set', controller.updatePassword)

  /**
   * @swagger
   * /api/auth/county:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Get counties
   *     description: Retrieve list of counties
   *     responses:
   *       200:
   *         description: Counties retrieved successfully
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
   *                       name:
   *                         type: string
   *                       code:
   *                         type: string
   */
  app.get('/api/auth/county', controller.countyController)

  /**
   * @swagger
   * /api/auth/county/one:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get single county
   *     description: Retrieve a specific county by ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               countyId:
   *                 type: integer
   *                 description: County ID
   *     responses:
   *       200:
   *         description: County retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   $ref: '#/components/schemas/County'
   *       404:
   *         description: County not found
   */
  app.post('/api/auth/county/one', controller.getOneCountyController)

  /**
   * @swagger
   * /api/auth/county/location:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get county by location
   *     description: Retrieve county information based on geographic coordinates
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               latitude:
   *                 type: number
   *                 description: Latitude coordinate
   *               longitude:
   *                 type: number
   *                 description: Longitude coordinate
   *     responses:
   *       200:
   *         description: County found for location
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   $ref: '#/components/schemas/County'
   *       404:
   *         description: No county found for location
   */
  app.post('/api/auth/county/location', controller.countyByLocationController)

  /**
   * @swagger
   * /api/auth/ward/location:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get ward by location
   *     description: Retrieve ward information based on geographic coordinates
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               latitude:
   *                 type: number
   *                 description: Latitude coordinate
   *               longitude:
   *                 type: number
   *                 description: Longitude coordinate
   *     responses:
   *       200:
   *         description: Ward found for location
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   $ref: '#/components/schemas/Ward'
   *       404:
   *         description: No ward found for location
   */
  app.post('/api/auth/ward/location', controller.WardByLocationController)

  /**
   * @swagger
   * /api/auth/county/post:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Create county
   *     description: Create a new county (requires authentication)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: County name
   *               code:
   *                 type: string
   *                 description: County code
   *     responses:
   *       200:
   *         description: County created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   */
  app.post('/api/auth/county/post', controller.countyPostController)

  /**
   * @swagger
   * /api/auth/subcounty:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get subcounties
   *     description: Retrieve list of subcounties
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               countyId:
   *                 type: integer
   *                 description: County ID to filter subcounties
   *     responses:
   *       200:
   *         description: Subcounties retrieved successfully
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
   *                     $ref: '#/components/schemas/Subcounty'
   */
  app.post('/api/auth/subcounty', controller.subCountyController)

  /**
   * @swagger
   * /api/auth/settlement:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get settlements
   *     description: Retrieve list of settlements
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               wardId:
   *                 type: integer
   *                 description: Ward ID to filter settlements
   *     responses:
   *       200:
   *         description: Settlements retrieved successfully
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
   *                     $ref: '#/components/schemas/Settlement'
   */
  app.post('/api/auth/settlement', controller.settlementController)

  /**
   * @swagger
   * /api/auth/ward:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get wards
   *     description: Retrieve list of wards
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               subcountyId:
   *                 type: integer
   *                 description: Subcounty ID to filter wards
   *     responses:
   *       200:
   *         description: Wards retrieved successfully
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
   *                     $ref: '#/components/schemas/Ward'
   */
  app.post('/api/auth/ward', controller.wardController)

  /**
   * @swagger
   * /api/auth/profile:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get user profile
   *     description: Retrieve current user's profile information
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized - invalid token
   */
  app.post('/api/auth/profile', controller.myProfile)

  /**
   * @swagger
   * /api/auth/county/all:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get all counties
   *     description: Retrieve all counties with pagination
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               page:
   *                 type: integer
   *                 description: Page number
   *               limit:
   *                 type: integer
   *                 description: Number of items per page
   *     responses:
   *       200:
   *         description: Counties retrieved successfully
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
   *                     $ref: '#/components/schemas/County'
   *                 total:
   *                   type: integer
   *                   description: Total number of counties
   */
  app.post('/api/auth/county/all', controller.countyAllController)

  /**
   * @swagger
   * /api/auth/subcounty/all:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get all subcounties
   *     description: Retrieve all subcounties with pagination
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               page:
   *                 type: integer
   *                 description: Page number
   *               limit:
   *                 type: integer
   *                 description: Number of items per page
   *               countyId:
   *                 type: integer
   *                 description: Filter by county ID
   *     responses:
   *       200:
   *         description: Subcounties retrieved successfully
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
   *                     $ref: '#/components/schemas/Subcounty'
   *                 total:
   *                   type: integer
   *                   description: Total number of subcounties
   */
  app.post('/api/auth/subcounty/all', controller.subCountyAllController)

  /**
   * @swagger
   * /api/auth/ward/all:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get all wards
   *     description: Retrieve all wards with pagination
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               page:
   *                 type: integer
   *                 description: Page number
   *               limit:
   *                 type: integer
   *                 description: Number of items per page
   *               subcountyId:
   *                 type: integer
   *                 description: Filter by subcounty ID
   *     responses:
   *       200:
   *         description: Wards retrieved successfully
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
   *                     $ref: '#/components/schemas/Ward'
   *                 total:
   *                   type: integer
   *                   description: Total number of wards
   */
  app.post('/api/auth/ward/all', controller.wardAllController)

  /**
   * @swagger
   * /api/auth/settlement/all:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get all settlements
   *     description: Retrieve all settlements with pagination
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               page:
   *                 type: integer
   *                 description: Page number
   *               limit:
   *                 type: integer
   *                 description: Number of items per page
   *               wardId:
   *                 type: integer
   *                 description: Filter by ward ID
   *     responses:
   *       200:
   *         description: Settlements retrieved successfully
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
   *                     $ref: '#/components/schemas/Settlement'
   *                 total:
   *                   type: integer
   *                   description: Total number of settlements
   */
  app.post('/api/auth/settlement/all', controller.settlementAllController)

  /**
   * @swagger
   * /api/auth/settlement/bycounty:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Get settlements by county
   *     description: Retrieve all settlements within a specific county
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               countyId:
   *                 type: integer
   *                 description: County ID
   *     responses:
   *       200:
   *         description: Settlements retrieved successfully
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
   *                     $ref: '#/components/schemas/Settlement'
   */
  app.post('/api/auth/settlement/bycounty', controller.settlementByCountyController)

  // Signups via APP
  /**
   * @swagger
   * /api/app/signup:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Mobile app user registration
   *     description: Register a new user via mobile app with phone validation
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 description: Username
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email address
   *               phone:
   *                 type: string
   *                 description: Phone number
   *               password:
   *                 type: string
   *                 description: Password
   *               name:
   *                 type: string
   *                 description: Full name
   *     responses:
   *       200:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   *       409:
   *         description: Conflict - phone or email already exists
   */
  app.post('/api/app/signup',  [verifySignUp.checkDuplicatePhone, verifySignUp.checkDuplicateUsernameOrEmail],  controller.signupViaApp)

  /**
   * @swagger
   * /api/app/signup/grc:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: GRC user registration
   *     description: Register a new GRC (Grievance Redress Committee) user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 description: Username
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email address
   *               phone:
   *                 type: string
   *                 description: Phone number
   *               password:
   *                 type: string
   *                 description: Password
   *               name:
   *                 type: string
   *                 description: Full name
   *     responses:
   *       200:
   *         description: GRC user registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   *       409:
   *         description: Conflict - phone or email already exists
   */
  app.post('/api/app/signup/grc',  [verifySignUp.checkDuplicatePhone, verifySignUp.checkDuplicateUsernameOrEmail],  controller.signupGRC)

  /**
   * @swagger
   * /api/app/signup/grm:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: GRM user registration
   *     description: Register a new GRM (Grievance Redress Mechanism) user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 description: Username
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email address
   *               phone:
   *                 type: string
   *                 description: Phone number
   *               password:
   *                 type: string
   *                 description: Password
   *               name:
   *                 type: string
   *                 description: Full name
   *     responses:
   *       200:
   *         description: GRM user registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Bad request - validation error
   *       409:
   *         description: Conflict - phone or email already exists
   */
  app.post('/api/app/signup/grm',  [verifySignUp.checkDuplicatePhone, verifySignUp.checkDuplicateUsernameOrEmail],  controller.signupGRM)

  // Signin via APP
  /**
   * @swagger
   * /api/app/signin:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Mobile app user login
   *     description: Authenticate user via mobile app using phone number
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
   *         description: OTP sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: 'Check your phone for login verification SMS!'
   *                 code:
   *                   type: string
   *                   example: '0000'
   *                 data:
   *                   type: integer
   *                   description: OTP code (for testing)
   *       404:
   *         description: No account associated with phone number
   *       401:
   *         description: Account deactivated
   */
  app.post(
  '/api/app/signin',  
  controller.signinViaApp
  )

  //verify OTP code 
  /**
   * @swagger
   * /api/app/verify:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Verify OTP code
   *     description: Verify OTP code sent to user's phone for mobile app login
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               otp:
   *                 type: string
   *                 description: 4-digit OTP code
   *     responses:
   *       200:
   *         description: OTP verified successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Invalid or expired OTP code
   *       404:
   *         description: OTP not found
   */
        app.post(
        '/api/app/verify',  [],
        controller.verifyCode
        )
 
        
        app.post(
          '/api/app/signout',  
          controller.Logout
          )

  /**
   * @swagger
   * /api/auth/signout:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: User logout
   *     description: Logout user and track session
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: User ID
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized - invalid token
   */
  app.post('/api/auth/signout', [authJwt.verifyToken], controller.Logout)
}
