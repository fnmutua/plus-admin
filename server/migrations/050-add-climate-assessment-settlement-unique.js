'use strict';

/**
 * Enforce one climate assessment per settlement.
 * Removes duplicate rows (keeps the most recently updated per settlement), then adds a unique index.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop non-unique index if present; replace with unique constraint.
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS climate_assessment_settlement_idx;
    `);

    // Keep the newest row per settlement; delete older duplicates (test data is disposable).
    await queryInterface.sequelize.query(`
      DELETE FROM public.climate_assessment AS ca
      WHERE ca.id NOT IN (
        SELECT DISTINCT ON (settlement_id) id
        FROM public.climate_assessment
        ORDER BY settlement_id, updated_at DESC NULLS LAST, id DESC
      );
    `);

    const [hasUnique] = await queryInterface.sequelize.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'climate_assessment'
          AND indexname = 'climate_assessment_settlement_uniq'
      ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!hasUnique?.exists) {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX climate_assessment_settlement_uniq
        ON public.climate_assessment (settlement_id);
      `);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS climate_assessment_settlement_uniq;
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS climate_assessment_settlement_idx
      ON public.climate_assessment (settlement_id);
    `);
  },
};
