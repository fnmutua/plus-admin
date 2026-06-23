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

import { useAppStoreWithOut } from '@/store/modules/app'
import { applyElementPlusSize } from '@/utils/elementPlusSize'

// 引入动画
import '@/plugins/animate.css'

// 路由
import { setupRouter } from './router'

// 权限
import { setupPermission } from './directives'

import { createApp } from 'vue'

// ECharts + vue-echarts setup
// IMPORTANT: use() must come from 'echarts/core' so vue-echarts (which also
// imports from 'echarts/core') sees the registered renderers/charts/components.
import { use, registerTheme } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { MapChart, BarChart, LineChart, PieChart, GaugeChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent,
  VisualMapComponent,
  GeoComponent,
} from 'echarts/components'

import VueApexCharts from 'vue3-apexcharts'
import VChart, { THEME_KEY } from 'vue-echarts'

import App from './App.vue'
import './permission'



import { createHead } from '@unhead/vue'
const head = createHead()














import romaTheme from './theme.json' // ✅ Ensure path and tsconfig.json support this

// ✅ Register ECharts modules & theme on echarts/core – the same instance vue-echarts uses
use([
  CanvasRenderer,
  MapChart,
  BarChart,
  LineChart,
  PieChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent,
  VisualMapComponent,
  GeoComponent,
])
registerTheme('roma', romaTheme)

// 创建实例
const setupAll = async () => {
  const app = createApp(App)

  await setupI18n(app)

  setupStore(app)
  applyElementPlusSize(useAppStoreWithOut().getCurrentSize)
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

  app.use(head)


  app.mount('#app')
}

setupAll()
