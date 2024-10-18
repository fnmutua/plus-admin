<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElCollapse, ElCollapseItem, ElDivider, ElTabs, ElTabPane, ElProgress, ElSkeleton
} from 'element-plus'

import { pieOptions, barOptions, lineOptions } from './echarts-data'
import { ref, reactive } from 'vue'
import {
  getUserAccessSourceApi,
  getWeeklyUserActivityApi,
  getMonthlySalesApi
} from '@/api/dashboard/analysis'
import { set } from 'lodash-es'
import { EChartsOption } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'
import Income from './components/StatusCards/Summary.vue'
import { Echart } from '@/components/Echart'

import { getSummarybyField, getSummarybyFieldNested, getSummarybyFieldFromInclude, getSummarybyFieldSimple } from '@/api/summary'


import { use } from "echarts/core";
import { GaugeChart } from "echarts/charts";
import { computed } from 'vue'
import {    useAppStoreWithOut } from '@/store/modules/app'
 

use([
  GaugeChart
]);


const { t } = useI18n()

const loading = ref(true)
const colorPalette = ['#ff007f', '#0000ff'];  // Male-Female
const maleIcon = 'path://m 146.41936,238.8034 c -5.21101,-1.43402 -7.51545,-6.79358 -6.6619,-11.76943 -0.0588,-45.10952 -0.11757,-90.21905 -0.17635,-135.328563 -5.3022,-1.61412 -3.06375,4.34199 -3.52464,7.58816 -0.0576,14.697923 -0.11511,29.395843 -0.17266,44.093773 -1.72718,6.61806 -12.15586,7.45944 -14.19605,0.88682 -1.42909,-4.98857 -0.22146,-10.60033 -0.62062,-15.83232 0.10773,-15.18837 -0.21551,-30.437173 0.16059,-45.587893 1.91842,-11.228608 12.80383,-20.22421 24.26927,-18.689786 10.60777,1.558898 0.0755,-3.65768 -0.79236,-8.596161 -4.23852,-8.688715 0.80002,-20.073014 9.72708,-23.421847 8.82591,-4.162774 20.30103,1.001172 23.52581,10.108188 2.28945,5.67583 1.4368,12.853955 -2.76118,17.571486 -5.15831,4.024926 -3.94241,5.010805 1.85043,4.362909 13.58742,-1.603119 25.03585,11.840701 23.9554,24.967141 -0.0691,18.213333 -0.13818,36.426673 -0.20726,54.640013 -1.5351,4.55905 -7.30638,6.71543 -11.30858,3.96578 -4.81473,-2.8888 -2.73019,-9.20279 -3.19227,-13.88869 -0.0523,-14.05586 -0.10469,-28.11173 -0.15704,-42.167583 -4.85271,-1.54237 -3.37467,3.24601 -3.51022,6.4208 V 231.02616 c -1.3114,6.77368 -9.29063,10.3384 -15.13544,6.61747 -6.62075,-3.7866 -4.17124,-12.04397 -4.62011,-18.29166 v -70.84935 c -4.85175,-1.54283 -3.39102,3.24111 -3.53094,6.42079 -0.0578,25.5528 -0.11553,51.1056 -0.17329,76.65839 -1.7387,5.48439 -7.13811,8.77105 -12.74767,7.2216 z'
const femaleIcon = 'path://m 39.7122,238.0264 c -5.604205,-1.49359 -5.822698,-7.32898 -5.431108,-11.96235 -0.05932,-18.97406 -0.118632,-37.94813 -0.177948,-56.92219 -7.401109,0.0507 -14.802279,0.16954 -22.203547,0.1438 8.050221,-26.97466 15.83106,-54.03787 24.0791,-80.948455 -6.246873,-1.537447 -5.103818,6.332986 -7.12857,10.198179 -4.203419,12.783656 -7.28462,25.995046 -12.31951,38.467156 C 6.215777,147.43407 -0.93895389,129.58252 6.2279437,121.52707 11.709639,105.71684 15.006783,88.999576 22.521999,73.9779 25.487431,65.143259 38.425956,64.174487 43.879817,63.247984 35.242261,58.307767 32.195248,46.181151 37.843175,37.985287 c 5.35176,-7.73122 16.727442,-10.988636 24.757146,-5.16531 11.321083,6.562216 10.452089,25.024381 -1.135269,30.670395 9.830628,-0.28155 20.086569,3.623662 24.845207,12.765524 3.87086,7.45858 5.12438,16.169298 8.137928,24.037484 2.906124,10.26421 6.922833,20.35157 9.297803,30.70045 1.06345,4.17564 -1.66552,9.02385 -6.181687,9.2796 -7.686885,1.11419 -8.783192,-8.80355 -10.70406,-14.18732 -3.87502,-12.5653 -7.681429,-25.15172 -11.575988,-37.711005 -8.798872,-0.113812 1.949333,13.898795 1.781574,19.941085 6.048408,20.20812 12.13493,40.40517 18.089502,60.64114 -7.392371,0.35953 -14.803078,0.14681 -22.203496,0.20388 -0.06597,21.22546 -0.131933,42.45093 -0.1979,63.67639 -2.103142,7.13406 -13.415648,7.74398 -15.969932,0.84281 -1.418088,-4.77754 -0.245017,-10.18282 -0.655178,-15.20454 l -0.156843,-49.31466 c -4.44248,-1.05339 -5.844521,0.93365 -4.913879,5.25338 -0.162881,19.18788 0.325808,38.44483 -0.244801,57.58947 -0.334387,5.03435 -6.719798,7.8699 -11.101102,6.02234 z'


