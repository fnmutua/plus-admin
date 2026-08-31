'use strict';

/** Admin permission to view the SMS delivery log. */
module.exports = {
  up: async (queryInterface) => {
    const permissions = [
      {
        name: 'sms_log:read',
        description: 'View SMS delivery log (source, destination, and status)',
      },
    ];

    const roleNames = ['root_admin', 'super_admin', 'admin', 'support'];

    for (const perm of permissions) {
      await queryInterface.sequelize.query(
        `
          INSERT INTO permissions (name, description, "createdAt", "updatedAt")
          SELECT :name, :description, NOW(), NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM permissions WHERE name = :name
          )
        `,
        { replacements: perm },
      );
    }

    for (const roleName of roleNames) {
      for (const perm of permissions) {
        await queryInterface.sequelize.query(
          `
            INSERT INTO role_permissions (roleid, permissionid)
            SELECT r.id, p.id
            FROM roles r
            CROSS JOIN permissions p
            WHERE r.name = :roleName
              AND p.name = :permName
              AND NOT EXISTS (
                SELECT 1
                FROM role_permissions rp
                WHERE rp.roleid = r.id
                  AND rp.permissionid = p.id
              )
          `,
          { replacements: { roleName, permName: perm.name } },
        );
      }
    }
  },

  down: async (queryInterface) => {
    const permissionNames = ['sms_log:read'];

    await queryInterface.sequelize.query(
      `
        DELETE FROM role_permissions rp
        USING permissions p
        WHERE rp.permissionid = p.id
          AND p.name = ANY(:permissionNames)
      `,
      { replacements: { permissionNames } },
    );

    await queryInterface.sequelize.query(
      `
        DELETE FROM permissions
        WHERE name = ANY(:permissionNames)
      `,
      { replacements: { permissionNames } },
    );
  },
};
