'use strict';

async function tableExists(queryInterface, Sequelize, tableName) {
  const rows = await queryInterface.sequelize.query(
    `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = :tableName
      ) AS exists;
    `,
    { type: Sequelize.QueryTypes.SELECT, replacements: { tableName } },
  );
  return Boolean(rows[0]?.exists);
}

/** Audit trail for project edits and deletes — mirrors settlement_history for restoration. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const exists = await tableExists(queryInterface, Sequelize, 'project_history');

    if (!exists) {
      await queryInterface.createTable('project_history', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        project_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'project', key: 'id' },
          onDelete: 'SET NULL',
        },
        changed_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
        },
        changes: {
          type: Sequelize.JSONB,
          allowNull: false,
        },
        change_type: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'Edit',
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'Open',
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('project_history', ['project_id'], {
        name: 'project_history_project_id_idx',
      });
      await queryInterface.addIndex('project_history', ['change_type', 'status'], {
        name: 'project_history_change_type_status_idx',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('project_history');
  },
};
