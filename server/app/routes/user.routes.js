const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");
const { hasPermission } = require('../middleware/permission');
const { requireRootAdmin } = require('../middleware/requireRootAdmin');

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
   * /api/v1/user/all:
   *   post:
   *     tags: [Users]
   *     summary: Get all users (paginated, filtered)
   *     description: Retrieve all users with pagination, filtering, and role-based access. Excludes the current user and users with higher or equal roles.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currentUser:
   *                 type: object
   *                 description: Current user object (with roles)
   *               model:
   *                 type: string
   *                 example: users
   *               filters:
   *                 type: array
   *                 items: { type: string }
   *               filterValues:
   *                 type: array
   *                 items: { type: string }
   *               searchString:
   *                 type: string
   *               associated_multiple_models:
   *                 type: array
   *                 items: { type: string }
   *               limit:
   *                 type: integer
   *                 example: 10
   *               page:
   *                 type: integer
   *                 example: 1
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "Users retrieved successfully"
   */
  app.post("/api/v1/user/all", [authJwt.verifyToken, hasPermission('user:read')], controller.modelAllUsers);

  /**
   * @swagger
   * /api/v1/user/county:
   *   post:
   *     tags: [Users]
   *     summary: Get county users
   *     description: Retrieve users for a specific county, with pagination and filtering. Excludes the current user.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currentUser:
   *                 type: object
   *               filters:
   *                 type: array
   *                 items: { type: string }
   *               filterValues:
   *                 type: array
   *                 items: { type: string }
   *               limit:
   *                 type: integer
   *               page:
   *                 type: integer
   *     responses:
   *       200:
   *         description: County users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "County Users retrieved successfully"
   */
  app.post("/api/v1/user/county", [authJwt.verifyToken, hasPermission('user:read')], controller.modelCountyUsers);

  /**
   * @swagger
   * /api/v1/user/grm:
   *   post:
   *     tags: [Users]
   *     summary: Get GRM users
   *     description: Retrieve users with the GRM role, with pagination and filtering.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currentUser:
   *                 type: object
   *               filters:
   *                 type: array
   *                 items: { type: string }
   *               filterValues:
   *                 type: array
   *                 items: { type: string }
   *               limit:
   *                 type: integer
   *               page:
   *                 type: integer
   *     responses:
   *       200:
   *         description: GRM users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "GRM users retrieved successfully"
   */
  app.post("/api/v1/user/grm", [authJwt.verifyToken, hasPermission('user:read')], controller.modelGRMUsers);

  /**
   * @swagger
   * /api/v1/user/support:
   *   post:
   *     tags: [Users]
   *     summary: Get support users
   *     description: Retrieve users with support roles (roleid: 9).
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currentUser:
   *                 type: object
   *               filters:
   *                 type: array
   *                 items: { type: string }
   *               filterValues:
   *                 type: array
   *                 items: { type: string }
   *               limit:
   *                 type: integer
   *               page:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Support users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "Support users retrieved successfully"
   */
  app.post("/api/v1/user/support", [authJwt.verifyToken, hasPermission('user:read')], controller.modelSupportUsers);

  /**
   * @swagger
   * /api/v1/user/grm/location:
   *   post:
   *     tags: [Users]
   *     summary: Get GRM users by location
   *     description: Retrieve GRM users filtered by location (county, settlement, etc.).
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currentUser:
   *                 type: object
   *               county_id:
   *                 type: integer
   *               settlement_id:
   *                 type: integer
   *               filters:
   *                 type: array
   *                 items: { type: string }
   *               filterValues:
   *                 type: array
   *                 items: { type: string }
   *               limit:
   *                 type: integer
   *               page:
   *                 type: integer
   *     responses:
   *       200:
   *         description: GRM users by location retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "GRM users by location retrieved successfully"
   */
  app.post("/api/v1/user/grm/location", [authJwt.verifyToken, hasPermission('user:read')], controller.getGRMUsersByLocation);

  /**
   * @swagger
   * /api/v1/user/grm/settlement:
   *   post:
   *     tags: [Users]
   *     summary: Get settlement GRM users
   *     description: Retrieve GRM users linked to a specific settlement (roleid: 4, by settlement_id).
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               settlement_id:
   *                 type: integer
   *               limit:
   *                 type: integer
   *               page:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Settlement GRM users retrieved successfully
   */
  app.post("/api/v1/user/grm/settlement", [authJwt.verifyToken], controller.getSettlementGRMUsers);

  /**
   * @swagger
   * /api/v1/user/grm/county:
   *   post:
   *     tags: [Users]
   *     summary: Get county GRM users
   *     description: Retrieve GRM users linked to a specific county (roleid: 4, by county_id).
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               county_id:
   *                 type: integer
   *               limit:
   *                 type: integer
   *               page:
   *                 type: integer
   *     responses:
   *       200:
   *         description: County GRM users retrieved successfully
   */
  app.post("/api/v1/user/grm/county", [authJwt.verifyToken], controller.getCountyGRMUsers);

  /**
   * @swagger
   * /api/v1/user/grm/national:
   *   post:
   *     tags: [Users]
   *     summary: Get national GRM users
   *     description: Retrieve GRM users with location_level = 'national' (roleid: 4). No county_id/settlement_id required.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               limit:
   *                 type: integer
   *               page:
   *                 type: integer
   *     responses:
   *       200:
   *         description: National GRM users retrieved successfully
   */
  app.post("/api/v1/user/grm/national", [authJwt.verifyToken], controller.getNationalGRMUsers);

  /**
   * @swagger
   * /api/v1/user/by-ids:
   *   post:
   *     tags: [Users]
   *     summary: Get users by IDs and fields
   *     description: Retrieve specific users by their IDs and return only specified fields.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userIds:
   *                 type: array
   *                 items: { type: integer }
   *                 description: Array of user IDs to retrieve
   *               fields:
   *                 type: array
   *                 items: { type: string }
   *                 description: Array of field names to return (optional, defaults to id, name, phone, email, username)
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "Users retrieved successfully"
   */
  app.post("/api/v1/user/by-ids", [authJwt.verifyToken, hasPermission('user:read')], controller.getUsersByIds);

  /**
   * @swagger
   * /api/v1/user/admin:
   *   post:
   *     tags: [Users]
   *     summary: Get admin users
   *     description: Retrieve users with admin roles.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currentUser:
   *                 type: object
   *               filters:
   *                 type: array
   *                 items: { type: string }
   *               filterValues:
   *                 type: array
   *                 items: { type: string }
   *               limit:
   *                 type: integer
   *               page:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Admin users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "Admin users retrieved successfully"
   */
  app.post("/api/v1/user/admin", [authJwt.verifyToken, hasPermission('user:read')], controller.modelAdminUsers);

  app.post(
    "/api/v1/user/super-admin",
    [authJwt.verifyToken, requireRootAdmin, hasPermission('user:read')],
    controller.modelSuperAdminUsers
  );

  /**
   * @swagger
   * /api/v1/user/keyword:
   *   post:
   *     tags: [Users]
   *     summary: Search users by keyword
   *     description: Paginated search for users by keyword and field.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               model:
   *                 type: string
   *                 example: users
   *               searchField:
   *                 type: string
   *                 example: name
   *               searchKeyword:
   *                 type: string
   *                 example: John
   *               associated_multiple_models:
   *                 type: array
   *                 items: { type: string }
   *               limit:
   *                 type: integer
   *                 example: 10
   *               page:
   *                 type: integer
   *                 example: 1
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "Users retrieved successfully"
   */
  app.post("/api/v1/user/keyword", [authJwt.verifyToken, hasPermission('user:read')], controller.modelPaginatedUsersfilterBykeyWord);

  /**
   * @swagger
   * /api/v1/user/name:
   *   post:
   *     tags: [Users]
   *     summary: Get user by name
   *     description: Retrieve a user by their name.
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
   *                 example: John Doe
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "User retrieved successfully"
   */
  app.post("/api/v1/user/name", [authJwt.verifyToken, hasPermission('user:read')], controller.modelUserByName);

  /**
   * @swagger
   * /api/v1/user/check:
   *   post:
   *     tags: [Users]
   *     summary: Check if user exists
   *     description: Check if a user exists by username and phone. Returns user info and sends OTP if found.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - phone
   *             properties:
   *               username:
   *                 type: string
   *                 example: johndoe
   *               phone:
   *                 type: string
   *                 example: 254712345678
   *     responses:
   *       200:
   *         description: User found and OTP sent
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "User found."
   *                 user:
   *                   type: object
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       404:
   *         description: User not found
   *       400:
   *         description: Missing username or phone
   */
  app.post("/api/v1/user/check",  controller.checkUser);

  /**
   * @swagger
   * /api/v1/user/multiple:
   *   post:
   *     tags: [Users]
   *     summary: Check multiple users
   *     description: Check if multiple usernames exist. Returns an array of results.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - usernames
   *             properties:
   *               usernames:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["johndoe", "janedoe"]
   *     responses:
   *       200:
   *         description: Array of user existence results
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   username:
   *                     type: string
   *                   exists:
   *                     type: boolean
   *       400:
   *         description: Invalid input
   */
  app.post("/api/v1/user/multiple",  controller.checkUsers);

  /**
   * @swagger
   * /api/v1/user/delete:
   *   post:
   *     tags: [Users]
   *     summary: Delete user (cascade)
   *     description: Delete a user and all associated records. Requires OTP verification.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - otp
   *             properties:
   *               user_id:
   *                 type: integer
   *                 example: 1
   *               otp:
   *                 type: string
   *                 example: "1234"
   *     responses:
   *       200:
   *         description: User deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "User account and associated records deleted successfully."
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Missing user_id or otp
   *       401:
   *         description: Invalid or expired OTP
   *       404:
   *         description: User not found
   */
  app.post("/api/v1/user/delete", [authJwt.verifyToken, hasPermission('user:delete')], controller.deleteUserCascade);

  app.post("/api/v1/user/force-logout-others", [authJwt.verifyToken], controller.forceLogoutOthers);

  app.post("/api/v1/user/force-logout-all", [authJwt.verifyToken, authJwt.isSomeAdmin], controller.forceLogoutAll);

  app.post("/api/v1/user/:id/force-logout", [authJwt.verifyToken, authJwt.isSomeAdmin], controller.forceLogout);

  /**
   * @swagger
   * /api/v1/user/permissions:
   *   post:
   *     tags: [Users]
   *     summary: Get user permissions
   *     description: Retrieve all permissions for a user by user ID.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: integer
   *                 example: 1
   *     responses:
   *       200:
   *         description: User permissions retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "User permissions retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: string
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Missing userId
   *       404:
   *         description: User not found
   */
  app.post("/api/v1/user/permissions", [authJwt.verifyToken], controller.getUserPermissions);

  app.post("/api/v1/user/last-login", [authJwt.verifyToken, hasPermission('user:read')], controller.getUsersLastLogin);

  //app.post("/api/v1/roles/all", [authJwt.verifyToken, hasPermission('role:assign')], controller.rolesController);

  /**
   * @swagger
   * /api/v1/feedback/add:
   *   post:
   *     tags: [Users]
   *     summary: Submit feedback
   *     description: Submit feedback to the system.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               message:
   *                 type: string
   *                 example: "Great system!"
   *               user_id:
   *                 type: integer
   *                 example: 1
   *     responses:
   *       200:
   *         description: Feedback received
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "We have received your feedback. We will revert."
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       500:
   *         description: Unable to receive feedback
   */
  app.post("/api/v1/feedback/add", controller.sendFeedback);

  /**
   * @swagger
   * /api/v1/feedback/all:
   *   post:
   *     tags: [Users]
   *     summary: Get all feedback
   *     description: Retrieve all feedback records in the system.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Feedback retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { type: object }
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "Feedback received."
   */
  app.post("/api/v1/feedback/all", [authJwt.verifyToken, hasPermission('feedback:read')], controller.getFeedback);

 // Gets county users
 //app.get('/api/v1/user/county', [authJwt.verifyToken], controller.modelCountyUsers)



  /**
   * @swagger
   * /api/v1/user:
   *   get:
   *     tags: [Users]
   *     summary: Get current user profile
   *     description: Retrieve the profile of the currently authenticated user.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 20000
   *                 data:
   *                   type: object
   *                 thisUser:
   *                   type: object
   *                 userid:
   *                   type: integer
   */
  app.get(
    "/api/v1/user",
    [authJwt.verifyToken],
    controller.userBoard
  );


  
  /**
   * @swagger
   * /api/v1/mod:
   *   get:
   *     tags: [Users]
   *     summary: Get moderator board
   *     description: Retrieve content for moderators.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Moderator content
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               example: "Moderator Content."
   */
  app.get(
    "/api/v1/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

 
  /**
   * @swagger
   * /api/v1/admin:
   *   get:
   *     tags: [Users]
   *     summary: Get admin board
   *     description: Retrieve content for admins.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Admin content
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               example: "Admin Content."
   */
  app.get(
    "/api/v1/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  /**
   * @swagger
   * /api/v1/user/logout:
   *   post:
   *     tags: [Users]
   *     summary: Logout user
   *     description: Log out the current user and invalidate the session/token.
   *     responses:
   *       200:
   *         description: User logged out
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 status:
   *                   type: string
   *                   example: "Logged out"
   */
 


};