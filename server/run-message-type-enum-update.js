const path = require('path');
const dotenv = require('dotenv');
const envFilePath = path.resolve(__dirname, '../.env.kisip');
dotenv.config({ path: envFilePath });

const db = require('./app/models');

async function updateMessageTypeEnum() {
  try {
    console.log('Updating chat_messages message_type enum...');
    
    // Add the missing message_type enum values
    await db.sequelize.query(`
      ALTER TYPE "enum_chat_messages_message_type" ADD VALUE IF NOT EXISTS 'team_chat';
    `);
    await db.sequelize.query(`
      ALTER TYPE "enum_chat_messages_message_type" ADD VALUE IF NOT EXISTS 'direct_message';
    `);
    
    console.log('✅ Message type enum values updated successfully!');
    console.log('New values added: team_chat, direct_message');
    
    // Verify the current enum values
    const result = await db.sequelize.query(`
      SELECT enum_range(NULL::"enum_chat_messages_message_type");
    `);
    console.log('Current message_type enum values:', result[0][0].enum_range);
    
  } catch (error) {
    console.error('Error updating message type enum:', error);
  } finally {
    await db.sequelize.close();
  }
}

updateMessageTypeEnum();
