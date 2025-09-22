const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables like the main server
const dotenv = require('dotenv');
const envFilePath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envFilePath });

console.log('=== VIDEO STREAMING SERVER ENVIRONMENT VARIABLES ===');
console.log('Env file path:', envFilePath);
console.log('File exists:', require('fs').existsSync(envFilePath));
console.log('===================================================');

const db = require('./app/models');
const { Op } = require('sequelize');

// Use the shared database connection from models (like chat server)
const sequelize = db.sequelize;

// Create HTTP server with CORS headers
const server = http.createServer((req, res) => {
  // Set CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle WebSocket upgrade requests
  if (req.url === '/video-stream' && req.headers.upgrade === 'websocket') {
    // Let WebSocket handle this
    return;
  }
  
  // Default response for other requests
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Video Streaming WebSocket Server');
});

// Create WebSocket server for video streaming
const wss = new WebSocket.Server({ 
  server,
  path: '/video-stream',
  verifyClient: (info) => {
    // Allow connections from any origin (for development/testing)
    const origin = info.origin;
    console.log(`✅ WebSocket connection allowed from: ${origin}`);
    return true;
    
    // Uncomment below for production with restricted origins:
    /*
    const allowedOrigins = [
      'https://kesmis.go.ke',
      'http://kesmis.go.ke',
      'https://piehost.com',
      'http://piehost.com',
      'https://websocketking.com',
      'http://websocketking.com',
      'http://localhost:3000',
      'http://localhost:4000',
      'http://localhost:8080'
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ WebSocket connection allowed from: ${origin}`);
      return true;
    }
    
    console.log(`❌ WebSocket connection rejected from: ${origin}`);
    return false;
    */
  }
});

// Store active streams and connections
const activeStreams = new Map(); // streamId -> stream info
const streamConnections = new Map(); // streamId -> Set of WebSocket connections
const userStreams = new Map(); // userId -> Set of streamIds
// Track the primary streamer connection per stream
const streamerConnections = new Map(); // streamId -> WebSocket

// Queue for pending WebRTC offers and ICE candidates when no viewers are connected
const pendingOffers = new Map(); // streamId -> offer (when there were no viewers at the time)
// Cache the latest offer so late-joining viewers can receive it without requiring the streamer to resend
const latestOffers = new Map(); // streamId -> { offer, streamerId, timestamp }
// Brief cache of recent ICE candidates from the streamer to assist late joiners
const latestIceByStream = new Map(); // streamId -> Array<{ candidate, fromUserId, timestamp }>
const pendingIceCandidates = new Map(); // streamId -> array of ICE candidates

// Create streams directory if it doesn't exist
const streamsDir = path.join(__dirname, '../uploads/streams');
if (!fs.existsSync(streamsDir)) {
  fs.mkdirSync(streamsDir, { recursive: true });
}

// Broadcast to all connections for a specific stream
function broadcastToStream(streamId, message, excludeConnection = null) {
  const connections = streamConnections.get(streamId);
  if (!connections) {
    console.log(`❌ No connections found for stream ${streamId}`);
    return;
  }

  const messageStr = JSON.stringify(message);
  console.log(`📤 Broadcasting ${message.type} to ${connections.size} connections for stream ${streamId}`);
  
  let sentCount = 0;
  connections.forEach(connection => {
    if (connection !== excludeConnection) {
      if (connection.readyState === WebSocket.OPEN) {
        try {
          connection.send(messageStr);
          sentCount++;
          console.log(`📤 Sending ${message.type} to connection (${sentCount}/${connections.size})`);
        } catch (error) {
          console.log(`❌ Error sending to connection: ${error.message}`);
        }
      } else {
        console.log(`❌ Connection not ready (state: ${connection.readyState})`);
      }
    } else {
      console.log(`❌ Connection excluded from broadcast`);
    }
  });
  
  console.log(`✅ Successfully sent ${message.type} to ${sentCount} connections`);
}

