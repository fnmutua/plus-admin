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
        allowNull: true
      },
     

      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      component_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
   

        code: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'beneficiary',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'benf_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
        {
          unique: true,
          fields: ['hh_id', 'settlement_id','project_id', 'component_id']
        },
      ]
    }
  )
}
