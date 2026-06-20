import { GEOGRAPHY_SETTINGS } from '@/config/settings/geography.config'
import { settingGroup, settingLeaves } from './buildSettingRoute'

export const geographyRoutes: AppRouteRecordRaw = settingGroup({
  path: 'geography',
  name: 'GeographySettings',
  title: 'Geography',
  icon: 'mdi:map-marker-multiple',
  permissions: ['county:read'],
  redirect: '/settings/geography/counties',
  children: settingLeaves(GEOGRAPHY_SETTINGS),
})
