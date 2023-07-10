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
   
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    acronym: {
      type: DataTypes.STRING,
      allowNull: false
    },
    icon: {
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
    tableName: 'programme_implementation',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "programme_implementation_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },

      {
        unique: true,
        fields: ['title', 'acronym'  ]
      },

    ]
  });
};
