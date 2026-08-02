import { getModelSpecs, getModelRelatives } from '@/api/fields'

export interface DashboardFilterField {
  value: string
  label: string
  type: string
}

const BASE_EXCLUDE = new Set([
  'title',
  'name',
  'geom',
  'code',
  'createdBy',
  'updatedAt',
  'description',
  'createdAt',
  'userId',
  'reject_msg',
  'comments',
  'documentation',
])

/** Measure / scope fields that aren't useful as dashboard filters on indicator reports. */
const INDICATOR_REPORT_EXCLUDE = new Set([
  'indicator_category_id',
  'amount',
  'target',
  'progress',
  'cumProgress',
  'cumAmount',
])

const ASSOC_LABELS: Record<string, string> = {
  county: 'County',
  subcounty: 'Sub-county',
  ward: 'Ward',
  settlement: 'Settlement',
  project: 'Project',
  project_location: 'Project location',
  activity: 'Activity',
  programme_implementation: 'Programme implementation',
  indicator_category: 'Indicator category',
  users: 'Submitted by',
}

function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function labelForField(field: string, assocModel?: string): string {
  if (assocModel && ASSOC_LABELS[assocModel]) return ASSOC_LABELS[assocModel]
  if (field.endsWith('_id')) {
    const base = field.slice(0, -3)
    return ASSOC_LABELS[base] || titleCase(base)
  }
  return titleCase(field)
}

function excludeForModel(model: string): Set<string> {
  if (model === 'indicator_category_report') {
    return new Set([...BASE_EXCLUDE, ...INDICATOR_REPORT_EXCLUDE])
  }
  return BASE_EXCLUDE
}

function appendProjectHierarchyFilters(model: string, fields: DashboardFilterField[]) {
  if (model !== 'project_location' && model !== 'indicator_category_report') return
  if (!fields.some((f) => f.value === 'component_id')) {
    fields.push({ value: 'component_id', label: 'Component (via Project)', type: 'FK_COMPONENT' })
  }
  if (!fields.some((f) => f.value === 'programme_id')) {
    fields.push({ value: 'programme_id', label: 'Programme (via Project)', type: 'FK_PROGRAMME' })
  }
}

function sortFilterFields(fields: DashboardFilterField[]) {
  fields.sort((a, b) => {
    const aFk = a.value.endsWith('_id') || a.type.startsWith('FK_')
    const bFk = b.value.endsWith('_id') || b.type.startsWith('FK_')
    if (aFk && !bFk) return -1
    if (!aFk && bFk) return 1
    return a.label.localeCompare(b.label)
  })
}

/** Build filter-field options for dashboard cards/charts, including associated-table FKs. */
export async function loadDashboardFilterFields(model: string): Promise<DashboardFilterField[]> {
  if (!model) return []

  const exclude = excludeForModel(model)
  const specsRes = await getModelSpecs({ model })
  const fields: DashboardFilterField[] = (specsRes.data || [])
    .filter((f: { field: string }) => !exclude.has(f.field))
    .map((f: { field: string; type: string }) => ({
      value: f.field,
      label: labelForField(f.field),
      type: f.type,
    }))

  try {
    const relRes = await getModelRelatives({ model })
    const assocModels = relRes.models || []
    for (const rel of assocModels) {
      if (exclude.has(rel.key)) continue
      const label = ASSOC_LABELS[rel.model] || titleCase(rel.model)
      const existing = fields.find((f) => f.value === rel.key)
      if (existing) {
        existing.label = label
      } else {
        fields.push({ value: rel.key, label, type: 'INTEGER' })
      }
    }
  } catch {
    // relatives are optional — specs alone are enough for basic filters
  }

  appendProjectHierarchyFilters(model, fields)
  sortFilterFields(fields)
  return fields
}
