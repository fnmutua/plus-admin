'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('incident', 'status', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'open'
    });
    
    await queryInterface.addColumn('incident', 'action_taken', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('incident', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('incident', 'status');
    await queryInterface.removeColumn('incident', 'action_taken');
    await queryInterface.removeColumn('incident', 'notes');
  }
};
