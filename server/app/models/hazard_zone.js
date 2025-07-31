const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HazardZone = sequelize.define('hazard_zone', {
   
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    place_name: {
      type: DataTypes.STRING,  // Matches 'Name_of_Place_Location'
      allowNull: false,
    },
    hazard_type: {
      type: DataTypes.STRING,  // Matches 'Type_of_Hazard'
      allowNull: true,
    },
    nature: {
      type: DataTypes.STRING,  // Matches 'Nature'
      allowNull: true,
    },
    number_of_affected_persons: {
      type: DataTypes.INTEGER,  // Matches 'Number_of_Affected_Persons__approx_'
      allowNull: true,
    },
    frequency_of_occurrence: {
      type: DataTypes.STRING,  // Matches 'Frequency_of_Occurrence'
      allowNull: true,
    },
    damage_cost: {
      type: DataTypes.FLOAT,  // Matches 'Approximate_Damage_Cost'
      allowNull: true,
    },
   
 
   
    code: {
      type: DataTypes.STRING,  // Matches 'code'
      allowNull: false,
      unique: true
    },
  
    comment: {
      type: DataTypes.TEXT,  // Matches 'Comment'
      allowNull: true,
    },
 
    isApproved: {
      type: DataTypes.STRING,  // Matches 'isApproved'
      allowNull: true,
    },
    geom : {
      type: DataTypes.GEOMETRY('GEOMETRY', 4326),  // Can store any geometry type, such as Point, Polygon, LineString, etc.
      allowNull: false,
    }, 
  }, {
    tableName: 'hazard_zone',
    timestamps: false,
 
  });

  return HazardZone;
};
