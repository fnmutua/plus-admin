'use strict';

/** Track provenance for documents uploaded through an anonymous share-upload link. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('document');

    if (!columns.upload_share_id) {
      await queryInterface.addColumn('document', 'upload_share_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'upload_share_link', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!columns.uploader_name) {
      await queryInterface.addColumn('document', 'uploader_name', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('document', 'upload_share_id').catch(() => {});
    await queryInterface.removeColumn('document', 'uploader_name').catch(() => {});
  }
};
