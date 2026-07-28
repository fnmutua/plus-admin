<script setup lang="ts">
import { getSettlementListByCounty, getRoutesList } from '@/api/settlements'

import {
  ElButton, ElSelect, ElDialog, ElCard,ElDrawer,
  ElUpload, ElTable, ElTableColumn, ElAlert
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, Back, Download, Loading } from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, } from 'element-plus'
import { useRouter } from 'vue-router'
import { updateOneRecord, BatchImportUpsert } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { Icon } from '@iconify/vue';

import writeXlsxFile from 'write-excel-file'
import {
  searchByKeyWord
} from '@/api/settlements'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import moment from "moment";
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import proj4 from 'proj4';
import { getModelSpecs } from '@/api/fields'

import { implementationOptions } from './common/index'



import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';
import { onMounted, onActivated } from 'vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import SettlementMap from '@/views/Components/SettlementMap.vue';
import ProjectFormDrawer from '@/views/Intervention/Project/ProjectFormDrawer.vue';
import TableActions from '@/views/Components/TableActions.vue';


////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'

import { computed, watch } from 'vue'

import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'

import UploadComponent from '@/views/Components/UploadComponent.vue';
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
onMounted(async () => {
  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check
  
  // Initialize role-based filters
  await getUserRoles();
  
  await loadProjectsForRoute(route);
});




// User and role setup for county filtering
const isSuperAdmin = ref(
  Array.isArray(userInfo?.roles)
    && userInfo.roles.some((role: any) => role?.name === "super_admin" || role?.name === "root_admin")
);
const isNationalStaff = ref(false)
const isCountyStaff = ref(false)

// Process user roles for county filtering
let processedRoles: any[] = []
let roles_filters: { role: string; field: string | null; value: any }[] = [];

const getUserRoles = async () => {
  // Clear existing role filters
  roles_filters = [];
  isNationalStaff.value = false;
  isCountyStaff.value = false;

  processedRoles = (userInfo?.roles || []).map((role: any) => {
    let field: string | null = null;
    let fieldvalue: any = null;
    const level = role.user_roles?.location_level;
    
    if (level === "county") {
      field = "county_id";
      fieldvalue = role.user_roles.county_id;
      isCountyStaff.value = true;
    } else if (level === "settlement") {
      field = "settlement_id";
      fieldvalue = role.user_roles.settlement_id;
    } else if (level === "national" || level === null) {
      return {
        role: role.name,
        model: "national",
        field: null,
        fieldvalue: null
      };
    } else {
      field = "location_id";
      fieldvalue = role.user_roles.location_id;
    }
    return {
      role: role.name,
      model: level,
      field: field,
      fieldvalue: fieldvalue
    };
  }).filter((role: any) => role !== null);

  const hasNationalRole = processedRoles.some((role: any) => role.model === "national");
  isNationalStaff.value = hasNationalRole;

  // National admins and super admins see all projects — no auto county/settlement filter
  if (isSuperAdmin.value || hasNationalRole) {
    roles_filters = [];
  } else {
    roles_filters = processedRoles.map((role: any) => ({
      role: role.role,
      field: role.field,
      value: role.fieldvalue
    }));
  }

  // Populate filters and filterValues from roles_filters
  roles_filters.forEach((rf: any) => {
    if (rf.field && rf.value !== null && rf.value !== undefined) {
      if (!filters.includes(rf.field)) {
        filters.push(rf.field);
      }
      const index = filters.indexOf(rf.field);
      if (filterValues[index]) {
        filterValues.splice(index, 1);
      }
      filterValues.splice(index, 0, Array.isArray(rf.value) ? rf.value : [rf.value]);
    }
  });
};

const pushRoleFilters = () => {
  // Re-apply role-based filters after other filters are set
  // This ensures county/settlement users only see their assigned locations
  roles_filters.forEach((rf: any) => {
    if (rf.field && rf.value !== null && rf.value !== undefined) {
      // Check if this filter field is already in the filters array
      const existingIndex = filters.indexOf(rf.field);
      if (existingIndex === -1) {
        // Add new filter
        filters.push(rf.field);
        filterValues.push(Array.isArray(rf.value) ? rf.value : [rf.value]);
      } else {
        // Update existing filter value (role filters take precedence)
        filterValues[existingIndex] = Array.isArray(rf.value) ? rf.value : [rf.value];
      }
    }
  });
};

const { push } = useRouter()
const value1 = ref<any[]>([])
const value2 = ref<any[]>([])
const value3 = ref<any[]>([])
const value4 = ref<any[]>([])
const value5 = ref<any[]>([])
const value40 = ref<any[]>([])


const component_id = ref()
const page_title = ref()
const bounds = ref([])

let projectsFetchSeq = 0

const applyRouteContext = (to = route) => {
  component_id.value = to.meta.component_id
  page_title.value = to.meta.title as string
  syncComponentFilter()
}

const resolveRouteComponentId = (routeLike = route) => {
  const raw = routeLike.meta.component_id ?? component_id.value
  if (raw == null || raw === '') return null
  const numericId = Number(raw)
  return Number.isNaN(numericId) ? null : numericId
}

function resolveProjectLocationLabel(location: any): string {
  const storedName =
    typeof location?.location_name === 'string' ? location.location_name.trim() : ''
  if (storedName) return storedName
  if (location?.settlement?.name) return location.settlement.name
  if (location?.ward?.name) return location.ward.name
  if (location?.subcounty?.name) return location.subcounty.name
  if (location?.county?.name) return location.county.name
  return 'Unknown'
}

