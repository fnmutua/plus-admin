<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { uploadFilesBatch, checkFilesExist, linkDocument } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getFilteredHouseholdsByColumn,   } from '@/api/households'
import { uuid } from 'vue-uuid'

import {
    searchByKeyWord
} from '@/api/settlements' 
import {ElCard,
  ElButton, ElSelect, ElOptionGroup, ElOption, ElUpload, ElSteps, ElStep, ElAlert, ElTable, ElTableColumn, ElSwitch, ElInput, ElNotification,ElMessage
} from 'element-plus'
import { Upload, RefreshLeft, Promotion, CircleCloseFilled } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import PermissionWrapper from '@/components/PermissionWrapper.vue'

const { push } = useRouter()
const { t } = useI18n()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

// User location-based filtering
const isSuperAdmin = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.name === 'super_admin' || role.name === 'root_admin'
  ) || false
})

const hasNationalAccess = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.user_roles?.location_level === 'national'
  ) || false
})

const userCountyRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'county'
  )
})

const userCountyId = computed(() => {
  return userCountyRole.value?.user_roles?.county_id || null
})

const userSettlementRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'settlement'
  )
})

const userSettlementId = computed(() => {
  return userSettlementRole.value?.user_roles?.settlement_id || null
})

// Check if user should be restricted to their county
const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

console.log('Document.vue - User location info:', {
  isSuperAdmin: isSuperAdmin.value,
  hasNationalAccess: hasNationalAccess.value,
  userCountyId: userCountyId.value,
  userSettlementId: userSettlementId.value,
  isCountyRestricted: isCountyRestricted.value
})

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
  settlement: 'settlement_id',
  project: 'project_id',
   education_facility: 'education_facility_id',
  road: 'road_id',
  road_asset: 'road_asset_id',
  water_point: 'water_point_id',
  sewer: 'sewer_id',
  other_facility: 'other_facility_id',
 
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
    
    // Build filters array for server-side filtering
    let filters: string[] = []
    let filterValues: any[] = []
    
    // Apply county restriction if user is county-restricted (unless super admin or national admin)
    if (isCountyRestricted.value && userCountyId.value) {
      // For models that have county_id field, apply county restriction
      if (associatedModels.includes('county') || model === 'settlement') {
        filters.push('county_id')
        filterValues.push([userCountyId.value])
        console.log('Applying county restriction filter for model:', model, 'county_id:', userCountyId.value)
      }
    } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
      // User is restricted to their settlement
      if (model === 'settlement') {
        filters.push('settlement_id')
        filterValues.push([userSettlementId.value])
        console.log('Applying settlement restriction filter:', userSettlementId.value)
      }
    }
     
    const formData = {
      curUser: 1,
      model: model,
      searchField: model === 'project' ? 'title' : 'name',
      searchKeyword: keyword,
      excludeGeom: false,
      excludeGeomAssoc: true,
      associated_multiple_models: associatedModels,
      filters: filters,
      filterValues: filterValues,
    };

    const response = model === 'households' 
      ? await getFilteredHouseholdsByColumn(formData)
      : await searchByKeyWord(formData);

    if (!response.data || response.data.length === 0) {
      throw new Error('No parent options found for the provided criteria');
    }

    console.log('response.data',response.data)
    
    // Filter results based on user restrictions
    let filteredData = response.data.filter((item: any) => {
      // Exclude current user's settlement if model is settlement
      if (model === 'settlement' && item.id === userInfo.id) {
        return false
      }
      
      // Apply county restriction for county-restricted users
      if (isCountyRestricted.value && userCountyId.value) {
        // Check if item has county_id and it matches user's county
        const itemCountyId = item.county_id || item.county?.id
        if (itemCountyId && itemCountyId !== userCountyId.value) {
          return false
        }
      }
      
      // Apply settlement restriction for settlement-restricted users
      if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value && model === 'settlement') {
        if (item.id !== userSettlementId.value) {
          return false
        }
      }
      
      return true
    })
    
    parentOptions.value = filteredData.map((item: any) => ({
      value: item.id,
      label: item.name || item.title || item.contract_number || 'Unknown',
      county: item.county?.name,
      subcounty: item.subcounty?.name,
      ward: item.ward?.name,
      ward_id: item.ward?.id,
      subcounty_id: item.subcounty?.id,
      county_id: item.county_id || item.county?.id,
    }));
    
    console.log('Filtered parent options:', parentOptions.value.length, 'out of', response.data.length)
  } catch (err) {
    console.error('Error fetching parent options:', err);
    ElMessage.error(err.message || 'Failed to load parent options');
  } finally {
    loading.value.fetchParents = false;
  }
};

