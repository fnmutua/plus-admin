const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'grievance_action',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },

      grievance_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'grievance', // name of the Grievance model
          key: 'id'
        }
      },

      action_type: {
        type: DataTypes.STRING,
        allowNull: false
      },

      description: {
        type: DataTypes.STRING,
        allowNull: true
      },

      date_actioned: {
        type: DataTypes.DATE,
        allowNull: false
      },

      status: {
        type: DataTypes.STRING,
        enum: ['Open', 'Investigation', 'Review', 'Resolved', 'Escalated', 'Closed'],
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'grievance_action',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'grievance_action_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
        {
          fields: ['grievance_id']
        }
      ]
    }
  );
};
