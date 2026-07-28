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

const whiteList = [
  '/api-docs', '/login', '/register', '/logoff', '/privacy', '/status', '/status/:id',
  '/grm', '/incidents', '/landing', '/about', '/contact', '/faqs', '/delete', '/docs',
  '/data-request', '/dr-share', '/dr-clarify'
]

/** Public routes — no login required (anonymous or logged-in). */
const isPublicPath = (path: string): boolean =>
  whiteList.indexOf(path) !== -1 ||
  path.startsWith('/reset') ||
  path.startsWith('/status') ||
  path.startsWith('/incidents/') ||
  path.startsWith('/share/') ||
  path.startsWith('/upload-share/') ||
  path.startsWith('/dr-share/') ||
  path.startsWith('/dr-clarify/')

router.beforeEach(async (to, from, next) => {
  start();
  loadStart();

  if (isPublicPath(to.path)) {
    next();
    return;
  }

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
        try {
          const res = await getDictApi()
          if (res?.data) {
            dictStore.setDictObj(res.data)
            dictStore.setIsSetDict(true)
          }
        } catch {
          dictStore.setIsSetDict(true)
        }
      }

      const roles = userInfo.roles; // Get all roles for the user
      const userPermissions: string[] = Array.isArray(userInfo.permissions)
        ? userInfo.permissions as string[]
        : [];


        const adminRoles = ['root_admin', 'super_admin', 'admin', 'staff', 'monitoring'];
        const nonAdminRoles = ['grm', 'consultant'];

        // Flags to track the button state
        let hasAdminRole = false;
        let hasEditRole = false;

        for (const role of roles) {
          await permissionStore.generateRoutes(role.name, role.user_roles.location_level, userPermissions);

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
          appStore.setAdminButtons(false);  // Non-admins can have edit permissions but not admin
        } else {
          appStore.setAdminButtons(false);
          appStore.setEditButtons(false);  // No permissions, so no buttons
        }

      permissionStore.getAddRouters.forEach((route) => {
        router.addRoute(route as unknown as RouteRecordRaw); // Dynamically add accessible routes
      });

      const redirectPath = from.query.redirect || to.path;
      const redirect = decodeURIComponent(redirectPath as string);
      // Re-navigate by path (not by spreading `to`, which carries `name`) so the
      // updated matcher resolves to the most specific dynamic route just registered
      // above. Spreading `to` would carry e.g. `name: 'CatchAll'` from the wildcard
      // fallback that matched on cold load, sending us back to the 404 view even
      // when the real route now exists.
      const nextData = to.path === redirect
        ? { path: redirect, query: to.query, hash: to.hash, replace: true }
        : { path: redirect };
      permissionStore.setIsAddRouters(true);
      next(nextData);
    }
  } 
  else {
    next(`/login?redirect=${to.path}`);
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
