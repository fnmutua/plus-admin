import type { SettingsLeafDefinition, SettingsTabDefinition } from './types'

export type ProgrammeTabDefinition = SettingsTabDefinition

/** Tabs inside the single Programme settings route. */
export const PROGRAMME_TABS: ProgrammeTabDefinition[] = [
  {
    name: 'programmes',
    label: 'Programmes',
    permissions: ['programme:read'],
    component: () => import('@/views/settings/Programme.vue'),
  },
  {
    name: 'components',
    label: 'Components',
    permissions: ['component:read'],
    component: () => import('@/views/settings/Component.vue'),
  },
  {
    name: 'implementation',
    label: 'Implementation',
    permissions: ['programme_implementation:read'],
    component: () => import('@/views/settings/Implementation.vue'),
  },
  {
    name: 'project-types',
    label: 'Project Types',
    permissions: ['programme:read'],
    hidden: true,
    component: () => import('@/views/settings/ProjectCategory.vue'),
  },
]

/** Map legacy URL segments → tab query values. */
export const PROGRAMME_LEGACY_TAB_MAP: Record<string, string> = {
  progs: 'programmes',
  components: 'components',
  impl: 'implementation',
  projcat: 'project-types',
}
