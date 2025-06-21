<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElUpload, ElOption, ElSelect, ElTable, ElTableColumn, ElButton, ElCard, ElSteps, ElStep, ElAlert, ElInput, ElNotification } from 'element-plus';
import { getModelSpecs, getModelRelatives } from '@/api/fields';
import { BatchImportUpsert } from '@/api/settlements';
import { postBatchHouseholds } from '@/api/households';
import { getCountyListApi } from '@/api/counties';

import Fuse from 'fuse.js';
import readXlsxFile from 'read-excel-file';
import PermissionWrapper from '@/components/PermissionWrapper.vue';

// Type definitions
interface ExcelRow {
  [key: string]: any;
}

interface FieldMapping {
  excelField: string;
  dbField: string;
}

// Constants
const TABLE_OPTIONS = [
  { label: 'Projects', value: 'project' },
  { label: 'Settlements', value: 'settlement' },
  { label: 'Parcels', value: 'parcel' },
  { label: 'Structures', value: 'structure' },
  { label: 'Roads', value: 'road' },
  { label: 'Road Assets', value: 'road_asset' },
  { label: 'Sewer', value: 'sewer' },
  { label: 'Piped Water', value: 'piped_water' },
  { label: 'Health Facility', value: 'health_facility' },
  { label: 'School', value: 'education_facility' },
  { label: 'Water Point', value: 'water_point' },
  { label: 'Police Station', value: 'police_station' },
  { label: 'Crime Hotspots', value: 'crime_hotspot' },
  { label: 'Floodlights', value: 'floodlight' },
  { label: 'Railway', value: 'railway' },
  { label: 'Powerline', value: 'powerline' },
  { label: 'Hazard Zones', value: 'hazard_zone' },
  { label: 'Community Hall', value: 'community_hall' },
  { label: 'Community Project', value: 'community_project' },
  { label: 'Telcom Mast', value: 'mast' },
  { label: 'Streetlight', value: 'street_light' },
  { label: 'Dumping', value: 'dumping_site' },
  { label: 'Households', value: 'households' },
  { label: 'Beneficiaries', value: 'beneficiary' },
  { label: 'Parcel Owners', value: 'beneficiary_parcel' },
  { label: 'Interventions', value: 'intervention' },
  { label: 'Categories', value: 'category' },
  { label: 'Indicators', value: 'indicator' },
  { label: 'Indicator Configurations', value: 'indicator_category' },
];

const MODEL_MAPPINGS = {
  settlement: 'ward',
  default: 'settlement',
};

// State
const step = ref(0);
const excelData = ref<ExcelRow[]>([]);
const excelFields = ref<string[]>([]);
const targetTable = ref('');
const dbFields = ref<string[]>([]);
const fieldMappings = ref<FieldMapping[]>([]);
const remappedData = ref<ExcelRow[]>([]);
const importing = ref(false);
const usedDbFields = ref<Set<string>>(new Set());
const loading = ref({
  upload: false,
  appendParent: false,
  import: false,
});
const fieldSearch = ref('');
const previewCount = ref(1);

// Computed properties
const filteredFieldMappings = computed(() =>
  fieldMappings.value.filter((mapping) =>
    mapping.excelField.toLowerCase().includes(fieldSearch.value.toLowerCase())
  )
);

/**
 * Handles file upload (CSV or XLSX) and validation.
 * @param uploadFile - The uploaded file object
 */
