export type DashboardType = 'status' | 'intervention' | string
export type DashboardDataCategory = 'Status' | 'Intervention'

/** Default data source for new cards and charts. */
export const DEFAULT_DASHBOARD_DATA_CATEGORY: DashboardDataCategory = 'Status'

/** True for Intervention cards/charts and legacy Indicator rows. */
export function isInterventionCategory(category: string | null | undefined): boolean {
  if (!category) return false
  const c = String(category).trim()
  return c === 'Intervention' || c === 'Indicator'
}

export function isStatusCategory(category: string | null | undefined): boolean {
  if (!category) return false
  const c = String(category).trim()
  return c === 'Status' || c.toLowerCase() === 'status'
}

/** Normalize legacy Indicator → Intervention for new saves. */
export function normalizeDataCategory(category: string | null | undefined): DashboardDataCategory | '' {
  if (!category) return ''
  if (isInterventionCategory(category)) return 'Intervention'
  if (isStatusCategory(category)) return 'Status'
  return category as DashboardDataCategory
}

/** Suggested default when creating a card/chart — not enforced; each card/chart stores its own category. */
export function defaultCategoryForDashboardType(
  _dashboardType: DashboardType | null | undefined,
): DashboardDataCategory {
  return DEFAULT_DASHBOARD_DATA_CATEGORY
}

/** @deprecated Dashboard type no longer restricts entity options — use the full model list. */
export function modelOptionsForDashboardType<T extends { value: string; label: string }>(
  _dashboardType: DashboardType | null | undefined,
  allOptions: T[],
): T[] {
  return allOptions
}
