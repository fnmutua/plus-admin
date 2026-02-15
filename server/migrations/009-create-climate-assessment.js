'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('climate_assessment', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      settlement_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'settlement', key: 'id' },
        onDelete: 'CASCADE',
      },
      project_location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'project_location', key: 'id' },
        onDelete: 'CASCADE',
      },
      assessor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      assessed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'draft',
      },
      hazard_score: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      exposure_score: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      sensitivity_score: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      adaptive_capacity_score: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      vulnerability_rating: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      hazard_responses: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      exposure_responses: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      sensitivity_responses: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      adaptive_capacity_responses: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('climate_assessment', ['settlement_id'], {
      name: 'climate_assessment_settlement_idx',
    });
    await queryInterface.addIndex('climate_assessment', ['project_location_id'], {
      name: 'climate_assessment_project_location_idx',
    });
    await queryInterface.addIndex('climate_assessment', ['status'], {
      name: 'climate_assessment_status_idx',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE climate_assessment ADD CONSTRAINT climate_assessment_one_target
      CHECK (
        (settlement_id IS NOT NULL AND project_location_id IS NULL) OR
        (settlement_id IS NULL AND project_location_id IS NOT NULL)
      )
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE climate_assessment DROP CONSTRAINT IF EXISTS climate_assessment_one_target'
    );
    await queryInterface.dropTable('climate_assessment');
  },
};
