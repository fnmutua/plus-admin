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

import App from './App.vue'

import './permission'
import VueApexCharts from "vue3-apexcharts";



/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { FontAwesomeLayers, FontAwesomeLayersText } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import {faTimes, faGlassWaterDroplet, faDownload, faCertificate, faRoadCircleCheck, faCircle, faCheck, faRoadBridge, faUserSecret,faHouse, faCity,faPeopleRoof,faPeopleGroup,faMoneyCheckDollar,faDollarSign, faHouseLock, faFilterCircleDollar, faRoad, faHandsHoldingChild, faFileLines, faCalendarDays, faMap, faSackDollar} from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faTimes,faGlassWaterDroplet,faCertificate,faDownload, faRoadCircleCheck, faCircle, faCheck,faRoadBridge, faUserSecret,faCity,faPeopleGroup,faPeopleRoof,faMoneyCheckDollar,faMap,faFilterCircleDollar,faHouseLock, faDollarSign,faHandsHoldingChild,faFileLines,faRoad,faHouse,faSackDollar,faCalendarDays)

import JsonCSV from 'vue-json-csv'

// 创建实例
const setupAll = async () => {
  const app = createApp(App)


  await setupI18n(app)

  setupStore(app)

  setupGlobCom(app)

  setupElementPlus(app)

  setupRouter(app)

  setupPermission(app)

  app.component('font-awesome-icon', FontAwesomeIcon)
  app.component('fa-layers-text', FontAwesomeLayersText)
  app.component('font-awesome-layers', FontAwesomeLayers)
  app.use(VueApexCharts);
  app.use( JsonCSV)

  


  app.mount('#app')
}

setupAll()
