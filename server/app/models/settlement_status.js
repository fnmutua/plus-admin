const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'settlement_status',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      no_dwelling: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      pop_density: {
        type: DataTypes.REAL,
        allowNull: true
      },
      ave_hh_size: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      ave_room_occupancy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      ave_plot_size: {
        type: DataTypes.REAL,
        allowNull: true
      },
      avg_living_area: {
        type: DataTypes.REAL,
        allowNull: true
      },

      prop_permanent: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_semi: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_temp: {
        type: DataTypes.REAL,
        allowNull: true
      },

      avg_cost_perm: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      avg_cost_semi: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      avg_cost_temp: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      prop_avail_piped_water: {
        type: DataTypes.REAL,
        allowNull: true
      },

      dist_piped_water: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      prop_other_water: {
        type: DataTypes.REAL,
        allowNull: true
      },

      prop_conn_elec: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_conn_other_elec: {
        type: DataTypes.REAL,
        allowNull: true
      },
      avg_mon_income: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      prop_hh_perm_income: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_hh_income_home: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_renting: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_lpg: {
        type: DataTypes.REAL,
        allowNull: true
      },

      prop_firewood: {
        type: DataTypes.REAL,
        allowNull: true
      },

      prop_kerosene: {
        type: DataTypes.REAL,
        allowNull: true
      },

      prop_biogas: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_elec: {
        type: DataTypes.REAL,
        allowNull: true
      },
      avg_mon_rent: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      hiv_prevalence: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_food_aid: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_female_hh: {
        type: DataTypes.REAL,
        allowNull: true
      },
      prop_child_hh: {
        type: DataTypes.REAL,
        allowNull: true
      },

      main_hazard: {
        type: DataTypes.STRING,
        allowNull: true
      },

      hazard_freq: {
        type: DataTypes.STRING,
        allowNull: true
      },

      dist_urban_centre: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      survey_status: {
        type: DataTypes.STRING,
        allowNull: true
      },

      encumbrance: {
        type: DataTypes.STRING,
        allowNull: true
      },

      ownership: {
        type: DataTypes.STRING,
        allowNull: true
      },

      land_owner: {
        type: DataTypes.STRING,
        allowNull: true
      },

      occupation_duration: {
        type: DataTypes.STRING,
        allowNull: true
      },

      mode_occupation: {
        type: DataTypes.STRING,
        allowNull: true
      },

      date_report: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'settlement_status',
      schema: 'public',
      timestamps: false,
      indexes: [
        {
          name: 'settlement_status_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
