import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommunicationChannel = 'sms' | 'email' | 'both'
export type RecipientChannel = 'sms' | 'email'
export type RecipientMode = 'roles' | 'users' | 'custom'
export type CommunicationStatus = 'queued' | 'sending' | 'completed' | 'partial' | 'failed'
export type RecipientStatus = 'pending' | 'sent' | 'failed'

export interface RecipientFilter {
  /** Role names (used when recipient_mode === 'roles'). */
  roles?: string[]
  /** Optional county filter — narrows role-based selection to county staff. */
  county_id?: number | null
  /** User IDs (used when recipient_mode === 'users'). */
  user_ids?: number[]
  /** Free-form mix of phone numbers and emails (recipient_mode === 'custom'). */
  addresses?: string[]
}

export interface CommunicationCreatePayload {
  channel: CommunicationChannel
  subject?: string
  body: string
  recipient_mode: RecipientMode
  recipient_filter: RecipientFilter
}

export interface ResolvedRecipient {
  user_id: number | null
  name: string | null
  channel: RecipientChannel
  address: string
}

export interface PreviewResponseResult {
  total: number
  bySms: number
  byEmail: number
  recipients: ResolvedRecipient[]
}

export interface CommunicationRow {
  id: number
  channel: CommunicationChannel
  subject: string | null
  body: string
  recipient_mode: RecipientMode
  recipient_filter: RecipientFilter | null
  total_recipients: number
  sent_count: number
  failed_count: number
  pending_count: number
  status: CommunicationStatus
  sender_id: number | null
  sender?: { id: number; name: string; username: string; email: string | null } | null
  createdAt: string
  updatedAt: string
}

export interface CommunicationRecipientRow {
  id: number
  communication_id: number
  user_id: number | null
  name: string | null
  channel: RecipientChannel
  address: string
  status: RecipientStatus
  provider_code: string | null
  provider_message: string | null
  sent_at: string | null
  createdAt: string
  updatedAt: string
}

export interface ListCommunicationsParams {
  page?: number
  limit?: number
  channel?: CommunicationChannel
  status?: CommunicationStatus
  q?: string
}

export interface ApiResult<T> {
  code: string
  message: string
  results: T
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Roles available for the recipient picker. */
export const getCommunicationRoles = (
  channel?: CommunicationChannel
): Promise<ApiResult<Array<{ id: number; name: string; description: string | null }>>> => {
  return request.get({ url: prod + '/api/v1/communications/meta/roles', params: { channel } })
}

export interface RecipientUser {
  id: number
  name: string
  username: string
  email: string | null
  phone: string | null
}

/** Lightweight user search for the "specific users" mode. */
export const searchRecipientUsers = (
  q: string,
  channel?: CommunicationChannel
): Promise<ApiResult<RecipientUser[]>> => {
  return request.get({ url: prod + '/api/v1/communications/meta/users', params: { q, channel } })
}

/** Resolve a recipient payload without sending — used by the Compose form's preview. */
export const previewRecipients = (
  data: Pick<CommunicationCreatePayload, 'channel' | 'recipient_mode' | 'recipient_filter'>
): Promise<ApiResult<PreviewResponseResult>> => {
  return request.post({ url: prod + '/api/v1/communications/preview', data })
}

/** Create + dispatch a new broadcast (synchronous). */
export const createCommunication = (
  data: CommunicationCreatePayload
): Promise<ApiResult<{ id: number; total: number; sent: number; failed: number; status: CommunicationStatus }>> => {
  return request.post({ url: prod + '/api/v1/communications', data })
}

/** Paginated history. */
export const listCommunications = (
  params: ListCommunicationsParams = {}
): Promise<ApiResult<{ total: number; page: number; limit: number; data: CommunicationRow[] }>> => {
  return request.get({ url: prod + '/api/v1/communications', params })
}

/** Single broadcast + its per-recipient delivery rows. */
export const getCommunication = (
  id: number
): Promise<ApiResult<CommunicationRow & { recipients: CommunicationRecipientRow[] }>> => {
  return request.get({ url: prod + `/api/v1/communications/${id}` })
}

/** Re-attempt delivery for a failed recipient. */
export const retryRecipient = (
  communicationId: number,
  recipientId: number
): Promise<
  ApiResult<{
    recipient: CommunicationRecipientRow
    communication_status: CommunicationStatus
    sent_count: number
    failed_count: number
  }>
> => {
  return request.post({
    url: prod + `/api/v1/communications/${communicationId}/recipients/${recipientId}/retry`,
    data: {}
  })
}
