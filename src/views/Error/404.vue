<script setup lang="ts">
import { Error } from '@/components/Error'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'

const { push, replace } = useRouter()
const permissionStore = usePermissionStore()

const DEFAULT_HOME = '/dashboard/national'

const firstAvailablePath = (): string => {
  const first = permissionStore.addRouters?.[0]
  const path = first?.redirect || first?.path
  if (typeof path === 'string' && path.startsWith('/') && path !== '/:pathMatch(.*)*') {
    return path
  }
  return DEFAULT_HOME
}

const errorClick = () => {
  const target = firstAvailablePath()
  try {
    replace(target)
  } catch (error) {
    console.error('[404] navigation failed, falling back to home', error)
    window.location.hash = `#${DEFAULT_HOME}`
    window.location.reload()
  }
}
</script>

<template>
  <Error @error-click="errorClick" />
</template>
