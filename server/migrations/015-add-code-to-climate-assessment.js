'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('climate_assessment');
    if (tableInfo.code) {
      return;
    }
    await queryInterface.addColumn(
      'climate_assessment',
      'code',
      {
        type: Sequelize.STRING(64),
        allowNull: true,
      }
    );
    await queryInterface.sequelize.query(`
      UPDATE climate_assessment SET code = id::text WHERE code IS NULL
    `);
    await queryInterface.addIndex('climate_assessment', ['code'], {
      name: 'climate_assessment_code_idx',
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('climate_assessment', 'climate_assessment_code_idx');
    await queryInterface.removeColumn('climate_assessment', 'code');
  },
};
