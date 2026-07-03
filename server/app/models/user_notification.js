const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'user_notification',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      channel: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false
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
      address: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      legacy_table: {
        type: DataTypes.STRING(80),
        allowNull: true
      },
      legacy_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'user_notification',
      schema: 'public',
      timestamps: false,
      indexes: [
        { name: 'user_notification_pkey', unique: true, fields: [{ name: 'id' }] },
        { name: 'user_notification_user_id_idx', fields: ['user_id'] },
        { name: 'user_notification_user_sent_idx', fields: ['user_id', 'sent_at'] },
        { name: 'user_notification_user_read_idx', fields: ['user_id', 'read_at'] },
        { name: 'user_notification_channel_idx', fields: ['channel'] },
        { name: 'user_notification_status_idx', fields: ['status'] },
        {
          name: 'user_notification_legacy_unique',
          unique: true,
          fields: ['legacy_table', 'legacy_id']
        }
      ]
    }
  )
}
