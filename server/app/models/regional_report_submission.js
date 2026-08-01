const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'regional_report_submission',
    {
      filing_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      region: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fiscal_year: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      period: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      report_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      submitter_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      submitter_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      co_submitters: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'submitted',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      project_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: 'regional_report_submission',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'regional_report_submission_pkey',
          unique: true,
          fields: [{ name: 'id' }],
        },
      ],
    },
  );
};
