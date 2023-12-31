
<template>
  <div class="floating-collapse">
    <el-select v-model="county" class="m-2" placeholder="Filter by County" size="large" @change="handleChangeCounty" filterable clearable>
        <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    <el-select
clearable filterable v-model="subcounty" class="m-2" placeholder="Filter by Subcounty" size="large"
      @change="handleChangeSubcounty" :onClear="clearSubCounty">
      <el-option v-for="item in subCountyOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-button @click="clearSubCounty"> Reset Filters</el-button>
  </div>

  


  <div  v-loading="mapLoading" :element-loading-text="mapLoadingText"  id="map" class="map"></div>

 
</template>

<script setup lang="ts" >
import { useRouter } from 'vue-router'
import { ref, reactive, onMounted } from 'vue'
import {
  ElButton, ElMenu, ElMenuItem, ElDialog, ElSelect, ElOption, ElDivider, ElRow, ElCol, ElText, ElCard, ElTable, ElTableColumn,
  ElForm, ElFormItem, ElInput, ElCarousel, ElCarouselItem, ElCollapse, ElCollapseItem, ElRate, ElMessage

} from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'

import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from 'vue-echarts';
import { EChartsOption, registerMap } from 'echarts'
import { Icon } from '@iconify/vue';
import { use } from "echarts/core";
import { PieChart, GaugeChart, BarChart, LineChart, } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent,

} from 'echarts/components';
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch } from '@/api/settlements'

import * as echarts from 'echarts';
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import * as turf from '@turf/turf'
import { useAppStoreWithOut } from '@/store/modules/app'
import { computed,nextTick, render } from 'vue'

import type { FormInstance, FormRules } from 'element-plus'
import { getAllGeo, getOneGeo ,streamAllGeo,streamGeo} from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'

import {  setUserFeedback } from '@/api/users'
import { uuid } from 'vue-uuid'
import { getfilteredGeo } from '@/api/settlements'

import {   getOneSettlement  } from '@/api/settlements'

 
const activeNames = ref(['01'])
const mainDiv = ref(['1'])
const handleChange = (val: string[]) => {
  console.log(val)
}

// do not use same name with ref
const formSize = ref('default')
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
  rating: 1
})


const tableData = ref([])
 
const mapLoading =ref(false)
const mapLoadingText =ref('Loading map....')






type EChartsOption = echarts.EChartsOption;
var option: EChartsOption;

use([
  GaugeChart,
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent
]);

const { push } = useRouter()

const showSatellite = ref(false);



const icon = ref(`<button>  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)

const toggleFloatingDiv = async () => {



  showSatellite.value = !showSatellite.value;
  console.log('Show Satellite', showSatellite.value);

  // Get the map style
  let style = map.value.getStyle();

  // Get all layers
  let allLayers = style.layers;

  // Log all layers to the console
  console.log('before ', allLayers);



  if (!showSatellite.value) {
    console.log('Remove Satellte');





    if (map.value.getLayer('Satellite')) {
      map.value.removeLayer('Satellite');
      map.value.removeSource('Satellite');

    }


  } else {

    console.log('Add Satellte');



    if (map.value.getLayer('Satellite')) {
      map.value.removeLayer('Satellite');
      map.value.removeSource('Satellite');

    } else {

      icon.value = `<button>  <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-satellite" fill="#f20707"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>650</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g fill="#fb0e0e"> <path d="M12.495,5.893 C12.832,6.231 14.184,4.877 13.847,4.541 L10.864,1.557 C10.526,1.219 9.174,2.573 9.51,2.909 L12.495,5.893 L12.495,5.893 Z" class="si-glyph-fill"> </path> <path d="M3.288,10.897 C3.072,10.68 2.597,10.802 2.23,11.168 C1.863,11.536 1.742,12.009 1.959,12.228 L3.233,13.501 C3.45,13.719 3.922,13.597 4.289,13.23 C4.658,12.864 4.779,12.388 4.562,12.172 L3.288,10.897 L3.288,10.897 Z" class="si-glyph-fill"> </path> <rect transform="translate(2.240100, 2.131300) rotate(-44.991897) translate(-2.240100, -2.131300) " x="-0.25987605" y="1.13130958" width="4.96295245" height="1.95398128" class="si-glyph-fill"> </rect> <path d="M12.088,8.374 L10.657,9.802 L9.918,9.063 L11.543,7.439 C11.814,7.168 11.81,6.723 11.531,6.447 L9.031,3.948 C8.757,3.673 8.314,3.67 8.043,3.939 L6.419,5.564 L5.684,4.829 L7.113,3.401 L5.718,2.007 L2.221,5.503 L3.614,6.897 L5.028,5.484 L5.763,6.219 L4.134,7.849 C3.864,8.12 3.866,8.564 4.141,8.838 L6.641,11.336 C6.917,11.612 7.363,11.617 7.632,11.346 L9.262,9.717 L10.001,10.456 L8.585,11.869 L9.967,13.25 L13.464,9.753 L12.088,8.374 L12.088,8.374 Z" class="si-glyph-fill"> </path> <rect transform="translate(13.426200, 12.673100) rotate(-45.056720) translate(-13.426200, -12.673100) " x="10.9262228" y="11.6731091" width="4.96795479" height="1.97998198" class="si-glyph-fill"> </rect> </g> </g> </g></svg> </button>`

      map.value.addLayer(
        {
          id: 'Satellite',
          source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
          type: "raster"
        },
        'country-label'
      );
    }



  }

  // Get the map style
  style = map.value.getStyle();

  // Get all layers
  allLayers = style.layers;

  // Log all layers to the console
  console.log('after', allLayers);

}




