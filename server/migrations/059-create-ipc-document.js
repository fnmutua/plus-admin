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

async function indexExists(queryInterface, indexName) {
  const [rows] = await queryInterface.sequelize.query(
    `
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = :indexName
      LIMIT 1;
    `,
    { replacements: { indexName } },
  );
  return rows.length > 0;
}

/** IPC-specific documents (consent memo, certificate, supporting files) linked to disbursements. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const exists = await tableExists(queryInterface, Sequelize, 'ipc_document');

    if (!exists) {
      await queryInterface.createTable('ipc_document', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        disbursement_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'disbursement', key: 'id' },
          onDelete: 'CASCADE',
        },
        project_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'project', key: 'id' },
          onDelete: 'CASCADE',
        },
        format: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        size: {
          type: Sequelize.DECIMAL,
          allowNull: false,
        },
        protected_file: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        createdBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        code: {
          type: Sequelize.STRING,
          allowNull: false,
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
    }

    if (!(await indexExists(queryInterface, 'ipc_document_name_disbursement_id'))) {
      await queryInterface.addIndex('ipc_document', ['name', 'disbursement_id'], {
        unique: true,
        name: 'ipc_document_name_disbursement_id',
      });
    }

    if (!(await indexExists(queryInterface, 'ipc_document_project_id'))) {
      await queryInterface.addIndex('ipc_document', ['project_id'], {
        name: 'ipc_document_project_id',
      });
    }

    if (!(await indexExists(queryInterface, 'ipc_document_disbursement_id'))) {
      await queryInterface.addIndex('ipc_document', ['disbursement_id'], {
        name: 'ipc_document_disbursement_id',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ipc_document');
  },
};
