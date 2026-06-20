import type { SettingLeafConfig } from '@/router/modules/settings/buildSettingRoute'

export type SettingsLeafDefinition = SettingLeafConfig

export type SettingsTabDefinition = {
  name: string
  label: string
  permissions: string | string[]
  hidden?: boolean
  component: SettingsLeafDefinition['component']
}
