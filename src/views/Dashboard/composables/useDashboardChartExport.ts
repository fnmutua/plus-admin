import { ref, computed, nextTick, type ComputedRef, type Ref } from 'vue'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { ElMessage } from 'element-plus'
import { useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'
import {
  exportDashboardChartsToZip,
  type DashboardChartExportItem,
  type DashboardChartExportTabGroup,
} from '@/utils/exportDashboardCharts'
import {
  canExportNestedDashboardCharts,
  canUseNationalNestedDashboardExport,
  canUseCountyNestedDashboardExport,
  getCountyAdminCountyIds,
  isSuperAdminUser,
  isNationalAdminUser,
} from '@/utils/documentPermissions'

export interface UseDashboardChartExportOptions {
  tabs: Ref<any[]>
  activeTab: Ref<string | number | undefined>
  chartsLoading: Ref<boolean>
  chartLoadingMessages: Ref<Map<string, string> | Record<string, string>>
  filterLevel: Ref<string>
  selectedCounties: Ref<any[]>
  selectedSubCounties: Ref<any[]>
  selectCounty: Ref<any[]>
  selectSubCounty: Ref<any[]>
  countyList: Ref<any[]>
  subCountyList: Ref<any[]>
  filteredSubCountyList: Ref<any[]>
  statisticsCardFilterContext: ComputedRef<string>
  isChartLoading: (chartId: string | number) => boolean
  getCards: () => Promise<void>
  getTabs: () => Promise<void>
}

type DashboardFilterSnapshot = {
  filterLevel: string
  selectedCounties: any[]
  selectedSubCounties: any[]
  selectCounty: any[]
  selectSubCounty: any[]
  activeTab: string | number | undefined
}

function sanitizeExportFileSegment(value: string): string {
  return String(value || 'dashboard')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60) || 'dashboard'
}

function pendingChartCount(messages: Map<string, string> | Record<string, string>): number {
  if (messages instanceof Map) {
    return messages.size
  }
  return Object.keys(messages).length
}

