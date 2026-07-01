<template>
  <div class="drd-page" v-loading="pageLoading">
    <el-card class="drd-shell-card" shadow="never">
      <!-- Back + title bar -->
      <div class="drd-topbar">
        <el-button text :icon="ArrowLeft" @click="router.push('/admin/data-requests')">
          Data Requests
        </el-button>
        <div class="drd-topbar-right" v-if="request">
        <el-tag :type="statusTag(overallStatus)" effect="plain" size="large">
            {{ overallStatus }}
          </el-tag>
          <span class="drd-code">{{ request.code }}</span>
        </div>
      </div>

      <template v-if="request">
        <el-tabs v-model="activeTab" class="drd-tabs" type="border-card">
          <el-tab-pane name="details">
            <template #label>
              <span class="drd-tab-label">
                <Icon icon="mdi:database-outline" width="18" class="drd-tab-label-icon" />
                Data request
              </span>
            </template>
            <div class="drd-tab-panel">

          <!-- Requester card -->
          <el-card class="drd-card" shadow="never">
            <template #header>
              <div class="card-title card-title-toggle" @click="toggleSection('requester')">
                <Icon icon="mdi:account-details-outline" width="18" />
                Requester Details
                <Icon :icon="sectionsOpen.requester ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="16" class="card-chevron" />
              </div>
            </template>
            <div v-show="sectionsOpen.requester" class="drd-fields drd-fields-2">
              <div class="drd-field drd-field-span-2"><span class="drd-label">Full Name:</span><span class="drd-value">{{ request.name || '—' }}</span></div>
              <div class="drd-field"><span class="drd-label">Organization:</span><span class="drd-value">{{ request.organization || '—' }}</span></div>
              <div class="drd-field"><span class="drd-label">Position:</span><span class="drd-value">{{ request.position || '—' }}</span></div>
              <div v-if="request.work_area" class="drd-field"><span class="drd-label">Work Area:</span><span class="drd-value">{{ request.work_area }}</span></div>
              <div class="drd-field"><span class="drd-label">Email:</span><a class="drd-value" :href="`mailto:${request.email}`">{{ request.email }}</a></div>
              <div class="drd-field"><span class="drd-label">Phone:</span><span class="drd-value">{{ request.phone || '—' }}</span></div>
              <div v-if="request.mailing_address" class="drd-field drd-field-span-2"><span class="drd-label">Address:</span><span class="drd-value">{{ request.mailing_address }}</span></div>
              <div class="drd-field drd-field-span-2"><span class="drd-label">Submitted:</span><span class="drd-value">{{ formatDate(request.createdAt) }}</span></div>
            </div>
          </el-card>

          <!-- Data request details card -->
          <el-card class="drd-card" shadow="never">
            <template #header>
              <div class="card-title card-title-toggle" @click="toggleSection('requestDetails')">
                <Icon icon="mdi:database-search-outline" width="18" />
                Data Request Details
                <Icon :icon="sectionsOpen.requestDetails ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="16" class="card-chevron" />
              </div>
            </template>
            <div v-show="sectionsOpen.requestDetails" class="drd-fields">
              <div class="drd-field"><span class="drd-label">Description of Data:</span><span class="drd-value">{{ request.data_description || '—' }}</span></div>
              <div class="drd-field"><span class="drd-label">Intended Use:</span><span class="drd-value">{{ request.intended_use || '—' }}</span></div>
              <div v-if="request.how_data_used" class="drd-field"><span class="drd-label">How Data Will Be Used:</span><span class="drd-value">{{ request.how_data_used }}</span></div>
              <div v-if="request.data_classification?.length" class="drd-field">
                <span class="drd-label">Classification:</span>
                <el-tag v-for="c in request.data_classification" :key="c" size="small" style="margin-right:4px">{{ c }}</el-tag>
              </div>
              <div v-if="request.geographic_scope" class="drd-field"><span class="drd-label">Geographic Scope:</span><span class="drd-value">{{ request.geographic_scope }}</span></div>
              <div v-if="request.requested_county != null" class="drd-field">
                <span class="drd-label">County:</span>
                <span class="drd-value">{{ requestedCountyLabel }}</span>
              </div>
              <div v-if="request.requested_subcounty != null" class="drd-field">
                <span class="drd-label">Subcounty:</span>
                <span class="drd-value">{{ requestedSubcountyLabel }}</span>
              </div>
              <div class="drd-field"><span class="drd-label">Will Data Be Shared?:</span><span class="drd-value">{{ request.data_shared ? 'Yes' : 'No' }}</span></div>
              <div v-if="request.sharing_details" class="drd-field"><span class="drd-label">Sharing Details:</span><span class="drd-value">{{ request.sharing_details }}</span></div>
              <div v-if="request.dissemination_plan" class="drd-field"><span class="drd-label">Dissemination Plan:</span><span class="drd-value">{{ request.dissemination_plan }}</span></div>
              <div v-if="request.data_made_public" class="drd-field"><span class="drd-label">Made Public?:</span><span class="drd-value">{{ request.data_made_public }}</span></div>
              <div v-if="request.heard_about" class="drd-field"><span class="drd-label">Heard About KeSMIS:</span><span class="drd-value">{{ request.heard_about }}</span></div>
            </div>
          </el-card>

          <!-- Declaration card -->
          <el-card class="drd-card" shadow="never">
            <template #header>
              <div class="card-title card-title-toggle" @click="toggleSection('declaration')">
                <Icon icon="mdi:file-sign" width="18" />
                Declaration
                <Icon :icon="sectionsOpen.declaration ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="16" class="card-chevron" />
              </div>
            </template>
            <div v-show="sectionsOpen.declaration" class="drd-fields drd-fields-2">
              <div class="drd-field"><span class="drd-label">Declaration Name:</span><span class="drd-value">{{ request.declaration_name || '—' }}</span></div>
              <div v-if="request.declaration_date" class="drd-field"><span class="drd-label">Date:</span><span class="drd-value">{{ request.declaration_date }}</span></div>
            </div>
          </el-card>

            </div>
          </el-tab-pane>

          <el-tab-pane name="clarifications">
            <template #label>
              <span class="drd-tab-label">
                <Icon icon="mdi:forum-outline" width="18" class="drd-tab-label-icon" />
                Clarifications
                <el-badge
                  v-if="clarificationAwaitingReviewer"
                  is-dot
                  type="danger"
                  style="margin-left: 6px"
                />
              </span>
            </template>
            <div class="drd-tab-panel">

          <el-alert
            v-if="clarificationStatus === 'awaiting_requester'"
            type="warning"
            :closable="false"
            show-icon
            title="Awaiting requester response"
            description="A clarification question has been sent. The requester has not replied yet."
            style="margin-bottom: 10px"
          />

          <el-card class="drd-card" shadow="never">
            <template #header>
              <div class="card-title">
                <Icon icon="mdi:forum-outline" width="18" />
                Clarification thread
                <el-tag v-if="clarificationStatusLabel" size="small" effect="plain" style="margin-left: 8px">
                  {{ clarificationStatusLabel }}
                </el-tag>
              </div>
            </template>

            <div ref="clarifyThreadRef" class="clarify-thread">
              <el-skeleton v-if="messagesLoading" :rows="3" animated />
              <el-empty v-else-if="!messages.length" description="No clarifications yet" :image-size="52" />
              <div
                v-for="msg in messages"
                v-else
                :key="msg.id"
                class="clarify-msg"
                :class="msg.author_type === 'requester' ? 'clarify-msg--requester' : 'clarify-msg--reviewer'"
              >
                <div class="clarify-msg-meta">
                  <span class="clarify-msg-author">{{ msg.author_name || (msg.author_type === 'requester' ? 'Requester' : 'Reviewer') }}</span>
                  <span class="clarify-msg-time">{{ formatDateTime(msg.createdAt) }}</span>
                </div>
                <div class="clarify-msg-body">{{ msg.body }}</div>
              </div>
            </div>

            <el-divider style="margin: 14px 0" />

            <el-input
              v-model="newClarification"
              type="textarea"
              :rows="3"
              placeholder="Ask the requester for clarification…"
              maxlength="4000"
              show-word-limit
            />
            <div class="clarify-actions">
              <div class="clarify-actions-primary">
                <el-button
                  type="primary"
                  :loading="sendingClarification"
                  :disabled="!newClarification.trim()"
                  @click="sendClarification"
                >
                  Send to requester
                </el-button>
                <el-button
                  v-if="clarifyLink"
                  plain
                  @click="copyClarifyLink"
                >
                  Copy link to clipboard
                </el-button>
              </div>
              <el-button
                v-if="clarificationStatus !== 'none' && clarificationStatus !== 'resolved'"
                plain
                :loading="resolvingClarifications"
                @click="markClarificationsResolved"
              >
                Mark resolved
              </el-button>
            </div>
          </el-card>

            </div>
          </el-tab-pane>

          <el-tab-pane name="review">
            <template #label>
              <span class="drd-tab-label">
                <Icon icon="mdi:gavel" width="18" class="drd-tab-label-icon" />
                Review & approval
              </span>
            </template>
            <div class="drd-tab-panel">

          <el-alert
            v-if="clarificationStatus === 'awaiting_requester'"
            type="warning"
            :closable="false"
            show-icon
            title="Clarification pending"
            description="Waiting for the requester to respond before proceeding may be advisable."
            style="margin-bottom: 10px"
          />

          <!-- Review card -->
          <el-card class="drd-card" shadow="never">
            <template #header>
              <div class="card-title card-title-toggle" @click="toggleSection('review')">
                <Icon icon="mdi:gavel" width="18" />
                Review & Approval
                <el-tag v-if="workflowStageLabel" size="small" effect="plain" :type="workflowStageType" style="margin-left:8px">
                  {{ workflowStageLabel }}
                </el-tag>
                <span v-if="saving" class="drd-save-hint">Saving…</span>
                <span v-else-if="reviewSaved" class="drd-save-hint drd-save-hint--ok">Saved</span>
                <Icon :icon="sectionsOpen.review ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="16" class="card-chevron" />
              </div>
            </template>

            <el-form v-show="sectionsOpen.review" label-position="top" size="small">
              <el-alert
                v-if="dpoRecommendation === 'Rejected'"
                type="error"
                :closable="false"
                show-icon
                title="DPO rejected"
                description="Coordinator cannot approve this request. Confirm rejection or ask for clarifications."
                style="margin-bottom: 12px"
              />
              <el-alert
                v-else-if="dpoRecommendation === 'Pending'"
                type="info"
                :closable="false"
                show-icon
                title="Awaiting DPO review"
                description="The Data Protection Officer must approve before the coordinator can approve."
                style="margin-bottom: 12px"
              />

              <el-row :gutter="16">
                <el-col :xs="24" :md="12">
                  <el-form-item label="Data Protection Officer Recommendation">
                    <el-radio-group v-model="dpoRecommendation">
                      <el-radio-button value="Approved">Approve</el-radio-button>
                      <el-radio-button value="Rejected">Reject</el-radio-button>
                      <el-radio-button value="Pending">Pending</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                  <p v-if="request?.dpo_reviewed_at" class="drd-reviewer-meta">
                    Reviewed by {{ request.dpo_reviewer_name || '—' }}
                    · {{ formatDateTime(request.dpo_reviewed_at) }}
                  </p>
                  <el-form-item label="DPO Review Notes">
                    <el-input
                      v-model="dpoReviewNotes"
                      type="textarea"
                      :rows="4"
                      placeholder="Recommendation notes from Data Protection Officer"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="Coordinator Approval">
                    <el-radio-group v-model="coordinatorApprovalStatus">
                      <el-radio-button value="Approved" :disabled="!dpoApprovedForCoordinator">
                        Approve
                      </el-radio-button>
                      <el-radio-button value="Rejected">Reject</el-radio-button>
                      <el-radio-button value="Pending">Pending</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                  <p v-if="request?.coordinator_approved_at" class="drd-reviewer-meta">
                    Decided by {{ request.coordinator_reviewer_name || '—' }}
                    · {{ formatDateTime(request.coordinator_approved_at) }}
                  </p>
                  <el-form-item label="Coordinator Notes">
                    <el-input
                      v-model="coordinatorApprovalNotes"
                      type="textarea"
                      :rows="4"
                      placeholder="Final approval notes by coordinator"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>

          <!-- Documents card -->
          <el-card class="drd-card" shadow="never">
            <template #header>
              <div class="card-title card-title-toggle" @click="toggleSection('documents')">
                <Icon icon="mdi:file-document-multiple-outline" width="18" />
                Documents
                <el-badge v-if="docs.length" :value="docs.length" type="info" style="margin-left:4px" />
                <Icon :icon="sectionsOpen.documents ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="16" class="card-chevron" />
              </div>
            </template>

            <template v-if="sectionsOpen.documents">
            <div class="doc-toolbar">
              <el-button
                type="primary"
                plain
                size="small"
                :loading="formDocBusy"
                @click="ensureAndDownloadForm"
              >
                <Icon icon="mdi:file-download-outline" width="16" style="margin-right:4px" />
                Download / Generate Request Form
              </el-button>
            </div>
            <el-skeleton v-if="docsLoading" :rows="2" animated />

            <el-empty v-else-if="!docs.length" description="No documents yet" :image-size="52" />

            <!-- Document list -->
            <div v-else class="doc-list">
              <div v-for="doc in docs" :key="doc.id" class="doc-item">
                <Icon :icon="fileIcon(doc.format)" width="28" class="doc-icon" />
                <div class="doc-meta">
                  <span class="doc-name" :title="doc.name">{{ doc.name }}</span>
                  <div class="doc-sub">
                    <el-tag v-if="doc.auto_generated" size="small" type="info" effect="plain">Auto PDF</el-tag>
                    <span v-if="doc.size" class="doc-size">{{ fmtSize(doc.size) }}</span>
                    <span class="doc-date">{{ formatDate(doc.createdAt) }}</span>
                  </div>
                </div>
                <div class="doc-actions">
                  <el-button
                    size="small"
                    type="primary"
                    text
                    :loading="downloadingId === doc.id"
                    title="Download"
                    @click="downloadDoc(doc)"
                  >
                    <Icon icon="mdi:download" width="20" />
                  </el-button>
                  <el-button
                    v-if="!doc.auto_generated"
                    size="small"
                    type="danger"
                    text
                    :loading="deletingId === doc.id"
                    title="Remove"
                    @click="deleteDoc(doc)"
                  >
                    <Icon icon="mdi:delete-outline" width="20" />
                  </el-button>
                </div>
              </div>
            </div>

            <!-- Upload -->
            <el-divider style="margin:12px 0" />
            <div class="upload-row">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :limit="1"
                :on-change="onFileChange"
                :on-exceed="() => ElMessage.warning('Remove the current file first')"
                accept=".pdf,.zip,.doc,.docx,.xlsx,.csv,.geojson,.kml,.kmz,.shp"
                :show-file-list="false"
              >
                <el-button plain size="small">
                  <Icon icon="mdi:paperclip" width="16" style="margin-right:4px" />
                  {{ pendingFile ? pendingFile.name : 'Attach file…' }}
                </el-button>
              </el-upload>
              <template v-if="pendingFile">
                <el-button size="small" type="primary" :loading="uploading" @click="doUpload">
                  Upload
                </el-button>
                <el-button size="small" text @click="clearPending">✕</el-button>
              </template>
            </div>

            <!-- Share: coordinator must approve; need requester-downloadable docs (matches API) -->
            <el-button
              type="success"
              :loading="sharing"
              :disabled="!shareableDocuments.length || docsLoading || saving || !coordinatorApprovedForShare || clarificationBlocksShare"
              style="width:100%; margin-top:12px"
              :title="emailShareButtonTitle"
              @click="shareWithRequester"
            >
              <Icon icon="mdi:email-fast-outline" width="18" style="margin-right:6px" />
              Email Download Link to Requester
            </el-button>

            <!-- Share result -->
            <div v-if="shareLink" class="share-result">
              <el-alert type="success" :closable="false" show-icon title="Email sent — copy link:">
                <template #default>
                  <el-input
                    :model-value="shareLink"
                    readonly
                    size="small"
                    class="share-result-link-input"
                  >
                    <template #append>
                      <el-button @click="copyLink">Copy</el-button>
                    </template>
                  </el-input>
                </template>
              </el-alert>
            </div>
            </template>

          </el-card>

            </div>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  ElCard, ElButton, ElTag,
  ElForm, ElFormItem, ElRadioGroup, ElRadioButton, ElInput,
  ElSkeleton, ElEmpty, ElUpload, ElAlert, ElDivider, ElBadge,
  ElMessage, ElTabs, ElTabPane, ElRow, ElCol
} from 'element-plus'
import { Icon } from '@iconify/vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
  getDataRequestDocuments,
  uploadDataRequestDocument,
  deleteDataRequestDocument,
  downloadDataRequestDocument,
  generateDataRequestFormDocument,
  shareDataRequest,
  getDataRequestMessages,
  postDataRequestMessage,
  updateClarificationStatus,
  type DataRequestMessage
} from '@/api/data-request'
import axios from 'axios'
import { publicAppHashUrl } from '@/config/apiBase'
import { getCountyListApi } from '@/api/counties'
import { getSubCountyAuth } from '@/api/register'

