const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
const axios = require('axios');
const multer = require('multer');
const layerCatalog = require('../services/geoserverLayerCatalog.service');

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
      layerCatalog.clearLayerCatalogCache();
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




      }


    // Step 2 Update the layer details

 
   



      res.status(200).send({
        message: 'Imagery Upload Successful',
        code: '0000',
      });
      layerCatalog.clearLayerCatalogCache();
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: 'Upload failed. ' + error.message,
        code: '0000',
      });
    }
 
    
 
  })
}


exports.deleteCoverageStore =async  (req, res) => {

  console.log(req.body )
//exports.deleteCoverageStore = async (storeName, workspace, uploadDir) => {
  try {
    const username = GEO_USERNAME;
    const password = GEO_PASSWORD;
    const {storeName, workspace}  =req.body 




    // Step 1: Fetch and delete all associated layers
    const layersUrl = `${GEO_SERVER_URL}/rest/layers/${workspace}:${storeName}.json`;
    const deleteLayerUrl = `${GEO_SERVER_URL}/rest/layers/${workspace}:${storeName}`;
    const deleteLayerResponse =  await axios.get(layersUrl, {
      auth: { username, password },
    });

    //console.log('deleteLayerResponse',deleteLayerResponse)


    if (deleteLayerResponse.status === 200 && deleteLayerResponse.data.layer) {
      const layers = Array.isArray(deleteLayerResponse.data.layer) ? deleteLayerResponse.data.layer : [deleteLayerResponse.data.layer];
      for (const layer of layers) {
        // Delete each layer
        await axios.delete(`${deleteLayerUrl}/${layer.name}`, {
          auth: { username, password },
          headers: { 'Content-Type': 'application/json' },
        });
        console.log(`Layer ${layer.name} deleted successfully.`);
      }
    }

    // Step 2: Delete the coverage store
    const storeUrl = `${GEO_SERVER_URL}/rest/workspaces/${workspace}/coveragestores/${storeName}?recurse=true`;
    const deleteStoreResponse = await   axios.delete(storeUrl, {
      auth: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });

    if (deleteStoreResponse.status === 200) {
      console.log(`Coverage Store ${storeName} deleted successfully.`);
    } else {
      throw new Error(`Failed to delete store ${storeName}: ${deleteStoreResponse.status} ${deleteStoreResponse.data}`);
    }

    // Step 3: Delete uploaded files
    const filePath = path.join(uploadDir, `${storeName}.ecw`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File ${filePath} deleted successfully.`);
    } else {
      console.log(`File ${filePath} not found, skipping.`);
    }

    // return {
    //   message: `Store ${storeName} and its associated layers and files have been deleted successfully.`,
    //   code: '0000',
    // };

    res.status(200).send({
      message:  `Store ${storeName} and its associated layers and files have been deleted successfully.`,
      code: '0000',
    });
    layerCatalog.clearLayerCatalogCache();


  } catch (error) {
    console.error(`Failed to delete store and layers: ${error.message}`);

    res.status(500).send({
      message: `Failed to delete store and layers: ${error.message}`,
      code: '0001',
    });


    // return {
    //   message: `Failed to delete store and layers: ${error.message}`,
    //   code: '0001',
    // };
  }
};


exports.getLayers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const countyId = req.query.countyId ? Number(req.query.countyId) : null;
    const forceRefresh = String(req.query.refresh || '') === '1';
    const paginated = Number.isFinite(page) && page > 0 && Number.isFinite(limit) && limit > 0;

    if (!paginated) {
      const rawLayers = await fetchRawLayerList();
      return res.status(200).json({ layers: { layer: rawLayers } });
    }

    const result = await layerCatalog.getPaginatedLayerCatalog({
      page,
      limit,
      countyId,
      forceRefresh,
    });

    return res.status(200).json({
      code: '0000',
      data: result.data,
      total: result.total,
      options: result.options,
      cached: !!result.cachedAt,
    });
  } catch (error) {
    console.error('Failed to fetch GeoServer layers:', error.message);
    res.status(500).send({
      message: `Failed to fetch layers: ${error.message}`,
      code: '0001',
    });
  }
};

exports.editLayerDetails = async (req, res) => {
  const username = GEO_USERNAME;
  const password = GEO_PASSWORD;

  const { oldLayerName, newLayerName, workspace, newCrs } = req.body;

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



