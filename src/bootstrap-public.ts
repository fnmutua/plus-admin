import '@/plugins/windi.css'
// Skip svg sprites on public pages (~4.6MB); landing uses Iconify via @iconify/vue.
import { setupI18n } from '@/plugins/vueI18n'
import { setupStore } from '@/store'
import { setupGlobCom } from '@/components'
import { setupElementPlusPublic } from '@/plugins/elementPlus/setupPublic'
import '@/plugins/elementPlus/publicStyles'
import '@/styles/index.less'
import { useAppStoreWithOut } from '@/store/modules/app'
import { applyElementPlusSize } from '@/utils/elementPlusSize'
import '@/plugins/animate.css'
import { setupPublicRouter } from '@/router/public'
import { setupPermission } from '@/directives'
import { createApp } from 'vue'
import App from '@/AppPublic.vue'
import './permission-public'
import { createHead } from '@unhead/vue'
import { restoreAuthSessionFromLocalStorage } from '@/hooks/web/authStorage'
import { watchAndPatchGoogleMapsDeclutter } from '@/utils/googleMapStyles'

const head = createHead()

export async function setupPublicApp() {
  const app = createApp(App)

  await setupI18n(app)

  setupStore(app)
  restoreAuthSessionFromLocalStorage()
  applyElementPlusSize(useAppStoreWithOut().getCurrentSize)
  setupGlobCom(app)
  setupElementPlusPublic(app)
  setupPublicRouter(app)
  setupPermission(app)
  app.use(head)

  watchAndPatchGoogleMapsDeclutter()
  app.mount('#app')
}
