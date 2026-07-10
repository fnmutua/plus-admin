<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElButton, ElDrawer, ElForm, ElFormItem, ElDatePicker, ElInputNumber, ElInput, ElSelect, ElOption, ElTable, ElTableColumn, ElMessage, ElPopconfirm, ElTooltip } from 'element-plus'
import { Icon } from '@iconify/vue'
import { debounce } from 'lodash-es'
import { useAppStore } from '@/store/modules/app'
import {
  createUploadShareLink,
  listUploadShareLinks,
  revokeUploadShareLink,
  sendUploadShareEmail,
  searchUploadShareEmailUsers
} from '@/api/settlements'

type EmailUser = {
  id: number
  name: string
  username: string
  email: string | null
  phone: string | null
}

const props = defineProps<{
  entityType: 'settlement' | 'project' | 'health_facility' | 'education_facility'
    | 'road' | 'water_point' | 'sewer' | 'other_facility' | 'contractor'
    | 'piped_water' | 'community_hall' | 'police_station' | 'community_project'
  entityId: number | string
}>()

const appStore = useAppStore()
const isMobile = computed(() => appStore.getMobile)

const drawerVisible = ref(false)
const creating = ref(false)
const loadingLinks = ref(false)
const links = ref<any[]>([])
const generatedUrl = ref('')

const form = ref<{ expiresAt: Date | null; maxUploads: number | null; label: string }>({
  expiresAt: null,
  maxUploads: 20,
  label: ''
})

const disabledDate = (date: Date) => date.getTime() < Date.now() - 24 * 60 * 60 * 1000

const fetchLinks = async () => {
  loadingLinks.value = true
  try {
    const res: any = await listUploadShareLinks({ entity_type: props.entityType, entity_id: props.entityId })
    links.value = res.code === '0000' ? res.data || [] : []
  } catch {
    links.value = []
  } finally {
    loadingLinks.value = false
  }
}

const openDrawer = () => {
  drawerVisible.value = true
  generatedUrl.value = ''
  emailTarget.value = null
  form.value = { expiresAt: null, maxUploads: 20, label: '' }
  fetchLinks()
}

const createLink = async () => {
  creating.value = true
  try {
    const expiresAt = form.value.expiresAt
    const res: any = await createUploadShareLink({
      entity_type: props.entityType,
      entity_id: props.entityId,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      maxUploads: form.value.maxUploads ?? undefined,
      label: form.value.label || undefined
    })
    if (res.code === '0000') {
      generatedUrl.value = res.data?.url || ''
      ElMessage.success('Upload link created')
      form.value = { expiresAt: null, maxUploads: 20, label: '' }
      await fetchLinks()
      emailTarget.value = links.value.find((l: any) => l.token === res.data?.token) || null
      if (emailTarget.value) {
        openEmailPanel(emailTarget.value)
      }
    } else {
      ElMessage.error(res.message || 'Failed to create upload link')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || 'Failed to create upload link')
  } finally {
    creating.value = false
  }
}

const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('Link copied')
  } catch {
    ElMessage.error('Could not copy link')
  }
}

const revokeLink = async (row: any) => {
  try {
    const res: any = await revokeUploadShareLink(row.id)
    if (res.code === '0000') {
      ElMessage.success('Link revoked')
      fetchLinks()
    } else {
      ElMessage.error(res.message || 'Failed to revoke link')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || 'Failed to revoke link')
  }
}

const linkStatus = (row: any): { text: string; type: string } => {
  if (row.isRevoked) return { text: 'Revoked', type: 'info' }
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) return { text: 'Expired', type: 'warning' }
  if (row.maxUploads != null && row.uploadCount >= row.maxUploads) return { text: 'Limit reached', type: 'warning' }
  return { text: 'Active', type: 'success' }
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Never expires'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  }).format(new Date(dateString))
}

const linkUrl = (row: any) => `${window.location.origin}/#/upload-share/${row.token}`

// ---- Send via email (same remote user search pattern as Communications) ----

