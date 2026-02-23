const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'audit_log',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      action: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      actorType: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'user'
      },
      actorId: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      actorName: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      actorRole: {
        type: DataTypes.STRING(120),
        allowNull: true
      },
      entityType: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      entityId: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      resource: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      outcome: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'success'
      },
      statusCode: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      changes: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'auditlogs',
      schema: 'public',
      timestamps: false,
      indexes: [
        { fields: ['timestamp'] },
        { fields: ['actorId', 'timestamp'] },
        { fields: ['entityType', 'entityId'] },
        { fields: ['action', 'timestamp'] }
      ]
    }
  )
}
