// 引入windi css
import '@/plugins/windi.css'

// 导入全局的svg图标
import '@/plugins/svgIcon'

// 初始化多语言
import { setupI18n } from '@/plugins/vueI18n'

// 引入状态管理
import { setupStore } from '@/store'

// 全局组件
import { setupGlobCom } from '@/components'

// 引入element-plus
import { setupElementPlus } from '@/plugins/elementPlus'

// 引入全局样式
import '@/styles/index.less'

// 引入动画
import '@/plugins/animate.css'

// 路由
import { setupRouter } from './router'

// 权限
import { setupPermission } from './directives'

import { createApp } from 'vue'
import * as echarts from 'echarts'
import { registerTheme } from 'echarts/core'

import VueApexCharts from 'vue3-apexcharts'
import VChart, { THEME_KEY } from 'vue-echarts'

import App from './App.vue'
import './permission'

import romaTheme from './theme.json' // ✅ Ensure path and tsconfig.json support this

// ✅ Register the ECharts theme
//echarts.registerTheme('roma', romaTheme)
registerTheme('roma', romaTheme)

// 创建实例
const setupAll = async () => {
  const app = createApp(App)

  await setupI18n(app)

  setupStore(app)
  setupGlobCom(app)
  setupElementPlus(app)
  setupRouter(app)
  setupPermission(app)

  // ✅ Register vue-echarts component
  app.component('v-chart', VChart)

  // ✅ Provide the theme globally to v-chart
  app.provide(THEME_KEY, 'roma')

  // ✅ Optional: Register ApexCharts
  app.use(VueApexCharts)

  app.mount('#app')
}

setupAll()
