const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Streetlight = sequelize.define('streetlight', {
    

    road_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    condition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
   
    isApproved: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOMETRY('POINT', 4326),  // Stores coordinates as POINT
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
  }, {
    tableName: 'streetlight',
    timestamps: false,

        indexes: [
       
       {
        name: 'unique_streetlight_key',
        unique: true,
        fields: ['road_name', 'settlement_id', 'ward_id']
      },
      // Kee

    ]


  });

  return Streetlight;
};
