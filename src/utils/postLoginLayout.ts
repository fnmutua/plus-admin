import { useAppStoreWithOut } from '@/store/modules/app'

/** Reset layout prefs after a successful login. */
export function applyDefaultPostLoginLayout() {
  useAppStoreWithOut().setCollapse(true)
}
