<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { ElButton, ElBadge, ElSelect, MessageParamsWithType } from 'element-plus'
import { ElMessage, ElOptionGroup, ElIcon } from 'element-plus'
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

import { ref, reactive, watch, computed,onMounted } from 'vue'
import {
  ElTable, ElTableColumn, ElCard,ElRow, ElCollapseItem, ElPagination,
  ElFormItem, ElInput, ElTabPane,ElTabs,ElOption, 
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import { getFile } from '@/api/summary'
import xlsx from "json-as-xlsx"
import axios from 'axios';
import * as xmlJs from 'xml-js';



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)

const pageSize = ref(5)
const currentPage = ref(1)
const loading = ref(false)

const showAdminButtons = ref(false)
const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

}
// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}


console.log("Show Buttons -->", showAdminButtons)

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

onMounted(() => {
  
    axios
      .get('/imagery')
      .then((response) => {
        const xml = response.data;
       // console.log(xml)
  

        const options = { compact: true, ignoreComment: true, spaces: 4 };
        const result = xmlJs.xml2json(xml, options);

        const obj = JSON.parse(result)
        console.log(obj)

        console.log(obj.WMS_Capabilities.Capability.Layer);

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


 
const { t } = useI18n()


const groups = ref()
 
 


 
//console.log('TBL-4f', liveDocs.value)

 

 

 


 


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;





 
//getDocumentTypes()
const searchTerm = ref('')
 
 
const activeTab =ref('Table') 
const map =ref( ) 


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

    // map.addSource('wms-test-source', {
    //       'type': 'raster',
    //       'tiles': [
    //       'https://img.nj.gov/imagerywms/Natural2015?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=Natural2015'
    //       ],
    //       'tileSize': 256
    //       });
    //   map.addLayer(
    //       {
    //       'id': 'wms-test-layer',
    //       'type': 'raster',
    //       'source': 'wms-test-source',
    //       'paint': {}
    //       },
    //       'building' // Place layer under labels, roads and buildings.
    //   );

      

      // map.addSource('layer-source', {
      //     'type': 'raster',
      //     'tiles': [
      //     'http://localhost:8080/geoserver/kisip/wms?&bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=Natural2015' ],
      //   'tileSize': 256 
      //     });
      // map.addLayer(
      //     {
      //     'id': 'lry-test-layer',
      //     'type': 'raster',
      //     'source': 'layer-source',
      //     'paint': {}
      //     },
      //     'building' // Place layer under labels, roads and buildings.
      // );

 


     map.addLayer({
      'id': 'geoserver-wms-layer',
      'type': 'raster',
      'source': {
        'type': 'raster',
        'tiles': [ 'http://localhost:8080/geoserver/kisip/wms?&bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=' + layerName.value ],
          'tileSize': 256
      },
      'paint': {}
     });

     console.log(bounds.value._attributes.minx)
     map.fitBounds([[bounds.value._attributes.minx, bounds.value._attributes.miny], // southwestern corner of the bounds
        [bounds.value._attributes.maxx, bounds.value._attributes.maxy] // northeastern corner of the bounds
]);


  })
  

} 
 


 

  const lyr = ref()
</script>

<template>
  <ContentWrap
:title="t('Data Repository')" :message="t('Use the filters to subset')" v-loading="loading"
    element-loading-text="Getting the documents.......">
 
    <el-select v-model="lyr"   placeholder="Select the Image to dispaly" :onChange="handleSelectLayer">
      <el-option v-for="item in selOptions" :key="item.value" :label="item.label" :value="item.value" />
   </el-select>
 
    <!-- <div>
    <h1>List of Layers</h1>
    <ul>
      <li v-for="layer in layers" :key="layer">{{ layer }}</li>
    </ul>
  </div> -->

  <div>
    <!-- <el-tabs v-model="activeTab" @tab-click="clickTab">
      <el-tab-pane label="Table">
        <el-table :data="layers" style="width: 100%">
          <el-table-column prop="name" label="Name"/>
          <el-table-column prop="title" label="Title"/>
         </el-table>
      </el-tab-pane>
      <el-tab-pane label="Map">
        <div id="mapContainer" style="height: 450px"></div>
      </el-tab-pane>

      
    </el-tabs> -->
   
    <div id="mapContainer" style="height: 450px"></div>

      <!-- <el-col  :span="12"  :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
    <el-table :data="layers" style="width: 40%">
          <el-table-column prop="name" label="Name"/>
          <el-table-column prop="title" label="Title"/>
         </el-table>
        </el-col>
        <el-col  :span="12"  :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
         <div id="mapContainer" style="height: 450px"></div>

        </el-col>
  -->
   

  </div>


  </ContentWrap>
</template>
<style scoped>
.collapsible-header-icon {
  margin-right: 8px;
}

.collapsible-nested-header-icon {
  margin-right: 8px;
  margin-left: 20px;
}

.collapsible-header-text {
  vertical-align: middle;
  font-size: 16px;

}

.collapsible-header-style {
  background-color: #a8a0a0;
}

.format-header-text {
  vertical-align: middle;
  font-size: 14px;

}

.doc-list {
  margin-left: 30px;
}

.doc-info {
  display: flex;
  flex-direction: column;
  margin-left: 12px;
}

.doc-title {
  font-weight: bold;
}

.doc-author {
  margin-top: 5px;
}

.doc-date {
  margin-top: 5px;
  font-size: 12px;
  color: #888;
}

.item {
  margin-top: 40px;
  margin-right: 40px;
}

.el-divider {
  margin: 5px 0;
  border-top: 1px solid #dcdfe6;
}

.el-select {
  width: 100%;
  margin-bottom: 20px;
}


</style>