// Broadcast to all active streams
function broadcastToAllStreams(message) {
  const messageStr = JSON.stringify(message);
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('New video streaming WebSocket connection');
  
  let currentUser = null;
  let currentStreamId = null;
  
  ws.on('message', async (data) => {
    try {
      // Handle both Buffer and string data
      let messageString;
      if (Buffer.isBuffer(data)) {
        messageString = data.toString('utf8');
      } else if (typeof data === 'string') {
        messageString = data;
      } else {
        console.log('❌ Invalid message data type:', typeof data);
        return;
      }
      
      const message = JSON.parse(messageString);
      
      // Only log stream-related messages
      if (message.type === 'start_stream' || message.type === 'stop_stream') {
        console.log(`📨 Stream message type: ${message.type}`);
        console.log('📥 STREAM DATA RECEIVED:');
        console.log(JSON.stringify(message, null, 2));
      }
      
      switch (message.type) {
        case 'join_stream':
          // User joining a stream
          if (message.user && message.streamId) {
            currentUser = message.user;
            currentStreamId = message.streamId;
            
            console.log(`User ${currentUser.name} (${currentUser.id}) joining stream ${message.streamId}`);
            
            // Add connection to stream
            if (!streamConnections.has(message.streamId)) {
              streamConnections.set(message.streamId, new Set());
            }
            streamConnections.get(message.streamId).add(ws);
            
            // Add stream to user's streams
            if (!userStreams.has(currentUser.id)) {
              userStreams.set(currentUser.id, new Set());
            }
            userStreams.get(currentUser.id).add(message.streamId);
            
            // Get stream info from activeStreams first
            let streamInfo = activeStreams.get(message.streamId);
            
            // If not found in activeStreams, check database
            if (!streamInfo) {
              console.log(`Stream ${message.streamId} not found in activeStreams, checking database...`);
              try {
                if (db.videoStream) {
                  const dbStream = await db.videoStream.findByPk(message.streamId, {
                    include: [
                      {
                        model: db.user,
                        as: 'streamer',
                        attributes: ['id', 'name', 'email', 'photo']
                      }
                    ]
                  });
                  
                  if (dbStream && dbStream.status === 'live') {
                    console.log(`Found stream ${message.streamId} in database with status: ${dbStream.status}`);
                    
                    // Convert database stream to activeStreams format
                    streamInfo = {
                      id: dbStream.id,
                      title: dbStream.title,
                      description: dbStream.description,
                      userId: dbStream.user_id,
                      userName: dbStream.streamer?.name || 'Unknown',
                      status: dbStream.status,
                      startTime: dbStream.start_time,
                      viewerCount: 0,
                      settings: dbStream.settings ? JSON.parse(dbStream.settings) : {},
                      location: dbStream.location,
                      county: dbStream.county
                    };
                    
                    // Add to activeStreams for future lookups
                    activeStreams.set(message.streamId, streamInfo);
                    console.log(`Added stream ${message.streamId} to activeStreams from database`);
                  } else {
                    console.log(`Stream ${message.streamId} not found in database or not live`);
                  }
                } else {
                  console.log('VideoStream model not available');
                }
              } catch (error) {
                console.error('Error checking database for stream:', error);
              }
            }
            
            if (streamInfo) {
              // Send stream info to the joining user
              ws.send(JSON.stringify({
                type: 'stream_info',
                stream: streamInfo
              }));
              
              // Send any pending WebRTC offer to the new viewer
              const pendingOffer = pendingOffers.get(message.streamId);
              if (pendingOffer) {
                console.log(`📡 Sending pending offer to new viewer (from pendingOffers)`);
                ws.send(JSON.stringify({
                  type: 'stream_offer',
                  offer: pendingOffer.offer,
                  streamerId: pendingOffer.streamerId
                }));
                // Remove the pending offer since it's been sent
                pendingOffers.delete(message.streamId);
              } else {
                // If no pending offer, try the latest cached offer
                const cachedOffer = latestOffers.get(message.streamId);
                if (cachedOffer) {
                  console.log(`📡 Sending cached latest offer to new viewer`);
                  ws.send(JSON.stringify({
                    type: 'stream_offer',
                    offer: cachedOffer.offer,
                    streamerId: cachedOffer.streamerId
                  }));
                } else {
                  console.log(`⚠️ No offer available yet for stream ${message.streamId}`);
                }
              }
              
              // Send any pending ICE candidates to the new viewer
              const pendingCandidates = pendingIceCandidates.get(message.streamId);
              if (pendingCandidates && pendingCandidates.length > 0) {
                console.log(`🧊 Sending ${pendingCandidates.length} pending ICE candidates to new viewer (pending queue)`);
                pendingCandidates.forEach(candidateData => {
                  ws.send(JSON.stringify({
                    type: 'ice_candidate',
                    candidate: candidateData.candidate,
                    fromUserId: candidateData.fromUserId
                  }));
                });
                // Remove the pending candidates since they've been sent
                pendingIceCandidates.delete(message.streamId);
              } else {
                // Also try the recent ICE cache from streamer
                const cachedIce = latestIceByStream.get(message.streamId);
                if (cachedIce && cachedIce.length > 0) {
                  console.log(`🧊 Sending ${cachedIce.length} cached ICE candidates to new viewer`);
                  cachedIce.forEach(candidateData => {
                    ws.send(JSON.stringify({
                      type: 'ice_candidate',
                      candidate: candidateData.candidate,
                      fromUserId: candidateData.fromUserId
                    }));
                  });
                }
              }
              
              // Notify other viewers about new viewer
              broadcastToStream(message.streamId, {
                type: 'viewer_joined',
                user: currentUser,
                viewerCount: streamConnections.get(message.streamId).size
              }, ws);

              // Prompt streamer to send a fresh offer for this viewer (helps after refresh)
              const streamerSocket = streamerConnections.get(message.streamId);
              if (streamerSocket && streamerSocket.readyState === WebSocket.OPEN) {
                try {
                  streamerSocket.send(JSON.stringify({
                    type: 'request_offer',
                    streamId: message.streamId,
                    targetViewerId: currentUser.id
                  }));
                } catch (e) {
                  console.log('⚠️ Failed to send request_offer to streamer:', e?.message);
                }
              }
            } else {
              // Stream doesn't exist
              console.log(`Stream ${message.streamId} not found in activeStreams or database`);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Stream not found'
              }));
            }
          }
          break;
          
        case 'start_stream':
          // User starting a new stream
          if (message.user && message.streamConfig) {
            currentUser = message.user;
            const streamId = uuidv4();
            currentStreamId = streamId;
            
            const streamInfo = {
              id: streamId,
              title: message.streamConfig.title || 'Live Stream',
              description: message.streamConfig.description || '',
              userId: currentUser.id,
              userName: currentUser.name,
              status: 'live',
              startTime: new Date(),
              viewerCount: 0,
              settings: {
                resolution: message.streamConfig.resolution || '720p',
                bitrate: message.streamConfig.bitrate || 1000,
                framerate: message.streamConfig.framerate || 30,
                camera: message.streamConfig.camera || 'back',
                audio: message.streamConfig.audio !== false
              },
              location: message.streamConfig.location || null,
              county: message.streamConfig.county || null
            };
            
            // Log the complete stream object
            console.log('🎥 STREAM STARTED - Complete Stream Object:');
            console.log(JSON.stringify(streamInfo, null, 2));
            
            // Store stream info
            activeStreams.set(streamId, streamInfo);
            
            // Add connection to stream
            if (!streamConnections.has(streamId)) {
              streamConnections.set(streamId, new Set());
            }
            streamConnections.get(streamId).add(ws);
            // Remember the streamer socket for targeted signaling
            streamerConnections.set(streamId, ws);
            
            // Add stream to user's streams
            if (!userStreams.has(currentUser.id)) {
              userStreams.set(currentUser.id, new Set());
            }
            userStreams.get(currentUser.id).add(streamId);
            
            // Save stream to database
            try {
              console.log('💾 Saving stream to database...');
              await saveStreamToDatabase(streamInfo);
              console.log('✅ Stream saved to database successfully');
            } catch (error) {
              console.error('❌ Error saving stream to database:', error);
            }
            
            // Send confirmation to streamer
            ws.send(JSON.stringify({
              type: 'stream_started',
              streamId: streamId,
              stream: streamInfo
            }));
            
            // Broadcast new stream to all clients
            broadcastToAllStreams({
              type: 'new_stream',
              stream: streamInfo
            });
          }
          break;
          
        case 'webrtc_offer':
          // WebRTC offer from streamer
          if (currentStreamId && message.offer) {
            console.log(`WebRTC offer received for stream ${currentStreamId}`);
            
            // Check if there are viewers connected
            const connections = streamConnections.get(currentStreamId);
            const viewerCount = connections ? connections.size - 1 : 0; // -1 to exclude streamer
            
            // Always cache the latest offer for late-joining viewers
            latestOffers.set(currentStreamId, {
              offer: message.offer,
              streamerId: currentUser.id,
              timestamp: Date.now()
            });

            if (viewerCount > 0) {
              console.log(`📡 Forwarding offer to ${viewerCount} viewers`);
              // Forward offer to all viewers (excluding streamer)
              broadcastToStream(currentStreamId, {
                type: 'stream_offer',  // ✅ Fixed: Frontend expects 'stream_offer'
                offer: message.offer,
                streamerId: currentUser.id
              }, ws);
            } else {
              console.log(`⚠️ No viewers connected, storing offer for later`);
              // Store the offer for when a viewer connects
              pendingOffers.set(currentStreamId, {
                offer: message.offer,
                streamerId: currentUser.id,
                timestamp: Date.now()
              });
            }
          }
          break;
          
        case 'webrtc_answer':
          // WebRTC answer from viewer
          if (currentStreamId && message.answer) {
            console.log(`WebRTC answer received for stream ${currentStreamId} from viewer ${currentUser.id}`);
            
            // Forward answer to the streamer only
            const streamerSocket = streamerConnections.get(currentStreamId);
            if (streamerSocket && streamerSocket.readyState === WebSocket.OPEN) {
              streamerSocket.send(JSON.stringify({
                type: 'webrtc_answer',
                answer: message.answer,
                viewerId: currentUser.id
              }));
            } else {
              console.log('⚠️ Streamer socket not available/open for stream', currentStreamId);
            }
          }
          break;
          
        case 'ice_candidate':
          // ICE candidate exchange
          if (currentStreamId && message.candidate) {
            console.log(`ICE candidate received for stream ${currentStreamId}`);
            
            if (message.targetUserId) {
              // Send to specific user
              const targetConnections = streamConnections.get(currentStreamId);
              if (targetConnections) {
                targetConnections.forEach(connection => {
                  if (connection.readyState === WebSocket.OPEN) {
                    connection.send(JSON.stringify({
                      type: 'ice_candidate',
                      candidate: message.candidate,
                      fromUserId: currentUser.id
                    }));
                  }
                });
              }
            } else {
              // Check if there are viewers connected
              const connections = streamConnections.get(currentStreamId);
              const viewerCount = connections ? connections.size - 1 : 0; // -1 to exclude streamer
              
              // Cache streamer ICE candidates for late joiners (best-effort, short list)
              if (currentUser && currentUser.id === (activeStreams.get(currentStreamId)?.userId)) {
                if (!latestIceByStream.has(currentStreamId)) latestIceByStream.set(currentStreamId, []);
                const list = latestIceByStream.get(currentStreamId);
                list.push({ candidate: message.candidate, fromUserId: currentUser.id, timestamp: Date.now() });
                // Keep only recent 50
                if (list.length > 50) list.shift();
              }

              if (viewerCount > 0) {
                console.log(`🧊 Forwarding ICE candidate to ${viewerCount} viewers`);
                // Broadcast to all connections in stream (excluding streamer)
                broadcastToStream(currentStreamId, {
                  type: 'ice_candidate',
                  candidate: message.candidate,
                  fromUserId: currentUser.id
                }, ws);
              } else {
                console.log(`⚠️ No viewers connected, storing ICE candidate for later`);
                // Store the ICE candidate for when a viewer connects
                if (!pendingIceCandidates.has(currentStreamId)) {
                  pendingIceCandidates.set(currentStreamId, []);
                }
                pendingIceCandidates.get(currentStreamId).push({
                  candidate: message.candidate,
                  fromUserId: currentUser.id,
                  timestamp: Date.now()
                });
              }
            }
          }
          break;
          
        case 'stream_data':
          // Video/audio data from streamer
          if (currentStreamId && message.data) {
            // Forward stream data to all viewers
            broadcastToStream(currentStreamId, {
              type: 'stream_data',
              data: message.data,
              timestamp: Date.now()
            }, ws);
          }
          break;
          
        case 'stop_stream':
          // User stopping their stream
          if (currentStreamId) {
            // Update stream status
            const streamInfo = activeStreams.get(currentStreamId);
            if (streamInfo) {
              streamInfo.status = 'ended';
              streamInfo.endTime = new Date();
              
              // Log the complete stream object when stopping
              console.log('🛑 STREAM STOPPED - Complete Stream Object:');
              console.log(JSON.stringify(streamInfo, null, 2));
              
              // Update database
              try {
                await updateStreamInDatabase(currentStreamId, {
                  status: 'ended',
                  endTime: streamInfo.endTime
                });
              } catch (error) {
                console.error('Error updating stream in database:', error);
              }
            }
            
            // Notify all viewers
            broadcastToStream(currentStreamId, {
              type: 'stream_ended',
              streamId: currentStreamId,
              reason: 'streamer_stopped'
            });
            
            // Clean up
            activeStreams.delete(currentStreamId);
            streamConnections.delete(currentStreamId);
            streamerConnections.delete(currentStreamId);
            
            if (currentUser) {
              const userStreamSet = userStreams.get(currentUser.id);
              if (userStreamSet) {
                userStreamSet.delete(currentStreamId);
                if (userStreamSet.size === 0) {
                  userStreams.delete(currentUser.id);
                }
              }
            }
            
            // Notify all clients about stream ending
            broadcastToAllStreams({
              type: 'stream_ended',
              streamId: currentStreamId
            });
          }
          break;
          
        case 'leave_stream':
          // User leaving a stream
          if (currentStreamId) {
            console.log(`User ${currentUser.name} leaving stream ${currentStreamId}`);
            
            // Remove connection from stream
            const connections = streamConnections.get(currentStreamId);
            if (connections) {
              connections.delete(ws);
              
              // Notify other viewers
              broadcastToStream(currentStreamId, {
                type: 'viewer_left',
                user: currentUser,
                viewerCount: connections.size
              }, ws);
              
              // If no more connections, clean up
              if (connections.size === 0) {
                streamConnections.delete(currentStreamId);
                const streamInfo = activeStreams.get(currentStreamId);
                if (streamInfo && streamInfo.userId === currentUser.id) {
                  // Streamer left, end the stream
                  activeStreams.delete(currentStreamId);
                  broadcastToAllStreams({
                    type: 'stream_ended',
                    streamId: currentStreamId,
                    reason: 'streamer_left'
                  });
                }
              }
            }
            
            // Remove stream from user's streams
            if (currentUser) {
              const userStreamSet = userStreams.get(currentUser.id);
              if (userStreamSet) {
                userStreamSet.delete(currentStreamId);
                if (userStreamSet.size === 0) {
                  userStreams.delete(currentUser.id);
                }
              }
            }
          }
          break;
          
        case 'get_active_streams':
          // Get list of active streams
          const streams = Array.from(activeStreams.values()).map(stream => ({
            ...stream,
            viewerCount: streamConnections.get(stream.id)?.size || 0
          }));
          
          ws.send(JSON.stringify({
            type: 'active_streams',
            streams: streams
          }));
          break;
          
        case 'update_stream_status':
          // Update stream status
          console.log('📨 Stream status update message received:', JSON.stringify(message, null, 2));
          
          if (message.streamId && message.status) {
            const validStatuses = ['live', 'ended', 'paused', 'connecting'];
            if (!validStatuses.includes(message.status)) {
              console.log(`❌ Invalid status: ${message.status}`);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid status. Must be one of: live, ended, paused, connecting'
              }));
              break;
            }
            
            const streamInfo = activeStreams.get(message.streamId);
            if (streamInfo) {
              console.log(`🔄 Updating stream ${message.streamId} status from ${streamInfo.status} to ${message.status}`);
              
              // Update in-memory stream info
              streamInfo.status = message.status;
              if (message.status === 'ended') {
                streamInfo.endTime = new Date();
              }
              
              // Update database
              try {
                await updateStreamInDatabase(message.streamId, {
                  status: message.status,
                  ...(message.status === 'ended' && { end_time: streamInfo.endTime })
                });
                console.log(`✅ Stream ${message.streamId} status updated to: ${message.status}`);
              } catch (error) {
                console.error('Error updating stream status in database:', error);
              }
              
              // Notify all viewers about status change
              broadcastToStream(message.streamId, {
                type: 'stream_status_updated',
                streamId: message.streamId,
                status: message.status,
                timestamp: new Date()
              });
              
              // Send confirmation to requester
              ws.send(JSON.stringify({
                type: 'status_update_success',
                streamId: message.streamId,
                status: message.status,
                message: 'Stream status updated successfully'
              }));
            } else {
              console.log(`❌ Stream not found: ${message.streamId}`);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Stream not found'
              }));
            }
          } else {
            console.log(`❌ Missing streamId or status:`, { streamId: message.streamId, status: message.status });
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Missing streamId or status'
            }));
          }
          break;
          
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      console.error('❌ Raw data received:', data);
      
      // Send error response to client
      try {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          error: error.message
        }));
      } catch (sendError) {
        console.error('❌ Error sending error response:', sendError);
      }
    }
  });
  
  ws.on('close', () => {
    if (currentUser && currentStreamId) {
      console.log(`User ${currentUser.name} disconnected from stream ${currentStreamId}`);
      
      // Remove connection from stream
      const connections = streamConnections.get(currentStreamId);
      if (connections) {
        connections.delete(ws);
        
        // Notify other viewers
        broadcastToStream(currentStreamId, {
          type: 'viewer_left',
          user: currentUser,
          viewerCount: connections.size
        }, ws);
        
        // If no more connections, clean up
        if (connections.size === 0) {
          streamConnections.delete(currentStreamId);
          const streamInfo = activeStreams.get(currentStreamId);
          if (streamInfo && streamInfo.userId === currentUser.id) {
            // Streamer disconnected, end the stream
            streamInfo.status = 'ended';
            streamInfo.endTime = new Date();
            activeStreams.delete(currentStreamId);
            
            // Update database
            try {
              updateStreamInDatabase(currentStreamId, {
                status: 'ended',
                endTime: streamInfo.endTime
              });
            } catch (error) {
              console.error('Error updating stream in database:', error);
            }
            
            broadcastToAllStreams({
              type: 'stream_ended',
              streamId: currentStreamId,
              reason: 'streamer_disconnected'
            });
          }
        }
      }
      
      // Remove stream from user's streams
      if (currentUser) {
        const userStreamSet = userStreams.get(currentUser.id);
        if (userStreamSet) {
          userStreamSet.delete(currentStreamId);
          if (userStreamSet.size === 0) {
            userStreams.delete(currentUser.id);
          }
        }
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('Video streaming WebSocket error:', error);
  });
});

