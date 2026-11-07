<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  ElAlert, ElButton, ElCard, ElColorPicker, ElDialog, ElForm, ElFormItem, ElInput,
  ElInputNumber, ElMessage, ElMessageBox, ElSwitch, ElTable, ElTableColumn, ElTag,
} from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  createLanduseType, deleteLanduseType, getLanduseTypes, updateLanduseType,
} from '@/api/landuseTypes'
import type { LanduseTypeItem } from '@/api/landuseTypes/types'
import { FALLBACK_LANDUSE_COLORS, useLanduseTypesStore } from '@/store/modules/landuseTypes'
import { useAppStore } from '@/store/modules/app'
import TableActions from '@/views/Components/TableActions.vue'

/**
 * Parcel land-use types used by settlement maps, legends, and the QGIS
 * Connector import match dialog.
 */

const types = ref<LanduseTypeItem[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const dialogOpen = ref(false)
const editing = ref<LanduseTypeItem | null>(null)
const form = reactive({
  label: '',
  color: '#D7C29E',
  aliases: '',
  description: '',
  active: true,
})
const rgb = reactive({ r: 215, g: 194, b: 158 })
const syncingColor = ref(false)

const handbookPresets = Object.values(FALLBACK_LANDUSE_COLORS)

const clampByte = (value: number) => Math.min(255, Math.max(0, Math.round(Number(value) || 0)))

const hexToRgb = (value: string): { r: number; g: number; b: number } | null => {
  const raw = String(value || '').trim()
  const rgbMatch = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (rgbMatch) {
    return {
      r: clampByte(Number(rgbMatch[1])),
      g: clampByte(Number(rgbMatch[2])),
      b: clampByte(Number(rgbMatch[3])),
    }
  }
  const hex = raw.replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    }
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    }
  }
  return null
}

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((n) => clampByte(n).toString(16).padStart(2, '0')).join('').toUpperCase()}`

const applyColorToForm = (value: string) => {
  const parsed = hexToRgb(value)
  if (!parsed) return
  syncingColor.value = true
  form.color = rgbToHex(parsed.r, parsed.g, parsed.b)
  Object.assign(rgb, parsed)
  syncingColor.value = false
}

watch(
  () => form.color,
  (value) => {
    if (syncingColor.value) return
    const parsed = hexToRgb(value)
    if (!parsed) return
    syncingColor.value = true
    Object.assign(rgb, parsed)
    form.color = rgbToHex(parsed.r, parsed.g, parsed.b)
    syncingColor.value = false
  }
)

const onRgbChange = () => {
  if (syncingColor.value) return
  syncingColor.value = true
  form.color = rgbToHex(rgb.r, rgb.g, rgb.b)
  syncingColor.value = false
}

const landuseTypesStore = useLanduseTypesStore()
const appStore = useAppStore()
const isMobile = computed(() => appStore.getMobile)
const actionColumnWidth = computed(() => (isMobile.value ? '70px' : '90px'))
const dialogWidth = computed(() => (isMobile.value ? '92%' : '520px'))

const rowButtons = (row: LanduseTypeItem): string[] => [
  'edit',
  row.active ? 'deactivate' : 'activate',
  ...(row.parcels > 0 ? [] : ['remove']),
]

const load = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await getLanduseTypes(true)
    types.value = response.data || []
  } catch (e: any) {
    error.value = e?.message || 'Could not load land-use types'
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  editing.value = null
  Object.assign(form, {
    label: '',
    color: '#D7C29E',
    aliases: '',
    description: '',
    active: true,
  })
  applyColorToForm(form.color)
  dialogOpen.value = true
}

const openEdit = (row: LanduseTypeItem) => {
  editing.value = row
  Object.assign(form, {
    label: row.label,
    color: row.color || '#D7C29E',
    aliases: row.aliases || '',
    description: row.description || '',
    active: row.active,
  })
  applyColorToForm(form.color)
  dialogOpen.value = true
}

const save = async () => {
  const label = form.label.trim()
  if (!label) {
    ElMessage.warning('A label is required')
    return
  }

  const normalized = hexToRgb(form.color)
  if (!normalized) {
    ElMessage.warning('Enter a valid colour as hex or RGB')
    return
  }

  saving.value = true
  try {
    const payload = {
      label,
      color: rgbToHex(normalized.r, normalized.g, normalized.b),
      aliases: form.aliases.trim(),
      description: form.description.trim() || null,
      active: form.active,
    }
    const response = editing.value
      ? await updateLanduseType(editing.value.id, payload)
      : await createLanduseType(payload)

    if (response.success) {
      dialogOpen.value = false
      landuseTypesStore.invalidate()
      await Promise.all([load(), landuseTypesStore.load(true)])
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Could not save the land-use type')
  } finally {
    saving.value = false
  }
}

const toggleActive = async (row: LanduseTypeItem) => {
  const next = !row.active
  const warning = !next && row.parcels
    ? ` ${row.parcels} parcel(s) keep this land use but it will no longer be offered in pickers.`
    : ''

  try {
    await ElMessageBox.confirm(
      `${next ? 'Offer' : 'Stop offering'} "${row.label}" in land-use pickers.${warning}`,
      next ? `Activate ${row.label}?` : `Deactivate ${row.label}?`,
      { type: 'warning', confirmButtonText: next ? 'Activate' : 'Deactivate' }
    )
  } catch {
    return
  }

  try {
    const response = await updateLanduseType(row.id, { active: next })
    if (response.success) {
      landuseTypesStore.invalidate()
      await Promise.all([load(), landuseTypesStore.load(true)])
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Could not change the land-use type')
  }
}

const remove = async (row: LanduseTypeItem) => {
  if (row.parcels) {
    ElMessage.warning(
      `${row.label} is used by ${row.parcels} parcel(s). Deactivate it instead.`
    )
    return
  }

  try {
    await ElMessageBox.confirm(
      `"${row.label}" will be removed from the list. No parcel uses it.`,
      `Remove ${row.label}?`,
      { type: 'warning', confirmButtonText: 'Remove', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }

  try {
    const response = await deleteLanduseType(row.id)
    if (response.success) {
      landuseTypesStore.invalidate()
      await Promise.all([load(), landuseTypesStore.load(true)])
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Could not remove the land-use type')
  }
}

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <div>
          <h3>Land Use Types</h3>
          <p class="hint">
            Physical and Land Use Planning Handbook 2025 §3.4.3 classes and
            colours.
          </p>
        </div>
        <div class="actions">
          <el-button :icon="Refresh" :loading="loading" :size="isMobile ? 'small' : 'default'" @click="load">
            {{ isMobile ? '' : 'Refresh' }}
          </el-button>
          <el-button type="primary" :icon="Plus" :size="isMobile ? 'small' : 'default'" @click="openAdd">
            {{ isMobile ? 'Add' : 'Add type' }}
          </el-button>
        </div>
      </div>
    </template>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="mb-3" />

    <el-table :data="types" stripe border :size="isMobile ? 'small' : 'default'">
      <el-table-column label="Colour" width="80" align="center">
        <template #default="{ row }">
          <span class="swatch" :style="{ backgroundColor: row.color || '#ccc' }"></span>
        </template>
      </el-table-column>
      <el-table-column prop="label" label="Land use" min-width="150" show-overflow-tooltip />
      <el-table-column v-if="!isMobile" prop="id" label="Id" width="70" align="right" />
      <el-table-column v-if="!isMobile" prop="aliases" label="Aliases" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.aliases || '—' }}</template>
      </el-table-column>
      <el-table-column :label="isMobile ? 'Use' : 'Parcels'" :width="isMobile ? 70 : 110" align="right">
        <template #default="{ row }">{{ row.parcels.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="Offered" :width="isMobile ? 85 : 110" align="center">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'" size="small">
            {{ row.active ? 'Yes' : 'No' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" :width="actionColumnWidth" align="center" fixed="right">
        <template #default="{ row }">
          <TableActions
            :item="row"
            :buttons="rowButtons(row)"
            @edit="openEdit"
            @activate="toggleActive"
            @deactivate="toggleActive"
            @remove="remove"
          />
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogOpen"
      :title="editing ? `Edit ${editing.label}` : 'Add land-use type'"
      :width="dialogWidth"
    >
      <el-form label-position="top">
        <el-form-item label="Label">
          <el-input v-model="form.label" placeholder="e.g. Residential" maxlength="100" />
        </el-form-item>
        <el-form-item label="Map colour">
          <div class="color-editor">
            <el-color-picker
              v-model="form.color"
              color-format="hex"
              :predefine="handbookPresets"
            />
            <el-input
              v-model="form.color"
              class="color-hex"
              placeholder="#D7C29E"
              maxlength="20"
            />
            <div class="rgb-row">
              <label>R <el-input-number v-model="rgb.r" :min="0" :max="255" controls-position="right" @change="onRgbChange" /></label>
              <label>G <el-input-number v-model="rgb.g" :min="0" :max="255" controls-position="right" @change="onRgbChange" /></label>
              <label>B <el-input-number v-model="rgb.b" :min="0" :max="255" controls-position="right" @change="onRgbChange" /></label>
            </div>
            <div class="rgb-preview" :style="{ backgroundColor: form.color }">
              rgb({{ rgb.r }}, {{ rgb.g }}, {{ rgb.b }})
            </div>
          </div>
        </el-form-item>
        <el-form-item label="Aliases">
          <el-input
            v-model="form.aliases"
            type="textarea"
            :rows="2"
            placeholder="Comma-separated alternate names, e.g. Educational, education"
          />
        </el-form-item>
        <el-form-item label="Description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="Optional note"
          />
        </el-form-item>
        <el-form-item label="Offered in pickers">
          <el-switch v-model="form.active" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogOpen = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="save">
          {{ editing ? 'Save' : 'Add' }}
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.header h3 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
}

.hint {
  margin: 0;
  max-width: 640px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.actions {
  display: flex;
  gap: 8px;
}

.swatch {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  vertical-align: middle;
}

.color-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.color-hex {
  max-width: 160px;
}

.rgb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.rgb-row label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rgb-row :deep(.el-input-number) {
  width: 110px;
}

.rgb-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #111;
  text-shadow: 0 0 2px #fff;
  max-width: 220px;
}

.mb-3 {
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .actions {
    justify-content: flex-end;
  }

  .hint {
    font-size: 12px;
  }
}
</style>
