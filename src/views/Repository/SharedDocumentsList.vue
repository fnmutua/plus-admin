<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElButton, ElCard, ElTable, ElTableColumn, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { Refresh, Delete } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { getDocumentShares, revokeDocumentShare, unrevokeDocumentShare } from '@/api/settlements'

interface DocumentShare {
  id: number
  token: string
  email: string | null
  message: string | null
  expiresAt: string | null
  isRevoked: boolean
  createdAt: string
  createdBy: number
  creator: {
    id: number
    name: string
    email: string
  } | null
  documentCount: number
  documents: string[]
}

const loading = ref(false)
const shares = ref<DocumentShare[]>([])

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

const isExpired = (expiresAt: string | null) => {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

const isExpiringSoon = (expiresAt: string | null) => {
  if (!expiresAt) return false
  const expiryDate = new Date(expiresAt).getTime()
  const now = Date.now()
  const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60)
  return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24 // Within 24 hours
}

const fetchShares = async () => {
  try {
    loading.value = true
    const response = await getDocumentShares()
    
    if (response.code === '0000') {
      // Handle both 'data' and 'results' property
      const sharesData = (response as any).data || (response as any).results
      shares.value = Array.isArray(sharesData) ? sharesData : []
    } else {
      ElMessage.error('Failed to load document shares')
      shares.value = []
    }
  } catch (error: any) {
    console.error('Error fetching shares:', error)
    ElMessage.error(error.message || 'Failed to load document shares')
    shares.value = []
  } finally {
    loading.value = false
  }
}

const handleRevoke = async (share: DocumentShare) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to revoke this share? The link will no longer be accessible.`,
      'Revoke Share',
      {
        confirmButtonText: 'Revoke',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    loading.value = true
    const response = await revokeDocumentShare(share.id)
    
    if (response.code === '0000') {
      ElMessage.success('Share revoked successfully')
      await fetchShares() // Refresh the list
    } else {
      ElMessage.error(response.message || 'Failed to revoke share')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Error revoking share:', error)
      ElMessage.error(error.message || 'Failed to revoke share')
    }
  } finally {
    loading.value = false
  }
}

const handleUnrevoke = async (share: DocumentShare) => {
  try {
    await ElMessageBox.confirm(
      `Unrevoke this share? The link will become accessible again.`,
      'Unrevoke Share',
      {
        confirmButtonText: 'Unrevoke',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    )

    loading.value = true
    const response = await unrevokeDocumentShare(share.id)
    
    if (response.code === '0000') {
      ElMessage.success('Share unrevoked successfully')
      await fetchShares()
    } else {
      ElMessage.error(response.message || 'Failed to unrevoke share')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Error unrevoking share:', error)
      ElMessage.error(error.message || 'Failed to unrevoke share')
    }
  } finally {
    loading.value = false
  }
}
const copyShareLink = async (share: DocumentShare) => {
  try {
    const serverUrl = window.location.origin
    const shareUrl = `${serverUrl}/#/share/${share.token}`
    await navigator.clipboard.writeText(shareUrl)
    ElMessage.success('Share link copied to clipboard')
  } catch (error) {
    ElMessage.error('Failed to copy link')
  }
}

onMounted(() => {
  fetchShares()
})
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 style="margin: 0;">Document Shares</h3>
        <el-button 
          type="primary" 
          :icon="Refresh" 
          @click="fetchShares"
          :loading="loading"
        >
          Refresh
        </el-button>
      </div>
    </template>

    <el-table 
      :data="shares" 
      style="width: 100%" 
      border
      stripe
      v-loading="loading"
    >
      <el-table-column label="#" type="index" width="60" align="center" />
      
      <el-table-column label="Shared By" min-width="150">
        <template #default="{ row }">
          <span>{{ row.creator?.name || 'Unknown' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Documents" min-width="200">
        <template #default="{ row }">
          <div>
            <el-tag size="small" type="info">{{ row.documentCount }} file(s)</el-tag>
            <div v-if="row.documents.length > 0" class="mt-1 text-xs text-gray-500">
              {{ row.documents.slice(0, 2).join(', ') }}{{ row.documents.length > 2 ? '...' : '' }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Recipients" min-width="150">
        <template #default="{ row }">
          <span v-if="row.email">{{ row.email }}</span>
          <span v-else class="text-gray-400">Public link</span>
        </template>
      </el-table-column>

      <el-table-column label="Shared On" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>

      <el-table-column label="Expires" width="180">
        <template #default="{ row }">
          <div>
            <span v-if="row.expiresAt">{{ formatDate(row.expiresAt) }}</span>
            <span v-else class="text-gray-400">Never</span>
            <div class="mt-1">
              <el-tag 
                v-if="isExpired(row.expiresAt)" 
                size="small" 
                type="danger"
              >
                Expired
              </el-tag>
              <el-tag 
                v-else-if="isExpiringSoon(row.expiresAt)" 
                size="small" 
                type="warning"
              >
                Expiring Soon
              </el-tag>
              <el-tag 
                v-else-if="row.isRevoked" 
                size="small" 
                type="info"
              >
                Revoked
              </el-tag>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Actions" width="220" align="center" fixed="right">
        <template #default="{ row }">
          <div class="flex gap-2 justify-center">
            <el-button
              size="small"
              plain
              @click="copyShareLink(row)"
              :disabled="row.isRevoked"
            >
              <Icon icon="material-symbols:link" width="16" />
              Copy Link
            </el-button>
            <template v-if="row.isRevoked">
              <el-button
                size="small"
                type="success"
                plain
                :icon="Refresh"
                @click="handleUnrevoke(row)"
              >
                Unrevoke
              </el-button>
            </template>
            <template v-else>
              <el-button
                size="small"
                type="danger"
                plain
                :icon="Delete"
                @click="handleRevoke(row)"
              >
                Revoke
              </el-button>
            </template>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="shares.length === 0 && !loading" class="text-center py-8 text-gray-500">
      No document shares found
    </div>
  </el-card>
</template>

<style scoped>
.mt-1 {
  margin-top: 0.25rem;
}
.text-xs {
  font-size: 0.75rem;
}
.text-gray-400 {
  color: #9ca3af;
}
.text-gray-500 {
  color: #6b7280;
}
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.justify-between {
  justify-content: space-between;
}
.justify-center {
  justify-content: center;
}
.gap-2 {
  gap: 0.5rem;
}
</style>