// Handle file validation before upload
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // Check file type and size
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['xls', 'xlsx', 'pdf', 'zip', 'rar', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'tiff', 'tif', 'csv', 'txt', 'json', 'geojson', 'kml', 'kmz', 'ppt', 'pptx', 'dwg', 'dxf', 'dgn'];
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
    'image/tif', // .tif
    'text/csv', // .csv
    'text/plain', // .txt
    'application/json', // .json
    'application/vnd.geo+json', // .geojson
    'application/vnd.google-earth.kml+xml', // .kml
    'application/vnd.google-earth.kmz', // .kmz
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/dwg', // .dwg
    'image/vnd.dwg', // .dwg (alternative)
    'application/dxf', // .dxf
    'image/vnd.dxf', // .dxf (alternative)
    'application/dgn', // .dgn
    'image/vnd.dgn', // .dgn (alternative)
    'application/octet-stream', // Generic binary for CAD files
  ];
  
  const isValidType = types.includes(file.type) || allowedExtensions.includes(fileExtension || '');
  const isLt50M = file.size / 1024 / 1024 < 5000;

  if (!isValidType) {
    ElMessage.error(`File type not supported. Supported formats: ${allowedExtensions.join(', ')}`);
    return false;
  }
  
  if (!isLt50M) {
    ElMessage.error('File size should not exceed 5GB');
    return false;
  }

  return true;
};

// Handle file upload after validation passes
const handleFileUpload = async (uploadFile: any) => {
  const file = uploadFile.raw || uploadFile.file;
  
  if (!file) {
    ElMessage.error('No file selected');
    return;
  }

  // Double-check validation as safety net (in case beforeUpload didn't work)
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['xls', 'xlsx', 'pdf', 'zip', 'rar', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'tiff', 'tif', 'csv', 'txt', 'json', 'geojson', 'kml', 'kmz', 'ppt', 'pptx', 'dwg', 'dxf', 'dgn'];
  const types = [
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf', 'application/zip', 'application/x-rar-compressed', 'application/x-zip-compressed',
    'application/vnd.rar', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png', 'image/jpeg', 'image/tiff', 'image/tif', 'text/csv', 'text/plain', 'application/json',
    'application/vnd.geo+json', 'application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/dwg', 'image/vnd.dwg', 'application/dxf', 'image/vnd.dxf', 'application/dgn', 'image/vnd.dgn',
    'application/octet-stream'
  ];
  
  const isValidType = types.includes(file.type) || allowedExtensions.includes(fileExtension || '');
  const isLt50M = file.size / 1024 / 1024 < 5000;

  if (!isValidType) {
    ElMessage.error(`File type not supported. Supported formats: ${allowedExtensions.join(', ')}`);
    return;
  }
  
  if (!isLt50M) {
    ElMessage.error('File size should not exceed 5GB');
    return;
  }

  // Prevent duplicates based on name + size
  const exists = fileList.value.some(f => f.name === file.name && f.size === file.size);
  if (exists) {
    ElMessage.warning(`File ${file.name} already uploaded.`);
    return;
  }

  loading.value.upload = true;
  try {
    const currentIndex = fileList.value.length;

    console.log( 'fileList.value', fileList.value)
    fileList.value.push({
      ...uploadFile,
      protected: false,
      type: '',
      field_id: ''
    });

    fileMetadata.value.push({
      name: file.name,
      type: '',
      format: file.name.split('.').pop() || '',
      size: (file.size / 1024 / 1024).toFixed(2),
      protected: false,
      field_id: ''
    });

    fieldMappings.value.push({
      fileIndex: currentIndex,
      type: '',
      field_id: ''
    });

    ElMessage.success(`File ${file.name} loaded successfully!`);
   // step.value = 1;
  } catch (err) {
    console.error('File upload error:', err);
    ElMessage.error('Error processing file');
  } finally {
    loading.value.upload = false;
  }
};


const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning(
    `The limit is 20, you selected ${files.length} files this time, add up to ${
      files.length + uploadFiles.length
    } totally`
  )
}

