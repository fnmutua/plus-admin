<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'
import { ref } from 'vue'
import 'leaflet/dist/leaflet.css'

import { useRoute } from 'vue-router'


import { ElCard, ElButton, ElCheckboxGroup, ElCheckbox, ElCheckboxButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElSwitch, ElTooltip, ElOption, ElDivider } from 'element-plus'

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { Download, ArrowDown, ArrowLeft } from '@element-plus/icons-vue'

import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";

import writeShapefile from '@/utils/writeShapefile'
import * as download from 'downloadjs'
import { ElMessage } from 'element-plus'
import { ElCollapse, ElCollapseItem } from 'element-plus';
import { onMounted, computed, reactive } from 'vue'
import { useAppStoreWithOut } from '@/store/modules/app'
 

import { Icon } from '@iconify/vue';
import waterOutline from '@iconify-icons/mdi/water-outline';

const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;



const appStore = useAppStoreWithOut()



const title = ref('')

const route = useRoute()

////Configurations //////////////
const model = 'settlement'
////////////

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const filtergeo = ref([])

const projectTitle = ref('')

const facilityGeoPoints = ref()
const facilityGeoLines = ref()
const facilityGeoPolygons = ref()

const { t } = useI18n()

const facilityData = ref({})
const getGeodata = async (settlement_id, fmodel) => {
  const filterCol = 'settlement_id'
  const formData = {}
  formData.model = fmodel
  formData.columnFilterField = filterCol
  formData.selectedParents = settlement_id
  formData.id = settlement_id

  console.log(formData)

  await getfilteredGeo(formData)
    .then((response: { data: any }) => {
      if (response.data[0].json_build_object.features) {
        facilityData.value[fmodel] = response.data[0].json_build_object
          showLayerLegend.value=true
      }


    })



}


const ParcelGeodata = ref([])

const showParcelLegend = ref(false)
const showLayerLegend = ref(false)
const getParcels = async () => {
  const id = route.params.id
  const filterCol = 'settlement_id'

  const formData = {}
  formData.model = 'parcel'
  formData.columnFilterField = filterCol
  formData.selectedParents = id

  console.log(formData)

  formData.filtredGeoIds = [id]
  var parcelsPoly = []
  await getfilteredGeo(formData)
    .then((response: { data: any }) => {
      //   filtergeo.value = response.data[0].json_build_object
      console.log(response.data[0].json_build_object.features)
      if (response.data[0].json_build_object.features) {
        for (let i = 0; i < response.data[0].json_build_object.features.length; i++) {

          parcelsPoly.push(response.data[0].json_build_object.features[i])

        }
        showParcelLegend.value=true
      }  




    })
  ParcelGeodata.value = parcelsPoly
  console.log('Parcels Acqured', ParcelGeodata.value)




}

const getAll = async () => {
  console.log('Get all Settleemnts ')
  const id = route.params.id
  console.log('Project ID, Data:', id, route.params)

  const formData = {}
  formData.model = model
  formData.id = id

  console.log(formData)
  const res = await getOneGeo(formData)

  var points = []
  var lines = []
  var polygons = []


  console.log('Project Geo:', res.data[0].json_build_object.features)
  title.value = res.data[0].json_build_object.features[0].properties.name

  for (let i = 0; i < res.data[0].json_build_object.features.length; i++) {
    console.log("Geo Type -------->", res.data[0].json_build_object.features[i].geometry.type)
    projectTitle.value = res.data[0].json_build_object.features[i].properties.title
    filtergeo.value = res.data[0].json_build_object
    // sort accordign to shape 
    if (res.data[0].json_build_object.features[i].geometry.type === "Point") {
      points.push(res.data[0].json_build_object.features[i])
    } else if (res.data[0].json_build_object.features[i].geometry.type === "LineString" || res.data[0].json_build_object.features[i].geometry.type === "MultiLineString") {
      lines.push(res.data[0].json_build_object.features[i])
    } else {
      polygons.push(res.data[0].json_build_object.features[i])
    }
    facilityGeoPoints.value = points
    facilityGeoLines.value = lines
    facilityGeoPolygons.value = polygons

  }
  await getParcels()
   getGeodata(route.params.id, 'health_facility')
   getGeodata(route.params.id, 'education_facility')
   getGeodata(route.params.id, 'road')
   getGeodata(route.params.id, 'sewer')
   getGeodata(route.params.id, 'water_point')
   getGeodata(route.params.id, 'piped_water')
   getGeodata(route.params.id, 'other_facility')



  loadMap()
}

