<script setup lang="ts">
import { onMounted, ref, computed, reactive, watch } from 'vue'
import { ElButton, ElCard, ElMessage, ElEmpty, ElUpload, ElInput, ElTag, ElSelect, ElOption, ElOptionGroup } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { getPublicUploadShare, submitPublicUpload } from '@/api/settlements'

const route = useRoute()
const router = useRouter()

type ShareState = 'loading' | 'invalid' | 'expired' | 'revoked' | 'limit' | 'valid'

type DocTypeGroup = {
  label: string
  options: { value: number; label: string }[]
}

const state = ref<ShareState>('loading')
const errorMessage = ref('')
const entityType = ref('')
const entityLabel = ref('')
const entityReference = ref('')
const sharedBy = ref('')
const linkLabel = ref('')
const expiresAt = ref<string | null>(null)
const maxUploads = ref<number | null>(null)
const uploadCount = ref(0)
const defaultCategory = ref<number | null>(null)
const documentTypeGroups = ref<DocTypeGroup[]>([])

const uploaderName = ref('')
const fileList = ref<any[]>([])
/** Per-file document type (keyed by el-upload file uid). */
const fileCategories = reactive<Record<string, number | null>>({})
const submitting = ref(false)
const uploadedFiles = ref<{ id: number; name: string }[]>([])
const failedFiles = ref<string[]>([])
const doneUploading = ref(false)

const token = computed(() => route.params.token as string)

const remainingSlots = computed(() => {
  if (maxUploads.value == null) return Infinity
  return Math.max(0, maxUploads.value - uploadCount.value)
})

const entityTypeLabel = computed(() => {
  const map: Record<string, string> = {
    settlement: 'Settlement',
    project: 'Project',
    health_facility: 'Health Facility',
    education_facility: 'Education Facility',
    road: 'Road',
    water_point: 'Water Point',
    sewer: 'Sewer',
    other_facility: 'Facility',
    contractor: 'Contractor',
    piped_water: 'Piped Water Scheme',
    community_hall: 'Community Hall',
    police_station: 'Police Station',
    community_project: 'Community Project'
  }
  return map[entityType.value] || entityType.value
})

const displayEntity = computed(() => entityReference.value || entityLabel.value)

const allCategoriesSelected = computed(() => {
  if (fileList.value.length === 0) return false
  return fileList.value.every((f) => {
    const cat = fileCategories[f.uid]
    return cat != null && Number(cat) > 0
  })
})

const missingCategoryCount = computed(() =>
  fileList.value.filter((f) => !fileCategories[f.uid]).length
)

const formatDate = (dateString: string | null) => {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date(dateString))
}

const syncFileCategories = (files: any[]) => {
  const uids = new Set(files.map((f) => f.uid))
  for (const key of Object.keys(fileCategories)) {
    if (!uids.has(key)) delete fileCategories[key]
  }
  for (const f of files) {
    if (fileCategories[f.uid] == null && defaultCategory.value) {
      fileCategories[f.uid] = defaultCategory.value
    } else if (fileCategories[f.uid] == null) {
      fileCategories[f.uid] = null
    }
  }
}

const fetchShare = async () => {
  state.value = 'loading'
  try {
    const res: any = await getPublicUploadShare(token.value)
    if (res.code === '0000' && res.data) {
      entityType.value = res.data.entityType
      entityLabel.value = res.data.entityLabel
      entityReference.value = res.data.entityReference || ''
      sharedBy.value = res.data.sharedBy
      linkLabel.value = res.data.label
      expiresAt.value = res.data.expiresAt
      maxUploads.value = res.data.maxUploads
      uploadCount.value = res.data.uploadCount
      defaultCategory.value = res.data.defaultCategory ?? null
      documentTypeGroups.value = res.data.documentTypeGroups || []
      if (res.data.expectedUploaderName && !uploaderName.value) {
        uploaderName.value = res.data.expectedUploaderName
      }
      syncFileCategories(fileList.value)
      state.value = remainingSlots.value <= 0 ? 'limit' : 'valid'
    } else {
      state.value = 'invalid'
      errorMessage.value = res.message || 'This link is not available.'
    }
  } catch (error: any) {
    const status = error?.response?.status
    const msg: string | undefined = error?.response?.data?.message
    const lower = (msg || '').toLowerCase()
    if (status === 410 && lower.includes('revoked')) {
      state.value = 'revoked'
    } else if (status === 410 && lower.includes('limit')) {
      state.value = 'limit'
    } else if (status === 410) {
      state.value = 'expired'
    } else {
      state.value = 'invalid'
    }
    errorMessage.value = msg || 'This link is not available.'
  }
}