// Handle model selection
 

 const handleSelectModel = async (model: string) => {
  targetModel.value = model;
  parentOptions.value = [];

  const mappedFieldId = MODEL_MAPPINGS[model] || undefined;

  fieldMappings.value = fileList.value.map((_, index) => ({
    fileIndex: index,
    type: '',
    field_id: mappedFieldId,
  }));

  if (mappedFieldId) {
    await getParentOptions(model);
  }

  console.log('fieldMappings.value', fieldMappings.value);
  step.value++;
};


// Remap file metadata
const remapFileMetadata = () => {

  canImport.value = fileList.value.length > 0;

  // Validate parent selections for county-restricted users
  if (isCountyRestricted.value && userCountyId.value && targetModel.value !== 'other_documents') {
    const invalidMappings = fieldMappings.value.filter((mapping, index) => {
      if (!mapping.parent_id) return false // Skip if no parent selected
      
      const selectedParent = parentOptions.value.find(opt => opt.value === mapping.parent_id)
      if (!selectedParent) return false // Skip if parent not found (shouldn't happen)
      
      // Check if selected parent is in user's county
      const parentCountyId = selectedParent.county_id
      if (parentCountyId && parentCountyId !== userCountyId.value) {
        return true // Invalid - parent is outside user's county
      }
      return false
    })
    
    if (invalidMappings.length > 0) {
      ElMessage.error('Cannot import: Some files are mapped to entities outside your assigned county. Please select entities from your county only.');
      canImport.value = false
      return
    }
  }

  fileMetadata.value = fileList.value.map((file, index) => {
    const mapping = fieldMappings.value[index];
    const metadata: FileMetadata = {
      name: file.name,
      type: mapping.type,
      format: file.name.split('.').pop() || '',
      size: (file.size / 1024 / 1024).toFixed(2),
      protected: file.protected || false,
      field_id: mapping.field_id,
    };
    if (mapping.field_id && mapping.parent_id) {
      metadata[mapping.field_id] = mapping.parent_id;
    }
    return metadata;
  });
};

