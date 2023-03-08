<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, uploadFilesBatch } from '@/api/settlements'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'

import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType, UploadProps, ElOptionGroup, ElOption, FormInstance } from 'element-plus'
import { ElMessage, ElCollapse, ElCollapseItem, ElInput, ElInputNumber } from 'element-plus'
import { computed } from 'vue'
import xlsx from "json-as-xlsx"
import { getFile } from '@/api/summary'

import {
  Position,
  TopRight,
  User,
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
  ElPopconfirm, ElDivider, ElDropdown, ElDropdownItem, ElDropdownMenu
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

import { countyOptions, subcountyOptions, settlementOptionsV2, LevelOptions, ownsershipOptions, HCFTypeOptions } from './../common/index.ts'





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





// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}


console.log("Show Buttons -->", showAdminButtons)



const tableDataList = ref([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['settlement', 'document']
const model = 'health_facility'
const model_parent_key = 'settlement_id'
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







const onMap = async (obj) => {
  console.log(obj.props.label)
  if (obj.props.label == "Map") {
    loadMap([])
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


const loadMap = (mapCenter) => {

  if (mapCenter.length === 0) {
    var centerPosition = [37.137343, 1.137451]
    var zoom = 6
  } else {
    var centerPosition = mapCenter
    var zoom = 19
  }
  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v11",
    center: centerPosition, // starting position
    zoom: zoom,

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
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-color': [
          'case',
          ['==', ['get', 'level'], 'Level 1'],
          'red',
          ['==', ['get', 'level'], 'Level 2'],
          'green',

          ['==', ['get', 'level'], 'Level 3'],
          'blue', 'gray'],
        'circle-stroke-color': 'white'
      }
    });



    nmap.addLayer({
      id: 'Satellite',
      source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
      type: "raster"
    }, 'pontLayer');

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

    nmap.resize()



    // Zoom to layers if not by clik on a list
    if (mapCenter.length === 0) {
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
    }

    nmap.on('click', 'pontLayer', (e) => {
      console.log("Onclikc..........")
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.name;
      const level = e.features[0].properties.level;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }



      new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>' + level + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
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

console.log('Options---->', countiesOptions)
const viewProfile = (data: TableSlotDefault) => {
  console.log('On Click.....', data.id)

  push({
    path: '/facilities/health/details/:id',
    name: 'HealthFacilityDetails',
    params: { data: data.id, id: data.id }
  })
}

const activeTab = ref('list')

const flyTo = (data: TableSlotDefault) => {
  console.log('On Click.....', data.geom.coordinates)
  activeTab.value = 'map'
  loadMap([data.geom.coordinates[0], data.geom.coordinates[1]])

}





const AddFacility = (data: TableSlotDefault) => {
  push({
    path: '/facilities/health/add',
    name: 'Addhealth'
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
      formData.append('field_id', 'health_facility_id')

      formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
      formData.append('code', uuid.v4())
      formData.append('health_facility_id', currentRow.value.id)

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
    "label": "Community Facility",
    "color": "red"
  },
  {
    "label": "Health Dispensary",
    "color": "green"
  },
  {
    "label": "Health Center",
    "color": "blue"
  },
  {
    "label": "Others",
    "color": "gray"
  },



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
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  facility_type: '',
  facility_number: '',
  reg_status: '',
  level: '',
  owner: '',
  ownership_type: '',
  number_beds: '',
  geom: '',
})


const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)

const AddDialogVisible = ref(false)
const editFacility = (data: TableSlotDefault) => {

  showEditSaveButton.value = true

  console.log(data)

  currentRow.value = data.id

  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.county_id = data.county_id
  ruleForm.settlement_id = data.settlement_id
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.facility_type = data.facility_type
  ruleForm.reg_status = data.reg_status
  ruleForm.level = data.level
  ruleForm.ownership_type = data.ownership_type
  ruleForm.number_beds = data.number_beds
  ruleForm.geom = data.geom

  morefileList.value = data.documents
  AddDialogVisible.value = true
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

console.log('------> countyOptions', countyOptions)


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  ruleForm.model = model
  await updateOneRecord(ruleForm).then(() => { })










}



</script>

<template>
  <ContentWrap :title="toTitleCase(model.replace('_', ' '))" :message="t('Use the filters on the list of view the Map ')">

    <el-tabs v-model="activeTab" @tab-click="onMap" type="border-card">
      <el-tab-pane label="List" name="list">
        <div style="display: inline-block;">
          <el-select v-model="value2" :onChange="handleSelectParent" :onClear="handleClear" multiple clearable filterable
            collapse-tags placeholder="Filter by Settlement">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div style="display: inline-block; margin-left: 20px">
          <el-select v-model="value3" :onChange="handleSelectByName" :onClear="handleClear" multiple clearable filterable
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
        <div v-if="showAdminButtons" style="display: inline-block; margin-left: 20px">
          <el-tooltip content="Add Facility" placement="top">
            <el-button :onClick="AddFacility" type="primary" :icon="Plus" />
          </el-tooltip>
        </div>



        <el-table :data="tableDataList" style="width: 100%; margin-top: 10px;" border>
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
                <el-button type="success" :icon="Plus" circle @click="addMoreDocs(props.row)"
                  style="margin-left: 10px;margin-top: 5px" size="small" />

              </div>
            </template>
          </el-table-column>
          <el-table-column label="Name" prop="name" />
          <el-table-column label="Settlement" prop="settlement.name" />


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="viewProfile(scope as TableSlotDefault)"
                      :icon="Position">View</el-dropdown-item>


                    <el-dropdown-item v-if="showAdminButtons" @click="DeleteProject(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>


              <div v-else>

                <el-tooltip v-if="showAdminButtons" content="Edit" placement="top">
                  <el-button type="success" size="small" :icon="Edit" @click="editFacility(scope.row as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="View Profile" placement="top">
                  <el-button type="warning" size="small" :icon="Position" @click="flyTo(scope.row as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="View Profile" placement="top">
                  <el-button type="primary" size="small" :icon="TopRight"
                    @click="viewProfile(scope.row as TableSlotDefault)" circle />
                </el-tooltip>


                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
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

        <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
          v-model:page-size="pageSize" :page-sizes="[6, 20, 50, 200, 1000]" :total="total" :background="true"
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
                  <div class="circle-color" :style="{ backgroundColor: item.color }"></div>
                  <div class="legend-label">{{ item.label }}</div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>

    </el-tabs>

    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-row :gutter="10">
        <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" label-position="left">

            <el-form-item label="Name" prop="name">
              <el-input v-model="ruleForm.name" placeholder="Please input">
                <template #prepend>Name</template>
              </el-input>
            </el-form-item>

            <el-form-item label="Level" prop="level">
              <el-select v-model="ruleForm.level" filterable placeholder="Level">
                <el-option v-for="item in LevelOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="Type" prop="facility_type">
              <el-select v-model="ruleForm.facility_type" filterable placeholder="Type">
                <el-option v-for="item in HCFTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="Level" prop="ownership">
              <el-select v-model="ruleForm.ownership_type" filterable placeholder="Ownership">
                <el-option v-for="item in ownsershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="County" prop="county_id">
              <el-select v-model="ruleForm.county_id" filterable placeholder="Select County">
                <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>



            <el-form-item label="Settlement" prop="settlement_id">
              <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement">
                <el-option v-for="item in settlementOptionsV2" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>


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

    <el-dialog v-model="addMoreDocuments" title="Upload More Documents" width="20%">
      <el-select v-model="documentCategory" placeholder="Select Type" clearable filterable class="mb-4">


        <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>

      <el-upload v-model:file-list="morefileList" class="upload-demo "
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


.circle-color {
  height: 20px;
  width: 20px;
  margin-right: 10px;
  border-radius: 50%;
  display: inline-block;

}

.legend-label {
  font-size: 14px;
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
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>

