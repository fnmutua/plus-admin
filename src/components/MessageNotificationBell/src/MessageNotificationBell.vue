<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { getMyNotificationUnreadCountApi } from '@/api/notifications'

const { push } = useRouter()
const unreadCount = ref(0)
let pollTimer: ReturnType<typeof setInterval> | null = null

const loadUnreadCount = async () => {
  try {
    const res: any = await getMyNotificationUnreadCountApi()
    unreadCount.value = Number(res?.data?.unreadCount ?? res?.unreadCount ?? 0)
  } catch {
    unreadCount.value = 0
  }
}

const openNotifications = () => {
  push({ path: '/me/notifications' })
}

onMounted(() => {
  loadUnreadCount()
  pollTimer = setInterval(loadUnreadCount, 60000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div
    class="hover-tigger cursor-pointer flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--el-fill-color-light)] transition-colors relative"
    title="My notifications"
    @click="openNotifications"
  >
    <Icon icon="mdi:bell-outline" width="18" color="var(--top-header-text-color)" />
    <span
      v-if="unreadCount > 0"
      class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1"
    >
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </span>
  </div>
</template>
