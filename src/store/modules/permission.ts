import { defineStore } from 'pinia'
import { asyncRouterMap, adminRoutes, constantRouterMap,publicRoutes,countyAdminRoutes,staffRoutes, countyUserRoutes} from '@/router'
import { generateRoutesFn1, generateRoutesFn2, flatMultiLevelRoutes } from '@/utils/routerHelper'
import { store } from '../index'
import { cloneDeep } from 'lodash-es'

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  isAddRouters: boolean
  menuTabRouters: AppRouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: [],
    isAddRouters: false,
    menuTabRouters: []
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      return this.routers
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters))
    },
    getIsAddRouters(): boolean {
      return this.isAddRouters
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    }
  },
  actions: {
    generateRoutes(
      type: 'admin' | 'county_admin' |'county_user'| 'staff'|'public' |'super_admin',
      routers?: AppCustomRouteRecordRaw[] | string[]
    ): Promise<unknown> {
      return new Promise<void>((resolve) => {
        let routerMap: AppRouteRecordRaw[] = []
        console.log('Tyoe---->--', type)
        console.log('0001')

        if (type === 'admin' || type === 'super_admin') {
          console.log("generating routes.....admin")
          // 模拟后端过滤菜单
         // routerMap = generateRoutesFn2(routers as AppCustomRouteRecordRaw[])
          routerMap = cloneDeep(adminRoutes)
          console.log('routerMap--',routerMap)
        } else if (type === 'county_admin') {
          console.log("generating routes.....county_admin")
         //routerMap = generateRoutesFn1(cloneDeep(asyncRouterMap), routers as string[])  // felix to edit
         // routerMap = generateRoutesFn2(routers as AppCustomRouteRecordRaw[])
          routerMap = cloneDeep(countyAdminRoutes)
          console.log('routerMap-county_admin-',routerMap)
        }
        else if (type === 'county_user') {
          console.log("generating routes.....county_user")
          routerMap = cloneDeep(countyUserRoutes)
          console.log('routerMap-county_user-',routerMap)
        }
        else if (type === 'staff') {
          console.log("generating routes.....staffRoutes")
          routerMap = cloneDeep(staffRoutes)
          console.log('routerMap-staffRoutes-',routerMap)

        }       
        
        else {
          // 直接读取静态路由表
          //routerMap = cloneDeep(asyncRouterMap)
          console.log('Public Routes......')
          routerMap = cloneDeep(publicRoutes)
        }
        // 动态路由，404一定要放到最后面
        console.log(this.addRouters )
        this.addRouters = routerMap.concat([
          {
            path: '/:path(.*)*',
            redirect: '/404',
            name: '404Page',
            meta: {
              hidden: true,
              breadcrumb: false
            }
          }
        ])
        // 渲染菜单的所有路由
        this.routers = cloneDeep(constantRouterMap).concat(routerMap)
        resolve()
      })
    },
    setIsAddRouters(state: boolean): void {
      this.isAddRouters = state
    },
    setMenuTabRouters(routers: AppRouteRecordRaw[]): void {
      this.menuTabRouters = routers
    }
  }
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}