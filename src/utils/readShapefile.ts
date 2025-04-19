import JSZip from 'jszip';
import { open } from 'shapefile';
import proj4 from 'proj4';
import { DOMParser } from 'xmldom';
import * as togeojson from '@mapbox/togeojson';

// Type definitions
interface GeoJsonFeature {
  type: string;
  geometry: { type: string; coordinates: any };
  properties: Record<string, any>;
  crs?: { type: string; properties: { name: string } };
}

interface GeoJson {
  type: string;
  features: GeoJsonFeature[];
  crs?: { type: string; properties: { name: string } };
}

// Common CRS definitions
const CRS_DEFINITIONS: Record<string, string> = {
  'EPSG:4326': '+proj=longlat +datum=WGS84 +no_defs',
  'EPSG:3857': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
  'Arc_1960_UTM_Zone_37S': '+proj=utm +zone=37 +south +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs',
  'Arc_1960_UTM_Zone_37N': '+proj=utm +zone=37 +north +a=6378249.145 +rf=293.465 +towgs84=-157,-2,-299,0,0,0,0 +units=m +no_defs',
  'Arc_1960_UTM_Zone_36S': '+proj=utm +zone=36 +south +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs',
  'Arc_1960_UTM_Zone_36N': '+proj=utm +zone=36 +north +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs',
};

// Register CRS definitions with proj4
Object.entries(CRS_DEFINITIONS).forEach(([epsg, def]) => {
  proj4.defs(epsg, def);
});

/**
 * Reads a file (shapefile .zip, KML, or KMZ) and converts it to GeoJSON with WGS84 CRS.
 * @param file - The uploaded file (shapefile .zip, KML, or KMZ)
 * @returns Promise resolving to a GeoJSON FeatureCollection
 * @throws Error if file processing or reprojection fails
 */
