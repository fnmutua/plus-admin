<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getHHsByCounty, getRoutesList, uploadFilesBatch } from '@/api/settlements'
import { getListManyToMany } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'

import {
  ElButton, ElSelect, FormInstance, ElLink, MessageParamsWithType, ElTabs, ElTabPane, ElDialog, ElInputNumber,
  ElInput, ElDatePicker, ElForm, ElFormItem, ElUpload, ElCol,    ElDropdown, ElDropdownItem, ElDropdownMenu, ElPopconfirm, ElTable, ElTableColumn, UploadUserFile
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Position, TopRight, Plus, User, Download, Delete, Edit, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue'

import { ref, reactive, h } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider, ElOptionGroup } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, BatchImportUpsert, getfilteredGeo } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'
import { Icon } from '@iconify/vue';

import xlsx from "json-as-xlsx"
import { getAllGeo } from '@/api/settlements'
import {
  searchByKeyWord
} from '@/api/settlements'
import { useRoute } from 'vue-router'
import moment from "moment";
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import proj4 from 'proj4';
import { getAllHouseholds, getFilteredHouseholdsBykeyword, updateHousehold } from '@/api/households'

import {
  countyOptions, settlementOptionsV2, subcountyOptions, implementationOptions
} from './common/index.ts'

////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
 
import { onMounted, computed, watch } from 'vue'

import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'
import { getFile } from '@/api/summary'

import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';
import DownloadAll from '@/views/Components/DownloadAll.vue';

import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";

const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;




const route = useRoute()


const searchString = ref()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const tabDisabled = ref(true)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)


// Show Edit buttons 
if (userInfo.roles.includes("staff") || userInfo.roles.includes("admin")
  || userInfo.roles.includes("county_admin") || userInfo.roles.includes("national_monitoring")) {
  showEditButtons.value = true;
}

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
var value4 = ref([])
var value5 = ref([])
var value40 = ref([])

const morefileList = ref<UploadUserFile[]>([])




const component_id = ref()
const page_title = ref()
const bounds = ref([])

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
let filters = ['component_id']
let filterValues = [[component_id.value]]   // make sure the inner array is array
var tblData = []
const associated_Model = ''
//const associated_multiple_models = ['settlement', 'county', 'subcounty', 'component', 'document']
const associated_multiple_models = ['settlement', 'county', 'subcounty', 'component', 'programme_implementation', 'document']
//const nested_models = ['component', 'programme'] // The mother, then followed by the child
const nested_models = ['document', 'document_type'] // The mother, then followed by the child


//// ------------------parameters -----------------------////
const fileUploadList = ref<UploadUserFile[]>([])

const facilityGeo = ref([])
const facilityGeoPoints = ref()
const facilityGeoLines = ref([])
const facilityGeoPolygons = ref([])
const projectScopeGeo = ref([])
const geoLoaded = ref(false)


const { t } = useI18n()





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
  filterValues.value = []
  filters.value = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  value4.value = ''
  value5.value = ''
  value40.value = ''

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



const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage


  if (searchString.value) {

    getFilteredBySearchData(searchString.value)

  } else {
    getFilteredData(filters, filterValues)
  }


}





const onPageSizeChange = async (size: any) => {
  pSizeBen.value = size
  if (searchString.value) {

    getFilteredBySearchData(searchString.value)

  } else {
    getFilteredData(filters, filterValues)
  }

}



const implementationOptions = ref([])
const getImplementationSponsors = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'programme_implementation',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    //console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      const parentOpt = {}
      parentOpt.value = arrayItem.id
      parentOpt.label = arrayItem.acronym
      //  console.log(countyOpt)
      implementationOptions.value.push(parentOpt)
    })
  })
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

  //console.log('the filtred GEO --', fgeo)


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
      tabDisabled.value = true

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








const flyTo = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.geom)

  if (data.row.geom === null) {
    ElMessage({
      message: 'This Project does not have the boundary defined in the database!',
      type: 'warning',
      duration: 5000
    })

  } else {

    var shp = data.row.geom.type
    //   facilityGeo.value=data.row.geom

    if (shp == 'MultiPolygon' || shp == 'Polygon') {
      facilityGeoPolygons.value = data.row.geom
      //  var bounds = turf.bbox((data.row.geom));
      bounds.value = turf.bbox((data.row.geom));
    } else if (shp == 'Point') {
      bounds.value = turf.bbox((data.row.geom));
    }

    projectScopeGeo.value = data.row.geom
    ruleForm.id=data.row.id
    console.log(bounds.value)

    loadMap()
     
    activeName.value = 'Map' // Navigate to Beneficiary Tab


  }




}