let cards = []










console.log('cards', cards)








//model,field,formula, groupFields, filterFields, filtervalues




 
const dialogVisible = ref(false)
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;

const appStore = useAppStoreWithOut()

const isMobile = computed(() => appStore.getMobile)

console.log('isMobile', isMobile.value)

const dialogWidth = ref('20%')



const county = ref()
 const polyFarms = ref()
const countyGeo = ref()
const geojson = ref([])
const bounds = ref([])
const subcountyGeo = ref([])


 



const map = ref()
var isDarkMode  = appStore.getIsDark 
onMounted(async () => {

  if (isMobile.value) {
    dialogWidth.value = "70%"
  } else {
    dialogWidth.value = "20%"
  }

 
  console.log("isDark",appStore.getIsDark)

  var mapStyle = appStore.getIsDark ? 'mapbox://styles/agspatial/clqcfzcoa00bt01nwhmf465f7' : 'mapbox://styles/mapbox/light-v11';



  map.value = new mapboxgl.Map({
    container: 'map',
   // style: 'mapbox://styles/mapbox/streets-v12',
    //style: 'mapbox://styles/mapbox/light-v11',
    style:mapStyle,
    // style: 'mapbox://styles/agspatial/clamkcjwx000b14mmgzyx86vv',
    center: [36.799473, -1.264257],
    zoom: 14
  });

  map.value.addControl(new mapboxgl.NavigationControl());

  map.value.addControl(
        new mapboxgl.GeolocateControl({
        positionOptions: {
        enableHighAccuracy: true
        },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true,
        // Draw an arrow next to the location dot to indicate which direction the device is heading.
        showUserHeading: true
        }))

   
   
   
   map.value.on('load', async () => {
    mapLoading.value=true
    mapLoadingText.value = 'Getting Settlements...'
    await getFarmGeo()
    mapLoadingText.value = 'Getting counties...'

    console.log('get cunty shp')
    await getCountyGeo()

    console.log('get cunty list')

    await getCounty()
    console.log('get cunty done....')

    mapLoading.value=false

    map.value.addSource('County', {
      type: 'geojson',
      // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
      // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
      data: countyGeo.value,

    });



    map.value.addLayer({
      id: 'county',
      type: 'line',
      source: 'County',
      paint: {
        'line-color': 'red',
        'line-opacity': 0.4, // Adjust the opacity if needed
        'line-width': 1, // Adjust the width of the line if needed
        'line-dasharray': [2, 2], // Adjust the dash pattern [dash, gap]
      },
    });

    addSettlementLayers()



    bounds.value = turf.bbox((countyGeo.value))
    console.log("From geo", bounds.value)
    map.value.fitBounds(bounds.value, { padding: 20 })




    // inspect a cluster on click
    map.value.on('click', 'clusters', (e) => {
      
      const features = map.value.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      console.log('cluster>>,',features)


      const clusterId = features[0].properties.cluster_id;
      map.value.getSource('farmers').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;

          map.value.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });



    



    function addHomeButton(map) {
      class HomeButton {
        onAdd(map) {
          const div = document.createElement("div");
          div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
          div.innerHTML =
            `<button>
            <svg fill="#3ba239" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 68.675 68.675" xml:space="preserve" stroke="#3ba239"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M67.683,30.151L53.394,19.149V7.684c0-1.404-1.139-2.544-2.543-2.544s-2.543,1.14-2.543,2.544v7.547l-12.42-9.562 c-0.914-0.704-2.188-0.704-3.104,0L0.992,30.151c-1.113,0.856-1.32,2.453-0.464,3.565c0.856,1.113,2.454,1.32,3.567,0.464 l2.793-2.15v28.961c0,1.402,1.139,2.543,2.543,2.543h44.37L43.646,53.381c-2.662,1.782-5.863,2.823-9.309,2.823 c-9.248,0-16.745-7.498-16.745-16.743c0-9.248,7.497-16.745,16.745-16.745c9.247,0,16.743,7.497,16.743,16.745 c0,3.35-0.984,6.466-2.68,9.082l13.004,13.004c0.039-0.181,0.062-0.365,0.062-0.558V31.783l3.11,2.396 c0.463,0.355,1.009,0.527,1.552,0.527c0.762,0,1.516-0.34,2.016-0.991C69.004,32.604,68.797,31.007,67.683,30.151z"></path> <path d="M34.338,25.17c-7.791,0-14.105,6.316-14.105,14.104c0,7.791,6.314,14.104,14.105,14.104 c7.788,0,14.104-6.312,14.104-14.104C48.441,31.486,42.126,25.17,34.338,25.17z M43.56,41.178c-1.17,0-2.119-0.949-2.119-2.119 c0-4.038-3.285-7.322-7.322-7.322c-1.171,0-2.119-0.949-2.119-2.12c0-1.17,0.948-2.12,2.119-2.12 c6.375,0,11.562,5.188,11.562,11.562C45.679,40.229,44.731,41.178,43.56,41.178z"></path> </g> </g> </g></svg>         </button>`;
          div.addEventListener("contextmenu", (e) => e.preventDefault());
          div.addEventListener("click", () => clearSubCounty());

          return div;
        }
      }
      const homeButton = new HomeButton();
      map.value.addControl(homeButton, "top-right");
    }
    addHomeButton(map)

   

    function addInfo(map) {
      class InfoButton {
        onAdd(map) {
          const div = document.createElement("div");
          div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
          div.innerHTML = icon.value;
          div.addEventListener("contextmenu", (e) => e.preventDefault());
          div.addEventListener("click", () => toggleFloatingDiv());

          return div;
        }
      }
      const infoBttn = new InfoButton();
      map.value.addControl(infoBttn, "top-right");
    }
    addInfo(map)

  })
  
  map.value.on('click', 'unclustered-point', (e) => {
      const feature = e.features[0];
      const coordinates = feature.geometry.coordinates.slice();
      console.log('Clicked Feature', feature);

      const farm =   getClickedFarm(feature.properties.id)
     

      
            
                
            }); 

})


 



