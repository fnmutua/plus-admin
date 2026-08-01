/** SUD Regional Tracker layout (matches tools/SUD Regional Tracker (1).xlsx). */

import {
  CANONICAL_REGION_ORDER,
  inferRegionFromCounty,
  regionToSheetName,
  regionToSheetTitle,
  resolveCanonicalRegion,
} from '@/constants/projectRegions'

export const S_RIFT_REGION_LABEL = 'SOUTH RIFT REGION'
export const S_RIFT_SHEET_NAME = 'S.RIFT'

export const TRACKER_COLUMN_COUNT = 24

export const TRACKER_HEADERS = [
  'S/No.',
  'Project Name',
  'County',
  'Constituency',
  'Project Type',
  'Location',
  'Contractor',
  'Contract No.',
  'Consultant',
  'No. Units/Target',
  'Contract Period',
  'Handover Date',
  'Start Date',
  'End Date',
  'Practical Completion Date',
  'Project Estimated Cost (KES)',
  'Cumulative Payments to Date',
  'Balance',
  'Completion Status (%)',
  'Time Lapsed( %)',
  'Remarks',
  'No. of Workers on Site',
  'Latest  Date Updated',
  'Supplementary Info',
] as const

type TrackerSection = 'SOCIAL HOUSING' | 'MARKETS' | 'SOCIAL INFRASTRUCTURE'

type WriteCell = {
  type: StringConstructor | NumberConstructor
  value: string | number
  fontWeight?: 'bold'
  format?: string
}

const MONEY_FORMAT = '#,##0'
const PERCENT_FORMAT = '0%'

/** Strip characters that are invalid in Excel/XML cell text. */
function sanitizeExcelString(value: unknown): string {
  if (value == null) return ''
  return String(value).replace(
    /[\0-\x08\x0B\x0C\x0E-\x1F\uFFFD\uFFFE\uFFFF]/g,
    '',
  )
}

export type RegionalTrackerProjectRow = {
  serial: number
  region: string
  projectName: string
  county: string
  constituency: string
  projectType: string
  location: string
  contractor: string
  contractNo: string
  consultant: string
  units: number
  contractPeriod: string
  handoverDate: string
  startDate: string
  endDate: string
  practicalCompletionDate: string
  estimatedCost: number
  cumulativePayments: number
  balance: number | null
  completionStatus: number | null
  timeLapsed: number | null
  remarks: string
  workersOnSite: string
  latestUpdated: string
  supplementaryInfo: string
  section: TrackerSection
}

/** Kenya fiscal year (Jul–Jun), aligned with ProjectDetails monitoring tab. */
export function getMonitoringFiscalYear(date: Date = new Date()): string {
  const month = date.getMonth()
  const year = date.getFullYear()
  if (month >= 6) return `${year}/${year + 1}`
  return `${year - 1}/${year}`
}

export type ProjectIndicatorTarget = {
  project_id: number
  indicator_category_id: number
  target_value: number
  target_kind?: string
  indicator_name: string
}

const SECTION_UNIT_MATCHERS: Record<TrackerSection, RegExp[]> = {
  'SOCIAL HOUSING': [/social housing units/i],
  MARKETS: [/markets and commercial facilities/i],
  'SOCIAL INFRASTRUCTURE': [
    /education facility blocks/i,
    /education facility progress/i,
    /floodlights/i,
    /health facilities/i,
    /access roads/i,
    /social halls/i,
    /bridges and footbridges/i,
    /boreholes and water towers/i,
    /high mast/i,
  ],
}

const DEFAULT_SECTION_UNITS: Record<TrackerSection, number> = {
  'SOCIAL HOUSING': 0,
  MARKETS: 1,
  'SOCIAL INFRASTRUCTURE': 1,
}

function parseProjectTargetRecord(row: any): ProjectIndicatorTarget | null {
  if (String(row?.scope_type || '') !== 'project') return null
  if (row?.project_location_id != null) return null

  const projectId = Number(row?.project_id)
  const categoryId = Number(row?.indicator_category_id)
  if (!Number.isFinite(projectId) || !Number.isFinite(categoryId)) return null

  const targetKind = String(row?.target_kind || 'absolute').toLowerCase()
  if (targetKind === 'percent') return null

  const targetValue = Number(row?.target_value)
  if (!Number.isFinite(targetValue) || targetValue <= 0) return null

  const indicatorName = String(
    row?.indicator_category?.indicator_name || row?.indicator_name || '',
  ).trim()
  if (!indicatorName) return null

  return {
    project_id: projectId,
    indicator_category_id: categoryId,
    target_value: targetValue,
    target_kind: targetKind,
    indicator_name: indicatorName,
  }
}

