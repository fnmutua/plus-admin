/** Shared inline-edit field config for settlement profile (SettlementDetails + map drawer). */

export const inlineTextareaFields = [
  'description',
  'main_env_hazards',
  'general_location',
]

export const inlineNumberFields = [
  'population',
  'pop_male',
  'pop_female',
  'pop_density',
  'num_households',
  'avg_household_size',
  'avg_dist_between',
  'avg_rent',
  'plot_ownership_ratio',
  'plot_tenant_ratio',
  'dist_town',
  'dist_trunk',
  'median_household_income',
]

export const inlineProfileBooleanFields = ['is_qualified']

export const inlineUtilitiesBooleanFields = [
  'electricity_availability',
  'piped_water_availability',
  'on_wayleave',
  'on_road_reserve',
  'near_river',
]

export const inlineMultiselectFields = [
  'land_status',
  'structure_types',
  'development',
  'typical_building_materials',
]

export const settlementBooleanFields = [
  ...inlineProfileBooleanFields,
  ...inlineUtilitiesBooleanFields,
]

export const CLIMATE_VULN_ATTR_FIELDS = [
  'climate_region',
  'soil_type',
  'land_cover',
  'altitude_range',
  'proximity_to_river',
  'proximity_to_flood_plain',
] as const

export const VULNERABILITY_FALLBACK: Record<string, string[]> = {
  climate_region: [
    'Af>Tropical',
    'Am> Tropical',
    'Aw> Tropical',
    'BSh> Arid',
    'BSk> Arid',
    'BWh> Arid',
    'Cfa> Temperate',
    'Cfb> Temperate',
    'Csb> Temperate',
    'Cwa> Temperate',
    'Cwb> Temperate',
  ],
  soil_type: ['Clay', 'Sand', 'Loam', 'Rock'],
  land_cover: ['Bare Land', 'Natural Terrestrial Vegetation', 'Agricultural Land', 'Water-bodies'],
  altitude_range: ['<750', 'Between 751-1800', '>1800'],
  proximity_to_river: ['<2000', 'Between 2001-5999', '>6000'],
  proximity_to_flood_plain: ['<4500', 'Between 4501-6000', '>6000'],
}

export const inlineSelectOptionsBase: Record<
  string,
  Array<{ label: string; value: string | number | boolean }>