// Import files
const ximportFiles = async () => {
  loading.value.import = true;
  try {
    const formData = new FormData();
    fileList.value.forEach((file, index) => {
      const metadata = fileMetadata.value[index];
      formData.append('files', file.raw);
      formData.append('model', 'document');
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


const xximportFiles = async () => {
  loading.value.import = true;
  try {
    // Step 1: Prepare documents for pre-check
    const documents = fileList.value.map((file) => ({
      name: file.name
      // Optional: Add hash if you implement client-side hashing
      // hash: await computeFileHash(file.raw)
    }));

    console.log('documents',documents)

    // Step 2: Check for existing documents
     const checkformData = {};
     checkformData.documents = documents;
     
    const checkResponse = await checkFilesExist(checkformData);

    const checkData = checkResponse.data || checkResponse;

    console.log('checkData',checkData)

    if (checkData.code !== '0000') {
      throw new Error(checkData.message || 'Failed to check documents');
    }

    // Step 3: Check if any documents exist
    const existingDocs = checkData.results.filter(result => result.exists).map(result => result.name);
    if (existingDocs.length > 0) {
      ElNotification({
        title: 'Import Stopped',
        message: `
          <div style="max-height: 65vh; overflow-y: auto; font-size: 13px; line-height: 1.4;">
            Cannot import because the following documents already exist:<br>
            ${existingDocs.join('<br>')}
          </div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true
      });
      return;
    }

    // Step 4: Proceed with upload if no documents exist
    const formData = new FormData();
    fileList.value.forEach((file, index) => {
      const metadata = fileMetadata.value[index];
      formData.append('files', file.raw);
      formData.append('model', 'document');
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
      const errorDetails = resData.errors.map((err, index) => {
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
        dangerouslyUseHTMLString: true
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
      duration: 0
    });
  } finally {
    loading.value.import = false;
  }
};

const canImport = ref(true);



const importFiles = async () => {
  loading.value.import = true;

  if (fileList.value.length === 0) {
  canImport.value = false; // Disable import if no files remain
  return;
}


  try {
    // Step 1: Prepare documents for pre-check
    const documents = fileList.value.map((file) => ({
      name: file.name
      // Optional: Add hash if you implement client-side hashing
      // hash: await computeFileHash(file.raw)
    }));

    console.log('documents', documents);

    // Step 2: Check for existing documents
    const checkformData = { documents };
    const checkResponse = await checkFilesExist(checkformData);
    const checkData = checkResponse.data || checkResponse;

    console.log('checkData', checkData);

    if (checkData.code !== '0000') {
      throw new Error(checkData.message || 'Failed to check documents');
    }

    // Step 3: For existing documents, create a document_link instead of skipping
    const existingResults = checkData.results.filter((r: any) => r.exists)
    const linkedNames: string[] = []
    const alreadyLinkedNames: string[] = []

    if (existingResults.length > 0) {
      for (let idx = 0; idx < fileList.value.length; idx++) {
        const file = fileList.value[idx]
        const match = existingResults.find((r: any) => r.name === file.name)
        if (!match) continue

        const metadata = fileMetadata.value[idx]
        const fieldId = metadata.field_id // e.g. 'settlement_id'
        const entityId = fieldId ? metadata[fieldId] : null
        const entityType = fieldId ? fieldId.replace(/_id$/, '') : null

        if (match.document_id && entityType && entityId) {
          try {
            const res: any = await linkDocument({
              document_id: match.document_id,
              entity_type: entityType,
              entity_id: Number(entityId)
            })
            if (res?.data?.message === 'Already linked') {
              alreadyLinkedNames.push(file.name)
            } else {
              linkedNames.push(file.name)
            }
          } catch {
            alreadyLinkedNames.push(file.name)
          }
        } else {
          alreadyLinkedNames.push(file.name)
        }
      }

      // Remove existing docs from upload list
      const existingNames = existingResults.map((r: any) => r.name)
      const filteredFiles: any[] = []
      const filteredMetadata: any[] = []
      fileList.value.forEach((file, idx) => {
        if (!existingNames.includes(file.name)) {
          filteredFiles.push(file)
          filteredMetadata.push(fileMetadata.value[idx])
        }
      })
      fileList.value = filteredFiles
      fileMetadata.value = filteredMetadata

      // Show summary for existing docs
      const parts: string[] = []
      if (linkedNames.length) parts.push(`Linked to new entity: ${linkedNames.join(', ')}`)
      if (alreadyLinkedNames.length) parts.push(`Already linked (skipped): ${alreadyLinkedNames.join(', ')}`)
      if (parts.length) {
        ElNotification({
          title: 'Existing Documents',
          message: `<div style="font-size:13px;line-height:1.5;">${parts.join('<br>')}</div>`,
          type: 'info',
          duration: 8000,
          dangerouslyUseHTMLString: true
        })
      }

      if (fileList.value.length === 0) {
        loading.value.import = false
        return
      }
    }

    // Step 4: Proceed with upload for filtered files
    const formData = new FormData();
    fileList.value.forEach((file, index) => {
      const metadata = fileMetadata.value[index];
      formData.append('files', file.raw);
      formData.append('model', 'document');
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
      const errorDetails = resData.errors.map((err, index) => {
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
        dangerouslyUseHTMLString: true
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
      duration: 0
    });
  } finally {
    loading.value.import = false;
  }
};



// Navigation handlers
const handleNextStep = async () => {
  // Validate that we have files before proceeding from step 0
  if (step.value === 0) {
    if (fileList.value.length === 0) {
      ElMessage.warning('Please upload at least one file before proceeding');
      return;
    }
  }
  
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
        <PermissionWrapper :permissions="'document:create'">
          <el-upload
            action=""
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleFileUpload"
            :on-exceed="handleExceed"
            :before-upload="beforeUpload"
            :limit="20"
            :multiple="true"
            accept=".xls,.xlsx,.pdf,.zip,.doc,.docx,.png,.jpg,.csv,.json,.geojson,.ppt,.pptx,.rar,.tif,.txt,.dwg,.dxf,.dgn,.tiff"
            aria-label="Upload documents"
          >
            <el-button type="primary" :loading="loading.upload">Upload Files</el-button>
          </el-upload>
        </PermissionWrapper>
        <p class="text-sm text-gray-500 mt-2">Supported formats: .xls, .xlsx, .pdf, .zip, .doc, .docx, .png, .jpg, .csv, .json, .geojson, .ppt, .pptx, .rar, .tif, .txt, .dwg, .dxf, .dgn, .tiff</p>
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
            <PermissionWrapper :permissions="'document:create'">
              <el-button
                type="primary"
                :loading="loading.import || loading.fetchParents"
                :disabled="(step === 0 && fileList.length === 0) || (step === 3 && (!canImport || fileList.length === 0))"
                @click="handleNextStep"
                aria-label="Proceed to next step or import"
              >
                {{ step === 3 ? 'Import' : 'Next' }}
              </el-button>
            </PermissionWrapper>

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