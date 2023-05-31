const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('health_facility', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    facility_number: {
      type: DataTypes.STRING,
      allowNull: true
    },

   
    level: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reg_status: {
      type: DataTypes.STRING,
      allowNull: true
    },

    ownership_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: true
    },

    

    inpatient: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },

    patients_per_day: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_beds: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    occupancy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
   
    number_doctors: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    number_clinical_officers: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    number_pharm: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_nurses: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    parcel_tenure: {
      type: DataTypes.STRING,
      allowNull: true
    },

    tenancy: {
      type: DataTypes.STRING,
      allowNull: true
    },

    settlement_id: {
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
  
    
    services: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },

    
    referrals: {
      type:  DataTypes.STRING ,
      allowNull: true
 
    },


     isApproved: {
      type: DataTypes.STRING,
      defaultValue: 'Pending'
    },
     
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
 
 

    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },

  }, {
    sequelize,
    tableName: 'health_facility',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "health_facility_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
