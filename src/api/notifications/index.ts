import request from '@/config/axios'

export type UserNotification = {
  id: number
  user_id: number
  channel: 'sms' | 'email'
  subject?: string | null
  body: string
  source_module: string
  source_type?: string | null
  source_id?: number | null
  source_label?: string
  status: 'pending' | 'sent' | 'failed'
  provider_code?: string | null
  provider_message?: string | null
  address?: string | null
  sent_at?: string | null
  read_at?: string | null
  is_read?: boolean
  createdAt?: string
  updatedAt?: string
}

export type NotificationListParams = {
  page?: number
  limit?: number
  channel?: 'sms' | 'email' | ''
  status?: 'pending' | 'sent' | 'failed' | ''
  source_module?: string
  q?: string
}

export const getMyNotificationsApi = (params: NotificationListParams = {}) => {
  return request.get({
    url: '/api/v1/notifications/me',
    params
  })
}

export const getMyNotificationUnreadCountApi = () => {
  return request.get({
    url: '/api/v1/notifications/me/unread-count'
  })
}

export const getMyNotificationByIdApi = (id: number) => {
  return request.get({
    url: `/api/v1/notifications/me/${id}`
  })
}

export const markNotificationReadApi = (id: number) => {
  return request.post({
    url: `/api/v1/notifications/me/${id}/read`
  })
}

export const markAllNotificationsReadApi = () => {
  return request.post({
    url: '/api/v1/notifications/me/read-all'
  })
}
