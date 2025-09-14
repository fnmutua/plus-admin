const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('structure', {
    structure_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    
    owner: {
      type: DataTypes.STRING,
      allowNull: true
    },

    owner_id_number: {
      type: DataTypes.STRING,
      allowNull: true
    },

    kra_pin: {
      type: DataTypes.STRING,
      allowNull: true
    },

    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    number_owners: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

   
    structure_typology: {
      type: DataTypes.STRING,
      allowNull: true
    },

    number_floors: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    type_of_structure: {
      type: DataTypes.STRING,
      allowNull: true
    },

    wall_material: {
      type: DataTypes.STRING,
      allowNull: true
    },

    roof_material: {
      type: DataTypes.STRING,
      allowNull: true
    },

    floor_material: {
      type: DataTypes.STRING,
      allowNull: true
    },

    structure_room_use: {
      type: DataTypes.STRING,
      allowNull: true
    },

    number_tenants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    geom: {
      type: DataTypes.GEOMETRY('GEOMETRY', 4326),  // ✅ uppercase, explicit SRID
      allowNull: true
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }

  }, {
    sequelize,
    tableName: 'structure',
    schema: 'public',
    timestamps: true,
     
  });
};
