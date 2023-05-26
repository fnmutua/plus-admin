<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { ElSelect } from 'element-plus'

import { ref } from 'vue'
import { ElOption } from 'element-plus'
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
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
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
    var server = 'https://cloud.ags.co.ke/geoserver/kisip/wms'
      
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
      axios
    //  .get('http://159.223.109.100:8080/geoserver/kisip/ows/?SERVICE=WMS&REQUEST=GetCapabilities')
      .get('https://cloud.ags.co.ke/geoserver/kisip/ows/?SERVICE=WMS&REQUEST=GetCapabilities')
      .then((response) => {
        const xml = response.data;
       // console.log(xml)


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

 
</script>

<template>
  <ContentWrap title="Imagery" >
 
    <div style="display: inline-block; width: 50%;  margin-left: 20px">
      <el-select  placeholder="Select the Image to dispaly" v-model="lyr" clearable  :onChange="handleSelectLayer" >
        <el-option v-for="item in selOptions" :key="item.value" :label="item.label" :value="item.value" />

  </el-select>
    </div>
    <div id="mapContainer" style="height: 450px"></div>

   </ContentWrap>
 


</template>
 <style>

.el-select {
  width: 100%;
  margin-bottom: 20px;
}</style>