export function buildProjectTargetIndex(
  indicatorTargets: any[] = [],
): Map<number, ProjectIndicatorTarget[]> {
  const byProject = new Map<number, ProjectIndicatorTarget[]>()

  for (const raw of indicatorTargets) {
    const record = parseProjectTargetRecord(raw)
    if (!record) continue
    if (!byProject.has(record.project_id)) byProject.set(record.project_id, [])
    byProject.get(record.project_id)!.push(record)
  }

  return byProject
}

function resolveTrackerUnits(
  projectId: number,
  section: TrackerSection,
  targetIndex: Map<number, ProjectIndicatorTarget[]>,
): number {
  const rows = targetIndex.get(projectId) || []
  const matchers = SECTION_UNIT_MATCHERS[section]

  for (const matcher of matchers) {
    const match = rows.find((row) => matcher.test(row.indicator_name))
    if (match) return Math.round(match.target_value)
  }

  if (section === 'SOCIAL INFRASTRUCTURE') {
    const excluded = [/social housing units/i, /markets and commercial facilities/i]
    const fallback = rows.find((row) => !excluded.some((re) => re.test(row.indicator_name)))
    if (fallback) return Math.round(fallback.target_value)
  }

  return DEFAULT_SECTION_UNITS[section]
}

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  const last = day % 10
  if (last === 1) return 'st'
  if (last === 2) return 'nd'
  if (last === 3) return 'rd'
  return 'th'
}

export function formatTrackerDate(value: unknown): string {
  if (value == null || value === '') return ''
  const d = new Date(value as string | number | Date)
  if (Number.isNaN(d.getTime())) return String(value)
  const day = d.getDate()
  const month = d.toLocaleString('en-GB', { month: 'long' })
  const year = d.getFullYear()
  return `${day}${ordinal(day)} ${month} ${year}`
}

export function parseMoney(value: unknown): number {
  if (value == null || value === '') return 0
  const n = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function calcTimeLapsedRatio(
  start: unknown,
  end: unknown,
  reference = new Date(),
): number | null {
  if (!start || !end) return null
  const s = new Date(start as string | number | Date).getTime()
  const e = new Date(end as string | number | Date).getTime()
  const now = reference.getTime()
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return null
  return (now - s) / (e - s)
}

function monthsBetween(start: unknown, end: unknown): string {
  if (!start || !end) return ''
  const s = new Date(start as string | number | Date)
  const e = new Date(end as string | number | Date)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
  const months = Math.max(
    1,
    Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)),
  )
  return `${months} Months`
}

function classifySection(projectType: string, activityTitles: string[]): TrackerSection {
  const hay = [projectType, ...activityTitles].join(' ').toLowerCase()
  if (hay.includes('social housing')) return 'SOCIAL HOUSING'
  if (hay.includes('market')) return 'MARKETS'
  return 'SOCIAL INFRASTRUCTURE'
}

function inferProjectType(project: any, activities: any[]): string {
  const activityTitle = activities.find((a) => a?.title)?.title
  if (activityTitle) return String(activityTitle)

  const title = String(project?.title || '').toLowerCase()
  if (title.includes('social housing')) return 'Social Housing'
  if (title.includes('market')) return 'Markets'
  if (title.includes('high mast') || title.includes('floodlight') || title.includes('highmast')) {
    return 'High Mast Floodlights'
  }
  if (title.includes('infrastructure')) return 'Social and Physical Infrastructure'
  return 'Social and Physical Infrastructure'
}

function pickContractorNames(projectContractors: any[] | undefined) {
  const rows = Array.isArray(projectContractors) ? projectContractors : []
  const findRole = (role: string) =>
    rows.find((r) => String(r?.role || '').toLowerCase() === role.toLowerCase())?.name || ''

  return {
    contractor: findRole('Main Contractor') || findRole('Subcontractor') || rows[0]?.name || '',
    consultant: findRole('Consultant'),
  }
}

function sumDisbursements(disbursements: any[] | undefined): number {
  if (!Array.isArray(disbursements)) return 0
  return disbursements.reduce((sum, row) => sum + parseMoney(row?.amount), 0)
}

