const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_contractor', {

    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'project',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced project is deleted

    },
    contractor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'contractor',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced project is deleted
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    
      role: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          isIn: [['Main Contractor', 'Subcontractor', 'Consultant','Other'   ]]
        }
      },

    scope: {
      type: DataTypes.STRING,
      allowNull: false,
      
    },




  }, {
    sequelize,
    tableName: 'project_contractor',
    schema: 'public',
    timestamps: true,

    indexes: [
      {
        name: "project_contractor_pkey",
        unique: true,
        fields: [
          { name: "project_id" },
       
        ]
      },

      {
        name: "unique_project_contarctor",
        unique: true,
        fields: ['name', 'contractor_id', 'contractor_id', 'role'] // Added unique index for specified fields
      }
    
    ]
  });
};
