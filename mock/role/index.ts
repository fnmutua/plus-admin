import { config } from '@/config/axios/config'
import { MockMethod } from 'vite-plugin-mock'
import { Layout, getParentLayout } from '@/utils/routerHelper'

const { result_code } = config

const timeout = 1000

 
const adminList = [
  {
    path: '/dashboard',
    component: '#',
    redirect: '/dashboard/national',
    name: 'Dashboard',
    meta: {
      title: 'Dashboards',
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'national',
        component: 'views/Dashboard/National',
        name: 'National',
        meta: {
          title: 'Overview',
          noCache: true
        }
      },
      {
        path: 'status',
        component: 'views/Dashboard/CurrentSlumStatus',
        name: 'Status',
        meta: {
          title: 'Status',
          noCache: true
        }
      },
      {
        path: 'map',
        component: 'views/Dashboard/OverviewMap',
        name: 'xOverviewMap',
        meta: {
          hidden: true,

          title: 'Map',
          noCache: true
        }
      },
      {
        path: 'kisip',
        component: 'views/Dashboard/Kisip',
        name: 'Kisip',
        meta: {
          title: 'KISIP',
          noCache: true
        }
      },
    ]
  },
  {
    path: '/interventions',
    component: '#',
    redirect: '/interventions/tenure/settlements',
    name: 'Interventions',
    meta: {
      title: 'Interventions',
      icon: 'mdi:office-building-marker-outline',
      hidden: false
    },
    children: [
      {
        path: 'tenure',
        name: 'tenureInterventions',
        component: '#',
        redirect: '/interventions/sett/settlements',
        meta: {
          title: 'Tenure',
          icon: 'mingcute:certificate-fill',

        },
        children: [
          {
            path: 'settlements',
            name: 'InterventionTenureSettlements',
            component:'views/Intervention/Tenure/Settlements',
            meta: {
              title: 'Settlements',
              icon:'fluent:globe-location-24-filled'
            }
          },
          {
            path: 'ben',
            name: 'InterventionTenureBeneficiary',
            component:'views/Intervention/Tenure/TenureBeneficiary',
            meta: {
              title: 'Beneficiaries',
              icon:'bi:people-fill'

            },
       
          }
        ]
      },
      {
        path: 'inf',
        name: 'InfrastructureInterventions',
        component: '#',
        redirect: '/interventions/inf/settlements',
        meta: {
          title: 'Infrastructure',
          icon:'icon-park-outline:road-one'

        },
        children: [
          {
            path: 'settlements',
            name: 'InterventionINFSettlements',
            component:'views/Intervention/Infrastructure/Settlements',
            meta: {
              title: 'Settlements',
              icon:'fluent:globe-location-24-filled'

            }
          },
          {
            path: 'projects',
            name: 'infrastructureProjects',
            component:'views/Intervention/Infrastructure/Settlements',
            meta: {
              title: 'Projects',
              icon:'emojione-monotone:construction'
            }
          },
          
        ]
      },
      {
        path: 'inclusion',
        name: 'InclusionInterventions',
        component: '#',
        redirect: '/interventions/inclusion/settlements',
        meta: {
          title: 'Inclusion',
          icon:'icon-park-solid:protection'

        },
        children: [
          {
            path: 'settlements',
            name: 'InterventionInclusionSettlements',
            component:'views/Intervention/Inclusion/Settlements',
            meta: {
              title: 'Settlements',
              icon:'fluent:globe-location-24-filled'

            }
          },
          {
            path: 'ben',
            name: 'InterventionInclusionPaps',
            component:'views/Intervention/Inclusion/SafetyNets',
            meta: {
              title: 'Beneficiaries',
              icon:'bi:people-fill'
            },
        
          }
        ]
      },
      {
        path: 'kensup',
        name: 'kensup',
        component:'views/Level/Menu2',
        meta: {
          title: 'KENSUP',
          icon:'mdi:house-city'

        }
      }
    ]
  },
  
  {
    path: '/settlement',
    component: '#',
    redirect: '/settlement/list',
    name: 'Settlements',
    meta: {
      title: 'Settlements',
      icon: 'mdi:map-legend',
      alwaysShow: false
    },
    children: [
      {
        path: 'list',
        component: 'views/Settlement/Sett',
        name: 'List',
        meta: {
          title: 'List',
          icon:'material-symbols:format-list-bulleted-rounded'
        }
      },
      {
        path: ':id',
        component: 'views/Settlement/SettlementDetails',
        name: 'SettlementDetails',
        meta: {
          hidden: true,
          title: 'Settlement Details',
          icon:'ion:document-attach',
          noCache: true
        }
      },
      {
        path: 'add',
        component: 'views/Settlement/Add',
        name: 'AddSettlement',
        meta: {
          hidden: false,
          title: 'Add',
          icon:'material-symbols:add-location-rounded',
          noCache: true
        }
      },
      {
        path: 'parcel',
        component: 'views/Parcel/index',
        name: 'Parcel',
        meta: { hidden: true,
          title: 'Parcel'
        }
      },
      {
        path: 'hh/:id',
        component: 'views/Household/index',
        name: 'Households',
        props: {
          name: String
        },
        meta: {
          hidden: true,
          title: 'Households'
        }
      },
      {
        path: 'map/:id',
        component: 'views/Map/SettlementParcelMap',
        name: 'SettlementMap',
  
        meta: {
          hidden: true,
          props: true,
          title: 'Map'
        }
      },
      {
        path: 'uploads',
        component: 'views/Uploads/uploads',
        name: 'Uploads',
        meta: {
          hidden: false,
          props: true,
          icon:'ion:document-attach',

          title: 'Documents'
        }
      },
      {
        path: 'upload/file',
        component: 'views/Uploads/uploadFiles',
        name: 'uploadFiles',
  
        meta: {
          hidden: true,
          props: true,
          title: 'uploadFiles'
        }
      },
      
  
      {
        path: 'doc/:id',
        component: 'views/Settlement/SettlementDocs',
        name: 'SettlementDocs',
  
        meta: {
          hidden: true,
          props: true,
          title: 'Documents'
        }
      },
  
      {
        path: 'map',
        component: 'views/Map/index',
        name: 'Map',
        meta: {
          hidden: true,
          title: 'Map'
        }
      }
    ]
  },
  {
    path: '/facilities',
    component: '#',
    redirect: '/facility/all',
    name: 'Facilities',
    meta: {
      hidden: false,
      title: 'Facilities',
      icon: 'ant-design:shop-outlined',
      alwaysShow: false
    },
    children: [
      {
        path: 'all',
        component:'views/Map/index',
        name: 'All',
        meta: {
          hidden: true,
          title: 'All'
        }
      },
      {
        path: 'health',
        component: 'views/Facilities/Health/Health',
        name: 'Health',
        meta: {
          icon: 'uis:hospital-symbol',
          title: 'Health'
        }
      },
      {
        path: 'health/add',
        component: 'views/Facilities/Health/Add',
        name: 'Addhealth',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'health/map/:id',
        component:  'views/Facilities/Health/HealthMap',
        name: 'HealthFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'Facility Map'
        }
      },
      {
        path: 'health/details/:id',
        component:  'views/Facilities/Health/HealthFacilityDetails',
        name: 'HealthFacilityDetails',
        meta: {
          hidden: true,
          props: true,
          title: 'Facility Profile'
        }
      },

      /// Schools -----------------------
      {
        path: 'edu',
        component: 'views/Facilities/Education/Education',
        name: 'Education',
        meta: {
          icon: 'material-symbols:school-rounded',
          title: 'Education'
        }
      },
      {
        path: 'edu/add',
        component: 'views/Facilities/Education/Add',
        name: 'AddEducation',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'edu/map/:id',
        component:  'views/Facilities/Education/SchoolMap',
        name: 'EducationFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'School Map'
        }
      },
      {
        path: 'edu/details/:id',
        component:  'views/Facilities/Education/EducationFacilityDetails',
        name: 'EducationFacilityDetails',
        meta: {
          hidden: true,
          props: true,
          title: 'School Profile'
        }
      },


      /// Roads -----------------------

      {
        path: 'road',
        component: 'views/Facilities/Roads/Roads',
        name: 'Road',
        meta: {
          icon: 'icon-park-solid:map-road-two',
          title: 'Roads'
        }
      },
      {
        path: 'road/add',
        component: 'views/Facilities/Roads/Add',
        name: 'AddRoad',
        icon: 'ant-design:plus-square-filled',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'road/map/:id',
        component:  'views/Facilities/Roads/RoadMap',
        name: 'RoadsMap',
        icon: 'ant-design:plus-square-filled',

        meta: {
          hidden: true,
          props: true,
          title: 'Road Map'
        }
      },
      {
        path: 'road/details/:id',
        component:  'views/Facilities/Roads/RoadDetails',
        name: 'RoadsDetails',
        meta: {
          hidden: true,
          props: true,
          title: 'Road Profile'
        }
      },
   /// Roads Assets-----------------------
   {
    path: 'roadasset',
    component: 'views/Facilities/Roads/Assets',
    name: 'RoadAsset',
    meta: {
      icon: 'game-icons:arch-bridge',
      title: 'Road Structures'
    }
  },
  {
    path: 'roadasset/add',
    component: 'views/Facilities/Roads/AddAsset',
    name: 'AddRoadStructure',
    icon: 'ant-design:plus-square-filled',
    meta: { hidden: true, title: 'Add', noCache: true }
      },
  

      /// Water -----------------------
   {
        path: 'water',
        component: 'views/Facilities/Water/Water',
        name: 'Water',
        meta: {
          icon: 'ic:sharp-water-drop',
          title: 'Water Points'
        }
      },
      {
        path: 'water/add',
        component: 'views/Facilities/Water/Add',
        name: 'AddWaterPoint',
        icon: 'ant-design:plus-square-filled',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'water/map/:id',
        component:  'views/Facilities/Water/WaterMap',
        name: 'WaterMap',
        icon: 'ant-design:plus-square-filled',

        meta: {
          hidden: true,
          props: true,
          title: 'Water Point Map'
        }
      },
      {
        path: 'water/details/:id',
        component:  'views/Facilities/Water/WaterFacilityDetails',
        name: 'WaterDetails',
        meta: {
          hidden: true,
          props: true,
          title: 'Water Point Profile'
        }
      },

  
   /// Sewer -----------------------
            {
              path: 'sewer',
              component: 'views/Facilities/Sewer/Sewer',
              name: 'Sewer',
              meta: {
                icon:'ph:toilet-fill',
                title: 'Sewer'
              }
            },
            {
              path: 'sewer/add',
              component: 'views/Facilities/Sewer/Add',
              name: 'AddSewer',
              icon: 'ant-design:plus-square-filled',
              meta: { hidden: true, title: 'Add', noCache: true }
            },
            {
              path: 'sewer/map/:id',
              component:  'views/Facilities/Sewer/SewerMap',
              name: 'SewerMap',
              icon: 'ant-design:plus-square-filled',
      
              meta: {
                hidden: true,
                props: true,
                title: 'Road Map'
              }
            },
            {
              path: 'sewer/details/:id',
              component:  'views/Facilities/Sewer/SewerFacilityDetails',
              name: 'SewerFacilityDetails',
              meta: {
                hidden: true,
                props: true,
                title: 'Sewer Profile'
              }
      },
            

      
    /// Other Facilities-----------------------
   {
    path: 'other',
    component: 'views/Facilities/Other/Other',
    name: 'OtherFacility',
    meta: {
      icon:'zondicons:location-park',
      title: 'Others'
    }
  }, 
  {
    path: 'other/add',
    component: 'views/Facilities/Other/AddOther',
    name: 'AddOther',
    icon: 'ant-design:plus-square-filled',
    meta: { hidden: true, title: 'Add Facility', noCache: true }
  }
    ]
  },

  {
    path: '/data',
    component: '#',
    redirect: '/data/import',
    name: 'Data',
    meta: {
      title: 'Import Data',
      icon: 'mdi:database-plus',
      alwaysShow: false
    },
    children: [
      {
        path: 'list',
        component: 'views/ImportData/list',
        name: 'ImportData',
        meta: {
          title: 'List',
          icon: 'bi:filetype-xlsx',
          hidden: true

        }
      },
      {
        path: 'hh',
        component: 'views/ImportData/excel',
        name: 'ImportHH',
        meta: {
          title: 'Excel',
          icon: 'bi:filetype-xlsx',

        }
      },
      {
        path: 'geo',
        component: 'views/ImportData/geo',
        name: 'Importgeo',
        meta: {
          title: 'Geojson',
          icon: 'gis:geojson-file',

        }
      }
    ]
  },
  {
    path: '/mne',
    component: '#',
    redirect: '/mne/indicator',
    name: 'MonitoringEvaluation',
    meta: {
      title: 'M&E',
      icon: 'uis:graph-bar',
      alwaysShow: false
    },
    children: [
      {
        path: 'reports',
        component: 'views/Indicators/indicator_category_report',
        name: 'Reports',
        meta: {
          title: 'Reports',
          icon:'mdi:file-document-plus',
        }
      },
      {
        path: 'config',
        component: 'views/Indicators/indicator_category',
        name: 'IndicatorCategory',
        meta: {
          title: 'Configurations',
          icon:'material-symbols:settings',
          hidden: false

        }
      },
      {
        path: 'list',
        component: 'views/Indicators/indicator',
        name: 'Indicators',
        meta: {
          title: 'Indicators',
          hidden: false,
          icon:'cil:gauge'

        }
      },
  
      {
        path: 'category',
        component: 'views/Indicators/category',
        name: 'Category',
        meta: {
          title: 'Category',
          icon: 'vaadin:options',
          hidden:true
        }
      } 
    ]
  },

  {
    path: '/users',
    component: '#',
    redirect: '/mne/indicator',
    name: 'systemUsers',
    meta: {
      title: 'Users',
      icon: 'wpf:usershield',
      alwaysShow: true
    },
    children: [
       {
        path: 'all',
        component:'views/Users/User',
        name: 'staff',
        meta: {
          title: 'All',
          hidden: false,
          icon: 'fa6-solid:users-rectangle',

        }
      },
      {
        path: 'county',
        component:'views/Users/County',
        name: 'CountyStaff',
        meta: {
          title: 'County',
          hidden: false,
          icon:'gis:map-users'

        }
      }, 
    
    ]
  }

]
 
