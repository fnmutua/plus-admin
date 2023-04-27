<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, uploadFilesBatch } from '@/api/settlements'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, } from '@/api/settlements'

import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType, UploadProps, ElOptionGroup, ElOption, ElBadge, ElDescriptions, ElDescriptionsItem, FormInstance } from 'element-plus'
import { ElMessage, ElCollapse, ElCollapseItem, ElInput, ElInputNumber, ElSwitch } from 'element-plus'
import { computed, onMounted } from 'vue'
import xlsx from "json-as-xlsx"
import { getFile } from '@/api/summary'

import {
  Position,
  TopRight,
  User,
  View,
  Plus,
  Edit,
  Delete,
  Download,
  Filter,
  MessageBox
} from '@element-plus/icons-vue'

import { ref, reactive, nextTick } from 'vue'
import {
  ElPagination, ElTooltip, ElTabPane, ElTabs, ElTable, ElTableColumn, ElDialog, ElUpload,
  ElPopconfirm, ElDivider, ElDropdown, ElDropdownItem, ElDropdownMenu, ElForm, ElFormItem, ElStep, ElSteps, ElRate
} from 'element-plus'

import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'



import { featureGroup } from 'leaflet'

import { getAllGeo } from '@/api/settlements'

import { StarFilled } from '@element-plus/icons-vue'
//import { MapboxMap, MapboxNavigationControl, MapboxMarker, MapboxGeolocateControl, MapboxGeocoder } from '@studiometa/vue-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';



import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import { uuid } from 'vue-uuid'

import FontawesomeMarker from "mapbox-gl-fontawesome-markers";


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { feature } from '@turf/turf'

import { Icon } from '@iconify/vue';
import * as Iconify from '@iconify/iconify';
import IconifyIcon from '@iconify/vue';

import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";

import "mapbox-layer-switcher/styles.css";

import { countyOptions, settlementOptionsV2, subcountyOptions, generalOwnership, pipeOptions, sewerTypes } from './../common/index.ts'





const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;

const morefileList = ref<UploadUserFile[]>([])



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
const pSize = ref(6)
const selCounties = []
const loading = ref(true)
const pageSize = ref(6)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)
const showAdminButtons = ref(false)
const showEditButtons = ref(false)




// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}

// Show Edit buttons 
if (userInfo.roles.includes("kisip_staff") || userInfo.roles.includes("sud_staff")|| userInfo.roles.includes("admin")
  || userInfo.roles.includes("county_admin") ||  userInfo.roles.includes("national_monitoring") ) {
    showEditButtons.value = true;
}
console.log("Show Buttons -->", showAdminButtons)



