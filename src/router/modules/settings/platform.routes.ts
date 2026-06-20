import { PLATFORM_SETTINGS } from '@/config/settings/platform.config'
import { settingGroup, settingLeaves } from './buildSettingRoute'

export const platformRoutes: AppRouteRecordRaw = settingGroup({
  path: 'platform',
  name: 'SettingsPlatform',
  title: 'Platform',
  icon: 'material-symbols:dns',
  permissions: ['settings:read', 'system_settings:read'],
  redirect: '/settings/platform/system-settings',
  children: settingLeaves(PLATFORM_SETTINGS),
})
