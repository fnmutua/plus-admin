const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'grievance_escalation',
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
      escalated_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // name of the Grievance model
          key: 'id'
        }
      }, 
      reason: {
        type: DataTypes.STRING,
         allowNull: false
      },


      escalated_to: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // name of the Grievance model
          key: 'id'
        }
      },  
     escalated_to_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // references: {
        //   model: 'resolution_level', // name of the Grievance model
        //   key: 'id'
        // }
      }, 
      
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['Pending', 'Handled']]
        }
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
    },
    {
      sequelize,
      tableName: 'grievance_escalation',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'grievance_escalation_pkey',
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