function locationsForProjectScope(row: any): any[] {
  const locations = row?.project_locations
  if (!Array.isArray(locations) || locations.length === 0) return []

  const scope = row?.implementation_scope
  if (!scope || scope === 'national') return []

  return locations.filter((location) => location?.location_type === scope)
}

const loadProjectsForRoute = async (to = route) => {
  const seq = ++projectsFetchSeq
  loading.value = true

  try {
    applyRouteContext(to)
    page.value = 1
    searchString.value = ''

    if (to.meta.component_id == null || to.meta.component_id === '') {
      if (seq === projectsFetchSeq) {
        tableDataList.value = []
        tableDataList_orig.value = []
        total.value = 0
        tblData.value = []
      }
      return
    }

    await getFilteredData(seq, to)
  } catch (error) {
    if (seq === projectsFetchSeq) {
      console.error('Error loading projects for component route:', error)
    }
  } finally {
    if (seq === projectsFetchSeq) {
      loading.value = false
    }
  }
}

onBeforeRouteUpdate(async (to) => {
  await loadProjectsForRoute(to)
})

watch(
  () => route.fullPath,
  (path, prevPath) => {
    if (!path || path === prevPath) return
    void loadProjectsForRoute(route)
  }
)

onActivated(() => {
  void loadProjectsForRoute(route)
})


const page = ref(1)

const selCounties: any[] = []
const loading = ref(true)

const currentPage = ref(1)

const total = ref(0)

const uploadDialog = ref(false)
const settlementMapDrawer = ref(false)
const selectedSettlement = ref(null)
const mapLoading = ref(true)
let tableDataList = ref<UserType[]>([])
let tableDataList_orig = ref<UserType[]>([])
//// ------------------parameters -----------------------////

// - -----Model configs ------------
const model = 'project'
let filters: any[] = ['component_id']
let filterValues: any[] = [[]]

const syncComponentFilter = () => {
  if (component_id.value == null || component_id.value === '') return

  const numericId = Number(component_id.value)

  const idx = filters.indexOf('component_id')
  if (idx === -1) {
    filters.unshift('component_id')
    filterValues.unshift([numericId])
    return
  }
  filterValues[idx] = [numericId]
}

const buildProjectQueryFilters = (routeLike = route) => {
  if (routeLike !== route) {
    component_id.value = routeLike.meta.component_id ?? component_id.value
  }

  syncComponentFilter()
  pushRoleFilters()

  const queryFilters = [...filters]
  const queryFilterValues = filterValues.map((entry) =>
    Array.isArray(entry) ? [...entry] : [entry]
  )

  const numericComponentId = resolveRouteComponentId(routeLike)
  if (numericComponentId == null) {
    return { queryFilters: [], queryFilterValues: [], activeComponentId: null }
  }

  let componentIdx = queryFilters.indexOf('component_id')
  if (componentIdx === -1) {
    queryFilters.unshift('component_id')
    queryFilterValues.unshift([numericComponentId])
  } else {
    queryFilterValues[componentIdx] = [numericComponentId]
  }

  return { queryFilters, queryFilterValues, activeComponentId: numericComponentId }
}
let tblData = ref<any[]>([])
const associated_Model = ''
const associated_multiple_models = ['programme', 'project_location', 'programme_implementation']

//// ------------------parameters -----------------------////

const facilityGeoPoints = ref()
const facilityGeoLines = ref([])
const facilityGeoPolygons = ref([])
const projectScopeGeo = ref([])
const geoLoaded = ref(false)



const handleClear = async () => {
  console.log('cleared....')
  loading.value = true

  try {
    // Preserve role-based filters before clearing
    const roleBasedFilters: string[] = []
    const roleBasedFilterValues: any[] = []
    
    roles_filters.forEach((rf: any) => {
      if (rf.field && rf.value !== null && rf.value !== undefined) {
        roleBasedFilters.push(rf.field)
        roleBasedFilterValues.push(Array.isArray(rf.value) ? rf.value : [rf.value])
      }
    })
    
    // clear all the filters -------
    filterValues = []
    filters = ['component_id']
    syncComponentFilter()
    value1.value = []
    value2.value = []
    value3.value = []
    value4.value = []
    value5.value = []
    value40.value = []

    // Restore role-based filters
    roleBasedFilters.forEach((filterField, index) => {
      if (!filters.includes(filterField)) {
        filters.push(filterField)
      }
      const filterIndex = filters.indexOf(filterField)
      if (filterValues[filterIndex]) {
        filterValues.splice(filterIndex, 1)
      }
      filterValues.splice(filterIndex, 0, roleBasedFilterValues[index])
    })

    pageSize.value = 5
    currentPage.value = 1
    tblData.value = []

    beneficiaryTabTitle.value = 'Beneficiaries'
    beneficiaryTabDisabled.value = true
    //----run the get data--------
    await getAllProjects()
  } finally {
    loading.value = false
  }
}


const currentRow = ref()
const addMoreDocuments = ref()



const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  loading.value = true

  try {
    if (searchString.value) {
      await getFilteredBySearchData(searchString.value)
    } else {
      await getFilteredData()
    }
  } finally {
    loading.value = false
  }
}



const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  loading.value = true

  try {
    if (searchString.value) {
      await getFilteredBySearchData(searchString.value)
    } else {
      await getFilteredData()
    }
  } finally {
    loading.value = false
  }
}






