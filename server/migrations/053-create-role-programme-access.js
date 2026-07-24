'use strict';

/** Per-role programme visibility for project/programme data scoping. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [exists] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'role_programme_access'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (exists?.exists) return;

    await queryInterface.createTable('role_programme_access', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      programme_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'programmex', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('role_programme_access', ['role_id'], {
      name: 'role_programme_access_role_id_idx',
    });
    await queryInterface.addIndex('role_programme_access', ['programme_id'], {
      name: 'role_programme_access_programme_id_idx',
    });
    await queryInterface.addIndex('role_programme_access', ['role_id', 'programme_id'], {
      unique: true,
      name: 'role_programme_access_role_programme_uq',
    });

    const rolesTable = await queryInterface.describeTable('roles').catch(() => null);
    if (rolesTable && !rolesTable.programme_scope_limited) {
      await queryInterface.addColumn('roles', 'programme_scope_limited', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('role_programme_access').catch(() => {});
  },
};
