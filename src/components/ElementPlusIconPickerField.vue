<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const activeTab = ref<'browse' | 'paste'>('browse')
const search = ref('')

const selectedIcon = computed(() => resolveElementPlusIcon(props.modelValue))

const showIconifyPreview = computed(
  () => props.modelValue && !isElementPlusIconName(props.modelValue) && props.modelValue.includes(':')
)

const filteredIcons = computed(() => filterElementPlusIconNames(search.value))

const pasteValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

watch(activeTab, (tab) => {
  if (tab === 'browse') {
    search.value = ''
  }
})

watch(
  () => props.modelValue,
  (value) => {
    if (value?.includes(':')) {
      activeTab.value = 'paste'
    }
  },
  { immediate: true }
)

const selectIcon = (icon: string) => {
  emit('update:modelValue', icon)
}
</script>

<template>
  <div class="icon-picker-panel">
    <div class="icon-picker-tabs">
      <button
        type="button"
        class="icon-picker-tab"
        :class="{ 'is-active': activeTab === 'browse' }"
        @click="activeTab = 'browse'"
      >
        Browse
      </button>
      <button
        type="button"
        class="icon-picker-tab"
        :class="{ 'is-active': activeTab === 'paste' }"
        @click="activeTab = 'paste'"
      >
        Paste
      </button>
    </div>

    <div v-if="activeTab === 'browse'" class="icon-picker-browse">
      <div class="icon-picker-toolbar">
        <div class="icon-picker-selected-icon">
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
          <span v-else class="icon-picker-preview-empty" aria-hidden="true"></span>
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

    <div v-else class="icon-picker-paste">
      <div class="icon-picker-paste-row">
        <div class="icon-picker-selected-icon">
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
          <span v-else class="icon-picker-preview-empty" aria-hidden="true"></span>
        </div>

        <input
          v-model="pasteValue"
          type="text"
          class="icon-picker-paste-input"
          placeholder="Paste icon name, e.g. House or mdi:home-city"
        />
      </div>

      <a
        href="https://icon-sets.iconify.design/"
        target="_blank"
        rel="noopener noreferrer"
        class="icon-picker-paste-link"
      >
        icon-sets.iconify.design
      </a>
    </div>
  </div>
</template>

<style scoped>
.icon-picker-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
}

.icon-picker-tabs {
  display: inline-flex;
  align-self: flex-start;
  padding: 3px;
  border-radius: 8px;
  background: #f1f5f9;
  gap: 2px;
}

.icon-picker-tab {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.icon-picker-tab.is-active {
  background: #fff;
  color: var(--el-color-primary);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}

.icon-picker-browse,
.icon-picker-paste {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-picker-toolbar,
.icon-picker-paste-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-picker-selected-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.icon-picker-preview-empty {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: #e2e8f0;
}

.icon-picker-search-input,
.icon-picker-paste-input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  outline: none;
  font-size: 13px;
  color: #334155;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.icon-picker-search-input:focus,
.icon-picker-paste-input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.15);
}

.icon-picker-search-input::placeholder,
.icon-picker-paste-input::placeholder {
  color: #94a3b8;
}

.icon-picker-paste-link {
  display: inline-block;
  font-size: 11px;
  color: var(--el-color-primary);
  text-decoration: none;
  line-height: 1.2;
}

.icon-picker-paste-link:hover {
  text-decoration: underline;
}

.icon-picker-grid-wrap {
  min-height: 0;
}

.icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 4px;
  max-height: 168px;
  overflow-y: auto;
  padding: 2px 4px 2px 0;
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
  aspect-ratio: 1;
  min-height: 28px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.icon-picker-cell:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
  transform: translateY(-1px);
}

.icon-picker-cell.is-selected {
  background: #eff6ff;
  border-color: #93c5fd;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.12);
}

.icon-picker-empty {
  padding: 16px 8px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

.icon-picker-empty p {
  margin: 0;
}
</style>
