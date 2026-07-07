<script setup>
import { ref, toRefs, onMounted, computed, watch } from 'vue'
import { ElButton, ElProgress, ElDialog, ElUpload, ElSelect, ElTooltip, ElOption, ElOptionGroup, ElCheckbox, ElTag, ElIcon, ElDivider } from 'element-plus';
import {
  Position, View, Plus, User, Download, Briefcase, Delete, Edit,
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading, UploadFilled, CircleCloseFilled,
  Document, Picture, FolderOpened, Close
} from '@element-plus/icons-vue'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { ElMessage } from 'element-plus'
import { uuid } from 'vue-uuid'
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import axios from 'axios';
import { apiOrigin as prod } from '@/config/apiBase'
import state from '@/config/axios'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

const props = defineProps({
  message: String,
  showDialog: Boolean,
  data: Array,
  umodel: String,
  field: String,
  filterOptions: String
})

const emit = defineEmits(['upload-complete', 'upload-error'])

// Reactive state
const dialogVisible = ref(false)
const fileList = ref([])
const documentCategory = ref()
const protectedFile = ref(false)
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadStatus = ref('idle') // idle, uploading, success, error
const selectedFiles = ref([])
const dragActive = ref(false)

// Document types
const DocTypes = ref([])
const DocTypesFiltered = ref([])
const DocTypesAll = ref([])

// File validation
const maxFileSize = 5 * 1024 * 1024 * 1024 // 5GB
const maxFiles = 10
const allowedExtensions = ['xls', 'xlsx', 'xlsm', 'pdf', 'zip', 'rar', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'tiff', 'tif', 'csv', 'txt', 'json', 'geojson', 'kml', 'kmz', 'ppt', 'pptx', 'dwg', 'dxf', 'dgn']
const allowedTypes = {
  images: ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/tif'],
  documents: [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
    'application/pdf', // .pdf
    'application/zip', // .zip
    'application/x-rar-compressed', // .rar
    'application/x-zip-compressed',
    'application/vnd.rar', // .rar (alternative)
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
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
    'application/octet-stream' // Generic binary for CAD files
  ]
}

// Computed properties
const isPhotoCategory = computed(() => {
  return documentCategory.value === 21
})

const allowedMimeTypes = computed(() => {
  // Return all allowed types regardless of category
  return [...allowedTypes.images, ...allowedTypes.documents]
})

const totalFileSize = computed(() => {
  return selectedFiles.value.reduce((total, file) => total + file.size, 0)
})

const formattedTotalSize = computed(() => {
  return (totalFileSize.value / 1024 / 1024).toFixed(2)
})

const canUpload = computed(() => {
  return selectedFiles.value.length > 0 && documentCategory.value && !isUploading.value
})

// Methods
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
      sort: 'ASC'
    }
    })

    const ret = res.data
    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cur);
      return acc;
    }, {});

    for (let property in nestedData) {
      let opts = nestedData[property];
      var doc = {
        label: property,
        options: []
      }

      opts.forEach(function (arrayItem) {
        doc.options.push({
          value: arrayItem.id,
          label: arrayItem.type
        })
      })
      
      DocTypes.value.push(doc)

      if (props.filterOptions && doc.label == props.filterOptions) {
        DocTypesFiltered.value.push(doc)
      } else {
        DocTypesAll.value.push(doc)
      }
    }

    if (props.filterOptions) {
    DocTypes.value = DocTypesFiltered.value
    }
  } catch (error) {
    console.error('Error fetching document types:', error)
    ElMessage.error('Failed to load document types')
  }
}

const validateFile = (file) => {
  const errors = []
  
  // Check file size
  if (file.size > maxFileSize) {
    errors.push(`File size exceeds 5GB limit`)
  }
  
  // Check file type by extension and MIME type
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  const isValidType = allowedMimeTypes.value.includes(file.type) || allowedExtensions.includes(fileExtension || '')
  
  if (!isValidType) {
    errors.push(`File type not supported. Supported formats: ${allowedExtensions.join(', ')}`)
  }
  
  return errors
}

