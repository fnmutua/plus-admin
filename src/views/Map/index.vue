<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getfilteredGeo } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { Form } from '@/components/Form'

import { ref, h, reactive, onBeforeMount } from 'vue'
import { ElSwitch, ElPagination } from 'element-plus'
import 'leaflet/dist/leaflet.css'
import { LMap, LGeoJson, LTileLayer, LControlZoom } from '@vue-leaflet/vue-leaflet'
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
    console.log(selectedParents)
    const formData = {}
    formData.limit = 5
    formData.page = 1
    formData.curUser = 1 // Id for logged in user
    formData.model = model
    formData.searchField = searchField
    formData.searchKeyword = ''
    formData.columnFilterValue = selectIDs
    formData.columnFilterField = filterCol
    formData.assocModel = assoc_model
    console.log(formData)
    const res = await getSettlementListByCounty(formData)

    console.log('After Querry', res)
    tableDataList.value = res.data
    total.value = res.total
  }
}

const onPageChange = async (page) => {
  console.log('on change change: selected counties ', selectedParents)

  const formData = {}
  formData.limit = 5
  formData.page = page
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  formData.searchField = searchField
  formData.searchKeyword = ''
  formData.columnFilterValue = selectedParents
  formData.columnFilterField = filterCol
  formData.assocModel = assoc_model
  console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const onPageSizeChange = async (size) => {
  console.log('on change change: selected counties ', selectedParents)

  const formData = {}
  formData.limit = size
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  formData.searchField = searchField
  formData.searchKeyword = ''
  formData.columnFilterValue = selectedParents
  formData.columnFilterField = filterCol
  formData.assocModel = assoc_model
  console.log(formData)
  const res = await getSettlementListByCounty(formData)
  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const getAll = async () => {
  console.log('Get all Settleemnts ')
  let arr = []

  const formData = {}
  formData.model = model
  formData.columnFilterField = filterCol
  console.log(formData)
  const res = await getfilteredGeo(formData)

  console.log('All settlements Querry', res)
  filtergeo.value = res.data[0].json_build_object

  total.value = res.total
  console.log(filtergeo.value)
  console.log(map.value)
  console.log(map.value.leafletObject)
  console.log(marker.value)

  setTimeout(() => {
    //   this.$refs.resizeMap();
    //  map.value.leafletObject.invalidateSize()

    // After building your geoJson layers, just add this:
    nextTick().then(() => {
      var group = new featureGroup()

      map.value.leafletObject.eachLayer(function (layer) {
        console.log(layer)
        if (layer.feature != undefined) {
          group.addLayer(layer)
        }
      })

      console.log(group.getBounds())
      map.value.leafletObject.fitBounds(group.getBounds(), { padding: [20, 20] })
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

onBeforeMount(() => {
  console.log('Before Mount...')
})
</script>

<template>
  <ContentWrap
    :title="toTitleCase(model.replace('_', ' '))"
    :message="
      t('The list of ' + model + ' listed by ' + assoc_model + '. Use the filter to subset')
    "
  >
    <Form
      :schema="schema"
      label-position="side"
      hide-required-asterisk
      size="large"
      class="dark:(border-1 border-[var(--el-border-color)] border-solid)"
      @register="register"
    >
      <template #title>
        <h2 class="text-2xl font-bold text-center w-[100%]">{{ t('login.register') }}</h2>
      </template>

      <template #register> </template>
    </Form>
    <l-map ref="map" :zoom="16" :center="[-1.30853, 36.917257]" style="height: 60vh">
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
      <l-geo-json ref="geo" :geojson="filtergeo" />
      <l-marker ref="marker" :lat-lng="[-1.30853, 36.917257]">
        <l-icon :icon-size="[-1.30853, 36.917257]" icon-url="icon.png" />
        <l-popup ref="popup"> Popup content </l-popup>
      </l-marker>
    </l-map>
    <button @click="changeIcon">New kitten icon</button>
  </ContentWrap>
</template>