// Database functions
async function saveStreamToDatabase(streamInfo) {
  try {
    // Check if videoStream model exists
    if (!db.videoStream) {
      console.warn('VideoStream model not available, skipping database save');
      return null;
    }
    
    // Create stream record in database
    const stream = await db.videoStream.create({
      id: streamInfo.id,
      title: streamInfo.title,
      description: streamInfo.description,
      user_id: streamInfo.userId,
      status: streamInfo.status,
      start_time: streamInfo.startTime,
      settings: JSON.stringify(streamInfo.settings),
      location: streamInfo.location,
      county: streamInfo.county
    });
    
    console.log('Stream saved to database:', stream.id);
    return stream;
  } catch (error) {
    console.error('Error saving stream to database:', error);
    // Don't throw error, just log it and continue
    return null;
  }
}

async function updateStreamInDatabase(streamId, updates) {
  try {
    if (!db.videoStream) {
      console.warn('VideoStream model not available, skipping database update');
      return;
    }
    
    await db.videoStream.update(updates, {
      where: { id: streamId }
    });
    
    console.log('Stream updated in database:', streamId);
  } catch (error) {
    console.error('Error updating stream in database:', error);
    // Don't throw error, just log it
  }
}


// Start the server
const PORT = process.env.VIDEO_STREAM_PORT || 3002;
const HOST = process.env.VIDEO_STREAM_HOST || '0.0.0.0';

