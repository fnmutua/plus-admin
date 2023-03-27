'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all table names
    const tableNames = await queryInterface.showAllTables();

    // Loop through each table
    for (const tableName of tableNames) {
      // Check if "reviewerId" and "reject_msg" columns already exist
      const columns = await queryInterface.describeTable(tableName);
      const hasReviewerId = 'reviewerId' in columns;
      const hasRejectMsg = 'reject_msg' in columns;

      // Add "reviewerId" column if it doesn't exist
      if (!hasReviewerId) {
        await queryInterface.addColumn(tableName, 'reviewerId', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }

      // Add "reject_msg" column if it doesn't exist
      if (!hasRejectMsg) {
        await queryInterface.addColumn(tableName, 'reject_msg', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove "reviewerId" and "reject_msg" columns from each table
    const tableNames = await queryInterface.showAllTables();
    for (const tableName of tableNames) {
      await queryInterface.removeColumn(tableName, 'reviewerId');
      await queryInterface.removeColumn(tableName, 'reject_msg');
    }
  },
};