const nmap = ref()
const loadMap = () => {
 
  nmap.value = (new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [37.137343, 1.137451], // starting position
    zoom: 6,

  }))

  const nav = new mapboxgl.NavigationControl();
  nmap.value.addControl(nav, "top-right");
  nmap.value.on('load', () => {

    nmap.value.addSource('layer', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      //  data: turf.featureCollection(facilityGeoPolygons.value),
      data: projectScopeGeo.value,
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });


    // Add a black outline around the polygon.
    nmap.value.addLayer({
      'id': 'outline',
      'type': 'line',
      'source': 'layer',
      'layout': {},
      'paint': {
        'line-color': 'black',
        'line-width': 2
      }
    });

    nmap.value.addLayer({
      'id': 'pontLayer',
      "type": "circle",
      'source': 'layer',
      'paint': {
        'circle-radius': 4,
        'circle-stroke-width': 2,
        'circle-color': 'red',
        'circle-stroke-color': 'white'
      }
    });





    nmap.value.resize()



    nmap.value.addLayer({
      id: 'Satellite',
      source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
      type: "raster"
    }, 'outline');

    nmap.value.addLayer({
      id: 'Streets',
      source: { "type": "raster", "url": "mapbox://mapbox.streets", "tileSize": 256 },
      type: "raster"
    }, 'outline');

    // switch it off until the user selects to
    nmap.value.setLayoutProperty('Satellite', 'visibility', 'none')


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
    nmap.value.addControl(new MapboxLayerSwitcherControl(layers));



    var localBounds = turf.bbox((projectScopeGeo.value));
    console.log(localBounds)

    if (localBounds) {
      console.log(localBounds)



      if (localBounds[0] == localBounds[2]) {

        // for points where the extent x1=x2
        nmap.value.fitBounds(localBounds, { maxZoom: 15, padding: 20 });
      } else {
        nmap.value.fitBounds(localBounds, { padding: 20 });

      }


    }



    nmap.value.on('click', 'points-layer', (e) => {
      console.log("Onclikc..........")
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.title;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);

    });


    // Change the cursor to a pointer when the mouse is over the places layer.
    nmap.value.on('mouseenter', 'points-layer', () => {
      nmap.value.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    nmap.value.on('mouseleave', 'points-layer', () => {
      nmap.value.getCanvas().style.cursor = '';
    });



    nmap.value.on('click', 'lines-layer', (e) => {
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


    nmap.value.on('click', 'polygons-layer', (e) => {
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
    nmap.value.on('mouseenter', 'lines-layer', () => {
      nmap.value.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    nmap.value.on('mouseleave', 'lines-layer', () => {
      nmap.value.getCanvas().style.cursor = '';
    });


    function addHomeButton(map) {
    class HomeButton {
      onAdd(map) {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.innerHTML = `<button>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M17 9.00195C19.175 9.01406 20.3529 9.11051 21.1213 9.8789C22 10.7576 22 12.1718 22 15.0002V16.0002C22 18.8286 22 20.2429 21.1213 21.1215C20.2426 22.0002 18.8284 22.0002 16 22.0002H8C5.17157 22.0002 3.75736 22.0002 2.87868 21.1215C2 20.2429 2 18.8286 2 16.0002L2 15.0002C2 12.1718 2 10.7576 2.87868 9.87889C3.64706 9.11051 4.82497 9.01406 7 9.00195" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> <path d="M12 15L12 2M12 2L15 5.5M12 2L9 5.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
		
  </button>`; div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => showUploadDialog.value = true);

        return div;
      }
    }
    const homeButton = new HomeButton();
    map.addControl(homeButton, "top-right");
  }
  addHomeButton(nmap.value)

  });


}


const showUploadDialog=ref(false)

const onClickTab = async (obj) => {
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

  } else {
    console.log('Disable Map')
    tabDisabled.value = true

  }
  if (obj.props.label != "Beneficiary") {
    beneficiaryTabDisabled.value = true
    tabDisabled.value = true

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
  //console.log('Get Beneficiaires', res)

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
getImplementationSponsors()



//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: '',
  geom: null,
  
})




const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model;
      console.log('before Updated', ruleForm);
      updateOneRecord(ruleForm)
        .then(() => {
          // Further logic after updating record
        })
        .catch(() => {
          // Error handling for updateOneRecord
        });
    } else {
      console.log('error in editing!', fields);
    }
  });
};


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






