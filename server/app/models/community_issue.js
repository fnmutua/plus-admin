const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'community_issue',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      county_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      subcounty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ward_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      issue_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      severity: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'medium',
      },
      reporter_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reporter_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      geom: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Submitted',
      },
      isApproved: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Pending',
      },
      resolution_note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'community_issue',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['code'],
        },
        {
          fields: ['settlement_id'],
        },
        {
          fields: ['county_id'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['issue_type'],
        },
      ],
    }
  )
}
