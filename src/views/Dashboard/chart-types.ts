import { EChartsOption } from 'echarts'
import { EChartsOption as EChartsWordOption } from 'echarts-wordcloud'
import { useI18n } from '@/hooks/web/useI18n'
import 'echarts/lib/component/toolbox'
import { reactive } from 'vue';

const { t } = useI18n()

const colorPalette = ['#ff007f', '#0000ff'];  // Male-Female
const maleIcon = 'path://m 146.41936,238.8034 c -5.21101,-1.43402 -7.51545,-6.79358 -6.6619,-11.76943 -0.0588,-45.10952 -0.11757,-90.21905 -0.17635,-135.328563 -5.3022,-1.61412 -3.06375,4.34199 -3.52464,7.58816 -0.0576,14.697923 -0.11511,29.395843 -0.17266,44.093773 -1.72718,6.61806 -12.15586,7.45944 -14.19605,0.88682 -1.42909,-4.98857 -0.22146,-10.60033 -0.62062,-15.83232 0.10773,-15.18837 -0.21551,-30.437173 0.16059,-45.587893 1.91842,-11.228608 12.80383,-20.22421 24.26927,-18.689786 10.60777,1.558898 0.0755,-3.65768 -0.79236,-8.596161 -4.23852,-8.688715 0.80002,-20.073014 9.72708,-23.421847 8.82591,-4.162774 20.30103,1.001172 23.52581,10.108188 2.28945,5.67583 1.4368,12.853955 -2.76118,17.571486 -5.15831,4.024926 -3.94241,5.010805 1.85043,4.362909 13.58742,-1.603119 25.03585,11.840701 23.9554,24.967141 -0.0691,18.213333 -0.13818,36.426673 -0.20726,54.640013 -1.5351,4.55905 -7.30638,6.71543 -11.30858,3.96578 -4.81473,-2.8888 -2.73019,-9.20279 -3.19227,-13.88869 -0.0523,-14.05586 -0.10469,-28.11173 -0.15704,-42.167583 -4.85271,-1.54237 -3.37467,3.24601 -3.51022,6.4208 V 231.02616 c -1.3114,6.77368 -9.29063,10.3384 -15.13544,6.61747 -6.62075,-3.7866 -4.17124,-12.04397 -4.62011,-18.29166 v -70.84935 c -4.85175,-1.54283 -3.39102,3.24111 -3.53094,6.42079 -0.0578,25.5528 -0.11553,51.1056 -0.17329,76.65839 -1.7387,5.48439 -7.13811,8.77105 -12.74767,7.2216 z'
const femaleIcon = 'path://m 39.7122,238.0264 c -5.604205,-1.49359 -5.822698,-7.32898 -5.431108,-11.96235 -0.05932,-18.97406 -0.118632,-37.94813 -0.177948,-56.92219 -7.401109,0.0507 -14.802279,0.16954 -22.203547,0.1438 8.050221,-26.97466 15.83106,-54.03787 24.0791,-80.948455 -6.246873,-1.537447 -5.103818,6.332986 -7.12857,10.198179 -4.203419,12.783656 -7.28462,25.995046 -12.31951,38.467156 C 6.215777,147.43407 -0.93895389,129.58252 6.2279437,121.52707 11.709639,105.71684 15.006783,88.999576 22.521999,73.9779 25.487431,65.143259 38.425956,64.174487 43.879817,63.247984 35.242261,58.307767 32.195248,46.181151 37.843175,37.985287 c 5.35176,-7.73122 16.727442,-10.988636 24.757146,-5.16531 11.321083,6.562216 10.452089,25.024381 -1.135269,30.670395 9.830628,-0.28155 20.086569,3.623662 24.845207,12.765524 3.87086,7.45858 5.12438,16.169298 8.137928,24.037484 2.906124,10.26421 6.922833,20.35157 9.297803,30.70045 1.06345,4.17564 -1.66552,9.02385 -6.181687,9.2796 -7.686885,1.11419 -8.783192,-8.80355 -10.70406,-14.18732 -3.87502,-12.5653 -7.681429,-25.15172 -11.575988,-37.711005 -8.798872,-0.113812 1.949333,13.898795 1.781574,19.941085 6.048408,20.20812 12.13493,40.40517 18.089502,60.64114 -7.392371,0.35953 -14.803078,0.14681 -22.203496,0.20388 -0.06597,21.22546 -0.131933,42.45093 -0.1979,63.67639 -2.103142,7.13406 -13.415648,7.74398 -15.969932,0.84281 -1.418088,-4.77754 -0.245017,-10.18282 -0.655178,-15.20454 l -0.156843,-49.31466 c -4.44248,-1.05339 -5.844521,0.93365 -4.913879,5.25338 -0.162881,19.18788 0.325808,38.44483 -0.244801,57.58947 -0.334387,5.03435 -6.719798,7.8699 -11.101102,6.02234 z'


