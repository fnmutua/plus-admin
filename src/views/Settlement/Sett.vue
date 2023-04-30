<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, ElLink, MessageParamsWithType, ElTabs, ElTabPane, ElDialog, ElInputNumber,
  ElInput, ElBadge, ElForm, ElDescriptions, ElDescriptionsItem, ElFormItem, ElUpload, ElCascader, FormRules, ElPopconfirm, ElTable, ElCol, ElRow,
  ElTableColumn, UploadUserFile, ElDropdown, ElDropdownMenu, ElDropdownItem, ElOptionGroup,ElStep,ElSteps
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Position, View, Plus, User, Download, Delete, Edit, Filter, InfoFilled, Location, ArrowDown, Setting, Loading } from '@element-plus/icons-vue'

import { ref, reactive, h, computed } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'
import { getFile } from '@/api/summary'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'

import xlsx from "json-as-xlsx"
import { getAllGeo } from '@/api/settlements'
import {
  searchByKeyWord
} from '@/api/settlements'

import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'

import filterDataByKeys from '@/utils/filterArrays'

import { getSummarybyField, getSummarybyFieldNested, getSummarybyFieldFromInclude, getSummarybyFieldSimple } from '@/api/summary'



import 'element-plus/theme-chalk/display.css'

////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import { Icon } from '@iconify/vue';


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'


import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";
import proj4 from 'proj4';





const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;






const searchString = ref()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


// Hide buttons if not admin 
const showAdminButtons = ref(false)
const showEditButtons = ref(false)

if (userInfo.roles.includes("admin")) {
  showAdminButtons.value = true
}

// Show Edit buttons 
if (userInfo.roles.includes("kisip_staff") || userInfo.roles.includes("sud_staff")|| userInfo.roles.includes("admin")
  || userInfo.roles.includes("county_admin") ||  userInfo.roles.includes("national_monitoring") ) {
    showEditButtons.value = true;
}

 

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
var value4 = ref([])
var value5 = ref([])

const morefileList = ref<UploadUserFile[]>([])


const interVentionTypeOptions = ref([])
const benefitTypeOptions = ref([])
const houseHoldOptions = ref([])
const interventionsOptions = ref([])




const settlementOptions = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const activeTab = ref('list')
const enableSubcounty =ref(false)

const total = ref(0)
const totalRejected = ref(0)
const totalApproved = ref(0)
const totalPending = ref(0)
const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)
const formheader = ref('Edit Settlement')


let tableDataList = ref<UserType[]>([])
let tableDataListNew = ref<UserType[]>([])
let tableDataListRejected = ref<UserType[]>([])

//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']



var filters = ['settlement_type']
var filterValues = [[1, 2]]  // make sure the inner array is array

var tblData = []

const associated_Model = ''
const associated_multiple_models = ['county', 'subcounty', 'users']
const nested_models = ['document', 'document_type'] // The mother, then followed by the child

const model = 'settlement'
//// ------------------parameters -----------------------////
const fileUploadList = ref<UploadUserFile[]>([])

const facilityGeo = ref([])
const facilityGeoPoints = ref()
const facilityGeoLines = ref([])
const facilityGeoPolygons = ref([])
const geoLoaded = ref(false)


const { t } = useI18n()


const handleClear = async () => {
  console.log('cleared....')
  enableSubcounty.value=false

  // clear all the fileters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  value4.value = ''
  value5.value = ''

  pSize.value = 5
  currentPage.value = 1
  tblData.value = []
  //----run the get data--------
  getAllBeneficiaries()
}




const currentRow = ref()
const addMoreDocuments = ref()
const addMoreDocs = (data: TableSlotDefault) => {

  currentRow.value = data

  addMoreDocuments.value = true

  console.log('currentRow', currentRow.value)

}

const submitMoreDocuments = async () => {
  console.log('More files.....', morefileList)

  // uploading the documents 
  const fileTypes = []
  const formData = new FormData()
  let files = []
  for (var i = 0; i < morefileList.value.length; i++) {
    console.log('------>file', morefileList.value[i])
    var format = morefileList.value[i].name.split('.').pop() // get file extension
    //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
    fileTypes.push(format)
    // formData.append('file', fileList.value[i])
    // formData.file = fileList.value[i]

    formData.append('model', model)

    formData.append('file', morefileList.value[i].raw)
    formData.append('format', morefileList.value[i].name.split('.').pop())
    formData.append('category', documentCategory.value)
    formData.append('field_id', 'settlement_id')

    formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
    formData.append('code', uuid.v4())
    formData.append('settlement_id', currentRow.value.id)


  }


  console.log(currentRow.value.id)
  await uploadFilesBatch(formData)

}


const onPageChange = async (selPage: any) => {
   page.value = selPage
  
  console.log(activeTab.value)
  if (activeTab.value === 'list') {
    var sfilters = ['settlement_type','isApproved']
    var sfilterValues = [[1, 2],['Approved']]  // make sure the inner array is array
  } else if (activeTab.value === 'New') {
    var sfilters = ['settlement_type','isApproved']
    var sfilterValues = [[1, 2],['Pending']]  // make sure the inner array is array
}
else if (activeTab.value === 'Rejected') {
    var sfilters = ['settlement_type','isApproved']
    var sfilterValues = [[1, 2],['Rejected']]  // make sure the inner array is array
}


  console.log(sfilters,sfilterValues)

  if (searchString.value) {
     getFilteredBySearchData(searchString.value)
    } else {
      getNewOrRejectedSettlements(activeTab.value)
    }





  //getFilteredData(sfilters, sfilterValues)
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  //getFilteredData(filters, filterValues)

  console.log(activeTab.value)
  if (activeTab.value === 'list') {
    var sfilters = ['settlement_type','isApproved']
    var sfilterValues = [[1, 2],['Approved']]  // make sure the inner array is array
  } else if (activeTab.value === 'New') {
    var sfilters = ['settlement_type','isApproved']
    var sfilterValues = [[1, 2], ['Pending']]  // make sure the inner array is array
     
}
else if (activeTab.value === 'Rejected') {
    var sfilters = ['settlement_type','isApproved']
    var sfilterValues = [[1, 2],['Rejected']]  // make sure the inner array is array
}


  console.log(sfilters,sfilterValues)

  if (searchString.value) {
     getFilteredBySearchData(searchString.value)
    } else {
      getNewOrRejectedSettlements(activeTab.value)
    }

  

}

