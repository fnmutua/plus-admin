<script setup lang="ts">
import { Descriptions } from '@/components/Descriptions'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, defineAsyncComponent, ref, reactive, computed, watch } from 'vue'
import {
  ElInput, ElButton, ElTabPane, ElTabs, ElCard, ElTable, ElTableColumn, ElMessage, ElDrawer, ElImage,  ElSelect,
  ElIcon, ElPopconfirm, ElPagination,ElRow,ElCol,ElDialog, ElForm, ElFormItem, ElOption, ElOptionGroup, ElTag, ElDescriptions, ElDescriptionsItem
} from 'element-plus'
import { useRoute } from 'vue-router'
import {
  getSettlementListByCounty,
  DeleteRecord,
  updateOneRecord,
  getNeighboringSettlements,
  getSettlementMapData
} from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { Back, Upload, Search, Edit, More, RefreshLeft, Picture, Download, Loading, Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getFile } from '@/api/summary'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Locally
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import UploadComponent from '@/views/Components/UploadComponent.vue';
import SettlementMap from '@/views/Components/SettlementMap.vue';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import {
  searchByKeyWord
} from '@/api/settlements'


import { ElCollapseTransition, ElTooltip } from 'element-plus'

import { CircleCloseFilled } from '@element-plus/icons-vue'

import { useDesign } from '@/hooks/web/useDesign'


import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'


import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import { revertHistory } from '@/api/settlements'
import { useAppStore } from '@/store/modules/app'


const { push } = useRouter()




const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

// Check if user is super admin
const isSuperAdmin = ref(
  userInfo.roles.some(role => role.name === "super_admin" || role.name === "root_admin")
);

// Check if user is a county user (not super admin or national/regional)
const isCountyUser = computed(() => {
  if (isSuperAdmin.value) {
    return false;
  }
  // Check if user has county-level role and no national/regional access
  const hasCountyRole = userInfo.roles.some(role => role.user_roles?.location_level === "county");
  const hasNationalAccess = userInfo.roles.some(role => 
    role.user_roles?.location_level === "national" || role.user_roles?.location_level === "regional"
  );
  return hasCountyRole && !hasNationalAccess;
});

// Process user roles for location-based permissions
const processedRoles = userInfo.roles.map(role => {
  let field = null;
  let fieldvalue = null;
  if (role.user_roles.location_level === "county") {
    field = "county_id";
    fieldvalue = role.user_roles.county_id;
  } else if (role.user_roles.location_level === "settlement") {
    field = "settlement_id";
    fieldvalue = role.user_roles.settlement_id;
  } else if (role.user_roles.location_level === "national" || role.user_roles.location_level === "regional") {
    // National/Regional level access - can access all settlements
    field = null;
    fieldvalue = null;
  }
  return { field, value: fieldvalue, location_level: role.user_roles.location_level };
});

// Location-aware permission checking function
const canUserAccessSettlement = (settlement: any, action: 'edit' | 'delete' | 'view'): boolean => {
  // Super admins can access everything
  if (isSuperAdmin.value) {
    return true;
  }

  // For view action, allow if user has any location access
  if (action === 'view') {
    return processedRoles.some(role => role.field !== null);
  }

  // For edit/delete actions, check specific location permissions
  return processedRoles.some(role => {
    if (!role.field) return false; // No location restriction means no access for edit/delete
    
    if (role.field === "settlement_id") {
      return settlement.id === role.value;
    } else if (role.field === "county_id") {
      return settlement.county_id === role.value;
    }
    return false;
  });
};

// Household-specific permission checking function
const canUserAccessHouseholds = (settlement: any): boolean => {
  // Super admins can access everything
  if (isSuperAdmin.value) {
    return true;
  }

  // Get user permissions
  const userPermissions = userInfo.permissions || [];
  
  // Check if user has households:read permission or all permissions
  const hasHouseholdPermission = userPermissions.includes('households:read') || 
                                 userPermissions.includes('*.*.*');
  
  if (!hasHouseholdPermission) {
    return false;
  }

  // Check location-based access - user must have access to this settlement
  return processedRoles.some(role => {
    if (!role.field) {
      // National/Regional level - has access to all settlements
      return true;
    }
    
    if (role.field === "settlement_id") {
      return settlement.id === role.value;
    } else if (role.field === "county_id") {
      return settlement.county_id === role.value;
    }
    return false;
  });
};

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

console.log('showAdminButtons',showAdminButtons.value)

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
mapboxgl.accessToken = mapboxToken

const route = useRoute()

const { t } = useI18n()

const profile = reactive({
  name: '',
  settlement_type: '',
  county: '',
  county_id: null,
  subcounty: '',
  ward: '',
  population: '',
  area: '',
  num_households: '',
  avg_household_size: '',
  land_status: '',
  parcel_owner: '',
  parcel_owner_type: '',
  landuse: '',
  development: '',
  structure_types: '',
  typical_building_materials: '',
  dist_town: '',
  dist_trunk: '',
  main_env_hazards: '',
  general_location: ''
})

const housing = reactive({
  num_households: '',
  avg_household_size: '',
  structure_types: '',
  development: '',
  typical_building_materials: '',
  avg_rent: '',
  plot_ownership_ratio: '',
  plot_tenant_ratio: ''
})

const utilities = reactive({
  electricity_availability: false,
  piped_water_availability: false,
  median_household_income: '',
  on_wayleave: false,
  on_road_reserve: false,
  near_river: false,
  encumbrance: ''
})

const vulnerability = reactive({
  climate_region: '',
  soil_type: '',
  land_cover: '',
  altitude_range: '',
  proximity_to_river: '',
  proximity_to_flood_plain: '',
  vulnerability_total_score: null as number | null,
  vulnerability_rating: ''
})

const schemaProfile = reactive<DescriptionsSchema[]>([
  {
    field: 'county',
    label: t('County')
  },
  {
    field: 'subcounty',
    label: t('SubCounty')
  },
  {
    field: 'ward',
    label: t('Ward')
  },
  {
    field: 'general_location',
    label: t('General Location'),
    span: 24
  },
  {
    field: 'name',
    label: t('Name')
  },
  {
    field: 'settlement_type',
    label: t('Type')
  },
  {
    field: 'population',
    label: t('Population')
  },
  {
    field: 'area',
    label: t('Area(Ha.)')
  },
  {
    field: 'num_households',
    label: t('Number of Households')
  },
  {
    field: 'avg_household_size',
    label: t('Average Household Size')
  },
  {
    field: 'land_status',
    label: t('Land Status')
  },
  {
    field: 'parcel_owner',
    label: t('Parcel Owner')
  },
  {
    field: 'parcel_owner_type',
    label: t('Parcel Owner Type')
  },
  {
    field: 'landuse',
    label: t('Land Use')
  },
  {
    field: 'development',
    label: t('Development Type')
  },
  {
    field: 'structure_types',
    label: t('Structure Types')
  },
  {
    field: 'typical_building_materials',
    label: t('Building Materials')
  },
  {
    field: 'dist_town',
    label: t('Distance to Town (km)')
  },
  {
    field: 'dist_trunk',
    label: t('Distance to Trunk Road (km)')
  },
  {
    field: 'main_env_hazards',
    label: t('Environmental Hazards')
  }
])

const schemaHousing = reactive<DescriptionsSchema[]>([
  {
    field: 'num_households',
    label: t('Number of Households')
  },
  {
    field: 'avg_household_size',
    label: t('Average Household Size')
  },
  {
    field: 'structure_types',
    label: t('Structure Types')
  },
  {
    field: 'development',
    label: t('Development Type')
  },
  {
    field: 'typical_building_materials',
    label: t('Building Materials')
  },
  {
    field: 'avg_rent',
    label: t('Average Rent')
  },
  {
    field: 'plot_ownership_ratio',
    label: t('Plot Ownership Ratio')
  },
  {
    field: 'plot_tenant_ratio',
    label: t('Plot Tenant Ratio')
  }
])

const schemaUtilities = reactive<DescriptionsSchema[]>([
  {
    field: 'electricity_availability',
    label: t('Electricity Available')
  },
  {
    field: 'piped_water_availability',
    label: t('Piped Water Available')
  },
  {
    field: 'median_household_income',
    label: t('Median Household Income')
  },
  {
    field: 'on_wayleave',
    label: t('On Wayleave')
  },
  {
    field: 'on_road_reserve',
    label: t('On Road Reserve')
  },
  {
    field: 'near_river',
    label: t('Near River')
  },
  {
    field: 'encumbrance',
    label: t('Encumbrance')
  }
])


const page = ref(1)
const pSize = ref(5)
const drawer = ref(false)
////Configurations //////////////

//// ------------------parameters -----------------------////
var filters = ['id']
const id = route.params.id
var intervenComponent = [id] // the Id of the settleemnt to filter with
var filterValues = [intervenComponent]

//const associated_Model = ''
const associated_multiple_models = ['settlement_status', 'county', 'subcounty', 'ward', 'document']
const model = 'settlement'

const nested_models = ['document', 'document_type'] // The mother, then followed by the child
const settGeom = ref()

//// ------------------parameters -----------------------////

const settlementDocuments = ref([])


let settlement = reactive({
  count: 0,
  name: 'unnwo',
  flag: false
})
////////////