async function readFileAndConvertToGeoJSON(file: File): Promise<GeoJson> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  console.log(`Processing file: ${file.name} (Extension: ${fileExtension})`);

  if (fileExtension === 'kml') {
    // Handle KML file
    try {
      const text = await file.text();
      const kmlDoc = new DOMParser().parseFromString(text, 'application/xml');

      // Check for parse errors
      const parseError = kmlDoc.getElementsByTagName('parsererror');
      if (parseError.length) {
        throw new Error(`KML Parsing Error: ${parseError[0].textContent}`);
      }

      if (kmlDoc.documentElement.nodeName !== 'kml') {
        throw new Error('Invalid KML: Not a valid KML document or KML root element missing');
      }

      const geoJson = togeojson.kml(kmlDoc) as GeoJson;
      if (!geoJson.features || geoJson.features.length === 0) {
        throw new Error('Invalid KML: No features found. Ensure the file contains valid Placemark geometry.');
      }

      console.log(`KML processed: ${geoJson.features.length} features`);
      geoJson.crs = { type: 'name', properties: { name: 'EPSG:4326' } };
      return {
        type: 'FeatureCollection',
        features: geoJson.features,
        crs: geoJson.crs,
      };
    } catch (error) {
      console.error('KML processing error:', error);
      throw new Error(`Failed to process KML: ${error.message || 'Unknown error'}`);
    }
  } else if (fileExtension === 'kmz') {
    // Handle KMZ file
    try {
      const zip = new JSZip();
      await zip.loadAsync(file);
      const kmlFileName = Object.keys(zip.files).find((key) => /\.kml$/.test(key));
      if (!kmlFileName) {
        throw new Error('Invalid KMZ: No .kml file found');
      }
      const kmlData = await zip.file(kmlFileName).async('string');
      const kmlDoc = new DOMParser().parseFromString(kmlData, 'text/xml');
      if (kmlDoc.documentElement.nodeName !== 'kml') {
        throw new Error('Invalid KMZ: Not a valid KML document');
      }
      const geoJson = togeojson.kml(kmlDoc) as GeoJson;
      if (!geoJson.features || !geoJson.features.length) {
        throw new Error('Invalid KMZ: No features found');
      }
      console.log(`KMZ processed: ${geoJson.features.length} features`);
      geoJson.crs = { type: 'name', properties: { name: 'EPSG:4326' } };
      return {
        type: 'FeatureCollection',
        features: geoJson.features,
        crs: geoJson.crs,
      };
    } catch (error) {
      console.error('KMZ processing error:', error);
      throw new Error(`Failed to process KMZ: ${error.message || 'Unknown error'}`);
    }
  } else if (fileExtension === 'zip') {
    // Handle zipped shapefile
    try {
      const zip = new JSZip();
      await zip.loadAsync(file);
      const keys = Object.keys(zip.files);
      console.log('Zip contents:', keys);

      const shpName = keys.find((key) => /\.shp$/.test(key));
      const dbfName = keys.find((key) => /\.dbf$/.test(key));
      const prjName = keys.find((key) => /\.prj$/.test(key));

      if (!shpName) {
        throw new Error('Invalid shapefile: No .shp file found');
      }

      let sourceProj = CRS_DEFINITIONS['EPSG:4326'];
      let crsName = 'EPSG:4326';

      if (prjName) {
        const prjText = await zip.file(prjName).async('text');
        const match = prjText.match(/"([^"]+)"/);
        crsName = match && match[1] ? match[1] : 'EPSG:4326';
        sourceProj = CRS_DEFINITIONS[crsName] || sourceProj;

        if (!CRS_DEFINITIONS[crsName]) {
          console.warn(`Unsupported CRS (${crsName}). Assuming WGS84.`);
        } else {
          proj4.defs('SOURCE_CRS', sourceProj);
          console.log(`Detected CRS: ${crsName}`);
        }
      } else {
        console.log('No .prj file found. Assuming WGS84.');
      }

      const shpData = await zip.file(shpName).async('arraybuffer');
      const dbfData = dbfName ? await zip.file(dbfName).async('arraybuffer') : null;

      const features: GeoJsonFeature[] = [];
      const source = await open(shpData, dbfData);
      let featureCount = 0;

      // Use source.read() for sequential reading
      while (true) {
        const result = await source.read();
        if (result.done) break;

        const feature = result.value as GeoJsonFeature;
        featureCount++;

        // Validate geometry
        if (!feature.geometry || !feature.geometry.coordinates) {
          console.warn(`Skipping feature ${featureCount}: Invalid geometry`);
          continue;
        }

        // Reproject coordinates if not WGS84
        if (crsName !== 'EPSG:4326' && CRS_DEFINITIONS[crsName]) {
          try {
            const projectCoordinates = (coords: number[]): number[] => {
              if (!coords || coords.length < 2) {
                throw new Error('Invalid coordinates');
              }
              return proj4('SOURCE_CRS', 'EPSG:4326', [coords[0], coords[1]]);
            };

            const transformGeometry = (geometry: any): any => {
              try {
                if (geometry.type === 'Point') {
                  return {
                    ...geometry,
                    coordinates: projectCoordinates(geometry.coordinates),
                  };
                } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
                  return {
                    ...geometry,
                    coordinates: geometry.coordinates.map(projectCoordinates),
                  };
                } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
                  return {
                    ...geometry,
                    coordinates: geometry.coordinates.map((ring: number[][]) =>
                      ring.map(projectCoordinates)
                    ),
                  };
                } else if (geometry.type === 'MultiPolygon') {
                  return {
                    ...geometry,
                    coordinates: geometry.coordinates.map((polygon: number[][][]) =>
                      polygon.map((ring: number[][]) => ring.map(projectCoordinates))
                    ),
                  };
                }
                console.warn(`Unsupported geometry type: ${geometry.type}`);
                return geometry;
              } catch (error) {
                console.warn(`Failed to reproject geometry in feature ${featureCount}: ${error.message}`);
                return geometry;
              }
            };

            feature.geometry = transformGeometry(feature.geometry);
          } catch (error) {
            console.warn(`Skipping feature ${featureCount} due to reprojection error: ${error.message}`);
            continue;
          }
        }

        // Set WGS84 CRS
        feature.crs = { type: 'name', properties: { name: 'EPSG:4326' } };
        features.push(feature);
      }

      if (!features.length) {
        throw new Error('Invalid shapefile: No valid features found');
      }

      console.log(`Shapefile processed: ${features.length} features`);
      return {
        type: 'FeatureCollection',
        features,
        crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      };
    } catch (error) {
      console.error('Shapefile processing error:', error);
      throw new Error(`Failed to process shapefile: ${error.message || 'Unknown error'}`);
    }
  } else {
    throw new Error('Unsupported file type. Please upload a .zip (shapefile), .kml, or .kmz file.');
  }
}

export default readFileAndConvertToGeoJSON;