const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const authJwt = require('../middleware/authJwt');
const { verifyToken } = require('../middleware/authJwt');

// Get all active streams
router.get('/active', async (req, res) => {
  try {
    const streams = await db.videoStream.findAll({
      where: {
        status: 'live'
      },
      include: [
        {
          model: db.user,
          as: 'streamer',
          attributes: ['id', 'name', 'email', 'photo']
        }
      ],
      order: [['start_time', 'DESC']]
    });

    // Convert user photos to base64 if they exist
    streams.forEach(stream => {
      if (stream.streamer && stream.streamer.photo && Buffer.isBuffer(stream.streamer.photo)) {
        stream.streamer.photo = 'data:image/png;base64,' + stream.streamer.photo.toString('base64');
      }
    });

    res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    console.error('Error fetching active streams:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active streams',
      error: error.message
    });
  }
});

// Search streams (must come before /:streamId route)
router.get('/search', async (req, res) => {
  try {
    const { q, county, status = 'live', limit = 20, offset = 0 } = req.query;

    const whereClause = {
      status: status
    };

    if (county) {
      whereClause.county = county;
    }

    if (q) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const streams = await db.videoStream.findAll({
      where: whereClause,
      include: [
        {
          model: db.user,
          as: 'streamer',
          attributes: ['id', 'name', 'email', 'photo']
        }
      ],
      order: [['start_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Convert user photos to base64 if they exist
    streams.forEach(stream => {
      if (stream.streamer && stream.streamer.photo && Buffer.isBuffer(stream.streamer.photo)) {
        stream.streamer.photo = 'data:image/png;base64,' + stream.streamer.photo.toString('base64');
      }
    });

    res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    console.error('Error searching streams:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching streams',
      error: error.message
    });
  }
});

// Get stream by ID
router.get('/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await db.videoStream.findByPk(streamId, {
      include: [
        {
          model: db.user,
          as: 'streamer',
          attributes: ['id', 'name', 'email', 'photo']
        },
        {
          model: db.streamChatMessage,
          as: 'chatMessages',
          include: [
            {
              model: db.user,
              as: 'user',
              attributes: ['id', 'name', 'photo']
            }
          ],
          order: [['timestamp', 'ASC']],
          limit: 100
          }
      ]
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    // Convert user photos to base64 if they exist
    if (stream.streamer && stream.streamer.photo && Buffer.isBuffer(stream.streamer.photo)) {
      stream.streamer.photo = 'data:image/png;base64,' + stream.streamer.photo.toString('base64');
    }

    stream.chatMessages.forEach(message => {
      if (message.user && message.user.photo && Buffer.isBuffer(message.user.photo)) {
        message.user.photo = 'data:image/png;base64,' + message.user.photo.toString('base64');
      }
    });

    res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    console.error('Error fetching stream:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stream',
      error: error.message
    });
  }
});

// Get user's streams
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    const whereClause = { user_id: userId };
    if (status) {
      whereClause.status = status;
    }

    const streams = await db.videoStream.findAll({
      where: whereClause,
      include: [
        {
          model: db.user,
          as: 'streamer',
          attributes: ['id', 'name', 'email', 'photo']
        }
      ],
      order: [['start_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Convert user photos to base64 if they exist
    streams.forEach(stream => {
      if (stream.streamer && stream.streamer.photo && Buffer.isBuffer(stream.streamer.photo)) {
        stream.streamer.photo = 'data:image/png;base64,' + stream.streamer.photo.toString('base64');
      }
    });

    res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    console.error('Error fetching user streams:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user streams',
      error: error.message
    });
  }
});

// Create a new stream
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, settings, location, county, isPublic = true, tags } = req.body;
    const userId = req.userId;

    const stream = await db.videoStream.create({
      title: title || 'Live Stream',
      description: description || '',
      user_id: userId,
      status: 'live',
      settings: settings ? JSON.stringify(settings) : null,
      location: location || null,
      county: county || null,
      is_public: isPublic,
      tags: tags ? JSON.stringify(tags) : null
    });

    res.json({
      success: true,
      data: stream,
      message: 'Stream created successfully'
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating stream',
      error: error.message
    });
  }
});

