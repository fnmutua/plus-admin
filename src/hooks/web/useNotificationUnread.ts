import { ref } from 'vue'
import { getMyNotificationUnreadCountApi } from '@/api/notifications'

/** Shared unread count for the header bell and notifications page. */
export const notificationUnreadCount = ref(0)

let refreshPromise: Promise<void> | null = null

export async function refreshNotificationUnreadCount() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res: any = await getMyNotificationUnreadCountApi()
      notificationUnreadCount.value = Number(res?.data?.unreadCount ?? res?.unreadCount ?? 0)
    } catch {
      notificationUnreadCount.value = 0
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export function decreaseNotificationUnreadCount(by = 1) {
  notificationUnreadCount.value = Math.max(0, notificationUnreadCount.value - by)
}

export function clearNotificationUnreadCount() {
  notificationUnreadCount.value = 0
}