const appStore = useAppStoreWithOut()

// initialize with long titles
const AccesTohealthTitle = ref("Access to Health Care Facility by Gender")
const AccesTohealthPrimarcyFacilityTitle = ref("Residents with a usual place to go for medical care")
const ShowLegend = ref(true)

const PopByGenderTitle = ref("Population by Gender")
const RentPayableTitle = ref("Rent Payable")
const EmploymentTitle = ref("Employment Status")
const StructureOwnershipAgeTitle = ref("Structure Ownership by Age")
const StructureOwnershipGenderTitle = ref("Structure Ownership by Gender")
const EducationGenderTitle = ref("Education Status by Gender")
const EducationSecPlusTitle = ref("Residents with Secondary Education and above")
const SanitationByGenderTitle = ref("Sanitation Status by Gender")
const SafelyMangedSanitationByGenderTitle = ref("Access to Safely Managed Sanitation")
const AccesstoWaterByGenderTitle = ref("Access to Water by Gender")
const AccesstoSafeWaterByGenderTitle = ref("Access to Safely Drinking Water")


// Check whether user screen is mobile 
const isMobile = computed(() => appStore.getMobile)

console.log('isMobile', isMobile.value)

if (isMobile.value) {
  // use shorter chart titles for mobile and longer ones for large screens

  AccesTohealthTitle.value = "Access to Health Care"
  AccesTohealthPrimarcyFacilityTitle.value = "Access to a HCF"
  PopByGenderTitle.value = "Population"
  RentPayableTitle.value = "Rent"
  EmploymentTitle.value = "Employment"
  StructureOwnershipAgeTitle.value = "Struct.Owner(age)"
  StructureOwnershipGenderTitle.value = "Struct.Owner(M/F)"
  EducationGenderTitle.value = "Education(M/F)"
  EducationSecPlusTitle.value = "Secondary Certificate+"
  SanitationByGenderTitle.value = "Sanitation(M/F)"
  SafelyMangedSanitationByGenderTitle.value = "Safely Managed Sanitation"
  AccesstoWaterByGenderTitle.value = "Access to Water(M/F)"
  AccesstoSafeWaterByGenderTitle.value = "Access to Safe Water"
  ShowLegend.value = false

}










const pieOptionsData = reactive<EChartsOption>(pieOptions) as EChartsOption

// 用户来源
const getUserAccessSource = async () => {
  const res = await getUserAccessSourceApi().catch(() => { })
  if (res) {
    set(
      pieOptionsData,
      'legend.data',
      res.data.map((v) => t(v.name))
    )
    pieOptionsData!.series![0].data = res.data.map((v) => {
      return {
        name: t(v.name),
        value: v.value
      }
    })
  }
}


function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}



