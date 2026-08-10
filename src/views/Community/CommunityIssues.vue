<template>
  <div class="community-issues-page">
    <ElCard v-loading="loading">
      <ElRow :gutter="12" class="toolbar-row">
        <ElCol :xs="24" :md="8">
          <h2 class="page-title">Community Issue Reports</h2>
          <p class="page-subtitle">Settlement issues reported from the field (not grievances).</p>
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6">
          <ElSelect
            v-model="filterStatus"
            placeholder="Filter by status"
            clearable
            style="width: 100%"
            @change="loadIssues"
          >
            <ElOption
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6">
          <ElInput
            v-model="search"
            clearable
            placeholder="Search code, description, reporter…"
            @clear="loadIssues"
            @keyup.enter="loadIssues"
          >
            <template #append>
              <ElButton :icon="Search" @click="loadIssues" />
            </template>
          </ElInput>
        </ElCol>
        <ElCol :xs="24" :md="4" class="toolbar-refresh">
          <PermissionWrapper :permissions="'community_issue:create'">
            <ElButton type="primary" :icon="Plus" @click="openCreateDrawer">Report issue</ElButton>
          </PermissionWrapper>
          <ElButton @click="loadIssues">Refresh</ElButton>
        </ElCol>
      </ElRow>

      <ElTable :data="issues" stripe border style="width: 100%; margin-top: 12px">
        <ElTableColumn prop="code" label="Code" min-width="130" />
        <ElTableColumn label="Type" min-width="150">
          <template #default="{ row }">
            {{ issueTypeLabel(row.issue_type) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="Settlement" min-width="160">
          <template #default="{ row }">
            {{ row.settlement?.name || row.settlement_id || '—' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="Description" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.description }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="Severity" width="100">
          <template #default="{ row }">
            <ElTag :type="severityTagType(row.severity)" size="small">
              {{ severityLabel(row.severity) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="Status" min-width="150" sortable>
          <template #default="{ row }">
            <ElTag :type="statusTagType(row.status)" size="small" effect="light" round>
              {{ statusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Reported" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="Actions" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDetails(row)">View</ElButton>
            <PermissionWrapper :permissions="'community_issue:update'">
              <ElButton link type="primary" @click="openStatusDialog(row)">Status</ElButton>
            </PermissionWrapper>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-row">
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 25, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadIssues"
          @current-change="loadIssues"
        />
      </div>
    </ElCard>

    <ElDrawer
      v-model="detailsVisible"
      title="Issue details"
      size="40%"
      destroy-on-close
      @closed="resetDetailsView"
    >
      <ElSteps :active="detailStep" finish-status="success" align-center class="create-steps">
        <ElStep title="Details" />
        <ElStep title="Map" />
      </ElSteps>

      <div v-if="selectedIssue" class="issue-details">
        <div v-show="detailStep === 0">
          <p><strong>Code:</strong> {{ selectedIssue.code }}</p>
          <p><strong>Type:</strong> {{ issueTypeLabel(selectedIssue.issue_type) }}</p>
          <p><strong>Settlement:</strong> {{ selectedIssue.settlement?.name || selectedIssue.settlement_id || '—' }}</p>
          <p><strong>Severity:</strong> {{ severityLabel(selectedIssue.severity) }}</p>
          <p><strong>Status:</strong> {{ statusLabel(selectedIssue.status) }}</p>
          <p><strong>Approval:</strong> {{ selectedIssue.isApproved || 'Pending' }}</p>
          <p><strong>Reporter:</strong> {{ selectedIssue.reporter_name || '—' }}</p>
          <p><strong>Phone:</strong> {{ selectedIssue.reporter_phone || '—' }}</p>
          <p><strong>Reported:</strong> {{ formatDate(selectedIssue.createdAt) }}</p>
          <ElDivider />
          <p><strong>Description</strong></p>
          <p class="issue-description">{{ selectedIssue.description }}</p>
          <template v-if="selectedIssue.resolution_note">
            <ElDivider />
            <p><strong>Action taken / resolution note</strong></p>
            <p class="issue-description">{{ selectedIssue.resolution_note }}</p>
            <p v-if="selectedIssue.resolved_at" class="resolved-at">
              Resolved: {{ formatDate(selectedIssue.resolved_at) }}
            </p>
          </template>

          <template v-if="detailPhotos.length">
            <ElDivider />
            <p><strong>Photos</strong></p>
            <div class="issue-photos">
              <img
                v-for="photo in detailPhotos"
                :key="photo.id"
                :src="photo.url"
                :alt="photo.name"
                class="issue-photo"
                @click="openPhotoPreview(photo.url)"
              />
            </div>
          </template>
        </div>

        <div v-if="detailStep === 1" class="create-step-panel">
          <CommunityIssueLocationPicker
            v-if="detailsVisible && detailLatitude && detailLongitude"
            :visible="detailStep === 1"
              :latitude="detailLatitude"
              :longitude="detailLongitude"
              :settlement-id="selectedIssue.settlement_id"
              :map-height="480"
              readonly
          />
          <ElEmpty v-else description="No location recorded for this issue" />
        </div>
      </div>

      <template #footer>
        <div class="create-drawer-footer">
          <ElButton @click="detailsVisible = false">Close</ElButton>
          <ElButton v-if="detailStep > 0" @click="prevDetailStep">Back</ElButton>
          <ElButton v-if="detailStep < 1" type="primary" @click="nextDetailStep">Next</ElButton>
        </div>
      </template>
    </ElDrawer>

    <ElDrawer
      v-model="createDrawerVisible"
      title="Report community issue"
      size="40%"
      :close-on-click-modal="false"
      destroy-on-close
      @closed="resetCreateForm"
    >
      <ElSteps :active="createStep" finish-status="success" align-center class="create-steps">
        <ElStep title="Settlement" />
        <ElStep title="Location" />
        <ElStep title="Details" />
      </ElSteps>

      <ElForm
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-position="top"
        class="create-form"
      >
        <div v-show="createStep === 0" class="create-step-panel">
          <p class="step-intro">Choose the settlement where this issue was reported.</p>
          <ElFormItem label="County">
            <ElSelect
              v-model="createForm.county_id"
              placeholder="Select county"
              filterable
              :clearable="!isCountyRestricted"
              :disabled="isCountyRestricted"
              style="width: 100%"
              @change="onCreateCountyChange"
            >
              <ElOption
                v-for="county in countyOptions"
                :key="county.id"
                :label="county.name"
                :value="county.id"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="Settlement">
            <ElSelect
              v-model="createForm.settlement_id"
              placeholder="Select settlement"
              filterable
              clearable
              style="width: 100%"
              :loading="createSettlementsLoading"
              :disabled="!createForm.county_id"
            >
              <ElOption
                v-for="settlement in createSettlementOptions"
                :key="settlement.id"
                :label="settlement.label"
                :value="settlement.id"
              />
            </ElSelect>
          </ElFormItem>
        </div>

        <div v-if="createStep === 1" class="create-step-panel">
          <p class="step-intro">Tap the map to mark the exact issue location.</p>
          <CommunityIssueLocationPicker
            v-if="createDrawerVisible"
            :visible="createStep === 1"
            v-model:latitude="createForm.latitude"
            v-model:longitude="createForm.longitude"
            :settlement-id="createForm.settlement_id"
            :map-height="420"
          />
        </div>

        <div v-show="createStep === 2" class="create-step-panel">
          <ElFormItem label="Issue type" prop="issue_type">
            <ElSelect v-model="createForm.issue_type" placeholder="Select issue type" style="width: 100%">
              <ElOption
                v-for="item in issueTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="Description" prop="description">
            <ElInput
              v-model="createForm.description"
              type="textarea"
              :rows="4"
              maxlength="2000"
              show-word-limit
              placeholder="Describe the issue briefly…"
            />
          </ElFormItem>

          <ElFormItem label="Severity">
            <ElSelect v-model="createForm.severity" style="width: 100%">
              <ElOption
                v-for="item in severityOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>

          <ElRow :gutter="12">
            <ElCol :span="12">
              <ElFormItem label="Reporter name">
                <ElInput v-model="createForm.reporter_name" placeholder="Optional" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="Reporter phone">
                <ElInput v-model="createForm.reporter_phone" placeholder="Optional" />
              </ElFormItem>
            </ElCol>
          </ElRow>

          <ElFormItem label="Photo">
            <ElUpload
              v-model:file-list="photoFileList"
              accept="image/*"
              :auto-upload="false"
              :limit="3"
              :on-exceed="handlePhotoExceed"
            >
              <ElButton>Choose file</ElButton>
            </ElUpload>
            <p class="upload-hint">Optional — up to 3 images.</p>
          </ElFormItem>
        </div>
      </ElForm>

      <template #footer>
        <div class="create-drawer-footer">
          <ElButton @click="createDrawerVisible = false">Cancel</ElButton>
          <ElButton v-if="createStep > 0" @click="prevCreateStep">Back</ElButton>
          <ElButton v-if="createStep < 2" type="primary" @click="nextCreateStep">Next</ElButton>
          <ElButton v-else type="primary" :loading="creating" @click="submitCreateIssue">Submit</ElButton>
        </div>
      </template>
    </ElDrawer>

    <ElDialog v-model="photoPreviewVisible" title="Photo" width="720px">
      <img v-if="photoPreviewUrl" :src="photoPreviewUrl" alt="Issue photo" class="photo-preview" />
    </ElDialog>

    <ElDialog v-model="statusDialogVisible" title="Update status" width="520px">
      <ElForm label-position="top">
        <ElFormItem label="Status" required>
          <ElSelect v-model="statusForm.status" placeholder="Select status" style="width: 100%">
            <ElOption
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Action taken / resolution note">
          <ElInput
            v-model="statusForm.resolution_note"
            type="textarea"
            :rows="4"
            placeholder="Describe what action was taken on this issue…"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="statusDialogVisible = false">Cancel</ElButton>
        <ElButton type="primary" :loading="saving" @click="saveStatusUpdate">Save</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { FormInstance, FormRules, UploadUserFile } from 'element-plus'
import {
  ElButton,
  ElCard,
  ElCol,
  ElDialog,
  ElDivider,
  ElDrawer,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElRow,
  ElSelect,
  ElStep,
  ElSteps,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import CommunityIssueLocationPicker from '@/views/Community/CommunityIssueLocationPicker.vue'
import { getListWithoutGeo } from '@/api/counties'
import { getSettlementListByCounty } from '@/api/settlements'
import { getPhoto } from '@/api/summary'
import {
  createCommunityIssue,
  getCommunityIssue,
  getCommunityIssueMetadata,
  listCommunityIssueDocuments,
  listCommunityIssues,
  updateCommunityIssueStatus,
  uploadCommunityIssuePhotos,
} from '@/api/community'
import {
  COMMUNITY_ISSUE_SEVERITIES,
  COMMUNITY_ISSUE_TYPES,
} from '@/constants/communityIssue'
import { getAuthUserInfo } from '@/hooks/web/authStorage'
import { getUserDashboardCountyScope } from '@/utils/roleScope'

type OptionItem = { value: string; label: string }
type DetailPhoto = { id: number; name: string; url: string }

const loading = ref(false)
const saving = ref(false)
const creating = ref(false)
const issues = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(25)
const search = ref('')
const filterStatus = ref('')

const statusOptions = ref<OptionItem[]>([])
const issueTypeOptions = ref<OptionItem[]>([])
const severityOptions = ref<OptionItem[]>([])

const detailsVisible = ref(false)
const detailStep = ref(0)
const selectedIssue = ref<any>(null)
const detailPhotos = ref<DetailPhoto[]>([])
const detailLatitude = ref('')
const detailLongitude = ref('')
const photoPreviewVisible = ref(false)
const photoPreviewUrl = ref('')
const photoFileList = ref<UploadUserFile[]>([])

const statusDialogVisible = ref(false)
const statusTarget = ref<any>(null)
const statusForm = ref({
  status: '',
  resolution_note: '',
})

const createDrawerVisible = ref(false)
const createStep = ref(0)
const createFormRef = ref<FormInstance>()
const countyOptions = ref<Array<{ id: number; name: string }>>([])

const userInfo = getAuthUserInfo()
const countyScope = computed(() => getUserDashboardCountyScope(userInfo))
const isCountyRestricted = computed(() => countyScope.value.isCountyStaff)
const userCountyId = computed(() => countyScope.value.countyIds[0] ?? null)

const createSettlementOptions = ref<Array<{ id: number; label: string }>>([])
const createSettlementsLoading = ref(false)
const createForm = ref({
  county_id: undefined as number | undefined,
  settlement_id: undefined as number | undefined,
  issue_type: '',
  description: '',
  severity: 'medium',
  reporter_name: '',
  reporter_phone: '',
  latitude: '',
  longitude: '',
})

const createRules: FormRules = {
  issue_type: [{ required: true, message: 'Issue type is required', trigger: 'change' }],
  description: [
    { required: true, message: 'Description is required', trigger: 'blur' },
    { min: 3, message: 'Description is too short', trigger: 'blur' },
  ],
}

function parseIssueCoordinates(issue: any) {
  const geom = issue?.geom
  if (!geom) return { latitude: '', longitude: '' }

  let parsed = geom
  if (typeof geom === 'string') {
    try {
      parsed = JSON.parse(geom)
    } catch {
      return { latitude: '', longitude: '' }
    }
  }

  const coords = parsed?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) {
    return { latitude: '', longitude: '' }
  }

  const longitude = Number(coords[0])
  const latitude = Number(coords[1])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { latitude: '', longitude: '' }
  }

  return {
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
  }
}

function revokeDetailPhotoUrls() {
  detailPhotos.value.forEach((photo) => {
    if (photo.url.startsWith('blob:')) {
      URL.revokeObjectURL(photo.url)
    }
  })
  detailPhotos.value = []
}

async function loadDetailPhotos(issueId: number) {
  revokeDetailPhotoUrls()
  try {
    const res: any = await listCommunityIssueDocuments(issueId)
    const payload = res?.data || res
    const docs = payload?.data || payload || []
    const imageDocs = (Array.isArray(docs) ? docs : []).filter((doc: any) =>
      /\.(jpg|jpeg|png|webp|gif)$/i.test(String(doc.name || doc.format || ''))
    )

    const loaded = await Promise.all(
      imageDocs.map(async (doc: any) => {
        const response: any = await getPhoto({ doc_id: doc.id, filename: doc.name })
        const blob = response?.data
        if (!(blob instanceof Blob)) {
          return null
        }
        return {
          id: doc.id,
          name: doc.name,
          url: URL.createObjectURL(blob),
        }
      })
    )
    detailPhotos.value = loaded.filter((photo): photo is DetailPhoto => photo != null)
  } catch (error) {
    console.warn('[CommunityIssues] photo load failed', error)
    detailPhotos.value = []
  }
}

function openPhotoPreview(url: string) {
  photoPreviewUrl.value = url
  photoPreviewVisible.value = true
}

function handlePhotoExceed() {
  ElMessage.warning('You can upload up to 3 photos.')
}

async function uploadIssuePhotos(issueId: number) {
  const files = photoFileList.value
    .map((item) => ({
      name: item.name,
      raw: (item as any).raw as File,
    }))
    .filter((item) => item.raw)

  if (!files.length) return
  await uploadCommunityIssuePhotos(issueId, files)
}

function issueTypeLabel(value?: string) {
  return issueTypeOptions.value.find((item) => item.value === value)?.label || value || '—'
}

function statusLabel(value?: string) {
  return statusOptions.value.find((item) => item.value === value)?.label || value || '—'
}

function severityLabel(value?: string) {
  return severityOptions.value.find((item) => item.value === value)?.label || value || '—'
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function statusTagType(status?: string) {
  const map: Record<string, string> = {
    Submitted: 'info',
    Acknowledged: 'warning',
    InProgress: 'primary',
    Resolved: 'success',
    Rejected: 'danger',
    Closed: '',
  }
  return map[String(status || '')] || 'info'
}

function severityTagType(severity?: string) {
  const map: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
  }
  return map[String(severity || '').toLowerCase()] || 'info'
}

async function loadCounties() {
  try {
    const res: any = await getListWithoutGeo({
      params: {
        pageIndex: 1,
        limit: 100,
        curUser: 1,
        model: 'county',
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC',
      },
    })
    countyOptions.value = res?.data || []
  } catch (error) {
    console.warn('[CommunityIssues] county load failed', error)
    countyOptions.value = []
  }
}

function resetCreateForm() {
  createForm.value = {
    county_id: undefined,
    settlement_id: undefined,
    issue_type: '',
    description: '',
    severity: 'medium',
    reporter_name: '',
    reporter_phone: '',
    latitude: '',
    longitude: '',
  }
  createSettlementOptions.value = []
  photoFileList.value = []
  createStep.value = 0
  createFormRef.value?.clearValidate()
}

function openCreateDrawer() {
  resetCreateForm()
  if (isCountyRestricted.value && userCountyId.value) {
    createForm.value.county_id = userCountyId.value
    loadCreateSettlements(userCountyId.value)
  }
  createDrawerVisible.value = true
}

function prevCreateStep() {
  if (createStep.value > 0) {
    createStep.value -= 1
  }
}

async function nextCreateStep() {
  if (createStep.value === 0) {
    if (!createForm.value.settlement_id) {
      ElMessage.warning('Please select a settlement')
      return
    }
    createStep.value = 1
    return
  }

  if (createStep.value === 1) {
    if (!createForm.value.latitude || !createForm.value.longitude) {
      ElMessage.warning('Please mark the issue location on the map')
      return
    }
    createStep.value = 2
  }
}

function onCreateCountyChange() {
  createForm.value.settlement_id = undefined
  createSettlementOptions.value = []
  if (createForm.value.county_id) {
    loadCreateSettlements(createForm.value.county_id)
  }
}

async function loadCreateSettlements(countyId: number) {
  createSettlementsLoading.value = true
  try {
    const res: any = await getSettlementListByCounty({
      limit: 2000,
      page: 1,
      curUser: 1,
      model: 'settlement',
      filters: ['county_id'],
      filterValues: [[countyId]],
    } as any)
    const data = res?.data ?? []
    createSettlementOptions.value = (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item.id,
      label: item.name || String(item.id),
    }))
  } catch {
    createSettlementOptions.value = []
  } finally {
    createSettlementsLoading.value = false
  }
}

function buildCreateGeom() {
  const lat = String(createForm.value.latitude || '').trim()
  const lng = String(createForm.value.longitude || '').trim()
  if (!lat && !lng) return undefined
  if (!lat || !lng) {
    throw new Error('Provide both latitude and longitude, or leave both empty')
  }
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new Error('Latitude and longitude must be valid numbers')
  }
  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  }
}

async function submitCreateIssue() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return

  creating.value = true
  try {
    const geom = buildCreateGeom()
    const payload: Record<string, unknown> = {
      issue_type: createForm.value.issue_type,
      description: createForm.value.description.trim(),
      severity: createForm.value.severity || 'medium',
      reporter_name: createForm.value.reporter_name?.trim() || undefined,
      reporter_phone: createForm.value.reporter_phone?.trim() || undefined,
    }
    if (createForm.value.settlement_id) {
      payload.settlement_id = createForm.value.settlement_id
    }
    if (geom) {
      payload.geom = geom
    }

    const res: any = await createCommunityIssue(payload)
    const created = res?.data?.data || res?.data || res
    const issueId = created?.id

    if (issueId && photoFileList.value.length) {
      try {
        await uploadIssuePhotos(issueId)
      } catch {
        ElMessage.warning('Issue created, but photo upload failed')
      }
    }

    ElMessage.success('Issue reported successfully')
    createDrawerVisible.value = false
    page.value = 1
    await loadIssues()
  } catch (error: any) {
    ElMessage.error(error?.message || 'Failed to create issue')
  } finally {
    creating.value = false
  }
}

async function loadMetadata() {
  try {
    const res: any = await getCommunityIssueMetadata()
    const data = res?.data || res
    statusOptions.value = data?.statuses || []
    issueTypeOptions.value = data?.issueTypes || []
    severityOptions.value = data?.severities || []
  } catch (error) {
    console.warn('[CommunityIssues] metadata load failed', error)
    issueTypeOptions.value = [...COMMUNITY_ISSUE_TYPES]
    severityOptions.value = [...COMMUNITY_ISSUE_SEVERITIES]
    statusOptions.value = [
      { value: 'Submitted', label: 'Submitted' },
      { value: 'Acknowledged', label: 'Acknowledged' },
      { value: 'InProgress', label: 'In progress' },
      { value: 'Resolved', label: 'Resolved' },
      { value: 'Rejected', label: 'Rejected' },
      { value: 'Closed', label: 'Closed' },
    ]
  }
}

async function loadIssues() {
  loading.value = true
  try {
    const res: any = await listCommunityIssues({
      page: page.value,
      limit: pageSize.value,
      status: filterStatus.value || undefined,
      search: search.value?.trim() || undefined,
      county_id: isCountyRestricted.value ? userCountyId.value : undefined,
    })
    const payload = res?.data || res
    issues.value = payload?.data || []
    total.value = payload?.pagination?.total ?? issues.value.length
  } catch (error: any) {
    ElMessage.error(error?.message || 'Failed to load community issues')
    issues.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function openDetails(row: any) {
  detailStep.value = 0
  selectedIssue.value = row
  detailsVisible.value = true
  detailLatitude.value = ''
  detailLongitude.value = ''
  revokeDetailPhotoUrls()

  try {
    const res: any = await getCommunityIssue({ id: row.id, code: row.code })
    const issue = res?.data?.data || res?.data || row
    selectedIssue.value = issue
    const coords = parseIssueCoordinates(issue)
    detailLatitude.value = coords.latitude
    detailLongitude.value = coords.longitude
    if (issue?.id) {
      await loadDetailPhotos(issue.id)
    }
  } catch {
    const coords = parseIssueCoordinates(row)
    detailLatitude.value = coords.latitude
    detailLongitude.value = coords.longitude
  }
}

function resetDetailsView() {
  detailStep.value = 0
  revokeDetailPhotoUrls()
  detailLatitude.value = ''
  detailLongitude.value = ''
  selectedIssue.value = null
}

function nextDetailStep() {
  if (detailStep.value < 1) {
    detailStep.value += 1
  }
}

function prevDetailStep() {
  if (detailStep.value > 0) {
    detailStep.value -= 1
  }
}

function openStatusDialog(row: any) {
  statusTarget.value = row
  statusForm.value = {
    status: row.status || 'Submitted',
    resolution_note: row.resolution_note || '',
  }
  statusDialogVisible.value = true
}

async function saveStatusUpdate() {
  if (!statusTarget.value || !statusForm.value.status) {
    ElMessage.warning('Status is required')
    return
  }

  saving.value = true
  try {
    await updateCommunityIssueStatus({
      id: statusTarget.value.id,
      code: statusTarget.value.code,
      status: statusForm.value.status,
      resolution_note: statusForm.value.resolution_note?.trim() || undefined,
    })
    ElMessage.success('Issue updated')
    statusDialogVisible.value = false
    await loadIssues()
  } catch (error: any) {
    ElMessage.error(error?.message || 'Failed to update issue')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadMetadata(), loadCounties()])
  if (isCountyRestricted.value && userCountyId.value) {
    createForm.value.county_id = userCountyId.value
  }
  await loadIssues()
})

watch(detailsVisible, (visible) => {
  if (!visible) {
    resetDetailsView()
  }
})
</script>

<style scoped>
.community-issues-page {
  padding: 8px;
}

.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.page-subtitle {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

.toolbar-row {
  align-items: center;
}

.toolbar-refresh {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.issue-details p {
  margin: 0 0 8px;
}

.issue-description {
  white-space: pre-wrap;
  line-height: 1.5;
}

.resolved-at {
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

.upload-hint {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.8125rem;
}

.issue-photos {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.issue-photo {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  cursor: pointer;
}

.photo-preview {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.create-steps {
  margin-bottom: 20px;
}

.create-form {
  padding-bottom: 12px;
}

.create-step-panel {
  min-height: 200px;
}

.step-intro {
  margin: 0 0 14px;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

.create-drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
