const Sequelize = require('sequelize')
const DataTypes = Sequelize.DataTypes

module.exports = function (sequelize) {
  return sequelize.define(
    'incident',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      // geo linkage (optional, follow grievance style)
      county_id: { type: DataTypes.INTEGER, allowNull: true },
      subcounty_id: { type: DataTypes.INTEGER, allowNull: true },
      ward_id: { type: DataTypes.INTEGER, allowNull: true },
      settlement_id: { type: DataTypes.INTEGER, allowNull: true },

      // identifiers
      code: { type: DataTypes.STRING, allowNull: false, unique: true },

      // incident meta
      occurred_date: { type: DataTypes.DATE, allowNull: true },
      occurred_time: { type: DataTypes.STRING, allowNull: true },
      reported_date: { type: DataTypes.DATE, allowNull: true },
      reported_time: { type: DataTypes.STRING, allowNull: true },
      reported_by: { type: DataTypes.STRING, allowNull: true },
      reporter_phone: { type: DataTypes.STRING, allowNull: true },
      site_supervisor: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      location_text: { type: DataTypes.STRING, allowNull: true },
      worker_name: { type: DataTypes.STRING, allowNull: true },
      designation: { type: DataTypes.STRING, allowNull: true },

      // checklist style fields captured as arrays of strings
      incident_types: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      mechanisms: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      indirect_causes: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      direct_causes: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      activity_leading: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      root_cause: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },

      // narrative sections
      description: { type: DataTypes.TEXT, allowNull: true },
      consequences: { type: DataTypes.TEXT, allowNull: true },
      immediate_action: { type: DataTypes.TEXT, allowNull: true },

      severity: { type: DataTypes.STRING, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: true, defaultValue: 'open' },

      actions_to_avoid: { type: DataTypes.JSONB, allowNull: true }, // array of {action, responsible, priority, due_date}

      prepared_by_name: { type: DataTypes.STRING, allowNull: true },
      prepared_by_job_title: { type: DataTypes.STRING, allowNull: true },
      prepared_by_date: { type: DataTypes.DATE, allowNull: true }
    },
    {
      sequelize,
      tableName: 'incident',
      schema: 'public',
      timestamps: true,
      indexes: [
        { name: 'incident_pkey', unique: true, fields: [{ name: 'id' }] },
        { unique: true, fields: ['code'] }
      ]
    }
  )
}


