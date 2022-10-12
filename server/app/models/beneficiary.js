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
      hh_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      intervention_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      intervention_phase: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      benefit_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false
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