const getAllProjects = async () => {
  await getFilteredData()
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

const getFilteredData = async (requestSeq?: number, routeLike = route) => {
  const seq = requestSeq ?? ++projectsFetchSeq
  try {
    const { queryFilters, queryFilterValues, activeComponentId } = buildProjectQueryFilters(routeLike)

    if (activeComponentId == null) {
      if (seq === projectsFetchSeq) {
        tableDataList.value = []
        tableDataList_orig.value = []
        total.value = 0
        tblData.value = []
      }
      return
    }

    const formData: any = {
      limit: pageSize.value,
      page: page.value,
      curUser: 1,
      model: model,
      searchField: 'name',
      searchKeyword: '',
      assocModel: associated_Model,
      filters: queryFilters,
      filterValues: queryFilterValues,
      associated_multiple_models: associated_multiple_models
    }

    // NOTE: Backend handles county_id/settlement_id filters for 'project' by joining project_location
    // EXISTS (SELECT 1 FROM project_location WHERE project_location.project_id = project.id AND project_location.county_id = ?)
    const res = await getSettlementListByCounty(formData as any)

    if (seq !== projectsFetchSeq) return

    console.log('After Query - minimal associations loaded', res)
    tableDataList.value = (res as any).data || []
    tableDataList_orig.value = (res as any).data || [] // back for post filter
    
    // Debug project_locations data
    if (tableDataList.value.length > 0) {
      console.log('First project data:', tableDataList.value[0])
      console.log('Project locations:', tableDataList.value[0].project_locations)
    }

    total.value = (res as any).total || 0

    tblData.value = [] // reset the table data
    console.log('TBL-b4-', tblData)
    let filteredIds: any[] = []
    if ((res as any).data) {
      (res as any).data.forEach(function (arrayItem: any) {
      filteredIds.push(arrayItem.id)
      tblData.value.push(arrayItem)
    })
    }

    // Skip geo loading for now to improve performance
    // Only load geo if specifically needed
    if (filteredIds.length > 0) {
      console.log('Skipping geo loading for performance - can be enabled if needed')
      // Initialize empty geo arrays
        facilityGeoPoints.value = []
        facilityGeoLines.value = []
        facilityGeoPolygons.value = []
      geoLoaded.value = true
    }

    console.log('TBL-4f', tblData)
  } catch (error) {
    console.error('Error fetching project data:', error)
    tableDataList.value = []
    tableDataList_orig.value = []
    total.value = 0
    tblData.value = []
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
 


const getFilteredBySearchData = async (searchString, requestSeq?: number) => {
  const seq = requestSeq ?? ++projectsFetchSeq
  try {
    const { queryFilters, queryFilterValues, activeComponentId } = buildProjectQueryFilters()

    if (activeComponentId == null) {
      if (seq === projectsFetchSeq) {
        tableDataList.value = []
        tableDataList_orig.value = []
        total.value = 0
        tblData.value = []
      }
      return
    }

    const formData: any = {
      limit: pageSize.value,
      page: page.value,
      curUser: 1, // Id for logged in user
      model: model,
      searchField: 'title',
      searchKeyword: searchString,
      filters: queryFilters,
      filterValues: queryFilterValues,
      associated_multiple_models: associated_multiple_models
    }

    //-------------------------
    console.log('Searching with minimal associations...', formData)
    const res = await searchByKeyWord(formData as any)

    if (seq !== projectsFetchSeq) return

    console.log('After search query', res)
    tableDataList.value = (res as any).data || []
    tableDataList_orig.value = (res as any).data || [] // back for post filter

    total.value = (res as any).total || 0
    tblData.value = [] // reset the table data
  } catch (error) {
    console.error('Error searching data:', error)
    tableDataList.value = []
    tableDataList_orig.value = []
    total.value = 0
    tblData.value = []
  }
}

const searchByName = async (filterString: any) => {
  searchString.value = filterString
  loading.value = true

  try {
    if (searchString.value) {
      await getFilteredBySearchData(searchString.value)
    } else {
      await getAllProjects()
    }
  } finally {
    loading.value = false
  }
}



//// ------------------------------------Beneficiaires-------------------------------------//

const beneficiaryTabTitle = ref('Beneficiaries')
const beneficiaryTabDisabled = ref(true)










//// ------------------------------------ -------------------------------------//
const componentOptions = ref<any[]>([])
const getInterventionComponents = async () => {
  const formData: any = {
    limit: 100,
    page: 1,
    curUser: 1, // Id for logged in user
    model: 'component',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: ['programme']
  }

  //-------------------------
  console.log('Loading components with minimal associations...')
  const res = await getRoutesList(formData as any)
  
  if ((res as any).data) {
    (res as any).data.forEach(function (arrayItem: any) {
      const countyOpt: any = {
        value: arrayItem.id,
        label: arrayItem.title + '(' + (arrayItem.programme?.acronym || 'N/A') + ')'
      }
    componentOptions.value.push(countyOpt)
  })
  }
}

// Initialize data loading with better error handling
const initializeData = async () => {
  try {
    console.log('Initializing interventions data...')
    await getInterventionComponents()
    console.log('Data initialization completed')
  } catch (error) {
    console.error('Error initializing data:', error)
  }
}

// Start initialization
initializeData()



//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleForm = reactive({
  id: '',
  geom: null,

})










 
const AddProject = () => {
  if (!component_id.value) {
    ElMessage.warning('Component context is not ready yet')
    return
  }
  projectFormMode.value = 'add'
  projectFormProjectId.value = null
  projectFormComponentId.value = component_id.value
  projectFormDrawerVisible.value = true
}

const projectFormDrawerVisible = ref(false)
const projectFormComponentId = ref<string | number | null>(null)
const projectFormProjectId = ref<string | number | null>(null)
const projectFormMode = ref<'add' | 'edit'>('add')

const projectActionButtons = computed(() => {
  const buttons = ['preview']
  const perms = userInfo?.permissions ?? []
  if (perms[0] === '*.*.*' || perms.includes('project:update')) {
    buttons.push('edit')
  }
  return buttons
})

const handleRowDblClick = (row: any) => {
  viewProject(row)
}

const editProjectFromList = (row: any) => {
  const domain = row.component_id || component_id.value
  if (!domain) {
    ElMessage.warning('Cannot edit project: missing component')
    return
  }
  projectFormMode.value = 'edit'
  projectFormProjectId.value = row.id
  projectFormComponentId.value = domain
  projectFormDrawerVisible.value = true
}

const onProjectFormSaved = async () => {
  projectFormDrawerVisible.value = false
  syncComponentFilter()
  loading.value = true
  try {
    await getFilteredData()
  } finally {
    loading.value = false
  }
}











const tableRowClassName = () => {
  return ''
}


/**
 * Enhanced Project Data Download Function
 * 
 * This function downloads comprehensive project data including:
 * - Project basic information (title, status, cost, dates)
 * - Contractor details (name, phone, address)
 * - Project locations with full administrative hierarchy (county, subcounty, ward, settlement)
 * - Programme and component information
 * - Beneficiary counts
 * 
 * The data is exported to Excel format with proper formatting and includes
 * all project locations as separate rows for projects with multiple locations.
 */
const DownloadXlsx = async () => {
  try {
    console.log('Downloading enhanced project data...')
    console.log('tableDataList.value:', tableDataList.value)
    
    if (!tableDataList.value || tableDataList.value.length === 0) {
      ElMessage.warning('No project data available to download')
      return
    }

    ElMessage.info('Preparing  project data for download...')

    let dataHolder: any[] = []
    let rowIndex = 1 // Sequential counter for Excel rows
    
    // Process each project to get enhanced data
    for (let i = 0; i < tableDataList.value.length; i++) {
      const project = tableDataList.value[i] as any
      console.log(`Processing project ${i + 1}:`, project)
      
      // Get contractor information
      let contractorName = ''
      let contractorPhone = ''
      let contractorAddress = ''
      
      if (project.project_contractor) {
        contractorName = project.project_contractor.name || ''
        contractorPhone = project.project_contractor.phone || ''
        contractorAddress = project.project_contractor.address || ''
        console.log('Contractor found:', { contractorName, contractorPhone, contractorAddress })
      } else {
        console.log('No contractor found for project:', project.title)
      }
      
      // Always fetch project locations separately to ensure we get the location hierarchy
      let projectLocations: any[] = []
      try {
        const locationFormData: any = {
          model: 'project_location',
          searchField: 'name',
          searchKeyword: '',
          filters: ['project_id'],
          filterValues: [[project.id]],
          associated_multiple_models: ['settlement'] // Minimal associations for download performance
        }
        
        const locationRes = await getSettlementListByCounty(locationFormData)
        projectLocations = (locationRes as any).data || []
        console.log(`Fetched ${projectLocations.length} project locations for project ${project.id}`)
      } catch (error) {
        console.error('Error fetching project locations:', error)
        projectLocations = []
      }
      
      console.log('Project locations data:', projectLocations)

      // If no locations found, create a single record with basic project info
      if (projectLocations.length === 0) {
        let thisRecord = {
          index: rowIndex++,
          title: project.title || '',
          contractor_name: contractorName,
          contractor_phone: contractorPhone,
          contractor_address: contractorAddress,
          status: project.status || '',
          cost: project.cost || '',
          start_date: project.start_date ? moment(project.start_date).format("YYYY-MM-DD") : '',
          end_date: project.end_date ? moment(project.end_date).format("YYYY-MM-DD") : '',
          county: '', // No location data available
          subcounty: '', // No location data available
          ward: '', // No location data available
          settlement: '', // No location data available
          latitude: '', // No geometry available
          longitude: '', // No geometry available
          programme: project.programme ? project.programme.acronym : '',
          component: project.component ? project.component.title : '',
          male_beneficiaries: project.male_beneficiaries || '',
          female_beneficiaries: project.female_beneficiaries || ''
        }
        dataHolder.push(thisRecord)
      } else {
        // Create a record for each project location with proper location hierarchy
        projectLocations.forEach((location: any) => {
          console.log('Processing location:', location)
          
          // Extract location hierarchy from the project_location data
          let countyName = ''
          let subcountyName = ''
          let wardName = ''
          let settlementName = ''
          
          // Check if location has direct county/subcounty/ward data
          if (location.county) {
            countyName = location.county.name || ''
          }
          if (location.subcounty) {
            subcountyName = location.subcounty.name || ''
          }
          if (location.ward) {
            wardName = location.ward.name || ''
          }
          if (location.settlement) {
            settlementName = location.settlement.name || ''
            // If settlement exists, also get county/subcounty/ward from settlement
            if (location.settlement.county) {
              countyName = location.settlement.county.name || countyName
            }
            if (location.settlement.subcounty) {
              subcountyName = location.settlement.subcounty.name || subcountyName
            }
            if (location.settlement.ward) {
              wardName = location.settlement.ward.name || wardName
            }
          }
          
          // Fallback to location_name if no settlement name
          if (!settlementName && location.location_name) {
            settlementName = location.location_name
          }
          
          // Calculate latitude and longitude from geometry using Turf.js
          let latitude = ''
          let longitude = ''
          
          if (location.geom) {
            try {
              // Create a GeoJSON feature from the geometry
              const feature = turf.feature(location.geom)
              
              // Calculate centroid
              const centroid = turf.centroid(feature)
              
              // Extract coordinates [longitude, latitude]
              const coordinates = centroid.geometry.coordinates
              longitude = coordinates[0].toFixed(6) // 6 decimal places for precision
              latitude = coordinates[1].toFixed(6)  // 6 decimal places for precision
              
              console.log(`Calculated coordinates for location: ${latitude}, ${longitude}`)
            } catch (error) {
              console.error('Error calculating centroid for location:', error)
              latitude = ''
              longitude = ''
            }
          } else {
            console.log('No geometry found for location')
          }
          
          console.log('Extracted location data:', { countyName, subcountyName, wardName, settlementName, latitude, longitude })
          
          let thisRecord = {
            index: rowIndex++,
            title: project.title || '',
            contractor_name: contractorName,
            contractor_phone: contractorPhone,
            contractor_address: contractorAddress,
            status: project.status || '',
            cost: project.cost || '',
            start_date: project.start_date ? moment(project.start_date).format("YYYY-MM-DD") : '',
            end_date: project.end_date ? moment(project.end_date).format("YYYY-MM-DD") : '',
            county: countyName,
            subcounty: subcountyName,
            ward: wardName,
            settlement: settlementName,
            latitude: latitude,
            longitude: longitude,
            programme: project.programme ? project.programme.acronym : '',
            component: project.component ? project.component.title : '',
            male_beneficiaries: project.male_beneficiaries || '',
            female_beneficiaries: project.female_beneficiaries || ''
          }
          dataHolder.push(thisRecord)
        })
      }
    }
    
    console.log('Final dataHolder:', dataHolder)

    if (dataHolder.length === 0) {
      ElMessage.warning('No data to export. Please check if projects have the required information.')
      return
    }

    // Define the fields we want to export (same as DownloadCustom approach)
    const selectedFields = [
      'index',
      'title', 
      'contractor_name',
      'contractor_phone',
      'contractor_address',
      'status',
      'cost',
      'start_date',
      'end_date',
      'county',
      'subcounty',
      'ward',
      'settlement',
      'latitude',
      'longitude',
      'programme',
      'component',
      'male_beneficiaries',
      'female_beneficiaries'
    ]

    // Clean up the field names and prepare column headers (same as DownloadCustom)
    const columns = selectedFields.map((field) => {
      // Step 1: Remove all special characters (underscore, dot, etc.)
      let cleanedField = field.replace(/[^a-zA-Z0-9]/g, ' ');  // Replace non-alphanumeric characters with space

      // Step 2: Split by spaces, filter out empty strings, and capitalize each word
      const words = cleanedField.split(/\s+/).filter(word => word);

      // Step 3: Capitalize the first letter of each word and join without spaces
      const formattedField = words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');  // Join the words without spaces (e.g., FirstName)

      return {
        column: formattedField,
        type: String,
      };
    });

    // Create rows for the data, with each cell wrapped (same as DownloadCustom)
    const rows = dataHolder.map((row) =>
      selectedFields.map((field) => ({
        type: String,
        wrap: true,
        value: row[field] ? String(row[field]) : '',
      }))
    );

    // Add headers as the first row
    rows.unshift(columns.map((col) => ({ 
      type: String,
      wrap: true,
      value: col.column,
      fontWeight: 'bold' 
    })));

    // Calculate column widths based on the maximum length of data in each column
    const columnWidths = columns.map((col, index) => {
      // Get the column header length
      let maxLength = col.column.length;

      // Check each row's value in this column
      dataHolder.forEach((row) => {
        const cellValue = row[selectedFields[index]] ? String(row[selectedFields[index]]) : '';
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length;
        }
      });

      // Return width (you can scale it by a factor, e.g., multiplying by a constant for better spacing)
      return maxLength + 5; // Add padding for better readability
    });

    console.log('Rows prepared for Excel:', rows)
    console.log('Number of rows to export:', rows.length)

    // Export the file with calculated column widths (same as DownloadCustom)
    await writeXlsxFile(rows, {
      fileName: `Projects_${component_id.value}_${moment().format('YYYY-MM-DD')}.xlsx`,
      columns: columnWidths.map((width) => ({ width })),
    });

    console.log('Excel file created successfully')
    ElMessage.success(`Successfully downloaded ${dataHolder.length} project records with contractor and location information!`)
  } catch (error) {
    console.error('Error during download:', error)
    ElMessage.error('Failed to download project data. Please try again.')
  }
}









