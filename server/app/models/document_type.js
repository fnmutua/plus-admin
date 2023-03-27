const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('document_type', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    group: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
 
  }, {
    sequelize,
    tableName: 'document_type',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "document_type_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },

      {
        unique: true,
        fields: ['type', 'group']
      } 
    ]
  });
};
