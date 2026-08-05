import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { publicRoutes } from './publicRoutes'
import {
  consumePendingLandingSection,
} from '@/views/Landing/utils/landingScroll'

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: publicRoutes as RouteRecordRaw[],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition

    const section = consumePendingLandingSection()
    if (section && (to.path === '/landing' || to.path === '/')) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const el = document.getElementById(section)
          if (el) {
            resolve({ el, top: 112, behavior: 'smooth' })
          } else {
            // Let BaseLayout retry — don't yank to top
            resolve(false)
          }
        }, 80)
      })
    }

    // Same-route navigations (e.g. in-page section scroll) — don't force top
    if (to.path === from.path) return false

    return { left: 0, top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  if (to.path === '/api-docs') {
    window.location.href = '/api-docs'
    return
  }
  if (to.path === '/documentation') {
    window.open('/#/docs', '_blank')
    next(false)
    return
  }
  if (to.path === '/data-request-form') {
    next({ path: '/data-request', replace: true })
    return
  }
  next()
})

export const setupPublicRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
