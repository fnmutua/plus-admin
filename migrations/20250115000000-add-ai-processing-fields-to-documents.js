'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add AI processing fields to documents table
    await queryInterface.addColumn('document', 'aiProcessed', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('document', 'aiProcessedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('document', 'aiChunks', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('document', 'aiDocumentId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('document', 'aiWarning', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('document', ['aiProcessed'], {
      name: 'idx_documents_ai_processed'
    });

    await queryInterface.addIndex('document', ['aiProcessedAt'], {
      name: 'idx_documents_ai_processed_at'
    });

    await queryInterface.addIndex('document', ['aiDocumentId'], {
      name: 'idx_documents_ai_document_id'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('document', 'idx_documents_ai_processed');
    await queryInterface.removeIndex('document', 'idx_documents_ai_processed_at');
    await queryInterface.removeIndex('document', 'idx_documents_ai_document_id');

    // Remove AI processing fields
    await queryInterface.removeColumn('document', 'aiProcessed');
    await queryInterface.removeColumn('document', 'aiProcessedAt');
    await queryInterface.removeColumn('document', 'aiChunks');
    await queryInterface.removeColumn('document', 'aiDocumentId');
    await queryInterface.removeColumn('document', 'aiWarning');
  }
}; 