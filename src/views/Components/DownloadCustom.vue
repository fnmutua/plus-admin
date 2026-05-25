<template>
  <div style="display: inline-block; margin-left: 5px">
    <el-tooltip content="Download" placement="top">
      <el-button @click="selectDownload()" type="primary" :icon="Download" :loading="loading" />
    </el-tooltip>
  </div>

  <el-drawer 
    v-model="showDownloadDialog" 
    direction="rtl" 
    :size="isMobile ? '100%' : '45%'"
    :with-header="false"
    :close-on-click-modal="false"
  >
    <!-- Custom Header -->
    <div class="drawer-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="24">
            <Download />
          </el-icon>
        </div>
        <div class="header-text">
          <h3>Select Fields to Download</h3>
          <p>Choose the columns to include in your Excel file</p>
        </div>
      </div>
      <el-button 
        type="text" 
        @click="showDownloadDialog = false"
        class="close-button"
      >
        <el-icon :size="20">
          <Close />
        </el-icon>
      </el-button>
    </div>

    <div class="drawer-content">
      <el-checkbox
        v-model="checkAll"
        @change="handleCheckAllChange"
        class="select-all-checkbox"
      >
        <em>Select all Fields</em>
      </el-checkbox>
      
      <div class="fields-container">
        <el-collapse v-model="activeCollapse" accordion>
          <el-collapse-item v-for="(fields, modelName) in availableFields" :key="modelName" :name="modelName">
            <template #title>
              <el-tooltip :content="`Expand to view/select ${fields.length} ${modelName === 'main' ? currentModel : modelName} fields`" placement="top">
                <div style="display: flex; align-items: center; width: 100%;">
                  <span style="font-weight: 500; color: #409EFF;">
                    {{ modelName === 'main' ? currentModel : modelName.charAt(0).toUpperCase() + modelName.slice(1) }} Fields
                  </span>
                </div>
              </el-tooltip>
            </template>
            
            <div class="model-select-all-container">
              <el-checkbox 
                :model-value="isModelAllSelected(modelName)"
                @change="(val) => handleModelCheckAllChange(modelName, val)"
                class="model-select-all-checkbox"
              >
                <em>Select all {{ modelName === 'main' ? currentModel : modelName.charAt(0).toUpperCase() + modelName.slice(1) }} fields</em>
              </el-checkbox>
            </div>
            
            <div class="fields-grid">
              <el-checkbox v-for="(field, index) in fields" :key="index" :label="field" v-model="selectedFields" class="field-checkbox">
                <el-tooltip :content="field" placement="top">
                  <span>{{ getDisplayFieldName(field) }}</span>
                </el-tooltip>
                <el-tag v-if="selectedFields.includes(field)" type="success" class="field-tag">
                  {{ selectedFields.indexOf(field) }}
                </el-tag>
              </el-checkbox>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <!-- Drawer Footer -->
    <div class="drawer-footer">
      <el-button @click="showDownloadDialog = false">Cancel</el-button>
      <template v-if="threeModeDownload">
        <el-button
          type="primary"
          @click="downloadDisplayed"
          :loading="downloadDisplayedLoading"
          :disabled="!canDownloadDisplayed"
        >
          <el-icon><List /></el-icon>
          Displayed ({{ resolvedDisplayedCount }})
        </el-button>
        <el-button
          type="primary"
          @click="downloadFiltered"
          :loading="downloadFilteredLoading"
          :disabled="!canDownloadFiltered"
        >
          <el-icon><Filter /></el-icon>
          Filtered ({{ resolvedFilteredCount }})
        </el-button>
        <el-button
          type="primary"
          @click="downloadAllGuarded"
          :loading="downloadAllLoading"
          :disabled="!canDownloadAll"
        >
          <el-icon><Document /></el-icon>
          All ({{ resolvedAllCount }})
        </el-button>
      </template>
      <template v-else>
        <el-button type="primary" @click="downloadCSV" :loading="downloadFilteredLoading">
          Download Filtered<el-icon class="el-icon--right"><Filter /></el-icon>
        </el-button>
        <el-button type="primary" @click="downloadAll" :loading="downloadAllLoading">
          Download All <el-icon class="el-icon--right"><Document /></el-icon>
        </el-button>
      </template>
    </div>
  </el-drawer>
