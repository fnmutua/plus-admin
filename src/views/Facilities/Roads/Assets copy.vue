<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'
import xlsx from "json-as-xlsx"

import {
  Position,
  TopRight,
  User,
  Plus,
  Download,
  Filter,
  MessageBox
} from '@element-plus/icons-vue'

import { ref, reactive, nextTick } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElTabPane, ElTabs, ElDivider, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'

import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'



import { featureGroup } from 'leaflet'

import { getAllGeo } from '@/api/settlements'

import { StarFilled } from '@element-plus/icons-vue'
//import { MapboxMap, MapboxNavigationControl, MapboxMarker, MapboxGeolocateControl, MapboxGeocoder } from '@studiometa/vue-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';



import { MapboxMap as MapboxMap } from 'vue-mapbox-ts'
import { MapboxMarker as MapboxMarker } from 'vue-mapbox-ts'
import { MapboxNavigationControl as MapboxNavigationControl } from 'vue-mapbox-ts'

import { MapboxGeolocateControl as MapboxGeolocateControl } from 'vue-mapbox-ts'


import {
  MapboxGeocoderControl,
  MapboxAttributionControl,
  MapboxDrawControl,
  MapboxPopup, MapboxGeogeometryRaw,
  MapboxGeogeometryPolygon,
  MapboxSourceGeoJson,
  MapboxScaleControl
} from 'vue-mapbox-ts'

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;




const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const map = ref()

console.log("userInfo--->", userInfo)

// Map 
const polygons = ref([]) as Ref<[number, number][][]>
const shp = []
const geoLoaded = ref(false)

const markerLatlon = ref([])
const markerProperties = ref([])

const markers = ref()

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const countiesOptions = ref([])
const settlementOptions = ref([])
const settlements = ref([])
const filteredSettlements = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)
const showAdminButtons = ref(false)





// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}


console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['road']
const model = 'road_asset'
const model_parent_key = 'road_id'
//// ------------------parameters -----------------------////





const mapHeight = '450px'
const countries = 'ke'
const facilityGeo = ref([])



//// ------------------Map -----------------------////



function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}




const { t } = useI18n()

const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },


  {
    field: 'asset_type',
    label: t('Type')
  },

  {
    field: 'asset_condition',
    label: t('Condition')
  },
  {
    field: 'road.name',
    label: t('Road')
  },
  {
    field: 'action',
    label: t('userDemo.action')
  }
]
const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}

