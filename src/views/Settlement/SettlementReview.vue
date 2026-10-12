<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElAlert, ElButton, ElCard, ElDescriptions, ElDescriptionsItem, ElDialog, ElEmpty,
  ElInput, ElLink, ElMessage, ElSkeleton, ElTable, ElTableColumn, ElTag
} from 'element-plus'
import { Back, Check, Close, Location, View } from '@element-plus/icons-vue'
import { getSettlementListByCounty, updateOneRecord } from '@/api/settlements'
import { useAppStore } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { useSettlementTypesStore } from '@/store/modules/settlementTypes'

/**
 * Full-page settlement review: what the reviewer needs to decide on a
 * submission, with Approve and Reject in place of the old list dialog.
 *
 * The record is fetched by id rather than handed over from the list, so the
 * page survives a refresh and its URL can be shared with another reviewer.
 */

const route = useRoute()
const { push, back } = useRouter()
const { wsCache } = useCache()
const appStore = useAppStore()
const userInfo = wsCache.get(appStore.getUserInfo)
const settlementTypesStore = useSettlementTypesStore()

const canReview = computed(() =>
  Boolean(appStore.getAdminButtons) ||
  (userInfo?.roles || []).some((role: any) => role.name === 'super_admin' || role.name === 'root_admin')
)

const settlementId = computed(() => String(route.params.id || ''))

/**
 * Deleted-tab rows are snapshots from settlement_history: the settlement
 * itself is usually gone, so the page renders `changes.before` and reports
 * who removed it. Those records are history, not submissions, so there is
 * nothing to approve.
 */
const historyId = computed(() => (route.query.history ? String(route.query.history) : ''))
const history = ref<any | null>(null)

const record = ref<any | null>(null)
const loading = ref(true)
const notFound = ref(false)
const acting = ref(false)

const rejectOpen = ref(false)
const rejectReason = ref('')

const isHistory = computed(() => Boolean(historyId.value))

const deletion = computed(() => {
  if (!history.value) return null
  const merge = history.value.change_type === 'Merge'
  return {
    kind: merge ? 'Merged' : 'Deleted',
    by: history.value.user?.name || '—',
    at: history.value.createdAt,
    mergedInto: merge
      ? history.value.changes?.primary_record?.name || history.value.changes?.primary_id || '—'
      : null
  }
})

const status = computed(() => (isHistory.value ? deletion.value?.kind || 'Deleted' : record.value?.isApproved || 'Pending'))
const statusTag = computed(() => {
  switch (status.value) {
    case 'Approved': return 'success'
    case 'Rejected': return 'danger'
    case 'Decommissioned': return 'warning'
    case 'Deleted':
    case 'Merged': return 'danger'
    default: return 'info'
  }
})

/** Only a live submission awaiting a decision, or a rejected one, can be acted on. */
const decidable = computed(() =>
  !isHistory.value && ['Pending', 'Rejected'].includes(status.value))

const typeLabel = computed(() => settlementTypesStore.labelFor(record.value?.settlement_type))

const submittedBy = computed(() => {
  const user = record.value?.user
  if (!user) return '—'
  return [user.name, user.email].filter(Boolean).join(' | ') || '—'
})

/** Location names, which a history snapshot carries only as ids. */
const location = computed(() => ({
  county: record.value?.county?.name || (record.value?.county_id ? `#${record.value.county_id}` : '—'),
  subcounty: record.value?.subcounty?.name || (record.value?.subcounty_id ? `#${record.value.subcounty_id}` : '—'),
  ward: record.value?.ward?.name || (record.value?.ward_id ? `#${record.value.ward_id}` : '—')
}))

const documents = computed<any[]>(() => record.value?.documents || record.value?.document || [])

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(value))
    : '—'

const formatNumber = (value: unknown) =>
  value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString()

/** The history record behind a deleted-tab row, plus the snapshot it holds. */
const loadHistory = async () => {
  const response = await getSettlementListByCounty({
    model: 'settlement_history',
    searchField: 'name',
    searchKeyword: '',
    excludeGeom: false,
    associated_multiple_models: ['users'],
    filters: ['id'],
    filterValues: [[historyId.value]]
  } as any)

  history.value = (response as any)?.data?.[0] || null
  // The settlement row is normally gone by now, so the snapshot is the record.
  record.value = history.value?.changes?.before || null
  notFound.value = !history.value
}

