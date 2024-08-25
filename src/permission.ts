import router from './router';
import { useAppStoreWithOut } from '@/store/modules/app';
import { useCache } from '@/hooks/web/useCache';
import type { RouteRecordRaw } from 'vue-router';
import { useTitle } from '@/hooks/web/useTitle';
import { useNProgress } from '@/hooks/web/useNProgress';
import { usePermissionStoreWithOut } from '@/store/modules/permission';
import { useDictStoreWithOut } from '@/store/modules/dict';
import { usePageLoading } from '@/hooks/web/usePageLoading';
import { getDictApi } from '@/api/common';

const permissionStore = usePermissionStoreWithOut();
const appStore = useAppStoreWithOut();
const dictStore = useDictStoreWithOut();
const { wsCache } = useCache();
const { start, done } = useNProgress();
const { loadStart, loadDone } = usePageLoading();

const whiteList = ['/login', '/logoff', '/privacy', '/grm', '/landing', '/about', '/contact', '/faqs']; // Whitelisted routes

router.beforeEach(async (to, from, next) => {
  start();
  loadStart();

  const userInfo = wsCache.get(appStore.getUserInfo);

  if (userInfo) {
    if (to.path === '/login') {
      next({ path: '/' });
    } else {
      if (permissionStore.getIsAddRouters) {
        next();
        return;
      }

      if (!dictStore.getIsSetDict) {
        // Fetch all dictionaries
        const res = await getDictApi();
        if (res) {
          dictStore.setDictObj(res.data);
          dictStore.setIsSetDict(true);
        }
      }

      const roles = userInfo.roles; // Get all roles for the user

      // Loop through each role and its location_level, and generate routes
      for (const role of roles) {
        console.log("gettinguser roles: ",role)
        await permissionStore.generateRoutes(role.name, role.user_roles.location_level);

        if(role.name=='super_admin' ||role.name=='admin' || role.name=='staff' || role.name=='monitoring' ) {

          appStore.setAdminButtons(true);
        }
        else if (role.name=='grm' ||role.name=='consultant'  ){
          appStore.setEditButtons(true);
          appStore.setAdminButtons(false);

        }
        else {
          appStore.setAdminButtons(false);
          appStore.setEditButtons(false);

        }
        
      }

      permissionStore.getAddRouters.forEach((route) => {
        router.addRoute(route as unknown as RouteRecordRaw); // Dynamically add accessible routes
      });

      const redirectPath = from.query.redirect || to.path;
      const redirect = decodeURIComponent(redirectPath as string);
      const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect };
      permissionStore.setIsAddRouters(true);
      next(nextData);
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next();
    } else if (to.path.startsWith('/reset')) {
      next(); // For reset, do not redirect
    } else {
      next(`/login?redirect=${to.path}`); // Otherwise, redirect to the login page
    }
  }
});

router.afterEach((to) => {
  useTitle(to?.meta?.title as string);
  done(); // End Progress
  loadDone();
});
