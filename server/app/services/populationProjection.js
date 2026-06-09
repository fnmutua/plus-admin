'use strict'

const XLSX = require('xlsx')

const DEFAULT_BASELINE_YEAR = 2019

const COUNTY_RATE_HEADER_ALIASES = {
  county_id: ['county id', 'county_id', 'id'],
  county_code: ['county code', 'county_code', 'code'],
  year: ['year'],
  rate: [
    'rate',
    'annual rate',
    'annual_rate',
    'growth rate',
    'growth_rate',
    'percent',
    '%',
    'household rate',
    'household_growth_rate',
    'hh rate',
  ],
}

const BASELINE_HEADER_ALIASES = {
  id: ['id', 'settlement id', 'settlement_id'],
  code: ['code', 'settlement code', 'settlement_code'],
  population: ['population', 'total', 'pop total', 'pop_total', 'total population'],
  pop_male: ['pop male', 'pop_male', 'male', 'male population'],
  pop_female: ['pop female', 'pop_female', 'female', 'female population'],
  num_households: [
    'num households',
    'num_households',
    'households',
    'number of households',
    'no of households',
    'hh',
  ],
}

function normalizeHeaderLabel(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function readFirstSheetMatrix(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('Excel file has no worksheets')
  }

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })
  if (!matrix.length) {
    throw new Error('Excel worksheet is empty')
  }

  return { sheetName, matrix }
}

function findHeaderRowIndex(matrix) {
  const headerRowIndex = matrix.findIndex(
    (row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== '')
  )
  if (headerRowIndex < 0) {
    throw new Error('Could not find a header row in the Excel file')
  }
  return headerRowIndex
}

function mapCountyRateHeaderRow(headerRow) {
  const index = {}
  headerRow.forEach((cell, i) => {
    const norm = normalizeHeaderLabel(cell)
    if (!norm) return
    for (const [field, aliases] of Object.entries(COUNTY_RATE_HEADER_ALIASES)) {
      if (index[field] != null) continue
      if (aliases.includes(norm)) index[field] = i
    }
  })
  return index
}

function mapBaselineHeaderRow(headerRow) {
  const index = {}
  headerRow.forEach((cell, i) => {
    const norm = normalizeHeaderLabel(cell)
    if (!norm) return
    for (const [field, aliases] of Object.entries(BASELINE_HEADER_ALIASES)) {
      if (index[field] != null) continue
      if (aliases.includes(norm)) index[field] = i
    }
  })
  return index
}

function cellValue(row, idx) {
  if (idx == null || idx < 0) return null
  const raw = row[idx]
  if (raw == null || raw === '') return null
  return raw
}

function parseCountCell(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  const s = String(value).replace(/,/g, '').trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null
}

function isWideHouseholdRateHeaderRow(headerRow) {
  if (!Array.isArray(headerRow)) return false
  return headerRow.some((cell) => {
    const norm = normalizeHeaderLabel(cell)
    return /^growth rate \d{4} percent$/.test(norm)
  })
}

function isWidePopulationRateHeaderRow(headerRow) {
  if (!Array.isArray(headerRow)) return false
  return headerRow.some((cell) => {
    const norm = normalizeHeaderLabel(cell)
    return /^growth rate pct \d{4}$/.test(norm)
  })
}

/**
 * Wide household template: one row per county, growth_rate_YYYY_percent columns.
 */
function parseCountyHouseholdRateWideMatrix(matrix, headerRowIndex, sheetName) {
  const headerRow = matrix[headerRowIndex]
  let countyIdColIdx = null
  let dataNoteColIdx = null
  const growthRateCols = []

  headerRow.forEach((cell, i) => {
    const norm = normalizeHeaderLabel(cell)
    if (norm === 'county id' || norm === 'county_id') {
      countyIdColIdx = i
      return
    }
    if (norm === 'data note') {
      dataNoteColIdx = i
      return
    }
    const growthMatch = norm.match(/^growth rate (\d{4}) percent$/)
    if (growthMatch) {
      growthRateCols.push({ year: parseInt(growthMatch[1], 10), idx: i })
    }
  })

  if (countyIdColIdx == null) {
    throw new Error('Wide household template requires a county_id column')
  }
  if (growthRateCols.length === 0) {
    throw new Error(
      'Wide household template requires growth_rate_YYYY_percent columns (e.g. growth_rate_2020_percent)'
    )
  }

  growthRateCols.sort((a, b) => a.year - b.year)

  const rows = []
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r]
    if (!Array.isArray(row) || row.every((cell) => cell == null || String(cell).trim() === '')) {
      continue
    }

    const countyId = parseCountCell(cellValue(row, countyIdColIdx))
    const dataNote =
      dataNoteColIdx == null
        ? null
        : cellValue(row, dataNoteColIdx) == null
          ? null
          : String(cellValue(row, dataNoteColIdx)).trim()

    for (const col of growthRateCols) {
      const rate = parseImportGrowthRatePercent(cellValue(row, col.idx))
      if (rate == null) continue

      rows.push({
        excel_row: r + 1,
        kind: 'household',
        county_id: countyId,
        county_code: null,
        year: col.year,
        rate,
        data_note: dataNote,
      })
    }
  }

  return {
    sheet_name: sheetName,
    header_row: headerRowIndex + 1,
    format: 'wide_household',
    kind: 'household',
    rows,
  }
}

