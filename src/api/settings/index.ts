import request from '@/config/axios'

const prod = import.meta.env.VITE_APP_HOST

export interface ModuleSetting {
  id?: number
  module: string
  enabled: boolean
  description?: string
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
}>): Promise<SettingsResponse> => {
  return request.post({
    url: prod + '/api/v1/settings/bulk-update',
    data: { settings }
  })
}