const nmap = ref()

 

const loadMap = () => {
  nmap.value = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    //  style: './style.json',
    center: [37.137343, 1.137451], // starting position
    zoom: 6,
  })







  nmap.value.on('load', () => {
    nmap.value.addSource('polygons', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(facilityGeoPolygons.value),
    });

    nmap.value.addSource('parcels', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(ParcelGeodata.value),
    
    });

    nmap.value.addLayer({
      id: 'Satellite',
      type: 'raster',
      source: {
        type: 'raster',
        tileSize: 256,
        url: 'mapbox://mapbox.satellite'
      },
      before: 'background'
    });

    // Load the boundary layer with red outline
    nmap.value.addLayer({
      'id': 'Boundary',
      "type": "line",
      'source': 'polygons',
      'paint': {
        'line-color': 'black',
        'line-width': 1,
        'line-dasharray'  :[3,4]
      }
    });

    nmap.value.addLayer({
      'id': 'Parcels',
      "type": "fill",
      'source': 'parcels',
      'paint': {
        'fill-color': [
          'case',
          ['==', ['get', 'landuse_id'], 0],
          '#8C675D',
          ['==', ['get', 'landuse_id'], 1],
          '#800080',
          ['==', ['get', 'landuse_id'], 2],
          '#F6C567',
          ['==', ['get', 'landuse_id'], 3],
          '#6FDC6E',
          ['==', ['get', 'landuse_id'], 4],
          '#FFFF00',
          ['==', ['get', 'landuse_id'], 5],
          '#FF1D1E',
          ['==', ['get', 'landuse_id'], 6],
          '#73B2FF',
          ['==', ['get', 'landuse_id'], 7],
          '#DCDCDC',
          ['==', ['get', 'landuse_id'], 8],
          '#FDFD96',
          ['==', ['get', 'landuse_id'], 9],
          '#FDFD96',
          'white'],
        'fill-opacity': 0.8,
        "fill-outline-color": "white"

      }
    });


    nmap.value.addLayer({
      'id': 'Labels',
      'type': 'symbol',
      'source': 'parcels',
      'layout': {
        'text-field': ['get', 'parcel_no'],
        'text-size': 14,
        'text-offset': [0, 1]
      },
      'paint': {
        'text-color': 'white'
      }
    });

    // Load facility data here
    for (let prop in facilityData.value) {
      //console.log(prop, facilityData.value[prop].features[0].geometry.type);
      facilityLayers.value.push(prop)
      filteredLayers.value.push(prop)
      nmap.value.addSource(prop, {
        type: 'geojson',
        data: facilityData.value[prop],
      });

      if (facilityData.value[prop].features[0].geometry.type == 'Point') {
        nmap.value.addLayer({
          'id': prop,
          "type": "circle",
          'source': prop,
          'paint': {
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-color': prop === 'health_facility' ? 'yellow' : prop === 'education_facility' ?
              'green' : prop === 'road' ? 'red' : prop === 'sewer' ? 'purple' : prop === 'water_point' ? 'blue'
                : prop === 'piped_water' ? 'blue' : 'gray','circle-stroke-color': 'white'
          }
        });

       



      } else if (facilityData.value[prop].features[0].geometry.type == 'LineString') {
        const layer = ({
          'id': prop,
          "type": "line",
          'source': prop,
          'paint': {
            'line-color': prop === 'piped_water' ? 'blue' : prop === 'sewer' ? 'purple' : 'red',
            'line-width': 2, // Adjust the thickness as desired
          }
        });

        // if (prop === 'sewer') {
        // //  layer.paint['line-dasharray'] = [0, 4, 3];

        //   // Add a dot in between the dashes
        //     const dashArray = layer.paint['line-dasharray'];
        //     const dotInBetween = dashArray.flatMap(dash => [dash, 1]); // 1 represents the dot
        // //    layer.paint['line-dasharray'] = dotInBetween;


        // }
        nmap.value.addLayer(layer);
      }
      else
      {
        nmap.value.addLayer({
          'id': prop,
          'type': 'fill',
          'source': prop,
          'layout': {},
          'paint': {
            'fill-color': 'gray',
            'fill-opacity': 0.5,
            'fill-outline-color': 'white'
          }
        });

      } 

      nmap.value.on('click', prop, (e) => {
      console.log("click props..........")
      // Copy coordinates array.
       const parcel_no = e.features[0].properties.name ?e.features[0].properties.name :e.features[0].properties.title
  
         const clickedLocation = e.lngLat;

     
      new mapboxgl.Popup({ offset: [0, 0] })
        .setLngLat(clickedLocation)
        .setHTML('<h1><u><strong>Details</strong></u><h1>' + '<h3><strong> Layer: </strong>'
          + prop + '</h3><p><strong> Name/Title:  </strong> '  + parcel_no + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap.value);
      });
    
    }


    ///=============

    // switch it off until the user selects to
    nmap.value.setLayoutProperty('Satellite', 'visibility', 'none')



    nmap.value.resize()
    var bounds = turf.bbox((filtergeo.value));
    nmap.value.fitBounds(bounds, { padding: 20 });


    // Change the cursor to a pointer when the mouse is over the places layer.
    nmap.value.on('mouseenter', 'points-layer', () => {
      nmap.value.getCanvas().style.cursor = 'pointer';
    });
    // Change it back to a pointer when it leaves.
    nmap.value.on('mouseleave', 'points-layer', () => {
      nmap.value.getCanvas().style.cursor = '';
    });


    nmap.value.on('click', 'Parcels', (e) => {
      console.log("click line..........")
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const parcel_no = e.features[0].properties.parcel_no;
      const landuse = e.features[0].properties.landuse_id;
      const area = e.features[0].properties.area_ha;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      console.log(coordinates[0][0])
      var centroid = turf.centroid(e.features[0])
      console.log(centroid.geometry.coordinates)
      while (Math.abs(e.lngLat.lng - coordinates[0][0]) > 180) {
        coordinates[0][0] += e.lngLat.lng > coordinates[0][0] ? 360 : -360;
      }
      new mapboxgl.Popup({ offset: [0, 0] })
        .setLngLat(centroid.geometry.coordinates)
        .setHTML('<h1><u><strong>Parcel Details</strong></u><h1>' + '<h3><strong> Parcel Number: </strong>' + parcel_no + '</h3><p><strong> Area:  </strong> ' + area.toFixed(4) + '(Ha.)' + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap.value);
    });

    console.log("resizing....")

    const nav = new mapboxgl.NavigationControl();
    nmap.value.addControl(nav, "top-right");

  })

}