const tableDataList = ref([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = ['isApproved']
var filterValues = [['Approved']]  // make sure the inner array is array

var tblData = []
const associated_Model = ''
const associated_multiple_models = ['settlement', 'document', 'users']
const model = 'sewer'
const model_parent_key = 'settlement_id'
//// ------------------parameters -----------------------////





const mapHeight = '450px'
const countries = 'ke'
const facilityGeo = ref([])



//// ------------------Map -----------------------////



const subcountyfilteredOptions = ref([])
const settlementfilteredOptions = ref([])



const handleSelectCounty = async (county_id: any) => {
  console.log(county_id)

  var subset = [];
  for (let i = 0; i < subcountyOptions.value.length; i++) {
    if (subcountyOptions.value[i].county_id == county_id) {
      subset.push(subcountyOptions.value[i]);
    }
  }
  console.log(subset)
  subcountyfilteredOptions.value = subset

  // filter settleemnts 
  var subset_settlements = [];
  for (let i = 0; i < settlementOptionsV2.value.length; i++) {
    if (settlementOptionsV2.value[i].county_id == county_id) {
      subset_settlements.push(settlementOptionsV2.value[i]);
    }
  }
  console.log("Subset Setts", subset_settlements)
  settlementfilteredOptions.value = subset_settlements


  // Get the select subcoites GEO
}


function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}




const { t } = useI18n()


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

const handleSelectByName = async (name: any) => {
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

  if (!filterValues.includes(name) && name.length > 0) {
    filterValues.splice(index, 0, name) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (name.length === 0) {
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



const tableDataListNew = ref([])
const tableDataListRejected = ref([])
const totalRejected = ref(0)
const totalNew = ref(0)

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

  //------------------- ------
  //console.log(formData)

  // filter only the new ones
  // var filters = ['isApproved']
  // var filterValues = ['Appproved']  // make sure the inner array is array

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

  if (showAdminButtons.value) {
    // filter only the new ones
    var filters = ['isApproved']
    var filterValues = [['Pending']]  // make sure the inner array is array
    formData.filters = filters
    formData.filterValues = filterValues
    const newSettlements = await getSettlementListByCounty(formData)
    console.log('NeWHCF', newSettlements)
    tableDataListNew.value = newSettlements.data
    totalNew.value = newSettlements.total
    //

    var filters = ['isApproved']
    var filterValues = [['Rejected']]  // make sure the inner array is array
    formData.filters = filters
    formData.filterValues = filterValues
    const Rejected = await getSettlementListByCounty(formData)
    console.log('Rejecetd HCF', Rejected)
    tableDataListRejected.value = Rejected.data
    totalRejected.value = Rejected.total



    let filteredIds = []
    res.data.forEach(function (arrayItem) {
      console.log(arrayItem)
      filteredIds.push(arrayItem.id)

      var dd = destructure(arrayItem)
      delete dd['0']
      delete dd['1']

      tblData.value.push(dd)
    })

  }




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


const loadMap = (roadDetails) => {



  var centerPosition = [37.137343, 1.137451]
  var zoom = 6

  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: centerPosition, // starting position
    zoom: zoom,

  })



  console.log("resizing....")

  const nav = new mapboxgl.NavigationControl();
  nmap.addControl(nav, "top-right");
  nmap.on('load', () => {

    nmap.resize()

    nmap.addSource('roads', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: facilityGeo.value,
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });


    nmap.addLayer({
      'id': 'roads-layer',
      "type": "line",
      'source': 'roads',
      'paint': {
        'line-color': [
          'case',
          ['==', ['get', 'ownership_type'], 'private'],
          'red',
          ['==', ['get', 'ownership_type'], 'public'],
          'green',
          ['==', ['get', 'ownership_type'], 'FBO'],
          'blue',
          ['==', ['get', 'ownership_type'], 'NGO'],
          '#ff7f00', 'gray'],
      }
    });




    nmap.addLayer({
      id: 'Satellite',
      source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
      type: "raster"
    }, 'roads-layer');

    nmap.addLayer({
      id: 'Streets',
      source: { "type": "raster", "url": "mapbox://mapbox.streets", "tileSize": 256 },
      type: "raster"
    }, 'Satellite');

    // switch it off until the user selects to
    nmap.setLayoutProperty('Satellite', 'visibility', 'none')


    const layers: MapboxLayerDefinition[] = [
      {
        id: "Satellite",
        title: "Satellite",
        visibility: 'none',
        type: 'base'
      },

      {
        id: "Streets",
        title: "Streets",
        visibility: 'none',
        type: 'base'
      },

    ];
    nmap.addControl(new MapboxLayerSwitcherControl(layers));
    // Zoom to layers if not by clik on a list
    if (roadDetails.length === 0) {
      // Get the bounds of the line layer
      const bounds = turf.bbox(facilityGeo.value);
      // Fit the map to the bounds
      nmap.fitBounds(bounds, { padding: 20 });
    }


    else {
      console.log('Geo', roadDetails[0])
      const bounds = turf.bbox(roadDetails[0]);
      console.log('bounds', bounds)

      nmap.fitBounds(bounds, { padding: 20 });

      const description = roadDetails[1]
      //  const coordinates = [roadDetails[0].geometry.coordinates[0][1]]
      new mapboxgl.Popup({ offset: [0, -15] })
        .setHTML('<h3>' + description + '</h3>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);
    }

    // Listen for click events on the line layer
    nmap.on('click', 'roads-layer', function (e) {
      // Get the coordinates of the clicked point
      var coordinates = e.lngLat;
      const description = e.features[0].properties.name;
      const type = e.features[0].properties.ownership_type;
      // Create a popup with the desired content
      var popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>' + type + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);
    });



  });


}


const onMap = async (obj) => {
  console.log(obj.props.label)
  if (obj.props.label == "Map") {
    loadMap([])
    //console.log(map.value)
    //maxBounds.value = turf.bbox(facilityGeo.value);
  }

}



console.log('Options---->', countiesOptions)
const viewProfile = (data: TableSlotDefault) => {
  console.log('On Click.....', data.id)
  push({
    path: '/facilities/sewer/details/:id',
    name: 'SewerFacilityDetails',
    params: { data: data.id, id: data.id }
  })

}

const activeTab = ref('list')

const flyTo = (data: TableSlotDefault) => {
  console.log('On Click.....', data.geom.coordinates)
  activeTab.value = 'map'
  loadMap([data.geom, data.name])

}





const AddFacility = (data: TableSlotDefault) => {
  push({
    path: '/facilities/sewer/add',
    name: 'AddSewer'
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
    { label: "Name", value: "name" }, // Top level data
    { label: "Level", value: "level" }, // Custom format
    { label: "Type", value: "type" }, // Custom format
    { label: "Status", value: "reg_status" }, // Custom format
    { label: "Settlement", value: "settlement" }, // Run functions
    { label: "Owner", value: "owner" }, // Run functions
    { label: "Number of Beds", value: "number_beds" }, // Run functions


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
    thisRecord.settlement = tableDataList.value[i].settlement ? tableDataList.value[i].settlement.name : ''
    thisRecord.owner = tableDataList.value[i].owner
    thisRecord.number_beds = tableDataList.value[i].number_beds
    thisRecord.reg_status = tableDataList.value[i].reg_status
    thisRecord.owner = tableDataList.value[i].owner
    thisRecord.type = tableDataList.value[i].ownership_type
    thisRecord.level = tableDataList.value[i].level





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


const documentCategory = ref()


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

const removeDocument = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model
  formData.filesToDelete = [data.name]
  deleteDocument(formData)
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


  const proceed = beforeUpload(morefileList.value)

  if (morefileList.value.length == 0) {
    ElMessage.error('Select atleast one!')
  }


  if (proceed) {


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
      formData.append('field_id', 'sewer_id')

      formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
      formData.append('code', uuid.v4())
      formData.append('sewer_id', currentRow.value.id)

    }

    console.log(currentRow.value.id)
    await uploadFilesBatch(formData)

  }




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


//const beforeUpload = async (file) => {
const beforeUpload: UploadProps['beforeUpload'] = (files) => {


  for (var i = 0; i < files.length; i++) {


    var isPng = false;
    var isJPG = false;
    var isXls = false;
    var isXlsx = false;
    var isPdf = false;
    var isDoc = false;
    var isZip = false;
    var isDocx = false;
    if (documentCategory.value === 21) {   // Photos
      console.log('Photos', documentCategory.value, files[i].raw.type)
      isPng = files[i].raw.type === 'image/png'
      isJPG = files[i].raw.type === 'image/jpeg'

      if (!isPng && !isJPG) {
        //this.$message.error('Upload only Excel files')
        ElMessage.error('Use png/jpg  formats for photos')

      }

    }
    else {

      isXls = files[i].raw.type === 'application/vnd.ms-excel'
      isXlsx = files[i].raw.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      isPdf = files[i].raw.type === 'application/pdf'
      isZip = files[i].raw.type === 'application/zip'
      isZip = files[i].raw.type === 'application/x-zip-compressed'
      isDoc = files[i].raw.type === 'application/msword'
      isDocx = files[i].raw.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

      if (!isXls && !isXlsx && !isPdf && !isZip && !isDoc && !isDocx) {
        //this.$message.error('Upload only Excel files')
        ElMessage.error('Upload only pdf/xls/xlsx/zip/doc/docx files')

      }

    }


    const isLt5M = files[i].raw.size / 1024 / 1024 < 20


    if (!isLt5M) {
      // this.$message.error('File size should not exceed 5MB')
      ElMessage.error('File size should not exceed 20MB')
    }
    return (isXls || isXlsx || isPdf || isZip || isDoc || isDocx || isPng || isJPG) && isLt5M
  }
}


const legendItems = [
  {
    color: 'red',
    label: 'Private'
  },
  {
    color: 'blue',
    label: 'Public'
  },
  {
    color: 'green',
    label: 'Faith-based Org.'
  },
  {
    color: '#ff7f00',
    label: 'NGO'
  },
  {
    color: 'gray',
    label: 'Other'
  }

]



const DeleteProject = (data: TableSlotDefault) => {
  console.log('----->', data)
  let index = tableDataList.value.indexOf(data);

  console.log('index', index)
  // remove the deleted object from array list 
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }


  let formData = {}
  formData.id = data.id
  formData.model = model

  DeleteRecord(formData)

  console.log(tableDataList.value)


  // Delete docuemnts only if there's any docuemnt to delete 
  if (data.documents.length > 0) {
    formData.filesToDelete = data.documents
    deleteDocument(formData)

  }


}

const formheader = ref('Edit Facility')

//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: '',
  name: '',
  provider: '',
  provider_category: '',
  length: 0,
  type: '',
  pipe_type: '',
  pipe_size: null,
  number_connections: 0,
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  geom: '',
})


const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)

