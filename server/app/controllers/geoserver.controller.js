const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
const axios = require('axios');
const multer = require('multer');

// Configure multer for file uploads


const uploadDir = '/data/imagery';

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
  console.log('Create Folder if not esists ')
  fs.mkdirSync(uploadDir, { recursive: true });
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
    cb(null, '/data/imagery'); // Define the directory where uploaded files will be stored
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
    const username = 'admin';
  const password = '***REDACTED***';
   
    try {
      if (!myFiles || myFiles.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
      }

      for (const file of myFiles) {
        const extname = path.extname(file.originalname).toLowerCase();
        
        console.log('file',file)
        // Check for valid file types (ECW or TIFF)
        if (extname !== '.ecw' && extname !== '.tiff') {
          return res.status(400).json({ error: 'Invalid file type, only ECW and TIFF files are supported' });
        }
 
         // Step 1 Update the layer details



        // GeoServer Configuration
        const GEO_SERVER_URL = 'https://kesmis.go.ke/geoserver';
        const WORKSPACE = 'kisip';
        const coverageStoreName = path.parse(file.originalname).name;
        const geoserverUrl = `${GEO_SERVER_URL}/rest/workspaces/${WORKSPACE}/coveragestores/${coverageStoreName}/file${extname}`;

        // Read the file stream
        const fileStream = fs.createReadStream(file.path);

           // Upload to GeoServer
           const response = await axios.put(
            geoserverUrl,
            fileStream,
            {
              headers: {
                'Content-Type': 'application/octet-stream',
              },
              auth: {
                username: 'admin',
                password: '***REDACTED***',
              },
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
    const username = 'admin';
  const password = '***REDACTED***';
   
    try {
      if (!myFiles || myFiles.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
      }

      for (const file of myFiles) {
        const extname = path.extname(file.originalname).toLowerCase();
        
        console.log('file',file)
        // Check for valid file types (ECW or TIFF)
        if (extname !== '.ecw' && extname !== '.tiff') {
          return res.status(400).json({ error: 'Invalid file type, only ECW and TIFF files are supported' });
        }
 
         // Step 1 Update the layer details



        // GeoServer Configuration
        const GEO_SERVER_URL = 'https://kesmis.go.ke/geoserver';
        const WORKSPACE = 'kisip';
        const coverageStoreName = path.parse(file.originalname).name;
        const geoserverUrl = `${GEO_SERVER_URL}/rest/workspaces/${WORKSPACE}/coveragestores/${coverageStoreName}/file${extname}`;

        // Read the file stream
        const fileStream = fs.createReadStream(file.path);

           // Upload to GeoServer
           const response = await axios.put(
            geoserverUrl,
            fileStream,
            {
              headers: {
                'Content-Type': 'application/octet-stream',
              },
              auth: {
                username: 'admin',
                password: '***REDACTED***',
              },
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
    // GeoServer Configuration
    const GEO_SERVER_URL = 'https://kesmis.go.ke/geoserver';
    const username = 'admin';
    const password = '***REDACTED***';
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


exports.editLayerDetails = async (req, res) => {
  // GeoServer Configuration
  const GEO_SERVER_URL = 'https://kesmis.go.ke/geoserver';
  const username = 'admin';
  const password = '***REDACTED***';

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



