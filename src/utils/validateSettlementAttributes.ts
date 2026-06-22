/** Settlement attribute normalization and validation (planning/survey status, booleans, derived fields). */

export const PLANNING_STATUS_VALUES = ['Planned', 'Unplanned'] as const
export const SURVEY_STATUS_VALUES = ['Surveyed', 'Unsurveyed'] as const

export type PlanningStatus = (typeof PLANNING_STATUS_VALUES)[number]
export type SurveyStatus = (typeof SURVEY_STATUS_VALUES)[number]

/** Valid combined land_status values kept for legacy charts/reports. */
export const LAND_STATUS_VALUES = [
  'Planned, Surveyed',
  'Planned, Unsurveyed',
  'Unplanned, Unsurveyed',
  'Unknown',
] as const

export const PLANNING_STATUS_OPTIONS = PLANNING_STATUS_VALUES.map((value) => ({
  label: value,
  value,
}))

export const SURVEY_STATUS_OPTIONS = SURVEY_STATUS_VALUES.map((value) => ({
  label: value,
  value,
}))

/** Survey options available for the current planning selection. */
export function surveyStatusOptionsForPlanning(
  planning: PlanningStatus | null | undefined
): Array<{ label: string; value: SurveyStatus }> {
  if (planning === 'Unplanned') {
    return [{ label: 'Unsurveyed', value: 'Unsurveyed' }]
  }
  return SURVEY_STATUS_OPTIONS
}

/** Enforce: Unplanned → always Unsurveyed; cannot be Surveyed without Planned. */
export function normalizePlanningSurveyPair(
  planning: PlanningStatus | null | undefined,
  survey: SurveyStatus | null | undefined
): { planning: PlanningStatus | null; survey: SurveyStatus | null; error: string | null } {
  const p = planning ?? null
  let s = survey ?? null

  if (!p && !s) return { planning: null, survey: null, error: null }

  if (p === 'Unplanned') {
    s = 'Unsurveyed'
    return { planning: p, survey: s, error: null }
  }

  if (s === 'Surveyed' && p !== 'Planned') {
    return {
      planning: p,
      survey: s,
      error: 'A settlement can only be Surveyed if it is Planned.',
    }
  }

  return { planning: p, survey: s, error: null }
}

export function composeLandStatus(
  planning: PlanningStatus | null | undefined,
  survey: SurveyStatus | null | undefined
): string | null {
  const normalized = normalizePlanningSurveyPair(planning, survey)
  if (normalized.error || !normalized.planning || !normalized.survey) return null
  const combined = `${normalized.planning}, ${normalized.survey}`
  return (LAND_STATUS_VALUES as readonly string[]).includes(combined) ? combined : null
}

/** @deprecated Prefer planning_status + survey_status columns. */
export function parseLandStatus(landStatus: string | null | undefined): {
  planning: PlanningStatus | null
  survey: SurveyStatus | null
} {
  if (!landStatus || landStatus.trim() === '' || landStatus === 'Unknown') {
    return { planning: null, survey: null }
  }
  const s = landStatus.trim()
  if (s === 'Planned, Surveyed') return { planning: 'Planned', survey: 'Surveyed' }
  if (s === 'Planned, Unsurveyed') return { planning: 'Planned', survey: 'Unsurveyed' }
  if (s === 'Unplanned, Unsurveyed') return { planning: 'Unplanned', survey: 'Unsurveyed' }
  if (s === 'Unplanned, Surveyed') return { planning: 'Unplanned', survey: 'Unsurveyed' }

  const lower = s.toLowerCase()
  const planning: PlanningStatus | null = lower.includes('unplanned')
    ? 'Unplanned'
    : lower.includes('planned')
      ? 'Planned'
      : null
  const survey: SurveyStatus | null = lower.includes('unsurveyed')
    ? 'Unsurveyed'
    : lower.includes('surveyed')
      ? 'Surveyed'
      : null
  const normalized = normalizePlanningSurveyPair(planning, survey)
  return { planning: normalized.planning, survey: normalized.survey }
}

export function resolvePlanningSurveyFromRecord(record: {
  planning_status?: string | null
  survey_status?: string | null
  land_status?: string | null
}): { planning: PlanningStatus | null; survey: SurveyStatus | null } {
  const fromColumns = normalizePlanningSurveyPair(
    (record.planning_status as PlanningStatus | null) ?? null,
    (record.survey_status as SurveyStatus | null) ?? null
  )
  if (fromColumns.planning || fromColumns.survey) {
    return { planning: fromColumns.planning, survey: fromColumns.survey }
  }
  return parseLandStatus(record.land_status)
}

