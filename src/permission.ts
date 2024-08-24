import router from './router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import type { RouteRecordRaw } from 'vue-router'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { useDictStoreWithOut } from '@/store/modules/dict'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { getDictApi } from '@/api/common'

const permissionStore = usePermissionStoreWithOut()

const appStore = useAppStoreWithOut()

const dictStore = useDictStoreWithOut()

const { wsCache } = useCache()

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

const whiteList = ['/login', '/logoff', '/privacy' , '/grm','/landing','/about', '/contact', '/faqs'] // 不重定向白名单

router.beforeEach(async (to, from, next) => {
  start()
  loadStart()
  if (wsCache.get(appStore.getUserInfo)) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      if (permissionStore.getIsAddRouters) {
        next()
        return
      }

      if (!dictStore.getIsSetDict) {
        // 获取所有字典
        const res = await getDictApi()
        if (res) {
          dictStore.setDictObj(res.data)
          dictStore.setIsSetDict(true)
        }
      }
 
      // 开发者可根据实际情况进行修改
      const roleRouters = wsCache.get('roleRouters') || []
      const userInfo = wsCache.get(appStore.getUserInfo)
      console.log('0002')


     


      const roles = userInfo.roles;

      const rolePriorityOrder = [
        'super_admin',
        'admin',
        'county_admin',
        'staff',
        'county_user',
        'national_grm',
        'others',
      ];
      
      let superiorRole = 'others';
      
      for (const role of rolePriorityOrder) {
        if (roles.includes(role)) {
          superiorRole = role;
          break;
        }
      }
      
      switch (superiorRole) {
        case 'super_admin':
          await permissionStore.generateRoutes('super_admin');
          break;
        case 'admin':
          await permissionStore.generateRoutes('admin');
          break;
        case 'county_admin':
          await permissionStore.generateRoutes('county_admin');
          break;
        case 'staff':
          await permissionStore.generateRoutes('staff');
          break;
        case 'county_staff':
          await permissionStore.generateRoutes('county_staff');
          break;
        case 'national_grm':
            await permissionStore.generateRoutes('national_grm');
            break;
  


        default:
          await permissionStore.generateRoutes('public');
          break;
      }
      


      permissionStore.getAddRouters.forEach((route) => {
        router.addRoute(route as unknown as RouteRecordRaw) // 动态添加可访问路由表
      })
      const redirectPath = from.query.redirect || to.path
      const redirect = decodeURIComponent(redirectPath as string)
      const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect }
      permissionStore.setIsAddRouters(true)
      next(nextData)
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {

      console.log("Path--->", to.path)
      next()
    } else if (to.path.startsWith("/reset") ){
      next()  // for reset do not redirect
    }
     
         
    
    else {
      next(`/login?redirect=${to.path}`) // 否则全部重定向到登录页
    }



  }
})

router.afterEach((to) => {
  useTitle(to?.meta?.title as string)
  done() // 结束Progress
  loadDone()
})
