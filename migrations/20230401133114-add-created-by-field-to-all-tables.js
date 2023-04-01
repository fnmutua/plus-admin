'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
 
    const tables = await queryInterface.showAllTables();
    for (const tableName of tables) {
      const tableDescription = await queryInterface.describeTable(tableName);
      if (!tableDescription.createdBy) {
        await queryInterface.addColumn(tableName, 'createdBy', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
 
    const tables = await queryInterface.showAllTables();
    for (const tableName of tables) {
      await queryInterface.removeColumn(tableName, 'createdBy');
    }
  },
};