export const xlineOptions: EChartsOption = {
  title: {
    text: 'LineChart',
    left: 'center'
  },
  xAxis: {
    data: [
      t('analysis.january'),
      t('analysis.february'),
      t('analysis.march'),
      t('analysis.april'),
      t('analysis.may'),
      t('analysis.june'),
      t('analysis.july'),
      t('analysis.august'),
      t('analysis.september'),
      t('analysis.october'),
      t('analysis.november'),
      t('analysis.december')
    ],
    boundaryGap: false,
    axisTick: {
      show: false
    }
  },
  grid: {
    left: 20,
    right: 20,
    bottom: 20,
    top: 80,
    containLabel: true
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    },
    padding: [5, 10]
  },
  yAxis: {
    axisTick: {
      show: false
    }
  },
  legend: {
    data: [t('analysis.estimate'), t('analysis.actual')],
    top: 50
  },
  series: [
    {
      name: t('analysis.estimate'),
      smooth: true,
      type: 'line',
      data: [100, 120, 161, 134, 105, 160, 165, 114, 163, 185, 118, 123],
      animationDuration: 2800,
      animationEasing: 'cubicInOut'
    },
    {
      name: t('analysis.actual'),
      smooth: true,
      type: 'line',
      itemStyle: {},
      data: [120, 82, 91, 154, 162, 140, 145, 250, 134, 56, 99, 123],
      animationDuration: 2800,
      animationEasing: 'quadraticOut'
    }
  ]
}


export const lineOptions: EChartsOption = {
  title: {
    text: '',
    subtext: 'National Slum Database, 2023',
    left: 'center',
    textStyle: {
      fontSize: 14
    },
    subtextStyle: {
      fontSize: 12
    }
  },
  legend: {
    //  show: ShowLegend,
      orient: 'horizontal',
      type: 'scroll',
      left: 'left',
      itemWidth: 20,
      itemHeight: 20,
   
    },
  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: false },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 4 }
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [150, 230, 224, 218, 135, 147, 260],
      type: 'line',
      name:''
    }
  ]
};


export const stacklineOptions: EChartsOption = {
  title: {
    text: 'stacked line',
    subtext: 'National Slum Database, 2023',
    left: 'left',
    textStyle: {
      fontSize: 14
    },
    subtextStyle: {
      fontSize: 12
    }
  },
  legend: {
    //  show: ShowLegend,
      orient: 'horizontal',
      type: 'scroll',
      center: 'center',
      itemWidth: 20,
    itemHeight: 20,
      bottom:'20'
   
    },
  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: false },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 4 }
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: 'test',
      type: 'line',
      data: [
        [0, 150], [1, 230], [2, 224], [3, 218], [4, 135], [5, 147], [6, 260]
      ],
    },
    {
      name: 'ewn',
      type: 'line',
      data: [
        [0, 32], [1, 145], [2, 123], [5, 116], [6, 123], [8, 116]
      ],
    }
  ]
};



export const pieOptions  = reactive({
  title: {
    text: '',
    subtext: 'National Slum Database, 2023',
    left: 'center',
    textStyle: {
      fontSize: 14
    },
    subtextStyle: {
      fontSize: 12
    }
  },
  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: false },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 4 }
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  legend: {
    //  show: ShowLegend,
      orient: 'horizontal',
      type: 'scroll',
      left: 'left',
      itemWidth: 20,
      itemHeight: 20,
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
  selectedMode: true,

  series: [
    {
      name: '',
      type: 'pie',
   //   radius: '70%',
      center: ['50%', '50%'],
      radius: ['10%', '70%'],

      roseType: 'area',
  //    color: colorPalette,
      // itemStyle: {
      //   borderRadius: 1,
      //   borderColor: '#fff',
      //   borderWidth: 1
      // },
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)'
      },
      data: []
    }
  ]
});





export const simpleBarChart: EChartsOption = {
  title: {
    text: '',
    subtext: 'National Slum Database, 2023',
    left: 'center',
    textStyle: {
      fontSize: 14
    },
    subtextStyle: {
      fontSize: 12
    }
  },
  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: true },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 4 }
    }
  },
 
  xAxis: {
    type: 'category',
    data: ['001', '002'],
    axisTick: {
      alignWithLabel: true
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },

  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [10,20],
      type: 'bar',
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)'
      }
    }
  ]
};



