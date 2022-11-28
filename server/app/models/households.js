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
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      gender: {
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

      age_00_04: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_05_09: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_10_14: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_15_19: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_20_24: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_24_29: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_30_34: {
        type: DataTypes.INTEGER,
        allowNull: true
      },


      age_35_39: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_40_44: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      age_45_49: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_50_54: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_55_59: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_60_64: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_65_69: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      age_70_plus: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
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
 

      code: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'households',
      schema: 'public',
      timestamps: false,
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
