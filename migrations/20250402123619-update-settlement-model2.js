'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Rename existing columns
      await queryInterface.renameColumn('settlement', 'name', 'settlement_name', { transaction });
      await queryInterface.renameColumn('settlement', 'county', 'county_id', { transaction });
      await queryInterface.renameColumn('settlement', 'subcounty', 'subcounty_id', { transaction });
      await queryInterface.renameColumn('settlement', 'ward', 'ward_id', { transaction });
      
      // Change column types
      await queryInterface.changeColumn('settlement', 'county_id', {
        type: Sequelize.INTEGER,
        allowNull: false
      }, { transaction });
      
      await queryInterface.changeColumn('settlement', 'subcounty_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });
      
      await queryInterface.changeColumn('settlement', 'ward_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });
      
      await queryInterface.changeColumn('settlement', 'settlement_type', {
        type: Sequelize.STRING,
        allowNull: false
      }, { transaction });
      
 
      
      // Add new columns
      const newColumns = [
        { name: 'village', type: Sequelize.STRING },
        { name: 'general_location', type: Sequelize.STRING },
        { name: 'num_households', type: Sequelize.INTEGER },
        { name: 'avg_household_size', type: Sequelize.FLOAT },
        // Add all other new fields from your specification
      ];
      
      for (const column of newColumns) {
        await queryInterface.addColumn('settlement', column.name, {
          type: column.type,
          allowNull: true
        }, { transaction });
      }
      
      // Remove obsolete columns
      const obsoleteColumns = [
        'parcel_no',
        'parcel_owner',
        'dist_town',
        'dist_trunk',
        // Add any other columns to remove
      ];
      
      for (const column of obsoleteColumns) {
        await queryInterface.removeColumn('settlement', column, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Reverse the changes if needed
  }
};