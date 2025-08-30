const WebSocket = require('ws');
const http = require('http');
const path = require('path');

// Load environment variables like the main server
const dotenv = require('dotenv');
const envFilePath = path.resolve(__dirname, '../.env.kisip');
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
const server = http.createServer();

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
          currentUser = message.user;
          clients.set(currentUser.id, ws);
                     users.set(currentUser.id, {
             ...currentUser,
             lastSeen: new Date(),
             status: currentUser.status || 'online'
           });
           
           // Initialize drawer state as closed (user just joined)
           drawerStates.set(currentUser.id, false);
          
          console.log(`User ${currentUser.name} joined the chat`);
          
          try {
            // Update user status in database
            await updateUserStatus(currentUser.id, currentUser.status || 'online', true);
            
            // Send current user the list of online users
            const onlineUsers = await getOnlineUsers();
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
            broadcast({
              type: 'users_update',
              users: onlineUsers
            });
          } catch (error) {
            console.error('Error handling user join:', error);
          }
          break;
          
        case 'message':
          // User sending a message
          if (currentUser && message.message) {
            try {
              const messageType = message.to === 'all' ? 'team_chat' : 'direct_message'
              console.log(`Saving message: type=${messageType}, to=${message.to}, receiver_id=${message.to !== 'all' ? message.to : null}`)
              
              // Save message to database
              const savedMessage = await saveMessage({
                ...message.message,
                sender: currentUser,
                receiver_id: message.to !== 'all' ? message.to : null,
                message_type: messageType
              });
              
              console.log(`Message from ${currentUser.name}: ${savedMessage.content}, saved with type: ${savedMessage.message_type}`);
              
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
                 // Team chat: Broadcast to all support users
                 let sentCount = 0;
                 wss.clients.forEach(client => {
                   if (client !== ws && client.readyState === WebSocket.OPEN) {
                     // Only send team chat messages to support users
                     const clientUserId = Array.from(clients.entries()).find(([id, ws]) => ws === client)?.[0];
                     if (clientUserId) {
                       // Check if this client user has support role
                       // For now, we'll send to all, but you can implement role checking here
                       client.send(JSON.stringify({
                         type: 'message',
                         message: savedMessage
                       }));
                       
                       sentCount++;
                     }
                   }
                 });
                 
                 console.log(`Team chat message broadcast to ${sentCount} users`);
               }
            } catch (error) {
              console.error('Error handling message:', error);
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
                ws.send(JSON.stringify({
                  type: 'conversation_messages',
                  conversationId: 'general',
                  messages: teamMessages
                }));
              } else {
                // Load direct messages between two users
                const directMessages = await getDirectMessages(currentUser.id, message.conversationId);
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
              const onlineUsers = await getOnlineUsers();
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
           // User opened/closed their chat drawer
           if (currentUser && message.isOpen !== undefined) {
             drawerStates.set(currentUser.id, message.isOpen);
             console.log(`User ${currentUser.name} drawer state: ${message.isOpen ? 'open' : 'closed'}`);
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
         users.delete(currentUser.id);
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
server.listen(PORT, () => {
  console.log(`Chat WebSocket server listening on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/chat`);
});

// Helper function to check if user has support role
function hasSupportRole(user) {
  // Customize this based on your user role system
  // For now, we'll assume all users have support access
  // You can check user.role === 'support' or user.permissions.includes('chat_support')
  return true;
}

// Helper function to get online users from database
async function getOnlineUsers() {
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
    const messages = await db.chatMessage.findAll({
      where: {
        message_type: 'direct_message',
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
    // Get team chat messages (broadcast messages)
    const teamChatMessages = await db.chatMessage.findAll({
      where: { 
        receiver_id: null,
        message_type: 'team_chat'
      },
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'photo']
      }],
      order: [['created_at', 'DESC']],
      limit: limit
    });

    // Convert sender photos to base64 data URLs
    teamChatMessages.forEach(message => {
      if (message.sender && message.sender.photo && Buffer.isBuffer(message.sender.photo)) {
        message.sender.photo = 'data:image/png;base64,' + message.sender.photo.toString('base64');
      }
    });

    return teamChatMessages.reverse(); // Return in chronological order
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
