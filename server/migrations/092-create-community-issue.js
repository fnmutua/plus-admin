'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = async (tableName) => {
      const [row] = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = '${tableName}'
          ) AS exists;
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Boolean(row?.exists);
    };

    if (await tableExists('community_issue')) {
      return;
    }

    await queryInterface.createTable('community_issue', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      code: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true,
      },
      settlement_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'settlement', key: 'id' },
        onDelete: 'SET NULL',
      },
      county_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'county', key: 'id' },
        onDelete: 'SET NULL',
      },
      subcounty_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'subcounty', key: 'id' },
        onDelete: 'SET NULL',
      },
      ward_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'ward', key: 'id' },
        onDelete: 'SET NULL',
      },
      issue_type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      description: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      severity: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: 'medium',
      },
      reporter_name: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      reporter_phone: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      geom: {
        allowNull: true,
        type: Sequelize.GEOMETRY('POINT', 4326),
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'Submitted',
      },
      isApproved: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: 'Pending',
      },
      resolution_note: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      resolved_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      resolved_by: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      project_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'project', key: 'id' },
        onDelete: 'SET NULL',
      },
      photo: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      createdBy: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('community_issue', ['settlement_id'], {
      name: 'community_issue_settlement_id_idx',
    });
    await queryInterface.addIndex('community_issue', ['county_id'], {
      name: 'community_issue_county_id_idx',
    });
    await queryInterface.addIndex('community_issue', ['status'], {
      name: 'community_issue_status_idx',
    });
    await queryInterface.addIndex('community_issue', ['issue_type'], {
      name: 'community_issue_issue_type_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('community_issue').catch(() => {});
  },
};
