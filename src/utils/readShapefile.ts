import * as turf from 'turf'
import JSZip from 'jszip';
import { open } from 'shapefile';
import proj4 from 'proj4';
import * as fs from 'fs';
import { DOMParser } from 'xmldom';
import * as tj from '@mapbox/togeojson';
import { KmlToGeojson } from 'kml-to-geojson';
import { XMLParser } from 'fast-xml-parser';


// Function to read KML and return the GeoJSON
function readKMLAndConvertToGeoJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result;
      const parser = new XMLParser();
      const json = parser.parse(fileContent);

      const coordinates = json.kml.Document.Placemark.Polygon.outerBoundaryIs.LinearRing.coordinates;
      const coordinatePairs = coordinates.split(" ");

      const xcoordinates = coordinatePairs.map((pair) => {
        const [lon, lat] = pair.split(",").map(Number);
        return [lon, lat];
      });

      const geom = 
          {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Polygon",
              "coordinates": [xcoordinates], // Wrap xcoordinates in an array
            },
      }
      
        // Set the GeoJSON CRS object to GCS WGS84
        geom.crs = {
          "type": "name",
          "properties": {
            "name": "EPSG:4326", // GCS WGS84 EPSG code
          },
        };

     

      resolve(geom);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file);
  });
}

async function kmlConvertToGeoJSON(fileContent) {
  return new Promise((resolve, reject) => {

      const parser = new XMLParser();
    const json = parser.parse(fileContent);
    let coordinates
    
    if (json.kml.Document.Placemark) {
      coordinates = json.kml.Document.Placemark.Polygon.outerBoundaryIs.LinearRing.coordinates;

    } else {
      coordinates = json.kml.Document.Folder.Placemark.MultiGeometry.Polygon.outerBoundaryIs.LinearRing.coordinates;

     }

    
      const coordinatePairs = coordinates.split(" ");

      const xcoordinates = coordinatePairs.map((pair) => {
        const [lon, lat] = pair.split(",").map(Number);
        return [lon, lat];
      });

      const geom = 
          {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Polygon",
              "coordinates": [xcoordinates], // Wrap xcoordinates in an array
            },
      }
      
        // Set the GeoJSON CRS object to GCS WGS84
        geom.crs = {
          "type": "name",
          "properties": {
            "name": "EPSG:4326", // GCS WGS84 EPSG code
          },
        };

     

      resolve(geom);
 
 
  });
}


