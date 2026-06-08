export type SettlementType = {
  // Core identifiers / geometry
  id?: number
  name: string
  county_id: number
  settlement_type?: string
  area?: number
  code?: string
  population?: number
  pop_male?: number
  pop_female?: number
  county?: string
  geom?: string

  // Profiling / qualification
  profiling_status?: 'NOT_PROFILED' | 'PARTIALLY_PROFILED' | 'PROFILED'
  is_qualified?: boolean | null

  // Generic indexer to allow filters and extra fields from backend
  [key: string]: any
}
