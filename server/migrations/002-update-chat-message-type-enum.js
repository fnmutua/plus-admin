'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update the message_type enum to include new values
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chat_messages_message_type" ADD VALUE IF NOT EXISTS 'team_chat';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chat_messages_message_type" ADD VALUE IF NOT EXISTS 'direct_message';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the table with the old enum
    console.log('Warning: Cannot easily remove enum values in PostgreSQL');
  }
};
