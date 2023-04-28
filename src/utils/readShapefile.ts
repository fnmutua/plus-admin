import * as turf from 'turf'
import JSZip from 'jszip';
import { open } from 'shapefile';
import proj4 from 'proj4';
import wellknown from 'wellknown';


async function readShapefileAndConvertToGeoJSON(file) {
 
 


  const zip = new JSZip();
  await zip.loadAsync(file);
  const keys = Object.keys(zip.files)

  const shpName = keys.find(key => /\.shp$/.test(key));
  if (!shpName) {
    return; // if no *.shp are found 
  }

  const prjName = keys.find(key => /\.prj$/.test(key));
  console.log('prjName', prjName)
 
    
  if (prjName) {
    const prjText = await zip.file(prjName).async("text");
    const wgs84Proj4Def = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

      // Define the temporary projections with the proj4 definition strings
      proj4.defs("SOURCE_CRS", prjText);
      proj4.defs("WGS84", wgs84Proj4Def);
  } else {
    return; // if no *.prj are found 

  }

  let dbfName = keys.find(key => /\.dbf$/.test(key));
  if (!dbfName) {
    dbfName = null;
  }

  
  return new Promise(async (resolve, reject) => {
    const features = [];

    const shpData = await zip.file(shpName).async("ArrayBuffer");
    const dbfData = await zip.file(dbfName).async("ArrayBuffer");
    try {
      open(shpData,dbfData)
        .then(function (source) {
          source.read().then(function next(result) {
            if (result.done) {
              resolve(features)
              return;
            };
            const feature = result.value;
            const geometry = feature.geometry;
            console.log(geometry)
              // Check if the geometry type is "Polygon" or "MultiPolygon"
              if (geometry.type === "Polygon") {
                // If it's a single polygon, project its coordinates
                geometry.coordinates[0] = geometry.coordinates[0].map(coordinate => {
                  return proj4("SOURCE_CRS", "WGS84", coordinate);
                });
              } else if (geometry.type === "MultiPolygon") {
                // If it's a multi-polygon, loop through all polygons and project their coordinates
                geometry.coordinates.forEach(polygon => {
                  polygon[0] = polygon[0].map(coordinate => {
                    return proj4("SOURCE_CRS", "WGS84", coordinate);
                  });
                });
              }
             // Set the GeoJSON CRS object to GCS WGS84
              feature.crs = {
                type: "name",
                properties: {
                  name: "EPSG:4326" // GCS WGS84 EPSG code
                }
              };

            features.push(feature)
            console.log('features',feature)
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
}

export default readShapefileAndConvertToGeoJSON
