import type { UserNotification } from '@/api/notifications'

export type NotificationRouteTarget = {
  name: string
  params?: Record<string, string | number>
  query?: Record<string, string | number>
  label: string
}

function authRouteTarget(
  sourceType?: string | null,
  sourceId?: number | null
): NotificationRouteTarget | null {
  switch (sourceType) {
    case 'new_account_registration':
      return { name: 'NewAccounts', label: 'Review new accounts' }
    case 'account_activation':
    case 'account_deactivation':
    case 'user_status_alert':
      return sourceId
        ? { name: 'NewAccounts', query: { userId: sourceId }, label: 'View account' }
        : { name: 'NewAccounts', label: 'View accounts' }
    case 'password_reset':
      return { name: 'userProfile', label: 'View profile' }
    case 'registration_acknowledgement':
      return { name: 'userProfile', label: 'View profile' }
    default:
      return null
  }
}

export function getNotificationRouteTarget(
  notification: Pick<UserNotification, 'source_module' | 'source_type' | 'source_id'>
): NotificationRouteTarget | null {
  const sourceModule = String(notification.source_module || '').toLowerCase()
  const sourceId = notification.source_id

  switch (sourceModule) {
    case 'grievance':
      if (!sourceId) return null
      return {
        name: 'GrievanceDetails',
        params: { id: sourceId },
        label: 'View grievance'
      }

    case 'incident':
      if (!sourceId) return null
      return {
        name: 'IncidentStatus',
        params: { id: sourceId },
        label: 'View incident'
      }

    case 'data_request':
      if (!sourceId) return { name: 'AdminDataRequests', label: 'View data requests' }
      return {
        name: 'AdminDataRequestDetail',
        params: { id: sourceId },
        label: 'View data request'
      }

    case 'communication':
      return {
        name: 'AdminCommunications',
        query: {
          tab: 'history',
          ...(sourceId ? { communicationId: sourceId } : {})
        },
        label: 'View broadcast'
      }

    case 'auth':
      return authRouteTarget(notification.source_type, sourceId)

    case 'feedback':
      return { name: 'Feedback', label: 'View feedback' }

    default:
      return null
  }
}

export function canNavigateNotification(notification: UserNotification): boolean {
  return getNotificationRouteTarget(notification) != null
}