const emailTarget = ref<any>(null)
const emailRecipients = ref<string[]>([])
const emailMessage = ref('')
const sendingEmail = ref(false)
const userSearchLoading = ref(false)
const userSearchResults = ref<EmailUser[]>([])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatUserLabel(u: EmailUser) {
  const parts = [u.name || u.username]
  const contact = [u.phone, u.email].filter(Boolean).join(' · ')
  if (contact) parts.push(`(${contact})`)
  return parts.join(' ')
}

const searchUsers = debounce(async (query: string) => {
  try {
    userSearchLoading.value = true
    const res: any = await searchUploadShareEmailUsers(query || '')
    const incoming = (res?.data || res?.results || []) as EmailUser[]
    const selectedEmails = new Set(emailRecipients.value.map((e) => e.toLowerCase()))
    const keep = userSearchResults.value.filter((u) => u.email && selectedEmails.has(u.email.toLowerCase()))
    const seen = new Set(keep.map((u) => u.id))
    userSearchResults.value = [
      ...keep,
      ...incoming.filter((u) => u.email && !seen.has(u.id))
    ]
  } catch (err) {
    console.error('[UploadShare] user search failed', err)
    userSearchResults.value = userSearchResults.value.filter((u) =>
      u.email && emailRecipients.value.some((e) => e.toLowerCase() === u.email!.toLowerCase())
    )
  } finally {
    userSearchLoading.value = false
  }
}, 250)

const normalizeRecipients = (values: string[]) => {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of values) {
    const v = String(raw || '').trim()
    if (!v) continue
    const key = v.toLowerCase()
    if (seen.has(key)) continue
    if (!EMAIL_RE.test(v)) {
      ElMessage.warning(`"${v}" is not a valid email address`)
      continue
    }
    seen.add(key)
    out.push(v)
  }
  emailRecipients.value = out
}

const openEmailPanel = (row: any) => {
  emailTarget.value = row
  emailRecipients.value = []
  emailMessage.value = ''
  userSearchResults.value = []
  searchUsers('')
}

const sendEmail = async () => {
  if (!emailTarget.value) return
  if (emailRecipients.value.length === 0) {
    ElMessage.warning('Add at least one recipient')
    return
  }
  sendingEmail.value = true
  try {
    const res: any = await sendUploadShareEmail(emailTarget.value.id, {
      to: emailRecipients.value,
      message: emailMessage.value || undefined
    })
    if (res.code === '0000') {
      ElMessage.success('Email sent')
      emailTarget.value = null
      emailRecipients.value = []
      emailMessage.value = ''
      userSearchResults.value = []
    } else {
      ElMessage.error(res.message || 'Failed to send email')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || 'Failed to send email')
  } finally {
    sendingEmail.value = false
  }
}
</script>

