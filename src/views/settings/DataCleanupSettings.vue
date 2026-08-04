<template>
  <div class="data-cleanup-container">
    <ElCard class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>Data Cleanup</h2>
          <p class="subtitle">
            Normalize text field values or review settlement boundary geometry issues.
          </p>
        </div>
      </template>

      <ElTabs v-model="activeTab" class="cleanup-tabs">
        <ElTabPane label="Field values" name="fields">
          <div class="settings-content">
            <ElAlert type="info" :closable="false" show-icon class="intro-alert">
              Only text fields (STRING / TEXT / CHAR / ENUM) can be cleaned.
              Changes update all matching rows in one pass.
            </ElAlert>

            <div class="cleanup-form" v-loading="loadingModels">
          <div class="form-row">
            <label class="form-label">Model</label>
            <ElSelect
              v-model="selectedModel"
              filterable
              clearable
              placeholder="Select a model"
              style="width: 100%; max-width: 420px"
              @change="onModelChange"
            >
              <ElOption
                v-for="m in models"
                :key="m.model"
                :label="`${m.model} (${m.table})`"
                :value="m.model"
              />
            </ElSelect>
          </div>

          <div class="form-row">
            <label class="form-label">Field</label>
            <ElSelect
              v-model="selectedField"
              filterable
              clearable
              :disabled="!selectedModel"
              :loading="loadingFields"
              placeholder="Select a text field"
              style="width: 100%; max-width: 420px"
              @change="onFieldChange"
            >
              <ElOption
                v-for="f in fields"
                :key="f.field"
                :label="`${f.field} (${f.type})`"
                :value="f.field"
              />
            </ElSelect>
          </div>

          <div class="form-row">
            <label class="form-label">Current value(s)</label>
            <ElSelect
              v-model="fromValues"
              multiple
              filterable
              clearable
              collapse-tags
              collapse-tags-tooltip
              :disabled="!selectedField"
              :loading="loadingValues"
              placeholder="Select one or more values to replace"
              style="width: 100%; max-width: 560px"
            >
              <ElOption
                v-for="v in values"
                :key="String(v.value)"
                :label="`${v.label} (${v.count})`"
                :value="v.value"
              />
            </ElSelect>
            <span v-if="fromCount != null" class="hint">
              {{ fromValues.length }} value(s) selected · {{ fromCount }} row(s) match
            </span>
          </div>

          <div class="form-row">
            <label class="form-label">New value</label>
            <ElSelect
              v-model="toValue"
              filterable
              allow-create
              default-first-option
              clearable
              :disabled="!fromValues.length"
              placeholder="Pick existing option or type a new value"
              style="width: 100%; max-width: 560px"
            >
              <ElOption
                v-for="v in toValueOptions"
                :key="`to-${String(v.value)}`"
                :label="`${v.label} (${v.count})`"
                :value="v.value"
              />
            </ElSelect>
          </div>

          <div class="form-actions">
            <ElButton :disabled="!canPreview" :loading="previewing" @click="previewReplace">
              Preview count
            </ElButton>
            <ElButton
              type="primary"
              :disabled="!canReplace"
              :loading="replacing"
              @click="confirmReplace"
            >
              Replace value
            </ElButton>
            <ElButton :disabled="!selectedField || loadingValues" @click="reloadValues">
              Refresh values
            </ElButton>
          </div>

          <div v-if="lastResult" class="result-box">
            <ElAlert
              :type="lastResult.dryRun ? 'warning' : 'success'"
              :closable="false"
              show-icon
            >
              <template #title>
                {{ lastResult.dryRun ? 'Preview' : 'Updated' }}
              </template>
              <p>
                <strong>{{ lastResult.model }}</strong>.<strong>{{ lastResult.field }}</strong>:
                {{ formatFromList(lastResult.fromValues) }} → “{{ lastResult.toValue }}”
              </p>
              <p>
                Matched {{ lastResult.matched }} row(s)
                <template v-if="!lastResult.dryRun">
                  · updated {{ lastResult.updated }}
                </template>
              </p>
            </ElAlert>
          </div>
            </div>
          </div>
        </ElTabPane>

        <ElTabPane label="Settlement geometries" name="geometries">
          <SettlementGeometryCleanup />
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ElAlert,
  ElButton,
  ElCard,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTabs
} from 'element-plus'
import SettlementGeometryCleanup from './SettlementGeometryCleanup.vue'
import {
  listCleanupModels,
  listCleanupFields,
  listCleanupFieldValues,
  replaceCleanupFieldValue,
  type CleanupModelOption,
  type CleanupFieldOption,
  type CleanupFieldValueOption
} from '@/api/settings'

const activeTab = ref('fields')

const models = ref<CleanupModelOption[]>([])
const fields = ref<CleanupFieldOption[]>([])
const values = ref<CleanupFieldValueOption[]>([])

const selectedModel = ref<string>('')
const selectedField = ref<string>('')
const fromValues = ref<string[]>([])
const toValue = ref<string>('')

const loadingModels = ref(false)
const loadingFields = ref(false)
const loadingValues = ref(false)
const previewing = ref(false)
const replacing = ref(false)

const lastResult = ref<{
  dryRun: boolean
  model: string
  field: string
  fromValues: string[]
  toValue: string
  matched: number
  updated: number
} | null>(null)

