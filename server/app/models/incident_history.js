const Sequelize = require('sequelize')
const DataTypes = Sequelize.DataTypes

module.exports = function (sequelize) {
  return sequelize.define(
    'incident_history',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      incident_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'incident',
          key: 'id'
        }
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Action performed: created, updated, deleted, status_changed, etc.'
      },
      field_name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Name of the field that was changed (for updates)'
      },
      old_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Previous value of the field'
      },
      new_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'New value of the field'
      },
      changed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who made the change'
      },
      changed_by_name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Name of the user who made the change (for display purposes)'
      },
      change_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for the change'
      },
      ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'IP address of the user who made the change'
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'User agent string'
      }
    },
    {
      sequelize,
      tableName: 'incident_history',
      schema: 'public',
      timestamps: true,
      indexes: [
        { name: 'incident_history_pkey', unique: true, fields: [{ name: 'id' }] },
        { fields: ['incident_id'] },
        { fields: ['changed_by'] },
        { fields: ['action'] },
        { fields: ['createdAt'] }
      ]
    }
  )
}
