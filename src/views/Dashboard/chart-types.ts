import { EChartsOption } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'
import 'echarts/lib/component/toolbox'
import { useAppStore } from '@/store/modules/app'

// Import the 100-color palette (assumed to be in src/charts/colorPalette.ts)
import customColorPalette from './colors'

const { t } = useI18n()

/** Read dark mode when options are consumed — never snapshot at module load. */
function getAppDark(): boolean {
  return useAppStore().getIsDark
}

function apexTitleColor(): string {
  return getAppDark() ? '#f1f5f9' : '#111827'
}

function apexSubtitleColor(): string {
  return getAppDark() ? '#9ca3af' : '#5c646d'
}

function apexLegendLabelColor(): string {
  return getAppDark() ? '#cbd5e1' : '#374151'
}

/** Grid lines & axis rule/tick strokes for Apex bar charts */
function apexGridBorderColor(): string {
  return getAppDark() ? 'rgba(148, 163, 184, 0.35)' : '#e5e7eb'
}

function echartsTitleColor(): string {
  return getAppDark() ? '#e2e8f0' : '#303133'
}

function echartsSubtextColor(): string {
  return getAppDark() ? '#94a3b8' : '#606266'
}

function echartsAxisLineColor(): string {
  return getAppDark() ? 'rgba(148, 163, 184, 0.45)' : '#dcdfe6'
}

function echartsSplitLineColor(): string {
  return getAppDark() ? 'rgba(75, 85, 99, 0.35)' : '#ebeef5'
}

function echartsMapRegionBorder(): string {
  return getAppDark() ? 'rgba(148, 163, 184, 0.55)' : '#ccc'
}

function echartsTooltipBg(): string {
  return getAppDark() ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'
}

function echartsTooltipBorder(): string {
  return getAppDark() ? 'rgba(148, 163, 184, 0.35)' : '#e4e7ed'
}

const colorPalette = ['#ff007f', '#0000ff']  // Male-Female, retained for barMaleFemaleOptions
const maleIcon = 'path://m 146.41936,238.8034 c -5.21101,-1.43402 -7.51545,-6.79358 -6.6619,-11.76943 -0.0588,-45.10952 -0.11757,-90.21905 -0.17635,-135.328563 -5.3022,-1.61412 -3.06375,4.34199 -3.52464,7.58816 -0.0576,14.697923 -0.11511,29.395843 -0.17266,44.093773 -1.72718,6.61806 -12.15586,7.45944 -14.19605,0.88682 -1.42909,-4.98857 -0.22146,-10.60033 -0.62062,-15.83232 0.10773,-15.18837 -0.21551,-30.437173 0.16059,-45.587893 1.91842,-11.228608 12.80383,-20.22421 24.26927,-18.689786 10.60777,1.558898 0.0755,-3.65768 -0.79236,-8.596161 -4.23852,-8.688715 0.80002,-20.073014 9.72708,-23.421847 8.82591,-4.162774 20.30103,1.001172 23.52581,10.108188 2.28945,5.67583 1.4368,12.853955 -2.76118,17.571486 -5.15831,4.024926 -3.94241,5.010805 1.85043,4.362909 13.58742,-1.603119 25.03585,11.840701 23.9554,24.967141 -0.0691,18.213333 -0.13818,36.426673 -0.20726,54.640013 -1.5351,4.55905 -7.30638,6.71543 -11.30858,3.96578 -4.81473,-2.8888 -2.73019,-9.20279 -3.19227,-13.88869 -0.0523,-14.05586 -0.10469,-28.11173 -0.15704,-42.167583 -4.85271,-1.54237 -3.37467,3.24601 -3.51022,6.4208 V 231.02616 c -1.3114,6.77368 -9.29063,10.3384 -15.13544,6.61747 -6.62075,-3.7866 -4.17124,-12.04397 -4.62011,-18.29166 v -70.84935 c -4.85175,-1.54283 -3.39102,3.24111 -3.53094,6.42079 -0.0578,25.5528 -0.11553,51.1056 -0.17329,76.65839 -1.7387,5.48439 -7.13811,8.77105 -12.74767,7.2216 z'
const femaleIcon = 'path://m 39.7122,238.0264 c -5.604205,-1.49359 -5.822698,-7.32898 -5.431108,-11.96235 -0.05932,-18.97406 -0.118632,-37.94813 -0.177948,-56.92219 -7.401109,0.0507 -14.802279,0.16954 -22.203547,0.1438 8.050221,-26.97466 15.83106,-54.03787 24.0791,-80.948455 -6.246873,-1.537447 -5.103818,6.332986 -7.12857,10.198179 -4.203419,12.783656 -7.28462,25.995046 -12.31951,38.467156 C 6.215777,147.43407 -0.93895389,129.58252 6.2279437,121.52707 11.709639,105.71684 15.006783,88.999576 22.521999,73.9779 25.487431,65.143259 38.425956,64.174487 43.879817,63.247984 35.242261,58.307767 32.195248,46.181151 37.843175,37.985287 c 5.35176,-7.73122 16.727442,-10.988636 24.757146,-5.16531 11.321083,6.562216 10.452089,25.024381 -1.135269,30.670395 9.830628,-0.28155 20.086569,3.623662 24.845207,12.765524 3.87086,7.45858 5.12438,16.169298 8.137928,24.037484 2.906124,10.26421 6.922833,20.35157 9.297803,30.70045 1.06345,4.17564 -1.66552,9.02385 -6.181687,9.2796 -7.686885,1.11419 -8.783192,-8.80355 -10.70406,-14.18732 -3.87502,-12.5653 -7.681429,-25.15172 -11.575988,-37.711005 -8.798872,-0.113812 1.949333,13.898795 1.781574,19.941085 6.048408,20.20812 12.13493,40.40517 18.089502,60.64114 -7.392371,0.35953 -14.803078,0.14681 -22.203496,0.20388 -0.06597,21.22546 -0.131933,42.45093 -0.1979,63.67639 -2.103142,7.13406 -13.415648,7.74398 -15.969932,0.84281 -1.418088,-4.77754 -0.245017,-10.18282 -0.655178,-15.20454 l -0.156843,-49.31466 c -4.44248,-1.05339 -5.844521,0.93365 -4.913879,5.25338 -0.162881,19.18788 0.325808,38.44483 -0.244801,57.58947 -0.334387,5.03435 -6.719798,7.8699 -11.101102,6.02234 z'


