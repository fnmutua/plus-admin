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
        allowNull: true
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
        allowNull: false
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
        {
          unique: true,
          fields: ['indicator_id','activity_id','project_id' ]
      }
      ]
    }
  )
}
