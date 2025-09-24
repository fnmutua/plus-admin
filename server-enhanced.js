// server.js (Enhanced version with stream listing)
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Parse JSON bodies
app.use(express.json());

// Store broadcasters and viewers with enhanced metadata
const broadcasters = new Map();
const viewers = new Map();
const streamMetadata = new Map(); // Store stream information

io.on("connection", socket => {
  console.log("🔌 New connection:", socket.id);

  // Handle broadcaster starting a stream
  socket.on("start-broadcast", ({ streamId, title, streamerName }) => {
    const streamInfo = {
      streamId,
      title: title || `Stream ${streamId}`,
      streamerName: streamerName || 'Unknown Streamer',
      viewerCount: 0,
      startTime: new Date().toISOString(),
      status: 'live'
    };
    
    broadcasters.set(socket.id, streamInfo);
    streamMetadata.set(streamId, streamInfo);
    
    console.log(`📡 Broadcaster ${socket.id} started stream: ${streamId} - ${streamInfo.title}`);
    
    // Join broadcaster to a room
    socket.join(`stream-${streamId}`);
  });

  // Handle broadcaster stopping stream
  socket.on("stop-broadcast", ({ streamId }) => {
    const broadcaster = broadcasters.get(socket.id);
    if (broadcaster) {
      console.log(`📡 Broadcaster ${socket.id} stopped stream: ${streamId}`);
      
      // Notify all viewers in this stream
      socket.to(`stream-${streamId}`).emit("stream-ended");
      
      // Update stream metadata
      const streamInfo = streamMetadata.get(streamId);
      if (streamInfo) {
        streamInfo.status = 'ended';
        streamInfo.endTime = new Date().toISOString();
      }
      
      broadcasters.delete(socket.id);
      socket.leave(`stream-${streamId}`);
    }
  });

  // Handle viewer joining a stream
  socket.on("join-stream", ({ streamId }) => {
    viewers.set(socket.id, { streamId });
    socket.join(`stream-${streamId}`);
    
    console.log(`📺 Viewer ${socket.id} joined stream: ${streamId}`);
    
    // Find the broadcaster for this stream
    const broadcaster = Array.from(broadcasters.entries())
      .find(([id, data]) => data.streamId === streamId);
    
    if (broadcaster) {
      const [broadcasterId, broadcasterData] = broadcaster;
      
      // Increment viewer count
      broadcasterData.viewerCount++;
      
      // Update stream metadata
      const streamInfo = streamMetadata.get(streamId);
      if (streamInfo) {
        streamInfo.viewerCount = broadcasterData.viewerCount;
      }
      
      // Notify broadcaster about new viewer
      io.to(broadcasterId).emit("viewer-joined", { viewerId: socket.id });
      
      console.log(`📊 Stream ${streamId} now has ${broadcasterData.viewerCount} viewers`);
    }
  });

  // WebRTC signaling events
  socket.on("offer", ({ to, offer }) => {
    console.log(`📤 Offer from ${socket.id} to ${to}`);
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    console.log(`📥 Answer from ${socket.id} to ${to}`);
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    console.log(`🧊 ICE candidate from ${socket.id} to ${to}`);
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("🔌 Disconnected:", socket.id);
    
    // Check if this was a broadcaster
    const broadcaster = broadcasters.get(socket.id);
    if (broadcaster) {
      console.log(`📡 Broadcaster ${socket.id} disconnected from stream: ${broadcaster.streamId}`);
      
      // Notify all viewers that stream ended
      socket.to(`stream-${broadcaster.streamId}`).emit("stream-ended");
      
      // Update stream metadata
      const streamInfo = streamMetadata.get(broadcaster.streamId);
      if (streamInfo) {
        streamInfo.status = 'ended';
        streamInfo.endTime = new Date().toISOString();
      }
      
      broadcasters.delete(socket.id);
    }
    
    // Check if this was a viewer
    const viewer = viewers.get(socket.id);
    if (viewer) {
      console.log(`📺 Viewer ${socket.id} disconnected from stream: ${viewer.streamId}`);
      
      // Find broadcaster and decrement viewer count
      const broadcaster = Array.from(broadcasters.entries())
        .find(([id, data]) => data.streamId === viewer.streamId);
      
      if (broadcaster) {
        const [broadcasterId, broadcasterData] = broadcaster;
        broadcasterData.viewerCount = Math.max(0, broadcasterData.viewerCount - 1);
        
        // Update stream metadata
        const streamInfo = streamMetadata.get(viewer.streamId);
        if (streamInfo) {
          streamInfo.viewerCount = broadcasterData.viewerCount;
        }
        
        // Notify broadcaster about viewer leaving
        io.to(broadcasterId).emit("viewer-disconnected", { viewerId: socket.id });
        
        console.log(`📊 Stream ${viewer.streamId} now has ${broadcasterData.viewerCount} viewers`);
      }
      
      viewers.delete(socket.id);
    }
  });

  // Debug endpoint to check server status
  socket.on("ping", () => {
    socket.emit("pong", { 
      timestamp: new Date().toISOString(),
      activeConnections: io.sockets.sockets.size,
      broadcasters: broadcasters.size,
      viewers: viewers.size
    });
  });
});

