<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { ElButton, ElCard, ElMessage, ElEmpty, ElTable, ElTableColumn, ElInput } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/modules/app'
import { getPublicSharedDocuments, downloadSharedDocument, downloadSharedDocumentsZip } from '@/api/settlements'

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
  category?: number
  document_type?: { id?: number; type?: string; group?: string }
  'document_type.id'?: number
  'document_type.type'?: string
  'document_type.group'?: string
}

const loading = ref(false)
const documents = ref<SharedDocument[]>([])
const shareFound = ref(true)
const shareError = ref<string | null>(null)
const expiresAt = ref<string | null>(null)
const downloadingDocId = ref<number | null>(null)
const downloadingAll = ref(false)
/** Client-side filter for the shared document list (name, format, raw date string). */
const shareListSearch = ref('')

/**
 * Same rules as DocumentsTagged `getRowDocumentTypeLabel` (repository API shape).
 * No categoryCounts / full doc list: resolve name from another row with same type id if needed.
 */
const getSharedDocumentTypeLabel = (row: SharedDocument): string => {
  const nested = row.document_type?.type
  if (nested) return String(nested)
  const flat = row['document_type.type']
  if (flat) return String(flat)
  const typeId = row['document_type.id'] ?? row.category
  if (typeId != null && String(typeId).trim() !== '') {
    const idStr = String(typeId)
    const peer = documents.value.find((d) => {
      if (d.id === row.id) return false
      const pid = d['document_type.id'] ?? d.category
      return pid != null && String(pid) === idStr && (d['document_type.type'] || d.document_type?.type)
    })
    const peerLabel = peer?.['document_type.type'] || peer?.document_type?.type
    if (peerLabel) return String(peerLabel)
    return `Type ${idStr}`
  }
  return '—'
}

const filteredShareDocuments = computed(() => {
  const q = shareListSearch.value.trim().toLowerCase()
  if (!q) return documents.value
  return documents.value.filter((doc) => {
    const name = (doc.name || '').toLowerCase()
    const fmt = (doc.format || '').toLowerCase()
    const created = String(doc.createdAt || '').toLowerCase()
    const typeLabel = getSharedDocumentTypeLabel(doc).toLowerCase()
    return name.includes(q) || fmt.includes(q) || created.includes(q) || typeLabel.includes(q)
  })
})

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

/** Document upload time for list UI (calendar date only). */
const formatUploadedDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
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

/** Icon type from API `document.format` only — never inferred from filename. */
const resolveFileType = (doc: Pick<SharedDocument, 'format'>): string => {
  return (doc.format || '').toLowerCase().replace(/^\./, '').trim()
}