export function surveyedFromSurveyStatus(
  survey: SurveyStatus | null | undefined
): string | null {
  if (survey === 'Surveyed') return 'Yes'
  if (survey === 'Unsurveyed') return 'No'
  return null
}

export function surveyedFromLandStatus(landStatus: string | null | undefined): string | null {
  const { survey } = parseLandStatus(landStatus)
  return surveyedFromSurveyStatus(survey)
}

/** Proximity band <2000m implies near a river. */
export function nearRiverFromProximity(proximity: string | null | undefined): boolean | null {
  if (!proximity) return null
  return proximity.startsWith('<')
}

export function coerceYesNoBoolean(value: unknown): boolean | null {
  if (value === true || value === false) return value
  if (value === 'yes' || value === 'Yes' || value === 'true' || value === 1 || value === '1') {
    return true
  }
  if (value === 'no' || value === 'No' || value === 'false' || value === 0 || value === '0') {
    return false
  }
  return null
}

export function booleanToYesNo(value: unknown): string | null {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  if (value === 'yes' || value === 'no') return value
  return null
}

export function normalizeSurveyed(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  const s = String(value).toLowerCase()
  if (s === 'yes' || s === 'y') return 'Yes'
  if (s === 'no' || s === 'n') return 'No'
  if (s === 'unknown') return 'Unknown'
  return null
}

const SETTLEMENT_BOOLEAN_FORM_FIELDS = [
  'near_river',
  'on_wayleave',
  'on_road_reserve',
  'electricity_availability',
  'piped_water_availability',
] as const

export function validateSettlementAttributes(form: {
  planning_status?: string | null
  survey_status?: string | null
  population?: number | string | null
  pop_male?: number | null
  pop_female?: number | null
  plot_ownership_ratio?: number | null
  plot_tenant_ratio?: number | null
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  const planning = form.planning_status as PlanningStatus | null | undefined
  const survey = form.survey_status as SurveyStatus | null | undefined
  const pairCheck = normalizePlanningSurveyPair(planning ?? null, survey ?? null)
  if (pairCheck.error) {
    errors.push(pairCheck.error)
  }
  if ((planning && !survey) || (!planning && survey)) {
    warnings.push(
      'Select both planning status and survey status, or leave both empty.'
    )
  }

  const pop = Number(form.population)
  const male = form.pop_male
  const female = form.pop_female
  if (Number.isFinite(pop) && pop > 0 && male != null && female != null) {
    const sum = male + female
    if (Math.abs(sum - pop) > pop * 0.05) {
      warnings.push(
        `Male + female population (${sum.toLocaleString()}) differs from total population (${pop.toLocaleString()}).`
      )
    }
  }

  const own = form.plot_ownership_ratio
  const tenant = form.plot_tenant_ratio
  if (own != null && tenant != null && own + tenant > 1.01) {
    warnings.push('Plot ownership and tenant ratios sum to more than 1.')
  }

  return { valid: errors.length === 0, errors, warnings }
}

/** Normalize form values before API submit (add/edit settlement). */
export function prepareSettlementFormForApi(form: Record<string, unknown>): Record<string, unknown> {
  const pair = normalizePlanningSurveyPair(
    (form.planning_status as PlanningStatus | null) ?? null,
    (form.survey_status as SurveyStatus | null) ?? null
  )
  const planning = pair.planning
  const survey = pair.survey
  const land_status = composeLandStatus(planning, survey)

  const surveyed =
    surveyedFromSurveyStatus(survey) ?? normalizeSurveyed(form.surveyed)

  const near_river =
    nearRiverFromProximity(form.proximity_to_river as string | null) ??
    coerceYesNoBoolean(form.near_river)

  const result: Record<string, unknown> = { ...form }
  result.planning_status = planning
  result.survey_status = survey
  result.land_status = land_status
  result.surveyed = surveyed
  result.near_river = near_river

  for (const f of SETTLEMENT_BOOLEAN_FORM_FIELDS) {
    if (f === 'near_river') continue
    result[f] = coerceYesNoBoolean(form[f])
  }

  delete result.land_status_planning
  delete result.land_status_survey
  return result
}

/** Fields synced when planning_status or survey_status changes (inline edit). */
export function getSyncedFieldsFromPlanningSurvey(
  planning: PlanningStatus | null,
  survey: SurveyStatus | null
): Record<string, unknown> {
  const pair = normalizePlanningSurveyPair(planning, survey)
  const land_status = composeLandStatus(pair.planning, pair.survey)
  const surveyed = surveyedFromSurveyStatus(pair.survey)
  return {
    planning_status: pair.planning,
    survey_status: pair.survey,
    land_status,
    ...(surveyed != null ? { surveyed } : {}),
  }
}
