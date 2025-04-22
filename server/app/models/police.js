const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Police = sequelize.define('police_station', {
    
   
    PC_Name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PC_Type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PC_Number_of_Officers: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    PC_Number_of_Vehicles: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PC_Condition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    settlement_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
    Code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
   
  
    isApproved: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOMETRY('POINT', 4326), // using WGS84 lat/lon
      allowNull: true,
    },
  }, {
    tableName: 'police_station',
    timestamps: true,
  });

  return Police;
};
