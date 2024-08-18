<script setup lang="ts">
import { getSettlementListByCounty, getRoutesList } from '@/api/settlements'

import {
  ElButton, ElSelect, ElTabs, ElTabPane, ElDialog, ElCard,
  ElInput, ElBadge, ElUpload, ElDropdown, ElDropdownItem, ElDropdownMenu, ElPopconfirm, ElTable, ElTableColumn
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Position, Plus, Download, Delete, Edit, InfoFilled, UploadFilled, Back } from '@element-plus/icons-vue'

import { ref, reactive, } from 'vue'
import { ElPagination, ElTooltip, ElOption ,} from 'element-plus'
import { useRouter } from 'vue-router'
import { DeleteRecord, updateOneRecord, deleteDocument, BatchImportUpsert, getfilteredGeo,DeleteRecordByCriteria } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { Icon } from '@iconify/vue';

import xlsx from "json-as-xlsx"
import {
  searchByKeyWord
} from '@/api/settlements'
import { useRoute } from 'vue-router'
import moment from "moment";
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import proj4 from 'proj4';
import { getModelSpecs } from '@/api/fields'

import {
  implementationOptions
} from './common/index.ts'

 

import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';
import { onMounted } from 'vue';


////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'

import { computed, watch } from 'vue'

import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'

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


const router = useRouter()


const goBack = () => {
  // Add your logic to handle the back action
  // For example, you can use Vue Router to navigate back
  if (router) {
    // Use router.back() to navigate back
    router.back()
  } else {
    console.warn('Router instance not available.')
  }

}

const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 3;
const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

// Set up event listener on mount
onMounted(() => {
  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check
});




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


const page = ref(1)

const selCounties = []
const loading = ref(true)

const currentPage = ref(1)

const pageBen = ref(1)
const pSizeBen = ref(5)

const total = ref(0)
const totalBen = ref(0)
const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)
const formheader = ref('Edit Project')


const uploadDialog = ref(false)
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
const associated_multiple_models = ['component', 'activity', 'programme_implementation', 'document']
//const nested_models = ['component', 'programme'] // The mother, then followed by the child
const nested_models = ['document', 'document_type'] // The mother, then followed by the child


//// ------------------parameters -----------------------////

const facilityGeo = ref([])
const facilityGeoPoints = ref()
const facilityGeoLines = ref([])
const facilityGeoPolygons = ref([])
const projectScopeGeo = ref([])
const geoLoaded = ref(false)

 

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

  pageSize.value = 5
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
  pageSize.value = size
  if (searchString.value) {

    getFilteredBySearchData(searchString.value)

  } else {
    getFilteredData(filters, filterValues)
  }

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
  formData.limit = pageSize.value
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
    ruleForm.id = data.row.id
    console.log(bounds.value)







    activeName.value = 'Map' // Navigate to Beneficiary Tab

    loadMap()



  }




}

const nmap = ref()
const loadMap = () => {

  // Add a delay of 1 second (1000 milliseconds) to wait for div
  setTimeout(() => {
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
          onAdd() {
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

  }, 50); // 1000 milliseconds = 1 second
}


const showUploadDialog = ref(false)
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
  formData.limit = pageSize.value
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
 


//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleForm = reactive({
  id: '',
  geom: null,

})











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