function isRejectedIndicatorReport(report: any): boolean {
  return String(report?.status || '').trim().toLowerCase() === 'rejected'
}

function reportProgressPercent(report: any): number | null {
  const raw = report?.cumProgress ?? report?.progress
  if (raw == null || raw === '') return null
  const pct = Number(raw)
  return Number.isFinite(pct) ? pct : null
}

/** Latest non-rejected report per indicator (and optional location) for a project. */
function latestIndicatorReportsForProject(
  projectId: number,
  locationIds: number[],
  indicatorReports: any[],
): any[] {
  const locSet = new Set(locationIds.filter(Number.isFinite))
  const byKey = new Map<string, any>()

  for (const report of indicatorReports) {
    const pid = Number(report?.project_id ?? report?.project?.id)
    if (pid !== projectId) continue
    if (isRejectedIndicatorReport(report)) continue

    const indicatorId = Number(report?.indicator_category_id)
    if (!Number.isFinite(indicatorId)) continue

    const locId =
      report?.project_location_id != null ? Number(report.project_location_id) : null
    if (locSet.size > 0 && locId != null && !locSet.has(locId)) continue

    const key = `${indicatorId}:${locId ?? 'project'}`
    const existing = byKey.get(key)
    const reportId = Number(report?.id)
    const existingId = Number(existing?.id)
    if (
      !existing ||
      (Number.isFinite(reportId) && (!Number.isFinite(existingId) || reportId > existingId))
    ) {
      byKey.set(key, report)
    }
  }

  return [...byKey.values()]
}

/** Average latest indicator report progress (0–100) for a project, as an Excel ratio (0–1). */
function averageIndicatorReportProgress(
  projectId: number,
  locationIds: number[],
  indicatorReports: any[],
): number | null {
  const latest = latestIndicatorReportsForProject(projectId, locationIds, indicatorReports)
  const ratios = latest
    .map((report) => {
      const pct = reportProgressPercent(report)
      return pct == null ? null : pct / 100
    })
    .filter((v): v is number => v != null)
  if (!ratios.length) return null
  return ratios.reduce((a, b) => a + b, 0) / ratios.length
}

function resolveLocationLabel(loc: any): string {
  if (loc?.location_name) return String(loc.location_name)
  if (loc?.settlement?.name) return String(loc.settlement.name)
  if (loc?.ward?.name) return String(loc.ward.name)
  if (loc?.subcounty?.name) return String(loc.subcounty.name)
  if (loc?.county?.name) return String(loc.county.name)
  return ''
}

function resolveCountyName(loc: any, countiesById: Map<number, string>): string {
  if (loc?.county?.name) return String(loc.county.name)
  if (loc?.county_id != null) return countiesById.get(Number(loc.county_id)) || ''
  if (loc?.settlement?.county?.name) return String(loc.settlement.county.name)
  return ''
}

function resolveConstituencyName(loc: any): string {
  if (loc?.subcounty?.name) return String(loc.subcounty.name)
  if (loc?.settlement?.subcounty?.name) return String(loc.settlement.subcounty.name)
  return ''
}

function resolveProjectRegion(
  project: any,
  allLocs: any[],
  countiesById: Map<number, string>,
): string | null {
  const explicit = resolveCanonicalRegion(project?.region)
  if (explicit) return explicit

  if (String(project?.implementation_scope || '').toLowerCase() === 'national') {
    return null
  }

  for (const loc of allLocs) {
    const countyName = resolveCountyName(loc, countiesById)
    const inferred = inferRegionFromCounty(countyName)
    if (inferred) return inferred
  }

  return null
}