const isMobile = computed(() => appStore.getMobile)

const dialogWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
} else {
  dialogWidth.value = "28%"
}


const getDocumentTypes = async () => {
}


//id","name","county_id","settlement_type","geom","area","population","code","description"
const activityOptions = ref<any[]>([])

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






















const value6 = ref()



const filterByProgramme = async (prog_id: any) => {
  value5.value = [] // clear the subcounty 
  value6.value = []   // clear the ward sr
  loading.value = true

  try {
    if (prog_id.length > 0) {
      filters.push('implementation_id')
      filterValues.push(prog_id)
      await getFilteredData()
    } else {
      filters.splice(filters.indexOf('implementation_id'), 1);
      filterValues.splice(filterValues.indexOf(prog_id), 1);
      await getFilteredData()
    }
  } finally {
    loading.value = false
  }
}












/// Upload documents from a central component
const mfield = 'project_id'
const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
});


const locations_loading = ref(false)
const project_locations = ref<any[]>([])

const getProjectLocations = async (project_id: any) => {
  console.log('project_id', project_id);

  locations_loading.value = true
  project_locations.value = []   // Empty current locations first

  try {
    // Get the project settlement ids with minimal associations
    const formData: any = {
    model: 'project_location',
    searchField: 'name',
    searchKeyword: '',
    filters: ['project_id'],
    filterValues: [[project_id]],
    associated_multiple_models: []
  };

    const res = await getSettlementListByCounty(formData as any);
    const sett_ids = (res as any).data?.map((item: any) => item.settlement_id) || []; // Extract settlement_id
  console.log('sett_ids', sett_ids);

    if (sett_ids.length === 0) {
      locations_loading.value = false;
      return;
    }

    // Fetch settlements with minimal associations for better performance
    const form: any = {
    model: 'settlement',
    filters: ['id'],
    filterValues: [sett_ids],
    excludeGeom: true,
      associated_multiple_models: ['county'] // Minimal associations for location performance
  };

    const setts = await getSettlementListByCounty(form as any);
  console.log('setts', setts);

  // Map settlements to include additional details
    const settlements = (setts as any).data?.map((item: any) => ({
      county: item.county?.name || 'N/A',
      subcounty: item.subcounty?.name || 'N/A',
      ward: item.ward?.name || 'N/A',
      settlement: item.name || 'N/A',
    settlement_id: item.id
    })) || [];

  // Join project locations with settlement details based on settlement_id
    project_locations.value = (res as any).data?.map((projectLocation: any) => {
      const settlement = settlements.find((sett: any) => sett.settlement_id === projectLocation.settlement_id);
    return {
      ...projectLocation,
      county: settlement ? settlement.county : null,
      subcounty: settlement ? settlement.subcounty : null,
      ward: settlement ? settlement.ward : null,
      settlementName: settlement ? settlement.settlement : null
    };
    }) || [];

  locations_loading.value = false
  console.log('project_locations', project_locations);
  } catch (error) {
    console.error('Error fetching project locations:', error);
    locations_loading.value = false;
  }
};