const romaColors = [
  // palette1
  '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
  // palette2
  '#3f51b5', '#03a9f4', '#4caf50', '#f9ce1d', '#FF9800',
  // palette3
  '#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B',
  // palette4
  '#4ecdc4', '#c7f464', '#81D4FA', '#546E7A', '#fd6a6a',
  // palette5
  '#2b908f', '#f9a3a4', '#90ee7e', '#fa4443', '#69d2e7',
  // palette6
  '#449DD1', '#F86624', '#EA3546', '#662E9B', '#C5D86D',
  // palette7
  '#D7263D', '#1B998B', '#2E294E', '#F46036', '#E2C044',
  // palette8
  '#662E9B', '#F86624', '#F9C80E', '#EA3546', '#43BCCD',
  // palette9
  '#5C4742', '#A5978B', '#8D5B4C', '#5A2A27', '#C4BBAF',
  // palette10
  '#A300D6', '#7D02EB', '#5653FE', '#2983FF', '#00B1F2'
];







export const stacklineOptions: EChartsOption = {
  colors: romaColors, // Use Roma theme colors
  title: {
    text: 'stacked line',
    subtext: `National Slum Database, ${new Date().getFullYear()}`,
    left: 'left',
    get textStyle() {
      return { fontSize: 14, color: echartsTitleColor() }
    },
    get subtextStyle() {
      return { fontSize: 12, color: echartsSubtextColor() }
    },
  },
  legend: {
    orient: 'horizontal',
    type: 'scroll',
    center: 'center',
    itemWidth: 20,
    itemHeight: 20,
    bottom: '20',
    get textStyle() {
      return { color: echartsSubtextColor() }
    },
  },
  toolbox: {
    show: true,
    feature: {
      myFullScreenButton: {
        show: true,
        title: 'Full Screen',
        icon: 'image://https://cdn.svgapi.com/vector/166027/full-screen.svg',
        onclick: function () {
          const chart = this.api;
          const chartName = chart.getOption().title[0].text;
          console.log('Chart Name:', chartName);
          const containerDiv = chart.getDom();
          const containerId = containerDiv.id;
          console.log('Container ID:', containerId);
          toggleFullScreen(containerId);
        }
      },
      mark: { show: true },
      dataView: { show: true, readOnly: false },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 8 }
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  yAxis: {
    type: 'value',
    name: 'Number',
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
    nameTextStyle: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  series: [
    {
      name: 'test',
      type: 'line',
      data: [
        [0, 150], [1, 230], [2, 224], [3, 218], [4, 135], [5, 147], [6, 260]
      ]
    },
    {
      name: 'ewn',
      type: 'line',
      data: [
        [0, 32], [1, 145], [2, 123], [5, 116], [6, 123], [8, 116]
      ]
    }
  ]
}

export const toggleFullScreen = (cardId) => {
  console.log('Card ID', cardId)
  const chartContainer = document.getElementById(`${cardId}`);
  console.log(chartContainer)
  const fullscreenElement =
    chartContainer.requestFullscreen ||
    chartContainer.mozRequestFullScreen ||
    chartContainer.webkitRequestFullscreen ||
    chartContainer.msRequestFullscreen;
  if (fullscreenElement) {
    fullscreenElement.call(chartContainer);
  }
}

// Takes a data URI and returns the Data URI corresponding to the resized image at the wanted size.
function resizedataURL(datas, wantedWidth, wantedHeight) {
  return new Promise(async function(resolve, reject) {
    const img = document.createElement('img');
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = wantedWidth;
      canvas.height = wantedHeight;
      ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);
      const dataURI = canvas.toDataURL();
      resolve(dataURI);
    };
    img.src = datas;
  })
}

// ApexCharts options (unchanged, as customTheme is for ECharts)
export const simpleBarChart = {
  get darkMode() {
    return getAppDark()
  },
  title: {
    text: '',
    align: 'left',
    get textStyle() {
      return {
        fontSize: 14,
        color: apexTitleColor(),
      }
    },
    get subtextStyle() {
      return { fontSize: 12, color: apexSubtitleColor() }
    },
  },
  colors: romaColors, // Use Roma theme colors

  legend: {
    labels: {
      get colors() {
        return apexLegendLabelColor()
      },
    },
  },
  subtitle: {
    text: `National Slum Database, ${new Date().getFullYear()}`,
    align: 'left',
    get style() {
      return {
        fontSize: '12px',
        fontWeight: 'normal',
        color: apexSubtitleColor(),
      }
    },
  },
  chart: {
    type: 'bar',
    height: 350,
    stacked: false,
    stackType: '100%',
    get foreColor() {
      return apexLegendLabelColor()
    },
    toolbar: {
      show: true,
      export: {
        scale: 3,
        width: 1800
      },
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true
      }
    }
  },
  responsive: [{
    breakpoint: 600,
    options: {
      legend: {
        show: false
      },
      xaxis: {
        labels: {
          show: false,
          rotateAlways: true,
          rotate: 0,
          trim: true,
          hideOverlappingLabels: true,
          style: {
            //colors: [],
            fontSize: '8px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 400,
            cssClass: 'apexcharts-xaxis-label'
          }
        }
      }
    }
  }],
  grid: {
    show: true,
    get borderColor() {
      return apexGridBorderColor()
    },
    strokeDashArray: 0,
    xaxis: {
      lines: { show: true },
    },
    yaxis: {
      lines: { show: true },
    },
  },
  yaxis: {
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
  },
  xaxis: {
    type: 'category',
    categories: [],
    tickPlacement: 'on',
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
    get axisBorder() {
      return { color: apexGridBorderColor() }
    },
    get axisTicks() {
      return { color: apexGridBorderColor() }
    },
  },
  fill: {
    opacity: 1
  }
}