const editProject = async (data: TableSlotDefault) => {

  push({
    path: '/interventions/add/:domain',
    name: 'AddInterventionProjectsV2',
    query: { id: data.row.id },
    params: { id: data.row.id, domain: component_id.value }
  })


  // const formData = {}

  // formData.curUser = 1 // Id for logged in user
  // formData.model = 'project'
  // //-Search field--------------------------------------------
  // formData.searchField = 'name'
  // formData.searchKeyword = ''
  // //--Single Filter -----------------------------------------

  // //formData.assocModel = associated_Model

  // // - multiple filters -------------------------------------
  // formData.filters = ['id']
  // formData.filterValues = [[data.row.id]]
  // formData.associated_multiple_models = ['activity',]

  // //------------------------- 
  // //console.log(formData)
  // const res = await getSettlementListByCounty(formData)
  // console.log(res.data)
  // var project = res.data[0]


  // handleSelectCounty(project.county_id)
  // handleSelectSubCounty(project.subcounty_id)
  // handleSelectWard(project.ward_id)


  // showEditSaveButton.value = true

  // console.log(data)
  // ruleForm.id = project.id

  // ruleForm.location_level = project.location_level

  // ruleForm.title = project.title
  // ruleForm.programme_id = project.programme_id
  // ruleForm.status = project.status
  // ruleForm.domain_id = project.domain_id
  // ruleForm.category_id = project.category_id
  // tmp_domain.value = [project.component_id, project.category_id]
  // ruleForm.male_beneficiaries = project.male_beneficiaries
  // ruleForm.female_beneficiaries = project.female_beneficiaries
  // ruleForm.cost = project.cost
  // ruleForm.settlement_id = project.settlement_id
  // ruleForm.county_id = project.county_id
  // ruleForm.code = project.code
  // ruleForm.geom = project.geom
  // ruleForm.start_date = project.start_date
  // ruleForm.end_date = project.end_date

  // ruleForm.component_id = project.component_id
  // ruleForm.subcounty_id = project.subcounty_id
  // ruleForm.ward_id = project.ward_id


  // let activities = []
  // project.activities.forEach(function (arrayItem) {
  //   activities.push(arrayItem.id)
  // })

  // ruleForm.activities = activities



  // fileUploadList.value = project.documents


  // if (project.settlement_id) {
  //   showCountySettlement.value = true
  // }
  // if (project.county_id) {
  //   showCounty.value = true

  // }

  // console.log(project.domain_id)

  // AddDialogVisible.value = true


}



const AddDialogVisible = ref(false)


const DeleteProjectLocation = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = 'project_location'

  DeleteRecord(formData)


  // remove the deleted object from array list 
  let index = project_locations.value.indexOf(data);
  if (index !== -1) {
    project_locations.value.splice(index, 1);
  }

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
  // console.log('Row Styling --------->', data.row)
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
    console.log(tableDataList.value[i])
    thisRecord.index = i + 1
    thisRecord.title = tableDataList.value[i].title
    thisRecord.settlement = tableDataList.value[i].settlement ? tableDataList.value[i].settlement.name : ''
    thisRecord.county = tableDataList.value[i].county ? tableDataList.value[i].county.name : ''
    thisRecord.component = tableDataList.value[i].component.title
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
    label: "County/subcounty/ward/settlement",
    value: 2
  },
  // {
  //   label: "Settlement",
  //   value: 3
  // },

  // {
  //   label: "Other",
  //   value: 4
  // },
]

const showCounty = ref(false)
const showCountySettlement = ref(false)

const handleSelectLocation = async (location: any) => {
  if (location == 2) {
    // county 
    showCounty.value = true
    showCountySettlement.value = false
    ruleForm.county_id = null
    ruleForm.subcounty_id = null
    ruleForm.settlement_id = null
    ruleForm.ward_id = null
    ruleForm.geom = null

  }

  else {
    // National 
    showCounty.value = false
    showCountySettlement.value = false
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
  actionColumnWidth.value = "72px"
} else {
  dialogWidth.value = "28%"
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
      //  console.log(opt)
      activityOptions.value.push(opt)
    })

    console.log(activityOptions)

  })
}
getDocumentTypes()
getActivities()


const readJson = (event) => {
  console.log('Reading Josn file....', event)
  let str = event.target.result


  let json = JSON.parse(str)
  console.log('parsed', json.crs)

  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"

  // const sourceProj = '+proj=utm +zone=37 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null;

  if (crsProp && crsProp.includes('EPSG')) {
    console.log('The string contains the character "EPSG"');
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
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

    console.log('geometry', geometry)
    let geom = {
      type: json.features[0].geometry.type,
      coordinates: geometry.coordinates,
      crs: { type: 'name', properties: { name: 'EPSG:4326' } }

    }
    console.log(geom)
    ruleForm.geom = geom
  }

  console.log("ruleForm",ruleForm)

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

const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      console.log("Geo>", geojson)
      console.log("Geo>", geojson.length)
      console.log("Geo1>", geojson[0])


      if (geojson.length != 1) {
        ElMessage.warning('Please upload a file with only one feature. This one has ' + geojson.length + ' features')

      }
      else {
        console.log('ok>>', geojson[0])


        var crs = { type: 'name', properties: { name: 'EPSG:4326' } }

        let geomX = {
          type: geojson[0].geometry.type,
          coordinates: geojson[0].geometry.coordinates,
 
        }


        formData.geom = geomX

        geomScope.value = geomX
        map.value.getSource("scope").setData(geomScope.value);
        bounds.value = turf.bbox((geomScope.value))
        console.log("From SHP/KML", geomScope.value)
        //map.value.fitBounds(bounds.value, { padding: 20, maxZoom: 18 })
        calculateArea(geomX)
        loadMap()

      }


    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid files. Check your zipped file to contain (.shp, .dbf and .prj) or a proper kml/kmz')


    })

  //uploadPolygon(feat)
}

const subcountyfilteredOptions = ref([])
const settlementfilteredOptions = ref([])

const handleSelectCounty = async (county_id: any) => {
  console.log('County', county_id)


  // setup the subcounty options

  console.log(county_id)

  // Reset the subounty on changing the county 
  ruleForm.subcounty_id = null
  ruleForm.ward_id = null
  ruleForm.settlement_id = null

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


  // geom: { type: 'Polygon', coordinates: [ [Array] ] },


}




