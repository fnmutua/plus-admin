'use strict';

/** Optional SUD regional tracker assignment (select list + free text). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('project', 'region', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('project', 'region');
  },
};