const loadSettlement = async () => {
  const response = await getSettlementListByCounty({
    limit: 1,
    page: 1,
    curUser: 1,
    model: 'settlement',
    searchField: 'name',
    searchKeyword: '',
    filters: ['id'],
    filterValues: [[settlementId.value]],
    associated_multiple_models: ['county', 'subcounty', 'ward', 'document', 'users'],
    nested_models: ['document', 'document_type']
  } as any)

  record.value = (response as any)?.data?.[0] || null
  notFound.value = !record.value
}

const load = async () => {
  loading.value = true
  notFound.value = false
  try {
    await (historyId.value ? loadHistory() : loadSettlement())
  } catch (error: any) {
    notFound.value = true
    ElMessage.error(error?.message || 'Could not load the settlement')
  } finally {
    loading.value = false
  }
}

/** Both decisions write the same record; only the status and reason differ. */
const decide = async (isApproved: 'Approved' | 'Rejected', rejectMessage?: string) => {
  acting.value = true
  try {
    await updateOneRecord({
      id: record.value.id,
      model: 'settlement',
      isApproved,
      reviewerId: userInfo?.id,
      reviewedAt: new Date().toISOString(),
      // Cleared on approval so a previous rejection's reason does not linger.
      reject_msg: isApproved === 'Approved' ? null : rejectMessage
    } as any)

    ElMessage.success(`${record.value.name} ${isApproved.toLowerCase()}`)
    // Back to the list, which reloads its tabs and counts on mount.
    push({ name: 'List' })
  } catch (error: any) {
    ElMessage.error(error?.message || `Could not ${isApproved === 'Approved' ? 'approve' : 'reject'} the settlement`)
  } finally {
    acting.value = false
  }
}

const approve = () => decide('Approved')

const confirmReject = () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('A reason is required so the submitter knows what to fix')
    return
  }
  rejectOpen.value = false
  decide('Rejected', rejectReason.value.trim())
}

const openFullDetails = () =>
  push({ name: 'SettlementDetails', params: { id: settlementId.value } })

const viewOnMap = () => {
  if (isHistory.value) {
    ElMessage.warning('This settlement no longer exists, so it cannot be shown on the map')
    return
  }
  if (!record.value?.geom) {
    ElMessage.warning('This settlement has no boundary defined in the database')
    return
  }
  push({ name: 'SettlementMap', params: { id: settlementId.value } })
}

onMounted(() => {
  settlementTypesStore.load()
  load()
})
</script>

