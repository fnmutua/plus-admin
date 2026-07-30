<script setup>
import { ref, computed, watch } from 'vue'
import {
  ElDrawer, ElButton, ElCard, ElInput, ElEmpty, ElSkeleton, ElTag, ElSpace,
  ElPopconfirm, ElTooltip, ElMessage, ElMessageBox, ElIcon
} from 'element-plus'
import { Icon } from '@iconify/vue'
import { getFile } from '@/api/summary'
import { getCountyListApi } from '@/api/counties'
import { deleteDocument, unlinkDocument } from '@/api/settlements'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import PermissionWrapper from '@/components/PermissionWrapper.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  data: {
    type: Object,
    default: () => ({})
  },
  docmodel: {
    type: String,
    default: ''
  },
  permissions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'openDialog', 'open-dialog', 'refresh'])

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const downloadingDocId = ref(null)
const viewingDocId = ref(null)

// Check if device is mobile
const isMobile = ref(window.innerWidth <= 768)

// Get documents from props
const documents = computed(() => props.data?.documents || [])

// Local documents list that can be modified
const localDocuments = ref([])

// Watch for changes in props.data.documents and update local list
watch(() => props.data?.documents, (newDocs) => {
  console.log('Documents prop changed, updating local list:', newDocs)
  localDocuments.value = newDocs || []
}, { immediate: true, deep: true })

// Watch for changes in the entire data object (when switching rows)
watch(() => props.data, (newData) => {
  console.log('Data prop changed, updating local list:', newData?.documents)
  localDocuments.value = newData?.documents || []
}, { immediate: true, deep: true })

// Check if a specific document can be deleted
const canDeleteDocument = (document) => {
  const owner = userInfo?.id === document?.createdBy
  const hasCreatedBy = document?.createdBy !== null && document?.createdBy !== undefined
  
  console.log('canDeleteDocument check:', { 
    owner, 
    userId: userInfo?.id, 
    createdBy: document?.createdBy,
    hasCreatedBy,
    documentId: document?.id,
    documentName: document?.name,
    canDelete: owner
  })
  
  // If document has no createdBy field, allow deletion (for backward compatibility)
  if (!hasCreatedBy) {
    console.log('Document has no createdBy field, allowing deletion for backward compatibility')
    return true
  }
  
  // If user is the owner, they can delete
  return owner
}

// File type detection and icons
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const iconMap = {
    // Images
    'jpg': 'mdi:image', 'jpeg': 'mdi:image', 'png': 'mdi:image', 'gif': 'mdi:image', 'bmp': 'mdi:image', 'svg': 'mdi:image', 'webp': 'mdi:image',
    // Videos
    'mp4': 'mdi:play-circle', 'avi': 'mdi:play-circle', 'mov': 'mdi:play-circle', 'wmv': 'mdi:play-circle', 'flv': 'mdi:play-circle', 'webm': 'mdi:play-circle',
    // Audio
    'mp3': 'mdi:headphones', 'wav': 'mdi:headphones', 'flac': 'mdi:headphones', 'aac': 'mdi:headphones', 'ogg': 'mdi:headphones',
    // Documents
    'pdf': 'mdi:file-pdf-box', 'doc': 'mdi:file-document', 'docx': 'mdi:file-document', 'txt': 'mdi:file-document', 'rtf': 'mdi:file-document',
    'xls': 'mdi:file-excel', 'xlsx': 'mdi:file-excel', 'ppt': 'mdi:file-powerpoint', 'pptx': 'mdi:file-powerpoint',
    // Archives
    'zip': 'mdi:folder-zip', 'rar': 'mdi:folder-zip', '7z': 'mdi:folder-zip', 'tar': 'mdi:folder-zip', 'gz': 'mdi:folder-zip'
  }
  
  return iconMap[ext] || 'mdi:file'
}

