import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { toRaw } from 'vue'
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
  let chartRef: unknown = comp?.chart
  if (chartRef && typeof chartRef === 'object' && 'value' in (chartRef as object)) {
    chartRef = (chartRef as { value?: ApexChartInstance | null }).value ?? null
  }

  // vue3-apexcharts keeps the instance in a ref, so Vue hands back a reactive proxy.
  // Apex reads its own internals through `this` — always work with the raw object.
  if (chartRef) {
    return toRaw(chartRef) as ApexChartInstance
  }

  // Only registered when the chart config sets `chart.id`, so treat this as a fallback.
  if (chartId != null) {
    const byId = ApexCharts.getChartByID(String(chartId)) as ApexChartInstance | undefined
    if (byId) return toRaw(byId) as ApexChartInstance
  }

  return null
}

/** Root element of the chart component, used for the DOM capture fallback. */
function getComponentElement(componentRef?: unknown): HTMLElement | null {
  const el = (componentRef as { $el?: unknown } | null)?.$el
  return el instanceof HTMLElement ? el : null
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      resolve(null)
    }, ms)
    promise
      .then((value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(value)
      })
      .catch(() => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(null)
      })
  })
}

const SVG_RASTERIZE_TIMEOUT_MS = 8000
const APEX_DATA_URI_TIMEOUT_MS = 20000

/** Overlay layers that are interactive-only and must not be baked into the PNG. */
const NON_PRINTING_SELECTORS = [
  '.apexcharts-tooltip',
  '.apexcharts-toolbar',
  '.apexcharts-xaxistooltip',
  '.apexcharts-yaxistooltip',
  '.apexcharts-xcrosshairs',
  '.apexcharts-ycrosshairs',
  '.apexcharts-zoom-rect',
  '.apexcharts-selection-rect',
].join(', ')

/**
 * Rasterize a rendered chart straight from the DOM. Used when the Apex instance is
 * unreachable or its own exporter yields nothing — it only needs the chart to be visible.
 */
