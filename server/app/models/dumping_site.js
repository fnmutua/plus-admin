const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DumpingSite = sequelize.define('dumping_site', {
  
    DS_Name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    DS_Type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    DS_Status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
   
    DS_Type_of_Waste: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    DS_Year_Established: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    settlement_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
   
    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isApproved: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    geom : {
      type: DataTypes.GEOMETRY('POINT', 4326),  // Stores coordinates as POINT
      allowNull: false,
    },
  }, {
    tableName: 'dumping_site',
    timestamps: false,

   


  });

  return DumpingSite;
};