function flattenObject(obj, parentKey = '', separator = '.') {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = parentKey ? `${parentKey}${separator}${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], fullKey, separator));
    } else {
      acc[fullKey] = obj[key];
    }
    return acc;
  }, {});
}


const editHistory = ref([])

interface FormData {
  limit?: number;
  page?: number;
  curUser?: number;
  model?: string;
  searchField?: string;
  searchKeyword?: string;
  filters?: string[];
  filterValues?: any[][];
  associated_multiple_models?: string[];
  nested_models?: string[];
  excludeGeom?: boolean;
}

const getFilteredData = async (selFilters: string[], selfilterValues: any[][]) => {
  const formData: FormData = {
    limit: pSize.value,
    page: page.value,
    curUser: 1,
    model: model,
    searchField: 'name',
    searchKeyword: '',
    filters: selFilters,
    filterValues: selfilterValues,
    associated_multiple_models: associated_multiple_models,
    nested_models: nested_models
  };

  const res = await getSettlementListByCounty(formData);

  if (res?.data?.[0]) {
    const settlementData = res.data[0];
    
    // Set profile data
    profile.name = settlementData.name || '';
    profile.settlement_type = settlementData.settlement_type || '';
    profile.county = settlementData.county?.name || '';
    profile.county_id = settlementData.county_id || settlementData.county?.id || null;
    profile.subcounty = settlementData.subcounty?.name || '';
    profile.ward = settlementData.ward?.name || '';
    profile.population = settlementData.population || '';
    profile.area = settlementData.area || '';
    profile.num_households = settlementData.num_households || '';
    profile.avg_household_size = settlementData.avg_household_size || '';
    profile.land_status = settlementData.land_status || '';
    profile.parcel_owner = settlementData.parcel_owner || '';
    profile.parcel_owner_type = settlementData.parcel_owner_type || '';
    profile.landuse = settlementData.landuse || '';
    profile.development = settlementData.development || '';
    profile.structure_types = settlementData.structure_types || '';
    profile.typical_building_materials = settlementData.typical_building_materials || '';
    profile.dist_town = settlementData.dist_town || '';
    profile.dist_trunk = settlementData.dist_trunk || '';
    profile.main_env_hazards = settlementData.main_env_hazards || '';
    profile.general_location = settlementData.general_location || '';

    // Set vulnerability assessment data
    vulnerability.climate_region = settlementData.climate_region || '';
    vulnerability.soil_type = settlementData.soil_type || '';
    vulnerability.land_cover = settlementData.land_cover || '';
    vulnerability.altitude_range = settlementData.altitude_range || '';
    vulnerability.proximity_to_river = settlementData.proximity_to_river || '';
    vulnerability.proximity_to_flood_plain = settlementData.proximity_to_flood_plain || '';
    vulnerability.vulnerability_total_score = settlementData.vulnerability_total_score ?? null;
    vulnerability.vulnerability_rating = settlementData.vulnerability_rating || '';

    // Set housing data
    housing.num_households = settlementData.num_households || '';
    housing.avg_household_size = settlementData.avg_household_size || '';
    housing.structure_types = settlementData.structure_types || '';
    housing.development = settlementData.development || '';
    housing.typical_building_materials = settlementData.typical_building_materials || '';
    housing.avg_rent = settlementData.avg_rent || '';
    housing.plot_ownership_ratio = settlementData.plot_ownership_ratio || '';
    housing.plot_tenant_ratio = settlementData.plot_tenant_ratio || '';

    // Set utilities data
    utilities.electricity_availability = settlementData.electricity_availability || false;
    utilities.piped_water_availability = settlementData.piped_water_availability || false;
    utilities.median_household_income = settlementData.median_household_income || '';
    utilities.on_wayleave = settlementData.on_wayleave || false;
    utilities.on_road_reserve = settlementData.on_road_reserve || false;
    utilities.near_river = settlementData.near_river || false;
    utilities.encumbrance = settlementData.encumbrance || '';

    // Set documents
    if (settlementData.documents) {
      const nestedArray = settlementData.documents;
  settlementDocuments.value = nestedArray.map(doc => flattenObject(doc));
    }

    settGeom.value = settlementData.geom;
  }
};

const settlementId=ref(route.params.id)

onMounted(async () => {
  mapLoading.value = true
  startMapLoadingTimeout()
  getFilteredData(filters, filterValues)
  // Pre-fetch map data in parallel so Location tab can show map without fetching again
  const mapDataPromise = getSettlementMapData({ settlementId: route.params.id })
    .then((res: any) => { initialMapData.value = res?.data ?? null })
    .catch(() => { initialMapData.value = null })
  await Promise.all([
    mapDataPromise,
    getIndicatorCategoryReports(route.params.id),
    getSettlmentHistory(route.params.id),
    getProjectLocations(route.params.id),
    fetchDocumentTypes()
  ])
  console.log(settlement)
})

const router = useRouter()

// Navigate to add facility page with settlement and county info
const addFacility = () => {
  push({
    name: 'AddFacility',
    query: {
      county_id: profile.county_id || '',
      settlement_id: route.params.id || ''
    }
  })
}

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

const activeName = ref('profile')

const viewLoading = ref(false)
const loadingStates = ref({}) // Add this line to track loading state per document

const downloadFile = async (data) => {
  console.log(data);
  loadingStates.value[data.id] = true; // Set loading state for this specific document
  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  try {
    const response = await getFile(formData);
    console.log(response);

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', data.name);
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    ElMessage.error('Failed');
  } finally {
    loadingStates.value[data.id] = false; // Clear loading state for this document
  }
};





/// Uplaod docuemnts from a central component 
const addMoreDocuments = ref(false)
const currentRow = ref()
const mfield = 'settlement_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
});

function toggleComponent() {
  console.log('model data', model)
  console.log('Settlement ID', route.params.id)

  componentProps.value.showDialog = true
  // Pass settlement ID in data object
  componentProps.value.data = { id: route.params.id }


  dynamicComponent.value = null; // Unload the component
  addMoreDocuments.value = true; // Set any additional props

  setTimeout(() => {
    dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds
}







const icon = ref(`<button>  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)

const showSatellite = ref(false)

const toggleFloatingDiv = async () => {
  showSatellite.value = !showSatellite.value;
  console.log('Show Satellite', showSatellite.value);

  // Get the map style
  let style = nmap.value.getStyle();

  // Get all layers
  let allLayers = style.layers;

  // Log all layers to the console
  console.log('before ', allLayers);



  if (!showSatellite.value) {
    console.log('Remove Satellte');
    if (nmap.value.getLayer('Satellite')) {
      nmap.value.removeLayer('Satellite');
      nmap.value.removeSource('Satellite');

    }


  } else {

    console.log('Add Satellte');



    if (nmap.value.getLayer('Satellite')) {
      nmap.value.removeLayer('Satellite');
      nmap.value.removeSource('Satellite');

    } else {

      icon.value = `<button>  <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-satellite" fill="#f20707"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>650</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g fill="#fb0e0e"> <path d="M12.495,5.893 C12.832,6.231 14.184,4.877 13.847,4.541 L10.864,1.557 C10.526,1.219 9.174,2.573 9.51,2.909 L12.495,5.893 L12.495,5.893 Z" class="si-glyph-fill"> </path> <path d="M3.288,10.897 C3.072,10.68 2.597,10.802 2.23,11.168 C1.863,11.536 1.742,12.009 1.959,12.228 L3.233,13.501 C3.45,13.719 3.922,13.597 4.289,13.23 C4.658,12.864 4.779,12.388 4.562,12.172 L3.288,10.897 L3.288,10.897 Z" class="si-glyph-fill"> </path> <rect transform="translate(2.240100, 2.131300) rotate(-44.991897) translate(-2.240100, -2.131300) " x="-0.25987605" y="1.13130958" width="4.96295245" height="1.95398128" class="si-glyph-fill"> </rect> <path d="M12.088,8.374 L10.657,9.802 L9.918,9.063 L11.543,7.439 C11.814,7.168 11.81,6.723 11.531,6.447 L9.031,3.948 C8.757,3.673 8.314,3.67 8.043,3.939 L6.419,5.564 L5.684,4.829 L7.113,3.401 L5.718,2.007 L2.221,5.503 L3.614,6.897 L5.028,5.484 L5.763,6.219 L4.134,7.849 C3.864,8.12 3.866,8.564 4.141,8.838 L6.641,11.336 C6.917,11.612 7.363,11.617 7.632,11.346 L9.262,9.717 L10.001,10.456 L8.585,11.869 L9.967,13.25 L13.464,9.753 L12.088,8.374 L12.088,8.374 Z" class="si-glyph-fill"> </path> <rect transform="translate(13.426200, 12.673100) rotate(-45.056720) translate(-13.426200, -12.673100) " x="10.9262228" y="11.6731091" width="4.96795479" height="1.97998198" class="si-glyph-fill"> </rect> </g> </g> </g></svg> </button>`

      nmap.value.addLayer(
        {
          id: 'Satellite',
          source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
          type: "raster"
        },
        'country-label'
      );
    }



  }

  // Get the map style
  style = nmap.value.getStyle();

  // Get all layers
  allLayers = style.layers;

  // Log all layers to the console
  console.log('after', allLayers);

}




const nmap = ref()

const loadMap = () => {
  if (nmap.value) {
    nmap.value.remove(); // Remove existing map instance if it exists
  }
  // Assuming settGeom is a GeoJSON Feature object with geometry type like Polygon or MultiPolygon
  const centroid = turf.centroid(settGeom.value);
  const mapCenter = centroid.geometry.coordinates;

  nmap.value = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter, // starting position
    zoom: 15,
  });




  nmap.value.on("load", () => {



    nmap.value.addLayer({
      id: 'labels',
      type: 'symbol',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: centroid.value, // Replace with initial coordinates
              },
              properties: {
                title: profile.area + " Ha.", // Initialize with an empty string
              },
            },
          ],
        },
      },
      layout: {
        'text-field': ['get', 'title'],
        'text-size': 12,
        'text-anchor': 'top',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-offset': [0, 1.5]
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 2,
        'text-opacity': 0.9
      },


    });



    nmap.value.addLayer({
      id: "Streets",
      source: { type: "raster", url: "mapbox://mapbox.streets", tileSize: 256 },
      type: "raster",
    });

    nmap.value.setLayoutProperty("Satellite", "visibility", "none");


    // Add point layer
    nmap.value.addLayer({
      id: 'point-layer',
      type: 'circle',
      source: {
        type: 'geojson',
        data: settGeom.value,
      },
      paint: {
        'circle-color': 'red',
        'circle-radius': 6,
      },
      filter: ['==', '$type', 'Point'],
    });



    // Add line layer
    nmap.value.addLayer({
      id: 'line-layer',
      type: 'line',
      source: {
        type: 'geojson',
        data: settGeom.value, // Make sure settGeom.value contains a LineString
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': 'blue', // Change color as needed
        'line-width': 2, // Adjust line width
      },
      filter: ['==', '$type', 'LineString'], // Filter for LineString type
    });

    // Add polygon layer with a dotted red line and no fill
    nmap.value.addLayer({
      id: 'poly-layer',
      type: 'line', // Use 'line' type for outlines
      source: {
        type: 'geojson',
        data: settGeom.value, // Ensure settGeom.value contains a Polygon
      },
      layout: {
        'line-cap': 'round',  // Rounded line ends
        'line-join': 'round', // Rounded corners
      },
      paint: {
        'line-color': 'red', // Line color is red
        'line-width': 2, // Line width
        'line-dasharray': [4, 2], // Create a dotted line pattern (4px dash, 2px gap)
      },
      filter: ['==', '$type', 'Polygon'], // Filter for Polygon type
    });




    // Center the map on the point
    nmap.value.setCenter(mapCenter); // Use the point coordinates directly

    //  nmap.value.addControl(new MapboxLayerSwitcherControl(layers));
    const nav = new mapboxgl.NavigationControl();
    nmap.value.addControl(nav, "top-right");
    nmap.value.resize();
  });



  function updateRuleform(feature) {
    // do something with the new marker feature
    var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
    feature.geometry.crs = crs
    console.log('----feature', feature);

    const formData = {}

    formData.geom = feature.geometry
    console.log(formData)
    formData.land_size = calculateArea(feature.geometry)
    area_ha.value = calculateArea(feature.geometry)

    var centre = turf.centroid(feature.geometry);
    centroid.value = centre.geometry.coordinates

    console.log('centroid.value', centroid)

    nmap.value.getSource('labels').setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: centroid.value, // Update with the actual coordinates
          },
          properties: {
            title: area_ha.value + " Ha.", // Update with the desired label text (area)
          },
        },
      ],
    });

  }

  // listen for the draw.create event
  nmap.value.on('draw.create', function (e) {
    // check if the new feature is a marker
    // if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    //  }
  });



  function addInfo(map) {
    class LayerButton {
      onAdd() {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.innerHTML = icon.value;
        div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => toggleFloatingDiv());

        return div;
      }
    }
    const lryButton = new LayerButton();
    nmap.value.addControl(lryButton, "top-right");
  }
  addInfo(nmap)
};

const households =ref([])
const total_hh =ref(0)
//const handleCurrentChange = (page) => {
  const handleCurrentChange = async (selPage: any) => {
  page.value = selPage
  console.log(selPage)
 // page.value = page
 getHouseholds()
}

//const handleSizeChange = (size) => {
const handleSizeChange = async (size: any) => {
  console.log(size)
  pSize.value = size
  page.value = 1 // reset to first page
  getHouseholds()
}
 


const getHouseholds = async () => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = 'households'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
 
  // - multiple filters -------------------------------------
  formData.filters = ['settlement_id']
  formData.filterValues = [[route.params.id]]
  formData.associated_multiple_models = []
  formData.nested_models = []
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
  console.log(res)
  total_hh.value=res.total

  households.value=res.data

  // 

   
}

 
const clickTab = (tab) => {
  console.log('Tab clicked:', tab.props);
  localStorage.setItem('activeTab', tab.props.name);

  if (tab.props.name === 'Households') {
    // Load households data when tab is clicked
    console.log('get households...')
    getHouseholds()
  }
};




const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('descriptions')


const collapsedSections = reactive({
  location: false,
  profile: false,
  housing: false,
  utilities: false
})

const collapsedDocumentSections = reactive({})

