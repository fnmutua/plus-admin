const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'regional_report_submission_document',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      regional_report_submission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'regional_report_submission',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      format: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      size: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'regional_report_submission_document',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'regional_report_submission_document_pkey',
          unique: true,
          fields: [{ name: 'id' }],
        },
        {
          name: 'regional_report_submission_document_submission_idx',
          fields: ['regional_report_submission_id'],
        },
        {
          name: 'regional_report_submission_document_name_submission',
          unique: true,
          fields: ['name', 'regional_report_submission_id'],
        },
      ],
    },
  );
};