const project_id = ref()
const project_activities = ref(null);






//// Module foe adding benefiicair











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

const fileList = ref<any[]>([])


const sett_options = ref<any[]>([])
const extra_locations = ref<any[]>([])




const remoteMethod = async (keyword: string) => {
  console.log(keyword)
  loading.value = true
  
  const formData: any = {
    model: 'settlement',
    searchField: 'name',
    searchKeyword: keyword,
    excludeGeom: false,
    excludeGeomAssoc: true,
    associated_multiple_models: ['county'], // Minimal associations for settlement search performance
    filters: [],
    filterValues: []
  }

  //-------------------------
  console.log("formData", formData)
  const res = await searchByKeyWord(formData as any)

  console.log("res.data", (res as any).data)

  if ((res as any).data && (res as any).data.length > 0) {
    sett_options.value = (res as any).data.map((item: any) => ({
      value: item.id,
      settlement_id: item.id,
      label: item.name,
      name: item.name,
      county: item.county?.name || 'N/A',
      subcounty: item.subcounty?.name || 'N/A',
      ward: item.ward?.name || 'N/A',
      ward_id: item.ward?.id || null,
      subcounty_id: item.subcounty?.id || null,
      county_id: item.county?.id || null,
      geom: item.geom
    }));
  }
  loading.value = false
}


