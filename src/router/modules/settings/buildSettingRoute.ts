import { Layout } from '@/utils/routerHelper'

export interface SettingLeafConfig {
  path: string
  name: string
  title: string
  icon: string
  permissions: string | string[]
  component: () => Promise<unknown>
  hidden?: boolean
}

/** Single settings page (leaf route). */
export function settingLeaf(cfg: SettingLeafConfig): AppRouteRecordRaw {
  return {
    path: cfg.path,
    name: cfg.name,
    component: cfg.component,
    meta: {
      title: cfg.title,
      icon: cfg.icon,
      permissions: cfg.permissions,
      hidden: cfg.hidden ?? false,
    },
  }
}

export interface SettingGroupConfig {
  path: string
  name: string
  title: string
  icon: string
  permissions: string | string[]
  redirect: string
  alwaysShow?: boolean
  children: AppRouteRecordRaw[]
}

/** Nested settings menu group (paths unchanged — still uses Layout wrapper). */
export function settingGroup(cfg: SettingGroupConfig): AppRouteRecordRaw {
  return {
    path: cfg.path,
    component: Layout,
    redirect: cfg.redirect,
    name: cfg.name,
    meta: {
      title: cfg.title,
      icon: cfg.icon,
      permissions: cfg.permissions,
      alwaysShow: cfg.alwaysShow ?? true,
    },
    children: cfg.children,
  }
}

/** Build leaf routes from a declarative config list. */
export function settingLeaves(configs: SettingLeafConfig[]): AppRouteRecordRaw[] {
  return configs.map(settingLeaf)
}

const legacyMeta: RouteMeta = { hidden: true, noTagsView: true, canTo: true }

/** Hidden redirect for backwards-compatible URLs. */
export function settingRedirect(path: string, redirect: string, name: string): AppRouteRecordRaw {
  return { path, name, redirect, meta: legacyMeta }
}

/** Redirect an old settings group and all its children. */
export function settingGroupLegacyRedirects(
  oldSegment: string,
  newBase: string,
  defaultRedirect: string,
): AppRouteRecordRaw[] {
  return [
    settingRedirect(oldSegment, defaultRedirect, `LegacySettings${oldSegment}`),
    {
      path: `${oldSegment}/:subpath(.*)`,
      name: `LegacySettings${oldSegment}Child`,
      redirect: (to) => `${newBase}/${String(to.params.subpath ?? '')}`,
      meta: legacyMeta,
    },
  ]
}
