import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout, getParentLayout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'

 
const { t } = useI18n()


console.log("try Daynamic definiiton of routes here............")



export const constantRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard/national',
    name: 'Root',
    meta: {
      hidden: true
    }
  },
  {
    path: '/redirect',
    component: Layout,
    name: 'Redirect',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/login',
    component: () => import('@/views/Login/Login.vue'),
    name: 'Login',
    meta: {
      hidden: true,
      title: t('router.login'),
      noTagsView: true
    }
  },

  {
    path: '/logoff',
    component: () => import('@/views/Reset/Reset.vue'),
    name: 'Logoff',
    meta: {
      hidden: true,
      title: t('Logoff'),
      noTagsView: true
    }
  },

  {
    path: '/reset/:token(.*)*',
    component: () => import('@/views/Reset/Reset.vue'),
    name: 'Reset',
    meta: {
      hidden: true,
      title: t('Reset'),
      noTagsView: true
    }
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    name: 'NoFind',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  }
]

export const asyncRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/national',
    name: 'Dashboard',
    meta: {
      title: t('Dashboards'),
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'national',
        component: () => import('@/views/Dashboard/National.vue'),
        name: 'National',
        meta: {
          title: t('Overview'),
          noCache: true,
          affix: true
        }
      },
      {
        path: 'status',
        component: () => import('@/views/Dashboard/CurrentSlumStatus.vue'),
        name: 'Status',
        meta: {
          title: t('Status'),
          noCache: true,
          affix: true
        }
      },
      {
        path: 'kisip1',
        component: () => import('@/views/Dashboard/Interventions.vue'),
        name: 'InterventionsDashboard',
        meta: {
          title: t('Kisip'),
          noCache: true
        }
      }
    ]
  },
  {
    path: '/external-link',
    component: Layout,
    meta: {
      hidden: true
    },
    name: 'ExternalLink',
    children: [
      {
        path: 'https://element-plus-admin-doc.cn/',
        name: 'DocumentLink',
        meta: {
          title: t('router.document'),
          icon: 'clarity:document-solid'
        }
      }
    ]
  },
  {
    path: '/guide',
    component: Layout,
    name: 'Guide',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/Guide/Guide.vue'),
        name: 'GuideDemo',
        meta: {
          title: t('router.guide'),
          icon: 'cib:telegram-plane'
        }
      }
    ]
  },

  {
    path: '/interventions',
    component: Layout,
    redirect: '/interventions/tenure/settlements',
    name: 'Interventions',
    meta: {
      title: t('Interventions'),
      icon: 'carbon:skill-level-advanced',
      hidden: false
    },
    children: [
      {
        path: 'tenure',
        name: 'tenureInterventions',
        component: getParentLayout(),
        redirect: '/interventions/sett/settlements',
        meta: {
          title: t('Tenure')
        },
        children: [
          {
            path: 'settlements',
            name: 'InterventionTenureSettlements',
            component: () => import('@/views/Intervention/Tenure/Settlements.vue'),
            meta: {
              title: t('Settlements')
            }
          },
          {
            path: 'ben',
            name: 'InterventiontenureHouseholds',
            component: () => import('@/views/Intervention/Tenure/TenureBeneficiary.vue'),
            meta: {
              title: t('Beneficiaries')
            },
            children: [
              {
                path: 'all',
                name: 'InterventionTenureBeneficiary',
                component: () => import('@/views/Intervention/Tenure/TenureBeneficiary.vue'),
                meta: {
                  title: t('Secure Tenure')
                }
              },
              {
                path: 'owners',
                name: 'InterventionTenureOwners',
                component: () => import('@/views/Intervention/Tenure/Owners.vue'),
                meta: {
                  title: t('Parcels')
                }
              }
            ]
          }
        ]
      },
      {
        path: 'inf',
        name: 'InfrastructureInterventions',
        component: getParentLayout(),
        redirect: '/interventions/inf/settlements',
        meta: {
          title: t('Infrastructure')
        },
        children: [
          {
            path: 'settlements',
            name: 'InterventionINFSettlements',
            component: () => import('@/views/Intervention/Infrastructure/Settlements.vue'),
            meta: {
              title: t('Settlements')
            }
          },

          {
            path: 'ben',
            name: 'InterventionINFHouseholds',
            component: () => import('@/views/Intervention/Infrastructure/InfBeneficiary.vue'),
            meta: {
              title: t('Beneficiaries')
            },
            children: [
              {
                path: 'infrastructure',
                name: 'InterventionINFbeneficiary',
                component: () => import('@/views/Intervention/Infrastructure/InfBeneficiary.vue'),
                meta: {
                  title: t('Infrastructure')
                }
              },
              {
                path: 'water',
                name: 'InterventionINFWater',
                component: () => import('@/views/Intervention/Infrastructure/WaterBeneficiary.vue'),
                meta: {
                  title: t('Water')
                }
              },
              {
                path: 'sewer',
                name: 'InterventionINFSewer',
                component: () => import('@/views/Intervention/Infrastructure/Sewerbenf.vue'),
                meta: {
                  title: t('Sewer')
                }
              }
            ]
          }
        ]
      },
      {
        path: 'inclusion',
        name: 'InclusionInterventions',
        component: getParentLayout(),
        redirect: '/interventions/inclusion/settlements',
        meta: {
          title: t('Inclusion')
        },
        children: [
          {
            path: 'settlements',
            name: 'InterventionInclusionSettlements',
            component: () => import('@/views/Intervention/Inclusion/Settlements.vue'),
            meta: {
              title: t('Settlements')
            }
          },
          {
            path: 'ben',
            name: 'InterventionInclusionPaps',
            component: () => import('@/views/Intervention/Inclusion/SafetyNets.vue'),
            meta: {
              title: t('Beneficiaries')
            },
            children: [
              {
                path: 'safetynets',
                name: 'InterventionInclusionBeneficiariesSafetyNets',
                component: () => import('@/views/Intervention/Inclusion/SafetyNets.vue'),
                meta: {
                  title: t('Safety Nets')
                }
              },
              {
                path: 'training',
                name: 'InterventionInclusionTraining',
                component: () => import('@/views/Intervention/Inclusion/Training.vue'),
                meta: {
                  title: t('Training')
                }
              },
              {
                path: 'emp',
                name: 'InterventionInclusionEmployment',
                component: () => import('@/views/Intervention/Inclusion/Employment.vue'),
                meta: {
                  title: t('Employment')
                }
              },
              {
                path: 'cdp',
                name: 'InterventionInclusionCDP',
                component: () => import('@/views/Intervention/Inclusion/CDP.vue'),
                meta: {
                  title: t('CDP')
                }
              }
            ]
          }
        ]
      },
      {
        path: 'kensup',
        name: 'kensup',
        component: () => import('@/views/Level/Menu2.vue'),
        meta: {
          title: t('KENSUP')
        }
      }
    ]
  },

  /*   {
    path: '/intervention',
    component: Layout,
    name: 'Intervention',
    meta: {
      title: t('Interventions'),
      icon: 'cib:telegram-plane',
      noCache: true
    },
    children: [
      {
        path: 'tenure',
        component: () => import('@/views/Intervention/Tenure.vue'),
        name: 'Tenure',
        meta: {
          title: t('Tenure'),
          icon: 'cib:telegram-plane'
        }
      },
      {
        path: 'infrastructure',
        component: () => import('@/views/Guide/Guide.vue'),
        name: 'Infrastructure',
        meta: {
          title: t('Infrastructure'),
          icon: 'cib:telegram-plane'
        }
      },
      {
        path: 'inclusion',
        component: () => import('@/views/Guide/Guide.vue'),
        name: 'SocialDevelopment',
        meta: {
          title: t('Inclusion'),
          icon: 'cib:telegram-plane'
        }
      }
    ]
  }, */

  {
    path: '/settlement',
    component: Layout,
    redirect: '/settlement/list',
    name: 'Settlements',
    meta: {
      title: t('Settlements'),
      icon: 'eos-icons:role-binding',
      alwaysShow: false
    },
    children: [
      {
        path: 'list',
        component: () => import('@/views/Settlement/Sett.vue'),
        name: 'List',
        meta: {
          title: t('List')
        }
      },
      {
        path: ':id',
        component: () => import('@/views/Settlement/SettlementDetails.vue'),
        name: 'SettlementDetails',
        meta: { hidden: true, title: 'Settlement Details', icon: 'example', noCache: true }
      },
      {
        path: 'add',
        component: () => import('@/views/Settlement/Add.vue'),
        name: 'AddSettlement',
        meta: { hidden: false, title: 'Add', noCache: true }
      },
      {
        path: 'parcel',
        component: () => import('@/views/Parcel/index.vue'),
        name: 'Parcel',
        meta: { hidden: true,
          title: t('Parcel')
        }
      },
 
      {
        path: 'map/:id',
        component: () => import('@/views/Map/SettlementParcelMap.vue'),
        name: 'SettlementMap',

        meta: {
          hidden: true,
          props: true,
          title: t('Map')
        }
      },
      // {
      //   path: 'uploads',
      //   component: () => import('@/views/Uploads/uploads.vue'),
      //   name: 'Uploads',

      //   meta: {
      //     hidden: false,
      //     props: true,
      //     title: t('Documents')
      //   }
      // },
      // {
      //   path: 'upload/file',
      //   component: () => import('@/views/Uploads/uploadFiles.vue'),
      //   name: 'uploadFiles',

      //   meta: {
      //     hidden: true,
      //     props: true,
      //     title: t('uploadFiles')
      //   }
      // },

      // {
      //   path: 'doc/:id',
      //   component: () => import('@/views/Settlement/SettlementDocs.vue'),
      //   name: 'SettlementDocs',

      //   meta: {
      //     hidden: true,
      //     props: true,
      //     title: t('Documents')
      //   }
      // },

      {
        path: 'map',
        component: () => import('@/views/Map/index.vue'),
        name: 'Map',
        meta: {
          hidden: true,
          title: t('Map')
        }
      }
    ]
  },

  {
    path: '/facilities',
    component: Layout,
    redirect: '/facility/all',
    name: 'Facilities',
    meta: {
      hidden: true,
      title: t('Facilities'),
      icon:'ic:outline-local-convenience-store',
      alwaysShow: false
    },
    children: [
      {
        path: 'all',
        component: () => import('@/views/Map/index.vue'),
        name: 'All',
        meta: {
          hidden: true,
          title: t('All')
        }
      },
      {
        path: 'health',
        component: () => import('@/views/Map/index.vue'),
        name: 'Health',
        meta: {
          icon: 'ci-home-plus',
          title: t('Health')
        }
      },

      {
        path: 'education',
        component: () => import('@/views/Map/index.vue'),
        name: 'Education',
        meta: {
          icon: 'ci-youtube',

          title: t('Education')
        }
      },

      {
        path: 'water',
        component: () => import('@/views/Map/index.vue'),
        name: 'Water',
        meta: {
          title: t('Water')
        }
      },

      {
        path: 'utility',
        component: () => import('@/views/Map/index.vue'),
        name: 'Utilities',
        meta: {
          title: t('Utilities')
        }
      },
      {
        path: 'security',
        component: () => import('@/views/Map/index.vue'),
        name: 'Security',
        meta: {
          title: t('Security')
        }
      },

      {
        path: 'environment',
        component: () => import('@/views/Map/index.vue'),
        name: 'Environment',
        meta: {
          title: t('Environment')
        }
      }
    ]
  },
  {
    path: '/data',
    component: Layout,
    redirect: '/data/import',
    name: 'Data',
    meta: {
      title: t('Import Data'),
      icon: 'ant-design:shop-outlined',
      alwaysShow: false
    },
    children: [
      {
        path: 'list',
        component: () => import('@/views/ImportData/list.vue'),
        name: 'ImportData',
        meta: {
          title: t('List')
        }
      },
      {
        path: 'hh',
        component: 'views/ImportData/hh',
        name: 'ImportHH',
        meta: {
          title: 'Household'
        }
      },
      {
        path: 'geo',
        component: () => import('@/views/ImportData/geo.vue'),
        name: 'Importgeo',
        meta: {
          title: t('Geometry')
        }
      }
    ]
  },

  {
    path: '/components',
    component: Layout,
    name: 'ComponentsDemo',
    meta: {
      hidden: true,
      title: t('router.component'),
      icon: 'bx:bxs-component',
      alwaysShow: true
    },
    children: [
      {
        path: 'form',
        component: getParentLayout(),
        redirect: '/components/form/default-form',
        name: 'Form',
        meta: {
          title: t('router.form'),
          alwaysShow: true
        },
        children: [
          {
            path: 'default-form',
            component: () => import('@/views/Components/Form/DefaultForm.vue'),
            name: 'DefaultForm',
            meta: {
              title: t('router.defaultForm')
            }
          },
          {
            path: 'use-form',
            component: () => import('@/views/Components/Form/UseFormDemo.vue'),
            name: 'UseForm',
            meta: {
              title: 'UseForm'
            }
          },
          {
            path: 'ref-form',
            component: () => import('@/views/Components/Form/RefForm.vue'),
            name: 'RefForm',
            meta: {
              title: 'RefForm'
            }
          }
        ]
      },
      {
        path: 'table',
        component: getParentLayout(),
        redirect: '/components/table/default-table',
        name: 'TableDemo',
        meta: {
          title: t('router.table'),
          alwaysShow: true
        },
        children: [
          {
            path: 'default-table',
            component: () => import('@/views/Components/Table/DefaultTable.vue'),
            name: 'DefaultTable',
            meta: {
              title: t('router.defaultTable')
            }
          },
          {
            path: 'use-table',
            component: () => import('@/views/Components/Table/UseTableDemo.vue'),
            name: 'UseTable',
            meta: {
              title: 'UseTable'
            }
          },

          {
            path: 'user-table',
            component: () => import('@/views/Components/Table/UsersPaginate.vue'),
            name: 'UserTable',
            meta: {
              title: 'Users'
            }
          },
          {
            path: 'ref-table',
            component: () => import('@/views/Components/Table/RefTable.vue'),
            name: 'RefTable',
            meta: {
              title: 'RefTable'
            }
          }
        ]
      },
      {
        path: 'editor-demo',
        component: getParentLayout(),
        redirect: '/components/editor-demo/editor',
        name: 'EditorDemo',
        meta: {
          title: t('router.editor'),
          alwaysShow: true
        },
        children: [
          {
            path: 'editor',
            component: () => import('@/views/Components/Editor/Editor.vue'),
            name: 'Editor',
            meta: {
              title: t('router.richText')
            }
          }
        ]
      },
      {
        path: 'search',
        component: () => import('@/views/Components/Search.vue'),
        name: 'Search',
        meta: {
          title: t('router.search')
        }
      },
      {
        path: 'descriptions',
        component: () => import('@/views/Components/Descriptions.vue'),
        name: 'Descriptions',
        meta: {
          title: t('router.descriptions')
        }
      },
      {
        path: 'image-viewer',
        component: () => import('@/views/Components/ImageViewer.vue'),
        name: 'ImageViewer',
        meta: {
          title: t('router.imageViewer')
        }
      },
      {
        path: 'dialog',
        component: () => import('@/views/Components/Dialog.vue'),
        name: 'Dialog',
        meta: {
          title: t('router.dialog')
        }
      },
      {
        path: 'icon',
        component: () => import('@/views/Components/Icon.vue'),
        name: 'Icon',
        meta: {
          title: t('router.icon')
        }
      },
      {
        path: 'echart',
        component: () => import('@/views/Components/Echart.vue'),
        name: 'Echart',
        meta: {
          title: t('router.echart')
        }
      },
      {
        path: 'count-to',
        component: () => import('@/views/Components/CountTo.vue'),
        name: 'CountTo',
        meta: {
          title: t('router.countTo')
        }
      },
      {
        path: 'qrcode',
        component: () => import('@/views/Components/Qrcode.vue'),
        name: 'Qrcode',
        meta: {
          title: t('router.qrcode')
        }
      },
      {
        path: 'highlight',
        component: () => import('@/views/Components/Highlight.vue'),
        name: 'Highlight',
        meta: {
          title: t('router.highlight')
        }
      },
      {
        path: 'infotip',
        component: () => import('@/views/Components/Infotip.vue'),
        name: 'Infotip',
        meta: {
          title: t('router.infotip')
        }
      },
      {
        path: 'input-password',
        component: () => import('@/views/Components/InputPassword.vue'),
        name: 'InputPassword',
        meta: {
          title: t('router.inputPassword')
        }
      },
      {
        path: 'sticky',
        component: () => import('@/views/Components/Sticky.vue'),
        name: 'Sticky',
        meta: {
          title: t('router.sticky')
        }
      }
    ]
  },
  {
    path: '/hooks',
    component: Layout,
    redirect: '/hooks/useWatermark',
    name: 'Hooks',
    meta: {
      title: 'hooks',
      icon: 'ic:outline-webhook',
      alwaysShow: true,
      hidden: true
    },
    children: [
      {
        path: 'useWatermark',
        component: () => import('@/views/hooks/useWatermark.vue'),
        name: 'UseWatermark',
        meta: {
          title: 'useWatermark'
        }
      },
      {
        path: 'useCrudSchemas',
        component: () => import('@/views/hooks/useCrudSchemas.vue'),
        name: 'UseCrudSchemas',
        meta: {
          title: 'useCrudSchemas'
        }
      }
    ]
  },
  {
    path: '/level',
    component: Layout,
    redirect: '/level/menu1/menu1-1/menu1-1-1',
    name: 'Level',
    meta: {
      title: t('router.level'),
      icon: 'carbon:skill-level-advanced',
      hidden: true
    },
    children: [
      {
        path: 'menu1',
        name: 'Menu1',
        component: getParentLayout(),
        redirect: '/level/menu1/menu1-1/menu1-1-1',
        meta: {
          title: t('router.menu1')
        },
        children: [
          {
            path: 'menu1-1',
            name: 'Menu11',
            component: getParentLayout(),
            redirect: '/level/menu1/menu1-1/menu1-1-1',
            meta: {
              title: t('router.menu11'),
              alwaysShow: true
            },
            children: [
              {
                path: 'menu1-1-1',
                name: 'Menu111',
                component: () => import('@/views/Level/Menu111.vue'),
                meta: {
                  title: t('router.menu111')
                }
              }
            ]
          },
          {
            path: 'menu1-2',
            name: 'Menu12',
            component: () => import('@/views/Level/Menu12.vue'),
            meta: {
              title: t('router.menu12')
            }
          }
        ]
      },
      {
        path: 'menu2',
        name: 'Menu2',
        component: () => import('@/views/Level/Menu2.vue'),
        meta: {
          title: t('router.menu2')
        }
      }
    ]
  },
  {
    path: '/example',
    component: Layout,

    redirect: '/example/example-dialog',
    name: 'Example',
    meta: {
      title: t('router.example'),
      icon: 'ep:management',
      alwaysShow: true,
      hidden: true
    },
    children: [
      {
        path: 'example-dialog',
        component: () => import('@/views/Example/Dialog/ExampleDialog.vue'),
        name: 'ExampleDialog',
        meta: {
          title: t('router.exampleDialog')
        }
      },
      {
        path: 'example-page',
        component: () => import('@/views/Example/Page/ExamplePage.vue'),
        name: 'ExamplePage',
        meta: {
          title: t('router.examplePage')
        }
      },
      {
        path: 'example-add',
        component: () => import('@/views/Example/Page/ExampleAdd.vue'),
        name: 'ExampleAdd',
        meta: {
          title: t('router.exampleAdd'),
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/example/example-page'
        }
      },
      {
        path: 'example-edit',
        component: () => import('@/views/Example/Page/ExampleEdit.vue'),
        name: 'ExampleEdit',
        meta: {
          title: t('router.exampleEdit'),
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/example/example-page'
        }
      },
      {
        path: 'example-detail',
        component: () => import('@/views/Example/Page/ExampleDetail.vue'),
        name: 'ExampleDetail',
        meta: {
          title: t('router.exampleDetail'),
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/example/example-page'
        }
      }
    ]
  },
  {
    path: '/error',
    component: Layout,
    redirect: '/error/404',
    name: 'Error',
    meta: {
      title: t('router.errorPage'),
      icon: 'ci:error',
      alwaysShow: true,
      hidden: true
    },
    children: [
      {
        path: '404-demo',
        component: () => import('@/views/Error/404.vue'),
        name: '404Demo',
        meta: {
          title: '404'
        }
      },
      {
        path: '403-demo',
        component: () => import('@/views/Error/403.vue'),
        name: '403Demo',
        meta: {
          title: '403'
        }
      },
      {
        path: '500-demo',
        component: () => import('@/views/Error/500.vue'),
        name: '500Demo',
        meta: {
          title: '500'
        }
      }
    ]
  },
  {
    path: '/users',
    component: Layout,
    redirect: '/users/user',
    name: 'Users',
    meta: {
      title: t('Users'),
      icon: 'eos-icons:role-binding',
 
       alwaysShow: true
    },
    children: [
      {
        path: 'user',
        component: () => import('@/views/Users/User.vue'),
        name: 'User',
        meta: {
          title: t('All')
        }
      },
      {
        path: 'county',
        component: () => import('@/views/Users/County.vue'),
        name: 'CountyAdmin',
        meta: {
          title: t('County')
        }
      },
      {
        path: 'partner',
        component: () => import('@/views/Users/User.vue'),
        name: 'Partner',
        meta: {
          title: t('Partner')
        }
      },
 
      {
        path: 'public',
        component: () => import('@/views/Users/User.vue'),
        name: 'Public',
        meta: {
          title: t('Public')
        }
      }
    ]
  },
  {
    path: '/roles',
    component: Layout,
    redirect: '/roles/role',
    name: 'Roles',
    meta: {
      title: t('Roles'),
      icon: 'eos-icons:admin-outlined',    
      alwaysShow: true
    },
    children: [
      {
        path: 'role',
        component: () => import('@/views/Users/Role.vue'),
        name: 'Role',
        meta: {
          title: t('Role')
        }
      },
 
      
       
    ] 
  },
]
 
 
export const publicRoutes: AppRouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/national',
    name: 'Dashboard',
    meta: {
      title: t('Dashboards'),
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'national',
        component: () => import('@/views/Dashboard/National.vue'),
        name: 'National',
        meta: {
          title: t('Overview'),
          noCache: true,
          icon:'ic:round-bubble-chart',
          affix: true
        }
      },
      {
        path: 'status',
        component: () => import('@/views/Dashboard/CurrentSlumStatus.vue'),
        name: 'Status',
        meta: {
          title: t('Status'),
          noCache: true,
          affix: true,
          icon:'pajamas:status',

        }
      },
      {
        path: 'kisip1',
        component: () => import('@/views/Dashboard/Interventions.vue'),
        name: 'InterventionsDash',
        meta: {
          title: t('Kisip'),
          noCache: true,
          icon:'tabler:layout-dashboard',

        }
      }
    ]
  },
  {
    path: '/settlement',
    component: Layout,
    redirect: '/settlement/list',
    name: 'Settlements',
    meta: {
      title: t('Settlements'),
      icon: 'mdi:map-legend',
      alwaysShow: true
    },
    children: [

      {
        path: 'list',
        component: () => import('@/views/Settlement/Sett.vue'),
        name: 'List',
        meta: {
          title: 'List',
          icon:'material-symbols:format-list-bulleted-rounded'
        }
      },
   
      {
        path: ':id',
      //  component: 'views/Settlement/SettlementDetails',
        component: () => import('@/views/Settlement/SettlementDetails.vue'),

        name: 'SettlementDetails',
        meta: {
          hidden: true,
          title: 'Settlement Details',
          icon:'ion:document-attach',
          noCache: true
        }
      },

      {
        path: 'parcel',
       // component: 'views/Parcel/index',
        component: () => import('@/views/Parcel/index.vue'),

        name: 'Parcel',
        meta: { hidden: true,
          title: 'Parcel',
          icon:'carbon:choropleth-map',
        }
      },

    
      {
        path: 'map/:id',
      //  component: 'views/Map/SettlementParcelMap',
        component: () => import('@/views/Map/SettlementParcelMap.vue'),

        name: 'SettlementMap',
  
        meta: {
          hidden: true,
          props: true,
          title: 'Map'
        }
      },
    
  
      {
        path: 'map',
      //  component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'Map',
        meta: {
          hidden: true,
          title: 'Map'
        }
      }

    ]
  },
 
  {
    path: '/interventions',
    component: Layout,
    redirect: '/interventions/tenure/settlements',
    name: 'Interventions',
    meta: {
      title: 'Interventions',
      icon: 'mdi:office-building-marker-outline',
      hidden: false
    },
    children: [
      {
        path: 'kisip',
        name: 'kisipInterventions',
        component: Layout,
        redirect: '/interventions/kisip/settlements',
        meta: {
          title: 'Interventions',
          icon: 'mingcute:certificate-fill',

        },
        children: [
     
          {
            path: 'project',
            name: 'InterventionProjects',
            component: () => import('@/views/Intervention/Project/Project.vue'),
            meta: {
              title: 'Projects',
              icon:'fluent-emoji-high-contrast:construction'
            },
       
          },
   
          {
            path: 'parcel',
           // component: 'views/Parcel/index',
            component: () => import('@/views/Intervention/Project/Parcel.vue'),
    
            name: 'KisipParcel',
            meta: { hidden: false,
              title: 'Parcels',
              icon:'carbon:choropleth-map',
            }
          },
          {
            path: 'map/:id',
          //  component: 'views/Map/SettlementParcelMap',
            component: () => import('@/views/Intervention/Project/Map.vue'),
            name: 'ProjectMap',  
            meta: {
              hidden: true,
              props: true,
              title: 'Map'
            }
          },
          
        ]
      },
   
      
      {
        path: 'kensup',
        name: 'kensup',
        component: Layout,
        redirect: '/interventions/kensup/proj',
        meta: {
          title: 'KENSUP',
          icon:'mdi:house-city'

        },
        children: [
          {
            path: 'proj',
            name: 'kensupInterventionProjects',
            component: () => import('@/views/Intervention/kensup/Project/Project.vue'),
            meta: {
              title: 'KENSUP',
              icon:'mdi:house-city'
            },
       
          },
        
        ]
      }
    ]
  },
  
 {
    path: '/facilities',
    component: Layout,
    redirect: '/facility/all',
    name: 'Facilities',
    meta: {
      hidden: false,
      title: 'Facilities',
      icon:'ic:outline-local-convenience-store',
      alwaysShow: false
    },
    children: [
      {
        path: 'all',
     //   component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'All',
        meta: {
          hidden: true,
          title: 'All'
        }
      },
      {
        path: 'health',
        //component: 'views/Facilities/Health/Health',
        component: () => import('@/views/Facilities/Health/Health.vue'),

        name: 'Health',
        meta: {
          icon: 'uis:hospital-symbol',
          title: 'Health'
        }
      },
 
      {
        path: 'health/map/:id',
      //  component: 'views/Facilities/Health/HealthMap',
        component: () => import('@/views/Facilities/Health/HealthMap.vue'),

        name: 'HealthFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'Facility Map'
        }
      },
      {
        path: 'health/details/:id',
      // component: 'views/Facilities/Health/HealthFacilityDetails',
        component: () => import('@/views/Facilities/Health/HealthFacilityDetails.vue'),

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
       // component: 'views/Facilities/Education/Education',
        component: () => import('@/views/Facilities/Education/Education.vue'),

        name: 'Education',
        meta: {
          icon: 'material-symbols:school-rounded',
          title: 'Education'
        }
      },
 
      {
        path: 'edu/map/:id',
        //component: 'views/Facilities/Education/SchoolMap',
        component: () => import('@/views/Facilities/Education/SchoolMap.vue'),

        name: 'EducationFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'School Map'
        }
      },
      {
        path: 'edu/details/:id',
        //component: 'views/Facilities/Education/EducationFacilityDetails',
        component: () => import('@/views/Facilities/Education/EducationFacilityDetails.vue'),

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
      //  component: 'views/Facilities/Roads/Roads',
        component: () => import('@/views/Facilities/Roads/Roads.vue'),

        name: 'Road',
        meta: {
          icon: 'icon-park-solid:map-road-two',
          title: 'Roads'
        }
      },
 
 
      {
        path: 'road/details/:id',
       // component: 'views/Facilities/Roads/RoadDetails',
       component: () => import('@/views/Facilities/Roads/RoadFacilityDetails.vue'),

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
   //  component: 'views/Facilities/Roads/Assets',
     component: () => import('@/views/Facilities/Roads/Assets.vue'),

    name: 'RoadAsset',
    meta: {
      icon: 'game-icons:arch-bridge',
      title: 'Road Structures'
    }
  },
  
  

      /// Water -----------------------
   {
        path: 'water',
     //component: 'views/Facilities/Water/Water',
     component: () => import('@/views/Facilities/Water/Water.vue'),

        name: 'Water',
        meta: {
          icon: 'ic:sharp-water-drop',
          title: 'Water Points'
        }
      },
 
      {
        path: 'water/map/:id',
      //  component: 'views/Facilities/Water/WaterMap',
        component: () => import('@/views/Facilities/Water/WaterMap.vue'),

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
       // component: 'views/Facilities/Water/WaterFacilityDetails',
        component: () => import('@/views/Facilities/Water/WaterFacilityDetails.vue'),

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
            //  component: 'views/Facilities/Sewer/Sewer',
              component: () => import('@/views/Facilities/Sewer/Sewer.vue'),

              name: 'Sewer',
              meta: {
                icon:'ph:toilet-fill',
                title: 'Sewer'
              }
            },
 
            {
              path: 'sewer/map/:id',
            //  component: 'views/Facilities/Sewer/SewerMap',
              component: () => import('@/views/Facilities/Sewer/SewerMap.vue'),

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
            //  component: 'views/Facilities/Sewer/SewerFacilityDetails',
              component: () => import('@/views/Facilities/Sewer/SewerFacilityDetails.vue'),

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
    // component: 'views/Facilities/Other/Other',
     component: () => import('@/views/Facilities/Other/Other.vue'),

    name: 'OtherFacility',
    meta: {
      icon:'zondicons:location-park',
      title: 'Others'
    }
  }, 
 
    ]
  }, 
 
 
]

 

