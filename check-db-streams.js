const db = require('./server/app/models');

async function checkStreamsInDatabase() {
  try {
    console.log('🔍 Checking video streams in database...\n');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check if videoStream model exists
    if (!db.videoStream) {
      console.log('❌ VideoStream model not found');
      return;
    }
    
    // Get all video streams
    const streams = await db.videoStream.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`📊 Found ${streams.length} video streams in database:\n`);
    
    streams.forEach((stream, index) => {
      console.log(`${index + 1}. Stream ID: ${stream.id}`);
      console.log(`   Title: ${stream.title}`);
      console.log(`   User ID: ${stream.user_id}`);
      console.log(`   Status: ${stream.status}`);
      console.log(`   Start Time: ${stream.start_time}`);
      console.log(`   End Time: ${stream.end_time || 'N/A'}`);
      console.log(`   Location: ${stream.location || 'N/A'}`);
      console.log(`   County: ${stream.county || 'N/A'}`);
      console.log(`   Created: ${stream.created_at}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkStreamsInDatabase();
