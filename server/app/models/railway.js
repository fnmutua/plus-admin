const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Railway = sequelize.define('railway', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
   
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Name_Place_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Number_of_Tracks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Reserve_Width_m: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    Traffic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reserve_encroached: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Rail_tracks_Condition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Reserve_Condition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  
    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
    
    
    settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
  
      ward_id: {
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


    isApproved: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOMETRY('MULTILINESTRING', 4326), // assumes WGS84
      allowNull: false,
    },
  }, {
    tableName: 'railway',
    timestamps: true,
   
  });

  return Railway;
};