const getAllBeneficiaries = async () => {
  getFilteredData(filters, filterValues)
}

const destructure = (obj) => {
  // console.log('deconstructing......')
  const simpleObj = {}
  for (let key in obj) {
    const value = obj[key]
    const type = typeof value
    if (['string', 'boolean'].includes(type) || (type === 'number' && !isNaN(value))) {
      simpleObj[key] = value
    } else if (type === 'object') {
      Object.assign(simpleObj, destructure(value))
    }
  }

  return simpleObj
}



const getSettlementCount = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryField = 'isApproved'
  formData.summaryFunction = 'count'
  formData.groupField = ['isApproved']
  formData.cache_key = ''

  const newSettCount = await getSummarybyField(formData)
  console.log('income_levels---->', newSettCount)

  let pending = await filterDataByKeys(newSettCount.Total, ['isApproved'], 'Pending');
  let approved = await filterDataByKeys(newSettCount.Total, ['isApproved'], 'Approved');
  let rejected = await filterDataByKeys(newSettCount.Total, ['isApproved'], 'Rejected');
  totalPending.value = parseInt( pending[0].count)
  totalApproved.value =parseInt(approved[0].count) 
  totalRejected.value = parseInt(rejected[0].count)

  console.log(totalPending.value)
  console.log(totalApproved.value)
  console.log(totalRejected.value)

}



const getNewOrRejectedSettlements = async (status) => {

  console.log('getNewOrRejectedSettlements....', status, page.value)

  if (status === 'New') {
    var filters = ['isApproved']
    var filterValues = [['Pending']]  // make sure the inner array is array
  
  } else  if (status === 'Rejected') {
    var filters = ['isApproved']
    var filterValues = [['Rejected']]  // make sure the inner array is array
 
   }

  else {
    var filters = ['isApproved']
    var filterValues = [['Approved']]  // make sure the inner array is array
 
 
  }




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
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

 

  if (status === 'New') {

    tableDataListNew.value = res.data

    console.log('New', res.data)
    total.value = totalPending.value

    console.log('total ---',total.value)


  } else  if(status === 'Rejected'){

    tableDataListRejected.value = res.data
    total.value=totalRejected.value

  } else {

    tableDataList.value = res.data
    total.value=totalApproved.value
  }



}


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
  formData.nested_models = nested_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry - associated_multiple_models', res)
  tableDataList.value = res.data
  total.value = res.total

  // filter
  //if (showAdminButtons.value) {
    getSettlementCount()  // This gets the approved/new/rejecetd counts
 
  //}

  // 

  tblData.value = [] // reset the table data
  console.log('TBL-b4-', tblData)
  let filteredIds = []
  res.data.forEach(function (arrayItem) {
    console.log(arrayItem)
    filteredIds.push(arrayItem.id)

    var dd = destructure(arrayItem)
    delete dd['0']
    delete dd['1']

    tblData.value.push(dd)
  })
  console.log('Now get the filtered Geo for --', filteredIds)

  formData.columnFilterField = 'id'
  formData.selectedParents = []
  formData.filtredGeoIds = filteredIds

  if (filteredIds.length > 0) {
    const fgeo = await getfilteredGeo(formData)

    console.log('the filtred GEO --', fgeo)


    if (fgeo.data[0].json_build_object) {
      var points = []
      var lines = []
      var polygons = []
      facilityGeo.value = fgeo.data[0].json_build_object
      console.log('Geo Returns---', fgeo.data[0].json_build_object.features)
      console.log("Facility Geo", facilityGeo)

      if (fgeo.data[0].json_build_object.features) {

        for (let i = 0; i < fgeo.data[0].json_build_object.features.length; i++) {
        console.log("Geo Type -------->", fgeo.data[0].json_build_object.features[i].geometry.type)

        if (fgeo.data[0].json_build_object.features[i].geometry.type === "Point") {

          points.push(fgeo.data[0].json_build_object.features[i])
        } else if (fgeo.data[0].json_build_object.features[i].geometry.type === "LineString" || fgeo.data[0].json_build_object.features[i].geometry.type === "MultiLineString") {

          lines.push(fgeo.data[0].json_build_object.features[i])

        } else {
          polygons.push(fgeo.data[0].json_build_object.features[i])

        }

      }

      console.log('Points ---x-------', points)

      facilityGeoPoints.value = points
      facilityGeoLines.value = lines
      facilityGeoPolygons.value = polygons

      console.log('Lines--->', facilityGeoPoints.value)


      //markerLatlon.value = res.data[0].json_build_object.features[0].geometry.coordinates
      geoLoaded.value = true
      }
   


    }

  }



  console.log('TBL-4f', tblData)
}



const getInterventionTypes = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'intervention_type',
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
      countyOpt.label = arrayItem.type + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      interVentionTypeOptions.value.push(countyOpt)
    })
  })
}

const getBeneficiaryType = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'benefit_type',
      searchField: 'type',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.type + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      benefitTypeOptions.value.push(opt)
    })
  })
}
const getHouseholds = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'households',
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
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.name + '| ' + arrayItem.gender + ' | ' + arrayItem.national_id
      //  console.log(countyOpt)
      houseHoldOptions.value.push(opt)
    })
  })
}

