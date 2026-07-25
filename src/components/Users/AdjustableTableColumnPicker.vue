<script setup lang="ts">
import { ElButton, ElPopover, ElCheckbox, ElCheckboxGroup } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import type { AdjustableColumnKey, AdjustableColumnSetting } from '@/composables/useAdjustableTableColumns'

defineProps<{
  showColumnPicker: boolean
  hideableColumns: AdjustableColumnSetting[]
  visibleColumnKeys: AdjustableColumnKey[]
}>()

const emit = defineEmits<{
  'update:showColumnPicker': [value: boolean]
  'update:visibleColumnKeys': [keys: AdjustableColumnKey[]]
  reset: []
}>()
</script>

<template>
  <el-popover
    :visible="showColumnPicker"
    placement="bottom-end"
    :width="280"
    trigger="manual"
    :teleported="true"
    @update:visible="emit('update:showColumnPicker', $event)"
  >
    <template #reference>
      <el-button
        type="default"
        :icon="Setting"
        aria-label="Column settings"
        title="Show / hide columns"
        @click.stop="emit('update:showColumnPicker', !showColumnPicker)"
      />
    </template>
    <div class="user-columns-picker">
      <div class="user-columns-picker__title">Table columns</div>
      <p class="user-columns-picker__hint">Drag column edges in the table to resize. Uncheck to hide.</p>
      <el-checkbox-group
        class="user-columns-picker__options"
        :model-value="visibleColumnKeys"
        @update:model-value="emit('update:visibleColumnKeys', $event as AdjustableColumnKey[])"
      >
        <el-checkbox
          v-for="col in hideableColumns"
          :key="col.key"
          class="user-columns-picker__option"
          :label="col.key"
        >
          {{ col.label }}
        </el-checkbox>
      </el-checkbox-group>
      <el-button class="user-columns-picker__reset" size="small" text type="primary" @click="emit('reset')">
        Reset columns
      </el-button>
    </div>
  </el-popover>
</template>

<style scoped>
.user-columns-picker {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.user-columns-picker__title {
  font-weight: 600;
  margin-bottom: 4px;
}

.user-columns-picker__hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.user-columns-picker__options {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  width: 100%;
}

.user-columns-picker__options :deep(.user-columns-picker__option) {
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  margin-right: 0;
}

.user-columns-picker__options :deep(.user-columns-picker__option .el-checkbox__input) {
  flex-shrink: 0;
}

.user-columns-picker__options :deep(.user-columns-picker__option .el-checkbox__label) {
  flex: 1;
  padding-left: 8px;
  line-height: 1.4;
  white-space: nowrap;
}

.user-columns-picker__reset {
  align-self: flex-start;
  margin-top: 10px;
  padding-left: 0;
}
</style>
