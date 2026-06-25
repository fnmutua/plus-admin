/** CSS vars set by applyElementPlusSize() — dashboard cards & charts read these at render time. */
const CSS = {
  statValue: '--app-dashboard-stat-value',
  statLabel: '--app-dashboard-stat-label',
  statMeta: '--app-dashboard-stat-meta',
  chartTitle: '--app-dashboard-chart-title',
  chartSubtitle: '--app-dashboard-chart-subtitle',
  chartAxis: '--app-dashboard-chart-axis',
  chartLegend: '--app-dashboard-chart-legend',
  chartDataLabel: '--app-dashboard-chart-data-label',
} as const

const FALLBACK = {
  statValue: 28,
  statLabel: 14,
  statMeta: 12,
  chartTitle: 16,
  chartSubtitle: 12,
  chartAxis: 12,
  chartLegend: 11,
  chartDataLabel: 10,
} as const

function readCssVarPx(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function px(size: number): string {
  return `${size}px`
}

export function dashboardStatValueSize(): number {
  return readCssVarPx(CSS.statValue, FALLBACK.statValue)
}

export function dashboardStatValuePx(): string {
  return px(dashboardStatValueSize())
}

export function dashboardStatLabelSize(): number {
  return readCssVarPx(CSS.statLabel, FALLBACK.statLabel)
}

export function dashboardStatLabelPx(): string {
  return px(dashboardStatLabelSize())
}

export function dashboardChartTitleSize(): number {
  return readCssVarPx(CSS.chartTitle, FALLBACK.chartTitle)
}

export function dashboardChartTitlePx(): string {
  return px(dashboardChartTitleSize())
}

/** Slightly larger chart labels (e.g. heatmap cell values). */
export function dashboardChartTitleEmphasisSize(): number {
  return dashboardChartTitleSize() + 1
}

export function dashboardChartSubtitleSize(): number {
  return readCssVarPx(CSS.chartSubtitle, FALLBACK.chartSubtitle)
}

export function dashboardChartAxisSize(): number {
  return readCssVarPx(CSS.chartAxis, FALLBACK.chartAxis)
}

export function dashboardChartAxisPx(): string {
  return px(dashboardChartAxisSize())
}

export function dashboardChartLegendSize(): number {
  return readCssVarPx(CSS.chartLegend, FALLBACK.chartLegend)
}

export function dashboardChartLegendPx(): string {
  return px(dashboardChartLegendSize())
}

export function dashboardChartDataLabelSize(): number {
  return readCssVarPx(CSS.chartDataLabel, FALLBACK.chartDataLabel)
}

export function dashboardChartDataLabelPx(): string {
  return px(dashboardChartDataLabelSize())
}