const getInterventions = async () => {
  const formData = {}

  formData.model = 'intervention'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------

  formData.associated_multiple_models = ['settlement']

  //-------------------------
  //console.log(formData)
  console.log('before Intervention Options')

  //const rxes = await getSettlementListByCounty(formData)
  //console.log('Inside Intervention Options', rxes)

  const res = await getSettlementListByCounty(formData).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.settlement_id = arrayItem.settlement.id

      opt.label = arrayItem.settlement.name + ' | ' + arrayItem.cluster.contract + ' | ' + arrayItem.id
      //  console.log(countyOpt)
      interventionsOptions.value.push(opt)
    })
  })
}




const getSettlementsOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'settlement',
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
      settlementOptions.value.push(countyOpt)
    })
  })
}



const viewHHs = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)
  push({
    path: '/settlement/hh/:id',
    name: 'Households',
    params: { id: data.row.id }
  })
}

const ShowReviewDialog = ref(false)
const RejectDialog = ref(false)
const settlement_raw = ref({})


const Review = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)
  ShowReviewDialog.value = true

  // make the descriptions dataset 
  settlement_raw.value.name = data.row.name
  settlement_raw.value.area = data.row.area
  settlement_raw.value.population = data.row.population
  settlement_raw.value.description = data.row.description
  settlement_raw.value.user = data.row.user.name + ' | ' + data.row.user.email
  settlement_raw.value.date = data.row.createdAt

  //
  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.county_id = data.row.county_id
  ruleForm.settlement_type = data.row.settlement_type
  ruleForm.population = data.row.population
  ruleForm.area = data.row.area
  ruleForm.description = data.row.description
  ruleForm.code = data.row.code
  ruleForm.geom = data.row.geom
  fileUploadList.value = data.row.documents


  formHeader.value = "Review Settlement"

}

const approve = async () => {
  console.log("Appprove")
  ruleForm.isApproved = 'Approved'
  ruleForm.reviewerId = userInfo.id

  console.log(ruleForm)
  ruleForm.model = 'settlement'
  console.log(ruleForm)
  await updateOneRecord(ruleForm).then(() => { })
  ShowReviewDialog.value = false
  getFilteredData(filters, filterValues)
}


const reject = async () => {
  RejectDialog.value = true
}

const rejectReason = ref('')
const confirmReject = async () => {
  console.log('Reject Msg', rejectReason.value)
  ruleForm.reject_msg = rejectReason.value
  ruleForm.isApproved = 'Rejected'

  console.log(ruleForm)
  ruleForm.model = 'settlement'
  ruleForm.reviewerId = userInfo.id
  console.log(ruleForm)
  await updateOneRecord(ruleForm).then(() => { })
  RejectDialog.value = false
  ShowReviewDialog.value = false

  getFilteredData(filters, filterValues)

}


const isMobile = computed(() => appStore.getMobile)

const reviewWindowWidth = ref('40%')

if (isMobile.value) {
  reviewWindowWidth.value = "100%"
}




const viewOnMap = (data: TableSlotDefault) => {
  console.log('On map.....', data.row)
  if (data.row.geom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.row.id }
    })
  } else {
    // var msg = 'This Settlement does not have the boundary defined in the database!'
    // open(msg)
    ElMessage({
      message: 'This Settlement does not have the boundary defined in the database!',
      type: 'warning',
    })
    //    ElMessage("No Shapes")
  }
}



const loadMap = () => {
  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [37.137343, 1.137451], // starting position
    zoom: 6,

  })

     // When the map fails to load, hide the base map and show only the overlays
     nmap.on('error', function (e) {
    console.log('List Failed.....', e)
    
    nmap.setStyle( './style.json');
          console.log("Failed to load base map. Showing only overlays.");
      });
  console.log("resizing....")

  const nav = new mapboxgl.NavigationControl();
  nmap.addControl(nav, "top-right");
  nmap.addControl(new MapboxLayerSwitcherControl());


  nmap.on('load', () => {
    nmap.addSource('lines', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(facilityGeoLines.value),
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });

    nmap.addSource('points', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(facilityGeoPoints.value),
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
        'line-width': 12,
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
    // Add a black outline around the polygon.
    // nmap.addLayer({
    //   'id': 'outline',
    //   'type': 'line',
    //   'source': 'polygons',
    //   'layout': {},
    //   'paint': {
    //     'line-color': '#000',
    //     'line-width': 1
    //   }
    // });

    nmap.resize()


    var bounds = turf.bbox((facilityGeo.value));
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


    // Change the cursor to a pointer when the mouse is over the places layer.
    nmap.on('mouseenter', 'lines-layer', () => {
      nmap.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    nmap.on('mouseleave', 'lines-layer', () => {
      nmap.getCanvas().style.cursor = '';
    });






  });


}


const showPagination = ref(true)
const clickTab = async (obj) => {
  page.value = 1

  console.log("Loading tabs.............", obj.props.label)
  if (obj.props.label == "Map") {
    loadMap()
    //console.log(map.value)
    //maxBounds.value = turf.bbox(facilityGeo.value);
    activeTab.value = 'Map'
    showPagination.value=false
  }

  if (obj.props.name == "New") { 
     activeTab.value='New'
    showPagination.value=true

    getNewOrRejectedSettlements('New')
  

  } 

  if (obj.props.name == "Rejected") { 
     showPagination.value = true
    activeTab.value='Rejected'
    getNewOrRejectedSettlements('Rejected')



  } 

  if (obj.props.name == "list") { 

     showPagination.value = true
    activeTab.value='list'

    getNewOrRejectedSettlements('list')
 



} 

}

 

const getFilteredBySearchData = async (searchString) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = searchString
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  //-------------------------
  console.log(formData)
  const res = await searchByKeyWord(formData)

  console.log('After -----x ------Querry', res)
  tableDataList.value = res.data
  total.value = res.total
  loading.value = false

  tblData.value = [] // reset the table data

}

