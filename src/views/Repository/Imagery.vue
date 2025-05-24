<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import {
  ElButton,
  ElSelect,
  ElPagination,
  ElTooltip,
  ElOption,
  ElDialog,
  ElForm,
  ElUpload,
  ElFormItem,
  ElRow,
  ElInput,
  ElTable,
  ElTableColumn,
  ElCard,
  ElMessage,
} from 'element-plus';
import {
  Plus,
  Download,
  Edit,
  Back,
  Position,
  Delete,
} from '@element-plus/icons-vue';
import { useAppStoreWithOut } from '@/store/modules/app';
import { useCache } from '@/hooks/web/useCache';
import { uploadToGeoServer, deleteLayer, EditLayerDetails } from '@/api/geoserver';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';

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
  name: string | null;
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

const envt = import.meta.env.VITE_APP_HOST;
//const serverUrl = envt === 'http://localhost' ? 'http://localhost:8080/geoserver/kisip' : 'https://kesmis.go.ke/geoserver/kisip';
const serverUrl =  'https://kesmis.go.ke/geoserver/kisip';


console.log('serverUrl',serverUrl)
// Reactive refs
const selOptions = ref<SelectOption[]>([]);
const tableDataList = ref<Layer[]>([]);
const layerName = ref<string>();
const bounds = ref<Layer['bbox']>();
const AddDialogVisible = ref(false);
const UploadDialogVisible = ref(false);
const EditDialogVisible = ref(false);
const DialogTitle = ref('Imagery');
const loading = ref(false);
const loadingUploads = ref(false);
const map = ref<mapboxgl.Map | null>(null);
const ruleFormRef = ref();
const showEditButtons = ref(false);
const model = ref(null);
const associated_multiple_models = ref([]);
const oldLayer = ref<Layer>();

// Pagination
const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);
const currentPage = ref(1);
const totalItems = ref(0);

// Form data
const form = ref<FormData>({
  geoserverUrl: import.meta.env.VITE_GEOSERVER_URL || 'https://kesmis.go.ke/geoserver',
  workspace: 'kisip',
  // username: import.meta.env.VITE_GEOSERVER_USERNAME || '',
  // password: import.meta.env.VITE_GEOSERVER_PASSWORD || '',
    username: 'admin',
  password: '***REDACTED***',
  
  crs: 'EPSG:21037',
  name: null,
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

 


 const updateMapLayer = () => {
  if (!map.value || !layerName.value || !bounds.value) return;

  const addLayer = () => {
    // Remove existing layer and source if they exist
    if (map.value!.getLayer('geoserver-wms-layer')) {
      map.value!.removeLayer('geoserver-wms-layer');
    }
    if (map.value!.getSource('geoserver-wms-source')) {
      map.value!.removeSource('geoserver-wms-source');
    }

    // Add new layer
    map.value!.addSource('geoserver-wms-source', {
      type: 'raster',
      tiles: [
        `${serverUrl}/wms?&bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=${layerName.value}`,
      ],
      tileSize: 256,
    });
    map.value!.addLayer({
      id: 'geoserver-wms-layer',
      type: 'raster',
      source: 'geoserver-wms-source',
      paint: {},
    });

    // Fit map to bounds
    map.value!.fitBounds([
      [bounds.value.westBoundLongitude, bounds.value.southBoundLatitude],
      [bounds.value.eastBoundLongitude, bounds.value.northBoundLatitude],
    ]);

    // Resize map to ensure proper rendering
    map.value!.resize();
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
  AddDialogVisible.value = true;

  layerName.value = lyr;
  DialogTitle.value = lyr;

  const filteredLayers = tableDataList.value.filter((layer) => layer.name === lyr);
  bounds.value = filteredLayers[0]?.bbox;
  await nextTick();
    loadMap();
  updateMapLayer();
};

// Handle row double-click
const handleRowDblClick = (row: Layer) => {
  handleSelectLayer(row.name);
};

// Update page size based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
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
    } else {
      ElMessage.error('Upload failed');
    }
  } catch (error) {
    ElMessage.error(`Error uploading file: ${error.message}`);
    throw error;
  }
};