const DeleteProjectActivity = (data: TableSlotDefault) => {
  console.log('--DeleteProjectActivity--->', data)
  let formData = {}
  formData.criteria = data.project_activity
  formData.model = 'project_activity'

 console.log(formData)

  DeleteRecordByCriteria(formData)


  // remove the deleted object from array list 
  let index = project_activities.value.indexOf(data);
  if (index !== -1) {
    project_activities.value.splice(index, 1);
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




const showCounty = ref(false)
const showCountySettlement = ref(false)


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







const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "72px"
} else {
  dialogWidth.value = "28%"
  actionColumnWidth.value = "100px"

}

 
const getDocumentTypes = async () => {
}


//id","name","county_id","settlement_type","geom","area","population","code","description"
const activityOptions = ref([])
 
getDocumentTypes()
 


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

  console.log("ruleForm", ruleForm)

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





const wardFilteredOptions = ref([])






const selectedSubCounty = ref(null)




const wardOptions = ref([])

const getWardNames = async () => {
}





const value6 = ref()



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

const locations_loading =ref(false)
const project_locations = ref([])

const getProjectLocations = async (project_id) => {
  console.log('project_id', project_id);

  locations_loading.value=true
  project_locations.value=[]   // Emoty current locations first
  

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

  locations_loading.value=false
  console.log('project_locations', project_locations);
};


const project_id = ref()
const expandedRow = ref(null);
const project_activities = ref(null);



async function handleExpand(row) {

  console.log("On Expand : Project ID", row.id )
  // get the locations 
  // locations_loading.value=true
  // project_locations.value=[]   // Emoty current locations first
  

  getProjectLocations(row.id)
  project_id.value = row.id

  project_activities.value=row.activities

  // toggle collapes
  if (expandedRow.value) {
    tableRef.value.toggleRowExpansion(expandedRow.value, false); // Collapse the previously expanded row
    console.log('tableRef.value.value', expandedRow.value)
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

const BeneficaryForm = reactive({
  hh_id: '',
  project_id: '',
  settlement_id: '',
  county_id: '',
  component_id: component_id.value,
  code: '',
})


const projectOptions = ref([])





const thisProject = ref([])


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
  showUploadDialog.value = false

}

const fileList = ref([])


const sett_options = ref([])
const extra_locations = ref()
 
 


const remoteMethod = async (keyword) => {
  console.log(keyword)
  loading.value=true
  const formData = {}
  formData.model = 'settlement'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = keyword
  formData.excludeGeom = false
  formData.excludeGeomAssoc = true
  formData.associated_multiple_models = ['county', 'subcounty', 'ward']

  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  const res = await searchByKeyWord(formData)

  console.log("res.data", res.data)

  if (res.data && res.data.length > 0) {
    sett_options.value = res.data.map(item => ({
      value: item.id,
      settlement_id: item.id,
      label: item.name,
      name: item.name,
      county: item.county.name,
      subcounty: item.subcounty.name,
      ward: item.ward.name,
      ward_id: item.ward.id,
      subcounty_id: item.subcounty.id,
      county_id: item.county.id,
      geom: item.geom
    }));

  }
  loading.value = false

}

 
const getActivities = async (keyword) => {
  console.log(keyword, project_id.value)
  const formData = {}
  formData.model = 'activity'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = keyword
  formData.excludeGeom = false
  formData.associated_multiple_models = []

  //--Single Filter -----------------------------------------
 

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  const res = await searchByKeyWord(formData)

  console.log("res.data", res.data)

  if (res.data && res.data.length > 0) {
    activityOptions.value = res.data.map(item => ({
      value: item.id,
      label: item.title,
      code: item.code,
      project_id:project_id.value
      
    }));

  }


  console.log('sett_options.value', sett_options.value)

}

const AddLocation = async () => {

  //console.log('deleted_locations',deleted_locations)
  var form = {}
  form.model = 'project_location'

  console.log('project_id', project_id.value)
  console.log('locations', extra_locations.value)

  // fist check if theres any proehct with this id exists then delete all

  const location_objects = [];

  for (let i = 0; i < extra_locations.value.length; i++) {
    console.log(extra_locations.value[i])
    let obj = {}
    obj.project_id = project_id.value
    obj.settlement_id = extra_locations.value[i].settlement_id
    obj.ward_id = extra_locations.value[i].ward_id
    obj.subcounty_id = extra_locations.value[i].subcounty_id
    obj.county_id = extra_locations.value[i].county_id
    obj.location_type = 'settlement'
    obj.location_name = extra_locations.value[i].name
    obj.geom = extra_locations.value[i].geom
    location_objects.push(obj)
    console.log('obj', obj)
  }

  form.data = location_objects
  console.log('formData', form)

  const loc_res = await BatchImportUpsert(form)
  console.log('loc_res', loc_res)

  // 
  getProjectLocations(project_id.value)
  // Empty the locations and 
  extra_locations.value = []
  sett_options.value = []
}

const AddActivity = async () => {

//console.log('deleted_locations',deleted_locations)
var form = {}
form.model = 'project_activity'

console.log('project_id', project_id.value)
console.log('locations', extra_activities.value)

// fist check if theres any proehct with this id exists then delete all

const activity_objects = [];

for (let i = 0; i < extra_activities.value.length; i++) {
  console.log(extra_activities.value[i])
  let obj = {}
  obj.project_id = extra_activities.value[i].project_id
  obj.activity_id = extra_activities.value[i].value
  obj.title = extra_activities.value[i].label
 
 
  activity_objects.push(obj)
  console.log('obj', obj)
}

form.data = activity_objects
console.log('formData', form)

 const loc_res = await BatchImportUpsert(form)
 console.log('loc_res', loc_res)
 
 project_activities.value.push(...activity_objects);

 console.log('project_activities', project_activities.value)
// 
//getProjectLocations(project_id.value)
// Empty the locations and 
//extra_locations.value = []
//sett_options.value = []
}


const ShowLocationAddDialog = ref(false)
const ShowActivityAddDialog = ref(false)
const extra_activities = ref([])


const handleCloseAdd = () => {
  ShowLocationAddDialog.value = false
  ShowActivityAddDialog.value=false
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

const searchKeyActivity = ref('')


// Define the computed property
const project_activities_filtered = computed(() => {
  const searchValue = searchKeyActivity.value.toLowerCase();
  // Log current project_locations value
  return project_activities.value.filter(data => {
    // Ensure all fields are checked and filtered
    const matchesTitle = data.title.toLowerCase().includes(searchValue);
    return !searchValue || matchesTitle ;
  });
});









const field_set = ref([])
const uploadData = async () => {
  uploadDialog.value = true
  console.log('Uploading data.......')
  var formData = {}
  formData.model = 'project'
  await getModelSpecs(formData).then((response) => {
    console.log(response.data)
    field_set.value = response.data
  })

}





const handleDownload = async () => {

  const data = field_set.value
  const fileName = 'project_template'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}



const handleCsvUpload = async (file) => {

  if (file.raw) {
    parseCSV(file.raw);
  }
}

const parsedData = ref([])

const parseCSV = async (file) => {
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (result) => {
      parsedData.value = result.data;

      console.log('parsedData.value', parsedData.value)
      ImportProjects()
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
    },
  });
}




function convertStringArraysToProperArrays(data) {
  return data.map(item => {
    const newItem = { ...item }; // Create a shallow copy of the object

    for (const key in newItem) {
      if (newItem.hasOwnProperty(key)) {
        const value = newItem[key];

        // Check if the value is a string and can be parsed as an array
        if (typeof value === 'string') {
          try {
            const parsedValue = JSON.parse(value);

            if (Array.isArray(parsedValue)) {
              newItem[key] = parsedValue;
            }
          } catch (e) {
            // Handle any JSON parsing errors
            console.error(`Error parsing string to array for key ${key}:`, e);
          }
        }
      }
    }

    return newItem;
  });
}


const ImportProjects = async () => {

  //console.log('deleted_locations',deleted_locations)
  var form = {}
  form.model = 'project'

  const dta = convertStringArraysToProperArrays(parsedData.value)
  console.log('dta', dta)


  form.data = dta
  console.log('formData', form)

  const results = await BatchImportUpsert(form)

  console.log('BatchImportUpsert', results.insertedDocuments)


  // const save_projects = results.insertedDocuments
  // const combinedData = parsedData.value.map(item1 => {
  //   // Find the matching item in array2
  //   const item2 = save_projects.find(item => item.code == item1.code);

  //   // Return a new object with the combined properties
  //   return {
  //     id: item2.id,
  //     locations: item1 ? item1.locations : [] // Add locations if found, otherwise an empty array
  //   };
  // });


  //   const extractedData = combinedData.map(item => ({
  //     id: item.id,
  //     locations: item.locations
  //   }));


  //   extractedData.forEach(item => {
  //     project_id.value = item.id 
  //     extra_locations.value=item.locations

  //     console.log('item.locations',item.id, item.locations)
  //      AddLocation();
  //   });

  // // 

}


</script>

<template>
  <el-card>


    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>

    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>

      <!-- Title Search -->
      <el-select
v-model="value3" multiple clearable filterable remote :remote-method="searchByName" reserve-keyword
        placeholder="Search by Title" style="width: 150px; margin-right: 10px;" />
 
      <el-select
size="default" v-model="value40" @change="filterByProgramme" @clear="handleClear" multiple clearable
        filterable collapse-tags placeholder="By Programme" style="width: 150px; margin-right: 10px;">
        <el-option v-for="item in implementationOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>


      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">

        <el-tooltip content="Import Data" placement="top">
          <el-button @click="uploadData" type="primary" :icon="UploadFilled" />
        </el-tooltip>

        <el-tooltip content="Add Project" placement="top">
          <el-button @click="AddProject" type="primary" :icon="Plus" />
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
        <el-table
ref="tableRef" row-key="id" :data="tableDataList" style="width: 100%; margin-top: 10px;" border
          :row-class-name="tableRowClassName" flexible @expand-change="handleExpand">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <el-tabs tab-position="top" class="demo-tabs">
                  <el-tab-pane >
                    <template #label>
                        <el-badge  style="margin-left: 10px;" :value="project_locations_filtered.length" type="warning" class="item" :offset="[10, 5]"> 
                          Locations
                        </el-badge>
                      </template>
  
                    <el-table :data="project_locations_filtered" height="250"  v-loading="locations_loading"  stripe>
                      <el-table-column type="index" />
                      <el-table-column prop="county" label="County" />
                      <el-table-column prop="subcounty" label="Subcounty" />
                      <el-table-column prop="settlementName" label="Settlement" />
                      <el-table-column width="50">
                        <template #header>
                          <el-tooltip content="Add Location" placement="top">
                            <el-button
size="small" @click="ShowLocationAddDialog = true" type="secondary" :icon="Plus"
                              circle />
                          </el-tooltip>
                        </template>
                      </el-table-column>
                      <el-table-column label="Operations">
                        <template #header>
                          <el-input v-model="searchKey" size="small" placeholder="Filter" />
                        </template>
                        <template #default="scope">
                          <el-tooltip content="View on Map" placement="top">
                            <el-button
type="secondary" size="small" :icon="Position"
                              @click="flyTo(scope as TableSlotDefault)" circle />
                          </el-tooltip>
                          <el-tooltip content="Delete" placement="top">
                            <el-popconfirm
confirm-button-text="Yes" width="340" cancel-button-text="No"
                              :icon="InfoFilled" icon-color="#626AEF"
                              title="Are you sure to delete this project location?"
                              @confirm="DeleteProjectLocation(scope.row as TableSlotDefault)">
                              <template #reference>
                                <el-button size="small" v-if="showAdminButtons" type="danger" :icon=Delete plain />
                              </template>
                            </el-popconfirm>
                          </el-tooltip>
                        </template>
                      </el-table-column>
                    </el-table>

                  </el-tab-pane>
                  <el-tab-pane label="Activities">
                    <el-table :data="project_activities_filtered" height="250" stripe>
                      <el-table-column type="index" />
                      <el-table-column prop="title" label="Activity" />
 
                      <el-table-column width="50">
                        <template #header>
                          <el-tooltip content="Add Activity" placement="top">
                            <el-button
size="small" @click="ShowActivityAddDialog = true" type="secondary" :icon="Plus"
                              circle />
                          </el-tooltip>
                        </template>
                      </el-table-column>
                      <el-table-column label="Operations">
                        <template #header>
                          <el-input v-model="searchKeyActivity" size="small" placeholder="Filter" />
                        </template>
                        <template #default="scope">
                <el-tooltip content="Delete" placement="top">
                            <el-popconfirm
              confirm-button-text="Yes" width="340" cancel-button-text="No"
                              :icon="InfoFilled" icon-color="#626AEF"
                              title="Are you sure to delete this project activity?"
                              @confirm="DeleteProjectActivity(scope.row as TableSlotDefault)">
                              <template #reference>
                                <el-button size="small" v-if="showAdminButtons" type="danger" :icon=Delete plain />
                              </template>
                            </el-popconfirm>
                          </el-tooltip>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-tab-pane>
                  <el-tab-pane >

                    <template #label>
                        <el-badge :value="props.row.documents.length" class="item" :offset="[10, 5]"> 
                          Documents
                        </el-badge>
                      </template>
                    <div>
                
                
             <div>
              <list-documents
:is="dynamicDocumentComponent" v-bind="DocumentComponentProps"
                @openDialog="toggleComponent(props.row)" />
            </div>
                    </div>
               
                  </el-tab-pane>
                </el-tabs>


              </div>
            </template>
          </el-table-column>
          <el-table-column label="Project Title" prop="title" width="650" resizable sortable />
 
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
                    <el-dropdown-item
v-if="showAdminButtons" @click="editProject(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>

                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteProject(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-else>
                <el-tooltip v-if="showAdminButtons" content="Edit" placement="top">
                  <el-button
type="success" size="small" :icon="Edit" @click="editProject(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>


                <el-tooltip content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" width="340" cancel-button-text="No" :icon="InfoFilled"
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

        <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
          v-model:page-size="pageSize" :page-sizes="[3, 5, 10, 20, 50, 100]" :total="total" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
      </el-tab-pane>




      <el-tab-pane label="Map" name="Map" :disabled="tabDisabled">
        <div id="mapContainer" class="basemap"></div>
      </el-tab-pane>
    </el-tabs>



     

    <el-dialog v-model="showUploadDialog" title="Upload a Zipped Shapefile/Geojson/KML/KMZ" width="30%" draggable>

      <el-upload
v-model:file-list="fileList" class="upload-demo" drag
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
      <el-select
id="location-select" v-model="extra_locations" multiple filterable remote reserve-keyword :loading="loading"
        placeholder=" Search Settlements" :remote-method="remoteMethod" style="width: 85%">
        <el-option v-for="item in sett_options" :key="item.id" :label="item.label" :value="item">
          <div style="display: flex; align-items: center;">
            <span style="flex: 1; text-align: left;">{{ item.label }}</span>
            <span style=" flex: 2; color: var(--el-text-color-secondary);  font-size: 13px;  text-align: right; ">
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


    <el-dialog v-model="ShowActivityAddDialog" title="Add Project Activity" width="500" :before-close="handleCloseAdd">
      <el-select
id="location-select" v-model="extra_activities" multiple filterable remote reserve-keyword
        placeholder=" Search Activities" :remote-method="getActivities" style="width: 85%">
        <el-option v-for="item in activityOptions" :key="item.id" :label="item.label" :value="item">
          <div style="display: flex; align-items: center;">
            <span style="flex: 1; text-align: left;">{{ item.label }}</span>
            <span style=" flex: 2; color: var(--el-text-color-secondary);  font-size: 13px;  text-align: right; ">
              {{ item.code }} 
            </span>
          </div>
        </el-option>
      </el-select>
      <el-tooltip content="Save" placement="top">
        <el-button :onClick="AddActivity" style="margin-left :10px;" type="primary">
          <Icon icon="ic:round-save" style=" color: white" size="48" />
        </el-button>


      </el-tooltip>

    </el-dialog>

  </el-card>


  <el-dialog v-model="uploadDialog" title="Import Document" width="400" @close="uploadDialog = false">
    <span>
      To upload data on projects, use this
      <button @click="handleDownload" class="template-link">template</button>
      , then upload it below.
    </span>


    <el-upload
class="upload-demo" :on-change="handleCsvUpload" drag :auto-upload="false"
      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15">
      <div class="el-upload__text">
        Drop file here or <em>click to upload</em>
      </div>

    </el-upload>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="uploadDialog = false">Cancel</el-button>
        <el-button type="primary" @click="uploadData">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>

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

<style scoped>
.upload-demo {
  width: 300px;
}

.template-link {
  text-decoration: underline;
  color: #409EFF;
  /* Optional: change link color */
}
</style>