/**
 * Wide population template: one row per county, growth_rate_pct_YYYY columns.
 */
function parseCountyPopulationRateWideMatrix(matrix, headerRowIndex, sheetName) {
  const headerRow = matrix[headerRowIndex]
  let countyIdColIdx = null
  const growthRateCols = []

  headerRow.forEach((cell, i) => {
    const norm = normalizeHeaderLabel(cell)
    if (norm === 'county id' || norm === 'county_id') {
      countyIdColIdx = i
      return
    }
    const growthMatch = norm.match(/^growth rate pct (\d{4})$/)
    if (growthMatch) {
      growthRateCols.push({ year: parseInt(growthMatch[1], 10), idx: i })
    }
  })

  if (countyIdColIdx == null) {
    throw new Error('Wide population template requires a county_id column')
  }
  if (growthRateCols.length === 0) {
    throw new Error(
      'Wide population template requires growth_rate_pct_YYYY columns (e.g. growth_rate_pct_2020)'
    )
  }

  growthRateCols.sort((a, b) => a.year - b.year)

  const rows = []
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r]
    if (!Array.isArray(row) || row.every((cell) => cell == null || String(cell).trim() === '')) {
      continue
    }

    const countyId = parseCountCell(cellValue(row, countyIdColIdx))

    for (const col of growthRateCols) {
      const rate = parseImportGrowthRatePercent(cellValue(row, col.idx))
      if (rate == null) continue

      rows.push({
        excel_row: r + 1,
        kind: 'population',
        county_id: countyId,
        county_code: null,
        year: col.year,
        rate,
      })
    }
  }

  return {
    sheet_name: sheetName,
    header_row: headerRowIndex + 1,
    format: 'wide_population',
    kind: 'population',
    rows,
  }
}

/**
 * Parse county growth-rate worksheet — long format (population or household file).
 */
function parseCountyRateLongMatrix(matrix, headerRowIndex, sheetName, kind = 'population') {
  const headerIndex = mapCountyRateHeaderRow(matrix[headerRowIndex])
  if (headerIndex.year == null || headerIndex.rate == null) {
    throw new Error('Unrecognized headers. Expected county_id or code, year, and rate')
  }
  if (headerIndex.county_id == null && headerIndex.county_code == null) {
    throw new Error('Unrecognized headers. Expected county_id or county code')
  }

  const rows = []
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r]
    if (!Array.isArray(row) || row.every((cell) => cell == null || String(cell).trim() === '')) {
      continue
    }

    const rate = parseImportGrowthRatePercent(cellValue(row, headerIndex.rate))
    rows.push({
      excel_row: r + 1,
      kind,
      county_id: parseCountCell(cellValue(row, headerIndex.county_id)),
      county_code:
        cellValue(row, headerIndex.county_code) == null
          ? null
          : String(cellValue(row, headerIndex.county_code)).trim(),
      year: parseCountCell(cellValue(row, headerIndex.year)),
      rate,
    })
  }

  return {
    sheet_name: sheetName,
    header_row: headerRowIndex + 1,
    format: 'long',
    mapped_columns: headerIndex,
    kind,
    rows,
  }
}

/**
 * Auto-detect wide vs long county rate file (Excel or CSV).
 */
function parseCountyRateFileBuffer(buffer, kind = 'population') {
  const { sheetName, matrix } = readFirstSheetMatrix(buffer)
  const headerRowIndex = findHeaderRowIndex(matrix)
  const headerRow = matrix[headerRowIndex]

  if (isWideHouseholdRateHeaderRow(headerRow)) {
    return parseCountyHouseholdRateWideMatrix(matrix, headerRowIndex, sheetName)
  }
  if (isWidePopulationRateHeaderRow(headerRow)) {
    return parseCountyPopulationRateWideMatrix(matrix, headerRowIndex, sheetName)
  }

  return parseCountyRateLongMatrix(matrix, headerRowIndex, sheetName, kind)
}

function parseCountyRateExcelBuffer(buffer, kind = 'population') {
  return parseCountyRateFileBuffer(buffer, kind)
}

/**
 * Parse first worksheet of an Excel buffer into baseline import rows.
 */
function parseBaselineExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('Excel file has no worksheets')
  }

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })
  if (!matrix.length) {
    throw new Error('Excel worksheet is empty')
  }

  const headerRowIndex = matrix.findIndex((row) =>
    Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== '')
  )
  if (headerRowIndex < 0) {
    throw new Error('Could not find a header row in the Excel file')
  }

  const headerIndex = mapBaselineHeaderRow(matrix[headerRowIndex])
  if (headerIndex.population == null && headerIndex.id == null && headerIndex.code == null) {
    throw new Error(
      'Unrecognized headers. Expected columns such as id, code, population, pop_male, pop_female, num_households'
    )
  }

  const rows = []
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r]
    if (!Array.isArray(row) || row.every((cell) => cell == null || String(cell).trim() === '')) {
      continue
    }

    rows.push({
      excel_row: r + 1,
      settlement_id: parseCountCell(cellValue(row, headerIndex.id)),
      code:
        cellValue(row, headerIndex.code) == null
          ? null
          : String(cellValue(row, headerIndex.code)).trim(),
      population: parseCountCell(cellValue(row, headerIndex.population)),
      pop_male: parseCountCell(cellValue(row, headerIndex.pop_male)),
      pop_female: parseCountCell(cellValue(row, headerIndex.pop_female)),
      num_households: parseCountCell(cellValue(row, headerIndex.num_households)),
    })
  }

  return {
    sheet_name: sheetName,
    header_row: headerRowIndex + 1,
    mapped_columns: headerIndex,
    rows,
  }
}