function buildProjectRow(
  project: any,
  loc: any,
  region: string,
  serial: number,
  countiesById: Map<number, string>,
  progressLocs: any[],
  indicatorReports: any[],
  targetIndex: Map<number, ProjectIndicatorTarget[]>,
): RegionalTrackerProjectRow {
  const activities = Array.isArray(project?.activities) ? project.activities : []
  const activityTitles = activities.map((a: any) => String(a?.title || ''))
  const projectType = inferProjectType(project, activities)
  const section = classifySection(projectType, activityTitles)
  const { contractor, consultant } = pickContractorNames(
    project.project_contractors ?? project.project_contractor,
  )
  const estimatedCost = parseMoney(project?.cost)
  const cumulativePayments = sumDisbursements(project?.disbursements ?? project?.disbursement)
  const balance = estimatedCost > 0 ? estimatedCost - cumulativePayments : null
  const locationIds = progressLocs.map((l) => Number(l?.id)).filter(Number.isFinite)
  const completionRatio = averageIndicatorReportProgress(
    Number(project?.id),
    locationIds,
    indicatorReports,
  )
  const endDate = loc?.revised_completion_date || project?.end_date
  const timeLapsed = calcTimeLapsedRatio(project?.start_date, endDate)
  const latestUpdated = project?.updatedAt || project?.updated_at || ''

  return {
    serial,
    region,
    projectName: String(project?.title || ''),
    county: resolveCountyName(loc, countiesById),
    constituency: resolveConstituencyName(loc),
    projectType,
    location: resolveLocationLabel(loc),
    contractor,
    contractNo: String(project?.project_code || ''),
    consultant,
    units: resolveTrackerUnits(Number(project?.id), section, targetIndex),
    contractPeriod: monthsBetween(project?.start_date, endDate),
    handoverDate: '',
    startDate: formatTrackerDate(project?.start_date),
    endDate: formatTrackerDate(endDate),
    practicalCompletionDate: formatTrackerDate(loc?.revised_completion_date),
    estimatedCost,
    cumulativePayments,
    balance,
    completionStatus: completionRatio,
    timeLapsed,
    remarks: String(project?.status || ''),
    workersOnSite: '',
    latestUpdated: formatTrackerDate(latestUpdated),
    supplementaryInfo: String(project?.description || ''),
    section,
  }
}

function collectRegionalTrackerRows(
  projects: any[],
  projectLocations: any[],
  counties: any[],
  indicatorReports: any[] = [],
  indicatorTargets: any[] = [],
): RegionalTrackerProjectRow[] {
  const countiesById = new Map<number, string>()
  counties.forEach((c) => {
    if (c?.id != null) countiesById.set(Number(c.id), String(c.name || ''))
  })
  const targetIndex = buildProjectTargetIndex(indicatorTargets)

  const locationsByProject = new Map<number, any[]>()
  projectLocations.forEach((loc) => {
    const pid = Number(loc?.project_id ?? loc?.project?.id)
    if (!Number.isFinite(pid)) return
    if (!locationsByProject.has(pid)) locationsByProject.set(pid, [])
    locationsByProject.get(pid)!.push(loc)
  })

  const rows: RegionalTrackerProjectRow[] = []
  const serialByRegion = new Map<string, number>()

  for (const project of projects) {
    const pid = Number(project?.id)
    if (!Number.isFinite(pid)) continue

    const allLocs = locationsByProject.get(pid) || []
    const region = resolveProjectRegion(project, allLocs, countiesById)
    if (!region) continue

    const loc = allLocs[0] || {}
    const nextSerial = (serialByRegion.get(region) || 0) + 1
    serialByRegion.set(region, nextSerial)

    rows.push(
      buildProjectRow(
        project,
        loc,
        region,
        nextSerial,
        countiesById,
        allLocs,
        indicatorReports,
        targetIndex,
      ),
    )
  }

  return rows
}

export function buildRegionalTrackerRows(
  projects: any[],
  projectLocations: any[],
  counties: any[],
  indicatorReports: any[] = [],
  indicatorTargets: any[] = [],
): RegionalTrackerProjectRow[] {
  return collectRegionalTrackerRows(
    projects,
    projectLocations,
    counties,
    indicatorReports,
    indicatorTargets,
  )
}

/** @deprecated use buildRegionalTrackerRows */
export function buildSouthRiftTrackerRows(
  projects: any[],
  projectLocations: any[],
  counties: any[],
): RegionalTrackerProjectRow[] {
  return buildRegionalTrackerRows(projects, projectLocations, counties).filter(
    (row) => row.region === 'Rift Valley - South',
  )
}

function cellString(value: unknown, bold = false): WriteCell {
  return {
    type: String,
    value: sanitizeExcelString(value),
    ...(bold ? { fontWeight: 'bold' as const } : {}),
  }
}

function cellNumber(value: unknown, bold = false): WriteCell | null {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return {
    type: Number,
    value: n,
    ...(bold ? { fontWeight: 'bold' as const } : {}),
  }
}

function cellMoney(value: unknown, bold = false): WriteCell {
  const n = Number(value)
  return {
    type: Number,
    value: Number.isFinite(n) ? n : 0,
    format: MONEY_FORMAT,
    ...(bold ? { fontWeight: 'bold' as const } : {}),
  }
}

