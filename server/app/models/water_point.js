const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('water_point', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    capacity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    depth: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    ownership_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: true
    },
    catchment: {
      type: DataTypes.STRING,
      allowNull: true
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    condition: {
      type: DataTypes.STRING,
      allowNull: true
    },
    availability: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name_of_provider: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cost_of_20_litre_jerrican: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    isApproved: {
      type: DataTypes.STRING,
      defaultValue: 'Pending'
    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    county_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    geom: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'water_point',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "water_facility_pkey",
        unique: true,
        fields: [{ name: "id" }]
      }
    ]
  });
};
