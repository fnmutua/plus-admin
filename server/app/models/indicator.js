const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'indicator',
    {
       name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },

      format: {
        type: DataTypes.STRING,
        allowNull: false
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: true
      },
      level: {
        type: DataTypes.STRING,
        allowNull: false
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
   
      activity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
   


      



       code: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'indicator',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'indicator_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
        {
          unique: true,
          fields: ['name', 'activity_id', 'type','format', 'level' ]
        },
      ]
    }
  )
}
