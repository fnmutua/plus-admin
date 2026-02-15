'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE climate_assessment DROP CONSTRAINT IF EXISTS climate_assessment_one_target'
    );
    await queryInterface.sequelize.query(
      "DELETE FROM climate_assessment WHERE settlement_id IS NULL"
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS climate_assessment_project_location_idx'
    );
    await queryInterface.removeColumn('climate_assessment', 'project_location_id');
    await queryInterface.changeColumn('climate_assessment', 'settlement_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'settlement', key: 'id' },
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('climate_assessment', 'project_location_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'project_location', key: 'id' },
      onDelete: 'CASCADE',
    });
    await queryInterface.addIndex('climate_assessment', ['project_location_id'], {
      name: 'climate_assessment_project_location_idx',
    });
    await queryInterface.changeColumn('climate_assessment', 'settlement_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'settlement', key: 'id' },
      onDelete: 'CASCADE',
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE climate_assessment ADD CONSTRAINT climate_assessment_one_target
      CHECK (
        (settlement_id IS NOT NULL AND project_location_id IS NULL) OR
        (settlement_id IS NULL AND project_location_id IS NOT NULL)
      )
    `);
  },
};
