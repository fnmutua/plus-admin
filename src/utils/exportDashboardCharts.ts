import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import ApexCharts from 'apexcharts'
import echarts from '@/plugins/echarts'
import { getChartExportOptions } from '@/views/Dashboard/chart-types'

export interface DashboardChartExportItem {
  id: string | number
  title: string
  type: number
  chartExpanded?: boolean
  chartHeight?: number
}

export interface DashboardChartExportTabGroup {
  tabFolder: string
  charts: DashboardChartExportItem[]
  /** When set, charts are placed under `{parentFolder}/{tabFolder}/` in the ZIP. */
  parentFolder?: string
}

function sanitizeFileName(name: string): string {
  const cleaned = (name || 'chart')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80)
  return cleaned || 'chart'
}

function dataUriToBlob(dataUri: string): Blob {
  const [header, base64] = dataUri.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

/** Smallest valid PNG exports are well above this; empty/broken canvas exports are ~0–70 bytes. */
const MIN_PNG_BYTES = 100

function blobFromDataUri(dataUri: string | undefined): Blob | null {
  if (!dataUri?.startsWith('data:image') || dataUri.endsWith('base64,') || dataUri === 'data:,') {
    return null
  }
  try {
    const blob = dataUriToBlob(dataUri)
    return blob.size >= MIN_PNG_BYTES ? blob : null
  } catch {
    return null
  }
}

type ApexChartInstance = {
  dataURI?: (opts?: object) => Promise<{ imgURI?: string; blob?: Blob }>
  windowResize?: () => void
  w?: {
    globals?: {
      svgWidth?: number
      dom?: { elWrap?: { style?: { height?: string } } }
    }
  }
}

function getApexChartInstance(componentRef?: unknown, chartId?: string | number): ApexChartInstance | null {
  const comp = componentRef as { chart?: ApexChartInstance | { value?: ApexChartInstance | null } } | null
  const chartRef = comp?.chart
  if (chartRef && typeof chartRef === 'object' && 'value' in chartRef) {
    return chartRef.value ?? null
  }
  if (chartRef) {
    return chartRef as ApexChartInstance
  }

  if (chartId != null) {
    return (ApexCharts.getChartByID(String(chartId)) as ApexChartInstance | undefined) ?? null
  }

  return null
}

function apexChartHasLayout(instance: ApexChartInstance): boolean {
  const svgWidth = instance.w?.globals?.svgWidth ?? 0
  const height = parseInt(instance.w?.globals?.dom?.elWrap?.style?.height || '0', 10)
  return svgWidth > 0 && height > 0
}

async function waitForApexChartLayout(instance: ApexChartInstance, attempts = 12): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    instance.windowResize?.()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    if (apexChartHasLayout(instance)) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, 60))
  }

  return apexChartHasLayout(instance)
}

async function renderApexChartPng(
  instance: ApexChartInstance,
  exportOpts: { scale: number; width?: number }
): Promise<Blob | null> {
  // Prefer scale only — Apex uses width/svgWidth when scale is absent, which breaks if svgWidth is 0.
  const safeExportOpts = { scale: exportOpts.scale ?? 2 }
  const result = await instance.dataURI?.(safeExportOpts)
  if (!result) return null

  if (result.blob && result.blob.size >= MIN_PNG_BYTES) {
    return result.blob
  }

  return blobFromDataUri(result.imgURI)
}

function readApexExportOptions(
  chartConfig: Record<string, unknown> | undefined,
  chartHeight?: number,
  expanded?: boolean
): { scale: number; width?: number } {
  const toolbarExport = (chartConfig?.chart as Record<string, unknown> | undefined)?.toolbar as
    | Record<string, unknown>
    | undefined
  const fromConfig = toolbarExport?.export as { scale?: number; width?: number } | undefined
  if (fromConfig?.scale || fromConfig?.width) {
    return {
      scale: fromConfig.scale ?? 2,
      width: fromConfig.width,
    }
  }
  if (chartHeight != null) {
    return getChartExportOptions(chartHeight, !!expanded)
  }
  return { scale: 2, width: 1800 }
}

async function exportApexChartPng(
  chartId: string | number,
  exportOpts: { scale: number; width?: number },
  componentRef?: unknown
): Promise<Blob | null> {
  await document.fonts.ready

  const instance = getApexChartInstance(componentRef, chartId)
  if (!instance?.dataURI) {
    return null
  }

  const ready = await waitForApexChartLayout(instance)
  if (!ready) {
    return null
  }

  return renderApexChartPng(instance, exportOpts)
}

