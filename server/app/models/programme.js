const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('programme', {
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
      
    period: {
      type: DataTypes.RANGE(DataTypes.DATEONLY),
      allowNull: true
    }, 
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
 
  }, {
    sequelize,
    tableName: 'programme',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "programme_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
