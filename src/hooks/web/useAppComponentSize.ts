import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'

/** Use instead of hardcoded size="small" so components follow the global size picker. */
export function useAppComponentSize() {
  const appStore = useAppStore()
  return computed(() => appStore.getCurrentSize)
}
