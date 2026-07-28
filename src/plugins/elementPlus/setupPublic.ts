import type { App } from 'vue'
import { ElLoading, ElScrollbar } from 'element-plus'

/** Minimal global Element Plus setup for public pages (no full library CSS). */
export const setupElementPlusPublic = (app: App<Element>) => {
  app.use(ElLoading)
  app.component(ElScrollbar.name, ElScrollbar)
}
