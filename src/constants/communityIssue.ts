/** Mirrors server/app/config/communityIssue.js — keep labels in sync. */

export const COMMUNITY_ISSUE_TYPES = [
  { value: 'om_water', label: 'Water' },
  { value: 'om_sanitation', label: 'Sanitation' },
  { value: 'om_roads', label: 'Roads / access' },
  { value: 'om_power_lighting', label: 'Power / lighting' },
  { value: 'om_waste', label: 'Waste' },
  { value: 'safety_hazard', label: 'Safety hazard' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'public_space', label: 'Public space / facility' },
  { value: 'project_intervention', label: 'Project / intervention' },
  { value: 'other', label: 'Other' },
] as const

export const COMMUNITY_ISSUE_SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const

export type CommunityIssueTypeOption = { value: string; label: string }

export function communityIssueTypeLabel(value?: string, fallback?: string): string {
  if (!value) return fallback || 'N/A'
  const match = COMMUNITY_ISSUE_TYPES.find((item) => item.value === value)
  return match?.label || stripOmPrefix(fallback || value)
}

export function stripOmPrefix(label: string): string {
  return String(label || '')
    .replace(/^O&M\s*[—\-]\s*/i, '')
    .trim()
}

/** Prefer local labels; strip legacy O&M prefixes from API labels. */
export function normalizeIssueTypeOptions(
  apiTypes?: Array<{ value: string; label: string }> | null
): CommunityIssueTypeOption[] {
  if (!apiTypes?.length) return [...COMMUNITY_ISSUE_TYPES]

  const labelByValue = new Map(COMMUNITY_ISSUE_TYPES.map((item) => [item.value, item.label]))
  return apiTypes.map((item) => ({
    value: item.value,
    label: labelByValue.get(item.value) || stripOmPrefix(item.label) || item.value,
  }))
}

export function normalizeSeverityOptions(
  apiSeverities?: Array<{ value: string; label: string }> | null
): CommunityIssueTypeOption[] {
  if (!apiSeverities?.length) return [...COMMUNITY_ISSUE_SEVERITIES]
  return apiSeverities.map((item) => ({
    value: item.value,
    label: item.label,
  }))
}
