<script setup lang="ts">
import type { SettingsTabDefinition } from '@/config/settings/types'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElEmpty, ElTabPane, ElTabs } from 'element-plus'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import { intersection } from 'lodash-es'

const props = defineProps<{
  tabs: SettingsTabDefinition[]
  defaultTab: string
}>()

const route = useRoute()
const router = useRouter()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()

const ALL_PERMISSION = '*.*.*'

const userPermissions = computed<string[]>(() => {
  const info = wsCache.get(appStore.getUserInfo)
  return Array.isArray(info?.permissions) ? info.permissions : []
})

function canAccess(perms: string | string[]): boolean {
  if (userPermissions.value.includes(ALL_PERMISSION)) return true
  const list = Array.isArray(perms) ? perms : [perms]
  return intersection(list, userPermissions.value).length > 0
}

const visibleTabs = computed(() =>
  props.tabs
    .filter((tab) => !tab.hidden && canAccess(tab.permissions))
    .map((tab) => ({
      ...tab,
      component: defineAsyncComponent(tab.component as () => Promise<{ default: unknown }>),
    })),
)

const tabNames = computed(() => visibleTabs.value.map((t) => t.name))

const activeTab = ref(props.defaultTab)

function resolveTabFromQuery(): string {
  const q = String(route.query.tab ?? '')
  if (tabNames.value.includes(q)) return q
  return tabNames.value[0] ?? props.defaultTab
}

watch(
  [() => route.query.tab, tabNames],
  () => {
    const next = resolveTabFromQuery()
    if (activeTab.value !== next) activeTab.value = next
  },
  { immediate: true },
)

watch(activeTab, (tab) => {
  if (!tabNames.value.includes(tab)) return
  if (route.query.tab === tab) return
  router.replace({ path: route.path, query: { ...route.query, tab } })
})
</script>

<template>
  <el-card class="settings-tab-hub">
    <el-tabs
      v-if="visibleTabs.length"
      v-model="activeTab"
      type="border-card"
      class="settings-tab-hub__tabs"
    >
      <el-tab-pane
        v-for="tab in visibleTabs"
        :key="tab.name"
        :label="tab.label"
        :name="tab.name"
        lazy
      >
        <component :is="tab.component" class="settings-tab-hub__panel" />
      </el-tab-pane>
    </el-tabs>
    <el-empty v-else description="You do not have permission to view these settings." />
  </el-card>
</template>

<style scoped>
.settings-tab-hub :deep(.el-card__body) {
  padding-top: 12px;
}

.settings-tab-hub__tabs {
  margin-top: 0;
}

.settings-tab-hub__panel :deep(> .el-card) {
  border: none;
  box-shadow: none;
}

.settings-tab-hub__panel :deep(> .el-card > .el-card__body) {
  padding: 0;
}

.settings-tab-hub__panel :deep(.common-settings-toolbar) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: nowrap;
  margin-bottom: 10px;
  overflow-x: auto;
  width: 100%;
}

.settings-tab-hub__panel :deep(.common-settings-toolbar .common-settings-intro) {
  flex: 1;
  min-width: 0;
  width: auto;
  margin: 0;
  padding: 6px 12px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--el-color-info);
  background: var(--el-color-info-light-9);
  border: 1px solid var(--el-color-info-light-7);
  border-radius: var(--el-border-radius-base);
}

.settings-tab-hub__panel :deep(.common-settings-toolbar .el-alert.common-settings-intro) {
  flex: 1;
  min-width: 0;
  width: auto !important;
  margin: 0;
  padding: 6px 12px;
}

.settings-tab-hub__panel :deep(.admin-units-toolbar__actions) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: nowrap;
  flex-shrink: 0;
  white-space: nowrap;
}

.settings-tab-hub__panel :deep(.admin-units-toolbar__actions > *) {
  flex-shrink: 0;
}

.settings-tab-hub__panel :deep(.admin-units-toolbar__actions .el-tooltip__trigger) {
  display: inline-flex;
  vertical-align: middle;
}

.settings-tab-hub__panel :deep(.admin-units-toolbar__actions > div[style*='inline-block']) {
  display: inline-flex !important;
  margin-left: 0 !important;
  vertical-align: middle;
}

.settings-tab-hub__panel :deep(.table-row-actions) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.settings-tab-hub__panel :deep(.table-row-actions .el-tooltip__trigger) {
  display: inline-flex;
}

@media (max-width: 768px) {
  .settings-tab-hub__panel :deep(.settlement-pagination) {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    row-gap: 8px;
  }
}
</style>
