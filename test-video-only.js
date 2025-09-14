const WebSocket = require('ws');

console.log('🎥 Testing Video Streaming (No Chat)...\n');

// Connect to video streaming WebSocket
const ws = new WebSocket('ws://localhost:3002/video-stream');

ws.on('open', () => {
  console.log('✅ Connected to video streaming WebSocket server');
  
  // Simulate starting a stream
  console.log('\n📡 Starting a test live stream...');
  ws.send(JSON.stringify({
    type: 'start_stream',
    user: {
      id: 1,
      name: 'Test Streamer',
      email: 'test@example.com'
    },
    streamConfig: {
      title: 'Test Live Stream (No Chat)',
      description: 'This is a test stream without chat functionality',
      resolution: '720p',
      bitrate: 1000,
      framerate: 30,
      camera: 'back',
      audio: true,
      location: 'Nairobi, Kenya',
      county: 'Nairobi'
    }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('\n📨 Received message:', JSON.stringify(message, null, 2));
  
  if (message.type === 'stream_started') {
    console.log('🎉 Stream started successfully!');
    console.log('Stream ID:', message.streamId);
    
    // Simulate ending the stream after 5 seconds
    setTimeout(() => {
      console.log('\n🛑 Ending test stream...');
      ws.send(JSON.stringify({
        type: 'stop_stream'
      }));
    }, 5000);
  }
  
  if (message.type === 'stream_ended') {
    console.log('✅ Stream ended successfully');
    console.log('Reason:', message.reason);
    ws.close();
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('\n🔌 WebSocket connection closed');
  console.log('\n✅ Video streaming test completed (No Chat)!');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test...');
  ws.close();
  process.exit(0);
});