</template>


<script setup>
const emit = defineEmits(['download-start', 'download-end']);
import { ref, onMounted, watch, defineProps, computed } from 'vue';
import { ElButton, ElTooltip, ElDialog, ElRow, ElCol, ElCheckbox, ElDrawer, ElForm, ElIcon, ElMessage, ElTag, ElDivider, ElCollapse, ElCollapseItem } from 'element-plus';
import { Finished } from '@element-plus/icons-vue';
import writeXlsxFile from 'write-excel-file';
import { getAllForDownload } from '@/api/settlements';
import { Delete, Edit, Search, Share, List, Upload, Filter, Download, Document, Close } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import * as turf from '@turf/turf'


const props = defineProps({
  data: Array,
  model: String,
  associated_models: Array,
  loading: Boolean,
  filters: Array,
  filterValues: Array,
  filterFunctions: Array,
  threeModeDownload: { type: Boolean, default: false },
  displayedCount: { type: Number, default: null },
  filteredCount: { type: Number, default: null },
  allCount: { type: Number, default: null },
  filteredFilters: { type: Array, default: null },
  filteredFilterValues: { type: Array, default: null },
  filteredFilterFunctions: { type: Array, default: null },
  allFilters: { type: Array, default: null },
  allFilterValues: { type: Array, default: null },
  allFilterFunctions: { type: Array, default: null },
  searchKeyword: { type: String, default: '' },
  allowAllDownload: { type: Boolean, default: true },
  includeHistory: { type: Boolean, default: false },
  allDownloadConfirmThreshold: { type: Number, default: 1000 },
  filteredDataFetcher: { type: Function, default: null },
});

const tableDataList = ref([]);
const showDownloadDialog = ref(false);
const selectedFields = ref([]);
const availableFields = ref([]);
const currentModel = ref();
const associated_models = ref();

// Separate loading states for each download button
const downloadDisplayedLoading = ref(false);
const downloadFilteredLoading = ref(false);
const downloadAllLoading = ref(false);

const resolvedDisplayedCount = computed(() => {
  if (props.displayedCount !== null) return props.displayedCount;
  return Array.isArray(props.data) ? props.data.length : 0;
});

const resolvedFilteredCount = computed(() => {
  if (props.filteredCount !== null) return props.filteredCount;
  return resolvedDisplayedCount.value;
});

const resolvedAllCount = computed(() => {
  if (props.allCount !== null) return props.allCount;
  return 0;
});

const canDownloadDisplayed = computed(() => resolvedDisplayedCount.value > 0);
const canDownloadFiltered = computed(() => resolvedFilteredCount.value > 0);
const canDownloadAll = computed(() => props.allowAllDownload && resolvedAllCount.value > 0);

const checkAll = ref(false);
const activeCollapse = ref([]);

