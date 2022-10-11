import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout, getParentLayout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'
import {
  Check,
  Delete,
  Position,
  Edit,
  TopRight,
  Message,
  Search,
  Star
} from '@element-plus/icons-vue'
const { t } = useI18n()

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
      title: t('router.dashboard'),
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
        component: () => import('@/views/Dashboard/Kisip.vue'),
        name: 'Kisip',
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
            path: 'hh',
            name: 'InterventiontenureHouseholds',
            component: () => import('@/views/Intervention/Households.vue'),
            meta: {
              title: t('Households')
            },
            children: [
              {
                path: 'owners',
                name: 'InterventionTenureOwners',
                component: () => import('@/views/Intervention/Tenure/Owners.vue'),
                meta: {
                  title: t('Owners')
                }
              },
              {
                path: 'tenants',
                name: 'InterventionTenureTenant',
                component: () => import('@/views/Intervention/Households.vue'),
                meta: {
                  title: t('Tenants')
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
            path: 'hh',
            name: 'InterventionINFPaps',
            component: () => import('@/views/Intervention/Households.vue'),
            meta: {
              title: t('PAPS')
            },
            children: [
              {
                path: 'owners',
                name: 'InterventionINFOwners',
                component: () => import('@/views/Intervention/index.vue'),
                meta: {
                  title: t('Owners')
                }
              },
              {
                path: 'tenants',
                name: 'InterventionINFTenant',
                component: () => import('@/views/Intervention/Households.vue'),
                meta: {
                  title: t('Tenants')
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
            path: 'hh',
            name: 'InterventionInclusionPaps',
            component: () => import('@/views/Intervention/Households.vue'),
            meta: {
              title: t('Households')
            },
            children: [
              {
                path: 'list',
                name: 'InterventionInclusionHouseholds',
                component: () => import('@/views/Intervention/index.vue'),
                meta: {
                  title: t('All')
                }
              },

              {
                path: 'safetynets',
                name: 'InterventionInclusionBeneficiariesSafetyNets',
                component: () => import('@/views/Intervention/Households.vue'),
                meta: {
                  title: t('On Safety Nets')
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
        path: 'parcel',
        component: () => import('@/views/Parcel/index.vue'),
        name: 'Parcel',
        meta: {
          title: t('Parcel')
        }
      },
      {
        path: 'hh/:id',
        component: () => import('@/views/Household/index.vue'),
        name: 'Households',
        props: {
          name: String
        },
        meta: {
          hidden: true,
          title: t('Households')
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

      {
        path: 'map',
        component: () => import('@/views/Map/index.vue'),
        name: 'Map',
        meta: {
          hidden: false,
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
      title: t('Facilities'),
      icon: 'ant-design:shop-outlined',
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
    path: '/components',
    component: Layout,
    name: 'ComponentsDemo',
    meta: {
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
        component: () => import('@/views/Users/User.vue'),
        name: 'County',
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
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: constantRouterMap as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  const resetWhiteNameList = ['Redirect', 'Login', 'NoFind', 'Root']
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