const getAverageIncome = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'income_level'
  formData.summaryFunction = 'count'
  formData.groupField = ['income_level']
  formData.cache_key = 'getAverageIncome'




  const income_levels = await getSummarybyField(formData)
  // console.log('income_levels---->', income_levels)

}






///////--- Health------------

const stackedHealthBygender = ref()
const healthGauge = ref()


const getAccessTohealth = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryFunction = 'count'

  formData.cache_key = 'getAccessTohealth'

  // segregated by the settlement and county// Linking to be done later//
  formData.summaryField = 'access_health'
  formData.groupField = ['access_health', 'gender']



  let clabels = []
  let subCategories = []
  var cData = []
  var maleData = []
  var femaleData = []


  // Directbeneficisaries 
  await getSummarybyField(formData)
    .then(response => {
      var results = response.Total
      console.log("ownership by gender ---->", results)

      //create the subcategories 
      results.forEach(function (item) {
        if (!clabels.includes(item.name)) {
          clabels.push(item.name);
        }
        if (!subCategories.includes(item.access_health)) {
          subCategories.push(item.access_health)
        }
      });
      // console.log('clabels....', clabels)

      //create data by gender
      results.forEach(function (dt) {
        if (dt.gender === 'Male') {
          console.log(dt)
          maleData.push(parseInt(dt.count))
        } else {
          femaleData.push(parseInt(dt.count))
        }
      })

      //create data by gender
      let someAccess = []
      let allLevels = []

      results.forEach(function (dt) {
        allLevels.push(parseInt(dt.count))
        if (dt.access_health != 'chemist' && dt.access_health != 'traditional' && dt.access_health != 'other') {
          console.log(dt.access_health)
          someAccess.push(parseInt(dt.count))
        }
      })

      // stacked Education 
      stackedHealthBygender.value = {
        title: {
          text: AccesTohealthTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },

        tooltip: {
          trigger: 'axis',

          axisPointer: {
            // Use axis to trigger tooltip
            type: 'line' // 'shadow' as default; can also be 'line' or 'shadow'
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
        legend: {
          show: ShowLegend,
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
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          data: subCategories

        },
        yAxis: {
          type: 'value'

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
            data: maleData
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
            data: femaleData
          },

        ]
      };


      let totalHH = allLevels.reduce((a, b) => a + b, 0)
      let totalSomeAccess = someAccess.reduce((a, b) => a + b, 0)
      let propAccess = 100 * totalSomeAccess / totalHH

      // Gauge bar 



      healthGauge.value = {
        title: {
          text: AccesTohealthPrimarcyFacilityTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            type: 'gauge',
            axisLine: {
              lineStyle: {
                width: 30,
                color: [
                  [0.3, '#fd666d'],
                  [0.7, '#37a2da '],
                  [1, '#00ff00']

                ]
              }
            },
            pointer: {
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              distance: -30,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 2
              }
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                color: '#fff',
                width: 4
              }
            },
            axisLabel: {
              color: 'auto',
              distance: 40,
              fontSize: 12
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              offsetCenter: [0, '90%'],
              color: 'auto'
            },
            data: [
              {
                value: Math.round(propAccess)
              }
            ]
          }
        ]
      };
    });





}

///////---Gender------------

