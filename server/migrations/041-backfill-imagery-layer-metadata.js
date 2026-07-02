'use strict';

/**
 * Data backfill for the imagery_layer catalog:
 *  1. Hydrate missing bboxes from GeoServer (fixing stale coverage store names along the way).
 *  2. Link layers to counties/settlements by bbox intersection (reuses 040's backfill).
 *  3. Record source file sizes by statting the files inside GeoServer's data_dir.
 *
 * Per-row failures are logged and skipped so one bad layer doesn't abort the migration.
 * Safe to re-run: only rows with missing data are touched.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const GEO_SERVER_URL = 'https://kesmis.go.ke/geoserver';
const GEOSERVER_DATA_ROOT = process.env.GEOSERVER_DATA_ROOT || '/data/data_dir';

const geoAuth = () => ({
  username: process.env.GEOSERVER_USERNAME || process.env.VITE_GEOSERVER_USERNAME || 'admin',
  password: process.env.GEOSERVER_PASSWORD || process.env.VITE_GEOSERVER_PASSWORD || '',
});

async function tableExists(queryInterface, Sequelize) {
  const rows = await queryInterface.sequelize.query(
    `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'imagery_layer'
      );
    `,
    { type: Sequelize.QueryTypes.SELECT },
  );
  return rows[0].exists;
}

/** Layer metadata (bbox, crs, real coverage store name) from GeoServer REST. */
async function fetchLayerMetadata(workspace, layerName) {
  const auth = geoAuth();
  const layerResponse = await axios.get(
    `${GEO_SERVER_URL}/rest/layers/${workspace}:${layerName}.json`,
    { auth, headers: { Accept: 'application/json' }, timeout: 15000 },
  );
  const href = layerResponse.data?.layer?.resource?.href;
  if (!href) return null;

  const resourceResponse = await axios.get(href.replace(/^http:/, 'https:'), {
    auth,
    headers: { Accept: 'application/json' },
    timeout: 15000,
  });
  const dataSource = resourceResponse.data?.coverage || resourceResponse.data?.featureType;
  if (!dataSource) return null;

  let coverageStoreName = null;
  const store = dataSource.store;
  const storeHref = typeof store === 'string' ? store : store?.['@href'] || store?.href;
  if (storeHref) {
    const match = String(storeHref).match(/coveragestores\/([^/?#]+)/i);
    if (match) coverageStoreName = decodeURIComponent(match[1]).replace(/\.(json|xml|html)$/i, '');
  }

  const source = dataSource.latLonBoundingBox || dataSource.nativeBoundingBox;
  return {
    crs: dataSource.srs || null,
    coverageStoreName,
    bbox: source
      ? { minx: source.minx, miny: source.miny, maxx: source.maxx, maxy: source.maxy }
      : null,
  };
}

/** Absolute path of a coverage store's source file inside the data_dir, or null. */
async function resolveStoreFilePath(workspace, storeName) {
  const auth = geoAuth();
  const storeResponse = await axios.get(
    `${GEO_SERVER_URL}/rest/workspaces/${workspace}/coveragestores/${encodeURIComponent(storeName)}.json`,
    { auth, headers: { Accept: 'application/json' }, timeout: 15000 },
  );
  const storeUrl = storeResponse.data?.coverageStore?.url;
  if (!storeUrl) return null;

  const relPath = String(storeUrl).replace(/^file:/, '').replace(/\/{2,}/g, '/');
  return path.isAbsolute(relPath) ? relPath : path.join(GEOSERVER_DATA_ROOT, relPath);
}

async function hydrateMissingBboxes(queryInterface, Sequelize) {
  const rows = await queryInterface.sequelize.query(
    `SELECT id, workspace, layer_name FROM imagery_layer
     WHERE bbox_minx IS NULL AND deleted_at IS NULL`,
    { type: Sequelize.QueryTypes.SELECT },
  );
  if (!rows.length) return 0;

  let hydrated = 0;
  for (const row of rows) {
    try {
      const metadata = await fetchLayerMetadata(row.workspace, row.layer_name);
      if (!metadata?.bbox || metadata.bbox.minx == null) {
        console.warn(`No bbox available on GeoServer for ${row.layer_name}`);
        continue;
      }
      await queryInterface.sequelize.query(
        `UPDATE imagery_layer
         SET bbox_minx = :minx, bbox_miny = :miny, bbox_maxx = :maxx, bbox_maxy = :maxy,
             crs = COALESCE(:crs, crs),
             coverage_store_name = COALESCE(:storeName, coverage_store_name),
             last_synced_at = CURRENT_TIMESTAMP,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = :id`,
        {
          replacements: {
            id: row.id,
            minx: metadata.bbox.minx,
            miny: metadata.bbox.miny,
            maxx: metadata.bbox.maxx,
            maxy: metadata.bbox.maxy,
            crs: metadata.crs,
            storeName: metadata.coverageStoreName,
          },
        },
      );
      hydrated += 1;
    } catch (error) {
      console.warn(`Could not hydrate bbox for ${row.layer_name}:`, error.message);
    }
  }
  console.log(`Hydrated bbox for ${hydrated}/${rows.length} layer(s)`);
  return hydrated;
}

async function hydrateMissingFileSizes(queryInterface, Sequelize) {
  const rows = await queryInterface.sequelize.query(
    `SELECT id, workspace, layer_name, coverage_store_name, original_filename
     FROM imagery_layer
     WHERE file_size_bytes IS NULL AND deleted_at IS NULL`,
    { type: Sequelize.QueryTypes.SELECT },
  );
  if (!rows.length) return 0;

  let hydrated = 0;
  for (const row of rows) {
    try {
      let storeName = row.coverage_store_name || row.layer_name;
      let filePath;
      try {
        filePath = await resolveStoreFilePath(row.workspace, storeName);
      } catch (storeError) {
        if (storeError.response?.status !== 404) throw storeError;
        // Stale store name — re-resolve from the layer and persist the fix
        const metadata = await fetchLayerMetadata(row.workspace, row.layer_name);
        if (!metadata?.coverageStoreName || metadata.coverageStoreName === storeName) {
          console.warn(`Store not found on GeoServer for ${row.layer_name} (${storeName})`);
          continue;
        }
        storeName = metadata.coverageStoreName;
        await queryInterface.sequelize.query(
          `UPDATE imagery_layer SET coverage_store_name = :storeName, "updatedAt" = CURRENT_TIMESTAMP
           WHERE id = :id`,
          { replacements: { id: row.id, storeName } },
        );
        filePath = await resolveStoreFilePath(row.workspace, storeName);
      }

      if (!filePath || !fs.existsSync(filePath)) {
        console.warn(`Source file not found for ${row.layer_name}: ${filePath || '(unknown)'}`);
        continue;
      }

      const stat = fs.statSync(filePath);
      await queryInterface.sequelize.query(
        `UPDATE imagery_layer
         SET file_size_bytes = :size,
             file_path = :filePath,
             file_format = :format,
             original_filename = COALESCE(original_filename, :filename),
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = :id`,
        {
          replacements: {
            id: row.id,
            size: stat.size,
            filePath,
            format: path.extname(filePath).replace('.', '').toLowerCase() || null,
            filename: path.basename(filePath),
          },
        },
      );
      hydrated += 1;
    } catch (error) {
      console.warn(`Could not hydrate file size for ${row.layer_name}:`, error.message);
    }
  }
  console.log(`Hydrated file size for ${hydrated}/${rows.length} layer(s)`);
  return hydrated;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (!(await tableExists(queryInterface, Sequelize))) {
      console.log('imagery_layer table does not exist; skipping backfill.');
      return;
    }

    await hydrateMissingBboxes(queryInterface, Sequelize);

    const { backfillLocationLinkage } = require('./040-create-imagery-layer');
    await backfillLocationLinkage(queryInterface);

    await hydrateMissingFileSizes(queryInterface, Sequelize);
  },

  // Data backfill only — nothing to undo
  down: async () => {},
};
