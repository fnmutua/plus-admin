const WebSocket = require('ws');
const https = require('https'); // Changed from http to https
const path = require('path');
const fs = require('fs');

// Load environment variables
const dotenv = require('dotenv');
const envFilePath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envFilePath });

console.log('=== CHAT SERVER ENVIRONMENT VARIABLES ===');
console.log('Env file path:', envFilePath);
console.log('File exists:', fs.existsSync(envFilePath));
console.log('DB - HOST:', process.env.VUE_APP_DB_HOST);
console.log('DB - USER:', process.env.VUE_APP_USER);
console.log('DB - DB:', process.env.VUE_APP_DB);
console.log('DB - PORT:', process.env.VUE_APP_DB_PORT);
console.log('DB - PASSWORD:', process.env.VUE_APP_PASSWORD ? '***SET***' : 'NOT SET');
console.log('SSL - CERT PATH:', process.env.SSL_CERT_PATH || 'NOT SET');
console.log('SSL - KEY PATH:', process.env.SSL_KEY_PATH || 'NOT SET');
console.log('==========================================');

// Load SSL/TLS certificates for HTTPS
let server;
try {
  const certPath = process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/kesmis.go.ke/fullchain.pem';
  const keyPath = process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/kesmis.go.ke/privkey.pem';
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error('SSL certificate or key file not found');
  }
  const options = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
  server = https.createServer(options);
} catch (error) {
  console.error('Error loading SSL certificates:', error);
  // Fallback to HTTP if HTTPS setup fails (not recommended for production)
  const http = require('http');
  server = http.createServer();
  console.warn('Falling back to HTTP due to SSL failure');
}

const db = require('./app/models');
const config = require('./app/config/db.config.js');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

// Create Sequelize connection
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

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/chat'
});

// Store connected clients and their info
const clients = new Map();
const users = new Map();
const drawerStates = new Map();