const getActivities = async (keyword: string) => {
  console.log(keyword, project_id.value)
  
  const formData: any = {
    model: 'activity',
    searchField: 'title',
    searchKeyword: keyword,
    excludeGeom: false,
    associated_multiple_models: [],
    filters: [],
    filterValues: []
  }

  //-------------------------
  console.log("formData", formData)
  const res = await searchByKeyWord(formData as any)

  console.log("res.data", (res as any).data)

  if ((res as any).data && (res as any).data.length > 0) {
    activityOptions.value = (res as any).data.map((item: any) => ({
      value: item.id,
      label: item.title,
      code: item.code,
      project_id: project_id.value
    }));
  }

  console.log('sett_options.value', sett_options.value)
}

const AddLocation = async () => {

  console.log('project_id', project_id.value)
  console.log('locations', extra_locations.value)

  const location_objects: any[] = [];

  for (let i = 0; i < extra_locations.value.length; i++) {
    console.log(extra_locations.value[i])
    let obj: any = {
      project_id: project_id.value,
      settlement_id: extra_locations.value[i].settlement_id,
      ward_id: extra_locations.value[i].ward_id,
      subcounty_id: extra_locations.value[i].subcounty_id,
      county_id: extra_locations.value[i].county_id,
      location_type: 'settlement',
      location_name: extra_locations.value[i].name,
      geom: extra_locations.value[i].geom
    }
    location_objects.push(obj)
    console.log('obj', obj)
  }

  const form: any = {
    model: 'project_location',
    data: location_objects
  }
  
  console.log('formData', form)

  const loc_res = await BatchImportUpsert(form as any)
  console.log('loc_res', loc_res)

  // 
  getProjectLocations(project_id.value)
  // Empty the locations and 
  extra_locations.value = []
  sett_options.value = []
}

const AddActivity = async () => {

  console.log('project_id', project_id.value)
  console.log('activities', extra_activities.value)

  const activity_objects: any[] = [];

  for (let i = 0; i < extra_activities.value.length; i++) {
    console.log(extra_activities.value[i])
    let obj: any = {
      project_id: extra_activities.value[i].project_id,
      activity_id: extra_activities.value[i].value,
      title: extra_activities.value[i].label
    }
    activity_objects.push(obj)
    console.log('obj', obj)
  }

  const form: any = {
    model: 'project_activity',
    data: activity_objects
  }
  
  console.log('formData', form)

  const loc_res = await BatchImportUpsert(form as any)
  console.log('loc_res', loc_res)

  if (project_activities.value) {
  project_activities.value.push(...activity_objects);
  }

  console.log('project_activities', project_activities.value)
}


