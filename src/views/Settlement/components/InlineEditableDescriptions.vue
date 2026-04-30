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
  ElTooltip
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
    booleanFields?: string[]
    selectOptions?: Record<string, Array<{ label: string; value: string | number | boolean }>>
    multiselectFields?: string[]
    savingField?: string | null
    /** Optional per-field class for the read-only value text (e.g. climate risk tone). */
    cellTextClass?: (field: string) => string
  }>(),
  {
    editable: false,
    readonlyFields: () => [],
    textareaFields: () => [],
    numberFields: () => [],
    booleanFields: () => [],
    selectOptions: () => ({}),
    multiselectFields: () => [],
    savingField: null,
    cellTextClass: undefined
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
const booleanSet = computed(() => new Set(props.booleanFields || []))
const multiselectSet = computed(() => new Set(props.multiselectFields || []))

const editingField = ref<string | null>(null)
const draft = ref<unknown>(null)
const snapshot = ref<unknown>(null)
const inputRef = ref<{ focus?: () => void } | null>(null)

function isReadonly(field: string) {
  return readonlySet.value.has(field)
}

function cellDisplay(field: string) {
  const v = props.data[field]
  if (v === null || v === undefined || v === '') return '\u2014'
  return String(v)
}

function hasSelect(field: string): boolean {
  return Array.isArray(props.selectOptions?.[field]) && props.selectOptions[field].length > 0
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

  if (booleanSet.value.has(field)) {
    draft.value = toBool(raw)
  } else if (hasSelect(field)) {
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
  } else if (numberSet.value.has(field)) {
    if (raw === '\u2014' || raw === '' || raw === null || raw === undefined) {
      draft.value = undefined
    } else {
      const n = Number(raw)
      draft.value = Number.isFinite(n) ? n : undefined
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
  if (hasSelect(f) && multiselectSet.value.has(f)) {
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
  if (hasSelect(f) && multiselectSet.value.has(f)) {
    const arr = Array.isArray(next)
      ? next.map((x) => String(x).trim()).filter((x) => x.length > 0)
      : []
    next = arr.length ? arr.join(', ') : null
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
  const { field, label, ...rest } = item
  return rest
}

function displayTextClass(field: string) {
  return props.cellTextClass?.(field) || ''
}
</script>

<template>
  <ElDescriptions
    :column="2"
    border
    :direction="mobile ? 'vertical' : 'horizontal'"
    class="inline-editable-descriptions"
  >
    <ElDescriptionsItem
      v-for="item in schema"
      :key="item.field"
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
            <ElSwitch
              v-if="booleanSet.has(item.field)"
              v-model="draft"
              @change="commit"
            />
            <ElSelect
              v-else-if="hasSelect(item.field)"
              ref="inputRef"
              v-model="draft"
              :multiple="multiselectSet.has(item.field)"
              filterable
              clearable
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
            <ElInputNumber
              v-else-if="numberSet.has(item.field)"
              ref="inputRef"
              v-model="draft"
              :controls="false"
              class="inline-cell__input-num"
              @blur="commit"
              @keydown="onInputKeydown"
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
            <span class="inline-cell__text" :class="displayTextClass(item.field)">{{
              cellDisplay(item.field)
            }}</span>
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
.inline-cell__input-num {
  flex: 1;
  width: 100% !important;
}

.inline-cell--editing {
  align-items: stretch;
}
</style>
