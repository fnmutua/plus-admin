'use strict';

/** Regional report review permissions — national admins only (public submit stays open). */
module.exports = {
  up: async (queryInterface) => {
    const permissions = [
      {
        name: 'regional_report_submission:read',
        description: 'View regional progress report submissions',
      },
      {
        name: 'regional_report_submission:review',
        description: 'Review regional progress report submissions and linked M&E reports',
      },
    ];

    const roleNames = ['root_admin', 'super_admin', 'admin', 'slum_upgrading'];

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
    const permissionNames = [
      'regional_report_submission:read',
      'regional_report_submission:review',
    ];

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
