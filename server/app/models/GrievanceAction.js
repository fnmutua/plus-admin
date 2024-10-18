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
        enum: ['Reported', 'Updated', 'Resolved', 'Escalated', 'Document Requested','Document Uploaded','Referred','Rejected'],
        allowNull: false
      },


 
      action_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      action: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      action_level: {
        type: DataTypes.STRING,
        enum: ['none','settlement', 'county', 'national' ],
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
      },

        // resolution additional apramerts 


      resolution_date: {
        type: DataTypes.DATE,
        allowNull: true
      },

      filer_present: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },

      field_verification_conducted: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
 
      agreement_reached: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      agreement: {
        type: DataTypes.STRING,
        allowNull: true
      },
     
      field_investigations: {
        type: DataTypes.STRING,
         allowNull: true
      },

      point_disagreement: {
        type: DataTypes.STRING,
         allowNull: true
      },

      issues: {
        type: DataTypes.STRING,
         allowNull: true
      },
  
       
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
