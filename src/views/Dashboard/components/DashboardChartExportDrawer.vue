<script setup lang="ts">
import {
  ElButton,
  ElDrawer,
  ElDivider,
  ElCollapse,
  ElCollapseItem,
  ElCheckbox,
  ElCheckboxGroup,
  ElRadioGroup,
  ElRadio,
} from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import type { useDashboardChartExport } from '../composables/useDashboardChartExport'

const props = defineProps<{
  exportApi: ReturnType<typeof useDashboardChartExport>
  chartsLoading: boolean
}>()

const {
  chartsExportLoading,
  exportDrawerVisible,
  exportMode,
  selectedExportChartIds,
  exportCollapseActive,
  canUseNestedExport,
  nestedExportPermissionDenied,
  getExportableChartCount,
  exportDrawerTabGroups,
  allExportChartIds,
  openExportDrawer,
  isTabExportFullySelected,
  isTabExportPartiallySelected,
  toggleTabExportSelection,
  exportAllChartsFromDrawer,
  exportSelectedChartsFromDrawer,
} = props.exportApi
</script>

<template>
  <el-button
    class="dashboard-export-btn"
    text
    :icon="Download"
    :loading="chartsExportLoading"
    :disabled="chartsLoading || getExportableChartCount() === 0"
    @click="openExportDrawer"
  >
    Export charts (ZIP)
  </el-button>

  <el-drawer v-model="exportDrawerVisible" title="Export charts" direction="rtl" size="440px">
    <div class="export-drawer-content">
      <p class="export-drawer-intro">
        Download dashboard charts as PNG files grouped by tab inside a ZIP archive.
      </p>

      <div class="export-mode-group">
        <span class="export-mode-label">Export layout</span>
        <el-radio-group v-model="exportMode">
          <el-radio value="standard">Current view</el-radio>
          <el-radio value="nested" :disabled="!canUseNestedExport">Nested by county</el-radio>
        </el-radio-group>
        <p v-if="exportMode === 'nested'" class="export-drawer-hint">
          Each county gets its own folder with tab subfolders inside the ZIP. This may take several minutes.
        </p>
        <p v-else-if="nestedExportPermissionDenied" class="export-drawer-hint">
          Nested export requires root, super admin, national admin, or county admin access.
        </p>
        <p v-else-if="!canUseNestedExport" class="export-drawer-hint">
          National admins: use the national view with no county filter. County admins: nested export covers your assigned county.
        </p>
      </div>

      <el-button
        type="primary"
        :icon="Download"
        class="export-drawer-all-btn"
        :loading="chartsExportLoading"
        @click="exportAllChartsFromDrawer"
      >
        Download all charts ({{ allExportChartIds.length }})
      </el-button>

      <el-divider content-position="left">Or select charts</el-divider>

      <el-collapse v-model="exportCollapseActive" class="export-tab-collapse">
        <el-collapse-item
          v-for="group in exportDrawerTabGroups"
          :key="group.tabFolder"
          :name="group.tabFolder"
        >
          <template #title>
            <div class="export-tab-group-header" @click.stop>
              <el-checkbox
                :model-value="isTabExportFullySelected(group.charts.map((chart) => chart.id))"
                :indeterminate="isTabExportPartiallySelected(group.charts.map((chart) => chart.id))"
                @change="(checked: boolean) => toggleTabExportSelection(group.charts.map((chart) => chart.id), checked)"
                @click.stop
              />
              <span class="export-tab-group-title">
                {{ group.tabLabel }}
                <span class="export-tab-count">({{ group.charts.length }})</span>
              </span>
            </div>
          </template>
          <el-checkbox-group v-model="selectedExportChartIds" class="export-chart-list">
            <el-checkbox
              v-for="chart in group.charts"
              :key="chart.id"
              :label="chart.id"
              class="export-chart-item"
            >
              {{ chart.title }}
            </el-checkbox>
          </el-checkbox-group>
        </el-collapse-item>
      </el-collapse>

      <div class="export-drawer-actions">
        <el-button @click="exportDrawerVisible = false">Cancel</el-button>
        <el-button
          type="primary"
          :icon="Download"
          :loading="chartsExportLoading"
          :disabled="selectedExportChartIds.length === 0"
          @click="exportSelectedChartsFromDrawer"
        >
          Download selected ({{ selectedExportChartIds.length }})
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.dashboard-export-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
}

.export-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.export-drawer-intro {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.export-mode-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-mode-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.export-drawer-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.export-drawer-all-btn {
  width: 100%;
}

.export-tab-collapse {
  border: none;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.export-tab-collapse :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 44px;
  line-height: 1.4;
  padding: 4px 8px 4px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.export-tab-collapse :deep(.el-collapse-item__title) {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.export-tab-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.export-tab-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 12px;
}

.export-tab-group-header {
  display: flex;
  align-items: center;
  width: 100%;
  flex: 1;
  min-width: 0;
  gap: 10px;
}

.export-tab-group-title {
  flex: 1;
  min-width: 0;
  text-align: left;
  font-weight: 600;
}

.export-tab-count {
  font-weight: 400;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.export-chart-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 8px 0 12px;
}

.export-chart-item {
  display: flex;
  align-items: flex-start;
  margin-right: 0;
  height: auto;
  white-space: normal;
}

.export-chart-item :deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.4;
}

.export-drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
