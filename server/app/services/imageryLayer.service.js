/* eslint-disable prettier/prettier */
const { Op } = require('sequelize');
const axios = require('axios');

const WORKSPACE = 'kisip';
const GEO_SERVER_URL = process.env.GEOSERVER_URL || 'https://kesmis.go.ke/geoserver';
const GEO_USERNAME = process.env.GEOSERVER_USERNAME || process.env.VITE_GEOSERVER_USERNAME || 'admin';
const GEO_PASSWORD = process.env.GEOSERVER_PASSWORD || process.env.VITE_GEOSERVER_PASSWORD || 'Admin@2011';

const geoAuth = () => ({ username: GEO_USERNAME, password: GEO_PASSWORD });

function getModel() {
  const db = require('../models');
  return db.models.imagery_layer;
}

function normalizeSearch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rowToBbox(row) {
  if (row.bbox_minx == null || row.bbox_miny == null || row.bbox_maxx == null || row.bbox_maxy == null) {
    return null;
  }
  return {
    westBoundLongitude: Number(row.bbox_minx),
    southBoundLatitude: Number(row.bbox_miny),
    eastBoundLongitude: Number(row.bbox_maxx),
    northBoundLatitude: Number(row.bbox_maxy),
  };
}

function rowToApiLayer(row) {
  return {
    id: row.id,
    name: row.layer_name,
    title: row.title || row.layer_name,
    crs: [row.crs || 'EPSG:4326'],
    bbox: rowToBbox(row),
    countyId: row.county_id,
    settlementId: row.settlement_id,
    workspace: row.workspace,
    coverageStoreName: row.coverage_store_name,
  };
}

function rowToOption(row) {
  return {
    value: row.layer_name,
    label: row.title || row.layer_name,
    bbox: rowToBbox(row),
  };
}

function applyBboxToRow(row, bbox) {
  if (!bbox) return;
  row.bbox_minx = bbox.westBoundLongitude ?? bbox.minx ?? null;
  row.bbox_miny = bbox.southBoundLatitude ?? bbox.miny ?? null;
  row.bbox_maxx = bbox.eastBoundLongitude ?? bbox.maxx ?? null;
  row.bbox_maxy = bbox.northBoundLatitude ?? bbox.maxy ?? null;
}

async function buildListWhere({ countyId, settlementId, search }) {
  const base = {
    status: 'published',
    enabled: true,
    deleted_at: null,
  };

  const clauses = [base];

  // Strict linkage-based filtering: layers are tied to county/settlement via stored IDs
  if (settlementId) {
    clauses.push({ settlement_id: Number(settlementId) });
  } else if (countyId) {
    clauses.push({ county_id: Number(countyId) });
  }

  if (search) {
    const needle = normalizeSearch(search);
    const pattern = `%${needle.replace(/[%_]/g, '')}%`;
    clauses.push({
      [Op.or]: [
        { layer_name: { [Op.iLike]: pattern } },
        { title: { [Op.iLike]: pattern } },
      ],
    });
  }

  return clauses.length === 1 ? clauses[0] : { [Op.and]: clauses };
}

async function getPaginatedLayers({ page, limit, countyId, settlementId, search }) {
  const ImageryLayer = getModel();
  const where = await buildListWhere({ countyId, settlementId, search });
  const offset = (page - 1) * limit;

  const { rows, count } = await ImageryLayer.findAndCountAll({
    where,
    order: [['layer_name', 'ASC']],
    limit,
    offset,
  });

  const allOptions = await ImageryLayer.findAll({
    where,
    order: [['layer_name', 'ASC']],
    attributes: ['layer_name', 'title', 'bbox_minx', 'bbox_miny', 'bbox_maxx', 'bbox_maxy'],
  });

  return {
    data: rows.map(rowToApiLayer),
    total: count,
    options: allOptions.map(rowToOption),
  };
}

async function listAllPublished() {
  const ImageryLayer = getModel();
  const rows = await ImageryLayer.findAll({
    where: { status: 'published', enabled: true, deleted_at: null },
    order: [['layer_name', 'ASC']],
  });
  return rows.map(rowToApiLayer);
}

