import type { AdjustableColumnSetting } from '@/composables/useAdjustableTableColumns'

export const programmeTableColumnDefaults = (): AdjustableColumnSetting[] => [
  { key: 'title', label: 'Title', width: 220, minWidth: 160, visible: true, hideable: true },
  { key: 'acronym', label: 'Acronym', width: 120, minWidth: 90, visible: true, hideable: true },
  { key: 'icon', label: 'Icon', width: 140, minWidth: 110, visible: true, hideable: true },
]

export const componentTableColumnDefaults = (): AdjustableColumnSetting[] => [
  { key: 'path', label: 'Path', width: 260, minWidth: 140, visible: true, hideable: false },
  { key: 'title', label: 'Component', width: 150, minWidth: 110, visible: true, hideable: false },
  { key: 'acronym', label: 'Acronym', width: 96, minWidth: 72, visible: true, hideable: true },
]

export const implementationTableColumnDefaults = (): AdjustableColumnSetting[] => [
  { key: 'title', label: 'Title', width: 200, minWidth: 140, visible: true, hideable: false },
  { key: 'acronym', label: 'Acronym', width: 120, minWidth: 90, visible: true, hideable: true },
  { key: 'description', label: 'Description', width: 240, minWidth: 160, visible: true, hideable: true },
]
