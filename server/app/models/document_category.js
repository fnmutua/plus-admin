const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('document_category', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
   
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
  }, {
    sequelize,
    tableName: 'document_category',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "document_categorys_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },

      {
        unique: true,
        fields: ['title']
      } 
    ]
  });
};
