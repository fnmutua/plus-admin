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
    fileSize: 100 * 1024 * 1024, // 100MB limit (adjust as needed)
  },
});

exports.uploadToGeoserver = (req, res) => {
  // Use `upload.array('files')` middleware to handle multiple file uploads
  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send({
        message: 'Upload failed.',
        code: '0000',
      });
    }

    let myFiles = req.files;

    try {
      if (!myFiles || myFiles.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
      }

      for (const file of myFiles) {
        const extname = path.extname(file.originalname).toLowerCase();
        
        // Check for valid file types (ECW or TIFF)
        if (extname !== '.ecw' && extname !== '.tiff') {
          return res.status(400).json({ error: 'Invalid file type, only ECW and TIFF files are supported' });
        }

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
            headers: {},
            auth: {
              username: 'admin',
              password: '***REDACTED***',
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
  });
};

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