const handleSelectParent = async (parent_id: any) => {
  var selectOption = model_parent_key
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('county : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(parent_id) && parent_id.length > 0) {
    filterValues.splice(index, 0, parent_id) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (parent_id.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)
  // here we filter the list of settlements based on the selected county
  filteredSettlements.value = settlements.value.filter(
    (settlement) => settlement.parent_id == parent_id
  )
  console.log('filyterested settlements------>', filteredSettlements)
  makeSettlementOptions(filteredSettlements)

  getFilteredData(filters, filterValues)
}

const handleSelectByName = async (settlement: any) => {
  var selectOption = 'id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('settlement : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(settlement) && settlement.length > 0) {
    filterValues.splice(index, 0, settlement) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (settlement.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}

const onPageChange = async (selPage: any) => {
  console.log('on change change: selected   ', selCounties)
  page.value = selPage
  getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  getFilteredData(filters, filterValues)
}

const getInterventionsAll = async () => {
  getFilteredData(filters, filterValues)
}

const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (key != 'geom') {

      if (typeof obj[key] !== 'object') {
        res[extraKey + key] = obj[key];
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}.`);
      };
    };
  }
  return res;
};


const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    //  console.log(countyOpt)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    var dd = flattenJSON(arrayItem)

    tblData.push(dd)
  })

  console.log('TBL-4f', tblData)
}

const getParentNames = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: associated_multiple_models[0],
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}

const getModelOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: model,
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false
    // pass result to the makeoptions

    settlements.value = ret
    makeSettlementOptions(settlements)
  })
}

const open = (msg: MessageParamsWithType) => {
  ElMessage.error(msg)
}

const makeSettlementOptions = (list) => {
  console.log('making the options..............', list)
  settlementOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
    //  console.log(countyOpt)
    settlementOptions.value.push(countyOpt)
  })
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
    nmap.addSource('hcf', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: facilityGeo.value,
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });


    nmap.addLayer({
      'id': 'pontLayer',
      "type": "circle",
      'source': 'hcf',
      'paint': {
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-color': 'red',
        'circle-stroke-color': 'white'
      }
    });

    nmap.resize()
    console.log(markerLatlon.value)
    const bounds = new mapboxgl.LngLatBounds(
      markerLatlon.value[0],
      markerLatlon.value[0]
    );


    for (const coord of markerLatlon.value) {

      bounds.extend(coord);
    }

    nmap.fitBounds(bounds, {
      padding: 20
    });


    nmap.on('click', 'pontLayer', (e) => {
      console.log("Onclikc..........")
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.asset_type;
      const reg_status = e.features[0].properties.asset_condition;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }



      new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>' + reg_status + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);


    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    nmap.on('mouseenter', 'pontLayer', () => {
      nmap.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    nmap.on('mouseleave', 'pontLayer', () => {
      nmap.getCanvas().style.cursor = '';
    });





  });


}


const onMap = async (obj) => {
  console.log(obj.props.label)
  if (obj.props.label == "Map") {
    loadMap()
    //console.log(map.value)
    //maxBounds.value = turf.bbox(facilityGeo.value);
  }

}

const getGeo = async () => {

  const formData = {}
  formData.model = model


  console.log(formData)
  const res = await getAllGeo(formData)



  if (res.data[0].json_build_object) {


    facilityGeo.value = res.data[0].json_build_object
    console.log('Geo Returns---', res.data[0].json_build_object.features[0].geometry.coordinates)
    console.log("Facility Geo", facilityGeo)



    //markerLatlon.value = res.data[0].json_build_object.features[0].geometry.coordinates
    geoLoaded.value = true


    for (let i in res.data[0].json_build_object.features) {

      console.log(res.data[0].json_build_object.features[i].geometry.coordinates)
      markerLatlon.value.push(res.data[0].json_build_object.features[i].geometry.coordinates)

      var markProp = {}
      markProp.name = res.data[0].json_build_object.features[i].properties.name
      markerProperties.value.push(markProp)


    }
    console.log(markerProperties)

  }



}


getParentNames()
getModelOptions()
getInterventionsAll()
getGeo()
console.log('Options---->', countiesOptions)




const viewOnMap = (data: TableSlotDefault) => {
  console.log('On map.....', data.row)
  if (data.row.geom) {
    push({
      path: '/facilities/roadasset/map/:id',
      name: 'RoadAssetMap',
      params: { id: data.row.id }
    })
  } else {
    var msg = 'This Facility  does not have the location defined in the database!'
    open(msg)
  }
}





const AddFacility = (data: TableSlotDefault) => {
  push({
    path: '/facilities/roadasset/add',
    name: 'AddRoadStructure'
  })
}

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



const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Type", value: "type" }, // Top level data
    { label: "Condition", value: "asset_condition" }, // Custom format
    { label: "Road", value: "road" }, // Run functions

  ]


  // Preprae the data object 
  var dataObj = {}
  dataObj.sheet = 'data'
  dataObj.columns = fields

  let dataHolder = []
  // loop through the table data and sort the data 
  // change here !
  for (let i = 0; i < tableDataList.value.length; i++) {
    let thisRecord = {}
    tableDataList.value[i]
    thisRecord.index = i + 1
    thisRecord.asset_condition = tableDataList.value[i].asset_condition
    thisRecord.road = tableDataList.value[i].road ? tableDataList.value[i].road.name : ''
    thisRecord.type = tableDataList.value[i].type






    dataHolder.push(thisRecord)
  }
  dataObj.content = dataHolder




  let settings = {
    fileName: model, // Name of the resulting spreadsheet
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  }

  // Enclose in array since the fucntion expects an array of sheets
  xlsx([dataObj], settings) //  download the excel file

}



</script>

<template>
  <ContentWrap :title="toTitleCase(model.replace('_', ' '))" :message="t('Use the filters on the list of view the Map ')">

    <el-tabs @tab-click="onMap" type="border-card">
      <el-tab-pane label="List">
        <el-divider border-style="dashed" content-position="left">Filters</el-divider>
        <div style="display: inline-block; margin-left: 20px">
          <el-select v-model="value2" :onChange="handleSelectParent" :onClear="handleClear" multiple clearable filterable
            collapse-tags placeholder="Filter by">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <div style="display: inline-block; margin-left: 20px">
          <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
        </div>
        <div style="display: inline-block; margin-left: 20px">
          <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </div>
        <div v-if="showAdminButtons" style="display: inline-block; margin-left: 20px">
          <el-tooltip content="Add Facility" placement="top">
            <el-button :onClick="AddFacility" type="primary" :icon="Plus" />
          </el-tooltip>
        </div>

        <el-divider border-style="dashed" content-position="left">Results</el-divider>

        <Table :columns="columns" :data="tableDataList" :loading="loading" :selection="true" :pageSize="pageSize"
          :currentPage="currentPage">
          <template #action="data">

            <el-dropdown v-if="isMobile">
              <span class="el-dropdown-link">
                <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
              </span>
              <template #dropdown>
                <el-dropdown-menu>

                  <el-dropdown-item @click="viewOnMap(data as TableSlotDefault)" :icon="Position"
                    color="red">Map</el-dropdown-item>

                </el-dropdown-menu>
              </template>
            </el-dropdown>


            <div v-else>



              <el-tooltip content="View on Map" placement="top">
                <el-button type="warning" :icon="Position" @click="viewOnMap(data as TableSlotDefault)" circle />
              </el-tooltip>
            </div>
          </template>
        </Table>
        <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
          v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="total" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
      </el-tab-pane>


      <el-tab-pane label="Map">
        <el-card class="box-card" />

        <div id="mapContainer" class="basemap"></div>

      </el-tab-pane>

    </el-tabs>


  </ContentWrap>
</template>
 
<style scoped>
.basemap {
  width: 100%;
  height: 450px;
}
</style>