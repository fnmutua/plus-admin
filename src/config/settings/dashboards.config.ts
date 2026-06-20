import type { SettingsLeafDefinition } from './types'

export const DASHBOARD_SETTINGS: SettingsLeafDefinition[] = [
  {
    path: 'dash',
    name: 'DynamicDashboards',
    title: 'Dashboards',
    icon: 'mdi:view-dashboard-outline',
    permissions: ['dashboard:read'],
    component: () => import('@/views/settings/Dashboard.vue'),
  },
  {
    path: 'cards',
    name: 'DashboardCards',
    title: 'Cards',
    icon: 'wpf:statistics',
    permissions: ['dashboard_card:read'],
    component: () => import('@/views/settings/DashboardCard.vue'),
  },
  {
    path: 'sections',
    name: 'DashboardSections',
    title: 'Tabs',
    icon: 'mdi:file-document-edit-outline',
    permissions: ['dashboard_section:read'],
    component: () => import('@/views/settings/DashboardSection.vue'),
  },
  {
    path: 'charts',
    name: 'DashboardSectionCharts',
    title: 'Charts',
    icon: 'material-symbols:bar-chart-4-bars',
    permissions: ['dashboard_section_chart:read'],
    component: () => import('@/views/settings/DashboardChart.vue'),
  },
]
