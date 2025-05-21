const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('education_facility', {

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    county_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },


    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },


    land_ownership_status: {
      type: DataTypes.STRING,
      allowNull: true
    },

    photo_file: {
      type: DataTypes.STRING,
      allowNull: true
    },



    respondent_name: {
      type: DataTypes.STRING,
      allowNull: true
    },

    respondent_phone: {
      type: DataTypes.STRING,
      allowNull: true
    },

    education_category: {
      type: DataTypes.STRING,
      allowNull: true
    },

    registration_status: {
      type: DataTypes.STRING,
      allowNull: true
    },

    registration_number: {
      type: DataTypes.STRING,
      allowNull: true
    },

    ownership_type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    ownership_details: {
      type: DataTypes.STRING,
      allowNull: true
    },

    boarding_type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    parcel_has_title: {
      type: DataTypes.STRING,
      allowNull: true
    },

    parcel_size_hectares: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    enrolled_boys_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    enrolled_girls_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    student_source: {
      type: DataTypes.STRING,
      allowNull: true
    },

    male_teachers_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    female_teachers_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    classroom_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    classroom_condition: {
      type: DataTypes.STRING,
      allowNull: true
    },

    boys_toilets_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    girls_toilets_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    handwashing_stations_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    toilet_condition: {
      type: DataTypes.STRING,
      allowNull: true
    },

    fees_paid_by_students: {
      type: DataTypes.STRING,
      allowNull: true
    },

    term_1_fees_amount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    term_2_fees_amount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    term_3_fees_amount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    dropout_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    dropout_reasons: {
      type: DataTypes.STRING,
      allowNull: true
    },

    retention_efforts: {
      type: DataTypes.STRING,
      allowNull: true
    },

    retention_efforts_reasons: {
      type: DataTypes.STRING,
      allowNull: true
    },

    sanitary_pads_provision: {
      type: DataTypes.STRING,
      allowNull: true
    },

    sanitary_pads_provider: {
      type: DataTypes.STRING,
      allowNull: true
    },

    sanitary_pads_bins: {
      type: DataTypes.STRING,
      allowNull: true
    },

    teaching_aids_available: {
      type: DataTypes.STRING,
      allowNull: true
    },

    boreholes_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    water_tanks_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    permanent_classrooms_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    bom_teachers_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    compound_fence_status: {
      type: DataTypes.STRING,
      allowNull: true
    },

    school_challenges: {
      type: DataTypes.STRING,
      allowNull: true
    },

   

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    efforts_for_student_retention: {
      type: DataTypes.STRING,
      allowNull: true
    },

  

    additional_comments: {
      type: DataTypes.STRING,
      allowNull: true
    },

    distance_in_meters: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    isApproved: {
      type: DataTypes.STRING,
      defaultValue: 'Pending'
    },

    geom: {
      type: DataTypes.GEOMETRY('Point', 4326),
      allowNull: true
    }

  }, {
    sequelize,
    tableName: 'education_facility',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "education_facility_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: 'unique_educ_key',
        unique: true,
        fields: ['name', 'settlement_id', 'ward_id']
      },


    ]
  });
};
