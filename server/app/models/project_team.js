const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_team', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

   name: {
      type: DataTypes.STRING,
      allowNull: false
    },
  
    
   phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
   
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    // validate: {
    //   isIn: [['Project Manager', 'Regional Lead', 'CDH', 'Clerk of Works','Other' ]]
    // }
  },
     code: {
      type: DataTypes.STRING,
      allowNull: true
    },
 
  }, {
    sequelize,
    tableName: 'project_team',
    schema: 'public',
    timestamps: true,
    indexes: [
       {
        name: "unique_project_team",
        unique: true,
        fields: ['name', 'phone', 'project_id'] // Unique per project, allows same person in different projects
      },
    
    ]
  });
};
