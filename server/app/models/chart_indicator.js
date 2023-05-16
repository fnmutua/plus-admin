const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('chart_indicator', {

   
    indicator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'activity',
        key: 'id'
      }
    },
    dashboard_section_chart_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'dashboard_section_chart',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'chart_indicator',
    schema: 'public',
    indexes: [
      {
        name: "chart_indicator_pkey",
        unique: true,
        fields: [
          { name: "indicator_id" },
          { name: "dashboard_section_chart_id" },
        ]
      },
    ]
  });
};