const AddDialogVisible = ref(false)
const editFacility = (data: TableSlotDefault) => {
  handleSelectCounty(data.county_id)

  showEditSaveButton.value = true
  console.log(data)
  currentRow.value = data.id
  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.type = data.type

  ruleForm.provider_category = data.provider_category
  ruleForm.provider = data.provider
  ruleForm.number_connections = data.number_connections
  ruleForm.settlement_id = data.settlement_id
  ruleForm.county_id = data.county_id
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.pipe_type = data.pipe_type
  ruleForm.pipe_size = data.pipe_size




  ruleForm.geom = data.geom



  morefileList.value = data.documents
  AddDialogVisible.value = true
}


const handleClose = () => {
  console.log("Closing the dialoig")
  showAddSaveButton.value = true
  showEditSaveButton.value = false
  for (let prop in ruleForm) {
    ruleForm[prop] = null;
  }


  formheader.value = 'Edit Facility'
  AddDialogVisible.value = false

}

console.log('------> countyOptions', countyOptions)


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  ruleForm.model = model
  await updateOneRecord(ruleForm).then(() => { })


}
const active = ref(0)

const next = () => {
  if (active.value++ > 3) active.value = 0
}


const ShowReviewDialog = ref(false)
const RejectDialog = ref(false)
const health_facility_raw = ref({})


