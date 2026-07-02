<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  
ElButton,
  ElSelect,
  ElPagination,
  ElTooltip,
  ElOption,
  ElDialog,
  ElDrawer,
  ElForm,
  ElUpload,
  ElFormItem,
  ElRow,
  ElInput,
  ElTable,
  ElTableColumn,
  ElCard,
  ElMessage,
  ElProgress,
} from 'element-plus';
import {
  Plus,
  Download,
  Edit,
  Back,
  Position,
  Delete,
} from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';
// import { useAppStoreWithOut } from '@/store/modules/app';
// import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope';
import { uploadToGeoServer, deleteLayer, EditLayerDetails, getGeoServerLayers } from '@/api/geoserver';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import { countyOptions } from '@/views/Facilities/common/index';
import { getOneGeo, searchByKeyWord } from '@/api/settlements';
import { useAppStoreWithOut } from '@/store/modules/app';
import { useCache } from '@/hooks/web/useCache';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)

// Interfaces for type safety
interface Layer {
  name: string;
  title: string;
  crs: string[];
  bbox: {
    westBoundLongitude: number;
    eastBoundLongitude: number;
    southBoundLatitude: number;
    northBoundLatitude: number;
  };
}

interface FormData {
  geoserverUrl: string;
  workspace: string;
  username: string;
  password: string;
  crs: string;
  name: string | undefined;
  storeName?: string;
  oldLayerName?: string;
  newLayerName?: string;
  newCrs?: string;
  layer?: Layer;
}

interface SelectOption {
  value: string;
  label: string;
  bbox?: Layer['bbox'];
}

// Environment and configuration

const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg';
mapboxgl.accessToken = MapBoxToken;

// const envt = import.meta.env.VITE_APP_HOST;
//const serverUrl = envt === 'http://localhost' ? 'http://localhost:8080/geoserver/kisip' : 'https://kesmis.go.ke/geoserver/kisip';
const serverUrl = '/geoserver/kisip';

// Note: Now using direct REST API call to https://kesmis.go.ke/geoserver/rest/layers.json

console.log('serverUrl',serverUrl)

// User location-based filtering
const { wsCache } = useCache();
const appStore = useAppStoreWithOut();
const userInfo = wsCache.get(appStore.getUserInfo);

const isSuperAdmin = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.name === 'super_admin' || role.name === 'root_admin'
  ) || false;
});

const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles));

const userCountyRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'county'
  );
});

const userCountyId = computed(() => {
  return userCountyRole.value?.user_roles?.county_id || null;
});

const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value;
});

// Reactive refs
const selOptions = ref<SelectOption[]>([]);
const tableDataList = ref<Layer[]>([]);
const selectedCounty = ref<number | undefined>(undefined);
const countyGeometry = ref<any>(null); // Store county geometry for spatial filtering
const layerName = ref<string>();
const bounds = ref<Layer['bbox']>();
const AddDialogVisible = ref(false);
const UploadDialogVisible = ref(false);
const EditDialogVisible = ref(false);

// Watch for dialog close to cleanup map
watch(AddDialogVisible, (newValue) => {
  if (!newValue && map.value) {
    // Clear layers when dialog closes
    clearMapLayers();
  }
});
const DialogTitle = ref('Imagery');
const loading = ref(false);
const loadingUploads = ref(false);
const mapLoading = ref(false);
const map = ref<mapboxgl.Map | null>(null);
const ruleFormRef = ref();
// const showEditButtons = ref(false);
const model = ref<string | undefined>(undefined);
const associated_multiple_models = ref([]);
const oldLayer = ref<Layer>();

// Pagination
const mobileBreakpoint = 768;
const defaultPageSize = 5;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);
const currentPage = ref(1);
const totalItems = ref(0);

// Progress state for incremental loading
const totalLayers = ref(0);
const processedLayers = ref(0);
const progressPct = computed(() =>
  totalLayers.value === 0 ? 0 : Math.round((processedLayers.value / totalLayers.value) * 100)
);

// Form data
const form = ref<FormData>({
  geoserverUrl: import.meta.env.VITE_GEOSERVER_URL || '/geoserver',
  workspace: 'kisip',
  username: import.meta.env.VITE_GEOSERVER_USERNAME || 'admin',
  password: import.meta.env.VITE_GEOSERVER_PASSWORD || '',
  
  crs: 'EPSG:21037',
  name: undefined,
});

