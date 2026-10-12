'use strict';

/**
 * Grant the settlement type management permission.
 *
 * 'settlement_type:manage' has been listed in seed_permissions.js for a while
 * but no database had it, because nothing used it until the types became
 * configurable (Settings -> Platform -> Settlement Types).
 */
module.exports = {
  up: async (queryInterface) => {
    const permission = {
      name: 'settlement_type:manage',
      description: 'Manage the settlement type list used by every settlement type picker',
    };

    const roleNames = ['root_admin', 'super_admin', 'admin'];

    await queryInterface.sequelize.query(
      `
        INSERT INTO permissions (name, description, "createdAt", "updatedAt")
        SELECT :name, :description, NOW(), NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM permissions WHERE name = :name
        )
      `,
      { replacements: permission },
    );

    for (const roleName of roleNames) {
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
        { replacements: { roleName, permName: permission.name } },
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `
        DELETE FROM role_permissions rp
        USING permissions p
        WHERE rp.permissionid = p.id
          AND p.name = 'settlement_type:manage'
      `,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM permissions WHERE name = 'settlement_type:manage'`,
    );
  },
};
