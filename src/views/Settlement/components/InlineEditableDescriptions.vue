<script setup lang="ts">
// @ts-nocheck — Element Plus v-model types differ for mixed draft ref (text | number | boolean)
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import {
  ElDescriptions,
  ElDescriptionsItem,
  ElInput,
  ElInputNumber,
  ElSwitch,
  ElSelect,
  ElOption,
  ElIcon,
  ElTooltip,
  ElTag,
  ElDatePicker,
} from 'element-plus'
import { Edit, Loading } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'

const props = withDefaults(
  defineProps<{
    schema: Record<string, any>[]
    data: Record<string, any>
    editable?: boolean
    readonlyFields?: string[]
    textareaFields?: string[]
    numberFields?: string[]
    dateFields?: string[]
    booleanFields?: string[]
    selectOptions?: Record<string, Array<{ label: string; value: string | number | boolean }>>
    /** When set, only these fields render as selects (requires matching selectOptions). */
    selectFields?: string[]
    multiselectFields?: string[]
    savingField?: string | null
    /** Optional per-field class for the read-only value text (e.g. climate risk tone). */
    cellTextClass?: (field: string) => string
    /**
     * Fields whose read-only display should be line-clamped (3 lines + ellipsis)
     * and wrapped in a tooltip exposing the full value on hover. Useful for
     * long-form text such as descriptions, hazards, general location notes.
     */
    clampFields?: string[]
    column?: number
    tableClass?: string
    /** Read-only boolean fields render as Yes/No tags instead of plain text. */
    booleanTags?: boolean
  }>(),
  {
    editable: false,
    readonlyFields: () => [],
    textareaFields: () => [],
    numberFields: () => [],
    dateFields: () => [],
    booleanFields: () => [],
    selectOptions: () => ({}),
    selectFields: () => [],
    multiselectFields: () => [],
    savingField: null,
    cellTextClass: undefined,
    clampFields: () => [],
    column: 2,
    tableClass: '',
    booleanTags: false
  }
)

const emit = defineEmits<{
  save: [payload: { field: string; value: unknown }]
}>()

const appStore = useAppStore()
const mobile = computed(() => appStore.getMobile)

const readonlySet = computed(() => new Set(props.readonlyFields || []))
const textareaSet = computed(() => new Set(props.textareaFields || []))
const numberSet = computed(() => new Set(props.numberFields || []))
const dateSet = computed(() => new Set(props.dateFields || []))
const booleanSet = computed(() => new Set(props.booleanFields || []))
const selectFieldSet = computed(() => new Set(props.selectFields || []))
const multiselectSet = computed(() => new Set(props.multiselectFields || []))
const clampSet = computed(() => new Set(props.clampFields || []))

type LayoutSchemaItem = Record<string, any> & { span: number }

/** Element Plus only wraps when the current row is full; pad the prior item so long-text fields start on a new row. */
const layoutSchema = computed((): LayoutSchemaItem[] => {
  const cols = Math.max(1, props.column)
  const result: LayoutSchemaItem[] = []
  let colUsed = 0

  const isFullRow = (field: string) =>
    textareaSet.value.has(field) || clampSet.value.has(field)

  for (const item of props.schema) {
    const field = item.field as string
    const fullRow = isFullRow(field)

    if (fullRow && colUsed % cols !== 0 && result.length > 0) {
      const prev = result[result.length - 1]
      const remainder = cols - (colUsed % cols)
      prev.span = (prev.span || 1) + remainder
      colUsed += remainder
    }

    const span = fullRow ? cols : item.span || 1
    result.push({ ...item, span })
    colUsed += span
  }

  return result
})

function isFullRowField(field: string) {
  return textareaSet.value.has(field) || clampSet.value.has(field)
}

function isClamped(field: string) {
  return clampSet.value.has(field)
}

function rawFullValue(field: string): string {
  const v = props.data[field]
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}

function showTooltipFor(field: string) {
  if (!isClamped(field)) return false
  const txt = rawFullValue(field)
  return txt.length > 0
}

const editingField = ref<string | null>(null)
const draft = ref<unknown>(null)
const snapshot = ref<unknown>(null)
const inputRef = ref<{ focus?: () => void } | null>(null)

function isReadonly(field: string) {
  return readonlySet.value.has(field)
}