const wardFilteredOptions = ref([])

const handleSelectSubCounty = async (subcounty_id: any) => {
  console.log(subcounty_id)

  // Reset the subounty on changing the county 
  ruleForm.ward_id = null
  ruleForm.settlement_id = null

  if (subcounty_id) {
    selectedSubCounty.value = subcounty_id
    await getWardNames()
  }


  var subset = [];
  for (let i = 0; i < wardOptions.value.length; i++) {
    if (wardOptions.value[i].subcounty_id == subcounty_id) {
      subset.push(wardOptions.value[i]);
    }
  }
  console.log('wardsss', wardFilteredOptions)
  wardFilteredOptions.value = subset




}


const handleSelectWard = async (ward_id: any) => {
  console.log(ward_id)

  // Reset the subounty on changing the county 


  const formData = {}
  formData.model = 'ward'
  formData.id = ward_id

  console.log(formData)

  console.log('settlementOptionsV2', settlementOptionsV2)


  var subset = [];
  for (let i = 0; i < settlementOptionsV2.value.length; i++) {
    if (settlementOptionsV2.value[i].ward_id == ward_id) {
      subset.push(settlementOptionsV2.value[i]);
    }
  }
  console.log('settlementOptionsV2-filtered', subset)
  settlementfilteredOptions.value = subset


}



const selectedCounty = ref()
const selectedSubCounty = ref(null)


const search_string = ref()
const enableSubcounty = ref(false)

const subcountiesOptions = ref([])

const wardOptions = ref([])
const settlementOptionsFil = ref([])

const getWardNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'ward',
      searchField: 'subcounty_id',
      searchKeyword: selectedSubCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received Wards:', response)
    //tableDataList.value = response.data
    var ret = response.data
    wardOptions.value = []

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      opt.subcounty_id = arrayItem.subcounty_id

      wardOptions.value.push(opt)
    })
  })
}

const getSettlementNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'settlement',
      searchField: 'subcounty_id',
      searchKeyword: selectedSubCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received settls:', response)
    //tableDataList.value = response.data
    var ret = response.data
    settlementOptionsFil.value = []

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      settlementOptionsFil.value.push(opt)
    })
  })
}



const getSubCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'subcounty',
      searchField: 'county_id',
      searchKeyword: selectedCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received subcounties response:', response)
    //tableDataList.value = response.data
    var ret = response.data
    subcountiesOptions.value = []
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

const value6 = ref()
const value7 = ref()



const filterByProgramme = async (prog_id: any) => {

  value5.value = '' // clear the subcounty 
  value6.value = null   // clear the ward sr



  if (prog_id.length > 0) {
    filters.push('implementation_id')
    filterValues.push(prog_id)

    getFilteredData(filters, filterValues)
  } else {
    filters.splice(filters.indexOf('implementation_id'), 1);
    filterValues.splice(filterValues.indexOf(prog_id), 1);
    getFilteredData(filters, filterValues)
  }



}




const filterByCounty = async (county_id: any) => {

  if (county_id) {
    enableSubcounty.value = true   // allow selection of subcounty 
    selectedCounty.value = county_id
    getSubCountyNames()
  }

  value5.value = '' // clear the subcounty 
  value6.value = null   // clear the ward sr



  if (county_id.length > 0) {
    filters.push('county_id')
    filterValues.push(county_id)

    getFilteredData(filters, filterValues)
  } else {
    filters.splice(filters.indexOf('county_id'), 1);
    filterValues.splice(filterValues.indexOf(county_id), 1);
    getFilteredData(filters, filterValues)
  }



}

const filterBySubCounty = async (subcounty_id: any) => {

  value6.value = null   // clear the ward sr


  if (subcounty_id) {
    selectedSubCounty.value = subcounty_id
    getWardNames()
  }

  if (subcounty_id) {
    selectedSubCounty.value = subcounty_id
    getSettlementNames()
  }




  if (subcounty_id.length > 0) {
    filters.push('subcounty_id')
    filterValues.push(subcounty_id)

    getFilteredData(filters, filterValues)
  } else {
    filters.splice(filters.indexOf('subcounty_id'), 1);
    filterValues.splice(filterValues.indexOf(subcounty_id), 1);
    getFilteredData(filters, filterValues)
  }

}

const selectedWard = ref()
const filterByWard = async (ward_id: any) => {

  if (ward_id) {
    selectedWard.value = ward_id
    getSettlementNames()

  }


  if (ward_id.length > 0) {
    filters.push('ward_id')
    filterValues.push(ward_id)

    getFilteredData(filters, filterValues)
  } else {
    filters.splice(filters.indexOf('ward_id'), 1);
    filterValues.splice(filterValues.indexOf(ward_id), 1);
    getFilteredData(filters, filterValues)
  }
}


const selectedSettlement = ref()
const filterBySettlement = async (settlement_id: any) => {

  if (settlement_id) {
    selectedSettlement.value = settlement_id
    getSettlementNames()

  }




  if (settlement_id.length > 0) {
    filters.push('settlement_id')
    filterValues.push(settlement_id)

    getFilteredData(filters, filterValues)
  } else {
    filters.splice(filters.indexOf('settlement_id'), 1);
    filterValues.splice(filterValues.indexOf(settlement_id), 1);
    getFilteredData(filters, filterValues)
  }


}




