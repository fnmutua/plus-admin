'use strict';

/**
 * Ensure Social housing units indicator is reportable on every housing project.
 *
 * Indicator is activity-scoped → activity AC-SH (Construct social housing units).
 * Projects need a project_activity row linking the AC-SH activity.
 *
 * Adds AC-SH where the project title matches housing tender rules but the link is missing.
 */

const {
  resolveActivityIdByCode,
  resolveSocialHousingCategoryId,
} = require('../lib/migrationSudHelpers');

const HOUSING_ACTIVITY_CODE = 'AC-SH';

/** Title patterns from project-activity-matching social_housing rule. */
const HOUSING_TITLE_SQL = `
  p.title ~* 'social housing|housing units|bedsit|bedroom unit|met site|kamiti|kasarani|kibera|mariguini|sepu|mukuru|dormitor|design, build and finance|affordable housing|lpg fittings|excavation equipment|furnishing of social|hire of excavation'
`;

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const activityId = await resolveActivityIdByCode(sequelize, HOUSING_ACTIVITY_CODE, transaction);
      if (!activityId) {
        console.warn(`[081] Activity ${HOUSING_ACTIVITY_CODE} not found; skipping.`);
        await transaction.commit();
        return;
      }

      const categoryId = await resolveSocialHousingCategoryId(sequelize, transaction);
      if (!categoryId) {
        console.warn('[081] Social housing units indicator category not found; continuing with AC-SH links only.');
      }

      /** Drop AC-SH from projects that are not housing (e.g. mis-linked earlier). */
      const [removed] = await sequelize.query(
        `
          DELETE FROM project_activity pa
          USING project p
          JOIN component c ON c.id = p.component_id
          WHERE pa.project_id = p.id
            AND pa.activity_id = :activityId
            AND NOT (
              ${HOUSING_TITLE_SQL.trim()}
              OR (
                c.programme_id = 16
                AND NOT (p.title ~* 'floodlight|flood light|high mast|solar powered|water reticulation|borehole')
              )
            )
          RETURNING p.id, p.title
        `,
        { replacements: { activityId }, transaction },
      );
      if (removed.length) {
        console.log(`[081] Removed AC-SH from ${removed.length} non-housing project(s).`);
      }

      const [candidates] = await sequelize.query(
        `
          SELECT p.id, p.title, c.programme_id
          FROM project p
          JOIN component c ON c.id = p.component_id
          WHERE NOT EXISTS (
            SELECT 1 FROM project_activity pa
            WHERE pa.project_id = p.id AND pa.activity_id = :activityId
          )
          AND (
            ${HOUSING_TITLE_SQL}
            OR (
              c.programme_id = 16
              AND NOT (p.title ~* 'floodlight|flood light|high mast|solar powered|water reticulation|borehole')
            )
          )
          ORDER BY p.id
        `,
        {
          replacements: { activityId },
          transaction,
        },
      );

      /** Exclude mis-tagged prog-16 infra (floodlights, water) — not housing unit projects. */
      const excludePattern =
        /floodlight|flood light|high mast|solar powered|water reticulation|borehole/i;

      const toInsert = candidates.filter((row) => {
        const title = String(row.title || '');
        if (excludePattern.test(title) && !/social housing|housing units|bedsit|bedroom|met site|kamiti|kasarani|kibera|mariguini|sepu|mukuru/i.test(title)) {
          return false;
        }
        return true;
      });

      let inserted = 0;
      for (const row of toInsert) {
        await sequelize.query(
          `
            INSERT INTO project_activity (project_id, activity_id, "createdAt", "updatedAt")
            VALUES (:projectId, :activityId, NOW(), NOW())
            ON CONFLICT (project_id, activity_id) DO NOTHING
          `,
          {
            replacements: { projectId: row.id, activityId },
            transaction,
          },
        );
        inserted += 1;
        console.log(`[081] + AC-SH on project ${row.id}: ${String(row.title).slice(0, 60)}`);
      }

      await transaction.commit();
      console.log(`[081] Linked ${HOUSING_ACTIVITY_CODE} (activity ${activityId}) on ${inserted} housing project(s).`);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async () => {
    console.warn('[081] down not implemented — remove project_activity AC-SH rows manually if needed.');
  },
};