async function fetchLayerMetadataFromGeoServer(layerName, workspace = WORKSPACE) {
  const auth = geoAuth();
  const fallback = {
    title: layerName,
    crs: 'EPSG:4326',
    bbox: null,
    coverageStoreName: layerName,
  };

  try {
    const layerResponse = await axios.get(
      `${GEO_SERVER_URL}/rest/layers/${workspace}:${layerName}.json`,
      { auth, headers: { Accept: 'application/json' }, timeout: 15000 },
    );
    const layer = layerResponse.data?.layer;
    if (!layer?.resource?.href) return fallback;

    const resourceUrl = layer.resource.href.replace(/^http:/, 'https:');
    const resourceResponse = await axios.get(resourceUrl, {
      auth,
      headers: { Accept: 'application/json' },
      timeout: 15000,
    });
    const dataSource = resourceResponse.data?.coverage || resourceResponse.data?.featureType;
    const store = dataSource?.store;
    const storeHref = typeof store === 'string' ? store : store?.['@href'] || store?.href;
    let coverageStoreName = layerName;
    if (storeHref) {
      const match = String(storeHref).match(/coveragestores\/([^/?#]+)/i);
      // Href ends with a format extension, e.g. ".../coveragestores/KAGUMO.json" — strip it
      if (match) coverageStoreName = decodeURIComponent(match[1]).replace(/\.(json|xml|html)$/i, '');
    }

    let bbox = null;
    const latLon = dataSource?.latLonBoundingBox;
    const nativeB = dataSource?.nativeBoundingBox;
    const source = latLon || nativeB;
    if (source) {
      bbox = {
        westBoundLongitude: source.minx,
        southBoundLatitude: source.miny,
        eastBoundLongitude: source.maxx,
        northBoundLatitude: source.maxy,
      };
    }

    return {
      title: layer.title || layerName,
      crs: dataSource?.srs || 'EPSG:4326',
      bbox,
      coverageStoreName,
    };
  } catch (error) {
    console.warn(`fetchLayerMetadataFromGeoServer(${layerName}):`, error.message);
    return fallback;
  }
}

async function createFromUpload(payload) {
  const ImageryLayer = getModel();
  const metadata =
    payload.metadata || (await fetchLayerMetadataFromGeoServer(payload.layerName, payload.workspace));

  const values = {
    workspace: payload.workspace || WORKSPACE,
    layer_name: payload.layerName,
    coverage_store_name: metadata.coverageStoreName || payload.layerName,
    title: metadata.title || payload.layerName,
    crs: payload.crs || metadata.crs || 'EPSG:4326',
    original_filename: payload.originalFilename || null,
    file_path: payload.filePath || null,
    file_format: payload.fileFormat || null,
    file_size_bytes: payload.fileSizeBytes || null,
    county_id: payload.countyId ? Number(payload.countyId) : null,
    settlement_id: payload.settlementId ? Number(payload.settlementId) : null,
    status: 'published',
    enabled: true,
    created_by: payload.createdBy ? Number(payload.createdBy) : null,
    geoserver_published_at: new Date(),
    last_synced_at: new Date(),
    deleted_at: null,
  };
  applyBboxToRow(values, metadata.bbox || payload.bbox);

  const existing = await ImageryLayer.findOne({
    where: { workspace: values.workspace, layer_name: values.layer_name },
  });

  if (existing) {
    await existing.update(values);
    return existing;
  }

  return ImageryLayer.create(values);
}

async function updateFromEdit({ workspace, oldLayerName, newLayerName, crs, countyId, settlementId }) {
  const ImageryLayer = getModel();
  const row = await ImageryLayer.findOne({
    where: {
      workspace: workspace || WORKSPACE,
      layer_name: oldLayerName,
      deleted_at: null,
    },
  });
  if (!row) return null;

  const metadata = await fetchLayerMetadataFromGeoServer(newLayerName || oldLayerName, workspace);
  const nextName = newLayerName || oldLayerName;

  const updates = {
    layer_name: nextName,
    coverage_store_name: metadata.coverageStoreName || nextName,
    title: metadata.title || nextName,
    crs: crs || metadata.crs || row.crs,
    last_synced_at: new Date(),
  };
  if (countyId !== undefined) {
    updates.county_id = countyId ? Number(countyId) : null;
  }
  if (settlementId !== undefined) {
    updates.settlement_id = settlementId ? Number(settlementId) : null;
  }
  applyBboxToRow(updates, metadata.bbox);

  if (nextName !== oldLayerName) {
    await ImageryLayer.destroy({
      where: {
        workspace: workspace || WORKSPACE,
        layer_name: nextName,
        id: { [Op.ne]: row.id },
      },
    });
  }

  await row.update(updates);
  return row;
}

async function markDeleted({ workspace, layerName }) {
  const ImageryLayer = getModel();
  const row = await ImageryLayer.findOne({
    where: {
      workspace: workspace || WORKSPACE,
      layer_name: layerName,
      deleted_at: null,
    },
  });
  if (!row) return false;
  await row.update({
    status: 'deleted',
    enabled: false,
    deleted_at: new Date(),
  });
  return true;
}

async function getLayersForSettlement(settlementId) {
  const ImageryLayer = getModel();
  // Strict linkage: only layers explicitly linked to this settlement
  const rows = await ImageryLayer.findAll({
    where: {
      status: 'published',
      enabled: true,
      deleted_at: null,
      settlement_id: Number(settlementId),
    },
    order: [['layer_name', 'ASC']],
  });

  return rows.map((row) => `${row.workspace}:${row.layer_name}`);
}

async function syncFromGeoServerCatalog() {
  const layerCatalog = require('./geoserverLayerCatalog.service');
  const layers = await layerCatalog.fetchLayerCatalogFromCapabilities(true);
  let upserted = 0;

  for (const layer of layers) {
    await createFromUpload({
      workspace: WORKSPACE,
      layerName: layer.name,
      crs: layer.crs?.[0] || 'EPSG:4326',
      metadata: {
        title: layer.title || layer.name,
        crs: layer.crs?.[0] || 'EPSG:4326',
        bbox: layer.bbox,
        coverageStoreName: layer.name,
      },
    });
    upserted += 1;
  }

  return { upserted, total: layers.length };
}

module.exports = {
  getPaginatedLayers,
  listAllPublished,
  createFromUpload,
  updateFromEdit,
  markDeleted,
  getLayersForSettlement,
  syncFromGeoServerCatalog,
  fetchLayerMetadataFromGeoServer,
  rowToApiLayer,
};
