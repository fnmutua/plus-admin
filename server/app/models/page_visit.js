const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'page_visit',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      path: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'URL path visited (e.g. /landing, /about, /register)'
      },
      page_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Friendly page name for reporting (e.g. Landing, About, Settlement Register)'
      },
      referrer: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        comment: 'Referrer URL - where the visitor came from'
      },
      user_agent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Browser/device user agent string'
      },
      device_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Derived device type: mobile, desktop, tablet'
      },
      query_string: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL query params (e.g. utm_source, search terms)'
      },
      session_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: 'Client-generated session ID for grouping visits'
      },
      ip: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'Visitor IP address (IPv4 or IPv6)'
      },
      visited_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When the page was visited'
      }
    },
    {
      sequelize,
      tableName: 'page_visit',
      schema: 'public',
      timestamps: false,
      indexes: [
        {
          name: 'page_visit_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
        {
          name: 'page_visit_path_idx',
          fields: [{ name: 'path' }]
        },
        {
          name: 'page_visit_visited_at_idx',
          fields: [{ name: 'visited_at' }]
        },
        {
          name: 'page_visit_path_visited_idx',
          fields: [{ name: 'path' }, { name: 'visited_at' }]
        }
      ]
    }
  )
}
