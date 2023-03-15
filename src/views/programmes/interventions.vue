<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getHHsByCounty, getRoutesList, uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, ElLink, MessageParamsWithType, ElTabs, ElTabPane, ElDialog, ElInputNumber,
  ElInput, ElDatePicker, ElForm, ElFormItem, ElUpload, ElCol, FormRules, ElDropdown, ElDropdownItem, ElDropdownMenu, ElPopconfirm, ElTable, ElTableColumn, UploadUserFile
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Position, TopRight, Plus, User, Download, Delete, Edit, Filter, InfoFilled } from '@element-plus/icons-vue'

import { ref, reactive, h } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider, ElOptionGroup } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'

import xlsx from "json-as-xlsx"
import { getAllGeo } from '@/api/settlements'
import {
  searchByKeyWord
} from '@/api/settlements'
import { useRoute } from 'vue-router'
import moment from "moment";


////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import { Icon } from '@iconify/vue';

import { onMounted, computed, watch } from 'vue'

import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'
import { getFile } from '@/api/summary'
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;




const route = useRoute()


const searchString = ref()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const tabDisabled = ref(true)

// Hide buttons if not admin 
const showAdminButtons = ref(false)

if (userInfo.roles.includes("admin")) {
  showAdminButtons.value = true
}

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
var value4 = ref([])
var value5 = ref([])

const morefileList = ref<UploadUserFile[]>([])


const interVentionTypeOptions = ref([])


const component_id = ref()
const page_title = ref()


watch(
  route,
  () => {
    console.log("Watching...............................", route.meta);
    component_id.value = route.meta.component_id
    page_title.value = route.meta.title
  },
  { deep: true, immediate: true, }
)


//const domain_id = 5

const tmp_domain = ref()




const settlementOptions = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)

const pageSizeBen = ref(5)
const currentPageBen = ref(1)
const pageBen = ref(1)
const pSizeBen = ref(5)

const total = ref(0)
const totalBen = ref(0)
const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)
const formheader = ref('Edit Project')







let tableDataList = ref<UserType[]>([])
let tableDataList_orig = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']


// - -----Model configs ------------
const model = 'project'
var filters = ['component_id']
var filterValues = [[component_id.value]]  // make sure the inner array is array
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['settlement', 'activity', 'county', 'subcounty', 'component', 'document']
//const nested_models = ['component', 'programme'] // The mother, then followed by the child
const nested_models = ['document', 'document_type'] // The mother, then followed by the child


//// ------------------parameters -----------------------////
const fileUploadList = ref<UploadUserFile[]>([])

const facilityGeo = ref([])
const facilityGeoPoints = ref()
const facilityGeoLines = ref([])
const facilityGeoPolygons = ref([])
const geoLoaded = ref(false)


const { t } = useI18n()

const formatter = (row) => {
  if (row.documentation) {


    return h(ElLink, { href: row.documentation, download: row.documentation, type: 'danger' }, h(Icon, {
      icon: "ic:outline-download-for-offline", height: '36'
    }))

    // return h(ElLink, { href: row.documentation, download: row.documentation, type: 'danger' }, h(Icon, { icon: "material-symbols:cloud-download", height: '36' }), 'Download ')


  } else {
    return
  }

}



const BeneficiaryColumns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: 'name',
    label: t('Name')
  },
  {
    field: 'household.gender',
    label: t('Gender')
  },
  {
    field: 'household.national_id',
    label: t('National ID')
  },

  {
    field: 'component.title',
    label: t('Component')
  },
]


const handleClear = async () => {
  console.log('cleared....')

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

  beneficiaryTabTitle.value = []
  beneficiaryTabDisabled.value = true
  beneficiaryTabTitle.value = 'Beneficiaries'
  //----run the get data--------
  getAllProjects()
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
    formData.append('field_id', 'project_id')

    formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
    formData.append('code', uuid.v4())
    formData.append('project_id', currentRow.value.id)


  }


  console.log(currentRow.value.id)
  await uploadFilesBatch(formData)

}

const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  getFilteredData(filters, filterValues)
}





const onPageSizeChange = async (size: any) => {
  pSizeBen.value = size
  getFilteredData(filters, filterValues)
}




