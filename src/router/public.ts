import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { publicRoutes } from './publicRoutes'

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: publicRoutes as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 }),
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
