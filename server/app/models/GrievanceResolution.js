const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'grievance_resolution',
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

      details: {
        type: DataTypes.STRING,
         allowNull: false
      },

      resolved_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // name of the Grievance model
          key: 'id'
        }
      }, 
     

    resolution_level: {
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
          isIn: [['Resolved', 'Escalated']]
        }
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
    },
    {
      sequelize,
      tableName: 'grievance_resolution',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'grievance_resolution_pkey',
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
