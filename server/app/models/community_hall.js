const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CommunityHall = sequelize.define('community_hall', {
   
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
 
    community_hall_name: {
      type: DataTypes.STRING,  // Matches 'CS_Name'
      allowNull: true,
    },
    use: {
      type: DataTypes.STRING,  // Matches 'CS_Use'
      allowNull: true,
    },
    usage_fee: {
      type: DataTypes.FLOAT,  // Matches 'CS_Usage_Fee'
      allowNull: true,
    },
    condition: {
      type: DataTypes.STRING,  // Matches 'CS_Condition'
      allowNull: true,
    },
    ownership: {
      type: DataTypes.STRING,  // Matches 'CS_Ownership'
      allowNull: true,
    },
    owner: {
      type: DataTypes.STRING,  // Matches 'CS_Owner'
      allowNull: true,
    },
   
    code: {
      type: DataTypes.STRING,  // Matches 'code'
      allowNull: false,
    },
    reference_name: {
      type: DataTypes.STRING,  // Matches 'RI_name'
      allowNull: true,
    },
   
    isApproved: {
      type: DataTypes.STRING,  // Matches 'isApproved'
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOMETRY('POINT', 4326),  // Matches GeoJSON 'geometry' and stores lat/lon as POINT
      allowNull: false,
    },
  }, {
    tableName: 'community_hall',
    timestamps: true,
  });

  return CommunityHall;
};
