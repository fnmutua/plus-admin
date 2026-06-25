export function formatDashboardNumberCompact(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  if (n >= 1_000_000) {
    return (n / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'M'
  }
  if (n >= 1_000) {
    return (n / 1_000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'K'
  }
  return n.toLocaleString('en-US')
}

export function formatDashboardNumberFull(value: unknown, suffix = ''): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return `0${suffix}`
  return `${n.toLocaleString('en-US')}${suffix}`
}

export function usesDashboardCompactNotation(value: unknown): boolean {
  const n = Number(value)
  return Number.isFinite(n) && Math.abs(n) >= 1_000
}

/** Full value for native tooltip when the card uses K/M compact display. */
export function dashboardNumberTooltip(value: unknown, suffix = ''): string | undefined {
  return usesDashboardCompactNotation(value) ? formatDashboardNumberFull(value, suffix) : undefined
}