const handleFileChange = (_file: any, files: any[]) => {
  fileList.value = files
  syncFileCategories(files)
}
const handleFileRemove = (_file: any, files: any[]) => {
  fileList.value = files
  syncFileCategories(files)
}

const removeFile = (file: any) => {
  const next = fileList.value.filter((f) => f.uid !== file.uid)
  fileList.value = next
  delete fileCategories[file.uid]
  syncFileCategories(next)
}

watch(fileList, (files) => syncFileCategories(files), { deep: true })

const submitUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('Select at least one file to upload')
    return
  }
  if (!allCategoriesSelected.value) {
    ElMessage.warning('Select a document type for each file')
    return
  }
  if (fileList.value.length > remainingSlots.value) {
    ElMessage.warning(`This link only allows ${remainingSlots.value} more file(s)`)
    return
  }
  submitting.value = true
  try {
    const formData = new FormData()
    const categories: number[] = []
    for (const f of fileList.value) {
      formData.append('files', f.raw)
      categories.push(Number(fileCategories[f.uid]))
    }
    formData.append('categories', JSON.stringify(categories))
    if (uploaderName.value.trim()) {
      formData.append('uploaderName', uploaderName.value.trim())
    }
    const res: any = await submitPublicUpload(token.value, formData)
    if (res.code === '0000') {
      uploadedFiles.value = res.data?.uploaded || []
      failedFiles.value = res.data?.failed || []
      uploadCount.value += uploadedFiles.value.length
      fileList.value = []
      for (const key of Object.keys(fileCategories)) delete fileCategories[key]
      doneUploading.value = true
      ElMessage.success(res.message || 'Upload complete')
    } else {
      ElMessage.error(res.message || 'Upload failed. Please try again.')
    }
  } catch (error: any) {
    const status = error?.response?.status
    const msg: string | undefined = error?.response?.data?.message
    if (status === 410) {
      await fetchShare()
    }
    ElMessage.error(msg || 'Upload failed. Please try again.')
  } finally {
    submitting.value = false
  }
}

const uploadMore = () => {
  doneUploading.value = false
  uploadedFiles.value = []
  failedFiles.value = []
  if (remainingSlots.value <= 0) {
    state.value = 'limit'
  }
}

const clearSelection = () => {
  fileList.value = []
  for (const key of Object.keys(fileCategories)) delete fileCategories[key]
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  fetchShare()
})
</script>