/// Uplaod docuemnts from a central component 
const mfield = 'project_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
});



function toggleComponent(row) {
  console.log('Compnnent data', row)
  componentProps.value.data = row
  dynamicComponent.value = null; // Unload the component
  addMoreDocuments.value = true; // Set any additional props

  setTimeout(() => {
    dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds


}


// component for docuemnts 
const rowData = ref()
const documentComponent = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'));
const dynamicDocumentComponent = ref();
const DocumentComponentProps = ref({
  message: 'documents',
  data: rowData.value,
  docmodel: model,

});

const project_locations = ref([])
 
const getProjectLocations = async (project_id) => {
  console.log('project_id', project_id);

  // Get the project settlement ids
  const formData = {
    model: 'project_location',
    searchField: 'name',
    searchKeyword: '',
    filters: ['project_id'],
    filterValues: [[project_id]],
    associated_multiple_models: []
  };

  const res = await getSettlementListByCounty(formData);
  const sett_ids = res.data.map(item => item.settlement_id); // Extract settlement_id
  console.log('sett_ids', sett_ids);

  // Fetch settlements and their details
  const form = {
    model: 'settlement',
    filters: ['id'],
    filterValues: [sett_ids],
    excludeGeom: true,
    associated_multiple_models: ['county', 'subcounty', 'ward']
  };

  const setts = await getSettlementListByCounty(form);
  console.log('setts', setts);

  // Map settlements to include additional details
  const settlements = setts.data.map(item => ({
    county: item.county.name,
    subcounty: item.subcounty.name,
    ward: item.ward.name,
    settlement: item.name,
    settlement_id: item.id
  }));

  // Join project locations with settlement details based on settlement_id
  project_locations.value = res.data.map(projectLocation => {
    const settlement = settlements.find(sett => sett.settlement_id === projectLocation.settlement_id);
    return {
      ...projectLocation,
      county: settlement ? settlement.county : null,
      subcounty: settlement ? settlement.subcounty : null,
      ward: settlement ? settlement.ward : null,
      settlementName: settlement ? settlement.settlement : null
    };
  });

 
  console.log('project_locations', project_locations);
};


const project_id =ref()
const expandedRow = ref(null);



function handleExpand(row) {

  // get the locations 
  getProjectLocations(row.id)
  project_id.value=row.id



   // toggle collapes
   if (expandedRow.value) {
             tableRef.value.toggleRowExpansion(expandedRow.value, false); // Collapse the previously expanded row
        console.log('tableRef.value.value',expandedRow.value )
        expandedRow.value = row; // Update the expanded row

      }
      else {
        tableRef.value.toggleRowExpansion(row, true); // Expand the current row
        expandedRow.value = row; // Update the expanded row
      }


  /// Documents
  dynamicDocumentComponent.value = null; // Unload the component
  rowData.value = row
  DocumentComponentProps.value.data = row
  setTimeout(() => {
    dynamicDocumentComponent.value = documentComponent; // Load the component
  }, 100); // 0.1 seconds
}



//// Module foe adding benefiicair

const AddBeneficiaryDialogVisible = ref(false)
const disableBeneficiaryInputs = ref(false)
const AddBeneficiary = () => {
  // console.log("Adding Beneficiary")
  // push({
  //   path: '/settlement/beneficiary',
  //   name: 'InterventionBeneficiary',
  // })
  AddBeneficiaryDialogVisible.value = true
}

const BeneficaryFormRef = ref<FormInstance>()
const BeneficaryForm = reactive({
  hh_id: '',
  project_id: '',
  settlement_id: '',
  county_id: '',
  component_id: component_id.value,
  code: '',
})


const projectOptions = ref([])
const settlementHHoptions = ref([])

const getSettlementProjects = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 1000,
      curUser: 1, // Id for logged in user
      model: 'project',
      searchField: 'settlement_id',
      searchKeyword: BeneficaryForm.settlement_id,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received proejcts :', response)
    //tableDataList.value = response.data
    var ret = response.data
    projectOptions.value = []

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      // opt.subcounty_id = arrayItem.subcounty_id

      projectOptions.value.push(opt)
    })
  })

  // get households within those settleemnts
  // Get Households 
  const formData = {}
  formData.limit = 1000// 
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = 'households'

  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = ['settlement_id']
  formData.filterValues = [[BeneficaryForm.settlement_id]]
  formData.associated_multiple_models = []

  //-------------------------
  console.log(formData)
  const hh_res = await getFilteredHouseholdsBykeyword(formData)
    .then((response) => {
      console.log('Received HHs :', response)
      //tableDataList.value = response.data
      var ret = response.data
      settlementHHoptions.value = []

      loading.value = false

      ret.forEach(function (arrayItem: { id: string; type: string }) {
        var opt = {}
        opt.value = arrayItem.id
        opt.label = arrayItem.name + '(' + arrayItem.id + ')'
        //  console.log(countyOpt)
        // opt.subcounty_id = arrayItem.subcounty_id

        settlementHHoptions.value.push(opt)
      })
    })

}