const route = useRoute()
const router = useRouter()
const appStore = useAppStoreWithOut()
const { wsCache } = useCache()
const base = import.meta.env.VITE_APP_HOST || ''

const getToken = () => wsCache.get(appStore.getUserInfo)?.data || ''
const authHeaders = () => ({ 'x-access-token': getToken(), 'Content-Type': 'application/json' })

const requestId = Number(route.params.id)
const activeTab = ref<'details' | 'clarifications' | 'review'>('details')

// ── request ───────────────────────────────────────────────────────────────────
const pageLoading = ref(true)
const request = ref<any>(null)
const requestedCountyLabel = ref('—')
const requestedSubcountyLabel = ref('—')
const dpoRecommendation = ref('Pending')
const dpoReviewNotes = ref('')
const coordinatorApprovalStatus = ref('Pending')
const coordinatorApprovalNotes = ref('')
const saving = ref(false)
const reviewSaved = ref(false)
let reviewSavedTimer: ReturnType<typeof setTimeout> | null = null
/** Skip debounced persist while hydrating the form from the server (avoids duplicate PUTs). */
const reviewSuppressPersist = ref(true)
let persistDebounceTimer: ReturnType<typeof setTimeout> | null = null

const sectionsOpen = ref({
  requester: true,
  requestDetails: false,
  declaration: true,
  review: true,
  documents: true
})

