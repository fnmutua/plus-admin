const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
      'settlement_history',
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        settlement_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        changed_by: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        changes: {
          type: DataTypes.JSONB,
          allowNull: false
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.NOW
        }
      },
      {
        sequelize,
        tableName: 'settlement_history',
        schema: 'public',
        timestamps: true
      }
    )
  }
  