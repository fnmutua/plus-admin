// server.js (Fixed for multiple streams)
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const httpServer = createServer(app);

// --- Express: allow ALL origins via cors package ---
app.use(cors({
  origin: "*",                       // allow ALL origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["*"],
  credentials: true
}));
app.options(/.*/, cors());

// --- Parse JSON request bodies ---
app.use(express.json());

// --- Socket.IO: allow ALL origins ---
const io = new Server(httpServer, {
  cors: {
    origin: "*",                     // allow ALL origins
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  allowEIO3: true,                   // support legacy clients
  transports: ["websocket", "polling"]
});

// --- Data stores (FIXED STRUCTURE) ---
const streamMetadata = new Map();     // streamId -> stream info
const broadcasterSockets = new Map(); // streamId -> socket.id 
const socketStreams = new Map();     // socket.id -> Set of streamIds
const streamViewers = new Map();     // streamId -> Set of viewer socket.ids

// --- Socket.IO handlers ---
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Broadcaster starts a stream
  socket.on("start-broadcast", ({ streamId, title, streamerName }) => {
    const streamInfo = {
      streamId,
      title: title || `Stream ${streamId}`,
      streamerName: streamerName || "Unknown Streamer",
      viewerCount: 0,
      startTime: new Date().toISOString(),
      status: "live"
    };

    // Store stream metadata
    streamMetadata.set(streamId, streamInfo);
    
    // Link broadcaster socket to stream
    broadcasterSockets.set(streamId, socket.id);
    
    // Track streams per socket
    if (!socketStreams.has(socket.id)) {
      socketStreams.set(socket.id, new Set());
    }
    socketStreams.get(socket.id).add(streamId);
    
    // Initialize viewer set for this stream
    streamViewers.set(streamId, new Set());

    console.log(`📡 Broadcaster ${socket.id} started: ${streamId}`);
    socket.join(`stream-${streamId}`);
    
    // Broadcast new stream to all clients
    socket.broadcast.emit("new-stream", streamInfo);
  });

  // Broadcaster stops stream
  socket.on("stop-broadcast", ({ streamId }) => {
    const broadcasterSocketId = broadcasterSockets.get(streamId);
    
    if (broadcasterSocketId === socket.id) {
      console.log(`🛑 Broadcaster ${socket.id} stopped: ${streamId}`);

      // Notify viewers that stream ended
      socket.to(`stream-${streamId}`).emit("stream-ended");

      // Update stream status
      const streamInfo = streamMetadata.get(streamId);
      if (streamInfo) {
        streamInfo.status = "ended";
        streamInfo.endTime = new Date().toISOString();
      }

      // Clean up data structures
      broadcasterSockets.delete(streamId);
      streamViewers.delete(streamId);
      
      // Remove from socket's stream set
      if (socketStreams.has(socket.id)) {
        socketStreams.get(socket.id).delete(streamId);
      }

      socket.leave(`stream-${streamId}`);
      
      // Broadcast stream ended to all clients
      socket.broadcast.emit("stream-ended", { streamId });
    }
  });

  // Viewer joins stream
  socket.on("join-stream", ({ streamId }) => {
    const streamInfo = streamMetadata.get(streamId);
    const broadcasterSocketId = broadcasterSockets.get(streamId);
    
    if (streamInfo && streamInfo.status === "live") {
      // Add viewer to stream
      if (!streamViewers.has(streamId)) {
        streamViewers.set(streamId, new Set());
      }
      streamViewers.get(streamId).add(socket.id);
      
      socket.join(`stream-${streamId}`);
      console.log(`📺 Viewer ${socket.id} joined: ${streamId}`);

      // Update viewer count
      streamInfo.viewerCount = streamViewers.get(streamId).size;

      // Notify broadcaster
      if (broadcasterSocketId) {
        io.to(broadcasterSocketId).emit("viewer-joined", { viewerId: socket.id, streamId });
      }
      
      // Send stream info to viewer
      socket.emit("stream-info", { stream: streamInfo });
    } else {
      socket.emit("stream-not-found", { streamId });
    }
  });

  // Viewer leaves stream
  socket.on("leave-stream", ({ streamId }) => {
    if (streamViewers.has(streamId)) {
      streamViewers.get(streamId).delete(socket.id);
      
      const streamInfo = streamMetadata.get(streamId);
      if (streamInfo) {
        streamInfo.viewerCount = streamViewers.get(streamId).size;
      }
      
      const broadcasterSocketId = broadcasterSockets.get(streamId);
      if (broadcasterSocketId) {
        io.to(broadcasterSocketId).emit("viewer-disconnected", { viewerId: socket.id, streamId });
      }
    }
    
    socket.leave(`stream-${streamId}`);
    console.log(`📺 Viewer ${socket.id} left: ${streamId}`);
  });

  // WebRTC signaling (enhanced with streamId)
  socket.on("offer", ({ to, offer, streamId }) => {
    io.to(to).emit("offer", { from: socket.id, offer, streamId });
  });

  socket.on("answer", ({ to, answer, streamId }) => {
    io.to(to).emit("answer", { from: socket.id, answer, streamId });
  });

  socket.on("ice-candidate", ({ to, candidate, streamId }) => {
    io.to(to).emit("ice-candidate", { from: socket.id, candidate, streamId });
  });

  // Get active streams
  socket.on("get-streams", () => {
    const activeStreams = Array.from(streamMetadata.values())
      .filter(stream => stream.status === "live");
    socket.emit("streams-list", { success: true, data: activeStreams });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("🔌 Disconnected:", socket.id);

    // Handle broadcaster disconnection
    if (socketStreams.has(socket.id)) {
      const userStreams = socketStreams.get(socket.id);
      
      for (const streamId of userStreams) {
        // Notify viewers that stream ended
        socket.to(`stream-${streamId}`).emit("stream-ended");

        // Update stream status
        const streamInfo = streamMetadata.get(streamId);
        if (streamInfo) {
          streamInfo.status = "ended";
          streamInfo.endTime = new Date().toISOString();
        }

        // Clean up
        broadcasterSockets.delete(streamId);
        streamViewers.delete(streamId);
        
        // Broadcast stream ended
        socket.broadcast.emit("stream-ended", { streamId });
      }
      
      socketStreams.delete(socket.id);
    }

    // Handle viewer disconnection from all streams
    for (const [streamId, viewers] of streamViewers.entries()) {
      if (viewers.has(socket.id)) {
        viewers.delete(socket.id);
        
        const streamInfo = streamMetadata.get(streamId);
        if (streamInfo) {
          streamInfo.viewerCount = viewers.size;
        }
        
        const broadcasterSocketId = broadcasterSockets.get(streamId);
        if (broadcasterSocketId) {
          io.to(broadcasterSocketId).emit("viewer-disconnected", { viewerId: socket.id, streamId });
        }
      }
    }
  });

  // Debug ping/pong
  socket.on("ping", () => {
    const activeStreams = Array.from(streamMetadata.values()).filter(s => s.status === "live");
    
    socket.emit("pong", {
      timestamp: new Date().toISOString(),
      activeConnections: io.sockets.sockets.size,
      activeStreams: activeStreams.length,
      totalViewers: Array.from(streamViewers.values()).reduce((total, viewers) => total + viewers.size, 0),
      streams: activeStreams
    });
  });
});