function cellPercent(value: unknown, bold = false): WriteCell {
  const n = Number(value)
  return {
    type: Number,
    value: Number.isFinite(n) ? n : 0,
    format: PERCENT_FORMAT,
    ...(bold ? { fontWeight: 'bold' as const } : {}),
  }
}

function emptyCell(): null {
  return null
}

function emptyRow(): (WriteCell | null)[] {
  return Array.from({ length: TRACKER_COLUMN_COUNT }, () => emptyCell())
}

function sectionHeader(label: TrackerSection): (WriteCell | null)[] {
  const row = emptyRow()
  row[1] = cellString(label, true)
  return row
}

function sectionTotal(label: string, sectionRows: RegionalTrackerProjectRow[]): (WriteCell | null)[] {
  const row = emptyRow()
  const units = sectionRows.reduce((sum, r) => sum + r.units, 0)
  const cost = sectionRows.reduce((sum, r) => sum + r.estimatedCost, 0)
  const avgCompletion =
    sectionRows.length > 0
      ? sectionRows.reduce((sum, r) => sum + (r.completionStatus ?? 0), 0) / sectionRows.length
      : null

  row[1] = cellString(label, true)
  row[9] = cellNumber(units, true)
  row[15] = cellMoney(cost, true)
  row[18] = cellPercent(avgCompletion, true)
  return row
}

function projectDataRow(row: RegionalTrackerProjectRow): (WriteCell | null)[] {
  const cells = emptyRow()
  cells[0] = cellNumber(row.serial)
  cells[1] = cellString(row.projectName)
  cells[2] = cellString(row.county)
  cells[3] = cellString(row.constituency)
  cells[4] = cellString(row.projectType)
  cells[5] = cellString(row.location)
  cells[6] = cellString(row.contractor)
  cells[7] = cellString(row.contractNo)
  cells[8] = cellString(row.consultant)
  cells[9] = cellNumber(row.units)
  cells[10] = cellString(row.contractPeriod)
  cells[11] = cellString(row.handoverDate)
  cells[12] = cellString(row.startDate)
  cells[13] = cellString(row.endDate)
  cells[14] = cellString(row.practicalCompletionDate)
  cells[15] = cellMoney(row.estimatedCost)
  cells[16] = cellMoney(row.cumulativePayments)
  cells[17] = cellMoney(row.balance)
  cells[18] = cellPercent(row.completionStatus)
  cells[19] = cellPercent(row.timeLapsed)
  cells[20] = cellString(row.remarks)
  cells[21] = cellString(row.workersOnSite)
  cells[22] = cellString(row.latestUpdated)
  cells[23] = cellString(row.supplementaryInfo)
  return cells
}

const SECTION_ORDER: TrackerSection[] = ['SOCIAL HOUSING', 'MARKETS', 'SOCIAL INFRASTRUCTURE']

const SECTION_TOTAL_LABEL: Record<TrackerSection, string> = {
  'SOCIAL HOUSING': 'TOTAL FOR SOCIAL HOUSING',
  MARKETS: 'TOTAL FOR MARKETS',
  'SOCIAL INFRASTRUCTURE': 'TOTAL FOR SOCIAL INFRASTRUCTURE',
}

export function buildRegionalTrackerSheet(
  regionLabel: string,
  rows: RegionalTrackerProjectRow[],
): (WriteCell | null)[][] {
  const sheet: WriteCell[][] = []

  const titleRow = emptyRow()
  titleRow[0] = cellString(regionLabel, true)
  sheet.push(titleRow)

  sheet.push(TRACKER_HEADERS.map((h) => cellString(h, true)))

  for (const section of SECTION_ORDER) {
    const sectionRows = rows.filter((r) => r.section === section)
    if (!sectionRows.length) continue

    sheet.push(sectionHeader(section))
    sectionRows.forEach((row) => sheet.push(projectDataRow(row)))
    sheet.push(sectionTotal(SECTION_TOTAL_LABEL[section], sectionRows))
    sheet.push(emptyRow())
  }

  return sheet
}

/** @deprecated use buildRegionalTrackerSheet */
export function buildSouthRiftTrackerSheet(
  rows: RegionalTrackerProjectRow[],
): (WriteCell | null)[][] {
  return buildRegionalTrackerSheet(S_RIFT_REGION_LABEL, rows)
}