const addSettlementLayers = async () => {
  map.value.addSource('farmers', {
    type: 'geojson',
    // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
    // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
    data: geojson.value,
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
  });



  map.value.addSource('polyFarms', {
    type: 'geojson',
    // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
    // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
    data: polyFarms.value,

  });




  map.value.addLayer({
    id: 'polyFarms',
    type: 'line',
    source: 'polyFarms',
    paint: {
      'line-color': 'red',
      'line-opacity': 1, // Adjust the opacity if needed
      'line-width': 2, // Adjust the width of the line if needed
      'line-dasharray': [1, 3, 0.1, 3], // Adjust the dash pattern [dot, gap, star, gap]
    },
  },
  );

  map.value.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'farmers',
    filter: ['has', 'point_count'],
    paint: {
      // Use step expressions (https://docs.mapbox.com/style-spec/reference/expressions/#step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      'circle-color': [
            'step',
            ['get', 'point_count'],
            'rgba(81, 187, 214, 0.47)', // Blue with 67% transparency for less than 5 points
            5,
            'rgba(241, 240, 117, 0.47)', // Yellow with 67% transparency for 5 to 10 points
            10,
            'rgba(242, 140, 177, 0.47)' // Pink with 67% transparency for 10 or more points
        ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        5,
        30,
        10,
        40
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': 'white'
    }
  },
  );

  map.value.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'farmers',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  },
  );


  map.value.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'farmers',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': 'green',
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': 'white'
    }
  },

  );


  map.value.addLayer({
  'id': 'settlementLabel',
  'type': 'symbol',
  'source': 'farmers',
  'layout': {
    'text-field': [
      'concat',
      ['to-string', ['get', 'name']] 
    ],
    'text-size': 12,
    'text-offset': [0, 1]
  },
  'paint': {
    'text-color': 'red',
    'text-halo-color': 'white', // Add white halo color
    'text-halo-width': 1 // Set the width of the halo
  }
});



}


