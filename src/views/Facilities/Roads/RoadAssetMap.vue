<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'
import { ref } from 'vue'
import 'leaflet/dist/leaflet.css'
import { LMap, LGeoJson, LTileLayer, LMarker, LPopup, LControlLayers } from '@vue-leaflet/vue-leaflet'
import { featureGroup } from 'leaflet'
import { nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessag, ElCard } from 'element-plus'


import { MapboxMap, MapboxMarker, MapboxLayer, MapboxCluster } from '@studiometa/vue-mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const route = useRoute()

////Configurations //////////////
const model = 'road_asset'
//////////// 

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const filtergeo = ref([])
const map = ref()
const geo = ref()
const parcel_ref = ref()
const geoLoaded = ref(false)
const parcel_geo = ref([])
const mapCenter = ref([])
const facilityName = ref()
const { t } = useI18n()

import mapboxgl from "mapbox-gl";



const getAll = async () => {
  console.log('Get all facilities ')
  const id = route.params.id
  const settData = route.params.data
  console.log('Faciity ID, Data:', id, settData)

  const formData = {}
  formData.model = model
  formData.id = id

  console.log(formData)
  const res = await getOneGeo(formData)

  console.log('Facility Geo:', res.data[0].json_build_object.features)
  if (res.data[0].json_build_object.features) {
    filtergeo.value = res.data[0].json_build_object
    console.log(res.data[0].json_build_object.features[0].geometry.coordinates)
    var coords = res.data[0].json_build_object.features[0].geometry.coordinates

    var latLon = [coords[0], coords[1]]
    console.log(latLon)

    //coords.move(0, 1);   // rearrange to Lat,Lo

    // mapCenter.value = latLon
    facilityName.value = res.data[0].json_build_object.features[0].properties.name
    geoLoaded.value = true

    console.log("Map---->", map)
    // 0ms seems enough to execute resize after tab opens.
    var nmap = new mapboxgl.Map({
      container: "mapContainer",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [37.137343, 1.137451], // starting position
      zoom: 6,

    })


       // When the map fails to load, hide the base map and show only the overlays
   nmap.on('error', function (e) {
    console.log('Failed.....', e.error)
    nmap.setStyle( './style.json');
          console.log("Failed to load base map. Showing only overlays.");
      });

      
    const nav = new mapboxgl.NavigationControl();
    nmap.addControl(nav, "top-right");


    var pol = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "coordinates": [
              [
                [
                  36.12173989331012,
                  2.1141945486082108
                ],
                [
                  36.12173989331012,
                  1.3939869331683639
                ],
                [
                  37.55102761788126,
                  1.3939869331683639
                ],
                [
                  37.55102761788126,
                  2.1141945486082108
                ],
                [
                  36.12173989331012,
                  2.1141945486082108
                ]
              ]
            ],
            "type": "Polygon"
          }
        }
      ]
    }



    nmap.on('load', () => {
      nmap.addSource('kenya', {
        type: 'geojson',
        // Use a URL for the value for the `data` property.
        data: filtergeo.value,
        // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
      });

      nmap.addLayer({
        'id': 'earthquakes-layer',
        "type": "line",
        'source': 'kenya',
        'paint': {
          "line-color": "red"
        }
      });
    });

    const bounds = new mapboxgl.LngLatBounds(
      coords[0],
      coords[0]
    );

    // Extend the 'LngLatBounds' to include every coordinate in the bounds result.
    for (const coord of coords) {
      bounds.extend(coord);
    }

    nmap.fitBounds(bounds, {
      padding: 20
    });


  }




}

getAll()
//getParcelGeo()

console.log(model)
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'


mapboxgl.accessToken = MapBoxToken;






</script>

<template>
  <el-card class="box-card">
    <template #header>
      <div class="text-16px font-700">
        <span>{{ facilityName }}</span>
      </div>
    </template>
    <div id="mapContainer" class="basemap h-screen"></div>
  </el-card>
</template> 

 
<style scoped>
.basemap {
  width: 100%;
  height: 450px;
}
</style>