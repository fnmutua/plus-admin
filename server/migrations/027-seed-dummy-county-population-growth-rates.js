'use strict';

/**
 * Preload placeholder county growth rates (2020–2030) for testing projections.
 * Adjust later via Population Settings → County growth rates.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const counties = await queryInterface.sequelize.query(
      `SELECT id, name FROM county ORDER BY id`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!counties.length) {
      return;
    }

    const fromYear = 2020;
    const toYear = 2030;
    const now = new Date();
    const rows = [];

    for (const county of counties) {
      // Slight variation by county id (2.2% – 3.4%) so the grid is not flat dummy data.
      const basePct = 2.2 + ((Number(county.id) * 17) % 13) * 0.1;
      const annual_rate = Math.round(basePct * 10) / 1000;

      for (let year = fromYear; year <= toYear; year++) {
        rows.push({
          county_id: county.id,
          year,
          annual_rate,
          notes: 'Dummy seed — adjust in Population Settings',
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Skip counties/years that already have a rate (safe to re-run migration).
    await queryInterface.bulkInsert('county_population_growth_rate', rows, {
      ignoreDuplicates: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
        DELETE FROM county_population_growth_rate
        WHERE notes = 'Dummy seed — adjust in Population Settings'
      `
    );
  },
};
