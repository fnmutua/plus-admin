const { authJwt } = require("../middleware");
const controller = require("../controllers/geoserver.controller");
module.exports = function(app) {

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
    //app.post('/api/v1/user/all',  [authJwt.verifyToken],controller.modelAllUsers) // retrired 

    /**
     * @swagger
     * /api/v1/geoserver/upload:
     *   post:
     *     tags:
     *       - GeoServer
     *     summary: Upload imagery files to GeoServer
     *     description: Upload ECW or TIFF imagery files to GeoServer coverage store. Supports multiple file uploads with CRS specification.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - files
     *               - crs
     *             properties:
     *               files:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: binary
     *                 description: ECW or TIFF imagery files to upload
     *                 example: [file1.ecw, file2.tiff]
     *               crs:
     *                 type: string
     *                 description: Coordinate Reference System (CRS) for the imagery
     *                 example: "EPSG:4326"
     *     responses:
     *       200:
     *         description: Imagery uploaded successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Imagery Upload Successful"
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       400:
     *         description: Bad request - invalid file type or missing files
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: "Invalid file type, only ECW and TIFF files are supported"
     *       401:
     *         description: Unauthorized - invalid token
     *       500:
     *         description: Internal server error during upload
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Upload failed. Error details"
     *                 code:
     *                   type: string
     *                   example: "0000"
     */
    app.get("/api/v1/geoserver/layers", [authJwt.verifyToken], controller.getLayers);
    app.post("/api/v1/geoserver/sync", [authJwt.verifyToken], controller.syncLayersFromGeoServer);
    app.post("/api/v1/geoserver/upload", [authJwt.verifyToken ],controller.uploadToGeoserver);

    /**
     * @swagger
     * /api/v1/geoserver/delete:
     *   post:
     *     tags:
     *       - GeoServer
     *     summary: Delete coverage store and associated layers
     *     description: Delete a coverage store from GeoServer along with all its associated layers and uploaded files.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - storeName
     *               - workspace
     *             properties:
     *               storeName:
     *                 type: string
     *                 description: Name of the coverage store to delete
     *                 example: "sample_imagery"
     *               workspace:
     *                 type: string
     *                 description: GeoServer workspace name
     *                 example: "kisip"
     *     responses:
     *       200:
     *         description: Coverage store deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Store sample_imagery and its associated layers and files have been deleted successfully."
     *                 code:
     *                   type: string
     *                   example: "0000"
     *       401:
     *         description: Unauthorized - invalid token
     *       500:
     *         description: Internal server error during deletion
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to delete store and layers: Error details"
     *                 code:
     *                   type: string
     *                   example: "0001"
     */
    app.post("/api/v1/geoserver/delete", [authJwt.verifyToken ],controller.deleteCoverageStore);

    /**
     * @swagger
     * /api/v1/geoserver/edit:
     *   post:
     *     tags:
     *       - GeoServer
     *     summary: Edit layer details in GeoServer
     *     description: Update layer name and coordinate reference system (CRS) for an existing GeoServer layer.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - oldLayerName
     *               - workspace
     *             properties:
     *               oldLayerName:
     *                 type: string
     *                 description: Current name of the layer to edit
     *                 example: "sample_imagery"
     *               newLayerName:
     *                 type: string
     *                 description: New name for the layer (optional)
     *                 example: "updated_sample_imagery"
     *               workspace:
     *                 type: string
     *                 description: GeoServer workspace name
     *                 example: "kisip"
     *               newCrs:
     *                 type: string
     *                 description: New Coordinate Reference System (CRS) for the layer (optional)
     *                 example: "EPSG:3857"
     *     responses:
     *       200:
     *         description: Layer updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Layer sample_imagery updated successfully."
     *                 code:
     *                   type: string
     *                   example: "0000"
     *                 data:
     *                   type: object
     *                   description: Updated layer details
     *       401:
     *         description: Unauthorized - invalid token
     *       404:
     *         description: Layer not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Layer sample_imagery not found in workspace kisip."
     *                 code:
     *                   type: string
     *                   example: "0001"
     *       500:
     *         description: Internal server error during update
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "An error occurred while updating the layer: Error details"
     *                 code:
     *                   type: string
     *                   example: "0003"
     */
    app.post("/api/v1/geoserver/edit", [authJwt.verifyToken ],controller.editLayerDetails);
    
    
};