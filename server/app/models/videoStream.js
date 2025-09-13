const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'video_streams',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Live Stream'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'live'
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: true
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      county: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      viewer_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      max_viewers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      recording_path: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      thumbnail_path: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      tableName: 'video_streams',
      timestamps: true,
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['start_time']
        },
        {
          fields: ['county']
        }
      ]
    }
  );
};
