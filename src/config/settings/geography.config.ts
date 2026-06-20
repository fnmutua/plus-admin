import type { SettingsLeafDefinition } from './types'

export const GEOGRAPHY_SETTINGS: SettingsLeafDefinition[] = [
  {
    path: 'counties',
    name: 'Counties',
    title: 'Counties',
    icon: 'mdi:map-marker',
    permissions: ['county:read'],
    component: () => import('@/views/settings/adminunits/County.vue'),
  },
  {
    path: 'subcounties',
    name: 'Subcounties',
    title: 'Subcounties',
    icon: 'mdi:map-marker-outline',
    permissions: ['subcounty:read'],
    component: () => import('@/views/settings/adminunits/Subcounty.vue'),
  },
  {
    path: 'wards',
    name: 'Wards',
    title: 'Wards',
    icon: 'mdi:map-marker-radius',
    permissions: ['ward:read'],
    component: () => import('@/views/settings/adminunits/Ward.vue'),
  },
  {
    path: 'locator',
    name: 'AdminUnitLocator',
    title: 'Map Locator',
    icon: 'mdi:map-search',
    permissions: ['county:read'],
    component: () => import('@/views/settings/adminunits/AdminUnitLocator.vue'),
  },
]