const ShowLocationAddDialog = ref(false)
const ShowActivityAddDialog = ref(false)
const extra_activities = ref<any[]>([])


const handleCloseAdd = () => {
  ShowLocationAddDialog.value = false
  ShowActivityAddDialog.value = false
}


const tableRef = ref(null);






const field_set = ref([])
const uploadData = async () => {
  uploadDialog.value = true
  console.log('Uploading data.......')
  
  const formData: any = {
    model: 'project'
  }
  
  try {
    const response = await getModelSpecs(formData as any)
    console.log(response.data)
    field_set.value = (response as any).data
  } catch (error) {
    console.error('Error getting model specs:', error)
  }
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

const parsedData = ref<any[]>([])

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
  const form: any = {
    model: 'project',
    data: convertStringArraysToProperArrays(parsedData.value)
  }

  console.log('formData', form)

  try {
    const results = await BatchImportUpsert(form as any)
    console.log('BatchImportUpsert', (results as any).insertedDocuments)
  } catch (error) {
    console.error('Error importing projects:', error)
  }
}



const viewProject = (row: any) => {
  push({
    name: 'ProjectDetails',
    params: { id: row.id }
  })
}

function goToSettlementMap(location: any) {
  console.log('Open settlement map drawer:', location)
  // Set the selected settlement data and open the drawer
  selectedSettlement.value = {
    id: location.settlement_id,
    name: location.location_name,
    county_id: location.county_id,
    subcounty_id: location.subcounty_id,
    ward_id: location.ward_id
  }
  mapLoading.value = true
  settlementMapDrawer.value = true
}

function handleDrawerClose() {
  settlementMapDrawer.value = false
  selectedSettlement.value = null
}

function onLayersLoaded() {
  console.log('Settlement map layers loaded successfully')
  mapLoading.value = false
  // Trigger map resize after a short delay to ensure proper rendering
  setTimeout(() => {
    if (window.mapboxgl && window.mapboxgl.Map) {
      // Trigger resize on all map instances
      const maps = document.querySelectorAll('.mapboxgl-map')
      maps.forEach(map => {
        if (map._mapboxgl_map) {
          map._mapboxgl_map.resize()
        }
      })
    }
  }, 100)
}

</script>

<template>
  <el-card>


    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>

    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center; width: 100%;">
      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
           Back
        </el-button>
      </div>
      <!-- Title Search -->
      <el-select
        v-model="value3"
        multiple
        clearable
        filterable
        remote
        :remote-method="searchByName"
        reserve-keyword
        placeholder="Search by Title"
        style="flex: 1; min-width: 220px; margin-right: 10px;"
      />
      <el-select
        size="default"
        v-model="value40"
        @change="filterByProgramme"
        @clear="handleClear"
        multiple
        clearable
        filterable
        collapse-tags
        placeholder="By Programme"
        style="width: 180px; margin-right: 10px;"
      >
        <el-option v-for="item in implementationOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
          <PermissionWrapper :permissions="['project:create']">
          <el-tooltip content="Add Project" placement="top">
            <el-button @click="AddProject" type="primary" :icon="Plus" />
          </el-tooltip>
        </PermissionWrapper>
        <PermissionWrapper :permissions="['project:create']">
          <!-- <el-tooltip content="Import Data" placement="top">
            <el-button @click="uploadData" type="primary" :icon="UploadFilled" />
          </el-tooltip> -->
            <!-- Download All Component -->
            <!-- <DownloadCustom
:data="tableDataList" :model="model"
            :associated_models="associated_multiple_models" /> -->
            
            <!-- Enhanced Project Data Download -->
            <el-tooltip content="Download Project Data" placement="top">
              <el-button @click="DownloadXlsx" type="success" :icon="Download" />
            </el-tooltip>
            
        </PermissionWrapper>
    
      </div>
 
 
    </el-row>

    <el-alert
      type="info"
      :closable="false"
      :show-icon="false"
      style="margin-top: 8px; margin-bottom: 4px; padding: 6px 12px;"
    >
      <template #default>
        <span style="font-size: 12px;">💡 Double-click on any row to view project details</span>
      </template>
    </el-alert>

    <el-table
