<template>
  <div v-loading="downloading" style="display: inline-block; margin-left: 5px">
    <el-tooltip content="Download" placement="top">
      <el-button @click="selectDownload" type="primary" :icon="Download" />
    </el-tooltip>
  </div>

  <el-dialog title="Select the columns to include in the excel sheet" v-model="showDownloadDialog" draggable width="60%" :close-on-click-modal="false">
    <el-checkbox
    v-model="checkAll"
    @change="handleCheckAllChange"
  >
  <em>Select all Fields</em>
  </el-checkbox>
    
    <div class="fields-container">
      <el-collapse v-model="activeCollapse" accordion>
        <el-collapse-item v-for="(fields, modelName) in availableFields" :key="modelName" :name="modelName">
          <template #title>
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <span style="font-weight: 500; color: #409EFF;">
                {{ modelName === 'main' ? currentModel : modelName.charAt(0).toUpperCase() + modelName.slice(1) }} Fields
              </span>
              <el-checkbox 
                :model-value="isModelAllSelected(modelName)"
                @change.stop="(val) => handleModelCheckAllChange(modelName, val)"
                style="margin-left: 10px;"
              >
                <em>Select all</em>
              </el-checkbox>
            </div>
          </template>
          
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

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showDownloadDialog = false">Cancel</el-button>
        <el-button type="primary" @click="downloadCSV">
          Download Filtered<el-icon class="el-icon--right"><Filter /></el-icon>
        </el-button>
        <el-button type="primary" @click="downloadAll">
          Download All <el-icon class="el-icon--right"><Document /></el-icon>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>


<script setup>
import { ref, onMounted, watch, defineProps } from 'vue';
import { ElButton, ElTooltip, ElDialog, ElRow, ElCol, ElCheckbox, ElForm, ElIcon, ElMessage, ElTag, ElDivider, ElCollapse, ElCollapseItem } from 'element-plus';
import { Finished } from '@element-plus/icons-vue';
import writeXlsxFile from 'write-excel-file';
import { getAllForDownload } from '@/api/settlements';
import { Delete, Edit, Search, Share, List, Upload, Filter,Download, Document } from '@element-plus/icons-vue';
import * as turf from '@turf/turf'


const props = defineProps({
  data: Array,
  model: String,
  associated_models: Array
});

const tableDataList = ref([]);
const showDownloadDialog = ref(false);
const selectedFields = ref([]);
const availableFields = ref([]);
const currentModel = ref();
const associated_models = ref();


const checkAll = ref(false);
const activeCollapse = ref([]);


 
 // Function to extract latitude and longitude using turf for centroid or first point
 function getLatLonFromGeom(geom) {
  if (!geom || !geom.type || !geom.coordinates) {
    return { latitude: null, longitude: null };
  }

  switch (geom.type) {
    case 'Point':
      // If geometry is a Point, return the coordinates directly
      return {
        latitude: geom.coordinates[1].toFixed(5),
        longitude: geom.coordinates[0].toFixed(5)
      };

    case 'MultiPoint':
      // For MultiPoint, return the first point's coordinates
      if (geom.coordinates.length > 0) {
        return {
          latitude: geom.coordinates[0][1].toFixed(5),
          longitude: geom.coordinates[0][0].toFixed(5)
        };
      }
      return { latitude: null, longitude: null };

    case 'Polygon':
    case 'MultiPolygon':
      // Use turf to calculate the centroid for Polygon and MultiPolygon
      const polygonCentroid = turf.centroid(geom);
      return {
        latitude: polygonCentroid.geometry.coordinates[1].toFixed(5),
        longitude: polygonCentroid.geometry.coordinates[0].toFixed(5)
      };

    case 'LineString':
    case 'MultiLineString':
      // Use turf to calculate the centroid for LineString and MultiLineString
      const lineCentroid = turf.centroid(geom);
      return {
        latitude: lineCentroid.geometry.coordinates[1].toFixed(5),
        longitude: lineCentroid.geometry.coordinates[0].toFixed(5)
      };

    default:
      // For unsupported types, return null
      return { latitude: null, longitude: null };
  }
}