// HTTP endpoint for health check
app.get("/", (req, res) => {
  res.json({
    status: "Socket.IO signaling server running",
    timestamp: new Date().toISOString(),
    activeConnections: io.sockets.sockets.size,
    broadcasters: broadcasters.size,
    viewers: viewers.size
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// NEW: Get list of active streams
app.get("/streams", (req, res) => {
  console.log("📡 GET /streams requested");
  console.log("📊 Current stream metadata:", Array.from(streamMetadata.entries()));
  console.log("📊 Current broadcasters:", Array.from(broadcasters.entries()));
  
  const activeStreams = Array.from(streamMetadata.values())
    .filter(stream => stream.status === 'live')
    .map(stream => ({
      streamId: stream.streamId,
      title: stream.title,
      streamer: {
        name: stream.streamerName
      },
      status: stream.status,
      viewerCount: stream.viewerCount,
      startTime: stream.startTime
    }));

  console.log("📺 Returning active streams:", activeStreams);

  res.json({
    success: true,
    data: activeStreams,
    timestamp: new Date().toISOString()
  });
});

// NEW: Get specific stream info
app.get("/streams/:streamId", (req, res) => {
  const { streamId } = req.params;
  const streamInfo = streamMetadata.get(streamId);
  
  if (!streamInfo) {
    return res.status(404).json({
      success: false,
      message: "Stream not found"
    });
  }
  
  res.json({
    success: true,
    data: {
      streamId: streamInfo.streamId,
      title: streamInfo.title,
      streamer: {
        name: streamInfo.streamerName
      },
      status: streamInfo.status,
      viewerCount: streamInfo.viewerCount,
      startTime: streamInfo.startTime,
      endTime: streamInfo.endTime
    }
  });
});

// NEW: Create a test stream (for testing purposes)
app.post("/streams", (req, res) => {
  const { streamId, title, streamerName } = req.body;
  
  if (!streamId) {
    return res.status(400).json({
      success: false,
      message: "streamId is required"
    });
  }
  
  const streamInfo = {
    streamId,
    title: title || `Test Stream ${streamId}`,
    streamerName: streamerName || 'Test Broadcaster',
    viewerCount: 0,
    startTime: new Date().toISOString(),
    status: 'live'
  };
  
  // Add to metadata (this simulates a broadcaster starting a stream)
  streamMetadata.set(streamId, streamInfo);
  
  console.log(`📡 Test stream created: ${streamId} - ${streamInfo.title}`);
  
  res.json({
    success: true,
    data: streamInfo,
    message: "Test stream created successfully"
  });
});

// NEW: Create a sample stream for testing (GET endpoint for easy testing)
app.get("/create-sample-stream", (req, res) => {
  const streamId = `sample-${Date.now()}`;
  const streamInfo = {
    streamId,
    title: `Sample Stream ${new Date().toLocaleTimeString()}`,
    streamerName: 'Sample Broadcaster',
    viewerCount: 0,
    startTime: new Date().toISOString(),
    status: 'live'
  };
  
  // Add to metadata
  streamMetadata.set(streamId, streamInfo);
  
  console.log(`📡 Sample stream created: ${streamId} - ${streamInfo.title}`);
  
  res.json({
    success: true,
    data: streamInfo,
    message: "Sample stream created successfully"
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`✅ Signaling server running on http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📺 Streams API: http://localhost:${PORT}/streams`);
});