<template>
  <el-button plain @click="openDrawer">
    <Icon icon="material-symbols:share-outline" style="margin-right: 5px;" />
    Share upload link
  </el-button>

  <el-drawer
    v-model="drawerVisible"
    title="Share upload link"
    :size="isMobile ? '100%' : '52%'"
    direction="rtl"
    class="upload-share-drawer"
  >
    <div class="drawer-content">
    <el-form label-position="top">
      <el-form-item label="Expires (optional — leave blank for a link that never expires)">
        <el-date-picker
          v-model="form.expiresAt"
          type="datetime"
          placeholder="No expiry"
          clearable
          :disabled-date="disabledDate"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="Max uploads">
        <el-input-number v-model="form.maxUploads" :min="1" :max="500" />
      </el-form-item>
      <el-form-item label="Note (optional)">
        <el-input v-model="form.label" placeholder="e.g. Site photos from contractor" maxlength="255" />
      </el-form-item>
      <el-button type="primary" :loading="creating" @click="createLink">Create link</el-button>
    </el-form>

    <div v-if="generatedUrl" class="mt-3 mb-4 generated-url-row">
      <el-input :model-value="generatedUrl" readonly>
        <template #append>
          <el-tooltip content="Copy link" placement="top">
            <el-button @click="copyUrl(generatedUrl)">
              <Icon icon="material-symbols:content-copy-outline" />
            </el-button>
          </el-tooltip>
        </template>
      </el-input>
    </div>

    <!-- Send via email -->
    <div v-if="emailTarget" class="email-panel mt-4 mb-4">
      <p class="email-panel__title">Send this link by email</p>
      <el-form label-position="top">
        <el-form-item label="To">
          <el-select
            v-model="emailRecipients"
            multiple
            filterable
            remote
            reserve-keyword
            allow-create
            default-first-option
            collapse-tags
            collapse-tags-tooltip
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            placeholder="Search by name, username, email or phone"
            style="width: 100%"
            @change="normalizeRecipients"
          >
            <el-option
              v-for="u in userSearchResults"
              :key="u.id"
              :label="formatUserLabel(u)"
              :value="u.email!"
            />
          </el-select>
          <div class="email-panel__hint">
            Start typing to search users. Type an external email and press Enter to add it.
          </div>
        </el-form-item>
        <el-form-item label="Message (optional)">
          <el-input v-model="emailMessage" type="textarea" :rows="2" placeholder="Add a note for the recipient" />
        </el-form-item>
      </el-form>
      <div class="email-panel__actions">
        <el-button size="small" @click="emailTarget = null">Cancel</el-button>
        <el-button type="primary" size="small" :loading="sendingEmail" @click="sendEmail">Send email</el-button>
      </div>
    </div>

    <div class="drawer-table-wrap mt-4">
      <el-table v-loading="loadingLinks" :data="links" class="links-table" border>
      <el-table-column label="Expires" min-width="150">
        <template #default="{ row }">{{ formatDate(row.expiresAt) }}</template>
      </el-table-column>
      <el-table-column label="Uploads" min-width="88" align="center">
        <template #default="{ row }">{{ row.uploadCount }}/{{ row.maxUploads ?? '∞' }}</template>
      </el-table-column>
      <el-table-column label="Created by" min-width="110" show-overflow-tooltip>
        <template #default="{ row }">{{ row.creator?.name || '—' }}</template>
      </el-table-column>
      <el-table-column label="Status" min-width="100">
        <template #default="{ row }">
          <span :class="`status-${linkStatus(row).type}`">{{ linkStatus(row).text }}</span>
        </template>
      </el-table-column>
      <el-table-column label="" min-width="112" align="center">
        <template #default="{ row }">
          <div class="link-actions">
            <el-tooltip content="Copy link" placement="top">
              <el-button plain size="small" circle @click="copyUrl(linkUrl(row))">
                <Icon icon="material-symbols:content-copy-outline" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="Send by email" placement="top">
              <el-button plain size="small" circle :disabled="row.isRevoked" @click="openEmailPanel(row)">
                <Icon icon="mdi:email-outline" />
              </el-button>
            </el-tooltip>
            <el-popconfirm
              v-if="!row.isRevoked"
              width="300"
              placement="top-end"
              title="Revoke this link? It will stop accepting uploads immediately."
              confirm-button-text="Revoke"
              cancel-button-text="Cancel"
              confirm-button-type="danger"
              @confirm="revokeLink(row)"
            >
              <template #reference>
                <span>
                  <el-tooltip content="Revoke link" placement="top">
                    <el-button plain type="danger" size="small" circle>
                      <Icon icon="material-symbols:link-off" />
                    </el-button>
                  </el-tooltip>
                </span>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
      </el-table>
    </div>
    </div>

    <template #footer>
      <el-button @click="drawerVisible = false">Close</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.status-success { color: var(--el-color-success); }
.status-warning { color: var(--el-color-warning); }
.status-info { color: var(--el-color-info); }

.email-panel {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 12px;
}

.email-panel__title {
  font-weight: 600;
  margin: 0 0 8px;
}

.email-panel__hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.email-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.link-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.generated-url-row :deep(.el-input-group__append) {
  padding: 0;
}

.generated-url-row :deep(.el-input-group__append .el-button) {
  margin: 0;
  border: none;
  border-radius: 0;
}

.upload-share-drawer :deep(.el-drawer__body) {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-table-wrap {
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.drawer-table-wrap :deep(.el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 2;
}

.links-table {
  width: 100% !important;
}

.links-table :deep(.el-table__inner-wrapper),
.links-table :deep(.el-table__header-wrapper),
.links-table :deep(.el-table__body-wrapper) {
  width: 100% !important;
}
</style>