const searchByName = async (filterString: any) => {
  searchString.value = filterString

  getFilteredBySearchData(searchString.value)
}


const programmeOptions = ref([])
const getProgrammeOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'programme',
      searchField: 'title',
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
      countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      programmeOptions.value.push(countyOpt)
    })
  })
}

const typeOptions = [
  {
    value: 1,
    label: 'Slum'
  },
  {
    value: 2,
    label: 'Informal Settlement'
  },
  {
    value: 3,
    label: 'Project Location'
  }
]
const countiesOptions = ref([])

const getCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
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

const subcountiesOptions = ref([])
const subcountyfilteredOptions = ref([])

const getSubCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'subcounty',
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
      var subcountyOpt = {}
      subcountyOpt.value = arrayItem.id
      subcountyOpt.county_id = arrayItem.county_id
      subcountyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      subcountiesOptions.value.push(subcountyOpt)
    })
  })
}

 
  const onClear = async () => {
    console.log('Selected value has been cleared.');
    enableSubcounty.value=false   // allow selection of subcounty 

    }



const filterByCounty = async (county_id: any) => {


  if (county_id) {
    enableSubcounty.value=true   // allow selection of subcounty 
  }
  var selectOption = 'county_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('intervention_type_id : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(county_id) && county_id.length > 0) {
    filterValues.splice(index, 0, county_id) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (county_id.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)
  console.log(subcountiesOptions.value)



  var subset = [];
  for (let i = 0; i < subcountiesOptions.value.length; i++) {
    if (subcountiesOptions.value[i].county_id == county_id) {
      subset.push(subcountiesOptions.value[i]);
    }
  }
  console.log('Subset--->', subset)
  subcountyfilteredOptions.value = subset


  getFilteredData(filters, filterValues)


}


const filterBySubCounty = async (subcounty_id: any) => {
  var selectOption = 'subcounty_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('intervention_type_id : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(subcounty_id) && subcounty_id.length > 0) {
    filterValues.splice(index, 0, subcounty_id) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (subcounty_id.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)
  console.log(subcountiesOptions.value)

  getFilteredData(filters, filterValues)


}

getBeneficiaryType()
getHouseholds()

getInterventionTypes()
getSettlementsOptions()
getAllBeneficiaries()
getInterventions()
getProgrammeOptions()
//getGeo()

getCountyNames()
getSubCountyNames()

console.log('Options---->', interVentionTypeOptions)





//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  county_id: '',
  settlement_type: '',
  population: '',
  area: '',
  description: null,
  geom: '',
  id: '',
  dist_trunk: null,
  dist_town: null,
  parcel_no:null,
  parcel_owner: null,
  rim_no:null,
  isApproved: 'Pending',
  code: ''
})






const documentCategory = ref()

const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      await updateOneRecord(ruleForm).then(() => { })


      const fileTypes = []
      const updateformData = new FormData()

      for (var i = 0; i < fileUploadList.value.length; i++) {
        console.log('------>file', fileUploadList.value[i])
        var format = fileUploadList.value[i].name.split('.').pop() // get file extension
        //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
        fileTypes.push(format)
        // formData.append('file', fileList.value[i])
        // formData.file = fileList.value[i]
        updateformData.append('file', fileUploadList.value[i].raw)
        updateformData.append('DocType', format)




        updateformData.append('file', fileUploadList.value[i].raw)
        updateformData.append('format', fileUploadList.value[i].name.split('.').pop())
        updateformData.append('category', documentCategory.value)
        updateformData.append('field_id', 'road_asset_id')
        updateformData.append('size', (fileUploadList.value[i].raw.size / 1024 / 1024).toFixed(2))
        updateformData.append('code', uuid.v4())
        updateformData.append('road_asset_id', currentRow.value.id)



      }


      updateformData.append('parent_code', ruleForm.id)
      updateformData.append('model', model)
      updateformData.append('grp', 'Settlement Documentation')
      updateformData.append('code', uuid.v4())
      updateformData.append('column', 'settlement_id')


      // formData.append('DocTypes', fileTypes)

      console.log(updateformData)
      await uploadDocuments(updateformData)



    } else {
      console.log('error in editiinh!', fields)
    }
  })
}

const handleClose = () => {

  console.log("Closing the dialoig")
  showAddSaveButton.value = true
  showEditSaveButton.value = false

  ruleForm.name = null
  ruleForm.county_id = null
  ruleForm.population = null
  ruleForm.area = null
  ruleForm.description = null



  formheader.value = 'Add Settlement'
  AddDialogVisible.value = false

}





const activeName = ref('list')
const AddSettlement = () => {
  push({
    path: '/settlement/add',
    name: 'AddSettlement'
  })
}

const AddDialogVisible = ref(false)
const formHeader = ref('Edit Settlement')

const editSettlement = (data: TableSlotDefault) => {

  showEditSaveButton.value = true

  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.county_id = data.row.county_id
  ruleForm.settlement_type = data.row.settlement_type
  ruleForm.population = data.row.population
  ruleForm.area = data.row.area
  ruleForm.description = data.row.description
  ruleForm.code = data.row.code
  ruleForm.dist_town = data.row.dist_town
  ruleForm.dist_trunk = data.row.dist_trunk
  ruleForm.parcel_no = data.row.parcel_no
  ruleForm.parcel_owner = data.row.parcel_owner
  ruleForm.rim_no = data.row.rim_no
 


  ruleForm.geom = data.row.geom


  fileUploadList.value = data.row.documents



  AddDialogVisible.value = true
}

