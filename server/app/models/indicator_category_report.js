const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'indicator_category_report',

    {
       indicator_category_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      county_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: true
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
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique:true
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