<template>
  <div class="upload-share-page bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 px-2 sm:px-6">
    <div class="upload-share-container container mx-auto my-2 sm:my-8 max-w-full sm:max-w-2xl">
      <el-card v-loading="state === 'loading'" class="upload-share-card p-2 sm:p-6">
        <template #header>
          <div class="upload-share-header flex items-center space-x-2 sm:space-x-3">
            <img src="/gok.png" alt="Logo" class="upload-share-logo w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
            <h2 class="upload-share-title text-base sm:text-xl font-bold truncate">KesMIS — Upload Documents</h2>
          </div>
        </template>

        <!-- Valid link: upload form -->
        <div v-if="state === 'valid' && !doneUploading">
          <div class="upload-info-box mb-3 sm:mb-5 rounded-lg border border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-xs sm:text-sm">
            <p class="mb-1">
              You've been invited to upload documents for
              <strong v-if="displayEntity">{{ displayEntity }}</strong>
              <strong v-else>{{ entityTypeLabel }}: {{ entityLabel }}</strong>
            </p>
            <p v-if="sharedBy" class="text-gray-500 dark:text-gray-400 mb-1">Shared by {{ sharedBy }}</p>
            <p v-if="linkLabel" class="text-gray-500 dark:text-gray-400 mb-1">{{ linkLabel }}</p>
            <p class="text-gray-500 dark:text-gray-400">
              <span v-if="expiresAt">Link valid until {{ formatDate(expiresAt) }}</span>
              <span v-if="maxUploads != null"> · {{ remainingSlots }} of {{ maxUploads }} upload(s) remaining</span>
            </p>
          </div>

          <el-upload
            multiple
            :auto-upload="false"
            :show-file-list="false"
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            class="upload-share-select"
          >
            <el-button type="primary" plain class="upload-share-select-btn">
              <Icon icon="material-symbols:attach-file" class="mr-1" />
              Select files
            </el-button>
          </el-upload>

          <div v-if="fileList.length" class="file-type-list mt-3 sm:mt-4">
            <p class="file-type-list__title">
              Selected files
              <span class="file-type-list__hint">choose a document type for each</span>
            </p>
            <div class="file-type-list__items">
              <div
                v-for="file in fileList"
                :key="file.uid"
                class="file-type-row"
                :class="{ 'file-type-row--missing': !fileCategories[file.uid] }"
              >
                <div class="file-type-row__name" :title="file.name">{{ file.name }}</div>
                <el-select
                  v-model="fileCategories[file.uid]"
                  filterable
                  clearable
                  placeholder="Document type *"
                  class="file-type-row__select"
                >
                  <el-option-group
                    v-for="group in documentTypeGroups"
                    :key="group.label"
                    :label="group.label"
                  >
                    <el-option
                      v-for="opt in group.options"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-option-group>
                </el-select>
                <el-button
                  type="danger"
                  plain
                  circle
                  size="small"
                  class="file-type-row__remove"
                  aria-label="Remove file"
                  @click="removeFile(file)"
                >
                  <Icon icon="material-symbols:close" />
                </el-button>
              </div>
            </div>
            <p v-if="missingCategoryCount > 0" class="file-type-list__warning">
              {{ missingCategoryCount }} file{{ missingCategoryCount === 1 ? '' : 's' }} still need a document type
            </p>
          </div>

          <el-input
            v-model="uploaderName"
            placeholder="Your name or a note (optional)"
            class="mt-3 sm:mt-4"
            maxlength="255"
          />

          <div class="upload-share-actions mt-3 sm:mt-4">
            <el-button
              type="primary"
              class="upload-share-submit"
              :loading="submitting"
              :disabled="fileList.length === 0 || !allCategoriesSelected"
              @click="submitUpload"
            >
              Upload {{ fileList.length ? `(${fileList.length})` : '' }}
            </el-button>
            <el-button
              plain
              class="upload-share-clear"
              :disabled="fileList.length === 0 || submitting"
              @click="clearSelection"
            >
              Clear
            </el-button>
          </div>
        </div>

        <!-- Just finished uploading -->
        <div v-else-if="doneUploading" class="upload-share-done text-center py-4 sm:py-6">
          <Icon icon="material-symbols:check-circle-outline" width="40" class="upload-share-done-icon mx-auto mb-2 sm:mb-3 text-green-600" />
          <p class="font-semibold mb-2">
            {{ uploadedFiles.length }} file{{ uploadedFiles.length === 1 ? '' : 's' }} uploaded successfully
          </p>
          <ul class="text-sm text-gray-600 dark:text-gray-400 mb-3 list-none">
            <li v-for="f in uploadedFiles" :key="f.id">{{ f.name }}</li>
          </ul>
          <p v-if="failedFiles.length" class="text-sm text-red-600 mb-3">
            Failed to upload: {{ failedFiles.join(', ') }}
          </p>
          <el-button v-if="remainingSlots > 0" type="primary" plain @click="uploadMore">
            Upload more files
          </el-button>
          <p v-else class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            This link has reached its upload limit. You can close this page.
          </p>
        </div>

        <!-- Error / blocked states -->
        <el-empty v-else-if="state !== 'loading'" class="upload-share-empty py-4 sm:py-6">
          <template #description>
            <el-tag v-if="state === 'expired'" type="warning" class="mb-2">Link expired</el-tag>
            <el-tag v-else-if="state === 'revoked'" type="danger" class="mb-2">Link revoked</el-tag>
            <el-tag v-else-if="state === 'limit'" type="info" class="mb-2">Upload limit reached</el-tag>
            <p>{{ errorMessage || 'This link is not available.' }}</p>
          </template>
          <el-button type="primary" plain @click="goBack">Go to homepage</el-button>
        </el-empty>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.upload-share-page {
  height: 100%;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  box-sizing: border-box;
  padding-bottom: 24px;
}