// Initialize all document sections as collapsed when documents are loaded
const initializeDocumentSections = () => {
  // Initialize Photos section if photos exist
  if (photos.value.length > 0) {
    collapsedDocumentSections['Photos'] = true; // true means collapsed/closed
  }
  
  // Initialize other document sections
  Object.keys(groupedDocuments.value).forEach(type => {
    collapsedDocumentSections[type] = true; // true means collapsed/closed
  });
};

// Separate photos from other documents
const photos = computed(() => {
  return settlementDocuments.value.filter(doc => {
    const format = doc.format?.toLowerCase() || '';
    const isPhoto = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'tiff', 'tif'].includes(format);
    return isPhoto;
  });
});

// Photo preview state
const photoPreviewVisible = ref(false)
const currentPhoto = ref(null)
const currentPhotoIndex = ref(0)
const previewPhotoUrl = ref('')
const previewLoading = ref(false)
const downloadLoading = ref(false)

// Map loading state
const mapLoading = ref(true)
// Pre-fetched map data so SettlementMap doesn't fetch again when Location tab is shown
const initialMapData = ref(null)

// PDF generation loading state
const pdfLoading = ref(false)

// Group documents by `document_type.type` (excluding photos)
const groupedDocuments = computed(() => {
  const nonPhotoDocs = settlementDocuments.value.filter(doc => {
    const format = doc.format?.toLowerCase() || '';
    const isPhoto = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'tiff', 'tif'].includes(format);
    return !isPhoto;
  });
  
  return nonPhotoDocs.reduce((groups, doc) => {
    const type = doc["document_type.type"] || "Unknown";
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(doc);
    return groups;
  }, {});
});


const searchQuery = ref('')

// Filter and group documents by `document_type.type`
const filteredGroupedDocuments = computed(() => {
  const query = searchQuery.value.toLowerCase();

  // Filtered documents by search query across the 'name' property only
  const filteredDocs = Object.entries(groupedDocuments.value).reduce((acc, [category, docs]) => {
    const filteredDocsForCategory = docs.filter(doc =>
      doc.name && doc.name.toLowerCase().includes(query) // Check if 'name' includes the query
    );

    if (filteredDocsForCategory.length > 0) {
      acc[category] = filteredDocsForCategory;
    }

    return acc;
  }, {});

  return filteredDocs;
});

// Watch for changes in groupedDocuments and initialize sections
watch(groupedDocuments, () => {
  initializeDocumentSections();
}, { immediate: true });

// Watch for changes in filteredGroupedDocuments to reinitialize sections when search changes
watch(filteredGroupedDocuments, () => {
  initializeDocumentSections();
}, { immediate: true });

// Watch for changes in photos to ensure Photos section is properly managed
watch(photos, () => {
  initializeDocumentSections();
}, { immediate: true });





// Toggle collapse state for a specific type (accordion behavior - only one open at a time)
const toggleCollapse = (type) => {
  // Close all other sections first
  Object.keys(collapsedDocumentSections).forEach(key => {
    if (key !== type) {
      collapsedDocumentSections[key] = true; // true means collapsed/closed
    }
  });
  
  // Toggle the clicked section
  collapsedDocumentSections[type] = !collapsedDocumentSections[type];
};

// Photo preview function
const previewPhoto = async (photo, index) => {
  currentPhoto.value = photo;
  currentPhotoIndex.value = index;
  previewLoading.value = true;
  photoPreviewVisible.value = true;
  
  try {
    // Use the download structure to get the photo
    const formData = {
      filename: photo.name,
      doc_id: photo.id,
      responseType: 'blob'
    };
    
    const response = await getFile(formData);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    previewPhotoUrl.value = url;
  } catch (error) {
    console.error('Failed to load photo:', error);
    ElMessage.error('Failed to load photo');
  } finally {
    previewLoading.value = false;
  }
};

// Close photo preview
const closePhotoPreview = () => {
  photoPreviewVisible.value = false;
  currentPhoto.value = null;
  currentPhotoIndex.value = 0;
  previewPhotoUrl.value = '';
  previewLoading.value = false;
  downloadLoading.value = false;
};

// Download current photo
const downloadCurrentPhoto = async () => {
  if (!currentPhoto.value) return;
  
  downloadLoading.value = true;
  try {
    const formData = {
      filename: currentPhoto.value.name,
      doc_id: currentPhoto.value.id,
      responseType: 'blob'
    };
    
    const response = await getFile(formData);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', currentPhoto.value.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('Photo downloaded successfully');
  } catch (error) {
    console.error('Failed to download photo:', error);
    ElMessage.error('Failed to download photo');
  } finally {
    downloadLoading.value = false;
  }
};

function makePlural(word) {
  // Check if the word is already plural
  if (isPlural(word)) {
    return word;  // If it's already plural, return the word as is
  }

  // Apply regular pluralization rules if it's not plural
  if (word.endsWith("y") && !/aeiou/.test(word[word.length - 2])) {
    // Change y to ies (e.g., city -> cities)
    return word.slice(0, -1) + "ies";
  } else if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z") || word.endsWith("ch") || word.endsWith("sh")) {
    // Add es (e.g., box -> boxes)
    return word + "es";
  } else {
    // Add s for most cases (e.g., cat -> cats)
    return word + "s";
  }
}

function isPlural(word) {
  // Regular expression to check if a word ends with common plural endings
  const pluralPattern = /(s|es|ies)$/i;
  return pluralPattern.test(word);
}


function formatDate(dateString) {
  const dateObj = new Date(dateString);

  // Extract date components
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');

  // Extract time components and convert to 12-hour format
  let hours = dateObj.getUTCHours()+3;
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format (0 becomes 12)

  // Combine date and time
  return `${year}-${month}-${day} ${hours}:${minutes}  ${ampm}`;
}



const indicatorReports = ref([])

const getIndicatorCategoryReports = async (projectId) => {

  const model = 'indicator_category_report'
  const associated_multiple_models = ['document', 'project', 'county', 'subcounty', 'ward', 'users', 'indicator_category', 'document']
  //const nested_models = ['indicator_category', 'indicator'] // The mother, then followed by the child
  const nested_models = ['activity', 'project']  // The mother, then followed by the child 

  const formData = {}
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.excludeGeom = false
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = ['settlement_id']
  formData.filterValues = [[route.params.id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', projectId)
  indicatorReports.value = res.data



}


function getDifferences(before, after, parentKey = '') {
  const differences = [];

  for (const key in before) {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof before[key] === 'object' && before[key] !== null) {
      if (Array.isArray(before[key])) {
        // Compare arrays deeply
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
          differences.push({
            field: currentKey,
            before: before[key].join(', '),
            after: (after[key] || []).join(', '),
          });
        }
      } else {
        // Recursively compare nested objects
        differences.push(...getDifferences(before[key], after[key] || {}, currentKey));
      }
    } else {
      // Compare primitive values
      if (before[key] !== after[key]) {
        differences.push({
          field: currentKey,
          before: before[key] || '',
          after: after[key] || '',
        });
      }
    }
  }

  return differences;
}





const getSettlmentHistory = async (sett_id) => {

  const model = 'settlement_history'

  const formData = {}
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.excludeGeom = false
  formData.associated_multiple_models = ['users']

  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = ['settlement_id']
  formData.filterValues = [[sett_id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('History collected........', res.data)
  const rawHistory = res.data;

  // Process the differences for nested properties
  editHistory.value = rawHistory.map((record) => {
    const changes = record.changes;
    const differences = getDifferences(changes.before, changes.after);
    return {
      ...record,
      differences,
    };
  });



}




const tableRowClassName = (data) => {

  if (data.row.status == 'Rejected') {
    return 'danger-row'
  }
  if (data.row.status == 'Approved') {
    return 'success-row'
  }

  return ''
}


const projectStatus = (data) => {

  if (data.row.status == 'Suspended') {
    return 'danger-row'
  }
  if (data.row.status == 'Planned') {
    return 'warning-row'
  }

  if (data.row.status == 'Complete') {
    return 'success-row'
  }

  return ''
}


const AddReport = () => {
  // Check if user can edit this settlement
  const settlementData = {
    id: route.params.id,
    county_id: profile.county_id || null
  };
  
  if (!canUserAccessSettlement(settlementData, 'edit')) {
    ElMessage({
      message: 'You do not have permission to add reports for this settlement.',
      type: 'warning',
    });
    return;
  }

  push({
    name: 'PastReports',

  })
}



// Fields you don't want to show
const excludeFields = ref([
  'id',
  'county_id',
  'settlement_id',
  'subcounty_id',
  'ward_id',
  'code',
  'validation_check_sch',
  'geom',
  // add any other keys you want omitted
]);
const priorityFields = ['respondents_name', 'telephone'];

// Helpers
const humanize = key =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());


// Computed: build table rows
const filteredData = computed(() => {
  // Safety check: return empty array if raw.value is not an object
  if (!raw.value || typeof raw.value !== 'object' || Array.isArray(raw.value)) {
    return [];
  }
  
  // 1. All valid entries
  const entries = Object.entries(raw.value).filter(
    ([key, val]) => {
      // Skip if value is null, empty, or undefined
      if (val === null || val === '' || val === undefined) {
        return false;
      }
      
      // Skip if key is in excludeFields (includes 'geom')
      if (excludeFields.value.includes(key)) {
        return false;
      }
      
      // Explicitly exclude geom and geometry (case-insensitive check)
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'geom' || lowerKey === 'geometry' || lowerKey.includes('geometry')) {
        return false;
      }
      
      // Skip if value is a geometry object (has type and coordinates properties)
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
        if ('type' in val && 'coordinates' in val) {
          // This looks like a GeoJSON geometry object
          return false;
        }
      }
      
      return true;
    }
  );

  // 2. Extract priority rows (in order), if present
  const priorityRows = priorityFields
    .map(key => entries.find(([k]) => k === key))
    .filter(Boolean);

  // 3. The rest, excluding priority, sorted by humanized field
  const otherRows = entries
    .filter(([k]) => !priorityFields.includes(k))
    .sort(([a], [b]) =>
      humanize(a).localeCompare(humanize(b))
    );

  // 4. Map to { field, value } and combine
  return [
    ...priorityRows,
    ...otherRows
  ].map(([key, val]) => ({
    field: humanize(key),
    value: val
  }));
});

const raw=ref()
const Review = (data: TableSlotDefault) => {

  // /add/27?id=85
  raw.value=data.row 

  console.log(data.row )

 



  drawer.value=true 

 

}







const projects = ref([])

const getProjectLocations = async (settlement_id) => {
  console.log('settlement_id', settlement_id);
  console.log("Get Projects  for  Location : ", settlement_id)

  // Get the project settlement ids
  const formData = {
    model: 'project_location',
    searchField: 'name',
    searchKeyword: '',
    filters: ['settlement_id'],
    filterValues: [[settlement_id]],
    associated_multiple_models: ['project'],
  };

  const res = await getSettlementListByCounty(formData);
  const project_ids = res.data.map(item => item.project); // Extract settlement_id
  console.log('project_ids', project_ids);

  projects.value = project_ids

  console.log("Get project_locations  for    : ", projects.value)


};

const RevertEdits = async (data: TableSlotDefault) => {
  // Check if user can edit this settlement
  const settlementData = {
    id: route.params.id,
    county_id: profile.county_id || null
  };
  
  if (!canUserAccessSettlement(settlementData, 'edit')) {
    ElMessage({
      message: 'You do not have permission to revert changes for this settlement.',
      type: 'warning',
    });
    return;
  }

  console.log('Reverts.....', data.row)

  const formData = {
    model: 'settlement',
    history_id: data.row.id,
  };

  const res = await revertHistory(formData);
  console.log('Reverts success.....', res.data)


};


