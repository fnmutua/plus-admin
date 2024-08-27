const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'grievance_log',
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
        enum: ['Created', 'Updated', 'Resolved', 'Escalated', 'Document Requested','Document Uploaded'],
        allowNull: false
      },
 
      action_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

 

      date_actioned: {
        type: DataTypes.DATE,
        allowNull: false
      },

      prev_status: {
        type: DataTypes.STRING,
        enum: ['Open', 'Investigation', 'Review', 'Resolved', 'Escalated', 'Closed'],
        allowNull: false
      },

      new_status: {
        type: DataTypes.STRING,
        enum: ['Open', 'Investigation', 'Review', 'Resolved', 'Escalated', 'Closed'],
        allowNull: false
      }


       
    },
    {
      sequelize,
      tableName: 'grievance_log',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'grievance_log_pkey',
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