/** Tab 1: Requester ↔ Data request details are exclusive; Declaration toggles on its own. Tab 2: independent. */
const toggleSection = (section: keyof typeof sectionsOpen.value) => {
  if (section === 'declaration') {
    sectionsOpen.value.declaration = !sectionsOpen.value.declaration
    return
  }
  if (section === 'requester' || section === 'requestDetails') {
    const willOpen = !sectionsOpen.value[section]
    sectionsOpen.value[section] = willOpen
    if (willOpen) {
      if (section === 'requester') sectionsOpen.value.requestDetails = false
      else sectionsOpen.value.requester = false
    }
    return
  }
  sectionsOpen.value[section] = !sectionsOpen.value[section]
}

const resolveRequestedLocationLabels = async (rec: any) => {
  requestedCountyLabel.value = '—'
  requestedSubcountyLabel.value = '—'
  const countyId = rec?.requested_county
  const subId = rec?.requested_subcounty
  if (countyId == null && subId == null) return

  try {
    if (countyId != null) {
      const res: any = await getCountyListApi({
        params: {
          pageIndex: 1,
          limit: 200,
          curUser: 1,
          model: 'county',
          searchField: 'name',
          searchKeyword: '',
          sort: 'ASC'
        }
      })
      const counties = res?.data || []
      const c = counties.find((x: any) => Number(x.id) === Number(countyId))
      requestedCountyLabel.value = c?.name ? String(c.name) : `ID ${countyId}`
    }

    if (subId != null && countyId != null) {
      const scRes: any = await getSubCountyAuth({ county: countyId } as any)
      const subList = Array.isArray(scRes) ? scRes : (scRes?.data || [])
      const s = subList.find((x: any) => Number(x.id) === Number(subId))
      requestedSubcountyLabel.value = s?.name ? String(s.name) : `ID ${subId}`
    } else if (subId != null) {
      requestedSubcountyLabel.value = `ID ${subId}`
    }
  } catch {
    if (countyId != null) requestedCountyLabel.value = `ID ${countyId}`
    if (subId != null) requestedSubcountyLabel.value = `ID ${subId}`
  }
}

