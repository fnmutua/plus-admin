const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('contractor', {
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
 

    address: {
      type: DataTypes.STRING,
      allowNull: false
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
 
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
 
  }, {
    sequelize,
    tableName: 'contractor',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "contractor_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
