<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { ElSelect } from 'element-plus'

import { ref } from 'vue'
import { ElOption , ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElUpload} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { onMounted } from 'vue'


import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
 
 
import axios from 'axios';
 import { XMLParser } from 'fast-xml-parser';




const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;






const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)


 
 
const lyr = ref('')
 



const layers = ref([])
const selOptions = ref([])

const layerName = ref()
const bounds = ref()

const handleSelectLayer = async (lyr: any) => { 
  console.log('Layer',lyr)
  layerName.value = lyr;

  console.log(layers)

  var filteredLayers = layers.value.filter(function(layer) {
      return layer.name === lyr;
    });

    console.log('filteredLayers',filteredLayers[0].bbox)


bounds.value=filteredLayers[0].bbox
console.log('filteredLayerss',filteredLayers[0].bbox)

    loadMap()
}

const loadMap = () => {
  var map = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [37.137343, 1.137451], // starting position
    zoom: 6,

  })
 
  map.addControl(new mapboxgl.NavigationControl());


  map.on('load', () => { 

    map.resize()
 
 
    var xserver = 'http://159.223.109.100:8080/geoserver/kisip/wms'
    var server = 'https://kesmis.go.ke/geoserver/kisip/wms'
      
      var local_server = 'http://localhost:8080/geoserver/kisip/wms'

     map.addLayer({
      'id': 'geoserver-wms-layer',
      'type': 'raster',
      'source': {
        'type': 'raster',
        'tiles': [ server+'?&bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=' + layerName.value ],
          'tileSize': 256
      },
      'paint': {}
     });

       console.log(bounds.value)
     map.fitBounds([[bounds.value.westBoundLongitude, bounds.value.southBoundLatitude],  [bounds.value.eastBoundLongitude
, bounds.value.northBoundLatitude]  ]);


  })
  

} 
 
onMounted(() => {

  
  axios.get('/imagery/geoserver/kisip/ows/?SERVICE=WMS&REQUEST=GetCapabilities')  
  // Remember to revert to below 

     // axios.get('https://kesmis.go.ke/geoserver/kisip/ows/?SERVICE=WMS&REQUEST=GetCapabilities')
      // .get('https://kesmis.go.ke/geoserver/kisip/wms?service=wms&version=1.1.1&request=GetCapabilities')
      .then((response) => {
        const xml = response.data;
        console.log(xml)
 
       const parser = new XMLParser();
      const json = parser.parse(xml);

  

      const glayers= json.WMS_Capabilities.Capability.Layer.Layer.map(layer => ({
            name: layer.Name,
            title: layer.Title,
            label: layer.Name,
          value: layer.Name,
            bbox :layer.EX_GeographicBoundingBox

          }));

          console.log(glayers)

       

        layers.value = glayers;


        for (let i = 0; i < glayers.length; i++) {
          var opt = {}
          opt.value = glayers[i].name
          opt.label = glayers[i].name
          opt.bbox = glayers[i].bbox
          console.log(glayers[i])

    selOptions.value.push(opt)
  }


 
        console.log(selOptions)
        lyr.value=selOptions.value[0].value
        handleSelectLayer(selOptions.value[0].value)
        loadMap()
          
       
      })
      .catch((error) => {
        console.error(error);
      });

     
})


const dialogVisible = ref(false)

// Reactive form data
const form = ref({
        geoserverUrl: 'https://kesmis.go.ke/geoserver',
        workspace: 'kisip',
        username: 'admin',
        password: '***REDACTED***',

});

 
const selectedFiles = ref([false])
 
 

const handleFiles = (file, fileList) => { 

  selectedFiles.value = fileList;

}   

 
const uploadFiles = async () => {
  console.log('Upload files...')

  // Loop through each selected file and process/upload
  for (const file of selectedFiles.value) {
    try {
      // Extract store name from file name
      const store = file.name.replace(/ /g, '_').replace(/\.[^/.]+$/, '');

      // Upload file to GeoServer
      await uploadImageToGeoServer(file, store);

      // Process and publish the image to GeoServer
      // You would need to handle the rest of the workflow like in the Python script
      console.log(`Successfully uploaded and published ${file.name}`);
    } catch (error) {
      console.error(`Error processing ${file.name}: ${error.message}`);
    }
  }
}

const uploadImageToGeoServer = async (file, store) => {
       const url = `${form.value.geoserverUrl}/rest/workspaces/${form.value.workspace}/coveragestores/${store}/file.ecw`;

       console.log('url',url)
      const formData = new FormData();
      formData.append('file', file.raw, file.name);

      try {
        const response = await axios.put(url, formData, {
          headers: {
            'Content-Type': 'image/ecw',
          },
          auth: {
            username: form.value.username,
            password: form.value.password,
          },
        });

        if (response.status === 201 || response.status === 202) {
          console.log(`File ${file.name} uploaded successfully`);
        } else {
          console.error(`Failed to upload file ${file.name}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}: ${error}`);
      }
    }
 
</script>

<template>
  <ContentWrap title="Imagery" >
 
    <div style="display: inline-block; width: 50%;  margin-left: 20px">
      <el-select  placeholder="Select the Image to dispaly" v-model="lyr" clearable  :onChange="handleSelectLayer" >
        <el-option v-for="item in selOptions" :key="item.value" :label="item.label" :value="item.value" />
  </el-select>

  <el-button plain @click="dialogVisible = true">
    Click to open the Dialog
  </el-button>

    </div>
     <div id="mapContainer" class="basemap"></div>

   </ContentWrap>
 

   <el-dialog
    v-model="dialogVisible"
    title="Upload Imager to Geoserver"
    width="500"
   >
   <el-form ref="ruleFormRef" :model="form"   label-position="left"> 
            <el-form-item label="Name">
              <el-input  disabled v-model="form.geoserverUrl" />
            </el-form-item>

            <el-form-item label="Username">
              <el-input disabled v-model="form.username" />
            </el-form-item>

            <el-form-item label="Password">
              <el-input disabled v-model="form.password" type="password" />
            </el-form-item>
 
            <el-form-item label="Workspace">
              <el-input disabled v-model="form.workspace" />
            </el-form-item>

            <el-form-item label="Select Files" style="width: 100%;">
                <el-upload
                  multiple
                  drag
                  :auto-upload="false"
                  :on-change="handleFiles"
                  action=""
                  style="width: 100%;">
                  <i class="el-icon-upload"></i>
                  <div class="el-upload__text">Drop ECW files here or click to upload</div>
                </el-upload>
              </el-form-item>


          </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="uploadFiles">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>


</template>
 <style>
.basemap {
  width: 100%;
  height: 65vh;
}
.el-select {
  width: 100%;
  margin-bottom: 20px;
}</style>

