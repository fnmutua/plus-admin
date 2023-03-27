'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get all table names
      const tableNames = await queryInterface.showAllTables();
      
      // Add 'rejected' field to each table if it does not exist
      for (const tableName of tableNames) {
        const tableColumns = await queryInterface.describeTable(tableName, { transaction });
        
        if (!tableColumns.hasOwnProperty('rejected')) {
          await queryInterface.addColumn(tableName, 'rejected', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          }, { transaction });
        }
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get all table names
      const tableNames = await queryInterface.showAllTables();
      
      // Remove 'rejected' field from each table
      for (const tableName of tableNames) {
        const tableColumns = await queryInterface.describeTable(tableName, { transaction });
        
        if (tableColumns.hasOwnProperty('rejected')) {
          await queryInterface.removeColumn(tableName, 'rejected', { transaction });
        }
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
