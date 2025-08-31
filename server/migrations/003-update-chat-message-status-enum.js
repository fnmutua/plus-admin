'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the missing status enum values
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'sending';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'sent';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'received';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'read';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_chat_messages_status" ADD VALUE IF NOT EXISTS 'failed';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Warning: Cannot easily remove enum values in PostgreSQL');
  }
};
