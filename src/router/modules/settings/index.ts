import { Layout } from '@/utils/routerHelper'
import { platformRoutes } from './platform.routes'
import { analyticsRoutes } from './analytics.routes'
import { commonSettingsRoutes } from './reference-data.routes'
import { programmeRoutes } from './programme.routes'
import { geographyRoutes } from './admin-units.routes'
import { settingsLegacyRedirects } from './legacy-redirects.routes'

export const settingsRoute: AppRouteRecordRaw = {
  path: '/settings',
  component: Layout,
  name: 'Settings',
  redirect: '/settings/platform/system-settings',
  meta: {
    title: 'Settings',
    icon: 'material-symbols:settings',
    alwaysShow: true,
    permissions: [
      'settings:read',
      'dashboard:read',
      'dashboard_card:read',
      'dashboard_section:read',
      'dashboard_section_chart:read',
    ],
  },
  children: [
    platformRoutes,
    analyticsRoutes,
    programmeRoutes,
    commonSettingsRoutes,
    geographyRoutes,
    ...settingsLegacyRedirects,
  ],
}