const editSettlement = () => {
  // Check if user can edit this settlement
  const settlementData = {
    id: route.params.id,
    county_id: profile.county_id || null
  };
  
  if (!canUserAccessSettlement(settlementData, 'edit')) {
    ElMessage({
      message: 'You do not have permission to edit this settlement.',
      type: 'warning',
    });
    return;
  }

  push({
    name: 'AddSettlementNew',
    query: { id: route.params.id }
  });


}

const deleteSettlement = async () => {
  // Check if user can delete this settlement
  const settlementData = {
    id: route.params.id,
    county_id: profile.county_id || null
  };
  
  if (!canUserAccessSettlement(settlementData, 'delete')) {
    ElMessage({
      message: 'You do not have permission to delete this settlement.',
      type: 'warning',
    });
    return;
  }

  try {
    const formData: any = {
      id: route.params.id,
      model: 'settlement'
    };

    const response = await DeleteRecord(formData);

    if (response && response.code === '0000') {
      ElMessage.success('Settlement deleted successfully');
      // Navigate back to settlement list
      router.push({ name: 'List' });
    } else {
      ElMessage.error('Failed to delete settlement');
    }
  } catch (error) {
    console.error('Error deleting settlement:', error);
    ElMessage.error('Failed to delete settlement');
  }
}

 
const searchName =ref('')

const searcHouseholds = async () => {

  console.log(searchName.value)
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = 'households'
  //-Search field--------------------------------------------
  formData.searchField = 'respondents_name'
  formData.searchKeyword = searchName.value
 
  // - multiple filters -------------------------------------
  formData.filters = ['settlement_id']
  formData.filterValues = [[route.params.id]]
  formData.associated_multiple_models = []
  formData.nested_models = []
  //-------------------------
  //console.log(formData)
  const res = await searchByKeyWord(formData)
  console.log(res)
  total_hh.value=res.total

  households.value=res.data

  // 

   
}



// Map event handlers
const onLayersLoaded = () => {
  mapLoading.value = false;
};

// Fallback timeout in case layers-loaded event doesn't fire
const startMapLoadingTimeout = () => {
  setTimeout(() => {
    if (mapLoading.value) {
      console.warn('Map loading timeout - hiding spinner after 10 seconds');
      mapLoading.value = false;
    }
  }, 10000); // 10 second fallback
};

// Facilities summary data
const facilitiesSummary = ref({
  health: { count: 0 },
  education: { count: 0 },
  water: { count: 0 },
  piped_water: { count: 0, length: 0 },
  sewer: { count: 0, length: 0 },
  road: { count: 0, length: 0 },
  other: { count: 0 }
})

// Projects data for PDF
const settlementProjects = ref<Array<{ title: string }>>([])

// Fetch projects for settlement
const fetchSettlementProjects = async (settlementId: string | number | string[]) => {
  // Ensure settlementId is a single value
  const id = Array.isArray(settlementId) ? settlementId[0] : settlementId
  
  try {
    const formData = {
      model: 'project_location',
      searchField: 'name',
      searchKeyword: '',
      filters: ['settlement_id'],
      filterValues: [[id]],
      associated_multiple_models: ['project'],
    }

    const res = await getSettlementListByCounty(formData)
    const projectLocations = res.data || []
    
    // Extract unique projects (in case a project appears multiple times)
    const uniqueProjects = new Map()
    projectLocations.forEach((location: any) => {
      if (location.project && location.project.title) {
        uniqueProjects.set(location.project.id, {
          title: location.project.title
        })
      }
    })
    
    settlementProjects.value = Array.from(uniqueProjects.values())
    return settlementProjects.value
  } catch (error) {
    console.error('Error fetching settlement projects:', error)
    settlementProjects.value = []
    return []
  }
}

// Fetch facilities data for settlement
const fetchFacilitiesSummary = async (settlementId: string | number | string[]) => {
  // Ensure settlementId is a single value
  const id = Array.isArray(settlementId) ? settlementId[0] : settlementId
  const facilityModels = [
    { model: 'health_facility', key: 'health' },
    { model: 'education_facility', key: 'education' },
    { model: 'water_point', key: 'water' },
    { model: 'piped_water', key: 'piped_water', isLinear: true },
    { model: 'sewer', key: 'sewer', isLinear: true },
    { model: 'road', key: 'road', isLinear: true },
    { model: 'other_facility', key: 'other' }
  ]

  const summary = {
    health: { count: 0 },
    education: { count: 0 },
    water: { count: 0 },
    piped_water: { count: 0, length: 0 },
    sewer: { count: 0, length: 0 },
    road: { count: 0, length: 0 },
    other: { count: 0 }
  }

  try {
    // Fetch all facilities in parallel
    const promises = facilityModels.map(async ({ model, key, isLinear }) => {
      try {
        const formData = {
          limit: 10000,
          page: 1,
          curUser: 1,
          model: model,
          searchField: 'name',
          searchKeyword: '',
          filters: ['settlement_id'],
          filterValues: [[id]],
          excludeGeom: !isLinear // Include geometry for linear features
        }

        const res = await getSettlementListByCounty(formData)
        const facilities = res.data || []

        summary[key].count = facilities.length

        // Calculate total length for linear features
        if (isLinear && facilities.length > 0) {
          let totalLength = 0
          facilities.forEach((facility: any) => {
            if (facility.geom) {
              try {
                const length = turf.length(facility.geom, { units: 'kilometers' })
                totalLength += length
              } catch (error) {
                console.warn(`Error calculating length for ${model} facility:`, error)
              }
            }
          })
          summary[key].length = totalLength
        }
      } catch (error) {
        console.error(`Error fetching ${model}:`, error)
      }
    })

    await Promise.all(promises)
    facilitiesSummary.value = summary
    return summary
  } catch (error) {
    console.error('Error fetching facilities summary:', error)
    return summary
  }
}

// Helper function to format numbers to 2 decimal places
const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  const num = Number(value)
  if (isNaN(num)) {
    return String(value)
  }
  // Check if it's a whole number
  if (Number.isInteger(num)) {
    return num.toString()
  }
  // Round to 2 decimal places
  return num.toFixed(2)
}

// Helper function to load image as base64
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        try {
          const base64 = canvas.toDataURL('image/png')
          resolve(base64)
        } catch (error) {
          reject(error)
        }
      } else {
        reject(new Error('Could not get canvas context'))
      }
    }
    img.onerror = reject
    img.src = url
  })
}

// Google Maps API Key
const GoogleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Fetch neighboring settlements for PDF map
const fetchNeighboringSettlementsForPDF = async (settlementId: string | number | string[], settlementGeom: any): Promise<any[]> => {
  try {
    // Calculate bbox from settlement geometry
    const id = Array.isArray(settlementId) ? settlementId[0] : settlementId
    
    if (!settlementGeom) return []
    
    const bbox = turf.bbox(settlementGeom)
    const bboxObj = {
      minLng: bbox[0],
      minLat: bbox[1],
      maxLng: bbox[2],
      maxLat: bbox[3]
    }
    
    const res = await getNeighboringSettlements({
      settlementId: id,
      bbox: bboxObj,
      expansionFactor: 0.3 // 30% expansion to get nearby settlements
    })
    
    const responseData = res as any
    const settlements = responseData?.data || responseData?.results || []
    
    if (!Array.isArray(settlements)) return []
    
    // Filter settlements with valid polygon geometries
    return settlements.filter((s: any) => 
      s.geom && (s.geom.type === 'Polygon' || s.geom.type === 'MultiPolygon')
    )
  } catch (error) {
    console.error('Error fetching neighboring settlements for PDF:', error)
    return []
  }
}

// Helper function to extract path coordinates from geometry (for Google Maps Static API)
const extractPathCoordinates = (geometry: any, maxPoints = 100): string[] => {
  if (!geometry) return []
  
  let geom = geometry
  if (geometry.type === 'Feature') {
    geom = geometry.geometry
  }
  
  // Simplify if needed
  try {
    const feature = { type: 'Feature', geometry: geom, properties: {} }
    const simplified = turf.simplify(feature, { tolerance: 0.0002, highQuality: false })
    geom = simplified.geometry
  } catch (e) {
    // Use original if simplification fails
  }
  
  let coords: number[][] = []
  
  if (geom.type === 'Polygon') {
    coords = geom.coordinates[0]
  } else if (geom.type === 'MultiPolygon') {
    coords = geom.coordinates[0][0]
  } else {
    return []
  }
  
  // Limit number of points to avoid URL length issues
  if (coords.length > maxPoints) {
    const step = Math.ceil(coords.length / maxPoints)
    coords = coords.filter((_: any, i: number) => i % step === 0)
  }
  
  // Convert to lat,lng format for Google Maps
  return coords.map((coord: number[]) => `${coord[1]},${coord[0]}`)
}

