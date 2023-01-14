import * as turf from 'turf'
import  JSZip   from 'jszip';
//import  shapefile   from 'shapefile';
import {write} from 'shapefile';
 
  
async function writeShapefile(geoJsonData) {
   console.log('Writing the')
 // Convert the GeoJSON to a shapefile
write('shapefile.shp', geoJsonData)
.then(() => {
  console.log('Shapefile created successfully!');
  // Download the shapefile
  const downloadLink = document.createElement('a');
  downloadLink.href = 'shapefile.shp';
  downloadLink.download = 'shapefile.shp';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
})
.catch(error => console.error(error));
}

export default writeShapefile