// Form validation rules
const formRules = {
  crs: [{ required: true, message: 'Please select a coordinate system', trigger: 'change' }],
};

// CRS options
const crsOptions = ref([
  { value: 'EPSG:21036', label: 'Arc 1960 / UTM Zone 36S (EPSG:21036)', description: 'UTM projection for parts of Kenya.' },
  { value: 'EPSG:21096', label: 'Arc 1960 / UTM Zone 36N (EPSG:21096)', description: 'UTM projection for parts of Kenya.' },
  { value: 'EPSG:21037', label: 'Arc 1960 / UTM Zone 37S (EPSG:21037)', description: 'UTM projection for East Africa, including Kenya.' },
  { value: 'EPSG:21097', label: 'Arc 1960 / UTM Zone 37N (EPSG:21097)', description: 'UTM projection for East Africa, including Kenya.' },
  { value: 'EPSG:32637', label: 'WGS 84 / UTM zone 37N (EPSG:32637)', description: 'UTM projection for East Africa, including Kenya.' },
  { value: 'EPSG:32636', label: 'WGS 84 / UTM zone 36N (EPSG:32636)', description: 'UTM projection for East Africa, including Kenya.' },
  { value: 'EPSG:32737', label: 'WGS 84 / UTM zone 37S (EPSG:32737)', description: 'UTM projection for East Africa, including Kenya.' },
  { value: 'EPSG:32736', label: 'WGS 84 / UTM zone 36S (EPSG:32736)', description: 'UTM projection for East Africa, including Kenya.' },
  { value: 'EPSG:4326', label: 'WGS 84 (EPSG:4326)', description: 'A global geographic coordinate system.' },
  { value: 'EPSG:3857', label: 'WGS 84 / Pseudo-Mercator (EPSG:3857)', description: 'Web Mercator projection for mapping applications.' },
  { value: 'Invalid', label: 'Invalid Projection', description: 'Invalid projection.' },
]);

// Map initialization
const loadMap = () => {
  if (map.value) return;
  map.value = new mapboxgl.Map({
    container: 'mapContainer',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [37.137343, 1.137451],
    zoom: 6,
  });
  map.value.addControl(new mapboxgl.NavigationControl());
};

// Clear all custom layers and sources
const clearMapLayers = () => {
  if (!map.value) return;
  
  try {
    // Remove all custom layers
    const layersToRemove: string[] = [];
    map.value.getStyle().layers?.forEach(layer => {
      if (layer.id.startsWith('geoserver-')) {
        layersToRemove.push(layer.id);
      }
    });
    
    layersToRemove.forEach(layerId => {
      if (map.value!.getLayer(layerId)) {
        map.value!.removeLayer(layerId);
      }
    });

    // Remove all custom sources
    const sourcesToRemove: string[] = [];
    Object.keys(map.value.getStyle().sources || {}).forEach(sourceId => {
      if (sourceId.startsWith('geoserver-')) {
        sourcesToRemove.push(sourceId);
      }
    });
    
    sourcesToRemove.forEach(sourceId => {
      if (map.value!.getSource(sourceId)) {
        map.value!.removeSource(sourceId);
      }
    });
  } catch (error) {
    console.warn('Error clearing map layers:', error);
  }
};

const updateMapLayer = () => {
  if (!map.value || !layerName.value || !bounds.value) return;

  mapLoading.value = true;

  const addLayer = () => {
    try {
      // Clear all previous custom layers and sources
      clearMapLayers();

      // Add new layer with unique ID based on layer name
      const layerId = `geoserver-wms-layer-${layerName.value!.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const sourceId = `geoserver-wms-source-${layerName.value!.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Add new source
      map.value!.addSource(sourceId, {
        type: 'raster',
        tiles: [
          `${serverUrl}/wms?&bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=${layerName.value}`,
        ],
        tileSize: 256,
      });

      map.value!.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: {},
      });

      // Fit map to bounds with padding
      map.value!.fitBounds([
        [bounds.value!.westBoundLongitude, bounds.value!.southBoundLatitude],
        [bounds.value!.eastBoundLongitude, bounds.value!.northBoundLatitude],
      ], {
        padding: 50,
        duration: 1000
      });

      // Resize map to ensure proper rendering
      setTimeout(() => {
        map.value?.resize();
        mapLoading.value = false;
      }, 100);

    } catch (error) {
      console.error('Error updating map layer:', error);
      ElMessage.error('Error loading imagery layer');
      mapLoading.value = false;
    }
  };

  // Check if the map's style is loaded
  if (map.value.isStyleLoaded()) {
    addLayer();
  } else {
    // Wait for the map to load
    map.value.once('load', addLayer);
  }
};