const handleFileSelect = (files) => {
  const newFiles = Array.from(files)
  const validFiles = []
  const invalidFiles = []
  
  newFiles.forEach(file => {
    const errors = validateFile(file)
    if (errors.length === 0) {
      validFiles.push(file)
    } else {
      invalidFiles.push({ file, errors })
    }
  })
  
  // Add valid files
  selectedFiles.value.push(...validFiles)
  
  // Show errors for invalid files
  invalidFiles.forEach(({ file, errors }) => {
    ElMessage.error(`${file.name}: ${errors.join(', ')}`)
  })
  
  // Check total file count
  if (selectedFiles.value.length > maxFiles) {
    ElMessage.warning(`Maximum ${maxFiles} files allowed. Only first ${maxFiles} files will be uploaded.`)
    selectedFiles.value = selectedFiles.value.slice(0, maxFiles)
  }
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const getFileIcon = (file) => {
  if (file.type.startsWith('image/')) return Picture
  if (file.type.includes('pdf')) return Document
  if (file.type.includes('excel') || file.type.includes('spreadsheet')) return Document
  if (file.type.includes('word') || file.type.includes('document')) return Document
  if (file.type.includes('zip')) return FolderOpened
  return Document
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleDragEnter = (e) => {
  e.preventDefault()
  dragActive.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  dragActive.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  dragActive.value = false
  const files = e.dataTransfer.files
  handleFileSelect(files)
}

const uploadFiles = async () => {
  if (!canUpload.value) return
  
  isUploading.value = true
  uploadStatus.value = 'uploading'
  uploadProgress.value = 0
  
  try {
  const formData = new FormData()
    
    // Add common fields
    formData.append('model', props.umodel || 'document')
    formData.append('createdBy', userInfo.id)
    formData.append('category', documentCategory.value)
    formData.append('field_id', props.field || '')
    formData.append('protected', protectedFile.value)
    formData.append('code', uuid.v4())
    
    if (props.field && props.data?.id) {
    formData.append(props.field, props.data.id)
    }
    
    // Add files
    selectedFiles.value.forEach((file, index) => {
      const format = file.name.split('.').pop()
      formData.append('files', file)
      formData.append('format', format)
      formData.append('size', (file.size / 1024 / 1024).toFixed(2))
    })
    
    // Simulate progress (since we don't have real progress from the API)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 10
      }
    }, 200)
    
    const response = await uploadFilesBatch(formData)
    
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    if (response.code === "0000") {
      uploadStatus.value = 'success'
      ElMessage.success(`Successfully uploaded ${selectedFiles.value.length} file(s)`)
      emit('upload-complete', response)
      
      // Reset form
      setTimeout(() => {
        resetForm()
        dialogVisible.value = false
      }, 1500)
    } else {
      throw new Error(response.message || 'Upload failed')
    }
    
  } catch (error) {
    console.error('Upload error:', error)
    uploadStatus.value = 'error'
    ElMessage.error(error.message || 'Upload failed')
    emit('upload-error', error)
  } finally {
    isUploading.value = false
  }
}

const resetForm = () => {
  selectedFiles.value = []
  documentCategory.value = null
  protectedFile.value = false
  uploadProgress.value = 0
  uploadStatus.value = 'idle'
  dragActive.value = false
}

const openDialog = () => {
  dialogVisible.value = true
  resetForm()
}

const closeDialog = () => {
  if (!isUploading.value) {
    dialogVisible.value = false
    resetForm()
  }
}

