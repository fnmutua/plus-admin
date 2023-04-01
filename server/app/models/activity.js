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

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
 
        code: {
        type: DataTypes.STRING,
        allowNull: false
      } 
  }, {
    sequelize,
    tableName: 'activity',
    schema: 'public',
    timestamps: true,
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