ref="tableRef" row-key="id" :data="tableDataList" style="width: 100%; margin-top: 10px;" border
      :row-class-name="tableRowClassName" :row-style="{ height: '40px' }"
      v-loading="loading"
      class="interventions-project-table"
      @row-dblclick="handleRowDblClick"
    >
      <el-table-column type="index" label="#" width="50" align="center">
        <template #default="{ $index }">
          <span style="font-weight: 500;">{{$index + 1}}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="Project Title"
        prop="title"
        min-width="250"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-tooltip placement="top" effect="dark">
            <template #content>
              <div style="min-width: 260px; max-width: 340px;">
                <strong>{{ row.title }}</strong><br />
                <span>Status: <b>{{ row.status }}</b></span><br />
                <span>Start: {{ row.start_date }}</span><br />
                <span>End: {{ row.end_date }}</span><br />
              </div>
            </template>
            <span class="project-title">{{ row.title }}
             
            </span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        label="Programme"
        prop="programme.acronym"
        max-width="100"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span class="programme">{{ row.programme?.acronym }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="Locations"
        prop="project_location"
        min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <div v-if="locationsForProjectScope(row).length > 0" class="locations-container">
            <div class="location-list">
              <span 
                v-for="(location, index) in locationsForProjectScope(row)" 
                :key="location.id ?? `${location.location_type}-${index}`"
                class="location-item"
              >
                <span 
                  v-if="location.location_type === 'settlement'"
                  @click="goToSettlementMap(location)"
                  class="settlement-link"
                  :title="`View ${resolveProjectLocationLabel(location)} on map`"
                >
                  {{ resolveProjectLocationLabel(location) }}
                </span>
                <span v-else class="location-name">
                  {{ resolveProjectLocationLabel(location) }}
                </span>
                <span v-if="index < locationsForProjectScope(row).length - 1" class="location-separator">, </span>
              </span>
            </div>
          </div>
          <span v-else-if="row.implementation_scope === 'national'" class="no-locations">National scope</span>
          <span v-else class="no-locations">No locations configured</span>
        </template>
      </el-table-column>
      <el-table-column label="" width="68" align="center" fixed="right">
        <template #default="{ row }">
          <div @click.stop>
            <TableActions
              :item="row"
              :buttons="projectActionButtons"
              @preview="viewProject"
              @edit="editProjectFromList"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>
    <ElPagination
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[3, 5, 10, 20, 50, 100]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />

    <!-- Settlement Map Drawer -->
    <el-drawer
      v-model="settlementMapDrawer"
      :size="isMobile ? '100%' : '45%'"
      direction="rtl"
      :before-close="handleDrawerClose"
      :show-close="false"
    >
      <template #header="{ close, titleId, titleClass }">
        <h4 :id="titleId" :class="titleClass" class="custom-drawer-title">
          {{ selectedSettlement ? selectedSettlement.name : 'Settlement' }} - Map
        </h4>
        <el-button type="danger" size="small" @click="close">
          <Icon icon="material-symbols:close" class="el-icon--left" />
          Close
        </el-button>
      </template>
      <div v-if="selectedSettlement" class="settlement-map-container">
        <div v-if="mapLoading" class="map-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>Loading settlement map...</p>
        </div>
        <SettlementMap 
          v-show="!mapLoading"
          :settlementId="selectedSettlement.id"
          @layers-loaded="onLayersLoaded"
          :class="{ 'map-hidden': mapLoading }"
        />
      </div>
    </el-drawer>

    <ProjectFormDrawer
      v-model:visible="projectFormDrawerVisible"
      :component-id="projectFormComponentId"
      :project-id="projectFormProjectId"
      :mode="projectFormMode"
      :component-title="page_title"
      @saved="onProjectFormSaved"
    />



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
id="location-select" v-model="extra_locations" multiple filterable remote reserve-keyword
        :loading="loading" placeholder=" Search Settlements" :remote-method="remoteMethod" style="width: 85%">
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
/* Compact table styling */
.el-table .el-table__cell {
  padding: 8px 0 !important;
}

.el-table .el-table__header .el-table__cell {
  padding: 8px 0 !important;
  font-size: 13px;
  font-weight: 600;
}

.el-table .el-table__body .el-table__cell {
  padding: 6px 0 !important;
  font-size: 13px;
}

.el-table .el-table__row {
  height: 40px !important;
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

.project-title {
  font-weight: 400;
  font-size: 13px;
}
.programme {
  color: #888;
  font-size: 13px;
}

.component {
  color: #666;
  font-size: 13px;
  font-weight: 500;
}

.locations-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.location-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  font-size: 13px;
  line-height: 1.4;
}

.interventions-project-table :deep(.el-table__row) {
  cursor: pointer;
}

.location-item {
  color: #409EFF;
  font-weight: 500;
  font-size: 13px;
}

.settlement-link {
  color: #409EFF;
  font-weight: 400;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  transition: all 0.2s ease;
}

.settlement-link:hover {
  color: #66b1ff;
  text-decoration: none;
  font-weight: 500;
}

.location-name {
  color: #409EFF;
  font-weight: 400;
  font-size: 13px;
}

.location-separator {
  color: #666;
  font-size: 13px;
}

.no-locations {
  color: #999;
  font-style: italic;
  font-size: 13px;
}

.settlement-map-container {
  height: calc(100vh - 120px);
  padding: 0;
  position: relative;
  overflow: hidden;
}

.settlement-map-container .mapboxgl-map {
  width: 100% !important;
  height: 100% !important;
  min-height: 400px;
}

.map-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 500px;
  background: #f5f7fa;
  border-radius: 8px;
}

.map-loading .el-icon {
  font-size: 32px;
  color: #409EFF;
  margin-bottom: 16px;
}

.map-loading p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.map-hidden {
  display: none !important;
}

/* Drawer header styling */
.el-drawer__header {
  margin-bottom: 10px !important;
  padding: 16px 20px 10px 20px !important;
}

.el-drawer__title {
  font-weight: 600 !important;
  font-size: 16px !important;
}

/* Custom drawer header styling */
.custom-drawer-title {
  font-weight: 700 !important;
  font-size: 14px !important;
  margin: 0 !important;
  color: #303133 !important;
  flex: 1;
  line-height: 1.2 !important;
}

.el-drawer__header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  margin-bottom: 5px !important;
  padding: 8px 16px 4px 16px !important;
  min-height: 40px !important;
}
.el-table__row:hover {
  background: #f7fafd !important;
}

.el-table__row:hover .el-button {
  transform: translateX(2px);
  transition: transform 0.2s ease;
}
.expand-details {
  background: #f9f9fb;
  padding: 18px 24px 12px 24px;
  border-radius: 8px;
  margin: 0 0 8px 0;
}
.hover-details-card-row {
  position: absolute;
  left: 0;
  top: 110%;
  background: #f9f9fb;
  padding: 18px 24px 12px 24px;
  border-radius: 8px;
  margin: 0 0 8px 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  min-width: 480px;
  max-width: 90vw;
  z-index: 1000;
  pointer-events: none;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>