// Helper function to generate Google Maps Static Image URL with settlement boundary
const generateStaticMapUrl = (geometry: any, width = 600, height = 400, neighboringSettlements: any[] = []): string | null => {
  if (!geometry) return null;
  
  try {
    // Handle both raw geometry and GeoJSON Feature
    let geom = geometry;
    if (geometry.type === 'Feature') {
      geom = geometry.geometry;
    } else if (geometry.type === 'FeatureCollection') {
      geom = geometry.features[0]?.geometry;
    }
    
    if (!geom) return null;
    
    // Simplify geometry if it has too many points (Google has URL limit ~8KB)
    let simplifiedGeom = geom;
    try {
      const feature = { type: 'Feature', geometry: geom, properties: {} };
      // Simplify with tolerance of 0.0001 degrees (~10m)
      const simplified = turf.simplify(feature, { tolerance: 0.0001, highQuality: true });
      simplifiedGeom = simplified.geometry;
    } catch (e) {
      console.warn('Could not simplify geometry:', e);
    }
    
    // Calculate center from geometry
    const centroidFeature = turf.centroid({ type: 'Feature', geometry: simplifiedGeom, properties: {} });
    const center = centroidFeature.geometry.coordinates;
    const centerLat = center[1];
    const centerLng = center[0];
    
    // Calculate zoom level based on bounding box size
    const bbox = turf.bbox({ type: 'Feature', geometry: simplifiedGeom, properties: {} });
    const bboxWidth = Math.abs(bbox[2] - bbox[0]);
    const bboxHeight = Math.abs(bbox[3] - bbox[1]);
    const maxDim = Math.max(bboxWidth, bboxHeight);
    
    let zoom = 15;
    if (maxDim > 0.5) zoom = 9;
    else if (maxDim > 0.2) zoom = 10;
    else if (maxDim > 0.1) zoom = 11;
    else if (maxDim > 0.05) zoom = 12;
    else if (maxDim > 0.02) zoom = 13;
    else if (maxDim > 0.01) zoom = 14;
    else if (maxDim > 0.005) zoom = 15;
    else zoom = 16;
    
    // Extract coordinates and convert to Google Maps path format
    // Google uses lat,lng order (opposite of GeoJSON which is lng,lat)
    let pathCoords: string[] = [];
    
    if (simplifiedGeom.type === 'Polygon') {
      // Get the outer ring (first ring)
      const ring = simplifiedGeom.coordinates[0];
      pathCoords = ring.map((coord: number[]) => `${coord[1]},${coord[0]}`);
    } else if (simplifiedGeom.type === 'MultiPolygon') {
      // Get the first polygon's outer ring
      const ring = simplifiedGeom.coordinates[0][0];
      pathCoords = ring.map((coord: number[]) => `${coord[1]},${coord[0]}`);
    } else if (simplifiedGeom.type === 'Point') {
      // For points, just show the location with a marker
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&markers=color:red|${centerLat},${centerLng}&key=${GoogleMapsApiKey}`;
      return url;
    } else if (simplifiedGeom.type === 'LineString') {
      // For lines, draw the path
      const coords = simplifiedGeom.coordinates;
      pathCoords = coords.map((coord: number[]) => `${coord[1]},${coord[0]}`);
      const pathString = pathCoords.join('|');
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&path=color:0xFF0000FF|weight:3|${pathString}&key=${GoogleMapsApiKey}`;
      return url;
    }
    
    // Check if we have valid path coordinates
    if (pathCoords.length === 0) {
      // Fallback: just show the location without polygon
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&key=${GoogleMapsApiKey}`;
      return url;
    }
    
    // Build the path string for Google Maps (pipe-separated)
    let pathString = pathCoords.join('|');
    
    // Google Maps Static API path format:
    // path=color:0xRRGGBBAA|fillcolor:0xRRGGBBAA|weight:N|point1|point2|...
    // Color format: 0xRRGGBBAA (red, green, blue, alpha)
    const strokeColor = '0xFF0000FF'; // Red, fully opaque
    const fillColor = '0xFF000033';   // Red, ~20% opacity
    
    // Build base URL with main settlement
    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap`;
    
    // Add neighboring settlements first (so main settlement draws on top)
    // Use pink/magenta color with no fill for neighbors (simulates dotted appearance)
    const neighborStrokeColor = '0xFF6666CC'; // Light red/pink, semi-transparent
    
    for (const neighbor of neighboringSettlements.slice(0, 5)) { // Limit to 5 neighbors to avoid URL length issues
      const neighborCoords = extractPathCoordinates(neighbor.geom, 30); // Fewer points for neighbors
      if (neighborCoords.length > 0) {
        const neighborPath = neighborCoords.join('|');
        url += `&path=color:${neighborStrokeColor}|weight:1|${neighborPath}`;
      }
    }
    
    // Add main settlement polygon (solid red with fill)
    url += `&path=color:${strokeColor}|fillcolor:${fillColor}|weight:3|${pathString}`;
    
    // Add API key
    url += `&key=${GoogleMapsApiKey}`;
    
    // Check URL length - Google has ~8KB limit
    if (url.length > 8000) {
      console.warn('URL too long, removing neighbors and simplifying...');
      
      // Try without neighbors first
      url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&path=color:${strokeColor}|fillcolor:${fillColor}|weight:2|${pathString}&key=${GoogleMapsApiKey}`;
      
      // If still too long, simplify main settlement
      if (url.length > 8000) {
        try {
          const feature = { type: 'Feature', geometry: geom, properties: {} };
          const moreSimplified = turf.simplify(feature, { tolerance: 0.001, highQuality: false });
          const simplerGeom = moreSimplified.geometry;
          
          let simplerPathCoords: string[] = [];
          if (simplerGeom.type === 'Polygon') {
            const ring = simplerGeom.coordinates[0];
            simplerPathCoords = ring.map((coord: number[]) => `${coord[1]},${coord[0]}`);
          } else if (simplerGeom.type === 'MultiPolygon') {
            const ring = simplerGeom.coordinates[0][0];
            simplerPathCoords = ring.map((coord: number[]) => `${coord[1]},${coord[0]}`);
          }
          
          if (simplerPathCoords.length > 0) {
            pathString = simplerPathCoords.join('|');
            url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&path=color:${strokeColor}|fillcolor:${fillColor}|weight:2|${pathString}&key=${GoogleMapsApiKey}`;
          }
        } catch (e) {
          console.warn('Aggressive simplification failed:', e);
        }
      }
      
      // If still too long, fall back to no polygon
      if (url.length > 8000) {
        url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&markers=color:red|${centerLat},${centerLng}&key=${GoogleMapsApiKey}`;
      }
    }
    
    console.log('Google Static Map URL length:', url.length);
    return url;
  } catch (error) {
    console.error('Error generating static map URL:', error);
    return null;
  }
}

// Helper function to fetch map image as base64
const fetchMapAsBase64 = async (geometry: any, neighboringSettlements: any[] = []): Promise<string | null> => {
  const mapUrl = generateStaticMapUrl(geometry, 580, 400, neighboringSettlements);
  if (!mapUrl) return null;
  
  try {
    // Fetch the image
    const response = await fetch(mapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch map: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching map image:', error);
    return null;
  }
}

const generatePDFReport = async () => {
  pdfLoading.value = true
  try {
    // Fetch facilities summary and projects first
    await Promise.all([
      fetchFacilitiesSummary(route.params.id),
      fetchSettlementProjects(route.params.id)
    ])
    
    const doc = new jsPDF()
    
    // Load and add GOK logo
    let logoBase64: string | null = null
    try {
      const logoUrl = '/gok.png'
      logoBase64 = await loadImageAsBase64(logoUrl)
      
      // Add logo at the top (centered, 30mm width, auto height)
      if (logoBase64) {
        const logoWidth = 30
        const logoHeight = (logoWidth * 0.75) // Maintain aspect ratio (adjust as needed)
        const pageWidth = doc.internal.pageSize.getWidth()
        const logoX = (pageWidth - logoWidth) / 2
        
        doc.addImage(logoBase64, 'PNG', logoX, 5, logoWidth, logoHeight)
      }
    } catch (error) {
      console.warn('Could not load GOK logo:', error)
    }
    
    // Start content below logo (logo ends at ~27.5mm, add 5mm spacing = 32.5mm)
    const startY = logoBase64 ? 33 : 10
    
    // Title with better styling
    doc.setFontSize(18)
    doc.setTextColor(41, 128, 185)
    doc.text('Settlement Facts & Overview', 105, startY, { align: 'center' })
    
    // Settlement info with better formatting
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(`${profile.name} Settlement`, 105, startY + 10, { align: 'center' })
    doc.text(`${profile.subcounty} Subcounty, ${profile.county} County`, 105, startY + 17, { align: 'center' })
    
    // Date with subtle styling
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, startY + 24, { align: 'center' })
    
    // Separator with better color - aligned with table width (10mm margins)
    doc.setDrawColor(41, 128, 185)
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.line(10, startY + 30, pageWidth - 10, startY + 30)

    // Key Metrics Summary
    doc.setFontSize(14)
    doc.setTextColor(41, 128, 185)
    doc.text('Key Metrics', 15, startY + 40)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: startY + 45,
      head: [['Metric', 'Value']],
      body: [
        ['Population', formatNumber(profile.population)],
        ['Area', `${formatNumber(profile.area)} Ha.`],
        ['Households', formatNumber(profile.num_households)],
        ['Avg. HH Size', formatNumber(profile.avg_household_size)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto'
    })

    // Settlement Details in two columns
    doc.setFontSize(14)
    doc.setTextColor(41, 128, 185)
    doc.text('Settlement Details', 15, (doc as any).lastAutoTable.finalY + 15)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Field', 'Value']],
      body: [
        ['Type', profile.settlement_type],
        ['Land Status', profile.land_status],
        ['Owner', profile.parcel_owner],
        ['Owner Type', profile.parcel_owner_type],
        ['Land Use', profile.landuse],
        ['Development', profile.development],
        ['Structures', profile.structure_types],
        ['Materials', profile.typical_building_materials],
        ['Dist to Town', `${formatNumber(profile.dist_town)} km`],
        ['Dist to Road', `${formatNumber(profile.dist_trunk)} km`],
        ['Hazards', profile.main_env_hazards]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto'
    })

    // Socio-Economic Profile in two columns
    doc.setFontSize(14)
    doc.setTextColor(41, 128, 185)
    doc.text('Socio-Economic Profile', 15, (doc as any).lastAutoTable.finalY + 15)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Field', 'Value']],
      body: [
        ['HH Count', formatNumber(housing.num_households)],
        ['HH Size', formatNumber(housing.avg_household_size)],
        ['Structures', housing.structure_types],
        ['Development', housing.development],
        ['Materials', housing.typical_building_materials],
        ['Avg Rent', formatNumber(housing.avg_rent)],
        ['Ownership', formatNumber(housing.plot_ownership_ratio)],
        ['Tenancy', formatNumber(housing.plot_tenant_ratio)],
        ['Electricity', utilities.electricity_availability ? 'Yes' : 'No'],
        ['Water', utilities.piped_water_availability ? 'Yes' : 'No'],
        ['Income', formatNumber(utilities.median_household_income)],
        ['Wayleave', utilities.on_wayleave ? 'Yes' : 'No'],
        ['Road Reserve', utilities.on_road_reserve ? 'Yes' : 'No'],
        ['Near River', utilities.near_river ? 'Yes' : 'No'],
        ['Encumbrance', utilities.encumbrance]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto'
    })

    // Facilities Summary
    doc.setFontSize(14)
    doc.setTextColor(41, 128, 185)
    const facilitiesY = (doc as any).lastAutoTable.finalY + 15
    doc.text('Facilities Summary', 15, facilitiesY)
    doc.setTextColor(0)

    // Prepare facilities data
    const facilitiesBody = [
      ['Health Facilities', facilitiesSummary.value.health.count.toString()],
      ['Education Facilities', facilitiesSummary.value.education.count.toString()],
      ['Water Points', facilitiesSummary.value.water.count.toString()],
      ['Piped Water', `${facilitiesSummary.value.piped_water.count} (${facilitiesSummary.value.piped_water.length.toFixed(2)} km)`],
      ['Sewer', `${facilitiesSummary.value.sewer.count} (${facilitiesSummary.value.sewer.length.toFixed(2)} km)`],
      ['Roads', `${facilitiesSummary.value.road.count} (${facilitiesSummary.value.road.length.toFixed(2)} km)`],
      ['Other Facilities', facilitiesSummary.value.other.count.toString()]
    ]

    autoTable(doc, {
      startY: facilitiesY + 5,
      head: [['Facility Type', 'Count / Length']],
      body: facilitiesBody,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto'
    })

    // Intervention Projects Section
    if (settlementProjects.value.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(41, 128, 185)
      const projectsY = (doc as any).lastAutoTable.finalY + 15
      doc.text('Intervention Projects', 15, projectsY)
      doc.setTextColor(0)

      // Prepare projects data - just titles
      const projectsBody = settlementProjects.value.map((project, index) => [
        (index + 1).toString(),
        project.title
      ])

      autoTable(doc, {
        startY: projectsY + 5,
        head: [['#', 'Project Title']],
        body: projectsBody,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 10, right: 10 },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 15 }, // Narrow column for numbers
          1: { cellWidth: 'auto' } // Auto width for project titles
        }
      })
    }

    // Add footer on page 1
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text('source: www.kesmis.go.ke', 105, 280, { align: 'center' })

    // ============ PAGE 2: Settlement Location Map ============
    if (settGeom.value) {
      ElMessage.info('Adding map to PDF...')
      
      // Add new page
      doc.addPage()
      
      // Add logo to page 2 as well
      if (logoBase64) {
        const logoWidth = 30
        const logoHeight = (logoWidth * 0.75)
        const pageWidth = doc.internal.pageSize.getWidth()
        const logoX = (pageWidth - logoWidth) / 2
        doc.addImage(logoBase64, 'PNG', logoX, 5, logoWidth, logoHeight)
      }
      
      const page2StartY = logoBase64 ? 33 : 10
      
      // Page 2 Title
      doc.setFontSize(18)
      doc.setTextColor(41, 128, 185)
      doc.text('Settlement Location', 105, page2StartY, { align: 'center' })
      
      // Settlement name subtitle
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text(`${profile.name} Settlement`, 105, page2StartY + 10, { align: 'center' })
      doc.text(`${profile.subcounty} Subcounty, ${profile.county} County`, 105, page2StartY + 17, { align: 'center' })
      
      // Separator line
      doc.setDrawColor(41, 128, 185)
      const page2Width = doc.internal.pageSize.getWidth()
      doc.line(10, page2StartY + 25, page2Width - 10, page2StartY + 25)
      
      // Try to fetch and add the map with neighboring settlements
      try {
        // Fetch neighboring settlements for the map
        ElMessage.info('Fetching neighboring settlements...')
        const neighbors = await fetchNeighboringSettlementsForPDF(route.params.id, settGeom.value)
        console.log(`Found ${neighbors.length} neighboring settlements for PDF map`)
        
        const mapBase64 = await fetchMapAsBase64(settGeom.value, neighbors)
        
        if (mapBase64) {
          // Map dimensions and positioning
          const mapWidth = 180 // mm
          const mapHeight = 125 // mm (maintaining ~1.44 aspect ratio)
          const mapX = (page2Width - mapWidth) / 2
          const mapY = page2StartY + 35
          
          // Add border around map
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.rect(mapX - 1, mapY - 1, mapWidth + 2, mapHeight + 2)
          
          // Add the map image
          doc.addImage(mapBase64, 'PNG', mapX, mapY, mapWidth, mapHeight)
          
          // Add labels for neighboring settlements on the map
          if (neighbors.length > 0) {
            // Calculate map projection parameters
            const centroid = turf.centroid(settGeom.value)
            const mapCenterLng = centroid.geometry.coordinates[0]
            const mapCenterLat = centroid.geometry.coordinates[1]
            
            // Calculate zoom from bbox
            const bbox = turf.bbox(settGeom.value)
            const bboxWidth = Math.abs(bbox[2] - bbox[0])
            const bboxHeight = Math.abs(bbox[3] - bbox[1])
            const maxDim = Math.max(bboxWidth, bboxHeight)
            
            let mapZoom = 15
            if (maxDim > 0.5) mapZoom = 9
            else if (maxDim > 0.2) mapZoom = 10
            else if (maxDim > 0.1) mapZoom = 11
            else if (maxDim > 0.05) mapZoom = 12
            else if (maxDim > 0.02) mapZoom = 13
            else if (maxDim > 0.01) mapZoom = 14
            else if (maxDim > 0.005) mapZoom = 15
            else mapZoom = 16
            
            // Function to convert lat/lng to pixel position on the map image
            const latLngToPixel = (lat: number, lng: number) => {
              // Mercator projection constants
              const TILE_SIZE = 256
              const scale = Math.pow(2, mapZoom)
              
              // Convert to world coordinates
              const worldX = ((lng + 180) / 360) * TILE_SIZE
              const siny = Math.sin((lat * Math.PI) / 180)
              const worldY = ((0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * TILE_SIZE)
              
              // Convert center to world coordinates
              const centerWorldX = ((mapCenterLng + 180) / 360) * TILE_SIZE
              const centerSiny = Math.sin((mapCenterLat * Math.PI) / 180)
              const centerWorldY = ((0.5 - Math.log((1 + centerSiny) / (1 - centerSiny)) / (4 * Math.PI)) * TILE_SIZE)
              
              // Calculate pixel offset from center (map image is 580x400 pixels, scaled 2x = 1160x800)
              const pixelX = (worldX - centerWorldX) * scale
              const pixelY = (worldY - centerWorldY) * scale
              
              // Convert to PDF coordinates (map image dimensions in mm)
              // The static map is 580x400 @2x scale = effective 1160x800 pixels displayed as 180x125mm
              const pdfX = mapX + (mapWidth / 2) + (pixelX / 1160) * mapWidth
              const pdfY = mapY + (mapHeight / 2) + (pixelY / 800) * mapHeight
              
              return { x: pdfX, y: pdfY }
            }
            
          }
          
          // Map caption
          doc.setFontSize(10)
          doc.setTextColor(100)
          const captionText = neighbors.length > 0 
            ? 'Settlement Boundary (red) with neighboring settlements (outline)'
            : 'Settlement Boundary (shown in red)'
          doc.text(captionText, 105, mapY + mapHeight + 8, { align: 'center' })
          
          // Location details below map
          const detailsY = mapY + mapHeight + 20
          doc.setFontSize(12)
          doc.setTextColor(41, 128, 185)
          doc.text('Location Details', 15, detailsY)
          doc.setTextColor(0)
          
          // Calculate centroid for coordinates display
          const centroid = turf.centroid(settGeom.value)
          const coords = centroid.geometry.coordinates
          
          autoTable(doc, {
            startY: detailsY + 5,
            head: [['Property', 'Value']],
            body: [
              ['County', profile.county || 'N/A'],
              ['Sub-County', profile.subcounty || 'N/A'],
              ['Ward', profile.ward || 'N/A'],
              ['Area', `${formatNumber(profile.area)} Ha.`],
              ['Coordinates', `${coords[1].toFixed(6)}°N, ${coords[0].toFixed(6)}°E`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10 },
            margin: { left: 10, right: 10 },
            tableWidth: 'auto'
          })
        } else {
          // Map could not be loaded - show placeholder message
          doc.setFontSize(12)
          doc.setTextColor(150)
          doc.text('Map could not be loaded. The settlement geometry may be too complex for static rendering.', 105, page2StartY + 60, { align: 'center', maxWidth: 170 })
          
          // Still show location details
          const detailsY = page2StartY + 90
          doc.setFontSize(12)
          doc.setTextColor(41, 128, 185)
          doc.text('Location Details', 15, detailsY)
          doc.setTextColor(0)
          
          const centroid = turf.centroid(settGeom.value)
          const coords = centroid.geometry.coordinates
          
          autoTable(doc, {
            startY: detailsY + 5,
            head: [['Property', 'Value']],
            body: [
              ['County', profile.county || 'N/A'],
              ['Sub-County', profile.subcounty || 'N/A'],
              ['Ward', profile.ward || 'N/A'],
              ['Area', `${formatNumber(profile.area)} Ha.`],
              ['Coordinates', `${coords[1].toFixed(6)}°N, ${coords[0].toFixed(6)}°E`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10 },
            margin: { left: 10, right: 10 },
            tableWidth: 'auto'
          })
        }
      } catch (mapError) {
        console.error('Error adding map to PDF:', mapError)
        // Show error message on page 2
        doc.setFontSize(12)
        doc.setTextColor(150)
        doc.text('Map could not be generated.', 105, page2StartY + 60, { align: 'center' })
      }
      
      // Add footer on page 2
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('source: www.kesmis.go.ke', 105, 280, { align: 'center' })
    }

    // Save the PDF
    ElMessage.success('PDF generated successfully!')
    doc.save(`${profile.name}_Settlement_Facts.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    ElMessage.error('Failed to generate PDF report: ' + error)
  } finally {
    pdfLoading.value = false
  }
}

