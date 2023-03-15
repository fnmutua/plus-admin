const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('activity', {
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
 
        code: {
        type: DataTypes.STRING,
        allowNull: false
      } 
  }, {
    sequelize,
    tableName: 'activity',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "activity_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        unique: true,
        fields: ['title']
      },
    ]
  });
};