const submitBeneficiaryForm = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      BeneficaryForm.model = 'beneficiary';
      BeneficaryForm.code = uuid.v4();


      BeneficaryForm.hh_id.forEach(function (arrayItem) {

        var household = BeneficaryForm
        household.hh_id = arrayItem
        const res = CreateRecord(household);

        console.log('res', res);
      })




      // Adjust the timeout value as needed
    } else {
      console.log('error submit!', fields);
    }
  });
};



const thisProject = ref([])
const getThisProject = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 1000,
      curUser: 1, // Id for logged in user
      model: 'project',
      searchField: 'id',
      searchKeyword: selected_project.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received proejcts :', response)
    //tableDataList.value = response.data
    var ret = response.data
    projectOptions.value = []
    loading.value = false
    thisProject.value = response.data
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'
      projectOptions.value.push(opt)
    })

  })

  console.log(res)
  // return res


}

const AddBeneficiaryFromWithin = async () => {
  console.log(selected_project.value)
  await getThisProject()
  console.log(thisProject.value)

  BeneficaryForm.project_id = thisProject.value[0].id
  BeneficaryForm.settlement_id = thisProject.value[0].settlement_id
  BeneficaryForm.county_id = thisProject.value[0].county_id
  BeneficaryForm.component_id = thisProject.value[0].component_id

  handleSelectCounty(thisProject.value[0].county_id) // this will populate the subcounty widnoe
  console.log(BeneficaryForm)
  getSettlementProjects()
  disableBeneficiaryInputs.value = true
  AddBeneficiaryDialogVisible.value = true

}

const loadPreview = async () => {

  console.log('Preview ----')
  nmap.value.addSource('preview', {
      type: 'geojson',
      data: ruleForm.geom,
       
    });

  nmap.value.addLayer({
      'id': 'preview',
      'type': 'line',
      'source': 'preview',
      'layout': {},
      'paint': {
        'line-color': 'purple',
        'line-width': 2
      }
    });

    var localBounds = turf.bbox((ruleForm.geom));
    console.log(localBounds)

    if (localBounds) {
      if (localBounds[0] == localBounds[2]) {
        // for points where the extent x1=x2
        nmap.value.fitBounds(localBounds, { maxZoom: 15, padding: 20 });
      } else {
        nmap.value.fitBounds(localBounds, { padding: 20 });

      }
    }

    nmap.value.resize()
}

const UpdateLocationGeom = async () => {

  ruleForm.model = 'project_location'
  updateOneRecord(ruleForm)
  showUploadDialog.value=false

}

const fileList = ref([])


const sett_options =ref([])
const extra_locations =ref()


const remoteMethod = async (keyword) => {
  console.log(keyword)
  const formData = {}
  formData.model = 'settlement'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = keyword
  formData.excludeGeom = false
  formData.associated_multiple_models = ['county', 'subcounty', 'ward']

  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData",formData)
  const res = await searchByKeyWord(formData)
  
  console.log("res.data",res.data)

  if(res.data && res.data.length>0){
    sett_options.value= res.data.map(item => ({
    value: item.id,
    settlement_id: item.id,
    label: item.name,
    county: item.county.name,
    subcounty: item.subcounty.name,
    ward: item.ward.name,
    ward_id: item.ward.id,
    subcounty_id: item.subcounty.id,
    county_id: item.county.id,
    geom: item.geom
  }));

  }

 
  console.log('sett_options.value',sett_options.value)

}


const AddLocation = async () => {

 
//console.log('deleted_locations',deleted_locations)
var form = {}
form.model = 'project_location'

console.log('project_id',project_id.value)
console.log('locations',extra_locations.value)

// fist check if theres any proehct with this id exists then delete all

const location_objects = [];

for (let i = 0; i < extra_locations.value.length; i++) {
  console.log(extra_locations.value[i])
  let obj = {}
  obj.project_id=project_id.value
  obj.settlement_id=extra_locations.value[i].settlement_id
  obj.ward_id=extra_locations.value[i].ward_id
  obj.subcounty_id=extra_locations.value[i].subcounty_id
  obj.county_id=extra_locations.value[i].county_id
  obj.location_type= 'settlement'
  obj.geom= extra_locations.value[i].geom
   location_objects.push(obj)
  console.log('obj',obj)
}

form.data = location_objects
console.log('formData',form)

const loc_res = await BatchImportUpsert(form)
console.log('loc_res',loc_res)

// 
getProjectLocations(project_id.value)
// Empty the locations and 
extra_locations.value=[]
sett_options.value=[]
}

const ShowLocationAddDialog =ref(false)


const handleCloseAdd = () => { 
  ShowLocationAddDialog.value=false
}
const tableRef = ref(null);

const searchKey = ref('')
 
