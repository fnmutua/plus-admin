<template>
  <div v-loading="downloading" style="display: inline-block; margin-left: 5px">
    <el-tooltip content="Download" placement="top">
      <el-button @click="selectDownload" type="primary" :icon="Download" />
    </el-tooltip>
  </div>

  <el-dialog title="Select the columns to include in the excel sheet" v-model="showDownloadDialog" draggable width="60%">
    <el-checkbox
    v-model="checkAll"
    @change="handleCheckAllChange"
  >
    Select all Fields
  </el-checkbox>
    <el-form>
      <el-form-item>
        <el-row :gutter="20">
          <!-- Add gutter for spacing between columns -->
          <el-col v-for="(field, index) in availableFields" :key="index" :span="6">
            <el-checkbox :label="field" v-model="selectedFields">
              <el-tooltip v-if="field.length > 20" :content="field" placement="top">
                <span>{{ field.slice(0, 20) }}...</span>
              </el-tooltip>
              <span v-else>{{ field }}</span>
              <el-tag v-if="selectedFields.includes(field)" type="success" class="field-tag">
                {{ selectedFields.indexOf(field) }}
              </el-tag>
            </el-checkbox>

          </el-col>
        </el-row>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showDownloadDialog = false">Cancel</el-button>
        <el-button type="primary" @click="downloadCSV">
          Download Filtered ( {{ filter_len }})<el-icon class="el-icon--right"><Filter /></el-icon>
        </el-button>
        <el-button type="primary" @click="downloadAll">
          Download All ({{ all_len }}) <el-icon class="el-icon--right"><Document /></el-icon>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>


<script setup>
import { ref, onMounted, watch, defineProps } from 'vue';
import { ElButton, ElTooltip, ElDialog, ElRow, ElCol, ElCheckbox, ElForm, ElIcon, ElMessage, ElTag } from 'element-plus';
import { Finished } from '@element-plus/icons-vue';
import writeXlsxFile from 'write-excel-file';
import { getAllForDownload } from '@/api/settlements';
import { Delete, Edit, Search, Share, List, Upload, Filter,Download, Document } from '@element-plus/icons-vue';

const props = defineProps({
  data: Array,
  all: Array,
 
});

console.log(props)

const tableDataList = ref([]);
const all_data = ref([]);

const filter_len  = ref(0);
const all_len  = ref(0);

const showDownloadDialog = ref(false);
const selectedFields = ref([]);
const availableFields = ref([]);
const currentModel = ref();
const associated_models = ref();


const checkAll = ref(false);

// Handle "Check All" behavior
const handleCheckAllChange = (val) => {
      if (val) {
        selectedFields.value = [...availableFields.value]; // Select all fields
      } else {
        selectedFields.value = []; // Deselect all fields
      }
    };


const selectDownload = () => {
  showDownloadDialog.value = true;
};

const extractFields = (data) => {
  const fields = new Set();

  function traverse(obj, prefix = "", isNested = false) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (isNested) {
          if (key.toLowerCase().includes("name") || key.toLowerCase().includes("title") || key.toLowerCase() === "id") {
              fields.add(fullPath);
          }

        } else {
          if (!isGeoField(fullPath)) {
            if (typeof obj[key] === "object" && obj[key] !== null) {
              if (Array.isArray(obj[key])) {
                if (obj[key].length > 0 && typeof obj[key][0] === "object") {
                  traverse(obj[key][0], fullPath, true); // Nested array
                }
              } else {
                traverse(obj[key], fullPath, true); // Nested object
              }
            } else {
              fields.add(fullPath);
            }
          }
        }
      }
    }
  }

  function isGeoField(fieldName) {
    const geoKeywords = ["geo", "lat", "lng", "coordinate", "longitude", "latitude", "createdAt"];
    return geoKeywords.some((keyword) => fieldName.toLowerCase().includes(keyword));
  }

  data.forEach((item) => traverse(item));

  // Convert Set to Array and order the fields
  const fieldArray = Array.from(fields);
  const prioritizedFields = ["id", "name", "title"];

  // First add prioritized fields (id, name, title) in the specified order
  const orderedFields = prioritizedFields.filter(field => fieldArray.includes(field));

  // Then add the remaining fields sorted alphabetically
  const otherFields = fieldArray
    .filter(field => !prioritizedFields.includes(field))
    .sort();

  return orderedFields.concat(otherFields);
};

watch(
  () => ({
    data: props.data,
    all: props.all,
  
  }),
  (newProps) => {
    const { data,all } = newProps;

    if (data && data.length > 0) {
      tableDataList.value = data;
      all_data.value = all;
      availableFields.value = extractFields(tableDataList.value);
      filter_len.value=data.length
      all_len.value=all.length
     }

   
  },
  { immediate: true }
);

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
    const cleanedField = field.replace(/^.*?_/, ''); // Remove prefix
    return {
      column: cleanedField.replace(/\./g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
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
    fileName: 'data.xlsx',
    columns: columnWidths.map((width) => ({ width })),
  });
};



 
const downloadAll = async () => {
  if (!selectedFields.value.length) {
    return ElMessage.warning("Please select at least one field.");
  }

 

  const extractedData = extractData(all_data.value, selectedFields.value);

 // Clean up the field names and prepare column headers
 const columns = selectedFields.value.map((field) => {
    const cleanedField = field.replace(/^.*?_/, ''); // Remove prefix
    return {
      column: cleanedField.replace(/\./g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
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
    fileName: 'data.xlsx',
    columns: columnWidths.map((width) => ({ width })),
  });
};
</script>

<style scoped>
.field-tag {
  margin-left: 5px;
}
</style>
