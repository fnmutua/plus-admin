'use strict';

const axios = require('axios');
const path = require('path');

const GEO_SERVER_URL = 'https://kesmis.go.ke/geoserver';

const geoAuth = () => ({
  username: process.env.GEOSERVER_USERNAME || process.env.VITE_GEOSERVER_USERNAME || 'admin',
  password: process.env.GEOSERVER_PASSWORD || process.env.VITE_GEOSERVER_PASSWORD || '',
});

function formatFromPath(value) {
  if (!value) return null;
  const ext = path.extname(String(value)).replace('.', '').toLowerCase();
  return ext || null;
}

async function fetchStoreFormat(workspace, storeName) {
  const auth = geoAuth();
  const storeResponse = await axios.get(
    `${GEO_SERVER_URL}/rest/workspaces/${workspace}/coveragestores/${encodeURIComponent(storeName)}.json`,
    { auth, headers: { Accept: 'application/json' }, timeout: 15000 },
  );
  const storeUrl = storeResponse.data?.coverageStore?.url;
  return formatFromPath(storeUrl);
}

async function backfillFormatFromGeoServer(queryInterface, Sequelize) {
  const rows = await queryInterface.sequelize.query(
    `SELECT id, workspace, layer_name, coverage_store_name
     FROM imagery_layer
     WHERE file_format IS NULL AND deleted_at IS NULL`,
    { type: Sequelize.QueryTypes.SELECT },
  );
  if (!rows.length) return 0;

  let hydrated = 0;
  for (const row of rows) {
    try {
      let storeName = row.coverage_store_name || row.layer_name;
      let format;
      try {
        format = await fetchStoreFormat(row.workspace, storeName);
      } catch (error) {
        if (error.response?.status !== 404) throw error;
        const imageryLayerService = require('../app/services/imageryLayer.service');
        const metadata = await imageryLayerService.fetchLayerMetadataFromGeoServer(
          row.layer_name,
          row.workspace,
        );
        if (!metadata?.coverageStoreName) continue;
        storeName = metadata.coverageStoreName;
        await queryInterface.sequelize.query(
          `UPDATE imagery_layer SET coverage_store_name = :storeName, "updatedAt" = CURRENT_TIMESTAMP
           WHERE id = :id`,
          { replacements: { id: row.id, storeName } },
        );
        format = await fetchStoreFormat(row.workspace, storeName);
      }
      if (!format) continue;

      await queryInterface.sequelize.query(
        `UPDATE imagery_layer SET file_format = :format, "updatedAt" = CURRENT_TIMESTAMP WHERE id = :id`,
        { replacements: { id: row.id, format: format.toUpperCase() } },
      );
      hydrated += 1;
    } catch (error) {
      console.warn(`Could not backfill format for ${row.layer_name}:`, error.message);
    }
  }
  console.log(`Backfilled format from GeoServer for ${hydrated}/${rows.length} layer(s).`);
  return hydrated;
}

/**
 * Ensure imagery_layer has a format column and backfill it from stored filenames/paths.
 * Safe to re-run: only rows with a missing format are updated.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'imagery_layer'
        );
      `,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (!tableExists[0].exists) return;

    const columnExists = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'imagery_layer'
            AND column_name = 'file_format'
        );
      `,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (!columnExists[0].exists) {
      await queryInterface.addColumn('imagery_layer', 'file_format', {
        type: Sequelize.STRING(16),
        allowNull: true,
      });
    }

    const [, result] = await queryInterface.sequelize.query(`
      UPDATE imagery_layer il
      SET file_format = derived.fmt,
          "updatedAt" = CURRENT_TIMESTAMP
      FROM (
        SELECT
          id,
          UPPER(
            COALESCE(
              substring(original_filename from '\\.([^.]+)$'),
              substring(file_path from '\\.([^.]+)$')
            )
          ) AS fmt
        FROM imagery_layer
        WHERE file_format IS NULL
          AND (original_filename IS NOT NULL OR file_path IS NOT NULL)
      ) derived
      WHERE il.id = derived.id
        AND derived.fmt IS NOT NULL
        AND derived.fmt <> '';
    `);

    console.log(`Backfilled format for ${result?.rowCount ?? 0} imagery layer(s).`);

    await backfillFormatFromGeoServer(queryInterface, Sequelize);
  },

  down: async () => {},
};
