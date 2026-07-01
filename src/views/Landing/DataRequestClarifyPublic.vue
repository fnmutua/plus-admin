<template>
  <div class="drc-page">
    <el-card v-loading="loading" class="drc-card">
      <template #header>
        <div class="drc-header">
          <img src="/gok.png" alt="Logo" class="drc-logo" @error="(e: any) => (e.target.style.display = 'none')" />
          <div>
            <h2 class="drc-title">KeSMIS — Data Request Clarifications</h2>
            <p v-if="requestCode" class="drc-sub">Reference: {{ requestCode }}</p>
          </div>
        </div>
      </template>

      <el-empty v-if="!loading && error" :description="error" :image-size="80">
        <template #image>
          <Icon icon="mdi:link-off" width="80" style="color: var(--el-color-danger)" />
        </template>
      </el-empty>

      <template v-else-if="!loading && !error">
        <el-alert
          v-if="expiresAt"
          :type="isExpired ? 'error' : 'info'"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        >
          <template #default>
            <span v-if="isExpired">This clarification link has expired. Contact KeSMIS support.</span>
            <span v-else>Link valid until {{ formatDate(expiresAt) }}</span>
          </template>
        </el-alert>

        <p v-if="requesterName" class="drc-greeting">
          Hello <strong>{{ requesterName }}</strong>, please review the messages below and respond if clarification is requested.
        </p>

        <div v-if="messages.length" ref="threadRef" class="drc-thread">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="drc-msg"
            :class="msg.author_type === 'requester' ? 'drc-msg--requester' : 'drc-msg--reviewer'"
          >
            <div class="drc-msg-meta">
              <span class="drc-msg-author">{{ msg.author_name || (msg.author_type === 'requester' ? 'You' : 'KeSMIS Team') }}</span>
              <span class="drc-msg-time">{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <div class="drc-msg-body">{{ msg.body }}</div>
          </div>
        </div>

        <el-empty v-else description="No messages yet." :image-size="64" />

        <div v-if="!isExpired && canReply" class="drc-reply">
          <el-divider content-position="left">Your response</el-divider>
          <el-input
            v-model="replyText"
            type="textarea"
            :rows="4"
            placeholder="Type your clarification response here…"
            maxlength="4000"
            show-word-limit
          />
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!replyText.trim()"
            style="margin-top: 12px"
            @click="submitReply"
          >
            Submit response
          </el-button>
        </div>

        <el-alert
          v-else-if="!isExpired && clarificationStatus === 'resolved'"
          type="success"
          :closable="false"
          show-icon
          title="Clarifications closed"
          description="This clarification thread has been marked as resolved. No further response is needed."
          style="margin-top: 16px"
        />
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElCard, ElEmpty, ElAlert, ElButton, ElInput, ElDivider, ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import {
  getPublicClarification,
  postPublicClarificationReply,
  type DataRequestMessage
} from '@/api/data-request'

const route = useRoute()

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const requestCode = ref('')
const requesterName = ref('')
const expiresAt = ref<string | null>(null)
const clarificationStatus = ref('none')
const messages = ref<DataRequestMessage[]>([])
const replyText = ref('')
const threadRef = ref<HTMLElement | null>(null)

const isExpired = computed(() =>
  expiresAt.value ? new Date(expiresAt.value).getTime() < Date.now() : false
)

const canReply = computed(() =>
  !isExpired.value && clarificationStatus.value !== 'resolved'
)

const scrollThreadToBottom = async () => {
  await nextTick()
  if (threadRef.value) {
    threadRef.value.scrollTop = threadRef.value.scrollHeight
  }
}

const loadThread = async () => {
  const token = route.params.token as string
  loading.value = true
  error.value = ''
  try {
    const res = await getPublicClarification(token)
    if (res.code === '0000') {
      requestCode.value = res.results?.code || ''
      requesterName.value = res.results?.name || ''
      expiresAt.value = res.results?.expires_at || null
      clarificationStatus.value = res.results?.clarification_status || 'none'
      messages.value = res.results?.messages || []
      await scrollThreadToBottom()
    } else {
      error.value = res.message || 'Could not load clarifications'
    }
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 410) error.value = 'This clarification link has expired.'
    else if (status === 404) error.value = 'Link not found or invalid.'
    else error.value = 'Failed to load clarifications. Please try again.'
  } finally {
    loading.value = false
  }
}

const submitReply = async () => {
  const token = route.params.token as string
  const body = replyText.value.trim()
  if (!body) return

  submitting.value = true
  try {
    const res = await postPublicClarificationReply(token, body)
    if (res.code === '0000') {
      if (res.results?.message) messages.value.push(res.results.message)
      clarificationStatus.value = res.results?.clarification_status || 'awaiting_reviewer'
      replyText.value = ''
      ElMessage.success('Your response has been submitted.')
      await scrollThreadToBottom()
    } else {
      ElMessage.error(res.message || 'Failed to submit response')
    }
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 410) ElMessage.error('Link expired')
    else ElMessage.error(e?.response?.data?.message || 'Failed to submit response')
  } finally {
    submitting.value = false
  }
}

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

const formatDateTime = (d: string) =>
  d
    ? new Date(d).toLocaleString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : ''

onMounted(loadThread)
</script>

<style scoped>
.drc-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
}

.drc-card {
  width: 100%;
  max-width: 720px;
}

.drc-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.drc-logo {
  height: 56px;
  flex-shrink: 0;
}

.drc-title {
  margin: 0 0 2px;
  font-size: 1.1rem;
  font-weight: 700;
}

.drc-sub {
  margin: 0;
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}

.drc-greeting {
  margin: 0 0 16px;
  font-size: 0.95rem;
  color: var(--el-text-color-regular);
}

.drc-thread {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 260px;
  overflow-y: auto;
  padding: 4px 2px 12px;
  margin-bottom: 8px;
}

.drc-msg {
  max-width: 88%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
}

.drc-msg--reviewer {
  align-self: flex-start;
  background: #ecf5ff;
  border-color: #d9ecff;
}

.drc-msg--requester {
  align-self: flex-end;
  background: #f0f9eb;
  border-color: #e1f3d8;
}

.drc-msg-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}

.drc-msg-author {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.drc-msg-body {
  font-size: 0.92rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.drc-reply {
  margin-top: 8px;
}
</style>