function formatDisplayDate(v: unknown) {
  if (v === null || v === undefined || v === '') return null
  const d = v instanceof Date ? v : new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatDisplayNumber(v: unknown) {
  const n = coerceNum(v)
  if (n === null) return null
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatNumberInput(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return ''
  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function parseNumberInput(value: string) {
  return value.replace(/[^\d.-]/g, '')
}

function cellDisplay(field: string) {
  const v = props.data[field]
  if (v === null || v === undefined || v === '') return '\u2014'
  if (shouldUseSelect(field)) {
    const opt = selectItems(field).find(
      (item) => item.value === v || String(item.value) === String(v)
    )
    if (opt?.label) return opt.label
  }
  if (numberSet.value.has(field)) {
    return formatDisplayNumber(v) ?? '\u2014'
  }
  if (dateSet.value.has(field)) {
    return formatDisplayDate(v) ?? '\u2014'
  }
  return String(v)
}

function hasSelectOptions(field: string): boolean {
  return Array.isArray(props.selectOptions?.[field]) && props.selectOptions[field].length > 0
}

function shouldUseSelect(field: string): boolean {
  if (!hasSelectOptions(field)) return false
  if (selectFieldSet.value.size > 0) return selectFieldSet.value.has(field)
  return true
}

function selectItems(field: string) {
  return props.selectOptions?.[field] || []
}

function toBool(v: unknown): boolean {
  if (v === true || v === 'true' || v === 1 || v === '1') return true
  if (v === false || v === 'false' || v === 0 || v === '0') return false
  if (v === 'Yes') return true
  if (v === 'No') return false
  return Boolean(v)
}

function startEdit(field: string) {
  if (!props.editable || isReadonly(field)) return
  const raw = props.data[field]
  snapshot.value = raw
  editingField.value = field

  if (shouldUseSelect(field)) {
    if (multiselectSet.value.has(field)) {
      if (Array.isArray(raw)) {
        draft.value = raw
      } else if (typeof raw === 'string') {
        draft.value = raw
          .split(',')
          .map((x) => x.trim())
          .filter((x) => x.length > 0)
      } else {
        draft.value = []
      }
    } else {
      draft.value = raw === '\u2014' || raw === null || raw === undefined ? undefined : raw
    }
  } else if (booleanSet.value.has(field)) {
    draft.value = toBool(raw)
  } else if (numberSet.value.has(field)) {
    if (raw === '\u2014' || raw === '' || raw === null || raw === undefined) {
      draft.value = undefined
    } else {
      const n = coerceNum(raw)
      draft.value = n ?? undefined
    }
  } else if (dateSet.value.has(field)) {
    if (raw === '\u2014' || raw === '' || raw === null || raw === undefined) {
      draft.value = ''
    } else {
      const d = new Date(String(raw))
      if (Number.isNaN(d.getTime())) {
        draft.value = String(raw).slice(0, 10)
      } else {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        draft.value = `${y}-${m}-${day}`
      }
    }
  } else {
    draft.value = raw === '\u2014' || raw === null || raw === undefined ? '' : raw
  }

  nextTick(() => {
    inputRef.value?.focus?.()
  })
}

function normalizeForCompare(v: unknown) {
  if (v === '\u2014' || v === '' || v === null || v === undefined) return null
  return v
}

function coerceNum(v: unknown): number | null {
  if (v === '\u2014' || v === '' || v === null || v === undefined) return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

function isUnchanged(): boolean {
  const f = editingField.value
  if (!f) return true
  if (shouldUseSelect(f) && multiselectSet.value.has(f)) {
    const normalize = (v: unknown) =>
      (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
        .map((x) => String(x).trim())
        .filter((x) => x.length > 0)
        .sort()
    const a = normalize(snapshot.value)
    const b = normalize(draft.value)
    return JSON.stringify(a) === JSON.stringify(b)
  }
  if (booleanSet.value.has(f)) {
    return toBool(snapshot.value) === toBool(draft.value)
  }
  if (numberSet.value.has(f)) {
    const a = coerceNum(snapshot.value)
    const b = coerceNum(draft.value)
    if (a === null && b === null) return true
    if (a === null || b === null) return false
    return Math.abs(a - b) < 1e-9
  }
  if (dateSet.value.has(f)) {
    const norm = (v: unknown) => {
      if (v === '\u2014' || v === '' || v == null) return ''
      const d = new Date(String(v))
      if (Number.isNaN(d.getTime())) return String(v).slice(0, 10)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return norm(snapshot.value) === norm(draft.value)
  }
  const a = normalizeForCompare(snapshot.value)
  const b = normalizeForCompare(draft.value)
  if (a === b) return true
  return false
}

function commit() {
  const f = editingField.value
  if (!f) return
  if (isUnchanged()) {
    editingField.value = null
    return
  }
  let next = draft.value
  if (shouldUseSelect(f) && multiselectSet.value.has(f)) {
    const arr = Array.isArray(next)
      ? next.map((x) => String(x).trim()).filter((x) => x.length > 0)
      : []
    next = arr.length ? arr.join(', ') : null
  } else if (dateSet.value.has(f)) {
    next = next === '' || next == null ? null : next
  } else if (numberSet.value.has(f)) {
    next = coerceNum(next)
  }
  editingField.value = null
  emit('save', { field: f, value: next })
}

function cancel() {
  editingField.value = null
  draft.value = null
  snapshot.value = null
}

let removeEscListener: (() => void) | null = null
watch(editingField, (f) => {
  removeEscListener?.()
  removeEscListener = null
  if (!f) return
  const onEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }
  window.addEventListener('keydown', onEsc)
  removeEscListener = () => window.removeEventListener('keydown', onEsc)
})
onUnmounted(() => {
  removeEscListener?.()
})

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    cancel()
  }
  if (e.key === 'Enter' && editingField.value && !textareaSet.value.has(editingField.value)) {
    e.preventDefault()
    ;(e.target as HTMLElement)?.blur?.()
  }
}

function itemBind(item: Record<string, any>) {
  const { field, label, span, ...rest } = item
  return rest
}

function displayTextClass(field: string) {
  return props.cellTextClass?.(field) || ''
}

function isBooleanTagField(field: string) {
  return props.booleanTags && booleanSet.value.has(field)
}

function booleanTagType(field: string): 'success' | 'danger' | 'info' {
  const v = props.data[field]
  if (v === true || v === 'true' || v === 1 || v === '1' || v === 'Yes') return 'success'
  if (v === false || v === 'false' || v === 0 || v === '0' || v === 'No') return 'danger'
  return 'info'
}
</script>

<template>
  <ElDescriptions
    :column="column"
    border
    :direction="mobile ? 'vertical' : 'horizontal'"
    :class="['inline-editable-descriptions', tableClass]"
  >
    <ElDescriptionsItem
      v-for="item in layoutSchema"
      :key="item.field"
      :span="item.span"
      :class-name="isFullRowField(item.field) ? 'inline-desc-full-row' : ''"
      v-bind="itemBind(item)"
    >
      <template #label>
        <span>{{ item.label }}</span>
      </template>
      <template #default>
        <div
          class="inline-cell"
          :class="{
            'inline-cell--editing': editingField === item.field,
            'inline-cell--readonly': !editable || isReadonly(item.field)
          }"
        >
          <template v-if="editingField === item.field">
            <ElSelect
              v-if="shouldUseSelect(item.field)"
              ref="inputRef"
              v-model="draft"
              :multiple="multiselectSet.has(item.field)"
              filterable
              clearable
              teleported
              popper-class="inline-editable-select-popper"
              class="inline-cell__input"
              @change="!multiselectSet.has(item.field) ? commit() : undefined"
              @blur="multiselectSet.has(item.field) ? commit() : undefined"
            >
              <ElOption
                v-for="opt in selectItems(item.field)"
                :key="`${item.field}-${String(opt.value)}`"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElSwitch
              v-else-if="booleanSet.has(item.field)"
              v-model="draft"
              @change="commit"
            />
            <ElInputNumber
              v-else-if="numberSet.has(item.field)"
              ref="inputRef"
              v-model="draft"
              :controls="false"
              :precision="0"
              :formatter="formatNumberInput"
              :parser="parseNumberInput"
              class="inline-cell__input-num"
              @blur="commit"
              @keydown="onInputKeydown"
            />
            <ElDatePicker
              v-else-if="dateSet.has(item.field)"
              ref="inputRef"
              v-model="draft"
              type="date"
              value-format="YYYY-MM-DD"
              format="DD/MM/YYYY"
              clearable
              teleported
              class="inline-cell__input inline-cell__date"
              @change="commit"
              @blur="commit"
            />
            <ElInput
              v-else-if="textareaSet.has(item.field)"
              ref="inputRef"
              v-model="draft"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 8 }"
              class="inline-cell__input"
              @blur="commit"
              @keydown="onInputKeydown"
            />
            <ElInput
              v-else
              ref="inputRef"
              v-model="draft"
              class="inline-cell__input"
              @blur="commit"
              @keydown="onInputKeydown"
            />
          </template>
          <template v-else>
            <ElTag
              v-if="isBooleanTagField(item.field)"
              :type="booleanTagType(item.field)"
              size="small"
            >
              {{ cellDisplay(item.field) }}
            </ElTag>
            <ElTooltip
              v-else-if="showTooltipFor(item.field)"
              effect="dark"
              placement="top-start"
              :show-after="250"
              popper-class="inline-cell__tooltip-popper"
            >
              <template #content>
                <div class="inline-cell__tooltip-content">{{ rawFullValue(item.field) }}</div>
              </template>
              <span
                class="inline-cell__text inline-cell__text--clamped"
                :class="displayTextClass(item.field)"
              >{{ cellDisplay(item.field) }}</span>
            </ElTooltip>
            <span
              v-else
              class="inline-cell__text"
              :class="[
                displayTextClass(item.field),
                isClamped(item.field) ? 'inline-cell__text--clamped' : ''
              ]"
            >{{ cellDisplay(item.field) }}</span>
            <div
              v-if="editable && !isReadonly(item.field)"
              class="inline-cell__actions"
              aria-hidden="true"
            >
              <ElIcon
                v-if="savingField === item.field"
                class="inline-cell__saving is-loading"
              >
                <Loading />
              </ElIcon>
              <ElTooltip v-else content="Edit" placement="top">
                <span
                  class="inline-cell__edit-wrap"
                  role="button"
                  tabindex="0"
                  @mousedown.prevent
                  @click.stop="startEdit(item.field)"
                  @keydown.enter.prevent="startEdit(item.field)"
                >
                  <ElIcon class="inline-cell__edit-icon">
                    <Edit />
                  </ElIcon>
                </span>
              </ElTooltip>
            </div>
          </template>
        </div>
      </template>
    </ElDescriptionsItem>
  </ElDescriptions>