const getAllProjects = async () => {
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
  tableDataList_orig.value = res.data // back for post filter

  total.value = res.total


  tblData.value = [] // reset the table data
  console.log('TBL-b4-', tblData)
  let filteredIds = []
  res.data.forEach(function (arrayItem) {
    //  console.log(arrayItem)
    filteredIds.push(arrayItem.id)

    var dd = destructure(arrayItem)
    delete dd['0']
    delete dd['1']

    tblData.value.push(arrayItem)
  })

  // console.log('Now get the filtered Geo for --', filteredIds)

  formData.columnFilterField = 'id'
  formData.selectedParents = []
  formData.filtredGeoIds = filteredIds
  const fgeo = await getfilteredGeo(formData)

  console.log('the filtred GEO --', fgeo)


  if (fgeo.data[0].json_build_object) {
    var points = []
    var lines = []
    var polygons = []
    facilityGeo.value = fgeo.data[0].json_build_object
    console.log('Geo Returns---', fgeo.data[0].json_build_object.features)
    console.log("Facility Geo", facilityGeo)

    if (fgeo.data[0].json_build_object.features === null) {

      // No geo found so intiialize the points, lines and polygons to empty arrays 
      facilityGeoPoints.value = []
      facilityGeoLines.value = []
      facilityGeoPolygons.value = []
    }
    else {
      tabDisabled.value = false

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
    }


    geoLoaded.value = true


  }


  console.log('TBL-4f', tblData)
}







const viewOnMap = (data: TableSlotDefault) => {
  console.log('On map.....', data.row)


  if (data.row.geom === null) {
    // open(msg)
    ElMessage({
      message: 'This Project does not have the boundary defined in the database!',
      type: 'warning',
    })

  } else {

    push({
      path: '/interventions/kisip/map/:id',
      name: 'ProjectMap',
      params: { id: data.row.id }
    })

    // push({
    //     path: '/settlement/map/:id',
    //     name: 'SettlementMap',
    //     params: { id: data.row.id }
    // })

  }
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


const onMap = async (obj) => {
  console.log("Loading map....cs.........", obj.props.label)
  console.log(facilityGeoLines.value.length, facilityGeoPoints.value.length, facilityGeoPolygons.value.length)


  if (obj.props.label == "Map") {

    if (facilityGeoLines.value.length == 0 && facilityGeoPoints.value.length == 0 && facilityGeoPolygons.value.length == 0) {
      ElMessage({
        message: 'The listed projects do not have geometry',
        type: 'warning',
      })
    }
    else {
      loadMap()
      //console.log(map.value)
      //maxBounds.value = turf.bbox(facilityGeo.value);
    }

  }

}


const getFilteredBySearchData = async (searchString) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = searchString
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  console.log(formData)
  const res = await searchByKeyWord(formData)

  console.log('After -----x ------Querry', res)
  tableDataList.value = res.data
  tableDataList_orig.value = res.data // back for post filter

  total.value = res.total
  loading.value = false

  tblData.value = [] // reset the table data

}

const searchByName = async (filterString: any) => {
  searchString.value = filterString

  if (searchString.value) {
    getFilteredBySearchData(searchString.value)
  } else {
    getAllProjects()

  }

}



//// ------------------------------------Beneficiaires-------------------------------------//

const beneficiaryTabTitle = ref('Beneficiaries')
const beneficiaryTabDisabled = ref(true)

const selected_project = ref()

const filtersBen = ref(['project_id', 'component_id'])
const filterValuesBen = ref([[], [[component_id.value]]])


const viewBen = (data: TableSlotDefault) => {
  console.log('----->', filterValuesBen.value)
  selected_project.value = data.row.id
  filterValuesBen.value = [[data.row.id], [component_id.value]] // make sure the inner array is array

  console.log('----->', filtersBen.value.values, filterValuesBen.value)

  //console.log(filtersBen, selected_project.value, filterValuesBen)

  getBeneficiaries(filtersBen, filterValuesBen)    // Get Beneficiaires 
  //beneficiaryTabTitle.value = 'Beneficiaries(' + data.row.settlement.name + ')'   // Change Tab Title 
  beneficiaryTabTitle.value = 'Beneficiaries'    // Change Tab Title 
  beneficiaryTabDisabled.value = false  // Enbale the tab for user to see the beneficiaires 

  activeName.value = 'Beneficiary' // Navigate to Beneficiary Tab

}

