const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
const QRCode = require('qrcode')
const db = require('../models')
const Sequelize = require('sequelize')


exports.uploadToGeoserver = async (req, res) => {
  try {
    // Get the form data from the request body
 
    const { username, password } = req.body;


    const file = req.file;

    console.log('request', req.file)
    console.log('files', req.files)

    
    // if (!file || path.extname(file.originalname).toLowerCase() !== ".tiff") {
    //   return res.status(400).json({ error: "Invalid file type, only TIFF supported" });
    // }
  
    // GeoServer Configuration
const GEO_SERVER_URL = "http://geoserver-domain/geoserver/rest";
const WORKSPACE = "kisip";
 

    const geoserverUrl = `${GEO_SERVER_URL}/workspaces/${WORKSPACE}/coveragestores/${file.filename}/file.ecw`;

    // Upload the TIFF to GeoServer
    const response = await axios.put(
      geoserverUrl,
      {
        headers: {
          "Content-Type": "image/ecw",
        },
        auth: {
          username: username,
          password: password,
        },
        data: {
          file: file.path,
        },
      }
    );

    if (response.status === 201 || response.status === 200) {
      res.status(200).json({ message: "File successfully uploaded to GeoServer" });
    } else {
      res.status(response.status).json({
        error: "GeoServer upload failed",
        details: response.data,
      });
    }



     

    // Send a response with the file path or any other info you want to return
    res.status(200).send({
      code: '0000',
      message: 'File generated and saved successfully',
     });

  } catch (error) {
    console.error('Error', error);
    res.status(500).send({ message: 'Unable to generate document' });
  }
};