export function useDashboardChartExport(options: UseDashboardChartExportOptions) {
  const appStore = useAppStore()
  const { wsCache } = useCache()

  const chartsExportLoading = ref(false)
  const exportDrawerVisible = ref(false)
  const exportMode = ref<'standard' | 'nested'>('standard')
  const selectedExportChartIds = ref<string[]>([])
  const exportCollapseActive = ref<string[]>([])
  const chartComponentRefs = new Map<string, unknown>()

  const isNationalDashboardView = computed(
    () => options.filterLevel.value === 'national' && options.selectedCounties.value.length === 0
  )

  const canUseNestedExport = computed(() => {
    const userInfo = wsCache.get(appStore.getUserInfo)
    return (
      canUseNationalNestedDashboardExport(userInfo, isNationalDashboardView.value) ||
      canUseCountyNestedDashboardExport(userInfo)
    )
  })

  const nestedExportPermissionDenied = computed(() => {
    return !canExportNestedDashboardCharts(wsCache.get(appStore.getUserInfo))
  })

  function getNestedExportCounties(userInfo: any): any[] {
    const allCounties = (options.countyList.value as any[]) || []
    if (isSuperAdminUser(userInfo) || isNationalAdminUser(userInfo)) {
      return allCounties
    }
    const countyIds = new Set(getCountyAdminCountyIds(userInfo).map(String))
    return allCounties.filter((county) => countyIds.has(String(county.value)))
  }

  const setChartComponentRef = (chartId: string | number, el: unknown) => {
    const key = String(chartId)
    if (el) {
      chartComponentRefs.set(key, el)
    } else {
      chartComponentRefs.delete(key)
    }
  }

  const getExportableChartsForTab = (tab: any): any[] => {
    return (tab?.charts || []).filter(
      (chart: any) => chart?.chart && !options.isChartLoading(chart.id)
    )
  }

  const getExportableChartCount = (): number => {
    return ((options.tabs.value as any[]) || []).reduce(
      (count, tab) => count + getExportableChartsForTab(tab).length,
      0
    )
  }

  const exportDrawerTabGroups = computed(() => {
    return ((options.tabs.value as any[]) || [])
      .map((tab) => {
        const charts = getExportableChartsForTab(tab).map((chart: any) => ({
          id: String(chart.id),
          title: chart.title || `Chart ${chart.id}`,
        }))
        return {
          tabName: tab.name,
          tabLabel: String(tab.label || tab.name || 'Tab'),
          tabFolder: sanitizeExportFileSegment(tab.label || tab.name || 'Tab'),
          charts,
        }
      })
      .filter((group) => group.charts.length > 0)
  })

  const allExportChartIds = computed(() =>
    exportDrawerTabGroups.value.flatMap((group) => group.charts.map((chart) => chart.id))
  )

  const openExportDrawer = () => {
    if (!canUseNestedExport.value) {
      exportMode.value = 'standard'
    }
    selectedExportChartIds.value = [...allExportChartIds.value]
    exportCollapseActive.value = exportDrawerTabGroups.value.map((group) => group.tabFolder)
    exportDrawerVisible.value = true
  }

  const isTabExportFullySelected = (chartIds: string[]) =>
    chartIds.length > 0 && chartIds.every((id) => selectedExportChartIds.value.includes(id))

  const isTabExportPartiallySelected = (chartIds: string[]) => {
    const selectedCount = chartIds.filter((id) => selectedExportChartIds.value.includes(id)).length
    return selectedCount > 0 && selectedCount < chartIds.length
  }

  const toggleTabExportSelection = (chartIds: string[], checked: boolean) => {
    if (checked) {
      selectedExportChartIds.value = [...new Set([...selectedExportChartIds.value, ...chartIds])]
      return
    }
    selectedExportChartIds.value = selectedExportChartIds.value.filter((id) => !chartIds.includes(id))
  }

  const buildChartExportConfig = (chart: any): Record<string, unknown> => {
    if (chart.type === 8) {
      return chart.chart as Record<string, unknown>
    }
    return chart.chart as Record<string, unknown>
  }

  const waitForTabCharts = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 200)
        })
      })
    })

  const waitForChartsReady = (timeoutMs = 180000) =>
    new Promise<void>((resolve, reject) => {
      const started = Date.now()
      const poll = () => {
        const pending = pendingChartCount(options.chartLoadingMessages.value)
        if (!options.chartsLoading.value && pending === 0) {
          resolve()
          return
        }
        if (Date.now() - started > timeoutMs) {
          reject(new Error('Timed out waiting for charts to load'))
          return
        }
        setTimeout(poll, 300)
      }
      poll()
    })

  function saveDashboardFilterSnapshot(): DashboardFilterSnapshot {
    return {
      filterLevel: options.filterLevel.value,
      selectedCounties: [...options.selectedCounties.value],
      selectedSubCounties: [...options.selectedSubCounties.value],
      selectCounty: [...options.selectCounty.value],
      selectSubCounty: [...options.selectSubCounty.value],
      activeTab: options.activeTab.value,
    }
  }

  async function restoreDashboardFilterSnapshot(snapshot: DashboardFilterSnapshot) {
    options.filterLevel.value = snapshot.filterLevel
    options.selectedCounties.value = [...snapshot.selectedCounties]
    options.selectedSubCounties.value = [...snapshot.selectedSubCounties]
    options.selectCounty.value = [...snapshot.selectCounty]
    options.selectSubCounty.value = [...snapshot.selectSubCounty]
    options.filteredSubCountyList.value = snapshot.selectCounty.length
      ? options.subCountyList.value.filter((option: any) =>
          snapshot.selectCounty.includes(option.county_id)
        )
      : [...options.subCountyList.value]
    chartComponentRefs.clear()
    await options.getCards()
    await options.getTabs()
    await waitForChartsReady()
    if (snapshot.activeTab != null) {
      options.activeTab.value = snapshot.activeTab
    }
  }

  function buildExportTabGroupsFromTabs(
    chartIds: Set<string> | null,
    parentFolder?: string
  ): {
    tabGroups: DashboardChartExportTabGroup[]
    chartConfigs: Map<string, Record<string, unknown>>
    tabNameByFolder: Map<string, string | number>
  } {
    const allTabs = (options.tabs.value as any[]) || []
    const tabGroups: DashboardChartExportTabGroup[] = []
    const chartConfigs = new Map<string, Record<string, unknown>>()
    const tabNameByFolder = new Map<string, string | number>()

    for (const tab of allTabs) {
      const charts = getExportableChartsForTab(tab).filter(
        (chart: any) => !chartIds || chartIds.has(String(chart.id))
      )
      if (!charts.length) continue

      const tabFolder = sanitizeExportFileSegment(tab.label || tab.name || 'Tab')
      const lookupKey = parentFolder ? `${parentFolder}/${tabFolder}` : tabFolder
      tabNameByFolder.set(lookupKey, tab.name)

      const exportItems: DashboardChartExportItem[] = charts.map((chart: any) => {
        chartConfigs.set(String(chart.id), buildChartExportConfig(chart))
        return {
          id: chart.id,
          title: chart.title || `Chart ${chart.id}`,
          type: chart.type,
          chartExpanded: chart.chartExpanded,
          chartHeight: chart.chartHeight,
        }
      })

      tabGroups.push({
        tabFolder,
        parentFolder,
        charts: exportItems,
      })
    }

    return { tabGroups, chartConfigs, tabNameByFolder }
  }

  async function applyCountyFilterForExport(countyId: string | number) {
    options.selectedSubCounties.value = []
    options.selectedCounties.value = [countyId]
    options.filterLevel.value = 'county'
    chartComponentRefs.clear()
    await options.getCards()
    await options.getTabs()
    await waitForChartsReady()
    await nextTick()
    await waitForTabCharts()
  }

  const exportStandardChartsZip = async (chartIds: Set<string> | 'all') => {
    const selectedIds = chartIds === 'all' ? null : chartIds
    const { tabGroups, chartConfigs, tabNameByFolder } = buildExportTabGroupsFromTabs(selectedIds)

    if (!tabGroups.length) {
      ElMessage.warning(selectedIds ? 'Select at least one chart to export' : 'No charts are ready to export')
      return
    }

    const scopeLabel = sanitizeExportFileSegment(options.statisticsCardFilterContext.value || 'Kenya')
    const zipFileName = `${scopeLabel}_dashboard_charts_${new Date().toISOString().slice(0, 10)}.zip`
    const previousTab = options.activeTab.value

    try {
      chartsExportLoading.value = true

      const { exported, skipped } = await exportDashboardChartsToZip({
        tabGroups,
        chartConfigs,
        chartComponentRefs,
        zipFileName,
        isDark: appStore.getIsDark,
        onBeforeTabExport: async (group) => {
          const tabName = tabNameByFolder.get(group.tabFolder)
          if (tabName == null) return
          options.activeTab.value = tabName
          await nextTick()
          await waitForTabCharts()
        },
      })

      exportDrawerVisible.value = false

      if (skipped > 0) {
        ElMessage.success(
          `Exported ${exported} chart(s) across ${tabGroups.length} tab(s). ${skipped} chart(s) could not be captured.`
        )
      } else {
        ElMessage.success(`Exported ${exported} chart(s) across ${tabGroups.length} tab(s) to ZIP`)
      }
    } catch (error: any) {
      ElMessage.error(error?.message || 'Failed to export charts')
    } finally {
      options.activeTab.value = previousTab
      chartsExportLoading.value = false
    }
  }

  const exportNestedChartsZip = async (chartIds: Set<string> | 'all') => {
    const selectedIds = chartIds === 'all' ? null : chartIds
    const userInfo = wsCache.get(appStore.getUserInfo)
    const counties = getNestedExportCounties(userInfo)

    if (!counties.length) {
      ElMessage.warning('No counties available for nested export')
      return
    }

    const snapshot = saveDashboardFilterSnapshot()
    const dateStamp = new Date().toISOString().slice(0, 10)
    const zipFileName =
      counties.length === 1
        ? `${sanitizeExportFileSegment(counties[0].label || counties[0].value)}_dashboard_charts_nested_${dateStamp}.zip`
        : `Kenya_dashboard_charts_nested_${dateStamp}.zip`
    const zip = new JSZip()
    const usedPaths = new Set<string>()
    let exported = 0
    let skipped = 0
    let countiesProcessed = 0

    try {
      chartsExportLoading.value = true

      for (const county of counties) {
        const countyFolder = sanitizeExportFileSegment(county.label || county.value)
        await applyCountyFilterForExport(county.value)

        const { tabGroups, chartConfigs, tabNameByFolder } = buildExportTabGroupsFromTabs(
          selectedIds,
          countyFolder
        )

        if (!tabGroups.length) {
          continue
        }

        const result = await exportDashboardChartsToZip({
          tabGroups,
          chartConfigs,
          chartComponentRefs,
          zipFileName,
          isDark: appStore.getIsDark,
          zip,
          usedPaths,
          download: false,
          allowEmpty: true,
          onBeforeTabExport: async (group) => {
            const lookupKey = `${group.parentFolder}/${group.tabFolder}`
            const tabName = tabNameByFolder.get(lookupKey)
            if (tabName == null) return
            options.activeTab.value = tabName
            await nextTick()
            await waitForTabCharts()
          },
        })

        exported += result.exported
        skipped += result.skipped
        if (result.exported > 0) {
          countiesProcessed++
        }
      }

      if (exported === 0) {
        throw new Error('Could not export any charts for the selected counties')
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, zipFileName)
      exportDrawerVisible.value = false

      if (skipped > 0) {
        ElMessage.success(
          `Exported ${exported} chart(s) across ${countiesProcessed} counties. ${skipped} chart(s) could not be captured.`
        )
      } else {
        ElMessage.success(`Exported ${exported} chart(s) across ${countiesProcessed} counties to ZIP`)
      }
    } catch (error: any) {
      ElMessage.error(error?.message || 'Failed to export nested charts')
    } finally {
      await restoreDashboardFilterSnapshot(snapshot)
      chartsExportLoading.value = false
    }
  }

  const exportChartsZip = async (chartIds: Set<string> | 'all') => {
    if (exportMode.value === 'nested' && canUseNestedExport.value) {
      await exportNestedChartsZip(chartIds)
      return
    }
    await exportStandardChartsZip(chartIds)
  }

  const exportAllChartsFromDrawer = () => exportChartsZip('all')

  const exportSelectedChartsFromDrawer = () => {
    exportChartsZip(new Set(selectedExportChartIds.value))
  }

  return {
    chartsExportLoading,
    exportDrawerVisible,
    exportMode,
    selectedExportChartIds,
    exportCollapseActive,
    canUseNestedExport,
    nestedExportPermissionDenied,
    setChartComponentRef,
    getExportableChartCount,
    exportDrawerTabGroups,
    allExportChartIds,
    openExportDrawer,
    isTabExportFullySelected,
    isTabExportPartiallySelected,
    toggleTabExportSelection,
    exportAllChartsFromDrawer,
    exportSelectedChartsFromDrawer,
  }
}
