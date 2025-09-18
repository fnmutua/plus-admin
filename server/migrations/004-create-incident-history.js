'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('incident_history', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      incident_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'incident',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Action performed: created, updated, deleted, status_changed, etc.'
      },
      field_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Name of the field that was changed (for updates)'
      },
      old_value: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Previous value of the field'
      },
      new_value: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'New value of the field'
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who made the change'
      },
      changed_by_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Name of the user who made the change (for display purposes)'
      },
      change_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for the change'
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'IP address of the user who made the change'
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User agent string'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('incident_history', ['incident_id']);
    await queryInterface.addIndex('incident_history', ['changed_by']);
    await queryInterface.addIndex('incident_history', ['action']);
    await queryInterface.addIndex('incident_history', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('incident_history');
  }
};
