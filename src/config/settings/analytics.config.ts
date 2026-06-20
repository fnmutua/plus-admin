import type { SettingsLeafDefinition } from './types'

export const PAGE_VISITS_SETTING: SettingsLeafDefinition = {
  path: 'page-visits',
  name: 'PageVisits',
  title: 'Page Visits',
  icon: 'mdi:chart-line',
  permissions: ['logs:read'],
  component: () => import('@/views/settings/PageVisits.vue'),
}
