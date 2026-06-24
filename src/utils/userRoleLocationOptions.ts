export type LocationLevelOption = {
  value: 'national' | 'county' | 'settlement'
  label: string
}

export const ALL_LOCATION_LEVEL_OPTIONS: LocationLevelOption[] = [
  { value: 'national', label: 'National' },
  { value: 'county', label: 'County' },
  { value: 'settlement', label: 'Settlement' },
]

/** County admins may only assign county- or settlement-scoped roles. */
export function getAssignableLocationOptions(isCountyRestricted: boolean): LocationLevelOption[] {
  if (isCountyRestricted) {
    return ALL_LOCATION_LEVEL_OPTIONS.filter((option) => option.value !== 'national')
  }
  return ALL_LOCATION_LEVEL_OPTIONS
}
