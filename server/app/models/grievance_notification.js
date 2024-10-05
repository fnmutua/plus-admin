const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('grievance_notification', {
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

    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },

    
    medium: {
      type: DataTypes.STRING,
      allowNull: false
    },
     
    message: {
      type: DataTypes.STRING,
      allowNull: false
    }, 

    recipient: {
      type: DataTypes.STRING,
      allowNull: false
    }, 

    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
     
 
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
 
  }, {
    sequelize,
    tableName: 'grievance_notification',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "grievance_notification_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      }, 

    ]
  });
};
