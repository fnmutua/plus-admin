'use strict';

/**
 * Store Kenyan mobiles as +254 followed by the 9-digit subscriber number, and
 * turn on the login rate limit.
 *
 * Phones were saved as 0712…, 254712…, +254712…, or a bare 712…. Login only
 * searched the first two, so accounts stored with a + could not sign in by
 * phone. Lookup now accepts every form; this pass stops new rows from
 * drifting again. Numbers that are not Kenyan mobiles are left as stored.
 *
 * rate_limit_login was off, so thirty wrong attempts in three minutes were
 * accepted. It is enabled here in the same migration as the phone fix, so
 * people are not throttled while the lookup bug is still live.
 */

function canonicalKenyaMobile(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.includes('@')) return null;
  if (!/^[\d\s()+.-]+$/.test(trimmed)) return null;

  const compact = trimmed.replace(/[\s()\-.]/g, '');
  let local = null;
  if (/^(?:\+?254|0)[17]\d{8}$/.test(compact)) {
    const digits = compact.replace(/^\+/, '');
    local = digits.startsWith('254') ? '0' + digits.slice(3) : digits;
  } else if (/^[17]\d{8}$/.test(compact)) {
    local = '0' + compact;
  }

  if (!local || !/^0[17]\d{8}$/.test(local)) return null;
  return '+254' + local.slice(1);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const rows = await queryInterface.sequelize.query(
        `SELECT id, phone FROM users WHERE phone IS NOT NULL AND btrim(phone) <> ''`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      let updated = 0;
      for (const row of rows) {
        const next = canonicalKenyaMobile(row.phone);
        if (!next || next === row.phone) continue;
        await queryInterface.sequelize.query(
          `UPDATE users SET phone = :phone WHERE id = :id`,
          { replacements: { phone: next, id: row.id }, transaction }
        );
        updated += 1;
      }

      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM module_settings WHERE module = 'rate_limit_login' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (existing.length) {
        await queryInterface.sequelize.query(
          `UPDATE module_settings
             SET enabled = true, "updatedAt" = NOW()
           WHERE module = 'rate_limit_login'`,
          { transaction }
        );
      } else {
        await queryInterface.bulkInsert(
          'module_settings',
          [
            {
              module: 'rate_limit_login',
              enabled: true,
              description:
                'Brute-force protection on login endpoints: max 10 attempts per IP every 15 minutes.',
              config_value: null,
              created_by: null,
              updated_by: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction }
        );
      }

      console.log(`Normalized ${updated} Kenyan mobile numbers to +254…`);
    });
  },

  down: async (queryInterface) => {
    // Previous spellings of each phone are not recoverable.
    await queryInterface.sequelize.query(
      `UPDATE module_settings SET enabled = false, "updatedAt" = NOW() WHERE module = 'rate_limit_login'`
    );
  },
};