function splitSexFromCounty(population, countyRow) {
  if (population == null || !Number.isFinite(Number(population))) {
    return { pop_male: null, pop_female: null }
  }
  const pop = Math.round(Number(population))
  const refMale = Number(countyRow?.pop_male)
  const refFemale = Number(countyRow?.pop_female)
  const refTotal = Number(countyRow?.pop_total) || refMale + refFemale
  if (!Number.isFinite(refTotal) || refTotal <= 0) {
    return { pop_male: null, pop_female: null }
  }
  if (!Number.isFinite(refMale) || !Number.isFinite(refFemale)) {
    return { pop_male: null, pop_female: null }
  }
  const maleShare = refMale / refTotal
  const pop_male = Math.round(pop * maleShare)
  return { pop_male, pop_female: pop - pop_male }
}

function reconcileSexTotals(population, pop_male, pop_female) {
  const pop = roundCount(population)
  let male = roundCount(pop_male)
  let female = roundCount(pop_female)
  if (pop == null) {
    return { pop_male: male, pop_female: female }
  }
  if (male == null && female == null) {
    return { pop_male: null, pop_female: null }
  }
  if (male == null) {
    female = female ?? 0
    return { pop_male: Math.max(0, pop - female), pop_female: female }
  }
  if (female == null) {
    return { pop_male: male, pop_female: Math.max(0, pop - male) }
  }
  const sum = male + female
  if (sum !== pop) {
    female = pop - male
    if (female < 0) {
      female = 0
      male = pop
    }
  }
  return { pop_male: male, pop_female: female }
}

/**
 * Grow male/female using the population rate when baseline sex counts exist;
 * otherwise derive split from county census ratios.
 */
function projectSexCounts(population, pop_male, pop_female, popFactor, countyRow) {
  const newPop = roundCount(population)

  if (
    pop_male != null &&
    pop_female != null &&
    pop_male + pop_female > 0 &&
    Number.isFinite(popFactor)
  ) {
    const scaled = reconcileSexTotals(
      newPop,
      roundCount(pop_male * popFactor),
      roundCount(pop_female * popFactor)
    )
    return scaled
  }

  return splitSexFromCounty(newPop, countyRow)
}

function roundCount(value) {
  if (value == null || !Number.isFinite(Number(value))) return null
  return Math.max(0, Math.round(Number(value)))
}

function buildCountyRateMap(rateRows) {
  const map = new Map()
  for (const row of rateRows) {
    const populationRate = Number(row.annual_rate)
    const householdRate =
      row.household_growth_rate != null && Number.isFinite(Number(row.household_growth_rate))
        ? Number(row.household_growth_rate)
        : populationRate
    map.set(`${row.county_id}:${row.year}`, {
      population: populationRate,
      households: householdRate,
    })
  }
  return map
}

function buildCountyMap(countyRows) {
  const map = new Map()
  for (const row of countyRows) {
    map.set(Number(row.id), row)
  }
  return map
}

/** PostgreSQL upsert for settlement_population (Sequelize bulkCreate updateOnDuplicate is MySQL-oriented). */
async function upsertSettlementPopulationRows(db, rows, options = {}) {
  if (!rows.length) return
  const transaction = options.transaction ?? null

  const settlementIds = rows.map((r) => r.settlement_id)
  const countyIds = rows.map((r) => (r.county_id == null ? null : r.county_id))
  const subcountyIds = rows.map((r) => (r.subcounty_id == null ? null : r.subcounty_id))
  const wardIds = rows.map((r) => (r.ward_id == null ? null : r.ward_id))
  const years = rows.map((r) => r.year)
  const populations = rows.map((r) => r.population)
  const males = rows.map((r) => (r.pop_male == null ? null : r.pop_male))
  const females = rows.map((r) => (r.pop_female == null ? null : r.pop_female))
  const households = rows.map((r) => (r.num_households == null ? null : r.num_households))
  const sources = rows.map((r) => r.source)
  const methods = rows.map((r) => r.method ?? null)

  await db.sequelize.query(
    `
      INSERT INTO settlement_population (
        settlement_id,
        county_id,
        subcounty_id,
        ward_id,
        year,
        population,
        pop_male,
        pop_female,
        num_households,
        source,
        method,
        "createdAt",
        "updatedAt"
      )
      SELECT
        v.settlement_id,
        v.county_id,
        v.subcounty_id,
        v.ward_id,
        v.year,
        v.population,
        v.pop_male,
        v.pop_female,
        v.num_households,
        v.source,
        v.method,
        NOW(),
        NOW()
      FROM (
        SELECT
          UNNEST($1::int[]) AS settlement_id,
          UNNEST($2::int[]) AS county_id,
          UNNEST($3::int[]) AS subcounty_id,
          UNNEST($4::int[]) AS ward_id,
          UNNEST($5::int[]) AS year,
          UNNEST($6::int[]) AS population,
          UNNEST($7::int[]) AS pop_male,
          UNNEST($8::int[]) AS pop_female,
          UNNEST($9::int[]) AS num_households,
          UNNEST($10::varchar[]) AS source,
          UNNEST($11::varchar[]) AS method
      ) v
      ON CONFLICT (settlement_id, year) DO UPDATE SET
        county_id = EXCLUDED.county_id,
        subcounty_id = EXCLUDED.subcounty_id,
        ward_id = EXCLUDED.ward_id,
        population = EXCLUDED.population,
        pop_male = EXCLUDED.pop_male,
        pop_female = EXCLUDED.pop_female,
        num_households = EXCLUDED.num_households,
        source = EXCLUDED.source,
        method = EXCLUDED.method,
        "updatedAt" = NOW()
    `,
    {
      bind: [
        settlementIds,
        countyIds,
        subcountyIds,
        wardIds,
        years,
        populations,
        males,
        females,
        households,
        sources,
        methods,
      ],
      type: db.Sequelize.QueryTypes.INSERT,
      transaction,
    }
  )
}

