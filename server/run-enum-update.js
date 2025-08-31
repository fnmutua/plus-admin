const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envFilePath = path.resolve(__dirname, '../.env.kisip');
dotenv.config({ path: envFilePath });

const db = require('./app/models');

async function updateEnum() {
  try {
    console.log('Updating chat_messages message_type enum...');
    
    // Add new enum values
    await db.sequelize.query(`
      ALTER TYPE "enum_chat_messages_message_type" ADD VALUE IF NOT EXISTS 'team_chat';
    `);
    
    await db.sequelize.query(`
      ALTER TYPE "enum_chat_messages_message_type" ADD VALUE IF NOT EXISTS 'direct_message';
    `);
    
    console.log('✅ Enum values updated successfully!');
    console.log('New values added: team_chat, direct_message');
    
    // Verify the current enum values
    const result = await db.sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_chat_messages_message_type)) as enum_value;
    `);
    
    console.log('Current enum values:', result[0].map(row => row.enum_value));
    
  } catch (error) {
    console.error('❌ Error updating enum:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

updateEnum();
