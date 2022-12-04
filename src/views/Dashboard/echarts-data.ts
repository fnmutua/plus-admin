import { EChartsOption } from 'echarts'
import { EChartsOption as EChartsWordOption } from 'echarts-wordcloud'
import { useI18n } from '@/hooks/web/useI18n'
import 'echarts/lib/component/toolbox'
import { getSummarybyField, getSummarybyFieldNested } from '@/api/summary'

const { t } = useI18n()

export const lineOptions: EChartsOption = {
  title: {
    text: t('analysis.monthlySales'),
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

export const pieOptions: EChartsOption = {
  title: {
    text: t('analysis.userAccessSource'),
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    data: [
      t('analysis.directAccess'),
      t('analysis.mailMarketing'),
      t('analysis.allianceAdvertising'),
      t('analysis.videoAdvertising'),
      t('analysis.searchEngines')
    ]
  },
  series: [
    {
      name: t('analysis.userAccessSource'),
      type: 'pie',
      radius: '55%',
      center: ['50%', '60%'],
      data: [
        { value: 335, name: t('analysis.directAccess') },
        { value: 310, name: t('analysis.mailMarketing') },
        { value: 234, name: t('analysis.allianceAdvertising') },
        { value: 135, name: t('analysis.videoAdvertising') },
        { value: 1548, name: t('analysis.searchEngines') }
      ]
    }
  ]
}
export const waterOptions: EChartsOption = {
  title: {
    text: t('Access to Water'),
    subtext: 'Average for all Slums in Kenya',
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    data: [t('Piped Water'), t('Water Points'), t('Mobile Sources'), t('Kiosk'), t('No Access')]
  },
  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: true },
      restore: { show: true },
      saveAsImage: { show: true }
    }
  },
  series: [
    {
      name: t('Access to Water'),
      type: 'pie',
      radius: '70%',
      center: ['50%', '60%'],
      roseType: 'area',

      data: [
        { value: 40000, name: t('Piped Water') },
        { value: 18000, name: t('Water Points') },
        { value: 24790, name: t('Mobile Sources') },
        { value: 72000, name: t('Kiosk') },
        { value: 70000, name: t('No Access') }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
}

export const housingOptions: EChartsOption = {
  title: {
    text: t('Access to Housing'),
    subtext: 'Average for all Slums in Kenya',
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    data: [t('Owned'), t('Rent')]
  },
  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: true },
      restore: { show: true },
      saveAsImage: { show: true }
    }
  },
  series: [
    {
      name: t('Access to Housing'),
      type: 'pie',
      radius: '70%',
      center: ['50%', '60%'],
      roseType: 'area',

      data: [
        { value: 150000, name: t('Owned') },
        { value: 74790, name: t('Rent') }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
}

export const SlumsPerCountyChart: EChartsOption = {
  title: {
    text: t('Slums Per County'),
    subtext: 'National Mapping of Slums, 2022',
    left: 'center'
  },
  tooltip: {
    trigger: 'item'
  },

  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: true },
      restore: { show: true },
      saveAsImage: { show: true }
    }
  },
  xAxis: {
    type: 'category',
    data: [
      'Embu',
      'Nyeri',
      'Samburu',
      'Bungoma',
      'Trans Nzoia',
      'Elgeyo Marakwet',
      'Tana River',
      'Meru',
      'Kirinyaga',
      'Kericho',
      'Taita Taveta',
      'Tharaka Nithi',
      'Makueni',
      'Nairobi',
      'West Pokot',
      'Siaya',
      'Lamu',
      'Bomet',
      'Homabay',
      'Kwale',
      'Mandera',
      'Laikipia',
      'Baringo',
      'Nyamira',
      'Nandi',
      'Narok',
      'Nakuru',
      'Mombasa',
      'Migori',
      'Kiambu',
      'Uasin Gishu',
      "Murang'A",
      'Kilifi',
      'Marsabit',
      'Wajir',
      'Machakos',
      'Kitui',
      'Kajiado',
      'Nyandarua',
      'Isiolo',
      'Turkana',
      'Busia',
      'Vihiga',
      'Garissa',
      'Kisii',
      'Kisumu'
    ]
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [
        7, 9, 12, 4, 9, 7, 4, 4, 24, 3, 7, 4, 6, 148, 8, 2, 13, 1, 11, 2, 4, 13, 8, 1, 4, 2, 20, 99,
        14, 18, 14, 1, 10, 7, 2, 8, 5, 7, 3, 7, 17, 1, 9, 5, 1, 7
      ],
      type: 'bar',
      showBackground: false,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)'
      }
    }
  ]
}

