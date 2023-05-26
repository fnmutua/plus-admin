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

import { ElMessage } from 'element-plus'
import * as download from 'downloadjs'

import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";

const route = useRoute()
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;


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


const ParcelGeodata = ref([])

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
      }




    })
  ParcelGeodata.value = parcelsPoly
  console.log('Parcels Acqured', ParcelGeodata.value)




}


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
    style: "mapbox://styles/mapbox/streets-v12",
    center: [37.137343, 1.137451], // starting position
    zoom: 6,

  })

     // When the map fails to load, hide the base map and show only the overlays
     nmap.on('error', function (e) {
    console.log('Failed.....', e.error)
    nmap.setStyle( './style.json');
          console.log("Failed to load base map. Showing only overlays.");
      });

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


    nmap.addSource('parcels', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(ParcelGeodata.value),
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


    nmap.addLayer({
      'id': 'Parcels',
      "type": "fill",
      'source': 'parcels',
      'paint': {
        'fill-color': [
          'case',
          ['==', ['get', 'landuse_id'], 0],
          'brown',
          ['==', ['get', 'landuse_id'], 1],
          'yellow',
          ['==', ['get', 'landuse_id'], 2],
          'orange',
          ['==', ['get', 'landuse_id'], 3],
          'green',
          ['==', ['get', 'landuse_id'], 4],
          'yellow',
          ['==', ['get', 'landuse_id'], 5],
          'red',
          ['==', ['get', 'landuse_id'], 6],
          'gray',
          ['==', ['get', 'landuse_id'], 7],
          'yellow',
          'white'],

        'fill-opacity': 0.5
      }
    });

    const layers: MapboxLayerDefinition[] = [
      {
        id: "Boundary",
        title: "Boundary",
        visibility: 'visible',
        type: 'base'
      },
      {
        id: "Parcels",
        title: "Parcels",
        visibility: 'visible',
        type: 'base'
      },

    ];

    nmap.addControl(new MapboxLayerSwitcherControl(layers));



    nmap.resize()

    var bounds = turf.bbox((filtergeo.value));
    nmap.fitBounds(bounds, { padding: 20 });








    nmap.on('click', 'Parcels', (e) => {
      console.log("click parcel..........", e)
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const parcel_no = e.features[0].properties.parcel_no;
      const landuse = e.features[0].properties.landuse_id;
      const area = e.features[0].properties.area_ha;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      console.log(coordinates[0][0], parcel_no)
      var centroid = turf.centroid(e.features[0])
      console.log(centroid.geometry.coordinates)
      while (Math.abs(e.lngLat.lng - coordinates[0][0]) > 180) {
        coordinates[0][0] += e.lngLat.lng > coordinates[0][0] ? 360 : -360;
      }
      new mapboxgl.Popup({ offset: [0, 0] })
        .setLngLat(centroid.geometry.coordinates)
        .setHTML('<h1><u><strong>Parcel Details</strong></u><h1>' + '<h3><strong> Parcel Number: </strong>' + parcel_no + '</h3><p><strong> Area:  </strong> ' + area.toFixed(4) + '(Ha.)' + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);
    });






  });


}

getAll()
getParcels()
const downloadMap = () => {
  ElMessage({
    message: 'Coming soon..',
    type: 'warning',
  })


  var collection = turf.featureCollection(filtergeo.value)

  download(JSON.stringify(collection), "project.json", "text/plain");

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