const loadRequest = async () => {
  reviewSuppressPersist.value = true
  pageLoading.value = true
  try {
    const res = await axios.get(`${base}/api/v1/data-requests/${requestId}`, {
      headers: authHeaders()
    })
    const found = res.data.results
    if (!found) {
      ElMessage.error('Request not found')
      router.push('/admin/data-requests')
      return
    }
    request.value = found
    dpoRecommendation.value = found.dpo_recommendation || 'Pending'
    dpoReviewNotes.value = found.dpo_review_notes || ''
    coordinatorApprovalStatus.value = found.coordinator_approval_status || found.status || 'Pending'
    coordinatorApprovalNotes.value = found.coordinator_approval_notes || ''
    await resolveRequestedLocationLabels(found)
  } catch {
    ElMessage.error('Failed to load request')
    router.push('/admin/data-requests')
  } finally {
    pageLoading.value = false
    await nextTick()
    reviewSuppressPersist.value = false
  }
}

const clearPersistDebounce = () => {
  if (persistDebounceTimer) {
    clearTimeout(persistDebounceTimer)
    persistDebounceTimer = null
  }
}

const schedulePersistReview = () => {
  if (reviewSuppressPersist.value || !request.value) return
  clearPersistDebounce()
  persistDebounceTimer = setTimeout(() => {
    persistDebounceTimer = null
    void persistReview()
  }, 650)
}

