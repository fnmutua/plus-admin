const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrimeHotspot = sequelize.define('crime_hotspot', {
   
    CH_Name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CH_Crime_Type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CH_Frequency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CH_Crime_Target: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CH_Offender_Type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CH_Time_of_Day: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CH_num_victims: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
 
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isApproved: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOMETRY('POINT', 4326), // WGS84: lon/lat
      allowNull: true,
    },
  }, {
    tableName: 'crime_hotspot',
    timestamps: true,
  });

  return CrimeHotspot;
};