const removeSettlementLayers = async () => {

 
  //
  console.log(' removing clusters.......')
  map.value.removeLayer('clusters');
 //
 console.log('removing...cluster-count....')
  map.value.removeLayer('cluster-count');

  console.log('removing...unclustered-count....')
  map.value.removeLayer('unclustered-point');

  console.log('removing...polyFarms....')
  map.value.removeLayer('polyFarms');


  console.log('removing...settlementLabel....')
  map.value.removeLayer('settlementLabel');


  map.value.removeSource('farmers');
  map.value.removeSource('polyFarms');


}



// Function to compute centroids for non-point features
 
async function computeCentroids(featureCollection) {
  const resultFeatures = [];
  const polyFeatures = [];

  featureCollection.features.forEach((feature) => {
    // Check if the feature is a Point
    if (feature.geometry.type === 'Point') {
      // Preserve the original point
      resultFeatures.push(feature);
    } else {
      // Compute centroid for polygons, lines, etc.
        // Compute centroid for polygons, lines, etc.
        try {
        const centroid = turf.centroid(feature);
        centroid.properties = feature.properties;

        resultFeatures.push(centroid);

    
      } catch (error) {
        // Handle the error, if any, during centroid computation
        console.error('Error computing centroid:', error);
      }

      // Preserve the original polygon
      polyFeatures.push(feature);
    }
  });

  polyFarms.value = {
    type: 'FeatureCollection',
    features: polyFeatures,
  }

  return {
    type: 'FeatureCollection',
    features: resultFeatures,
  };
}





 


const _getFarmGeo = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.cache_key = 'settlement_geo'
  //const res = await streamAllGeo(formData)
  
  const res = await getAllGeo(formData)

  console.log('stream',res)

  console.log('Settlements >>', res)


  console.log('Settlements GEO geo >>', res.data[0].json_build_object)
  let featureCollection = res.data[0].json_build_object
  geojson.value = await computeCentroids(featureCollection);

}
 

const getFarmGeo = async () => {
  const params = {
    // Your request parameters here
    // For example, if you have query parameters, you can add them here
    model: 'settlement',
   cache_key: 'settlement_geo',
  };

  try {
    // Call the streamGeo function
    console.log('-------x-------------')
    const response = await streamGeo({ params });
    console.log(response)
    // Handle the response or stream as needed
    const res = response.data.data;

    let featureCollection = res[0].json_build_object
  geojson.value = await computeCentroids(featureCollection);
  
    
    

  } catch (error) {
    // Handle errors
    console.error('Error fetching data:', error.message);
  }
};

 


