const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
const axios = require('axios');
const multer = require('multer');
const imageryLayerService = require('../services/imageryLayer.service');

const GEO_USERNAME = process.env.GEOSERVER_USERNAME || process.env.VITE_GEOSERVER_USERNAME || 'admin';
const GEO_PASSWORD = process.env.GEOSERVER_PASSWORD || process.env.VITE_GEOSERVER_PASSWORD || 'Admin@2011';
const GEO_SERVER_URL = 'https://kesmis.go.ke/geoserver';
const WORKSPACE = 'kisip';

const geoAuth = () => ({ username: GEO_USERNAME, password: GEO_PASSWORD });

async function fetchRawLayerList() {
  const response = await axios.get(`${GEO_SERVER_URL}/rest/layers.json`, {
    timeout: 15000,
    headers: { Accept: 'application/json' },
    auth: geoAuth(),
  });

  let layers = response.data?.layers?.layer || [];
  if (!Array.isArray(layers)) {
    layers = layers ? [layers] : [];
  }
  return layers.filter((layer) => layer && layer.name);
}

async function enrichLayerSummary(layer, username = GEO_USERNAME, password = GEO_PASSWORD) {
  const fallback = {
    name: layer.name,
    title: layer.title || layer.name,
    crs: ['EPSG:4326'],
    bbox: {
      westBoundLongitude: -180,
      eastBoundLongitude: 180,
      southBoundLatitude: -90,
      northBoundLatitude: 90,
    },
  };

  try {
    const layerResp = await axios.get(
      `${GEO_SERVER_URL}/rest/layers/${WORKSPACE}:${layer.name}.json`,
      {
        timeout: 10000,
        headers: { Accept: 'application/json' },
        auth: { username, password },
      },
    );

    const href = layerResp.data?.layer?.resource?.href;
    if (!href) return fallback;

    const resourceUrl = href.replace(/^http:/, 'https:');
    const resResp = await axios.get(resourceUrl, {
      timeout: 10000,
      headers: { Accept: 'application/json' },
      auth: { username, password },
    });

    const dataSource = resResp.data?.coverage || resResp.data?.featureType;
    const crs = dataSource?.srs ? [dataSource.srs] : ['EPSG:4326'];
    let bbox = { ...fallback.bbox };
    const latLon = dataSource?.latLonBoundingBox;
    const nativeB = dataSource?.nativeBoundingBox;
    if (latLon) {
      bbox = {
        westBoundLongitude: latLon.minx ?? -180,
        eastBoundLongitude: latLon.maxx ?? 180,
        southBoundLatitude: latLon.miny ?? -90,
        northBoundLatitude: latLon.maxy ?? 90,
      };
    } else if (nativeB) {
      bbox = {
        westBoundLongitude: nativeB.minx ?? -180,
        eastBoundLongitude: nativeB.maxx ?? 180,
        southBoundLatitude: nativeB.miny ?? -90,
        northBoundLatitude: nativeB.maxy ?? 90,
      };
    }

    return {
      name: layer.name,
      title: layerResp.data?.layer?.title || layer.title || layer.name,
      crs,
      bbox,
    };
  } catch (error) {
    console.warn(`Failed to enrich layer ${layer.name}:`, error.message);
    return fallback;
  }
}