// Define the computed property
const project_locations_filtered = computed(() => {
  const searchValue = searchKey.value.toLowerCase();
  
  // Log current project_locations value
  console.log(project_locations.value);

  return project_locations.value.filter(data => {
    // Ensure all fields are checked and filtered
    const matchesSettlementName = data.settlementName.toLowerCase().includes(searchValue);
    const matchesCounty = data.county.toLowerCase().includes(searchValue);
    const matchesSubcounty = data.subcounty.toLowerCase().includes(searchValue);
    
    return !searchValue || matchesSettlementName || matchesCounty || matchesSubcounty;
  });
});


</script>

<template>
  <ContentWrap :title="page_title" :message="t(' The list of intervention beneficiaries. Use the filters to subset')">

    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>

    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">
      <!-- Title Search -->
      <el-select v-model="value3" multiple clearable filterable remote :remote-method="searchByName" reserve-keyword
        placeholder="Search by Title" style="width: 150px; margin-right: 10px;" />

      <!-- Programme Filter -->
      <el-select size="default" v-model="value40" @change="filterByProgramme" @clear="handleClear" multiple clearable
        filterable collapse-tags placeholder="By Programme" style="width: 150px; margin-right: 10px;">
        <el-option v-for="item in implementationOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>


      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">
        <el-tooltip content="Add Project" placement="top">
          <el-button @click="AddProject" type="primary" :icon="Plus" />
        </el-tooltip>
        <el-tooltip content="Add Beneficiary" placement="top">
          <el-button @click="AddBeneficiary" type="primary" :icon="User" />
        </el-tooltip>
        <el-tooltip content="Download" placement="top">
          <el-button @click="DownloadXlsx" type="primary" :icon="Download" />
        </el-tooltip>
      </div>

      <!-- Download All Component -->
      <DownloadAll v-if="showEditButtons" :model="model" :associated_models="associated_multiple_models" />
    </el-row>


    <el-tabs @tab-click="onClickTab" v-model="activeName" type="border-card" style="width: 100%; margin-top: 5px;">
      <el-tab-pane label="Interventions" name="list">
        <el-table ref="tableRef" row-key="id" :data="tableDataList" style="width: 100%; margin-top: 10px;" border
          :row-class-name="tableRowClassName" stripe flexible @expand-change="handleExpand">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <el-tabs tab-position="left" class="demo-tabs">
                  <el-tab-pane label="Locations">
                    <el-table :data="project_locations_filtered" height="350" stripe>
                      <el-table-column type="index" />
                      <el-table-column prop="county" label="County" width="180" />
                      <el-table-column prop="subcounty" label="Subcounty" width="180" />
                      <el-table-column prop="settlementName" label="Settlement" />
                      <el-table-column  width="50" >
                        <template #header>
                          <el-tooltip content="Add Location" placement="top">
                          <el-button size="small" @click="ShowLocationAddDialog=true" type="secondary" :icon="Plus" circle />
                        </el-tooltip>
                        </template>
                      </el-table-column>

                      <el-table-column fixed="right" label="Operations" :width="actionColumnWidth">
                  <template #header>
                          <el-input v-model="searchKey" size="small" placeholder="Filter Location" />
                        </template>
                        <template #default="scope">
                          <el-tooltip content="View on Map" placement="top">
                            <el-button type="secondary" size="small" :icon="Position"
                              @click="flyTo(scope as TableSlotDefault)" circle />
                          </el-tooltip>

                          <el-tooltip content="Delete" placement="top">
                            <el-popconfirm confirm-button-text="Yes" width="220" cancel-button-text="No"
                              :icon="InfoFilled" icon-color="#626AEF"
                              title="Are you sure to delete this project location?"
                              @confirm="DeleteProjectLocation(scope.row as TableSlotDefault)">
                              <template #reference>
                                <el-button size="small" v-if="showAdminButtons" type="secondary" :icon=Delete circle />
                              </template>
                            </el-popconfirm>
                          </el-tooltip>

                        </template>
                      </el-table-column>

                    </el-table>


                  </el-tab-pane>


                  <el-tab-pane label="Documents">
                    <div>
                      <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
                    </div>
                    <el-button style="margin-left: 10px;margin-top: 2px" size="small" v-if="showEditButtons"
                      type="success" :icon="Plus" circle @click="toggleComponent(props.row)" />
                  </el-tab-pane>
                </el-tabs>


              </div>
            </template>
          </el-table-column>
          <el-table-column label="Project Title" prop="title" width="650" resizable sortable />
          <!-- <el-table-column label="County" prop="county.name" width="120" sortable /> -->
          <!-- <el-table-column label="Settlement" prop="settlement.name" sortable /> -->
          <el-table-column label="Programme" prop="programme.acronym" width="130" sortable />
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
                    <el-dropdown-item v-if="showAdminButtons" @click="viewBen(scope as TableSlotDefault)"
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

                <el-tooltip content="View Households" placement="top">
                  <el-button v-if="showAdminButtons" type="success" size="small" :icon="User"
                    @click="viewBen(scope as TableSlotDefault)" circle />
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
          v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 100]" :total="total" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
      </el-tab-pane>
      <el-tab-pane v-if="showAdminButtons" :label="beneficiaryTabTitle" name="Beneficiary"
        :disabled="beneficiaryTabDisabled">
        <Table :columns="BeneficiaryColumns" :data="beneficiaryList" :loading="loadingBeneficiaries" :selection="true"
          :pageSize="pageSizeBen" :currentPage="currentPageBen" />

        <el-tooltip content="Add Beneficiary" placement="top">
          <el-button style="margin-left: 10px; margin-top: 2px" v-if="showEditButtons" type="success" circle
            @click="AddBeneficiaryFromWithin()">
            <Icon icon="octicon:person-add-24" />
          </el-button>
        </el-tooltip>



        <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPageBen="currentPageBen"
          v-model:page-size="pageSizeBen" :page-sizes="[5, 10, 20, 50, 100]" :total="totalBen" :background="true"
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
        <el-form-item v-if=showCounty label="County" prop="county_id">
          <el-select v-model="ruleForm.county_id" filterable placeholder="Select County" @change="handleSelectCounty">
            <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if=showCountySettlement label="Sub County" prop="subcounty_id">
          <el-select v-model="ruleForm.subcounty_id" filterable placeholder="Sub County"
            :onChange="handleSelectSubCounty">
            <el-option v-for="item in subcountyfilteredOptions" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item v-if=showCountySettlement label="Ward" prop="ward_id">
          <el-select v-model="ruleForm.ward_id" filterable placeholder="Ward" :onChange="handleSelectWard">
            <el-option v-for="item in wardFilteredOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if=showCountySettlement label="Settlement" prop="settlement_id">
          <el-select v-model="ruleForm.settlement_id" filterable placeholder="Select Settlement">
            <el-option v-for="item in settlementfilteredOptions" :key="item.value" :label="item.label"
              :value="item.value" />
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
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="AddDialogVisible = false">Cancel</el-button>
          <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>

        </span>
      </template>
    </el-dialog>


    <el-dialog v-model="AddBeneficiaryDialogVisible" @close="handleClose" title="Add Beneficiary" :width="dialogWidth"
      draggable>
      <el-form ref="BeneficaryFormRef" :model="BeneficaryForm" :rules="rules" label-width="120px">

        <el-form-item label="County" prop="hh_id">
          <el-select v-model="BeneficaryForm.county_id" filterable placeholder="Select"
            :disabled="disableBeneficiaryInputs" :onChange="handleSelectCounty">
            <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Settlement" prop="hh_id">
          <el-select v-model="BeneficaryForm.settlement_id" filterable :disabled="disableBeneficiaryInputs"
            placeholder="Select" :onChange="getSettlementProjects">
            <el-option v-for="item in settlementfilteredOptions" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>



        <el-form-item label="Project" prop="project_id">
          <el-select v-model="BeneficaryForm.project_id" filterable placeholder="Select" :onChange="handleSelectProject"
            :disabled="disableBeneficiaryInputs">
            <el-option v-for="item in projectOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>



        <el-form-item label="Beneficiary" prop="hh_id">
          <el-select v-model="BeneficaryForm.hh_id" multiple filterable placeholder="Select">
            <el-option v-for="item in settlementHHoptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>



      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="AddBeneficiaryDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="submitBeneficiaryForm(BeneficaryFormRef)">Submit</el-button>

        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showUploadDialog" title="Upload a Zipped Shapefile/Geojson/KML/KMZ" width="30%" draggable>

      <el-upload v-model:file-list="fileList" class="upload-demo" drag
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :auto-upload="false"
        :show-file-list="false" :on-change="handleUploadGeo">
        <template #trigger>
          <el-button type="primary">
            <Icon icon="icon-park-outline:upload-one" width="24" />

            {{ fileList.length > 0 ? fileList[0].name : ' Select file' }}
          </el-button>

        </template>
      </el-upload>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="loadMap">Cancel</el-button>
          <el-button type="primary" @click="loadPreview">Preview</el-button>
          <el-button type="success" @click="UpdateLocationGeom">
            Update
          </el-button>
        </div>
      </template>
    </el-dialog>


    <el-dialog v-model="ShowLocationAddDialog" title="Add Project Location" width="500" :before-close="handleCloseAdd">
      <el-select id="location-select" v-model="extra_locations" multiple filterable remote reserve-keyword
        placeholder=" Search Settlements" :remote-method="remoteMethod" style="width: 85%">
        <el-option v-for="item in sett_options" :key="item.id" :label="item.label" :value="item">
          <div style="display: flex; align-items: center;">
            <span style="flex: 1; text-align: left;">{{ item.label }}</span>
            <span style="
                                    flex: 2;
                                    color: var(--el-text-color-secondary);
                                    font-size: 13px;
                                    text-align: right;
                                  ">
              {{ item.ward }}, {{ item.subcounty }}, {{ item.county }}
            </span>
          </div>
        </el-option>
      </el-select>
      <el-tooltip content="Save" placement="top">
        <el-button :onClick="AddLocation" style="margin-left :10px;" type="primary">
          <Icon icon="ic:round-save" style=" color: white" size="48" />
        </el-button>


      </el-tooltip>

    </el-dialog>


  </ContentWrap>
</template>

<style scoped>
.basemap {
  width: 100%;
  height: 75vh;
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