const getFileType = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const typeMap = {
    'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image', 'bmp': 'Image', 'svg': 'Image', 'webp': 'Image',
    'mp4': 'Video', 'avi': 'Video', 'mov': 'Video', 'wmv': 'Video', 'flv': 'Video', 'webm': 'Video',
    'mp3': 'Audio', 'wav': 'Audio', 'flac': 'Audio', 'aac': 'Audio', 'ogg': 'Audio',
    'pdf': 'PDF', 'doc': 'Document', 'docx': 'Document', 'txt': 'Text', 'rtf': 'Document',
    'xls': 'Spreadsheet', 'xlsx': 'Spreadsheet', 'ppt': 'Presentation', 'pptx': 'Presentation',
    'zip': 'Archive', 'rar': 'Archive', '7z': 'Archive', 'tar': 'Archive', 'gz': 'Archive'
  }
  
  return typeMap[ext] || 'File'
}

const getFileTypeColor = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const colorMap = {
    'jpg': 'success', 'jpeg': 'success', 'png': 'success', 'gif': 'success', 'bmp': 'success', 'svg': 'success', 'webp': 'success',
    'mp4': 'warning', 'avi': 'warning', 'mov': 'warning', 'wmv': 'warning', 'flv': 'warning', 'webm': 'warning',
    'mp3': 'info', 'wav': 'info', 'flac': 'info', 'aac': 'info', 'ogg': 'info',
    'pdf': 'danger', 'doc': 'primary', 'docx': 'primary', 'txt': '', 'rtf': 'primary',
    'xls': 'success', 'xlsx': 'success', 'ppt': 'warning', 'pptx': 'warning',
    'zip': '', 'rar': '', '7z': '', 'tar': '', 'gz': ''
  }
  
  return colorMap[ext] || 'info'
}

// Document size is stored in MB (see upload flows)
const formatDocSize = (size) => {
  const mb = Number(size)
  if (!isFinite(mb) || mb <= 0) return ''
  if (mb < 1) return `${Math.max(1, Math.round(mb * 1024))} KB`
  return `${mb.toFixed(2)} MB`
}

// Tag type ('' means default) → CSS suffix for the icon tile
const tileColor = (filename) => getFileTypeColor(filename) || 'neutral'

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Actions
const downloadFile = async (doc) => {
  console.log('Downloading file:', doc)
  downloadingDocId.value = doc.id
  
  const formData = {}
  formData.filename = doc.name
  formData.doc_id = doc.id
  formData.responseType = 'blob'

  try {
    const response = await getFile(formData)
    console.log('Download response:', response)
    
    // Check if the response is an error message
    if (response.data instanceof Blob && response.data.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = () => {
        const errorData = JSON.parse(reader.result)
        ElMessage.error(errorData.message || 'Download failed')
        downloadingDocId.value = null
      }
      reader.readAsText(response.data)
      return
    }

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', doc.name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('File downloaded successfully')
  } catch (error) {
    console.error('Error downloading file:', error)
    ElMessage.error(error.response?.data?.message || 'Download failed')
  } finally {
    downloadingDocId.value = null
  }
}

