const { spawn } = require('child_process');
const path = require('path');

console.log('Starting KeSMIS Video Streaming Infrastructure...\n');

// Start the main server
console.log('1. Starting main server...');
const mainServer = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Start the video streaming WebSocket server
console.log('2. Starting video streaming WebSocket server...');
const videoServer = spawn('node', ['server/websocket-video.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Start the chat WebSocket server (if not already running)
console.log('3. Starting chat WebSocket server...');
const chatServer = spawn('node', ['server/websocket-chat.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down all servers...');
  
  mainServer.kill('SIGINT');
  videoServer.kill('SIGINT');
  chatServer.kill('SIGINT');
  
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down all servers...');
  
  mainServer.kill('SIGTERM');
  videoServer.kill('SIGTERM');
  chatServer.kill('SIGTERM');
  
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});

// Handle server crashes
mainServer.on('close', (code) => {
  console.log(`Main server exited with code ${code}`);
  if (code !== 0) {
    console.error('Main server crashed, shutting down other servers...');
    videoServer.kill('SIGINT');
    chatServer.kill('SIGINT');
  }
});

videoServer.on('close', (code) => {
  console.log(`Video streaming server exited with code ${code}`);
  if (code !== 0) {
    console.error('Video streaming server crashed');
  }
});

chatServer.on('close', (code) => {
  console.log(`Chat server exited with code ${code}`);
  if (code !== 0) {
    console.error('Chat server crashed');
  }
});

console.log('\nAll servers started successfully!');
console.log('Main server: http://localhost:80');
console.log('Video streaming WebSocket: ws://localhost:3002/video-stream');
console.log('Chat WebSocket: ws://localhost:3001/chat');
console.log('\nPress Ctrl+C to stop all servers');
