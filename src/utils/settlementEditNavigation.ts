/** Query params when navigating to AddSettlementNew in edit mode. */
export function buildSettlementEditQuery(row: {
  id: number | string
  county_id?: number | string | null
  subcounty_id?: number | string | null
  ward_id?: number | string | null
}): Record<string, string> {
  const query: Record<string, string> = { id: String(row.id) }
  if (row.county_id != null && row.county_id !== '') {
    query.county_id = String(row.county_id)
  }
  if (row.subcounty_id != null && row.subcounty_id !== '') {
    query.subcounty_id = String(row.subcounty_id)
  }
  if (row.ward_id != null && row.ward_id !== '') {
    query.ward_id = String(row.ward_id)
  }
  return query
}

/** Match el-select option values (numeric ids from API). */
export function normalizeLocationId(id: unknown): number | '' {
  if (id === null || id === undefined || id === '') return ''
  const n = Number(id)
  return Number.isFinite(n) ? n : ''
}
