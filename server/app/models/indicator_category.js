const { truncate } = require('fs')
const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'indicator_category',
    {
 
      indicator_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
       
      indicator_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      activity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      category_title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      frequency: {
        type: DataTypes.STRING,
        allowNull: false
      },	
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique:true
      },	
    },
    {
      sequelize,
      tableName: 'indicator_category',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'indicator_category_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
      
         

      ]
    }
  )
}
