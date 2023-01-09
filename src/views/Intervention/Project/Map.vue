<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'
import { ref } from 'vue'
import 'leaflet/dist/leaflet.css'

import { useRoute } from 'vue-router'


import { ElCard, ElButton, ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { Download } from '@element-plus/icons-vue'
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;


import { ElMessage } from 'element-plus'


const route = useRoute()

////Configurations //////////////
const model = 'project'
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




const getAll = async () => {
  console.log('Get all Settleemnts ')
  const id = route.params.id
  const settData = route.params.data
  console.log('Project ID, Data:', id, settData)

  const formData = {}
  formData.model = model
  formData.id = id

  console.log(formData)
  const res = await getOneGeo(formData)
  var points = []
  var lines = []
  var polygons = []


  console.log('Project Geo:', res.data[0].json_build_object.features)


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
  loadMap()
}


const loadMap = () => {
  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [37.137343, 1.137451], // starting position
    zoom: 6,

  })

  console.log("resizing....")

  const nav = new mapboxgl.NavigationControl();
  nmap.addControl(nav, "top-right");


  nmap.on('load', () => {

    nmap.addSource('points', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(facilityGeoPoints.value),
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });

    nmap.addSource('lines', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(facilityGeoLines.value),
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });

    nmap.addSource('polygons', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(facilityGeoPolygons.value),
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });


    nmap.addLayer({
      'id': 'points-layer',
      "type": "circle",
      'source': 'points',
      'paint': {
        "circle-color": 'green'
      }
    });

    nmap.addLayer({
      'id': 'lines',
      'type': 'line',
      'source': 'lines',
      'paint': {
        'line-width': 3,
        // Use a get expression (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-get)
        // to set the line-color to a feature property value.
        'line-color': 'red'
      }
    });

    nmap.addLayer({
      'id': 'polygons-layer',
      "type": "fill",
      'source': 'polygons',
      'paint': {
        'fill-color': '#0080ff', // blue color fill
        'fill-opacity': 0.2
      }
    });
    //Add a black outline around the polygon.
    nmap.addLayer({
      'id': 'outline',
      'type': 'line',
      'source': 'polygons',
      'layout': {},
      'paint': {
        'line-color': '#ffffb3',
        'line-width': 1
      }
    });
    nmap.resize()

    var bounds = turf.bbox((filtergeo.value));
    nmap.fitBounds(bounds, { padding: 20 });

    nmap.on('click', 'points-layer', (e) => {
      console.log("Onclikc..........")
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.asset_type;
      const condition = e.features[0].properties.asset_condition;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>' + condition + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);

    });
    // Change the cursor to a pointer when the mouse is over the places layer.
    nmap.on('mouseenter', 'points-layer', () => {
      nmap.getCanvas().style.cursor = 'pointer';
    });
    // Change it back to a pointer when it leaves.
    nmap.on('mouseleave', 'points-layer', () => {
      nmap.getCanvas().style.cursor = '';
    });


    nmap.on('click', 'lines-layer', (e) => {
      console.log("click line..........")
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.asset_type;
      const condition = e.features[0].properties.asset_condition;
      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>' + condition + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);
    });


    nmap.on('click', 'polygons-layer', (e) => {
      console.log("click line..........")
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.title;
      const condition = e.features[0].properties.programme;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>' + condition + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);
    });


    // Cange the cursor to a pointer when the mouse is over the places layer.
    nmap.on('mouseenter', 'lines-layer', () => {
      nmap.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    nmap.on('mouseleave', 'lines-layer', () => {
      nmap.getCanvas().style.cursor = '';
    });

  });


}

getAll()

const html2Pdf = ref('')
const downloadMap = () => {
  ElMessage({
    message: 'Coming soon..',
    type: 'warning',
  })

  console.log("Downlaod...s.")
}



console.log(model)
</script>
 
<template>


  <el-card class="box-card">
    <template #header>
      <div class="card-header">
        <span>{{ toTitleCase(projectTitle.replace('_', ' ')) }}</span>
        <el-button type="primary" :onClick="downloadMap" class="button">Download</el-button>

      </div>
    </template>



    <div id="mapContainer" class="basemap"></div>





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