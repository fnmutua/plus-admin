import { computed } from 'vue'
import { useAppStoreWithOut } from '@/store/modules/app'

/** Element Plus–driven responsive helpers for facility detail pages. */
export function useFacilityDetailsMobile() {
  const appStore = useAppStoreWithOut()
  const isMobile = computed(() => appStore.getMobile)

  const descriptionColumn = computed(() => (isMobile.value ? 1 : 2))
  const descriptionDirection = computed(() => (isMobile.value ? 'vertical' : 'horizontal'))

  const pageStyle = computed(() => ({
    padding: isMobile.value ? '8px' : '16px',
    boxSizing: 'border-box',
  }))

  const mapContainerStyle = computed(() => ({
    height: isMobile.value ? 'min(50vh, 360px)' : '520px',
    minHeight: isMobile.value ? '260px' : undefined,
    width: '100%',
    borderRadius: isMobile.value ? '4px' : '6px',
    overflow: 'hidden',
  }))

  const cardBodyStyle = computed(() => ({
    padding: isMobile.value ? '0 8px 12px' : undefined,
  }))

  return {
    isMobile,
    descriptionColumn,
    descriptionDirection,
    pageStyle,
    mapContainerStyle,
    cardBodyStyle,
  }
}
