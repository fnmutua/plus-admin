/**
 * MediaSoup Video Streaming Client Example
 * 
 * This example demonstrates how to connect to the MediaSoup video streaming server
 * and implement basic streaming functionality.
 * 
 * Usage:
 * 1. Install dependencies: npm install socket.io-client
 * 2. Run this example: node examples/mediasoup-client-example.js
 */

const { io } = require('socket.io-client');

// Configuration
const SERVER_URL = 'ws://localhost:3003';
const SOCKET_PATH = '/mediasoup-stream';

// Create socket connection
const socket = io(SERVER_URL, {
  path: SOCKET_PATH,
  transports: ['websocket']
});

// Mock user data
const user = {
  id: 'user_' + Math.random().toString(36).substr(2, 9),
  name: 'Test User',
  email: 'test@example.com'
};

// Mock stream configuration
const streamConfig = {
  title: 'My Live Stream',
  description: 'This is a test stream',
  resolution: '720p',
  bitrate: 1000,
  framerate: 30,
  camera: 'back',
  audio: true,
  location: 'Test Location',
  county: 'Test County'
};

// Socket event handlers
socket.on('connect', () => {
  console.log('✅ Connected to MediaSoup server');
  console.log('Socket ID:', socket.id);
  
  // Get router RTP capabilities
  getRouterRtpCapabilities();
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

// Get router RTP capabilities
function getRouterRtpCapabilities() {
  console.log('📡 Requesting router RTP capabilities...');
  
  socket.emit('getRouterRtpCapabilities', (rtpCapabilities) => {
    if (rtpCapabilities) {
      console.log('✅ Router RTP capabilities received');
      console.log('Codecs:', rtpCapabilities.codecs?.length || 0);
      console.log('Header Extensions:', rtpCapabilities.headerExtensions?.length || 0);
      
      // After getting capabilities, create transports
      createTransports();
    } else {
      console.error('❌ Failed to get router RTP capabilities');
    }
  });
}

// Create WebRTC transports
function createTransports() {
  console.log('🔧 Creating WebRTC transports...');
  
  // Create send transport (for streaming)
  socket.emit('createWebRtcTransport', { sender: true }, (params) => {
    if (params && params.params) {
      console.log('✅ Send transport created');
      console.log('Transport ID:', params.params.id);
      console.log('ICE Parameters:', params.params.iceParameters);
      console.log('ICE Candidates:', params.params.iceCandidates?.length || 0);
      
      // In a real implementation, you would use these parameters
      // to create a WebRTC RTCPeerConnection on the client side
      simulateWebRTCSetup('send', params.params);
    } else {
      console.error('❌ Failed to create send transport');
    }
  });
  
  // Create recv transport (for viewing)
  socket.emit('createWebRtcTransport', { sender: false }, (params) => {
    if (params && params.params) {
      console.log('✅ Recv transport created');
      console.log('Transport ID:', params.params.id);
      
      // In a real implementation, you would use these parameters
      // to create a WebRTC RTCPeerConnection on the client side
      simulateWebRTCSetup('recv', params.params);
    } else {
      console.error('❌ Failed to create recv transport');
    }
  });
}

// Simulate WebRTC setup (in real implementation, this would be actual WebRTC code)
function simulateWebRTCSetup(type, params) {
  console.log(`🎬 Simulating ${type} WebRTC setup with params:`, {
    id: params.id,
    iceParameters: params.iceParameters,
    iceCandidatesCount: params.iceCandidates?.length || 0,
    dtlsParameters: params.dtlsParameters ? 'Present' : 'Missing'
  });
  
  // Simulate connecting the transport
  setTimeout(() => {
    console.log(`🔗 Simulating ${type} transport connection...`);
    
    // Simulate DTLS parameters (in real implementation, these come from WebRTC)
    const mockDtlsParameters = {
      role: 'auto',
      fingerprints: [
        { algorithm: 'sha-256', value: 'mock-fingerprint' }
      ]
    };
    
    // Connect the transport
    socket.emit(`connect${type === 'send' ? 'Send' : 'Recv'}Transport`, 
      { dtlsParameters: mockDtlsParameters }, 
      (result) => {
        if (result && !result.error) {
          console.log(`✅ ${type} transport connected successfully`);
          
          if (type === 'send') {
            // Start streaming
            startStreaming();
          } else {
            // Start viewing
            startViewing();
          }
        } else {
          console.error(`❌ Failed to connect ${type} transport:`, result?.error);
        }
      }
    );
  }, 1000);
}

// Start streaming
function startStreaming() {
  console.log('🎥 Starting stream...');
  
  socket.emit('start_stream', {
    user: user,
    streamConfig: streamConfig
  });
}

// Start viewing
function startViewing() {
  console.log('👀 Starting to view streams...');
  
  // Get active streams
  socket.emit('get_active_streams');
}

// Handle server events
socket.on('stream_started', (data) => {
  console.log('🎉 Stream started successfully!');
  console.log('Stream ID:', data.streamId);
  console.log('Stream Info:', data.stream);
  
  // Simulate producing media
  simulateProduceMedia();
});

socket.on('stream_info', (data) => {
  console.log('📺 Stream info received:');
  console.log('Title:', data.stream.title);
  console.log('Status:', data.stream.status);
  console.log('Viewer Count:', data.stream.viewerCount);
});

socket.on('active_streams', (data) => {
  console.log('📋 Active streams:');
  data.streams.forEach((stream, index) => {
    console.log(`${index + 1}. ${stream.title} (${stream.status}) - ${stream.viewerCount} viewers`);
  });
});

socket.on('new_stream', (data) => {
  console.log('🆕 New stream available:', data.stream.title);
});

socket.on('stream_ended', (data) => {
  console.log('🛑 Stream ended:', data.reason);
});

socket.on('viewer_joined', (data) => {
  console.log('👤 Viewer joined:', data.user.name);
  console.log('Total viewers:', data.viewerCount);
});

socket.on('viewer_left', (data) => {
  console.log('👋 Viewer left:', data.user.name);
  console.log('Total viewers:', data.viewerCount);
});

socket.on('newProducer', (data) => {
  console.log('🎬 New producer:', data.kind, 'from', data.userName);
});

socket.on('error', (error) => {
  console.error('❌ Server error:', error.message);
});

// Simulate producing media
function simulateProduceMedia() {
  console.log('🎬 Simulating media production...');
  
  // Simulate producing video
  setTimeout(() => {
    socket.emit('produce', {
      kind: 'video',
      rtpParameters: {
        // In real implementation, these would come from WebRTC
        codecs: [{ mimeType: 'video/VP8', payloadType: 96 }],
        headerExtensions: [],
        encodings: [{ ssrc: 123456789 }]
      }
    }, (result) => {
      if (result && result.id) {
        console.log('✅ Video producer created:', result.id);
      } else {
        console.error('❌ Failed to create video producer:', result?.error);
      }
    });
  }, 2000);
  
  // Simulate producing audio
  setTimeout(() => {
    socket.emit('produce', {
      kind: 'audio',
      rtpParameters: {
        // In real implementation, these would come from WebRTC
        codecs: [{ mimeType: 'audio/opus', payloadType: 97 }],
        headerExtensions: [],
        encodings: [{ ssrc: 987654321 }]
      }
    }, (result) => {
      if (result && result.id) {
        console.log('✅ Audio producer created:', result.id);
      } else {
        console.error('❌ Failed to create audio producer:', result?.error);
      }
    });
  }, 3000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down client...');
  
  // Stop stream if active
  socket.emit('stop_stream');
  
  // Leave stream
  socket.emit('leave_stream');
  
  // Disconnect
  socket.disconnect();
  
  process.exit(0);
});

// Keep the process alive
console.log('🚀 MediaSoup Client Example Started');
console.log('Press Ctrl+C to stop');
console.log('Make sure the MediaSoup server is running on', SERVER_URL);
