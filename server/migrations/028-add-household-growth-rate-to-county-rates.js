'use strict';

/**
 * Separate household growth rate per county per year (population uses annual_rate).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colExists = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'county_population_growth_rate'
            AND column_name = 'household_growth_rate'
        );
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!colExists[0].exists) {
      await queryInterface.addColumn('county_population_growth_rate', 'household_growth_rate', {
        type: Sequelize.DOUBLE,
        allowNull: true,
        comment: 'Annual household growth rate; population uses annual_rate',
      });

      await queryInterface.sequelize.query(`
        UPDATE county_population_growth_rate
        SET household_growth_rate = annual_rate
        WHERE household_growth_rate IS NULL
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const colExists = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'county_population_growth_rate'
            AND column_name = 'household_growth_rate'
        );
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (colExists[0].exists) {
      await queryInterface.removeColumn('county_population_growth_rate', 'household_growth_rate');
    }
  },
};
