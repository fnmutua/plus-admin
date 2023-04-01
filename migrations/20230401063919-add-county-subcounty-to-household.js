'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('households', 'county_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'county',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addColumn('households', 'subcounty_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'subcounty',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('households', 'county_id');
    await queryInterface.removeColumn('households', 'subcounty_id');
  }
};