// Mobile detection
const isMobile = computed(() => {
  return window.innerWidth <= 768;
});


 
// Function to extract latitude and longitude using turf for centroid or first point
function getLatLonFromGeom(geom) {
  // Basic shape/keys check
  if (!geom || !geom.type || geom.coordinates == null) {
    return { latitude: null, longitude: null };
  }

  // Helper to ensure coordinates are numeric
  const coordsFlat = geom.type === 'Point'
    ? [geom.coordinates]
    : Array.isArray(geom.coordinates)
      ? geom.coordinates.flat(Infinity)
      : [];

  const allNumbers = coordsFlat.every((c) =>
    Array.isArray(c)
      ? c.every((n) => typeof n === 'number' && Number.isFinite(n))
      : typeof c === 'number' && Number.isFinite(c)
  );

  if (!allNumbers || coordsFlat.length === 0) {
    return { latitude: null, longitude: null };
  }

  try {
    switch (geom.type) {
      case 'Point':
        return {
          latitude: geom.coordinates[1].toFixed(5),
          longitude: geom.coordinates[0].toFixed(5),
        };

      case 'MultiPoint':
        if (geom.coordinates.length > 0) {
          return {
            latitude: geom.coordinates[0][1].toFixed(5),
            longitude: geom.coordinates[0][0].toFixed(5),
          };
        }
        return { latitude: null, longitude: null };

      case 'Polygon':
      case 'MultiPolygon': {
        const polygonCentroid = turf.centroid(geom);
        const [lon, lat] = polygonCentroid.geometry.coordinates;
        return {
          latitude: lat.toFixed(5),
          longitude: lon.toFixed(5),
        };
      }

      case 'LineString':
      case 'MultiLineString': {
        const lineCentroid = turf.centroid(geom);
        const [lon, lat] = lineCentroid.geometry.coordinates;
        return {
          latitude: lat.toFixed(5),
          longitude: lon.toFixed(5),
        };
      }

      default:
        return { latitude: null, longitude: null };
    }
  } catch (e) {
    console.warn('Skipping invalid geometry in getLatLonFromGeom', geom, e);
    return { latitude: null, longitude: null };
  }
}


// Function to process the res.data and add computed properties (latitude, longitude, coordinates) using turf
 function addLatLonToData(data) {
  for (const item of data) {
    const geometry = item.geom; // Assuming the geometry is in `item.geom`
    
    // Compute from geometry if available
    if (geometry) {
      const { latitude, longitude } = getLatLonFromGeom(geometry);
      
      // Add latitude and longitude (overwrite if already present to ensure accuracy)
      item.latitude = latitude;
      item.longitude = longitude;
      
      // Add coordinates as [longitude, latitude] array
      if (latitude && longitude) {
        item.coordinates = [parseFloat(longitude), parseFloat(latitude)];
      }
    } else if (item.latitude && item.longitude) {
      // If geometry is missing but we have lat/lon, compute coordinates from them
      if (!item.coordinates) {
        item.coordinates = [parseFloat(item.longitude), parseFloat(item.latitude)];
      }
    } else if (item.longitude && item.latitude === undefined) {
      // Handle case where longitude might be first (some APIs return [lon, lat])
      if (Array.isArray(item.longitude)) {
        item.coordinates = item.longitude;
        item.longitude = item.longitude[0];
        item.latitude = item.longitude[1];
      }
    }
  }

  return data; // Return the modified data with computed properties added
}


// Handle "Check All" behavior
const handleCheckAllChange = (val) => {
      if (val) {
        // Select all fields from all models
        const allFields = [];
        for (const fields of Object.values(availableFields.value)) {
          allFields.push(...fields);
        }
        selectedFields.value = allFields;
      } else {
        selectedFields.value = []; // Deselect all fields
      }
    };

// Handle model-specific "Check All" behavior
const handleModelCheckAllChange = (modelName, val) => {
  if (val) {
    // Select all fields from this specific model
    const modelFields = availableFields.value[modelName] || [];
    const currentSelected = selectedFields.value.filter(field => !modelFields.includes(field));
    selectedFields.value = [...currentSelected, ...modelFields];
  } else {
    // Deselect all fields from this specific model
    const modelFields = availableFields.value[modelName] || [];
    selectedFields.value = selectedFields.value.filter(field => !modelFields.includes(field));
  }
};

// Check if all fields from a specific model are selected
const isModelAllSelected = (modelName) => {
  const modelFields = availableFields.value[modelName] || [];
  return modelFields.length > 0 && modelFields.every(field => selectedFields.value.includes(field));
};

// Get display name for field (remove model prefix if present)
const getDisplayFieldName = (fieldName) => {
  // If field contains a dot, it's likely in format "model.field"
  if (fieldName.includes('.')) {
    const parts = fieldName.split('.');
    // Return the last part (field name) and capitalize it
    const fieldPart = parts[parts.length - 1];
    return fieldPart.charAt(0).toUpperCase() + fieldPart.slice(1).replace(/_/g, ' ');
  }
  // If no dot, return the field name as is, capitalized
  return fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ');
};