// Handle layer selection
const handleSelectLayer = async (lyr: string) => {
  try {
    AddDialogVisible.value = true;
    layerName.value = lyr;
    DialogTitle.value = lyr;

    // Get layer information from the already loaded table data (check both filtered and all layers)
    const matchingLayers = tableDataList.value.filter((layer) => layer.name === lyr);
    const optionMatch = selOptions.value.find((option) => option.value === lyr);
    bounds.value = matchingLayers[0]?.bbox || optionMatch?.bbox;
    
    if (!bounds.value) {
      ElMessage.error('No bounds found for this layer');
      return;
    }

    console.log('Using cached layer bounds:', bounds.value);

    await nextTick();
    
    // Initialize map if not already done
    loadMap();
    
    // Wait a bit for the dialog to fully open before updating the map
    setTimeout(() => {
      updateMapLayer();
    }, 200);
    
  } catch (error) {
    console.error('Error selecting layer:', error);
    ElMessage.error('Error loading layer');
  }
};

// Handle row double-click
const handleRowDblClick = (row: Layer) => {
  handleSelectLayer(row.name);
};

// Refresh layer data from GeoServer after edit
const refreshLayerData = async (layerName: string) => {
  try {
    console.log(`🔄 Refreshing data for layer: ${layerName}`);
    
    // Fetch detailed layer information
    const layerDetailsUrl = `/geoserver/rest/layers/kisip:${layerName}.json`;
    console.log(`📡 Fetching layer details from: ${layerDetailsUrl}`);
    
    const geoAuth = { username: form.value.username, password: form.value.password };
    const layerResponse = await axios.get(layerDetailsUrl, {
      timeout: 10000,
      headers: { 'Accept': 'application/json, */*' },
      auth: geoAuth,
    });

    if (layerResponse.status === 200 && layerResponse.data.layer && layerResponse.data.layer.resource) {
      // Follow the resource href to get detailed information
      let resourceUrl = layerResponse.data.layer.resource.href;
      resourceUrl = resourceUrl.replace(/^https?:\/\/[^/]+/, '');
      
      const resourceResponse = await axios.get(resourceUrl, {
        timeout: 10000,
        headers: { 'Accept': 'application/json, */*' },
        auth: geoAuth,
      });

      if (resourceResponse.status === 200) {
        const resourceData = resourceResponse.data;
        const dataSource = resourceData.coverage || resourceData.featureType;
        
        // Extract CRS information
        let cleanCRS: string[] = ['EPSG:4326']; // Default fallback
        if (dataSource && dataSource.srs) {
          cleanCRS = [dataSource.srs];
        }

        // Extract bounding box information
        let bbox = {
          westBoundLongitude: -180,
          eastBoundLongitude: 180,
          southBoundLatitude: -90,
          northBoundLatitude: 90
        };

        if (dataSource && dataSource.latLonBoundingBox) {
          const latLonBbox = dataSource.latLonBoundingBox;
          bbox = {
            westBoundLongitude: latLonBbox.minx || -180,
            eastBoundLongitude: latLonBbox.maxx || 180,
            southBoundLatitude: latLonBbox.miny || -90,
            northBoundLatitude: latLonBbox.maxy || 90
          };
        } else if (dataSource && dataSource.nativeBoundingBox) {
          const nativeBbox = dataSource.nativeBoundingBox;
          bbox = {
            westBoundLongitude: nativeBbox.minx || -180,
            eastBoundLongitude: nativeBbox.maxx || 180,
            southBoundLatitude: nativeBbox.miny || -90,
            northBoundLatitude: nativeBbox.maxy || 90
          };
        }

        // Find the layer in the table and update it
        const layerIndex = tableDataList.value.findIndex(layer => layer.name === layerName);
        console.log(`🔍 Looking for layer ${layerName} in table, found at index: ${layerIndex}`);
        
        if (layerIndex !== -1) {
          const oldLayerData = tableDataList.value[layerIndex];
          console.log(`📝 Old layer data:`, oldLayerData);
          
          // Force Vue reactivity by creating a new array
          const updatedLayers = [...tableDataList.value];
          updatedLayers[layerIndex] = {
            name: layerName,
            title: layerResponse.data.layer.title || layerName,
            crs: cleanCRS,
            bbox: bbox,
          };
          tableDataList.value = updatedLayers;
          
          console.log(`📝 New layer data:`, tableDataList.value[layerIndex]);
          
          // Also update the select options
          const optionIndex = selOptions.value.findIndex(option => option.value === layerName);
          if (optionIndex !== -1) {
            selOptions.value[optionIndex] = {
              value: layerName,
              label: layerName,
              bbox: bbox,
            };
            console.log(`🔄 Updated select option at index ${optionIndex}`);
          }
          
          console.log(`✅ Successfully refreshed layer ${layerName}: CRS=${cleanCRS[0]}, Bbox=[${bbox.westBoundLongitude}, ${bbox.southBoundLatitude}, ${bbox.eastBoundLongitude}, ${bbox.northBoundLatitude}]`);
        } else {
          console.warn(`❌ Layer ${layerName} not found in table data for refresh`);
          console.log(`📋 Available layers:`, tableDataList.value.map(l => l.name));
        }
      } else {
        console.warn(`Failed to fetch resource for layer ${layerName} during refresh`);
      }
    } else {
      console.warn(`Failed to fetch details for layer ${layerName} during refresh`);
    }
  } catch (error: any) {
    console.error(`Error refreshing layer data for ${layerName}:`, error.message);
  }
};

