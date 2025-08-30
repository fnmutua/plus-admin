'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update the enum to include the new values
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chat_messages_message_type" ADD VALUE IF NOT EXISTS 'team_chat';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chat_messages_message_type" ADD VALUE IF NOT EXISTS 'direct_message';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Warning: Cannot easily remove enum values in PostgreSQL');
  }
};
