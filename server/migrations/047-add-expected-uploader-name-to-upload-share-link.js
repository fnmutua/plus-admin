'use strict';

/** upload_share_link may predate expectedUploaderName; add column if missing. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [tableRow] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'upload_share_link'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableRow?.exists) return;

    const columns = await queryInterface.describeTable('upload_share_link');

    if (!columns.expectedUploaderName) {
      await queryInterface.addColumn('upload_share_link', 'expectedUploaderName', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!columns.label) {
      await queryInterface.addColumn('upload_share_link', 'label', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!columns.defaultCategory) {
      await queryInterface.addColumn('upload_share_link', 'defaultCategory', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('upload_share_link').catch(() => ({}));

    if (columns.expectedUploaderName) {
      await queryInterface.removeColumn('upload_share_link', 'expectedUploaderName').catch(() => {});
    }
    if (columns.label) {
      await queryInterface.removeColumn('upload_share_link', 'label').catch(() => {});
    }
    if (columns.defaultCategory) {
      await queryInterface.removeColumn('upload_share_link', 'defaultCategory').catch(() => {});
    }
  }
};
