import axios from 'axios'

const prod = import.meta.env.VITE_API_BASE_PATH || ''

export type RegionalReportProject = {
  id: number
  title: string
  projectCode: string
  status: string
  county: string
  projectLocationId: number | null
  countyId: number | null
  componentId: number | null
  currentProgress: number | null
}

export type RegionalReportProjectIndicator = {
  indicatorCategoryId: number
  label: string
  unit: string
  format: string
  indicatorLevel: string
  activityId: number | null
  minCumAmount: number
  currentQualitative: string | null
  target: number | null
  targetKind: string
  isQualitative: boolean
}

export type RegionalReportMeta = {
  regions: string[]
  defaultFiscalYear: string
  defaultPeriod: number
}

export type RegionalReportProgramme = {
  id: number
  title: string
  acronym: string
  parentId: number | null
}

export type RegionalReportComponent = {
  id: number
  title: string
  acronym: string
  programme_id: number | null
}

export type RegionalReportIndicatorPayload = {
  indicatorCategoryId: number
  cumAmount: number
  qualitative?: string | null
  target?: number | null
  targetKind?: string | null
}

export type RegionalReportSubmitPayload = {
  region: string
  fiscalYear: string
  period: number
  reportDate: string
  submitterName: string
  submitterTitle?: string
  coSubmitters?: string
  notes?: string
  metadata?: Record<string, unknown>
  projects: Array<{
    projectId: number
    completionPct?: number
    remarks?: string
    workersOnSite?: string | number
    indicators?: RegionalReportIndicatorPayload[]
  }>
}

export const getRegionalReportMeta = (): Promise<RegionalReportMeta> =>
  axios.get(`${prod}/api/public/regional-report/meta`).then((res) => res.data)

export const getRegionalReportProgrammes = (): Promise<{
  programmes: RegionalReportProgramme[]
  components: RegionalReportComponent[]
}> => axios.get(`${prod}/api/public/regional-report/programmes`).then((res) => res.data)

export const getRegionalReportProjects = (
  region: string,
): Promise<{ region: string; projects: RegionalReportProject[] }> =>
  axios
    .get(`${prod}/api/public/regional-report/projects`, { params: { region } })
    .then((res) => res.data)

export const getRegionalReportProjectIndicators = (params: {
  region: string
  projectId: number
  fiscalYear?: string
}): Promise<{ projectId: number; fiscalYear: string; indicators: RegionalReportProjectIndicator[] }> =>
  axios
    .get(`${prod}/api/public/regional-report/indicators`, { params })
    .then((res) => res.data)

export type RegionalReportHistoryEntry = {
  id: number
  code: string
  date: string
  period: string
  label: string
  unit: string
  isImplementationStatus: boolean
  amount: number | null
  cumAmount: number | null
  progress: number | null
  target: number | null
  qualitative: string | null
  status: string
}

export const getRegionalReportProjectHistory = (params: {
  region: string
  projectId: number
}): Promise<{ projectId: number; entries: RegionalReportHistoryEntry[] }> =>
  axios
    .get(`${prod}/api/public/regional-report/history`, { params })
    .then((res) => res.data)

export const submitRegionalReport = (
  payload: RegionalReportSubmitPayload,
): Promise<{ message: string; filingCode: string; submissionId: number; projectCount: number }> =>
  axios.post(`${prod}/api/public/regional-report/submit`, payload).then((res) => res.data)

export type RegionalReportDocumentSummary = {
  id: number
  name: string
  format: string | null
  size: number | null
  createdAt: string
}

export const uploadRegionalReportDocuments = (
  filingCode: string,
  files: File[],
): Promise<{ message: string; filingCode: string; documents: RegionalReportDocumentSummary[] }> => {
  const formData = new FormData()
  formData.append('filingCode', filingCode)
  for (const file of files) {
    formData.append('files', file)
  }
  return axios
    .post(`${prod}/api/public/regional-report/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}
