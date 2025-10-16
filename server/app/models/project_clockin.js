const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_clockin', {
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project',
        key: 'id'
      }
    },
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    project_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project_location',
        key: 'id'
      }
    },

    team_member_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project_team',
        key: 'id'
      }
    },

    clock_in_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    clock_out_time: {
      type: DataTypes.DATE,
      allowNull: true
    },

    work_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    // location: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    //   comment: 'GPS coordinates or location name where clock in/out occurred'
    // },

    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true,
      comment: 'GPS coordinates or location name where clock in/out occurred'

    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about the work session'
    },

    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'active = currently clocked in, completed = clocked out, cancelled = cancelled session'
    },

    total_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Calculated total hours worked (auto-calculated on clock out)'
    },

    overtime_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Overtime hours if applicable'
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }

  }, {
    sequelize,
    tableName: 'project_clockin',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_project_clockin_project_team",
        fields: ['project_location_id', 'team_member_id']
      },
      {
        name: "idx_project_clockin_project",
        fields: ['project_id']
      },
      {
        name: "idx_project_clockin_work_date",
        fields: ['work_date']
      },
      {
        name: "idx_project_clockin_status",
        fields: ['status']
      },
      {
        name: "unique_active_clockin",
        unique: true,
        fields: ['team_member_id', 'project_location_id'],
        where: {
          status: 'active'
        },
        comment: 'Ensures only one active clock-in session per team member per project location'
      }
    ],
    hooks: {
      beforeUpdate: async (clockin, options) => {
        // Auto-calculate total hours when clocking out
        if (clockin.changed('clock_out_time') && clockin.clock_out_time && clockin.clock_in_time) {
          const startTime = new Date(clockin.clock_in_time);
          const endTime = new Date(clockin.clock_out_time);
          const diffMs = endTime - startTime;
          const diffHours = diffMs / (1000 * 60 * 60);
          
          clockin.total_hours = Math.round(diffHours * 100) / 100; // Round to 2 decimal places
          
          // Calculate overtime (assuming 8 hours is standard work day)
          if (diffHours > 8) {
            clockin.overtime_hours = Math.round((diffHours - 8) * 100) / 100;
          } else {
            clockin.overtime_hours = 0;
          }
        }
      }
    }
  });
};
