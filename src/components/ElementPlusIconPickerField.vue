<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElIcon } from 'element-plus'
import { Icon } from '@/components/Icon'
import {
  filterElementPlusIconNames,
  formatIconLabel,
  resolveElementPlusIcon,
  isElementPlusIconName,
} from '@/utils/elementPlusIcons'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  previewColor: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const search = ref('')

const selectedIcon = computed(() => resolveElementPlusIcon(props.modelValue))

const showIconifyPreview = computed(
  () => props.modelValue && !isElementPlusIconName(props.modelValue) && props.modelValue.includes(':')
)

const filteredIcons = computed(() => filterElementPlusIconNames(search.value))

const selectIcon = (icon: string) => {
  emit('update:modelValue', icon)
}
</script>

<template>
  <div class="icon-picker-panel">
    <div class="icon-picker-toolbar">
      <div
        v-if="modelValue || selectedIcon || showIconifyPreview"
        class="icon-picker-selected-icon"
      >
        <el-icon
          v-if="selectedIcon"
          :size="18"
          :color="previewColor || '#475569'"
        >
          <component :is="selectedIcon" />
        </el-icon>
        <Icon
          v-else-if="showIconifyPreview"
          :icon="modelValue"
          :size="18"
          :color="previewColor || '#475569'"
        />
      </div>

      <input
        v-model="search"
        type="text"
        class="icon-picker-search-input"
        placeholder="Search icons..."
      />
    </div>

    <div class="icon-picker-grid-wrap">
      <div v-if="!filteredIcons.length" class="icon-picker-empty">
        <p>No icons found</p>
      </div>
      <div v-else class="icon-picker-grid">
        <button
          v-for="icon in filteredIcons"
          :key="icon"
          type="button"
          class="icon-picker-cell"
          :class="{ 'is-selected': modelValue === icon }"
          :title="`${icon} (${formatIconLabel(icon)})`"
          @click="selectIcon(icon)"
        >
          <el-icon :size="14" :color="modelValue === icon ? 'var(--el-color-primary)' : '#64748b'">
            <component :is="resolveElementPlusIcon(icon)" />
          </el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-picker-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: #fff;
  box-sizing: border-box;
}

.icon-picker-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-picker-selected-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.icon-picker-search-input {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  outline: none;
  font-size: 13px;
  color: #334155;
  background: #fff;
  box-sizing: border-box;
}

.icon-picker-search-input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.15);
}

.icon-picker-search-input::placeholder {
  color: #94a3b8;
}

.icon-picker-grid-wrap {
  min-height: 0;
}

.icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 2px;
  max-height: 160px;
  overflow-y: auto;
  padding: 1px 2px 1px 0;
}

.icon-picker-grid::-webkit-scrollbar {
  width: 6px;
}

.icon-picker-grid::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
}

.icon-picker-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 26px;
  padding: 2px 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.icon-picker-cell:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.icon-picker-cell.is-selected {
  background: #eff6ff;
  border-color: #93c5fd;
}

.icon-picker-empty {
  padding: 12px 8px;
  text-align: center;
  color: #64748b;
}

.icon-picker-empty p {
  margin: 0;
}
</style>
