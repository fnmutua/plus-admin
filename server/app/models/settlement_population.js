const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'settlement_population',
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
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      population: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pop_male: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pop_female: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      num_households: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING(32),
        allowNull: false,
        comment: 'census_2019 | projected | building_estimate | manual | survey',
      },
      method: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'settlement_population',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'settlement_population_pkey',
          unique: true,
          fields: [{ name: 'id' }],
        },
        {
          name: 'settlement_population_settlement_id_year_unique',
          unique: true,
          fields: ['settlement_id', 'year'],
        },
        {
          name: 'settlement_population_year_idx',
          fields: ['year'],
        },
      ],
    }
  )
}
