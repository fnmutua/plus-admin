import * as turf from 'turf'
import JSZip from 'jszip';
import { open } from 'shapefile';
import proj4 from 'proj4';
import wellknown from 'wellknown';


async function readShapefileAndConvertToGeoJSON(file) {

// Define the WKT string
const wkt = 'PROJCS["Arc_1960_UTM_Zone_37S",GEOGCS["GCS_Arc_1960",DATUM["D_Arc_1960",SPHEROID["Clarke_1880_RGS",6378249.145,293.465]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",10000000.0],PARAMETER["Central_Meridian",39.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]';

// Define a temporary projection
proj4.defs("TEMP", wkt);

// Get the EPSG code
const defnd = proj4.defs("TEMP") 
 
  
const fromProjection = 'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",42.68333333333333],PARAMETER["standard_parallel_2",41.71666666666667],PARAMETER["latitude_of_origin",41],PARAMETER["central_meridian",-71.5],PARAMETER["false_easting",200000],PARAMETER["false_northing",750000],AUTHORITY["EPSG","26986"],AXIS["X",EAST],AXIS["Y",NORTH]]';
const toProjection = "+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
//I'm not going to redefine those two in latter examples.
const projected  = proj4(fromProjection,toProjection,[-122.305887, 58.9465872]);

console.log(projected)



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
    try {
      open(shpData)
        .then(function (source) {
          source.read().then(function next(result) {
            if (result.done) {
              resolve(features)
              return;
            };
            const feature = result.value;
            const geometry = feature.geometry;

            // Project each coordinate of the geometry
            geometry.coordinates[0] = geometry.coordinates[0].map(coordinate => {
              return proj4("SOURCE_CRS", "WGS84", coordinate);
              //return proj4("SOURCE_CRS").inverse(coordinate);

            });

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
