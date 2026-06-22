const WebSocket = require('ws');
const http = require('http');
const path = require('path');

// Load environment variables like the main server
const dotenv = require('dotenv');
const envFilePath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envFilePath });

console.log('=== CHAT SERVER ENVIRONMENT VARIABLES ===');
console.log('Env file path:', envFilePath);
console.log('File exists:', require('fs').existsSync(envFilePath));
console.log('DB - HOST:', process.env.VUE_APP_DB_HOST);
console.log('DB - USER:', process.env.VUE_APP_USER);
console.log('DB - DB:', process.env.VUE_APP_DB);
console.log('DB - PORT:', process.env.VUE_APP_DB_PORT);
console.log('DB - PASSWORD:', process.env.VUE_APP_PASSWORD ? '***SET***' : 'NOT SET');
console.log('==========================================');

const db = require('./app/models');
const config = require('./app/config/db.config.js');
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

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const match = req.url && req.url.match(/^\/internal\/force-logout\/(\d+)$/);
  if (req.method === 'POST' && match) {
    const secret = req.headers['x-internal-secret'];
    const expected = process.env.INTERNAL_API_SECRET || require('./app/config/auth.config').secret;
    if (!secret || secret !== expected) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Forbidden' }));
      return;
    }
    try {
      await forceDisconnectUser(parseInt(match[1], 10));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      console.error('Internal force-logout error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: error.message }));
    }
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(404);
    res.end();
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/chat'
});

