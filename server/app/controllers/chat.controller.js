const db = require('../models');
const config = require('../config/db.config.js');
const { authJwt } = require("../middleware");
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

// Create Sequelize connection like other controllers
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  port: config.PORT,
  dialect: config.dialect,
  operatorsAliases: false,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle
  }
});

/**
 * Get chat messages with pagination and filtering
 */
exports.getMessages = async (req, res) => {
  try {
    const {
      limit = 50,
      page = 1,
      receiver_id = null,
      since = null // Get messages since a specific timestamp
    } = req.body;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const whereClause = {
      receiver_id: receiver_id // null for general chat, user_id for private
    };

    // Add timestamp filter if provided
    if (since) {
      whereClause.created_at = {
        [Op.gte]: new Date(since)
      };
    }

    // Get messages with sender info
    const messages = await db.chatMessage.findAndCountAll({
      where: whereClause,
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'photo']
      }],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.status(200).json({
      data: messages.rows,
      total: messages.count,
      page: parseInt(page),
      limit: parseInt(limit),
      code: '0000'
    });

  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Send a new message
 */
exports.sendMessage = async (req, res) => {
  try {
    const {
      content,
      message_type = 'text',
      receiver_id = null // null for general chat
    } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        message: 'Message content is required',
        code: 'INVALID_INPUT'
      });
    }

    // Create the message
    const message = await db.chatMessage.create({
      content: content.trim(),
      message_type,
      sender_id: req.thisUser.id,
      receiver_id,
      status: 'sent'
    });

    // Get the message with sender info
    const messageWithSender = await db.chatMessage.findByPk(message.id, {
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'photo']
      }]
    });

    res.status(200).json({
      message: 'Message sent successfully',
      data: messageWithSender,
      code: '0000'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Update message status (delivered/read)
 */
exports.updateMessageStatus = async (req, res) => {
  try {
    const {
      message_id,
      status // 'delivered' or 'read'
    } = req.body;

    if (!message_id || !status) {
      return res.status(400).json({
        message: 'Message ID and status are required',
        code: 'INVALID_INPUT'
      });
    }

    if (!['delivered', 'read'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be "delivered" or "read"',
        code: 'INVALID_STATUS'
      });
    }

    // Check if message exists
    const message = await db.chatMessage.findByPk(message_id);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found',
        code: 'MESSAGE_NOT_FOUND'
      });
    }

    // Don't allow users to update status of their own messages
    if (message.sender_id === req.thisUser.id) {
      return res.status(403).json({
        message: 'Cannot update status of your own messages',
        code: 'FORBIDDEN'
      });
    }

    // Create or update message status
    const [statusRecord, created] = await db.chatMessageStatus.findOrCreate({
      where: {
        message_id,
        user_id: req.thisUser.id
      },
      defaults: {
        status,
        timestamp: new Date()
      }
    });

    if (!created && statusRecord.status !== status) {
      await statusRecord.update({
        status,
        timestamp: new Date()
      });
    }

    // Update main message status if it's read
    if (status === 'read') {
      await message.update({ status: 'read' });
    }

    res.status(200).json({
      message: 'Message status updated successfully',
      data: statusRecord,
      code: '0000'
    });

  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get online users
 */
exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await db.user.findAll({
      include: [{
        model: db.userStatus,
        as: 'status',
        where: { is_online: true },
        required: true
      }],
      attributes: ['id', 'name', 'email', 'photo']
    });

    const onlineUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.photo,
      status: user.status.status,
      lastSeen: user.status.last_seen
    }));

    res.status(200).json({
      data: onlineUsers,
      total: onlineUsers.length,
      code: '0000'
    });

  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Update user status
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const {
      status,
      is_online = true
    } = req.body;

    if (!status || !['online', 'away', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be one of: online, away, busy, offline',
        code: 'INVALID_STATUS'
      });
    }

    const [userStatus, created] = await db.userStatus.findOrCreate({
      where: { user_id: req.thisUser.id },
      defaults: {
        status,
        is_online,
        last_seen: new Date()
      }
    });

    if (!created) {
      await userStatus.update({
        status,
        is_online,
        last_seen: new Date()
      });
    }

    res.status(200).json({
      message: 'User status updated successfully',
      data: userStatus,
      code: '0000'
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get unread message count for current user
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.thisUser.id;

    // Count messages that are not sent by this user and haven't been read by them
    const count = await db.chatMessage.count({
      where: {
        [Op.and]: [
          { 
            [Op.or]: [
              { receiver_id: null }, // General chat
              { receiver_id: userId } // Direct messages to this user
            ]
          },
          { sender_id: { [Op.ne]: userId } }, // Not sent by this user
          {
            id: {
              [Op.notIn]: db.sequelize.literal(`
                (SELECT message_id FROM chat_message_status 
                 WHERE user_id = ${userId} AND status = 'read')
              `)
            }
          }
        ]
      }
    });

    res.status(200).json({
      data: { unreadCount: count },
      code: '0000'
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Mark all messages as read for current user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.thisUser.id;

    // Get all unread messages for this user
    const unreadMessages = await db.chatMessage.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { receiver_id: null }, // General chat
              { receiver_id: userId } // Direct messages
            ]
          },
          { sender_id: { [Op.ne]: userId } }, // Not sent by this user
          {
            id: {
              [Op.notIn]: db.sequelize.literal(`
                (SELECT message_id FROM chat_message_status 
                 WHERE user_id = ${userId} AND status = 'read')
              `)
            }
          }
        ]
      },
      attributes: ['id']
    });

    // Create read status for all unread messages
    const readStatuses = unreadMessages.map(msg => ({
      message_id: msg.id,
      user_id: userId,
      status: 'read',
      timestamp: new Date()
    }));

    if (readStatuses.length > 0) {
      await db.chatMessageStatus.bulkCreate(readStatuses, {
        updateOnDuplicate: ['status', 'timestamp']
      });
    }

    res.status(200).json({
      message: `Marked ${readStatuses.length} messages as read`,
      data: { markedCount: readStatuses.length },
      code: '0000'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get chat statistics (admin only)
 */
exports.getChatStats = async (req, res) => {
  try {
    const [
      totalMessages,
      totalUsers,
      onlineUsers,
      todayMessages
    ] = await Promise.all([
      db.chatMessage.count(),
      db.user.count(),
      db.userStatus.count({ where: { is_online: true } }),
      db.chatMessage.count({
        where: {
          created_at: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    res.status(200).json({
      data: {
        totalMessages,
        totalUsers,
        onlineUsers,
        todayMessages
      },
      code: '0000'
    });

  } catch (error) {
    console.error('Error getting chat stats:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get users with support role and their online/offline status
 * This endpoint returns all support users regardless of their online status
 */
exports.getSupportUsersWithStatus = async (req, res) => {
  try {
    // Get support role ID
    console.log('getSupportUsersWithStatus..........')
    const supportRole = await db.role.findOne({
      where: { name: 'support' },
      attributes: ['id']
    });

    if (!supportRole) {
      return res.status(404).json({
        message: 'Support role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    // Get all users with support role
    const supportUsers = await db.user.findAll({
      include: [
        {
          model: db.user_roles,
          required: true,
          where: {
            roleid: supportRole.id
          }
        },
        {
          model: db.userStatus,
          as: 'status',
          required: false // Include all users, even those without status
        }
      ],
      attributes: ['id', 'name', 'email', 'photo'],
      where: {
        id: { [db.Sequelize.Op.ne]: req.thisUser.id } // Exclude current user
      }
    });

    // Format users with their online status
    const formattedUsers = supportUsers.map(user => ({
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email || '',
      avatar: user.photo || '',
      status: user.status?.status || 'offline',
      lastSeen: user.status?.last_seen || null,
      isOnline: user.status?.is_online || false,
      role: 'support'
    }));

    res.status(200).json({
      data: formattedUsers,
      total: formattedUsers.length,
      code: '0000'
    });

  } catch (error) {
    console.error('Error getting support users with status:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};