//console.log('healthgeo',healthgeo)
getAll()

const downloadMap = () => {
  ElMessage({
    message: 'Downloading in GeoJson format.....',
    type: 'warning',
  })

  var collection = turf.featureCollection(ParcelGeodata.value)

  download(JSON.stringify(collection), "ParcelGeodata.json", "text/plain");




  console.log("Downlaod...s.")
}

const selectedLayers = ref(['Parcels', 'Boundary', 'Labels'], 'Satellite')
const layers = ['Parcels', 'Boundary', 'Labels', 'Satellite']



const switchLayer = () => {


  for (let i = 0; i < layers.length; i++) {
    let thisLayer = layers[i]
    console.log('Thislayer', thisLayer)

    if (selectedLayers.value.includes(thisLayer)) {
      nmap.value.setLayoutProperty(
        thisLayer,
        'visibility',
        'visible'
      );
    } else {
      nmap.value.setLayoutProperty(
        thisLayer,
        'visibility',
        'none'
      );

    }

  }


}


const legendItems = [
  {
    "label": "Residential",
    "color": "#8C675D"
  },
  {
    "label": "Industrial",
    "color": "#800080"
  },
  {
    "label": "Education",
    "color": "#F6C567"
  },
  {
    "label": "Recreation",
    "color": "#6FDC6E"
  },
  {
    "label": "Public Purpose",
    "color": "#FFFF00"
  },
  {
    "label": "Commercial",
    "color": "#FF1D1E"
  },
  {
    "label": "Public Utility",
    "color": "#73B2FF"
  },
  {
    "label": "Transportation",
    "color": "#DCDCDC"
  },
  {
    "label": "Undeveloped",
    "color": "#FDFD96"
  },
  {
    "label": "Agricultural",
    "color": "#FDFD96"
  }
]

const boundaryItems = [
  {
    "label": "Boundary",
    "color": "black"
  },
]

const lineItems = [
  {
    "label": "Road",
    "color": "#8C675D"
  },
  {
    "label": "Sewer",
    "color": "#800080"
  },
  {
    "label": "Piped Water",
    "color": "#F6C567"
  },
   
  
]
const isMobile = computed(() => appStore.getMobile)