//----------pie-----------
const gender_chartOptions = ref()
const gender_series = ref()
const echartOptionsGender = ref()
const getGender = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'gender'
  formData.summaryFunction = 'count'
  formData.groupField = ['gender']
  formData.cache_key = 'getgender'

  let categories = []
  let series = []

  let seriesData = []

  getSummarybyField(formData)
    .then(response => {
      var results = response.Total

      console.log('Gender---', results)
      results.forEach(function (item) {
        let pieObjectEchart = {}
        let lbl = toTitleCase(item.gender.replace("_", " "))
        categories.push(lbl)
        series.push(parseInt(item.count)) // very critcal eles wont display on the graph

        // for eacharts
        pieObjectEchart.value = parseInt(item.count)
        pieObjectEchart.name = lbl
        seriesData.push(pieObjectEchart)


      });
      //    console.log('----------', categories, series)
      gender_chartOptions.value = {
        chart: {
          type: 'pie',
          toolbar: {
            show: true,
            offsetX: 0,
            offsetY: 0,
            tools: {
              download: true,
              selection: true,
              zoom: true,
              zoomin: true,
              zoomout: true,
              pan: true,

            },
            export: {
              csv: {
                filename: undefined,
              },
              svg: {
                filename: undefined,
              },
              png: {
                filename: undefined,
              }
            },
            autoSelected: 'zoom'
          }
        },
        title: {
          text: PopByGenderTitle,
          align: 'center'
        },
        subtitle: {
          text:  `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          align: 'center'
        },
        dataLabels: {
          enabled: true
        },
        legend: {
          position: 'bottom'
        },
        labels: categories,
        responsive: [
          {
            breakpoint: 1000,
            options: {
              plotOptions: {
                bar: {
                  horizontal: false
                }
              },
              legend: {
                show: ShowLegend,

                position: "bottom"
              }
            }
          }
        ]
      }
      gender_series.value = series
    });

  echartOptionsGender.value = {
    title: {
      text: PopByGenderTitle,
          subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
      left: 'center',
      textStyle: {
        fontSize: 14
      },
      subtextStyle: {
        fontSize: 12
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'

    },
    selectedMode: true,

    toolbox: {
      show: true,
      feature: {
        mark: { show: true },
        dataView: { show: true, readOnly: false },
        restore: { show: true },
        saveAsImage: { show: true, pixelRatio: 4 }
      }
    },
    legend: {
      orient: 'horizontal',
      type: 'scroll',
      bottom: 10,
      show: ShowLegend,

    },
    series: [
      {
        name: 'Proportion',
        type: 'pie',
        color: colorPalette,

        data: seriesData,
        radius: '70%',
        center: ['50%', '50%'],
        roseType: 'area',

        itemStyle: {
          borderRadius: 1,
          borderColor: '#fff',
          borderWidth: 1
        },
      }
    ]
  };



}



///////---Rent------------

const rentEchart = ref()
const getRent = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'rent_payable'
  formData.summaryFunction = 'count'
  formData.groupField = ['rent_payable']
  formData.cache_key = 'getrent'

  let categories = []
  let series = []
  let seriesData = []

  getSummarybyField(formData)
    .then(response => {
      var results = response.Total
      results.forEach(function (item) {
        let pieObjectEchart = {}
        if (item.rent_payable) {
          let lbl = toTitleCase(item.rent_payable.replace("_", "-"))
          categories.push(lbl)
          series.push(parseInt(item.count)) // very critcal eles wont display on the graph
          // for eacharts
          pieObjectEchart.value = parseInt(item.count)
          pieObjectEchart.name = lbl
          seriesData.push(pieObjectEchart)
        }


      });


    });

  rentEchart.value = {
    title: {
      text: RentPayableTitle,
          subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
      left: 'center',
      textStyle: {
        fontSize: 14
      },
      subtextStyle: {
        fontSize: 12
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'

    },
    selectedMode: true,

    toolbox: {
      show: true,
      feature: {
        mark: { show: true },
        dataView: { show: true, readOnly: false },
        restore: { show: true },
        saveAsImage: { show: true, pixelRatio: 4 }
      }
    },
    legend: {
      orient: 'horizontal',
      type: 'scroll',
      left: 'left',

      bottom: 10,
      textStyle: {
        fontSize: 10
      },
    },
    series: [
      {
        name: 'Proportion',
        type: 'pie',

        data: seriesData,
        radius: ['20%', '70%'],
        roseType: 'area',

        itemStyle: {
          borderRadius: 1,
          borderColor: '#fff',
          borderWidth: 1
        },
      }
    ]
  };
}



///////---Employments------------

const employment_chartOptions = ref()
const getEmployment = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'emp_status'
  formData.summaryFunction = 'count'
  formData.groupField = ['emp_status']
  formData.cache_key = 'getEmploymentStatus'


  let series = []

  getSummarybyField(formData)
    .then(response => {
      var results = response.Total
      console.log("employment_chartOptions", results)
      results.forEach(function (item) {
        let pieObjectEchart = {}
        if (item.emp_status) {
          let lbl = toTitleCase(item.emp_status.replace("_", "-"))
          pieObjectEchart.value = parseInt(item.count)
          pieObjectEchart.name = lbl
          series.push(pieObjectEchart)
        }

      });

      employment_chartOptions.value = {
        title: {
          text: EmploymentTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'

        },
        selectedMode: true,

        toolbox: {
          show: true,
          feature: {
            mark: { show: true },
            dataView: { show: true, readOnly: false },
            restore: { show: true },
            saveAsImage: { show: true, pixelRatio: 4 }
          }
        },
        legend: {
          orient: 'horizontal',
          type: 'scroll',
          bottom: 10,
          textStyle: {
            fontSize: 10
          },
        },

        series: [
          {
            name: 'Proportion',
            type: 'pie',

            data: series,
            radius: ['20%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 5,
              borderColor: '#fff',
              borderWidth: 1
            },

          }
        ]
      };
    });


}

///////--- Tenure------------
const tenure_chartOptions = ref()
const getOwnershipStatus = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'age_plot_owner'
  formData.summaryFunction = 'count'
  formData.groupField = ['age_plot_owner']
  formData.cache_key = 'getOwnershipStatus'


  let series = []

  getSummarybyField(formData)
    .then(response => {
      console.log('age_plot_owner', response)

      var results = response.Total
      results.forEach(function (item) {
        let pieObjectEchart = {}
        let lbl = toTitleCase(item.age_plot_owner.replace("_", "-"))
        //  categories.push(lbl)
        // series.push(parseInt(item.count)) // very critcal eles wont display on the graph

        // for eacharts
        pieObjectEchart.value = parseInt(item.count)
        pieObjectEchart.name = lbl
        series.push(pieObjectEchart)
      });

      stackedOwnershipByAge.value = {
        title: {
          text: StructureOwnershipAgeTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'

        },
        selectedMode: true,

        toolbox: {
          show: true,
          feature: {
            mark: { show: true },
            dataView: { show: true, readOnly: false },
            restore: { show: true },
            saveAsImage: { show: true, pixelRatio: 4 }
          }
        },
        legend: {
          orient: 'horizontal',
          type: 'scroll',
          bottom: 10,
          textStyle: {
            fontSize: 10
          },
        },

        series: [
          {
            name: 'Proportion',
            type: 'pie',

            data: series,
            radius: ['20%', '67%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 5,
              borderColor: '#fff',
              borderWidth: 1
            },

          }
        ]
      };
    });


}


const stackedOwnershipBygender = ref()
const stackedOwnershipByAge = ref()

const getOwnershipStatusByGender = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryFunction = 'count'

  formData.cache_key = 'getOwnershipStatusByGender'

  // segregated by the settlement and county// Linking to be done later//
  formData.summaryField = 'owner_tenant'
  formData.groupField = ['owner_tenant', 'gender']



  let clabels = []
  let subCategories = []
  var cData = []
  var maleData = []
  var femaleData = []


  // Directbeneficisaries 
  await getSummarybyField(formData)
    .then(response => {
      var results = response.Total
      console.log("ownership by gender ---->", results)
      results.forEach(function (item) {
        if (!clabels.includes(item.name)) {
          clabels.push(item.name);
        }
        if (!subCategories.includes(item.owner_tenant)) {
          subCategories.push(item.owner_tenant)
        }
      });
      // console.log('clabels....', clabels)


      results.forEach(function (dt) {
        if (dt.gender === 'Male') {
          console.log(dt)
          maleData.push(parseInt(dt.count))
        } else {
          femaleData.push(parseInt(dt.count))

        }
      })



      console.log('maleData', maleData)
      console.log('femaleData', femaleData)

      stackedOwnershipBygender.value = {
        title: {
          text: StructureOwnershipGenderTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },

        tooltip: {
          trigger: 'axis',

          axisPointer: {
            // Use axis to trigger tooltip
            type: 'line' // 'shadow' as default; can also be 'line' or 'shadow'
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
        legend: {
          show: ShowLegend,

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
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          data: subCategories

        },
        yAxis: {
          type: 'value'

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
            data: maleData
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
            data: femaleData
          },

        ]
      };

    });





}
const stackedEducationBygender = ref()
const educationGauge = ref()


const getEducationByGender = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryFunction = 'count'
  formData.cache_key = 'getEducationByGender'


  // segregated by the settlement and county// Linking to be done later//
  formData.summaryField = 'education_level'
  formData.groupField = ['education_level', 'gender']



  let clabels = []
  let subCategories = []
  var cData = []
  var maleData = []
  var femaleData = []


  // Directbeneficisaries 
  await getSummarybyField(formData)
    .then(response => {
      var results = response.Total
      console.log("ownership by gender ---->", results)

      //create the subcategories 
      results.forEach(function (item) {
        if (!clabels.includes(item.name)) {
          clabels.push(item.name);
        }
        if (!subCategories.includes(item.education_level)) {
          subCategories.push(item.education_level)
        }
      });
      // console.log('clabels....', clabels)

      //create data by gender
      results.forEach(function (dt) {
        if (dt.gender === 'Male') {
          console.log(dt)
          maleData.push(parseInt(dt.count))
        } else {
          femaleData.push(parseInt(dt.count))
        }
      })

      //create data by gender
      let atleastSecondarylevel = []
      let allLevels = []

      results.forEach(function (dt) {
        allLevels.push(parseInt(dt.count))
        if (dt.education_level != 'primary' && dt.education_level != 'none') {
          console.log(dt.education_level)
          atleastSecondarylevel.push(parseInt(dt.count))
        }
      })

      // stacked Education 
      stackedEducationBygender.value = {
        title: {
          text: EducationGenderTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },

        tooltip: {
          trigger: 'axis',

          axisPointer: {
            // Use axis to trigger tooltip
            type: 'line' // 'shadow' as default; can also be 'line' or 'shadow'
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
        legend: {
          orient: 'horizontal',
          show: ShowLegend,

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
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          data: subCategories

        },
        yAxis: {
          type: 'value'

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
            data: maleData
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
            data: femaleData
          },

        ]
      };


      let totalHH = allLevels.reduce((a, b) => a + b, 0)
      let totalSeclevelAbove = atleastSecondarylevel.reduce((a, b) => a + b, 0)
      let propSeclevelAbove = 100 * totalSeclevelAbove / totalHH

      // Gauge bar 
      educationGauge.value = {
        title: {
          text: EducationSecPlusTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },

        series: [
          {
            type: 'gauge',
            progress: {
              show: true,
              width: 24
            },
            axisLine: {
              lineStyle: {
                width: 24,
                color: [
                  [0.25, '#67e0e3'],
                  [0.8, '#1bf2a8'],
                  [1, '#1bf2a8']
                ]
              }
            },
            axisTick: {
              show: true
            },
            splitLine: {
              length: 15,
              lineStyle: {
                width: 2,
                color: '#999'
              }
            },
            axisLabel: {
              distance: 25,
              color: '#999',
              fontSize: 12
            },
            anchor: {
              show: true,
              showAbove: true,
              size: 25,
              itemStyle: {
                borderWidth: 10
              }
            },
            title: {
              show: false
            },
            detail: {
              valueAnimation: true,
              fontSize: 45,
              formatter: '{value}%',

              offsetCenter: [0, '99%']
            },
            data: [
              {
                value: Math.round(propSeclevelAbove)
              }
            ]
          }
        ]
      };
    });





}
const stackedSanitationBygender = ref()
const SanitationGauge = ref()

const getSanitation = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryFunction = 'count'

  formData.cache_key = 'getSanitation'

  // segregated by the settlement and county// Linking to be done later//
  formData.summaryField = 'sanitation'
  formData.groupField = ['sanitation', 'gender']



  let clabels = []
  let subCategories = []
  var cData = []
  var maleData = []
  var femaleData = []


  // Directbeneficisaries 
  await getSummarybyField(formData)
    .then(response => {
      var results = response.Total
      console.log("sanitation by gender ---->", results)

      //create the subcategories 
      results.forEach(function (item) {
        if (!clabels.includes(item.name)) {
          clabels.push(item.name);
        }
        if (!subCategories.includes(item.sanitation)) {
          subCategories.push(item.sanitation)
        }
      });
      // console.log('clabels....', clabels)

      //create data by gender
      results.forEach(function (dt) {
        if (dt.gender === 'Male') {
          console.log(dt)
          maleData.push(parseInt(dt.count))
        } else {
          femaleData.push(parseInt(dt.count))
        }
      })

      //create data by gender
      let safelyManaged = []
      let allLevels = []

      results.forEach(function (dt) {
        allLevels.push(parseInt(dt.count))
        if (dt.sanitation == 'flush' && dt.sanitation == 'VIP') {
          console.log(dt.sanitation)
          safelyManaged.push(parseInt(dt.count))
        }
      })

      // stacked   
      stackedSanitationBygender.value = {
        title: {
          text: SanitationByGenderTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },

        tooltip: {
          trigger: 'axis',

          axisPointer: {
            // Use axis to trigger tooltip
            type: 'line' // 'shadow' as default; can also be 'line' or 'shadow'
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
        legend: {
          orient: 'horizontal',
          show: ShowLegend,

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
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          data: subCategories

        },
        yAxis: {
          type: 'value'

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
            data: maleData
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
            data: femaleData
          },

        ]
      };


      let totalHH = allLevels.reduce((a, b) => a + b, 0)
      let safe = safelyManaged.reduce((a, b) => a + b, 0)
      let prop_safely_managed = 100 * safe / totalHH

      console.log("Safely Managed")

      SanitationGauge.value = {
        title: {
          text: SafelyMangedSanitationByGenderTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            type: 'gauge',
            axisLine: {
              lineStyle: {
                width: 30,
                color: [
                  [0.3, '#fd666d'],
                  [0.7, '#37a2da '],
                  [1, '#00ff00']

                ]
              }
            },
            pointer: {
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              distance: -30,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 2
              }
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                color: '#fff',
                width: 4
              }
            },
            axisLabel: {
              color: 'auto',
              distance: 40,
              fontSize: 12
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              offsetCenter: [0, '90%'],
              color: 'auto'
            },
            data: [
              {
                value: Math.round(prop_safely_managed)
              }
            ]
          }
        ]
      };

    });





}




const stackedWaterBygender = ref()
const waterGauge = ref()

const getWater = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryFunction = 'count'

  formData.cache_key = 'getWater'

  // segregated by the settlement and county// Linking to be done later//
  formData.summaryField = 'source_water'
  formData.groupField = ['source_water', 'gender']



  let clabels = []
  let subCategories = []
  var cData = []
  var maleData = []
  var femaleData = []


  // Directbeneficisaries 
  await getSummarybyField(formData)
    .then(response => {
      var results = response.Total
      console.log("source_water by gender ---->", results)

      //create the subcategories 
      results.forEach(function (item) {
        if (!clabels.includes(item.name)) {
          clabels.push(item.name);
        }
        if (!subCategories.includes(item.source_water)) {
          subCategories.push(item.source_water)
        }
      });
      // console.log('clabels....', clabels)

      //create data by gender
      results.forEach(function (dt) {
        if (dt.gender === 'Male') {
          console.log(dt)
          maleData.push(parseInt(dt.count))
        } else {
          femaleData.push(parseInt(dt.count))
        }
      })

      //create data by gender
      let safelyManagedWater = []
      let allLevels = []

      results.forEach(function (dt) {
        allLevels.push(parseInt(dt.count))
        if (dt.source_water === 'piped') {
          console.log(dt.source_water)
          safelyManagedWater.push(parseInt(dt.count))
        }
      })

      // stacked Education 
      stackedWaterBygender.value = {
        title: {
          text: AccesstoWaterByGenderTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },

        tooltip: {
          trigger: 'axis',

          axisPointer: {
            // Use axis to trigger tooltip
            type: 'line' // 'shadow' as default; can also be 'line' or 'shadow'
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
        legend: {
          orient: 'horizontal',
          show: ShowLegend,

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
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          data: subCategories

        },
        yAxis: {
          type: 'value'

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
            data: maleData
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
            data: femaleData
          },

        ]
      };


      let totalHH = allLevels.reduce((a, b) => a + b, 0)
      let safe = safelyManagedWater.reduce((a, b) => a + b, 0)
      let prop_safely_managed = 100 * safe / totalHH



      waterGauge.value = {
        title: {
          text: AccesstoSafeWaterByGenderTitle,
              subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            type: 'gauge',
            axisLine: {
              lineStyle: {
                width: 30,
                color: [
                  [0.3, '#fd666d'],
                  [0.7, '#37a2da '],
                  [1, '#00ff00']

                ]
              }
            },
            pointer: {
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              distance: -30,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 2
              }
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                color: '#fff',
                width: 4
              }
            },
            axisLabel: {
              color: 'auto',
              distance: 40,
              fontSize: 12
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              offsetCenter: [0, '90%'],
              color: 'auto'
            },
            data: [
              {
                value: Math.round(prop_safely_managed)
              }
            ]
          }
        ]
      };

    });





}



///////--- Transport------------
const transport = ref([])
const getTransport = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'mode_transport'
  formData.summaryFunction = 'count'
  formData.cache_key = 'getTransport'

  formData.groupField = ['mode_transport']
  transport.value = await getSummarybyField(formData)
  //  console.log('transport---->', transport.value)
}



///////--- Solid Waste------------
const solid_waste = ref([])
const getSolidWaste = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'solid_waste'
  formData.summaryFunction = 'count'
 // formData.cache_key = 'getSolidWaste'

  formData.groupField = ['solid_waste']
  solid_waste.value = await getSummarybyField(formData)
  //  console.log('solid_waste---->', solid_waste.value)
}




const getAllApi = async () => {
  await Promise.all([
    getUserAccessSource(),
    getAverageIncome(),
    getRent(),
    getEmployment(),
    getGender(),
    getWater(),
    getSanitation(),
    getTransport(),
    //getAccessTohealth(),
    getAccessTohealth(),
    getSolidWaste(),
    getOwnershipStatus(),
    getOwnershipStatusByGender(),
    getEducationByGender()
  ])
  loading.value = false
}

getAllApi()




const activeName = ref('summary')

</script>

<template>
  <Income />
  <el-tabs
v-loading="loading" element-loading-text="Generating maps, charts and tables......." v-model="activeName"
    class="demo-tabs">
    <el-tab-pane label="Summary" name="summary">
      <ElRow :gutter="20" justify="space-between">
        <ElCol :xl="12" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="echartOptionsGender" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>

        <ElCol :xl="12" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="rentEchart" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>

        <ElCol :xl="12" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="employment_chartOptions" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>

    <el-tab-pane label="Structure Ownership" name="tenure">
      <ElRow :gutter="20" justify="space-between">
        <ElCol :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="stackedOwnershipBygender" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>



        <ElCol :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="stackedOwnershipByAge" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>
    <el-tab-pane label="Health" name="health">
      <ElRow class="mt-10px" :gutter="10" justify="space-between">
        <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="always" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="healthGauge" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>
        <ElCol :xl="8" :lg="16" :md="24" :sm="24" :xs="24">
          <ElCard shadow="always" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
              <Echart :options="stackedHealthBygender" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>

    <el-tab-pane label="Water" name="water">
      <ElRow class="mt-20px" :gutter="20" justify="space-between">
        <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="always" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="waterGauge" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>

        <ElCol :xl="8" :lg="16" :md="24" :sm="24" :xs="24">
          <ElCard shadow="always" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="stackedWaterBygender" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>

    <el-tab-pane label="Sanitation" name="sanitation">
      <ElRow class="mt-20px" :gutter="20" justify="space-between">
        <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="always" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="SanitationGauge" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>

        <ElCol :xl="8" :lg="16" :md="24" :sm="24" :xs="24">
          <ElCard shadow="always" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="stackedSanitationBygender" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>

    <el-tab-pane label="Education" name="education">
      <ElRow class="mt-20px" :gutter="20" justify="space-between">
        <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="always" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="educationGauge" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>


        <ElCol :xl="8" :lg="16" :md="24" :sm="24" :xs="24">
          <ElCard shadow="always" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="stackedEducationBygender" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>
  </el-tabs>

</template>

<style>
.myDiv {
  text-align: center;
  padding-left: 10px;
}
</style>

<style scoped>
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}

.demo-progress .el-progress--line {
  margin-bottom: 15px;
  width: 350px;
}

.demo-progress .el-progress--circle {
  margin-right: 15px;
}
</style>