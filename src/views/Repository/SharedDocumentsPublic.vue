<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { ElButton, ElCard, ElMessage, ElEmpty, ElTable, ElTableColumn, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { Download, Back } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/modules/app'
import { getPublicSharedDocuments, downloadSharedDocument } from '@/api/settlements'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const isMobile = computed(() => appStore.getMobile)

interface SharedDocument {
  id: number
  name: string
  size: number
  createdAt: string
  format?: string
}

const loading = ref(false)
const documents = ref<SharedDocument[]>([])
const shareFound = ref(true)
const shareError = ref<string | null>(null)
const expiresAt = ref<string | null>(null)

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

const formatFileSize = (size: number | string | null | undefined) => {
  const numSize = Number(size) || 0
  if (!numSize || isNaN(numSize)) return 'N/A'
  
  // Sizes are already in MB from the backend
  if (numSize < 0.01) {
    // Less than 0.01 MB, show in KB
    return `${(numSize * 1024).toFixed(1)} KB`
  } else if (numSize < 1) {
    // Less than 1 MB, show with 2 decimals
    return `${numSize.toFixed(2)} MB`
  } else {
    // 1 MB or more, show with 2 decimals
    return `${numSize.toFixed(2)} MB`
  }
}

const isExpired = computed(() => {
  if (!expiresAt.value) return false
  return new Date(expiresAt.value).getTime() < Date.now()
})

const getFileIcon = (name: string) => {
  if (!name) return 'vscode-icons:file-type-document'
  const ext = name.split('.').pop()?.toLowerCase() || ''
  
  switch (ext) {
    case 'pdf':
      return 'vscode-icons:file-type-pdf2'
    case 'doc':
    case 'docx':
      return 'vscode-icons:file-type-word2'
    case 'xls':
    case 'xlsx':
      return 'vscode-icons:file-type-excel2'
    case 'ppt':
    case 'pptx':
      return 'vscode-icons:file-type-powerpoint2'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'vscode-icons:file-type-image'
    case 'txt':
      return 'vscode-icons:file-type-text'
    case 'zip':
    case 'rar':
    case '7z':
      return 'vscode-icons:file-type-zip'
    default:
      return 'vscode-icons:file-type-document'
  }
}

const fetchSharedDocuments = async () => {
  try {
    loading.value = true
    shareError.value = null
    const token = route.params.token as string
    
    if (!token) {
      shareFound.value = false
      shareError.value = 'Invalid share link'
      return
    }

    const response = await getPublicSharedDocuments(token)
    
    if (response.code === '0000' && response.results) {
      const results: any = response.results
      documents.value = Array.isArray(results) ? results : (results.documents || [])
      expiresAt.value = Array.isArray(results) ? (results?.[0]?.expiresAt || null) : (results.expiresAt || null)
      shareFound.value = documents.value.length > 0
      if (documents.value.length === 0) {
        shareError.value = 'No documents found in this share'
      }
    } else {
      shareFound.value = false
      shareError.value = 'Failed to load shared documents'
    }
  } catch (error: any) {
    console.error('Error fetching shared documents:', error)
    shareFound.value = false
    
    if (error.message.includes('expired')) {
      shareError.value = 'This share link has expired'
    } else if (error.message.includes('not found')) {
      shareError.value = 'Share link not found or invalid'
    } else {
      shareError.value = error.message || 'Failed to load shared documents'
    }
    
    if (shareError.value) {
      ElMessage.error(shareError.value)
    }
  } finally {
    loading.value = false
  }
}

const handleDownload = async (document: SharedDocument): Promise<boolean> => {
  try {
    const token = route.params.token as string
    //ElMessage.info(`Downloading ${document.name}...`)
    
    const blob = await downloadSharedDocument(token, document.id)
    
    // Extract file extension from name or use format
    let fileName = document.name
    if (!fileName.includes('.')) {
      const ext = document.format || 'pdf'
      fileName = `${fileName}.${ext}`
    }
    
    const url = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success(`Download completed: ${fileName}`)
    return true
  } catch (error: any) {
    console.error('Error downloading file:', error)
    
    // Close any existing messages so the error is visible
    try { (ElMessage as any).closeAll && (ElMessage as any).closeAll() } catch {}
    
    // Provide more specific error messages
    let errorMessage = 'Failed to download file'
    
    // Check if it's an Axios error with response
    if (error?.response && typeof error.response.status === 'number') {
      const status = error.response.status
      
      if (status === 404) {
        errorMessage = `File "${document.name}" not found or has been deleted`
      } else if (status === 410) {
        errorMessage = 'This share link has expired'
      } else if (status === 403) {
        errorMessage = 'You do not have permission to download this file'
      } else if (status === 500) {
        errorMessage = 'Server error occurred while downloading the file. Please try again later.'
      } else if (status === 400) {
        errorMessage = 'Invalid request. Please check the share link.'
      } else {
        // Handle Blob error responses (when responseType is 'blob' but server returns error)
        if (error.response.data instanceof Blob) {
          errorMessage = `Download failed (Error ${status}: ${error.response.statusText || 'Unknown error'})`
        } else {
          errorMessage = error.response.data?.message || error.response.statusText || `Download failed (Error ${status})`
        }
      }
    } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
      errorMessage = 'Network error. Please check your connection and try again.'
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    ElMessage.error({ message: errorMessage, duration: 6000, showClose: true })
    return false
  }
}

const downloadAll = async () => {
  if (documents.value.length === 0) {
    ElMessage.warning('No documents to download')
    return
  }

  ElMessage.info(`Starting batch download of ${documents.value.length} document(s)...`)
  
  let successCount = 0
  let failCount = 0
  
  for (const doc of documents.value) {
    const success = await handleDownload(doc)
    if (success) {
      successCount++
    } else {
      failCount++
    }
    // Small delay between downloads to prevent browser blocking
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  if (failCount === 0) {
    ElMessage.success(`Batch download completed: ${successCount} document(s)`)
  } else {
    ElMessage.warning(`Batch download completed: ${successCount} succeeded, ${failCount} failed`)
  }
}

const goBack = () => {
  router.back()
}

const columns = ref(1)
const descriptionDirection = ref<'horizontal' | 'vertical'>('horizontal')

const updateColumns = () => {
  columns.value = window.innerWidth >= 640 ? 2 : 1
  descriptionDirection.value = window.innerWidth >= 640 ? 'horizontal' : 'vertical'
}

onMounted(() => {
  fetchSharedDocuments()
  updateColumns()
  window.addEventListener('resize', updateColumns)
})
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 px-4 sm:px-6 overflow-y-auto min-h-screen">
    <Transition name="fade">
      <el-card 
        v-loading="loading" 
        class="container mx-auto my-6 sm:my-8 p-4 sm:p-6 max-w-full sm:max-w-6xl"
      >
        <template #header>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div class="flex items-center space-x-4">
              <img src="/gok.png" alt="Logo" class="w-10 h-10 sm:w-12 sm:h-12" />
              <h2 class="text-xl sm:text-2xl font-bold">
                KesMIS -  Shared Documents
              </h2>
            </div>
            <el-button type="primary" plain :icon="Back" @click="goBack" class="w-full sm:w-auto">
              Back
            </el-button>
          </div>
        </template>

        <div v-if="shareFound && documents.length > 0">
          <!-- Document Info Summary -->
          <el-descriptions
            title="Share Information"
            :column="columns"
            border
            :direction="descriptionDirection"
            class="mt-6 mb-6"
          >
            <el-descriptions-item label="Total Documents" :span="2">
              {{ documents.length }} file(s)
            </el-descriptions-item>
            <el-descriptions-item label="Expires" :span="2" v-if="expiresAt">
              <span>
                {{ formatDate(expiresAt) }}
                <el-tag type="danger" size="small" v-if="isExpired" style="margin-left: 6px;">Expired</el-tag>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="Total Size" :span="2">
              {{ formatFileSize(documents.reduce((sum, doc) => sum + (Number(doc.size) || 0), 0)) }}
            </el-descriptions-item>
            <el-descriptions-item label="Actions" :span="2">
              <div class="flex flex-wrap gap-2">
                <el-button
                  type="primary"
                  plain
                  :icon="Download"
                  @click="downloadAll"
                  class="w-full sm:w-auto"
                >
                  Download All ({{ documents.length }})
                </el-button>
              </div>
            </el-descriptions-item>
          </el-descriptions>

          <!-- Documents Table -->
          <div class="mt-6">
            <h3 class="text-lg font-semibold mb-4">Documents</h3>
            
            <!-- Mobile View: Card Layout -->
            <div v-if="isMobile" class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div
                v-for="doc in documents"
                :key="doc.id"
                class="document-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 pt-1">
                    <Icon :icon="getFileIcon(doc.name)" width="32" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-2 break-words">
                      {{ doc.name }}
                    </h4>
                    <div class="flex flex-col space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>Size: {{ formatFileSize(doc.size) }}</span>
                      <span>Date: {{ formatDate(doc.createdAt) }}</span>
                    </div>
                    <el-button
                      type="primary"
                      plain
                      size="small"
                      :icon="Download"
                      @click="handleDownload(doc)"
                      class="mt-3 w-full"
                    >
                      Download
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Desktop View: Table Layout -->
            <div v-else class="documents-table-wrapper">
              <el-table
                :data="documents"
                style="width: 100%"
                border
                stripe
                class="documents-table"
                max-height="500"
              >
              <el-table-column label="#" type="index" width="60" align="center" />
              
              <el-table-column label="File" min-width="300">
                <template #default="{ row }">
                  <div class="flex items-center space-x-3">
                    <Icon :icon="getFileIcon(row.name)" width="24" class="flex-shrink-0" />
                    <span class="font-medium text-gray-900 dark:text-white">{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="Size" width="120" align="center">
                <template #default="{ row }">
                  <span class="text-gray-600 dark:text-gray-400">{{ formatFileSize(row.size) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="Date" width="180">
                <template #default="{ row }">
                  <span class="text-gray-600 dark:text-gray-400">{{ formatDate(row.createdAt) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="Actions" width="140" align="center">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    :icon="Download"
                    @click="handleDownload(row)"
                  >
                    Download
                  </el-button>
                </template>
              </el-table-column>
              </el-table>
            </div>
          </div>
        </div>

        <!-- Error States -->
        <el-empty
          v-else-if="!loading"
          :description="shareError || 'No documents found in this share'"
          class="mt-6"
        >
          <el-button type="primary" plain :icon="Back" @click="goBack">
            Go Back
          </el-button>
        </el-empty>
      </el-card>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.document-card {
  transition: all 0.3s ease;
}

.document-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.documents-table-wrapper {
  width: 100%;
}

.documents-table {
  width: 100%;
}

.documents-table :deep(.el-table__body tr:hover > td) {
  background-color: #f5f7fa !important;
}

.documents-table :deep(.el-table__header) {
  background-color: #fafafa;
}

.documents-table :deep(.el-table__row) {
  transition: background-color 0.2s ease;
}

.el-descriptions :deep(.el-descriptions__header) {
  @apply text-2xl font-semibold mb-4 text-gray-900 dark:text-white;
}

.el-descriptions :deep(.el-descriptions__body) {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md;
}

.el-descriptions :deep(.el-descriptions__label) {
  @apply font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700;
}

.el-descriptions :deep(.el-descriptions__content) {
  @apply text-gray-900 dark:text-white;
}

@media (max-width: 640px) {
  .el-descriptions {
    @apply block;
  }
  .el-descriptions :deep(.el-descriptions__body) {
    @apply flex flex-col;
  }
  .el-descriptions :deep(.el-descriptions__label),
  .el-descriptions :deep(.el-descriptions__content) {
    @apply w-full;
  }
}
</style>

