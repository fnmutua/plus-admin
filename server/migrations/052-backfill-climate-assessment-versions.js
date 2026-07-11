'use strict';

/**
 * Backfill v1 submission snapshots for assessments already marked completed
 * before versioning was enabled (or missed due to the pre-update status check bug).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      INSERT INTO public.climate_assessment_version (
        assessment_id,
        settlement_id,
        version_number,
        status,
        question_config_version,
        hazard_responses,
        exposure_responses,
        sensitivity_responses,
        adaptive_capacity_responses,
        response_meta,
        geom,
        assessed_at,
        hazard_score,
        exposure_score,
        sensitivity_score,
        adaptive_capacity_score,
        vulnerability_score,
        vulnerability_rating,
        risk_score,
        risk_rating,
        change_type,
        created_by,
        created_at,
        updated_at
      )
      SELECT
        ca.id,
        ca.settlement_id,
        1,
        ca.status,
        ca.question_config_version,
        ca.hazard_responses,
        ca.exposure_responses,
        ca.sensitivity_responses,
        ca.adaptive_capacity_responses,
        COALESCE(ca.response_meta, '{}'::jsonb),
        ca.geom,
        ca.assessed_at,
        ca.hazard_score,
        ca.exposure_score,
        ca.sensitivity_score,
        ca.adaptive_capacity_score,
        ca.vulnerability_score,
        ca.vulnerability_rating,
        ca.risk_score,
        ca.risk_rating,
        'completed',
        ca.assessor_id,
        COALESCE(ca.updated_at, ca.created_at, NOW()),
        COALESCE(ca.updated_at, ca.created_at, NOW())
      FROM public.climate_assessment ca
      WHERE ca.status = 'completed'
        AND NOT EXISTS (
          SELECT 1
          FROM public.climate_assessment_version cav
          WHERE cav.assessment_id = ca.id
        );
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DELETE FROM public.climate_assessment_version
      WHERE version_number = 1
        AND change_type = 'completed';
    `).catch(() => {});
  },
};
