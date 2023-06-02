const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('feedback', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false
    },

     message: {
      type: DataTypes.STRING,
      allowNull: false
    },
     
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Pending'
    },
     
    actionedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
     
    actionTaken: {
      type: DataTypes.STRING,
      allowNull: true,
     },


        code: {
        type: DataTypes.STRING,
        allowNull: false
      } 
  }, {
    sequelize,
    tableName: 'feedback',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "feedback_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        unique: true,
        fields: ['name','email','message']
      },
    ]
  });
};
