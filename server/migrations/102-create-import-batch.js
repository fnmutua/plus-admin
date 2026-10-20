'use strict';

/**
 * Import batches: a ledger of what each bulk import (QGIS connector, Excel,
 * GeoJSON) created or changed, so an import can be reviewed and undone.
 *
 * import_batch       one row per import; several upsert requests that send the
 *                    same importBatchId share it.
 * import_batch_item  one row per record the import inserted or changed, with
 *                    the field values before and after. Undo compares the
 *                    current row with "after" so later edits are never lost.
 *
 * Also grants 'import:revert', which undo requires.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = async (name) => {
      const [row] = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = :name
          ) AS exists;
        `,
        { replacements: { name }, type: Sequelize.QueryTypes.SELECT }
      );
      return Boolean(row?.exists);
    };

    if (!(await tableExists('import_batch'))) {
      await queryInterface.createTable('import_batch', {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true
        },
        model: {
          type: Sequelize.STRING(120),
          allowNull: false
        },
        source: {
          type: Sequelize.STRING(60),
          allowNull: true
        },
        label: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        status: {
          type: Sequelize.STRING(30),
          allowNull: false,
          defaultValue: 'active'
        },
        insertedCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        updatedCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        failedCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        createdBy: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        createdByName: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        revertedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        revertedBy: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        revertedByName: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        metadata: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('import_batch', ['createdAt'], {
        name: 'import_batch_created_at_idx'
      });
      await queryInterface.addIndex('import_batch', ['model'], {
        name: 'import_batch_model_idx'
      });
    }

    if (!(await tableExists('import_batch_item'))) {
      await queryInterface.createTable('import_batch_item', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        batch_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'import_batch', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        model: {
          type: Sequelize.STRING(120),
          allowNull: false
        },
        record_id: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        action: {
          type: Sequelize.STRING(20),
          allowNull: false
        },
        before: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        after: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        revertedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('import_batch_item', ['batch_id'], {
        name: 'import_batch_item_batch_idx'
      });
      await queryInterface.addIndex('import_batch_item', ['model', 'record_id'], {
        name: 'import_batch_item_record_idx'
      });
    }

    const permission = {
      name: 'import:revert',
      description: 'Review bulk imports and undo them',
    };

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

    for (const roleName of ['root_admin', 'super_admin', 'admin']) {
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
          AND p.name = 'import:revert'
      `,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM permissions WHERE name = 'import:revert'`,
    );
    await queryInterface.dropTable('import_batch_item').catch(() => {});
    await queryInterface.dropTable('import_batch').catch(() => {});
  },
};