const Review = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)
  ShowReviewDialog.value = true

  // make the descriptions dataset 
  health_facility_raw.value.name = data.row.name
  health_facility_raw.value.reg_status = data.row.reg_status
  health_facility_raw.value.ownership_type = data.row.ownership_type
  health_facility_raw.value.owner = data.row.owner
  health_facility_raw.value.user = data.row.user.name + ' | ' + data.row.user.email
  health_facility_raw.value.date = data.row.createdAt

  //

  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.county_id = data.row.county_id
  ruleForm.settlement_id = data.row.settlement_id
  ruleForm.subcounty_id = data.row.subcounty_id
  ruleForm.facility_type = data.row.facility_type
  ruleForm.reg_status = data.row.reg_status
  ruleForm.level = data.row.level
  ruleForm.ownership_type = data.row.ownership_type
  ruleForm.number_beds = data.row.number_beds
  ruleForm.geom = data.row.geom


  formHeader.value = "Review"

}

const approve = async () => {
  console.log("Appprove")
  ruleForm.isApproved = 'Approved'
  ruleForm.reviewerId = userInfo.id

  console.log(ruleForm)
  ruleForm.model = model
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
  ruleForm.model = model
  ruleForm.reviewerId = userInfo.id
  console.log(ruleForm)
  await updateOneRecord(ruleForm).then(() => { })
  RejectDialog.value = false
  ShowReviewDialog.value = false

  getFilteredData(filters, filterValues)

}