const persistReview = async () => {
  saving.value = true
  reviewSaved.value = false
  try {
    const res = await axios.put(
      `${base}/api/v1/data-requests/${requestId}/status`,
      {
        dpo_recommendation: dpoRecommendation.value,
        dpo_review_notes: dpoReviewNotes.value,
        coordinator_approval_status: coordinatorApprovalStatus.value,
        coordinator_approval_notes: coordinatorApprovalNotes.value
      },
      { headers: authHeaders() }
    )
    const found = res.data.results
    if (found) {
      request.value = { ...request.value, ...found }
      dpoRecommendation.value = found.dpo_recommendation || 'Pending'
      dpoReviewNotes.value = found.dpo_review_notes || ''
      coordinatorApprovalStatus.value = found.coordinator_approval_status || found.status || 'Pending'
      coordinatorApprovalNotes.value = found.coordinator_approval_notes || ''
    } else {
      request.value.dpo_recommendation = dpoRecommendation.value
      request.value.dpo_review_notes = dpoReviewNotes.value
      request.value.coordinator_approval_status = coordinatorApprovalStatus.value
      request.value.coordinator_approval_notes = coordinatorApprovalNotes.value
      request.value.status = coordinatorApprovalStatus.value
    }
    request.value.review_notes = coordinatorApprovalNotes.value || dpoReviewNotes.value
    reviewSaved.value = true
    if (reviewSavedTimer) clearTimeout(reviewSavedTimer)
    reviewSavedTimer = setTimeout(() => { reviewSaved.value = false }, 2500)
  } catch (err: any) {
    const msg = err?.response?.data?.message || 'Failed to save review'
    ElMessage.error(msg)
    await loadRequest()
  } finally {
    saving.value = false
  }
}

