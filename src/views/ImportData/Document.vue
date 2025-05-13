  
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getFilteredHouseholdsByColumn,   } from '@/api/households'
import { uuid } from 'vue-uuid'

import {
    searchByKeyWord
} from '@/api/settlements' 
import {
  ElButton, ElSelect, ElOptionGroup, ElOption, ElUpload, ElSteps, ElStep, ElAlert, ElTable, ElTableColumn, ElSwitch, ElInput, ElNotification,ElMessage
} from 'element-plus'
import { Upload, RefreshLeft, Promotion, CircleCloseFilled } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

const { push } = useRouter()
const { t } = useI18n()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

// Type definitions
interface FileMetadata {
  name: string;
  type: string;
  format: string;
  size: string;
  protected: boolean;
  field_id?: string;
  [key: string]: any;
}

// Constants
const xUPLOAD_OPTIONS = [
  { value: 'settlement', label: 'Settlements' },
  { value: 'project', label: 'Projects' },
  { value: 'health_facility', label: 'Health Facilities' },
  { value: 'education_facility', label: 'Education Facilities' },
  { value: 'road', label: 'Roads' },
  { value: 'road_asset', label: 'Road Assets' },
  { value: 'water_point', label: 'Water points' },
  { value: 'piped_water', label: 'Water points' },
  { value: 'sewer', label: 'Sewer' },

  { value: 'other_documents', label: 'Other Documents' },
];


const UPLOAD_OPTIONS = [
  { value: 'settlement', label: 'Settlements' },
  { value: 'project', label: 'Projects' },
  { value: 'health_facility', label: 'Health Facilities' },
  { value: 'education_facility', label: 'Education Facilities' },
  { value: 'road', label: 'Roads' },
  { value: 'road_asset', label: 'Road Assets' },
  { value: 'water_point', label: 'Water Points' },
  { value: 'piped_water', label: 'Piped Water' },
  { value: 'sewer', label: 'Sewer' },
  { value: 'powerline', label: 'Powerlines' },
  { value: 'railway', label: 'Railways' },
  { value: 'floodlight', label: 'Floodlights' },
  { value: 'crime_hotspot', label: 'Crime Hotspots' },
  { value: 'police_station', label: 'Police Stations' },
  { value: 'hazard_zone', label: 'Hazard Zones' },
  { value: 'community_hall', label: 'Community Halls' },
  { value: 'community_project', label: 'Community Projects' },
  { value: 'mast', label: 'Masts' },
  { value: 'streetlight', label: 'Streetlights' },
  { value: 'dumping_site', label: 'Dumping Sites' },
  { value: 'other_facility', label: 'Other Facilities' },
  { value: 'other_documents', label: 'Other Documents' },
];


//Parent Mapping 
const MODEL_MAPPINGS = {
  settlement: 'settlement',
  project: 'settlement',
  project: 'settlement',
  education_facility: 'settlement',
  road: 'settlement',
  road_asset: 'road',
  water_point: 'settlement',
  sewer: 'settlement',
  other_facility: 'settlement',
 
  other_documents: null, // No parent for other_documents
};

// State
const step = ref(0);
const fileList = ref<UploadUserFile[]>([]);
const targetModel = ref('');
const docTypes = ref<any[]>([]);
const parentOptions = ref<any[]>([]);
const fileMetadata = ref<FileMetadata[]>([]);
const fieldMappings = ref<{ fileIndex: number; type: string; field_id?: string; parent_id?: number }[]>([]);
const usedParentIds = ref<Set<number>>(new Set());
const loading = ref({
  upload: false,
  fetchParents: false,
  import: false,
});
const fieldSearch = ref('');
const previewCount = ref(1);

// Computed properties
const filteredFieldMappings = computed(() =>
  fieldMappings.value.filter((mapping) =>
    fileList.value[mapping.fileIndex].name.toLowerCase().includes(fieldSearch.value.toLowerCase())
  )
);

 

