'use strict';

/**
 * `code` used to be a per-report uuid with a unique constraint. It is now the
 * shared filing code linking all indicator reports created in one bulk
 * submission, so uniqueness must go; keep a plain index for filing lookups.
 */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE indicator_category_report DROP CONSTRAINT IF EXISTS indicator_category_report_code_key;'
    );
    // Older databases may carry it as a standalone unique index instead
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS indicator_category_report_code_key;'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS indicator_category_report_code_idx ON indicator_category_report (code);'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS indicator_category_report_code_idx;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE indicator_category_report ADD CONSTRAINT indicator_category_report_code_key UNIQUE (code);'
    );
  },
};