watch(dpoRecommendation, (dpo) => {
  if (dpo !== 'Approved' && coordinatorApprovalStatus.value === 'Approved') {
    coordinatorApprovalStatus.value = 'Pending'
  }
})

watch(
  () => [
    dpoRecommendation.value,
    dpoReviewNotes.value,
    coordinatorApprovalStatus.value,
    coordinatorApprovalNotes.value
  ],
  () => {
    schedulePersistReview()
  }
)

onBeforeUnmount(() => {
  clearPersistDebounce()
  if (reviewSavedTimer) clearTimeout(reviewSavedTimer)
})

// ── clarifications ────────────────────────────────────────────────────────────
const messages = ref<DataRequestMessage[]>([])
const messagesLoading = ref(false)
const clarificationStatus = ref('none')
const clarifyLink = ref('')
const newClarification = ref('')
const sendingClarification = ref(false)
const resolvingClarifications = ref(false)
const clarifyThreadRef = ref<HTMLElement | null>(null)

const clarificationAwaitingReviewer = computed(() => clarificationStatus.value === 'awaiting_reviewer')

const clarificationStatusLabel = computed(() => {
  const map: Record<string, string> = {
    none: '',
    awaiting_requester: 'Awaiting requester',
    awaiting_reviewer: 'Awaiting reviewer',
    resolved: 'Resolved'
  }
  return map[clarificationStatus.value] || clarificationStatus.value
})

const scrollClarifyThread = async () => {
  await nextTick()
  if (clarifyThreadRef.value) {
    clarifyThreadRef.value.scrollTop = clarifyThreadRef.value.scrollHeight
  }
}

const loadMessages = async () => {
  messagesLoading.value = true
  try {
    const res = await getDataRequestMessages(requestId, getToken())
    messages.value = res.results?.messages || []
    clarificationStatus.value = res.results?.clarification_status || 'none'
    clarifyLink.value = res.results?.clarify_url || ''
    if (request.value) request.value.clarification_status = clarificationStatus.value
    await scrollClarifyThread()
  } catch {
    ElMessage.error('Failed to load clarifications')
  } finally {
    messagesLoading.value = false
  }
}

const sendClarification = async () => {
  const body = newClarification.value.trim()
  if (!body) return
  sendingClarification.value = true
  try {
    const res = await postDataRequestMessage(requestId, body, getToken())
    if (res.results?.message) messages.value.push(res.results.message)
    clarificationStatus.value = res.results?.clarification_status || 'awaiting_requester'
    clarifyLink.value = res.results?.clarify_url || clarifyLink.value
    if (request.value) request.value.clarification_status = clarificationStatus.value
    newClarification.value = ''
    ElMessage.success('Clarification sent to requester')
    await scrollClarifyThread()
  } catch {
    ElMessage.error('Failed to send clarification')
  } finally {
    sendingClarification.value = false
  }
}

const markClarificationsResolved = async () => {
  resolvingClarifications.value = true
  try {
    await updateClarificationStatus(requestId, 'resolved', getToken())
    clarificationStatus.value = 'resolved'
    if (request.value) request.value.clarification_status = 'resolved'
    ElMessage.success('Clarifications marked as resolved')
  } catch {
    ElMessage.error('Failed to update status')
  } finally {
    resolvingClarifications.value = false
  }
}

const copyClarifyLink = async () => {
  if (!clarifyLink.value) return
  try {
    await navigator.clipboard.writeText(clarifyLink.value)
    ElMessage.success('Link copied')
  } catch {
    ElMessage.error('Failed to copy')
  }
}

