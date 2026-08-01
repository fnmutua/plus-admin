import request from '@/config/axios'

export type RegionalReportSubmissionSummary = {
  id: number
  filingCode: string
  region: string
  fiscalYear: string
  period: number
  reportDate: string
  submitterName: string
  submitterTitle: string | null
  coSubmitters: string | null
  notes: string | null
  status: string
  projectCount: number
  createdAt: string
  updatedAt: string
}

export type RegionalReportSubmissionProject = {
  projectId: number
  title: string
  projectCode: string
  region: string
  completionPct: number
  remarks: string | null
  workersOnSite: string | null
}

export type RegionalReportSubmissionDetail = RegionalReportSubmissionSummary & {
  metadata: Record<string, unknown> | null
  projects: RegionalReportSubmissionProject[]
}

export type RegionalReportSubmissionListParams = {
  page?: number
  limit?: number
  region?: string
  fiscalYear?: string
  period?: number | string
  search?: string
}

export const getRegionalReportSubmissions = (params: RegionalReportSubmissionListParams = {}) =>
  request.get<{ results: { total: number; data: RegionalReportSubmissionSummary[] } }>({
    url: '/api/v1/regional-report-submissions',
    params,
  })

export const getRegionalReportSubmissionById = (id: number) =>
  request.get<{ results: RegionalReportSubmissionDetail }>({
    url: `/api/v1/regional-report-submissions/${id}`,
  })

export type RegionalReportReviewPayload = {
  action: 'save' | 'approve' | 'reject'
  projects: Array<{
    projectId: number
    completionPct: number
    remarks?: string | null
    workersOnSite?: string | null
  }>
  reviewNotes?: string
  rejectReason?: string
}

export const reviewRegionalReportSubmission = (id: number, payload: RegionalReportReviewPayload) =>
  request.put<{ message: string; results: RegionalReportSubmissionDetail }>({
    url: `/api/v1/regional-report-submissions/${id}/review`,
    data: payload,
  })