async function readShapefileAndConvertToGeoJSON(file) {

  console.log("File", file)



  // Assuming you have a File object named 'file'
  const zip = new JSZip();

  let kmlName
  let  shpName

  const fileExtension = file.name.split('.').pop();

  console.log('fileExtension',fileExtension)
if (file.name.endsWith('.kml') ) {
  console.log('This is a KML file.');

 // kmlName = file.name;
 const geomfromKML = await readKMLAndConvertToGeoJSON(file)
    .then((geom) => {
      // You can use the 'geom' object here
      console.log(geom);
      console.log("returning  from KML", geom)
      return geom 
    })
    .catch((error) => {
      console.error("Error reading and converting KML:", error);
    });
  
  console.log('geomfromKML', geomfromKML)
  return [geomfromKML]
  
} else if(file.name.endsWith('.kmz') ){

  console.log('This is  KMZ file.');
  await zip.loadAsync(file);

  const keys = Object.keys(zip.files);
  const  kml_name = keys.find((key) => /\.kml$/.test(key));

  const kml_data = await zip.file(kml_name).async("ArrayBuffer");

// Convert the ArrayBuffer to a Uint8Array
const uint8Array = new Uint8Array(kml_data);

// Convert the Uint8Array to a string
const kmlString = new TextDecoder("utf-8").decode(uint8Array);
 

console.log('kmlString', kmlString)

 // kmlConvertToGeoJSON(kmlString)
  
  const geomfromKMZ = await kmlConvertToGeoJSON(kmlString)
    .then((geom) => {
      // You can use the 'geom' object here
      console.log(geom);
      console.log("returning  from KMZ", geom)
      return geom 
    })
    .catch((error) => {
      console.error("Error reading and converting KML:", error);
    });
  
    return [geomfromKMZ]

}

else {
  console.log('This is not a KML or KMZ file.');
  await zip.loadAsync(file);
  const keys = Object.keys(zip.files);
    shpName = keys.find((key) => /\.shp$/.test(key));

  
    if (shpName) {
      // Handle shapefile
      const prjName = keys.find((key) => /\.prj$/.test(key));
  
      if (!prjName) {
        return; // if no *.prj is found
      }
  
      const prj = await zip.file(prjName).async("text");
  
      const prjText = prj.replace(
        /DATUM\["D_.*",SPHEROID.*/,
        '$&,' + 'TOWGS84[-160,-8.66,188,0,0,0,0]]'
      );
  
      const pattern = /"([^"]+)"/; // match anything within double quotes
  
      const match = prjText.match(pattern);
      let crs_name;
      let sourceProj;
  
      if (match && match.length > 1) {
        crs_name = match[1];
      } else {
        console.log("No match found.");
      }
  
      if (crs_name == "Arc_1960_UTM_Zone_37S") {
        // zone 37S
        sourceProj =
          "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
      } else if (crs_name == "Arc_1960_UTM_Zone_37N") {
        // zone 37 N
        sourceProj =
          "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs";
      } else if (crs_name == "Arc_1960_UTM_Zone_36S") {
        // zone 36 S
        sourceProj =
          "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
      } else if (crs_name == "Arc_1960_UTM_Zone_36N") {
        // zone 36N
        sourceProj =
          "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
      } else {
        sourceProj = "+proj=longlat +datum=WGS84 +no_defs";
      }
  
      const wgs84Proj4Def = "+proj=longlat +datum=WGS84 +no_defs";
  
      // Define the temporary projections with the proj4 definition strings
      proj4.defs("SOURCE_CRS", sourceProj);
      proj4.defs("WGS84", wgs84Proj4Def);
  
      let dbfName = keys.find((key) => /\.dbf$/.test(key));
      if (!dbfName) {
        dbfName = null;
      }
  
      return new Promise(async (resolve, reject) => {
        const features = [];
  
        const shpData = await zip.file(shpName).async("ArrayBuffer");
        const dbfData = await zip.file(dbfName).async("ArrayBuffer");
        try {
          open(shpData, dbfData)
            .then(function (source) {
              source.read().then(function next(result) {
                if (result.done) {
                  resolve(features);
                  return;
                }
                const feature = result.value;
                const geometry = feature.geometry;
  
                // Check if the geometry type is "Polygon" or "MultiPolygon"
                if (geometry.type === "Polygon") {
                  // If it's a single polygon, project its coordinates
                  geometry.coordinates[0] = geometry.coordinates[0].map((coordinate) => {
                    return proj4("SOURCE_CRS", "WGS84", coordinate);
                  });
                } else if (geometry.type === "MultiPolygon") {
                  // If it's a multi-polygon, loop through all polygons and project their coordinates
                  geometry.coordinates.forEach((polygon) => {
                    polygon[0] = polygon[0].map((coordinate) => {
                      return proj4("SOURCE_CRS", "WGS84", coordinate);
                    });
                  });
                }
                // Set the GeoJSON CRS object to GCS WGS84
                feature.crs = {
                  type: "name",
                  properties: {
                    name: "EPSG:4326", // GCS WGS84 EPSG code
                  },
                };
  
                features.push(feature);
                source.read().then(next);
              });
            })
            .catch(function (error) {
              console.error(error);
              reject(error);
            });
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    } else if (kmlName) {
      console.log('test....')
    } else {
      // No shapefile or KML found
      return;
    }
} 



}


export default readShapefileAndConvertToGeoJSON