// Fetch document types
const getDocumentTypes = async () => {
  try {
    const res = await getCountyListApi({
      params: {
        pageIndex: 1,
        limit: 100,
        curUser: 1,
        model: 'document_type',
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC',
      },
    });
    const nestedData = res.data.reduce((acc: any, cur: any) => {
      const group = cur.group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push({ value: cur.id, label: cur.type });
      return acc;
    }, {});
    docTypes.value = Object.entries(nestedData).map(([label, options]) => ({ label, options }));
  } catch (err) {
    console.error('Error fetching document types:', err);
    ElMessage.error('Failed to load document types');
  }
};
getDocumentTypes();

 const getParentOptions = async (model: string, keyword = '') => {
  loading.value.fetchParents = true;
  try {
    const associatedModels = model === 'settlement' ? ['county', 'subcounty','ward'] : 
                            ['project', 'contractor', 'road', 'road_asset'].includes(model) ? [] : 
                            ['county', 'subcounty', 'ward'];
     
    const formData = {
      curUser: 1,
      model: model,
      searchField: model === 'project' ? 'title' : 'name',
      searchKeyword: keyword,
      excludeGeom: false,
      excludeGeomAssoc: true,
      associated_multiple_models: associatedModels,
      filters: [],
      filterValues: [],
    };

    const response = model === 'households' 
      ? await getFilteredHouseholdsByColumn(formData)
      : await searchByKeyWord(formData);

    if (!response.data || response.data.length === 0) {
      throw new Error('No parent options found for the provided criteria');
    }

    console.log('response.data',response.data)
    parentOptions.value = response.data
      .filter((item: any) => item.id !== userInfo.id || model !== 'settlement')
      .map((item: any) => ({
        value: item.id,
        label: item.name || item.title || item.contract_number || 'Unknown',
        county: item.county?.name,
        subcounty: item.subcounty?.name,
        ward: item.ward?.name,
        ward_id: item.ward?.id,
        subcounty_id: item.subcounty?.id,
        county_id: item.county?.id,
      }));
  } catch (err) {
    console.error('Error fetching parent options:', err);
    ElMessage.error(err.message || 'Failed to load parent options');
  } finally {
    loading.value.fetchParents = false;
  }
};

// Handle file upload
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
 const types = [
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/pdf', // .pdf
  'application/zip', // .zip
  'application/x-rar-compressed', // .rar
  'application/x-zip-compressed',
  'application/vnd.rar', // .rar (alternative)
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/png', // .png
  'image/jpeg', // .jpg/.jpeg
  'image/tiff', // .tiff
  'text/csv', // .csv
  'text/plain', // .txt
  'application/json', // .json
  'application/vnd.geo+json', // .geojson
  'application/vnd.google-earth.kml+xml', // .kml
  'application/vnd.google-earth.kmz', // .kmz
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

  const isValidType = types.includes(file.type);
  const isLt50M = file.size / 1024 / 1024 < 5000;

  if (!isValidType) {
    ElMessage.error(`${file.type} file type is not allowed`);
    return false;
  }
  if (!isLt50M) {
    ElMessage.error('File size should not exceed 5GB');
    return false;
  }
  return true;
};

const handleFileUpload = async (uploadFile: any) => {
  const file = uploadFile.raw || uploadFile.file;
  if (!file || !beforeUpload(file)) return;

  loading.value.upload = true;
  try {
    fileList.value = [{ ...uploadFile, protected: false, type: '', field_id: '' }];
    fileMetadata.value = [{
      name: file.name,
      type: '',
      format: file.name.split('.').pop() || '',
      size: (file.size / 1024 / 1024).toFixed(2),
      protected: false,
      field_id: '',
    }];
    fieldMappings.value = [{ fileIndex: 0, type: '', field_id: '' }];
    ElMessage.success(`File ${file.name} loaded successfully!`);
    step.value = 1;
  } catch (err) {
    console.error('File upload error:', err);
    ElMessage.error('Error processing file');
  } finally {
    loading.value.upload = false;
  }
};

// Handle model selection
const handleSelectModel = async (model: string) => {
  targetModel.value = model;
  parentOptions.value = [];
  fieldMappings.value = fileList.value.map((_, index) => ({
    fileIndex: index,
    type: '',
    field_id: model === 'other_documents' ? undefined : MODEL_MAPPINGS[model] ? 'parent_id' : undefined,
  }));
  if (MODEL_MAPPINGS[model]) {
    await getParentOptions(model);
  }
  step.value++;
};

