const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'households',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
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


      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      national_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
      },

 

      owner_tenant: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      owner_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mode_acquisition: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ownership_doc: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      number_male_owners: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      number_female_owners: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      household_head_age: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nationality: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      marital_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      disability: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      education_level: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tenancy_agreement: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      migration_reason: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      occupation: {
        type: DataTypes.STRING,
        allowNull: true,
      },


      place_work: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      income_monthly: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      food_expenses: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      clothing_expenses: {
        type: DataTypes.STRING,
        allowNull: true,
      },


      monthly_rent: {
        type: DataTypes.STRING,
        allowNull: true,
      },




      years_in_settlement: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      prev_residence: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      age_00_04f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_00_04m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_05_09f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_05_09m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_10_14f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_10_14m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_15_19f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_15_19m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_20_24f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_20_24m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_25_29f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_25_29m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_30_34f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_30_34m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_35_39f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_35_39m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_40_44f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_40_44m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_45_49f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_45_49m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_50_54f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_50_54m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_55_59f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_55_59m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_60_64f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_60_64m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_65_69f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_65_69m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_gt_70f: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_gt_70m: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      
      structure_use: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      structure_nature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      structure_floor_material: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      structure_wall_material: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      structure_roof_material: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      structure_width: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      structure_length: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      water_main: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      water_cost_20l: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      water_usage_day: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      access_bathroom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      access_toilet: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      toilet_fee_use: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      access_handwashing: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      waste_disposal: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      solid_waste_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type_solid_waste_sorted: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type_sorted_waste_reused: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      solid_waste_storage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      solid_waste_disposal: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      distance_receptacles: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      freq_receptacles_emptying: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type_waste_collector: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      freq_receptacles_emptying_private: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      waste_to_collection: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      waste_destination: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      waste_cost_payer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      waste_cost_per_month: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ability_to_pay_waste: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      desirable_waste_cost_per_month: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      num_waste_bags: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rate_waste_management: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cost_electricity_per_mon: {
        type: DataTypes.FLOAT, // Assuming cost is a decimal number
        allowNull: true // Modify as per your requirements
      },
      energy_lighting: {
        type: DataTypes.STRING, // Assuming lighting source is a string
        allowNull: true
      },
      energy_provider: {
        type: DataTypes.STRING, // Assuming provider is a string
        allowNull: true
      },
      source_cooking_energy: {
        type: DataTypes.STRING, // Assuming cooking energy source is a string
        allowNull: true
      },
      transport_mode: {
        type: DataTypes.STRING, // Assuming transport mode is a string
        allowNull: true
      },
      communication_mode: {
        type: DataTypes.STRING, // Assuming communication mode is a string
        allowNull: true
      },
      access_health: {
        type: DataTypes.STRING, // Assuming access to health care is a string
        allowNull: true
      },
      main_health_facility: {
        type: DataTypes.STRING, // Assuming main health facility is a string
        allowNull: true
      },
      main_health_fac_loc: {
        type: DataTypes.STRING, // Assuming location of main health facility is a string
        allowNull: true
      },
      common_ailments: {
        type: DataTypes.STRING, // Assuming common ailments is a string
        allowNull: true
      },
      dist_main_health_fac: {
        type: DataTypes.FLOAT, // Assuming distance to the facility is a decimal number
        allowNull: true
      },
      access_public_sch: {
        type: DataTypes.STRING, // Assuming access to public school is a string
        allowNull: true
      },
      dist_school: {
        type: DataTypes.FLOAT, // Assuming distance to the school is a decimal number
        allowNull: true
      },
      upgrade_priority: {
        type: DataTypes.STRING, // Assuming upgrade priority is a string
        allowNull: true
      },

      hh_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0, 
      },

      hh_size_female: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0, 
      },

      hh_size_male: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0, 
      },
    
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
   
      code: {
        type: DataTypes.STRING,
        allowNull: true,
        unique:true
      },
    },
    {
      sequelize,
      tableName: 'households',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'household_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
        {
          unique: true,
          fields: ['national_id' ]
        },
      ]
    }
  )
}
