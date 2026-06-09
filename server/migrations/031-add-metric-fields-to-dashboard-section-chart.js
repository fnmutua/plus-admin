'use strict';

/**
 * Multiple numeric metrics for multi-variable line charts (type 12).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [row] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'dashboard_section_chart'
            AND column_name = 'metric_fields'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!row?.exists) {
      await queryInterface.addColumn('dashboard_section_chart', 'metric_fields', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        comment: 'Numeric fields for multi-variable line chart (type 12)',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('dashboard_section_chart', 'metric_fields').catch(() => {});
  },
};
