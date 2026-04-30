<script setup lang="ts">
// @ts-nocheck — Element Plus v-model types differ for mixed draft ref (text | number | boolean)
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import {
  ElDescriptions,
  ElDescriptionsItem,
  ElInput,
  ElInputNumber,
  ElSwitch,
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
    savingField?: string | null
  }>(),
  {
    editable: false,
    readonlyFields: () => [],
    textareaFields: () => [],
    numberFields: () => [],
    booleanFields: () => [],
    savingField: null
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

const hoverField = ref<string | null>(null)
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
  const next = draft.value
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
          @mouseenter="hoverField = item.field"
          @mouseleave="hoverField = null"
        >
          <template v-if="editingField === item.field">
            <ElSwitch
              v-if="booleanSet.has(item.field)"
              v-model="draft"
              @change="commit"
            />
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
            <span class="inline-cell__text">{{ cellDisplay(item.field) }}</span>
            <ElTooltip v-if="editable && !isReadonly(item.field)" content="Edit" placement="top">
              <ElIcon
                v-show="hoverField === item.field && savingField !== item.field"
                class="inline-cell__edit"
                @mousedown.prevent
                @click.stop="startEdit(item.field)"
              >
                <Edit />
              </ElIcon>
            </ElTooltip>
            <ElIcon v-if="savingField === item.field" class="inline-cell__saving is-loading">
              <Loading />
            </ElIcon>
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
  word-break: break-word;
}

.inline-cell__edit {
  flex-shrink: 0;
  cursor: pointer;
  color: var(--el-color-primary);
  font-size: 14px;
  margin-top: 2px;
}

.inline-cell__edit:hover {
  color: var(--el-color-primary-light-3);
}

.inline-cell__saving {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
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
