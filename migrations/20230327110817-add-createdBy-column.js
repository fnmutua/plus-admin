'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all table names
    const tableNames = await queryInterface.showAllTables();

    // Loop through each table
    for (const tableName of tableNames) {
      // Check if "createdBy" column already exists
      const columns = await queryInterface.describeTable(tableName);
      const hasCreatedBy = 'createdBy' in columns;

      // Add "createdBy" column if it doesn't exist
      if (!hasCreatedBy) {
        await queryInterface.addColumn(tableName, 'createdBy', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove "createdBy" column from each table
    const tableNames = await queryInterface.showAllTables();
    for (const tableName of tableNames) {
      await queryInterface.removeColumn(tableName, 'createdBy');
    }
  },
};