// Document category edit functionality
const editDocumentDialogVisible = ref(false)
const documentTypes = ref<Array<{ value: number; label: string; group: string }>>([])
const documentTypeGroups = ref<Array<{ label: string; options: Array<{ value: number; label: string }> }>>([])
const currentDocument = ref<any>(null)
const editDocumentForm = reactive({
  id: null as number | null,
  category: undefined as number | undefined  // document.category field references document_type.id
})

// Fetch document types grouped by category
const fetchDocumentTypes = async () => {
  try {
    const res = await getCountyListApi({
      params: {
        pageIndex: 1,
        limit: 1000,
        curUser: 1,
        model: 'document_type',
        searchField: 'type',
        searchKeyword: '',
        sort: 'ASC'
      }
    })
    
    const ret = res.data
    // Group document types by their 'group' field (which represents the category)
    const nestedData = ret.reduce((acc: any, cur: any) => {
      const group = cur.group || 'Other'
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push({ value: cur.id, label: cur.type })
      return acc
    }, {})

    documentTypeGroups.value = Object.entries(nestedData).map(([label, options]: [string, any]) => ({
      label,
      options
    }))
  } catch (error) {
    console.error('Error fetching document types:', error)
    ElMessage.error('Failed to load document types')
  }
}

// Open edit dialog
const openEditDocumentDialog = (doc: any) => {
  currentDocument.value = doc
  editDocumentForm.id = doc.id
  // Get category from various possible locations (document.category references document_type.id)
  editDocumentForm.category = doc.category || 
                               doc['document_type.id'] || 
                               doc.document_type?.id || 
                               undefined
  editDocumentDialogVisible.value = true
}

// Update document category (updates document.category which references document_type.id)
const updateDocumentCategory = async () => {
  if (!editDocumentForm.id || !editDocumentForm.category) {
    ElMessage.warning('Please select a document type')
    return
  }

  try {
    const formData = {
      id: editDocumentForm.id,
      model: 'document',
      category: editDocumentForm.category  // document.category field references document_type.id
    }

    await updateOneRecord(formData as any)
    ElMessage.success('Document category updated successfully')
    editDocumentDialogVisible.value = false
    
    // Reload settlement data to refresh documents
    await getFilteredData(filters, filterValues)
  } catch (error) {
    console.error('Error updating document category:', error)
    ElMessage.error('Failed to update document category')
  }
}

</script>

<template>
  <el-card>


    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>


    <!-- Header Section -->
    <template #header>
      <div class="card-header">
        <div class="card-header-content">
          <el-button type="primary" plain :icon="Back" @click="goBack" class="back-button">
            Back
          </el-button>
          <div class="settlement-title">
            {{ profile.name }} Settlement, {{ profile.subcounty }} Subcounty, {{ profile.county }} County
          </div>
        </div>
        <div class="header-actions">
          <el-button 
            v-if="showAdminButtons && canUserAccessSettlement({id: route.params.id, county_id: profile.county_id}, 'edit')" 
            type="success" 
            :icon="Edit" 
            @click="editSettlement"
            class="edit-button"
          >
            Edit
          </el-button>
          <el-button 
            v-if="canUserAccessSettlement({id: route.params.id, county_id: profile.county_id}, 'edit')" 
            type="primary" 
            :icon="Plus" 
            @click="addFacility"
            class="add-facility-button"
          >
            Add Facility
          </el-button>
        </div>
      </div>
    </template>



    <el-tabs v-model="activeName" class="demo-tabs" type="border-card" @tab-click="clickTab">
      <el-tab-pane label="Profile" name="profile">
        <!-- Location Section -->
        <div class="flex justify-end mb-4">
          <el-button type="primary" @click="generatePDFReport" :loading="pdfLoading" :disabled="pdfLoading">
            <template #loading>
              <el-icon class="is-loading" style="margin-right: 5px;"><Loading /></el-icon>
            </template>
            <Icon v-if="!pdfLoading" icon="material-symbols:download" style="margin-right: 5px;" />
            {{ pdfLoading ? 'Generating...' : 'Download Facts' }}
          </el-button>
        </div>
        <div :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']">
          <div
:class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
               @click="collapsedSections.location = !collapsedSections.location">
            <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
              <div class="flex items-center">
                {{ t('Administrative Location') }}  
              </div>
            </div>
            <Icon :icon="collapsedSections.location ? 'ep:arrow-down' : 'ep:arrow-up'" />
          </div>
          <ElCollapseTransition>
            <div v-show="!collapsedSections.location" :class="[`${prefixCls}-content`, 'p-10px']">
              <Descriptions :data="profile" :schema="schemaProfile.slice(0, 4)" />
            </div>
          </ElCollapseTransition>
        </div>

        <!-- Profile Section -->
        <div :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']">
          <div
:class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
               @click="collapsedSections.profile = !collapsedSections.profile">
            <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
              <div class="flex items-center">
                {{ t('Profile') }}  
              </div>
            </div>
            <Icon :icon="collapsedSections.profile ? 'ep:arrow-down' : 'ep:arrow-up'" />
          </div>
          <ElCollapseTransition>
            <div v-show="!collapsedSections.profile" :class="[`${prefixCls}-content`, 'p-10px']">
              <Descriptions :data="profile" :schema="schemaProfile.slice(4)" />
            </div>
          </ElCollapseTransition>
        </div>

        <!-- Housing Section -->
        <div :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']">
          <div
:class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
               @click="collapsedSections.housing = !collapsedSections.housing">
            <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
              <div class="flex items-center">
                {{ t('Housing') }}  
              </div>
            </div>
            <Icon :icon="collapsedSections.housing ? 'ep:arrow-down' : 'ep:arrow-up'" />
          </div>
          <ElCollapseTransition>
            <div v-show="!collapsedSections.housing" :class="[`${prefixCls}-content`, 'p-10px']">
              <Descriptions :data="housing" :schema="schemaHousing" />
            </div>
          </ElCollapseTransition>
        </div>

        <!-- Utilities Section -->
        <div :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']">
          <div
