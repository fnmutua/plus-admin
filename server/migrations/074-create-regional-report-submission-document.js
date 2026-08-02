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

/** Supporting documents attached to public regional report submissions. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const exists = await tableExists(
      queryInterface,
      Sequelize,
      'regional_report_submission_document',
    );

    if (!exists) {
      await queryInterface.createTable('regional_report_submission_document', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        regional_report_submission_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'regional_report_submission', key: 'id' },
          onDelete: 'CASCADE',
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        format: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        size: {
          type: Sequelize.DECIMAL,
          allowNull: true,
        },
        location: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        createdBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
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

    if (
      !(await indexExists(
        queryInterface,
        'regional_report_submission_document_submission_idx',
      ))
    ) {
      await queryInterface.addIndex(
        'regional_report_submission_document',
        ['regional_report_submission_id'],
        { name: 'regional_report_submission_document_submission_idx' },
      );
    }

    if (
      !(await indexExists(
        queryInterface,
        'regional_report_submission_document_name_submission',
      ))
    ) {
      await queryInterface.addIndex(
        'regional_report_submission_document',
        ['name', 'regional_report_submission_id'],
        {
          unique: true,
          name: 'regional_report_submission_document_name_submission',
        },
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('regional_report_submission_document');
  },
};
