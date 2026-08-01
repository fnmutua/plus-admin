'use strict';

/** Public regional quarterly progress submissions (no login). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [exists] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'regional_report_submission'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (exists?.exists) return;

    await queryInterface.createTable('regional_report_submission', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      filing_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      region: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fiscal_year: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      period: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      report_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      submitter_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      submitter_title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      co_submitters: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'submitted',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      project_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex('regional_report_submission', ['region', 'fiscal_year', 'period'], {
      name: 'regional_report_submission_region_period_idx',
    });
    await queryInterface.addIndex('regional_report_submission', ['filing_code'], {
      name: 'regional_report_submission_filing_code_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('regional_report_submission');
  },
};
