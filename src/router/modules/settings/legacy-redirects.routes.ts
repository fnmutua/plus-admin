import {
  settingGroupLegacyRedirects,
  settingRedirect,
} from './buildSettingRoute'
import { PROGRAMME_LEGACY_TAB_MAP } from '@/config/settings/programme.config'
import { COMMON_LEGACY_TAB_MAP } from '@/config/settings/reference-data.config'

const legacyMeta = { hidden: true, noTagsView: true, canTo: true } as const

function tabbedRedirect(path: string, name: string, basePath: string, tab: string): AppRouteRecordRaw {
  return {
    path,
    name,
    redirect: { path: basePath, query: { tab } },
    meta: legacyMeta,
  }
}

/** Old /settings/* paths → new grouped structure (hidden from menu). */
export const settingsLegacyRedirects: AppRouteRecordRaw[] = [
  // Phase 1 flat platform routes
  settingRedirect('module-settings', '/settings/platform/module-settings', 'LegacyModuleSettings'),
  settingRedirect('system-settings', '/settings/platform/system-settings', 'LegacySystemSettings'),
  settingRedirect('climate-settings', '/settings/platform/climate-settings', 'LegacyClimateSettings'),
  settingRedirect('population-settings', '/settings/platform/population-settings', 'LegacyPopulationSettings'),
  settingRedirect('data-cleanup', '/settings/platform/data-cleanup', 'LegacyDataCleanupSettings'),
  settingRedirect('page-visits', '/settings/analytics/page-visits', 'LegacyPageVisits'),

  // Geography legacy group
  settingRedirect('adminunits', '/settings/geography/counties', 'LegacyAdminUnits'),
  ...settingGroupLegacyRedirects('adminunits', '/settings/geography', '/settings/geography/counties'),

  // Programme legacy
  settingRedirect('prog', '/settings/programme', 'LegacySettingsprog'),
  tabbedRedirect('programme/progs', 'LegacyProgrammeProgs', '/settings/programme', 'programmes'),
  tabbedRedirect('programme/components', 'LegacyProgrammeComponents', '/settings/programme', 'components'),
  tabbedRedirect('programme/impl', 'LegacyProgrammeImpl', '/settings/programme', 'implementation'),
  tabbedRedirect('programme/projcat', 'LegacyProgrammeProjcat', '/settings/programme', 'project-types'),
  {
    path: 'prog/:subpath(.*)',
    name: 'LegacySettingsprogChild',
    redirect: (to) => {
      const segment = String(to.params.subpath ?? '')
      const tab = PROGRAMME_LEGACY_TAB_MAP[segment] ?? 'programmes'
      return { path: '/settings/programme', query: { tab } }
    },
    meta: legacyMeta,
  },

  // Common — was reference/* and common/* child routes
  settingRedirect('reference', '/settings/common', 'LegacyReference'),
  tabbedRedirect('reference/evtype', 'LegacyReferenceEvtype', '/settings/common', 'evaluation-types'),
  tabbedRedirect('reference/category', 'LegacyReferenceCategory', '/settings/common', 'categories'),
  tabbedRedirect('reference/contractor', 'LegacyReferenceContractor', '/settings/common', 'contractors'),
  tabbedRedirect('reference/focus', 'LegacyReferenceFocus', '/settings/common', 'domains'),
  tabbedRedirect('reference/doccat', 'LegacyReferenceDoccat', '/settings/common', 'document-categories'),
  tabbedRedirect('reference/doctype', 'LegacyReferenceDoctype', '/settings/common', 'document-types'),
  tabbedRedirect('reference/clusters', 'LegacyReferenceClusters', '/settings/common', 'clusters'),
  {
    path: 'reference/:subpath(.*)',
    name: 'LegacyReferenceChild',
    redirect: (to) => {
      const segment = String(to.params.subpath ?? '')
      const tab = COMMON_LEGACY_TAB_MAP[segment] ?? 'evaluation-types'
      return { path: '/settings/common', query: { tab } }
    },
    meta: legacyMeta,
  },
  tabbedRedirect('common/evtype', 'LegacyCommonEvtype', '/settings/common', 'evaluation-types'),
  tabbedRedirect('common/category', 'LegacyCommonCategory', '/settings/common', 'categories'),
  tabbedRedirect('common/contractor', 'LegacyCommonContractor', '/settings/common', 'contractors'),
  tabbedRedirect('common/focus', 'LegacyCommonFocus', '/settings/common', 'domains'),
  tabbedRedirect('common/doccat', 'LegacyCommonDoccat', '/settings/common', 'document-categories'),
  tabbedRedirect('common/doctype', 'LegacyCommonDoctype', '/settings/common', 'document-types'),
  tabbedRedirect('common/clusters', 'LegacyCommonClusters', '/settings/common', 'clusters'),

  // Dashboards lived at /settings/dashboards/* — now under analytics
  settingRedirect('dashboards', '/settings/analytics/dashboards/dash', 'LegacyDashboardSettings'),
  {
    path: 'dashboards/:subpath(.*)',
    name: 'LegacyDashboardSettingsChild',
    redirect: (to) => `/settings/analytics/dashboards/${String(to.params.subpath ?? '')}`,
    meta: legacyMeta,
  },
]