async function upsertCountyGrowthRateRows(db, rows, options = {}) {
  if (!rows.length) return
  const transaction = options.transaction ?? null

  const countyIds = rows.map((r) => r.county_id)
  const years = rows.map((r) => r.year)
  const rates = rows.map((r) => r.annual_rate)
  const householdRates = rows.map((r) =>
    r.household_growth_rate != null ? r.household_growth_rate : r.annual_rate
  )
  const notes = rows.map((r) => r.notes ?? null)

  await db.sequelize.query(
    `
      INSERT INTO county_population_growth_rate (
        county_id,
        year,
        annual_rate,
        household_growth_rate,
        notes,
        "createdAt",
        "updatedAt"
      )
      SELECT
        v.county_id,
        v.year,
        v.annual_rate,
        v.household_growth_rate,
        v.notes,
        NOW(),
        NOW()
      FROM (
        SELECT
          UNNEST($1::int[]) AS county_id,
          UNNEST($2::int[]) AS year,
          UNNEST($3::double precision[]) AS annual_rate,
          UNNEST($4::double precision[]) AS household_growth_rate,
          UNNEST($5::text[]) AS notes
      ) v
      ON CONFLICT (county_id, year) DO UPDATE SET
        annual_rate = EXCLUDED.annual_rate,
        household_growth_rate = EXCLUDED.household_growth_rate,
        notes = EXCLUDED.notes,
        "updatedAt" = NOW()
    `,
    {
      bind: [countyIds, years, rates, householdRates, notes],
      type: db.Sequelize.QueryTypes.INSERT,
      transaction,
    }
  )
}

/**
 * Seed settlement_population baseline rows from current settlement demographics.
 */
async function seedSettlementPopulationBaseline(db, options = {}) {
  const baselineYear = options.baseline_year ?? DEFAULT_BASELINE_YEAR
  const countyId = options.county_id ?? null
  const scope = options.scope === 'all' ? 'all' : 'missing'
  const dryRun = options.dry_run === true
  const transaction = options.transaction ?? null

  const filters = ['s.population IS NOT NULL', 's.population > 0']
  const replacements = { baselineYear }

  if (countyId != null && Number.isFinite(Number(countyId))) {
    filters.push('s.county_id = :countyId')
    replacements.countyId = Number(countyId)
  }
  if (scope === 'missing') {
    filters.push(
      `NOT EXISTS (
        SELECT 1 FROM settlement_population sp
        WHERE sp.settlement_id = s.id AND sp.year = :baselineYear
      )`
    )
  }

  const settlements = await db.sequelize.query(
    `
      SELECT
        s.id AS settlement_id,
        s.name AS settlement_name,
        s.county_id,
        s.subcounty_id,
        s.ward_id,
        s.population,
        s.pop_male,
        s.pop_female,
        s.num_households
      FROM settlement s
      WHERE ${filters.join(' AND ')}
      ORDER BY s.id
    `,
    {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
      transaction,
    }
  )

  const counties = await db.models.county.findAll({
    attributes: ['id', 'pop_male', 'pop_female', 'pop_total'],
    raw: true,
    transaction,
  })
  const countyById = buildCountyMap(counties)

  const rows = []
  for (const s of settlements) {
    const population = roundCount(s.population)
    let pop_male = roundCount(s.pop_male)
    let pop_female = roundCount(s.pop_female)

    if (pop_male == null && pop_female == null) {
      const split = splitSexFromCounty(population, countyById.get(Number(s.county_id)))
      pop_male = split.pop_male
      pop_female = split.pop_female
    }

    rows.push({
      settlement_id: s.settlement_id,
      settlement_name: s.settlement_name,
      county_id: s.county_id,
      subcounty_id: s.subcounty_id,
      ward_id: s.ward_id,
      year: baselineYear,
      population,
      pop_male,
      pop_female,
      num_households: roundCount(s.num_households),
      source: 'census_2019',
      method: 'settlement_current_values',
    })
  }

  if (!dryRun && rows.length > 0) {
    await upsertSettlementPopulationRows(db, rows, { transaction })
  }

  return {
    baseline_year: baselineYear,
    total_candidates: settlements.length,
    rows_written: dryRun ? 0 : rows.length,
    preview: rows.slice(0, 50),
    dry_run: dryRun,
  }
}