const showContent = ref(true)

const state = reactive({
  isOnline: navigator.onLine
});


onMounted(() => {




  console.log('Mounted..... Checking status', state.isOnline)
  if (isMobile.value) {
    showContent.value = false;
  }
  window.addEventListener('online', () => {
    console.log('App is online')
    state.isOnline = true;
  });
  window.addEventListener('offline', () => {
    console.log('App is offline')
    state.isOnline = false;
  });

})

console.log(model)
const facilityLayers = ref([])
const filteredLayers = ref([])

const handleCheckboxChange = (option:String) => {

  for (let i = 0; i < facilityLayers.value.length; i++) {
    // console.log('opt', option[i])

    if (option.includes(facilityLayers.value[i])) {
      console.log('in', facilityLayers.value[i])

          nmap.value.setLayoutProperty(
            facilityLayers.value[i],
          'visibility',
          'visible'
       );
    }
    else {
      console.log('out', facilityLayers.value[i])
      nmap.value.setLayoutProperty(
            facilityLayers.value[i],
          'visibility',
          'none'
       );
    }

  }
     
    }


</script>
 
<template>
  <el-card class="box-card">
    <template #header>
      <div class="card-header">
        <span>{{ toTitleCase(title.replace('_', ' ')) + ' Settlement' }}</span>
        <div>
          <el-dropdown>
            <el-button type="primary">
              <Icon :size=24 icon='ion:layers' />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-checkbox-group :onChange="switchLayer" v-model="selectedLayers">
                  <el-checkbox-button v-for="layer in layers" :key="layer" :name="layer" :label="layer">{{
                    layer
                  }}</el-checkbox-button>
                </el-checkbox-group>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
           
          <el-tooltip content="Download Data" placement="top">
            <el-button type="primary" :onClick="downloadMap" style="  margin-left: 5px">
              <Icon :size=24 icon='ic:sharp-file-download' />
            </el-button>
          </el-tooltip>


        </div>

      </div>
    </template>


    <div class="map-container">

      <div id="mapContainer" class="basemap"></div>


    </div>
    <div id="floating-div">

 <el-collapse v-model="collapse">
        <el-collapse-item title="Key">
          <div class="legend">
                     
            <div >
              <div v-for="item in boundaryItems" :key="item.label" class="line-item">
              <div class="line-color"></div>
              <div class="legend-label">{{ item.label }}</div>
            </div>
            </div> 
            <!-- <div  v-if="facilityLayers.length>0">
              <div v-for="item in lineItems" :key="item.label" class="line-item">
              <div class="line-color" :style="{ backgroundColor: item.color }"></div>
              <div class="legend-label">{{ item.label }}</div>
            </div>
            </div> -->
          </div>
        </el-collapse-item>  

      <el-collapse-item title="Parcels" name="Parcels" v-if="showParcelLegend">
        <div >
             <div v-for="item in legendItems" :key="item.label" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
              <div class="legend-label">{{ item.label }}</div>
            </div>
            </div>
    </el-collapse-item>  


        <el-collapse-item title="Layers" name="checkboxes" v-if="showLayerLegend">
           
   <el-checkbox-group v-model="filteredLayers" @change="handleCheckboxChange"  class="checkbox-group-vertical">
      <el-checkbox v-for="item in facilityLayers" :label="item" :key="item">{{ item }}</el-checkbox>
    </el-checkbox-group>

       </el-collapse-item>
       
      </el-collapse>  


     
 

    </div>



  </el-card>
</template>  




<style>
.leaflet-demo-control {
  background: white;
  border: 1px solid rgb(193, 215, 233);
  border-radius: 0.2em;
  padding: 0.5em;
}
</style>

 
<style scoped>
.basemap {
  width: 100%;
  height: 500px;
}
</style>

<style>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 16px;
}

.item {
  margin-bottom: 18px;
}
</style>


<style scoped>
.demo-button-style {
  margin-top: 24px;
}
</style>
<style>
h1 {
  text-align: center;
}


.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.legend {
  padding: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.line-color {
  border-top: 3px dotted rgb(14, 1, 1);

  margin-right: 10px;
  width: 15px;

}

.line-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  border-style: dashed;
}



.legend-color {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.legend-label {
  font-size: 14px;
}

#floating-div {
  position: absolute;
  top: 120px;
  left: 50px;
  z-index: 10;
  background-color: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}


.checkbox-group-vertical {
  display: flex;
  flex-direction: column;
}
</style>