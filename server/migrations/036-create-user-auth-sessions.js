'use strict';

/** Track active login sessions per user/device for configurable device limits. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [exists] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'user_auth_sessions'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (exists?.exists) return;

    await queryInterface.createTable('user_auth_sessions', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      device_fingerprint: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      device_label: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('user_auth_sessions', ['user_id'], {
      name: 'user_auth_sessions_user_id_idx'
    });
    await queryInterface.addIndex('user_auth_sessions', ['user_id', 'device_fingerprint'], {
      name: 'user_auth_sessions_user_device_idx'
    });
    await queryInterface.addIndex('user_auth_sessions', ['expires_at'], {
      name: 'user_auth_sessions_expires_at_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_auth_sessions').catch(() => {});
  }
};
