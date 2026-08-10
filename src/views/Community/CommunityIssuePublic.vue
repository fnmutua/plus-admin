<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElStep,
  ElSteps,
  ElTag,
} from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { getPublicCommunityIssue } from '@/api/community'
import { communityIssueTypeLabel } from '@/constants/communityIssue'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Community Issue Status | KeSMIS',
  meta: [
    {
      name: 'description',
      content: 'Track the status of your community issue report with KeSMIS using your reference code.',
    },
  ],
})

const STATUS_STEPS = [
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Acknowledged', label: 'Acknowledged' },
  { value: 'InProgress', label: 'In progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
]

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const issueFound = ref(true)
const showLookup = ref(false)

const lookupForm = ref({
  code: '',
  phone_number: '',
})

const issue = ref({
  id: null as number | null,
  code: '',
  issue_type_label: '',
  description: '',
  severity: '',
  status: '',
  resolution_note: '',
  reporter_name: '',
  reporter_phone_masked: '',
  settlement: null as { name: string } | null,
  county: null as { name: string } | null,
  createdAt: '',
  updatedAt: '',
  resolved_at: '',
})

const statusStepIndex = computed(() => {
  if (issue.value.status === 'Rejected') return -1
  const idx = STATUS_STEPS.findIndex((step) => step.value === issue.value.status)
  return idx >= 0 ? idx : 0
})

const statusTagType = computed(() => {
  const map: Record<string, string> = {
    Submitted: 'info',
    Acknowledged: 'warning',
    InProgress: 'primary',
    Resolved: 'success',
    Rejected: 'danger',
    Closed: '',
  }
  return map[issue.value.status] || 'info'
})

function formatDate(dateString?: string | null) {
  if (!dateString) return 'N/A'
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

function applyIssueData(data: any) {
  issue.value = {
    id: data.id,
    code: data.code,
    issue_type_label: communityIssueTypeLabel(data.issue_type, data.issue_type_label),
    description: data.description,
    severity: data.severity,
    status: data.status,
    resolution_note: data.resolution_note,
    reporter_name: data.reporter_name,
    reporter_phone_masked: data.reporter_phone_masked,
    settlement: data.settlement,
    county: data.county,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    resolved_at: data.resolved_at,
  }
  issueFound.value = true
  showLookup.value = false
}

function extractIssuePayload(res: any) {
  return res?.data?.code ? res.data : res?.data?.data ?? res?.data ?? null
}

async function fetchById(id: string | number) {
  loading.value = true
  issueFound.value = true
  try {
    const res: any = await getPublicCommunityIssue({ id: Number(id) })
    const payload = extractIssuePayload(res)
    if (!payload?.code) {
      issueFound.value = false
      return
    }
    applyIssueData(payload)
  } catch {
    issueFound.value = false
    ElMessage.error('Could not load this issue report')
  } finally {
    loading.value = false
  }
}

async function lookupIssue() {
  const code = lookupForm.value.code.trim()
  const phone = lookupForm.value.phone_number.trim()
  if (!code || !phone) {
    ElMessage.warning('Enter your reference code and phone number')
    return
  }

  loading.value = true
  issueFound.value = true
  try {
    const res: any = await getPublicCommunityIssue({ code, phone_number: phone })
    const payload = extractIssuePayload(res)
    if (!payload?.code) {
      issueFound.value = false
      return
    }
    applyIssueData(payload)
    if (payload.id) {
      router.replace({ name: 'CommunityIssuePublic', params: { id: String(payload.id) } })
    }
  } catch {
    issueFound.value = false
    ElMessage.error('No issue found for that code and phone number')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/landing')
}

onMounted(() => {
  const id = route.params.id
  if (id) {
    fetchById(id as string)
  } else {
    showLookup.value = true
    issueFound.value = false
  }
})
</script>

<template>
  <div class="public-page">
    <ElCard v-loading="loading" class="public-card">
      <template #header>
        <div class="card-header">
          <div>
            <h1 v-if="issueFound && !showLookup" class="title">{{ issue.code }}</h1>
            <h1 v-else class="title">Community Issue Status</h1>
            <p v-if="issueFound && !showLookup" class="subtitle">
              Reported {{ formatDate(issue.createdAt) }}
            </p>
          </div>
          <ElButton type="primary" plain :icon="Back" @click="goBack">Home</ElButton>
        </div>
      </template>

      <div v-if="showLookup && !issueFound" class="lookup-panel">
        <p class="lookup-intro">
          Enter your reference code and the phone number you used when reporting to view the latest status.
        </p>
        <ElForm label-position="top" @submit.prevent="lookupIssue">
          <ElFormItem label="Reference code">
            <ElInput v-model="lookupForm.code" placeholder="CI-2026-0001" />
          </ElFormItem>
          <ElFormItem label="Phone number">
            <ElInput v-model="lookupForm.phone_number" placeholder="2547XXXXXXXX" />
          </ElFormItem>
          <ElButton type="primary" native-type="submit" :loading="loading" style="width: 100%">
            Check status
          </ElButton>
        </ElForm>
      </div>

      <ElEmpty v-else-if="!issueFound" description="Issue report not found" />

      <div v-else class="issue-body">
        <div class="status-panel">
          <div class="status-row">
            <span class="status-label">Current status</span>
            <ElTag :type="statusTagType as any" size="large">{{ issue.status }}</ElTag>
          </div>

          <ElSteps
            v-if="issue.status !== 'Rejected'"
            :active="statusStepIndex"
            finish-status="success"
            align-center
            class="status-steps"
          >
            <ElStep v-for="step in STATUS_STEPS" :key="step.value" :title="step.label" />
          </ElSteps>

          <p v-else class="rejected-note">
            This report was reviewed and marked as rejected. Contact support if you need more information.
          </p>

          <p class="updated-note">Last updated {{ formatDate(issue.updatedAt) }}</p>
        </div>

        <ElDescriptions title="Report details" :column="1" border class="details-block">
          <ElDescriptionsItem label="Issue type">
            {{ issue.issue_type_label || 'N/A' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Severity">
            {{ issue.severity || 'N/A' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Settlement">
            {{ issue.settlement?.name || 'N/A' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="County">
            {{ issue.county?.name || 'N/A' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Reporter">
            {{ issue.reporter_name || 'N/A' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Phone">
            {{ issue.reporter_phone_masked || 'N/A' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Description">
            {{ issue.description || 'N/A' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="issue.resolution_note" label="Resolution note">
            {{ issue.resolution_note }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="issue.resolved_at" label="Resolved on">
            {{ formatDate(issue.resolved_at) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
.public-page {
  min-height: 100vh;
  padding: 2rem 1rem 3rem;
  background: var(--el-bg-color-page, #f5f7fa);
}

.public-card {
  max-width: 880px;
  margin: 0 auto;
  border-radius: 16px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.lookup-panel {
  max-width: 420px;
  margin: 0 auto;
}

.lookup-intro {
  margin: 0 0 1.25rem;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.issue-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-panel {
  padding: 1.25rem;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.status-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.status-steps {
  margin-top: 0.5rem;
}

.updated-note,
.rejected-note {
  margin: 1rem 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}

.details-block {
  margin-top: 0.25rem;
}

@media (max-width: 640px) {
  .public-page {
    padding: 1rem 0.75rem 2rem;
  }

  .card-header {
    flex-direction: column;
  }

  .status-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
