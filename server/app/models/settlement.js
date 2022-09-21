const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'settlement',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      county_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      settlement_type: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      geom: {
        type: DataTypes.GEOMETRY('POLYGON', 4326),
        allowNull: true
      },
      area: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      population: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'settlement',
      schema: 'public',
      timestamps: false,
      indexes: [
        {
          name: 'settlement_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
