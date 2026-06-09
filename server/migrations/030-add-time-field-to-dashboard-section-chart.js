'use strict';

/**
 * Configurable time axis for line / stacked-line dashboard charts (default: createdAt).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [row] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'dashboard_section_chart'
            AND column_name = 'time_field'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!row?.exists) {
      await queryInterface.addColumn('dashboard_section_chart', 'time_field', {
        type: Sequelize.STRING(64),
        allowNull: true,
        defaultValue: 'createdAt',
        comment: 'Field used as time axis for line charts (default createdAt)',
      });

      await queryInterface.sequelize.query(`
        UPDATE dashboard_section_chart
        SET time_field = 'createdAt'
        WHERE time_field IS NULL
      `);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('dashboard_section_chart', 'time_field').catch(() => {});
  },
};
