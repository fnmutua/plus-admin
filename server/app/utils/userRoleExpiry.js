const { Op } = require('sequelize');

/**
 * Parse optional expiry from API (ISO date string or Date). Empty / invalid → null (no end date).
 */
function parseExpiresAtInput(value) {
  if (value === undefined || value === null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** Sequelize condition: assignment is still valid at `now`. */
function activeGrantWhere(now = new Date()) {
  return {
    [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: now } }],
  };
}

/** Options for User#getRoles / Role#getUsers — filter join rows on user_roles. */
function getActiveRolesGetOptions() {
  return {
    through: {
      where: activeGrantWhere(),
    },
  };
}

module.exports = {
  parseExpiresAtInput,
  activeGrantWhere,
  getActiveRolesGetOptions,
};