</template>

<style scoped>
.inline-cell {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-height: 24px;
  width: 100%;
}

.inline-cell__text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

/* Compact display for long-form fields (description, hazards, general location).
   Clamps to 3 lines with ellipsis; full text is exposed via the tooltip wrapper. */
.inline-cell__text--clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  cursor: help;
}

/* Climate / vulnerability tier (LOW / MEDIUM / HIGH) — uses Element Plus semantic colors */
.inline-cell__text--climate-low {
  color: var(--el-color-success);
  font-weight: 600;
}
.inline-cell__text--climate-medium {
  color: var(--el-color-warning);
  font-weight: 600;
}
.inline-cell__text--climate-high {
  color: var(--el-color-danger);
  font-weight: 600;
}
.inline-cell__text--climate-neutral {
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

/* Fixed slot so hover reveal does not shift table column widths */
.inline-cell__actions {
  width: 28px;
  min-width: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2px;
}

.inline-cell__edit-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  cursor: pointer;
  outline: none;
}

.inline-cell__edit-icon {
  color: var(--el-color-primary);
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.inline-cell:not(.inline-cell--readonly):hover .inline-cell__edit-icon,
.inline-cell__edit-wrap:focus-visible .inline-cell__edit-icon {
  opacity: 1;
}

.inline-cell__edit-wrap:hover .inline-cell__edit-icon {
  color: var(--el-color-primary-light-3);
}

.inline-cell__saving {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.inline-cell__input,
.inline-cell__input-num,
.inline-cell__date {
  flex: 1;
  width: 100% !important;
}

:deep(.inline-cell__date.el-date-editor) {
  width: 100% !important;
}

.inline-cell--editing {
  align-items: stretch;
}

:deep(.inline-desc-full-row) {
  width: 100%;
}
</style>

<!-- Unscoped: Element Plus tooltip popper is portal-rendered outside this component. -->
<style>
.inline-cell__tooltip-popper {
  max-width: min(560px, 80vw) !important;
}
.inline-cell__tooltip-popper .inline-cell__tooltip-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  font-size: 13px;
  max-height: 60vh;
  overflow-y: auto;
}

.inline-editable-select-popper {
  z-index: 10050 !important;
}
</style>
