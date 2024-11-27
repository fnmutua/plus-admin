const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('article', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false
    },  

    url: {
      type: DataTypes.STRING,
      allowNull: false
    },  
    
    date: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // cover_photo: {
    //   type: DataTypes.BLOB, // Updated to BLOB
    //   allowNull: true
    // },

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
    tableName: 'article',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "article_pkey",
        unique: true,
        fields: [
          { name: "id" },
          
        ]
      },

      {
        unique: true,
        fields: ['title', 'url' ]
    }
    ]
  });
};
