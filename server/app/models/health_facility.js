const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('health_facility', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    facility_number: {
      type: DataTypes.STRING,
      allowNull: true
    },

    level: {
      type: DataTypes.STRING, // e.g. Level 2, Level 4
      allowNull: true
    },

    registration_status: {
      type: DataTypes.STRING, // e.g. Registered, Unregistered
      allowNull: true
    },

    ownership_type: {
      type: DataTypes.STRING, // e.g. Government, Private
      allowNull: true
    },

    owner: {
      type: DataTypes.STRING, // e.g. Public, Faith-based
      allowNull: true
    },

    land_ownership: {
      type: DataTypes.STRING, // e.g. Owned, Leased
      allowNull: true
    },

    land_title_available: {
      type: DataTypes.STRING, // e.g. Yes, No
      allowNull: true
    },

    land_parcel_size: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    condition: {
      type: DataTypes.STRING, // e.g. Good, Fair, Poor
      allowNull: true
    },

    num_inpatient: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    outpatient_visits_per_day: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    maternity_deliveries_per_day: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    antenatal_immunizations_per_day: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    general_beds: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    maternity_beds: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    pediatric_beds: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    total_beds: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    occupancy_rate: {
      type: DataTypes.FLOAT,
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

    number_pharmacists: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_nurses: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_midwives: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_other_staff: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    services_offered: {
      type: DataTypes.STRING,
      allowNull: true
    },

    referral_destinations: {
      type: DataTypes.STRING,
      allowNull: true
    },

    referral_distance_km: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    referrals_per_day: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    has_ambulance: {
      type: DataTypes.STRING, // Yes, No
      allowNull: true
    },

    source_of_drugs: {
      type: DataTypes.STRING,
      allowNull: true
    },

    common_ailments: {
      type: DataTypes.STRING,
      allowNull: true
    },

    source_of_patients: {
      type: DataTypes.STRING, // e.g. Inside Settlement
      allowNull: true
    },

    challenges: {
      type: DataTypes.TEXT,
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

    photo_filename: {
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

    settlement_name: {
      type: DataTypes.STRING,
      allowNull: true
    },

    distance_meters: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    created_by: {
      type: DataTypes.INTEGER,
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
    tableName: 'health_facility',
    schema: 'public',
    timestamps: true,
  
  });
};