const getClickedFarm = async (id) => { 

  const form = {}
  form.model = 'settlement'
  form.id = id
  form.assocModel='county'

  await getOneSettlement(form)
      .then((res) => {
 
        

          const settlement = res.data 
          // Extract properties
          console.log('settlement',settlement)
          //const name = farm.name || 'Unknown';
          const area = settlement.area || 'N/A';

        // If the area is not 'N/A', round it to two decimals
        const roundedArea = area !== 'N/A' ? parseFloat(area).toFixed(2)+'m²' : 'N/A';

        // Now, `roundedArea` contains the rounded value to two decimals
    
         // const type_farming = convertArrayToStrings((farm.type_farming))
         const name =settlement.name
         const sett_id =settlement.id
          // Handle cases where the properties may be null or undefined

          // Correct for multiple copies of the feature
          
          const geom  = turf.centroid(settlement.geom);
           const popup = new mapboxgl.Popup({
            closeButton: false,  // Optionally, you can include or exclude the close button
          });
 

          const popupContent = `
            <div style="margin-top: 13px; font: 400 15px/22px 'Source Sans Pro', 'Helvetica Neue', sans-serif; padding: 0; width: 180px;">
                <h3 style="background: ${isDarkMode ? '#333' : '#91c949'}; color: ${isDarkMode ? '#fff' : '#000'}; margin: 0; padding: 10px; border-radius: 3px 3px 0 0; font-weight: 700; margin-top: -15px; text-align: center;"><u>SETTLEMENT DETAILS (${sett_id} )</u></h3>
                <div style="font-style: italic; font-size: 12px; color: ${isDarkMode ? 'black' : '#000'};"> <b>Name:</b> ${name} </div>  
                <div style="font-style: italic; font-size: 12px; color: ${isDarkMode ? 'black' : '#000'};"> <b>Area:</b> ${roundedArea} </div>  
                <button   style="font-style: italic; font-size: 12px;"> More details...</button>
     
            </div> `;

          popup.setLngLat(geom.geometry.coordinates)
          .setHTML(popupContent)
          .addTo(map.value);

        // Click event on popupElement
        popup.getElement().addEventListener('click', () => {
              // your logic here
              console.log('clicked popup',sett_id)


              push({
                  path: '/settlement/map/:id',
                  name: 'SettlementMap',
                  params: { id: sett_id}
                })

              
            });
       })

      

}

const getCountyGeo = async () => {
  const formData = {}
  formData.model = 'county'
  formData.cache_key = 'county_geo'
  const res = await getAllGeo(formData)

  console.log("County returns >>", res)
  console.log('county geo', res.data[0].json_build_object)
  countyGeo.value = res.data[0].json_build_object


}





const getSubsetGeo = async (model, filterFields, filterValues) => {
  console.log('Get all settlements  for this subcounty ')

  const formData = {}
  formData.model = model
  formData.columnFilterField = filterFields
  formData.selectedParents = filterValues
  formData.id = filterValues

  console.log(formData)
  const res = await getfilteredGeo(formData)

  console.log('filtered Geo:', res.data[0].json_build_object.features)

  if (res.data[0].json_build_object.features) {
    let featureCollection = res.data[0].json_build_object


    geojson.value = await computeCentroids(featureCollection);

    console.log('featureCollection filtreed', featureCollection.features)
    // Check if the 'farms' layer already exists, and remove it if it does
    await removeSettlementLayers()
    await addSettlementLayers()
  }
  else {
    ElMessage.warning('No data')
  }

}


const adminOptions = ref([])
const countyOptions = ref([])

 

const subCountyOptions = ref([])

 

const getCounty = async () => {
  const res = await getListWithoutGeo({
    params: {
      //   pageIndex: 1,
      //  limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC',
     cache_key : 'new_list_no_geo'
    }
  }).then((response: { data: any }) => {
    console.log('Received county response:', response)
    const ret = response.data

    ret.forEach((data) => {
      const option = {
        value: data.id,
        label: data.name,
      };
      countyOptions.value.push(option);
    });




  })
}

 
 

 

 

 const subcounty = ref()

const clearSubCounty = async () => {
  console.log('clear filters')
//  handleChangeCounty(1)

county.value=null
subcounty.value=null
subCountyOptions.value=[]
    mapLoading.value=true
    mapLoadingText.value = 'Refreshing Settlements...'
    await getFarmGeo()
     await getCountyGeo()

 
    mapLoading.value=false


  // Check if the 'County' layer already exists, and remove it if it does
  if (map.value.getLayer('county')) {
    map.value.removeLayer('county');
    map.value.removeSource('County');
  }

  map.value.addSource('County', {
    type: 'geojson',
    data: countyGeo.value,
  });

  map.value.addLayer({
    id: 'county',
    type: 'line',
    source: 'County',
    paint: {
      'line-color': 'red',
      'line-opacity': 1,
      'line-width': 1,
      'line-dasharray': [2, 2],
    },

  });

  var bounds = turf.bbox(countyGeo.value);
  map.value.fitBounds(bounds, { padding: 20 });


  removeSettlementLayers()
  addSettlementLayers()
  


}

 

 

