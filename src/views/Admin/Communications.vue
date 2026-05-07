<template>
  <el-card v-loading="loading">
    <div class="comm-header">
      <div class="comm-title">
        <Icon icon="mdi:message-fast" :size="22" class="comm-title__icon" />
        <span>Communications</span>
        <el-tag size="small" type="info" effect="plain">SMS &amp; Email broadcasts</el-tag>
      </div>
      <el-button :icon="Back" @click="goBack">Back</el-button>
    </div>

    <el-tabs v-model="activeTab" class="comm-tabs" @tab-change="onTabChange">
      <!-- ==================== COMPOSE ==================== -->
      <el-tab-pane label="Compose" name="compose">
        <el-form
          ref="composeFormRef"
          :model="composeForm"
          :rules="composeRules"
          label-position="top"
          class="comm-compose"
        >
          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="Channel" prop="channel">
                <el-radio-group v-model="composeForm.channel" @change="onChannelChange">
                  <el-radio-button label="sms">SMS</el-radio-button>
                  <el-radio-button label="email">Email</el-radio-button>
                  <el-radio-button label="both">SMS + Email</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="Recipient mode" prop="recipient_mode">
                <el-radio-group v-model="composeForm.recipient_mode" @change="onRecipientModeChange">
                  <el-radio-button label="roles">By role group</el-radio-button>
                  <el-radio-button label="users">Specific users</el-radio-button>
                  <el-radio-button label="custom">Phone / email list</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- ROLE-BASED PICKER -->
          <div v-if="composeForm.recipient_mode === 'roles'">
            <el-row :gutter="16">
              <el-col :xs="24" :md="14">
                <el-form-item
                  label="Roles"
                  prop="recipient_filter.roles"
                  :rules="[{ required: true, validator: validateRoles, trigger: 'change' }]"
                >
                  <el-select
                    v-model="composeForm.recipient_filter.roles"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    filterable
                    placeholder="Select one or more roles"
                    style="width: 100%"
                    @change="resetPreview"
                  >
                    <el-option
                      v-for="role in roleOptions"
                      :key="role.name"
                      :label="formatRoleLabel(role)"
                      :value="role.name"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="10">
                <el-form-item label="County (optional)">
                  <el-select
                    v-model="composeForm.recipient_filter.county_id"
                    clearable
                    filterable
                    placeholder="All counties"
                    style="width: 100%"
                    @change="resetPreview"
                  >
                    <el-option
                      v-for="c in countyOptions"
                      :key="c.id"
                      :label="c.name"
                      :value="c.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- SPECIFIC USERS PICKER -->
          <div v-if="composeForm.recipient_mode === 'users'">
            <el-form-item
              label="Users"
              prop="recipient_filter.user_ids"
              :rules="[{ required: true, validator: validateUserIds, trigger: 'change' }]"
            >
              <el-select
                v-model="composeForm.recipient_filter.user_ids"
                multiple
                filterable
                remote
                reserve-keyword
                collapse-tags
                collapse-tags-tooltip
                :remote-method="searchUsers"
                :loading="userSearchLoading"
                placeholder="Search by name, username, email or phone"
                style="width: 100%"
                @change="resetPreview"
              >
                <el-option
                  v-for="u in userSearchResults"
                  :key="u.id"
                  :label="formatUserLabel(u)"
                  :value="u.id"
                />
              </el-select>
              <div class="comm-hint">
                Start typing to search. Up to 50 active users are returned per query.
              </div>
            </el-form-item>
          </div>

          <!-- CUSTOM ADDRESSES PICKER -->
          <div v-if="composeForm.recipient_mode === 'custom'">
            <el-form-item
              label="Phone numbers and / or email addresses"
              prop="customAddressesText"
              :rules="[{ required: true, validator: validateCustomAddresses, trigger: 'blur' }]"
            >
              <el-input
                v-model="composeForm.customAddressesText"
                type="textarea"
                :rows="4"
                placeholder="One per line, or comma / semicolon separated. Mix phones and emails freely."
                @input="resetPreview"
              />
              <div class="comm-hint">
                Phones are normalised to Kenyan format (07… → 2547…). Anything that doesn't look
                like a phone or email is dropped during preview.
              </div>
            </el-form-item>
          </div>

          <!-- SUBJECT -->
          <el-form-item
            v-if="composeForm.channel !== 'sms'"
            label="Email subject"
            prop="subject"
            :rules="emailSubjectRule"
          >
            <el-input v-model="composeForm.subject" placeholder="Subject line for the email" />
          </el-form-item>

          <!-- BODY -->
          <el-form-item label="Message" prop="body" :rules="bodyRule">
            <el-input
              v-model="composeForm.body"
              type="textarea"
              :rows="6"
              placeholder="Type the message body here…"
            />
            <div class="comm-counter">
              <span :class="{ 'is-warning': smsOverLimit }">
                {{ composeForm.body.length }} chars
                <template v-if="composeForm.channel !== 'email'">
                  · {{ smsSegments }} SMS segment{{ smsSegments === 1 ? '' : 's' }}
                  <template v-if="smsOverLimit">
                    (long body — provider may reject or split)
                  </template>
                </template>
              </span>
            </div>
          </el-form-item>

          <!-- PREVIEW + SEND -->
          <div class="comm-actions">
            <el-button
              type="primary"
              plain
              :icon="View"
              :loading="previewLoading"
              @click="runPreview"
            >
              Preview recipients
            </el-button>
            <el-button
              type="primary"
              :icon="Promotion"
              :loading="sending"
              :disabled="!canSendBroadcast"
              @click="confirmAndSend"
            >
              Send broadcast
            </el-button>
          </div>

          <!-- PREVIEW PANEL -->
          <div v-if="preview" class="comm-preview" :class="{ 'is-empty': preview.total === 0 }">
            <div class="comm-preview__header">
              <div class="comm-preview__title">
                <Icon :icon="preview.total === 0 ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline'" :size="18" />
                <span v-if="preview.total === 0">
                  No deliverable recipients matched the current selection.
                </span>
                <span v-else>
                  Ready to deliver to {{ preview.total }} recipient{{ preview.total === 1 ? '' : 's' }}
                </span>
              </div>
              <div class="comm-preview__stats" v-if="preview.total > 0">
                <el-tag type="info" effect="dark">Total: {{ preview.total }}</el-tag>
                <el-tag
                  v-if="composeForm.channel === 'both' || composeForm.channel === 'sms'"
                  type="success"
                  effect="dark"
                >
                  SMS: {{ preview.bySms }}
                </el-tag>
                <el-tag
                  v-if="composeForm.channel === 'both' || composeForm.channel === 'email'"
                  type="primary"
                  effect="dark"
                >
                  Email: {{ preview.byEmail }}
                </el-tag>
              </div>
            </div>

            <div v-if="preview.total > 0" class="comm-preview__listWrap">
              <div class="comm-preview__list">
                <div
                  v-for="(r, i) in preview.recipients.slice(0, 32)"
                  :key="i"
                  class="comm-preview__chip"
                  :class="r.channel === 'sms' ? 'is-sms' : 'is-email'"
                >
                  <Icon :icon="r.channel === 'sms' ? 'mdi:cellphone-message' : 'mdi:email-outline'" :size="14" />
                  <span>{{ r.name || r.address }}</span>
                </div>
              </div>
              <div v-if="preview.recipients.length > 32" class="comm-preview__more">
                + {{ preview.recipients.length - 32 }} more recipients
              </div>
            </div>
          </div>
        </el-form>
      </el-tab-pane>

      <!-- ==================== HISTORY ==================== -->
      <el-tab-pane label="History" name="history">
        <div class="comm-history-toolbar">
          <el-input
            v-model="historyQuery"
            placeholder="Search subject or body…"
            clearable
            style="max-width: 320px"
            @input="debouncedReloadHistory"
          >
            <template #append>
              <el-button :icon="Search" @click="loadHistory" />
            </template>
          </el-input>
          <el-select
            v-model="historyChannelFilter"
            placeholder="All channels"
            clearable
            style="width: 160px"
            @change="loadHistory"
          >
            <el-option label="SMS" value="sms" />
            <el-option label="Email" value="email" />
            <el-option label="SMS + Email" value="both" />
          </el-select>
          <el-select
            v-model="historyStatusFilter"
            placeholder="All statuses"
            clearable
            style="width: 160px"
            @change="loadHistory"
          >
            <el-option label="Completed" value="completed" />
            <el-option label="Partial" value="partial" />
            <el-option label="Failed" value="failed" />
            <el-option label="Sending" value="sending" />
          </el-select>
          <el-button :icon="Refresh" @click="loadHistory">Refresh</el-button>
        </div>

        <el-table
          v-loading="historyLoading"
          :data="historyRows"
          stripe
          border
          style="width: 100%"
          @row-click="openDetails"
        >
          <el-table-column label="Date" width="170">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="Channel" width="130">
            <template #default="{ row }">
              <el-tag size="small" :type="channelTagType(row.channel)" effect="plain">
                {{ channelLabel(row.channel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Subject / preview" min-width="280">
            <template #default="{ row }">
              <div class="comm-preview-text">
                <strong v-if="row.subject">{{ row.subject }}</strong>
                <div class="comm-preview-text__body">{{ truncate(row.body, 120) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Recipients" width="220">
            <template #default="{ row }">
              <div class="comm-counts">
                <el-tag size="small" type="info" effect="plain">{{ row.total_recipients }} total</el-tag>
                <el-tag size="small" type="success" effect="plain">{{ row.sent_count }} sent</el-tag>
                <el-tag v-if="row.failed_count" size="small" type="danger" effect="plain">
                  {{ row.failed_count }} failed
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="130">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTagType(row.status)">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Sent by" width="170">
            <template #default="{ row }">
              <span v-if="row.sender">{{ row.sender.name || row.sender.username }}</span>
              <span v-else class="comm-muted">—</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="comm-pagination">
          <el-pagination
            v-model:current-page="historyPage"
            v-model:page-size="historyLimit"
            :page-sizes="[10, 20, 50, 100]"
            :total="historyTotal"
            background
            layout="total, sizes, prev, pager, next"
            @current-change="loadHistory"
            @size-change="loadHistory"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== DETAIL DRAWER ==================== -->
    <el-drawer
      v-model="detailVisible"
      :title="detailTitle"
      direction="rtl"
      :size="drawerSize"
    >
      <div v-if="detail" class="comm-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="Channel">
            <el-tag size="small" :type="channelTagType(detail.channel)" effect="plain">
              {{ channelLabel(detail.channel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag size="small" :type="statusTagType(detail.status)">{{ detail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Sent">{{ detail.sent_count }} of {{ detail.total_recipients }}</el-descriptions-item>
          <el-descriptions-item label="Failed">{{ detail.failed_count }}</el-descriptions-item>
          <el-descriptions-item label="Created">{{ formatDate(detail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="Sent by">
            <span v-if="detail.sender">{{ detail.sender.name || detail.sender.username }}</span>
            <span v-else class="comm-muted">—</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.subject" label="Subject" :span="2">
            {{ detail.subject }}
          </el-descriptions-item>
          <el-descriptions-item label="Body" :span="2">
            <pre class="comm-body">{{ detail.body }}</pre>
          </el-descriptions-item>
        </el-descriptions>

        <div class="comm-detail__actions">
          <h4>Recipients</h4>
          <el-button
            v-if="failedRecipientCount > 0"
            type="warning"
            size="small"
            :icon="Refresh"
            :loading="bulkRetryLoading"
            @click="retryAllFailed"
          >
            Retry all failed ({{ failedRecipientCount }})
          </el-button>
        </div>

        <el-table :data="detail.recipients" border size="small" max-height="420">
          <el-table-column label="Channel" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.channel === 'sms' ? 'success' : 'primary'" effect="plain">
                {{ row.channel.toUpperCase() }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Recipient" min-width="180">
            <template #default="{ row }">
              <div>
                <div v-if="row.name" class="comm-recipient__name">{{ row.name }}</div>
                <div class="comm-recipient__addr">{{ row.address }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="recipientStatusType(row.status)">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Sent at" width="170">
            <template #default="{ row }">
              <span v-if="row.sent_at">{{ formatDate(row.sent_at) }}</span>
              <span v-else class="comm-muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="Provider response" min-width="200">
            <template #default="{ row }">
              <el-tooltip
                v-if="row.provider_message"
                effect="dark"
                placement="top-start"
                :content="row.provider_message"
              >
                <span class="comm-truncate">{{ row.provider_code || '—' }} · {{ truncate(row.provider_message, 60) }}</span>
              </el-tooltip>
              <span v-else class="comm-muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="" width="90" align="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'failed'"
                size="small"
                :icon="Refresh"
                :loading="retryingId === row.id"
                @click="retryRow(row)"
              >
                Retry
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElCard,
  ElTabs,
  ElTabPane,
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
  ElRadioGroup,
  ElRadioButton,
  ElSelect,
  ElOption,
  ElInput,
  ElButton,
  ElTag,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElDrawer,
  ElDescriptions,
  ElDescriptionsItem,
  ElTooltip,
  ElMessage,
  ElMessageBox
} from 'element-plus'
import { Search, Refresh, View, Promotion, Back } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { debounce } from 'lodash-es'
import dayjs from 'dayjs'
import {
  createCommunication,
  getCommunication,
  getCommunicationRoles,
  listCommunications,
  previewRecipients,
  retryRecipient,
  searchRecipientUsers,
  type CommunicationCreatePayload,
  type CommunicationRow,
  type CommunicationRecipientRow,
  type PreviewResponseResult,
  type RecipientUser
} from '@/api/communications'
import { getCountiesApi, type County } from '@/api/adminunits'

defineOptions({ name: 'AdminCommunications' })

const router = useRouter()
const loading = ref(false)
const activeTab = ref<'compose' | 'history'>('compose')

// ----- Compose form state ---------------------------------------------------

interface ComposeFormShape {
  channel: 'sms' | 'email' | 'both'
  recipient_mode: 'roles' | 'users' | 'custom'
  recipient_filter: {
    roles: string[]
    county_id?: number
    user_ids: number[]
  }
  customAddressesText: string
  subject: string
  body: string
}

const composeFormRef = ref()
const composeForm = reactive<ComposeFormShape>({
  channel: 'sms',
  recipient_mode: 'roles',
  recipient_filter: {
    roles: [],
    county_id: undefined,
    user_ids: []
  },
  customAddressesText: '',
  subject: '',
  body: ''
})

const composeRules = {
  channel: [{ required: true, message: 'Channel is required', trigger: 'change' }],
  recipient_mode: [{ required: true, message: 'Recipient mode is required', trigger: 'change' }]
}

const emailSubjectRule = computed(() =>
  composeForm.channel !== 'sms'
    ? [{ required: true, message: 'Subject is required for email', trigger: 'blur' }]
    : []
)

const bodyRule = [
  { required: true, message: 'Message body is required', trigger: 'blur' },
  { min: 1, max: 5000, message: 'Body must be between 1 and 5000 characters', trigger: 'blur' }
]

function validateRoles(_rule: any, _val: any, callback: (err?: Error) => void) {
  if (composeForm.recipient_mode !== 'roles') return callback()
  if (!composeForm.recipient_filter.roles?.length) {
    return callback(new Error('Select at least one role'))
  }
  callback()
}

function validateUserIds(_rule: any, _val: any, callback: (err?: Error) => void) {
  if (composeForm.recipient_mode !== 'users') return callback()
  if (!composeForm.recipient_filter.user_ids?.length) {
    return callback(new Error('Select at least one user'))
  }
  callback()
}

function validateCustomAddresses(_rule: any, _val: any, callback: (err?: Error) => void) {
  if (composeForm.recipient_mode !== 'custom') return callback()
  if (!composeForm.customAddressesText.trim()) {
    return callback(new Error('Enter at least one phone or email'))
  }
  callback()
}

// SMS segmentation hint (1 segment ≈ 160 chars; multi-segment ≈ 153 chars each).
const smsSegments = computed(() => {
  const len = composeForm.body.length
  if (len === 0) return 0
  if (len <= 160) return 1
  return Math.ceil(len / 153)
})
const smsOverLimit = computed(() => smsSegments.value > 4)

const hasMessageBody = computed(() => Boolean(composeForm.body && composeForm.body.trim()))

const hasRecipientSelection = computed(() => {
  if (composeForm.recipient_mode === 'roles') {
    return Array.isArray(composeForm.recipient_filter.roles) && composeForm.recipient_filter.roles.length > 0
  }
  if (composeForm.recipient_mode === 'users') {
    return Array.isArray(composeForm.recipient_filter.user_ids) && composeForm.recipient_filter.user_ids.length > 0
  }
  // custom mode: requires at least one non-empty token.
  return composeForm.customAddressesText
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean).length > 0
})

const canSendBroadcast = computed(() => {
  if (!hasMessageBody.value) return false
  if (!hasRecipientSelection.value) return false
  if (!preview.value || preview.value.total === 0) return false
  return true
})

// ----- Lookups (roles, counties, user search) -------------------------------

const roleOptions = ref<Array<{ id: number; name: string; description: string | null }>>([])
const countyOptions = ref<Array<{ id: number; name: string }>>([])

const userSearchLoading = ref(false)
const userSearchResults = ref<RecipientUser[]>([])

const searchUsers = debounce(async (query: string) => {
  try {
    userSearchLoading.value = true
    const res = await searchRecipientUsers(query || '', composeForm.channel)
    const incoming = (res?.results || []) as RecipientUser[]
    // Keep already-selected users in the option list so their tag still renders a label.
    const selectedIds = new Set(composeForm.recipient_filter.user_ids)
    const keep = userSearchResults.value.filter((u) => selectedIds.has(u.id))
    const seen = new Set(keep.map((u) => u.id))
    userSearchResults.value = [
      ...keep,
      ...incoming.filter((u) => !seen.has(u.id))
    ]
  } catch (err) {
    console.error('[Communications] user search failed', err)
  } finally {
    userSearchLoading.value = false
  }
}, 250)

async function loadRoles() {
  try {
    const res = await getCommunicationRoles(composeForm.channel)
    roleOptions.value = res?.results || []
  } catch (err) {
    console.error('[Communications] failed to load roles', err)
  }
}

async function loadCounties() {
  try {
    const res: any = await getCountiesApi()
    const list: County[] = res?.data || res?.results || []
    countyOptions.value = list
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (err) {
    console.error('[Communications] failed to load counties', err)
  }
}

function formatRoleLabel(role: { name: string; description: string | null }) {
  const pretty = role.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return role.description ? `${pretty} — ${role.description}` : pretty
}
function formatUserLabel(u: RecipientUser) {
  const parts = [u.name || u.username]
  const contact = [u.phone, u.email].filter(Boolean).join(' · ')
  if (contact) parts.push(`(${contact})`)
  return parts.join(' ')
}

// ----- Preview & send -------------------------------------------------------

const previewLoading = ref(false)
const sending = ref(false)
const preview = ref<PreviewResponseResult | null>(null)

function buildRecipientFilter() {
  if (composeForm.recipient_mode === 'roles') {
    return {
      roles: composeForm.recipient_filter.roles,
      county_id: composeForm.recipient_filter.county_id
    }
  }
  if (composeForm.recipient_mode === 'users') {
    return { user_ids: composeForm.recipient_filter.user_ids }
  }
  // custom: split by newline / comma / semicolon, drop empties.
  const addresses = composeForm.customAddressesText
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return { addresses }
}

function resetPreview() {
  preview.value = null
}

function onRecipientModeChange() {
  resetPreview()
  if (composeForm.recipient_mode === 'users' && userSearchResults.value.length === 0) {
    void searchUsers('')
  }
}

async function onChannelChange() {
  resetPreview()
  composeForm.recipient_filter.roles = []
  composeForm.recipient_filter.user_ids = []
  userSearchResults.value = []
  await loadRoles()
}

async function runPreview() {
  try {
    await composeFormRef.value?.validateField?.([
      'recipient_filter.roles',
      'recipient_filter.user_ids',
      'customAddressesText'
    ]).catch(() => {})

    previewLoading.value = true
    const res = await previewRecipients({
      channel: composeForm.channel,
      recipient_mode: composeForm.recipient_mode,
      recipient_filter: buildRecipientFilter()
    })
    preview.value = res?.results || { total: 0, bySms: 0, byEmail: 0, recipients: [] }
  } catch (err: any) {
    console.error('[Communications] preview failed', err)
    ElMessage.error(err?.response?.data?.message || 'Failed to preview recipients')
  } finally {
    previewLoading.value = false
  }
}

async function confirmAndSend() {
  try {
    await composeFormRef.value?.validate()
  } catch {
    ElMessage.warning('Please fix the form errors before sending.')
    return
  }
  if (!preview.value || preview.value.total === 0) {
    ElMessage.warning('Run a preview first to confirm recipients.')
    return
  }

  const channelLabelLocal = composeForm.channel === 'both' ? 'SMS + Email' : composeForm.channel.toUpperCase()
  try {
    await ElMessageBox.confirm(
      `This will send a ${channelLabelLocal} broadcast to ${preview.value.total} recipient${preview.value.total === 1 ? '' : 's'}. Continue?`,
      'Confirm broadcast',
      { type: 'warning', confirmButtonText: 'Send now', cancelButtonText: 'Cancel' }
    )
  } catch {
    return
  }

  try {
    sending.value = true
    const payload: CommunicationCreatePayload = {
      channel: composeForm.channel,
      subject: composeForm.channel !== 'sms' ? composeForm.subject : undefined,
      body: composeForm.body,
      recipient_mode: composeForm.recipient_mode,
      recipient_filter: buildRecipientFilter()
    }
    const res = await createCommunication(payload)
    const r = res?.results
    ElMessage.success(
      `Broadcast dispatched: ${r?.sent || 0} sent, ${r?.failed || 0} failed (status: ${r?.status || 'completed'}).`
    )
    resetForm()
    activeTab.value = 'history'
    await loadHistory()
    if (r?.id) await openDetailsById(r.id)
  } catch (err: any) {
    console.error('[Communications] send failed', err)
    ElMessage.error(err?.response?.data?.message || 'Failed to send broadcast')
  } finally {
    sending.value = false
  }
}

function resetForm() {
  composeForm.recipient_filter.roles = []
  composeForm.recipient_filter.county_id = undefined
  composeForm.recipient_filter.user_ids = []
  composeForm.customAddressesText = ''
  composeForm.subject = ''
  composeForm.body = ''
  preview.value = null
  composeFormRef.value?.clearValidate?.()
}

// ----- History --------------------------------------------------------------

const historyRows = ref<CommunicationRow[]>([])
const historyLoading = ref(false)
const historyTotal = ref(0)
const historyPage = ref(1)
const historyLimit = ref(20)
const historyQuery = ref('')
const historyChannelFilter = ref<'sms' | 'email' | 'both' | ''>('')
const historyStatusFilter = ref('')

async function loadHistory() {
  try {
    historyLoading.value = true
    const res = await listCommunications({
      page: historyPage.value,
      limit: historyLimit.value,
      q: historyQuery.value || undefined,
      channel: historyChannelFilter.value || undefined,
      status: (historyStatusFilter.value as any) || undefined
    })
    historyRows.value = res?.results?.data || []
    historyTotal.value = res?.results?.total || 0
  } catch (err: any) {
    console.error('[Communications] history load failed', err)
    ElMessage.error(err?.response?.data?.message || 'Failed to load history')
  } finally {
    historyLoading.value = false
  }
}

const debouncedReloadHistory = debounce(() => {
  historyPage.value = 1
  void loadHistory()
}, 350)

function onTabChange(tab: string | number) {
  if (tab === 'history' && historyRows.value.length === 0) {
    void loadHistory()
  }
}

// ----- Detail drawer --------------------------------------------------------

const detailVisible = ref(false)
const detail = ref<(CommunicationRow & { recipients: CommunicationRecipientRow[] }) | null>(null)
const retryingId = ref<number | null>(null)
const bulkRetryLoading = ref(false)

// Drawer width: target ~1040px so all recipient columns (Channel, Recipient,
// Status, Sent at, Provider response, Retry) stay visible without horizontal
// scroll, but cap at 95vw on smaller laptops.
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
const onResize = () => { viewportWidth.value = window.innerWidth }
onMounted(() => { window.addEventListener('resize', onResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', onResize) })

const drawerSize = computed(() => {
  const target = 1040
  const max = Math.floor(viewportWidth.value * 0.95)
  return Math.min(target, max)
})

const detailTitle = computed(() => {
  if (!detail.value) return 'Broadcast'
  const ch = channelLabel(detail.value.channel)
  return `${ch} broadcast #${detail.value.id}`
})

const failedRecipientCount = computed(
  () => detail.value?.recipients?.filter((r) => r.status === 'failed').length || 0
)

async function openDetails(row: CommunicationRow) {
  await openDetailsById(row.id)
}

async function openDetailsById(id: number) {
  try {
    detailVisible.value = true
    detail.value = null
    const res = await getCommunication(id)
    detail.value = res?.results || null
  } catch (err: any) {
    console.error('[Communications] detail load failed', err)
    ElMessage.error(err?.response?.data?.message || 'Failed to load broadcast')
    detailVisible.value = false
  }
}

async function retryRow(row: CommunicationRecipientRow) {
  if (!detail.value) return
  try {
    retryingId.value = row.id
    const res = await retryRecipient(detail.value.id, row.id)
    const updated = res?.results?.recipient
    if (updated && detail.value) {
      const idx = detail.value.recipients.findIndex((r) => r.id === updated.id)
      if (idx >= 0) detail.value.recipients[idx] = updated
      detail.value.sent_count = res.results.sent_count
      detail.value.failed_count = res.results.failed_count
      detail.value.status = res.results.communication_status
      // Reflect in the history table row too, if present.
      const histRow = historyRows.value.find((r) => r.id === detail.value!.id)
      if (histRow) {
        histRow.sent_count = res.results.sent_count
        histRow.failed_count = res.results.failed_count
        histRow.status = res.results.communication_status
      }
    }
    ElMessage.success(updated?.status === 'sent' ? 'Resent successfully' : 'Retry attempted (still failed)')
  } catch (err: any) {
    console.error('[Communications] retry failed', err)
    ElMessage.error(err?.response?.data?.message || 'Retry failed')
  } finally {
    retryingId.value = null
  }
}

async function retryAllFailed() {
  if (!detail.value) return
  const failed = detail.value.recipients.filter((r) => r.status === 'failed')
  if (!failed.length) return
  try {
    bulkRetryLoading.value = true
    for (const r of failed) {
      // Sequential to avoid hammering the SMS provider.
      // eslint-disable-next-line no-await-in-loop
      await retryRow(r)
    }
  } finally {
    bulkRetryLoading.value = false
  }
}

// ----- Misc helpers ---------------------------------------------------------

function channelLabel(c: string) {
  if (c === 'sms') return 'SMS'
  if (c === 'email') return 'Email'
  if (c === 'both') return 'SMS + Email'
  return c
}
function channelTagType(c: string) {
  if (c === 'sms') return 'success'
  if (c === 'email') return 'primary'
  return 'warning'
}
function statusTagType(s: string) {
  if (s === 'completed') return 'success'
  if (s === 'partial') return 'warning'
  if (s === 'failed') return 'danger'
  if (s === 'sending' || s === 'queued') return 'info'
  return 'info'
}
function recipientStatusType(s: string) {
  if (s === 'sent') return 'success'
  if (s === 'failed') return 'danger'
  return 'info'
}
function formatDate(s?: string | null) {
  if (!s) return '—'
  return dayjs(s).format('YYYY-MM-DD HH:mm')
}
function truncate(s: string, n: number) {
  if (!s) return ''
  return s.length <= n ? s : s.slice(0, n).trim() + '…'
}
function goBack() {
  router.back()
}

// ----- Init -----------------------------------------------------------------

onMounted(async () => {
  loading.value = true
  try {
    await Promise.allSettled([loadRoles(), loadCounties()])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="less">
.comm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}
.comm-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
}
.comm-title__icon {
  color: var(--el-color-primary);
}
.comm-tabs {
  margin-top: 4px;
}
.comm-compose {
  width: 100%;
}
.comm-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.comm-counter {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.comm-counter .is-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}
.comm-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.comm-preview {
  margin-top: 16px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-blank);
  border-radius: 10px;
  padding: 12px;
}
.comm-preview.is-empty {
  border-color: var(--el-color-warning-light-5);
  background: var(--el-color-warning-light-9);
}
.comm-preview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.comm-preview__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.45;
}
.comm-preview__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.comm-preview__listWrap {
  margin-top: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  border-radius: 6px;
  padding: 10px;
}
.comm-preview__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 180px;
  overflow: auto;
}
.comm-preview__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 260px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.comm-preview__chip span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.comm-preview__chip.is-sms {
  background: var(--el-color-success-light-8);
  color: var(--el-color-success-dark-2);
  border: 1px solid var(--el-color-success-light-5);
}
.comm-preview__chip.is-email {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
  border: 1px solid var(--el-color-primary-light-5);
}
.comm-preview__more {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}
.comm-history-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}
.comm-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.comm-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.comm-preview-text strong {
  display: block;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.comm-preview-text__body {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  margin-top: 2px;
}
.comm-muted {
  color: var(--el-text-color-secondary);
}
.comm-detail {
  padding: 4px 4px 24px;
}
.comm-detail__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 8px;
}
.comm-detail__actions h4 {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.comm-body {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  background: var(--el-fill-color-light);
  padding: 8px;
  border-radius: 4px;
  max-height: 240px;
  overflow-y: auto;
}
.comm-recipient__name {
  font-weight: 500;
  font-size: 13px;
}
.comm-recipient__addr {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.comm-truncate {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
