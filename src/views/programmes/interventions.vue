<script setup lang="ts">
import { getSettlementListByCounty, getRoutesList, revertHistory, mergeDuplicates, revertMerge } from '@/api/settlements'

import {
  ElButton, ElSelect, ElDialog, ElCard,ElDrawer,
  ElUpload, ElTable, ElTableColumn, ElAlert, ElSegmented, ElMessageBox,
  ElRadioGroup, ElRadio, ElDescriptions, ElDescriptionsItem, ElRow, ElCol
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, Back, Download, Loading, Filter, TakeawayBox } from '@element-plus/icons-vue'

import { ref, reactive, computed, watch, onMounted, onActivated, nextTick } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElBadge } from 'element-plus'
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

import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';
import { useWindowSize } from '@vueuse/core'
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import SettlementMap from '@/views/Components/SettlementMap.vue';
import ProjectFormDrawer from '@/views/Intervention/Project/ProjectFormDrawer.vue';
import TableActions from '@/views/Components/TableActions.vue';


////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'

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


const searchString = ref('')
const value3 = ref<any[]>([])
const projectFiltersDrawerVisible = ref(false)

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)
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

const defaultPageSize = 10;
const compactPageSize = 5;
/** Viewports below this width use compactPageSize (mobile + tablet / small laptop). */
const largeScreenMinWidth = 1280;
const pageSize = ref(defaultPageSize);
const { width: windowWidth } = useWindowSize();

function getResponsivePageSize(viewportWidth = windowWidth.value) {
  return viewportWidth >= largeScreenMinWidth ? defaultPageSize : compactPageSize;
}

function applyResponsivePageSize() {
  pageSize.value = getResponsivePageSize();
}

