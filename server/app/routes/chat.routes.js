const { authJwt } = require("../middleware");
const controller = require("../controllers/chat.controller");
const { hasPermission } = require('../middleware/permission');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  /**
   * @swagger
   * /api/v1/chat/messages:
   *   post:
   *     tags: [Chat]
   *     summary: Get chat messages
   *     description: Retrieve chat messages with pagination and filtering options.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               limit:
   *                 type: integer
   *                 description: Number of messages to retrieve
   *                 example: 50
   *                 default: 50
   *               page:
   *                 type: integer
   *                 description: Page number for pagination
   *                 example: 1
   *                 default: 1
   *               receiver_id:
   *                 type: integer
   *                 description: User ID for private messages (null for general chat)
   *                 example: null
   *               since:
   *                 type: string
   *                 format: date-time
   *                 description: Get messages since this timestamp
   *                 example: "2024-01-01T00:00:00Z"
   *     responses:
   *       200:
   *         description: Messages retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         format: uuid
   *                       content:
   *                         type: string
   *                       message_type:
   *                         type: string
   *                         enum: [text, image, file]
   *                       sender:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                           email:
   *                             type: string
   *                           photo:
   *                             type: string
   *                       status:
   *                         type: string
   *                         enum: [sending, sent, delivered, read, failed]
   *                       created_at:
   *                         type: string
   *                         format: date-time
   *                 total:
   *                   type: integer
   *                 page:
   *                   type: integer
   *                 limit:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post("/api/v1/chat/messages", [authJwt.verifyToken], controller.getMessages);

  /**
   * @swagger
   * /api/v1/chat/send:
   *   post:
   *     tags: [Chat]
   *     summary: Send a message
   *     description: Send a new chat message to general chat or specific user.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content
   *             properties:
   *               content:
   *                 type: string
   *                 description: Message content
   *                 example: "Hello everyone!"
   *               message_type:
   *                 type: string
   *                 enum: [text, image, file]
   *                 default: text
   *                 description: Type of message
   *               receiver_id:
   *                 type: integer
   *                 description: User ID for private message (null for general chat)
   *                 example: null
   *     responses:
   *       200:
   *         description: Message sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Message sent successfully"
   *                 data:
   *                   type: object
   *                   description: The sent message with sender info
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       400:
   *         description: Bad request - missing or invalid content
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post("/api/v1/chat/send", [authJwt.verifyToken], controller.sendMessage);

  /**
   * @swagger
   * /api/v1/chat/status:
   *   post:
   *     tags: [Chat]
   *     summary: Update message status
   *     description: Update the delivery/read status of a message.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message_id
   *               - status
   *             properties:
   *               message_id:
   *                 type: string
   *                 format: uuid
   *                 description: ID of the message to update
   *               status:
   *                 type: string
   *                 enum: [delivered, read]
   *                 description: New status for the message
   *     responses:
   *       200:
   *         description: Message status updated successfully
   *       400:
   *         description: Bad request - invalid message ID or status
   *       403:
   *         description: Forbidden - cannot update own messages
   *       404:
   *         description: Message not found
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post("/api/v1/chat/status", [authJwt.verifyToken], controller.updateMessageStatus);

  /**
   * @swagger
   * /api/v1/chat/users/online:
   *   post:
   *     tags: [Chat]
   *     summary: Get online users
   *     description: Retrieve list of currently online users with their status.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Online users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       email:
   *                         type: string
   *                       avatar:
   *                         type: string
   *                       status:
   *                         type: string
   *                         enum: [online, away, busy]
   *                       lastSeen:
   *                         type: string
   *                         format: date-time
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post("/api/v1/chat/users/online", [authJwt.verifyToken], controller.getOnlineUsers);

  /**
   * @swagger
   * /api/v1/chat/user/status:
   *   post:
   *     tags: [Chat]
   *     summary: Update user status
   *     description: Update the current user's online status (online/away/busy/offline).
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [online, away, busy, offline]
   *                 description: User's new status
   *               is_online:
   *                 type: boolean
   *                 default: true
   *                 description: Whether user is online
   *     responses:
   *       200:
   *         description: User status updated successfully
   *       400:
   *         description: Bad request - invalid status
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post("/api/v1/chat/user/status", [authJwt.verifyToken], controller.updateUserStatus);
  /**
   * @swagger
   * /api/v1/chat/unread:
   *   post:
   *     tags: [Chat]
   *     summary: Get unread message count
   *     description: Get the number of unread messages for the current user.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Unread count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     unreadCount:
   *                       type: integer
   *                       example: 5
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post("/api/v1/chat/unread", [authJwt.verifyToken], controller.getUnreadCount);

  /**
   * @swagger
   * /api/v1/chat/mark-read:
   *   post:
   *     tags: [Chat]
   *     summary: Mark all messages as read
   *     description: Mark all unread messages as read for the current user.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Messages marked as read successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Marked 5 messages as read"
   *                 data:
   *                   type: object
   *                   properties:
   *                     markedCount:
   *                       type: integer
   *                       example: 5
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       401:
   *         description: Unauthorized - invalid token
   *       500:
   *         description: Internal server error
   */
  app.post("/api/v1/chat/mark-read", [authJwt.verifyToken], controller.markAllAsRead);

  /**
   * @swagger
   * /api/v1/chat/stats:
   *   get:
   *     tags: [Chat]
   *     summary: Get chat statistics
   *     description: Get overall chat statistics (admin only).
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Chat statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalMessages:
   *                       type: integer
   *                     totalUsers:
   *                       type: integer
   *                     onlineUsers:
   *                       type: integer
   *                     todayMessages:
   *                       type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       401:
   *         description: Unauthorized - invalid token
   *       403:
   *         description: Forbidden - admin access required
   *       500:
   *         description: Internal server error
   */
  app.get("/api/v1/chat/stats", [authJwt.verifyToken, authJwt.isAdmin], controller.getChatStats);

  /**
   * @swagger
   * /api/v1/chat/users/support-with-status:
   *   get:
   *     tags: [Chat]
   *     summary: Get support users with their online/offline status
   *     description: Get all users with support role and their current online/offline status for chat.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Support users with status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       email:
   *                         type: string
   *                       avatar:
   *                         type: string
   *                       status:
   *                         type: string
   *                         enum: [online, away, busy, offline]
   *                       lastSeen:
   *                         type: string
   *                         format: date-time
   *                       isOnline:
   *                         type: boolean
   *                       role:
   *                         type: string
   *                         example: "support"
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *       401:
   *         description: Unauthorized - invalid token
   *       404:
   *         description: Support role not found
   *       500:
   *         description: Internal server error
   */
  app.post("/api/v1/chat/users/support-with-status", [authJwt.verifyToken], controller.getSupportUsersWithStatus);

  /**
   * @swagger
   * /api/v1/chat/users:
   *   post:
   *     tags: [Chat]
   *     summary: Get chat users with photos
   *     description: Get all users that can participate in chat with their photos and status.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Chat users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       email:
   *                         type: string
   *                       username:
   *                         type: string
   *                       photo:
   *                         type: string
   *                         description: URL to user's photo
   *                       status:
   *                         type: string
   *                         enum: [online, away, busy, offline]
   *                       isOnline:
   *                         type: boolean
   *                       lastSeen:
   *                         type: string
   *                         format: date-time
   *                 total:
   *                   type: integer
   *                 code:
   *                   type: string
   *                   example: "0000"
   *                 message:
   *                   type: string
   *                   example: "Chat users retrieved successfully"
   *       401:
   *         description: Unauthorized - invalid token
   *       404:
   *         description: Support role not found
   *       500:
   *         description: Internal server error
   */
  app.post("/api/v1/chat/users", [authJwt.verifyToken], controller.getChatUsers);

  app.post('/api/v1/chat/xusers', [authJwt.verifyToken], controller.getChatUsers);
};
