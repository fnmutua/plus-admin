'use strict';

/**
 * Axis-based chart configuration columns.
 * x_axis: what to group by (X categories)
 * y_axis: what to measure + how (Y values + aggregation)
 * series_field: optional breakdown field that creates multiple series
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const check = async (col) => {
      const [row] = await queryInterface.sequelize.query(
        `SELECT EXISTS (
           SELECT FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'dashboard_section_chart'
             AND column_name = $1
         ) AS exists`,
        { bind: [col], type: Sequelize.QueryTypes.SELECT }
      );
      return row?.exists;
    };

    if (!(await check('x_axis'))) {
      await queryInterface.addColumn('dashboard_section_chart', 'x_axis', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'X axis config: { field, label }',
      });
    }
    if (!(await check('y_axis'))) {
      await queryInterface.addColumn('dashboard_section_chart', 'y_axis', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Y axis config: { field, aggregation, label }',
      });
    }
    if (!(await check('series_field'))) {
      await queryInterface.addColumn('dashboard_section_chart', 'series_field', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Series breakdown config: { field, label } — creates one series per unique value',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('dashboard_section_chart', 'x_axis').catch(() => {});
    await queryInterface.removeColumn('dashboard_section_chart', 'y_axis').catch(() => {});
    await queryInterface.removeColumn('dashboard_section_chart', 'series_field').catch(() => {});
  },
};
