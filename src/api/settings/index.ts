import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export interface ModuleSetting {
  id?: number
  module: string
  enabled: boolean
  description?: string
  config_value?: string | null
  created_by?: number
  updated_by?: number
  createdAt?: string
  updatedAt?: string
}

export interface SettingsResponse {
  code: string
  data: ModuleSetting[]
  message: string
}

export interface SettingResponse {
  code: string
  data: ModuleSetting
  message: string
}

/**
 * Get all module settings
 */
export const getAllSettings = (): Promise<SettingsResponse> => {
  return request.get({
    url: prod + '/api/v1/settings/all'
  })
}

/**
 * Get a specific module setting
 */
export const getSetting = (module: string): Promise<SettingResponse> => {
  return request.post({
    url: prod + '/api/v1/settings/get',
    data: { module }
  })
}

/**
 * Update a module setting
 */
export const updateSetting = (data: {
  id?: number
  module?: string
  enabled?: boolean
  description?: string
}): Promise<SettingResponse> => {
  return request.post({
    url: prod + '/api/v1/settings/update',
    data
  })
}

/**
 * Bulk update multiple settings
 */
export const bulkUpdateSettings = (settings: Array<{
  module: string
  enabled: boolean
  description?: string
  config_value?: string | null
}>): Promise<SettingsResponse> => {
  return request.post({
    url: prod + '/api/v1/settings/bulk-update',
    data: { settings }
  })
}

/**
 * Get system settings (root admin only)
 */
export const getSystemSettings = (): Promise<SettingsResponse> => {
  return request.get({
    url: prod + '/api/v1/settings/system'
  })
}

/**
 * Bulk update system settings (root admin only)
 */
export const bulkUpdateSystemSettings = (settings: Array<{
  module: string
  enabled: boolean
  description?: string
  config_value?: string | null
}>): Promise<SettingsResponse> => {
  return request.post({
    url: prod + '/api/v1/settings/system/bulk-update',
    data: { settings }
  })
}

// Vulnerability weight matrix
export interface VulnerabilityMatrixRow {
  id: number
  attribute_type: string
  attribute_value: string
  sort_order: number
  score_temperature: number
  score_rainfall: number
  score_drought: number
  score_soil_erosion: number
  score_land_slide: number
  score_food_insecurity: number
  score_pollution: number
  score_moisture_content: number
  score_flash_floods: number
  score_flooding: number
}

export const getVulnerabilityMatrix = (): Promise<{ code: string; data: VulnerabilityMatrixRow[]; message: string }> => {
  return request.get({
    url: prod + '/api/v1/settings/vulnerability-matrix'
  })
}

export const bulkUpdateVulnerabilityMatrix = (rows: Partial<VulnerabilityMatrixRow>[]): Promise<{ code: string; data: { updated: number }; message: string }> => {
  return request.post({
    url: prod + '/api/v1/settings/vulnerability-matrix',
    data: { rows }
  })
}

// Vulnerability rating thresholds
export interface VulnerabilityRatingThreshold {
  id: number
  rating: string
  min_score: number
  max_score: number | null
  sort_order: number
}

export const getVulnerabilityRatingThresholds = (): Promise<{ code: string; data: VulnerabilityRatingThreshold[]; message: string }> => {
  return request.get({
    url: prod + '/api/v1/settings/vulnerability-rating-thresholds'
  })
}

export const bulkUpdateVulnerabilityRatingThresholds = (rows: Partial<VulnerabilityRatingThreshold>[]): Promise<{ code: string; data: { updated: number }; message: string }> => {
  return request.post({
    url: prod + '/api/v1/settings/vulnerability-rating-thresholds',
    data: { rows }
  })
}

export const computeVulnerabilityScore = (attrs: {
  climate_region?: string | null
  soil_type?: string | null
  land_cover?: string | null
  altitude_range?: string | null
  proximity_to_river?: string | null
  proximity_to_flood_plain?: string | null
}): Promise<{ code: string; data: { total_score: number | null; rating: string | null }; message: string }> => {
  return request.post({
    url: prod + '/api/v1/settings/vulnerability-compute',
    data: attrs
  })
}

export interface SmsBalanceResponse {
  code: string
  message: string
  data: {
    balance: number
    threshold: number
    low: boolean
    alertEnabled?: boolean
    sendTime?: string
    timezone?: string
    error?: string
    code?: string | null
  }
}

/** Fetch remaining Advanta bulk SMS credits. */
export const getSmsBalance = (): Promise<SmsBalanceResponse> => {
  return request.get({
    url: prod + '/api/v1/settings/sms-balance'
  })
}

