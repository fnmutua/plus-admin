import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { Component } from 'vue'

export const elementPlusIconComponents = ElementPlusIconsVue as Record<string, Component>

export const elementPlusIconNames = Object.keys(elementPlusIconComponents).sort()

export const formatIconLabel = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')

export const iconMatchesQuery = (name: string, query: string) => {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return true

  const label = formatIconLabel(name).toLowerCase()
  const raw = name.toLowerCase()
  const haystack = `${raw} ${label}`

  return haystack.includes(trimmed)
}

export const filterElementPlusIconNames = (query = '') => {
  if (!query.trim()) return [...elementPlusIconNames]
  return elementPlusIconNames.filter((name) => iconMatchesQuery(name, query))
}

export const isElementPlusIconName = (name?: string | null): name is string => {
  if (!name || name.includes(':')) return false
  return Boolean(resolveElementPlusIcon(name))
}

export const resolveElementPlusIcon = (name?: string | null): Component | null => {
  if (!name || name.includes(':')) return null
  if (name in elementPlusIconComponents) return elementPlusIconComponents[name]

  const match = elementPlusIconNames.find(
    (iconName) => iconName.toLowerCase() === name.toLowerCase()
  )
  return match ? elementPlusIconComponents[match] : null
}