// Update page size based on window width
const updatePageSize = () => {
  const nextSize = window.innerWidth <= mobileBreakpoint ? mobilePageSize : defaultPageSize;
  if (nextSize !== pageSize.value) {
    pageSize.value = nextSize;
    currentPage.value = 1;
    loadLayersPage(1, nextSize);
  }
};

// Handle file uploads
const selectedFiles = ref<any[]>([]);
const handleFiles = (file: any, fileList: any[]) => {
  selectedFiles.value = fileList;
};

const uploadFiles = async () => {
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!selectedFiles.value.length) {
      ElMessage.error('Please select at least one ECW file');
      return;
    }
    loadingUploads.value = true;
    for (const file of selectedFiles.value) {
      if (!file.name.endsWith('.ecw')) {
        ElMessage.error('Only ECW files are supported');
        continue;
      }
      try {
        const store = file.name.replace(/ /g, '_').replace(/\.[^/.]+$/, '');
        await uploadImageToGeoServer(file, store);
      } catch (error) {
        ElMessage.error(`Error processing ${file.name}`);
      }
    }
    loadingUploads.value = false;
  });
};

const uploadImageToGeoServer = async (file: any, store: string) => {
  const url = `${serverUrl}/rest/workspaces/${form.value.workspace}/coveragestores/${store}/file.ecw`;
  const sanitizedFileName = file.name.replace(/\s+/g, '_');
  const formData = new FormData();
  formData.append('files', file.raw, sanitizedFileName);
  formData.append('crs', form.value.crs);

  try {
    const res = await uploadToGeoServer(formData);
    if (res.code === '0000') {
      UploadDialogVisible.value = false;
      ElMessage.success('File uploaded successfully');
      await loadLayersPage(1, pageSize.value);
    } else {
      ElMessage.error('Upload failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    ElMessage.error(`Error uploading file: ${errorMessage}`);
    throw error;
  }
};

// Delete layer
const deleteLayerStore = async (layer: string) => {
  try {
    form.value.storeName = layer;
    const res = await deleteLayer(form.value);
    if (res && res.code === '0000') {
      selOptions.value = selOptions.value.filter((item) => item.value !== layer);
      totalItems.value = Math.max(0, totalItems.value - 1);
      await loadLayersPage(currentPage.value, pageSize.value);
      ElMessage.success('Layer deleted successfully');
    } else {
      ElMessage.error('Deletion failed');
    }
  } catch (error) {
    ElMessage.error('Error deleting layer');
  }
};

// Edit layer
const editLayer = async (lyr: Layer) => {
  oldLayer.value = lyr;
  EditDialogVisible.value = true;
  form.value.name = lyr.name;
  const selectedCrs = lyr.crs && lyr.crs.length > 0 ? lyr.crs[0] : 'Invalid';
  const isValidCrs = crsOptions.value.some((option) => option.value === selectedCrs);
  form.value.crs = isValidCrs ? selectedCrs : 'Invalid';
};

const EditLoading=ref(false)
 

const saveEdits = async () => {
  try {
    form.value.oldLayerName = oldLayer.value?.name;
    form.value.newLayerName = form.value.name;
    form.value.newCrs = form.value.crs;
    EditLoading.value = true;

    const res = await EditLayerDetails(form.value);

    console.log('After Edits', res);
    EditLoading.value = false;

    if (res && res.code === '0000') {
      ElMessage.success('Layer details updated successfully');
      EditDialogVisible.value = false;

      // Update the table row with the submitted data
      const updatedLayerName = form.value.newLayerName || form.value.oldLayerName || '';
      const layerIndex = tableDataList.value.findIndex(layer => layer.name === form.value.oldLayerName);
      
      if (layerIndex !== -1 && updatedLayerName) {
        // Update the layer in the table with the submitted data
        const updatedLayers = [...tableDataList.value];
        updatedLayers[layerIndex] = {
          name: updatedLayerName,
          title: updatedLayerName, // Use the new name as title
          crs: [form.value.newCrs || 'EPSG:4326'],
          bbox: tableDataList.value[layerIndex].bbox, // Keep existing bbox
        };
        tableDataList.value = updatedLayers;
        
        const optionIndex = selOptions.value.findIndex(option => option.value === form.value.oldLayerName);
        if (optionIndex !== -1) {
          const updatedOptions = [...selOptions.value];
          updatedOptions[optionIndex] = {
            value: updatedLayerName,
            label: updatedLayerName,
            bbox: tableDataList.value[layerIndex].bbox,
          };
          selOptions.value = updatedOptions;
        }
        
        console.log(`✅ Updated table row for layer: ${updatedLayerName} with CRS: ${form.value.newCrs}`);
      } else {
        console.warn(`❌ Layer ${form.value.oldLayerName} not found in table for update`);
      }
    } else {
      ElMessage.error('Failed to update layer details');
    }
  } catch (error) {
    ElMessage.error('Error updating layer details');
    EditLoading.value = false;
  }
};
// Get CRS label
const getCrsLabel = (value: string) => {
  console.log('CRS:',value)
  const crs = crsOptions.value.find((option) => option.value === value);
  return crs ? crs.label : `Invalid CRS: ${value}`;
};

// Pagination handlers
const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await loadLayersPage(page, pageSize.value);
};

const handlePageSizeChange = async (newSize: number) => {
  pageSize.value = newSize;
  currentPage.value = 1;
  await loadLayersPage(1, newSize);
};

const loadLayersPage = async (
  page = currentPage.value,
  limit = pageSize.value,
  countyId: number | undefined = selectedCounty.value,
) => {
  loading.value = true;
  try {
    const res: any = await getGeoServerLayers({
      page,
      limit,
      countyId: countyId || undefined,
    });
    const payload = res || {};
    tableDataList.value = Array.isArray(payload.data) ? payload.data : [];
    totalItems.value = Number(payload.total) || 0;
    if (Array.isArray(payload?.options) && payload.options.length) {
      selOptions.value = payload.options;
    }
  } catch (error) {
    console.error('Failed to load imagery layers:', error);
    tableDataList.value = [];
    totalItems.value = 0;
    ElMessage.error('Failed to load imagery layers');
  } finally {
    loading.value = false;
    totalLayers.value = 0;
    processedLayers.value = 0;
  }
};

// Handle county selection change
const handleCountyChange = async (countyId: number | undefined) => {
  selectedCounty.value = countyId;
  currentPage.value = 1;

  if (countyId) {
    try {
      const geoForm: any = { model: 'county', id: countyId };
      const res: any = await getOneGeo(geoForm);
      countyGeometry.value = res.data?.[0]?.json_build_object || res.data || null;
      if (!countyGeometry.value) {
        ElMessage.warning('Could not load county geometry for filtering');
      }
    } catch (error) {
      console.error('Error loading county geometry:', error);
      ElMessage.error('Failed to load county geometry');
      countyGeometry.value = null;
    }
  } else {
    countyGeometry.value = null;
  }

  await loadLayersPage(1, pageSize.value, countyId);
};

// Navigation
const router = useRouter()

const goBack = () => {
  window.history.back();
};

const navigatingLayer = ref<string | null>(null)

const goToSettlement = async (layer: Layer) => {
  navigatingLayer.value = layer.name
  try {
    const layerLabel = layer.title || layer.name
    const cleanName = layerLabel.replace(/^kisip:/i, '').replace(/_/g, ' ').trim()

    const res: any = await searchByKeyWord({
      name: cleanName,
      county_id: 0,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: cleanName,
      excludeGeom: true,
      associated_multiple_models: [],
    } as any)

    const settlements = res?.data || []
    if (settlements.length > 0) {
      router.push({ name: 'SettlementDetails', params: { id: settlements[0].id } })
    } else {
      ElMessage.warning(`No settlement found matching "${cleanName}"`)
    }
  } catch {
    ElMessage.error('Failed to look up settlement')
  } finally {
    navigatingLayer.value = null
  }
};

const selectDownload = () => {
  ElMessage.info('Download functionality not implemented');
};

onMounted(async () => {
  window.addEventListener('resize', updatePageSize);
  updatePageSize();

  const drawer = document.querySelector('.el-drawer');
  if (drawer) {
    const resizeObserver = new ResizeObserver(() => {
      map.value?.resize();
    });
    resizeObserver.observe(drawer);
  }

  if (isCountyRestricted.value && userCountyId.value) {
    selectedCounty.value = userCountyId.value;
    await handleCountyChange(userCountyId.value);
    return;
  }

  await loadLayersPage(1, pageSize.value);
});


const loadingStates = ref({});

// Download raw imagery for a selected layer
const downloadImagery = (layerName) => {

  console.log(layerName)
 
  loadingStates.value[layerName.name] = true;


  // Construct WCS GetCoverage URL
  const wcsUrl = `${serverUrl}/wcs?` +
    `SERVICE=WCS&` +
    `VERSION=2.0.1&` +
    `REQUEST=GetCoverage&` +
    `COVERAGEID=${layerName.name}&` +
    `FORMAT=image/tiff&`; // West, East

  axios({
    method: 'get',
    url: wcsUrl,
    responseType: 'blob', // Important for handling binary data (e.g., GeoTIFF)
  })
    .then((response) => {
      // Create a temporary link to trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${layerName.name}.tif`); // Set filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

        loadingStates.value[layerName.name] = false;

      ElMessage.success('Imagery downloaded successfully');
    })
    .catch((error) => {
      console.log(error)
      ElMessage.error('Imagery is too big for download. Consult Systems admin');
       loadingStates.value[layerName.name] = false;

    });
};


const xdownloadImagery = (layerName) => {
  console.log(layerName);
  loadingStates.value[layerName.name] = true;

  // Optional: Fetch layer metadata to check size
  const describeCoverageUrl =
    `${serverUrl}/wcs?` +
    `SERVICE=WCS&` +
    `VERSION=2.0.1&` +
    `REQUEST=DescribeCoverage&` +
    `COVERAGEID=${layerName.name}`;

  axios
    .get(describeCoverageUrl)
    .then((response) => {
      // Parse raster size from DescribeCoverage response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, 'text/xml');
      // const width = parseInt(xmlDoc.querySelector('domainSet > RectifiedGrid > limits > GridEnvelope > high > *[1]')?.textContent);
      // const height = parseInt(xmlDoc.querySelector('domainSet > RectifiedGrid > limits > GridEnvelope > high > *[2]')?.textContent);

      // if (width * height > 100000000) { // Threshold: 100M pixels
      //   ElMessage.error('Raster too large. Please select a smaller region or reduce resolution.');
      //   loadingStates.value[layerName.name] = false;
      //   return;
      // }

      // Construct WCS GetCoverage URL with optimizations
      const wcsUrl =
        `${serverUrl}/wcs?` +
        `SERVICE=WCS&` +
        `VERSION=2.0.1&` +
        `REQUEST=GetCoverage&` +
        `COVERAGEID=${layerName.name}&` +
        `FORMAT=application/tiff&`  ; // Downsample to 1000x1000

      return axios({
        method: 'get',
        url: wcsUrl,
        responseType: 'blob',
      });
    })
    .then((response) => {
      if (!response) return;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${layerName.name}.tif`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      loadingStates.value[layerName.name] = false;
      ElMessage.success('Imagery downloaded successfully');
    })
    .catch((error) => {
      console.error('Download error:', error);
      ElMessage.error('Error downloading geoserver: ' + (error.response?.statusText || error.message));
      loadingStates.value[layerName.name] = false;
    });
};

</script>

<template>
  <el-card v-loading="loading">
    <div v-if="totalLayers > 0" style="margin: 8px 0 12px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span>Loading layers: {{ processedLayers }} / {{ totalLayers }}</span>
        <span>{{ progressPct }}%</span>
      </div>
      <el-progress :percentage="progressPct" :stroke-width="12" :show-text="false"/>
    </div>
    <el-row
      type="flex"
      justify="start"
      :gutter="10"
      style="display: flex; flex-wrap: nowrap; align-items: center; margin-bottom: 10px"
    >
      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px">
          Back
        </el-button>
      </div>

      <el-select
        v-model="selectedCounty"
        @change="handleCountyChange"
        clearable
        filterable
        placeholder="Filter by County"
        style="margin-right: 5px; min-width: 200px"
        :disabled="isCountyRestricted"
      >
        <el-option 
          v-for="item in countyOptions" 
          :key="(item as any).value" 
          :label="(item as any).label" 
          :value="(item as any).value" 
        />
      </el-select>

      <el-select
        v-model="layerName"
        @change="handleSelectLayer"
        clearable
        filterable
        collapse-tags
        placeholder="Select Imagery"
        style="margin-right: 5px"
      >
        <el-option v-for="item in selOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>

      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px">
        <PermissionWrapper :permissions="['geoserver:create']">
          <el-tooltip content="Upload Imagery" placement="top">
            <el-button @click="UploadDialogVisible = true" type="primary" :icon="Plus" />
          </el-tooltip>
        </PermissionWrapper>
        <el-tooltip content="Download" placement="top">
          <el-button @click="selectDownload" type="primary" :icon="Download" />
        </el-tooltip>
        <PermissionWrapper :permissions="['geoserver:read']">
          <DownloadCustom
            :data="tableDataList"
            :model="model"
            :associated_models="associated_multiple_models"
            :total="totalItems"
          />
        </PermissionWrapper>
      </div>
    </el-row>

    <el-table
      :data="tableDataList"
      
      style="width: 100%"
      @row-dblclick="handleRowDblClick"
    >
      <el-table-column label="Name" prop="name" sortable />
      <el-table-column label="Title" prop="title" sortable />
      <el-table-column label="CRS" prop="crs" sortable width="350">
        <template #default="scope">
          {{ getCrsLabel(scope.row.crs[0]) }}
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="Actions" width="560">
        <template #default="scope">
          <el-button
            size="small"
            plain
            :loading="navigatingLayer === scope.row.name"
            @click="goToSettlement(scope.row)"
          >
            <Icon icon="mdi:map-marker-outline" style="margin-right:4px;" />
            Settlement
          </el-button>
          <PermissionWrapper :permissions="['geoserver:read']">
            <el-button
              size="small"
              type="primary"
              plain
              :icon="Position"
              @click="handleSelectLayer(scope.row.name)"
            >
              View
            </el-button>
          </PermissionWrapper>
          <PermissionWrapper :permissions="['geoserver:update']">
            <el-button size="small" type="success" plain :icon="Edit" @click="editLayer(scope.row)">
              Edit
            </el-button>
          </PermissionWrapper>
          <PermissionWrapper :permissions="['geoserver:read']">
            <el-button  v-loading="loadingStates[scope.row.name]" disabled size="small" type="success" plain :icon="Download" @click="downloadImagery(scope.row)">
              Download
            </el-button>
          </PermissionWrapper>
          <PermissionWrapper :permissions="['geoserver:delete']">
            <el-button
              size="small"
              type="danger"
              plain
              :icon="Delete"
              @click="deleteLayerStore(scope.row.name)"
            >
              Delete
            </el-button>
          </PermissionWrapper>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[2, 5, 10, 15, 20, 50, 100]"
      :total="totalItems"
      :background="true"
      @size-change="handlePageSizeChange"
      @current-change="handlePageChange"
      class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
    />
    <div v-if="selectedCounty" style="margin-top: 10px; font-size: 12px; color: #909399; text-align: center;">
      Showing page {{ currentPage }} of {{ Math.max(1, Math.ceil(totalItems / pageSize)) }} ({{ totalItems }} layers)
    </div>
  </el-card>

  <el-drawer v-model="AddDialogVisible" :title="DialogTitle" size="75%" direction="rtl">
    <div id="mapContainer" class="basemap" v-loading="mapLoading" element-loading-text="Loading imagery..."></div>
  </el-drawer>

  <el-dialog v-model="UploadDialogVisible" title="Upload Imagery to Geoserver" width="500">
    <div v-loading="loadingUploads">
      <el-form ref="ruleFormRef" :model="form" :rules="formRules" label-position="left">
        <el-form-item label="Name">
          <el-input disabled v-model="form.geoserverUrl" />
        </el-form-item>
        <el-form-item label="Username">
          <el-input disabled v-model="form.username" type="password" />
        </el-form-item>
        <el-form-item label="Password">
          <el-input disabled v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="Workspace">
          <el-input disabled v-model="form.workspace" />
        </el-form-item>
        <el-form-item label="Coordinate System" prop="crs">
          <el-select
            v-model="form.crs"
            clearable
            filterable
            collapse-tags
            placeholder="Select Coordinate System"
            style="margin-right: 5px"
          >
            <el-option v-for="item in crsOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Select Files" style="width: 100%">
          <el-upload
            multiple
            drag
            :auto-upload="false"
            :on-change="handleFiles"
            accept=".ecw"
            action=""
            style="width: 100%"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">Drop ECW files here or click to upload</div>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="UploadDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="uploadFiles">Confirm</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog  v-loading="EditLoading"  v-model="EditDialogVisible" title="Edit Imagery Details" width="500">
    <el-form ref="ruleFormRef" :model="form" label-position="left">
      <el-form-item label="Name">
        <el-input disabled v-model="form.geoserverUrl" />
      </el-form-item>
      <el-form-item label="Workspace">
        <el-input disabled v-model="form.workspace" />
      </el-form-item>
      <el-form-item label="Layer Name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Coordinate System">
        <el-select
          v-model="form.crs"
          clearable
          filterable
          collapse-tags
          placeholder="Select Coordinate System"
          style="margin-right: 5px"
        >
          <el-option v-for="item in crsOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div v-loading="EditLoading" class="dialog-footer">
        <el-button @click="EditDialogVisible = false">Cancel</el-button>
        <el-button  type="primary" @click="saveEdits">Confirm</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.el-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.mt-4 {
  margin-top: 16px;
}

.basemap {
  width: 100%;
  height: calc(100vh - 120px);
  min-height: 400px;
  position: relative;
}



@media (max-width: 768px) {
  .el-row {
    flex-direction: column;
    align-items: stretch;
  }
  .el-select,
  .el-button {
    width: 100%;
    margin-bottom: 10px;
  }
  .el-pagination {
    font-size: 12px;
  }
  .el-pagination .el-pagination__sizes,
  .el-pagination .el-pagination__total {
    display: none;
  }
}
</style>

<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .rejected-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .referred-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  --el-table-tr-text-color: var(--el-color-warning);
  color: var(--el-table-tr-text-color);
}

.el-table .escalated-row {
  --el-table-tr-bg-color: var(--el-color-secondary);
  --el-table-tr-text-color: var(--el-color-secondary);
  color: var(--el-table-tr-text-color);
}

.el-table .resolved-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .closed-row {
  --el-table-tr-bg-color: var(--el-color-info-light-9);
  --el-table-tr-text-color: var(--el-color-info);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}
</style>