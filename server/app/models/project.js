const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
   
  
    level: {
      type: DataTypes.STRING,
      allowNull: false,
     },


    title: {
      type: DataTypes.STRING,
      allowNull: false,
     },

     project_code: {
      type: DataTypes.STRING,
      allowNull: true
    },

    component_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    implementation_id: {
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
    
    cost: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    
    sourceFunding: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false
    },

    male_beneficiaries: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    female_beneficiaries: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    contractor_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

  
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique:true
    },  
    

    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },


  }, {
    sequelize,
    tableName: 'project',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "project_county_pkey",
        unique: true,
        fields: [
          { name: "id" },
          { name: "title" },
          { name: "start_date" },
          { name: "end_date" },
          { name: "component_id" },
        ]
      },
     
    ]
  }
  
  );
};




