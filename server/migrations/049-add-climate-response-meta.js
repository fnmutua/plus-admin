'use strict';

/**
 * Adds `response_meta` to climate_assessment so multiple field groups can fill the
 * same questionnaire without clobbering each other. Stores per-question metadata
 * (answered-at timestamp, user, group label) used for newest-wins per-question merge.
 *
 * Shape:
 *   {
 *     hazard: { temperature_1: { at: "ISO", by: 12, group: "Group A" } },
 *     exposure: { ... }, sensitivity: { ... }, adaptive_capacity: { ... }
 *   }
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [hasColumn] = await queryInterface.sequelize.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'climate_assessment'
          AND column_name = 'response_meta'
      ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!hasColumn?.exists) {
      await queryInterface.addColumn('climate_assessment', 'response_meta', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE public.climate_assessment
      SET response_meta = '{}'::jsonb
      WHERE response_meta IS NULL;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('climate_assessment', 'response_meta').catch(() => {});
  },
};
