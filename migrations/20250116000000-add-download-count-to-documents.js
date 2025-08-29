'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('document', 'downloadCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of times this document has been downloaded'
    });
    
    // Add an index for better query performance when sorting by popularity
    await queryInterface.addIndex('document', ['downloadCount'], {
      name: 'idx_document_download_count'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('document', 'idx_document_download_count');
    await queryInterface.removeColumn('document', 'downloadCount');
  }
};