// Function to process the res.data and add latitude/longitude using turf
 function addLatLonToData(data) {
  for (const item of data) {
    const geometry = item.geom; // Assuming the geometry is in `item.geom`
    const { latitude, longitude } = getLatLonFromGeom(geometry);
    item.latitude = latitude;
    item.longitude = longitude;
  }

  return data; // Return the modified data with lat/lon added
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
            console.log(`Adding nested field: ${fullPath} to model: ${modelName}`);
          }
        } else {
          if (!isGeoField(fullPath)) {
            if (typeof obj[key] === "object" && obj[key] !== null) {
              console.log(`Found nested object: ${key}`, obj[key]);
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
              console.log(`Adding main field: ${fullPath} to model: ${modelName}`);
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
    data: addLatLonToData (props.data),
    model: props.model,
    associated_models: props.associated_models,
  }),
  (newProps) => {
    const { data, model, associated_models } = newProps;

    if (data && data.length > 0) {
      tableDataList.value = data;
      console.log('DownloadCustom - Received data:', data);
      console.log('DownloadCustom - First record structure:', data[0]);
      availableFields.value = extractFields(tableDataList.value);
      console.log('DownloadCustom - Extracted fields:', availableFields.value);
    }

    if (model) {
      currentModel.value = model;
    }

    if (associated_models && associated_models.length > 0) {
      associated_models.value = associated_models;
      console.log('DownloadCustom - Associated models:', associated_models);
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




const downloadCSV = async () => {
  if (!selectedFields.value.length) {
    return ElMessage.warning("Please select at least one field.");
  }

  const extractedData = extractData(tableDataList.value, selectedFields.value);

  // Clean up the field names and prepare column headers
  const columns = selectedFields.value.map((field) => {
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
 
  // Create rows for the data, with each cell wrapped and in italic
  const rows = extractedData.map((row) =>
    selectedFields.value.map((field) => ({
      type: String,
      //fontStyle: 'italic',
      wrap: true,
      value: row[field] ? String(row[field]) : '',
    }))
  );

  // Add headers as the first row
  rows.unshift(columns.map((col) => ({ value: col.column, fontWeight: 'bold' })));

  // Calculate column widths based on the maximum length of data in each column
  const columnWidths = columns.map((col, index) => {
    // Get the column header length
    let maxLength = col.column.length;

    // Check each row's value in this column
    extractedData.forEach((row) => {
      const cellValue = row[selectedFields.value[index]] ? String(row[selectedFields.value[index]]) : '';
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });

    // Return width (you can scale it by a factor, e.g., multiplying by a constant for better spacing)
    return maxLength + 5; // Add padding for better readability
  });

  // Export the file with calculated column widths
  await writeXlsxFile(rows, {
    fileName: `${props.model}.xlsx`,
    columns: columnWidths.map((width) => ({ width })),
  });
};



const getFilteredData = async () => {
  const formData = {};

  formData.model = props.model;
  formData.searchField = 'name';
  formData.searchKeyword = '';
  formData.filters = [];
  formData.filterValues = [];
  formData.associated_multiple_models = props.associated_models;
  formData.nested_models = [];

  const res = await getAllForDownload(formData);
  console.log('User download All', res);
  //tableDataList.value = res.data;
  tableDataList.value  = await addLatLonToData (res.data )
  console.log( tableDataList.value)

}

const downloadAll = async () => {
  if (!selectedFields.value.length) {
    return ElMessage.warning("Please select at least one field.");
  }

  await getFilteredData();

  const extractedData = extractData(tableDataList.value, selectedFields.value);

 

  const columns = selectedFields.value.map((field) => {
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



  // Create rows for the data, with each cell wrapped and in italic
  const rows = extractedData.map((row) =>
    selectedFields.value.map((field) => ({
      type: String,
      //fontStyle: 'italic',
      wrap: true,
      value: row[field] ? String(row[field]) : '',
    }))
  );

  // Add headers as the first row
  rows.unshift(columns.map((col) => ({ value: col.column, fontWeight: 'bold' })));

  // Calculate column widths based on the maximum length of data in each column
  const columnWidths = columns.map((col, index) => {
    // Get the column header length
    let maxLength = col.column.length;

    // Check each row's value in this column
    extractedData.forEach((row) => {
      const cellValue = row[selectedFields.value[index]] ? String(row[selectedFields.value[index]]) : '';
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });

    // Return width (you can scale it by a factor, e.g., multiplying by a constant for better spacing)
    return maxLength + 5; // Add padding for better readability
  });

  // Export the file with calculated column widths
  await writeXlsxFile(rows, {
    fileName: `${props.model}.xlsx`,
    columns: columnWidths.map((width) => ({ width })),
  });
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
  gap: 8px;
  padding: 10px 0;
}

.field-checkbox {
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-collapse-item__header {
  font-weight: 500;
}

.el-collapse-item__content {
  padding: 10px 0;
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
</style>
