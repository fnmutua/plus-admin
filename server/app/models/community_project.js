const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CommunityProject = sequelize.define('community_project', {
    
    project_type: {
      type: DataTypes.STRING,  // Matches 'CP_Type'
      allowNull: true,
    },
    owner: {
      type: DataTypes.STRING,  // Matches 'CP_Owner'
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING,  // Matches 'photo'
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,  // Matches 'comments'
      allowNull: true,
    },
    project_name: {
      type: DataTypes.STRING,  // Matches 'CP_Name'
      allowNull: true,
    },
    number_of_persons_served: {
      type: DataTypes.FLOAT,  // Matches 'CP_Number_of_Persons_Served'
      allowNull: true,
    },
    usage_fee: {
      type: DataTypes.FLOAT,  // Matches 'CP_Usage_Fee'
      allowNull: true,
    },
    condition: {
      type: DataTypes.STRING,  // Matches 'CP_Condition'
      allowNull: true,
    },
    number_of_staff: {
      type: DataTypes.FLOAT,  // Matches 'CP_Number_of_Staff'
      allowNull: true,
    },
    ownership: {
      type: DataTypes.STRING,  // Matches 'CP_Ownership'
      allowNull: true,
    },
   
  
    code: {
      type: DataTypes.STRING,  // Matches 'code'
      allowNull: false,
    },
   
    isApproved: {
      type: DataTypes.STRING,  // Matches 'isApproved'
      allowNull: true,
    },
    geom : {
      type: DataTypes.GEOMETRY('POINT', 4326),  // Matches GeoJSON 'geometry' and stores lat/lon as POINT
      allowNull: false,
    },
  }, {
    tableName: 'community_project',
    timestamps: true,
  });

  return CommunityProject;
};