async function enrichLayersConcurrent(layers, concurrency = 6) {
  const results = new Array(layers.length);
  let next = 0;

  async function worker() {
    while (next < layers.length) {
      const idx = next++;
      results[idx] = await enrichLayerSummary(layers[idx]);
    }
  }

  const workers = Math.min(concurrency, layers.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

function layerBboxIntersectsCounty(layerBbox, countyBbox) {
  if (!layerBbox || !countyBbox) return true;
  return (
    layerBbox.westBoundLongitude < countyBbox.maxx &&
    layerBbox.eastBoundLongitude > countyBbox.minx &&
    layerBbox.southBoundLatitude < countyBbox.maxy &&
    layerBbox.northBoundLatitude > countyBbox.miny
  );
}

async function getCountyBbox(countyId) {
  const db = require('../models');
  const { QueryTypes } = require('sequelize');
  const rows = await db.sequelize.query(
    `SELECT
      ST_XMin(ST_Extent(geom)) AS minx,
      ST_YMin(ST_Extent(geom)) AS miny,
      ST_XMax(ST_Extent(geom)) AS maxx,
      ST_YMax(ST_Extent(geom)) AS maxy
     FROM county
     WHERE id = :countyId
     GROUP BY id`,
    {
      replacements: { countyId: Number(countyId) },
      type: QueryTypes.SELECT,
    },
  );
  const row = rows?.[0];
  if (!row || row.minx == null) return null;
  return {
    minx: Number(row.minx),
    miny: Number(row.miny),
    maxx: Number(row.maxx),
    maxy: Number(row.maxy),
  };
}

async function getCountyFilteredLayers(rawLayers, countyBbox) {
  const matches = [];
  const batchSize = 6;
  for (let i = 0; i < rawLayers.length; i += batchSize) {
    const batch = rawLayers.slice(i, i + batchSize);
    const enriched = await enrichLayersConcurrent(batch, batchSize);
    for (const layer of enriched) {
      if (layerBboxIntersectsCounty(layer.bbox, countyBbox)) {
        matches.push(layer);
      }
    }
  }
  return matches;
}

function toLayerOptions(rawLayers) {
  return rawLayers.map((layer) => ({
    value: layer.name,
    label: layer.title || layer.name,
  }));
}

const { IMAGERY_DIR, ensureDir } = require('../config/paths.config');

const uploadDir = IMAGERY_DIR;

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
  console.log('Create Folder if not esists ')
  ensureDir(uploadDir);
} else {
  console.log('Folder exists. Skipping ')
}



async function getResourceUrl(GEO_SERVER_URL,layerName, workspace, username, password) {
  try {
    // Step 1: Fetch the current layer details
    const layerDetailsUrl = `${GEO_SERVER_URL}/rest/layers/${workspace}:${layerName}.json`;
    const layerResponse = await axios.get(layerDetailsUrl, {
      auth: { username, password },
      headers: { 'Accept': 'application/json' },
    });

    console.log('Layer response:', layerResponse.data);

    if (layerResponse.status !== 200 || !layerResponse.data.layer) {
      console.error(`Layer ${layerName} not found in workspace ${workspace}.`);
      throw new Error(`Layer ${layerName} not found.`);
    }

    const layerData = layerResponse.data.layer;

    // Step 2: Fetch resource details
    let resourceUrl = layerData.resource.href;
    resourceUrl = resourceUrl.replace("http://", "https://");

    const resourceResponse = await axios.get(resourceUrl, {
      auth: { username, password },
      headers: { 'Accept': 'application/json' },
    });

    if (resourceResponse.status !== 200 || !resourceResponse.data.coverage) {
      console.error(`Coverage for ${layerName} not found in workspace ${workspace}.`);
      throw new Error(`Coverage for ${layerName} not found.`);
    }

    console.log('resourceResponse response:', resourceResponse.data.coverage.srs );

    return [ resourceResponse.config.url ,  resourceResponse.data.coverage.srs ]; // Return the URL for the coverage resource
  } catch (error) {
    console.error('Error fetching resource URL:', error.message);
    throw error; // Rethrow the error for handling in the caller function
  }
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original file name
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB limit (adjust as needed)
  },
});

 


