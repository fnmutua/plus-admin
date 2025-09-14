const axios = require('axios');

// Test video streaming REST API endpoints
console.log('🌐 Testing Video Streaming REST API...\n');

const BASE_URL = 'http://localhost:80';

async function testVideoAPI() {
  try {
    // Test 1: Get active streams
    console.log('1️⃣ Testing GET /api/v1/video-stream/active');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/video-stream/active`);
      console.log('✅ Active streams:', response.data);
    } catch (error) {
      console.log('❌ Error getting active streams:', error.response?.data || error.message);
    }

    // Test 2: Search streams
    console.log('\n2️⃣ Testing GET /api/v1/video-stream/search');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/video-stream/search?q=test&limit=10`);
      console.log('✅ Search results:', response.data);
    } catch (error) {
      console.log('❌ Error searching streams:', error.response?.data || error.message);
    }

    // Test 3: Get streams by county
    console.log('\n3️⃣ Testing GET /api/v1/video-stream/county/Nairobi');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/video-stream/county/Nairobi`);
      console.log('✅ County streams:', response.data);
    } catch (error) {
      console.log('❌ Error getting county streams:', error.response?.data || error.message);
    }

    // Test 4: Create a new stream (requires authentication)
    console.log('\n4️⃣ Testing POST /api/v1/video-stream (requires auth)');
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/video-stream`, {
        title: 'API Test Stream',
        description: 'Test stream created via API',
        location: 'Nairobi, Kenya',
        county: 'Nairobi',
        isPublic: true
      });
      console.log('✅ Stream created:', response.data);
    } catch (error) {
      console.log('❌ Error creating stream (expected - needs auth):', error.response?.data || error.message);
    }

    console.log('\n✅ API testing completed!');
    console.log('\n📋 Available endpoints:');
    console.log('- GET /api/v1/video-stream/active - Get active streams');
    console.log('- GET /api/v1/video-stream/search - Search streams');
    console.log('- GET /api/v1/video-stream/county/:county - Get streams by county');
    console.log('- GET /api/v1/video-stream/:streamId - Get specific stream');
    console.log('- POST /api/v1/video-stream - Create stream (requires auth)');
    console.log('- PUT /api/v1/video-stream/:streamId - Update stream (requires auth)');
    console.log('- DELETE /api/v1/video-stream/:streamId - Delete stream (requires auth)');
    console.log('- GET /api/v1/video-stream/:streamId/chat - Get stream chat');
    console.log('- POST /api/v1/video-stream/:streamId/chat - Post chat message (requires auth)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVideoAPI();
