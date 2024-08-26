const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('grievance_document', {
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
    
    grievance_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'grievance', // name of the Grievance model
        key: 'id'
      }
    },

    format: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
 
    protected_file: {
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
    tableName: 'grievance_document',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "grievance_document_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        unique: true,
        fields: ['name', 'grievance_id']
      },

       


    ]
  });
};
