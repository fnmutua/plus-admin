const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'imagery_layer',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      workspace: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: 'kisip',
      },
      layer_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      coverage_store_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      crs: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'EPSG:4326',
      },
      bbox_minx: { type: DataTypes.DOUBLE, allowNull: true },
      bbox_miny: { type: DataTypes.DOUBLE, allowNull: true },
      bbox_maxx: { type: DataTypes.DOUBLE, allowNull: true },
      bbox_maxy: { type: DataTypes.DOUBLE, allowNull: true },
      original_filename: { type: DataTypes.STRING(512), allowNull: true },
      file_path: { type: DataTypes.STRING(1024), allowNull: true },
      file_format: { type: DataTypes.STRING(16), allowNull: true },
      file_size_bytes: { type: DataTypes.BIGINT, allowNull: true },
      county_id: { type: DataTypes.INTEGER, allowNull: true },
      settlement_id: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'published',
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      geoserver_published_at: { type: DataTypes.DATE, allowNull: true },
      last_synced_at: { type: DataTypes.DATE, allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: 'imagery_layer',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'imagery_layer_workspace_layer_name_uq',
          unique: true,
          fields: [{ name: 'workspace' }, { name: 'layer_name' }],
        },
        { name: 'imagery_layer_county_id_idx', fields: [{ name: 'county_id' }] },
        { name: 'imagery_layer_settlement_id_idx', fields: [{ name: 'settlement_id' }] },
        { name: 'imagery_layer_status_idx', fields: [{ name: 'status' }] },
      ],
    },
  );
};