async function rasterizeSvgElement(
  svg: SVGSVGElement,
  scale: number,
  background: string
): Promise<Blob | null> {
  const rect = svg.getBoundingClientRect()
  const width = Math.ceil(rect.width || Number(svg.getAttribute('width')) || 0)
  const height = Math.ceil(rect.height || Number(svg.getAttribute('height')) || 0)
  if (!width || !height) return null

  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }
  clone.querySelectorAll(NON_PRINTING_SELECTORS).forEach((node) => node.remove())

  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    new XMLSerializer().serializeToString(clone)
  )}`

  const img = new Image()
  img.crossOrigin = 'anonymous'
  const loaded = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), SVG_RASTERIZE_TIMEOUT_MS)
    img.onload = () => {
      clearTimeout(timer)
      resolve(true)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(false)
    }
    img.src = svgUrl
  })
  if (!loaded) return null

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * scale)
  canvas.height = Math.ceil(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  try {
    return blobFromDataUri(canvas.toDataURL('image/png'))
  } catch {
    return null
  }
}

async function captureChartFromDom(
  componentRef: unknown,
  scale: number,
  isDark: boolean
): Promise<Blob | null> {
  const root = getComponentElement(componentRef)
  const svg = root?.querySelector('svg') as SVGSVGElement | null
  if (!svg) return null
  return rasterizeSvgElement(svg, scale || 2, isDark ? '#141414' : '#ffffff')
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
  // Apex's dataURI never rejects and never resolves if the SVG image fails to load,
  // so it must be raced against a timeout or one bad chart stalls the whole export.
  let pending: Promise<{ imgURI?: string; blob?: Blob }> | undefined
  try {
    pending = instance.dataURI?.(safeExportOpts)
  } catch {
    return null
  }
  if (!pending) return null

  const result = await withTimeout(pending, APEX_DATA_URI_TIMEOUT_MS)
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

type ChartCapture = { blob: Blob | null; reason?: string }

async function exportApexChartPng(
  chartId: string | number,
  exportOpts: { scale: number; width?: number },
  componentRef?: unknown,
  isDark = false
): Promise<ChartCapture> {
  await document.fonts.ready

  const scale = exportOpts.scale ?? 2
  const instance = getApexChartInstance(componentRef, chartId)

  if (instance?.dataURI) {
    if (await waitForApexChartLayout(instance)) {
      const blob = await renderApexChartPng(instance, exportOpts)
      if (blob) return { blob }
    }
  }

  // Instance missing, never laid out, or its exporter produced nothing — read the DOM instead.
  const blob = await captureChartFromDom(componentRef, scale, isDark)
  if (blob) return { blob }

  if (!instance?.dataURI) {
    return {
      blob: null,
      reason: componentRef ? 'chart instance not available' : 'chart not rendered',
    }
  }
  return { blob: null, reason: 'chart produced an empty image' }
}

function exportEchartsMapPng(
  chartId: string | number,
  isDark: boolean,
  componentRef?: unknown
): ChartCapture {
  const comp = componentRef as {
    getEchartsInstance?: () => ReturnType<typeof echarts.getInstanceByDom>
    chart?: ReturnType<typeof echarts.getInstanceByDom>
    $el?: HTMLElement
  } | null

  const rawComp = comp ? (toRaw(comp) as typeof comp) : null
  let instance =
    rawComp?.getEchartsInstance?.() ??
    (rawComp?.chart ? (toRaw(rawComp.chart) as typeof rawComp.chart) : null) ??
    (rawComp?.$el ? echarts.getInstanceByDom(rawComp.$el) : null)

  if (!instance) {
    const container = document.getElementById(`map-container-${chartId}`)
    const chartEl = container?.querySelector('.chart') as HTMLElement | null
    if (chartEl) {
      instance = echarts.getInstanceByDom(chartEl)
    }
  }

  if (!instance) return { blob: null, reason: 'map instance not available' }

  const dataUrl = instance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: isDark ? '#141414' : '#ffffff',
  })

  if (!dataUrl || !dataUrl.startsWith('data:image') || dataUrl === 'data:,') {
    return { blob: null, reason: 'map produced an empty image' }
  }

  const blob = dataUriToBlob(dataUrl)
  if (blob.size < MIN_PNG_BYTES) {
    return { blob: null, reason: 'map produced an empty image' }
  }

  return { blob }
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
  const skipReasons = new Map<string, number>()

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
      let capture: ChartCapture

      if (chart.type === 7) {
        capture = exportEchartsMapPng(chart.id, isDark, componentRef)
      } else if (chart.type === 8) {
        const pyramidOptions = (config?.chartOptions as Record<string, unknown>) || config
        const exportOpts = readApexExportOptions(pyramidOptions, 300, false)
        capture = await exportApexChartPng(chart.id, exportOpts, componentRef, isDark)
      } else {
        const exportOpts = readApexExportOptions(config, chart.chartHeight, chart.chartExpanded)
        capture = await exportApexChartPng(chart.id, exportOpts, componentRef, isDark)
      }

      const blob = capture.blob
      if (!blob || blob.size < MIN_PNG_BYTES) {
        const reason = capture.reason || 'chart produced an empty image'
        skipReasons.set(reason, (skipReasons.get(reason) ?? 0) + 1)
        console.warn(
          `[chart export] skipped "${chart.title}" (id ${key}, type ${chart.type}): ${reason}`
        )
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
    const summary = [...skipReasons.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => `${count} × ${reason}`)
      .join('; ')
    throw new Error(
      summary
        ? `Could not export any charts — ${summary}. Make sure the charts are visible and fully loaded, then try again.`
        : 'Could not export any charts. Make sure charts are fully loaded.'
    )
  }

  if (download) {
    checkExportCancelled(shouldCancel)
    const content = await zip.generateAsync({ type: 'blob' })
    checkExportCancelled(shouldCancel)
    saveAs(content, zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`)
  }

  return { exported, skipped, zip }
}