const handleChangeCounty = async (county) => {

// get farms for this subcounty 
if (county) {

  const geoForm = {}
  geoForm.model = 'county'
  geoForm.id = county

  console.log(geoForm)
 

  await getSubsetGeo('settlement', ['county_id'], [[county]])

  // get subcounty shape
  const res = await getOneGeo(geoForm)

  countyGeo.value = res.data[0].json_build_object



  // Check if the 'County' layer already exists, and remove it if it does
  if (map.value.getLayer('county')) {
    map.value.removeLayer('county');
    map.value.removeSource('County');
  }

  map.value.addSource('County', {
    type: 'geojson',
    data: countyGeo.value,
  });

  map.value.addLayer({
    id: 'county',
    type: 'line',
    source: 'County',
    paint: {
      'line-color': 'red',
      'line-opacity': 1,
      'line-width': 1,
      'line-dasharray': [2, 2],
    },

  });

  var bounds = turf.bbox(countyGeo.value);
  map.value.fitBounds(bounds, { padding: 20 });


  removeSettlementLayers()
  addSettlementLayers()

  

 await getListWithoutGeo({
    params: {
      //   pageIndex: 1,
      //  limit: 100,
      curUser: 1, // Id for logged in user
      model: 'subcounty',
      assocModel: 'county',
      searchField: 'county_id',
      searchKeyword: county,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('selecy county response:', response)
    const ret = response.data

    const coptions = [];
    ret.forEach((data) => {
      const option = {
        value: data.id,
        label: data.name,
        
      };
      coptions.push(option);
    });

    // Sort the options array by value
    coptions.sort((a, b) => a.value - b.value);

   
    subCountyOptions.value = coptions

   })


}

};

const handleChangeSubcounty = async (subcounty) => {

  // get farms for this subcounty 
  if (subcounty) {

    const geoForm = {}
    geoForm.model = 'subcounty'
    geoForm.id = subcounty

    console.log(geoForm)

    // get farmers for this subcounty 
   // await getFilteredSubcountyCounts(subcounty)


     await getSubsetGeo('settlement', ['subcounty_id'], [[subcounty]])

    // get subcounty shape
    const res = await getOneGeo(geoForm)

    subcountyGeo.value = res.data[0].json_build_object



    // Check if the 'Subcounty' layer already exists, and remove it if it does
    if (map.value.getLayer('Subcounty')) {
      map.value.removeLayer('Subcounty');
      map.value.removeSource('Subcounty');
    }

    map.value.addSource('Subcounty', {
      type: 'geojson',
      data: subcountyGeo.value,
    });

    map.value.addLayer({
      id: 'Subcounty',
      type: 'line',
      source: 'Subcounty',
      paint: {
        'line-color': 'blue',
        'line-opacity': 1,
        'line-width': 0.5,
        'line-dasharray': [2, 2],
      },

    });

    var bounds = turf.bbox(subcountyGeo.value);
    map.value.fitBounds(bounds, { padding: 20 });


    removeSettlementLayers()
    addSettlementLayers()

    // map.value.addSource('polyFarms', {
    //   type: 'geojson',
    //    data: polyFarms.value,

    // });


  }

};






  
//getCountySubcounty()
//getCounty()
//getSubCounty()
 

 


</script>



<style>
.flex-grow {
  flex-grow: 1;
}

.my-container {
  min-height: 100%;
  width: 100%;
  color: red;
  background: rgba(0, 128, 0, 0.3)
    /* Green background with 30% opacity */
}


.subtitle {
  font-size: 18px;
  color: red;
  letter-spacing: 23px;
  font-family: "Raleway";
  margin: 160px auto 40px auto;
  text-align: center;
  font-weight: bold;
}

.title {
  font-size: 36px;
  color: rgb(10, 10, 10);
  font-family: "arial";
  margin-left: 5%;
  margin-top: 25%;
  text-align: left;
  line-height: "43px";
  font-weight: 700;
  width: 400px;
  /* set the width of the box */
  height: 400px;
  /* set the height of the box */
  overflow: auto;
  /* allow scrolling if text overflows the box */
  word-wrap: break-word;
  /* break words to fit inside the box */
  text-wrap: unrestricted;
  /* allow wrapping of text even if there is no whitespace */
}



h1 {
  font-family: "Proza Libre", sans-serif;
  color: seagreen;
  font-weight: 300;
}


.button-container {
  text-align: left;
}

.multi-bg {
  height: 700px;
  display: block;
  background-color: rgb(11, 136, 0.01);

  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'%3E%3Cpolygon fill='%23cc3f47' points='957 450 539 900 1396 900'/%3E%3Cpolygon fill='%23b3373e' points='957 450 872.9 900 1396 900'/%3E%3Cpolygon fill='%23c8364e' points='-60 900 398 662 816 900'/%3E%3Cpolygon fill='%23b02f44' points='337 900 398 662 816 900'/%3E%3Cpolygon fill='%23c22f55' points='1203 546 1552 900 876 900'/%3E%3Cpolygon fill='%23ab294b' points='1203 546 1552 900 1162 900'/%3E%3Cpolygon fill='%23bb285c' points='641 695 886 900 367 900'/%3E%3Cpolygon fill='%23a52351' points='587 900 641 695 886 900'/%3E%3Cpolygon fill='%23b32362' points='1710 900 1401 632 1096 900'/%3E%3Cpolygon fill='%239f1f57' points='1710 900 1401 632 1365 900'/%3E%3Cpolygon fill='%23aa2068' points='1210 900 971 687 725 900'/%3E%3Cpolygon fill='%23971c5d' points='943 900 1210 900 971 687'/%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 160 80'%3E%3Cg fill='%23FFF' fill-opacity='0.2'%3E%3Cpolygon points='0 10 0 0 10 0'/%3E%3Cpolygon points='0 40 0 30 10 30'/%3E%3Cpolygon points='0 30 0 20 10 20'/%3E%3Cpolygon points='0 70 0 60 10 60'/%3E%3Cpolygon points='0 80 0 70 10 70'/%3E%3Cpolygon points='50 80 50 70 60 70'/%3E%3Cpolygon points='10 20 10 10 20 10'/%3E%3Cpolygon points='10 40 10 30 20 30'/%3E%3Cpolygon points='20 10 20 0 30 0'/%3E%3Cpolygon points='10 10 10 0 20 0'/%3E%3Cpolygon points='30 20 30 10 40 10'/%3E%3Cpolygon points='20 20 20 40 40 20'/%3E%3Cpolygon points='40 10 40 0 50 0'/%3E%3Cpolygon points='40 20 40 10 50 10'/%3E%3Cpolygon points='40 40 40 30 50 30'/%3E%3Cpolygon points='30 40 30 30 40 30'/%3E%3Cpolygon points='40 60 40 50 50 50'/%3E%3Cpolygon points='50 30 50 20 60 20'/%3E%3Cpolygon points='40 60 40 80 60 60'/%3E%3Cpolygon points='50 40 50 60 70 40'/%3E%3Cpolygon points='60 0 60 20 80 0'/%3E%3Cpolygon points='70 30 70 20 80 20'/%3E%3Cpolygon points='70 40 70 30 80 30'/%3E%3Cpolygon points='60 60 60 80 80 60'/%3E%3Cpolygon points='80 10 80 0 90 0'/%3E%3Cpolygon points='70 40 70 60 90 40'/%3E%3Cpolygon points='80 60 80 50 90 50'/%3E%3Cpolygon points='60 30 60 20 70 20'/%3E%3Cpolygon points='80 70 80 80 90 80 100 70'/%3E%3Cpolygon points='80 10 80 40 110 10'/%3E%3Cpolygon points='110 40 110 30 120 30'/%3E%3Cpolygon points='90 40 90 70 120 40'/%3E%3Cpolygon points='10 50 10 80 40 50'/%3E%3Cpolygon points='110 60 110 50 120 50'/%3E%3Cpolygon points='100 60 100 80 120 60'/%3E%3Cpolygon points='110 0 110 20 130 0'/%3E%3Cpolygon points='120 30 120 20 130 20'/%3E%3Cpolygon points='130 10 130 0 140 0'/%3E%3Cpolygon points='130 30 130 20 140 20'/%3E%3Cpolygon points='120 40 120 30 130 30'/%3E%3Cpolygon points='130 50 130 40 140 40'/%3E%3Cpolygon points='120 50 120 70 140 50'/%3E%3Cpolygon points='110 70 110 80 130 80 140 70'/%3E%3Cpolygon points='140 10 140 0 150 0'/%3E%3Cpolygon points='140 20 140 10 150 10'/%3E%3Cpolygon points='140 40 140 30 150 30'/%3E%3Cpolygon points='140 50 140 40 150 40'/%3E%3Cpolygon points='140 70 140 60 150 60'/%3E%3Cpolygon points='150 20 150 40 160 30 160 20'/%3E%3Cpolygon points='150 60 150 50 160 50'/%3E%3Cpolygon points='140 70 140 80 150 80 160 70'/%3E%3C/g%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 1600 800'%3E%3Cg %3E%3Cpolygon fill='%23740074' points='1600 160 0 460 0 350 1600 50'/%3E%3Cpolygon fill='%235f005f' points='1600 260 0 560 0 450 1600 150'/%3E%3Cpolygon fill='%234b004b' points='1600 360 0 660 0 550 1600 250'/%3E%3Cpolygon fill='%23360036' points='1600 460 0 760 0 650 1600 350'/%3E%3Cpolygon fill='%23220022' points='1600 800 0 800 0 750 1600 450'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: bottom center, 50%, 50%;
}

 

.el-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 200px;
  margin: 0;
  text-align: center;
  margin-bottom: 0%;
}





