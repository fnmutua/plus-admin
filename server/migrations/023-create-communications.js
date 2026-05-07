'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('communication', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      channel: {
        // 'sms' | 'email' | 'both'
        allowNull: false,
        type: Sequelize.STRING(20)
      },
      subject: {
        allowNull: true,
        type: Sequelize.STRING(255)
      },
      body: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      recipient_mode: {
        // 'roles' | 'users' | 'custom'
        allowNull: false,
        type: Sequelize.STRING(20)
      },
      recipient_filter: {
        // { roles?: string[], county_id?: number, user_ids?: number[], addresses?: string[] }
        allowNull: true,
        type: Sequelize.JSONB
      },
      total_recipients: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
      sent_count: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
      failed_count: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
      pending_count: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
      status: {
        // 'queued' | 'sending' | 'completed' | 'partial' | 'failed'
        allowNull: false,
        type: Sequelize.STRING(20),
        defaultValue: 'queued'
      },
      sender_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    })

    await queryInterface.addIndex('communication', ['createdAt'])
    await queryInterface.addIndex('communication', ['sender_id'])
    await queryInterface.addIndex('communication', ['status'])

    await queryInterface.createTable('communication_recipient', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      communication_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'communication', key: 'id' },
        onDelete: 'CASCADE'
      },
      user_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING(255)
      },
      channel: {
        // 'sms' | 'email' (split per channel; one user with both gets two rows on 'both')
        allowNull: false,
        type: Sequelize.STRING(20)
      },
      address: {
        // phone (E.164-ish) or email
        allowNull: false,
        type: Sequelize.STRING(255)
      },
      status: {
        // 'pending' | 'sent' | 'failed'
        allowNull: false,
        type: Sequelize.STRING(20),
        defaultValue: 'pending'
      },
      provider_code: {
        allowNull: true,
        type: Sequelize.STRING(50)
      },
      provider_message: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      sent_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    })

    await queryInterface.addIndex('communication_recipient', ['communication_id'])
    await queryInterface.addIndex('communication_recipient', ['user_id'])
    await queryInterface.addIndex('communication_recipient', ['status'])
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('communication_recipient')
    await queryInterface.dropTable('communication')
  }
}