/** File-type icons from DB `format` only (see DocumentsTagged.vue for the same switch shapes). */
const getFileIcon = (doc: Pick<SharedDocument, 'format'>) => {
  const fileType = resolveFileType(doc)
  if (!fileType) return 'material-symbols:description'

  switch (fileType) {
    case 'pdf':
      return 'vscode-icons:file-type-pdf2'
    case 'doc':
    case 'docx':
      return 'vscode-icons:file-type-word2'
    case 'csv':
    case 'xls':
    case 'xlsx':
    case 'xlsm':
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
    case 'webp':
    case 'tiff':
    case 'tif':
      return 'vscode-icons:file-type-image'
    case 'txt':
      return 'vscode-icons:file-type-text'
    case 'zip':
    case 'rar':
    case '7z':
      return 'vscode-icons:file-type-zip'
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return 'vscode-icons:file-type-video'
    case 'mp3':
    case 'wav':
    case 'flac':
      return 'vscode-icons:file-type-audio'
    case 'dwg':
    case 'dxf':
    case 'dgn':
      return 'vscode-icons:file-type-cad'
    case 'json':
    case 'geojson':
      return 'vscode-icons:file-type-json'
    case 'xml':
      return 'vscode-icons:file-type-xml'
    case 'html':
    case 'htm':
      return 'vscode-icons:file-type-html'
    case 'css':
      return 'vscode-icons:file-type-css'
    case 'js':
      return 'vscode-icons:file-type-js'
    case 'ts':
      return 'vscode-icons:file-type-typescript-official'
    case 'py':
      return 'vscode-icons:file-type-python'
    case 'java':
      return 'vscode-icons:file-type-java'
    case 'cpp':
    case 'c':
      return 'vscode-icons:file-type-cpp'
    case 'sql':
      return 'vscode-icons:file-type-sql'
    case 'md':
      return 'vscode-icons:file-type-markdown'
    case 'kml':
    case 'kmz':
      return 'material-symbols:map'
    default:
      return 'material-symbols:description'
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
    console.log('[SharedDocumentsPublic] API response (getPublicSharedDocuments):', response)
    if (response.code === '0000' && response.results) {
      const results: any = response.results
      documents.value = Array.isArray(results) ? results : (results.documents || [])
      expiresAt.value = Array.isArray(results) ? (results?.[0]?.expiresAt || null) : (results.expiresAt || null)
      console.log('[SharedDocumentsPublic] parsed documents:', documents.value, 'expiresAt:', expiresAt.value)
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
    downloadingDocId.value = document.id
    const token = route.params.token as string
    //ElMessage.info(`Downloading ${document.name}...`)
    
    const blob = await downloadSharedDocument(token, document.id)
    
    // Download name: extension from backend `format` only (strip any name suffix; do not trust it as type)
    let fileName = (document.name || '').trim()
    const fmt = (document.format || '').replace(/^\./, '').trim().toLowerCase()
    if (fmt) {
      const base = fileName.replace(/\.[^./\\]+$/i, '').trim()
      const stem = base || 'download'
      fileName = `${stem}.${fmt}`
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
    downloadingDocId.value = null
    return true
  } catch (error: any) {
    console.error('Error downloading file:', error)
    downloadingDocId.value = null
    
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

const parseBlobErrorMessage = async (blob: Blob): Promise<string> => {
  try {
    const text = await blob.text()
    const j = JSON.parse(text) as { message?: string }
    return j.message || text || 'Download failed'
  } catch {
    return 'Download failed'
  }
}

const downloadAll = async () => {
  const list = filteredShareDocuments.value
  if (list.length === 0) {
    ElMessage.warning('No documents to download')
    return
  }

  const token = route.params.token as string
  downloadingAll.value = true

  try {
    const blob = await downloadSharedDocumentsZip(
      token,
      list.map((d) => d.id)
    )

    const zipName =
      list.length === 1
        ? `${(list[0].name || 'document').replace(/[/\\]/g, '_').replace(/\.[^.]+$/, '') || 'document'}.zip`
        : `shared-documents-${list.length}-files.zip`

    const url = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.setAttribute('download', zipName)
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success(`Download started (${list.length} file${list.length === 1 ? '' : 's'} in zip)`)
  } catch (error: any) {
    console.error('Error downloading zip:', error)
    try {
      ;(ElMessage as any).closeAll && (ElMessage as any).closeAll()
    } catch {}

    let errorMessage = 'Failed to download zip'

    if (error?.response && typeof error.response.status === 'number') {
      const status = error.response.status
      const data = error.response.data

      if (data instanceof Blob) {
        errorMessage = await parseBlobErrorMessage(data)
      } else if (data?.message) {
        errorMessage = data.message
      } else if (status === 404) {
        errorMessage = 'Share or file not found'
      } else if (status === 410) {
        errorMessage = 'This share link has expired'
      } else if (status === 403) {
        errorMessage = 'You do not have permission to download these files'
      } else if (status === 400) {
        errorMessage = 'Invalid download request'
      } else if (status === 500) {
        errorMessage = 'Server error while building the zip. Try again later.'
      }
    } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
      errorMessage = 'Network error. Please check your connection and try again.'
    } else if (error?.message) {
      errorMessage = error.message
    }

    ElMessage.error({ message: errorMessage, duration: 6000, showClose: true })
  } finally {
    downloadingAll.value = false
  }
}

const formatExpiryShort = (dateString: string) => {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(dateString)
  )
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchSharedDocuments()
})
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 px-2 sm:px-6 overflow-y-auto min-h-screen">
    <Transition name="fade">
      <el-card 
        v-loading="loading" 
        class="container mx-auto my-3 sm:my-8 p-2 sm:p-6 max-w-full sm:max-w-6xl shared-public-card"
      >
        <template #header>
          <!-- Mobile: minimal header + download all -->
          <div v-if="isMobile" class="shared-public-header-mobile -mx-1">
            <div class="flex items-center gap-2">
              <el-button circle text type="primary" @click="goBack" aria-label="Go back">
                <Icon icon="material-symbols:arrow-back" width="22" />
              </el-button>
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate flex-1 min-w-0">
                Shared documents
              </span>
            </div>
            <el-button
              v-if="shareFound && documents.length > 0"
              type="primary"
              plain
              class="w-full mt-3 share-plain-primary-btn"
              size="large"
              :loading="downloadingAll"
              :disabled="isExpired || !!downloadingDocId || filteredShareDocuments.length === 0"
              @click="downloadAll"
            >
              <Icon
                v-if="!downloadingAll"
                icon="material-symbols:download"
                width="20"
                class="inline-block align-text-bottom mr-1"
              />
              Download all ({{ filteredShareDocuments.length }})
            </el-button>
            <p
              v-if="shareFound && documents.length > 0 && expiresAt"
              class="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-snug"
            >
              <span v-if="isExpired" class="text-red-600 dark:text-red-400">This link has expired.</span>
              <span v-else>Valid until {{ formatExpiryShort(expiresAt) }}</span>
            </p>
          </div>
          <!-- Desktop: full header -->
          <div v-else class="flex flex-row items-center justify-between gap-4">
            <div class="flex items-center space-x-4 min-w-0">
              <img src="/gok.png" alt="Logo" class="w-12 h-12 shrink-0" />
              <h2 class="text-2xl font-bold truncate">
                KesMIS — Shared Documents
              </h2>
            </div>
            <el-button type="primary" plain @click="goBack">
              <Icon icon="material-symbols:arrow-back" width="18" class="inline-block align-text-bottom mr-1" />
              Back
            </el-button>
          </div>
        </template>

        <div v-if="shareFound && documents.length > 0">
          <!-- Document info: desktop only — single compact row (mobile uses header) -->
          <div
            v-if="!isMobile"
            class="share-info-row mt-4 mb-4 flex flex-nowrap items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm overflow-x-auto"
          >
            <span class="share-info-row__heading shrink-0 font-semibold text-gray-800 dark:text-gray-100 pr-3 border-r border-gray-200">
              Share information
            </span>
            <span class="shrink-0 whitespace-nowrap">
              <span class="text-gray-500 dark:text-gray-400">Documents</span>
              {{ ' ' }}{{ documents.length }} file(s)
            </span>
            <span v-if="expiresAt" class="shrink-0 min-w-0 max-w-[min(100%,20rem)] sm:max-w-[28rem] truncate" :title="formatDate(expiresAt)">
              <span class="text-gray-500 dark:text-gray-400">Expires</span>
              {{ ' ' }}{{ formatDate(expiresAt) }}
              <el-tag type="danger" size="small" v-if="isExpired" class="ml-1 align-middle">Expired</el-tag>
            </span>
            <span class="shrink-0 whitespace-nowrap">
              <span class="text-gray-500 dark:text-gray-400">Total size</span>
              {{ ' ' }}{{ formatFileSize(documents.reduce((sum, doc) => sum + (Number(doc.size) || 0), 0)) }}
            </span>
            <span class="shrink-0 ml-auto pl-2">
              <el-button
                type="primary"
                plain
                :loading="downloadingAll"
                :disabled="isExpired || !!downloadingDocId || filteredShareDocuments.length === 0"
                @click="downloadAll"
                class="share-plain-primary-btn"
              >
                <Icon
                  v-if="!downloadingAll"
                  icon="material-symbols:download"
                  width="18"
                  class="inline-block align-text-bottom mr-1"
                />
                Download all ({{ filteredShareDocuments.length }})
              </el-button>
            </span>
          </div>

          <!-- Documents Table -->
          <div :class="isMobile ? 'mt-2' : 'mt-6'">
            <div class="share-doc-search flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <el-input
                v-model="shareListSearch"
                clearable
                placeholder="Search files by name, type, or date…"
                class="flex-1"
              >
                <template #prefix>
                  <Icon icon="material-symbols:search" width="18" class="text-gray-400" />
                </template>
              </el-input>
              <span
                v-if="shareListSearch.trim()"
                class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"
              >
                {{ filteredShareDocuments.length }} / {{ documents.length }} shown
              </span>
            </div>

            <h3 v-if="!isMobile && filteredShareDocuments.length > 0" class="text-lg font-semibold mb-4">Documents</h3>

            <el-empty
              v-if="filteredShareDocuments.length === 0 && shareListSearch.trim()"
              description="No documents match your search"
              class="py-6"
            >
              <el-button type="primary" plain size="small" @click="shareListSearch = ''">Clear search</el-button>
            </el-empty>
            
            <!-- Mobile View: Card Layout -->
            <div
              v-else-if="isMobile"
              class="space-y-3 max-h-[calc(100vh-220px)] min-h-[120px] overflow-y-auto -mx-1 px-1"
            >
              <div
                v-for="doc in filteredShareDocuments"
                :key="doc.id"
                class="document-card bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 pt-1">
                    <Icon :icon="getFileIcon(doc)" width="32" class="flex-shrink-0 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-2 break-words">
                      {{ doc.name }}
                    </h4>
                    <div class="flex flex-col space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>Type: {{ getSharedDocumentTypeLabel(doc) }}</span>
                      <span>Size: {{ formatFileSize(doc.size) }}</span>
                      <span>Uploaded: {{ formatUploadedDate(doc.createdAt) }}</span>
                    </div>
                    <el-button
                      type="primary"
                      plain
                      size="small"
                      :loading="downloadingDocId === doc.id"
                      :disabled="downloadingDocId === doc.id || downloadingAll || isExpired"
                      @click="handleDownload(doc)"
                      class="mt-3 w-full share-plain-primary-btn"
                    >
                      <Icon
                        v-if="downloadingDocId !== doc.id"
                        icon="material-symbols:download"
                        width="16"
                        class="inline-block align-text-bottom mr-1"
                      />
                      <span v-if="downloadingDocId === doc.id">Downloading…</span>
                      <span v-else>Download</span>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Desktop View: Table Layout -->
            <div v-else-if="!isMobile" class="documents-table-wrapper">
              <el-table
                :data="filteredShareDocuments"
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
                    <Icon :icon="getFileIcon(row)" width="24" class="flex-shrink-0 text-gray-700 dark:text-gray-200" />
                    <span class="font-medium text-gray-900 dark:text-white">{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="Type" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-gray-600 dark:text-gray-400">{{ getSharedDocumentTypeLabel(row) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="Size" width="120" align="center">
                <template #default="{ row }">
                  <span class="text-gray-600 dark:text-gray-400">{{ formatFileSize(row.size) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="Uploaded" width="120" align="center">
                <template #default="{ row }">
                  <span class="text-gray-600 dark:text-gray-400">{{ formatUploadedDate(row.createdAt) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="Actions" width="140" align="center">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    :loading="downloadingDocId === row.id"
                    :disabled="downloadingDocId === row.id || downloadingAll || isExpired"
                    @click="handleDownload(row)"
                    class="share-plain-primary-btn"
                  >
                    <Icon
                      v-if="downloadingDocId !== row.id"
                      icon="material-symbols:download"
                      width="16"
                      class="inline-block align-text-bottom mr-1"
                    />
                    <span v-if="downloadingDocId === row.id">Downloading…</span>
                    <span v-else>Download</span>
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
          <el-button type="primary" plain @click="goBack">
            <Icon icon="material-symbols:arrow-back" width="18" class="inline-block align-text-bottom mr-1" />
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

@media (min-width: 640px) {
  .document-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

/* Tighter card chrome on small screens */
@media (max-width: 639px) {
  .shared-public-card :deep(.el-card__header) {
    padding: 10px 10px 8px;
  }
  .shared-public-card :deep(.el-card__body) {
    padding: 10px;
  }
}

/* Share info toolbar: simple clear outline on dark backgrounds */
html.dark .share-info-row {
  background-color: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.55);
}

html.dark .share-info-row .share-info-row__heading {
  border-right-color: rgba(255, 255, 255, 0.4);
}

/* Primary plain buttons: white outline + text in dark mode (cards / dark UI) */
html.dark .share-plain-primary-btn.el-button.is-plain.el-button--primary {
  --el-button-text-color: #ffffff;
  --el-button-bg-color: transparent;
  --el-button-border-color: rgba(255, 255, 255, 0.88);
  --el-button-outline-color: rgba(255, 255, 255, 0.45);
  --el-button-hover-text-color: #ffffff;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.12);
  --el-button-hover-border-color: #ffffff;
  --el-button-active-text-color: #ffffff;
  --el-button-active-bg-color: rgba(255, 255, 255, 0.18);
  --el-button-active-border-color: #ffffff;
}

html.dark .share-plain-primary-btn.el-button.is-plain.el-button--primary.is-disabled,
html.dark .share-plain-primary-btn.el-button.is-plain.el-button--primary.is-disabled:hover {
  --el-button-disabled-text-color: rgba(255, 255, 255, 0.42);
  --el-button-disabled-bg-color: transparent;
  --el-button-disabled-border-color: rgba(255, 255, 255, 0.28);
}

html.dark .share-plain-primary-btn.el-button.is-plain.el-button--primary :deep(.el-icon),
html.dark .share-plain-primary-btn.el-button.is-plain.el-button--primary :deep(svg) {
  color: #ffffff;
}

.documents-table-wrapper {
  width: 100%;
}

.documents-table {
  width: 100%;
}

/* No row hover highlight (keep stripe colors; EP uses hover-row + hover-cell too) */
.documents-table :deep(.el-table__body tr:hover > td.el-table__cell),
.documents-table :deep(.el-table__body tr.hover-row > td.el-table__cell) {
  background-color: var(--el-fill-color-blank) !important;
}

.documents-table :deep(.el-table__body tr.el-table__row--striped:hover > td.el-table__cell),
.documents-table :deep(.el-table__body tr.el-table__row--striped.hover-row > td.el-table__cell) {
  background-color: var(--el-fill-color-lighter) !important;
}

.documents-table :deep(.el-table__body tr > td.hover-cell) {
  background-color: var(--el-fill-color-blank) !important;
}

.documents-table :deep(.el-table__body tr.el-table__row--striped > td.hover-cell) {
  background-color: var(--el-fill-color-lighter) !important;
}

.documents-table :deep(.el-table__body td.el-table__cell) {
  transition: none;
}

.documents-table :deep(.el-table__header) {
  background-color: #fafafa;
}

</style>

