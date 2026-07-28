import type { App } from 'vue'
import { THEME_KEY } from 'vue-echarts'

let chartsReady: Promise<void> | null = null

export function setupCharts(app: App<Element>) {
  if (!chartsReady) {
    chartsReady = (async () => {
      const [{ registerTheme }, { default: VChart }, { default: VueApexCharts }] = await Promise.all([
        import('@/plugins/echarts'),
        import('vue-echarts'),
        import('vue3-apexcharts'),
      ])
      const { default: romaTheme } = await import('@/theme.json')
      registerTheme('roma', romaTheme as any)
      app.component('v-chart', VChart)
      app.provide(THEME_KEY, 'roma')
      app.use(VueApexCharts)
    })()
  }
  return chartsReady
}