.el-carousel__item:nth-child(2n) {
  background-color: #d3dce6;
}

.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}


.text-center {
  display: flex;
  justify-content: center;
  /* Center text horizontally */
  align-items: center;
  /* Center text vertically */
  bottom: 0;

}

.text-at-bottom {
  position: absolute;
  text-align: center;
  display: flex;
  justify-content: center;
  /* Center text horizontally */
  align-items: center;
  /* Center text vertically */
  bottom: 0;
  bottom: 0;
}

.carousel-container {
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.2);
  /* Adjust shadow properties as needed */
}

.chart {
  height: 33vh;
}

.green {
  color: var(--el-color-success);
}

.red {
  color: var(--el-color-error);
}

#map {
  height: 95vh;
  /* Set the desired height for your map */
}
</style>



<style scoped>
/* Styles for the main content, including the menu and the map */


.mapboxgl-popup-close-button {
  display: none;
}

.mapboxgl-popup-content {
  font: 400 15px/22px 'Source Sans Pro', 'Helvetica Neue', sans-serif;
  padding: 0;
  width: 180px;
}

.mapboxgl-popup-content h3 {
  background: #91c949;
  color: #fff;
  margin: 0;
  padding: 10px;
  border-radius: 3px 3px 0 0;
  font-weight: 700;
  margin-top: -15px;
}