const formatDateTime = (d: string) =>
  d
    ? new Date(d).toLocaleString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—'

// ── documents ─────────────────────────────────────────────────────────────────
const docs = ref<any[]>([])
const docsLoading = ref(false)
const downloadingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const uploading = ref(false)
const sharing = ref(false)
const formDocBusy = ref(false)
const shareLink = ref('')
const pendingFile = ref<File | null>(null)
const uploadRef = ref()

const loadDocuments = async () => {
  docsLoading.value = true
  try {
    const res = await getDataRequestDocuments(requestId, getToken())
    docs.value = res.results || res.data || []
  } catch {
    ElMessage.error('Failed to load documents')
  } finally {
    docsLoading.value = false
  }
}

/** Same rules as server `isRequesterVisibleDocument` — auto-generated / internal form are not shared. */
const internalFormNameRegex = /data[\s\-_]?request[\s\-_]?form/i
const isRequesterShareableDoc = (doc: any) => {
  const name = String(doc?.name || '')
  if (doc?.auto_generated) return false
  if (internalFormNameRegex.test(name)) return false
  return true
}
const shareableDocuments = computed(() => docs.value.filter(isRequesterShareableDoc))

const onFileChange = (file: any) => { pendingFile.value = file.raw as File }
const clearPending = () => { pendingFile.value = null; uploadRef.value?.clearFiles() }

const doUpload = async () => {
  if (!pendingFile.value) return
  uploading.value = true
  try {
    await uploadDataRequestDocument(requestId, pendingFile.value, getToken())
    ElMessage.success('Document uploaded')
    clearPending()
    await loadDocuments()
  } catch {
    ElMessage.error('Upload failed')
  } finally {
    uploading.value = false
  }
}

const deleteDoc = async (doc: any) => {
  deletingId.value = doc.id
  try {
    await deleteDataRequestDocument(requestId, doc.id, getToken())
    docs.value = docs.value.filter(d => d.id !== doc.id)
  } catch {
    ElMessage.error('Failed to remove document')
  } finally {
    deletingId.value = null
  }
}

const downloadDoc = async (doc: any) => {
  downloadingId.value = doc.id
  try {
    const blob = await downloadDataRequestDocument(requestId, doc.id, getToken())
    const fmt = (doc.format || '').replace(/^\./, '').toLowerCase()
    const stem = (doc.name || 'document').replace(/\.[^.]+$/, '')
    const fileName = fmt ? `${stem}.${fmt}` : doc.name || 'document'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    ElMessage.error('Download failed')
  } finally {
    downloadingId.value = null
  }
}

const getFormDoc = () => docs.value.find((d: any) => d.auto_generated) || null

const ensureAndDownloadForm = async () => {
  formDocBusy.value = true
  try {
    // Force regeneration so latest formatting/logo is always applied.
    await generateDataRequestFormDocument(requestId, getToken(), true)
    await loadDocuments()
    const formDoc = getFormDoc()
    if (!formDoc) {
      ElMessage.error('Unable to find generated form')
      return
    }
    await downloadDoc(formDoc)
  } catch {
    ElMessage.error('Failed to generate/download form')
  } finally {
    formDocBusy.value = false
  }
}