/**
 * Project settlement_population year-by-year using county_population_growth_rate.
 */
async function applySettlementPopulationProjection(db, options = {}) {
  const baselineYear = options.baseline_year ?? DEFAULT_BASELINE_YEAR
  const projectThroughYear =
    options.project_through_year != null
      ? Number(options.project_through_year)
      : new Date().getFullYear()
  const countyId = options.county_id ?? null
  const dryRun = options.dry_run === true
  const syncSettlement = options.sync_settlement !== false
  const syncSettlementYear =
    options.sync_settlement_year != null
      ? Number(options.sync_settlement_year)
      : new Date().getFullYear()
  const transaction = options.transaction ?? null

  if (!Number.isFinite(projectThroughYear) || projectThroughYear <= baselineYear) {
    throw new Error('project_through_year must be greater than baseline_year')
  }
  if (syncSettlement && !Number.isFinite(syncSettlementYear)) {
    throw new Error('sync_settlement_year is invalid')
  }
  if (syncSettlement && syncSettlementYear > projectThroughYear) {
    throw new Error(
      `Cannot update settlement master to ${syncSettlementYear}: projection only runs through ${projectThroughYear}`
    )
  }

  const settlementFilters = []
  const replacements = { baselineYear }
  if (countyId != null && Number.isFinite(Number(countyId))) {
    settlementFilters.push('s.county_id = :countyId')
    replacements.countyId = Number(countyId)
  }
  const settlementWhere = settlementFilters.length ? `AND ${settlementFilters.join(' AND ')}` : ''

  const baselines = await db.sequelize.query(
    `
      SELECT
        sp.settlement_id,
        s.name AS settlement_name,
        COALESCE(sp.county_id, s.county_id) AS county_id,
        COALESCE(sp.subcounty_id, s.subcounty_id) AS subcounty_id,
        COALESCE(sp.ward_id, s.ward_id) AS ward_id,
        sp.year,
        sp.population,
        sp.pop_male,
        sp.pop_female,
        sp.num_households
      FROM settlement_population sp
      INNER JOIN settlement s ON s.id = sp.settlement_id
      WHERE sp.year = :baselineYear
      ${settlementWhere}
      ORDER BY sp.settlement_id
    `,
    {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
      transaction,
    }
  )

  const rateRows = await db.models.county_population_growth_rate.findAll({
    attributes: ['county_id', 'year', 'annual_rate', 'household_growth_rate'],
    where: {
      year: {
        [db.Sequelize.Op.gt]: baselineYear,
        [db.Sequelize.Op.lte]: projectThroughYear,
      },
      ...(countyId != null && Number.isFinite(Number(countyId))
        ? { county_id: Number(countyId) }
        : {}),
    },
    raw: true,
    transaction,
  })
  const rateMap = buildCountyRateMap(rateRows)

  const counties = await db.models.county.findAll({
    attributes: ['id', 'pop_male', 'pop_female', 'pop_total'],
    raw: true,
    transaction,
  })
  const countyById = buildCountyMap(counties)

  const projectedRows = []
  const skipped = []
  let missingRateCount = 0

  for (const base of baselines) {
    let population = roundCount(base.population)
    let pop_male = roundCount(base.pop_male)
    let pop_female = roundCount(base.pop_female)
    let num_households = roundCount(base.num_households)
    const county = countyById.get(Number(base.county_id))
    let blocked = false

    if (population == null || population <= 0) {
      skipped.push({
        settlement_id: base.settlement_id,
        settlement_name: base.settlement_name,
        county_id: base.county_id,
        year: baselineYear,
        reason: 'missing_baseline_population',
      })
      continue
    }

    if (pop_male == null || pop_female == null) {
      const seedSplit = splitSexFromCounty(population, county)
      if (pop_male == null) pop_male = seedSplit.pop_male
      if (pop_female == null) pop_female = seedSplit.pop_female
    }

    for (let year = baselineYear + 1; year <= projectThroughYear; year++) {
      const rate = rateMap.get(`${base.county_id}:${year}`)
      if (
        rate == null ||
        !Number.isFinite(rate.population) ||
        !Number.isFinite(rate.households)
      ) {
        missingRateCount++
        blocked = true
        skipped.push({
          settlement_id: base.settlement_id,
          settlement_name: base.settlement_name,
          county_id: base.county_id,
          year,
          reason: 'missing_county_rate',
        })
        break
      }

      const popFactor = 1 + rate.population
      const hhFactor = 1 + rate.households
      population = roundCount(population * popFactor)

      const split = projectSexCounts(
        population,
        pop_male,
        pop_female,
        popFactor,
        county
      )
      pop_male = split.pop_male
      pop_female = split.pop_female

      if (num_households != null) {
        num_households = roundCount(num_households * hhFactor)
      }

      projectedRows.push({
        settlement_id: base.settlement_id,
        settlement_name: base.settlement_name,
        county_id: base.county_id,
        subcounty_id: base.subcounty_id,
        ward_id: base.ward_id,
        year,
        population,
        pop_male,
        pop_female,
        num_households,
        source: 'projected',
        method: 'county_compound_growth',
      })
    }

    if (blocked) {
      // keep partial projections if any were computed before missing rate
    }
  }

  if (!dryRun && projectedRows.length > 0) {
    const chunkSize = 500
    for (let i = 0; i < projectedRows.length; i += chunkSize) {
      const chunk = projectedRows.slice(i, i + chunkSize)
      await upsertSettlementPopulationRows(db, chunk, { transaction })
    }

    if (syncSettlement) {
      const syncReplacements = { syncYear: syncSettlementYear }
      let syncWhere = ''
      if (countyId != null && Number.isFinite(Number(countyId))) {
        syncWhere = 'AND s.county_id = :countyId'
        syncReplacements.countyId = Number(countyId)
      }

      await db.sequelize.query(
        `
          UPDATE settlement s
          SET population = sp.population,
              pop_male = sp.pop_male,
              pop_female = sp.pop_female,
              num_households = sp.num_households,
              "updatedAt" = NOW()
          FROM settlement_population sp
          WHERE sp.settlement_id = s.id
            AND sp.year = :syncYear
            ${syncWhere}
        `,
        {
          replacements: syncReplacements,
          type: db.Sequelize.QueryTypes.UPDATE,
          transaction,
        }
      )
    }
  }

  const settlementsProjected = new Set(projectedRows.map((r) => r.settlement_id)).size
  const syncYearRows = projectedRows.filter((r) => r.year === syncSettlementYear)
  const settlementsForSyncYear = new Set(syncYearRows.map((r) => r.settlement_id)).size

  return {
    baseline_year: baselineYear,
    project_through_year: projectThroughYear,
    sync_settlement_year: syncSettlement ? syncSettlementYear : null,
    baselines_found: baselines.length,
    settlements_projected: settlementsProjected,
    settlements_synced: syncSettlement && !dryRun ? settlementsForSyncYear : 0,
    would_sync_settlement: syncSettlement ? settlementsForSyncYear : 0,
    would_write: projectedRows.length,
    rows_written: dryRun ? 0 : projectedRows.length,
    missing_rate_events: missingRateCount,
    skipped: skipped.slice(0, 100),
    preview: (syncYearRows.length ? syncYearRows : projectedRows).slice(0, 50),
    sync_settlement: syncSettlement && !dryRun,
    dry_run: dryRun,
  }
}