// Store connected clients and their info
const clients = new Map();
const users = new Map(); // userId -> user info
const drawerStates = new Map(); // userId -> drawer open/closed state

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
          // User joining the chat
          if (message.user) {
            currentUser = message.user;
            clients.set(currentUser.id, ws);
            drawerStates.set(currentUser.id, false);
            
            console.log(`User ${currentUser.name} (${currentUser.id}) joined the chat`);
            
            try {
              // Update user status in database
              await updateUserStatus(currentUser.id, currentUser.status || 'online', true);
              
              // Send current user the list of online users
              const onlineUsers = await getOnlineUsers(currentUser.id);
              ws.send(JSON.stringify({
                type: 'users_update',
                users: onlineUsers
              }));
              
              // Send recent messages to the new user
              const recentMessages = await getRecentMessages();
              ws.send(JSON.stringify({
                type: 'message_history',
                messages: recentMessages
              }));
              
              // Notify all other clients about new user
              broadcast({
                type: 'user_joined',
                user: currentUser
              }, ws);
              
              // Send updated user list to everyone
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
          // User sending a message
          if (currentUser && message.message) {
            try {
              // Use existing database enum values until schema is updated
              const messageType = message.to === 'all' ? 'text' : 'text' // Use 'text' for now instead of 'team_chat'
              console.log(`Saving message: type=${messageType}, to=${message.to}, receiver_id=${message.to !== 'all' ? message.to : null}`)
              
              // Save message to database
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
              
              // Send confirmation back to sender
              ws.send(JSON.stringify({
                type: 'message',
                message: savedMessage
              }));
              
              if (message.to && message.to !== 'all') {
                // Private message
                const targetClient = clients.get(message.to);
                if (targetClient && targetClient.readyState === WebSocket.OPEN) {
                  targetClient.send(JSON.stringify({
                    type: 'message',
                    message: savedMessage
                  }));
                  
                  console.log(`Private message sent to ${message.to}`);
                } else {
                  // Recipient is offline, keep as sent
                  console.log(`Recipient ${message.to} is offline`);
                }
              } else {
                // Team chat: Broadcast to all other connected clients
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
          // User requesting messages for a conversation
          if (currentUser && message.conversation) {
            console.log(`User ${currentUser.name} requesting messages for conversation: ${message.conversation}`);
            try {
              if (message.conversation === 'general') {
                // Load team chat messages
                console.log('Loading team chat messages...');
                const teamMessages = await getRecentMessages();
                console.log(`Sending ${teamMessages.length} team chat messages to user ${currentUser.name}`);
                
                // Mark team chat messages as read for this user
                await markMessagesAsRead(teamMessages, currentUser.id);
                
                ws.send(JSON.stringify({
                  type: 'conversation_messages',
                  conversationId: 'general',
                  messages: teamMessages
                }));
              } else {
                // Load direct messages between two users
                console.log(`Loading direct messages between ${currentUser.id} and ${message.conversation}...`);
                const directMessages = await getDirectMessages(currentUser.id, message.conversation);
                console.log(`Sending ${directMessages.length} direct messages to user ${currentUser.name}`);
                
                // Mark direct messages as read for this user
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
          break

        case 'switch_conversation':
          // User switching to a different conversation
          if (currentUser && message.conversationId) {
            try {
              if (message.conversationId === 'general') {
                // Load team chat messages
                const teamMessages = await getRecentMessages();
                
                // Mark team chat messages as read for this user
                await markMessagesAsRead(teamMessages, currentUser.id);
                
                ws.send(JSON.stringify({
                  type: 'conversation_messages',
                  conversationId: 'general',
                  messages: teamMessages
                }));
              } else {
                // Load direct messages between two users
                const directMessages = await getDirectMessages(currentUser.id, message.conversationId);
                
                // Mark direct messages as read for this user
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
          break

        case 'message_read':
          // User has read a message
          if (message.messageId && message.readBy) {
            console.log(`Message ${message.messageId} read by ${message.readBy}`);
            try {
              console.log(`Calling updateMessageStatus for message ${message.messageId}`)
              await updateMessageStatus(message.messageId, message.readBy, 'read');
              
              // Find the message to get sender info
              const chatMessage = await db.chatMessage.findByPk(message.messageId, {
                include: [{ model: db.user, as: 'sender' }]
              });
              
              if (chatMessage) {
                console.log(`Notifying sender ${chatMessage.sender.id} that message was read`);
                // Notify the sender that their message was read
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
          // User updating their status
          if (currentUser && message.status) {
            console.log(`User ${currentUser.name} changed status to ${message.status}`);
            
            try {
              // Update user status in database
              await updateUserStatus(currentUser.id, message.status, true);
              
              // Update user status in memory
              const user = users.get(currentUser.id);
              if (user) {
                user.status = message.status;
                users.set(currentUser.id, user);
              }
              
              // Broadcast status update to all users
              broadcast({
                type: 'user_status_updated',
                userId: currentUser.id,
                status: message.status
              });
              
              // Send updated user list to everyone
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
           // User is typing
           if (currentUser) {
             broadcast({
               type: 'typing',
               user: currentUser,
               isTyping: message.isTyping
             }, ws);
           }
           break;
           
         case 'drawer_state':
           // User's drawer state changed
           if (currentUser && message.isOpen !== undefined) {
             console.log(`User ${currentUser.name} drawer state: ${message.isOpen ? 'open' : 'closed'}`);
             drawerStates.set(currentUser.id, message.isOpen);
             
             // If drawer is opened, mark messages as read for the current conversation
             if (message.isOpen && message.conversationId) {
               try {
                 if (message.conversationId === 'general') {
                   // Mark team chat messages as read
                   const teamMessages = await getRecentMessages();
                   await markMessagesAsRead(teamMessages, currentUser.id);
                 } else {
                   // Mark direct messages as read
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
        // Set user offline in database
        await setUserOffline(currentUser.id);
        
                         // Remove user from maps
        clients.delete(currentUser.id);
        drawerStates.delete(currentUser.id);
        
        // Notify all other clients about user leaving
        broadcast({
          type: 'user_left',
          user: currentUser
        });
        
        // Send updated user list to everyone
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
const PORT = process.env.CHAT_PORT || 3001;
const HOST = process.env.CHAT_HOST || '0.0.0.0';
const SERVER_URL = process.env.CHAT_SERVER_URL || `http://${HOST}:${PORT}`;
const WS_URL = process.env.CHAT_WS_URL || `ws://${HOST}:${PORT}`;

server.listen(PORT, HOST, () => {
  console.log(`Chat WebSocket server listening on ${HOST}:${PORT}`);
  console.log(`Server URL: ${SERVER_URL}`);
  console.log(`WebSocket endpoint: ${WS_URL}/chat`);
  
  // Start periodic online status updates
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
  }, 30000); // Update every 30 seconds
}

// Helper function to mark messages as read
async function markMessagesAsRead(messages, userId) {
  try {
    console.log(`Marking ${messages.length} messages as read for user ${userId}`);
    
    for (const msg of messages) {
      // Only mark messages as read if they're not from the current user and not already read
      if (msg.sender_id !== userId && msg.status !== 'read') {
        console.log(`Marking message ${msg.id} as read for user ${userId}`);
        await updateMessageStatus(msg.id, userId, 'read');
        
        // Notify the sender that their message was read
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
  // Customize this based on your user role system
  // For now, we'll assume all users have support access
  // You can check user.role === 'support' or user.permissions.includes('chat_support')
  return true;
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
    }
    
    // Exclude current user if specified
    if (excludeUserId) {
      whereClause.where = { id: { [db.Sequelize.Op.ne]: excludeUserId } }
    }
    
    const users = await db.user.findAll(whereClause);

    return users.map(user => {
      let photoUrl = '/assets/imgs/avatar.jpg'; // Default fallback
      
      // Convert Buffer photo to base64 data URL if available
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
    })
    
    const message = await db.chatMessage.create({
      content: messageData.content,
      message_type: messageData.message_type,
      sender_id: messageData.sender.id,
      receiver_id: messageData.receiver_id || null,
      status: 'received' // Always set as 'received' when saved to database
    });

    // Get the message with sender info
    const messageWithSender = await db.chatMessage.findByPk(message.id, {
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'photo']
      }]
    });

    // Convert sender photo to base64 data URL
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
    console.log(`updateMessageStatus: messageId=${messageId}, userId=${userId}, status=${status}`)
    
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
      console.log(`Updating existing status record from ${statusRecord.status} to ${status}`)
      await statusRecord.update({
        status,
        timestamp: new Date()
      });
    } else if (created) {
      console.log(`Created new status record with status ${status}`)
    }

    // Update main message status if it's read
    if (status === 'read') {
      console.log(`Updating main message ${messageId} status to 'read'`)
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
        message_type: 'text', // Use 'text' instead of 'direct_message' for now
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

    // Convert sender photos to base64 data URLs
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
    
    // Get team chat messages (broadcast messages)
    const teamChatMessages = await db.chatMessage.findAll({
      where: { 
        receiver_id: null,
        message_type: 'text' // Use 'text' instead of 'team_chat' for now
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

    // Convert sender photos to base64 data URLs
    teamChatMessages.forEach(message => {
      if (message.sender && message.sender.photo && Buffer.isBuffer(message.sender.photo)) {
        message.sender.photo = 'data:image/png;base64,' + message.sender.photo.toString('base64');
      }
    });

    const result = teamChatMessages.reverse(); // Return in chronological order
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

/** Force-disconnect a user (admin force logout). */
async function forceDisconnectUser(userId) {
  const numericId = parseInt(userId, 10);
  const keys = [userId, numericId, String(userId)];
  let ws = null;
  for (const key of keys) {
    if (clients.has(key)) {
      ws = clients.get(key);
      break;
    }
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'session_terminated',
      message: 'You have been logged out by an administrator.'
    }));
    ws.close(4001, 'Force logout');
  }

  clients.delete(userId);
  clients.delete(numericId);
  clients.delete(String(userId));
  drawerStates.delete(userId);
  drawerStates.delete(numericId);

  await setUserOffline(numericId);

  const onlineUsers = await getOnlineUsers();
  broadcast({ type: 'users_update', users: onlineUsers });
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
