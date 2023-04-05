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
      settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

    
      county_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
  
  
      subcounty_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
  

      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true
      },
      age_plot_owner: {
        type: DataTypes.STRING,
        allowNull: true
      },
      national_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      kra_pin: {
        type: DataTypes.STRING,
        allowNull: true
      },
      marital_status: {
        type: DataTypes.STRING,
        allowNull: true
      },
      education_level: {
        type: DataTypes.STRING,
        allowNull: true
      },
      residence_type: {
        type: DataTypes.STRING,
        allowNull: true
      },
      length_stay: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      ownership_status: {
        type: DataTypes.STRING,
        allowNull: true
      },

      photo: {
        type: DataTypes.BLOB,
        allowNull: true
      },
  

      /// Household - male ------------
      age_00_04m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_05_09m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_10_14m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_15_19m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_20_24m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_24_29m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_30_34m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },


      age_35_39m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_40_44m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_45_49m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_50_54m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_55_59m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_60_64m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_65_69m: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_70_plusm: {
        type: DataTypes.INTEGER,
        allowNull: true
      },


      // femaile 
      age_00_04f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_05_09f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_10_14f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_15_19f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_20_24f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_24_29f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_30_34f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },


      age_35_39f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_40_44f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_45_49f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_50_54f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_55_59f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_60_64f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_65_69f: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_70_plusf: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      //---------
      hh_size: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      terminally_ill: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      ph_disabled: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      orphans: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      ment_disabled: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      hearing_disabled: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      visual_disabled: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      emp_status: {
        type: DataTypes.STRING,
        allowNull: true
      },

      income_level: {
        type: DataTypes.STRING,
        allowNull: true
      },
      type_structure: {
        type: DataTypes.STRING,
        allowNull: true
      },
      struct_owner: {
        type: DataTypes.STRING,
        allowNull: true
      },
      rent_payable: {
        type: DataTypes.STRING,
        allowNull: true
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      },

      sanitation: {
        type: DataTypes.STRING,
        allowNull: true
      },
      source_water: {
        type: DataTypes.STRING,
        allowNull: true
      },
      mode_transport: {
        type: DataTypes.STRING,
        allowNull: true
      },
      access_health: {
        type: DataTypes.STRING,
        allowNull: true
      },
      handwashing: {
        type: DataTypes.STRING,
        allowNull: true
      },
 

      solid_waste: {
        type: DataTypes.STRING,
        allowNull: true
      },

      solid_waste: {
        type: DataTypes.STRING,
        allowNull: true
      },
 
    
      expense_food: {
        type: DataTypes.STRING,
        allowNull: true
      },
 
      mode_acquisition: {
        type: DataTypes.STRING,
        allowNull: true
      },

      ownership_docs: {
        type: DataTypes.STRING,
        allowNull: true
      },
      shared_ownership: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },


      access_education: {
        type: DataTypes.STRING,
        allowNull: true
      },


      distance_to_sch: {
        type: DataTypes.STRING,
        allowNull: true
      },

      lighting_energy: {
        type: DataTypes.STRING,
        allowNull: true
      },

      cooking_energy: {
        type: DataTypes.STRING,
        allowNull: true
      },

      water_cost20l: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      toilet_cost: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      cooking_energy_cost: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
   
      code: {
        type: DataTypes.STRING,
        allowNull: false,
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
        }
      ]
    }
  )
}
