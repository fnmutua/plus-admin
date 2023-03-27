const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('other_facility', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
   
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
  
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    condition: {
      type: DataTypes.STRING,
      allowNull: true
    },

    frequency: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    type_waste: {
      type: DataTypes.STRING,
      allowNull: true
    },

    cost_per_use: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_stances: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    
    number_staff: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_phases: {
      type: DataTypes.STRING,
      allowNull: true
    },

    
    size_reserve: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    rating: {
      type: DataTypes.STRING,
      allowNull: true
    },
    

    number_vehicles: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    date_install: {
      type: DataTypes.DATE,
      allowNull: true
    },

    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    },


    ownership_type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    owner: {
      type: DataTypes.STRING,
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



    
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'other_facility',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "other_facility_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
