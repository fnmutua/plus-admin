const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
   
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false
    },

    programme_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
  
    documentation: {
      type: DataTypes.STRING,
      allowNull: true
    },
  
 
    
    period: {
      type: DataTypes.RANGE(DataTypes.DATEONLY),
      allowNull: false
    },
    

    cost: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    male_beneficiaries: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    female_beneficiaries: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false
    },


  }, {
    sequelize,
    tableName: 'project',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "project_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
