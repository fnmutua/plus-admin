'use strict';

/**
 * Stores immutable snapshots of a climate assessment each time it is submitted
 * (status set to completed). One live row per settlement; history lives here.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [hasTable] = await queryInterface.sequelize.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'climate_assessment_version'
      ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!hasTable?.exists) {
      await queryInterface.sequelize.query(`
        CREATE TABLE public.climate_assessment_version (
          id SERIAL PRIMARY KEY,
          assessment_id INTEGER NOT NULL
            REFERENCES public.climate_assessment(id) ON UPDATE CASCADE ON DELETE CASCADE,
          settlement_id INTEGER NOT NULL
            REFERENCES public.settlement(id) ON UPDATE CASCADE ON DELETE CASCADE,
          version_number INTEGER NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'completed',
          question_config_version INTEGER NULL,
          hazard_responses JSONB NULL,
          exposure_responses JSONB NULL,
          sensitivity_responses JSONB NULL,
          adaptive_capacity_responses JSONB NULL,
          response_meta JSONB NULL DEFAULT '{}'::jsonb,
          geom GEOMETRY(Geometry, 4326) NULL,
          assessed_at TIMESTAMPTZ NULL,
          hazard_score DECIMAL(10, 2) NULL,
          exposure_score DECIMAL(10, 2) NULL,
          sensitivity_score DECIMAL(10, 2) NULL,
          adaptive_capacity_score DECIMAL(10, 2) NULL,
          vulnerability_score DECIMAL(10, 4) NULL,
          vulnerability_rating VARCHAR(32) NULL,
          risk_score DECIMAL(10, 4) NULL,
          risk_rating VARCHAR(32) NULL,
          change_type VARCHAR(32) NOT NULL DEFAULT 'completed',
          created_by INTEGER NULL
            REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX climate_assessment_version_assessment_version_uniq
        ON public.climate_assessment_version (assessment_id, version_number);
      `);

      await queryInterface.sequelize.query(`
        CREATE INDEX climate_assessment_version_assessment_id_idx
        ON public.climate_assessment_version (assessment_id);
      `);

      await queryInterface.sequelize.query(`
        CREATE INDEX climate_assessment_version_settlement_id_idx
        ON public.climate_assessment_version (settlement_id);
      `);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS public.climate_assessment_version;
    `);
  },
};
