const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'lot',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },

      description: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'lot',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'lot_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
