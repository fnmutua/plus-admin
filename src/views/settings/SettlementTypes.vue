<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ElAlert, ElButton, ElCard, ElDialog, ElForm, ElFormItem, ElInput, ElMessage,
  ElMessageBox, ElSwitch, ElTable, ElTableColumn, ElTag
} from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  createSettlementType, deleteSettlementType, getSettlementTypes, updateSettlementType
} from '@/api/settlementTypes'
import type { SettlementTypeItem } from '@/api/settlementTypes/types'
import { useSettlementTypesStore } from '@/store/modules/settlementTypes'

/**
 * The settlement types every picker in the system is built from.
 *
 * A settlement stores its type's label, so renaming one rewrites the
 * settlements that use it — the server does that in a transaction, and the
 * dialog says how many will be touched before you save.
 */

const types = ref<SettlementTypeItem[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const dialogOpen = ref(false)
const editing = ref<SettlementTypeItem | null>(null)
const form = reactive({ label: '', description: '', active: true })

const settlementTypesStore = useSettlementTypesStore()

const inUseCount = computed(() => editing.value?.settlements ?? 0)
const renaming = computed(() =>
  Boolean(editing.value) && form.label.trim() !== editing.value?.label && inUseCount.value > 0
)

const load = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await getSettlementTypes(true)
    types.value = response.data || []
  } catch (e: any) {
    error.value = e?.message || 'Could not load settlement types'
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  editing.value = null
  Object.assign(form, { label: '', description: '', active: true })
  dialogOpen.value = true
}

const openEdit = (row: SettlementTypeItem) => {
  editing.value = row
  Object.assign(form, { label: row.label, description: row.description || '', active: row.active })
  dialogOpen.value = true
}

const save = async () => {
  const label = form.label.trim()
  if (!label) {
    ElMessage.warning('A label is required')
    return
  }

  if (renaming.value) {
    try {
      await ElMessageBox.confirm(
        `${inUseCount.value} settlement(s) currently recorded as "${editing.value?.label}" will be `
          + `changed to "${label}".`,
        'Rename this type?',
        { type: 'warning', confirmButtonText: 'Rename' }
      )
    } catch {
      return
    }
  }

  saving.value = true
  try {
    const payload = { label, description: form.description.trim() || null, active: form.active }
    // The axios interceptor toasts the server's message, which reports how
    // many settlements a rename moved.
    const response = editing.value
      ? await updateSettlementType(editing.value.id, payload)
      : await createSettlementType(payload)

    if (response.success) {
      dialogOpen.value = false
      settlementTypesStore.invalidate()
      await Promise.all([load(), settlementTypesStore.load(true)])
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Could not save the settlement type')
  } finally {
    saving.value = false
  }
}

const toggleActive = async (row: SettlementTypeItem) => {
  const next = !row.active
  const warning = !next && row.settlements
    ? ` ${row.settlements} settlement(s) keep this type but it will no longer be offered in pickers.`
    : ''

  try {
    await ElMessageBox.confirm(
      `${next ? 'Offer' : 'Stop offering'} "${row.label}" in settlement type pickers.${warning}`,
      next ? `Activate ${row.label}?` : `Deactivate ${row.label}?`,
      { type: 'warning', confirmButtonText: next ? 'Activate' : 'Deactivate' }
    )
  } catch {
    return
  }

  try {
    const response = await updateSettlementType(row.id, { active: next })
    if (response.success) {
      settlementTypesStore.invalidate()
      await Promise.all([load(), settlementTypesStore.load(true)])
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Could not change the settlement type')
  }
}

const remove = async (row: SettlementTypeItem) => {
  if (row.settlements) {
    ElMessage.warning(
      `${row.label} is used by ${row.settlements} settlement(s). Deactivate it instead.`
    )
    return
  }

  try {
    await ElMessageBox.confirm(
      `"${row.label}" will be removed from the list. No settlement uses it.`,
      `Remove ${row.label}?`,
      { type: 'warning', confirmButtonText: 'Remove', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }

  try {
    const response = await deleteSettlementType(row.id)
    if (response.success) {
      settlementTypesStore.invalidate()
      await Promise.all([load(), settlementTypesStore.load(true)])
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Could not remove the settlement type')
  }
}

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <div>
          <h3>Settlement Types</h3>
          <p class="hint">
            The list behind every settlement type picker. A settlement stores its type's
            label, so renaming a type also renames it on the settlements that use it.
          </p>
        </div>
        <div class="actions">
          <el-button :icon="Refresh" :loading="loading" @click="load">Refresh</el-button>
          <el-button type="primary" :icon="Plus" @click="openAdd">Add type</el-button>
        </div>
      </div>
    </template>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="mb-3" />

    <el-table :data="types" stripe border>
      <el-table-column prop="label" label="Type" min-width="200" />
      <el-table-column prop="code" label="Code" min-width="170">
        <template #default="{ row }">
          <span class="code">{{ row.code }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="Description" min-width="220">
        <template #default="{ row }">{{ row.description || '—' }}</template>
      </el-table-column>
      <el-table-column label="Settlements" width="130" align="right">
        <template #default="{ row }">{{ row.settlements.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="Offered" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'" size="small">
            {{ row.active ? 'Yes' : 'No' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="" width="230" align="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">Edit</el-button>
          <el-button size="small" @click="toggleActive(row)">
            {{ row.active ? 'Deactivate' : 'Activate' }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="row.settlements > 0"
            :title="row.settlements > 0 ? 'In use — deactivate instead' : 'Remove'"
            @click="remove(row)"
          >
            Remove
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogOpen"
      :title="editing ? `Edit ${editing.label}` : 'Add settlement type'"
      width="480px"
    >
      <el-form label-position="top">
        <el-form-item label="Label">
          <el-input v-model="form.label" placeholder="e.g. Informal Settlement" maxlength="100" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="Optional note about when this type applies"
          />
        </el-form-item>
        <el-form-item label="Offered in pickers">
          <el-switch v-model="form.active" />
        </el-form-item>

        <el-alert
          v-if="renaming"
          type="warning"
          :closable="false"
          show-icon
          :title="`${inUseCount} settlement(s) will be renamed to &quot;${form.label.trim()}&quot;`"
        />
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
  max-width: 620px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.actions {
  display: flex;
  gap: 8px;
}

.code {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.mb-3 {
  margin-bottom: 12px;
}
</style>