export const countyAdminRoutes: AppRouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/national',
    name: 'Dashboard',
    meta: {
      title: t('Dashboards'),
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'national',
        component: () => import('@/views/Dashboard/National.vue'),
        name: 'National',
        meta: {
          title: t('Overview'),
          noCache: true,
          icon:'ic:round-bubble-chart',
          affix: true
        }
      },
      {
        path: 'status',
        component: () => import('@/views/Dashboard/CurrentSlumStatus.vue'),
        name: 'Status',
        meta: {
          title: t('Status'),
          noCache: true,
          affix: true,
          icon:'pajamas:status',

        }
      },
      {
        path: 'kisip1',
        component: () => import('@/views/Dashboard/Interventions.vue'),
        name: 'Kisip',
        meta: {
          title: t('Kisip'),
          noCache: true,
          icon:'tabler:layout-dashboard',

        }
      }
    ]
  },
  {
    path: '/settlement',
    component: Layout,
    redirect: '/settlement/list',
    name: 'Settlements',
    meta: {
      title: t('Settlements'),
      icon: 'mdi:map-legend',
      alwaysShow: true
    },
    children: [

      {
        path: 'list',
        component: () => import('@/views/Settlement/Sett.vue'),
        name: 'List',
        meta: {
          title: 'List',
          icon:'material-symbols:format-list-bulleted-rounded'
        }
      },
   
      {
        path: ':id',
      //  component: 'views/Settlement/SettlementDetails',
        component: () => import('@/views/Settlement/SettlementDetails.vue'),

        name: 'SettlementDetails',
        meta: {
          hidden: true,
          title: 'Settlement Details',
          icon:'ion:document-attach',
          noCache: true
        }
      },

      
      {
        path: 'parcel',
       // component: 'views/Parcel/index',
        component: () => import('@/views/Parcel/index.vue'),

        name: 'Parcel',
        meta: { hidden: true,
          title: 'Parcel',
          icon:'carbon:choropleth-map',
        }
      },

      
      {
        path: 'map/:id',
      //  component: 'views/Map/SettlementParcelMap',
        component: () => import('@/views/Map/SettlementParcelMap.vue'),

        name: 'SettlementMap',
  
        meta: {
          hidden: true,
          props: true,
          title: 'Map'
        }
      },
   
  

  
      {
        path: 'map',
      //  component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'Map',
        meta: {
          hidden: true,
          title: 'Map'
        }
      }

    ]
  },
 
  {
    path: '/interventions',
    component: Layout,
    redirect: '/interventions/tenure/settlements',
    name: 'Interventions',
    meta: {
      title: 'Interventions',
      icon: 'mdi:office-building-marker-outline',
      hidden: false
    },
    children: [
      {
        path: 'kisip',
        name: 'kisipInterventions',
        component: Layout,
        redirect: '/interventions/kisip/settlements',
        meta: {
          title: 'KISIP',
          icon: 'mingcute:certificate-fill',

        },
        children: [
          {
            path: 'settlements',
            name: 'kisipInterventionSettlements',
          //  component: 'views/Intervention/Tenure/Settlements',
            component: () => import('@/views/Intervention/Settlements.vue'),
            meta: {
              title: 'Settlements',
              icon:'mdi:map-legend'
            }
          },
          {
            path: 'project',
            name: 'InterventionProjects',
            component: () => import('@/views/Intervention/Project/Project.vue'),
            meta: {
              title: 'Projects',
              icon:'fluent-emoji-high-contrast:construction'
            },
       
          },
    
          {
            path: 'parcel',
           // component: 'views/Parcel/index',
            component: () => import('@/views/Intervention/Project/Parcel.vue'),
    
            name: 'KisipParcel',
            meta: { hidden: false,
              title: 'Parcels',
              icon:'carbon:choropleth-map',
            }
          },
          {
            path: 'map/:id',
          //  component: 'views/Map/SettlementParcelMap',
            component: () => import('@/views/Intervention/Project/Map.vue'),
            name: 'ProjectMap',  
            meta: {
              hidden: true,
              props: true,
              title: 'Map'
            }
          },
          {
            path: 'beneficiary',
            name: 'InterventionBeneficiary',
            component: () => import('@/views/Intervention/InterventionBeneficiary.vue'),
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
        component: Layout,
        redirect: '/interventions/kensup/proj',
        meta: {
          title: 'KENSUP',
          icon:'mdi:house-city'

        },
        children: [
          {
            path: 'proj',
            name: 'kensupInterventionProjects',
            component: () => import('@/views/Intervention/kensup/Project/Project.vue'),
            meta: {
              title: 'KENSUP',
              icon:'mdi:house-city'
            },
       
          },
        
        ]
      }
    ]
  },
  
 {
    path: '/facilities',
    component: Layout,
    redirect: '/facility/all',
    name: 'Facilities',
    meta: {
      hidden: false,
      title: 'Facilities',
      icon:'ic:outline-local-convenience-store',
      alwaysShow: false
    },
    children: [
      {
        path: 'all',
     //   component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'All',
        meta: {
          hidden: true,
          title: 'All'
        }
      },
      {
        path: 'health',
        //component: 'views/Facilities/Health/Health',
        component: () => import('@/views/Facilities/Health/Health.vue'),

        name: 'Health',
        meta: {
          icon: 'uis:hospital-symbol',
          title: 'Health'
        }
      },
      {
        path: 'health/add',
     //   component: 'views/Facilities/Health/Add',
        component: () => import('@/views/Facilities/Health/Add.vue'),

        name: 'Addhealth',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'health/map/:id',
      //  component: 'views/Facilities/Health/HealthMap',
        component: () => import('@/views/Facilities/Health/HealthMap.vue'),

        name: 'HealthFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'Facility Map'
        }
      },
      {
        path: 'health/details/:id',
      // component: 'views/Facilities/Health/HealthFacilityDetails',
        component: () => import('@/views/Facilities/Health/HealthFacilityDetails.vue'),

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
       // component: 'views/Facilities/Education/Education',
        component: () => import('@/views/Facilities/Education/Education.vue'),

        name: 'Education',
        meta: {
          icon: 'material-symbols:school-rounded',
          title: 'Education'
        }
      },
      {
        path: 'edu/add',
        //component: 'views/Facilities/Education/Add',
        component: () => import('@/views/Facilities/Education/Add.vue'),

        name: 'AddEducation',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'edu/map/:id',
        //component: 'views/Facilities/Education/SchoolMap',
        component: () => import('@/views/Facilities/Education/SchoolMap.vue'),

        name: 'EducationFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'School Map'
        }
      },
      {
        path: 'edu/details/:id',
        //component: 'views/Facilities/Education/EducationFacilityDetails',
        component: () => import('@/views/Facilities/Education/EducationFacilityDetails.vue'),

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
      //  component: 'views/Facilities/Roads/Roads',
        component: () => import('@/views/Facilities/Roads/Roads.vue'),

        name: 'Road',
        meta: {
          icon: 'icon-park-solid:map-road-two',
          title: 'Roads'
        }
      },
      {
        path: 'road/add',
        //component: 'views/Facilities/Roads/Add',
        component: () => import('@/views/Facilities/Roads/Add.vue'),

        name: 'AddRoad',
        icon: 'ant-design:plus-square-filled',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
 
      {
        path: 'road/details/:id',
       // component: 'views/Facilities/Roads/RoadDetails',
       component: () => import('@/views/Facilities/Roads/RoadFacilityDetails.vue'),
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
   //  component: 'views/Facilities/Roads/Assets',
     component: () => import('@/views/Facilities/Roads/Assets.vue'),

    name: 'RoadAsset',
    meta: {
      icon: 'game-icons:arch-bridge',
      title: 'Road Structures'
    }
  },
  {
    path: 'roadasset/add',
   // component: 'views/Facilities/Roads/AddAsset',
    component: () => import('@/views/Facilities/Roads/AddAsset.vue'),

    name: 'AddRoadStructure',
    icon: 'ant-design:plus-square-filled',
    meta: { hidden: true, title: 'Add', noCache: true }
      },
  

      /// Water -----------------------
   {
        path: 'water',
     //component: 'views/Facilities/Water/Water',
     component: () => import('@/views/Facilities/Water/Water.vue'),

        name: 'Water',
        meta: {
          icon: 'ic:sharp-water-drop',
          title: 'Water Points'
        }
      },
      {
        path: 'water/add',
      //  component: 'views/Facilities/Water/Add',
        component: () => import('@/views/Facilities/Water/Add.vue'),

        name: 'AddWaterPoint',
        icon: 'ant-design:plus-square-filled',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'water/map/:id',
      //  component: 'views/Facilities/Water/WaterMap',
        component: () => import('@/views/Facilities/Water/WaterMap.vue'),

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
       // component: 'views/Facilities/Water/WaterFacilityDetails',
        component: () => import('@/views/Facilities/Water/WaterFacilityDetails.vue'),

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
            //  component: 'views/Facilities/Sewer/Sewer',
              component: () => import('@/views/Facilities/Sewer/Sewer.vue'),

              name: 'Sewer',
              meta: {
                icon:'ph:toilet-fill',
                title: 'Sewer'
              }
            },
            {
              path: 'sewer/add',
             // component: 'views/Facilities/Sewer/Add',
              component: () => import('@/views/Facilities/Sewer/Add.vue'),

              name: 'AddSewer',
              icon: 'ant-design:plus-square-filled',
              meta: { hidden: true, title: 'Add', noCache: true }
            },
            {
              path: 'sewer/map/:id',
            //  component: 'views/Facilities/Sewer/SewerMap',
              component: () => import('@/views/Facilities/Sewer/SewerMap.vue'),

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
            //  component: 'views/Facilities/Sewer/SewerFacilityDetails',
              component: () => import('@/views/Facilities/Sewer/SewerFacilityDetails.vue'),

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
    // component: 'views/Facilities/Other/Other',
     component: () => import('@/views/Facilities/Other/Other.vue'),

    name: 'OtherFacility',
    meta: {
      icon:'zondicons:location-park',
      title: 'Others'
    }
  }, 
  {
    path: 'other/add',
  //  component: 'views/Facilities/Other/AddOther',
    component: () => import('@/views/Facilities/Other/AddOther.vue'),
    name: 'AddOther',
    icon: 'ant-design:plus-square-filled',
    meta: { hidden: true, title: 'Add Facility', noCache: true }
  }
    ]
  }, 
 


  {
    path: '/users',
    component: Layout,
    redirect: '/mne/indicator',
    name: 'systemUsers',
    meta: {
      title: 'Users',
      icon: 'wpf:usershield',
      alwaysShow: true
    },
    children: [

      {
        path: 'county',
      //  component: 'views/Users/County',
        component: () => import('@/views/Users/County.vue'),

        name: 'CountyStaff',
        meta: {
          title: 'County',
          hidden: false,
          icon:'gis:map-users'

        }
      }, 
    
    ]
  },

]

 
export const staffRoutes: AppRouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/national',
    name: 'Dashboard',
    meta: {
      title: t('Dashboards'),
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'national',
        component: () => import('@/views/Dashboard/National.vue'),
        name: 'National',
        meta: {
          title: t('Overview'),
          noCache: true,
          icon:'ic:round-bubble-chart',
          affix: true
        }
      },
      {
        path: 'status',
        component: () => import('@/views/Dashboard/CurrentSlumStatus.vue'),
        name: 'Status',
        meta: {
          title: t('Status'),
          noCache: true,
          affix: true,
          icon:'pajamas:status',

        }
      },
      {
        path: 'kisip1',
        component: () => import('@/views/Dashboard/Interventions.vue'),
        name: 'InterventionsDash',
        meta: {
          title: t('Kisip'),
          noCache: true,
          icon:'tabler:layout-dashboard',

        }
      }
    ]
  },
  {
    path: '/settlement',
    component: Layout,
    redirect: '/settlement/list',
    name: 'Settlements',
    meta: {
      title: t('Settlements'),
      icon: 'mdi:map-legend',
      alwaysShow: true
    },
    children: [

      {
        path: 'list',
        component: () => import('@/views/Settlement/Sett.vue'),
        name: 'List',
        meta: {
          title: 'List',
          icon:'material-symbols:format-list-bulleted-rounded'
        }
      },
   
      {
        path: ':id',
      //  component: 'views/Settlement/SettlementDetails',
        component: () => import('@/views/Settlement/SettlementDetails.vue'),

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
       // component: 'views/Settlement/Add',
        component: () => import('@/views/Settlement/AddSettlement.vue'),

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
       // component: 'views/Parcel/index',
        component: () => import('@/views/Parcel/index.vue'),

        name: 'Parcel',
        meta: { hidden: true,
          title: 'Parcel',
          icon:'carbon:choropleth-map',
        }
      },
      {
        path: 'hh/:id',
      //  component: 'views/Household/index',
        component: () => import('@/views/Household/filtered.vue'),

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
        path: 'hh/all',
        component: () => import('@/views/Household/All.vue'),
        name: 'AllHouseholds',
        props: {
          name: String
        },
        meta: {
          hidden: false,
          icon:'mdi:house-circle',
          title: 'Households'
        }
      },  
      {
        path: 'hh/add',
        component: () => import('@/views/Household/Add.vue'),
        name: 'AddHousehold',
        props: {
          name: String
        },
        meta: {
          hidden: true,
          icon:'bi:house-add',
          title: 'Add HH'
        }
      },   
      {
        path: 'map/:id',
      //  component: 'views/Map/SettlementParcelMap',
        component: () => import('@/views/Map/SettlementParcelMap.vue'),

        name: 'SettlementMap',
  
        meta: {
          hidden: true,
          props: true,
          title: 'Map'
        }
      },
 
  
      {
        path: 'map',
      //  component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'Map',
        meta: {
          hidden: true,
          title: 'Map'
        }
      }

    ]
  },
 
  {
    path: '/interventions',
    component: Layout,
    redirect: '/interventions/tenure/settlements',
    name: 'Interventions',
    meta: {
      title: 'Interventions',
      icon: 'mdi:office-building-marker-outline',
      hidden: false
    },
    children: [
      {
        path: 'kisip',
        name: 'kisipInterventions',
        component: Layout,
        redirect: '/interventions/kisip/settlements',
        meta: {
          title: 'KISIP',
          icon: 'mingcute:certificate-fill',

        },
        children: [
          {
            path: 'settlements',
            name: 'kisipInterventionSettlements',
          //  component: 'views/Intervention/Tenure/Settlements',
            component: () => import('@/views/Intervention/Settlements.vue'),
            meta: {
              title: 'Settlements',
              icon:'mdi:map-legend'
            }
          },
          {
            path: 'project',
            name: 'InterventionProjects',
            component: () => import('@/views/Intervention/Project/Project.vue'),
            meta: {
              title: 'Projects',
              icon:'fluent-emoji-high-contrast:construction'
            },
       
          },
          {
            path: 'add',
            name: 'AddInterventionProjects',
            component: () => import('@/views/Intervention/Project/AddProject.vue'),
            meta: {
              title: 'Add Project',
              hidden:true,
              icon:'material-symbols:add-circle-rounded'
            },
       
          },
          {
            path: 'parcel',
           // component: 'views/Parcel/index',
            component: () => import('@/views/Intervention/Project/Parcel.vue'),
    
            name: 'KisipParcel',
            meta: { hidden: false,
              title: 'Parcels',
              icon:'carbon:choropleth-map',
            }
          },
          {
            path: 'map/:id',
          //  component: 'views/Map/SettlementParcelMap',
            component: () => import('@/views/Intervention/Project/Map.vue'),
            name: 'ProjectMap',  
            meta: {
              hidden: true,
              props: true,
              title: 'Map'
            }
          },
          {
            path: 'beneficiary',
            name: 'InterventionBeneficiary',
            component: () => import('@/views/Intervention/InterventionBeneficiary.vue'),
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
        component: Layout,
        redirect: '/interventions/kensup/proj',
        meta: {
          title: 'KENSUP',
          icon:'mdi:house-city'

        },
        children: [
          {
            path: 'proj',
            name: 'kensupInterventionProjects',
            component: () => import('@/views/Intervention/kensup/Project/Project.vue'),
            meta: {
              title: 'KENSUP',
              icon:'mdi:house-city'
            },
       
          },
        
        ]
      },

    
    ]
  },
  
 {
    path: '/facilities',
    component: Layout,
    redirect: '/facility/all',
    name: 'Facilities',
    meta: {
      hidden: false,
      title: 'Facilities',
      icon:'ic:outline-local-convenience-store',
      alwaysShow: false
    },
    children: [
      {
        path: 'all',
     //   component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'All',
        meta: {
          hidden: true,
          title: 'All'
        }
      },
      {
        path: 'health',
        //component: 'views/Facilities/Health/Health',
        component: () => import('@/views/Facilities/Health/Health.vue'),

        name: 'Health',
        meta: {
          icon: 'uis:hospital-symbol',
          title: 'Health'
        }
      },
      {
        path: 'health/add',
     //   component: 'views/Facilities/Health/Add',
        component: () => import('@/views/Facilities/Health/Add.vue'),

        name: 'Addhealth',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'health/map/:id',
      //  component: 'views/Facilities/Health/HealthMap',
        component: () => import('@/views/Facilities/Health/HealthMap.vue'),

        name: 'HealthFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'Facility Map'
        }
      },
      {
        path: 'health/details/:id',
      // component: 'views/Facilities/Health/HealthFacilityDetails',
        component: () => import('@/views/Facilities/Health/HealthFacilityDetails.vue'),

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
       // component: 'views/Facilities/Education/Education',
        component: () => import('@/views/Facilities/Education/Education.vue'),

        name: 'Education',
        meta: {
          icon: 'material-symbols:school-rounded',
          title: 'Education'
        }
      },
      {
        path: 'edu/add',
        //component: 'views/Facilities/Education/Add',
        component: () => import('@/views/Facilities/Education/Add.vue'),

        name: 'AddEducation',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'edu/map/:id',
        //component: 'views/Facilities/Education/SchoolMap',
        component: () => import('@/views/Facilities/Education/SchoolMap.vue'),

        name: 'EducationFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'School Map'
        }
      },
      {
        path: 'edu/details/:id',
        //component: 'views/Facilities/Education/EducationFacilityDetails',
        component: () => import('@/views/Facilities/Education/EducationFacilityDetails.vue'),

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
      //  component: 'views/Facilities/Roads/Roads',
        component: () => import('@/views/Facilities/Roads/Roads.vue'),

        name: 'Road',
        meta: {
          icon: 'icon-park-solid:map-road-two',
          title: 'Roads'
        }
      },
      {
        path: 'road/add',
        //component: 'views/Facilities/Roads/Add',
        component: () => import('@/views/Facilities/Roads/Add.vue'),

        name: 'AddRoad',
        icon: 'ant-design:plus-square-filled',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
 
      {
        path: 'road/details/:id',
       // component: 'views/Facilities/Roads/RoadDetails',
       component: () => import('@/views/Facilities/Roads/RoadFacilityDetails.vue'),

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
   //  component: 'views/Facilities/Roads/Assets',
     component: () => import('@/views/Facilities/Roads/Assets.vue'),

    name: 'RoadAsset',
    meta: {
      icon: 'game-icons:arch-bridge',
      title: 'Road Structures'
    }
  },
  {
    path: 'roadasset/add',
   // component: 'views/Facilities/Roads/AddAsset',
    component: () => import('@/views/Facilities/Roads/AddAsset.vue'),

    name: 'AddRoadStructure',
    icon: 'ant-design:plus-square-filled',
    meta: { hidden: true, title: 'Add', noCache: true }
      },
  

      /// Water -----------------------
   {
        path: 'water',
     //component: 'views/Facilities/Water/Water',
     component: () => import('@/views/Facilities/Water/Water.vue'),

        name: 'Water',
        meta: {
          icon: 'ic:sharp-water-drop',
          title: 'Water Points'
        }
      },
      {
        path: 'water/add',
      //  component: 'views/Facilities/Water/Add',
        component: () => import('@/views/Facilities/Water/Add.vue'),

        name: 'AddWaterPoint',
        icon: 'ant-design:plus-square-filled',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'water/map/:id',
      //  component: 'views/Facilities/Water/WaterMap',
        component: () => import('@/views/Facilities/Water/WaterMap.vue'),

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
       // component: 'views/Facilities/Water/WaterFacilityDetails',
        component: () => import('@/views/Facilities/Water/WaterFacilityDetails.vue'),

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
            //  component: 'views/Facilities/Sewer/Sewer',
              component: () => import('@/views/Facilities/Sewer/Sewer.vue'),

              name: 'Sewer',
              meta: {
                icon:'ph:toilet-fill',
                title: 'Sewer'
              }
            },
            {
              path: 'sewer/add',
             // component: 'views/Facilities/Sewer/Add',
              component: () => import('@/views/Facilities/Sewer/Add.vue'),

              name: 'AddSewer',
              icon: 'ant-design:plus-square-filled',
              meta: { hidden: true, title: 'Add', noCache: true }
            },
            {
              path: 'sewer/map/:id',
            //  component: 'views/Facilities/Sewer/SewerMap',
              component: () => import('@/views/Facilities/Sewer/SewerMap.vue'),

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
            //  component: 'views/Facilities/Sewer/SewerFacilityDetails',
              component: () => import('@/views/Facilities/Sewer/SewerFacilityDetails.vue'),

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
    // component: 'views/Facilities/Other/Other',
     component: () => import('@/views/Facilities/Other/Other.vue'),

    name: 'OtherFacility',
    meta: {
      icon:'zondicons:location-park',
      title: 'Others'
    }
  }, 
  {
    path: 'other/add',
  //  component: 'views/Facilities/Other/AddOther',
    component: () => import('@/views/Facilities/Other/AddOther.vue'),
    name: 'AddOther',
    icon: 'ant-design:plus-square-filled',
    meta: { hidden: true, title: 'Add Facility', noCache: true }
  }
    ]
  }, 
  {
    path: '/data',
    component: Layout,
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
       // component: 'views/ImportData/list',
        component: () => import('@/views/ImportData/list.vue'),

        name: 'ImportData',
        meta: {
          title: 'List',
          icon: 'bi:filetype-xlsx',
          hidden: true

        }
      },
      {
        path: 'hh',
    //    component: 'views/ImportData/excel',
        component: () => import('@/views/ImportData/excel.vue'),

        name: 'ImportHH',
        meta: {
          title: 'Excel',
          icon: 'bi:filetype-xlsx',

        }
      },
      {
        path: 'geo',
        //component: 'views/ImportData/geo',
        component: () => import('@/views/ImportData/geo.vue'),

        name: 'Importgeo',
        meta: {
          title: 'Spatial',
          icon: 'gis:geojson-file',

        }
      }
    ]
  },
  {
    path: '/mne',
    component: Layout,
    redirect: '/mne/indicator',
    name: 'MonitoringEvaluation',
    meta: {
      title: 'M&E',
      icon: 'uis:graph-bar',
      alwaysShow: false
    },
    children: [
      {
        path: 'new',
      //  component: 'views/Indicators/indicator_category_report',
        component: () => import('@/views/Indicators/indicator_category_report_new.vue'),
        name: 'NewReports',
        meta: {
          title: 'New Reports',
          icon:'carbon:result-new',
          
        }
      },
      {
        path: 'reports',
      //  component: 'views/Indicators/indicator_category_report',
        component: () => import('@/views/Indicators/indicator_category_report.vue'),
        name: 'Reports',
        meta: {
          title: 'M&E Reports',
          icon:'mdi:file-document-plus',
        }
      },
   
      {
        path: 'config',
     //   component: 'views/Indicators/indicator_category',
        component: () => import('@/views/Indicators/indicator_category.vue'),

        name: 'IndicatorCategory',
        meta: {
          title: 'Configurations',
          icon:'material-symbols:settings',
          hidden: false

        }
      },
      {
        path: 'list',
     //   component: 'views/Indicators/indicator',
        component: () => import('@/views/Indicators/indicator.vue'),

        name: 'Indicators',
        meta: {
          title: 'Indicators',
          hidden: false,
          icon:'cil:gauge'

        }
      },
      {
        path: 'category',
       // component: 'views/Indicators/category',
        component: () => import('@/views/Indicators/category.vue'),

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
    path: '/settings',
    component: Layout,
    redirect: '/dashbaord',
    name: 'Settings',
    meta: {
      title: 'Settings',
      icon: 'material-symbols:settings',
      alwaysShow: true
    },
    children: [
       {
        path: 'clusters',
      //  component: 'views/Users/County',
        component: () => import('@/views/settings/Cluster.vue'),
        name: 'Clusters',
        meta: {
          title: 'Clusters',
          hidden: false,
          icon:'clarity:heat-map-line'
        }
      },
      {
        path: 'category',
      //  component: 'views/Users/County',
        component: () => import('@/views/settings/Category.vue'),
        name: 'SettingsCategory',
        meta: {
          title: 'Category',
          hidden: false,
          icon:'material-symbols:settings'

        }
      }, 
      {
        path: 'programmes',
      //  component: 'views/Users/County',
        component: () => import('@/views/settings/Programme.vue'),
        name: 'Programmes',
        meta: {
          title: 'Programmes',
          hidden: false,
          icon:'material-symbols:settings'

        }
      }, 
    ]
  }
]

export const adminRoutes: AppRouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/national',
    name: 'Dashboard',
    meta: {
      title: t('Dashboards'),
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'national',
        component: () => import('@/views/Dashboard/National.vue'),
        name: 'National',
        meta: {
          title: t('Overview'),
          noCache: true,
          icon:'ic:round-bubble-chart',
          affix: true
        }
      },
      {
        path: 'status',
        component: () => import('@/views/Dashboard/CurrentSlumStatus.vue'),
        name: 'Status',
        meta: {
          title: t('Status'),
          noCache: true,
          affix: true,
          icon:'pajamas:status',

        }
      },
      {
        path: 'achievements',
        component: () => import('@/views/Dashboard/Interventions.vue'),
        name: 'InterventionsDashboard',
        meta: {
          title: t('Interventions'),
          noCache: true,
          icon:'fa-solid:hands-helping',

        }
      }
    ]
  },
  {
    path: '/settlement',
    component: Layout,
    redirect: '/settlement/list',
    name: 'Settlements',
    meta: {
      title: t('Settlements'),
      icon: 'mdi:map-legend',
      alwaysShow: true
    },
    children: [

      {
        path: 'list',
        component: () => import('@/views/Settlement/Sett.vue'),
        name: 'List',
        meta: {
          title: 'List',
          icon:'material-symbols:format-list-bulleted-rounded'
        }
      },
   
      {
        path: ':id',
      //  component: 'views/Settlement/SettlementDetails',
        component: () => import('@/views/Settlement/SettlementDetails.vue'),

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
       // component: 'views/Settlement/Add',
        component: () => import('@/views/Settlement/AddSettlement.vue'),

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
       // component: 'views/Parcel/index',
        component: () => import('@/views/Parcel/index.vue'),

        name: 'Parcel',
        meta: { hidden: true,
          title: 'Parcel',
          icon:'carbon:choropleth-map',
        }
      },
      {
        path: 'beneficiary',
        name: 'InterventionBeneficiary',
        component: () => import('@/views/Intervention/InterventionBeneficiary.vue'),
        meta: {
          title: 'Beneficiaries',
          icon:'bi:people-fill'
        },
   
      },
      {
        path: 'hh/:id',
      //  component: 'views/Household/index',
        component: () => import('@/views/Household/filtered.vue'),

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
        path: 'hh/all',
        component: () => import('@/views/Household/All.vue'),
        name: 'AllHouseholds',
        props: {
          name: String
        },
        meta: {
          hidden: false,
          icon:'mdi:house-circle',
          title: 'Households'
        }
      },  
      {
        path: 'hh/add',
        component: () => import('@/views/Household/Add.vue'),
        name: 'AddHousehold',
        props: {
          name: String
        },
        meta: {
          hidden: true,
          icon:'bi:house-add',
          title: 'Add HH'
        }
      },   
      {
        path: 'map/:id',
      //  component: 'views/Map/SettlementParcelMap',
        component: () => import('@/views/Map/SettlementParcelMap.vue'),

        name: 'SettlementMap',
  
        meta: {
          hidden: true,
          props: true,
          title: 'Map'
        }
      },
      // {
      //   path: 'uploads',
      //  // component: 'views/Uploads/uploads',
      //   component: () => import('@/views/Uploads/uploads.vue'),

      //   name: 'Uploads',
      //   meta: {
      //     hidden: false,
      //     props: true,
      //     icon:'ion:document-attach',

      //     title: 'Documents'
      //   }
      // },
/*       {
        path: 'upload/file',
     //   component: 'views/Uploads/uploadFiles',
        component: () => import('@/views/Uploads/uploadFiles.vue'),

        name: 'uploadFiles',
  
        meta: {
          hidden: true,
          props: true,
          title: 'uploadFiles'
        }
      },
       */
  
    //   {
    //     path: 'doc/:id',
    //  //   component: 'views/Settlement/SettlementDocs',
    //     component: () => import('@/views/Settlement/SettlementDocs.vue'),

    //     name: 'SettlementDocs',
  
    //     meta: {
    //       hidden: true,
    //       props: true,
    //       title: 'Documents'
    //     }
    //   },
  
      {
        path: 'map',
      //  component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'Map',
        meta: {
          hidden: true,
          title: 'Map'
        }
      }

    ]
  },
 
  {
    path: '/interventions',
    component: Layout,
    redirect: '/interventions/tenure',
    name: 'Interventions',
    meta: {
      title: 'Interventions',
      icon: 'mdi:office-building-marker-outline',
      hidden: true
    },
    children: [
      {
        path: 'add/:domain',
        name: 'AddInterventionProjectsV2',
        component: () => import('@/views/Intervention/Project/AddProject.vue'),
        meta: {
          title: 'Add Project',
          hidden: true,
          props: true,
          icon:'material-symbols:add-circle-rounded'
        },
   
      },
      {
        path: 'tenure',
        name: 'kisipInterventions',
        component: Layout,
        redirect: '/interventions/kisip/project',
        meta: {
          title: 'Tenure',
          icon: 'icon-park-outline:certificate',
          hidden: true,

        }
      }
    ]
    
    },
  
