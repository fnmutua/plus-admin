const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'intervention',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      intervention_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      intervention_phase: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      settlement_id: {
        type: DataTypes.INTEGER,
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
  

      cluster_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'interventions',
      schema: 'public',
      timestamps: false,
      indexes: [
        {
          name: 'intervention_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
