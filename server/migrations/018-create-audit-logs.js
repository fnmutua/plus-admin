'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      action: {
        allowNull: false,
        type: Sequelize.STRING(120)
      },
      actorType: {
        allowNull: false,
        type: Sequelize.STRING(30),
        defaultValue: 'user'
      },
      actorId: {
        allowNull: true,
        type: Sequelize.STRING(255)
      },
      actorName: {
        allowNull: true,
        type: Sequelize.STRING(255)
      },
      actorRole: {
        allowNull: true,
        type: Sequelize.STRING(120)
      },
      entityType: {
        allowNull: false,
        type: Sequelize.STRING(120)
      },
      entityId: {
        allowNull: true,
        type: Sequelize.STRING(255)
      },
      resource: {
        allowNull: false,
        type: Sequelize.STRING(500)
      },
      outcome: {
        allowNull: false,
        type: Sequelize.STRING(20),
        defaultValue: 'success'
      },
      statusCode: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      changes: {
        allowNull: true,
        type: Sequelize.JSONB
      },
      metadata: {
        allowNull: true,
        type: Sequelize.JSONB
      }
    })

    await queryInterface.addIndex('audit_logs', ['timestamp'])
    await queryInterface.addIndex('audit_logs', ['actorId', 'timestamp'])
    await queryInterface.addIndex('audit_logs', ['entityType', 'entityId'])
    await queryInterface.addIndex('audit_logs', ['action', 'timestamp'])
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('audit_logs')
  }
}
