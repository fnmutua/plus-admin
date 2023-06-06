const { truncate } = require('fs')
const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'indicator_category',
    {
      id: {
        autoIncrement: true,
         type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true
      },
 
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
        type: DataTypes.INTEGER,
        allowNull: false
      },	
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
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
      // indexes: [
      //          {
      //     unique: true,
      //     fields: ['indicator_id', 'category_id','project_id', 'activity_id' ]
      //   },
         

      // ]

      indexes: [
        {
          name: 'indicator_category_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
        {
          unique: true,
          fields: ['indicator_id', 'category_id','project_id', 'activity_id','indicator_name']
        },
      ]


    }
  )
}
