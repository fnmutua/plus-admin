'use strict';

/** Staff-generated, expiring, anonymous upload links tied to a project/settlement/facility. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [exists] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'upload_share_link'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (exists?.exists) return;

    await queryInterface.createTable('upload_share_link', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      entity_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isRevoked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      maxUploads: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 20
      },
      uploadCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      label: {
        type: Sequelize.STRING,
        allowNull: true
      },
      defaultCategory: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      expectedUploaderName: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex('upload_share_link', ['entity_type', 'entity_id'], {
      name: 'upload_share_link_entity_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('upload_share_link').catch(() => {});
  }
};
