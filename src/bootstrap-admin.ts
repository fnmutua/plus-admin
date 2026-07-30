import '@/plugins/windi.css'
import '@/plugins/svgIcon'
import { setupI18n } from '@/plugins/vueI18n'
import { setupStore } from '@/store'
import { setupGlobCom } from '@/components'
import { setupElementPlus } from '@/plugins/elementPlus'
import { setupCharts } from '@/plugins/setupCharts'
import 'element-plus/dist/index.css'
import '@/styles/index.less'
import { useAppStoreWithOut } from '@/store/modules/app'
import { applyElementPlusSize } from '@/utils/elementPlusSize'
import '@/plugins/animate.css'
import { setupRouter } from './router'
import { setupPermission } from '@/directives'
import { createApp } from 'vue'
import App from './App.vue'
import './permission'
import { createHead } from '@unhead/vue'
import { restoreAuthSessionFromLocalStorage } from '@/hooks/web/authStorage'

const head = createHead()

export async function setupAdminApp() {
  const app = createApp(App)

  await setupI18n(app)

  setupStore(app)
  restoreAuthSessionFromLocalStorage()
  applyElementPlusSize(useAppStoreWithOut().getCurrentSize)
  setupGlobCom(app)
  setupElementPlus(app)
  await setupCharts(app)
  setupRouter(app)
  setupPermission(app)
  app.use(head)

  app.mount('#app')
}
