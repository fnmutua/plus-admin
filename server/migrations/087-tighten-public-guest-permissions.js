'use strict';

/**
 * Tighten the public (guest) role: dashboards + settlement/project maps only.
 * Removes documents, exports, OTP, verify, facilities inventory, parcels, history, etc.
 */
const PUBLIC_PERMISSIONS = [
  'article:read',
  'chart_indicator:read',
  'component:read',
  'dashboard:read',
  'dashboard_card:read',
  'dashboard_section:read',
  'dashboard_section_chart:read',
  'domain:read',
  'intervention:read',
  'intervention_type:read',
  'programme_implementation:read',
  'project:read',
  'project_location:read',
  'settlement:read',
  'settlement:viewMap',
  'settlement:view_map',
  'status:read',
];

module.exports = {
  up: async (queryInterface) => {
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'public' LIMIT 1`
    );
    if (!roles.length) {
      console.log('⚠️  public role not found — skipping guest permission tighten');
      return;
    }
    const roleId = roles[0].id;

    await queryInterface.sequelize.query(
      `DELETE FROM role_permissions WHERE roleid = :roleId`,
      { replacements: { roleId } }
    );

    for (const name of PUBLIC_PERMISSIONS) {
      await queryInterface.sequelize.query(
        `
          INSERT INTO role_permissions (roleid, permissionid)
          SELECT :roleId, p.id
          FROM permissions p
          WHERE p.name = :name
            AND NOT EXISTS (
              SELECT 1 FROM role_permissions rp
              WHERE rp.roleid = :roleId AND rp.permissionid = p.id
            )
        `,
        { replacements: { roleId, name } }
      );
    }

    console.log(
      `✅ public role reset to ${PUBLIC_PERMISSIONS.length} guest-safe permissions`
    );
  },

  down: async () => {
    // Irreversible without the previous full public permission dump.
    console.log(
      '⚠️  087 down is a no-op; re-run seed_permissions.js from a prior revision to restore.'
    );
  },
};