// Set up event listener on mount
onMounted(async () => {
  applyResponsivePageSize()

  // Initialize role-based filters
  await getUserRoles();
  
  await loadProjectsForRoute(route);
  void refreshDeletedProjectCount();
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
const value4 = ref<any[]>([])
const value5 = ref<any[]>([])


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

function normalizeLocationScope(scope: unknown): string {
  return String(scope || '').trim().toLowerCase()
}

function isSettlementLocation(location: any): boolean {
  return (
    normalizeLocationScope(location?.location_type) === 'settlement' &&
    location?.settlement_id != null &&
    location?.settlement_id !== ''
  )
}

function locationHasGeoPoint(location: any): boolean {
  const geomType = String(location?.geomType || location?.geom?.type || '')
  return geomType === 'Point' || geomType === 'MultiPoint'
}

function locationsForProjectScope(row: any): any[] {
  const locations = row?.project_locations
  if (!Array.isArray(locations) || locations.length === 0) return []

  const scope = row?.implementation_scope
  if (!scope || scope === 'national') return []

  return locations.filter((location) => location?.location_type === scope)
}

const PROJECT_LIST_LOCATION_PREVIEW_LIMIT = 2

function projectLocationLabels(locations: any[]): string[] {
  return locations.map(resolveProjectLocationLabel)
}

function projectLocationsSummary(locations: any[]): string {
  return projectLocationLabels(locations).join(', ')
}

function visibleProjectLocations(locations: any[]): any[] {
  if (locations.length <= PROJECT_LIST_LOCATION_PREVIEW_LIMIT) return locations
  return locations.slice(0, PROJECT_LIST_LOCATION_PREVIEW_LIMIT)
}

function hiddenProjectLocationCount(locations: any[]): number {
  return Math.max(0, locations.length - PROJECT_LIST_LOCATION_PREVIEW_LIMIT)
}

function getProjectListLocationDisplay(row: any) {
  const locations = locationsForProjectScope(row)
  return {
    rowKey: row?.id ?? row?.title ?? projectLocationsSummary(locations),
    locations,
    visible: visibleProjectLocations(locations),
    hiddenCount: hiddenProjectLocationCount(locations),
    summary: projectLocationsSummary(locations),
  }
}

function projectConfiguration(row: any) {
  const locationConfigured =
    normalizeLocationScope(row?.implementation_scope) === 'national' ||
    locationsForProjectScope(row).length > 0
  const activitiesConfigured = Array.isArray(row?.activities) && row.activities.length > 0
  const completed = Number(locationConfigured) + Number(activitiesConfigured)

  if (completed === 2) {
    return {
      state: 'full',
      icon: 'mdi:check-circle-outline',
      color: 'var(--el-text-color-secondary)',
      label: 'Scope set up — location and activities defined',
    }
  }

  const missing = [
    !locationConfigured ? 'location' : '',
    !activitiesConfigured ? 'activities' : '',
  ].filter(Boolean)

  return {
    state: completed === 0 ? 'none' : 'partial',
    icon: 'mdi:alert-circle-outline',
    color: 'var(--el-text-color-secondary)',
    label: `${completed === 0 ? 'Unconfigured' : 'Partially configured'} — missing ${missing.join(' and ')}`,
  }
}

const projectStatusFilterOptions = [
  { label: 'Planned', value: 'Planned' },
  { label: 'Ongoing', value: 'Ongoing' },
  { label: 'Suspended', value: 'Suspended' },
  { label: 'Completed', value: 'Completed' },
]

const projectScopeFilterOptions = [
  { label: 'National', value: 'national' },
  { label: 'County', value: 'county' },
  { label: 'Subcounty', value: 'subcounty' },
  { label: 'Ward', value: 'ward' },
  { label: 'Settlement', value: 'settlement' },
]

const projectConfigurationFilterOptions = [
  { label: 'Scope set up', value: 'full' },
  { label: 'Partially missing', value: 'partial' },
  { label: 'Unconfigured', value: 'none' },
]

const filterStatus = ref<string[]>([])
const filterScope = ref<string[]>([])
const filterConfiguration = ref<string[]>([])

const activeProjectFilterCount = computed(() =>
  filterStatus.value.length + filterConfiguration.value.length + filterScope.value.length
)

function setQueryFilter(field: string, values: unknown[] | null | undefined) {
  const normalized = Array.isArray(values)
    ? values.filter((value) => value !== null && value !== undefined && value !== '')
    : []
  const idx = filters.indexOf(field)

  if (!normalized.length) {
    if (idx !== -1) {
      filters.splice(idx, 1)
      filterValues.splice(idx, 1)
    }
    return
  }

  if (idx === -1) {
    filters.push(field)
    filterValues.push(normalized)
  } else {
    filterValues[idx] = normalized
  }
}

function syncProjectListQueryFilters() {
  setQueryFilter('status', filterStatus.value)
  setQueryFilter('implementation_scope', filterScope.value)
}

const needsClientSideProjectFilter = computed(() => filterConfiguration.value.length > 0)

function matchesConfigurationFilter(row: any): boolean {
  if (!filterConfiguration.value.length) return true
  return filterConfiguration.value.includes(projectConfiguration(row).state)
}

const clientFilteredProjects = computed(() => {
  const rows = tableDataList_orig.value || []
  if (!needsClientSideProjectFilter.value) return rows
  return rows.filter(matchesConfigurationFilter)
})

const loadProjectsForRoute = async (to = route) => {
  const seq = ++projectsFetchSeq
  loading.value = true

  try {
    applyRouteContext(to)
    page.value = 1
    searchString.value = ''
    value3.value = []

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
const activeSegment = ref<'Projects' | 'Deleted'>('Projects')
const deletedProjects = ref<any[]>([])
const deletedProjectsCount = ref(0)
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
const associated_multiple_models = ['programme', 'project_location', 'programme_implementation', 'activity']

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
    filterStatus.value = []
    filterScope.value = []
    filterConfiguration.value = []
    searchString.value = ''

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

    applyResponsivePageSize()
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
  currentPage.value = selPage

  if (needsClientSideProjectFilter.value) return

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
  page.value = 1
  currentPage.value = 1

  if (needsClientSideProjectFilter.value) return

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

const buildProjectListRequest = (routeLike = route) => {
  const { queryFilters, queryFilterValues, activeComponentId } = buildProjectQueryFilters(routeLike)
  const formData: any = {
    limit: needsClientSideProjectFilter.value ? undefined : pageSize.value,
    page: needsClientSideProjectFilter.value ? undefined : page.value,
    curUser: 1,
    model: model,
    assocModel: associated_Model,
    filters: queryFilters,
    filterValues: queryFilterValues,
    associated_multiple_models: associated_multiple_models,
  }

  if (needsClientSideProjectFilter.value) {
    formData.returnAll = true
  }

  return { formData, activeComponentId }
}

const getFilteredData = async (requestSeq?: number, routeLike = route) => {
  const seq = requestSeq ?? ++projectsFetchSeq
  try {
    const { formData, activeComponentId } = buildProjectListRequest(routeLike)

    if (activeComponentId == null) {
      if (seq === projectsFetchSeq) {
        tableDataList.value = []
        tableDataList_orig.value = []
        total.value = 0
        tblData.value = []
      }
      return
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









watch(windowWidth, async () => {
  const nextSize = getResponsivePageSize()
  if (pageSize.value === nextSize) return

  applyResponsivePageSize()
  page.value = 1
  currentPage.value = 1

  if (activeSegment.value === 'Deleted' || needsClientSideProjectFilter.value) return

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
})

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
 


const getFilteredBySearchData = async (searchKeyword: string, requestSeq?: number) => {
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
      limit: needsClientSideProjectFilter.value ? undefined : pageSize.value,
      page: needsClientSideProjectFilter.value ? undefined : page.value,
      curUser: 1,
      model: model,
      searchField: 'title',
      searchKeyword,
      filters: queryFilters,
      filterValues: queryFilterValues,
      associated_multiple_models: associated_multiple_models,
    }

    if (needsClientSideProjectFilter.value) {
      formData.returnAll = true
    }

    const res = await searchByKeyWord(formData as any)

    if (seq !== projectsFetchSeq) return

    tableDataList.value = (res as any).data || []
    tableDataList_orig.value = (res as any).data || []
    total.value = (res as any).total || 0
    tblData.value = []
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
  page.value = 1
  currentPage.value = 1
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

function hasProjectUpdatePermission(): boolean {
  const perms = userInfo?.permissions ?? []
  return perms[0] === '*.*.*' || perms.includes('project:update')
}

const canUpdateProjects = computed(() => hasProjectUpdatePermission())

const projectActionButtons = computed(() => {
  const buttons = ['preview']
  if (canUpdateProjects.value) {
    buttons.push('edit', 'merge')
  }
  return buttons
})

const canMergeProjects = computed(() => canUpdateProjects.value)

const showDeletedProjectsTab = computed(
  () => canUpdateProjects.value && (isSuperAdmin.value || isNationalStaff.value || isCountyStaff.value)
)

const activeProjectsCount = computed(() => {
  if (needsClientSideProjectFilter.value) return clientFilteredProjects.value.length
  return total.value
})

const projectSegments = computed(() => {
  const segments = [{ label: `Projects (${activeProjectsCount.value})`, value: 'Projects' }]
  if (showDeletedProjectsTab.value) {
    segments.push({ label: `Deleted (${deletedProjectsCount.value})`, value: 'Deleted' })
  }
  return segments
})

const displayTableData = computed(() => {
  if (activeSegment.value === 'Deleted') return deletedProjects.value
  if (needsClientSideProjectFilter.value) {
    const start = (currentPage.value - 1) * pageSize.value
    return clientFilteredProjects.value.slice(start, start + pageSize.value)
  }
  return tableDataList.value
})

const displayTotal = computed(() => {
  if (activeSegment.value === 'Deleted') return deletedProjects.value.length
  if (needsClientSideProjectFilter.value) return clientFilteredProjects.value.length
  return total.value
})

async function applyProjectListFilters() {
  syncProjectListQueryFilters()
  page.value = 1
  currentPage.value = 1
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

async function applyProjectFiltersFromDrawer() {
  projectFiltersDrawerVisible.value = false
  await applyProjectListFilters()
}

async function clearProjectFiltersFromDrawer() {
  filterStatus.value = []
  filterScope.value = []
  filterConfiguration.value = []
  await applyProjectListFilters()
}

async function fetchDeletedProjectHistory(): Promise<any[]> {
  const formData: any = {
    model: 'project_history',
    searchField: 'title',
    excludeGeom: true,
    associated_multiple_models: ['users'],
    filters: ['change_type', 'status'],
    filterValues: [['Delete', 'Merge'], ['Open']],
    returnAll: true,
  }
  const res = await getSettlementListByCounty(formData)
  const activeComponentId = resolveRouteComponentId(route)
  const out: any[] = []
  ;(res.data || []).forEach((item: any) => {
    const beforeObject = item.changes?.before
    if (!beforeObject) return
    if (activeComponentId != null && Number(beforeObject.component_id) !== Number(activeComponentId)) return
    if (roles_filters.length > 0 && !isSuperAdmin.value && !isNationalStaff.value) {
      const allowed = roles_filters.every((rf: any) => {
        if (!rf.field || rf.value == null) return true
        if (rf.field === 'county_id') {
          return Array.isArray(rf.value)
            ? rf.value.includes(beforeObject.county_id)
            : beforeObject.county_id === rf.value
        }
        return true
      })
      if (!allowed) return
    }
    out.push({
      ...beforeObject,
      history_id: item.id,
      _changeType: item.change_type || 'Delete',
      _mergedInto: item.changes?.primary_record?.title || null,
      _primaryProjectId: item.changes?.primary_id || item.changes?.primary_record?.id || null,
      _deletedAt: item.createdAt,
      _deletedBy: item.user?.username || item.users?.username || 'Unknown',
    })
  })
  return out
}

async function refreshDeletedProjectCount() {
  if (!showDeletedProjectsTab.value) return
  try {
    const rows = await fetchDeletedProjectHistory()
    deletedProjectsCount.value = rows.length
  } catch {
    deletedProjectsCount.value = 0
  }
}

async function loadDeletedProjects() {
  loading.value = true
  try {
    deletedProjects.value = await fetchDeletedProjectHistory()
    deletedProjectsCount.value = deletedProjects.value.length
  } finally {
    loading.value = false
  }
}

const onProjectSegmentChange = async (val: string) => {
  clearProjectMergeSelection()
  if (val === 'Deleted') {
    if (!showDeletedProjectsTab.value) {
      activeSegment.value = 'Projects'
      ElMessage.warning('You do not have permission to view deleted projects.')
      return
    }
    await loadDeletedProjects()
    return
  }
  loading.value = true
  try {
    await getFilteredData()
  } finally {
    loading.value = false
  }
}

type ProjectConfirmSection = {
  title: string
  lines: string[]
}

function escapeConfirmHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildProjectConfirmMessage(
  intro: string,
  sections: ProjectConfirmSection[],
  bullets: string[] = [],
): string {
  let html = `<p class="project-confirm-intro">${escapeConfirmHtml(intro)}</p>`

  for (const section of sections) {
    if (!section.lines.length) continue
    html += `<p class="project-confirm-section-title">${escapeConfirmHtml(section.title)}</p>`
    html += '<ul class="project-confirm-list">'
    for (const line of section.lines) {
      html += `<li>${escapeConfirmHtml(line)}</li>`
    }
    html += '</ul>'
  }

  if (bullets.length) {
    html += '<p class="project-confirm-section-title">This will:</p>'
    html += '<ul class="project-confirm-list project-confirm-list--bullets">'
    for (const bullet of bullets) {
      html += `<li>${escapeConfirmHtml(bullet)}</li>`
    }
    html += '</ul>'
  }

  return html
}

const projectConfirmBoxOptions = {
  dangerouslyUseHTMLString: true,
  customClass: 'project-confirm-box',
  type: 'warning' as const,
  cancelButtonText: 'Cancel',
}

async function restoreDeletedProjectRow(row: any): Promise<'success' | 'already' | 'failed'> {
  const isMerge = row._changeType === 'Merge'
  const res = isMerge
    ? await revertMerge({ model: 'project', history_id: row.history_id } as any)
    : await revertHistory({ model: 'project', history_id: row.history_id } as any)
  if (res.code === '0000') return 'success'
  if (res.code === '1003') return 'already'
  return 'failed'
}

const restoreDeletedProjectLoading = ref(false)

const restoreDeletedProject = async (row: any) => {
  if (!canUpdateProjects.value) {
    ElMessage.warning('You do not have permission to restore projects.')
    return
  }

  const isMerge = row._changeType === 'Merge'
  try {
    await ElMessageBox.confirm(
      buildProjectConfirmMessage(
        isMerge ? 'Restore this merged project?' : 'Restore this deleted project?',
        [
          {
            title: 'Project',
            lines: [`${row.title} (ID: ${row.id})`],
          },
          ...(isMerge
            ? [{
                title: 'Previously merged into',
                lines: [row._mergedInto || 'Primary project'],
              }]
            : []),
        ],
        isMerge
          ? ['Move linked records back to the restored project where possible']
          : [
              'Recreate locations, activities, disbursements, and other saved records where possible',
              'Return the project to the active projects list',
            ],
      ),
      isMerge ? 'Restore merged project' : 'Restore project',
      {
        ...projectConfirmBoxOptions,
        confirmButtonText: 'Restore',
        width: 440,
      },
    )
    const result = await restoreDeletedProjectRow(row)
    if (result === 'success') {
      ElMessage.success('Project restored successfully.')
      await loadDeletedProjects()
      if (activeSegment.value !== 'Deleted') {
        await getFilteredData()
      }
    } else if (result === 'already') {
      ElMessage.info(isMerge ? 'This merge was already reverted.' : 'This project was already restored.')
      await loadDeletedProjects()
    } else {
      ElMessage.error('Failed to restore project.')
    }
  } catch (error: any) {
    const code = error?.response?.data?.code
    if (code === '1003') {
      ElMessage.info(row._changeType === 'Merge' ? 'This merge was already reverted.' : 'This project was already restored.')
      await loadDeletedProjects()
      return
    }
    if (error !== 'cancel' && error?.message !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || error?.message || 'Failed to restore project.')
    }
  }
}

const restoreSelectedDeletedProjects = async () => {
  if (!canUpdateProjects.value) {
    ElMessage.warning('You do not have permission to restore projects.')
    return
  }

  const rows = [...selectedProjects.value]
  if (rows.length === 0) {
    ElMessage.warning('Select at least one project to restore')
    return
  }

  const mergeCount = rows.filter((row) => row._changeType === 'Merge').length
  const deleteCount = rows.length - mergeCount
  const sections: ProjectConfirmSection[] = [
    {
      title: 'Selected projects',
      lines: rows.map((row) => `${row.title} (ID: ${row.id})`),
    },
  ]
  if (mergeCount > 0 && deleteCount > 0) {
    sections.unshift({
      title: 'Breakdown',
      lines: [`${deleteCount} deleted`, `${mergeCount} merged`],
    })
  }
  const bullets =
    mergeCount > 0 && deleteCount > 0
      ? [
          'Restore deleted projects with saved records where possible',
          'Move linked records back for merged projects where possible',
        ]
      : mergeCount > 0
        ? ['Move linked records back to each restored project where possible']
        : [
            'Recreate locations, activities, disbursements, and other saved records where possible',
            'Return restored projects to the active projects list',
          ]

  try {
    await ElMessageBox.confirm(
      buildProjectConfirmMessage(
        `Restore ${rows.length} selected project(s)?`,
        sections,
        bullets,
      ),
      'Restore selected projects',
      {
        ...projectConfirmBoxOptions,
        confirmButtonText: 'Restore all',
        width: 480,
      },
    )
  } catch {
    return
  }

  restoreDeletedProjectLoading.value = true
  let success = 0
  let already = 0
  let failed = 0

  try {
    for (const row of rows) {
      try {
        const result = await restoreDeletedProjectRow(row)
        if (result === 'success') success += 1
        else if (result === 'already') already += 1
        else failed += 1
      } catch (error: any) {
        if (error?.response?.data?.code === '1003') {
          already += 1
        } else {
          failed += 1
        }
      }
    }

    if (success > 0 && failed === 0 && already === 0) {
      ElMessage.success(`Restored ${success} project(s) successfully.`)
    } else if (success > 0) {
      ElMessage.warning(`Restored ${success}, ${already} already restored, ${failed} failed.`)
    } else if (already > 0 && failed === 0) {
      ElMessage.info('Selected project(s) were already restored.')
    } else {
      ElMessage.error('Failed to restore selected projects.')
    }

    clearProjectMergeSelection()
    await loadDeletedProjects()
  } finally {
    restoreDeletedProjectLoading.value = false
  }
}

function getProjectTableRowKey(row: any) {
  return activeSegment.value === 'Deleted' ? row.history_id : row.id
}

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
  locations_loading.value = true
  project_locations.value = []

  try {
    const formData: any = {
      model: 'project_location',
      searchField: 'name',
      searchKeyword: '',
      filters: ['project_id'],
      filterValues: [[project_id]],
      associated_multiple_models: [],
    }

    const res = await getSettlementListByCounty(formData as any)
    const sett_ids = (res as any).data?.map((item: any) => item.settlement_id) || []

    if (sett_ids.length === 0) {
      return
    }

    const form: any = {
      model: 'settlement',
      filters: ['id'],
      filterValues: [sett_ids],
      excludeGeom: true,
      associated_multiple_models: ['county'],
    }

    const setts = await getSettlementListByCounty(form as any)
    const settlements = (setts as any).data?.map((item: any) => ({
      county: item.county?.name || 'N/A',
      subcounty: item.subcounty?.name || 'N/A',
      ward: item.ward?.name || 'N/A',
      settlement: item.name || 'N/A',
      settlement_id: item.id,
    })) || []

    project_locations.value = (res as any).data?.map((projectLocation: any) => {
      const settlement = settlements.find(
        (sett: any) => sett.settlement_id === projectLocation.settlement_id
      )
      return {
        ...projectLocation,
        county: settlement ? settlement.county : null,
        subcounty: settlement ? settlement.subcounty : null,
        ward: settlement ? settlement.ward : null,
        settlementName: settlement ? settlement.settlement : null,
      }
    }) || []
  } catch (error) {
    console.error('Error fetching project locations:', error)
    project_locations.value = []
  } finally {
    locations_loading.value = false
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

const selectedProjects = ref<any[]>([])
const mergeDialogVisible = ref(false)
const mergeOpenLoading = ref(false)
const mergeLoading = ref(false)
const currentProjectForMerge = ref<any>(null)
const selectedProjectForMerge = ref<any>(null)
const mergePrimaryId = ref<number | null>(null)
const mergeSearchQuery = ref('')
const mergeSearchResults = ref<any[]>([])
const mergeSearchLoading = ref(false)

const mergeDrawerSize = computed(() => (isMobile.value ? '100%' : '640px'))

function formatProjectMergeLabel(project: any) {
  const programme = project?.programme?.acronym ? ` · ${project.programme.acronym}` : ''
  return `${project?.title || 'Untitled'} (ID: ${project?.id})${programme}`
}

const handleProjectSelectionChange = (selection: any[]) => {
  selectedProjects.value = selection
}

const handleMerge = async (project: any) => {
  if (!canMergeProjects.value) {
    ElMessage.warning('You do not have permission to merge projects.')
    return
  }

  mergeOpenLoading.value = true
  currentProjectForMerge.value = project
  mergePrimaryId.value = Number(project.id)
  selectedProjectForMerge.value = null
  mergeSearchQuery.value = ''
  mergeSearchResults.value = []
  mergeDialogVisible.value = true

  try {
    await nextTick()
  } finally {
    mergeOpenLoading.value = false
  }
}

const searchProjectsForMerge = async (keyword = '') => {
  const query = String(keyword ?? mergeSearchQuery.value ?? '').trim()
  mergeSearchQuery.value = query

  if (!query || query.length < 2) {
    mergeSearchResults.value = []
    return
  }

  mergeSearchLoading.value = true
  try {
    const { queryFilters, queryFilterValues, activeComponentId } = buildProjectQueryFilters()
    if (activeComponentId == null || !currentProjectForMerge.value) {
      mergeSearchResults.value = []
      return
    }

    const formData: any = {
      curUser: 1,
      model: 'project',
      searchField: 'title',
      searchKeyword: query,
      excludeGeom: true,
      filters: queryFilters,
      filterValues: queryFilterValues,
      associated_multiple_models: ['programme'],
      limit: 20,
      page: 1,
    }

    const res = await searchByKeyWord(formData)
    mergeSearchResults.value = (res.data || []).filter(
      (project: any) => Number(project.id) !== Number(currentProjectForMerge.value.id)
    )
  } catch (error) {
    console.error('Error searching projects for merge:', error)
    ElMessage.error('Failed to search projects')
    mergeSearchResults.value = []
  } finally {
    mergeSearchLoading.value = false
  }
}

watch(selectedProjectForMerge, (newValue, oldValue) => {
  if (newValue && !oldValue && currentProjectForMerge.value) {
    mergePrimaryId.value = Number(currentProjectForMerge.value.id)
  }
})

const clearMergeSearchSelection = () => {
  mergeSearchResults.value = []
  selectedProjectForMerge.value = null
  mergeSearchQuery.value = ''
  if (currentProjectForMerge.value) {
    mergePrimaryId.value = Number(currentProjectForMerge.value.id)
  }
}

async function executeProjectMerge(primaryId: number, duplicateIds: number[]) {
  if (!canMergeProjects.value) {
    ElMessage.warning('You do not have permission to merge projects.')
    return
  }

  mergeLoading.value = true
  try {
    const res = await mergeDuplicates({
      model: 'project',
      primaryId,
      duplicateIds,
    } as any)

    if (res.code === '0000') {
      const mergeHistoryInfo = res.mergeHistory || []
      const historyMessage = mergeHistoryInfo.length > 0
        ? ` Tracked in history (ID: ${mergeHistoryInfo[0].history_id}).`
        : ''

      ElMessage.success({
        message: `Projects merged successfully. Related locations, activities, reports, and documents were moved to the primary project.${historyMessage}`,
        duration: 6000,
        showClose: true,
      })

      mergeDialogVisible.value = false
      currentProjectForMerge.value = null
      selectedProjectForMerge.value = null
      mergeSearchQuery.value = ''
      mergeSearchResults.value = []
      selectedProjects.value = []
      tableRef.value?.clearSelection?.()

      if (searchString.value) {
        await getFilteredBySearchData(searchString.value)
      } else {
        await getFilteredData()
      }
      void refreshDeletedProjectCount()
    } else {
      ElMessage.error('Failed to merge projects')
    }
  } catch (error: any) {
    console.error('Error merging projects:', error)
    ElMessage.error(error?.response?.data?.message || error?.message || 'Failed to merge projects')
  } finally {
    mergeLoading.value = false
  }
}

const confirmProjectMerge = async () => {
  if (!canMergeProjects.value) {
    ElMessage.warning('You do not have permission to merge projects.')
    return
  }

  if (!selectedProjectForMerge.value || !currentProjectForMerge.value || !mergePrimaryId.value) {
    ElMessage.warning('Select a project to merge with and choose the primary record')
    return
  }

  const primaryId = Number(mergePrimaryId.value)
  const duplicateId = primaryId === Number(currentProjectForMerge.value.id)
    ? Number(selectedProjectForMerge.value.id)
    : Number(currentProjectForMerge.value.id)

  const primaryProject = primaryId === Number(currentProjectForMerge.value.id)
    ? currentProjectForMerge.value
    : selectedProjectForMerge.value
  const duplicateProject = duplicateId === Number(currentProjectForMerge.value.id)
    ? currentProjectForMerge.value
    : selectedProjectForMerge.value

  try {
    await ElMessageBox.confirm(
      buildProjectConfirmMessage(
        'You are about to merge these projects:',
        [
          {
            title: 'Primary (kept)',
            lines: [`${primaryProject.title} (ID: ${primaryProject.id})`],
          },
          {
            title: 'Merged into primary',
            lines: [`${duplicateProject.title} (ID: ${duplicateProject.id})`],
          },
        ],
        [
          'Keep the primary project record',
          'Move locations, activities, indicators, reports, and linked records to the primary project',
          'Remove the merged project from the active list',
        ],
      ),
      'Confirm merge',
      {
        ...projectConfirmBoxOptions,
        confirmButtonText: 'Merge',
        width: 480,
      },
    )
  } catch {
    return
  }

  await executeProjectMerge(primaryId, [duplicateId])
}

const clearProjectMergeSelection = () => {
  selectedProjects.value = []
  tableRef.value?.clearSelection?.()
}

const handleMergeFromSelection = async () => {
  if (!canMergeProjects.value) {
    ElMessage.warning('You do not have permission to merge projects.')
    return
  }

  if (selectedProjects.value.length < 2) {
    ElMessage.warning('Select at least 2 projects to merge')
    return
  }

  const primary = selectedProjects.value[0]
  const duplicates = selectedProjects.value.slice(1)
  const componentIds = new Set(selectedProjects.value.map((project) => Number(project.component_id)))

  if (componentIds.size > 1) {
    ElMessage.warning('Selected projects must belong to the same component')
    return
  }

  try {
    await ElMessageBox.confirm(
      buildProjectConfirmMessage(
        `Merge ${selectedProjects.value.length} selected projects?`,
        [
          {
            title: 'Primary (kept)',
            lines: [`${primary.title} (ID: ${primary.id})`],
          },
          {
            title: 'Merged into primary',
            lines: duplicates.map((project) => `${project.title} (ID: ${project.id})`),
          },
        ],
        [
          'Keep the primary project record',
          'Move locations, activities, indicators, reports, and linked records to the primary project',
          'Remove merged projects from the active list',
        ],
      ),
      'Confirm merge',
      {
        ...projectConfirmBoxOptions,
        confirmButtonText: 'Merge',
        width: 480,
      },
    )
  } catch {
    return
  }

  await executeProjectMerge(Number(primary.id), duplicates.map((project) => Number(project.id)))
}






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
  if (!isSettlementLocation(location)) return

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

    <div class="project-list-toolbar">
      <el-button type="primary" plain :icon="Back" @click="goBack">
        Back
      </el-button>
      <el-select
        v-model="value3"
        multiple
        clearable
        filterable
        remote
        :remote-method="searchByName"
        reserve-keyword
        placeholder="Search by Title"
        class="project-list-search"
      />
      <el-badge
        v-if="activeSegment !== 'Deleted'"
        :value="activeProjectFilterCount"
        :hidden="activeProjectFilterCount === 0"
        class="project-list-filter-badge"
      >
        <el-tooltip content="Filters" placement="top">
          <el-button :icon="Filter" @click="projectFiltersDrawerVisible = true" />
        </el-tooltip>
      </el-badge>
      <div class="project-list-actions">
        <PermissionWrapper :permissions="['project:create']">
          <el-tooltip content="Add Project" placement="top">
            <el-button @click="AddProject" type="primary" :icon="Plus" />
          </el-tooltip>
        </PermissionWrapper>
        <PermissionWrapper :permissions="['project:create']">
          <el-tooltip content="Download Project Data" placement="top">
            <el-button @click="DownloadXlsx" type="success" :icon="Download" />
          </el-tooltip>
        </PermissionWrapper>
      </div>
    </div>

    <el-drawer
      v-model="projectFiltersDrawerVisible"
      title="Project filters"
      direction="rtl"
      size="320px"
      class="project-filters-drawer"
    >
      <div class="project-filters-drawer__body">
        <label class="project-filters-drawer__label">Status</label>
        <el-select
          v-model="filterStatus"
          multiple
          clearable
          filterable
          collapse-tags
          collapse-tags-tooltip
          placeholder="Status"
          style="width: 100%;"
        >
          <el-option
            v-for="item in projectStatusFilterOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <label class="project-filters-drawer__label">Configuration</label>
        <el-select
          v-model="filterConfiguration"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
          placeholder="Configuration"
          style="width: 100%;"
        >
          <el-option
            v-for="item in projectConfigurationFilterOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <label class="project-filters-drawer__label">Scope</label>
        <el-select
          v-model="filterScope"
          multiple
          clearable
          filterable
          collapse-tags
          collapse-tags-tooltip
          placeholder="Scope"
          style="width: 100%;"
        >
          <el-option
            v-for="item in projectScopeFilterOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <template #footer>
        <div class="project-filters-drawer__footer">
          <el-button @click="clearProjectFiltersFromDrawer">Clear</el-button>
          <el-button type="primary" @click="applyProjectFiltersFromDrawer">Apply</el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer
      v-model="mergeDialogVisible"
      title="Merge project"
      direction="rtl"
      :size="mergeDrawerSize"
      :close-on-click-modal="false"
      destroy-on-close
      class="merge-project-drawer"
    >
      <div v-if="currentProjectForMerge" v-loading="mergeOpenLoading" class="merge-drawer-scroll">
        <el-radio-group v-model="mergePrimaryId" class="merge-primary-group">
          <el-row :gutter="12">
            <el-col :xs="24" :md="12">
              <el-card
                shadow="hover"
                :class="{ 'merge-primary-card': mergePrimaryId === Number(currentProjectForMerge.id) }"
              >
                <template #header>
                  <div class="merge-card-header">
                    <span><strong>Current project</strong></span>
                    <el-radio :value="Number(currentProjectForMerge.id)">Set as primary</el-radio>
                  </div>
                </template>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="ID">{{ currentProjectForMerge.id }}</el-descriptions-item>
                  <el-descriptions-item label="Title">{{ currentProjectForMerge.title }}</el-descriptions-item>
                  <el-descriptions-item label="Status">{{ currentProjectForMerge.status || 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item label="Programme">{{ currentProjectForMerge.programme?.acronym || 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item label="Scope">{{ currentProjectForMerge.implementation_scope || 'N/A' }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-card
                shadow="hover"
                :class="{ 'merge-primary-card': selectedProjectForMerge && mergePrimaryId === Number(selectedProjectForMerge.id) }"
              >
                <template #header>
                  <div class="merge-card-header">
                    <span><strong>Merge with</strong></span>
                    <el-radio
                      v-if="selectedProjectForMerge"
                      :value="Number(selectedProjectForMerge.id)"
                    >
                      Set as primary
                    </el-radio>
                  </div>
                </template>

                <p class="merge-search-heading">Search by title</p>
                <el-select
                  v-model="selectedProjectForMerge"
                  filterable
                  remote
                  :remote-method="searchProjectsForMerge"
                  :loading="mergeSearchLoading"
                  placeholder="Search project to merge with..."
                  clearable
                  value-key="id"
                  style="width: 100%;"
                  @clear="clearMergeSearchSelection"
                >
                  <el-option
                    v-for="item in mergeSearchResults"
                    :key="item.id"
                    :label="formatProjectMergeLabel(item)"
                    :value="item"
                  />
                </el-select>
                <p class="merge-search-hint">Type at least 2 characters to search projects in this component.</p>

                <div v-if="selectedProjectForMerge" class="merge-selected-details">
                  <el-descriptions :column="1" border size="small" title="Selected project">
                    <el-descriptions-item label="ID">{{ selectedProjectForMerge.id }}</el-descriptions-item>
                    <el-descriptions-item label="Title">{{ selectedProjectForMerge.title }}</el-descriptions-item>
                    <el-descriptions-item label="Status">{{ selectedProjectForMerge.status || 'N/A' }}</el-descriptions-item>
                    <el-descriptions-item label="Programme">{{ selectedProjectForMerge.programme?.acronym || 'N/A' }}</el-descriptions-item>
                    <el-descriptions-item label="Scope">{{ selectedProjectForMerge.implementation_scope || 'N/A' }}</el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-radio-group>

        <el-alert
          v-if="selectedProjectForMerge && mergePrimaryId"
          :title="`Project ID ${mergePrimaryId === Number(currentProjectForMerge.id) ? selectedProjectForMerge.id : currentProjectForMerge.id} will be merged into project ID ${mergePrimaryId}`"
          type="warning"
          :closable="false"
          class="merge-drawer-alert"
        />
      </div>

      <template #footer>
        <div class="merge-drawer-footer">
          <el-button :disabled="mergeLoading || mergeOpenLoading" @click="mergeDialogVisible = false">Cancel</el-button>
          <el-button
            type="primary"
            :disabled="!selectedProjectForMerge || !mergePrimaryId || mergeLoading || mergeOpenLoading"
            :loading="mergeLoading"
            @click="confirmProjectMerge"
          >
            Merge projects
          </el-button>
        </div>
      </template>
    </el-drawer>

    <div class="project-list-hint-row">
      <el-alert
        type="info"
        :closable="false"
        :show-icon="false"
        class="project-list-hint"
      >
        <template #default>
          <span v-if="activeSegment === 'Deleted'" style="font-size: 12px;">💡 Deleted and merged projects appear here and can be restored. Merged projects restore their linked records from the primary project where possible.</span>
          <span v-else style="font-size: 12px;">💡 Double-click on any row to view project details</span>
        </template>
      </el-alert>
      <div class="project-list-segment-controls">
        <div class="project-segment-toolbar">
          <div
            v-if="activeSegment === 'Deleted' && canUpdateProjects && selectedProjects.length > 0"
            class="project-selection-actions"
          >
            <el-button
              type="success"
              plain
              :loading="restoreDeletedProjectLoading"
              :disabled="restoreDeletedProjectLoading"
              @click="restoreSelectedDeletedProjects"
            >
              Restore {{ selectedProjects.length }}
            </el-button>
            <el-button
              plain
              :disabled="restoreDeletedProjectLoading"
              @click="clearProjectMergeSelection"
            >
              Clear
            </el-button>
          </div>
          <div
            v-if="activeSegment !== 'Deleted' && canMergeProjects && selectedProjects.length >= 2"
            class="project-selection-actions"
          >
            <el-button
              type="danger"
              plain
              :icon="mergeLoading ? undefined : TakeawayBox"
              :loading="mergeLoading"
              :disabled="mergeLoading"
              @click="handleMergeFromSelection"
            >
              Merge {{ selectedProjects.length }}
            </el-button>
            <el-button
              plain
              :disabled="mergeLoading"
              @click="clearProjectMergeSelection"
            >
              Clear
            </el-button>
          </div>
          <el-segmented
            v-if="showDeletedProjectsTab"
            v-model="activeSegment"
            :options="projectSegments"
            class="project-list-segments"
            @change="onProjectSegmentChange"
          />
        </div>
      </div>
    </div>

    <el-table
ref="tableRef" :row-key="getProjectTableRowKey" :data="displayTableData" style="width: 100%; margin-top: 10px;" border
      :row-class-name="tableRowClassName" :row-style="{ height: '40px' }"
      v-loading="loading"
      :class="['interventions-project-table', { 'interventions-project-table--deleted': activeSegment === 'Deleted' }]"
      @row-dblclick="handleRowDblClick"
      @selection-change="handleProjectSelectionChange"
    >
      <el-table-column
        v-if="(activeSegment !== 'Deleted' && canMergeProjects) || (activeSegment === 'Deleted' && canUpdateProjects)"
        type="selection"
        width="48"
        align="center"
      />
      <el-table-column v-if="activeSegment !== 'Deleted'" label="" width="48" align="center">
        <template #default="{ row }">
          <el-tooltip :content="projectConfiguration(row).label" placement="top">
            <Icon
              :icon="projectConfiguration(row).icon"
              width="20"
              height="20"
              :style="{ color: projectConfiguration(row).color }"
            />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        label="Project Title"
        prop="title"
        :min-width="activeSegment === 'Deleted' ? 180 : 250"
        class-name="project-title-column"
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
            <span class="project-title">{{ row.title }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        v-if="activeSegment !== 'Deleted'"
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
        v-if="activeSegment !== 'Deleted'"
        label="Locations"
        prop="project_location"
        min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <template v-for="display in [getProjectListLocationDisplay(row)]" :key="display.rowKey">
            <template v-if="display.locations.length > 0">
              <el-tooltip
                placement="top"
                effect="dark"
                :disabled="display.hiddenCount === 0"
              >
                <template #content>
                  {{ display.summary }}
                </template>
                <div class="locations-container locations-container--ellipsis">
                  <div class="location-list">
                    <span
                      v-for="(location, index) in display.visible"
                      :key="location.id ?? `${location.location_type}-${index}`"
                      class="location-item"
                    >
                      <span class="location-item-inner">
                        <Icon
                          v-if="locationHasGeoPoint(location)"
                          icon="mdi:map-marker"
                          class="location-geo-marker"
                          title="Pinned map location"
                        />
                        <span
                          v-if="isSettlementLocation(location)"
                          @click.stop="goToSettlementMap(location)"
                          class="settlement-link"
                          :title="`View ${resolveProjectLocationLabel(location)} on map`"
                        >
                          {{ resolveProjectLocationLabel(location) }}
                        </span>
                        <span v-else class="location-name">
                          {{ resolveProjectLocationLabel(location) }}
                        </span>
                      </span>
                      <span v-if="index < display.visible.length - 1" class="location-separator">, </span>
                    </span>
                    <span v-if="display.hiddenCount > 0" class="location-more">
                      … +{{ display.hiddenCount }} more
                    </span>
                  </div>
                </div>
              </el-tooltip>
            </template>
            <span v-else-if="row.implementation_scope === 'national'" class="no-locations">National scope</span>
            <span v-else class="no-locations">No locations configured</span>
          </template>
        </template>
      </el-table-column>
      <el-table-column
        v-if="activeSegment === 'Deleted'"
        label="Reason"
        width="90"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span>{{ row._changeType === 'Merge' ? 'Merged' : 'Deleted' }}</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="activeSegment === 'Deleted'"
        label="Merged into"
        min-width="140"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span v-if="row._changeType === 'Merge' && row._mergedInto">{{ row._mergedInto }}</span>
          <span v-else class="no-locations">—</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="activeSegment === 'Deleted'"
        label="Removed By"
        prop="_deletedBy"
        width="120"
        show-overflow-tooltip
      />
      <el-table-column
        v-if="activeSegment === 'Deleted'"
        label="Removed At"
        prop="_deletedAt"
        width="110"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span>{{ row._deletedAt ? moment(row._deletedAt).format('DD/MM/YYYY') : '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="activeSegment === 'Deleted' && canUpdateProjects"
        label="Restore"
        width="100"
        align="center"
        class-name="project-restore-column"
      >
        <template #default="{ row }">
          <div @click.stop>
            <el-button
              type="success"
              size="small"
              plain
              @click="restoreDeletedProject(row)"
            >
              Restore
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-else label="" width="68" align="center" fixed="right">
        <template #default="{ row }">
          <div @click.stop>
            <TableActions
              :item="row"
              :buttons="projectActionButtons"
              @preview="viewProject"
              @edit="editProjectFromList"
              @merge="handleMerge"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>

    <ElPagination
v-if="activeSegment !== 'Deleted'"
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 100]" :total="displayTotal" :background="true"
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

.project-list-toolbar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.project-list-search {
  flex: 1;
  min-width: 220px;
}

.project-list-filter-badge {
  flex-shrink: 0;
}

.project-list-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.project-list-hint-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  margin-bottom: 4px;
  width: 100%;
  flex-wrap: wrap;
}

.project-list-segment-controls {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
  margin-left: auto;
}

.project-segment-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.project-selection-actions {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  background-color: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  gap: 2px;
  flex-shrink: 0;
}

.project-selection-actions :deep(.el-button) {
  height: 28px;
  padding: 0 12px;
  margin: 0;
  border: none;
  border-radius: calc(var(--el-border-radius-base) - 2px);
  font-size: var(--el-font-size-base);
  font-weight: 400;
}

.project-selection-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.project-list-segments {
  flex-shrink: 0;
}

.project-list-segments :deep(.el-segmented) {
  --el-segmented-item-selected-color: var(--el-color-white);
}

.project-list-segments :deep(.el-segmented__item) {
  min-height: 28px;
  padding: 0 12px;
  font-size: var(--el-font-size-base);
}

.project-list-hint {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 6px 12px;
}

.project-list-hint :deep(.el-alert__content) {
  padding: 0;
}

.project-filters-drawer__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-filters-drawer__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.project-filters-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.merge-primary-group {
  width: 100%;
}

.merge-project-drawer {
  display: flex;
  flex-direction: column;
  height: 45vh !important;
  max-height: 45vh;
  top: 27.5vh;
  bottom: auto;
}

.merge-project-drawer :deep(.el-drawer__header) {
  flex-shrink: 0;
  margin-bottom: 0;
  padding: 10px 16px;
}

.merge-project-drawer :deep(.el-drawer__body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.merge-drawer-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 14px 12px;
}

.merge-drawer-alert {
  margin-top: 10px;
}

.merge-drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

.merge-project-drawer :deep(.el-drawer__footer) {
  flex-shrink: 0;
  padding: 8px 16px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.merge-project-drawer :deep(.el-card__header) {
  padding: 8px 12px;
}

.merge-project-drawer :deep(.el-card__body) {
  padding: 10px 12px;
}

.merge-project-drawer :deep(.el-descriptions__cell) {
  padding: 4px 8px !important;
}

.merge-project-drawer :deep(.el-descriptions__label),
.merge-project-drawer :deep(.el-descriptions__content) {
  font-size: 12px;
  line-height: 1.35;
}

.merge-primary-card {
  border-color: var(--el-color-primary-light-5);
}

.merge-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}

.merge-search-heading {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.merge-search-hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.35;
}

.merge-selected-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.merge-selected-details :deep(.el-descriptions__header) {
  margin-bottom: 6px;
}
</style>

<style>
/* Project merge/restore confirm dialogs */
.project-confirm-box .el-message-box__message {
  max-height: 52vh;
  overflow-y: auto;
}

.project-confirm-box .project-confirm-intro {
  margin: 0 0 10px;
  font-weight: 600;
  line-height: 1.4;
}

.project-confirm-box .project-confirm-section-title {
  margin: 10px 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.project-confirm-box .project-confirm-list {
  margin: 0 0 8px;
  padding-left: 18px;
}

.project-confirm-box .project-confirm-list li {
  margin: 2px 0;
  line-height: 1.45;
  font-size: 13px;
}

.project-confirm-box .project-confirm-list--bullets li {
  list-style: disc;
}

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
  display: block;
  font-weight: 400;
  font-size: 13px;
  line-height: 1.4;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.interventions-project-table :deep(.project-title-column .cell) {
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}

.interventions-project-table--deleted :deep(.el-table__body .cell) {
  color: var(--el-text-color-secondary);
}

.interventions-project-table--deleted :deep(.project-title) {
  color: var(--el-text-color-secondary);
}

.interventions-project-table--deleted :deep(.no-locations) {
  color: var(--el-text-color-placeholder);
}

.interventions-project-table--deleted :deep(.project-title-column .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.interventions-project-table--deleted :deep(.project-restore-column .cell) {
  overflow: visible;
  padding-right: 8px !important;
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
  max-width: 100%;
}

.locations-container--ellipsis {
  overflow: hidden;
}

.location-list {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  font-size: 13px;
  line-height: 1.4;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-more {
  flex-shrink: 0;
  color: #909399;
  font-size: 12px;
  font-weight: 500;
  margin-left: 2px;
}

.interventions-project-table :deep(.el-table__row) {
  cursor: pointer;
}

.location-item {
  color: #409EFF;
  font-weight: 500;
  font-size: 13px;
}

.location-item-inner {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.location-geo-marker {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: var(--el-text-color-secondary);
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
