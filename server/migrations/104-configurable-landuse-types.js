'use strict';

/**
 * Make parcel land-use types fully configurable.
 *
 * landuse_type already held the ten standard uses, but maps and the QGIS
 * plugin hard-coded the same list. Add display colour, aliases (for name
 * matching on import), active flag, sort order, and description so Settings
 * can manage the list and every consumer can load it from the API.
 */

/** Physical and Land Use Planning Handbook 2025 §3.4.3 Table 6 (RGB). */
const DEFAULT_COLORS = {
  0: '#D7C29E',
  1: '#C500FF',
  2: '#FFAA00',
  3: '#A3FF73',
  4: '#FFFF00',
  5: '#FF0000',
  6: '#0070FF',
  7: '#CCCCCC',
  8: '#FFFFBE',
  9: '#FFFFE6',
};

const DEFAULT_ALIASES = {
  0: 'residential,residence',
  1: 'industrial,industry',
  2: 'education,educational',
  3: 'recreation,recreational',
  4: 'public purpose',
  5: 'commercial',
  6: 'public utility,public utilities',
  7: 'transportation,transport,roads',
  8: 'conservation,undeveloped,vacant,undeveloped land',
  9: 'agricultural,agriculture,agric',
  10: 'mixed use,mixed,mixed-use',
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = { tableName: 'landuse_type', schema: 'public' };
    const desc = await queryInterface.describeTable(table);

    if (!desc.color) {
      await queryInterface.addColumn(table, 'color', {
        type: Sequelize.STRING(32),
        allowNull: true,
      });
    }
    if (!desc.aliases) {
      await queryInterface.addColumn(table, 'aliases', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!desc.description) {
      await queryInterface.addColumn(table, 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!desc.active) {
      await queryInterface.addColumn(table, 'active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
    if (!desc.sort_order) {
      await queryInterface.addColumn(table, 'sort_order', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    await queryInterface.sequelize.query(
      `UPDATE landuse_type SET sort_order = id WHERE sort_order IS NULL OR sort_order = 0`
    );

    for (const [id, color] of Object.entries(DEFAULT_COLORS)) {
      await queryInterface.sequelize.query(
        `UPDATE landuse_type
            SET color = COALESCE(NULLIF(trim(color), ''), :color),
                aliases = COALESCE(NULLIF(trim(aliases), ''), :aliases),
                active = COALESCE(active, true),
                sort_order = COALESCE(NULLIF(sort_order, 0), :sortOrder)
          WHERE id = :id`,
        {
          replacements: {
            id: Number(id),
            color,
            aliases: DEFAULT_ALIASES[id] || null,
            sortOrder: Number(id),
          },
        }
      );
    }

    const permission = {
      name: 'landuse_type:manage',
      description: 'Manage parcel land-use types used by maps and imports',
    };
    const roleNames = ['root_admin', 'super_admin', 'admin'];

    await queryInterface.sequelize.query(
      `
        INSERT INTO permissions (name, description, "createdAt", "updatedAt")
        SELECT :name, :description, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = :name)
      `,
      { replacements: permission }
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
              SELECT 1 FROM role_permissions rp
              WHERE rp.roleid = r.id AND rp.permissionid = p.id
            )
        `,
        { replacements: { roleName, permName: permission.name } }
      );
    }
  },

  down: async (queryInterface) => {
    const table = { tableName: 'landuse_type', schema: 'public' };
    const desc = await queryInterface.describeTable(table);
    for (const column of ['color', 'aliases', 'description', 'active', 'sort_order']) {
      if (desc[column]) {
        await queryInterface.removeColumn(table, column);
      }
    }
  },
};
