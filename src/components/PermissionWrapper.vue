<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import { intersection } from 'lodash-es'

const props = defineProps<{
  permissions: string | string[]
}>()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const slots = useSlots()

const all_permission = ['*.*.*']

const userPermissions = computed(() => {
  const info = wsCache.get(appStore.getUserInfo)
  console.log('userPermissions',info)

  
  return info && info.permissions ? info.permissions : []
})

const hasPermission = computed(() => {
  if (!props.permissions) return false
  if (Array.isArray(props.permissions)) {
    if (userPermissions.value[0] === all_permission[0]) return true
    return intersection(props.permissions, userPermissions.value).length > 0
  } else {
    if (userPermissions.value[0] === all_permission[0]) return true
    return userPermissions.value.includes(props.permissions)
  }
})
</script>

<template>
  <slot v-if="hasPermission" ></slot>
</template> 