const path = require('path');
const dotenv = require('dotenv');
const envFilePath = path.resolve(__dirname, '../.env.kisip');
dotenv.config({ path: envFilePath });

const db = require('./app/models');

async function updateStatusEnum() {
  try {
    console.log('Updating chat_messages status enum...');
    
    // Add the missing status enum values
    await db.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'sending';
    `);
    await db.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'sent';
    `);
    await db.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'received';
    `);
    await db.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'read';
    `);
    await db.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'failed';
    `);
    
    console.log('✅ Status enum values updated successfully!');
    console.log('New values added: sending, sent, received, read, failed');
    
    // Verify the current enum values
    const result = await db.sequelize.query(`
      SELECT enum_range(NULL::"enum_chat_messages_status");
    `);
    console.log('Current status enum values:', result[0][0].enum_range);
    
  } catch (error) {
    console.error('Error updating status enum:', error);
  } finally {
    await db.sequelize.close();
  }
}

updateStatusEnum();