exports._uploadToGeoserver = async (req, res) => {


  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.log(err);
        return res.status(500).send({
        message: 'Upload failed.',
        code: '0000'
      })
    } 
    if (!req.files) {
      return res.status(500).send({ msg: 'file is not found : Upload ECW' })
    }

    var myFiles =req.files
  

    console.log('files to upload',myFiles )
    console.log('Properties Document',req.body.crs )
    const username = GEO_USERNAME;
    const password = GEO_PASSWORD;
   
    try {
      if (!myFiles || myFiles.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
      }

      for (const file of myFiles) {
        const extname = path.extname(file.originalname).toLowerCase();
        
        console.log('file',file)
        if (extname !== '.ecw' && extname !== '.tiff') {
          return res.status(400).json({ error: 'Invalid file type, only ECW and TIFF files are supported' });
        }

        const WORKSPACE = 'kisip';
        const coverageStoreName = path.parse(file.originalname).name;
        const geoserverUrl = `${GEO_SERVER_URL}/rest/workspaces/${WORKSPACE}/coveragestores/${coverageStoreName}/file${extname}`;

        const fileStream = fs.createReadStream(file.path);

           const response = await axios.put(
            geoserverUrl,
            fileStream,
            {
              headers: {
                'Content-Type': 'application/octet-stream',
              },
              auth: { username, password },
              params: {
                projectionPolicy: "FORCE_DECLARED",
                recalculate: "latlonbbox",
                srs: req.body.crs,
                nativeCRS: req.body.crs,
                "enabled": false,
              },
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
            }
          );

        if (response.status !== 201 && response.status !== 200) {
          return res.status(response.status).json({
            error: 'GeoServer upload failed',
            details: response.data,
          });
        }
  



      }


    // Step 2 Update the layer details

 
   



      res.status(200).send({
        message: 'Imagery Upload Successful',
        code: '0000',
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: 'Upload failed. ' + error.message,
        code: '0000',
      });
    }
  })
}
exports.uploadToGeoserver = async (req, res) => {


  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.log(err);
        return res.status(500).send({
        message: 'Upload failed.',
        code: '0000'
      })
    } 
    if (!req.files) {
      return res.status(500).send({ msg: 'file is not found : Upload ECW' })
    }

    var myFiles =req.files
  

    console.log('files to upload',myFiles )
    console.log('Properties Document',req.body.crs )
    const username = GEO_USERNAME;
    const password = GEO_PASSWORD;
   
    try {
      if (!myFiles || myFiles.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
      }

      for (const file of myFiles) {
        const extname = path.extname(file.originalname).toLowerCase();
        
        console.log('file',file)
        if (extname !== '.ecw' && extname !== '.tiff') {
          return res.status(400).json({ error: 'Invalid file type, only ECW and TIFF files are supported' });
        }

        const WORKSPACE = 'kisip';
        const coverageStoreName = path.parse(file.originalname).name;
        const geoserverUrl = `${GEO_SERVER_URL}/rest/workspaces/${WORKSPACE}/coveragestores/${coverageStoreName}/file${extname}`;

        const fileStream = fs.createReadStream(file.path);

           const response = await axios.put(
            geoserverUrl,
            fileStream,
            {
              headers: {
                'Content-Type': 'application/octet-stream',
              },
              auth: { username, password },
              params: {
                projectionPolicy: "FORCE_DECLARED",
                recalculate: "latlonbbox",
                srs: req.body.crs,
                nativeCRS: req.body.crs,
                "enabled": false,
              },
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
            }
          );

        if (response.status !== 201 && response.status !== 200) {
          return res.status(response.status).json({
            error: 'GeoServer upload failed',
            details: response.data,
          });
        }

        
        const resource  =  await getResourceUrl(GEO_SERVER_URL, coverageStoreName,WORKSPACE,username,password) 
 
        const resourceUrl  =resource [0]
        const resource_srs  =resource [1]
        console.log('resourceUrl',resourceUrl)
        console.log('resource_srs',resource_srs)

 
        //EPSG:404000
           // Prepare the updated coverage data
    const updatedCoverageData = {
      coverage: {
         //srs: req.body.crs, // Keep old CRS if new CRS isn't provided
         srs: (resource_srs && resource_srs !== 'EPSG:404000') ? resource_srs : req.body.crs,

         enabled: true,
         projectionPolicy: "FORCE_DECLARED",
       // recalculate: "latlonbbox"
      },
    };

    // Step 3: Update the resource with the new details
    const updateCoverageResponse = await axios.put(resourceUrl, updatedCoverageData, {
      auth: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });

        if (updateCoverageResponse.status !== 200 && updateCoverageResponse.status !== 204) {
          return res.status(updateCoverageResponse.status).send({
            message: `Failed to update coverage metdata: ${updateCoverageResponse.statusText}`,
            code: '0002',
          });
        }

        await imageryLayerService.createFromUpload({
          workspace: WORKSPACE,
          layerName: coverageStoreName,
          crs: (resource_srs && resource_srs !== 'EPSG:404000') ? resource_srs : req.body.crs,
          originalFilename: file.originalname,
          filePath: file.path,
          fileFormat: extname.replace('.', ''),
          fileSizeBytes: file.size,
          countyId: req.body.county_id || req.body.countyId,
          settlementId: req.body.settlement_id || req.body.settlementId,
          createdBy: req.userid,
        });
      }


    // Step 2 Update the layer details

 
   



      res.status(200).send({
        message: 'Imagery Upload Successful',
        code: '0000',
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: 'Upload failed. ' + error.message,
        code: '0000',
      });
    }
 
    
 
  })
}


