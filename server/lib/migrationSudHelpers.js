'use strict';

/**
 * Shared helpers for SUD-related migrations (portable across environments).
 */

const SOCIAL_HOUSING_INDICATOR = {
  indicatorName: 'Social housing units',
  categoryTitle: 'Constructed',
};

async function queryRows(sequelize, sql, replacements = {}, transaction) {
  const options = { replacements };
  if (transaction) options.transaction = transaction;
  const [rows] = await sequelize.query(sql, options);
  return rows || [];
}

async function resolveActivityIdByCode(sequelize, code, transaction) {
  const rows = await queryRows(
    sequelize,
    `SELECT id FROM activity WHERE code = :code LIMIT 1`,
    { code },
    transaction,
  );
  return rows[0]?.id || null;
}

async function resolveSocialHousingCategoryId(sequelize, transaction) {
  const rows = await queryRows(
    sequelize,
    `
      SELECT ic.id
      FROM indicator_category ic
      WHERE ic.indicator_name ILIKE :indicatorName
        AND ic.category_title ILIKE :categoryTitle
      ORDER BY ic.id
      LIMIT 1
    `,
    {
      indicatorName: SOCIAL_HOUSING_INDICATOR.indicatorName,
      categoryTitle: SOCIAL_HOUSING_INDICATOR.categoryTitle,
    },
    transaction,
  );
  return rows[0]?.id || null;
}

async function refreshSudBundleSafe(dashboardId, label = 'SUD') {
  try {
    const { refreshDashboardBundle } = require('../app/services/nationalDashboardBundle');
    await refreshDashboardBundle(dashboardId);
    console.log(`[${label}] Refreshed Redis bundle for dashboard ${dashboardId}`);
  } catch (err) {
    console.warn(`[${label}] Bundle refresh skipped:`, err.message);
  }
}

module.exports = {
  SOCIAL_HOUSING_INDICATOR,
  queryRows,
  resolveActivityIdByCode,
  resolveSocialHousingCategoryId,
  refreshSudBundleSafe,
};
