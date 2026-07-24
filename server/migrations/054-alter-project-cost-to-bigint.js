'use strict';

/** Project costs in KSh can exceed 32-bit integer range. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('project', 'cost', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('project', 'cost', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