:class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
               @click="collapsedSections.utilities = !collapsedSections.utilities">
            <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
              <div class="flex items-center">
                {{ t('Utilities') }} 
              </div>
            </div>
            <Icon :icon="collapsedSections.utilities ? 'ep:arrow-down' : 'ep:arrow-up'" />
          </div>
          <ElCollapseTransition>
            <div v-show="!collapsedSections.utilities" :class="[`${prefixCls}-content`, 'p-10px']">
              <Descriptions :data="utilities" :schema="schemaUtilities" />
            </div>
          </ElCollapseTransition>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Location" name="map">
        <div class="map-container-wrapper">
          <div v-if="mapLoading" class="map-loading-container">
            <div class="map-loading-spinner">
              <el-icon class="is-loading"><Loading /></el-icon>
              <p>Loading settlement map data...</p>
              <p class="loading-subtitle">This may take a few moments while we fetch all layers</p>
            </div>
          </div>
          <SettlementMap
            :settlementId="settlementId"
            :initial-map-data="initialMapData"
            @layers-loaded="onLayersLoaded"
            :class="{ 'map-hidden': mapLoading }"
          />  
        </div>
      </el-tab-pane>



             <el-tab-pane  v-if="canUserAccessSettlement({id: route.params.id, county_id: profile.county_id}, 'view')" label="Documents" name="documents">

                  <div>
            <!-- Filter Input and Upload Button -->
            <el-row :gutter="10" style="margin-bottom: 10px;">
              <el-col :span="canUserAccessSettlement({id: route.params.id, county_id: profile.county_id}, 'edit') ? 20 : 24">
                <el-input
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Search documents..." 
                  style="width: 100%"
                  :prefix-icon="Search" 
                  clearable 
                />
              </el-col>
              <el-col v-if="canUserAccessSettlement({id: route.params.id, county_id: profile.county_id}, 'edit')" :span="4">
                <el-button 
                  type="primary" 
                  :icon="Upload" 
                  @click="toggleComponent"
                  style="width: 100%"
                >
                  Upload
                </el-button>
              </el-col>
            </el-row>

           <!-- Photos Section (Collapsible) -->
           <div v-if="photos.length > 0" :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px) mb-4']">
             <div
               :class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
               @click="toggleCollapse('Photos')">
               <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
                 <div class="flex items-center">
                   Photos <span class="text-gray-500 ml-2 text-sm">({{ photos.length }})</span>
                 </div>
               </div>
               <Icon :icon="collapsedDocumentSections['Photos'] ? 'ep:arrow-down' : 'ep:arrow-up'" />
             </div>
             <ElCollapseTransition>
               <div v-show="!collapsedDocumentSections['Photos']" :class="[`${prefixCls}-content`, 'p-5px']">
                 <!-- Photo Grid using Element Plus Image -->
                 <div class="photo-grid">
                   <div 
                     v-for="(photo, index) in photos" 
                     :key="photo.id" 
                     class="photo-item"
                   >
                                           <div 
                        class="photo-placeholder"
                        @click="previewPhoto(photo, index)"
                      >
                        <div class="placeholder-content">
                          <el-icon class="placeholder-icon"><Picture /></el-icon>
                          <span class="placeholder-text">Click to Preview</span>
                        </div>
                      </div>
                     <div class="photo-info">
                       <div class="photo-name">{{ photo.name }}</div>
                       <div class="photo-format">{{ photo.format?.toUpperCase() }}</div>
                     </div>
                   </div>
                 </div>
               </div>
             </ElCollapseTransition>
           </div>

           <!-- Other Documents -->
           <div
v-for="(docs, type) in filteredGroupedDocuments" :key="type"
             :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']">
             <!-- Collapsible Header -->
             <div
               :class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
               @click="toggleCollapse(type)">
               <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
                 <div class="flex items-center">
                   {{ makePlural(type) }} <span class="text-gray-500 ml-2 text-sm">({{ docs.length }})</span>
                 </div>
               </div>
               <Icon :icon="collapsedDocumentSections[type] ? 'ep:arrow-down' : 'ep:arrow-up'" />
             </div>

             <!-- Collapsible Content -->
             <ElCollapseTransition>
               <div v-show="!collapsedDocumentSections[type]" :class="[`${prefixCls}-content`, 'p-10px']">
                 <el-table :data="docs" style="width: 100%">
                   <el-table-column type="index" width="50" />
                   <el-table-column prop="name" label="Name" />
                   <el-table-column prop="createdAt" label="Uploaded" />
                  <el-table-column fixed="right" label="" width="220">
                   <template #default="scope">
                     <div class="doc-actions">
                       <el-button
                         plain
                         :loading="loadingStates[scope.row.id]"
                         @click="downloadFile(scope.row)"
                         class="doc-action-button"
                       >
                         <Icon icon="fa-solid:download" style="margin-right: 5px;" />
                         Download
                       </el-button>
                       <el-button 
                         v-if="isSuperAdmin && canUserAccessSettlement({id: route.params.id, county_id: profile.county_id}, 'edit')" 
                         plain 
                         type="primary" 
                         :icon="Edit" 
                         @click="openEditDocumentDialog(scope.row)"
                         class="doc-action-button"
                       >
                         Edit
                       </el-button>
                     </div>
                   </template>
                 </el-table-column>
                 </el-table>
               </div>
             </ElCollapseTransition>
           </div>
         </div>
       </el-tab-pane>

      <el-tab-pane label="Projects" name="Projects">
        <el-card>
          <el-table :data="projects" border :row-class-name="projectStatus">
            <el-table-column type="index" width="50" />
            <el-table-column label="Code" prop="project_code" width="350" sortable />

            <el-table-column label="Project" width="750" sortable>
              <template #default="{ row }">
                <div> <span> {{ row.title }} </span> </div>
              </template>
            </el-table-column>
            <el-table-column label="Status" prop="status" sortable />


            <el-table-column fixed="right" label="Actions">
              <template #default="scope">

                <el-tooltip content="More Details" placement="top">
                  <el-button
type="success" size="small" :icon="More" @click="Review(scope as TableSlotDefault)"
                    plain />
                </el-tooltip>



              </template>
            </el-table-column>


          </el-table>
        </el-card>

      </el-tab-pane>

    <el-tab-pane  v-if="canUserAccessHouseholds({id: route.params.id, county_id: profile.county_id})" label="Households" name="Households">
   
        <el-card>
          <el-row :gutter="10" style="margin-bottom:10px">
              <el-col :span="23">
                <el-input
                  v-model="searchName"
                  placeholder="Search by name"
                  remote
                  :onInput="searcHouseholds"
                  clearable
                  style="width: 100%"
                />
              </el-col>
              <el-col :span="1">
                <DownloadCustom
                  :data="households"
                  model="households" 
                  style="width: 100%"
                />
              </el-col>
            </el-row>
  
          <el-table :data="households" border>
            <el-table-column type="index" width="50" />
            <el-table-column label="Gender" prop="gender" sortable />
            <el-table-column label="Age" prop="age" sortable />
            <el-table-column label="Household Size" prop="hh_size" sortable />
            <el-table-column fixed="right" label="Actions">
              <template #default="scope">
                <el-tooltip content="More Details" placement="top">
                  <el-button
