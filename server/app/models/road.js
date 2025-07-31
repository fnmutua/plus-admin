const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('road', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: true
    },

    rd_num: {
      type: DataTypes.STRING,
      allowNull: true
    },

    rd_class: {
      type: DataTypes.STRING,
      allowNull: true
    },

    rd_width_m: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },

    rd_reserve_encroachment: {
      type: DataTypes.STRING,
      allowNull: true
    },

    surface_type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    surface_condition: {
      type: DataTypes.STRING,
      allowNull: true
    },

    rd_traffic: {
      type: DataTypes.STRING,
      allowNull: true
    },

    rd_direction: {
      type: DataTypes.STRING,
      allowNull: true
    },

    rd_drainage_location: {
      type: DataTypes.STRING,
      allowNull: true
    },

    rd_drainage_condition: {
      type: DataTypes.STRING,
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

    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    isApproved: {
      type: DataTypes.STRING,
      defaultValue: 'Pending'
    },

    length: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },

    code: {
      type: DataTypes.STRING,
      allowNull: true // Now optional
    },

    photo: {
      type: DataTypes.STRING,
      allowNull: true
    },

    geom: {
      type: DataTypes.GEOMETRY('MultiLineString', 4326),
      allowNull: true
    }

  }, {
    sequelize,
    tableName: 'road',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: 'road_pkey',
        unique: true,
        fields: ['id']
      },
   
      // Keep code index if needed for external referencing
      {
        name: 'road_code',
        unique: true,
        fields: ['code']
      }
    ]
  });
};
