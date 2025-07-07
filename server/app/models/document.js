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
    contractor_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },


    article_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

  

    beneficiary_report_id: {
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
    
    // AI Processing fields
    aiProcessed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    aiProcessedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    aiChunks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    aiDocumentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    aiWarning: {
      type: DataTypes.TEXT,
      allowNull: true
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
