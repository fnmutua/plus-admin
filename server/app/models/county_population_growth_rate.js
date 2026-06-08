const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'county_population_growth_rate',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      county_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      annual_rate: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        comment: 'Annual population growth rate',
      },
      household_growth_rate: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        comment: 'Annual household growth rate (num_households projection)',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'county_population_growth_rate',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'county_population_growth_rate_pkey',
          unique: true,
          fields: [{ name: 'id' }],
        },
        {
          name: 'county_population_growth_rate_county_id_year_unique',
          unique: true,
          fields: ['county_id', 'year'],
        },
        {
          name: 'county_population_growth_rate_year_idx',
          fields: ['year'],
        },
      ],
    }
  )
}
