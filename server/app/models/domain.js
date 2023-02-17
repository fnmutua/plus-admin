const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('domain', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
  
     code: {
      type: DataTypes.STRING,
      allowNull: true
    },
 
  }, {
    sequelize,
    tableName: 'domain',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "domain_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
