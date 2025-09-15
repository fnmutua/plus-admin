<script setup>
import { ref, computed, watch } from 'vue'
import {
  ElDrawer, ElButton, ElCard, ElInput, ElEmpty, ElSkeleton, ElTag, ElSpace,
  ElPopconfirm, ElTooltip, ElMessage, ElMessageBox, ElIcon
} from 'element-plus'
import { Icon } from '@iconify/vue'
import { getFile } from '@/api/summary'
import { deleteDocument } from '@/api/settlements'
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

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size'
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

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

// Watch for visibility changes
watch(() => props.visible, (newVal) => {
  // Reset any state when drawer opens
})
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

    <!-- Header with Close Button and Add Button -->
    <div class="drawer-header">
      <el-button 
        type="primary" 
        @click="handleAddDocument"
        class="add-button"
      >
        <Icon icon="mdi:plus" />
        Add Document
      </el-button>
      <el-button 
        type="text" 
        @click="handleClose"
        class="close-button"
      >
        <Icon icon="mdi:close" />
      </el-button>
    </div>

    <!-- Documents List -->
    <div v-if="localDocuments.length > 0" class="documents-list">
      <div 
        v-for="(document, index) in localDocuments" 
        :key="document.id || index"
        class="document-item"
      >
        <div class="document-info">
          <Icon :icon="getFileIcon(document.name)" class="file-icon" />
          <span class="document-name">{{ document.name }}</span>
        </div>
        
        <div class="document-actions">
          <el-tooltip content="View" placement="top">
            <el-button 
              size="small"
              :loading="viewingDocId === document.id"
              @click="viewDocument(document)"
              class="action-button"
            >
              <Icon v-if="viewingDocId !== document.id" icon="mdi:eye" />
            </el-button>
          </el-tooltip>
          
          <el-tooltip content="Download" placement="top">
            <el-button 
              size="small"
              :loading="downloadingDocId === document.id"
              @click="downloadFile(document)"
              class="action-button"
            >
              <Icon v-if="downloadingDocId !== document.id" icon="mdi:download" />
            </el-button>
          </el-tooltip>
          
          <PermissionWrapper :permissions="permissions">
            <el-tooltip v-if="canDeleteDocument(document)" content="Delete" placement="top">
              <el-button 
                size="small"
                type="danger"
                class="action-button"
                @click="removeDocument(document)"
              >
                <Icon icon="mdi:delete" />
              </el-button>
            </el-tooltip>
          </PermissionWrapper>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-container">
      <el-empty 
        :image-size="120"
        description="No documents found"
      >
        <template #image>
          <Icon icon="mdi:folder-open" :size="120" color="#c0c4cc" />
        </template>
        
        <template #description>
          <p>No documents found</p>
        </template>
      </el-empty>
    </div>
  </el-drawer>
</template>

<style scoped>
.document-drawer {
  --el-drawer-padding-primary: 0;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.add-button {
  flex: 1;
  margin-right: 12px;
}

.close-button {
  padding: 8px;
  flex-shrink: 0;
}


.documents-list {
  padding: 0;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.document-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.2s ease;
}

.document-item:hover {
  background-color: var(--el-fill-color-light);
}

.document-item:last-child {
  border-bottom: none;
}

.document-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  color: var(--el-color-primary);
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.document-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-button {
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: scale(1.05);
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 20px;
}

/* Custom scrollbar */
.documents-list::-webkit-scrollbar {
  width: 6px;
}

.documents-list::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

.documents-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.documents-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}
</style>