// --- REST endpoints ---
app.get("/", (req, res) => {
  const activeStreams = Array.from(streamMetadata.values()).filter(s => s.status === "live");
  
  res.json({
    status: "Socket.IO signaling server running",
    timestamp: new Date().toISOString(),
    activeConnections: io.sockets.sockets.size,
    activeStreams: activeStreams.length,
    totalViewers: Array.from(streamViewers.values()).reduce((total, viewers) => total + viewers.size, 0)
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/streams", (req, res) => {
  const activeStreams = Array.from(streamMetadata.values())
    .filter(stream => stream.status === "live");  // Only return live streams
    
  console.log(`📡 /streams endpoint called - returning ${activeStreams.length} active streams`);
  res.json({ success: true, data: activeStreams });
});

// Get all streams (including ended ones)
app.get("/streams/all", (req, res) => {
  const allStreams = Array.from(streamMetadata.values());
  res.json({ success: true, data: allStreams });
});

// Get stream by ID
app.get("/streams/:streamId", (req, res) => {
  const { streamId } = req.params;
  const stream = streamMetadata.get(streamId);
  
  if (stream) {
    res.json({ success: true, data: stream });
  } else {
    res.status(404).json({ success: false, message: "Stream not found" });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  console.log(`🌐 CORS: ALL origins allowed`);
  console.log(`📡 Streams endpoint: http://0.0.0.0:${PORT}/streams`);
});
