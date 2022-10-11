const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'beneficiary',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      national_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      kra_pin: {
        type: DataTypes.STRING,
        allowNull: true
      },
      hh_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      photo: {
        type: DataTypes.BLOB,
        allowNull: true
      },

      address: {
        type: DataTypes.STRING,
        allowNull: true
      },

      intervention_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'beneficiary',
      schema: 'public',
      timestamps: false,
      indexes: [
        {
          name: 'beneficiary_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
