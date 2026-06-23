/** County census sex-ratio split (matches server populationProjection.splitSexFromCounty). */

const KENYA_SEX_FALLBACK = { maleShare: 0.493, femaleShare: 0.507 }

export function splitPopulationByCountySex(
  population: number,
  countyRow: { pop_male?: unknown; pop_female?: unknown; pop_total?: unknown } | null | undefined
): { pop_male: number; pop_female: number } | null {
  const pop = Math.round(Number(population))
  if (!Number.isFinite(pop) || pop <= 0) return null

  const refMale = Number(countyRow?.pop_male)
  const refFemale = Number(countyRow?.pop_female)
  const refTotal = Number(countyRow?.pop_total) || refMale + refFemale

  if (
    Number.isFinite(refMale) &&
    Number.isFinite(refFemale) &&
    refTotal > 0
  ) {
    const popMale = Math.round(pop * (refMale / refTotal))
    return { pop_male: popMale, pop_female: pop - popMale }
  }

  const popMale = Math.round(pop * KENYA_SEX_FALLBACK.maleShare)
  return { pop_male: popMale, pop_female: pop - popMale }
}

export function unwrapApiRecord(res: unknown): Record<string, unknown> | null {
  if (!res || typeof res !== 'object') return null
  const outer = res as Record<string, unknown>
  let row: unknown = outer.data ?? outer
  if (Array.isArray(row)) row = row[0]
  if (row && typeof row === 'object' && 'dataValues' in row) {
    row = (row as { dataValues: Record<string, unknown> }).dataValues
  }
  return row && typeof row === 'object' ? (row as Record<string, unknown>) : null
}
