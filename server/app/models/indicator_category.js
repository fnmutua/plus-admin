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
      frequency: {
        type: DataTypes.STRING,
        allowNull: false
      },
      	
    },
    {
      sequelize,
      tableName: 'indicator_category',
      schema: 'public',
      timestamps: false,
      indexes: [
        {
          name: 'indicator_category_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
