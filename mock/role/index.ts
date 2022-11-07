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
      title: 'Dashboard',
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'national',
        component: 'views/Dashboard/National',
        name: 'National',
        meta: {
          title: 'National',
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
          title: 'Map',
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
              title: 'Settlements'
            }
          },
          {
            path: 'ben',
            name: 'InterventiontenureHouseholds',
            component:'views/Intervention/Tenure/TenureBeneficiary',
            meta: {
              title: 'Beneficiaries'
            },
            children: [
              {
                path: 'all',
                name: 'InterventionTenureBeneficiary',
                component:'views/Intervention/Tenure/TenureBeneficiary',
                meta: {
                  title: 'Secure Tenure'
                }
              },
              {
                path: 'owners',
                name: 'InterventionTenureOwners',
                component:'views/Intervention/Tenure/Owners',
                meta: {
                  title: 'Parcels'
                }
              }
            ]
          }
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
              title: 'Settlements'
            }
          },
  
          {
            path: 'ben',
            name: 'InterventionINFHouseholds',
            component:'views/Intervention/Infrastructure/InfBeneficiary',
            meta: {
              title: 'Beneficiaries'
            },
            children: [
              {
                path: 'infrastructure',
                name: 'InterventionINFbeneficiary',
                component:'views/Intervention/Infrastructure/InfBeneficiary',
                meta: {
                  title: 'Infrastructure'
                }
              },
              {
                path: 'water',
                name: 'InterventionINFWater',
                component:'views/Intervention/Infrastructure/WaterBeneficiary',
                meta: {
                  title: 'Water'
                }
              },
              {
                path: 'sewer',
                name: 'InterventionINFSewer',
                component:'views/Intervention/Infrastructure/Sewerbenf',
                meta: {
                  title: 'Sewer'
                }
              }
            ]
          }
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
              title: 'Settlements'
            }
          },
          {
            path: 'ben',
            name: 'InterventionInclusionPaps',
            component:'views/Intervention/Inclusion/SafetyNets',
            meta: {
              title: 'Beneficiaries'
            },
            children: [
              {
                path: 'safetynets',
                name: 'InterventionInclusionBeneficiariesSafetyNets',
                component:'views/Intervention/Inclusion/SafetyNets',
                meta: {
                  title: 'Safety Nets'
                }
              },
              {
                path: 'training',
                name: 'InterventionInclusionTraining',
                component:'views/Intervention/Inclusion/Training',
                meta: {
                  title: 'Training'
                }
              },
              {
                path: 'emp',
                name: 'InterventionInclusionEmployment',
                component:'views/Intervention/Inclusion/Employment',
                meta: {
                  title: 'Employment'
                }
              },
              {
                path: 'cdp',
                name: 'InterventionInclusionCDP',
                component:'views/Intervention/Inclusion/CDP',
                meta: {
                  title: 'CDP'
                }
              }
            ]
          }
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
          title: 'List'
        }
      },
      {
        path: ':id',
        component: 'views/Settlement/SettlementDetails',
        name: 'SettlementDetails',
        meta: { hidden: true, title: 'Settlement Details', icon: 'example', noCache: true }
      },
      {
        path: 'add',
        component: 'views/Settlement/Add',
        name: 'AddSettlement',
        meta: { hidden: false, title: 'Add', noCache: true }
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
      hidden: true,
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
        component:'views/Map/index',
        name: 'Health',
        meta: {
          icon: 'ci-home-plus',
          title: 'Health'
        }
      },

      {
        path: 'education',
        component:'views/Map/index',
        name: 'Education',
        meta: {
          icon: 'ci-youtube',

          title: 'Education'
        }
      },

      {
        path: 'water',
        component:'views/Map/index',
        name: 'Water',
        meta: {
          title: 'Water'
        }
      },

      {
        path: 'utility',
        component:'views/Map/index',
        name: 'Utilities',
        meta: {
          title: 'Utilities'
        }
      },
      {
        path: 'security',
        component:'views/Map/index',
        name: 'Security',
        meta: {
          title: 'Security'
        }
      },

      {
        path: 'environment',
        component:'views/Map/index',
        name: 'Environment',
        meta: {
          title: 'Environment'
        }
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
      icon: 'ant-design:shop-outlined',
      alwaysShow: false
    },
    children: [
      {
        path: 'list',
        component: 'views/ImportData/list',
        name: 'ImportData',
        meta: {
          title: 'List'
        }
      },
      {
        path: 'geo',
        component: 'views/ImportData/geo',
        name: 'Importgeo',
        meta: {
          title: 'Geometry'
        }
      }
    ]
  },



  {
    path: '/users',
    redirect: '/users/user',
    component: '#',
    name: 'Users',
    meta: {
      title: 'Users',
      icon: 'eos-icons:role-binding',
 
       alwaysShow: true
    },
    children: [
      {
        path: 'user',
        component: 'views/Users/User',
        name: 'User',
        meta: {
          title: 'All'
        }
      },
      {
        path: 'county',
        component:'views/Users/County',
        name: 'CountyAdmin',
        meta: {
          title: 'County'
        }
      },
      {
        path: 'partner',
        component:'views/Users/User',
        name: 'Partner',
        meta: {
          title: 'Partner'
        }
      },
 
      {
        path: 'public',
        component:'views/Users/User',
        name: 'Public',
        meta: {
          title: 'Public'
        }
      }
    ]
  },
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
  // 列表接口
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