/**
 * File import: cell values are always percent (2.8, 0.617, -3.56) → store as decimal.
 */
function parseImportGrowthRatePercent(value) {
  if (value == null || value === '') return null
  let rate = value
  if (typeof rate === 'string') {
    rate = rate.replace('%', '').trim()
    rate = parseFloat(rate)
  } else {
    rate = Number(rate)
  }
  if (!Number.isFinite(rate)) return null
  return rate / 100
}

/**
 * API / grid save: accepts percent when |value| > 1, otherwise already decimal.
 */
function parseGrowthRateValue(value) {
  if (value == null || value === '') return null
  let rate = value
  if (typeof rate === 'string') {
    rate = rate.replace('%', '').trim()
    rate = parseFloat(rate)
  } else {
    rate = Number(rate)
  }
  if (!Number.isFinite(rate)) return null
  if (Math.abs(rate) > 1) rate = rate / 100
  return rate
}

/**
 * Upsert county growth rates (population + household rates per year).
 */
async function bulkUpsertCountyGrowthRates(db, rates = [], options = {}) {
  const transaction = options.transaction ?? null
  const cleaned = []

  for (const row of rates) {
    const county_id = parseInt(row.county_id, 10)
    const year = parseInt(row.year, 10)
    const annual_rate = parseGrowthRateValue(row.annual_rate)
    const household_growth_rate = parseGrowthRateValue(row.household_growth_rate)

    if (!Number.isFinite(county_id) || !Number.isFinite(year) || annual_rate == null) {
      continue
    }

    cleaned.push({
      county_id,
      year,
      annual_rate,
      household_growth_rate: household_growth_rate ?? annual_rate,
      notes: row.notes ?? null,
    })
  }

  if (cleaned.length === 0) {
    return { upserted: 0 }
  }

  await upsertCountyGrowthRateRows(db, cleaned, { transaction })

  return { upserted: cleaned.length }
}

/**
 * Import settlement_population baseline rows from parsed Excel data.
 */