function exportEchartsMapPng(
  chartId: string | number,
  isDark: boolean,
  componentRef?: unknown
): Blob | null {
  const comp = componentRef as {
    getEchartsInstance?: () => ReturnType<typeof echarts.getInstanceByDom>
    chart?: ReturnType<typeof echarts.getInstanceByDom>
    $el?: HTMLElement
  } | null

  let instance =
    comp?.getEchartsInstance?.() ??
    comp?.chart ??
    (comp?.$el ? echarts.getInstanceByDom(comp.$el) : null)

  if (!instance) {
    const container = document.getElementById(`map-container-${chartId}`)
    const chartEl = container?.querySelector('.chart') as HTMLElement | null
    if (chartEl) {
      instance = echarts.getInstanceByDom(chartEl)
    }
  }

  if (!instance) return null

  const dataUrl = instance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: isDark ? '#141414' : '#ffffff',
  })

  if (!dataUrl || !dataUrl.startsWith('data:image') || dataUrl === 'data:,') {
    return null
  }

  const blob = dataUriToBlob(dataUrl)
  if (blob.size < MIN_PNG_BYTES) {
    return null
  }

  return blob
}

export class ExportCancelledError extends Error {
  constructor() {
    super('Export cancelled')
    this.name = 'ExportCancelledError'
  }
}

function checkExportCancelled(shouldCancel?: () => boolean) {
  if (shouldCancel?.()) {
    throw new ExportCancelledError()
  }
}

export async function exportDashboardChartsToZip(options: {
  tabGroups: DashboardChartExportTabGroup[]
  chartConfigs: Map<string, Record<string, unknown>>
  chartComponentRefs: Map<string, unknown>
  zipFileName: string
  isDark?: boolean
  onBeforeTabExport?: (group: DashboardChartExportTabGroup) => Promise<void>
  zip?: JSZip
  usedPaths?: Set<string>
  download?: boolean
  allowEmpty?: boolean
  shouldCancel?: () => boolean
}): Promise<{ exported: number; skipped: number; zip: JSZip }> {
  const {
    tabGroups,
    chartConfigs,
    chartComponentRefs,
    zipFileName,
    isDark = false,
    onBeforeTabExport,
    zip: existingZip,
    usedPaths: existingUsedPaths,
    download = true,
    allowEmpty = false,
    shouldCancel,
  } = options

  checkExportCancelled(shouldCancel)

  const totalCharts = tabGroups.reduce((sum, group) => sum + group.charts.length, 0)
  if (!totalCharts) {
    if (allowEmpty && existingZip) {
      return { exported: 0, skipped: 0, zip: existingZip }
    }
    throw new Error('No charts to export')
  }

  const zip = existingZip ?? new JSZip()
  let exported = 0
  let skipped = 0
  const usedPaths = existingUsedPaths ?? new Set<string>()

  for (const group of tabGroups) {
    checkExportCancelled(shouldCancel)

    if (onBeforeTabExport) {
      await onBeforeTabExport(group)
    }

    checkExportCancelled(shouldCancel)

    const tabFolder = sanitizeFileName(group.tabFolder || 'Charts')
    const parentFolder = group.parentFolder ? sanitizeFileName(group.parentFolder) : ''
    const folder = parentFolder ? `${parentFolder}/${tabFolder}` : tabFolder

    for (const chart of group.charts) {
      checkExportCancelled(shouldCancel)

      const key = String(chart.id)
      const config = chartConfigs.get(key)
      const componentRef = chartComponentRefs.get(key)
      let blob: Blob | null = null

      if (chart.type === 7) {
        blob = exportEchartsMapPng(chart.id, isDark, componentRef)
      } else if (chart.type === 8) {
        const pyramidOptions = (config?.chartOptions as Record<string, unknown>) || config
        const exportOpts = readApexExportOptions(pyramidOptions, 300, false)
        blob = await exportApexChartPng(chart.id, exportOpts, componentRef)
      } else {
        const exportOpts = readApexExportOptions(config, chart.chartHeight, chart.chartExpanded)
        blob = await exportApexChartPng(chart.id, exportOpts, componentRef)
      }

      if (!blob || blob.size < MIN_PNG_BYTES) {
        skipped++
        continue
      }

      const baseName = sanitizeFileName(chart.title || `chart_${key}`)
      let fileName = `${baseName}.png`
      let zipPath = `${folder}/${fileName}`
      let suffix = 2
      while (usedPaths.has(zipPath)) {
        fileName = `${baseName}_${suffix}.png`
        zipPath = `${folder}/${fileName}`
        suffix++
      }
      usedPaths.add(zipPath)
      zip.file(zipPath, blob)
      exported++
    }
  }

  if (exported === 0 && !allowEmpty) {
    throw new Error('Could not export any charts. Make sure charts are fully loaded.')
  }

  if (download) {
    checkExportCancelled(shouldCancel)
    const content = await zip.generateAsync({ type: 'blob' })
    checkExportCancelled(shouldCancel)
    saveAs(content, zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`)
  }

  return { exported, skipped, zip }
}
