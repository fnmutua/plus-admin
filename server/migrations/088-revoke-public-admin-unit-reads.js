'use strict';

/** Remove county/subcounty/ward reads from the public (guest) role. */
const REVOKE = ['county:read', 'subcounty:read', 'ward:read'];

module.exports = {
  up: async (queryInterface) => {
    for (const name of REVOKE) {
      await queryInterface.sequelize.query(
        `
          DELETE FROM role_permissions rp
          USING roles r, permissions p
          WHERE rp.roleid = r.id
            AND rp.permissionid = p.id
            AND r.name = 'public'
            AND p.name = :name
        `,
        { replacements: { name } }
      );
    }
    console.log('✅ Revoked county/subcounty/ward from public role');
  },

  down: async (queryInterface) => {
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'public' LIMIT 1`
    );
    if (!roles.length) return;
    const roleId = roles[0].id;
    for (const name of REVOKE) {
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
  },
};