async function importSettlementPopulationBaselineFromExcel(db, buffer, options = {}) {
  const baselineYear = options.baseline_year ?? DEFAULT_BASELINE_YEAR
  const dryRun = options.dry_run === true
  const syncSettlement = options.sync_settlement !== false
  const transaction = options.transaction ?? null

  const parsed = parseBaselineExcelBuffer(buffer)
  const settlements = await db.models.settlement.findAll({
    attributes: ['id', 'code', 'name', 'county_id', 'subcounty_id', 'ward_id'],
    raw: true,
    transaction,
  })

  const byId = new Map()
  const byCode = new Map()
  for (const s of settlements) {
    byId.set(Number(s.id), s)
    if (s.code != null && String(s.code).trim() !== '') {
      byCode.set(String(s.code).trim().toLowerCase(), s)
    }
  }

  const results = []
  const toWrite = []

  for (const row of parsed.rows) {
    let settlement = null
    let matchBy = null

    if (row.settlement_id != null && byId.has(row.settlement_id)) {
      settlement = byId.get(row.settlement_id)
      matchBy = 'id'
    }

    if (row.code) {
      const byCodeMatch = byCode.get(row.code.toLowerCase())
      if (byCodeMatch) {
        if (settlement && Number(settlement.id) !== Number(byCodeMatch.id)) {
          results.push({
            excel_row: row.excel_row,
            status: 'error',
            code: row.code,
            settlement_id: row.settlement_id,
            detail: 'id and code refer to different settlements',
          })
          continue
        }
        settlement = byCodeMatch
        matchBy = matchBy || 'code'
      }
    }

    if (!settlement) {
      results.push({
        excel_row: row.excel_row,
        status: 'error',
        code: row.code,
        settlement_id: row.settlement_id,
        detail: 'Settlement not found (match by id or code)',
      })
      continue
    }

    if (row.population == null) {
      results.push({
        excel_row: row.excel_row,
        status: 'error',
        settlement_id: settlement.id,
        settlement_name: settlement.name,
        code: settlement.code,
        detail: 'Population is required',
      })
      continue
    }

    const record = {
      settlement_id: settlement.id,
      settlement_name: settlement.name,
      settlement_code: settlement.code,
      county_id: settlement.county_id,
      subcounty_id: settlement.subcounty_id,
      ward_id: settlement.ward_id,
      year: baselineYear,
      population: row.population,
      pop_male: row.pop_male,
      pop_female: row.pop_female,
      num_households: row.num_households,
      source: 'census_2019',
      method: 'excel_baseline_import',
      excel_row: row.excel_row,
      match_by: matchBy,
    }

    toWrite.push(record)
    results.push({
      ...record,
      status: 'ok',
      detail: dryRun ? 'Would import' : 'Imported',
    })
  }

  if (!dryRun && toWrite.length > 0) {
    await upsertSettlementPopulationRows(db, toWrite, { transaction })

    if (syncSettlement) {
      const ids = toWrite.map((r) => r.settlement_id)
      const populations = toWrite.map((r) => r.population)
      const males = toWrite.map((r) => r.pop_male)
      const females = toWrite.map((r) => r.pop_female)
      const households = toWrite.map((r) => r.num_households)

      await db.sequelize.query(
        `
          UPDATE settlement s
          SET population = v.population,
              pop_male = v.pop_male,
              pop_female = v.pop_female,
              num_households = v.num_households,
              "updatedAt" = NOW()
          FROM (
            SELECT UNNEST($1::int[]) AS id,
                   UNNEST($2::int[]) AS population,
                   UNNEST($3::int[]) AS pop_male,
                   UNNEST($4::int[]) AS pop_female,
                   UNNEST($5::int[]) AS num_households
          ) v
          WHERE s.id = v.id
        `,
        {
          bind: [ids, populations, males, females, households],
          type: db.Sequelize.QueryTypes.UPDATE,
          transaction,
        }
      )
    }
  }

  const imported = results.filter((r) => r.status === 'ok').length
  const errors = results.filter((r) => r.status === 'error').length

  return {
    baseline_year: baselineYear,
    sheet_name: parsed.sheet_name,
    header_row: parsed.header_row,
    mapped_columns: parsed.mapped_columns,
    total_rows: parsed.rows.length,
    imported,
    errors,
    rows_written: dryRun ? 0 : imported,
    would_write: imported,
    sync_settlement: syncSettlement && !dryRun,
    dry_run: dryRun,
    results,
    preview: results.filter((r) => r.status === 'ok').slice(0, 50),
  }
}

/**
 * Import county growth rates from separate population and/or household Excel files.
 */
