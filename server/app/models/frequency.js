const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('frequency', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    frequency: {
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
    tableName: 'frequency',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "frequency_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },

    
    ]
  });
};