export const stackedbarOptions = {
  get darkMode() {
    return getAppDark()
  },
  title: {
    text: '',
    align: 'left',
    get textStyle() {
      return {
        fontSize: 14,
        color: apexTitleColor(),
      }
    },
    get subtextStyle() {
      return { fontSize: 12, color: apexSubtitleColor() }
    },
  },
  colors: romaColors, // Use Roma theme colors

  legend: {
    labels: {
      get colors() {
        return apexLegendLabelColor()
      },
    },
  },
  subtitle: {
    text: `National Slum Database, ${new Date().getFullYear()}`,
    align: 'left',
    get style() {
      return {
        fontSize: '12px',
        fontWeight: 'normal',
        color: apexSubtitleColor(),
      }
    },
  },
  chart: {
    type: 'bar',
    height: 350,
    stacked: true,
    stackType: '100%',
    get foreColor() {
      return apexLegendLabelColor()
    },
    toolbar: {
      show: true,
      export: {
        scale: 3,
        width: 1800
      },
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true
      }
    }
  },
  responsive: [{
    breakpoint: 600,
    options: {
      legend: {
        show: false
      },
      xaxis: {
        labels: {
          show: false,
          rotateAlways: true,
          rotate: 0,
          trim: true,
          hideOverlappingLabels: true,
          style: {
           // colors: [],
            fontSize: '8px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 400,
            cssClass: 'apexcharts-xaxis-label'
          }
        }
      }
    }
  }],
  grid: {
    show: true,
    get borderColor() {
      return apexGridBorderColor()
    },
    strokeDashArray: 0,
    xaxis: {
      lines: { show: true },
    },
    yaxis: {
      lines: { show: true },
    },
  },
  yaxis: {
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
  },
  xaxis: {
    type: 'category',
    categories: [],
    tickPlacement: 'on',
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
    get axisBorder() {
      return { color: apexGridBorderColor() }
    },
    get axisTicks() {
      return { color: apexGridBorderColor() }
    },
  },
  fill: {
    opacity: 1
  }
}

export const stackedbarOptionsAbs = {
  get darkMode() {
    return getAppDark()
  },
  title: {
    text: '',
    align: 'left',
    get textStyle() {
      return {
        fontSize: 14,
        color: apexTitleColor(),
      }
    },
    get subtextStyle() {
      return { fontSize: 12, color: apexSubtitleColor() }
    },
  },
  colors: romaColors, // Use Roma theme colors

  legend: {
    labels: {
      get colors() {
        return apexLegendLabelColor()
      },
    },
  },
  subtitle: {
    text: `National Slum Database, ${new Date().getFullYear()}`,
    align: 'left',
    get style() {
      return {
        fontSize: '12px',
        fontWeight: 'normal',
        color: apexSubtitleColor(),
      }
    },
  },
  chart: {
    type: 'bar',
    height: 350,
    stacked: true,
    get foreColor() {
      return apexLegendLabelColor()
    },
    toolbar: {
      show: true,
      export: {
        scale: 3,
        width: 1800
      }
    },
    zoom: {
      enabled: true
    }
  },
  responsive: [{
    breakpoint: 600,
    options: {
      legend: {
        show: false
      },
      xaxis: {
        labels: {
          show: false,
          rotateAlways: true,
          rotate: 0,
          trim: true,
          hideOverlappingLabels: true,
          style: {
           // colors: [],
            fontSize: '8px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 400,
            cssClass: 'apexcharts-xaxis-label'
          }
        }
      }
    }
  }],
  grid: {
    show: true,
    get borderColor() {
      return apexGridBorderColor()
    },
    strokeDashArray: 0,
    xaxis: {
      lines: { show: true },
    },
    yaxis: {
      lines: { show: true },
    },
  },
  yaxis: {
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
  },
  xaxis: {
    type: 'category',
    categories: [],
    tickPlacement: 'on',
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
    get axisBorder() {
      return { color: apexGridBorderColor() }
    },
    get axisTicks() {
      return { color: apexGridBorderColor() }
    },
  },
  fill: {
    opacity: 1
  }
}

export const multipleBarChart = {
  get darkMode() {
    return getAppDark()
  },
  title: {
    text: '',
    align: 'left',
    get textStyle() {
      return {
        fontSize: 14,
        color: apexTitleColor(),
      }
    },
    get subtextStyle() {
      return { fontSize: 12, color: apexSubtitleColor() }
    },
  },
  colors: romaColors, // Use Roma theme colors

  legend: {
    labels: {
      get colors() {
        return apexLegendLabelColor()
      },
    },
  },
  subtitle: {
    text: `National Slum Database, ${new Date().getFullYear()}`,
    align: 'left',
    get style() {
      return {
        fontSize: '12px',
        fontWeight: 'normal',
        color: apexSubtitleColor(),
      }
    },
  },
  chart: {
    type: 'bar',
    height: 350,
    get foreColor() {
      return apexLegendLabelColor()
    },
    toolbar: {
      show: true,
      export: {
        scale: 3,
        width: 1800
      }
    },
    zoom: {
      enabled: true
    }
  },
  responsive: [
    {
      breakpoint: 600,
      options: {
        legend: {
          show: false
        },
        xaxis: {
          labels: {
            show: false,
            rotateAlways: true,
            rotate: 0,
            trim: true,
            hideOverlappingLabels: true,
            style: {
             // colors: [],
              fontSize: '8px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label'
            }
          }
        }
      }
    }
  ],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '50%',
      endingShape: 'rounded'
    }
  },
  grid: {
    show: true,
    get borderColor() {
      return apexGridBorderColor()
    },
    strokeDashArray: 0,
    xaxis: {
      lines: { show: true },
    },
    yaxis: {
      lines: { show: true },
    },
  },
  yaxis: {
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
  },
  xaxis: {
    type: 'category',
    categories: [],
    tickPlacement: 'on',
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
    get axisBorder() {
      return { color: apexGridBorderColor() }
    },
    get axisTicks() {
      return { color: apexGridBorderColor() }
    },
  },
  fill: {
    opacity: 1
  }
}

