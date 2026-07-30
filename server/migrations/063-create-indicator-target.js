'use strict';

async function tableExists(queryInterface, Sequelize, tableName) {
  const rows = await queryInterface.sequelize.query(
    `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = :tableName
      ) AS exists;
    `,
    { type: Sequelize.QueryTypes.SELECT, replacements: { tableName } },
  );
  return Boolean(rows[0]?.exists);
}

/** Annual / project / location targets for M&E indicators (COB-aligned). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const exists = await tableExists(queryInterface, Sequelize, 'indicator_target');
    if (exists) return;

    await queryInterface.createTable('indicator_target', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      indicator_category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'indicator_category', key: 'id' },
        onDelete: 'CASCADE',
      },
      fiscal_year: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      scope_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'project',
      },
      programme_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'programmex', key: 'id' },
        onDelete: 'SET NULL',
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'project', key: 'id' },
        onDelete: 'CASCADE',
      },
      project_location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'project_location', key: 'id' },
        onDelete: 'CASCADE',
      },
      delivery_unit: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      target_value: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      target_kind: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'absolute',
      },
      portfolio_denominator: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('indicator_target', ['indicator_category_id'], {
      name: 'indicator_target_indicator_category_id_idx',
    });
    await queryInterface.addIndex('indicator_target', ['project_id', 'fiscal_year'], {
      name: 'indicator_target_project_fiscal_year_idx',
    });
    await queryInterface.addIndex('indicator_target', ['fiscal_year', 'scope_type'], {
      name: 'indicator_target_fiscal_scope_idx',
    });

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX indicator_target_project_scope_unique
      ON indicator_target (indicator_category_id, fiscal_year, project_id)
      WHERE scope_type = 'project' AND project_location_id IS NULL;
    `);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX indicator_target_location_scope_unique
      ON indicator_target (indicator_category_id, fiscal_year, project_id, project_location_id)
      WHERE scope_type = 'project_location' AND project_location_id IS NOT NULL;
    `);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX indicator_target_programme_scope_unique
      ON indicator_target (
        indicator_category_id,
        fiscal_year,
        COALESCE(programme_id, -1),
        COALESCE(delivery_unit, '')
      )
      WHERE scope_type = 'programme';
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('indicator_target');
  },
};
