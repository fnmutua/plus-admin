import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { nextTick } from 'vue'
import { publicRoutes } from './publicRoutes'
import {
  consumePendingLandingSection,
  scrollLandingPageToTop,
  shouldSuppressLandingTopScroll,
} from '@/views/Landing/utils/landingScroll'

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: publicRoutes as RouteRecordRaw[],
  scrollBehavior(to, from, savedPosition) {
    // In-page navigation (side-nav section links) — leave scroll alone
    if (to.path === from.path) return false

    const section = consumePendingLandingSection()
    if (section && (to.path === '/landing' || to.path === '/')) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const el = document.getElementById(section)
          if (el) {
            resolve({ el, top: 112, behavior: 'smooth' })
          } else {
            resolve(false)
          }
        }, 80)
      })
    }

    if (savedPosition) return savedPosition

    // New route (footer / policy / cross-page links) → always top
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        scrollLandingPageToTop('auto')
        resolve({ left: 0, top: 0 })
      })
    })
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

router.afterEach((to, from) => {
  if (to.path === from.path) return
  // Landing in-page section jumps set this flag
  if (shouldSuppressLandingTopScroll()) return

  nextTick(() => {
    scrollLandingPageToTop('auto')
    setTimeout(() => scrollLandingPageToTop('auto'), 0)
    setTimeout(() => scrollLandingPageToTop('auto'), 80)
  })
})

export const setupPublicRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
