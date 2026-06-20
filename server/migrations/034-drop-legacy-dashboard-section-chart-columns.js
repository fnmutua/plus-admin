'use strict';

/**
 * Remove legacy chart config columns superseded by x_axis / y_axis / series_field.
 * Run migrate-charts-to-axis.js first to convert existing data.
 */
module.exports = {
  up: async (queryInterface) => {
    const cols = [
      'aggregation',
      'card_model_field',
      'categorized',
      'filter_field',
      'filter_function',
      'filter_value',
      'filter_option',
    ];
    for (const col of cols) {
      await queryInterface.removeColumn('dashboard_section_chart', col).catch(() => {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('dashboard_section_chart', 'aggregation', {
      type: Sequelize.STRING,
      allowNull: true,
    }).catch(() => {});
    await queryInterface.addColumn('dashboard_section_chart', 'card_model_field', {
      type: Sequelize.STRING,
      allowNull: true,
    }).catch(() => {});
    await queryInterface.addColumn('dashboard_section_chart', 'categorized', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    }).catch(() => {});
    await queryInterface.addColumn('dashboard_section_chart', 'filter_field', {
      type: Sequelize.STRING,
      allowNull: true,
    }).catch(() => {});
    await queryInterface.addColumn('dashboard_section_chart', 'filter_function', {
      type: Sequelize.STRING,
      allowNull: true,
    }).catch(() => {});
    await queryInterface.addColumn('dashboard_section_chart', 'filter_value', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    }).catch(() => {});
    await queryInterface.addColumn('dashboard_section_chart', 'filter_option', {
      type: Sequelize.STRING,
      allowNull: true,
    }).catch(() => {});
  },
};
