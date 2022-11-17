<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getfilteredGeo, getOneSettlement } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { Form } from '@/components/Form'
import { ref, h, reactive, onBeforeMount } from 'vue'
import { ElSwitch, ElPagination, ELCollapse } from 'element-plus'
import 'leaflet/dist/leaflet.css'
import { LMap, LGeoJson, LTileLayer, LControlLayers, LControlZoom } from '@vue-leaflet/vue-leaflet'
import { featureGroup } from 'leaflet'
import { nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { setup } from 'mockjs'
import { ElLoading } from 'element-plus'
const route = useRoute()

interface Params {
  pageIndex?: number
  pageSize?: number
}
const { register, elFormRef, methods } = useForm()

////Configurations //////////////
const model = 'parcel'
const assoc_model = 'settlement'
const filterCol = 'settlement_id'
const searchField = 'parcel_no'
////////////

const loading = ref(true)
const total = ref(0)

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const parentOptions = []
const selectedParents = []
const filtergeo = ref([])
const settlementgeo = ref([])
const settlementName = ref()
const ParcelDataLoaded = ref(false)
const SettDataLoaded = ref(false)

//const loading = ref(true)
const map = ref()
const geo = ref()
const sett = ref()
const settlement = ref()
const { t } = useI18n()

console.log('Settlement', route)
const xloading = ElLoading.service({
  lock: false,
  text: 'Loading',
  background: 'rgba(0, 0, 0, 0.7)',
})


function updateStyle() {
  console.log('Updating style....')

  if (geo.value.leafletObject) {


    const geojsonLayer = geo.value.leafletObject

    // console.log(geojsonLayer)
    if (!geojsonLayer) {
      return
    }

    let styleFunction

    styleFunction = (feature) => {
      // add feature here to access this prop
      // console.log(feature.properties.landuse_id)
      return {
        weight: 1,
        opacity: 0.45,
        borderWidth: 'thin',
        borderColor: 'white',
        color: getColor(feature.properties.landuse_id), // send it here
        fillOpacity: 0.5
      }
    }
    geo.value.leafletObject.setStyle(styleFunction)

  }
}


const getParcels = async () => {
  const id = route.params.id
  const formData = {}
  formData.model = model
  formData.columnFilterField = filterCol
  formData.selectedParents = id

  console.log(formData)
  await getfilteredGeo(formData)
    .then((response: { data: any }) => {
      filtergeo.value = response.data[0].json_build_object
      ParcelDataLoaded.value = true
      loading.value = false
      total.value = response.total
      //updateStyle()

      xloading.close()




      setTimeout(() => {
        // After building your geoJson layers, just add this:
        nextTick().then(() => {
          var group = new featureGroup()

          if (map.value.leafletObject) {
            map.value.leafletObject.eachLayer(function (layer) {
              //    console.log(layer.feature)
              if (layer.feature != undefined) {
                group.addLayer(layer)
              }
            })

            console.log(group.getBounds())
            map.value.leafletObject.fitBounds(group.getBounds(), { padding: [20, 20] })
            updateStyle()

          }
        })
      }, 100) // 0ms seems enough to execute resize after tab opens.



    })





}

const getSettlement = async (id) => {
  const formData = {}
  formData.model = 'settlement'
  formData.id = id

  console.log(formData)
  const res = await getOneSettlement(formData)

  settlement.value = res.data
  settlementName.value = res.data.name

  console.log('All settlements Querry', res.data)
}

const getSettlementBoundary = async (id) => {
  const formData = {}
  formData.model = 'settlement'
  formData.id = id
  formData.columnFilterField = 'id'
  formData.selectedParents = []
  console.log(formData)
  const res = await getfilteredGeo(formData)
  settlementgeo.value = res.data[0].json_build_object
  SettDataLoaded.value = true
}

function getColor(d) {
  // console.log(d)

  // recieve the prop
  if (d > 7) {
    // as many conditionals you need
    return 'green'
  }
  if (d === 0) {
    return 'brown'
  }
  if (d == 1) {
    return 'purple'
  }
  if (d == 2) {
    return 'orange'
  }
  if (d == 3) {
    return 'green'
  }
  if (d == 4) {
    return 'yellow'
  }
  if (d == 5) {
    return 'red'
  }

  if (d == 6) {
    return 'gray'
  }

  if (d == 7) {
    return 'yellow'
  }
}

const getParents = async (params?: Params) => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 5,
      curUser: 1, // Id for logged in user
      model: assoc_model,
      searchField: searchField,
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var cnty = response.data

    // loading.value = false

    cnty.forEach(function (arrayItem) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      parentOptions.push(countyOpt)
    })
  })
}


getSettlement(route.params.id)
getParents()
getParcels()
getSettlementBoundary(route.params.id)


</script>

<template>
  <ContentWrap :title="toTitleCase(settlementName + ' Settlement')"
    :message="t('The Map of ' + model + 's  by ' + assoc_model + '. Use the filter to subset')">
    <l-map ref="map" :zoom="16" :center="[-1.30853, 36.917257]" style="height: 66vh">
      <l-tile-layer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'"
        layer-type="base" min-zoom="1" max-zoom="21" useBounds="true" class="map" name="Satellite" />
      <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base" min-zoom="1"
        max-zoom="21" useBounds="true" class="map" name="OpenStreetMap" />

      <l-geo-json v-if="ParcelDataLoaded" ref="geo" layer-type="overlay" name="Parcels" :geojson="filtergeo"
        @ready="updateStyle" />
      <l-geo-json v-if="SettDataLoaded" ref="sett" layer-type="overlay" name="Settlement" :geojson="settlementgeo" />
      <l-control-layers position="topright" />
      <l-control class="leaflet-bottom leaflet-left leaflet-demo-control">
        <div class="key">KEY</div>
        <div class="residentail">Residential</div>

        <div style="
            background: orange;
            color: white;
            width: 90px;
            height: 20px;
            opacity: 0.5;

            text-align: center;
            border-radius: 0.26em;
          ">Educational</div>
        <div style="
            background: purple;
            color: white;
            width: 90px;
            height: 20px;
            text-align: center;
            opacity: 0.5;

            border-radius: 0.26em;
          ">Industrial</div>
        <div style="
            background: green;
            color: white;
            width: 90px;
            opacity: 0.5;

            height: 20px;
            text-align: center;
            border-radius: 0.26em;
          ">Recreational</div>

        <div style="
            background: red;
            color: white;
            width: 90px;
            height: 20px;
            text-align: center;
            opacity: 0.5;

            border-radius: 0.26em;
          ">Commerical</div>
        <div style="
            background: yellow;
            color: gray;
            width: 90px;
            height: 20px;
            opacity: 0.5;

            text-align: center;
            border-radius: 0.26em;
          ">Public Use</div>
        <div style="
            background: blue;
            color: white;
            width: 90px;
            height: 20px;
            opacity: 0.5;
            text-align: center;
            border-radius: 0.26em;
          ">Public utility</div>
        <div style="
            background: #ffffed;
            color: grey;
            opacity: 0.5;
            width: 90px;
            height: 20px;
            text-align: center;
            border-radius: 0.26em;
          ">Agriculture</div>
      </l-control>
    </l-map>
  </ContentWrap>
</template>

<style>
.leaflet-demo-control {
  background: white;
  border: 1px solid rgb(193, 215, 233);
  border-radius: 0.2em;
  padding: 0.5em;
}

.residentail {
  background: brown;
  color: white;
  width: 90px;
  opacity: 0.5;

  height: 20px;
  text-align: center;
  border-radius: 0.26em;
}

.key {
  text-align: center;
  font-weight: bold;
}
</style>