const SUMMARY_HEADERS = [
  'S/No.',
  'Region',
  'No. of Projects',
  'No. of Social Housing Units/Target',
  'No. of  Markets ',
  'No. of Social Infrastucture',
  'No of Social Projects',
  'Total Contract Sum',
  'No. of Counties',
  'AVERAGE PROGRESS%',
] as const

type RegionSummaryStats = {
  region: string
  projectCount: number
  housingUnits: number
  markets: number
  socialInfrastructure: number
  socialProjects: number
  totalCost: number
  countyCount: number
  avgProgress: number | null
}

function computeRegionSummary(rows: RegionalTrackerProjectRow[]): RegionSummaryStats {
  const counties = new Set(rows.map((r) => r.county).filter(Boolean))
  const housingRows = rows.filter((r) => r.section === 'SOCIAL HOUSING')
  const marketRows = rows.filter((r) => r.section === 'MARKETS')
  const infraRows = rows.filter((r) => r.section === 'SOCIAL INFRASTRUCTURE')
  const progressVals = rows
    .map((r) => r.completionStatus)
    .filter((v): v is number => v != null && Number.isFinite(v))

  return {
    region: rows[0]?.region || '',
    projectCount: rows.length,
    housingUnits: housingRows.reduce((sum, r) => sum + r.units, 0),
    markets: marketRows.length,
    socialInfrastructure: infraRows.length,
    socialProjects: housingRows.length,
    totalCost: rows.reduce((sum, r) => sum + r.estimatedCost, 0),
    countyCount: counties.size,
    avgProgress: progressVals.length
      ? progressVals.reduce((a, b) => a + b, 0) / progressVals.length
      : null,
  }
}

function buildSummarySheet(allRows: RegionalTrackerProjectRow[]): (WriteCell | null)[][] {
  const sheet: (WriteCell | null)[][] = []
  sheet.push(SUMMARY_HEADERS.map((h) => cellString(h, true)))
  sheet.push(Array.from({ length: SUMMARY_HEADERS.length }, () => emptyCell()))

  const grouped = new Map<string, RegionalTrackerProjectRow[]>()
  for (const row of allRows) {
    if (!grouped.has(row.region)) grouped.set(row.region, [])
    grouped.get(row.region)!.push(row)
  }

  const regionOrder = [
    ...CANONICAL_REGION_ORDER.filter((r) => grouped.has(r)),
    ...[...grouped.keys()]
      .filter((r) => !CANONICAL_REGION_ORDER.includes(r as any))
      .sort((a, b) => a.localeCompare(b)),
  ]

  const totals: RegionSummaryStats = {
    region: 'Grand Total',
    projectCount: 0,
    housingUnits: 0,
    markets: 0,
    socialInfrastructure: 0,
    socialProjects: 0,
    totalCost: 0,
    countyCount: 0,
    avgProgress: null,
  }

  let serial = 0
  const allProgress: number[] = []
  const allCounties = new Set<string>()

  for (const region of regionOrder) {
    const rows = grouped.get(region) || []
    if (!rows.length) continue
    const stats = computeRegionSummary(rows)
    serial += 1

    const row: (WriteCell | null)[] = Array.from({ length: SUMMARY_HEADERS.length }, () => emptyCell())
    row[0] = cellNumber(serial)
    row[1] = cellString(stats.region)
    row[2] = cellNumber(stats.projectCount)
    row[3] = cellNumber(stats.housingUnits)
    row[4] = cellNumber(stats.markets)
    row[5] = cellNumber(stats.socialInfrastructure)
    row[6] = cellNumber(stats.socialProjects)
    row[7] = cellMoney(stats.totalCost)
    row[8] = cellNumber(stats.countyCount)
    row[9] = cellPercent(stats.avgProgress)
    sheet.push(row)

    totals.projectCount += stats.projectCount
    totals.housingUnits += stats.housingUnits
    totals.markets += stats.markets
    totals.socialInfrastructure += stats.socialInfrastructure
    totals.socialProjects += stats.socialProjects
    totals.totalCost += stats.totalCost
    rows.forEach((r) => {
      if (r.county) allCounties.add(r.county)
      if (r.completionStatus != null) allProgress.push(r.completionStatus)
    })
  }

  totals.countyCount = allCounties.size
  totals.avgProgress = allProgress.length
    ? allProgress.reduce((a, b) => a + b, 0) / allProgress.length
    : null

  const grandRow: (WriteCell | null)[] = Array.from({ length: SUMMARY_HEADERS.length }, () =>
    emptyCell(),
  )
  grandRow[1] = cellString('Grand Total', true)
  grandRow[2] = cellNumber(totals.projectCount, true)
  grandRow[3] = cellNumber(totals.housingUnits, true)
  grandRow[4] = cellNumber(totals.markets, true)
  grandRow[5] = cellNumber(totals.socialInfrastructure, true)
  grandRow[6] = cellNumber(totals.socialProjects, true)
  grandRow[7] = cellMoney(totals.totalCost, true)
  grandRow[8] = cellNumber(totals.countyCount, true)
  grandRow[9] = cellPercent(totals.avgProgress, true)
  sheet.push(grandRow)

  return sheet
}

