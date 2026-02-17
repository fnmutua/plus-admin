'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'climate_assessment',
      'county_id',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'county', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    );

    // Backfill county_id from the linked settlement
    await queryInterface.sequelize.query(`
      UPDATE climate_assessment ca
      SET county_id = s.county_id
      FROM settlement s
      WHERE ca.settlement_id = s.id
        AND ca.county_id IS NULL
    `);

    await queryInterface.addIndex('climate_assessment', ['county_id'], {
      name: 'climate_assessment_county_id_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('climate_assessment', 'climate_assessment_county_id_idx');
    await queryInterface.removeColumn('climate_assessment', 'county_id');
  },
};
