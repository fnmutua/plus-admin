import { resolveElementPlusIcon } from './elementPlusIcons'

export const CHART_TYPE_ICONS: Record<number, string> = {
  1: 'Histogram',
  2: 'DataBoard',
  3: 'PieChart',
  4: 'Grid',
  5: 'TrendCharts',
  6: 'Histogram',
  7: 'MapLocation',
  8: 'User',
  9: 'DataLine',
  10: 'PieChart',
  11: 'Grid',
  12: 'DataLine',
}

export const getChartTypeIconName = (type?: number | string | null) => {
  const numericType = Number(type)
  if (!type || Number.isNaN(numericType)) return 'PieChart'
  return CHART_TYPE_ICONS[numericType] || 'PieChart'
}

export const resolveChartTypeIcon = (type?: number | null) => {
  return resolveElementPlusIcon(getChartTypeIconName(type))
}