export const lineOptions = {
  get darkMode() {
    return getAppDark()
  },
  chart: {
    type: 'area',
    stacked: false,
    height: 350,
    get foreColor() {
      return apexLegendLabelColor()
    },
    zoom: {
      type: 'x',
      enabled: true,
      autoScaleYaxis: true
    },
    toolbar: {
      show: true,
      autoSelected: 'zoom',
      export: {
        scale: 3,
        width: 1800
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  markers: {
    size: 0
  },
  colors: romaColors, // Use Roma theme colors

  grid: {
    show: true,
    get borderColor() {
      return apexGridBorderColor()
    },
    strokeDashArray: 0,
    xaxis: {
      lines: { show: true },
    },
    yaxis: {
      lines: { show: true },
    },
  },
  yaxis: {
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
  },

  legend: {
    labels: {
      get colors() {
        return apexLegendLabelColor()
      },
    },
  },
  subtitle: {
    text: `National Slum Database, ${new Date().getFullYear()}`,
    align: 'left',
    get style() {
      return {
        fontSize: '12px',
        fontWeight: 'normal',
        color: apexSubtitleColor(),
      }
    },
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    labels: {
      get style() {
        return { colors: apexLegendLabelColor() }
      },
    },
    get axisBorder() {
      return { color: apexGridBorderColor() }
    },
    get axisTicks() {
      return { color: apexGridBorderColor() }
    },
  },
  series: [{
    name: "Desktops",
    data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
  }]
}

export const pieDonutOptions = {
  get darkMode() {
    return getAppDark()
  },
  chart: {
    height: 350,
    type: 'donut',
    toolbar: {
      show: true,
      export: {
        scale: 3,
        width: 1800
      }
    },
    zoom: {
      enabled: true
    }
  },
  colors: romaColors, // Use Roma theme colors

  title: {
    text: 'National Slum Database',
    align: 'left',
    get style() {
      return {
        fontSize: '16px',
        fontWeight: 'bold',
        color: apexTitleColor(),
      }
    },
  },
  plotOptions: {
    pie: {
      startAngle: -90,
      endAngle: 270
    }
  },
  subtitle: {
    text: `National Slum Database, ${new Date().getFullYear()}`,
    align: 'left',
    get style() {
      return {
        fontSize: '12px',
        fontWeight: 'normal',
        color: apexSubtitleColor(),
      }
    },
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'right',
    labels: {
      get colors() {
        return apexLegendLabelColor()
      },
    },
  },
  labels: [],
  series: [],
  responsive: [{
    breakpoint: 600,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'right'
      }
    }
  }]
}


export const pieOptions = {
  get darkMode() {
    return getAppDark()
  },
  chart: {
    height: 350,
    type: 'donut',
    toolbar: {
      show: true,
      export: {
        scale: 3,
        width: 1800
      },
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        customFullscreen: {
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V8M21 8V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3H16M16 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V16M3 16V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
          title: 'Fullscreen',
          class: 'custom-fullscreen',
          click: function(chart, options, e) {
            const chartContainer = chart.el;
            if (chartContainer) {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                chartContainer.requestFullscreen();
              }
            }
          }
        }
      }
    },
    zoom: {
      enabled: true
    }
  },
  colors: romaColors, // Use Roma theme colors

  title: {
    text: 'National Slum Database',
    align: 'left',
    get style() {
      return {
        fontSize: '16px',
        fontWeight: 'bold',
        color: apexTitleColor(),
      }
    },
  },
  plotOptions: {
   pie: {
    donut: {
      size: '50%' // force it to have no donut hole
    }
  }
  },
  subtitle: {
    text: `National Slum Database, ${new Date().getFullYear()}`,
    align: 'left',
    get style() {
      return {
        fontSize: '12px',
        fontWeight: 'normal',
        color: apexSubtitleColor(),
      }
    },
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'right',
    labels: {
      get colors() {
        return apexLegendLabelColor()
      },
    },
  },
  labels: [],
  series: [],
  responsive: [{
    breakpoint: 600,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'right'
      }
    }
  }]
}


/** Word Map (Apex treemap): dark/light reads from store when options are merged. */
export const treemapOptions = {
  get darkMode() {
    return getAppDark()
  },
  chart: {
    height: 350,
    type: 'treemap',
    get foreColor() {
      return apexLegendLabelColor()
    },
    toolbar: {
      show: true,
      export: { scale: 3, width: 1800 },
    },
    zoom: { enabled: true },
  },
  /** Do not use `theme: { mode }` with a getter — Apex mutates `theme` and Vue proxies reject the set. */
  title: {
    text: '',
    align: 'left',
    get style() {
      return {
        fontSize: '16px',
        fontWeight: 'bold',
        color: apexTitleColor(),
      }
    },
    get textStyle() {
      return {
        fontSize: 14,
        color: echartsTitleColor(),
      }
    },
    get subtextStyle() {
      return {
        fontSize: 12,
        color: echartsSubtextColor(),
      }
    },
  },
  subtitle: {
    text: '',
    align: 'left',
    get style() {
      return {
        fontSize: '12px',
        fontWeight: 'normal',
        color: apexSubtitleColor(),
      }
    },
  },
  colors: romaColors,
  stroke: {
    width: 2,
    get colors() {
      return [getAppDark() ? 'rgba(15, 23, 42, 0.92)' : '#ffffff']
    },
  },
  plotOptions: {
    treemap: {
      distributed: true,
      enableShades: false,
      dataLabels: {
        format: 'scale',
        get style() {
          return {
            fontSize: '12px',
            fontWeight: 600,
            colors: [getAppDark() ? '#f8fafc' : '#0f172a'],
          }
        },
      },
    },
  },
  legend: { show: false },
  labels: [],
  series: [],
}

