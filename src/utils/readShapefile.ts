import * as turf from 'turf'
import  JSZip   from 'jszip';
//import  shapefile   from 'shapefile';
import {open} from 'shapefile';
 
  
async function readShapefileAndConvertToGeoJSON(file) {
  const zip = new JSZip();
  await zip.loadAsync(file);
  const keys = Object.keys(zip.files)


    //const shpName = keys.findIndex(element => element.includes(".shp "));
    const shpName = keys.filter(arr=>arr.match(".shp")!==null)
  
  console.log("Reading shp v2--------", shpName)
  if (shpName.length ==0) { 
    return // if no *.shp are found 
  }
  return new Promise(async (resolve, reject) => {
     
          await zip.file(shpName[0]).async("ArrayBuffer").then(function(data) {
            
            try {
              const features = []
              open(data)
                .then(function (source) {

                  source.read().then(function next(result) {
                    if (result.done) {
                      console.log(features)
                      resolve(features)
                      return
              
                    };
                    features.push(result.value)
                    source.read().then(next);
                  });
                })
                .catch(function (error) {
                  console.error(error);
                  return 

   
                });
              
          
              console.log('resolve', features)
            } catch (error) { 
              console.log('errro')
              console.log("Error reading Shapefile")
              return 
            }
           })
  })
}

export default readShapefileAndConvertToGeoJSON