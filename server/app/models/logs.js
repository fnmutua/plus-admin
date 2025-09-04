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
      loginTime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Time when user logged in (for session duration calculation)'
      },
      logoutTime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Time when user logged out'
      },
      sessionDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Session duration in seconds'
      },
      sessionDurationFormatted: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Session duration in human readable format (e.g., "2h 30m 15s")'
      },

    },
    {
      sequelize,
      tableName: 'logs',
      schema: 'public',
      timestamps: true,
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
