const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Mast = sequelize.define('mast', {
    
    TC_Name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    TC_Type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    TC_Condition: {
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
    tableName: 'mast',
    timestamps: false,
     indexes: [
       {
        name: 'unique_mast_key',
        unique: true,
        fields: ['TC_Name' ]
      },
     ]


  });

  return Mast;
};
