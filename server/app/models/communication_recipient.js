const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'communication_recipient',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      communication_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      // null when recipient is a free-form address (custom mode)
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      // 'sms' | 'email'
      channel: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      // phone (E.164-ish) or email address
      address: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      // 'pending' | 'sent' | 'failed'
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending'
      },
      // Provider response code (e.g. AdvantaSMS responseCode, nodemailer message id, http status)
      provider_code: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      provider_message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'communication_recipient',
      schema: 'public',
      timestamps: true,
      indexes: [
        { name: 'communication_recipient_pkey', unique: true, fields: [{ name: 'id' }] },
        { name: 'communication_recipient_comm_id_idx', fields: ['communication_id'] },
        { name: 'communication_recipient_user_id_idx', fields: ['user_id'] },
        { name: 'communication_recipient_status_idx', fields: ['status'] }
      ]
    }
  )
}