const testList: string[] = [
  '/dashboard/kisip',
  '/dashboard/analysis',
  '/dashboard/workplace',
  'external-link',
  'https://element-plus-admin-doc.cn/',
  '/guide',
  '/guide/index',
  '/components',
  '/components/form',
  '/components/form/default-form',
  '/components/form/use-form',
  '/components/form/ref-form',
  '/components/table',
  '/components/table/default-table',
  '/components/table/use-table',
  '/components/table/ref-table',
  '/components/editor-demo',
  '/components/editor-demo/editor',
  '/components/search',
  '/components/descriptions',
  '/components/image-viewer',
  '/components/dialog',
  '/components/icon',
  '/components/echart',
  '/components/count-to',
  '/components/qrcode',
  '/components/highlight',
  '/components/infotip',
  '/Components/InputPassword',
  '/Components/Sticky',
  '/hooks',
  '/hooks/useWatermark',
  '/hooks/useCrudSchemas',
  '/level',
  '/level/menu1',
  '/level/menu1/menu1-1',
  '/level/menu1/menu1-1/menu1-1-1',
  '/level/menu1/menu1-2',
  '/level/menu2',
  '/example',
  '/example/example-dialog',
  '/example/example-page',
  '/example/example-add',
  '/example/example-edit',
  '/example/example-detail',
  '/error',
  '/error/404-demo',
  '/error/403-demo',
  '/error/500-demo'
]

