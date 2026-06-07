/** Map API model names to settlement map drawer schema keys. */
const API_MODEL_TO_SCHEMA_TYPE: Record<string, string> = {
  street_light: 'streetlight',
}

export function resolveFacilitySchemaType(apiModel: string): string {
  return API_MODEL_TO_SCHEMA_TYPE[apiModel] || apiModel
}

/** Flatten nested settlement/county from list API into drawer field keys. */
export function flattenFacilityProfileProperties(
  raw: Record<string, unknown> = {}
): Record<string, unknown> {
  const flat: Record<string, unknown> = { ...raw }

  const settlement = raw.settlement as Record<string, unknown> | undefined
  if (settlement && typeof settlement === 'object') {
    if (flat.settlement_name == null && settlement.name != null) {
      flat.settlement_name = settlement.name
    }
    if (flat.settlement_code == null && settlement.code != null) {
      flat.settlement_code = settlement.code
    }
    if (flat.settlement_id == null && settlement.id != null) {
      flat.settlement_id = settlement.id
    }

    const nestedCounty = settlement.county as Record<string, unknown> | undefined
    if (nestedCounty && typeof nestedCounty === 'object' && flat.county_name == null && nestedCounty.name != null) {
      flat.county_name = nestedCounty.name
    }
    if (nestedCounty && typeof nestedCounty === 'object' && flat.county_id == null && nestedCounty.id != null) {
      flat.county_id = nestedCounty.id
    }
  }

  const county = raw.county as Record<string, unknown> | undefined
  if (county && typeof county === 'object') {
    if (flat.county_name == null && county.name != null) {
      flat.county_name = county.name
    }
    if (flat.county_id == null && county.id != null) {
      flat.county_id = county.id
    }
  }

  return flat
}