const onPageSizeChangeBen = async (size: any) => {
  pSizeBen.value = size
  getBeneficiaries(filtersBen, filterValuesBen)
}

const onPageChangeBen = async (selPage: any) => {
  console.log('on change change:   ', selCounties)
  pageBen.value = selPage
  getBeneficiaries(filtersBen, filterValuesBen)
}


const beneficiaryList = ref([])

const loadingBeneficiaries = ref(true)

const getBeneficiaries = async (selfilters, selfilterValues) => {
  const formData = {}
  formData.limit = pSizeBen.value
  formData.page = pageBen.value
  formData.curUser = 1 // Id for logged in user
  formData.model = 'beneficiary'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selfilters.value
  formData.filterValues = selfilterValues.value
  formData.associated_multiple_models = ['households', 'component']

  //------------------------- 
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
  totalBen.value = res.total
  console.log('Get Beneficiaires', res)

  beneficiaryList.value = res.data // back for post filter
  loadingBeneficiaries.value = false
}



//// ------------------------------------ -------------------------------------//
const componentOptions = ref([])
const getInterventionComponents = async () => {

  const formData = {}
  formData.limit = 100
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'component'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.associated_multiple_models = ['programme']

  //-------------------------
  //console.log(formData)
  const res = await getRoutesList(formData)
  res.data.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.title + '(' + arrayItem.programme.acronym + ')'
    //  console.log(countyOpt)
    componentOptions.value.push(countyOpt)
  })


}

getAllProjects()
getInterventionComponents()
getBeneficiaries(filtersBen, filterValuesBen)  // First time




//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  component_id: '',
  settlement_id: '',
  county_id: '',
  location_level: '',
  title: '',
  type: '',
  programme_id: '',
  domain_id: '',
  category_id: null,
  status: '',
  start_date: null,
  end_date: null,
  activities: [],
  cost: 0,
  male_beneficiaries: 0,
  female_beneficiaries: 0,
  geom: '',
  id: '',
  code: ''
})





const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model

      console.log('before Updated', ruleForm)
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

      }


      updateformData.append('parent_code', ruleForm.id)
      updateformData.append('model', model)
      updateformData.append('grp', 'Project Documentation')
      updateformData.append('code', uuid.v4())
      updateformData.append('column', 'project_id')


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

  ruleForm.settlement_id = null
  ruleForm.intervention_phase = null
  ruleForm.intervention_id = null
  ruleForm.hh_id = null
  ruleForm.benefit_type_id = null



  formheader.value = 'Add Beneficiary'
  AddDialogVisible.value = false

}





const activeName = ref('list')
const AddProject = () => {

  console.log("Adding Projects")
  console.log(component_id.value)
  // push({
  //   path: '/interventions/kisip/add',
  //   name: 'AddInterventionProjectsV2'
  // })

  push({
    path: '/interventions/add/:domain',
    name: 'AddInterventionProjectsV2',
    params: { domain: component_id.value }
  })

}

const AddDialogVisible = ref(false)

