const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('document', {
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
    report_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    category: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    format: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
   location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    protectedFile: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'document',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "document_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        unique: true,
        fields: ['name', 'report_id']
      },

      {
        unique: true,
        fields: ['name', 'settlement_id']
      },
      {
        unique: true,
        fields: ['name', 'project_id']
      },


    ]
  });
};