const selectDownload = () => {
  showDownloadDialog.value = true;
};

const extractFields = (data) => {
  const fieldsByModel = {};

  function traverse(obj, prefix = "", isNested = false) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (isNested) {
          // Include all fields from associated models except sensitive ones
          if (!key.toLowerCase().includes("password") && 
              !key.toLowerCase().includes("token") &&
              !key.toLowerCase().includes("createdat") &&
              !key.toLowerCase().includes("updatedat")) {
            
            // Group by model (prefix is the model name)
            const modelName = prefix || 'main';
            if (!fieldsByModel[modelName]) {
              fieldsByModel[modelName] = new Set();
            }
            fieldsByModel[modelName].add(fullPath);
            //console.log(`Adding nested field: ${fullPath} to model: ${modelName}`);
          }
        } else {
          if (!isGeoField(fullPath)) {
            if (typeof obj[key] === "object" && obj[key] !== null) {
              //console.log(`Found nested object: ${key}`, obj[key]);
              if (Array.isArray(obj[key])) {
                if (obj[key].length > 0 && typeof obj[key][0] === "object") {
                  traverse(obj[key][0], fullPath, true); // Nested array
                }
              } else {
                traverse(obj[key], fullPath, true); // Nested object
              }
            } else {
              // Main model fields
              const modelName = 'main';
              if (!fieldsByModel[modelName]) {
                fieldsByModel[modelName] = new Set();
              }
              fieldsByModel[modelName].add(fullPath);
              //console.log(`Adding main field: ${fullPath} to model: ${modelName}`);
            }
          }
        }
      }
    }
  }

  function isGeoField(fieldName) {
    const geoKeywords = ["geom",  "createdAt"];
    return geoKeywords.some((keyword) => fieldName.toLowerCase().includes(keyword));
  }

  data.forEach((item) => traverse(item));

  // Convert Sets to Arrays and order fields within each model
  const orderedFieldsByModel = {};
  
  for (const [modelName, fieldsSet] of Object.entries(fieldsByModel)) {
    const fieldArray = Array.from(fieldsSet);
    const prioritizedFields = ["id", "name", "title"];

    // First add prioritized fields (id, name, title) in the specified order
    const orderedFields = prioritizedFields.filter(field => fieldArray.includes(field));

    // Then add the remaining fields sorted alphabetically
    const otherFields = fieldArray
      .filter(field => !prioritizedFields.includes(field))
      .sort();

    orderedFieldsByModel[modelName] = orderedFields.concat(otherFields);
  }

  return orderedFieldsByModel;
};

watch(
  () => ({
    data: props.data,
    model: props.model,
    associated_models: props.associated_models,
  }),
  (newProps) => {
    const { data, model, associated_models } = newProps;

    if (data && data.length > 0) {
      // Add computed properties (latitude, longitude, coordinates) from geometry
      // This ensures filtered downloads have computed fields even if they weren't in the original data
      const dataWithComputed = addLatLonToData([...data]);
      tableDataList.value = dataWithComputed;
      //console.log('DownloadCustom - Received data:', data);
     // console.log('DownloadCustom - First record structure:', data[0]);
      availableFields.value = extractFields(tableDataList.value);
     // console.log('DownloadCustom - Extracted fields:', availableFields.value);
    }

    if (model) {
      currentModel.value = model;
    }

    if (associated_models && associated_models.length > 0) {
      associated_models.value = associated_models;
      //console.log('DownloadCustom - Associated models:', associated_models);
      // Additional logic for handling associated models
     }
  },
  { immediate: true }
);

// Watch selectedFields to update checkAll state
watch(selectedFields, (newSelectedFields) => {
  const allFields = [];
  for (const fields of Object.values(availableFields.value)) {
    allFields.push(...fields);
  }
  checkAll.value = allFields.length > 0 && allFields.every(field => newSelectedFields.includes(field));
}, { deep: true });