/*   {
    path: '/interventions',
    component: Layout,
    redirect: '/interventions/tenure/settlements',
    name: 'Interventions',
    meta: {
      title: 'Programmes',
      icon: 'mdi:office-building-marker-outline',
      hidden: false
    },
    children: [
      {
        path: 'tenure',
        name: 'kisipInterventions',
        component: Layout,
        redirect: '/interventions/kisip/project',
        meta: {
          title: 'Tenure',
          icon: 'icon-park-outline:certificate',

        },
        children: [
 
          {
            path: 'project',
            name: 'TenureInterventionProjects',
            component: () => import('@/views/Intervention/Tenure/Projects.vue'),
            meta: {
              title: 'Projects',
              icon:'fluent-emoji-high-contrast:construction'
            },
       
          },
          {
            path: 'add',
            name: 'AddInterventionProjects',
            component: () => import('@/views/Intervention/Project/AddProject.vue'),
            meta: {
              title: 'Add Project',
              hidden:true,
              icon:'material-symbols:add-circle-rounded'
            },
       
          },
          {
            path: 'parcel',
           // component: 'views/Parcel/index',
            component: () => import('@/views/Intervention/Project/Parcel.vue'),
    
            name: 'KisipParcel',
            meta: { hidden: false,
              title: 'Parcels',
              icon:'carbon:choropleth-map',
            }
          },
          {
            path: 'map/:id',
          //  component: 'views/Map/SettlementParcelMap',
            component: () => import('@/views/Intervention/Project/Map.vue'),
            name: 'ProjectMap',  
            meta: {
              hidden: true,
              props: true,
              title: 'Map'
            }
          },
          {
            path: 'beneficiary',
            name: 'InterventionBeneficiary',
            component: () => import('@/views/Intervention/InterventionBeneficiary.vue'),
            meta: {
              title: 'Beneficiaries',
              icon:'bi:people-fill'
            },
       
          }
        ]
      },
   
      
      {
        path: 'socio',
        component: Layout,
        redirect: '/interventions/kensup/proj',
        name: 'SocioEconomic',

        meta: {
          title: 'Socio-Economic',
          icon:'fluent:people-community-16-regular'

        },
        children: [
          {
            path: 'projects',
            name: 'SocioEconomicInterventions',
            component: () => import('@/views/Intervention/SocioEconomic/Projects.vue'),
            meta: {
              title: 'Socio Economic',
              icon:'healthicons:community-meeting'
            },
          },

        ]
      },

      
      {
        path: 'infrastructure',
        component: Layout,
        redirect: '/interventions/kensup/proj',
        name: 'Infrastructure',

        meta: {
          title: 'Infrastructure',
          icon:'fa6-solid:road-barrier'

        },
        children: [
          {
            path: 'physical',
            name: 'InfrastructureInterventionProjects',
            component: () => import('@/views/Intervention/Infrastructure/Projects.vue'),
            meta: {
              title: 'Infrastructure',
              icon:'ps:road'
            },
          },
        ]
      },
      {
        path: 'env',
        component: Layout,
        redirect: '/interventions/kensup/proj',
        name: 'EnvironmentProjs',

        meta: {
          title: 'Environment',
          icon:'fa6-solid:road-barrier'

        },
        children: [
          {
            path: 'envt',
            name: 'EnvtInterventionProjects',
            component: () => import('@/views/Intervention/EnvironMent/Projects.vue'),
            meta: {
              title: 'Environment',
              icon:'mdi:environment-outline'
            },
          },
        ]
      },
   
      {
        path: 'strategy',
        component: Layout,
        redirect: '/interventions/kensup/proj',
        name: 'StrategyInterventions',
        meta: {
          title: 'Strategy',
          icon:'mdi:strategy'
        },
        children: [
          {
            path: 'project',
            name: 'StrategyInterventionsProjs',
            component: () => import('@/views/Intervention/Strategy/Projects.vue'),
            meta: {
              title: 'Strategy',
              icon:'mdi:strategy'
            },
          },
        ]
      },


      {
        path: 'add/:domain',
        name: 'AddInterventionProjectsV2',
        component: () => import('@/views/Intervention/Project/AddProject.vue'),
        meta: {
          title: 'Add Project',
          hidden: true,
          props: true,
          icon:'material-symbols:add-circle-rounded'
        },
   
      },
    ]
  },
   */
 {
    path: '/facilities',
    component: Layout,
    redirect: '/facility/all',
    name: 'Facilities',
    meta: {
      hidden: false,
      title: 'Facilities',
      icon:'ic:outline-local-convenience-store',
      alwaysShow: false
    },
    children: [
      {
        path: 'all',
     //   component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'All',
        meta: {
          hidden: true,
          title: 'All'
        }
      },
      {
        path: 'health',
        //component: 'views/Facilities/Health/Health',
        component: () => import('@/views/Facilities/Health/Health.vue'),

        name: 'Health',
        meta: {
          icon: 'uis:hospital-symbol',
          title: 'Health'
        }
      },
      {
        path: 'health/add',
     //   component: 'views/Facilities/Health/Add',
        component: () => import('@/views/Facilities/Health/Add.vue'),

        name: 'Addhealth',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'health/map/:id',
      //  component: 'views/Facilities/Health/HealthMap',
        component: () => import('@/views/Facilities/Health/HealthMap.vue'),

        name: 'HealthFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'Facility Map'
        }
      },
      {
        path: 'health/details/:id',
      // component: 'views/Facilities/Health/HealthFacilityDetails',
        component: () => import('@/views/Facilities/Health/HealthFacilityDetails.vue'),

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
       // component: 'views/Facilities/Education/Education',
        component: () => import('@/views/Facilities/Education/Education.vue'),

        name: 'Education',
        meta: {
          icon: 'material-symbols:school-rounded',
          title: 'Education'
        }
      },
      {
        path: 'edu/add',
        //component: 'views/Facilities/Education/Add',
        component: () => import('@/views/Facilities/Education/Add.vue'),

        name: 'AddEducation',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'edu/map/:id',
        //component: 'views/Facilities/Education/SchoolMap',
        component: () => import('@/views/Facilities/Education/SchoolMap.vue'),

        name: 'EducationFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'School Map'
        }
      },
      {
        path: 'edu/details/:id',
        //component: 'views/Facilities/Education/EducationFacilityDetails',
        component: () => import('@/views/Facilities/Education/EducationFacilityDetails.vue'),

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
      //  component: 'views/Facilities/Roads/Roads',
        component: () => import('@/views/Facilities/Roads/Roads.vue'),

        name: 'Road',
        meta: {
          icon: 'icon-park-solid:map-road-two',
          title: 'Roads'
        }
      },
      {
        path: 'road/add',
        //component: 'views/Facilities/Roads/Add',
        component: () => import('@/views/Facilities/Roads/Add.vue'),
        name: 'AddRoad',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
 
      {
        path: 'road/details/:id',
       // component: 'views/Facilities/Roads/RoadDetails',
       component: () => import('@/views/Facilities/Roads/RoadFacilityDetails.vue'),
        name: 'RoadsDetails',
        meta: {
          hidden: true,
          props: true,
          title: 'Road Profile'
        }
      },

      
      {
        path: 'road/map/:id',
      //  component: 'views/Facilities/Water/WaterMap',
        component: () => import('@/views/Facilities/Roads/RoadMap.vue'),
        name: 'RoadMap',
         meta: {
          hidden: true,
          props: true,
          title: 'Road Map'
        }
      },


   /// Roads Assets-----------------------
   {
    path: 'roadasset',
   //  component: 'views/Facilities/Roads/Assets',
     component: () => import('@/views/Facilities/Roads/Assets.vue'),

    name: 'RoadAsset',
    meta: {
      icon: 'game-icons:arch-bridge',
      hidden: true, 
      title: 'Road Structures'
    }
  },
  {
    path: 'roadasset/add',
   // component: 'views/Facilities/Roads/AddAsset',
    component: () => import('@/views/Facilities/Roads/AddAsset.vue'),
    name: 'AddRoadStructure',
 
    meta: { hidden: true, title: 'Add', noCache: true }
      },
  
      {
        path: 'roadasset/map/:id',
      //  component: 'views/Facilities/Sewer/SewerMap',
        component: () => import('@/views/Facilities/Roads/RoadAssetMap.vue'),
        name: 'RoadAssetMap',
        meta: {
          hidden: true,
          props: true,
          title: 'Road Asset Map'
        }
      },




      /// Water -----------------------
   {
        path: 'water',
     //component: 'views/Facilities/Water/Water',
     component: () => import('@/views/Facilities/Water/Water.vue'),
        name: 'Water',
        meta: {
          icon: 'ic:sharp-water-drop',
          title: 'Water'
     },
             
        
     children: [
    {
        path: 'wp',
      //  component: 'views/Facilities/Water/Add',
        component: () => import('@/views/Facilities/Water/Water.vue'),
        name: 'WaterPoint',
         meta: {
           hidden: false,
           icon: 'ic:sharp-water-drop',
           title: 'Water Points', noCache: true
         }
       },
       {
        path: 'wp/add',
      //  component: 'views/Facilities/Water/Add',
        component: () => import('@/views/Facilities/Water/Add.vue'),
        name: 'AddWaterPoint',
        icon: 'ant-design:plus-square-filled',
        meta: { hidden: true, title: 'Add', noCache: true }
       },

       {
        path: 'pipedwater',
     //component: 'views/Facilities/Water/Water',
     component: () => import('@/views/Facilities/PipedWater/PipedWater.vue'),
        name: 'PipedWater',
        meta: {
          icon: 'game-icons:tap',
          title: 'Piped Water'
        }
      },
      {
        path: 'pipedwater/add',
     //component: 'views/Facilities/Water/Water',
     component: () => import('@/views/Facilities/PipedWater/Add.vue'),
        name: 'PipedWaterAdd',
        meta: {
          icon: 'ic:sharp-water-drop',
          title: 'Add Piped Water',
          hidden:true
        }
      },

      {
        path: 'pipedwater/details/:id',
      //  component: 'views/Facilities/Sewer/SewerFacilityDetails',
        component: () => import('@/views/Facilities/PipedWater/PipedWaterFacilityDetails.vue'),

        name: 'PipedWaterFacilityDetails',
        meta: {
          hidden: true,
          props: true,
          title: 'Scheme Profile'
        }
},
      {
        path: 'water/map/:id',
      //  component: 'views/Facilities/Water/WaterMap',
        component: () => import('@/views/Facilities/Water/WaterMap.vue'),

        name: 'WaterMap',

        meta: {
          hidden: true,
          icon: 'ant-design:plus-square-filled',

          props: true,
          title: 'Water Point Map'
        }
      },
      {
        path: 'water/details/:id',
       // component: 'views/Facilities/Water/WaterFacilityDetails',
        component: () => import('@/views/Facilities/Water/WaterFacilityDetails.vue'),

        name: 'WaterDetails',
        meta: {
          hidden: true,
          props: true,
          title: 'Water Point Profile'
        }
      },

     ]
     
      },
    
  
  
   /// Sewer -----------------------
            {
              path: 'sewer',
            //  component: 'views/Facilities/Sewer/Sewer',
              component: () => import('@/views/Facilities/Sewer/Sewer.vue'),

              name: 'Sewer',
              meta: {
                icon:'ph:toilet-fill',
                title: 'Sewer'
              }
            },
            {
              path: 'sewer/add',
             // component: 'views/Facilities/Sewer/Add',
              component: () => import('@/views/Facilities/Sewer/Add.vue'),

              name: 'AddSewer',
              icon: 'ant-design:plus-square-filled',
              meta: { hidden: true, title: 'Add', noCache: true }
            },
            {
              path: 'sewer/map/:id',
            //  component: 'views/Facilities/Sewer/SewerMap',
              component: () => import('@/views/Facilities/Sewer/SewerMap.vue'),

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
            //  component: 'views/Facilities/Sewer/SewerFacilityDetails',
              component: () => import('@/views/Facilities/Sewer/SewerFacilityDetails.vue'),

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
    // component: 'views/Facilities/Other/Other',
     component: () => import('@/views/Facilities/Other/Other.vue'),

    name: 'OtherFacility',
    meta: {
      icon:'zondicons:location-park',
      title: 'Others'
    }
  }, 
  {
    path: 'other/add',
  //  component: 'views/Facilities/Other/AddOther',
    component: () => import('@/views/Facilities/Other/AddOther.vue'),
    name: 'AddOther',
    meta: { hidden: true, title: 'Add Facility', noCache: true }
      },
      {
        path: 'other/map/:id',
      //  component: 'views/Facilities/Sewer/SewerMap',
        component: () => import('@/views/Facilities/Other/OtherMap.vue'),
        name: 'OtherMap',
         meta: {
          hidden: true,
          props: true,
          title: 'Road Map'
        }
      },

      {
        path: 'other/details/:id',
      //  component: 'views/Facilities/Sewer/SewerFacilityDetails',
        component: () => import('@/views/Facilities/Other/OtherFacilityDetails.vue'),

        name: 'OtherFacilityDetails',
        meta: {
          hidden: true,
          props: true,
          title: 'Facility Profile'
        }
},
  
    ]
  }, 
  {
    path: '/data',
    component: Layout,
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
       // component: 'views/ImportData/list',
        component: () => import('@/views/ImportData/list.vue'),

        name: 'ImportData',
        meta: {
          title: 'List',
          icon: 'bi:filetype-xlsx',
          hidden: true

        }
      },
      {
        path: 'xlsx',
    //    component: 'views/ImportData/excel',
        component: () => import('@/views/ImportData/excel.vue'),

        name: 'ImportHH',
        meta: {
          title: 'Excel',
          hidden:true,
          icon: 'bi:filetype-xlsx',

        }
      },
      {
        path: 'fuzzy',
    //    component: 'views/ImportData/excel',
        component: () => import('@/views/ImportData/Fuzzy.vue'),

        name: 'Fuzzy',
        meta: {
          title: 'List(xlsx)',
          icon: 'bi:filetype-xlsx',

        }
      },
      {
        path: 'geo',
        //component: 'views/ImportData/geo',
        component: () => import('@/views/ImportData/geo.vue'),

        name: 'Importgeo',
        meta: {
          title: 'Spatial',
          icon: 'gis:geojson-file',

        }
      },
      {
        path: 'docs',
    //    component: 'views/ImportData/excel',
        component: () => import('@/views/ImportData/Document.vue'),
        name: 'ImportDocuments',
        meta: {
          title: 'Documents',
          icon: 'mdi:file-upload-outline',
        }
      },
    ]
  },
  {
    path: '/repository',
    component: Layout,
    //redirect: '/settings',
    name: 'Repository',
    meta: {
      title: 'Repository',
      icon: 'material-symbols:home-storage-rounded',
      alwaysShow: true
    },
    children: [
       {
        path: 'manage',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/Documents.vue'),
        name: 'RepositoryDocs',
        meta: {
          title: 'Manage',
          hidden: false,
          icon:'bi:clipboard2-data-fill'
        }
      },

      {
        path: 'docs',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/DocumentsTagged.vue'),
        name: 'RepositoryTagged',
        meta: {
          title: 'Documents',
          hidden: false,
          icon:'bi:clipboard2-data-fill'
        }
      },
      {
        path: 'data',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/Data.vue'),
        name: 'RepositoryData',
        meta: {
          title: 'Data',
          hidden: false,
          icon:'fluent:calendar-data-bar-16-regular'
        }
      },
    ]
  },

  {
    path: '/mne',
    component: Layout,
    redirect: '/mne/indicator',
    name: 'MonitoringEvaluation',
    meta: {
      title: 'M&E',
      icon: 'uis:graph-bar',
      alwaysShow: false
    },
    children: [
      {
        path: 'new',
      //  component: 'views/Indicators/indicator_category_report',
        component: () => import('@/views/Indicators/indicator_category_report_new.vue'),
        name: 'NewReports',
        meta: {
          title: 'New Reports',
          icon:'carbon:result-new',
          
        }
      },
      {
        path: 'reports',
      //  component: 'views/Indicators/indicator_category_report',
        component: () => import('@/views/Indicators/indicator_category_report.vue'),
        name: 'Reports',
        meta: {
          title: 'M&E Reports',
          icon:'mdi:file-document-plus',
        }
      },
   
      {
        path: 'config',
     //   component: 'views/Indicators/indicator_category',
        component: () => import('@/views/Indicators/indicator_category.vue'),

        name: 'IndicatorCategory',
        meta: {
          title: 'Configurations',
          icon:'material-symbols:settings',
          hidden: false

        }
      },
      {
        path: 'list',
     //   component: 'views/Indicators/indicator',
        component: () => import('@/views/Indicators/indicator.vue'),

        name: 'Indicators',
        meta: {
          title: 'Indicators',
          hidden: false,
          icon:'cil:gauge'

        }
      },
      {
        path: 'category',
       // component: 'views/Indicators/category',
        component: () => import('@/views/Indicators/category.vue'),

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
    component: Layout,
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
       // component: 'views/Users/User',
        component: () => import('@/views/Users/User.vue'),
        name: 'staff',
        meta: {
          title: 'All',
          hidden: false,
          icon: 'fa6-solid:users-rectangle',

        }
      },
      {
        path: 'new',
       // component: 'views/Users/User',
        component: () => import('@/views/Users/NewAccounts.vue'),
        name: 'NewAccounts',
        meta: {
          title: 'New',
          hidden: false,
          icon:'grommet-icons:user-new',

        }
      },
      {
        path: 'county',
      //  component: 'views/Users/County',
        component: () => import('@/views/Users/County.vue'),

        name: 'CountyStaff',
        meta: {
          title: 'County',
          hidden: false,
          icon:'gis:map-users'

        }
      }, 
      {
        path: 'profile',
      //  component: 'views/Users/County',
        component: () => import('@/views/Users/Profile.vue'),
        name: 'userProfile',
        meta: {
          title: 'Profile',
          hidden: false,
          icon:'gis:map-users'

        }
      }, 

      {
        path: 'logs',
      //  component: 'views/Users/County',
        component: () => import('@/views/Users/Logs.vue'),
        name: 'Logs',
        meta: {
          title: 'Logs',
          hidden: false,
          icon:'ic:twotone-logo-dev'

        }
      }, 
    ]
  },
  {
    path: '/settings',
    component: Layout,
    //redirect: '/settings',
    name: 'Settings',
    meta: {
      title: 'Settings',
      icon: 'material-symbols:settings',
      alwaysShow: true
    },
    children: [
       {
        path: 'clusters',
      //  component: 'views/Users/County',
        component: () => import('@/views/settings/Cluster.vue'),
        name: 'Clusters',
        meta: {
          title: 'Clusters',
          hidden: false,
          icon:'clarity:heat-map-line'
        }
      },
      {
        path: 'category',
      //  component: 'views/Users/County',
        component: () => import('@/views/settings/Category.vue'),
        name: 'SettingsCategory',
        meta: {
          title: 'Category',
          hidden: false,
          icon:'material-symbols:settings'

        }
      }, 
      {
        path: 'focus',
      //  component: 'views/Users/County',
        component: () => import('@/views/settings/StrategicFocus.vue'),
        name: 'StrategicFocus',
        meta: {
          title: 'Domains',
          hidden: false,
          icon:'material-symbols:settings'

        }
      }, 
      {
        path: 'progs',
      //  component: 'views/Users/County',
       // component: () => import('@/views/settings/Programmes.vue'),
        component: () => import('@/views/settings/Programme.vue'),

        name: 'ProjectsProgrammes',
        meta: {
          title: 'Programmes',
          hidden: false,
          icon:'material-symbols:settings'

        }
      }, 
      {
        path: 'components',
      //  component: 'views/Users/County',
        component: () => import('@/views/settings/Component.vue'),
        name: 'ProgrammeComponents',
        meta: {
          title: 'Components',
          hidden: false,
          icon:'material-symbols:settings'

        }
      }, 
      {
        path: 'projcat',
      //  component: 'views/Users/County',
        component: () => import('@/views/settings/ProjectCategory.vue'),
        name: 'ProjectCategory',
        meta: {
          title: 'Project Types',
          hidden: false,
          icon:'material-symbols:settings'

        }
      }, 
      {
        path: 'doctype',
        component: () => import('@/views/settings/DocumentType.vue'),
        name: 'DocumentTypes',
        meta: {
          title: 'Document Types',
          hidden: false,
          icon:'material-symbols:settings'

        }
      }, 
    ]
  }
]