type="success" size="small" :icon="More" @click="Review(scope as TableSlotDefault)"
                    plain />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
            <el-pagination
                class="mt-4"
                background
                layout="sizes, prev, pager, next, total"
                :total="total_hh"
                :page-size="pSize"
                :current-page="page"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :page-sizes="[5,10, 20, 50, 100]"
    />
        </el-card>

      </el-tab-pane>

      <el-tab-pane label="Vulnerability" name="vulnerability">
        <div :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']">
          <div class="p-4">
            <div v-if="vulnerability.vulnerability_total_score != null || vulnerability.vulnerability_rating" class="mb-6">
              <h4 class="text-sm font-medium text-gray-500 mb-2">Vulnerability Assessment</h4>
              <div
                class="vulnerability-score-display inline-flex items-center gap-3 px-4 py-3 rounded-lg border-l-4"
                :class="{
                  'rating-high': vulnerability.vulnerability_rating === 'HIGH',
                  'rating-medium': vulnerability.vulnerability_rating === 'MEDIUM',
                  'rating-low': vulnerability.vulnerability_rating === 'LOW'
                }"
              >
                <span class="text-lg font-semibold">{{ vulnerability.vulnerability_total_score ?? '—' }}</span>
                <span class="text-sm text-gray-500">Total Score</span>
                <el-tag
                  v-if="vulnerability.vulnerability_rating"
                  :type="vulnerability.vulnerability_rating === 'HIGH' ? 'danger' : vulnerability.vulnerability_rating === 'MEDIUM' ? 'warning' : 'success'"
                  size="large"
                >
                  {{ vulnerability.vulnerability_rating }}
                </el-tag>
              </div>
            </div>
            <div v-else class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="text-gray-500 text-sm">No vulnerability assessment recorded. Edit the settlement to add vulnerability attributes and compute the score.</p>
            </div>
            <h4 class="text-sm font-medium text-gray-500 mb-3">Assessment Attributes</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="Region">{{ vulnerability.climate_region || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Soil Type">{{ vulnerability.soil_type || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Land Cover">{{ vulnerability.land_cover || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Altitude Range">{{ vulnerability.altitude_range || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Proximity to River">{{ vulnerability.proximity_to_river || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Proximity to Flood Plain">{{ vulnerability.proximity_to_flood_plain || '—' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Indicators" name="Indicator">
        <el-card>

          <el-button v-if="canUserAccessSettlement({id: route.params.id, county_id: profile.county_id}, 'edit')" :onClick="AddReport" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" /> File Report
          </el-button>

          <el-table :data="indicatorReports" border :row-class-name="tableRowClassName" ref="tableRef">


            <el-table-column label="#" width="80" prop="id" sortable>
              <template #default="scope">
                <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
                  <span>{{ scope.row.id }}</span>
                  <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
                </div>
              </template>
            </el-table-column>


            <el-table-column label="Indicator  " width="400" sortable>
              <template #default="{ row }">
                <div>
                  <span> {{ row.indicator_category.indicator_name }} {{ row.indicator_category.category_title }} </span>

                </div>
              </template>
            </el-table-column>
            <el-table-column label="Date" prop="date" sortable>
              <template #default="scope">
                {{ formatDate(scope.row.date) }}
              </template>
            </el-table-column>

            <el-table-column label="Amount" prop="amount" sortable />
            <el-table-column label="Amount (cumulative)" prop="cumAmount" sortable />
            <el-table-column label="Status" prop="status" sortable>
              <template #default="scope">
                <div v-if="scope.row.status === 'Rejected'">
                  <el-tooltip :content="'Reason for rejection: ' + scope.row.reject_msg" placement="top">
                    <span>{{ scope.row.status }}</span>
                  </el-tooltip>
                </div>
                <div v-else>
                  <span>{{ scope.row.status }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

      </el-tab-pane>


      <el-tab-pane  v-if="canUserAccessSettlement({id: route.params.id, county_id: profile.county_id}, 'edit')" label="History" name="History">


        <el-table :data="editHistory" border ref="tableEditRef" >


          <el-table-column label="" type="expand" >
            <template #default="{ row }">
              <el-table :data="row.differences" style="margin: 10px 0;" border >
                <el-table-column prop="field" label="Field"  />
                <el-table-column prop="before" label="Before"  class-name="italic-red" show-overflow-tooltip />
                <el-table-column prop="after" label="After"  class-name="italic-green" show-overflow-tooltip  />
              </el-table>
            </template>
          </el-table-column>

          <el-table-column label="Date Edited" prop="created_at" sortable class-name="td-bold">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>

          <el-table-column label="Edited By" prop="user.name" sortable  class-name="td-bold"/>
          <el-table-column fixed="right" label="Actions" width="100">
            <template #default="scope">
              <el-tooltip content="Revert " placement="top">
                <el-button type="warning" :icon="RefreshLeft" @click="RevertEdits(scope as TableSlotDefault)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane  v-if="!isCountyUser && canUserAccessSettlement({id: route.params.id, county_id: profile.county_id}, 'delete')" label="Settings" name="Settings">
        <el-popconfirm
          width="300" 
          title="Are you sure to delete this settlement?"
          @confirm="deleteSettlement">
          <template #reference>
            <el-button style="color: red; border-color: red; margin-left: 5px; margin-bottom: 5px;" plain>
              <Icon icon="material-symbols:delete" style="color: red;" />
              Delete Settlement
            </el-button>
          </template>
        </el-popconfirm>

      </el-tab-pane>
    </el-tabs>
 
  </el-card>


  <el-drawer v-model="drawer" :show-close="false">

     <template #header="{ close, titleId, titleClass }">
      <h4 :id="titleId" :class="titleClass">Household Record</h4>
      <el-button type="danger" @click="close">
        <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
        Close
      </el-button>
    </template>



      <el-table
      :data="filteredData"
      stripe
      style="width: 100%">
      
      <el-table-column
        prop="field"
        label=""
        width="200"/>
      
      
      <el-table-column
        prop="value"
        label=""/>
     </el-table>
     </el-drawer>

   <!-- Photo Preview Modal -->
   <el-dialog 
     v-model="photoPreviewVisible" 
     :title="currentPhoto?.name || 'Photo Preview'"
     width="50%"
     :show-close="true"
     @close="closePhotoPreview"
     class="photo-preview-dialog"
   >
     <div class="photo-preview-container">
       <div v-if="previewLoading" class="preview-loading">
         <el-icon class="is-loading"><Picture /></el-icon>
         <span>Loading photo...</span>
       </div>
       
       <div v-else-if="previewPhotoUrl" class="preview-image-container">
         <img 
           :src="previewPhotoUrl" 
           :alt="currentPhoto?.name"
           class="preview-image"
         />
       </div>
       
       <div v-else class="preview-error">
         <el-icon><Picture /></el-icon>
         <span>Failed to load photo</span>
       </div>
     </div>
     
     <!-- Photo Details -->
     <div v-if="currentPhoto" class="photo-details">
       <div class="detail-row">
         <span class="detail-label">Name:</span>
         <span class="detail-value">{{ currentPhoto.name }}</span>
       </div>
       <div class="detail-row">
         <span class="detail-label">Format:</span>
         <span class="detail-value">{{ currentPhoto.format?.toUpperCase() }}</span>
       </div>
       <div class="detail-row">
         <span class="detail-label">Uploaded:</span>
         <span class="detail-value">{{ formatDate(currentPhoto.createdAt) }}</span>
       </div>
     </div>
     
     <!-- Navigation Controls -->
     <template #footer>
       <div class="preview-footer">
         <div class="preview-counter">
           {{ currentPhotoIndex + 1 }} / {{ photos.length }}
         </div>
         <div class="preview-actions">
           <el-button 
             :disabled="currentPhotoIndex === 0"
             @click="previewPhoto(photos[currentPhotoIndex - 1], currentPhotoIndex - 1)"
             type="primary"
             :icon="Back"
             circle
           />
           <el-button 
             :disabled="currentPhotoIndex === photos.length - 1"
             @click="previewPhoto(photos[currentPhotoIndex + 1], currentPhotoIndex + 1)"
             type="primary"
             :icon="Back"
             circle
             style="transform: rotate(180deg);"
           />
         </div>
         <div class="preview-download">
           <el-button 
             type="success"
             :icon="Download"
             @click="downloadCurrentPhoto"
             :loading="downloadLoading"
           >
             Download
           </el-button>
         </div>
       </div>
     </template>
   </el-dialog>

   <!-- Edit Document Category Dialog -->
   <el-dialog
     v-model="editDocumentDialogVisible"
     title="Edit Document Category"
     width="500px"
     :close-on-click-modal="false"
   >
     <el-form :model="editDocumentForm" label-width="150px">
       <el-form-item label="Document Name">
         <el-input :value="currentDocument?.name" disabled />
       </el-form-item>
       <el-form-item label="Document Type (Category)" required>
         <el-select
           v-model="editDocumentForm.category"
           placeholder="Select document type"
           style="width: 100%"
           filterable
           clearable
         >
           <el-option-group
             v-for="group in documentTypeGroups"
             :key="group.label"
             :label="group.label"
           >
             <el-option
               v-for="option in group.options"
               :key="option.value"
               :label="option.label"
               :value="option.value"
             />
           </el-option-group>
         </el-select>
       </el-form-item>
     </el-form>
     <template #footer>
       <div class="dialog-footer">
         <el-button @click="editDocumentDialogVisible = false">Cancel</el-button>
         <el-button type="primary" @click="updateDocumentCategory">Update</el-button>
       </div>
     </template>
   </el-dialog>

   

</template>

<style lang="less" scoped>
.is-required--item {
  position: relative;

  &::before {
    margin-right: 4px;
    color: var(--el-color-danger);
    content: '*';
  }
}

:root {
  /* Light Mode Variables */
  --card-header-color: #333;
  --card-header-bg: #f9f9f9;
}

[data-theme="dark"] {
  /* Dark Mode Variables */
  --card-header-color: #ddd;
  --card-header-bg: #222;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--card-header-color);
  background-color: var(--card-header-bg);
  padding: 4px 10px;
  border-radius: 5px;
  gap: 6px;
  flex-wrap: wrap;
}

.card-header-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.back-button {
  flex-shrink: 0;
  padding: 2px 8px;
  height: auto;
}

.settlement-title {
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
  line-height: 1.2;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.edit-button {
  flex-shrink: 0;
  padding: 2px 8px;
  height: auto;
}

.add-facility-button {
  flex-shrink: 0;
  padding: 2px 8px;
  height: auto;
}

.vulnerability-score-display {
  border-left-color: #e4e7ed;
  background: #fafafa;
  &.rating-high {
    border-left-color: #f56c6c;
    background: #fef0f0;
  }
  &.rating-medium {
    border-left-color: #e6a23c;
    background: #fdf6ec;
  }
  &.rating-low {
    border-left-color: #67c23a;
    background: #f0f9eb;
  }
}

.basemap {
  width: 100%;
  height: 65vh;
}

.map-container-wrapper {
  width: 100%;
  height: 60vh;
  min-height: 400px;
  position: relative;
}

.map-loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
}

.map-loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--el-text-color-regular);
}

.map-loading-spinner .el-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  animation: spin 1s linear infinite;
}

.map-loading-spinner p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.map-loading-spinner .loading-subtitle {
  font-size: 14px;
  font-weight: 400;
  color: var(--el-text-color-regular);
  opacity: 0.8;
  margin-top: 8px;
}

.map-hidden {
  display: none;
}
</style>


<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-descriptions';

.@{prefix-cls}-header {
  &__title {
    &::after {
      position: absolute;
      top: 3px;
      left: -10px;
      width: 4px;
      height: 70%;
      background: var(--el-color-primary);
      content: '';
    }
  }
}

.@{prefix-cls}-content {
  :deep(.@{elNamespace}-descriptions__cell) {
    width: 0;
  }
}
</style>



<style scoped>
.action-col {
  padding: 10px;
}

.action-header {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #333;
}

.documents-header {
  font-size: 0.95rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #837f7f;
}

.action-body {
  font-size: 1rem;
  font-weight: 200;
  color: #666;
}

.action-footer {
  font-size: 1rem;
  font-weight: 300;
  color: #2e0dc2;
}

/* Document actions alignment */
.doc-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.doc-action-button {
  padding: 4px 10px;
  height: auto;
}

.success-background {
  background-color: rgba(226, 248, 231, 0.4);
  /* Light green with 80% opacity */
  color: #1bd847;
  /* Dark green text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #c3e6cb;
  /* Border color */

}

.warning-background {
  background-color: rgba(255, 243, 205, 0.4);
  /* Light yellow with 80% opacity */
  color: #856404;
  /* Dark yellow text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ffeeba;
  /* Border color */
}

.closed-background {
  background-color: rgba(255, 0, 0, 0.14);
  /* Red with 80% opacity */
  color: #fa0707;
  /* Darker text for contrast */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #fb050552;
  /* Lighter red border */
}

.referred-background {
  background-color: rgba(247, 155, 7, 0.2);
  /* Pink with 20% opacity */
  color: rgb(255, 192, 254);
  /* Same text color */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #d6d6d6;
  /* Lighter pink border */
}




.info-background {
  background-color: rgba(204, 229, 255, 0.4);
  /* Light blue with 80% opacity */
  color: #004085;
  /* Dark blue text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #b8daff;
  /* Border color */
}


.custom-card {
  padding: 5px;
  /* Reduce padding */
  margin: 5px 0;
  /* Adjust margin as needed */
  min-height: 10px;
  /* Set a minimum height if needed */
}

.timestamp-class {
  font-weight: bold;
  /* Example: Make it bold */
  color: #6c757d;
  /* Example: Set color */
  font-size: 14px;
  /* Example: Adjust font size */
  /* Add any additional styles as needed */
}
</style>



<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}



.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  --el-table-tr-text-color: var(--el-color-warning);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}


.custom-table .el-table__cell {
  color: rgb(243, 112, 112);
  /* Light gray text color */
  font-style: italic;
  font-size: small;
  /* Italicized text */
}


.italic-green {
  color: rgb(48, 77, 6);
  font-style: italic; /* Italicized text */
}

.italic-red {
  color: rgb(243, 11, 11); /* Light gray text color */
  font-style: italic; /* Italicized text */
}

.td-bold {
   font-weight: bold; /* Italicized text */
}

/* Photo Grid Styles */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: var(--el-bg-color);
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Photo Placeholder Styles */
.photo-placeholder {
  width: 100%;
  height: 80px;
  cursor: pointer;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 1px solid var(--el-border-color);
}

.photo-placeholder:hover {
  background: var(--el-fill-color);
  border-color: var(--el-color-primary);
  transform: scale(1.02);
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.placeholder-icon {
  font-size: 24px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 5px;
}

.photo-placeholder:hover .placeholder-icon {
  color: var(--el-color-primary);
}

.placeholder-text {
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.photo-placeholder:hover .placeholder-text {
  color: var(--el-color-primary);
}

.photo-info {
  padding: 8px;
  background: var(--el-bg-color);
  backdrop-filter: blur(10px);
}

.photo-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-format {
  font-size: 10px;
  color: var(--el-text-color-regular);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.image-placeholder,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.image-placeholder .el-icon,
.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.image-error {
  color: var(--el-color-danger);
}

/* Photo Preview Styles */
.photo-preview-dialog {
  .el-dialog__body {
    padding: 20px;
  }
}

.photo-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--el-text-color-regular);
}

.preview-loading .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

.preview-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--el-color-danger);
}

.preview-error .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.photo-details {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail-value {
  color: var(--el-text-color-regular);
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.preview-download {
  margin-left: auto;
}

.preview-counter {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex: 1;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 6px;
    font-size: 1rem;
  }

  .card-header-content {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .settlement-title {
    line-height: 1.2;
    width: 100%;
    margin: 0;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: 4px;
  }

  .back-button,
  .edit-button,
  .add-facility-button {
    width: 100%;
    justify-content: center;
    padding: 3px 8px;
    height: auto;
  }

  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .photo-placeholder {
    height: 120px;
  }
  
  .photo-preview-dialog {
    width: 95% !important;
  }
}



</style>