const editProject = (data: TableSlotDefault) => {

  showEditSaveButton.value = true

  console.log(data)
  ruleForm.id = data.row.id

  ruleForm.location_level = data.row.location_level

  ruleForm.title = data.row.title
  ruleForm.programme_id = data.row.programme_id
  ruleForm.status = data.row.status
  ruleForm.domain_id = data.row.domain_id
  ruleForm.category_id = data.row.category_id
  tmp_domain.value = [data.row.component_id, data.row.category_id]
  ruleForm.male_beneficiaries = data.row.male_beneficiaries
  ruleForm.female_beneficiaries = data.row.female_beneficiaries
  ruleForm.cost = data.row.cost
  ruleForm.settlement_id = data.row.settlement_id
  ruleForm.county_id = data.row.county_id
  ruleForm.code = data.row.code
  ruleForm.geom = data.row.geom
  ruleForm.start_date = data.row.start_date
  ruleForm.end_date = data.row.end_date
  //ruleForm.activities = data.row.activities
  ruleForm.activities = data.row.activities.map(a => a.id);
  ruleForm.component_id = data.row.component_id

  fileUploadList.value = data.row.documents


  if (data.row.settlement_id) {
    showSettlement.value = true
  }
  if (data.row.county_id) {
    showCounty.value = true

  }

  console.log(data.row.domain_id)

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


const DeleteProject = (data: TableSlotDefault) => {
  console.log('----->', data)
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
  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}

const tableRowClassName = (data) => {
  console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}


const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Title", value: "title" }, // Top level data
    { label: "County", value: "county" }, // Custom format
    { label: "Settlement", value: "settlement" }, // Custom format
    { label: "Programme", value: "programme" }, // Run functions
    { label: "Component", value: "component" }, // Run functions
    { label: "Status", value: "status" }, // Run functions
    { label: "Beneficiaries(#Male)", value: "male_beneficiaries" }, // Run functions
    { label: "Beneficiaries(#Female)", value: "female_beneficiaries" }, // Run functions
    { label: "Cost", value: "cost" }, // Run functions
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
    console.log(tableDataList.value[i].title)
    thisRecord.index = i + 1
    thisRecord.title = tableDataList.value[i].title
    thisRecord.settlement = tableDataList.value[i].settlement ? tableDataList.value[i].settlement.name : ''
    thisRecord.county = tableDataList.value[i].county ? tableDataList.value[i].county.name : ''
    thisRecord.component = tableDataList.value[i].component.title
    thisRecord.programme = tableDataList.value[i].component.programme.title
    thisRecord.female_beneficiaries = tableDataList.value[i].female_beneficiaries
    thisRecord.male_beneficiaries = tableDataList.value[i].male_beneficiaries
    thisRecord.cost = tableDataList.value[i].cost
    thisRecord.status = tableDataList.value[i].status

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



const locationOptions = [
  {
    label: "National",
    value: 1
  },
  {
    label: "County",
    value: 2
  },
  {
    label: "Settlement",
    value: 3
  },

  {
    label: "Other",
    value: 4
  },
]

const showCounty = ref(false)
const showSettlement = ref(false)

const handleSelectLocation = async (location: any) => {
  if (location == 2) {
    // county 
    showCounty.value = true
    showSettlement.value = false
    ruleForm.settlement_id = null
    ruleForm.geom = null

  }
  else if (location == 3) {
    //settlement 
    showCounty.value = false
    showSettlement.value = true
    ruleForm.county_id = null
    ruleForm.geom = null

  } else {
    // National 
    showCounty.value = false
    showSettlement.value = false
    ruleForm.geom = null

  }

}

const formatStartDate = (data) => {

  return moment(data.start_date).format("YYYY-MM-DD");

}
const formatEndDate = (data) => {

  return moment(data.end_date).format("YYYY-MM-DD");

}
const search = ref('')

const filterTableData = () => {

  console.log("filtering data")

  if (search.value) {
    console.log(search.value)
    tableDataList.value = tableDataList.value.filter(
      (data) =>
        !search.value ||
        data.title.toLowerCase().includes(search.value.toLowerCase())
    )
    console.log(tableDataList.value)

  } else {
    console.log("Clear search", search.value)
    console.log("Clear search", tableDataList_orig.value)

    tableDataList.value = tableDataList_orig.value
  }
}



const documentCategory = ref()
const documentOptions = [
  {
    label: 'Reports',
    options: [
      {
        value: 'socio_economic',
        label: 'Socio Economic Report'
      },
      {
        value: 'stakeholder_report',
        label: 'Stakeholder Report'
      },
      {
        value: 'planning_report',
        label: 'Planning Report'
      },

      {
        value: 'basemap_report',
        label: 'Basemap Report'
      },
      {
        value: 'esia_report',
        label: 'Environmental Screening Report'
      }
    ]
  },
  {
    label: 'Plans',
    options: [
      {
        value: 'ldpdp',
        label: 'Local Development Plan'
      },
      {
        value: 'pdp',
        label: 'Part Development Plan'
      }
    ]
  },
  {
    label: 'Maps',
    options: [
      {
        value: 'survey_plan',
        label: 'Survey Plan'
      },
      {
        value: 'rim',
        label: 'Registry Index Map'
      }
    ]
  },
  {
    label: 'Drawings',
    options: [
      {
        value: 'design',
        label: 'Design Proposals'
      },
      {
        value: 'built',
        label: 'As Built Designs'
      }
    ]
  }
]
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



const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "40%"
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


//id","name","county_id","settlement_type","geom","area","population","code","description"
const activityOptions = ref([])
const getActivities = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 10000,
      curUser: 1, // Id for logged in user
      model: 'activity',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'
      console.log(opt)
      activityOptions.value.push(opt)
    })

    console.log(activityOptions)

  })
}
getDocumentTypes()
getActivities()
</script>

