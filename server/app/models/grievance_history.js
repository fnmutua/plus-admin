const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
      'grievance_history',
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        grievance_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        changed_by: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        changes: {
          type: DataTypes.JSONB,
          allowNull: false
        },
        
        change_type: {
          type: DataTypes.STRING,
          defaultValue: 'Edit'
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: 'Open'
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.NOW
        }
      },
      {
        sequelize,
        tableName: 'grievance_history',
        schema: 'public',
        timestamps: true
      }
    )
  }
  