// Check if parent ID is taken
const isParentIdTaken = (parentId: number, currentFileIndex: number) => {
  return fieldMappings.value.some(
    (item) => item.field_id === 'parent_id' && item.parent_id === parentId && item.fileIndex !== currentFileIndex
  );
};

// Remap file metadata
const remapFileMetadata = () => {
  fileMetadata.value = fileList.value.map((file, index) => {
    const mapping = fieldMappings.value[index];
    const metadata: FileMetadata = {
      name: file.name,
      type: mapping.type,
      format: file.name.split('.').pop() || '',
      size: (file.size / 1024 / 1024).toFixed(2),
      protected: file.protected || false,
    };
    if (mapping.field_id && mapping.parent_id) {
      metadata[mapping.field_id] = mapping.parent_id;
    }
    return metadata;
  });
};

// Import files
const importFiles = async () => {
  loading.value.import = true;
  try {
    const formData = new FormData();
    fileList.value.forEach((file, index) => {
      const metadata = fileMetadata.value[index];
      formData.append('files', file.raw);
      formData.append('model', targetModel.value);
      formData.append('createdBy', userInfo.id.toString());
      formData.append('format', metadata.format);
      formData.append('category', metadata.type);
      if (metadata.field_id && metadata[metadata.field_id]) {
        formData.append('field_id', metadata.field_id);
        formData.append(metadata.field_id, metadata[metadata.field_id].toString());
      }
      formData.append('protected', metadata.protected.toString());
      formData.append('size', metadata.size);
      formData.append('code', uuid.v4());
    });

    const response = await uploadFilesBatch(formData);
    const resData = response.data || response;

    if (Array.isArray(resData.errors) && resData.errors.length > 0) {
      const errorDetails = resData.errors.map((err: any, index: number) => {
        const fileIndex = err.index ?? index;
        const reason = err.detail ?? 'Unknown error';
        return `File ${fileList.value[fileIndex].name}: ${reason}`;
      }).join('<br>');

      ElNotification({
        title: 'Import Completed with Errors',
        message: `
          <div style="max-height: 65vh; overflow-y: auto; font-size: 13px; line-height: 1.4;">
            Failed to import ${resData.errors.length} of ${fileList.value.length} files:<br>
            ${errorDetails}
          </div>
        `,
        type: 'error',
        duration: 0,
        dangerouslyUseHTMLString: true,
      });
      return;
    }

    if (resData.code === '0000') {
      ElMessage.success(`Files imported successfully! ${fileList.value.length} files imported.`);
      push({ path: '/repository/docs', name: 'RepositoryTagged' });
    } else {
      ElMessage.warning(`Imported ${fileList.value.length - (resData.failedCount || 0)} of ${fileList.value.length} files successfully.`);
    }
  } catch (err) {
    console.error('Import error:', err);
    ElNotification({
      title: 'Import Error',
      message: err.message || 'Error importing files. Please check the data and try again.',
      type: 'error',
      duration: 0,
    });
  } finally {
    loading.value.import = false;
  }
};

// Navigation handlers
const handleNextStep = async () => {
  if (step.value === 2) {
    remapFileMetadata();
  }
  if (step.value === 3) {
    await importFiles();
  } else {
    step.value++;
  }
};

const handleReset = () => {
  step.value = 0;
  fileList.value = [];
  targetModel.value = '';
  fileMetadata.value = [];
  fieldMappings.value = [];
  parentOptions.value = [];
  usedParentIds.value.clear();
  fieldSearch.value = '';
  previewCount.value = 1;
};
</script>

