import request from '@/config/axios'

const prod = import.meta.env.VITE_APP_HOST

export interface ClimateAssessment {
  id: number
  settlement_id: number
  assessor_id?: number | null
  assessed_at?: string | null
  status: string
  hazard_score?: number | null
  exposure_score?: number | null
  sensitivity_score?: number | null
  adaptive_capacity_score?: number | null
  vulnerability_rating?: string | null
  hazard_responses?: Record<string, string>
  exposure_responses?: Record<string, string>
  sensitivity_responses?: Record<string, string>
  adaptive_capacity_responses?: Record<string, string>
  settlement?: { id: number; name: string; code: string }
  assessor?: { id: number; username: string; email: string }
}

export interface AssessmentQuestions {
  hazard: { label: string; categories: Array<{ key: string; label: string; questions: Array<{ key: string; label: string; hint?: string; answers: Record<string, number> }> }> }
  exposure: { label: string; categories: Array<{ key: string; label: string; questions: Array<{ key: string; label: string; answers: Record<string, number> }> }> }
  sensitivity: { label: string; categories: Array<{ key: string; label: string; questions: Array<{ key: string; label: string; answers: Record<string, number> }> }> }
  adaptive_capacity: { label: string; categories: Array<{ key: string; label: string; questions: Array<{ key: string; label: string; answers: Record<string, number> }> }> }
}

export const getQuestions = (): Promise<{ code: string; data: AssessmentQuestions; message: string }> => {
  return request.get({
    url: prod + '/api/v1/climate-assessment/questions'
  })
}

export const listAssessments = (params?: { settlement_id?: number }): Promise<{ code: string; data: ClimateAssessment[]; message: string }> => {
  return request.get({
    url: prod + '/api/v1/climate-assessment',
    params
  })
}

export const getAssessment = (id: number): Promise<{ code: string; data: ClimateAssessment; message: string }> => {
  return request.get({
    url: prod + '/api/v1/climate-assessment/' + id
  })
}

export const createAssessment = (data: { settlement_id: number; assessed_at?: string }): Promise<{ code: string; data: ClimateAssessment; message: string }> => {
  return request.post({
    url: prod + '/api/v1/climate-assessment',
    data
  })
}

export const updateAssessment = (id: number, data: Partial<{
  hazard_responses: Record<string, string>
  exposure_responses: Record<string, string>
  sensitivity_responses: Record<string, string>
  adaptive_capacity_responses: Record<string, string>
  status: string
  assessed_at: string
}>): Promise<{ code: string; data: ClimateAssessment; message: string }> => {
  return request.put({
    url: prod + '/api/v1/climate-assessment/' + id,
    data
  })
}

export const deleteAssessment = (id: number): Promise<{ code: string; message: string }> => {
  return request.delete({
    url: prod + '/api/v1/climate-assessment/' + id
  })
}