// ECharts options with 100-color palette
export const barOptions: EChartsOption = {
  //color: customColorPalette, // Apply 100-color palette
  title: {
    text: 'barchart',
    left: 'left',
    get textStyle() {
      return { color: echartsTitleColor() }
    },
  },
  colors: romaColors, // Use Roma theme colors

  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: 50,
    right: 20,
    bottom: 20
  },
  xAxis: {
    type: 'category',
    data: ['Monday', 'Tuesday', 'Wednesday'],
    axisTick: {
      alignWithLabel: true,
    },
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: false, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  yAxis: {
    type: 'value',
    name: 'Number',
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: true, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
    nameTextStyle: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  series: [
    {
      name: 'chart title',
      data: [],
      type: 'bar'
    }
  ]
}

export const xmultipleBarChart: EChartsOption = {
  color: customColorPalette, // Apply 100-color palette
  title: {
    text: '',
    subtext: `National Slum Database, ${new Date().getFullYear()}`,
    left: 'center',
    get textStyle() {
      return { fontSize: 14, color: echartsTitleColor() }
    },
    get subtextStyle() {
      return { fontSize: 12, color: echartsSubtextColor() }
    },
  },
  toolbox: {
    show: true,
    feature: {
      myFullScreenButton: {
        show: true,
        title: 'Fullx Screen',
        icon: 'image://https://cdn.svgapi.com/vector/166027/full-screen.svg',
        onclick: function () {
          const chart = this.api;
          const chartName = chart.getOption().title[0].text;
          console.log('Chart Name:', chartName);
          const containerDiv = chart.getDom();
          const containerId = containerDiv.id;
          console.log('Container ID:', containerId);
          toggleFullScreen(containerId);
        }
      },
      myFullScreenButton2: {
        show: true,
        title: 'Toggle Legend',
        icon: 'image://https://cdn.svgapi.com/vector/22674/switch.svg',
        onclick: function () {
          let chartInstance
          chartInstance = this.api;
          const option = chartInstance.getOption();
          console.log(chartInstance)
          option.legend[0].show = !option.legend[0].show;
          chartInstance = option;
          chartInstance.resize();
        }
      },
      mark: { show: true },
      dataView: { show: true, readOnly: false },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 8 }
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    top: 'bottom',
    type: 'scroll',
    get textStyle() {
      return { color: echartsSubtextColor() }
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  yAxis: {
    type: 'value',
    boundaryGap: [0, 0.01],
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: true, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  xAxis: {
    type: 'category',
    name: 'Number',
    data: [],
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: false, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
    nameTextStyle: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  series: []
}

export const barOptionsMultiple: EChartsOption = {
 // color: customColorPalette, // Apply 100-color palette
  title: {
    text: 'World Population',
    get textStyle() {
      return { color: echartsTitleColor() }
    },
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  colors: romaColors, // Use Roma theme colors

  legend: {
    type: 'scroll',
    orient: 'vertical',
    left: 10,
    top: 20,
    bottom: 20,
    get textStyle() {
      return { color: echartsSubtextColor() }
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  yAxis: {
    type: 'value',
    name: 'Number',
    boundaryGap: [0, 0.01],
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: true, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
    nameTextStyle: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  xAxis: {
    type: 'category',
    data: [],
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: false, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  series: []
}

export const barMaleFemaleOptions: EChartsOption = {
  color: customColorPalette, // Apply 100-color palette
  title: {
    text: '',
    subtext: `National Slum Database, ${new Date().getFullYear()}`,
    left: 'center',
    get textStyle() {
      return { fontSize: 14, color: echartsTitleColor() }
    },
    get subtextStyle() {
      return { fontSize: 12, color: echartsSubtextColor() }
    },
  },
  colors: romaColors, // Use Roma theme colors

  toolbox: {
    show: true,
    feature: {
      myFullScreenButton: {
        show: true,
        title: 'Full Screen',
        icon: 'image://https://cdn.svgapi.com/vector/166027/full-screen.svg',
        onclick: function () {
          const chart = this.api;
          const chartName = chart.getOption().title[0].text;
          console.log('Chart Name:', chartName);
          const containerDiv = chart.getDom();
          const containerId = containerDiv.id;
          console.log('Container ID:', containerId);
          toggleFullScreen(containerId);
        }
      },
      mark: { show: true },
      dataView: { show: true, readOnly: false },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 8 }
    }
  },
  grid: {
    left: 50,
    right: 20,
    bottom: 20
  },
  xAxis: {
    type: 'category',
    data: [],
    axisTick: {
      alignWithLabel: true,
    },
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: false, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  yAxis: {
    type: 'value',
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: true, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  legend: {
    orient: 'horizontal',
    type: 'scroll',
    left: 'left',
    itemWidth: 20,
    itemHeight: 20,
    get textStyle() {
      return { color: echartsSubtextColor() }
    },
    data: [
      {
        name: 'Male',
        icon: maleIcon
      },
      {
        name: 'Female',
        icon: femaleIcon
      }
    ]
  },
  series: [
    {
      name: 'Male',
      type: 'bar',
      stack: 'total',
      label: {
        show: false
      },
      emphasis: {
        focus: 'series'
      },
      color: colorPalette[1], // Retain original color for consistency
      data: []
    },
    {
      name: 'Female',
      type: 'bar',
      stack: 'total',
      color: colorPalette[0], // Retain original color for consistency
      label: {
        show: false
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    }
  ]
}

export const xstackedbarOptions: EChartsOption = {
  color: customColorPalette, // Apply 100-color palette
  title: {
    text: '',
    subtext: `National Slum Database, ${new Date().getFullYear()}`,
    left: 'center',
    get textStyle() {
      return { fontSize: 14, color: echartsTitleColor() }
    },
    get subtextStyle() {
      return { fontSize: 12, color: echartsSubtextColor() }
    },
  },
  colors: romaColors, // Use Roma theme colors

  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: false },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 8 }
    }
  },
  grid: {
    left: 30,
    right: 30,
    bottom: 20,
  },
  xAxis: {
    type: 'category',
    data: [],
    axisTick: {
      alignWithLabel: true,
    },
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: false, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  yAxis: {
    type: 'value',
    position: 'right',
    get axisLine() {
      return { lineStyle: { color: echartsAxisLineColor() } }
    },
    get splitLine() {
      return { show: true, lineStyle: { color: echartsSplitLineColor() } }
    },
    axisLabel: {
      get color() {
        return echartsSubtextColor()
      },
    },
  },
  legend: {
    show: false,
    type: 'scroll',
    orient: 'vertical',
    left: 10,
    top: 20,
    bottom: 20,
    get textStyle() {
      return { color: echartsSubtextColor() }
    },
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  series: []
}

/** Source line under maps (matches subtitle tone in light/dark). */
export function mapChartSourceFooterFill(): string {
  return echartsSubtextColor()
}

export function mapChartNoDataFill(): string {
  return getAppDark() ? '#fca5a5' : '#b91c1c'
}

/** Uniform region fill when the map has no values (still show geography). */
export function mapChartNoDataAreaColor(): string {
  return getAppDark() ? '#334155' : '#cbd5e1'
}

/** Plain Apex fields for the current theme — merge onto existing options after dark toggle (initial `{...pieOptions}` snapshots getters). */
export function getApexReactiveThemePatch(): Record<string, unknown> {
  const fc = apexLegendLabelColor()
  const tc = apexTitleColor()
  const sc = apexSubtitleColor()
  const gc = apexGridBorderColor()
  const dark = getAppDark()
  return {
    darkMode: dark,
    chart: { foreColor: fc },
    title: {
      style: { fontSize: '16px', fontWeight: 'bold', color: tc },
      textStyle: { fontSize: 14, color: tc },
    },
    subtitle: {
      style: { fontSize: '12px', fontWeight: 'normal', color: sc },
    },
    legend: { labels: { colors: fc } },
    grid: { borderColor: gc },
    stroke: { colors: [dark ? 'rgba(15, 23, 42, 0.92)' : '#ffffff'] },
    plotOptions: {
      treemap: {
        dataLabels: {
          style: {
            fontSize: '12px',
            fontWeight: 600,
            colors: [dark ? '#f8fafc' : '#0f172a'],
          },
        },
      },
    },
    xaxis: {
      labels: { style: { colors: fc } },
      axisBorder: { color: gc },
      axisTicks: { color: gc },
    },
    yaxis: {
      labels: { style: { colors: fc } },
      axisBorder: { color: gc },
      axisTicks: { color: gc },
    },
  }
}

function mergeApexXAxisLike(ex: unknown, patch: unknown): Record<string, unknown> {
  const e = (ex || {}) as Record<string, unknown>
  const pa = (patch || {}) as Record<string, unknown>
  return {
    ...e,
    ...pa,
    labels: {
      ...(e.labels as Record<string, unknown>),
      ...(pa.labels as Record<string, unknown>),
      style: {
        ...((e.labels as any)?.style),
        ...((pa.labels as any)?.style),
      },
    },
    axisBorder: { ...(e.axisBorder as object), ...(pa.axisBorder as object) },
    axisTicks: { ...(e.axisTicks as object), ...(pa.axisTicks as object) },
  }
}

/** Re-apply theme colors to an Apex options object (already merged once at load time). */
export function mergeApexChartOptionsWithTheme(existing: Record<string, unknown>): Record<string, unknown> {
  const p = getApexReactiveThemePatch()
  const ex = existing
  const exPo = (ex.plotOptions as Record<string, unknown>) || {}
  const pPo = (p.plotOptions as Record<string, unknown>) || {}
  let plotOptions: Record<string, unknown> = { ...exPo, ...pPo }
  if (exPo.treemap && pPo.treemap) {
    plotOptions = {
      ...plotOptions,
      treemap: {
        ...(exPo.treemap as object),
        ...(pPo.treemap as object),
        dataLabels: {
          ...((exPo.treemap as any).dataLabels || {}),
          ...((pPo.treemap as any).dataLabels || {}),
          style: {
            ...((exPo.treemap as any).dataLabels?.style),
            ...((pPo.treemap as any).dataLabels?.style),
          },
        },
      },
    }
  }
  const yRaw = ex.yaxis
  const yaxis =
    Array.isArray(yRaw) ? yRaw.map((y) => mergeApexXAxisLike(y, p.yaxis)) : mergeApexXAxisLike(yRaw, p.yaxis)

  const noDataFill = apexSubtitleColor()
  let graphic: unknown = ex.graphic
  if (Array.isArray(ex.graphic)) {
    graphic = (ex.graphic as Array<Record<string, unknown>>).map((item) => {
      if (item.type !== 'text' || !item.style || typeof item.style !== 'object') return item
      const st = item.style as Record<string, unknown>
      const fill = st.fill
      const text = st.text
      const isLegacyNoDataFill =
        fill === '#999' || fill === '#999999' || fill === '#9e9e9e' || fill === '#909399'
      const isNoDataCopy =
        typeof text === 'string' &&
        (text.includes('No data') || text.toLowerCase().includes('no data'))
      if (isLegacyNoDataFill || isNoDataCopy) {
        return { ...item, style: { ...st, fill: noDataFill } }
      }
      return item
    })
  }

  return {
    ...ex,
    ...p,
    chart: { ...(ex.chart as Record<string, unknown>), ...(p.chart as Record<string, unknown>) },
    title: { ...(ex.title as Record<string, unknown>), ...(p.title as Record<string, unknown>) },
    subtitle: { ...(ex.subtitle as Record<string, unknown>), ...(p.subtitle as Record<string, unknown>) },
    legend: {
      ...(ex.legend as Record<string, unknown>),
      labels: {
        ...((ex.legend as any)?.labels),
        ...((p.legend as any)?.labels),
      },
    },
    grid: { ...(ex.grid as Record<string, unknown>), ...(p.grid as Record<string, unknown>) },
    stroke: { ...(ex.stroke as Record<string, unknown>), ...(p.stroke as Record<string, unknown>) },
    plotOptions,
    xaxis: mergeApexXAxisLike(ex.xaxis, p.xaxis),
    yaxis,
    ...(Array.isArray(ex.graphic) ? { graphic } : {}),
  }
}

/** Re-apply ECharts map tooltip / visualMap / toolbox / region chrome after dark toggle. */
export function mergeEchartsMapOptionForTheme(option: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...option }
  out.title = {
    ...(option.title as object),
    textStyle: { fontSize: 14, color: echartsTitleColor() },
    subtextStyle: { fontSize: 12, color: echartsSubtextColor() },
  }
  out.tooltip = {
    ...(option.tooltip as object),
    backgroundColor: echartsTooltipBg(),
    borderColor: echartsTooltipBorder(),
    textStyle: { color: echartsTitleColor(), fontSize: 13 },
  }
  const vm = option.visualMap as Record<string, unknown> | undefined
  if (vm && vm.show === false) {
    out.visualMap = { ...vm }
  } else if (vm) {
    out.visualMap = {
      ...vm,
      textStyle: { color: echartsSubtextColor(), fontSize: 12 },
      handleStyle: {
        borderColor: echartsAxisLineColor(),
        color: getAppDark() ? '#475569' : '#f1f5f9',
      },
    }
  }
  out.toolbox = {
    ...(option.toolbox as object),
    iconStyle: { borderColor: echartsAxisLineColor() },
    emphasis: { iconStyle: { borderColor: echartsTitleColor() } },
  }
  if (Array.isArray(option.series)) {
    out.series = option.series.map((s: Record<string, unknown>) => {
      if (!s || s.type !== 'map') return s
      return {
        ...s,
        itemStyle: {
          ...(s.itemStyle as object),
          borderColor: echartsMapRegionBorder(),
        },
        emphasis: {
          ...(s.emphasis as object),
          itemStyle: {
            ...((s.emphasis as any)?.itemStyle),
            borderColor: echartsTitleColor(),
          },
        },
        select: {
          ...(s.select as object),
          itemStyle: {
            ...((s.select as any)?.itemStyle),
            borderColor: echartsTitleColor(),
          },
        },
      }
    })
  }
  if (Array.isArray(option.graphic)) {
    out.graphic = option.graphic.map((g: { type?: string; style?: { text?: string; fill?: string } }) => {
      if (g.type !== 'text' || !g.style) return g
      const t = String(g.style.text || '')
      if (t.includes('Source:')) {
        return { ...g, style: { ...g.style, fill: mapChartSourceFooterFill() } }
      }
      if (t.includes('No data')) {
        return { ...g, style: { ...g.style, fill: mapChartNoDataFill() } }
      }
      return g
    })
  }
  return out
}

export const mapChartOptions: EChartsOption = {
  color: customColorPalette, // Apply 100-color palette
  get backgroundColor() {
    return 'transparent'
  },
  title: {
    text: 'map',
    subtext: `National Slum Database, ${new Date().getFullYear()}`,
    left: 'left',
    get textStyle() {
      return { fontSize: 14, color: echartsTitleColor() }
    },
    get subtextStyle() {
      return { fontSize: 12, color: echartsSubtextColor() }
    },
  },
  colors: romaColors, // Use Roma theme colors

  tooltip: {
    trigger: 'item',
    showDelay: 0,
    transitionDuration: 0.2,
    get backgroundColor() {
      return echartsTooltipBg()
    },
    get borderColor() {
      return echartsTooltipBorder()
    },
    get textStyle() {
      return { color: echartsTitleColor(), fontSize: 13 }
    },
  },
  visualMap: {
    left: 'right',
    min: 0,
    max: 1000,
    inRange: {
      color: [
        '#313695',
        '#4575b4',
        '#74add1',
        '#abd9e9',
        '#e0f3f8',
        '#ffffbf',
        '#fee090',
        '#fdae61',
        '#f46d43',
        '#d73027',
        '#a50026'
      ]
    },
    text: ['High', 'Low'],
    calculable: true,
    get textStyle() {
      return { color: echartsSubtextColor(), fontSize: 12 }
    },
    get handleStyle() {
      return {
        borderColor: echartsAxisLineColor(),
        color: getAppDark() ? '#475569' : '#f1f5f9',
      }
    },
  },
  toolbox: {
    show: true,
    get iconStyle() {
      return {
        borderColor: echartsAxisLineColor(),
      }
    },
    get emphasis() {
      return {
        iconStyle: {
          borderColor: echartsTitleColor(),
        },
      }
    },
    feature: {
      myFullScreenButton: {
        show: true,
        title: 'Full Screen',
        icon: 'image://https://cdn.svgapi.com/vector/166027/full-screen.svg',
        onclick: function () {
          const chart = this.api;
          const chartName = chart.getOption().title[0].text;
          console.log('Chart Name:', chartName);
          const containerDiv = chart.getDom();
          const containerId = containerDiv.id;
          console.log('Container ID:', containerId);
          toggleFullScreen(containerId);
        }
      },
      mark: { show: true },
      dataView: { show: true, readOnly: false },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 8 }
    }
  },
  series: [
    {
      name: '',
      type: 'map',
      roam: true,
      map: 'KE',
      aspectScale: 0.999,
      label: {
        show: false,
      },
      itemStyle: {
        get borderColor() {
          return echartsMapRegionBorder()
        },
        borderWidth: 0.8,
      },
      emphasis: {
        label: {
          show: false,
        },
        itemStyle: {
          get borderColor() {
            return echartsTitleColor()
          },
          borderWidth: 1.2,
        },
      },
      select: {
        label: {
          show: false,
        },
        itemStyle: {
          get borderColor() {
            return echartsTitleColor()
          },
        },
      },
      data: []
    }
  ]
}








export const pyramidOptions  = {
    series: [{
      name: 'Males',
      data: [0.4, 0.65, 0.76, 0.88, 1.5, 2.1, 2.9, 3.8, 3.9, 4.2, 4, 4.3, 4.1, 4.2, 4.5,
        3.9, 3.5, 3
      ]
    },
    {
      name: 'Females',
      data: [-0.8, -1.05, -1.06, -1.18, -1.4, -2.2, -2.85, -3.7, -3.96, -4.22, -4.3, -4.4,
        -4.1, -4, -4.1, -3.4, -3.1, -2.8
      ]
    }
    ],
 
  
  chartOptions: {
    get darkMode() {
      return getAppDark()
    },
    chart: {
      type: 'bar',
      height: 440,
      stacked: true,
      get foreColor() {
        return apexLegendLabelColor()
      },
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        show: true,
        autoSelected: 'zoom',
        export: {
          scale: 3,
          width: 1800
        }
      }
    },
     
 

    legend: {
      show: true,
      position: 'top',
      labels: {
        get colors() {
          return apexLegendLabelColor()
        },
      },
      markers: {
        size: 10,
        width: 10,
        height: 10,
          customHTML: [
          // Series 0 → Males
          () => `
          <svg fill="#008FFB" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#008FFB"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M9.5,7H15a1,1,0,0,1,.949.684l2,6a1,1,0,0,1-1.9.632L14.5,9.662V22a1,1,0,0,1-2,0V16h-1v6a1,1,0,0,1-2,0V9.662L7.949,14.316a1,1,0,0,1-1.9-.632l2-6A1,1,0,0,1,9,7Zm0-3.5A2.5,2.5,0,1,0,12,1,2.5,2.5,0,0,0,9.5,3.5Z"></path></g></svg> `,
          // Series 1 → Females
          () => `
          <svg fill="#FF4560" viewBox="-128 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M128 0c35.346 0 64 28.654 64 64s-28.654 64-64 64c-35.346 0-64-28.654-64-64S92.654 0 128 0m119.283 354.179l-48-192A24 24 0 0 0 176 144h-11.36c-22.711 10.443-49.59 10.894-73.28 0H80a24 24 0 0 0-23.283 18.179l-48 192C4.935 369.305 16.383 384 32 384h56v104c0 13.255 10.745 24 24 24h32c13.255 0 24-10.745 24-24V384h56c15.591 0 27.071-14.671 23.283-29.821z"></path></g></svg>
          `
        ],
   
        offsetX: 0,
        offsetY: 0
    },
   
      itemMargin: {
        horizontal: 5,
        vertical: 0
      },
      onItemClick: {
        toggleDataSeries: true
      },
      onItemHover: {
        highlightDataSeries: true
      }



    },




    colors: ['#008FFB', '#FF4560'],
    plotOptions: {
      bar: {
        borderRadius: 5,
        borderRadiusApplication: 'end', // 'around', 'end'
        borderRadiusWhenStacked: 'all', // 'all', 'last'
        horizontal: true,
        barHeight: '80%',
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1,
      get colors() {
        return [getAppDark() ? '#0f172a' : '#ffffff']
      },
    },
    grid: {
      show: true,
      get borderColor() {
        return apexGridBorderColor()
      },
      strokeDashArray: 0,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    yaxis: {
      stepSize: 1,
      labels: {
        get style() {
          return { colors: apexLegendLabelColor() }
        },
      },
      get axisBorder() {
        return { color: apexGridBorderColor() }
      },
      get axisTicks() {
        return { color: apexGridBorderColor() }
      },
    },
    tooltip: {
      shared: false,
      x: {
        formatter: function (val) {
          return val
        }
      },
      y: {
        formatter: function (val) {
          return Math.abs(val)  +'%'
        }
      }
    },
    title: {
      text: '',
      get style() {
        return { color: apexTitleColor() }
      },
    },
    subtitle: {
      text: `National Slum Database, ${new Date().getFullYear()}`,
      align: 'left',
      get style() {
        return {
          fontSize: '12px',
          fontWeight: 'normal',
          color: apexSubtitleColor(),
        }
      },
    },
    xaxis: {
      categories: ['65+', '35-64', '18-35', '6-17', '0-5'],
      title: {
        text: 'Percent',
        get style() {
          return { color: apexSubtitleColor() }
        },
      },
      labels: {
        formatter: function (val) {
          return Math.abs(Math.round(val)) + '%'
        },
        get style() {
          return { colors: apexLegendLabelColor() }
        },
      },
      get axisBorder() {
        return { color: apexGridBorderColor() }
      },
      get axisTicks() {
        return { color: apexGridBorderColor() }
      },
    },
  },
};

