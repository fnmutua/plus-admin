import { ref, computed, nextTick, type ComputedRef, type Ref } from 'vue'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { ElMessage } from 'element-plus'
import { useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'
import {
  exportDashboardChartsToZip,
  ExportCancelledError,
  type DashboardChartExportItem,
  type DashboardChartExportTabGroup,
} from '@/utils/exportDashboardCharts'
import {
  canExportNestedDashboardCharts,
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
  selectedWards: Ref<any[]>
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
  selectedWards: any[]
  selectCounty: any[]
  selectSubCounty: any[]
  activeTab: string | number | undefined
}

type NestedExportDimension = 'county' | 'subcounty' | 'ward'

type NestedExportUnit = {
  id: string | number
  label: string
  folder: string
  countyId?: string | number
  subcountyId?: string | number
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
  const exportCancelRequested = ref(false)
  const exportDrawerVisible = ref(false)
  const exportMode = ref<'standard' | 'nested'>('standard')
  const selectedExportChartIds = ref<string[]>([])
  const exportCollapseActive = ref<string[]>([])
  const chartComponentRefs = new Map<string, unknown>()

  function getNestedExportDimension(): NestedExportDimension {
    if (
      options.filterLevel.value === 'subcounty' &&
      options.selectedSubCounties.value.length > 0
    ) {
      return 'ward'
    }
    if (options.filterLevel.value === 'county' && options.selectedCounties.value.length > 0) {
      return 'subcounty'
    }
    return 'county'
  }

  const nestedExportDimension = computed(() => getNestedExportDimension())

  const nestedExportUnitLabel = computed(() => {
    switch (nestedExportDimension.value) {
      case 'subcounty':
        return 'constituency'
      case 'ward':
        return 'ward'
      default:
        return 'county'
    }
  })

  const nestedExportUnitLabelPlural = computed(() => {
    switch (nestedExportDimension.value) {
      case 'subcounty':
        return 'constituencies'
      case 'ward':
        return 'wards'
      default:
        return 'counties'
    }
  })

  const nestedExportRadioLabel = computed(
    () => `Nested by ${nestedExportUnitLabel.value}`
  )

  const nestedExportDescription = computed(() => {
    switch (nestedExportDimension.value) {
      case 'subcounty':
        return 'Each constituency in your selected county gets its own folder with tab subfolders inside the ZIP.'
      case 'ward':
        return 'Each ward in your selected constituency gets its own folder with tab subfolders inside the ZIP.'
      default:
        return 'Each county gets its own folder with tab subfolders inside the ZIP.'
    }
  })

  const nestedExportUnavailableReason = computed(() => {
    if (nestedExportPermissionDenied.value) {
      return 'Nested export requires root, super admin, national admin, or county admin access.'
    }
    switch (nestedExportDimension.value) {
      case 'subcounty':
        return 'No constituencies are available under your current county selection.'
      case 'ward':
        return 'Select a constituency first — wards are exported from the constituency filter.'
      default:
        return 'No counties are available for export with your account.'
    }
  })

  function getNestedExportCounties(userInfo: any): any[] {
    const allCounties = (options.countyList.value as any[]) || []
    if (isSuperAdminUser(userInfo) || isNationalAdminUser(userInfo)) {
      return allCounties
    }
    const countyIds = new Set(getCountyAdminCountyIds(userInfo).map(String))
    return allCounties.filter((county) => countyIds.has(String(county.value)))
  }

  function getAllWardsFromSubCountyList(): any[] {
    const wards: any[] = []
    for (const subcounty of (options.subCountyList.value as any[]) || []) {
      if (!Array.isArray(subcounty.children)) continue
      for (const ward of subcounty.children) {
        wards.push({
          value: ward.value,
          label: ward.label,
          subcounty_id: ward.subcounty_id ?? subcounty.value,
          county_id: ward.county_id ?? subcounty.county_id,
        })
      }
    }
    return wards
  }

  function getNestedExportSubCounties(userInfo: any): any[] {
    const allSubCounties = (options.subCountyList.value as any[]) || []
    const countyScope =
      options.selectedCounties.value.length > 0
        ? new Set(options.selectedCounties.value.map(String))
        : new Set(getNestedExportCounties(userInfo).map((county) => String(county.value)))

    return allSubCounties.filter((subcounty) => countyScope.has(String(subcounty.county_id)))
  }

  function getNestedExportWards(): any[] {
    const subcountyScope = new Set(options.selectedSubCounties.value.map(String))
    return getAllWardsFromSubCountyList().filter((ward) =>
      subcountyScope.has(String(ward.subcounty_id))
    )
  }

  function getNestedExportUnits(userInfo: any): NestedExportUnit[] {
    const dimension = getNestedExportDimension()

    if (dimension === 'ward') {
      return getNestedExportWards().map((ward) => ({
        id: ward.value,
        label: String(ward.label || ward.value),
        folder: sanitizeExportFileSegment(ward.label || ward.value),
        countyId: ward.county_id,
        subcountyId: ward.subcounty_id,
      }))
    }

    if (dimension === 'subcounty') {
      return getNestedExportSubCounties(userInfo).map((subcounty) => ({
        id: subcounty.value,
        label: String(subcounty.label || subcounty.value),
        folder: sanitizeExportFileSegment(subcounty.label || subcounty.value),
        countyId: subcounty.county_id,
        subcountyId: subcounty.value,
      }))
    }

    return getNestedExportCounties(userInfo).map((county) => ({
      id: county.value,
      label: String(county.label || county.value),
      folder: sanitizeExportFileSegment(county.label || county.value),
      countyId: county.value,
    }))
  }

  const canUseNestedExport = computed(() => {
    const userInfo = wsCache.get(appStore.getUserInfo)
    if (!canExportNestedDashboardCharts(userInfo)) return false
    return getNestedExportUnits(userInfo).length > 0
  })

  const nestedExportPermissionDenied = computed(() => {
    return !canExportNestedDashboardCharts(wsCache.get(appStore.getUserInfo))
  })

  const shouldCancelExport = () => exportCancelRequested.value

  const throwIfExportCancelled = () => {
    if (exportCancelRequested.value) {
      throw new ExportCancelledError()
    }
  }

  const beginChartsExport = () => {
    exportCancelRequested.value = false
    chartsExportLoading.value = true
  }

  const finishChartsExport = () => {
    chartsExportLoading.value = false
    exportCancelRequested.value = false
  }

  const cancelChartsExport = () => {
    if (chartsExportLoading.value) {
      exportCancelRequested.value = true
    }
  }

  const handleExportError = (error: any) => {
    if (error instanceof ExportCancelledError || error?.name === 'ExportCancelledError') {
      ElMessage.info('Export cancelled')
      return
    }
    ElMessage.error(error?.message || 'Failed to export charts')
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
        if (exportCancelRequested.value) {
          reject(new ExportCancelledError())
          return
        }
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
      selectedWards: [...options.selectedWards.value],
      selectCounty: [...options.selectCounty.value],
      selectSubCounty: [...options.selectSubCounty.value],
      activeTab: options.activeTab.value,
    }
  }

  async function restoreDashboardFilterSnapshot(snapshot: DashboardFilterSnapshot) {
    options.filterLevel.value = snapshot.filterLevel
    options.selectedCounties.value = [...snapshot.selectedCounties]
    options.selectedSubCounties.value = [...snapshot.selectedSubCounties]
    options.selectedWards.value = [...snapshot.selectedWards]
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

  async function applyNestedUnitFilterForExport(
    unit: NestedExportUnit,
    dimension: NestedExportDimension
  ) {
    throwIfExportCancelled()
    chartComponentRefs.clear()

    if (dimension === 'county') {
      options.selectedSubCounties.value = []
      options.selectedWards.value = []
      options.selectedCounties.value = [unit.id]
      options.selectCounty.value = [unit.id]
      options.selectSubCounty.value = []
      options.filterLevel.value = 'county'
    } else if (dimension === 'subcounty') {
      options.selectedCounties.value = unit.countyId != null ? [unit.countyId] : []
      options.selectedSubCounties.value = [unit.id]
      options.selectedWards.value = []
      options.selectCounty.value = unit.countyId != null ? [unit.countyId] : []
      options.selectSubCounty.value = [unit.id]
      options.filterLevel.value = 'subcounty'
    } else {
      options.selectedCounties.value = unit.countyId != null ? [unit.countyId] : []
      options.selectedSubCounties.value = unit.subcountyId != null ? [unit.subcountyId] : []
      options.selectedWards.value = [unit.id]
      options.selectCounty.value = unit.countyId != null ? [unit.countyId] : []
      options.selectSubCounty.value = unit.subcountyId != null ? [unit.subcountyId] : []
      options.filterLevel.value = 'ward'
    }

    if (options.selectCounty.value.length) {
      options.filteredSubCountyList.value = options.subCountyList.value.filter((option: any) =>
        options.selectCounty.value.includes(option.county_id)
      )
    } else {
      options.filteredSubCountyList.value = [...options.subCountyList.value]
    }

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
      beginChartsExport()

      const { exported, skipped } = await exportDashboardChartsToZip({
        tabGroups,
        chartConfigs,
        chartComponentRefs,
        zipFileName,
        isDark: appStore.getIsDark,
        shouldCancel: shouldCancelExport,
        onBeforeTabExport: async (group) => {
          throwIfExportCancelled()
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
      handleExportError(error)
    } finally {
      options.activeTab.value = previousTab
      finishChartsExport()
    }
  }

  const exportNestedChartsZip = async (chartIds: Set<string> | 'all') => {
    const selectedIds = chartIds === 'all' ? null : chartIds
    const userInfo = wsCache.get(appStore.getUserInfo)
    const dimension = getNestedExportDimension()
    const units = getNestedExportUnits(userInfo)
    const unitLabelPlural = nestedExportUnitLabelPlural.value

    if (!units.length) {
      ElMessage.warning(`No ${unitLabelPlural} available for nested export`)
      return
    }

    const snapshot = saveDashboardFilterSnapshot()
    const dateStamp = new Date().toISOString().slice(0, 10)
    const scopeLabel = sanitizeExportFileSegment(options.statisticsCardFilterContext.value || 'Kenya')
    const zipFileName =
      units.length === 1
        ? `${sanitizeExportFileSegment(units[0].label)}_dashboard_charts_nested_${dateStamp}.zip`
        : `${scopeLabel}_dashboard_charts_nested_${dateStamp}.zip`
    const zip = new JSZip()
    const usedPaths = new Set<string>()
    let exported = 0
    let skipped = 0
    let unitsProcessed = 0

    try {
      beginChartsExport()

      for (const unit of units) {
        throwIfExportCancelled()
        await applyNestedUnitFilterForExport(unit, dimension)

        const { tabGroups, chartConfigs, tabNameByFolder } = buildExportTabGroupsFromTabs(
          selectedIds,
          unit.folder
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
          shouldCancel: shouldCancelExport,
          onBeforeTabExport: async (group) => {
            throwIfExportCancelled()
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
          unitsProcessed++
        }
      }

      throwIfExportCancelled()

      if (exported === 0) {
        throw new Error(`Could not export any charts for the selected ${unitLabelPlural}`)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      throwIfExportCancelled()
      saveAs(content, zipFileName)
      exportDrawerVisible.value = false

      if (skipped > 0) {
        ElMessage.success(
          `Exported ${exported} chart(s) across ${unitsProcessed} ${unitLabelPlural}. ${skipped} chart(s) could not be captured.`
        )
      } else {
        ElMessage.success(
          `Exported ${exported} chart(s) across ${unitsProcessed} ${unitLabelPlural} to ZIP`
        )
      }
    } catch (error: any) {
      handleExportError(error)
    } finally {
      await restoreDashboardFilterSnapshot(snapshot)
      finishChartsExport()
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
    nestedExportRadioLabel,
    nestedExportDescription,
    nestedExportUnavailableReason,
    nestedExportUnitLabel,
    nestedExportUnitLabelPlural,
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
    cancelChartsExport,
  }
}