const shareWithRequester = async () => {
  if (!coordinatorApprovedForShare.value) {
    ElMessage.warning('Coordinator must approve this request before you can email the download link.')
    return
  }
  if (!shareableDocuments.value.length) {
    ElMessage.warning('No requester-visible documents to share. Upload an attachment first.')
    return
  }
  sharing.value = true
  shareLink.value = ''
  try {
    const res = await shareDataRequest(requestId, getToken())
    const token = res.results?.token || res.data?.token || res.token
    if (token || res.results?.url) {
      shareLink.value =
        res.results?.url || (token ? publicAppHashUrl(`/dr-share/${token}`) : '')
      ElMessage.success('Email sent to ' + request.value?.email)
    } else {
      ElMessage.warning('Share created but no token returned')
    }
  } catch {
    ElMessage.error('Failed to send share link')
  } finally {
    sharing.value = false
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    ElMessage.success('Link copied')
  } catch {
    ElMessage.error('Failed to copy')
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────
const dpoApprovedForCoordinator = computed(() => dpoRecommendation.value === 'Approved')

const clarificationBlocksShare = computed(
  () => clarificationStatus.value === 'awaiting_requester'
)

const workflowStageLabel = computed(() => {
  const status = request.value?.status || coordinatorApprovalStatus.value
  const dpo = request.value?.dpo_recommendation ?? dpoRecommendation.value
  const coord = request.value?.coordinator_approval_status ?? coordinatorApprovalStatus.value
  if (status === 'Approved') return 'Approved'
  if (status === 'Rejected') return 'Rejected'
  if (dpo === 'Pending') return 'Awaiting DPO'
  if (dpo === 'Rejected') return 'DPO rejected'
  if (coord === 'Pending') return 'Awaiting coordinator'
  return 'In review'
})

const workflowStageType = computed(() => {
  const label = workflowStageLabel.value
  if (label === 'Approved') return 'success'
  if (label === 'Rejected' || label === 'DPO rejected') return 'danger'
  return 'warning'
})

const overallStatus = computed(() => request.value?.coordinator_approval_status || request.value?.status || 'Pending')

/** Persisted coordinator decision only (not draft radios) — share/email must match server. */
const coordinatorApprovedForShare = computed(
  () => (request.value?.coordinator_approval_status || '') === 'Approved'
)

const emailShareButtonTitle = computed(() => {
  if (saving.value) return 'Wait for review changes to finish saving.'
  if (clarificationBlocksShare.value) {
    return 'Resolve clarifications with the requester before sharing data.'
  }
  if ((request.value?.dpo_recommendation || dpoRecommendation.value) !== 'Approved') {
    return 'DPO must approve before you can share data.'
  }
  if (!coordinatorApprovedForShare.value) {
    return 'Set coordinator approval to Approve and wait for changes to save before emailing the link.'
  }
  if (!shareableDocuments.value.length) {
    return 'Add at least one attachment (the internal request form alone cannot be shared).'
  }
  return 'Email the public download link to the requester'
})

const statusTag = (s: string) =>
  s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : 'warning'

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

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
  if (f === 'geojson' || f === 'kml' || f === 'kmz' || f === 'shp') return 'material-symbols:map'
  return 'material-symbols:description'
}

onMounted(() => {
  loadRequest()
  loadDocuments()
  loadMessages()
})
</script>

<style scoped>
.drd-page {
  padding: 12px 12px 24px;
  width: 100%;
  box-sizing: border-box;
}

.drd-shell-card {
  border-radius: 8px;
}

/* Top bar */
.drd-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.drd-topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.drd-code {
  font-size: 1rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.02em;
}

/* Tabs */
.drd-tabs {
  width: 100%;
}
.drd-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}
.drd-tabs :deep(.el-tabs__content) {
  padding: 16px 12px 8px;
}
.drd-tabs :deep(.el-tab-pane) {
  outline: none;
}
.drd-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.drd-tab-label-icon {
  flex-shrink: 0;
  vertical-align: middle;
}
.drd-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

/* Cards */

.drd-card {
  border-radius: 6px;
}

.drd-card :deep(.el-card__header) {
  padding: 10px 12px;
}

.drd-card :deep(.el-card__body) {
  padding: 10px 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--el-text-color-primary);
}

.card-title-toggle {
  cursor: pointer;
}

.card-chevron {
  margin-left: auto;
  color: var(--el-text-color-secondary);
}

.drd-fields {
  display: grid;
  gap: 6px;
}

.drd-fields-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.drd-field {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
  font-size: 0.92rem;
}

.drd-field-span-2 {
  grid-column: span 2;
}

.drd-label {
  color: var(--el-text-color-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.drd-value {
  color: var(--el-text-color-primary);
  min-width: 0;
  word-break: break-word;
}

/* Document list */
.doc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-toolbar {
  margin-bottom: 8px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  transition: border-color 0.2s;
}
.doc-item:hover {
  border-color: var(--el-color-primary-light-5);
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
  font-size: 0.85rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.doc-size,
.doc-date {
  font-size: 0.72rem;
  color: var(--el-text-color-secondary);
}

.doc-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

/* Upload */
.upload-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Share result */
.share-result {
  margin-top: 12px;
}

.share-result-link-input {
  width: 98%;
  max-width: 100%;
  margin-top: 6px;
  box-sizing: border-box;
}

/* Clarifications */
.clarify-thread {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 2px;
}

.clarify-msg {
  max-width: 90%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.clarify-msg--reviewer {
  align-self: flex-start;
  background: #ecf5ff;
}

.clarify-msg--requester {
  align-self: flex-end;
  background: #f0f9eb;
}

.clarify-msg-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
  font-size: 0.72rem;
  color: var(--el-text-color-secondary);
}

.clarify-msg-author {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.clarify-msg-body {
  font-size: 0.88rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.clarify-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.clarify-actions-primary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.drd-save-hint {
  margin-left: 8px;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.drd-save-hint--ok {
  color: var(--el-color-success);
}

.drd-reviewer-meta {
  margin: -4px 0 10px;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}
</style>
