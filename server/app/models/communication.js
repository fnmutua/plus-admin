const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'communication',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      // 'sms' | 'email' | 'both'
      channel: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      // Email subject (ignored for SMS)
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      // 'roles' | 'users' | 'custom'
      recipient_mode: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      // {
      //   roles?: string[],          // role names (recipient_mode === 'roles')
      //   county_id?: number,        // optional county filter for role mode
      //   user_ids?: number[],       // recipient_mode === 'users'
      //   addresses?: string[]       // recipient_mode === 'custom' (free-form phone/email mix)
      // }
      recipient_filter: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      total_recipients: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      sent_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      failed_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      pending_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      // 'queued' | 'sending' | 'completed' | 'partial' | 'failed'
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'queued'
      },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'communication',
      schema: 'public',
      timestamps: true,
      indexes: [
        { name: 'communication_pkey', unique: true, fields: [{ name: 'id' }] },
        { name: 'communication_createdAt_idx', fields: ['createdAt'] },
        { name: 'communication_sender_id_idx', fields: ['sender_id'] },
        { name: 'communication_status_idx', fields: ['status'] }
      ]
    }
  )
}
