const WebSocket = require('ws');

console.log('🔌 Testing WebSocket connection to video streaming server...\n');

// Test different connection URLs
const testUrls = [
  'ws://localhost:3002/video-stream',
  'ws://127.0.0.1:3002/video-stream',
  'ws://0.0.0.0:3002/video-stream'
];

async function testConnection(url) {
  return new Promise((resolve) => {
    console.log(`Testing: ${url}`);
    
    const ws = new WebSocket(url);
    
    const timeout = setTimeout(() => {
      console.log(`❌ Timeout connecting to ${url}`);
      ws.close();
      resolve(false);
    }, 5000);
    
    ws.on('open', () => {
      console.log(`✅ Successfully connected to ${url}`);
      clearTimeout(timeout);
      ws.close();
      resolve(true);
    });
    
    ws.on('error', (error) => {
      console.log(`❌ Error connecting to ${url}:`, error.message);
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 Connection closed to ${url} - Code: ${code}, Reason: ${reason}`);
    });
  });
}

async function runTests() {
  console.log('Starting WebSocket connection tests...\n');
  
  for (const url of testUrls) {
    const success = await testConnection(url);
    console.log(`Result: ${success ? 'SUCCESS' : 'FAILED'}\n`);
  }
  
  console.log('🏁 All tests completed!');
}

runTests();
