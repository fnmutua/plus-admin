const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'logs',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      userId: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      userName: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      table: {
        type: DataTypes.STRING(255),
        allowNull: false
      },

      action: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false
      },
  
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
 
    },
    {
      sequelize,
      tableName: 'logs',
      schema: 'public',
      indexes: [
        {
          name: 'logs_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