const handleFileUpload = async (uploadFile: any) => {
  const file = uploadFile.raw || uploadFile.file;
  if (!file) {
    ElMessage.error('Invalid file');
    return;
  }

  // Reset state
  excelData.value = [];
  excelFields.value = [];
  targetTable.value = '';
  dbFields.value = [];
  fieldMappings.value = [];
  remappedData.value = [];
  importing.value = false;
  usedDbFields.value.clear();
  step.value = 0;
  loading.value.upload = true;

  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log(`Uploading file: ${file.name} (Extension: ${fileExtension})`);

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      ElMessage.info('Processing Excel file...');
      const rows = await readXlsxFile(file);
      
      if (!rows || rows.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      const headers = rows[0] as string[];
      const dataRows = rows.slice(1) as any[][];

      excelFields.value = headers;
      excelData.value = dataRows.map(row => {
        const obj: ExcelRow = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      ElMessage.success(`Excel file loaded successfully! ${excelData.value.length} rows found.`);
    } else if (fileExtension === 'csv') {
      ElMessage.info('Processing CSV file...');
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: ExcelRow = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      excelFields.value = headers;
      excelData.value = dataRows;

      ElMessage.success(`CSV file loaded successfully! ${excelData.value.length} rows found.`);
  } else {
      throw new Error('Unsupported file type. Please upload a .csv, .xlsx, or .xls file.');
    }

    step.value = 1;
  } catch (err) {
    console.error('File upload error:', err);
    ElMessage.error(err instanceof Error ? err.message : 'Error processing file');
  } finally {
    loading.value.upload = false;
  }
};

/**
 * Fetches model fields from the API and generates fuzzy field mappings.
 * @param selModel - Selected model (e.g., 'settlement')
 */
const getModelDefinition = async (selModel: string) => {
  const formData = { model: selModel };
  loading.value.appendParent = true;
  try {
    const response = await getModelSpecs(formData);
    const data = response.data;

    const fields = data
      .filter((obj: any) => obj.field !== 'id' && obj.field !== 'geom')
      .map((obj: any) => obj.field);

    if (selModel === 'project') {
      fields.push('activities');
    }

    dbFields.value = fields;
    generateFuzzyMappings();
    step.value++;
  } catch (err) {
    console.error('Model definition error:', err);
    ElMessage.error('Error fetching model specs');
  } finally {
    loading.value.appendParent = false;
  }
};

/**
 * Generates fuzzy mappings between Excel fields and database fields.
 */
const generateFuzzyMappings = () => {
  const fuse = new Fuse(dbFields.value, { includeScore: true, threshold: 0.5 });
  const matches: Record<string, { excelField: string; dbField: string; score: number }> = {};

  excelFields.value.forEach((excelField) => {
    const result = fuse.search(excelField);
    if (result.length > 0 && result[0].score !== undefined) {
      const bestMatch = result[0];
      const existing = matches[bestMatch.item];
      if (!existing || (bestMatch.score && bestMatch.score < existing.score)) {
        matches[bestMatch.item] = {
          excelField,
          dbField: bestMatch.item,
          score: bestMatch.score || 0,
        };
      }
    }
  });

  fieldMappings.value = excelFields.value.map((excelField) => {
    const match = Object.values(matches).find((m) => m.excelField === excelField);
    return {
      excelField,
      dbField: match ? match.dbField : '',
    };
  });

  usedDbFields.value = new Set(fieldMappings.value.map((m) => m.dbField).filter(Boolean));
};

/**
 * Checks if a database field is already mapped to another Excel field.
 * @param field - Database field to check
 * @param currentExcelField - Current Excel field being mapped
 * @returns True if the field is taken
 */
const isFieldTaken = (field: string, currentExcelField: string) => {
  return fieldMappings.value.some(
    (item) => item.dbField === field && item.excelField !== currentExcelField
  );
};

/**
 * Remaps Excel data based on field mappings.
 */
const remapExcelData = () => {
  if (!excelData.value.length) return;

  const fieldMap: Record<string, string> = Object.fromEntries(
    fieldMappings.value.map(({ excelField, dbField }) => [excelField, dbField])
  );

  remappedData.value = excelData.value.map((row) => {
    const newRow: ExcelRow = {};
    for (const key in row) {
      const mappedKey = fieldMap[key];
      if (mappedKey) {
        newRow[mappedKey] = row[key];
      }
    }
    return newRow;
  });
};

/**
 * Imports the remapped Excel data to the database.
 */
const importExcelData = async () => {
  if (!remappedData.value.length) return;

  loading.value.import = true;

  try {
    const formData = {
      model: targetTable.value,
      data: remappedData.value,
    };

    let response;
    if (targetTable.value === 'households') {
      response = await postBatchHouseholds(formData);
  } else {
      response = await BatchImportUpsert(formData);
    }

    const resData = response.data || response;

    console.log('Import response:', resData);

    if (Array.isArray(resData.errors) && resData.errors.length > 0) {
      const errorDetails = resData.errors.map((err: any, index: number) => {
        const rowIndex = err.index ?? index;
        const reason = err.detail ?? 'Unknown error';
        return `Row ${rowIndex + 1}: ${reason}`;
      }).join('<br>');

      ElNotification({
        title: 'Import Completed with Errors',
        message: `
          <div style="max-height: 65vh; overflow-y: auto; font-size: 13px; line-height: 1.4;">
            Failed to import ${resData.failedCount} of ${remappedData.value.length} rows:<br>
            ${errorDetails}
          </div>
        `,
        type: 'error',
        duration: 0,
        dangerouslyUseHTMLString: true,
      });

      return;
    }

    if (resData.failedCount > 0) {
      ElMessage.warning(`Imported ${remappedData.value.length - resData.failedCount} of ${remappedData.value.length} rows successfully, but ${resData.failedCount} failed. Check logs for details.`);
    } else {
      ElMessage.success(`Excel data imported successfully! ${remappedData.value.length} rows imported.`);
    }

  } catch (err) {
    console.error('Import error:', err);
    ElNotification({
      title: 'Import Error',
      message: err instanceof Error ? err.message : 'Error importing Excel data. Please check the data and try again.',
      type: 'error',
      duration: 0,
    });
  } finally {
    loading.value.import = false;
  }
};

/**
 * Handles navigation between steps and triggers import.
 */
const handleNextStep = async () => {
  if (step.value === 2) {
    remapExcelData();
  }
  if (step.value === 3) {
    await importExcelData();
  } else {
    step.value++;
  }
};

const handleReset = () => {
  step.value = 0;
  excelData.value = [];
  excelFields.value = [];
  targetTable.value = '';
  dbFields.value = [];
  fieldMappings.value = [];
  remappedData.value = [];
  usedDbFields.value.clear();
  fieldSearch.value = '';
  previewCount.value = 1;
};
</script>

<template>
  <el-card>
    <el-steps
      :active="step"
      finish-status="success"
      align-center
      aria-label="Excel import steps"
    >
      <el-step title="Upload File" aria-label="Step 1: Upload CSV or Excel file" />
      <el-step title="Select Target Table" aria-label="Step 2: Select target table" />
      <el-step title="Match Fields" aria-label="Step 3: Match fields to database fields" />
      <el-step title="Review & Import" aria-label="Step 4: Review and import data" />
    </el-steps>

    <!-- Step 0: Upload File -->
    <div v-if="step === 0" class="mt-4">
      <PermissionWrapper :permissions="['settlement:create',  'project:create', 'parcel:create', 'structure:create', 'road:create', 'road_asset:create', 'sewer:create', 'piped_water:create', 'health_facility:create', 'education_facility:create', 'water_point:create', 'police_station:create', 'crime_hotspot:create', 'floodlight:create', 'railway:create', 'powerline:create', 'hazard_zone:create', 'community_hall:create', 'community_project:create', 'mast:create', 'street_light:create', 'dumping_site:create', 'households:create', 'beneficiary:create', 'beneficiary_parcel:create', 'intervention:create', 'category:create', 'indicator:create', 'indicator_category:create']">
        <el-upload
          action=""
          :auto-upload="false"
          :show-file-list="true"
          :on-change="handleFileUpload"
          :limit="1"
          accept=".csv,.xlsx,.xls"
          aria-label="Upload CSV or Excel file"
        >
          <el-button type="primary" :loading="loading.upload">Upload File</el-button>
        </el-upload>
      </PermissionWrapper>
      <p class="text-sm text-gray-500 mt-2">Supported formats: .csv, .xlsx, .xls</p>
    </div>

    <!-- Step 1: Select Target Table -->
    <div v-if="step === 1" class="mt-4">
      <el-select
        v-model="targetTable"
        filterable
        clearable
        placeholder="Select destination table"
        @change="getModelDefinition"
        aria-label="Select destination table"
        :disabled="loading.appendParent"
      >
        <el-option
          v-for="table in TABLE_OPTIONS"
          :key="table.value"
          :label="table.label"
          :value="table.value"
        />
      </el-select>
    </div>

    <!-- Step 2: Match Fields -->
    <div v-if="step === 2" class="mt-4">
      <el-input
        v-model="fieldSearch"
        placeholder="Search fields"
        clearable
        filterable
        class="mb-2"
        aria-label="Search fields"
      />
      <div class="max-h-[60vh] overflow-auto border rounded bg-gray-50 p-2">
        <el-table :data="filteredFieldMappings" style="width: 100%">
          <el-table-column prop="excelField" label="Source Field" />
          <el-table-column label="Matched DB Field">
            <template #default="{ row }">
              <el-select
                v-model="row.dbField"
                clearable
                filterable
                placeholder="Select DB Field"
                aria-label="Select database field for mapping"
              >
                <el-option
                  v-for="field in dbFields"
                  :key="field"
                  :label="field"
                  :value="field"
                  :disabled="isFieldTaken(field, row.excelField)"
                />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Step 3: Review & Import -->
    <div v-if="step === 3" class="mt-4">
      <el-alert
        title="Ready to import. Below is the remapped sample data."
        type="success"
        aria-label="Import ready"
      />
      <el-select
        v-model="previewCount"
        placeholder="Select number of records to preview"
        class="mt-2"
        aria-label="Select number of records to preview"
      >
        <el-option label="1" :value="1" />
        <el-option label="5" :value="5" />
        <el-option label="10" :value="10" />
      </el-select>
      <div
        v-if="remappedData && remappedData.length"
        class="mt-2 max-h-60 overflow-auto border rounded bg-gray-50 p-2"
      >
        <pre class="text-sm whitespace-pre-wrap">
          {{ JSON.stringify(remappedData.slice(0, previewCount), null, 2) }}
        </pre>
      </div>
    </div>

    <!-- Navigation -->
    <div class="mt-4 flex justify-between items-center">
      <!-- Left side -->
      <div>
        <el-button
          :disabled="step === 0 || loading.appendParent || loading.import"
          @click="step--"
          aria-label="Go to previous step"
        >
          Back
    </el-button>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <el-button
          v-if="step === 3"
          type="warning"
          plain
          @click="handleReset"
          aria-label="Reset"
        >
          Reset
    </el-button>

        <PermissionWrapper :permissions="['settlement:create', 'project:create', 'parcel:create', 'structure:create', 'road:create', 'road_asset:create', 'sewer:create', 'piped_water:create', 'health_facility:create', 'education_facility:create', 'water_point:create', 'police_station:create', 'crime_hotspot:create', 'floodlight:create', 'railway:create', 'powerline:create', 'hazard_zone:create', 'community_hall:create', 'community_project:create', 'mast:create', 'street_light:create', 'dumping_site:create', 'households:create', 'beneficiary:create', 'beneficiary_parcel:create', 'intervention:create', 'category:create', 'indicator:create', 'indicator_category:create']">
          <el-button
            type="primary"
            :loading="importing || loading.appendParent || loading.import"
            @click="handleNextStep"
            aria-label="Proceed to next step or import"
          >
            {{ step === 3 ? 'Import' : 'Next' }}
          </el-button>
        </PermissionWrapper>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.mt-2 {
  margin-top: 0.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.text-sm {
  font-size: 0.875rem;
}
.text-gray-500 {
  color: #6b7280;
}
</style>