<template>
  <div class="drsp-page">
    <el-card v-loading="loading" class="drsp-card">
      <template #header>
        <div class="drsp-header">
          <img src="/gok.png" alt="Logo" class="drsp-logo" @error="(e: any) => (e.target.style.display = 'none')" />
          <div>
            <h2 class="drsp-title">KeSMIS — Data Request Documents</h2>
            <p class="drsp-sub">Kenya Slum Information Management System</p>
          </div>
        </div>
      </template>

      <!-- Expired / not found -->
      <el-empty v-if="!loading && error" :description="error" :image-size="80">
        <template #image>
          <Icon icon="mdi:link-off" width="80" style="color: var(--el-color-danger)" />
        </template>
      </el-empty>

      <!-- Documents -->
      <div v-else-if="!loading && documents.length">
        <el-alert
          v-if="expiresAt"
          :type="isExpired ? 'error' : 'info'"
          :closable="false"
          show-icon
          style="margin-bottom:16px"
        >
          <template #default>
            <span v-if="isExpired">This download link has expired.</span>
            <span v-else>Link valid until {{ formatDate(expiresAt) }}</span>
          </template>
        </el-alert>

        <div class="doc-list">
          <div v-for="doc in documents" :key="doc.id" class="doc-item">
            <Icon :icon="fileIcon(doc.format)" width="28" class="doc-icon" />
            <div class="doc-meta">
              <span class="doc-name">{{ doc.name }}</span>
              <span class="doc-size">{{ fmtSize(doc.size) }}</span>
            </div>
            <el-button
              type="primary"
              plain
              size="small"
              :loading="downloadingId === doc.id"
              :disabled="isExpired || !!downloadingId"
              @click="downloadDoc(doc)"
            >
              <Icon v-if="downloadingId !== doc.id" icon="mdi:download" width="16" style="margin-right:4px" />
              {{ downloadingId === doc.id ? 'Downloading…' : 'Download' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElCard, ElEmpty, ElAlert, ElButton, ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import axios from 'axios'

const route = useRoute()
const base = import.meta.env.VITE_APP_HOST || ''

const loading = ref(true)
const error = ref('')
const documents = ref<any[]>([])
const expiresAt = ref<string | null>(null)
const downloadingId = ref<number | null>(null)

const isExpired = computed(() =>
  expiresAt.value ? new Date(expiresAt.value).getTime() < Date.now() : false
)

const fetchShare = async () => {
  const token = route.params.token as string
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`${base}/api/public/data-request/share/${token}`)
    if (res.data.code === '0000') {
      documents.value = res.data.results?.documents || []
      expiresAt.value = res.data.results?.expiresAt || null
    } else {
      error.value = res.data.message || 'Could not load documents'
    }
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 410) error.value = 'This download link has expired.'
    else if (status === 404) error.value = 'Share link not found or invalid.'
    else error.value = 'Failed to load documents. Please try again.'
  } finally {
    loading.value = false
  }
}

const downloadDoc = async (doc: any) => {
  const token = route.params.token as string
  downloadingId.value = doc.id
  try {
    const res = await axios.get(
      `${base}/api/public/data-request/share/${token}/download/${doc.id}`,
      { responseType: 'blob' }
    )
    const fmt = (doc.format || '').replace(/^\./, '').toLowerCase()
    const stem = (doc.name || 'document').replace(/\.[^.]+$/, '')
    const fileName = fmt ? `${stem}.${fmt}` : doc.name || 'document'
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 410) ElMessage.error('Link expired')
    else if (status === 404) ElMessage.error('File not found')
    else ElMessage.error('Download failed')
  } finally {
    downloadingId.value = null
  }
}

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

const fmtSize = (size: number | null | undefined) => {
  const n = Number(size) || 0
  if (!n) return ''
  if (n < 0.01) return `${(n * 1024).toFixed(1)} KB`
  return `${n.toFixed(2)} MB`
}

const fileIcon = (format: string | undefined) => {
  const f = (format || '').replace(/^\./, '').toLowerCase()
  if (f === 'pdf') return 'vscode-icons:file-type-pdf2'
  if (f === 'zip' || f === 'rar' || f === '7z') return 'vscode-icons:file-type-zip'
  if (f === 'doc' || f === 'docx') return 'vscode-icons:file-type-word2'
  if (f === 'xls' || f === 'xlsx' || f === 'csv') return 'vscode-icons:file-type-excel2'
  if (f === 'geojson' || f === 'kml' || f === 'kmz') return 'material-symbols:map'
  return 'material-symbols:description'
}

onMounted(fetchShare)
</script>

<style scoped>
.drsp-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
}

.drsp-card {
  width: 100%;
  max-width: 700px;
}

.drsp-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.drsp-logo {
  height: 56px;
  flex-shrink: 0;
}

.drsp-title {
  margin: 0 0 2px;
  font-size: 1.1rem;
  font-weight: 700;
}

.drsp-sub {
  margin: 0;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: #fff;
}

.doc-icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.doc-meta {
  flex: 1;
  min-width: 0;
}

.doc-name {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-size {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}
</style>
