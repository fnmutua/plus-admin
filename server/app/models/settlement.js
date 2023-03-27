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

      subcounty_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      settlement_type: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      geom: {
        type: DataTypes.GEOMETRY('Geometry', 4326),
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
        allowNull: false,
        unique:true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      pop_density: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      isApproved: {
        type: DataTypes.STRING,
        defaultValue: 'Pending'
      },
    },
    {
      sequelize,
      tableName: 'settlement',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'settlement_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
        {
          name: 'settlement_pcode',
          unique: true,
          fields: [{ name: 'code' }]
        }
      ]
    }
  )
}
