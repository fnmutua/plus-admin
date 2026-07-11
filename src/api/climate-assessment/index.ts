import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export interface ClimateAssessment {
  id: number
  settlement_id: number
  county_id?: number | null
  assessor_id?: number | null
  assessed_at?: string | null
  status: string
  hazard_score?: number | null
  exposure_score?: number | null
  sensitivity_score?: number | null
  adaptive_capacity_score?: number | null
  vulnerability_score?: number | null
  vulnerability_rating?: string | null
  risk_score?: number | null
  risk_rating?: string | null
  hazard_responses?: Record<string, string>
  exposure_responses?: Record<string, string>
  sensitivity_responses?: Record<string, string>
  adaptive_capacity_responses?: Record<string, string>
  /** GeoJSON Point for assessment location: { type: 'Point', coordinates: [lng, lat] } */
  geom?: { type: string; coordinates: [number, number] } | null
  settlement?: { id: number; name: string; code: string; county_id?: number }
  county?: { id: number; name: string }
  assessor?: { id: number; name?: string; username: string; email: string }
}

export interface AssessmentQuestions {
  hazard: { label: string; categories: Array<{ key: string; label: string; questions: Array<{ key: string; label: string; hint?: string; answers: Record<string, number> }> }> }
  exposure: { label: string; categories: Array<{ key: string; label: string; questions: Array<{ key: string; label: string; hint?: string; answers: Record<string, number> }> }> }
  sensitivity: { label: string; categories: Array<{ key: string; label: string; questions: Array<{ key: string; label: string; hint?: string; answers: Record<string, number> }> }> }
  adaptive_capacity: { label: string; categories: Array<{ key: string; label: string; questions: Array<{ key: string; label: string; hint?: string; answers: Record<string, number> }> }> }
}

export const getQuestions = (): Promise<{ code: string; data: AssessmentQuestions; message: string }> => {
  return request.get({
    url: prod + '/api/v1/climate-assessment/questions'
  })
}

export const listAssessments = (params?: { settlement_id?: number; county_id?: number | number[] | string }): Promise<{ code: string; data: ClimateAssessment[]; message: string }> => {
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

export const getAssessmentBySettlement = (settlementId: number): Promise<{ code: string; data: ClimateAssessment; message: string }> => {
  return request.get({
    url: prod + '/api/v1/climate-assessment/by-settlement/' + settlementId
  })
}

export const createAssessment = (data: { settlement_id: number; assessed_at?: string; question_config_version?: number }): Promise<{ code: string; data: ClimateAssessment; existing?: boolean; message: string }> => {
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