// Broadcast to all connected clients except sender
function broadcast(message, excludeClient = null) {
  const messageStr = JSON.stringify(message);
  
  wss.clients.forEach(client => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Send message to specific user
function sendToUser(userId, message) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  let currentUser = null;
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'join':
          if (message.user) {
            currentUser = message.user;
            clients.set(currentUser.id, ws);
            drawerStates.set(currentUser.id, false);
            
            console.log(`User ${currentUser.name} (${currentUser.id}) joined the chat`);
            
            try {
              await updateUserStatus(currentUser.id, currentUser.status || 'online', true);
              
              const onlineUsers = await getOnlineUsers(currentUser.id);
              ws.send(JSON.stringify({
                type: 'users_update',
                users: onlineUsers
              }));
              
              const recentMessages = await getRecentMessages();
              ws.send(JSON.stringify({
                type: 'message_history',
                messages: recentMessages
              }));
              
              broadcast({
                type: 'user_joined',
                user: currentUser
              }, ws);
              
              const allOnlineUsers = await getOnlineUsers();
              broadcast({
                type: 'users_update',
                users: allOnlineUsers
              });
            } catch (error) {
              console.error('Error handling user join:', error);
            }
          }
          break;
          
        case 'message':
          if (currentUser && message.message) {
            try {
              const messageType = message.to === 'all' ? 'text' : 'text';
              console.log(`Saving message: type=${messageType}, to=${message.to}, receiver_id=${message.to !== 'all' ? message.to : null}`);
              
              const savedMessage = await saveMessage({
                ...message.message,
                sender: currentUser,
                receiver_id: message.to !== 'all' ? message.to : null,
                message_type: messageType
              });
              
              console.log('Message saved successfully:', {
                id: savedMessage.id,
                content: savedMessage.content,
                message_type: savedMessage.message_type,
                receiver_id: savedMessage.receiver_id
              });
              
              console.log(`Message from ${currentUser.name}: ${savedMessage.content}, saved with type: ${savedMessage.message_type}`);
              
              ws.send(JSON.stringify({
                type: 'message',
                message: savedMessage
              }));
              
              if (message.to && message.to !== 'all') {
                const targetClient = clients.get(message.to);
                if (targetClient && targetClient.readyState === WebSocket.OPEN) {
                  targetClient.send(JSON.stringify({
                    type: 'message',
                    message: savedMessage
                  }));
                  console.log(`Private message sent to ${message.to}`);
                } else {
                  console.log(`Recipient ${message.to} is offline`);
                }
              } else {
                let sentCount = 0;
                wss.clients.forEach(client => {
                  if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'message',
                      message: savedMessage
                    }));
                    sentCount++;
                  }
                });
                console.log(`Team chat message broadcast to ${sentCount} users`);
              }
            } catch (error) {
              console.error('Error handling message:', error);
            }
          }
          break;
          
        case 'get_messages':
          if (currentUser && message.conversation) {
            console.log(`User ${currentUser.name} requesting messages for conversation: ${message.conversation}`);
            try {
              if (message.conversation === 'general') {
                console.log('Loading team chat messages...');
                const teamMessages = await getRecentMessages();
                console.log(`Sending ${teamMessages.length} team chat messages to user ${currentUser.name}`);
                
                await markMessagesAsRead(teamMessages, currentUser.id);
                
                ws.send(JSON.stringify({
                  type: 'conversation_messages',
                  conversationId: 'general',
                  messages: teamMessages
                }));
              } else {
                console.log(`Loading direct messages between ${currentUser.id} and ${message.conversation}...`);
                const directMessages = await getDirectMessages(currentUser.id, message.conversation);
                console.log(`Sending ${directMessages.length} direct messages to user ${currentUser.name}`);
                
                await markMessagesAsRead(directMessages, currentUser.id);
                
                ws.send(JSON.stringify({
                  type: 'conversation_messages',
                  conversationId: message.conversation,
                  messages: directMessages
                }));
              }
            } catch (error) {
              console.error('Error getting messages:', error);
            }
          }
          break;

        case 'switch_conversation':
          if (currentUser && message.conversationId) {
            try {
              if (message.conversationId === 'general') {
                const teamMessages = await getRecentMessages();
                await markMessagesAsRead(teamMessages, currentUser.id);
                ws.send(JSON.stringify({
                  type: 'conversation_messages',
                  conversationId: 'general',
                  messages: teamMessages
                }));
              } else {
                const directMessages = await getDirectMessages(currentUser.id, message.conversationId);
                await markMessagesAsRead(directMessages, currentUser.id);
                ws.send(JSON.stringify({
                  type: 'conversation_messages',
                  conversationId: message.conversationId,
                  messages: directMessages
                }));
              }
            } catch (error) {
              console.error('Error switching conversation:', error);
            }
          }
          break;

        case 'message_read':
          if (message.messageId && message.readBy) {
            console.log(`Message ${message.messageId} read by ${message.readBy}`);
            try {
              console.log(`Calling updateMessageStatus for message ${message.messageId}`);
              await updateMessageStatus(message.messageId, message.readBy, 'read');
              
              const chatMessage = await db.chatMessage.findByPk(message.messageId, {
                include: [{ model: db.user, as: 'sender' }]
              });
              
              if (chatMessage) {
                console.log(`Notifying sender ${chatMessage.sender.id} that message was read`);
                const senderClient = clients.get(chatMessage.sender.id);
                if (senderClient && senderClient.readyState === WebSocket.OPEN) {
                  senderClient.send(JSON.stringify({
                    type: 'message_read',
                    messageId: message.messageId
                  }));
                } else {
                  console.log(`Sender ${chatMessage.sender.id} is not connected`);
                }
              }
            } catch (error) {
              console.error('Error handling message read:', error);
            }
          }
          break;
          
        case 'status_update':
          if (currentUser && message.status) {
            console.log(`User ${currentUser.name} changed status to ${message.status}`);
            try {
              await updateUserStatus(currentUser.id, message.status, true);
              const user = users.get(currentUser.id);
              if (user) {
                user.status = message.status;
                users.set(currentUser.id, user);
              }
              broadcast({
                type: 'user_status_updated',
                userId: currentUser.id,
                status: message.status
              });
              const onlineUsers = await getOnlineUsers(currentUser.id);
              broadcast({
                type: 'users_update',
                users: onlineUsers
              });
            } catch (error) {
              console.error('Error updating user status:', error);
            }
          }
          break;
          
        case 'typing':
          if (currentUser) {
            broadcast({
              type: 'typing',
              user: currentUser,
              isTyping: message.isTyping
            }, ws);
          }
          break;
          
        case 'drawer_state':
          if (currentUser && message.isOpen !== undefined) {
            console.log(`User ${currentUser.name} drawer state: ${message.isOpen ? 'open' : 'closed'}`);
            drawerStates.set(currentUser.id, message.isOpen);
            if (message.isOpen && message.conversationId) {
              try {
                if (message.conversationId === 'general') {
                  const teamMessages = await getRecentMessages();
                  await markMessagesAsRead(teamMessages, currentUser.id);
                } else {
                  const directMessages = await getDirectMessages(currentUser.id, message.conversationId);
                  await markMessagesAsRead(directMessages, currentUser.id);
                }
              } catch (error) {
                console.error('Error marking messages as read when drawer opened:', error);
              }
            }
          }
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', async () => {
    if (currentUser) {
      console.log(`User ${currentUser.name} left the chat`);
      try {
        await setUserOffline(currentUser.id);
        clients.delete(currentUser.id);
        drawerStates.delete(currentUser.id);
        broadcast({
          type: 'user_left',
          user: currentUser
        });
        const onlineUsers = await getOnlineUsers();
        broadcast({
          type: 'users_update',
          users: onlineUsers
        });
      } catch (error) {
        console.error('Error handling user disconnect:', error);
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start the server
const PORT = process.env.CHAT_PORT || 443; // Use 443 for HTTPS in production
server.listen(PORT, () => {
  console.log(`Chat WebSocket server listening on port ${PORT}`);
  console.log(`WebSocket endpoint: wss://localhost:${PORT}/chat`);
  
  startPeriodicStatusUpdates();
});

// Periodic online status updates
function startPeriodicStatusUpdates() {
  setInterval(async () => {
    try {
      if (wss.clients.size > 0) {
        const onlineUsers = await getOnlineUsers();
        broadcast({
          type: 'users_update',
          users: onlineUsers
        });
        console.log(`Periodic status update: ${onlineUsers.length} users online`);
      }
    } catch (error) {
      console.error('Error in periodic status update:', error);
    }
  }, 30000);
}

// Helper function to mark messages as read
async function markMessagesAsRead(messages, userId) {
  try {
    console.log(`Marking ${messages.length} messages as read for user ${userId}`);
    for (const msg of messages) {
      if (msg.sender_id !== userId && msg.status !== 'read') {
        console.log(`Marking message ${msg.id} as read for user ${userId}`);
        await updateMessageStatus(msg.id, userId, 'read');
        const senderClient = clients.get(msg.sender_id);
        if (senderClient && senderClient.readyState === WebSocket.OPEN) {
          senderClient.send(JSON.stringify({
            type: 'message_read',
            messageId: msg.id,
            readBy: userId
          }));
        }
      }
    }
    console.log(`Successfully marked messages as read for user ${userId}`);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Helper function to check if user has support role
function hasSupportRole(user) {
  return true; // Customize based on your user role system
}

// Helper function to get online users from database
async function getOnlineUsers(excludeUserId = null) {
  try {
    const whereClause = {
      include: [{
        model: db.userStatus,
        as: 'status',
        where: { is_online: true },
        required: true
      }],
      attributes: ['id', 'name', 'email', 'photo']
    };
    if (excludeUserId) {
      whereClause.where = { id: { [db.Sequelize.Op.ne]: excludeUserId } };
    }
    const users = await db.user.findAll(whereClause);
    return users.map(user => {
      let photoUrl = '/assets/imgs/avatar.jpg';
      if (user.photo && Buffer.isBuffer(user.photo)) {
        photoUrl = 'data:image/png;base64,' + user.photo.toString('base64');
      } else if (user.photo) {
        photoUrl = user.photo;
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: photoUrl,
        status: user.status.status,
        lastSeen: user.status.last_seen
      };
    });
  } catch (error) {
    console.error('Error getting online users:', error);
    return [];
  }
}

// Helper function to save message to database
async function saveMessage(messageData) {
  try {
    console.log(`saveMessage called with:`, {
      content: messageData.content?.substring(0, 30),
      message_type: messageData.message_type,
      sender_id: messageData.sender?.id,
      receiver_id: messageData.receiver_id,
      status: messageData.status
    });
    const message = await db.chatMessage.create({
      content: messageData.content,
      message_type: messageData.message_type,
      sender_id: messageData.sender.id,
      receiver_id: messageData.receiver_id || null,
      status: 'received'
    });
    const messageWithSender = await db.chatMessage.findByPk(message.id, {
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'photo']
      }]
    });
    if (messageWithSender.sender && messageWithSender.sender.photo && Buffer.isBuffer(messageWithSender.sender.photo)) {
      messageWithSender.sender.photo = 'data:image/png;base64,' + messageWithSender.sender.photo.toString('base64');
    }
    return messageWithSender;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

// Helper function to update message status
async function updateMessageStatus(messageId, userId, status) {
  try {
    console.log(`updateMessageStatus: messageId=${messageId}, userId=${userId}, status=${status}`);
    const [statusRecord, created] = await db.chatMessageStatus.findOrCreate({
      where: {
        message_id: messageId,
        user_id: userId
      },
      defaults: {
        status,
        timestamp: new Date()
      }
    });
    if (!created && statusRecord.status !== status) {
      console.log(`Updating existing status record from ${statusRecord.status} to ${status}`);
      await statusRecord.update({
        status,
        timestamp: new Date()
      });
    } else if (created) {
      console.log(`Created new status record with status ${status}`);
    }
    if (status === 'read') {
      console.log(`Updating main message ${messageId} status to 'read'`);
      await db.chatMessage.update(
        { status: 'read' },
        { where: { id: messageId } }
      );
    }
    return statusRecord;
  } catch (error) {
    console.error('Error updating message status:', error);
    throw error;
  }
}

// Helper function to get direct messages between two users
async function getDirectMessages(userId1, userId2, limit = 50) {
  try {
    console.log(`Getting direct messages between users ${userId1} and ${userId2}`);
    const messages = await db.chatMessage.findAll({
      where: {
        message_type: 'text',
        [db.Sequelize.Op.or]: [
          {
            sender_id: userId1,
            receiver_id: userId2
          },
          {
            sender_id: userId2,
            receiver_id: userId1
          }
        ]
      },
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'photo']
      }],
      order: [['created_at', 'ASC']],
      limit: limit
    });
    console.log(`Found ${messages.length} direct messages between users ${userId1} and ${userId2}`);
    messages.forEach(msg => {
      console.log(`- Message ${msg.id}: "${msg.content}" from ${msg.sender?.name} to ${msg.receiver_id}, type: ${msg.message_type}`);
    });
    messages.forEach(message => {
      if (message.sender && message.sender.photo && Buffer.isBuffer(message.sender.photo)) {
        message.sender.photo = 'data:image/png;base64,' + message.sender.photo.toString('base64');
      }
    });
    return messages;
  } catch (error) {
    console.error('Error getting direct messages:', error);
    return [];
  }
}