<template>
  <ContentWrap :title="page_title" :message="t(' The list of intervention beneficiaries. Use the filters to subset')">
    <el-row>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">

        <div style="display: inline-block;margin-bottom: 10px">


          <div style="display: inline-block; margin-bottom: 10px">
            <el-select v-model="value3" multiple clearable filterable remote :remote-method="searchByName" reserve-keyword
              placeholder="Search by Title" style="width: 100%" />
          </div>

          <div style="display: inline-block; margin-left: 20px">
            <el-button :onClick="handleClear" type="primary" :icon="Filter" />
          </div>

          <div v-if="showAdminButtons" style="display: inline-block; margin-left: 20px">
            <el-tooltip content="Add Project" placement="top">
              <el-button :onClick="AddProject" type="primary" :icon="Plus" />
            </el-tooltip>
          </div>

          <div style="display: inline-block; margin-left: 20px">
            <el-tooltip content="Download" placement="top">
              <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
            </el-tooltip>
          </div>

        </div>
      </el-col>
    </el-row>

    <el-tabs @tab-click="onMap" v-model="activeName" type="border-card">
      <el-tab-pane label="Interventions" name="list">
        <el-table :data="tableDataList" style="width: 100%" :row-class-name="tableRowClassName" fit>
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <el-table :data="props.row.documents">
                  <el-table-column label="Name" prop="name" />
                  <el-table-column label="Type" prop="document_type.type" />
                  <el-table-column label="Size(mb)" prop="size" />

                  <el-table-column label="Actions">
                    <template #default="scope">

                      <el-link :href="null" @click="downloadFile(scope.row)">
                        <Icon icon="material-symbols:download-for-offline-rounded" color="#46c93a" width="36" />
                      </el-link>


                      <el-tooltip content="Delete" placement="top">
                        <el-popconfirm confirm-button-text="Yes" width="220" cancel-button-text="No" :icon="InfoFilled"
                          icon-color="#626AEF" title="Are you sure to delete this document?"
                          @confirm="removeDocument(scope.row)">
                          <template #reference>
                            <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
                          </template>
                        </el-popconfirm>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                </el-table>
                <!-- <el-button @click="addMoreDocs(props.row)" type="info" round>Add Documents</el-button> -->
                <el-button type="success" :icon="Plus" circle @click="addMoreDocs(props.row)"
                  style="margin-left: 10px;margin-top: 5px" size="small" />

              </div>
            </template>
          </el-table-column>
          <el-table-column label="Title" prop="title" width="400" sortable />
          <el-table-column label="County" prop="county.name" sortable />

          <el-table-column label="Settlement" prop="settlement.name" sortable />
          <el-table-column label="Status" prop="status" sortable />
          <el-table-column label="Start" prop="start_date" :formatter="formatStartDate" sortable />
          <el-table-column label="End" prop="end_date" :formatter="formatEndDate" sortable />



          <el-table-column fixed="right" label="Operations" :width="actionColumnWidth">
            <template #header>
              <span v-if="isMobile">Actions</span>

              <el-input v-else v-model="search" placeholder="Filter" :onInput="filterTableData" />
            </template>
            <template #default="scope">


              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="showAdminButtons" @click="editProject(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item @click="viewOnMap(scope as TableSlotDefault)"
                      :icon="Position">Map</el-dropdown-item>

                    <el-dropdown-item @click="viewBen(scope as TableSlotDefault)"
                      :icon="User">Beneficiaries</el-dropdown-item>


                    <el-dropdown-item v-if="showAdminButtons" @click="DeleteProject(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>


              <div v-else>


                <el-tooltip v-if="showAdminButtons" content="Edit" placement="top">
                  <el-button type="success" size="small" :icon="Edit" @click="editProject(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>
                <el-tooltip content="View on Map" placement="top">
                  <el-button type="warning" size="small" :icon="Position" @click="viewOnMap(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>
                <el-tooltip content="View Households" placement="top">
                  <el-button type="success" size="small" :icon="User" @click="viewBen(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="Delete" placement="top">
                  <el-popconfirm confirm-button-text="Yes" width="220" cancel-button-text="No" :icon="InfoFilled"
                    icon-color="#626AEF" title="Are you sure to delete this report?"
                    @confirm="DeleteProject(scope.row as TableSlotDefault)">


                    <template #reference>
                      <el-button size="small" v-if="showAdminButtons" type="danger" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

              </div>

            </template>
          </el-table-column>

        </el-table>

        <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
          v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="total" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
      </el-tab-pane>

      <el-tab-pane :label="beneficiaryTabTitle" name="Beneficiary" :disabled="beneficiaryTabDisabled">


        <Table :columns="BeneficiaryColumns" :data="beneficiaryList" :loading="loadingBeneficiaries" :selection="true"
          :pageSize="pageSizeBen" :currentPage="currentPageBen" />


        <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPageBen="currentPageBen"
          v-model:page-size="pageSizeBen" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="totalBen" :background="true"
          @size-change="onPageSizeChangeBen" @current-change="onPageChangeBen" class="mt-4" />
      </el-tab-pane>


      <el-tab-pane label="Map" name="Map" :disabled="tabDisabled">
        <div id="mapContainer" class="basemap"></div>
      </el-tab-pane>
    </el-tabs>



    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">


        <el-form-item label="Location" prop="location_level">
          <el-select v-model="ruleForm.location_level" filterable placeholder="Select Location"
            @change="handleSelectLocation">
            <el-option v-for="item in locationOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item v-if=showSettlement label="Settlement" prop="settlement_id">
          <el-select v-model="ruleForm.settlement_id" filterable placeholder="Select Settlement">
            <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item v-if=showCounty label="County" prop="county_id">
          <el-select v-model="ruleForm.county_id" filterable placeholder="Select County" @change="handleSelectCounty">
            <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>


        <el-form-item label="Title">
          <el-input v-model="ruleForm.title" />
        </el-form-item>

        <el-form-item label="Component" prop="component_id">
          <el-select v-model="ruleForm.component_id" filterable placeholder="Select Component">
            <el-option v-for="item in componentOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>


        <el-form-item label="Beneficiaries (M)">
          <el-input-number v-model="ruleForm.male_beneficiaries" />
        </el-form-item>
        <el-form-item label="Beneficiaries (F)">
          <el-input-number v-model="ruleForm.female_beneficiaries" />
        </el-form-item>

        <el-form-item label="Cost">
          <el-input-number v-model="ruleForm.cost" />
        </el-form-item>

        <el-form-item label="Start" prop="start_date">
          <el-date-picker v-model="ruleForm.start_date" />
        </el-form-item>

        <el-form-item label="End" prop="end_date">
          <el-date-picker v-model="ruleForm.end_date" />
        </el-form-item>

        <el-col :span="24">
          <el-form-item label="Activities">
            <el-select v-model="ruleForm.activities" filterable multiple placeholder="Select" style="width: 100%;">
              <el-option v-for="item in activityOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-form-item label="Documentation"> <el-upload v-model:file-list="fileUploadList" class="upload-demo" multiple
            :limit="3" :auto-upload="false">
            <el-button type="primary">Click to upload</el-button>
            <template #tip>
              <div class="el-upload__tip">
                pdf/xlsx/csv/jpg/png files with a size less than 20mb.
              </div>
            </template>
          </el-upload></el-form-item>



      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="AddDialogVisible = false">Cancel</el-button>
          <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>

        </span>
      </template>
    </el-dialog>


    <el-dialog v-model="addMoreDocuments" title="Upload More Documents" width="30%">


      <el-select v-model="documentCategory" placeholder="Select Type" clearable filterable class="mb-4">
        <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>

      <el-upload v-model:file-list="morefileList" class="upload-demo"
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