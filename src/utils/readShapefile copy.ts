 
import  JSZip   from 'jszip';
//import  shapefile   from 'shapefile';
import {open} from 'shapefile';
 
import { reactive, unref, ref } from 'vue'
import * as turf from '@turf/turf'


async function readShapefileAndConvertToGeoJSON(file) {
  // read the shapefile using the FileReader API
  const zip = new JSZip();
  await zip.loadAsync(file);
  const keys = Object.keys(zip.files)
  const features = ref([])

  //const shpName = keys.findIndex(element => element.includes(".shp "));
  const shpName = keys.filter(arr=>arr.match(".shp")!==null)
  console.log(shpName)

  
  await zip.file(shpName[0]).async("ArrayBuffer").then(function(data) {
    // data is an ArrayBuffer
    // TODO your code goes here
    console.log('Array Buffer', data)
   

    open(data)
    .then(function (source) {
    source.read().then(function next(result) {
      if (result.done) {
      //  console.log(features.value)
       
        return(features.value)
       
      };
      features.value.push(result.value)
      source.read().then(next);
    });
  })
  .catch(function(error) {
    console.error(error.stack);
  });
    
    

})
 

 
}

export default readShapefileAndConvertToGeoJSON
