const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'indicator_category_report',

    {
       indicator_category_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      location_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      period: {
        type: DataTypes.STRING,
        allowNull: true
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false
      },  	
    },
    {
      sequelize,
      tableName: 'indicator_category_report',
      schema: 'public',
      timestamps: false,
      indexes: [
        {
          name: 'indicator_category_report_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
