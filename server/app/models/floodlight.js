const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Floodlight = sequelize.define('floodlight', {
   
    Condition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     Place_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Rating_Watts: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    Height_Meters: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    Date_Installed: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Sponsor_Owner_Type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Sponsor_Owner: {
      type: DataTypes.STRING,
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
      allowNull: false,
    },
  }, {
    tableName: 'floodlight',
    timestamps: false,
      indexes: [
       {
        name: 'unique_foodlight_key',
        unique: true,
        fields: ['Place_name', 'settlement_id', 'ward_id']
      },

    ]


  });

  return Floodlight;
};
