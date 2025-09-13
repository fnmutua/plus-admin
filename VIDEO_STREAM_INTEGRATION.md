# 🎥 Video Streaming Integration Guide

## 📡 **Server URLs**

### **WebSocket (Real-time streaming)**
- **Development**: `ws://localhost:3002/video-stream`
- **Production**: `wss://your-domain.com/video-stream`

### **REST API (Stream management)**
- **Development**: `http://localhost:80/api/v1/video-stream/`
- **Production**: `https://your-domain.com/api/v1/video-stream/`

## 🚀 **Quick Start**

### 1. **Start the Video Streaming Server**
```bash
# Start both main server and video streaming server
npm run start:all

# Or start them separately
npm run dev          # Main server (port 80)
npm run video:server # Video streaming server (port 3002)
```

### 2. **Use in Your Vue.js App**

```javascript
// Import the configuration
import { getWebSocketUrl, getApiUrl } from '@/config/videoStream.js';

// WebSocket connection
const ws = new WebSocket(getWebSocketUrl());

// API calls
const apiUrl = getApiUrl();
```

## 📱 **Frontend Integration**

### **WebSocket Events**
```javascript
// Connect to video streaming
ws.send(JSON.stringify({
  type: 'start_stream',
  user: { id: 1, name: 'Streamer', email: 'user@example.com' },
  streamConfig: {
    title: 'My Live Stream',
    description: 'Stream description',
    resolution: '720p',
    bitrate: 1000,
    framerate: 30,
    camera: 'back',
    audio: true,
    location: 'Nairobi, Kenya',
    county: 'Nairobi'
  }
}));

// Send chat message
ws.send(JSON.stringify({
  type: 'chat_message',
  message: 'Hello viewers!'
}));

// Stop stream
ws.send(JSON.stringify({
  type: 'stop_stream'
}));
```

### **REST API Endpoints**
```javascript
// Get active streams
GET /api/v1/video-stream/active

// Search streams
GET /api/v1/video-stream/search?q=keyword&county=Nairobi

// Get streams by county
GET /api/v1/video-stream/county/Nairobi

// Get specific stream
GET /api/v1/video-stream/{streamId}

// Create stream (requires auth)
POST /api/v1/video-stream
{
  "title": "Stream Title",
  "description": "Description",
  "location": "Nairobi, Kenya",
  "county": "Nairobi",
  "isPublic": true
}

// Get stream chat
GET /api/v1/video-stream/{streamId}/chat

// Post chat message (requires auth)
POST /api/v1/video-stream/{streamId}/chat
{
  "message": "Hello everyone!"
}
```

## 🔧 **Environment Variables**

Add these to your `.env` file:

```env
# Video Streaming
VUE_APP_VIDEO_WS_URL=ws://localhost:3002/video-stream
VUE_APP_VIDEO_API_URL=http://localhost:80/api/v1/video-stream

# For production
VUE_APP_VIDEO_WS_URL=wss://your-domain.com/video-stream
VUE_APP_VIDEO_API_URL=https://your-domain.com/api/v1/video-stream
```

## 🎯 **Testing**

### **Test WebSocket Connection**
```bash
node test-video-stream.js
```

### **Test REST API**
```bash
node test-video-api.js
```

## 📊 **Current Status**

✅ WebSocket server running on port 3002  
✅ REST API server running on port 80  
✅ Database models created  
✅ Frontend component ready  
✅ Integration configuration provided  

## 🚨 **Important Notes**

1. **Authentication**: Most API endpoints require authentication tokens
2. **CORS**: Make sure CORS is configured for your frontend domain
3. **HTTPS**: Use WSS (WebSocket Secure) in production
4. **Database**: Ensure PostgreSQL is running and accessible
5. **Ports**: Make sure ports 80 and 3002 are available

## 🔗 **Next Steps**

1. Update your frontend to use the provided URLs
2. Implement authentication for protected endpoints
3. Add error handling and reconnection logic
4. Configure production domains
5. Test with real video streams
