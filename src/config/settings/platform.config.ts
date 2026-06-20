import type { SettingsLeafDefinition } from './types'

export const PLATFORM_SETTINGS: SettingsLeafDefinition[] = [
  {
    path: 'module-settings',
    name: 'ModuleSettings',
    title: 'SMS Settings',
    icon: 'material-symbols:sms',
    permissions: ['settings:update'],
    component: () => import('@/views/settings/ModuleSettings.vue'),
  },
  {
    path: 'system-settings',
    name: 'SystemSettings',
    title: 'System Settings',
    icon: 'material-symbols:shield',
    permissions: ['system_settings:read'],
    component: () => import('@/views/settings/SystemSettings.vue'),
  },
  {
    path: 'climate-settings',
    name: 'ClimateSettings',
    title: 'Climate Settings',
    icon: 'mdi:earth',
    permissions: ['settings:update'],
    component: () => import('@/views/settings/VulnerabilitySettings.vue'),
  },
  {
    path: 'population-settings',
    name: 'PopulationSettings',
    title: 'Population Settings',
    icon: 'mdi:account-group',
    permissions: ['settings:update'],
    component: () => import('@/views/settings/PopulationSettings.vue'),
  },
]