// Update stream
router.put('/:streamId', verifyToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.userId;
    const updates = req.body;

    // Check if user owns the stream
    const stream = await db.videoStream.findOne({
      where: {
        id: streamId,
        user_id: userId
      }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found or you do not have permission to update it'
      });
    }

    // Update stream
    await stream.update(updates);

    res.json({
      success: true,
      data: stream,
      message: 'Stream updated successfully'
    });
  } catch (error) {
    console.error('Error updating stream:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stream',
      error: error.message
    });
  }
});

// End stream
router.post('/:streamId/end', verifyToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.userId;

    // Check if user owns the stream
    const stream = await db.videoStream.findOne({
      where: {
        id: streamId,
        user_id: userId
      }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found or you do not have permission to end it'
      });
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.floor((endTime - stream.start_time) / 1000);

    // Update stream
    await stream.update({
      status: 'ended',
      end_time: endTime,
      duration: duration
    });

    res.json({
      success: true,
      data: stream,
      message: 'Stream ended successfully'
    });
  } catch (error) {
    console.error('Error ending stream:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending stream',
      error: error.message
    });
  }
});

// Get stream chat messages
router.get('/:streamId/chat', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const messages = await db.streamChatMessage.findAll({
      where: {
        stream_id: streamId,
        is_deleted: false
      },
      include: [
        {
          model: db.user,
          as: 'user',
          attributes: ['id', 'name', 'photo']
        }
      ],
      order: [['timestamp', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Convert user photos to base64 if they exist
    messages.forEach(message => {
      if (message.user && message.user.photo && Buffer.isBuffer(message.user.photo)) {
        message.user.photo = 'data:image/png;base64,' + message.user.photo.toString('base64');
      }
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching stream chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stream chat messages',
      error: error.message
    });
  }
});

// Post chat message to stream
router.post('/:streamId/chat', verifyToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const { message, messageType = 'text' } = req.body;
    const userId = req.userId;

    // Check if stream exists and is live
    const stream = await db.videoStream.findByPk(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is not live'
      });
    }

    // Create chat message
    const chatMessage = await db.streamChatMessage.create({
      stream_id: streamId,
      user_id: userId,
      message: message,
      message_type: messageType
    });

    // Get message with user info
    const messageWithUser = await db.streamChatMessage.findByPk(chatMessage.id, {
      include: [
        {
          model: db.user,
          as: 'user',
          attributes: ['id', 'name', 'photo']
        }
      ]
    });

    // Convert user photo to base64 if it exists
    if (messageWithUser.user && messageWithUser.user.photo && Buffer.isBuffer(messageWithUser.user.photo)) {
      messageWithUser.user.photo = 'data:image/png;base64,' + messageWithUser.user.photo.toString('base64');
    }

    res.json({
      success: true,
      data: messageWithUser,
      message: 'Message posted successfully'
    });
  } catch (error) {
    console.error('Error posting chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error posting chat message',
      error: error.message
    });
  }
});

// Delete stream
router.delete('/:streamId', verifyToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.userId;

    // Check if user owns the stream
    const stream = await db.videoStream.findOne({
      where: {
        id: streamId,
        user_id: userId
      }
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found or you do not have permission to delete it'
      });
    }

    // Delete stream and related data
    await db.sequelize.transaction(async (t) => {
      // Delete chat messages
      await db.streamChatMessage.destroy({
        where: { stream_id: streamId },
        transaction: t
      });

      // Delete stream
      await stream.destroy({ transaction: t });
    });

    res.json({
      success: true,
      message: 'Stream deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stream:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting stream',
      error: error.message
    });
  }
});

// Get streams by county
router.get('/county/:county', async (req, res) => {
  try {
    const { county } = req.params;
    const { status = 'live', limit = 20, offset = 0 } = req.query;

    const streams = await db.videoStream.findAll({
      where: {
        county: county,
        status: status
      },
      include: [
        {
          model: db.user,
          as: 'streamer',
          attributes: ['id', 'name', 'email', 'photo']
        }
      ],
      order: [['start_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Convert user photos to base64 if they exist
    streams.forEach(stream => {
      if (stream.streamer && stream.streamer.photo && Buffer.isBuffer(stream.streamer.photo)) {
        stream.streamer.photo = 'data:image/png;base64,' + stream.streamer.photo.toString('base64');
      }
    });

    res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    console.error('Error fetching streams by county:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching streams by county',
      error: error.message
    });
  }
});


module.exports = (app) => {
  app.use('/api/v1/video-stream', router);
};