<template>
  <div class="review-page">
    <el-card>
      <template #header>
        <div class="page-head">
          <div class="titles">
            <el-button :icon="Back" text @click="back()">Back</el-button>
            <h2>{{ record?.name || 'Settlement review' }}</h2>
            <el-tag :type="statusTag" size="small">{{ status }}</el-tag>
            <el-tag v-if="record?.code" size="small" type="info">{{ record.code }}</el-tag>
          </div>
          <div class="head-actions">
            <el-button v-if="!isHistory" :icon="Location" @click="viewOnMap">View on map</el-button>
            <el-button v-if="!isHistory" :icon="View" @click="openFullDetails">Full details</el-button>
          </div>
        </div>
      </template>

      <el-skeleton v-if="loading" :rows="6" animated />

      <el-empty
        v-else-if="notFound"
        :description="isHistory ? 'This history record could not be found' : 'This settlement could not be found'"
      />

      <template v-else>
        <el-alert
          v-if="deletion"
          type="error"
          :closable="false"
          show-icon
          class="block"
          :title="`${deletion.kind} by ${deletion.by} on ${formatDate(deletion.at)}`"
          :description="deletion.mergedInto
            ? `Merged into ${deletion.mergedInto}. The details below are the record as it was before the merge.`
            : 'The details below are the record as it was before deletion. The settlement itself no longer exists.'"
        />

        <el-alert
          v-else-if="status === 'Rejected'"
          type="warning"
          :closable="false"
          show-icon
          class="block"
          :title="record?.reviewedAt ? `Rejected on ${formatDate(record.reviewedAt)}` : 'Previously rejected'"
          :description="record?.reject_msg || 'No reason was recorded.'"
        />

        <el-alert
          v-else-if="!decidable"
          type="info"
          :closable="false"
          show-icon
          class="block"
          :title="`This settlement is ${status.toLowerCase()} — there is nothing to review.`"
        />

        <el-descriptions
          :title="isHistory ? 'Record' : 'Submission'"
          :column="3"
          border
          size="small"
          class="block"
        >
          <el-descriptions-item v-if="!isHistory" label="Submitted by">{{ submittedBy }}</el-descriptions-item>
          <el-descriptions-item :label="isHistory ? 'Created' : 'Date submitted'">
            {{ formatDate(record?.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="Last updated">{{ formatDate(record?.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item v-if="deletion" :label="`${deletion.kind} by`">{{ deletion.by }}</el-descriptions-item>
          <el-descriptions-item v-if="deletion" :label="`Date ${deletion.kind.toLowerCase()}`">
            {{ formatDate(deletion.at) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="deletion?.mergedInto" label="Merged into">
            {{ deletion.mergedInto }}
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="Settlement" :column="3" border size="small" class="block">
          <el-descriptions-item label="Name">{{ record?.name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="Type">{{ typeLabel }}</el-descriptions-item>
          <el-descriptions-item label="Code">{{ record?.code || '—' }}</el-descriptions-item>
          <el-descriptions-item label="County">{{ location.county }}</el-descriptions-item>
          <el-descriptions-item label="Constituency">{{ location.subcounty }}</el-descriptions-item>
          <el-descriptions-item label="Ward">{{ location.ward }}</el-descriptions-item>
          <el-descriptions-item label="Population">{{ formatNumber(record?.population) }}</el-descriptions-item>
          <el-descriptions-item label="Area (Ha)">{{ formatNumber(record?.area) }}</el-descriptions-item>
          <el-descriptions-item label="Boundary">
            <el-tag :type="record?.geom ? 'success' : 'info'" size="small">
              {{ record?.geom ? 'Defined' : 'Not defined' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Description" :span="3">
            {{ record?.description || '—' }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="!isHistory" class="block">
          <h3>Attached documents ({{ documents.length }})</h3>
          <el-table v-if="documents.length" :data="documents" size="small" border>
            <el-table-column prop="name" label="Document" min-width="240" show-overflow-tooltip />
            <el-table-column label="Type" width="180">
              <template #default="{ row }">{{ row.document_type?.name || row.type || '—' }}</template>
            </el-table-column>
            <el-table-column label="Uploaded" width="190">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="" width="90" align="center">
              <template #default="{ row }">
                <el-link v-if="row.location" :href="row.location" target="_blank" type="primary">Open</el-link>
                <span v-else>—</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="No documents attached" :image-size="60" />
        </div>
      </template>

      <template v-if="!loading && !notFound" #footer>
        <div class="decision">
          <span v-if="isHistory" class="note">
            This is a {{ (deletion?.kind || 'deletion').toLowerCase() }} record, kept for reference — there is nothing to decide.
          </span>
          <span v-else-if="!canReview" class="note">
            You do not have permission to approve or reject settlements.
          </span>
          <span v-else-if="!decidable" class="note">
            Only pending or rejected settlements can be decided here.
          </span>
          <template v-else>
            <el-button
              type="danger"
              :icon="Close"
              :loading="acting"
              @click="rejectOpen = true"
            >
              Reject
            </el-button>
            <el-button type="success" :icon="Check" :loading="acting" @click="approve">
              Approve
            </el-button>
          </template>
        </div>
      </template>
    </el-card>

    <el-dialog v-model="rejectOpen" title="Reason for rejection" width="420px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        placeholder="What should the submitter correct?"
      />
      <template #footer>
        <el-button @click="rejectOpen = false">Cancel</el-button>
        <el-button type="danger" :loading="acting" @click="confirmReject">Reject settlement</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.review-page {
  padding: 4px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.titles {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.titles h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.head-actions {
  display: flex;
  gap: 8px;
}

.block {
  margin-bottom: 20px;
}

.block h3 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.decision {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.note {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
