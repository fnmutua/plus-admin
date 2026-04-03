'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'document_link'
      );
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!tableExists[0].exists) {
      await queryInterface.createTable('document_link', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        document_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'document', key: 'id' },
          onDelete: 'CASCADE',
        },
        entity_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        entity_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      }, { schema: 'public' });

      await queryInterface.addIndex('document_link', ['document_id', 'entity_type', 'entity_id'], {
        unique: true,
        name: 'document_link_unique',
      });

      await queryInterface.addIndex('document_link', ['entity_type', 'entity_id'], {
        name: 'document_link_entity_idx',
      });

      console.log('Created document_link table');
    } else {
      console.log('document_link table already exists, skipping');
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('document_link');
  },
};
