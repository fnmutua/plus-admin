export const CHART_TYPE_ICONS: Record<number, string> = {
  1:  'material-symbols:bar-chart',
  2:  'material-symbols:grouped-bar-chart',
  3:  'material-symbols:pie-chart',
  4:  'material-symbols:full-stacked-bar-chart',
  5:  'material-symbols:show-chart',
  6:  'material-symbols:stacked-line-chart',
  7:  'material-symbols:map',
  8:  'material-symbols:bar-chart',
  9:  'material-symbols:stacked-bar-chart',
  10: 'material-symbols:donut-large',
  11: 'material-symbols:grid-view',
  12: 'material-symbols:multiline-chart',
  13: 'material-symbols:scatter-plot',
  14: 'material-symbols:gradient',
  15: 'material-symbols:speed',
}

export const getChartTypeIconName = (type?: number | string | null): string => {
  const numericType = Number(type)
  if (!type || Number.isNaN(numericType)) return 'material-symbols:bar-chart'
  return CHART_TYPE_ICONS[numericType] || 'material-symbols:bar-chart'
}
