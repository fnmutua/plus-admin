<script setup lang="ts">
import { Form, FormExpose } from '@/components/Form'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { reactive, unref, ref } from 'vue'
import {
  ElButton,
  ElSelect,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElCard,
  ElCol
} from 'element-plus'


import { getCountyGeoAll } from '@/api/counties'
import { getSumbyField } from '@/api/summary'

import 'leaflet/dist/leaflet.css'
import { LMap, LGeoJson, LTileLayer, LControlLayers } from '@vue-leaflet/vue-leaflet'
import { featureGroup } from 'leaflet'
import { nextTick } from 'vue'
import { count } from 'console'
 

import 'mapbox-gl/dist/mapbox-gl.css'
import 'v-mapbox/dist/v-mapbox.css';
 import VMap, { VLayerDeckGeojson } from "v-mapbox";

const filtergeo = ref([])
const map = ref()
const loaded = ref(false)
const geo = ref()
const parcel_ref = ref()
const countyGeo = ref()


//id","name","county_id","settlement_type","geom","area","population","code","description"


const state = reactive({
      map: {
        accessToken:
          "pk.eyJ1Ijoic29jaWFsZXhwbG9yZXIiLCJhIjoiREFQbXBISSJ9.dwFTwfSaWsHvktHrRtpydQ",
        style: "mapbox://styles/mapbox/streets-v11?optimize=true",
        // style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [40.817, 0.606],
        zoom: 5,
        crossSourceCollisions: false,
        failIfMajorPerformanceCaveat: false,
        attributionControl: false,
        preserveDrawingBuffer: true,
        hash: false,
        minPitch: 0,
        maxPitch: 60,
      },
    });


const getSettlementSumByCounty = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.sumField = 'county_id'
  const settPerCounty = await getSumbyField(formData)
  return settPerCounty.Total
}

const getCountyNames = async () => {
  const formData = {}
  formData.model = 'county'
  const res = await getCountyGeoAll(formData)
  console.log(res.data[0].json_build_object)
  if (res.data[0].json_build_object.features) {
    countyGeo.value = res.data[0].json_build_object

    // noe get the settleemnt summary SS
    const sumbyCounty = await getSettlementSumByCounty()
 

    // transfer the couts to the Geojson layer for display   
    countyGeo.value.features.forEach(function (feature) {
      const cnty = sumbyCounty.filter(object => {
        return object.county_id === feature.properties.id;
      });
      if (cnty.length > 0) {
        feature.properties.county = parseInt(cnty[0].count)
        //   console.log(cnty[0].count)
      }


    });





  // 0ms seems enough to execute resize after tab opens.
  }


}
getCountyNames()



const countries = 'ke'

const geoShp = {
'type': 'geojson',
'data': {
'type': 'Feature',
'geometry': {
'type': 'Polygon',
// These coordinates outline Maine.
'coordinates': [
[
[-67.13734, 45.13745],
[-66.96466, 44.8097],
[-68.03252, 44.3252],
[-69.06, 43.98],
[-70.11617, 43.68405],
[-70.64573, 43.09008],
[-70.75102, 43.08003],
[-70.79761, 43.21973],
[-70.98176, 43.36789],
[-70.94416, 43.46633],
[-71.08482, 45.30524],
[-70.66002, 45.46022],
[-70.30495, 45.91479],
[-70.00014, 46.69317],
[-69.23708, 47.44777],
[-68.90478, 47.18479],
[-68.2343, 47.35462],
[-67.79035, 47.06624],
[-67.79141, 45.70258],
[-67.13734, 45.13745]
]
]
}
}
}
const options = {
          pickable: true,
          stroked: false,
          filled: true,
          extruded: true,
          pointType: "circle",
          lineWidthScale: 20,
          lineWidthMinPixels: 2,
          getFillColor: [33, 160, 180, 200],
          getPointRadius: 100,
          getLineWidth: 1,
          getElevation: 200,
        } 

const title = 'Distribution of Informal Settlements'
const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'

const mapHeight = '450px'

 const mapStyle="mapbox://styles/agspatial/ckd30gjyt3h8l1io35ve1fso4"
 const  coordinates = [-111.549668, 39.014]
console.log(countyGeo)

const onMapLoaded = async (map) => {
  loaded.value=true
      const events = [
        "idle",
        "moveend",
        "touchend",
        "style.load",
        "sourcedata",
        "sourcedataloading",
      ];
      events.forEach((event) => {
        map.on(event, () => {
          if (event === "sourcedata" || event === "sourcedataloading") {
            const waiting = () => {
              if (!map.areTilesLoaded()) {
                state.ui.tilesLoaded = false;
                setTimeout(waiting, 200);
              } else {
                state.ui.tilesLoaded = true;
              }
            };
            waiting();
          }
          if (event === "style.load") {
            const waiting = () => {
              if (!map.isStyleLoaded()) {
                state.ui.styleChanged = false;
                setTimeout(waiting, 200);
              } else {
                state.ui.styleChanged = true;
              }
            };
            waiting();
          }
        });
      });
      state.ui.loaded = true;
    }

</script>

<template>
  <ContentWrap :title="title">

    <el-col :span="24">
      <el-card class="box-card">
 
        <main class="w-screen h-screen">
    <v-map :options="state.map" @loaded="onMapLoaded" class="h-full w-full">
      <template v-if="loaded">
        <v-layer-deck-geojson
          :data="countyGeo"
          :layer-id="'deck.gl-geojson-layer'"
          :options="options"
        />
  
      </template>
    </v-map>
  </main>
 

      </el-card>
    </el-col>
  </ContentWrap>
</template>

<style  >
@import "https://api.tiles.mapbox.com/mapbox-gl-js/v1.13.2/mapbox-gl.css";
@import "https://cdn.jsdelivr.net/npm/v-mapbox@latest/dist/v-mapbox.css";
html,
body {
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.w-screen {
  width: 100vw;
}
.h-screen {
  height: 67vh;
}
.h-full {
  height: 100%;
}
.w-full {
  width: 100%;
}
</style>