export const multipleBarChart: EChartsOption = {
  title: {
    text: '',
    subtext: 'National Slum Database, 2023',
    left: 'center',
    textStyle: {
      fontSize: 14
    },
    subtextStyle: {
      fontSize: 12
    }
  },

  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: true },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 4 }
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    orient: 'horizontal',
     type: 'scroll',
      bottom:'-10',
      left :'left',
    itemWidth: 20,
    itemHeight: 20,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  yAxis: {
    type: 'value',
    boundaryGap: [0, 0.01]
  },
  xAxis: {
    type: 'category',
    data: ['Brazil', 'Indonesia', 'USA', 'India', 'China', 'World']
  },
  series: [
    {
      name: '2011',
      type: 'bar',
      data: [18203, 23489, 29034, 104970, 131744, 630230]
    },
    {
      name: '2012',
      type: 'bar',
      data: [19325, 23438, 31000, 121594, 134141, 681807]
    }
  ]
};


export const barOptionsMultiple: EChartsOption = {

  title: {
    text: 'World Population'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    //  show: ShowLegend,
      orient: 'horizontal',
      type: 'scroll',
      center: 'left',
      itemWidth: 20,
    itemHeight: 20,
      bottom:'20'
   
    },
   grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  yAxis: {
    type: 'value',
    boundaryGap: [0, 0.01]
  },
  xAxis: {
    type: 'category',
    data: []
  },
  series: []

}




export const barOptions: EChartsOption = {
  title: {
    text: 'barchart',
    left: 'center'
  },
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
    data: ['Monday', 'Tuesday','Wednesday'
       
    ],
    axisTick: {
      alignWithLabel: true
    }
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: 'chart title',
      data: [13253, 34235, 26321 ],
      type: 'bar'
    }
  ]
}

 
export const  barMaleFemaleOptions: EChartsOption = {
  title: {
    text: '',
    subtext: 'National Slum Database, 2023',
    left: 'center',
    textStyle: {
      fontSize: 14
    },
    subtextStyle: {
      fontSize: 12
    }
  },

  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: true },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 4 }
    }
  },
  grid: {
    left: 50,
    right: 20,
    bottom: 20
  },
  xAxis: {
    type: 'category',
    data: [ ],
    axisTick: {
      alignWithLabel: true
    }
  },
  yAxis: {
    type: 'value'
  },
  legend: {
  //  show: ShowLegend,
    orient: 'horizontal',
    type: 'scroll',
    left: 'left',
    itemWidth: 20,
    itemHeight: 20,
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
        show: true
      },
      emphasis: {
        focus: 'series'
      },
      color: colorPalette[1],
      data: []
    },
    {
      name: 'Female',
      type: 'bar',
      stack: 'total',
      color: colorPalette[0],

      label: {
        show: true
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    },

  ]
}
 
export const  stackedbarOptions: EChartsOption = {
  title: {
    text: '',
    subtext: 'National Slum Database, 2023',
    left: 'center',
    textStyle: {
      fontSize: 14
    },
    subtextStyle: {
      fontSize: 12
    }
  },

  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: true },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 4 }
    }
  },
  grid: {
    left: 30,
    right: 30,
    bottom: 20
  },
  xAxis: {
    type: 'category',
    data: [],
    axisTick: {
      alignWithLabel: true
    }
  },
  yAxis: {
    type: 'value',
    position: 'right', // Position the y-axis labels on the right

  },
  legend: {
    //  show: ShowLegend,
      orient: 'vertical',
      type: 'scroll',
      left: 'left',
      itemWidth: 20,
      itemHeight: 20,
      
    },
 

  series: [
    {
      name: 'Male',
      type: 'bar',
      stack: 'total',
      label: {
        show: true
      },
      emphasis: {
        focus: 'series'
      },
      color: colorPalette[1],
      data: []
    },
    {
      name: 'Female',
      type: 'bar',
      stack: 'total',
      color: colorPalette[0],

      label: {
        show: true
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    },

  ]
}

export const  mapChartOptions: EChartsOption = {
  title: {
    text: 'map',
    subtext: 'National Slum Database, 2023',
    sublink: 'https://kisip.go.ke/',
    left: 'left',
    textStyle: {
      fontSize: 14
    },
  },
  tooltip: {
    trigger: 'item',
    showDelay: 0,
    transitionDuration: 0.2
  },
  visualMap: {
    left: 'right',
    min: 0,  // remeber to adjust max and min
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
    calculable: true
  },
  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: true },
      restore: { show: true },
      saveAsImage: { show: true, pixelRatio: 4 }
    }
  },
  series: [
    {
      name: '',
      type: 'map',
      roam: true,
      map: 'KE',
      aspectScale: 0.999, 
      emphasis: {
        label: {
          show: true
        }
      },
      data: []
    }
  ]
};

 