// Watch for prop changes
watch(() => props.showDialog, (newVal, oldVal) => {
  console.log('UploadComponent: showDialog prop changed', { newVal, oldVal })
  if (newVal) {
    console.log('Opening upload dialog...')
    openDialog()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  getDocumentTypes()
})
</script>

<template>
  <div class="upload-component">
    <!-- Upload Dialog -->
    <el-dialog 
      v-model="dialogVisible" 
      title="Upload Documents" 
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="!isUploading"
      :show-close="!isUploading"
      @close="closeDialog"
    >
      <div class="upload-container">
        <!-- Step 1: Document Type Selection -->
        <div class="upload-step">
          <h4>1. Select Document Type</h4>
      <el-select
        v-model="documentCategory"
            placeholder="Choose document type"
            class="full-width"
        clearable
        filterable
            :disabled="isUploading"
      >
        <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
              <el-option 
                v-for="item in group.options" 
                :key="item.value" 
                :label="item.label" 
                :value="item.value" 
              />
        </el-option-group>
      </el-select>
        </div>

        <!-- Step 2: File Selection -->
        <div class="upload-step" v-if="documentCategory">
          <h4>2. Select Files</h4>
          
          <!-- Drag & Drop Zone -->
          <div 
            class="drop-zone"
            :class="{ 'drag-active': dragActive, 'has-files': selectedFiles.length > 0 }"
            @dragenter="handleDragEnter"
            @dragover.prevent
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <div v-if="selectedFiles.length === 0" class="drop-zone-content">
              <el-icon size="48" color="#909399"><UploadFilled /></el-icon>
              <p>Drag and drop files here, or</p>
              <el-button type="primary" @click="$refs.fileInput.click()" :disabled="isUploading">
                Browse Files
              </el-button>
              <p class="file-limits">
                Max {{ maxFiles }} files, {{ formatFileSize(maxFileSize) }} each
                <br />
                Supported: {{ allowedExtensions.join(', ') }}
              </p>
            </div>
            
            <!-- File List -->
            <div v-else class="file-list">
              <div class="file-list-header">
                <span>Selected Files ({{ selectedFiles.length }}/{{ maxFiles }})</span>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="selectedFiles = []"
                  :disabled="isUploading"
                >
                  Clear All
                </el-button>
              </div>
              
              <div class="file-items">
                <div 
                  v-for="(file, index) in selectedFiles" 
                  :key="index"
                  class="file-item"
                >
                  <el-icon><component :is="getFileIcon(file)" /></el-icon>
                  <div class="file-info">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-size">{{ formatFileSize(file.size) }}</div>
                  </div>
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="removeFile(index)"
                    :disabled="isUploading"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
      </div>

              <div class="file-summary">
                <el-tag type="info">
                  Total: {{ selectedFiles.length }} files, {{ formattedTotalSize }} MB
                </el-tag>
              </div>
            </div>
          </div>
          
          <!-- Hidden file input -->
          <input 
            ref="fileInput"
            type="file"
            multiple
            :accept="allowedExtensions.map(ext => `.${ext}`).join(',')"
            @change="handleFileSelect($event.target.files)"
            style="display: none"
          />
        </div>

        <!-- Step 3: Options -->
        <div class="upload-step" v-if="documentCategory && selectedFiles.length > 0">
          <h4>3. Options</h4>
      <el-tooltip
        content="Only the Owner and Admin can view Private documents"
            placement="top"
      >
            <el-checkbox v-model="protectedFile" :disabled="isUploading">
              Make files private
            </el-checkbox>
      </el-tooltip>
        </div>

        <!-- Upload Progress -->
        <div v-if="isUploading" class="upload-progress">
        <el-progress
            :percentage="uploadProgress" 
            :status="uploadStatus === 'error' ? 'exception' : uploadStatus === 'success' ? 'success' : ''"
            :stroke-width="8"
          />
          <p class="progress-text">
            {{ uploadStatus === 'uploading' ? 'Uploading files...' : 
               uploadStatus === 'success' ? 'Upload completed!' : 
               uploadStatus === 'error' ? 'Upload failed' : '' }}
          </p>
        </div>
      </div>

      <!-- Dialog Footer -->
      <template #footer>
        <div class="dialog-footer">
          <el-button 
            @click="closeDialog" 
            :disabled="isUploading"
          >
            Cancel
          </el-button>
          <el-button 
            type="primary" 
            @click="uploadFiles"
            :loading="isUploading"
            :disabled="!canUpload"
          >
            {{ isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}` }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.upload-component {
  width: 100%;
}

.upload-container {
  padding: 0;
}

.upload-step {
  margin-bottom: 24px;
}

.upload-step h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-weight: 600;
}

.full-width {
  width: 100%;
}

.drop-zone {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
  background: #fafafa;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-zone.drag-active {
  border-color: #409eff;
  background: #f0f9ff;
}

.drop-zone.has-files {
  padding: 16px;
  min-height: auto;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.drop-zone-content p {
  margin: 0;
  color: #606266;
}

.file-limits {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.file-list {
  width: 100%;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  color: #303133;
}

.file-items {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: white;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item .el-icon {
  color: #409eff;
  font-size: 16px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.file-summary {
  margin-top: 12px;
  text-align: center;
}

.upload-progress {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}

.progress-text {
  margin: 8px 0 0 0;
  text-align: center;
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .drop-zone {
    padding: 24px 16px;
  }
  
  .file-item {
    padding: 6px 8px;
  }
  
  .file-name {
    font-size: 14px;
  }
}
</style>
