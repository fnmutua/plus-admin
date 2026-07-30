const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'indicator_target',
    {
      indicator_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fiscal_year: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      scope_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'project',
      },
      programme_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      project_location_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      delivery_unit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      target_value: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      target_kind: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'absolute',
      },
      portfolio_denominator: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'indicator_target',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'indicator_target_pkey',
          unique: true,
          fields: [{ name: 'id' }],
        },
      ],
    },
  );
};
