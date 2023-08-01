const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('post_evaluation', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
 
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    findings: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
















    
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
  }, {
    sequelize,
    tableName: 'post_evaluation',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "post_evaluation_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
