'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.sequelize.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'page_visit'
      );
    `,
      { type: Sequelize.QueryTypes.SELECT }
    )

    if (!tableExists[0].exists) {
      await queryInterface.createTable('page_visit', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        path: {
          type: Sequelize.STRING(500),
          allowNull: false
        },
        page_name: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        referrer: {
          type: Sequelize.STRING(1000),
          allowNull: true
        },
        user_agent: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        device_type: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        query_string: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        session_id: {
          type: Sequelize.STRING(64),
          allowNull: true
        },
        ip: {
          type: Sequelize.STRING(45),
          allowNull: true,
          comment: 'Visitor IP address (IPv4 or IPv6)'
        },
        visited_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      })

      await queryInterface.addIndex('page_visit', ['path'], {
        name: 'page_visit_path_idx'
      })
      await queryInterface.addIndex('page_visit', ['visited_at'], {
        name: 'page_visit_visited_at_idx'
      })
      await queryInterface.addIndex('page_visit', ['path', 'visited_at'], {
        name: 'page_visit_path_visited_idx'
      })
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('page_visit')
  }
}