async function importCountyGrowthRatesFromExcel(db, buffers = {}, options = {}) {
  const { popBuffer = null, hhBuffer = null } = buffers
  const dryRun = options.dry_run === true
  const transaction = options.transaction ?? null

  if (!popBuffer && !hhBuffer) {
    throw new Error('At least one Excel file is required (population or household rates)')
  }

  const counties = await db.models.county.findAll({
    attributes: ['id', 'name', 'code'],
    raw: true,
    transaction,
  })
  const countyById = new Map()
  const countyByCode = new Map()
  for (const c of counties) {
    countyById.set(Number(c.id), c)
    if (c.code != null && String(c.code).trim() !== '') {
      countyByCode.set(String(c.code).trim().toLowerCase(), c)
    }
  }

  const merged = new Map()
  const results = []

  const absorbParsedRows = (parsed) => {
    for (const row of parsed.rows) {
      let county = null
      let matchBy = null

      if (row.county_id != null && countyById.has(row.county_id)) {
        county = countyById.get(row.county_id)
        matchBy = 'county_id'
      }
      if (row.county_code) {
        const codeMatch = countyByCode.get(row.county_code.toLowerCase())
        if (codeMatch) {
          if (county && Number(county.id) !== Number(codeMatch.id)) {
            results.push({
              excel_row: row.excel_row,
              kind: row.kind,
              status: 'error',
              county_code: row.county_code,
              county_id: row.county_id,
              year: row.year,
              detail: 'county_id and code refer to different counties',
            })
            continue
          }
          county = codeMatch
          matchBy = matchBy || 'code'
        }
      }

      if (!county) {
        results.push({
          excel_row: row.excel_row,
          kind: row.kind,
          status: 'error',
          county_code: row.county_code,
          county_id: row.county_id,
          year: row.year,
          detail:
            row.county_id == null
              ? 'county_id is required'
              : 'County not found (match by county_id or code)',
        })
        continue
      }

      if (row.year == null || !Number.isFinite(row.year)) {
        results.push({
          excel_row: row.excel_row,
          kind: row.kind,
          status: 'error',
          county_id: county.id,
          county_name: county.name,
          year: row.year,
          detail: 'Year is required',
        })
        continue
      }

      if (row.rate == null) {
        results.push({
          excel_row: row.excel_row,
          kind: row.kind,
          status: 'error',
          county_id: county.id,
          county_name: county.name,
          year: row.year,
          detail: 'Rate is required',
        })
        continue
      }

      const key = `${county.id}:${row.year}`
      const existing = merged.get(key) || {
        county_id: county.id,
        county_name: county.name,
        county_code: county.code,
        year: row.year,
        annual_rate: null,
        household_growth_rate: null,
        match_by: matchBy,
      }

      if (row.kind === 'population') {
        existing.annual_rate = row.rate
        existing.pop_excel_row = row.excel_row
      } else {
        existing.household_growth_rate = row.rate
        existing.hh_excel_row = row.excel_row
      }
      if (row.data_note && !existing.notes) {
        existing.notes = row.data_note
      }

      merged.set(key, existing)
    }
  }

  let popParsed = null
  let hhParsed = null
  if (popBuffer) {
    popParsed = parseCountyRateFileBuffer(popBuffer, 'population')
    absorbParsedRows(popParsed)
  }
  if (hhBuffer) {
    hhParsed = parseCountyRateFileBuffer(hhBuffer, 'household')
    absorbParsedRows(hhParsed)
  }

  const needsExistingPop = [...merged.values()].filter(
    (r) => r.annual_rate == null && r.household_growth_rate != null
  )
  if (needsExistingPop.length > 0) {
    const existingRates = await db.models.county_population_growth_rate.findAll({
      attributes: ['county_id', 'year', 'annual_rate', 'household_growth_rate'],
      where: {
        [db.Sequelize.Op.or]: needsExistingPop.map((r) => ({
          county_id: r.county_id,
          year: r.year,
        })),
      },
      raw: true,
      transaction,
    })
    const existingMap = new Map(
      existingRates.map((r) => [`${r.county_id}:${r.year}`, r])
    )
    for (const row of needsExistingPop) {
      const ex = existingMap.get(`${row.county_id}:${row.year}`)
      if (ex) {
        row.annual_rate = Number(ex.annual_rate)
        if (row.household_growth_rate == null && ex.household_growth_rate != null) {
          row.household_growth_rate = Number(ex.household_growth_rate)
        }
      }
    }
  }

  const toUpsert = []
  for (const row of merged.values()) {
    if (row.annual_rate == null) {
      results.push({
        excel_row: row.hh_excel_row ?? row.pop_excel_row,
        kind: 'household',
        status: 'error',
        county_id: row.county_id,
        county_name: row.county_name,
        county_code: row.county_code,
        year: row.year,
        detail: 'Population rate missing — import population file or ensure row exists in DB',
      })
      continue
    }

    const record = {
      county_id: row.county_id,
      county_name: row.county_name,
      county_code: row.county_code,
      year: row.year,
      annual_rate: row.annual_rate,
      household_growth_rate: row.household_growth_rate ?? row.annual_rate,
      notes: row.notes ?? null,
      match_by: row.match_by,
    }

    toUpsert.push(record)
    results.push({
      ...record,
      pop_rate_percent: Math.round(row.annual_rate * 10000) / 100,
      hh_rate_percent: Math.round(record.household_growth_rate * 10000) / 100,
      status: 'ok',
      detail: dryRun ? 'Would import' : 'Imported',
    })
  }

  if (!dryRun && toUpsert.length > 0) {
    await upsertCountyGrowthRateRows(db, toUpsert, { transaction })
  }

  const imported = results.filter((r) => r.status === 'ok').length
  const errors = results.filter((r) => r.status === 'error').length

  return {
    pop_file_format: popParsed?.format ?? null,
    hh_file_format: hhParsed?.format ?? null,
    pop_file_rows: popParsed?.rows?.length ?? 0,
    hh_file_rows: hhParsed?.rows?.length ?? 0,
    total_merged: merged.size,
    imported,
    errors,
    rows_written: dryRun ? 0 : imported,
    would_write: imported,
    dry_run: dryRun,
    results,
    preview: results.filter((r) => r.status === 'ok').slice(0, 50),
  }
}

module.exports = {
  DEFAULT_BASELINE_YEAR,
  splitSexFromCounty,
  parseBaselineExcelBuffer,
  parseCountyRateExcelBuffer,
  parseCountyRateFileBuffer,
  seedSettlementPopulationBaseline,
  importSettlementPopulationBaselineFromExcel,
  importCountyGrowthRatesFromExcel,
  applySettlementPopulationProjection,
  bulkUpsertCountyGrowthRates,
}