const tableRowClassName = (data) => {
  // console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}


</script>

<template>
  <ContentWrap :title="toTitleCase(model.replace('_', ' '))" :message="t('Use the filters on the list of view the Map ')">


    <div style="display: inline-block; margin-bottom: 15px">

    <div style="display: inline-block;">
          <el-select
v-model="value2" :onChange="handleSelectParent" :onClear="handleClear" multiple clearable filterable
            collapse-tags placeholder="Filter by Settlement">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div style="display: inline-block; margin-left: 20px">
          <el-select
v-model="value3" :onChange="handleSelectByName" :onClear="handleClear" multiple clearable filterable
            collapse-tags placeholder="Filter by  Name">
            <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div style="display: inline-block; margin-left: 20px">
          <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
        </div>
        <div style="display: inline-block; margin-left: 20px">
          <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </div>
        <div v-if="showEditButtons" style="display: inline-block; margin-left: 20px">
          <el-tooltip content="Add Facility" placement="top">
            <el-button :onClick="AddFacility" type="primary" :icon="Plus" />
          </el-tooltip>
        </div>
      </div>


    <el-tabs v-model="activeTab" @tab-click="onMap" type="border-card">
      <el-tab-pane name="list">
        <template #label>
          <span class="custom-tabs-label">
            <el-badge type="primary" :value="total" class="item">
              <el-button link>List</el-button>
            </el-badge>
          </span>
        </template>






        <el-table :data="tableDataList" style="width: 100%; margin-top: 10px;" border :row-class-name="tableRowClassName">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <el-table :data="props.row.documents" border>
                  <el-table-column label="Name" prop="name" />
                  <el-table-column label="Type" prop="document_type.type" />
                  <el-table-column label="Size(mb)" prop="size" />
                  <el-table-column label="Actions">
                    <!-- <template #default="scope"> -->
                    <template #default="scope">

                      <el-dropdown v-if="isMobile">
                        <span class="el-dropdown-link">
                          <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                        </span>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="downloadFile(scope.row)" :icon="Download" color="green" />
                          <el-dropdown-item
v-if=showAdminButtons @click="removeDocument(scope.row)" :icon="Delete"
                            color="red" />
                        </el-dropdown-menu>
                      </el-dropdown>
                      <div v-else>
                        <el-button
v-if=showEditButtons type="success" @click="downloadFile(scope.row)"
                          :icon="Download" />
                        <el-button v-if=showAdminButtons type="danger" @click="removeDocument(scope.row)" :icon="Delete" />
                      </div>
                    </template>

                  </el-table-column>
                </el-table>
                <!-- <el-button @click="addMoreDocs(props.row)" type="info" round>Add Documents</el-button> -->
                <el-button
v-if=showEditButtons type="success" :icon="Plus" circle @click="addMoreDocs(props.row)"
                  style="margin-left: 10px;margin-top: 5px" size="small" />

              </div>
            </template>
          </el-table-column>
          <el-table-column label="Name" prop="name" sortable />
          <el-table-column label="Settlement" prop="settlement.name" sortable />


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
@click="viewProfile(scope as TableSlotDefault)"
                      :icon="Position">View</el-dropdown-item>


                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteProject(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>


              <div v-else>

                <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
                  <el-button
type="success" size="small" :icon="Edit" @click="editFacility(scope.row as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="View Profile" placement="top">
                  <el-button
type="warning" size="small" :icon="Position" @click="flyTo(scope.row as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="View Profile" placement="top">
                  <el-button
type="primary" size="small" :icon="TopRight"
                    @click="viewProfile(scope.row as TableSlotDefault)" circle />
                </el-tooltip>


                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to delete this facility?" width="150"
                    @confirm="DeleteProject(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

              </div>
            </template>

          </el-table-column>

        </el-table>

        <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
          v-model:page-size="pageSize" :page-sizes="[6, 20, 50, 200, 1000]" :total="total" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />


      </el-tab-pane>



      <el-tab-pane name="new" v-if=showEditButtons>
        <template #label>
          <span class="custom-tabs-label">
            <el-badge type="success" :value="totalNew" class="item">
              <el-button link>New</el-button>
            </el-badge>
          </span>
        </template>

        <el-table :data="tableDataListNew" style="width: 100%; margin-top: 10px;" border>
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <el-table :data="props.row.documents" border>
                  <el-table-column label="Name" prop="name" />
                  <el-table-column label="Type" prop="document_type.type" />
                  <el-table-column label="Size(mb)" prop="size" />
                  <el-table-column label="Actions">
                    <!-- <template #default="scope"> -->
                    <template #default="scope">

                      <el-dropdown v-if="isMobile">
                        <span class="el-dropdown-link">
                          <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                        </span>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="downloadFile(scope.row)" :icon="Download" color="green" />
                          <el-dropdown-item
v-if=showAdminButtons @click="removeDocument(scope.row)" :icon="Delete"
                            color="red" />
                        </el-dropdown-menu>
                      </el-dropdown>
                      <div v-else>
                        <el-button type="success" @click="downloadFile(scope.row)" :icon="Download" />
                        <el-button
v-if=showAdminButtons type="danger" @click="removeDocument(scope.row)"
                          :icon="Delete" />
                      </div>
                    </template>

                  </el-table-column>
                </el-table>
                <!-- <el-button @click="addMoreDocs(props.row)" type="info" round>Add Documents</el-button> -->
                <el-button
v-if=showAdminButtons type="success" :icon="Plus" circle @click="addMoreDocs(props.row)"
                  style="margin-left: 10px;margin-top: 5px" size="small" />

              </div>
            </template>
          </el-table-column>
          <el-table-column label="Name" prop="name" sortable />
          <el-table-column label="Settlement" prop="settlement.name" sortable />


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
@click="viewProfile(scope as TableSlotDefault)"
                      :icon="Position">View</el-dropdown-item>


                  </el-dropdown-menu>
                </template>
              </el-dropdown>


              <div v-else>

                <el-tooltip v-if="showAdminButtons" content="Edit" placement="top">
                  <el-button
type="success" size="small" :icon="Edit" @click="editFacility(scope.row as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="View Profile" placement="top">
                  <el-button
type="warning" size="small" :icon="Position" @click="flyTo(scope.row as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="View Profile" placement="top">
                  <el-button
type="primary" size="small" :icon="TopRight"
                    @click="viewProfile(scope.row as TableSlotDefault)" circle />
                </el-tooltip>

                <el-tooltip content="Review" placement="top">
                  <el-button
v-show="showAdminButtons" type="success" size="small" :icon="View"
                    @click="Review(scope as TableSlotDefault)" circle />
                </el-tooltip>


              </div>
            </template>

          </el-table-column>

        </el-table>

        <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
          v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="totalNew" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
      </el-tab-pane>

      <el-tab-pane name="rejected" v-if=showAdminButtons :badge="5">
        <template #label>
          <span class="custom-tabs-label">
            <el-badge :value="totalRejected" class="item">
              <el-button link>Rejected</el-button>
            </el-badge>
          </span>
        </template>
        <el-table :data="tableDataListRejected" style="width: 100%; margin-top: 10px;" border>
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <el-table :data="props.row.documents" border>
                  <el-table-column label="Name" prop="name" />
                  <el-table-column label="Type" prop="document_type.type" />
                  <el-table-column label="Size(mb)" prop="size" />
                  <el-table-column label="Actions">
                    <!-- <template #default="scope"> -->
                    <template #default="scope">

                      <el-dropdown v-if="isMobile">
                        <span class="el-dropdown-link">
                          <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                        </span>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="downloadFile(scope.row)" :icon="Download" color="green" />
                          <el-dropdown-item @click="removeDocument(scope.row)" :icon="Delete" color="red" />
                        </el-dropdown-menu>
                      </el-dropdown>
                      <div v-else>
                        <el-button type="success" @click="downloadFile(scope.row)" :icon="Download" />
                        <el-button type="danger" @click="removeDocument(scope.row)" :icon="Delete" />
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
          <el-table-column label="Name" prop="name" sortable />
          <el-table-column label="Settlement" prop="settlement.name" sortable />


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
@click="viewProfile(scope as TableSlotDefault)"
                      :icon="Position">View</el-dropdown-item>

                    <el-tooltip content="Review" placement="top">
                      <el-button
v-show="showAdminButtons" type="success" size="small" :icon="View"
                        @click="Review(scope as TableSlotDefault)" circle />
                    </el-tooltip>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteProject(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>


              <div v-else>



                <el-tooltip content="View Profile" placement="top">
                  <el-button
type="warning" size="small" :icon="Position" @click="flyTo(scope.row as TableSlotDefault)"
                    circle />
                </el-tooltip>



                <el-tooltip content="View Profile" placement="top">
                  <el-button
type="primary" size="small" :icon="TopRight"
                    @click="viewProfile(scope.row as TableSlotDefault)" circle />
                </el-tooltip>


                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to delete this facility?" width="150"
                    @confirm="DeleteProject(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

              </div>
            </template>

          </el-table-column>

        </el-table>

        <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
          v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="totalRejected" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />


      </el-tab-pane>



      <el-tab-pane label="Map" name="map">
        <el-card class="box-card" />

        <div id="mapContainer" class="basemap"></div>
        <div id="floating-div">

          <el-collapse v-model="collapse">
            <el-collapse-item title="LEGEND">
              <div class="legend">
                <div v-for="item in legendItems" :key="item.label" class="legend-item">
                  <div class="line-color" :style="{ backgroundColor: item.color }"></div>
                  <div class="legend-label">{{ item.label }}</div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>

    </el-tabs>

    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" width="400px" draggable>
      <el-row :gutter="10">


        <div style="display: inline-block; width: 100%;   margin-bottom: 10px">
          <el-steps :active="active" finish-status="success">
            <el-step title="Profile" />
            <el-step title="Reach" />

          </el-steps>
        </div>

        <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm" status-icon>

          <el-row v-if="active === 0" :gutter="20">
            <el-divider />
            <el-col :xl="24" :lg="24" :md="12" :sm="12" :xs="24">
              <el-form-item label="Scheme Name" prop="name">
                <el-input v-model="ruleForm.name" />
              </el-form-item>
            </el-col>


            <el-row>
              <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
                <el-form-item label="County" prop="county_id">
                  <el-select v-model="ruleForm.county_id" filterable placeholder="County" :onChange="handleSelectCounty">
                    <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
                <el-form-item label="Subcounty" prop="subcounty_id">
                  <el-select v-model="ruleForm.subcounty_id" filterable placeholder="Sub County">
                    <el-option
v-for="item in subcountyfilteredOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-col :xl="24" :lg="24" :md="12" :sm="12" :xs="24">

              <el-form-item label="Settlement" prop="settlement_id">
                <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement">
                  <el-option
v-for="item in settlementfilteredOptions" :key="item.value" :label="item.label"
                    :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="Service">
                <el-select v-model="ruleForm.provider_category" filterable placeholder="Select">
                  <el-option v-for="item in generalOwnership" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="Provider " prop="provider">
                <el-input v-model="ruleForm.provider" />
              </el-form-item>
            </el-col>

          </el-row>

          <el-row class="mb-4  md-5" v-if="active === 1" :gutter="20">
            <el-divider content-position="left" />
            <el-form-item label="Type">
              <el-select v-model="ruleForm.type" filterable placeholder="Select">
                <el-option v-for="item in sewerTypes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-col :span="24" :lg="24" :md="12" :sm="12" :xs="24">
              <el-form-item label="Connections " prop="Owner">
                <el-input-number v-model="ruleForm.number_connections" />
              </el-form-item>

              <el-form-item label="Length(Km) " prop="length">
                <el-input-number v-model="ruleForm.length" />
              </el-form-item>
              <el-form-item label="Pipe">
                <el-select v-model="ruleForm.pipe_type" filterable placeholder="Select">
                  <el-option v-for="item in pipeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="Pipe Size " prop="pipe_size">
                <el-input-number v-model="ruleForm.pipe_size" />
              </el-form-item>

            </el-col>
          </el-row>








        </el-form>



      </el-row>

      <template #footer>
        <span class="dialog-footer space-between">
          <el-row :gutter="10">

            <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
              <el-button @click="next">Next step</el-button>

              <el-button @click="AddDialogVisible = false">Cancel</el-button>
              <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>


            </el-col>


          </el-row>
        </span>
      </template>


    </el-dialog>


    <el-dialog v-model="addMoreDocuments" title="Upload More Documents" width="20%">
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
        <el-descriptions-item label="Name">{{ health_facility_raw.name }}</el-descriptions-item>
        <el-descriptions-item label="Status" :span="2">{{ health_facility_raw.reg_status }}</el-descriptions-item>
        <el-descriptions-item label="Type">{{ health_facility_raw.ownership_type }}</el-descriptions-item>
        <el-descriptions-item label="owner"> {{ health_facility_raw.owner }} </el-descriptions-item>
        <el-descriptions-item label="Submitted By"> {{ health_facility_raw.user }} </el-descriptions-item>
        <el-descriptions-item label="Date"> {{ health_facility_raw.date }} </el-descriptions-item>





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
  height: 450px;
}
</style>





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



.legend {
  padding: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-color {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}


.line-color {
  height: 3px;
  margin-right: 10px;
  width: 20px;

}

.legend-label {
  font-size: 12px;
}

#layer-control {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1;
  background-color: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}


#floating-div {
  position: absolute;
  top: 40px;
  left: 20px;
  z-index: 1;
  background-color: white;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}



.item {
  margin-top: 10px;
  margin-right: 40px;
}
</style>

