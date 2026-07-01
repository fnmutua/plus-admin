'use strict';

/**
 * Clarification thread for data requests: messages table + status/token on data_request.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'data_request_message'
        );
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      await queryInterface.createTable('data_request_message', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        data_request_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'data_request', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        author_type: {
          type: Sequelize.STRING(20),
          allowNull: false
        },
        author_user_id: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        author_name: {
          type: Sequelize.STRING,
          allowNull: true
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('data_request_message', ['data_request_id'], {
        name: 'data_request_message_req_idx'
      });
    }

    for (const col of [
      { name: 'clarification_status', type: Sequelize.STRING(30), defaultValue: 'none' },
      { name: 'clarification_token', type: Sequelize.STRING, allowNull: true },
      { name: 'clarification_token_expires_at', type: Sequelize.DATE, allowNull: true }
    ]) {
      const colExists = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'data_request'
              AND column_name = '${col.name}'
          );
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (!colExists[0].exists) {
        const def = { type: col.type, allowNull: true };
        if (col.defaultValue != null) {
          def.defaultValue = col.defaultValue;
          def.allowNull = false;
        }
        await queryInterface.addColumn('data_request', col.name, def);
      }
    }

    await queryInterface.sequelize.query(`
      UPDATE data_request
      SET clarification_status = 'none'
      WHERE clarification_status IS NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('data_request_message').catch(() => {});

    for (const colName of [
      'clarification_token_expires_at',
      'clarification_token',
      'clarification_status'
    ]) {
      const colExists = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'data_request'
              AND column_name = '${colName}'
          );
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (colExists[0].exists) {
        await queryInterface.removeColumn('data_request', colName);
      }
    }
  }
};