export const countyUserRoutes: AppRouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/national',
    name: 'Dashboard',
    meta: {
      title: t('Dashboards'),
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'national',
        component: () => import('@/views/Dashboard/National.vue'),
        name: 'National',
        meta: {
          title: t('Overview'),
          noCache: true,
          icon:'ic:round-bubble-chart',
          affix: true
        }
      },
      {
        path: 'status',
        component: () => import('@/views/Dashboard/CurrentSlumStatus.vue'),
        name: 'Status',
        meta: {
          title: t('Status'),
          noCache: true,
          affix: true,
          icon:'pajamas:status',

        }
      },
      {
        path: 'kisip1',
        component: () => import('@/views/Dashboard/Interventions.vue'),
        name: 'InterventionsDashboard',
        meta: {
          title: t('Interventions'),
          noCache: true,
          icon:'tabler:layout-dashboard',

        }
      }
    ]
  },
  {
    path: '/settlement',
    component: Layout,
    redirect: '/settlement/list',
    name: 'Settlements',
    meta: {
      title: t('Settlements'),
      icon: 'mdi:map-legend',
      alwaysShow: true
    },
    children: [

      {
        path: 'list',
        component: () => import('@/views/Settlement/Sett.vue'),
        name: 'List',
        meta: {
          title: 'List',
          icon:'material-symbols:format-list-bulleted-rounded'
        }
      },
   
      {
        path: ':id',
      //  component: 'views/Settlement/SettlementDetails',
        component: () => import('@/views/Settlement/SettlementDetails.vue'),

        name: 'SettlementDetails',
        meta: {
          hidden: true,
          title: 'Settlement Details',
          icon:'ion:document-attach',
          noCache: true
        }
      },
    
      {
        path: 'parcel',
       // component: 'views/Parcel/index',
        component: () => import('@/views/Parcel/index.vue'),

        name: 'Parcel',
        meta: { hidden: true,
          title: 'Parcel',
          icon:'carbon:choropleth-map',
        }
      },
   
      {
        path: 'map/:id',
      //  component: 'views/Map/SettlementParcelMap',
        component: () => import('@/views/Map/SettlementParcelMap.vue'),

        name: 'SettlementMap',
  
        meta: {
          hidden: true,
          props: true,
          title: 'Map'
        }
      },
       
  
      {
        path: 'map',
      //  component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'Map',
        meta: {
          hidden: true,
          title: 'Map'
        }
      }

    ]
  },
 
  {
    path: '/interventions',
    component: Layout,
    redirect: '/interventions/tenure/settlements',
    name: 'Programmes',
    meta: {
      title: 'Interventions',
      icon: 'mdi:office-building-marker-outline',
      hidden: false
    },
    children: [
      {
        path: 'kisip',
        name: 'kisipInterventions',
        component: Layout,
        redirect: '/interventions/kisip/settlements',
        meta: {
          title: 'KISIP',
          icon: 'mingcute:certificate-fill',

        },
        children: [
          {
            path: 'settlements',
            name: 'kisipInterventionSettlements',
          //  component: 'views/Intervention/Tenure/Settlements',
            component: () => import('@/views/Intervention/Settlements.vue'),
            meta: {
              title: 'Settlements',
              icon:'mdi:map-legend'
            }
          },
          {
            path: 'project',
            name: 'InterventionProjects',
            component: () => import('@/views/Intervention/Project/Project.vue'),
            meta: {
              title: 'Projects',
              icon:'fluent-emoji-high-contrast:construction'
            },
       
          },
          {
            path: 'add',
            name: 'AddInterventionProjects',
            component: () => import('@/views/Intervention/Project/AddProject.vue'),
            meta: {
              title: 'Add Project',
              hidden:true,
              icon:'material-symbols:add-circle-rounded'
            },
       
          },
          {
            path: 'parcel',
           // component: 'views/Parcel/index',
            component: () => import('@/views/Intervention/Project/Parcel.vue'),
    
            name: 'KisipParcel',
            meta: { hidden: false,
              title: 'Parcels',
              icon:'carbon:choropleth-map',
            }
          },
          {
            path: 'map/:id',
          //  component: 'views/Map/SettlementParcelMap',
            component: () => import('@/views/Intervention/Project/Map.vue'),
            name: 'ProjectMap',  
            meta: {
              hidden: true,
              props: true,
              title: 'Map'
            }
          },
          
        ]
      },
   
      
      {
        path: 'kensup',
        name: 'kensup',
        component: Layout,
        redirect: '/interventions/kensup/proj',
        meta: {
          title: 'KENSUP',
          icon:'mdi:house-city'

        },
        children: [
          {
            path: 'proj',
            name: 'kensupInterventionProjects',
            component: () => import('@/views/Intervention/kensup/Project/Project.vue'),
            meta: {
              title: 'KENSUP',
              icon:'mdi:house-city'
            },
       
          },
        
        ]
      }
    ]
  },
  
 {
    path: '/facilities',
    component: Layout,
    redirect: '/facility/all',
    name: 'Facilities',
    meta: {
      hidden: false,
      title: 'Facilities',
      icon:'ic:outline-local-convenience-store',
      alwaysShow: false
    },
    children: [
      {
        path: 'all',
     //   component: 'views/Map/index',
        component: () => import('@/views/Map/index.vue'),

        name: 'All',
        meta: {
          hidden: true,
          title: 'All'
        }
      },
      {
        path: 'health',
        //component: 'views/Facilities/Health/Health',
        component: () => import('@/views/Facilities/Health/Health.vue'),

        name: 'Health',
        meta: {
          icon: 'uis:hospital-symbol',
          title: 'Health'
        }
      },
      {
        path: 'health/add',
     //   component: 'views/Facilities/Health/Add',
        component: () => import('@/views/Facilities/Health/Add.vue'),

        name: 'Addhealth',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'health/map/:id',
      //  component: 'views/Facilities/Health/HealthMap',
        component: () => import('@/views/Facilities/Health/HealthMap.vue'),

        name: 'HealthFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'Facility Map'
        }
      },
      {
        path: 'health/details/:id',
      // component: 'views/Facilities/Health/HealthFacilityDetails',
        component: () => import('@/views/Facilities/Health/HealthFacilityDetails.vue'),

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
       // component: 'views/Facilities/Education/Education',
        component: () => import('@/views/Facilities/Education/Education.vue'),

        name: 'Education',
        meta: {
          icon: 'material-symbols:school-rounded',
          title: 'Education'
        }
      },
      {
        path: 'edu/add',
        //component: 'views/Facilities/Education/Add',
        component: () => import('@/views/Facilities/Education/Add.vue'),

        name: 'AddEducation',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'edu/map/:id',
        //component: 'views/Facilities/Education/SchoolMap',
        component: () => import('@/views/Facilities/Education/SchoolMap.vue'),

        name: 'EducationFacilityMap',
        meta: {
          hidden: true,
          props: true,
          title: 'School Map'
        }
      },
      {
        path: 'edu/details/:id',
        //component: 'views/Facilities/Education/EducationFacilityDetails',
        component: () => import('@/views/Facilities/Education/EducationFacilityDetails.vue'),

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
      //  component: 'views/Facilities/Roads/Roads',
        component: () => import('@/views/Facilities/Roads/Roads.vue'),

        name: 'Road',
        meta: {
          icon: 'icon-park-solid:map-road-two',
          title: 'Roads'
        }
      },
      {
        path: 'road/add',
        //component: 'views/Facilities/Roads/Add',
        component: () => import('@/views/Facilities/Roads/Add.vue'),

        name: 'AddRoad',
        icon: 'ant-design:plus-square-filled',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
 
      {
        path: 'road/details/:id',
       // component: 'views/Facilities/Roads/RoadDetails',
       component: () => import('@/views/Facilities/Roads/RoadFacilityDetails.vue'),

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
   //  component: 'views/Facilities/Roads/Assets',
     component: () => import('@/views/Facilities/Roads/Assets.vue'),

    name: 'RoadAsset',
    meta: {
      icon: 'game-icons:arch-bridge',
      title: 'Road Structures'
    }
  },
  {
    path: 'roadasset/add',
   // component: 'views/Facilities/Roads/AddAsset',
    component: () => import('@/views/Facilities/Roads/AddAsset.vue'),

    name: 'AddRoadStructure',
    icon: 'ant-design:plus-square-filled',
    meta: { hidden: true, title: 'Add', noCache: true }
      },
  

      /// Water -----------------------
   {
        path: 'water',
     //component: 'views/Facilities/Water/Water',
     component: () => import('@/views/Facilities/Water/Water.vue'),

        name: 'Water',
        meta: {
          icon: 'ic:sharp-water-drop',
          title: 'Water Points'
        }
      },
      {
        path: 'water/add',
      //  component: 'views/Facilities/Water/Add',
        component: () => import('@/views/Facilities/Water/Add.vue'),

        name: 'AddWaterPoint',
        icon: 'ant-design:plus-square-filled',
        meta: { hidden: true, title: 'Add', noCache: true }
      },
      {
        path: 'water/map/:id',
      //  component: 'views/Facilities/Water/WaterMap',
        component: () => import('@/views/Facilities/Water/WaterMap.vue'),

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
       // component: 'views/Facilities/Water/WaterFacilityDetails',
        component: () => import('@/views/Facilities/Water/WaterFacilityDetails.vue'),

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
            //  component: 'views/Facilities/Sewer/Sewer',
              component: () => import('@/views/Facilities/Sewer/Sewer.vue'),

              name: 'Sewer',
              meta: {
                icon:'ph:toilet-fill',
                title: 'Sewer'
              }
            },
            {
              path: 'sewer/add',
             // component: 'views/Facilities/Sewer/Add',
              component: () => import('@/views/Facilities/Sewer/Add.vue'),

              name: 'AddSewer',
              icon: 'ant-design:plus-square-filled',
              meta: { hidden: true, title: 'Add', noCache: true }
            },
            {
              path: 'sewer/map/:id',
            //  component: 'views/Facilities/Sewer/SewerMap',
              component: () => import('@/views/Facilities/Sewer/SewerMap.vue'),

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
            //  component: 'views/Facilities/Sewer/SewerFacilityDetails',
              component: () => import('@/views/Facilities/Sewer/SewerFacilityDetails.vue'),

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
    // component: 'views/Facilities/Other/Other',
     component: () => import('@/views/Facilities/Other/Other.vue'),

    name: 'OtherFacility',
    meta: {
      icon:'zondicons:location-park',
      title: 'Others'
    }
  }, 
  {
    path: 'other/add',
  //  component: 'views/Facilities/Other/AddOther',
    component: () => import('@/views/Facilities/Other/AddOther.vue'),
    name: 'AddOther',
    icon: 'ant-design:plus-square-filled',
    meta: { hidden: true, title: 'Add Facility', noCache: true }
  }
    ]
  }, 
  
 
 
]
 





const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: constantRouterMap as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  const resetWhiteNameList = ['Redirect', 'Login', 'NoFind', 'Root', 'Reset', 'Logoff']
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !resetWhiteNameList.includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
