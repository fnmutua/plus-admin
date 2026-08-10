import request from '@/config/axios'
import axios from 'axios'
import { apiOrigin as prod } from '@/config/apiBase'
import { uploadFilesBatch } from '@/api/settlements'

export const getCommunityIssueMetadata = (): Promise<IResponse> => {
  return request.get({ url: prod + '/api/v1/community/metadata' })
}

export const listCommunityIssues = (data: Record<string, unknown>): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/community/issues/list', data })
}

export const getCommunityIssue = (data: { id?: number; code?: string }): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/community/issues/one', data })
}

export const createCommunityIssue = (data: Record<string, unknown>): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/community/issues/create', data })
}

export const listCommunityIssueDocuments = (issueId: number): Promise<IResponse> => {
  return request.post({
    url: prod + '/api/v1/data/column/paginated',
    data: {
      model: 'document',
      page: 1,
      limit: 20,
      curUser: 1,
      filters: ['community_issue_id'],
      filterValues: [[issueId]],
    },
  })
}

export const uploadCommunityIssuePhotos = async (
  issueId: number,
  files: Array<{ name: string; raw: File }>
): Promise<IResponse> => {
  const formData = new FormData()

  for (const file of files) {
    formData.append('files', file.raw)
    formData.append('format', file.name.split('.').pop() || 'jpg')
    formData.append('category', 'Photo')
    formData.append('field_id', 'community_issue_id')
    formData.append('community_issue_id', String(issueId))
    formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2))
    formData.append('code', crypto.randomUUID())
  }

  return uploadFilesBatch(formData as any)
}

export const updateCommunityIssueStatus = (data: {
  id?: number
  code?: string
  status: string
  resolution_note?: string
  isApproved?: string
}): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/community/issues/status', data })
}

export const updateCommunityIssue = (data: Record<string, unknown>): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/community/issues/update', data })
}

export const deleteCommunityIssue = (data: { id?: number; code?: string }): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/community/issues/delete', data })
}

export const getPublicCommunityIssue = (data: {
  id?: number
  code?: string
  phone_number?: string
}): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/community/issues/public', data, silent: true })
}

export const getPublicCommunityIssueMetadata = (): Promise<{
  code?: string
  issueTypes?: Array<{ value: string; label: string }>
  severities?: Array<{ value: string; label: string }>
}> => {
  return axios
    .get(`${prod}/api/v1/community/public/metadata`, {
      headers: { 'Content-Type': 'application/json' },
    })
    .then((res) => res.data)
}

export const createPublicCommunityIssue = (data: Record<string, unknown>): Promise<{
  code?: string
  data?: { id: number; code: string }
  message?: string
}> => {
  return axios
    .post(`${prod}/api/v1/community/issues/public/create`, data, {
      headers: { 'Content-Type': 'application/json' },
    })
    .then((res) => res.data)
}
