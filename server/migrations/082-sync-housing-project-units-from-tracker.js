'use strict';

/**
 * Housing units: project-level targets from Regional Tracker + AC-SH indicator
 * on every housing-eligible project (not programme COB for dashboard target).
 *
 * Tracker sync is optional (skips if xlsx missing). Indicator config always runs.
 */

const {
  syncHousingUnitTargetsFromTracker,
  syncHousingIndicatorConfig,
} = require('../lib/syncHousingUnitsFromTracker');

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();

    try {
      let activityId;
      let categoryId;

      try {
        const result = await syncHousingUnitTargetsFromTracker(sequelize, transaction);
        ({ activityId, categoryId } = result);
        const { stats } = result;

        if (!stats.skipped) {
          console.log(
            `[082] Tracker sync: ${stats.trackerRows} rows, ${stats.matched} matched, ` +
              `${stats.unmatched} unmatched, ${stats.upserted} project targets upserted.`,
          );
        }
      } catch (trackerErr) {
        console.warn('[082] Tracker sync failed (continuing with indicator config):', trackerErr.message);
      }

      const cfg = await syncHousingIndicatorConfig(sequelize, transaction, {
        activityId,
        categoryId,
      });
      console.log(`[082] AC-SH linked on ${cfg.linked} project(s); removed ${cfg.cleaned} bad unit target(s).`);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async () => {
    console.warn('[082] down not implemented.');
  },
};
