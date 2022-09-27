<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getfilteredGeo } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { Form } from '@/components/Form'

import { ref, h, reactive, onBeforeMount } from 'vue'
import { ElSwitch, ElPagination, ELCollapse } from 'element-plus'
import 'leaflet/dist/leaflet.css'
import { LMap, LGeoJson, LTileLayer, LControlLayers, LControlZoom } from '@vue-leaflet/vue-leaflet'
import { featureGroup } from 'leaflet'
import { nextTick } from 'vue'

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

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const parentOptions = []
const selectedParents = []
const filtergeo = ref([])
const map = ref()
const marker = ref()
const geo = ref()

const zoom = 6
const { t } = useI18n()

const handleClear = async () => {
  console.log('cleared....')
  getAll()
}
const handleSelect = async (selectIDs) => {
  console.log('on change  ', selectIDs)
  selectedParents.length = 0 // clear previously selected counties

  let arr = []
  if (selectIDs.length > 0) {
    // arr.push(county_id)   // applies for sinle select only
    //console.log('Array', arr)
    //selectedParents.push(county_id)
    selectedParents.push(...selectIDs)
    //  console.log(selectedParents)
    const formData = {}
    formData.model = model
    formData.columnFilterField = filterCol
    formData.selectedParents = selectedParents
    console.log(formData)
    const res = await getfilteredGeo(formData)
    filtergeo.value = res.data[0].json_build_object

    setTimeout(() => {
      nextTick().then(() => {
        var group = new featureGroup()

        map.value.leafletObject.eachLayer(function (layer) {
          //    console.log(layer.feature)
          if (layer.feature != undefined) {
            group.addLayer(layer)
          }
        })

        console.log(group.getBounds())
        map.value.leafletObject.fitBounds(group.getBounds(), { padding: [20, 20] })
        updateStyle()
      })
    }, 0) // 0ms seems enough to execute resize after tab opens.
  }
}

const getAll = async () => {
  console.log('Get all Settleemnts ')
  let arr = []

  const formData = {}
  formData.model = model
  formData.columnFilterField = filterCol
  formData.selectedParents = selectedParents

  console.log(formData)
  const res = await getfilteredGeo(formData)

  console.log('All settlements Querry', res)
  filtergeo.value = res.data[0].json_build_object
  total.value = res.total

  setTimeout(() => {
    //   this.$refs.resizeMap();
    //  map.value.leafletObject.invalidateSize()

    // After building your geoJson layers, just add this:
    nextTick().then(() => {
      var group = new featureGroup()

      map.value.leafletObject.eachLayer(function (layer) {
        //    console.log(layer.feature)
        if (layer.feature != undefined) {
          group.addLayer(layer)
        }
      })

      //  console.log(group.getBounds())
      map.value.leafletObject.fitBounds(group.getBounds(), { padding: [20, 20] })
      updateStyle()
    })
  }, 0) // 0ms seems enough to execute resize after tab opens.
}

const schema = reactive<FormSchema[]>([
  {
    field: filterCol,
    label: toTitleCase(assoc_model),
    component: 'Select',
    colProps: {
      span: 24
    },
    componentProps: {
      options: parentOptions,
      onChange: handleSelect,
      onClear: handleClear,
      filterable: 'true',
      multiple: 'true',

      style: {
        width: '25%'
      },
      slots: {
        suffix: true,
        prefix: true
      }
    }
  }
])

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

function updateStyle() {
  // console.log('Updating style....')
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
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
let tableDataList = ref<UserType[]>([])

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

    loading.value = false

    cnty.forEach(function (arrayItem) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      parentOptions.push(countyOpt)
    })
  })
}
getParents()
getAll()

console.log('pagination', parentOptions)
const acitonFn = (data: TableSlotDefault) => {
  console.log('Activating user.....', data.row)
  // data.mode = 'users'
}
</script>

<template>
  <ContentWrap
    :title="toTitleCase(model.replace('_', ' '))"
    :message="t('The Map of ' + model + 's  by ' + assoc_model + '. Use the filter to subset')"
  >
    <Form
      :schema="schema"
      label-position="side"
      hide-required-asterisk
      size="small"
      class="dark:(border-1 border-[var(--el-border-color)] border-solid)"
      @register="register"
    >
      <template #title>
        <h2 class="text-2xl font-bold text-center w-[100%]">{{ t('login.register') }}</h2>
      </template>

      <template #register> </template>
    </Form>
    <l-map ref="map" :zoom="16" :center="[-1.30853, 36.917257]" style="height: 66vh">
      <l-tile-layer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'"
        layer-type="base"
        min-zoom="1"
        max-zoom="21"
        useBounds="true"
        class="map"
        :max-bounds="maxBounds"
        name="Satellite"
      />
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        min-zoom="1"
        max-zoom="21"
        useBounds="true"
        class="map"
        :max-bounds="maxBounds"
        name="OpenStreetMap"
      />

      <l-geo-json
        ref="geo"
        layer-type="overlay"
        name="Parcels"
        :geojson="filtergeo"
        @ready="updateStyle"
      />
      <l-control-layers position="topright" />
      <l-control class="leaflet-bottom leaflet-left leaflet-demo-control">
        <div class="key">KEY</div>
        <div class="residentail">Residential</div>

        <div
          style="
            background: orange;
            color: white;
            width: 90px;
            height: 20px;
            opacity: 0.5;

            text-align: center;
            border-radius: 0.26em;
          "
          >Educational</div
        >
        <div
          style="
            background: purple;
            color: white;
            width: 90px;
            height: 20px;
            text-align: center;
            opacity: 0.5;

            border-radius: 0.26em;
          "
          >Industrial</div
        >
        <div
          style="
            background: green;
            color: white;
            width: 90px;
            opacity: 0.5;

            height: 20px;
            text-align: center;
            border-radius: 0.26em;
          "
          >Recreational</div
        >

        <div
          style="
            background: red;
            color: white;
            width: 90px;
            height: 20px;
            text-align: center;
            opacity: 0.5;

            border-radius: 0.26em;
          "
          >Commerical</div
        >
        <div
          style="
            background: yellow;
            color: gray;
            width: 90px;
            height: 20px;
            opacity: 0.5;

            text-align: center;
            border-radius: 0.26em;
          "
          >Public Use</div
        >
        <div
          style="
            background: blue;
            color: white;
            width: 90px;
            height: 20px;
            opacity: 0.5;
            text-align: center;
            border-radius: 0.26em;
          "
          >Public utility</div
        >
        <div
          style="
            background: #ffffed;
            color: grey;
            opacity: 0.5;
            width: 90px;
            height: 20px;
            text-align: center;
            border-radius: 0.26em;
          "
          >Agriculture</div
        >
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