.upload-share-card :deep(.el-card__header) {
  padding: 10px 12px;
}

.upload-share-card :deep(.el-card__body) {
  padding: 12px;
}

.upload-info-box {
  background-color: rgba(0, 0, 0, 0.02);
}

html.dark .upload-info-box {
  background-color: rgba(255, 255, 255, 0.04);
}

.upload-share-select {
  display: block;
}

.upload-share-select :deep(.el-upload) {
  width: 100%;
}

.upload-share-select-btn {
  width: 100%;
}

.upload-share-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.upload-share-submit {
  flex: 1;
  min-width: 0;
}

.upload-share-clear {
  flex-shrink: 0;
}

.file-type-list {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 10px;
}

.file-type-list__title {
  margin: 0 0 8px;
  font-weight: 600;
  font-size: 13px;
}

.required-mark {
  color: var(--el-color-danger);
}

.file-type-list__hint {
  font-weight: normal;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.file-type-list__items {
  margin: 0 -4px;
  padding: 0 4px;
}

.file-type-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.file-type-row:last-child {
  border-bottom: none;
}

.file-type-list__items .file-type-row:last-child {
  padding-bottom: 6px;
}

.file-type-row--missing {
  background: rgba(var(--el-color-warning-rgb), 0.06);
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
}

.file-type-row__name {
  font-size: 12px;
  word-break: break-all;
  color: var(--el-text-color-primary);
}

.file-type-row__select {
  width: 100%;
}

.file-type-row__remove {
  flex-shrink: 0;
}

.file-type-list__warning {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--el-color-warning);
}

@media (max-width: 639px) {
  .upload-share-page {
    padding-left: 8px;
    padding-right: 8px;
    padding-bottom: 32px;
  }

  .upload-share-container {
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .upload-share-card :deep(.el-card__header) {
    padding: 8px 10px;
  }

  .upload-share-card :deep(.el-card__body) {
    padding: 10px;
  }

  .upload-share-submit {
    min-height: 36px;
  }

  .upload-share-done-icon {
    width: 36px !important;
    height: 36px;
  }

  .upload-share-empty :deep(.el-empty__image) {
    width: 72px;
  }

  .upload-share-empty :deep(.el-empty__description) {
    margin-top: 8px;
  }

  .upload-info-box p {
    margin-bottom: 4px;
  }

  .upload-info-box p:last-child {
    margin-bottom: 0;
  }
}

@media (min-width: 640px) {
  .upload-share-card :deep(.el-card__header) {
    padding: 14px 16px;
  }

  .upload-share-card :deep(.el-card__body) {
    padding: 20px;
  }

  .file-type-list {
    padding: 12px;
  }

  .file-type-list__title {
    margin: 0 0 10px;
    font-size: 14px;
  }

  .file-type-list__hint {
    font-size: 12px;
    margin-left: 6px;
  }

  .file-type-row {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
  }

  .file-type-row__name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
  }

  .file-type-row__select {
    flex: 0 0 220px;
    width: 220px;
  }

  .upload-share-submit {
    min-height: 40px;
  }
}
</style>