export type RegionalTrackerWorkbook = {
  sheetNames: string[]
  sheets: (WriteCell | null)[][][]
  projectCount: number
}

export function resolveRegionalTrackerProjectRegion(
  project: any,
  projectLocations: any[],
  counties: any[],
): string | null {
  const countiesById = new Map<number, string>()
  counties.forEach((c) => {
    if (c?.id != null) countiesById.set(Number(c.id), String(c.name || ''))
  })

  const pid = Number(project?.id)
  if (!Number.isFinite(pid)) return null

  const allLocs = projectLocations.filter(
    (loc) => Number(loc?.project_id ?? loc?.project?.id) === pid,
  )
  return resolveProjectRegion(project, allLocs, countiesById)
}

export function filterProjectsForRegionalTracker(
  projects: any[],
  projectLocations: any[],
  counties: any[],
  options: {
    componentIds?: Set<number> | null
    regions?: string[] | null
  } = {},
): any[] {
  let list = projects

  if (options.componentIds?.size) {
    list = list.filter((project) => options.componentIds!.has(Number(project.component_id)))
  }

  if (options.regions?.length) {
    const allowed = new Set(
      options.regions.map((region) => resolveCanonicalRegion(region) || region).filter(Boolean),
    )
    list = list.filter((project) => {
      const region = resolveRegionalTrackerProjectRegion(project, projectLocations, counties)
      return region != null && allowed.has(region)
    })
  }

  return list
}

export function buildRegionalTrackerWorkbook(
  projects: any[],
  projectLocations: any[],
  counties: any[],
  indicatorReports: any[] = [],
  indicatorTargets: any[] = [],
): RegionalTrackerWorkbook {
  const allRows = collectRegionalTrackerRows(
    projects,
    projectLocations,
    counties,
    indicatorReports,
    indicatorTargets,
  )
  if (!allRows.length) {
    return { sheetNames: [], sheets: [], projectCount: 0 }
  }

  const grouped = new Map<string, RegionalTrackerProjectRow[]>()
  for (const row of allRows) {
    if (!grouped.has(row.region)) grouped.set(row.region, [])
    grouped.get(row.region)!.push(row)
  }

  const regionOrder = [
    ...CANONICAL_REGION_ORDER.filter((r) => grouped.has(r)),
    ...[...grouped.keys()]
      .filter((r) => !CANONICAL_REGION_ORDER.includes(r as any))
      .sort((a, b) => a.localeCompare(b)),
  ]

  const sheetNames: string[] = ['SUMMARY']
  const sheets: WriteCell[][][] = [buildSummarySheet(allRows)]

  const usedSheetNames = new Set(sheetNames)

  for (const region of regionOrder) {
    const rows = grouped.get(region) || []
    if (!rows.length) continue

    let sheetName = regionToSheetName(region)
    let suffix = 2
    while (usedSheetNames.has(sheetName)) {
      sheetName = `${regionToSheetName(region).slice(0, 28)} ${suffix}`
      suffix += 1
    }
    usedSheetNames.add(sheetName)

    sheetNames.push(sheetName)
    sheets.push(buildRegionalTrackerSheet(regionToSheetTitle(region), rows))
  }

  return { sheetNames, sheets, projectCount: allRows.length }
}

export function summaryColumnWidths(): { width: number }[] {
  return [6, 22, 14, 24, 14, 18, 14, 18, 14, 16].map((width) => ({ width }))
}

export function trackerColumnWidths(): { width: number }[] {
  return [
    6, 48, 12, 16, 18, 14, 22, 28, 22, 16, 12, 14, 14, 14, 18, 18, 18, 14, 14, 12, 16, 12, 16,
    20,
  ].map((width) => ({ width }))
}