const extractData = (data, selectedFields) => {
  return data.map((row) => {
    const extractedRow = {};

    selectedFields.forEach((field) => {
      const keys = field.split('.');
      let value = row;

      for (let key of keys) {
        if (value && value.hasOwnProperty(key)) {
          value = value[key];
        } else {
          value = null;
          break;
        }
      }

      extractedRow[field] = value;
    });

    return extractedRow;
  });
};

const buildAssociatedModels = () => {
  const models = Array.isArray(props.associated_models)
    ? [...props.associated_models]
    : [];
  if (props.includeHistory && !models.includes('grievance_history')) {
    models.push('grievance_history');
  }
  return models;
};

const writeSelectedFieldsToExcel = async (sourceData, selectedFieldsList) => {
  const dataWithComputed = addLatLonToData([...sourceData]);
  const extractedData = extractData(dataWithComputed, selectedFieldsList);
  const columns = selectedFieldsList.map((field) => {
    let cleanedField = field.replace(/[^a-zA-Z0-9]/g, ' ');
    const words = cleanedField.split(/\s+/).filter(word => word);
    const formattedField = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    return {
      column: formattedField,
      type: String,
    };
  });
  const rows = extractedData.map((row) =>
    selectedFieldsList.map((field) => ({
      type: String,
      wrap: true,
      value: row[field] ? String(row[field]) : '',
    }))
  );
  rows.unshift(columns.map((col) => ({ value: col.column, fontWeight: 'bold' })));
  const columnWidths = columns.map((col, index) => {
    let maxLength = col.column.length;
    extractedData.forEach((row) => {
      const cellValue = row[selectedFieldsList[index]] ? String(row[selectedFieldsList[index]]) : '';
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });
    return maxLength + 5;
  });
  await writeXlsxFile(rows, {
    fileName: `${props.model}.xlsx`,
    columns: columnWidths.map((width) => ({ width })),
  });
};

const getBackendDownloadData = async (
  selectedFieldsList = [],
  {
    filters = props.filters || [],
    filterValues = props.filterValues || [],
    filterFunctions = props.filterFunctions || [],
    searchKeyword = '',
  } = {}
) => {
  const formData = {};

  formData.model = props.model;
  formData.searchField = 'name';
  formData.searchKeyword = searchKeyword || '';
  formData.filters = filters;
  formData.filterValues = filterValues;
  formData.filterFunctions = filterFunctions;
  formData.associated_multiple_models = buildAssociatedModels();
  formData.nested_models = [];
  if (selectedFieldsList && selectedFieldsList.length > 0) {
    formData.selectedFields = selectedFieldsList;
  }

  const res = await getAllForDownload(formData);
  return addLatLonToData(res.data);
};

const runDownload = async (loadingRef, fetchData) => {
  if (!selectedFields.value.length) {
    return ElMessage.warning('Please select at least one field.');
  }
  loadingRef.value = true;
  emit('download-start');
  try {
    const sourceData = await fetchData();
    if (!Array.isArray(sourceData) || sourceData.length === 0) {
      return ElMessage.warning('No records found to download.');
    }
    await writeSelectedFieldsToExcel(sourceData, selectedFields.value);
    showDownloadDialog.value = false;
  } finally {
    loadingRef.value = false;
    emit('download-end');
  }
};

const downloadDisplayed = async () => {
  await runDownload(downloadDisplayedLoading, async () => {
    const browserData = props.data || [];
    return addLatLonToData([...browserData]);
  });
};

const downloadFiltered = async () => {
  await runDownload(downloadFilteredLoading, async () => {
    if (typeof props.filteredDataFetcher === 'function') {
      return props.filteredDataFetcher(selectedFields.value);
    }

    const filters = props.filteredFilters ?? props.filters ?? [];
    const filterValues = props.filteredFilterValues ?? props.filterValues ?? [];
    const filterFunctions = props.filteredFilterFunctions ?? props.filterFunctions ?? [];
    return getBackendDownloadData(selectedFields.value, {
      filters,
      filterValues,
      filterFunctions,
      searchKeyword: props.searchKeyword || '',
    });
  });
};