<template>
  <ContentWrap :title="t('Batch Upload Documents')" v-loading="loading.import" element-loading-text="Saving the data... Please wait...">
    <el-card>
      <el-steps :active="step" finish-status="success" align-center aria-label="File import steps">
        <el-step title="Upload Files" aria-label="Step 1: Upload documents" />
        <el-step title="Select Target Model" aria-label="Step 2: Select target model" />
        <el-step title="Match Fields" aria-label="Step 3: Match metadata fields" />
        <el-step title="Review & Import" aria-label="Step 4: Review and import data" />
      </el-steps>

      <!-- Step 0: Upload Files -->
      <div v-if="step === 0" class="mt-4">
        <el-upload
          action=""
          :auto-upload="false"
          :show-file-list="true"
          :on-change="handleFileUpload"
          :limit="1"
          multiple
          :before-upload="beforeUpload"
          accept=".xls,.xlsx,.pdf,.zip,.doc,.docx,.png,.jpg,.csv,.json,.geojson,.ppt,.pptx,.rar,.tif,.txt"
          aria-label="Upload documents"
        >
          <el-button type="primary" :loading="loading.upload">Upload Files</el-button>
        </el-upload>
        <p class="text-sm text-gray-500 mt-2">Supported formats: .xls, .xlsx, .pdf, .zip, .doc, .docx, .png, .jpg, .csv, .json, .geojson, .ppt, .pptx, .rar, .tif, .txt</p>
      </div>

      <!-- Step 1: Select Target Model -->
      <div v-if="step === 1" class="mt-4">
        <el-select
          v-model="targetModel"
          filterable
          clearable
          placeholder="Select entity to attach the documents to"
          @change="handleSelectModel"
          aria-label="Select entity to attach the documents to"
          :disabled="loading.fetchParents"
        >
             <el-option v-for="item in UPLOAD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
           
        </el-select>
      </div>

      <!-- Step 2: Match Fields -->
      <div v-if="step === 2" class="mt-4">
        <el-input
          v-model="fieldSearch"
          placeholder="Search files"
          clearable
          class="mb-2"
          aria-label="Search files"
        />
        <div class="max-h-[60vh] overflow-auto border rounded bg-gray-50 p-2">
          <el-table :data="filteredFieldMappings" style="width: 100%">
            <el-table-column label="File Name">
              <template #default="{ row }">
                {{ fileList[row.fileIndex].name }}
              </template>
            </el-table-column>
            <el-table-column label="Document Type">
              <template #default="{ row }">
                <el-select v-model="row.type" placeholder="Select Type" clearable filterable>
                  <el-option-group v-for="group in docTypes" :key="group.label" :label="group.label">
                    <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
                  </el-option-group>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column v-if="targetModel !== 'other_documents'" label="Parent Entity">
              <template #default="{ row }">
                <el-select
                  v-model="row.parent_id"
                  filterable
                  remote
                  :remote-method="getParentOptions.bind(null, targetModel)"
                  :loading="loading.fetchParents"
                  placeholder="Search parent entity"
                  aria-label="Select parent entity"
                >
                  <el-option
                    v-for="item in parentOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                    :disabled="isParentIdTaken(item.value, row.fileIndex)"
                  >
                    <div style="display: flex; align-items: center;">
                      <span style="flex: 1; text-align: left;">{{ item.label }}</span>
                      <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 13px; text-align: right;">
                        {{ item.ward }}, {{ item.subcounty }}, {{ item.county }}
                      </span>
                    </div>
                    </el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="Protected">
                <template #default="{ row }">
                  <el-switch v-model="fileList[row.fileIndex].protected" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- Step 3: Review & Import -->
        <div v-if="step === 3" class="mt-4">
          <el-alert
            title="Ready to import. Below is the remapped file metadata."
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
            v-if="fileMetadata && fileMetadata.length"
            class="mt-2 max-h-60 overflow-auto border rounded bg-gray-50 p-2"
          >
            <pre class="text-sm whitespace-pre-wrap">
              {{ JSON.stringify(fileMetadata.slice(0, previewCount), null, 2) }}
            </pre>
          </div>
        </div>

        <!-- Navigation -->
        <div class="mt-4 flex justify-between items-center">
          <div>
            <el-button
              :disabled="step === 0 || loading.fetchParents || loading.import"
              @click="step--"
              aria-label="Go to previous step"
            >
              Back
            </el-button>
          </div>
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
            <el-button
              type="primary"
              :loading="loading.import || loading.fetchParents"
              @click="handleNextStep"
              aria-label="Proceed to next step or import"
            >
              {{ step === 3 ? 'Import' : 'Next' }}
            </el-button>
          </div>
        </div>
      </el-card>
    </ContentWrap>
  </template>

  <style scoped>
  .mt-2 { margin-top: 0.5rem; }
  .mt-4 { margin-top: 1rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .text-sm { font-size: 0.875rem; }
  .text-gray-500 { color: #6b7280; }
</style>