'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('climate_assessment');
    if (tableInfo.geom) {
      return;
    }
    await queryInterface.sequelize.query(`
      ALTER TABLE climate_assessment
      ADD COLUMN geom geometry(Geometry, 4326) NULL
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('climate_assessment', 'geom');
  },
};
