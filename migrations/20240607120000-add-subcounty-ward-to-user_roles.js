// Migration to add subcounty_id and ward_id to user_roles
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('user_roles', 'subcounty_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('user_roles', 'ward_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user_roles', 'subcounty_id');
    await queryInterface.removeColumn('user_roles', 'ward_id');
  }
}; 