const removeDocument = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model
  formData.filesToDelete = [data.name]
  deleteDocument(formData)
}


const DeleteSettlement = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model

  DeleteRecord(formData).then(response => {
    console.log(response)
    // remove the deleted object from array list 
    let index = tableDataList.value.indexOf(data);
    if (index !== -1) {
      tableDataList.value.splice(index, 1);
    }

  })
    .catch(error => {
      console.log(error)

    });

  console.log(tableDataList.value)

  // Delete docuemnts only if there's any docuemnt to delete 
  if (data.documents.length > 0) {
    formData.filesToDelete = data.documents

    deleteDocument(formData)

  }


}



const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Name", value: "name" }, // Top level data
    { label: "County", value: "county" }, // Custom format
    { label: "Population", value: "population" }, // Run functions
    { label: "Area(HA)", value: "area" }, // Run functions
    { label: "Description", value: "description" }, // Run functions
    { label: "Code", value: "code" }, // Run functions
    { label: "CountyID", value: "CountyID" }, // Run functions
    { label: "SubcountyID", value: "subcountyID" }, // Run functions

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
    thisRecord.name = tableDataList.value[i].name
    thisRecord.county = tableDataList.value[i].county.name
    thisRecord.population = tableDataList.value[i].population
    thisRecord.area = tableDataList.value[i].area
    thisRecord.description = tableDataList.value[i].description
    thisRecord.code = tableDataList.value[i].code
    thisRecord.CountyID = tableDataList.value[i].county_id
    thisRecord.SubcountyID = tableDataList.value[i].subcounty ? tableDataList.value[i].subcounty.id : null;


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



const downloadFile = async (data) => {

  console.log(data.name)

  const formData = {}
  formData.filename = data.name
  formData.responseType = 'blob'
  await getFile(formData)
    .then(response => {
      console.log(response)

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', data.name)
      document.body.appendChild(link)
      link.click()

    })
    .catch(error => {
      console.error('Error downloading file:', error);
    });

}

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

const DocTypes = ref([])
const getDocumentTypes = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'document_type',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Document Typest:', response)
    //tableDataList.value = response.data
    var ret = response.data


    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cur);
      return acc;
    }, {});

    console.log(nestedData.Map)
    for (let property in nestedData) {
      let opts = nestedData[property];
      var doc = {}
      doc.label = property
      doc.options = []

      opts.forEach(function (arrayItem) {
        let opt = {}
        opt.value = arrayItem.id
        opt.label = arrayItem.type
        doc.options.push(opt)

      })
      DocTypes.value.push(doc)

    }
    console.log(DocTypes)

  })
}
getDocumentTypes()




const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      console.log("Geo>", geojson.length)
      console.log("Geo1>", geojson[0])


      if (geojson.length != 1) {
        ElMessage.warning('Please uplaod a file with only one feature. This one has ' + geojson.length + ' features')

      }
      else {
        console.log('ok>>', geojson[0])
        let geom = {
          type: geojson[0].geometry.type,
          coordinates: geojson[0].geometry.coordinates
        }
        console.log(geom)
        ruleForm.geom = geom

        console.log(ruleForm)
      }


    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid shapefiles. Check your zipped file')


    })

  //uploadPolygon(feat)
}

const readJson = (event) => {
  console.log('Reading Josn file....', event)
  let str = event.target.result

 
    let json = JSON.parse(str)
    console.log('parsed', json.crs)

    const targetProj = "+proj=longlat +datum=WGS84 +no_defs"

    // const sourceProj = '+proj=utm +zone=37 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
    let sourceProj
    let epsgCode
    let crsProp 
        try {
            crsProp = json.crs.properties.name;
        }
        catch (error) {
          console.warn('Error extracting EPSG code:', error); // Log warning message
          ElMessage.warning('The uploaded file lacks Coordinate system definition. Assuming GCS WGS84')
          epsgCode = 4326
      }
        if (crsProp) {
            epsgCode = crsProp.match(/EPSG::(\d+)/)[1];
        }  



    console.log(epsgCode)

    if (epsgCode == 21037) {
      // zone 37S
      sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
    }
    else if (epsgCode == 21097) {
      // zone 37 N
      sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs";
    }
    else if (epsgCode == 21036) {
      // zone 36 S
      sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
    }
    else if (epsgCode == 21096) {
      // zone 36N
      sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
    }

    else {
      sourceProj = "+proj=longlat +datum=WGS84 +no_defs"

    }


    proj4.defs("SOURCE_CRS", sourceProj);
    proj4.defs("WGS84", targetProj);


    if (json.features.length != 1) {
      ElMessage.warning('Please uplaod a file with only one feature. This one has ' + json.features.length + ' features')

    }
    else {
      console.log('ok>>', json.features)

      const geometry = json.features[0].geometry;
            console.log(geometry)
              // Check if the geometry type is "Polygon" or "MultiPolygon"
              if (geometry.type === "Polygon") {
                // If it's a single polygon, project its coordinates
                geometry.coordinates[0] = geometry.coordinates[0].map(coordinate => {
                  return proj4("SOURCE_CRS", "WGS84", coordinate);
                });
              } else if (geometry.type === "MultiPolygon") {
                // If it's a multi-polygon, loop through all polygons and project their coordinates
                geometry.coordinates.forEach(polygon => {
                  polygon[0] = polygon[0].map(coordinate => {
                    return proj4("SOURCE_CRS", "WGS84", coordinate);
                  });
                });
              }

              console.log('geometry',geometry)
      let geom = {
        type: json.features[0].geometry.type,
        coordinates: geometry.coordinates
      }
     console.log(geom)
      ruleForm.geom = geom
    }

  }