const  publicList  = [
  {
    path: '/dashboard',
    component: '#',
    redirect: '/dashboard/national',
    name: 'Dashboard',
    meta: {
      title: 'Dashboards',
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'national',
        component: 'views/Dashboard/National',
        name: 'National',
        meta: {
          title: 'Overview',
          noCache: true
        }
      },
      {
        path: 'status',
        component: 'views/Dashboard/CurrentSlumStatus',
        name: 'Status',
        meta: {
          title: 'Services',
          noCache: true
        }
      },
      {
        path: 'kisip',
        component: 'views/Dashboard/Kisip',
        name: 'Kisip',
        meta: {
          title: 'Kisip',
          noCache: true
        }
      },
    ]
  },
  {
    path: '/interventions',
    component: '#',
    redirect: '/interventions/tenure/settlements',
    name: 'Interventions',
    meta: {
      title: 'Interventions',
      icon: 'carbon:skill-level-advanced',
      hidden: false
    },
    children: [
      {
        path: 'tenure',
        name: 'tenureInterventions',
        component: '#',
        redirect: '/interventions/sett/settlements',
        meta: {
          title: 'Tenure'
        },
        children: [
          {
            path: 'settlements',
            name: 'InterventionTenureSettlements',
            component:'views/Intervention/Tenure/Settlements',
            meta: {
              title: 'Tenure'
            }
          },
        
        ]
      },
      {
        path: 'inf',
        name: 'InfrastructureInterventions',
        component: '#',
        redirect: '/interventions/inf/settlements',
        meta: {
          title: 'Infrastructure'
        },
        children: [
          {
            path: 'settlements',
            name: 'InterventionINFSettlements',
            component:'views/Intervention/Infrastructure/Settlements',
            meta: {
              title: 'Infrastructure'
            }
          },
  
      
        ]
      },
      {
        path: 'inclusion',
        name: 'InclusionInterventions',
        component: '#',
        redirect: '/interventions/inclusion/settlements',
        meta: {
          title: 'Inclusion'
        },
        children: [
          {
            path: 'settlements',
            name: 'InterventionInclusionSettlements',
            component:'views/Intervention/Inclusion/Settlements',
            meta: {
              title: 'Inclusion'
            }
          },
 ]
      },
      {
        path: 'kensup',
        name: 'kensup',
        component:'views/Level/Menu2',
        meta: {
          title: 'KENSUP'
        }
      }
    ]
  },
  
  {
    path: '/settlement',
    component: '#',
    redirect: '/settlement/list',
    name: 'Settlements',
    meta: {
      title: 'Settlements',
      icon: 'eos-icons:role-binding',
      alwaysShow: false
    },
    children: [
      {
        path: 'list',
        component: 'views/Settlement/Sett',
        name: 'List',
        meta: {
          title: 'Settlements',
          icon: 'eos-icons:role-binding',

        }
      },
      {
        path: ':id',
        component: 'views/Settlement/SettlementDetails',
        name: 'SettlementDetails',
        meta: { hidden: true, title: 'Settlement Details', icon: 'example', noCache: true }
      },
     
      {
        path: 'parcel',
        component: 'views/Parcel/index',
        name: 'Parcel',
        meta: { hidden: true,
          title: 'Parcel'
        }
      },
      {
        path: 'hh/:id',
        component: 'views/Household/index',
        name: 'Households',
        props: {
          name: String
        },
        meta: {
          hidden: true,
          title: 'Households'
        }
      },
      {
        path: 'map/:id',
        component: 'views/Map/SettlementParcelMap',
        name: 'SettlementMap',
  
        meta: {
          hidden: true,
          props: true,
          title: 'Map'
        }
      },
     
  
      {
        path: 'doc/:id',
        component: 'views/Settlement/SettlementDocs',
        name: 'SettlementDocs',
  
        meta: {
          hidden: true,
          props: true,
          title: 'Documents'
        }
      },
  
      {
        path: 'map',
        component: 'views/Map/index',
        name: 'Map',
        meta: {
          hidden: true,
          title: 'Map'
        }
      }
    ]
  },
]

export default [
   {
    url: '/role/list',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const { roleName } = query
      return {
        code: result_code,
        data: roleName === 'admin' ? adminList : publicList
      }
    }
  }
] as MockMethod[]
