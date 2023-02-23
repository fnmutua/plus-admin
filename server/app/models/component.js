const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('component', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    programme_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    domain_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }, 
    acronym: {
      type: DataTypes.STRING,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
     code: {
      type: DataTypes.STRING,
      allowNull: false
    },
 
  }, {
    sequelize,
    tableName: 'component',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "component_pkey",
        unique: true,
        fields: [
          { name: "id" },
          
        ]
      },

      {
        unique: true,
        fields: ['acronym', 'icon' ]
    }
    ]
  });
};
