<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import {
  notificationUnreadCount,
  refreshNotificationUnreadCount
} from '@/hooks/web/useNotificationUnread'

const { push } = useRouter()
const route = useRoute()
let pollTimer: ReturnType<typeof setInterval> | null = null

const openNotifications = () => {
  push({ path: '/me/notifications' })
}

onMounted(() => {
  void refreshNotificationUnreadCount()
  pollTimer = setInterval(() => {
    void refreshNotificationUnreadCount()
  }, 60000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// Refresh when leaving the notifications page (e.g. after reads elsewhere).
watch(
  () => route.path,
  (path, prev) => {
    if (prev?.includes('/me/notifications') && !path.includes('/me/notifications')) {
      void refreshNotificationUnreadCount()
    }
  }
)
</script>

<template>
  <div
    class="hover-tigger cursor-pointer flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--el-fill-color-light)] transition-colors relative"
    title="My notifications"
    @click="openNotifications"
  >
    <Icon icon="mdi:bell-outline" width="18" color="var(--top-header-text-color)" />
    <span
      v-if="notificationUnreadCount > 0"
      class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1"
    >
      {{ notificationUnreadCount > 99 ? '99+' : notificationUnreadCount }}
    </span>
  </div>
</template>