.mapboxgl-popup-content h4 {
  margin: 0;
  padding: 10px;
  font-weight: 400;
}

.mapboxgl-popup-content div {
  padding: 10px;
}

.mapboxgl-popup-anchor-top > .mapboxgl-popup-content {
  margin-top: 15px;
}

.mapboxgl-popup-anchor-top > .mapboxgl-popup-tip {
  border-bottom-color: #91c949;
}

.menu-container {
  height: 100vh;
  background-color: #24292e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

/* Styles for the floating div on the left */
.floating-div {
  position: fixed;
  left: 0;
  top: 60px;
  /* Height of the menu */
  width: 30%;
  /* 1/3 of the page */
  height: 95%;
  background-color: rgba(146, 143, 143, 0.7);
  /* Semi-transparent white background */
  z-index: 1000;
  /* Adjust as needed to be above other elements */
}


.floating-collapse {
  position: fixed;
  left: 10;
  top: 110px;
  /* Height of the menu */
  /* 1/3 of the page */
  /* Semi-transparent white background */
  z-index: 1000;
  /* Adjust as needed to be above other elements */
}



/* Media query to hide the floating div on small screens */


/* Adjust for smaller screens (e.g., screens with a width of 600px or less) */
@media screen and (max-width: 768px) {
  .el-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
    /* Adjust the max-width as needed */
    margin-top: 2px;
    margin-left: 2px;
    margin-right: 2px;
    /* Add any other adjustments for smaller screens */
  }

  .floating-div {
    display: none;
  }

 


}
</style>

<style>
 .el-loading-mask {
 
      opacity:0.7; /* Adjust the opacity value as needed (0.0 to 1.0) */

}

.el-loading-text {
 
 color:green; /* Adjust the opacity value as needed (0.0 to 1.0) */

}

.element-loading-text {
  color:green; /* Adjust the opacity value as needed (0.0 to 1.0) */


}
</style>