const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'climate_assessment_version',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      assessment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'climate_assessment', key: 'id' },
        onDelete: 'CASCADE',
      },
      settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'settlement', key: 'id' },
        onDelete: 'CASCADE',
      },
      version_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'completed',
      },
      question_config_version: {
        type: DataTypes.INTEGER,
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
      response_meta: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      geom: {
        type: DataTypes.GEOMETRY('Geometry', 4326),
        allowNull: true,
      },
      assessed_at: {
        type: DataTypes.DATE,
        allowNull: true,
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
      vulnerability_score: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
      },
      vulnerability_rating: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      risk_score: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
      },
      risk_rating: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      change_type: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'completed',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
    },
    {
      sequelize,
      tableName: 'climate_assessment_version',
      schema: 'public',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'climate_assessment_version_pkey', unique: true, fields: [{ name: 'id' }] },
        {
          name: 'climate_assessment_version_assessment_version_uniq',
          unique: true,
          fields: ['assessment_id', 'version_number'],
        },
        { name: 'climate_assessment_version_assessment_id_idx', fields: ['assessment_id'] },
        { name: 'climate_assessment_version_settlement_id_idx', fields: ['settlement_id'] },
      ],
    }
  );
};