async function resolveCoverageStoreName(workspace, layerName, username, password) {
  const auth = { username, password };
  try {
    const layerResponse = await axios.get(
      `${GEO_SERVER_URL}/rest/layers/${workspace}:${layerName}.json`,
      { auth, headers: { Accept: 'application/json' } },
    );
    const resourceHref = layerResponse.data?.layer?.resource?.href;
    if (!resourceHref) return layerName;

    const resourceUrl = resourceHref.replace(/^http:/, 'https:');
    const resourceResponse = await axios.get(resourceUrl, {
      auth,
      headers: { Accept: 'application/json' },
    });
    const store = resourceResponse.data?.coverage?.store;
    const storeHref = typeof store === 'string' ? store : store?.['@href'] || store?.href;
    if (!storeHref) return layerName;

    const match = String(storeHref).match(/coveragestores\/([^/?#]+)/i);
    if (!match) return layerName;
    // Href ends with a format extension, e.g. ".../coveragestores/KAGUMO.json" — strip it
    return decodeURIComponent(match[1]).replace(/\.(json|xml|html)$/i, '');
  } catch (error) {
    return layerName;
  }
}

async function deleteGeoServerResource(deleteFn, label) {
  try {
    await deleteFn();
    console.log(`${label} deleted successfully.`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`${label} not found, skipping.`);
      return false;
    }
    throw error;
  }
}


exports.deleteCoverageStore =async  (req, res) => {

  console.log(req.body )
  try {
    const username = GEO_USERNAME;
    const password = GEO_PASSWORD;
    const {storeName, workspace}  =req.body 
    const auth = { username, password };
    const layerRef = `${workspace}:${storeName}`;

    const coverageStoreName = await resolveCoverageStoreName(
      workspace,
      storeName,
      username,
      password,
    );

    // Remove store + coverage + published layer in one call when possible
    const storeDeleted = await deleteGeoServerResource(
      () => axios.delete(
        `${GEO_SERVER_URL}/rest/workspaces/${workspace}/coveragestores/${coverageStoreName}?recurse=true`,
        { auth, headers: { 'Content-Type': 'application/json' } },
      ),
      `Coverage store ${coverageStoreName}`,
    );

    if (!storeDeleted) {
      await deleteGeoServerResource(
        () => axios.delete(`${GEO_SERVER_URL}/rest/layers/${layerRef}`, {
          auth,
          headers: { 'Content-Type': 'application/json' },
        }),
        `Layer ${storeName}`,
      );
    }

    // Delete uploaded files
    const filePath = path.join(uploadDir, `${storeName}.ecw`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File ${filePath} deleted successfully.`);
    } else {
      console.log(`File ${filePath} not found, skipping.`);
    }

    res.status(200).send({
      message:  `Store ${storeName} and its associated layers and files have been deleted successfully.`,
      code: '0000',
    });
    await imageryLayerService.markDeleted({ workspace, layerName: storeName });


  } catch (error) {
    console.error(`Failed to delete store and layers: ${error.message}`);

    res.status(500).send({
      message: `Failed to delete store and layers: ${error.message}`,
      code: '0001',
    });
  }
};


exports.getLayers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const countyId = req.query.countyId ? Number(req.query.countyId) : null;
    const settlementId = req.query.settlementId ? Number(req.query.settlementId) : null;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const paginated = Number.isFinite(page) && page > 0 && Number.isFinite(limit) && limit > 0;

    if (!paginated) {
      const layers = await imageryLayerService.listAllPublished();
      return res.status(200).json({
        layers: {
          layer: layers.map((layer) => ({ name: layer.name, title: layer.title })),
        },
      });
    }

    const result = await imageryLayerService.getPaginatedLayers({
      page,
      limit,
      countyId,
      settlementId,
      search,
    });

    return res.status(200).json({
      code: '0000',
      data: result.data,
      total: result.total,
      options: result.options,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch imagery layers:', error.message);
    res.status(500).send({
      message: `Failed to fetch layers: ${error.message}`,
      code: '0001',
    });
  }
};

// GeoServer's data directory on this server; store URLs are relative to it.
// Named GEOSERVER_DATA_ROOT because the GeoServer installer sets a machine-level
// GEOSERVER_DATA_DIR variable that would shadow a .env value of the same name.
const GEOSERVER_DATA_ROOT = process.env.GEOSERVER_DATA_ROOT || '/data/data_dir';

// Stream the original imagery file straight from GeoServer's data_dir on the local filesystem
exports.downloadLayerFile = async (req, res) => {
  const layerName = req.params.layerName;
  const auth = geoAuth();

  try {
    const workspace = req.query.workspace || WORKSPACE;
    const storeName = await resolveCoverageStoreName(
      workspace,
      layerName,
      auth.username,
      auth.password,
    );

    // The coverage store's url points at the file inside the data_dir, e.g. "file:data/kisip/burat/burat.ecw"
    const storeResponse = await axios.get(
      `${GEO_SERVER_URL}/rest/workspaces/${workspace}/coveragestores/${encodeURIComponent(storeName)}.json`,
      { auth, headers: { Accept: 'application/json' }, timeout: 15000 },
    );
    const storeUrl = storeResponse.data?.coverageStore?.url;
    if (!storeUrl) {
      return res.status(404).json({
        code: '0001',
        message: `No source file is registered on GeoServer for "${layerName}", so it cannot be downloaded.`,
      });
    }

    // Resolve to an absolute path inside the data_dir.
    // Store urls look like "file:data/kisip/x/x.ecw" (relative) or "file:///data/..." (absolute).
    const relPath = String(storeUrl)
      .replace(/^file:/, '')
      .replace(/\/{2,}/g, '/');
    const filePath = path.isAbsolute(relPath)
      ? relPath
      : path.join(GEOSERVER_DATA_ROOT, relPath);

    // Guard against escaping the data_dir via a crafted store url
    const resolvedPath = path.resolve(filePath);
    const resolvedRoot = path.resolve(GEOSERVER_DATA_ROOT);
    if (!resolvedPath.startsWith(resolvedRoot)) {
      return res.status(400).json({
        code: '0001',
        message: 'Invalid file location for this layer.',
      });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        code: '0001',
        message: `The source file for "${layerName}" is no longer on the server, so it cannot be downloaded.`,
      });
    }

    const stat = fs.statSync(resolvedPath);
    const filename = path.basename(resolvedPath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);

    const stream = fs.createReadStream(resolvedPath);
    stream.pipe(res);
    stream.on('error', (streamError) => {
      console.error(`Download stream error for ${layerName}:`, streamError.message);
      res.destroy(streamError);
    });
  } catch (error) {
    const status = error.response?.status === 404 ? 404 : 500;
    console.error(`Failed to download layer ${layerName}:`, error.message);
    return res.status(status).json({
      code: '0001',
      message:
        status === 404
          ? `"${layerName}" could not be found on GeoServer. It may have been renamed or removed.`
          : `The download for "${layerName}" failed because GeoServer did not respond as expected. Please try again or contact the systems admin.`,
    });
  }
};

exports.syncLayersFromGeoServer = async (req, res) => {
  try {
    const result = await imageryLayerService.syncFromGeoServerCatalog();
    return res.status(200).json({
      code: '0000',
      message: `Synced ${result.upserted} imagery layers from GeoServer into the local catalog.`,
      data: result,
    });
  } catch (error) {
    console.error('Failed to sync imagery from GeoServer:', error.message);
    return res.status(500).json({
      code: '0001',
      message: `Failed to sync imagery catalog: ${error.message}`,
    });
  }
};

exports.editLayerDetails = async (req, res) => {
  const username = GEO_USERNAME;
  const password = GEO_PASSWORD;

  const { oldLayerName, newLayerName, workspace, newCrs, county_id, settlement_id } = req.body;

  console.log('req.body', req.body);

  try {
    // Step 1: Fetch the current layer details
    const layerDetailsUrl = `${GEO_SERVER_URL}/rest/layers/${workspace}:${oldLayerName}.json`;
    const layerResponse = await axios.get(layerDetailsUrl, {
      auth: { username, password },
      headers: { 'Accept': 'application/json' },
    });

    console.log('layerResponse.data.layer', layerResponse.data.layer);

    if (layerResponse.status !== 200 || !layerResponse.data.layer) {
      console.log(layerResponse);
      return res.status(404).send({
        message: `Layer ${oldLayerName} not found in workspace ${workspace}.`,
        code: '0001',
      });
    }

    const layerData = layerResponse.data.layer;

    // Step 2: Fetch resource details
    let resourceUrl = layerData.resource.href;
    resourceUrl = resourceUrl.replace("http://", "https://");

    const resourceResponse = await axios.get(resourceUrl, {
      auth: { username, password },
      headers: { 'Accept': 'application/json' },
    });

    if (resourceResponse.status !== 200 || !resourceResponse.data.coverage) {
      return res.status(404).send({
        message: `Coverage ${oldLayerName} not found in workspace ${workspace}.`,
        code: '0001',
      });
    }

    // Prepare the updated coverage data
    const updatedCoverageData = {
      coverage: {
        name: newLayerName || oldLayerName, // Keep old name if new name isn't provided
        title: newLayerName || oldLayerName, // Keep old name if new name isn't provided
        srs: newCrs || resourceResponse.data.coverage.srs, // Keep old CRS if new CRS isn't provided
        enabled: true,
        projectionPolicy: "FORCE_DECLARED",
        recalculate: "latlonbbox"
      },
    };

    // Step 3: Update the resource with the new details
    const updateCoverageResponse = await axios.put(resourceUrl, updatedCoverageData, {
      auth: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });

    if (updateCoverageResponse.status !== 200 && updateCoverageResponse.status !== 204) {
      return res.status(updateCoverageResponse.status).send({
        message: `Failed to update coverage: ${updateCoverageResponse.statusText}`,
        code: '0002',
      });
    }

    await imageryLayerService.updateFromEdit({
      workspace,
      oldLayerName,
      newLayerName,
      crs: newCrs,
      countyId: county_id,
      settlementId: settlement_id,
    });

    res.status(200).send({
      message: `Layer ${oldLayerName} updated successfully.`,
      code: '0000',
              data: layerResponse.data.layer

    });
  } catch (error) {
    console.error('Error updating layer details:', error.message);

    res.status(500).send({
      message: `An error occurred while updating the layer: ${error.message}`,
      code: '0003',
    });
  }
};