const formatFromList = (list: string[]) => {
  if (!list?.length) return '—'
  if (list.length === 1) return `“${list[0]}”`
  if (list.length <= 3) return list.map((v) => `“${v}”`).join(', ')
  return `${list.slice(0, 3).map((v) => `“${v}”`).join(', ')} +${list.length - 3} more`
}

const fromCount = computed(() => {
  if (!fromValues.value.length) return null
  const selected = new Set(fromValues.value.map((v) => String(v)))
  return values.value
    .filter((v) => selected.has(String(v.value)))
    .reduce((sum, v) => sum + (Number(v.count) || 0), 0)
})

const toValueOptions = computed(() => {
  const selected = new Set(fromValues.value.map((v) => String(v)))
  return values.value.filter((v) => !selected.has(String(v.value)))
})

const canPreview = computed(() => {
  const to = String(toValue.value || '').trim()
  return (
    !!selectedModel.value &&
    !!selectedField.value &&
    fromValues.value.length > 0 &&
    !!to &&
    !fromValues.value.map(String).includes(to)
  )
})

const canReplace = computed(() => canPreview.value)

const loadModels = async () => {
  loadingModels.value = true
  try {
    const res = await listCleanupModels()
    if (res.code === '0000') {
      models.value = res.data || []
    } else {
      ElMessage.error(res.message || 'Failed to load models')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load models')
  } finally {
    loadingModels.value = false
  }
}

const onModelChange = async () => {
  selectedField.value = ''
  fromValues.value = []
  toValue.value = ''
  fields.value = []
  values.value = []
  lastResult.value = null
  if (!selectedModel.value) return

  loadingFields.value = true
  try {
    const res = await listCleanupFields(selectedModel.value)
    if (res.code === '0000') {
      fields.value = res.data || []
      if (!fields.value.length) {
        ElMessage.warning('No text fields available on this model')
      }
    } else {
      ElMessage.error(res.message || 'Failed to load fields')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load fields')
  } finally {
    loadingFields.value = false
  }
}

const reloadValues = async () => {
  if (!selectedModel.value || !selectedField.value) return
  loadingValues.value = true
  fromValues.value = []
  toValue.value = ''
  lastResult.value = null
  try {
    const res = await listCleanupFieldValues(selectedModel.value, selectedField.value)
    if (res.code === '0000') {
      values.value = res.data || []
      if (!values.value.length) {
        ElMessage.info('No distinct non-empty values for this field')
      }
    } else {
      ElMessage.error(res.message || 'Failed to load values')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load values')
  } finally {
    loadingValues.value = false
  }
}

const onFieldChange = async () => {
  values.value = []
  fromValues.value = []
  toValue.value = ''
  lastResult.value = null
  if (!selectedField.value) return
  await reloadValues()
}

const previewReplace = async () => {
  if (!canPreview.value) return
  previewing.value = true
  try {
    const res = await replaceCleanupFieldValue({
      model: selectedModel.value,
      field: selectedField.value,
      fromValues: fromValues.value.map(String),
      toValue: String(toValue.value).trim(),
      dryRun: true
    })
    if (res.code === '0000') {
      lastResult.value = {
        ...res.data,
        fromValues: res.data.fromValues || fromValues.value.map(String)
      }
      ElMessage.success(`Would update ${res.data.matched} row(s)`)
    } else {
      ElMessage.error(res.message || 'Preview failed')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Preview failed')
  } finally {
    previewing.value = false
  }
}

const confirmReplace = async () => {
  if (!canReplace.value) return

  const from = fromValues.value.map(String)
  const to = String(toValue.value).trim()
  const countHint = fromCount.value != null ? ` (${fromCount.value} row(s))` : ''

  try {
    await ElMessageBox.confirm(
      `Replace ${formatFromList(from)} with “${to}” on ${selectedModel.value}.${selectedField.value}${countHint}? This cannot be undone from this screen.`,
      'Confirm data cleanup',
      {
        type: 'warning',
        confirmButtonText: 'Replace',
        cancelButtonText: 'Cancel'
      }
    )
  } catch {
    return
  }

  replacing.value = true
  try {
    const res = await replaceCleanupFieldValue({
      model: selectedModel.value,
      field: selectedField.value,
      fromValues: from,
      toValue: to,
      dryRun: false
    })
    if (res.code === '0000') {
      lastResult.value = {
        ...res.data,
        fromValues: res.data.fromValues || from
      }
      ElMessage.success(res.message || `Updated ${res.data.updated} row(s)`)
      await reloadValues()
    } else {
      ElMessage.error(res.message || 'Replace failed')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Replace failed')
  } finally {
    replacing.value = false
  }
}

onMounted(loadModels)
</script>

<style scoped>
.data-cleanup-container {
  padding: 0;
}

.settings-card {
  border: none;
  box-shadow: none;
}

.card-header h2 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.45;
}

.cleanup-tabs :deep(.el-tabs__content) {
  padding-top: 4px;
}

.settings-content {
  max-width: 720px;
}

.intro-alert {
  margin-bottom: 20px;
}

.cleanup-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.result-box {
  margin-top: 8px;
}

.result-box p {
  margin: 4px 0 0;
  font-size: 13px;
}
</style>
