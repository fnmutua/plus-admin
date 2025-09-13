// Video Streaming Configuration
export const VIDEO_STREAM_CONFIG = {
  // WebSocket URLs for real-time communication
  WEBSOCKET: {
    // Development
    DEVELOPMENT: 'ws://localhost:3002/video-stream',
    // Production (replace with your production domain)
    PRODUCTION: 'wss://your-domain.com/video-stream'
  },
  
  // REST API URLs for stream management
  API: {
    // Development
    DEVELOPMENT: 'http://localhost:80/api/v1/video-stream',
    // Production (replace with your production domain)
    PRODUCTION: 'https://your-domain.com/api/v1/video-stream'
  },
  
  // Default stream settings
  DEFAULT_STREAM_CONFIG: {
    title: 'Live Stream',
    description: '',
    resolution: '720p',
    bitrate: 1000,
    framerate: 30,
    camera: 'back',
    audio: true,
    location: 'Nairobi, Kenya',
    county: 'Nairobi'
  },
  
  // WebRTC configuration
  WEBRTC_CONFIG: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },
  
  // Stream quality presets
  QUALITY_PRESETS: {
    '480p': { width: 854, height: 480, bitrate: 500 },
    '720p': { width: 1280, height: 720, bitrate: 1000 },
    '1080p': { width: 1920, height: 1080, bitrate: 2000 }
  }
};

// Get current environment URLs
export const getWebSocketUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? VIDEO_STREAM_CONFIG.WEBSOCKET.PRODUCTION
    : VIDEO_STREAM_CONFIG.WEBSOCKET.DEVELOPMENT;
};

export const getApiUrl = () => {
  return process.env.NODE_ENV === 'production'
    ? VIDEO_STREAM_CONFIG.API.PRODUCTION
    : VIDEO_STREAM_CONFIG.API.DEVELOPMENT;
};

export default VIDEO_STREAM_CONFIG;
