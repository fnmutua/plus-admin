import { PAGE_VISITS_SETTING } from '@/config/settings/analytics.config'
import { DASHBOARD_SETTINGS } from '@/config/settings/dashboards.config'
import { settingGroup, settingLeaf, settingLeaves } from './buildSettingRoute'

const dashboardSubgroup = settingGroup({
  path: 'dashboards',
  name: 'DashboardSettings',
  title: 'Dashboard',
  icon: 'mdi:view-dashboard-edit-outline',
  permissions: [
    'dashboard:read',
    'dashboard_card:read',
    'dashboard_section:read',
    'dashboard_section_chart:read',
  ],
  redirect: '/settings/analytics/dashboards/dash',
  children: settingLeaves(DASHBOARD_SETTINGS),
})

export const analyticsRoutes: AppRouteRecordRaw = settingGroup({
  path: 'analytics',
  name: 'SettingsAnalytics',
  title: 'Analytics',
  icon: 'mdi:chart-box-outline',
  permissions: [
    'logs:read',
    'dashboard:read',
    'dashboard_card:read',
    'dashboard_section:read',
    'dashboard_section_chart:read',
  ],
  redirect: '/settings/analytics/dashboards/dash',
  children: [
    settingLeaf(PAGE_VISITS_SETTING),
    dashboardSubgroup,
  ],
})