> = {
  settlement_type: [
    { label: 'Slum', value: 'slum' },
    { label: 'Informal Settlement', value: 'Informal Settlement' },
  ],
  parcel_owner_type: [
    { label: 'Private', value: 'Private' },
    { label: 'Public', value: 'Public' },
    { label: 'Community', value: 'Community' },
    { label: 'Unknown', value: 'Unknown' },
  ],
  surveyed: [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ],
  land_status: [
    { label: 'Planned', value: 'Planned' },
    { label: 'Unplanned', value: 'Unplanned' },
    { label: 'Surveyed', value: 'Surveyed' },
    { label: 'Unsurveyed', value: 'Unsurveyed' },
  ],
  landuse: [
    { label: 'Mixed', value: 'Mixed' },
    { label: 'Residential', value: 'Residential' },
    { label: 'Commercial', value: 'Commercial' },
    { label: 'Industrial', value: 'Industrial' },
    { label: 'Educational', value: 'Educational' },
    { label: 'Public Purpose', value: 'Public Purpose' },
    { label: 'Public Utility', value: 'Public Utility' },
    { label: 'Transportation', value: 'Transportation' },
    { label: 'Agricultural', value: 'Agricultural' },
    { label: 'Undeveloped', value: 'Undeveloped' },
    { label: 'Conservation', value: 'Conservation' },
    { label: 'Other', value: 'Other' },
  ],
  structure_types: [
    { label: 'Permanent', value: 'Permanent' },
    { label: 'Semi-permanent', value: 'Semi-permanent' },
    { label: 'Temporary', value: 'Temporary' },
  ],
  development: [
    { label: 'Single Storey', value: 'singleStorey' },
    { label: 'Multi Storey', value: 'multiStorey' },
  ],
  typical_building_materials: [
    { label: 'Stone/Blocks', value: 'Stone/Blocks' },
    { label: 'Mud', value: 'Mud' },
    { label: 'Timber/Wood', value: 'Timber/Wood' },
    { label: 'Iron sheets', value: 'Iron sheets' },
    { label: 'Earth', value: 'Earth' },
    { label: 'Cement', value: 'Cement' },
    { label: 'Tiles', value: 'Tiles' },
    { label: 'Grass', value: 'Grass' },
    { label: 'Plastic/Polythene', value: 'Plastic/Polythene' },
    { label: 'Concrete/Slab', value: 'Concrete/Slab' },
    { label: 'Terrazzo', value: 'Terrazzo' },
    { label: 'Other', value: 'Other' },
  ],
  encumbrance: [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
    { label: 'Unknown', value: 'Unknown' },
  ],
  electricity_availability: [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  piped_water_availability: [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  near_river: [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  on_wayleave: [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  on_road_reserve: [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  profiling_status: [
    { label: 'Not Profiled', value: 'NOT_PROFILED' },
    { label: 'Partially Profiled', value: 'PARTIALLY_PROFILED' },
    { label: 'Profiled', value: 'PROFILED' },
  ],
  is_qualified: [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  density_typology: [
    { label: 'Low Density', value: 'LOW DENSITY' },
    { label: 'Medium Density', value: 'MEDIUM DENSITY' },
    { label: 'High Density', value: 'HIGH DENSITY' },
  ],
}

/** Fields edited via single- or multi-select (not boolean switches). */
export const settlementSelectFields = [
  ...Object.keys(inlineSelectOptionsBase).filter(
    (field) => !settlementBooleanFields.includes(field)
  ),
  ...CLIMATE_VULN_ATTR_FIELDS,
]

export const readonlyInlineLocation = ['county', 'subcounty', 'ward']
export const readonlyInlineSummary = ['id', 'code', 'geom_label', 'pop_density', 'area']
export const readonlyInlineVulnerability = [
  'vulnerability_total_score_display',
  'vulnerability_rating',
]
export const readonlyInlineStatus = [
  'isApproved',
  'isActive',
  'createdBy',
  'createdAt',
  'updatedAt',
]

const SETTLEMENT_NUMBER_FIELDS = new Set(inlineNumberFields)
const SETTLEMENT_BOOLEAN_FIELDS = new Set(settlementBooleanFields)

export function buildVulnerabilitySelectFallback(): Record<
  string,
  Array<{ label: string; value: string }>
> {
  return Object.fromEntries(
    Object.entries(VULNERABILITY_FALLBACK).map(([k, vals]) => [
      k,
      vals.map((v) => ({ label: v, value: v })),
    ])
  )
}

export function formatBoolLabel(v: unknown): string {
  if (v === true || v === 'true' || v === 1 || v === '1') return 'Yes'
  if (v === false || v === 'false' || v === 0 || v === '0') return 'No'
  if (v === null || v === undefined || v === '') return '\u2014'
  return String(v)
}

export function coerceSettlementValueForApi(field: string, value: unknown): unknown {
  if (SETTLEMENT_BOOLEAN_FIELDS.has(field)) {
    if (value === true || value === false) return value
    if (value === 'Yes' || value === 'true' || value === 1 || value === '1') return true
    if (value === 'No' || value === 'false' || value === 0 || value === '0') return false
    return Boolean(value)
  }
  if (SETTLEMENT_NUMBER_FIELDS.has(field)) {
    if (value === '' || value === undefined) return null
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null
    }
    const s = String(value).replace(/,/g, '').trim()
    if (s === '' || s === '\u2014') return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }
  if (value === '\u2014') return null
  if (value === '') return null
  return value
}
