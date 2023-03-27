'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all table names
    const tableNames = await queryInterface.showAllTables();

    // Loop through each table
    for (const tableName of tableNames) {
      // Check if "isApproved" column exists and is boolean type
      const columns = await queryInterface.describeTable(tableName);
      const isApprovedColumn = columns.isApproved;
      const isBoolean = isApprovedColumn && isApprovedColumn.type === 'BOOLEAN';

      // Add "isApproved" column as string if it doesn't exist or is not boolean
      if (!isBoolean) {
        await queryInterface.addColumn(tableName, 'isApproved', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Convert "isApproved" column back to boolean
    const tableNames = await queryInterface.showAllTables();
    for (const tableName of tableNames) {
      await queryInterface.changeColumn(tableName, 'isApproved', {
        type: Sequelize.BOOLEAN,
      });
    }
  },
};