// Detect environment and set appropriate URLs
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
const SERVER_URL = process.env.VIDEO_STREAM_SERVER_URL || (isDevelopment ? `http://localhost:${PORT}` : `https://kesmis.go.ke:${PORT}`);
const WS_URL = process.env.VIDEO_STREAM_WS_URL || (isDevelopment ? `ws://localhost:${PORT}` : `wss://kesmis.go.ke:${PORT}`);

server.listen(PORT, HOST, () => {
  console.log(`Video streaming WebSocket server listening on ${HOST}:${PORT}`);
  console.log(`Environment: ${isDevelopment ? 'Development' : 'Production'}`);
  console.log(`Server URL: ${SERVER_URL}`);
  console.log(`WebSocket endpoint: ${WS_URL}/video-stream`);
  
  if (isDevelopment) {
    console.log(`🔧 Development WebSocket URL: ws://localhost:${PORT}/video-stream`);
  } else {
    console.log(`🚀 Production WebSocket URL: wss://kesmis.go.ke:${PORT}/video-stream`);
  }
});

// Periodic cleanup of inactive streams
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
  
  for (const [streamId, streamInfo] of activeStreams.entries()) {
    if (streamInfo.status === 'live') {
      const timeSinceStart = now - streamInfo.startTime;
      if (timeSinceStart > inactiveThreshold) {
        // Check if stream has any active connections
        const connections = streamConnections.get(streamId);
        if (!connections || connections.size === 0) {
          console.log(`Cleaning up inactive stream: ${streamId}`);
          
          // Mark as ended
          streamInfo.status = 'ended';
          streamInfo.endTime = now;
          
          // Update database
          updateStreamInDatabase(streamId, {
            status: 'ended',
            endTime: streamInfo.endTime
          });
          
          // Remove from active streams
          activeStreams.delete(streamId);
          streamConnections.delete(streamId);
          
          // Notify all clients
          broadcastToAllStreams({
            type: 'stream_ended',
            streamId: streamId,
            reason: 'inactive'
          });
        }
      }
    }
  }
}, 60000); // Check every minute

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down video streaming server...');
  wss.close();
  server.close();
});

process.on('SIGINT', () => {
  console.log('Shutting down video streaming server...');
  wss.close();
  server.close();
  process.exit(0);
});

module.exports = { wss, server, activeStreams, streamConnections };
