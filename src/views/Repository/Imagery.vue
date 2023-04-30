<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Plus,
  Download,
  Filter,
  MessageBox,
  Edit,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption,  ElDivider, ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElPopconfirm } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { onMounted } from 'vue'


import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
 
 
import axios from 'axios';
import * as xmlJs from 'xml-js';




const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;






const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)







const { push } = useRouter()
  

 

 
 
const lyr = ref('')
const options = [
  {
    value: 'Option1',
    label: 'Option1',
  },
  {
    value: 'Option2',
    label: 'Option2',
  },
  {
    value: 'Option3',
    label: 'Option3',
  },
  {
    value: 'Option4',
    label: 'Option4',
  },
  {
    value: 'Option5',
    label: 'Option5',
  },
]



const layers = ref([])
const selOptions = ref([])

const layerName = ref()
const bounds = ref()

const handleSelectLayer = async (lyr: any) => { 
  console.log('Layer',lyr)
  layerName.value = lyr;


  var filteredLayers = layers.value.filter(function(layer) {
      return layer.name === lyr;
    });

bounds.value=filteredLayers[0].bbox[0]
console.log('filteredLayers',filteredLayers[0].bbox[0])

    loadMap()
}

const loadMap = () => {
  var map = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [37.137343, 1.137451], // starting position
    zoom: 6,

  })
 
  map.addControl(new mapboxgl.NavigationControl());


  map.on('load', () => { 

    map.resize()
 
 
      var server = 'http://159.223.109.100:8080/geoserver/kisip/wms'
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

      //console.log(bounds.value._attributes.minx)
     map.fitBounds([[bounds.value._attributes.minx, bounds.value._attributes.miny],  [bounds.value._attributes.maxx, bounds.value._attributes.maxy]  ]);


  })
  

} 
 
onMounted(() => {
      axios
      .get('/imagery')
      .then((response) => {
        const xml = response.data;
       // console.log(xml)
          const options = { compact: true, ignoreComment: true, spaces: 4 };
        const result =  xmlJs.xml2json(xml, options);

        const obj = JSON.parse(result)
    //    console.log(obj)

   //     console.log(obj.WMS_Capabilities.Capability.Layer);

        const glayers = obj.WMS_Capabilities.Capability.Layer.Layer.map(layer => ({
            name: layer.Name._text,
            title: layer.Title._text,
            label: layer.Name._text,
          value: layer.Name._text,
            bbox :layer.BoundingBox
            
          }));
            
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

