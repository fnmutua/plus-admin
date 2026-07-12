/**
 * Single ECharts registration for the whole app.
 * Side-effect import this before vue-echarts or echarts.init anywhere.
 */
import { use } from 'echarts/core'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  BarChart,
  LineChart,
  PieChart,
  MapChart,
  GaugeChart,
  PictorialBarChart,
  RadarChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent,
  VisualMapComponent,
  GeoComponent,
  PolarComponent,
  AriaComponent,
  ParallelComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  MapChart,
  GaugeChart,
  PictorialBarChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent,
  VisualMapComponent,
  GeoComponent,
  PolarComponent,
  AriaComponent,
  ParallelComponent
])

export { use, registerTheme } from 'echarts/core'
export default echarts
