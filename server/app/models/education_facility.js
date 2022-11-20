const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('education_facility', {
    
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    school_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
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
    catchment: {
      type: DataTypes.STRING,
      allowNull: true
    },

    male_enrollment: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

   female_enrollment: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_teachers: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_other_staff: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
   
    number_classrooms: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    number_male_toilets: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    number_female_toilets: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    avg_fees_term: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_handwashing_stns: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mhm: {
      type: DataTypes.STRING,
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
      allowNull: false
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
    tableName: 'education_facility',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "education_facility_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
