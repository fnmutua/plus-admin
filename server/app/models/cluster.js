const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'cluster',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      lot_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      cluster_no: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      contract: {
        type: DataTypes.STRING,
        allowNull: false
      },
      consultant: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'cluster',
      schema: 'public',
      timestamps: false,
      indexes: [
        {
          name: 'cluster_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
