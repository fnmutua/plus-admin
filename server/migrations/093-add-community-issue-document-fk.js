'use strict';

/**
 * Link uploaded photos to community_issue rows via document.community_issue_id.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [exists] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'document'
            AND column_name = 'community_issue_id'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!exists?.exists) {
      await queryInterface.addColumn('document', 'community_issue_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('document', 'community_issue_id').catch(() => {});
  },
};
