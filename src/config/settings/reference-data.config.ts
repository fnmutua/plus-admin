import type { SettingsTabDefinition } from './types'

export type CommonTabDefinition = SettingsTabDefinition

/** Tabs inside the single Common settings route. */
export const COMMON_TABS: CommonTabDefinition[] = [
  {
    name: 'evaluation-types',
    label: 'Evaluation Types',
    permissions: ['evaluation_type:read'],
    component: () => import('@/views/settings/EvType.vue'),
  },
  {
    name: 'categories',
    label: 'Categories',
    permissions: ['category:read'],
    component: () => import('@/views/settings/Category.vue'),
  },
  {
    name: 'contractors',
    label: 'Contractors',
    permissions: ['contractor:read'],
    component: () => import('@/views/settings/Contractor.vue'),
  },
  {
    name: 'document-categories',
    label: 'Document Categories',
    permissions: ['document_category:read'],
    component: () => import('@/views/settings/DocumentCategory.vue'),
  },
  {
    name: 'document-types',
    label: 'Document Types',
    permissions: ['document_type:read'],
    component: () => import('@/views/settings/DocumentType.vue'),
  },
  {
    name: 'clusters',
    label: 'Clusters',
    permissions: ['settings:read'],
    hidden: true,
    component: () => import('@/views/settings/Cluster.vue'),
  },
  {
    name: 'domains',
    label: 'Domains',
    permissions: ['domain:read'],
    hidden: true,
    component: () => import('@/views/settings/StrategicFocus.vue'),
  },
]

/** Map legacy URL segments → tab query values. */
export const COMMON_LEGACY_TAB_MAP: Record<string, string> = {
  clusters: 'clusters',
  evtype: 'evaluation-types',
  category: 'categories',
  contractor: 'contractors',
  focus: 'domains',
  doccat: 'document-categories',
  doctype: 'document-types',
}
