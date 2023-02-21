const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
   
    location_level: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    county_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    subcounty_id: {
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
    component_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
  
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
  
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    domain_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    
    category_id: {
      type: DataTypes.INTEGER,
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
      allowNull: false,
      unique:true
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