// Delete layer
const deleteLayerStore = async (layer: string) => {
  try {
    form.value.storeName = layer;
    const res = await deleteLayer(form.value);
    if (res && res.code === '0000') {
      tableDataList.value = tableDataList.value.filter((item) => item.name !== layer);
      totalItems.value = tableDataList.value.length;
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

const saveEdits = async () => {
  try {
    form.value.oldLayerName = oldLayer.value?.name;
    form.value.newLayerName = form.value.name;
    form.value.newCrs = form.value.crs;
    const res = await EditLayerDetails(form.value);
    if (res && res.code === '0000') {
      ElMessage.success('Layer details updated successfully');
      EditDialogVisible.value = false;
    } else {
      ElMessage.error('Failed to update layer details');
    }
  } catch (error) {
    ElMessage.error('Error updating layer details');
  }
};

// Get CRS label
const getCrsLabel = (value: string) => {
  const crs = crsOptions.value.find((option) => option.value === value);
  return crs ? crs.label : `Invalid CRS: ${value}`;
};

// Pagination handlers
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handlePageSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  currentPage.value = 1;
};

// Computed paginated data
const paginatedData = computed(() => {
  if (!tableDataList.value.length) return [];
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return tableDataList.value.slice(startIndex, endIndex);
});

// Navigation
const goBack = () => {
  window.history.back();
};

const selectDownload = () => {
  ElMessage.info('Download functionality not implemented');
};

// On mounted
onMounted(() => {
  window.addEventListener('resize', updatePageSize);
  updatePageSize();
 

  // Resize observer for dialog
  const dialog = document.querySelector('.el-dialog');
  if (dialog) {
    const resizeObserver = new ResizeObserver(() => {
      map.value?.resize();
    });
    resizeObserver.observe(dialog);
  }

  // Fetch layers
  loading.value = true;
  axios.get(`${serverUrl}/ows/?SERVICE=WMS&REQUEST=GetCapabilities`).then((response) => {
    const xml = response.data;
    const parser = new XMLParser();
    const json = parser.parse(xml);
    const glayers = json.WMS_Capabilities.Capability.Layer.Layer.map((layer: any) => ({
      name: layer.Name,
      title: layer.Title,
      crs: layer.CRS,
      bbox: layer.EX_GeographicBoundingBox,
    }));

    tableDataList.value = glayers;
    totalItems.value = glayers.length;
    loading.value = false;

    selOptions.value = glayers.map((layer: any) => ({
      value: layer.name,
      label: layer.name,
      bbox: layer.bbox,
    }));
  }).catch((error) => {
    ElMessage.error('Error fetching layers');
    loading.value = false;
  });
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
      ElMessage.error('Error downloading imagery');
       loadingStates.value[layerName.name] = false;

    });
};



</script>

<template>
  <el-card v-loading="loading">
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
        <el-tooltip content="Upload Imagery" placement="top">
          <el-button @click="UploadDialogVisible = true" type="primary" :icon="Plus" />
        </el-tooltip>
        <el-tooltip content="Download" placement="top">
          <el-button @click="selectDownload" type="primary" :icon="Download" />
        </el-tooltip>
        <DownloadCustom
          v-if="showEditButtons"
          :data="tableDataList"
          :model="model"
          :associated_models="associated_multiple_models"
        />
      </div>
    </el-row>

    <el-table
      :data="paginatedData"
      
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
      <el-table-column fixed="right" label="Actions" width="450">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            plain
            :icon="Position"
            @click="handleSelectLayer(scope.row.name)"
          >
            View
          </el-button>
          <el-button size="small" type="success" plain :icon="Edit" @click="editLayer(scope.row)">
            Edit
          </el-button>
          <el-button  v-loading="loadingStates[scope.row.name]" size="small" type="success" plain :icon="Download" @click="downloadImagery(scope.row)">
            Download
          </el-button>

          <el-button
            size="small"
            type="danger"
            plain
            :icon="Delete"
            @click="deleteLayerStore(scope.row.name)"
          >
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      layout="sizes, prev, pager, next, total"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[2, 5, 10, 15, 20, 50, 100]"
      :total="totalItems"
      :background="true"
      @size-change="handlePageSizeChange"
      @current-change="handlePageChange"
      class="mt-4"
    />
  </el-card>

  <el-dialog v-model="AddDialogVisible" :title="DialogTitle" width="75%" draggable>
    <div id="mapContainer" class="basemap"></div>
  </el-dialog>

  <el-dialog v-model="UploadDialogVisible" title="Upload Imagery to Geoserver" width="500">
    <div v-loading="loadingUploads">
      <el-form ref="ruleFormRef" :model="form" :rules="formRules" label-position="left">
        <el-form-item label="Name">
          <el-input disabled v-model="form.geoserverUrl" />
        </el-form-item>
        <el-form-item label="Username">
          <el-input disabled v-model="form.username" />
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

  <el-dialog v-model="EditDialogVisible" title="Edit Imagery Details" width="500">
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
      <div class="dialog-footer">
        <el-button @click="EditDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveEdits">Confirm</el-button>
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
  height: 65vh;
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