// Helper function to get recent messages
async function getRecentMessages(limit = 50) {
  try {
    console.log('Getting recent messages with limit:', limit);
    const teamChatMessages = await db.chatMessage.findAll({
      where: { 
        receiver_id: null,
        message_type: 'text'
      },
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'photo']
      }],
      order: [['created_at', 'DESC']],
      limit: limit
    });
    console.log(`Found ${teamChatMessages.length} team chat messages`);
    teamChatMessages.forEach(msg => {
      console.log(`- Message ${msg.id}: "${msg.content}" from ${msg.sender?.name}, type: ${msg.message_type}, receiver: ${msg.receiver_id}`);
    });
    teamChatMessages.forEach(message => {
      if (message.sender && message.sender.photo && Buffer.isBuffer(message.sender.photo)) {
        message.sender.photo = 'data:image/png;base64,' + message.sender.photo.toString('base64');
      }
    });
    const result = teamChatMessages.reverse();
    console.log(`Returning ${result.length} messages in chronological order`);
    return result;
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

// Helper function to update user status
async function updateUserStatus(userId, status, isOnline = true) {
  try {
    const [userStatus, created] = await db.userStatus.findOrCreate({
      where: { user_id: userId },
      defaults: {
        status,
        is_online: isOnline,
        last_seen: new Date()
      }
    });
    if (!created) {
      await userStatus.update({
        status,
        is_online: isOnline,
        last_seen: new Date()
      });
    }
    return userStatus;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

// Helper function to set user offline
async function setUserOffline(userId) {
  try {
    await db.userStatus.update(
      { 
        is_online: false,
        last_seen: new Date()
      },
      { where: { user_id: userId } }
    );
  } catch (error) {
    console.error('Error setting user offline:', error);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down chat server...');
  wss.close();
  server.close();
});

process.on('SIGINT', () => {
  console.log('Shutting down chat server...');
  wss.close();
  server.close();
  process.exit(0);
});

module.exports = { wss, server };