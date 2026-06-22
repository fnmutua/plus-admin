'use strict';

/**
 * Split land status into planning_status and survey_status columns.
 * Rule: only Planned settlements can be Surveyed.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const colName of ['planning_status', 'survey_status']) {
      const colExists = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'settlement'
              AND column_name = '${colName}'
          );
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (!colExists[0].exists) {
        await queryInterface.addColumn('settlement', colName, {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
    }

    await queryInterface.sequelize.query(`
      UPDATE settlement
      SET
        planning_status = CASE
          WHEN lower(btrim(land_status)) LIKE '%unplanned%' THEN 'Unplanned'
          WHEN lower(btrim(land_status)) LIKE '%planned%' THEN 'Planned'
          ELSE NULL
        END,
        survey_status = CASE
          WHEN lower(btrim(land_status)) LIKE '%unsurveyed%' THEN 'Unsurveyed'
          WHEN lower(btrim(land_status)) LIKE '%surveyed%' THEN 'Surveyed'
          ELSE NULL
        END
      WHERE planning_status IS NULL
        AND survey_status IS NULL
        AND land_status IS NOT NULL
        AND btrim(land_status) <> ''
        AND lower(btrim(land_status)) <> 'unknown';
    `);

    // Unplanned cannot be surveyed — correct legacy bad data
    await queryInterface.sequelize.query(`
      UPDATE settlement
      SET survey_status = 'Unsurveyed',
          land_status = 'Unplanned, Unsurveyed'
      WHERE planning_status = 'Unplanned'
        AND survey_status = 'Surveyed';
    `);

    await queryInterface.sequelize.query(`
      UPDATE settlement
      SET land_status = planning_status || ', ' || survey_status
      WHERE planning_status IS NOT NULL
        AND survey_status IS NOT NULL
        AND (
          land_status IS NULL
          OR btrim(land_status) = ''
          OR lower(btrim(land_status)) = 'unknown'
        );
    `);
  },

  down: async (queryInterface, Sequelize) => {
    for (const colName of ['survey_status', 'planning_status']) {
      const colExists = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'settlement'
              AND column_name = '${colName}'
          );
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (colExists[0].exists) {
        await queryInterface.removeColumn('settlement', colName);
      }
    }
  },
};
