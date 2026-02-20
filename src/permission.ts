import router from './router';
import { trackPageVisit } from '@/api/register-public';
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

const whiteList = [ '/api-docs', '/login', '/register', '/logoff', '/privacy','/status','/status/:id',  '/grm', '/incidents',  '/landing', '/about', '/contact',  '/faqs','/delete']; // Whitelisted routes

router.beforeEach(async (to, from, next) => {
  start();
  loadStart();

  const userInfo = wsCache.get(appStore.getUserInfo);
  console.log(userInfo)

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

 
        const adminRoles = ['root_admin', 'super_admin', 'admin', 'staff', 'monitoring'];
        const nonAdminRoles = ['grm', 'consultant'];

        // Flags to track the button state
        let hasAdminRole = false;
        let hasEditRole = false;

        for (const role of roles) {
          console.log("getting user roles: ", role);

          await permissionStore.generateRoutes(role.name, role.user_roles.location_level);

          if (adminRoles.includes(role.name)) {
            hasAdminRole = true;
            hasEditRole = true;  // Admin roles typically have edit permissions
          } else if (nonAdminRoles.includes(role.name)) {
            hasEditRole = true;  // Non-admin roles may have edit permissions but not admin
          }
        }

        // After processing all roles, update the button state
        if (hasAdminRole) {
          appStore.setAdminButtons(true);
          appStore.setEditButtons(true);  // Admins get both buttons
        } else if (hasEditRole) {
          appStore.setEditButtons(true);
          appStore.setAdminButtons(false);  // Non-admins can have edit buttons only
        } else {
          appStore.setAdminButtons(false);
          appStore.setEditButtons(false);  // No permissions, so no buttons
        }

        console.log('appStore', appStore);

    

      permissionStore.getAddRouters.forEach((route) => {
        router.addRoute(route as unknown as RouteRecordRaw); // Dynamically add accessible routes
      });

      const redirectPath = from.query.redirect || to.path;
      const redirect = decodeURIComponent(redirectPath as string);
      const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect };
      permissionStore.setIsAddRouters(true);
      next(nextData);
    }
  } 
  else {
    if (whiteList.indexOf(to.path) !== -1) {
      next();
    } else if (to.path.startsWith('/reset')) {

      

      next(); // For reset, do not redirect
    } 
    else if (to.path.startsWith('/status')) {
      next(); // For reset, do not redirect
    }
    else if (to.path.startsWith('/incidents/')) {
      next(); // For public incident details, do not redirect
    }
    else if (to.path.startsWith('/share/')) {
      next(); // For public shared documents, do not redirect
    }
    else {
      next(`/login?redirect=${to.path}`); // Otherwise, redirect to the login page
    }
  }
});

router.afterEach((to) => {
  useTitle(to?.meta?.title as string);
  done(); // End Progress
  loadDone();

  // Track page visit for all routes (fire-and-forget)
  const path = to.path || '/';
  const pageName = (to.meta?.title as string) || path;
  let sessionId = '';
  try {
    sessionId = sessionStorage.getItem('visit_session_id') || '';
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem('visit_session_id', sessionId);
    }
  } catch {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const deviceType = /Mobile|Android|iPhone|iPad/i.test(ua) ? (/iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile') : 'desktop';
  trackPageVisit({
    path,
    page_name: pageName,
    referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    user_agent: ua || undefined,
    device_type: deviceType,
    query_string: to.fullPath?.includes('?') ? to.fullPath.split('?')[1] : undefined,
    session_id: sessionId
  });
});
