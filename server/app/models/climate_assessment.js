const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'climate_assessment',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'settlement', key: 'id' },
        onDelete: 'CASCADE',
      },
      assessor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      assessed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'draft',
      },
      hazard_score: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      exposure_score: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      sensitivity_score: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      adaptive_capacity_score: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      vulnerability_rating: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      hazard_responses: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      exposure_responses: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      sensitivity_responses: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      adaptive_capacity_responses: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'climate_assessment',
      schema: 'public',
      timestamps: true,
      underscored: true,
      indexes: [
        { name: 'climate_assessment_pkey', unique: true, fields: [{ name: 'id' }] },
        { name: 'climate_assessment_settlement_idx', fields: ['settlement_id'] },
        { name: 'climate_assessment_status_idx', fields: ['status'] },
      ],
    }
  );
};
