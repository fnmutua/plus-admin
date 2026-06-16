'use strict';

/**
 * grievance_log resolution/detail columns were VARCHAR(255), causing
 * "value too long for type character varying(255)" on resolve submissions.
 */
const TEXT_COLUMNS = [
  'agreement',
  'reffered_to',
  'field_investigations',
  'point_disagreement',
  'issues',
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const columnName of TEXT_COLUMNS) {
      const [row] = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'grievance_log'
              AND column_name = '${columnName}'
          ) AS exists;
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (row?.exists) {
        await queryInterface.sequelize.query(
          `ALTER TABLE public.grievance_log ALTER COLUMN "${columnName}" TYPE TEXT;`
        );
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    for (const columnName of TEXT_COLUMNS) {
      const [row] = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'grievance_log'
              AND column_name = '${columnName}'
          ) AS exists;
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (row?.exists) {
        await queryInterface.sequelize.query(
          `ALTER TABLE public.grievance_log ALTER COLUMN "${columnName}" TYPE VARCHAR(255);`
        );
      }
    }
  },
};