const viewDocument = async (doc) => {
  viewingDocId.value = doc.id
  
  const formData = {}
  formData.filename = doc.name
  formData.doc_id = doc.id
  formData.responseType = 'blob'
  
  try {
    const response = await getFile(formData)
    const blobData = new Blob([response.data], { type: response.headers['content-type'] })
    const url = window.URL.createObjectURL(blobData)
    const newTab = window.open(url, '_blank')
    
    if (newTab) {
      newTab.addEventListener('load', () => {
        viewingDocId.value = null
      })
    } else {
      ElMessage.error('Failed to open the document')
      viewingDocId.value = null
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('Failed to load the document')
    viewingDocId.value = null
  }
}

const removeDocument = async (doc) => {
  try {
    console.log('Delete button clicked for document:', doc)
    
    // Show confirmation dialog
    const confirmed = await ElMessageBox.confirm(
      'Are you sure you want to delete this document?',
      'Confirm Delete',
      {
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    if (!confirmed) return
    
    console.log('Deleting document:', doc)
    console.log('Doc model:', props.docmodel)

    // Step 1: unlink from the current entity before deleting
    const entityId = Number(props.data?.id)
    if (props.docmodel && !isNaN(entityId)) {
      try { await unlinkDocument({ document_id: doc.id, entity_type: props.docmodel, entity_id: entityId }) } catch { /* ignore */ }
    }

    const formData = {
      id: doc.id,
      model: props.docmodel,
      filesToDelete: [doc.name]
    }

    console.log('Sending delete request with data:', formData)
    const response = await deleteDocument(formData)
    console.log('Delete response:', response)
    
    // Remove the document from the local list immediately
    const docIndex = localDocuments.value.findIndex(d => d.id === doc.id)
    if (docIndex !== -1) {
      localDocuments.value.splice(docIndex, 1)
      console.log('Document removed from local list')
    }
    
    ElMessage.success('Document deleted successfully')
    
    // Emit event to refresh parent data
    console.log('Emitting refresh event')
    emit('refresh')
  } catch (error) {
    if (error === 'cancel') {
      console.log('Delete cancelled by user')
      return
    }
    
    console.error('Error deleting document:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data
    })
    
    // More specific error messages
    let errorMessage = 'Failed to delete document'
    if (error.response?.status === 403) {
      errorMessage = 'You do not have permission to delete this document'
    } else if (error.response?.status === 404) {
      errorMessage = 'Document not found or already deleted'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }
    
    ElMessage.error(errorMessage)
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleAddDocument = () => {
  console.log('Add document button clicked!')
  emit('openDialog')
  emit('open-dialog')
}

// document.category is a document_type id — resolve it to the type name once
const docTypeNames = ref({})
const loadDocTypes = async () => {
  if (Object.keys(docTypeNames.value).length) return
  try {
    const res = await getCountyListApi({
      params: {
        pageIndex: 1,
        limit: 200,
        curUser: 1,
        model: 'document_type',
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC'
      }
    })
    const map = {}
    ;(res.data || []).forEach((t) => {
      map[t.id] = t.type
    })
    docTypeNames.value = map
  } catch (error) {
    console.error('Failed to load document types:', error)
  }
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) loadDocTypes()
  },
  { immediate: true }
)
</script>

<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="(val) => emit('update:visible', val)"
    :size="isMobile ? '100%' : '600px'"
    direction="rtl"
    :before-close="handleClose"
    class="document-drawer"
    :show-close="true"
    :with-header="false"
  >

    <!-- Header -->
    <div class="dd-header">
      <div class="dd-header-text">
        <div class="dd-title-row">
          <Icon icon="mdi:paperclip" class="dd-title-icon" />
          <span class="dd-title">Documents</span>
          <el-tag size="small" round effect="plain" class="dd-count">{{ localDocuments.length }}</el-tag>
        </div>
        <span class="dd-subtitle">Files attached to this report</span>
      </div>
      <div class="dd-header-actions">
        <el-button type="primary" @click="handleAddDocument">
          <Icon icon="mdi:plus" class="dd-btn-icon" />
          Add
        </el-button>
        <el-button text circle class="dd-close" @click="handleClose">
          <Icon icon="mdi:close" />
        </el-button>
      </div>
    </div>

    <!-- Documents List -->
    <div v-if="localDocuments.length > 0" class="dd-list">
      <div
        v-for="(document, index) in localDocuments"
        :key="document.id || index"
        class="dd-item"
      >
        <div class="dd-tile" :class="`dd-tile--${tileColor(document.name)}`">
          <Icon :icon="getFileIcon(document.name)" class="dd-tile-icon" />
        </div>

        <div class="dd-item-body">
          <el-tooltip :content="document.name" placement="top" :show-after="400">
            <span class="dd-name">{{ document.name }}</span>
          </el-tooltip>
          <div class="dd-meta">
            <el-tag
              size="small"
              effect="light"
              round
              :type="getFileTypeColor(document.name) || 'info'"
            >
              {{ getFileType(document.name) }}
            </el-tag>
            <span v-if="formatDocSize(document.size)" class="dd-meta-text">{{ formatDocSize(document.size) }}</span>
            <span v-if="document.createdAt" class="dd-meta-text">{{ formatDate(document.createdAt) }}</span>
          </div>
          <div v-if="docTypeNames[document.category]" class="dd-cat-row">
            <el-tag size="small" effect="plain" round class="dd-cat-tag">
              {{ docTypeNames[document.category] }}
            </el-tag>
          </div>
        </div>

        <div class="dd-actions">
          <el-tooltip content="View" placement="top">
            <el-button
              circle
              text
              class="dd-action"
              :loading="viewingDocId === document.id"
              @click="viewDocument(document)"
            >
              <Icon v-if="viewingDocId !== document.id" icon="mdi:eye-outline" />
            </el-button>
          </el-tooltip>

          <el-tooltip content="Download" placement="top">
            <el-button
              circle
              text
              class="dd-action"
              :loading="downloadingDocId === document.id"
              @click="downloadFile(document)"
            >
              <Icon v-if="downloadingDocId !== document.id" icon="mdi:download-outline" />
            </el-button>
          </el-tooltip>

          <PermissionWrapper :permissions="permissions">
            <el-tooltip v-if="canDeleteDocument(document)" content="Delete" placement="top">
              <el-button
                circle
                text
                class="dd-action dd-action--danger"
                @click="removeDocument(document)"
              >
                <Icon icon="mdi:trash-can-outline" />
              </el-button>
            </el-tooltip>
          </PermissionWrapper>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="dd-empty">
      <div class="dd-empty-icon">
        <Icon icon="mdi:file-document-multiple-outline" />
      </div>
      <p class="dd-empty-title">No documents yet</p>
      <p class="dd-empty-hint">Attach reports, photos or supporting evidence.</p>
      <el-button type="primary" plain @click="handleAddDocument">
        <Icon icon="mdi:plus" class="dd-btn-icon" />
        Add Document
      </el-button>
    </div>
  </el-drawer>
</template>

<style scoped>
.document-drawer {
  --el-drawer-padding-primary: 0;
}

/* ---------- Header ---------- */
.dd-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 16px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dd-header-text {
  min-width: 0;
}

.dd-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dd-title-icon {
  width: 20px;
  height: 20px;
  color: var(--el-color-primary);
}

.dd-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dd-count {
  font-weight: 600;
}

.dd-subtitle {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dd-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.dd-close {
  font-size: 18px;
  color: var(--el-text-color-secondary);
}

.dd-btn-icon {
  margin-right: 4px;
}

/* ---------- List ---------- */
.dd-list {
  padding: 8px 12px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.dd-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  transition: background-color 0.15s ease;
}

.dd-item:hover {
  background-color: var(--el-fill-color-light);
}

.dd-item:hover .dd-actions {
  opacity: 1;
}

/* File-type icon tile */
.dd-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}

.dd-tile-icon {
  width: 22px;
  height: 22px;
}

.dd-tile--primary { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.dd-tile--success { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.dd-tile--warning { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.dd-tile--danger  { background: var(--el-color-danger-light-9);  color: var(--el-color-danger); }
.dd-tile--info,
.dd-tile--neutral { background: var(--el-fill-color); color: var(--el-text-color-secondary); }

.dd-item-body {
  flex: 1;
  min-width: 0;
}

.dd-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dd-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}

.dd-meta-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.dd-cat-row {
  margin-top: 4px;
}

.dd-cat-tag {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary);
}

/* ---------- Actions ---------- */
.dd-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0.55;
  transition: opacity 0.15s ease;
}

.dd-action {
  font-size: 17px;
  color: var(--el-text-color-secondary);
}

.dd-action:hover {
  color: var(--el-color-primary);
}

.dd-action--danger:hover {
  color: var(--el-color-danger);
}

.dd-actions .el-button + .el-button {
  margin-left: 2px;
}

/* ---------- Empty state ---------- */
.dd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 24px;
  text-align: center;
}

.dd-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-size: 36px;
  margin-bottom: 16px;
}

.dd-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 4px;
}

.dd-empty-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0 0 16px;
}

/* ---------- Scrollbar ---------- */
.dd-list::-webkit-scrollbar {
  width: 6px;
}

.dd-list::-webkit-scrollbar-track {
  background: transparent;
}

.dd-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.dd-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}
</style>