const confirmLargeAllDownload = async () => {
  if (
    props.allDownloadConfirmThreshold > 0 &&
    resolvedAllCount.value > props.allDownloadConfirmThreshold
  ) {
    await ElMessageBox.confirm(
      `This will download ${resolvedAllCount.value} records. Continue?`,
      'Download all',
      {
        confirmButtonText: 'Download',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
  }
};

const downloadAllGuarded = async () => {
  if (!canDownloadAll.value) {
    return ElMessage.warning(props.allowAllDownload
      ? 'No records available for download all.'
      : 'Download all is not available for your role.');
  }
  if (!selectedFields.value.length) {
    return ElMessage.warning('Please select at least one field.');
  }
  try {
    await confirmLargeAllDownload();
  } catch {
    return;
  }
  downloadAllLoading.value = true;
  emit('download-start');
  try {
    const filters = props.allFilters ?? props.filters ?? [];
    const filterValues = props.allFilterValues ?? props.filterValues ?? [];
    const filterFunctions = props.allFilterFunctions ?? props.filterFunctions ?? [];
    const backendData = await getBackendDownloadData(selectedFields.value, {
      filters,
      filterValues,
      filterFunctions,
      searchKeyword: '',
    });
    if (!Array.isArray(backendData) || backendData.length === 0) {
      return ElMessage.warning('No records found to download.');
    }
    await writeSelectedFieldsToExcel(backendData, selectedFields.value);
    showDownloadDialog.value = false;
  } finally {
    downloadAllLoading.value = false;
    emit('download-end');
  }
};
const downloadCSV = async () => {
  await runDownload(downloadFilteredLoading, async () => {
    const browserData = props.data || [];
    return addLatLonToData([...browserData]);
  });
};

const getFilteredData = async (selectedFieldsList = []) => {
  return getBackendDownloadData(selectedFieldsList, {
    filters: props.filters || [],
    filterValues: props.filterValues || [],
    filterFunctions: props.filterFunctions || [],
    searchKeyword: '',
  });
};

const downloadAll = async () => {
  await runDownload(downloadAllLoading, async () =>
    getFilteredData(selectedFields.value)
  );
};
</script>

<style scoped>
.field-tag {
  margin-left: 5px;
}

.fields-container {
  max-height: 60vh;
  overflow-y: auto;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.5px;
  padding: 4px 0;
}

.field-checkbox {
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive design for small screens */
@media (max-width: 768px) {
  .fields-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 4px;
    padding: 8px 0;
  }
  
  .field-checkbox {
    margin-bottom: 4px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .fields-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 3px;
    padding: 6px 0;
  }
  
  .field-checkbox {
    margin-bottom: 1px;
    font-size: 12px;
  }
  
  .el-collapse-item__content {
    padding: 6px 0;
  }
}

.el-collapse-item__header {
  font-weight: 500;
}

.el-collapse-item__content {
  padding: 10px 0;
}

.model-select-all-container {
  padding: 8px 0 12px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.model-select-all-checkbox {
  font-weight: 500;
  color: #606266;
}

/* Drawer Styles */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.drawer-header .header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-header .header-icon {
  color: #409eff;
}

.drawer-header .header-text h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.drawer-header .header-text p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.close-button {
  color: #909399;
}

.close-button:hover {
  color: #409eff;
}

.drawer-content {
  padding: 24px;
  height: calc(100vh - 140px);
  overflow-y: auto;
}

.select-all-checkbox {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
}

.drawer-footer .el-button .el-icon {
  margin-right: 4px;
}

/* Custom scrollbar for the fields container */
.fields-container::-webkit-scrollbar {
  width: 6px;
}

.fields-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.fields-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.fields-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive drawer adjustments */
@media (max-width: 768px) {
  .drawer-content {
    padding: 16px;
    height: calc(100vh - 120px);
  }
  
  .drawer-header {
    padding: 16px 20px;
  }
  
  .drawer-footer {
    padding: 12px 16px;
  }
  
  .drawer-header .header-text h3 {
    font-size: 16px;
  }
  
  .drawer-header .header-text p {
    font-size: 13px;
  }
}
</style>
