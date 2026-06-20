import { settingLeaf } from './buildSettingRoute'

export const commonSettingsRoutes: AppRouteRecordRaw = settingLeaf({
  path: 'common',
  name: 'CommonSettings',
  title: 'Common',
  icon: 'mdi:map-legend',
  permissions: [
    'settings:read',
    'evaluation_type:read',
    'category:read',
    'contractor:read',
    'document_category:read',
    'document_type:read',
    'domain:read',
  ],
  component: () => import('@/views/settings/CommonSettingsHub.vue'),
})
