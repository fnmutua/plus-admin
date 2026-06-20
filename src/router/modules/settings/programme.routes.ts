import { settingLeaf } from './buildSettingRoute'

export const programmeRoutes: AppRouteRecordRaw = settingLeaf({
  path: 'programme',
  name: 'ProgrammeSettings',
  title: 'Programme',
  icon: 'mdi:clipboard-flow-outline',
  permissions: ['programme:read', 'component:read', 'programme_implementation:read'],
  component: () => import('@/views/settings/ProgrammeSettingsHub.vue'),
})
