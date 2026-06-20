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
      type="card"
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
</style>
