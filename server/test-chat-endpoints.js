const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001'; // Adjust to your server port
const TEST_TOKEN = 'your-test-token-here'; // You'll need to get this from a real login

async function testChatEndpoints() {
  console.log('🧪 Testing Chat Endpoints...\n');

  try {
    // Test 1: Get chat users (requires authentication)
    console.log('1️⃣ Testing GET /api/v1/chat/users');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/chat/users`, {
        headers: {
          'x-access-token': TEST_TOKEN
        }
      });
      console.log('✅ Success:', response.data);
      console.log(`   Found ${response.data.total} users`);
      if (response.data.currentUserRole) {
        console.log(`   Current user roles: ${response.data.currentUserRole.roles.join(', ')}`);
        console.log(`   Is Support Staff: ${response.data.currentUserRole.isSupportStaff}`);
        console.log(`   Is Admin: ${response.data.currentUserRole.isAdmin}`);
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.data || error.message);
    }

    console.log('\n2️⃣ Testing GET /api/v1/chat/users/support');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/chat/users/support`, {
        headers: {
          'x-access-token': TEST_TOKEN
        }
      });
      console.log('✅ Success:', response.data);
      console.log(`   Found ${response.data.total} support staff users`);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data || error.message);
    }

    console.log('\n3️⃣ Testing GET /api/v1/chat/users/online');
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/chat/users/online`, {
        headers: {
          'x-access-token': TEST_TOKEN
        }
      });
      console.log('✅ Success:', response.data);
      console.log(`   Found ${response.data.total} online users`);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data || error.message);
    }

    console.log('\n4️⃣ Testing POST /api/v1/chat/user/status');
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/chat/user/status`, {
        status: 'online',
        is_online: true
      }, {
        headers: {
          'x-access-token': TEST_TOKEN
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Instructions for use
console.log('📋 Instructions:');
console.log('1. Make sure your server is running on port 3001 (or adjust BASE_URL)');
console.log('2. Get a valid JWT token by logging in through your app');
console.log('3. Replace TEST_TOKEN with the actual token');
console.log('4. Run: node test-chat-endpoints.js\n');

// Run tests if token is provided
if (TEST_TOKEN !== 'your-test-token-here') {
  testChatEndpoints();
} else {
  console.log('⚠️  Please set a valid TEST_TOKEN before running tests');
}
