import type { RouteMeta } from 'vue-router'
import { ref, unref } from 'vue'
import { findPath } from '@/utils/tree'

type OnlyOneChildType = AppRouteRecordRaw & { noShowingChildren?: boolean }

interface HasOneShowingChild {
  oneShowingChild?: boolean
  onlyOneChild?: OnlyOneChildType
}

function resolveMenuPath(parentPath: string, routePath: string) {
  if (!routePath) return parentPath
  if (routePath.startsWith('/')) return routePath
  const base = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath
  return `${base}/${routePath}`.replace(/\/+/g, '/')
}

export const getAllParentPath = <T = Recordable>(treeData: T[], path: string) => {
  const menuList = findPath(treeData, (n) => n.path === path) as AppRouteRecordRaw[]
  return (menuList || []).map((item) => item.path)
}

/** Submenus that should stay collapsed unless the active page is inside them. */
export const getMenuOpenPaths = (
  routers: AppRouteRecordRaw[] = [],
  activePath: string,
  parentPath = '/',
): string[] => {
  const opened: string[] = []

  for (const route of routers) {
    const meta = (route.meta ?? {}) as RouteMeta
    if (meta.hidden) continue

    const fullPath = resolveMenuPath(parentPath, route.path)
    const visibleChildren = (route.children ?? []).filter((child) => !child.meta?.hidden)
    if (!visibleChildren.length) continue

    const childOpens = getMenuOpenPaths(visibleChildren, activePath, fullPath)
    const activeUnder =
      activePath === fullPath ||
      activePath.startsWith(`${fullPath}/`) ||
      childOpens.length > 0

    if (!activeUnder) continue

    const keepParentOpen =
      !meta.menuCollapse || activePath.startsWith(`${fullPath}/`) || activePath === fullPath

    if (keepParentOpen) {
      opened.push(fullPath)
    }
    opened.push(...childOpens)
  }

  return opened
}

export const hasOneShowingChild = (
  children: AppRouteRecordRaw[] = [],
  parent: AppRouteRecordRaw
): HasOneShowingChild => {
  const onlyOneChild = ref<OnlyOneChildType>()

  const showingChildren = children.filter((v) => {
    const meta = (v.meta ?? {}) as RouteMeta
    if (meta.hidden) {
      return false
    } else {
      // Temp set(will be used if only has one showing child)
      onlyOneChild.value = v
      return true
    }
  })

  // When there is only one child router, the child router is displayed by default
  if (showingChildren.length === 1) {
    return {
      oneShowingChild: true,
      onlyOneChild: unref(onlyOneChild)
    }
  }

  // Show parent if there are no child router to display
  if (!showingChildren.length) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
    return {
      oneShowingChild: true,
      onlyOneChild: unref(onlyOneChild)
    }
  }

  return {
    oneShowingChild: false,
    onlyOneChild: unref(onlyOneChild)
  }
}