const handleUploadGeo = async (uploadFile) => {
  console.log('Upload>>>', uploadFile)
  //  uploadRef.value!.submit()

  console.log("File type", uploadFile.name.split('.').pop())
  var fileType = uploadFile.name.split('.').pop()
  var rfile = uploadFile.raw

  let reader = new FileReader()
  console.log(reader)

  //var mydata = JSON.parse(uploadFile);

  if (fileType === 'geojson' || fileType === 'json') {
    reader.onload = readJson
    reader.readAsText(rfile)
  }
  else if (fileType === 'zip') {
    readShp(rfile)

    // reader.readAsArrayBuffer(rfile)
  } else {
    ElMessage.error('Only geojson or zipped shapefiles are supported at the moment')


  }


}

const tableRowClassName = (data) => {
  // console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}

const activeStep=ref(0)
const next = () => {
  if (activeStep.value++ > 2) activeStep.value = 0
}

</script>

<template>
  <ContentWrap :title="t('Settlements')" :message="t('Use the filters to subset')">


 
    <el-row>
      <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
        <div style="display: inline-block; margin-top: 5px;  margin-right: 5px">
          <el-select
size="default" v-model="value4" :onChange="filterByCounty" :onClear="handleClear" multiple clearable
            filterable collapse-tags placeholder="By County">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </el-col>
        <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
          <div style="display: inline-block; margin-top: 5px;  margin-right: 5px">
           <el-select
:disabled="!enableSubcounty" size="default" v-model="value5" :onChange="filterBySubCounty" :onClear="handleClear" multiple
            clearable filterable collapse-tags placeholder="By Subcounty">
            <el-option
v-for="item in subcountyfilteredOptions" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
        </div>

      </el-col>
      <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
        <div style="display: inline-block; margin-top: 5px">
          <el-select
size="default" v-model="value3" multiple clearable filterable remote :remote-method="searchByName"
            reserve-keyword placeholder="Search by Name" />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
        <div style="display: inline-block; margin-top: 5px">
          <div style="display: inline-block; margin-left: 5px">
            <el-button :onClick="handleClear" type="primary" :icon="Filter" />
          </div>

          <div style="display: inline-block; margin-left: 5px">
            <el-tooltip content="Add Settlement" placement="top">
              <el-button v-if="showEditButtons" :onClick="AddSettlement" type="primary" :icon="Plus" />
            </el-tooltip>
          </div>

          <div style="display: inline-block; margin-left: 5px">
            <el-tooltip content="Download" placement="top">
              <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
            </el-tooltip>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-tabs @tab-click="clickTab" v-model="activeName" type="border-card">
      <el-tab-pane name="list">
        <template #label>
          <span class="custom-tabs-label">
            <el-badge type="primary" :value="totalApproved" class="item">
              <el-button link>List</el-button>
            </el-badge>
          </span>
        </template>

        <el-table :data="tableDataList" style="width: 100%" border  :row-class-name="tableRowClassName">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <el-table :data="props.row.documents" border>
                  <el-table-column label="Name" prop="name" />
                  <el-table-column label="Type" prop="document_type.type" />
                  <el-table-column label="Size(mb)" prop="size" />
                  <el-table-column label="Actions">
                    <template #default="scope">
                      <el-dropdown v-if="isMobile">
                        <span class="el-dropdown-link">Actions</span>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="downloadFile(scope.row)">Download</el-dropdown-item>
                          <el-dropdown-item
v-if="showAdminButtons"
                            @click="removeDocument(scope.row)">Remove</el-dropdown-item>
                        </el-dropdown-menu>
                      </el-dropdown>
                      <div v-else>
                        <el-button type="success" @click="downloadFile(scope.row)">Download</el-button>
                        <el-button
type="danger" v-if="showAdminButtons"
                          @click="removeDocument(scope.row)">Remove</el-button>
                      </div>
                    </template>

                  </el-table-column>
                </el-table>
                <!-- <el-button @click="addMoreDocs(props.row)" type="info" round>Add Documents</el-button> -->
                <el-button
v-if="showEditButtons" type="success" :icon="Plus" circle @click="addMoreDocs(props.row)"
                  style="margin-left: 10px;margin-top: 5px" size="small" />

              </div>
            </template>
          </el-table-column>
          <el-table-column label="ID" prop="id" sortable />
          <el-table-column label="Name" width="200" prop="name" sortable />
          <el-table-column label="County" prop="county.name" sortable />
          <el-table-column label="Subcounty" prop="subcounty.name" sortable />
          <el-table-column label="Population" prop="population" sortable />
          <el-table-column label="Area(HA)" prop="area" sortable />
          <el-table-column label="Code" prop="code" sortable />


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showEditButtons" @click="editSettlement(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
@click="viewOnMap(scope as TableSlotDefault)"
                      :icon="Position">Map</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteSettlement(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>
 

              <div v-else>
                <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
                  <el-button
type="success" size="small" :icon="Edit" @click="editSettlement(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>
                <el-tooltip content="View on Map" placement="top">
                  <el-button
type="warning" size="small" :icon="Position" @click="viewOnMap(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="View Households" placement="top">
                  <el-button
v-show="showAdminButtons" type="success" size="small" :icon="User"
                    @click="viewHHs(scope as TableSlotDefault)" circle />
                </el-tooltip>
                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to delete this report?"
                    @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

              </div>
            </template>

          </el-table-column>

        </el-table>

      
      </el-tab-pane>

      <el-tab-pane name="New" v-if=showEditButtons>
        <template #label>
          <span class="custom-tabs-label">
            <el-badge type="success" :value="totalPending" class="item">
              <el-button link>New</el-button>
            </el-badge>
          </span>
        </template>

        <el-table :data="tableDataListNew" style="width: 100%" border :row-class-name="tableRowClassName">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <el-table :data="props.row.documents" border>
                  <el-table-column label="Name" prop="name" />
                  <el-table-column label="Type" prop="document_type.type" />
                  <el-table-column label="Size(mb)" prop="size" />
                  <el-table-column label="Actions">
                    <template #default="scope">
                      <el-dropdown v-if="isMobile">
                        <span class="el-dropdown-link">Actions</span>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="downloadFile(scope.row)">Download</el-dropdown-item>
                          <el-dropdown-item @click="removeDocument(scope.row)">Remove</el-dropdown-item>
                        </el-dropdown-menu>
                      </el-dropdown>
                      <div v-else>
                        <el-button type="success" @click="downloadFile(scope.row)">Download</el-button>
                        <el-button type="danger" @click="removeDocument(scope.row)">Remove</el-button>
                      </div>
                    </template>

                  </el-table-column>
                </el-table>
                <!-- <el-button @click="addMoreDocs(props.row)" type="info" round>Add Documents</el-button> -->
                <el-button
type="success" :icon="Plus" circle @click="addMoreDocs(props.row)"
                  style="margin-left: 10px;margin-top: 5px" size="small" />

              </div>
            </template>
          </el-table-column>
          <el-table-column label="ID" prop="id" sortable />
          <el-table-column label="Name" width="200" prop="name" sortable />
          <el-table-column label="County" prop="county.name" sortable />
          <el-table-column label="Subcounty" prop="subcounty.name" sortable />
          <el-table-column label="Population" prop="population" sortable />
          <el-table-column label="Area(HA)" prop="area" sortable />
          <el-table-column label="Code" prop="code" sortable />


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showEditButtons" @click="editSettlement(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
@click="viewOnMap(scope as TableSlotDefault)"
                      :icon="Position">Map</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteSettlement(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-else>
                <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
                  <el-button
type="success" size="small" :icon="Edit" @click="editSettlement(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>
                <el-tooltip content="View on Map" placement="top">
                  <el-button
type="warning" size="small" :icon="Position" @click="viewOnMap(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="Review" placement="top">
                  <el-button
v-show="showAdminButtons" type="success" size="small" :icon="View"
                    @click="Review(scope as TableSlotDefault)" circle />
                </el-tooltip>
                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to delete this settlement?"
                    @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

              </div>
            </template>

          </el-table-column>

        </el-table>

      
      </el-tab-pane>

      <el-tab-pane name="Rejected" v-if=showEditButtons :badge="5">
        <template #label>
          <span class="custom-tabs-label">
            <el-badge :value="totalRejected" class="item">
              <el-button link>Rejected</el-button>
            </el-badge>
          </span>
        </template>
        <el-table :data="tableDataListRejected" style="width: 100%" border :row-class-name="tableRowClassName">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <el-table :data="props.row.documents" border>
                  <el-table-column label="Name" prop="name" />
                  <el-table-column label="Type" prop="document_type.type" />
                  <el-table-column label="Size(mb)" prop="size" />
                  <el-table-column label="Actions">
                    <template #default="scope">
                      <el-dropdown v-if="isMobile">
                        <span class="el-dropdown-link">Actions</span>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="downloadFile(scope.row)">Download</el-dropdown-item>
                          <el-dropdown-item @click="removeDocument(scope.row)">Remove</el-dropdown-item>
                        </el-dropdown-menu>
                      </el-dropdown>
                      <div v-else>
                        <el-button type="success" @click="downloadFile(scope.row)">Download</el-button>
                        <el-button type="danger" @click="removeDocument(scope.row)">Remove</el-button>
                      </div>
                    </template>

                  </el-table-column>
                </el-table>
                <!-- <el-button @click="addMoreDocs(props.row)" type="info" round>Add Documents</el-button> -->
                <el-button
type="success" :icon="Plus" circle @click="addMoreDocs(props.row)"
                  style="margin-left: 10px;margin-top: 5px" size="small" />

              </div>
            </template>
          </el-table-column>
          <el-table-column label="ID" prop="id" sortable />
          <el-table-column label="Name" width="200" prop="name" sortable />
          <el-table-column label="County" prop="county.name" sortable />
          <el-table-column label="Subcounty" prop="subcounty.name" sortable />
          <el-table-column label="Population" prop="population" sortable />
          <el-table-column label="Area(HA)" prop="area" sortable />
          <el-table-column label="Code" prop="code" sortable />


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showEditButtons" @click="editSettlement(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
@click="viewOnMap(scope as TableSlotDefault)"
                      :icon="Position">Map</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteSettlement(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-else>

                <el-tooltip content="View on Map" placement="top">
                  <el-button
type="warning" size="small" :icon="Position" @click="viewOnMap(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="Review" placement="top">
                  <el-button
v-show="showAdminButtons" type="success" size="small" :icon="View"
                    @click="Review(scope as TableSlotDefault)" circle />
                </el-tooltip>
                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to delete this report?"
                    @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

              </div>
            </template>

          </el-table-column>

        </el-table>
 

      </el-tab-pane>



      <el-tab-pane label="Map" name="Map">
        <template #label>
          <span class="custom-tabs-label">
            <el-button link>Map</el-button>
          </span>
        </template>

        <div id="mapContainer" class="basemap"></div>
      </el-tab-pane>

      <ElPagination
v-if="showPagination"
layout="sizes, prev, pager, next, total" v-model:currentPage="page"
          v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="total" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </el-tabs>


    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-steps :active="activeStep" finish-button-center simple style="margin-bottom: 10px;">
    <el-step description="Basic Info"  :icon="Loading" />
    <el-step description="Details" :icon="Setting"  />
    <el-step description="Geometry" :icon="Position"  />
    
  </el-steps>
 
  


  <el-row :gutter="10">
    <el-col v-show="activeStep === 0" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
        <el-form-item label="County" prop="county_id">
          <el-select v-model="ruleForm.county_id" filterable placeholder="Select County">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Name">
          <el-input v-model="ruleForm.name" />
        </el-form-item>
        <el-form-item label="Type" prop="settlement_type">
          <el-select v-model="ruleForm.settlement_type" filterable placeholder="Select type">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Population">
          <el-input-number v-model="ruleForm.population" />
        </el-form-item>
        <el-form-item label="Area(ha)">
          <el-input-number v-model="ruleForm.area" />
        </el-form-item>
      </el-form>
    </el-col>

    <el-col v-show="activeStep === 1" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
               <el-form-item label="Dist. to Nearest Urban Center(Km.)" prop="dist_town" label-width="240px">
          <el-input-number v-model="ruleForm.dist_town" />
          </el-form-item>
        <el-form-item label="Dist.to Nearest Trunk Road(Km.)" prop="dist_trunk" label-width="240px">
            <el-input-number v-model="ruleForm.dist_trunk" />
        </el-form-item>


        <el-form-item label="Parcel Number" prop="parcel_no">
                    <el-input v-model="ruleForm.parcel_no" />
                  </el-form-item>

                  <el-form-item label="Parcel owner" prop="parcel_owner">
                    <el-input v-model="ruleForm.parcel_owner" />
                  </el-form-item>

                  
                  <el-form-item label="RIM Ref." prop="rim_no">
                    <el-input v-model="ruleForm.rim_no" />
                  </el-form-item>
        <el-form-item label="Description">
          <el-input maxlength="200" type="textarea" v-model="ruleForm.description" />
        </el-form-item>
      </el-form>

    </el-col>




    <el-col v-show="activeStep === 2" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
        <el-form-item label="Geometry">
          <el-upload :on-change="handleUploadGeo" multiple :limit="3" :auto-upload="false">
            <el-button type="primary">Click to upload</el-button>
            <template #tip>
              <div class="el-upload__tip">
                geojson or zipped shapefile
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </el-col>
  </el-row>
     <template #footer>
        <span class="dialog-footer space-between">
          <el-row :gutter="10">

            <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
              <el-button  @click="next">Next</el-button>

              <el-button @click="AddDialogVisible = false">Cancel</el-button>
              <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
            </el-col>
          </el-row>
        </span>
      </template>
    </el-dialog>

<!--     <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-row :gutter="10">

        <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="County" prop="county_id">
              <el-select v-model="ruleForm.county_id" filterable placeholder="Select County">
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Name">
              <el-input v-model="ruleForm.name" />
            </el-form-item>
            <el-form-item label="Type" prop="settlement_type">
              <el-select v-model="ruleForm.settlement_type" filterable placeholder="Select type">
                <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Population">
              <el-input-number v-model="ruleForm.population" />
            </el-form-item>
            <el-form-item label="Area(ha)">
              <el-input-number v-model="ruleForm.area" />
            </el-form-item>
            <el-form-item label="Description">
               <el-input maxlength="200"  type="textarea" v-model="ruleForm.description" />

            </el-form-item>
            <el-form-item label="Geometry"> <el-upload
:on-change="handleUploadGeo" multiple :limit="3"
                :auto-upload="false">
                <el-button type="primary">Click to upload</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    geojson or zipped shapefile
                  </div>
                </template>
              </el-upload></el-form-item>
          </el-form>
        </el-col>
      </el-row>
      <template #footer>
        <span class="dialog-footer space-between">
          <el-row :gutter="10">

            <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
              <el-button @click="AddDialogVisible = false">Cancel</el-button>
              <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
            </el-col>
          </el-row>
        </span>
      </template>
    </el-dialog>
 -->
    <el-dialog v-model="addMoreDocuments" title="Upload More Documents" width="30%">
      <el-select v-model="documentCategory" placeholder="Select Type" clearable filterable class="mb-4">
        <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>
      <el-upload
v-model:file-list="morefileList" class="upload-demo "
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple :limit="5" :auto-upload="false">
        <el-button type="primary">Click to upload</el-button>
        <template #tip>
          <div class="el-upload__tip">
            jpg/png files with a size less than 500KB.
          </div>
        </template>
      </el-upload>
      <el-button type="secondary" @click="submitMoreDocuments()">Submit</el-button>
    </el-dialog>


    <el-dialog v-model="ShowReviewDialog" @close="handleClose" :title="formHeader" :width="reviewWindowWidth" draggable>
      <el-descriptions title="" direction="vertical" :column="2" size="small" border>
        <el-descriptions-item label="Name">{{ settlement_raw.name }}</el-descriptions-item>
        <el-descriptions-item label="Area(Ha)" :span="2">{{ settlement_raw.area }}</el-descriptions-item>
        <el-descriptions-item label="Population">{{ settlement_raw.population }}</el-descriptions-item>
        <el-descriptions-item label="Description"> {{ settlement_raw.description }} </el-descriptions-item>
        <el-descriptions-item label="Submitted By"> {{ settlement_raw.user }} </el-descriptions-item>
        <el-descriptions-item label="Date"> {{ settlement_raw.date }} </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span v-if="showAdminButtons" class="dialog-footer">
          <el-button type="success" @click="approve">Approve</el-button>
          <el-button type="danger" @click="reject">Reject</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog v-model="RejectDialog" title="Reason for rejection" width="20%">
      <el-input v-model="rejectReason" placeholder="" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="RejectDialog = false">Cancel</el-button>
          <el-button type="primary" @click="confirmReject">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>

  </ContentWrap>
</template>
 



<style scoped>
.basemap {
  width: 100%;
  height: 400px;
}
</style>

<style>
.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>





<style>
.el-row {
  margin-bottom: 20px;
}

.el-row:last-child {
  margin-bottom: 0;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}
</style>

