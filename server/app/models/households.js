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
        type: DataTypes.STRING,
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

      hh_size_03: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      hh_size_414: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      hh_size_1520: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      hh_size_2125: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      hh_size_2655: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      hh_size_gt55: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      over_80: {
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
