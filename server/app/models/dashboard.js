const Sequelize = require('sequelize');
const { Op } = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  const Dashboard = sequelize.define('dashboard', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique:true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    main_dashboard: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'dashboard',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "dashboard_pkey",
        unique: true,
        fields: [
          { name: "id" }
        ]
      }
    ]
  });

  Dashboard.beforeCreate(async (instance, options) => {
    if (instance.main_dashboard) {
      const existingRow = await Dashboard.findOne({
        where: { main_dashboard: true }
      });
  
      if (existingRow) {
        throw new Error('Only one dashboard can be tagged as main. It already exists');
      }
    }
  });
  
  Dashboard.beforeUpdate(async (instance, options) => {
    if (instance.main_dashboard) {
      const existingRow = await Dashboard.findOne({
        where: { main_dashboard: true, id: { [Op.ne]: instance.id } }
      });
  
      if (existingRow) {
        throw new Error('Only one dashboard can be tagged as main. It already exists');
      }
    }
  });
   

  return Dashboard;
};