export const topCountiesWithSlums: EChartsOption = {
  title: {
    text: t('Counties With highest Number of Slums'),
    subtext: 'National Mapping of Slums, 2022',
    left: 'center'
  },
  tooltip: {
    trigger: 'item'
  },

  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: true },
      restore: { show: true },
      saveAsImage: { show: true }
    }
  },
  darkMode: true,
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    boundaryGap: [0, 0.01]
  },
  yAxis: {
    type: 'category',
    data: [
      'Nairobi',
      'Mombasa',
      'Kirinyaga',
      'Nakuru',
      'Kiambu',
      'Turkana',
      'Migori',
      'Uasin Gishu',
      'Lamu',
      'Laikipia'
    ]
  },
  series: [
    {
      data: [148, 99, 24, 20, 18, 17, 14, 14, 13, 13],
      type: 'bar'
    }
  ]
}

export const barOptions: EChartsOption = {
  title: {
    text: t('analysis.weeklyUserActivity'),
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
    data: [
      t('analysis.monday'),
      t('analysis.tuesday'),
      t('analysis.wednesday'),
      t('analysis.thursday'),
      t('analysis.friday'),
      t('analysis.saturday'),
      t('analysis.sunday')
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
      name: t('analysis.activeQuantity'),
      data: [13253, 34235, 26321, 12340, 24643, 1322, 1324],
      type: 'bar'
    }
  ]
}

export const radarOption: EChartsOption = {
  legend: {
    data: [t('workplace.personal'), t('workplace.team')]
  },
  radar: {
    // shape: 'circle',
    indicator: [
      { name: t('workplace.quote'), max: 65 },
      { name: t('workplace.contribution'), max: 160 },
      { name: t('workplace.hot'), max: 300 },
      { name: t('workplace.yield'), max: 130 },
      { name: t('workplace.follow'), max: 100 }
    ]
  },
  series: [
    {
      name: `xxx${t('workplace.index')}`,
      type: 'radar',
      data: [
        {
          value: [42, 30, 20, 35, 80],
          name: t('workplace.personal')
        },
        {
          value: [50, 140, 290, 100, 90],
          name: t('workplace.team')
        }
      ]
    }
  ]
}

export const wordOptions: EChartsWordOption = {
  series: [
    {
      type: 'wordCloud',
      gridSize: 2,
      sizeRange: [12, 50],
      rotationRange: [-90, 90],
      shape: 'pentagon',
      width: 600,
      height: 400,
      drawOutOfBound: true,
      textStyle: {
        color: function () {
          return (
            'rgb(' +
            [
              Math.round(Math.random() * 160),
              Math.round(Math.random() * 160),
              Math.round(Math.random() * 160)
            ].join(',') +
            ')'
          )
        }
      },
      emphasis: {
        textStyle: {
          shadowBlur: 10,
          shadowColor: '#333'
        }
      },
      data: [
        {
          name: 'Sam S Club',
          value: 10000,
          textStyle: {
            color: 'black'
          },
          emphasis: {
            textStyle: {
              color: 'red'
            }
          }
        },
        {
          name: 'Macys',
          value: 6181
        },
        {
          name: 'Amy Schumer',
          value: 4386
        },
        {
          name: 'Jurassic World',
          value: 4055
        },
        {
          name: 'Charter Communications',
          value: 2467
        },
        {
          name: 'Chick Fil A',
          value: 2244
        },
        {
          name: 'Planet Fitness',
          value: 1898
        },
        {
          name: 'Pitch Perfect',
          value: 1484
        },
        {
          name: 'Express',
          value: 1112
        },
        {
          name: 'Home',
          value: 965
        },
        {
          name: 'Johnny Depp',
          value: 847
        },
        {
          name: 'Lena Dunham',
          value: 582
        },
        {
          name: 'Lewis Hamilton',
          value: 555
        },
        {
          name: 'KXAN',
          value: 550
        },
        {
          name: 'Mary Ellen Mark',
          value: 462
        },
        {
          name: 'Farrah Abraham',
          value: 366
        },
        {
          name: 'Rita Ora',
          value: 360
        },
        {
          name: 'Serena Williams',
          value: 282
        },
        {
          name: 'NCAA baseball tournament',
          value: 273
        },
        {
          name: 'Point Break',
          value: 265
        }
      ]
    }
  ]
}
