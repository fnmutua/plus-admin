const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'sms_log',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      source_module: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      source_type: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      source_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      sender_shortcode: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      destination: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending'
      },
      provider_code: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      provider_message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      initiated_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'sms_log',
      schema: 'public',
      timestamps: true,
      indexes: [
        { name: 'sms_log_pkey', unique: true, fields: [{ name: 'id' }] },
        { name: 'sms_log_source_module_idx', fields: ['source_module'] },
        { name: 'sms_log_status_idx', fields: ['status'] },
        { name: 'sms_log_destination_idx', fields: ['destination'] },
        { name: 'sms_log_sent_at_idx', fields: ['sent_at'] },
        { name: 'sms_log_created_at_idx', fields: ['createdAt'] }
      ]
    }
  )
}
