import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout, getParentLayout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'

 
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
  },

  {
    path: '/privacy',
    component: () => import('@/views/Login/Privacy.vue'),
    name: 'Privacy',
    meta: {
      hidden: true,
      title: 'Privacy',
      noTagsView: true
    }
  },


  {
    path: '/landing',
    component: () => import('@/views/Landing/Landing.vue'),
    name: 'Landing',
    meta: {
      hidden: true,
      title: 'Landing',
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
          hidden:true
        }
      },
      {
        path: 'dynamic',
        component: () => import('@/views/Dashboard/Dynamic.vue'),
        name: 'DynamicDashboard',
        meta: {
           title: t('Interventions'),
          noCache: true,
          icon:'material-symbols:dashboard-outline-rounded',

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
      
      {
        path: 'imagery',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/Imagery.vue'),
        name: 'DroneImagery',
        meta: {
          title: 'Imagery',
          hidden: false,
          icon:'mdi:space-station'
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
        path: 'achievements',
        component: () => import('@/views/Dashboard/Interventions.vue'),
        name: 'InterventionsDashboard',
        meta: {
          title: t('Interventions'),
          noCache: true,
          icon:'fa-solid:hands-helping',
          hidden:true
        }
      },
      {
        path: 'dynamic',
        component: () => import('@/views/Dashboard/Dynamic.vue'),
        name: 'DynamicDashboard',
        meta: {
           title: t('Interventions'),
          noCache: true,
          icon:'material-symbols:dashboard-outline-rounded',

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
      
      {
        path: 'imagery',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/Imagery.vue'),
        name: 'DroneImagery',
        meta: {
          title: 'Imagery',
          hidden: false,
          icon:'mdi:space-station'
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
        path: 'achievements',
        component: () => import('@/views/Dashboard/Interventions.vue'),
        name: 'InterventionsDashboard',
        meta: {
          title: t('Interventions'),
          noCache: true,
          icon:'fa-solid:hands-helping',
          hidden:true
        }
      },
      {
        path: 'dynamic',
        component: () => import('@/views/Dashboard/Dynamic.vue'),
        name: 'DynamicDashboard',
        meta: {
           title: t('Interventions'),
          noCache: true,
          icon:'material-symbols:dashboard-outline-rounded',

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
      
      {
        path: 'imagery',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/Imagery.vue'),
        name: 'DroneImagery',
        meta: {
          title: 'Imagery',
          hidden: false,
          icon:'mdi:space-station'
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
      title: 'Monitoring/Evaluation',
      icon: 'uis:graph-bar',
      alwaysShow: false
    },
    children: [
 

     
      {
        path: 'reports',
        //component: 'views/Facilities/Water/Water',
        //component: () => import('@/views/Facilities/Water/Water.vue'),
        component: Layout,
        name: 'Reports',
        meta: {
          icon: 'fluent-mdl2:analytics-report',
          title: 'Monitoring'
        },
        children: [
    

          {
            path: 'past',
          //  component: 'views/Indicators/indicator_category_report',
            component: () => import('@/views/Indicators/indicator_category_report.vue'),
            name: 'PastReports',
            meta: {
              title: 'File a Report',
              icon:'mdi:file-document-plus',
            }
          },
        ]
      },

      {
        path: 'evaluation',
        //component: 'views/Facilities/Water/Water',
        component: () => import('@/views/Indicators/evaluation.vue'),
        //component: Layout,
        name: 'Evaluation',
        meta: {
          icon: 'pajamas:issue-type-test-case',
          title: 'Evaluations'
        },
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
      
      {
        path: 'imagery',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/Imagery.vue'),
        name: 'DroneImagery',
        meta: {
          title: 'Imagery',
          hidden: false,
          icon:'mdi:space-station'
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
      title: 'Monitoring/Evaluation',
      icon: 'uis:graph-bar',
      alwaysShow: false
    },
    children: [
 

     
      {
        path: 'reports',
        //component: 'views/Facilities/Water/Water',
        //component: () => import('@/views/Facilities/Water/Water.vue'),
        component: Layout,
        name: 'Reports',
        meta: {
          icon: 'fluent-mdl2:analytics-report',
          title: 'Monitoring'
        },
        children: [
    

          {
            path: 'past',
          //  component: 'views/Indicators/indicator_category_report',
            component: () => import('@/views/Indicators/indicator_category_report.vue'),
            name: 'PastReports',
            meta: {
              title: 'File a Report',
              icon:'mdi:file-document-plus',
            }
          },
        ]
      },

      {
        path: 'evaluation',
        //component: 'views/Facilities/Water/Water',
        component: () => import('@/views/Indicators/evaluation.vue'),
        //component: Layout,
        name: 'Evaluation',
        meta: {
          icon: 'pajamas:issue-type-test-case',
          title: 'Evaluations'
        },
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
 
    ]
  },
  
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
          title: t('Status'),
          noCache: true,
          icon:'ic:round-bubble-chart',
          affix: true,
          hidden: false,

        }
      },
      // {
      //   path: 'status',
      //   component: () => import('@/views/Dashboard/CurrentSlumStatus.vue'),
      //   name: 'Status',
      //   meta: {
      //     title: t('Status'),
      //     noCache: true,
      //     affix: true,
      //     icon:'pajamas:status',
      //     hidden: true,

      //   }
      // },
      // {
      //   path: 'achievements',
      //   component: () => import('@/views/Dashboard/Interventions.vue'),
      //   name: 'InterventionsDashboard',
      //   meta: {
      //     title: t('Interventions'),
      //     noCache: true,
      //     icon:'fa-solid:hands-helping',
      //     hidden: true,
      //   }
      // },
      // {
      //   path: 'dynamic',
      //   component: () => import('@/views/Dashboard/Dynamic.vue'),
      //   name: 'DynamicDashboard',
      //   meta: {
      //      title: t('Interventions'),
      //     noCache: true,
      //     icon:'material-symbols:dashboard-outline-rounded',

      //   }
      // }
    ]
  },
  {
    path: '/data',
    component: Layout,
    redirect: '/data/settlement',
    name: 'Settlements',
    meta: {
      title: t('Data'),
      icon: 'mdi:map-legend',
      alwaysShow: true
    },
    children: [
      {
        path: 'settlement',
        component: Layout,
        redirect: '/data/settlement/list',
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
              hidden: true,
              title: 'Add',
              icon:'material-symbols:add-location-rounded',
              noCache: true
            }
          },
          {
            path: 'addx',
            component: () => import('@/views/Settlement/AddX.vue'),
            name: 'AddSettlementX',
            meta: {
              hidden: true,
              props: true,
              icon:'bi:house-add',
              title: 'AddSettX'
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
            path: 'hh/addx',
            component: () => import('@/views/Household/AddX.vue'),
            name: 'AddHouseholdx',
            meta: {
              hidden: true,
              props: true,
              icon:'bi:house-add',
              title: 'Add Household'
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
        path: 'facilities',
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
            component: () => import('@/views/Facilities/Health/AddX.vue'),
    
            name: 'AddhealthX',
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
            path: 'edu/addX',
            //component: 'views/Facilities/Education/Add',
            component: () => import('@/views/Facilities/Education/AddX.vue'),
    
            name: 'AddEducationX',
            meta: { hidden: true, title: 'Add', props:true,  noCache: true }
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
            component: () => import('@/views/Facilities/Roads/AddX.vue'),
            name: 'AddRoadX',
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
        component: () => import('@/views/Facilities/Roads/AddAssetX.vue'),
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
            component: () => import('@/views/Facilities/Water/AddX.vue'),
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
         component: () => import('@/views/Facilities/PipedWater/AddX.vue'),
            name: 'PipedWaterAddX',
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
                  component: () => import('@/views/Facilities/Sewer/AddX.vue'),
    
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
        component: () => import('@/views/Facilities/Other/AddX.vue'),
        name: 'AddOtherX',
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
        path: 'data',
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
        path: 'repository',
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
    
          {
            path: 'imagery',
          //  component: 'views/Users/County',
            component: () => import('@/views/Repository/Imagery.vue'),
            name: 'DroneImagery',
            meta: {
              title: 'Imagery',
              hidden: false,
              icon:'mdi:space-station'
            }
          },
        ]
      },
  {
    path: 'mne',
    component: Layout,
    redirect: '/mne/indicator',
    name: 'MonitoringEvaluation',
    meta: {
      title: 'Reporting',
      icon: 'uis:graph-bar',
      alwaysShow: false
    },
    children: [
      // {
      //   path: 'activity',
      // //  component: 'views/Indicators/indicator_category_report',
      //   component: () => import('@/views/Indicators/Activity.vue'),

      //   name: 'MEActivity',
      //   meta: {
      //     title: 'Activities',
      //     icon:'icon-park-outline:activity-source',
          
      //   }
      // },

      
      {
        path: 'indicator',
        //component: 'views/Facilities/Water/Water',
        //component: () => import('@/views/Facilities/Water/Water.vue'),
        component: Layout,
        name: 'IdnicatorConfig',
        meta: {
          icon: 'icon-park-solid:dashboard-car',
          title: 'Indicators'
        },
        children: [
          {
            path: 'list',
         //   component: 'views/Indicators/indicator',
            component: () => import('@/views/Indicators/indicator.vue'),
            name: 'Indicators',
            meta: {
              title: 'List',
              hidden: false,
              icon:'cil:gauge'
            }
          },
          {
            path: 'config',
         //   component: 'views/Indicators/indicator_category',
            component: () => import('@/views/Indicators/indicator_category.vue'),
            name: 'IndicatorConfigs',
            meta: {
              title: 'Configurations',
              icon:'material-symbols:settings',
              hidden: false
            }
          },
        {
          path: 'category',
        // component: 'views/Indicators/category',
          component: () => import('@/views/Indicators/category.vue'),
          name: 'IndicatorCategory',
          meta: {
            title: 'Category',
            icon: 'vaadin:options',
            hidden:true
          }
        }
        ]
      },
      {
        path: 'reports',
        //component: 'views/Facilities/Water/Water',
        //component: () => import('@/views/Facilities/Water/Water.vue'),
        component: Layout,
        name: 'Reports',
        meta: {
          icon: 'fluent-mdl2:analytics-report',
          title: 'Monitoring'
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
            path: 'past',
          //  component: 'views/Indicators/indicator_category_report',
            component: () => import('@/views/Indicators/indicator_category_report.vue'),
            name: 'PastReports',
            meta: {
              title: 'File a Report',
              icon:'mdi:file-document-plus',
            }
          },
        ]
      },

      {
        path: 'evaluation',
        //component: 'views/Facilities/Water/Water',
        component: () => import('@/views/Indicators/evaluation.vue'),
        //component: Layout,
        name: 'Evaluation',
        meta: {
          icon: 'pajamas:issue-type-test-case',
          title: 'Evaluations'
        },
      }
    ]
  },

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
        component: () => import('@/views/Intervention/Project/AddX.vue'),
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
          icon:'pajamas:profile'
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
          icon:'arcticons:auditor'
        }
      }, 

      {
        path: 'feedback',
      //  component: 'views/Users/County',
        component: () => import('@/views/Users/Feedback.vue'),
        name: 'Feedback',
        meta: {
          title: 'Feedback',
          hidden: false,
          icon:'fluent:person-feedback-48-filled'
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
        path: 'common',
        component: Layout,
        redirect: '/data/settlement',
        name: 'CommonSettings',
        meta: {
          title: t('Common'),
          icon: 'mdi:map-legend',
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
              hidden:true,
              icon:'clarity:heat-map-line'
            }
          }, 
            {
              path: 'evtype',
            //  component: 'views/Users/County',
              component: () => import('@/views/settings/EvType.vue'),
              name: 'EvaluationType',
              meta: { 
                title: 'Evaluation Types',
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
                hidden: true,
                icon:'material-symbols:settings'

              },
              
          },
          {
            path: 'doccat',
            component: () => import('@/views/settings/DocumentCategory.vue'),
            name: 'DocumentCategory',
            meta: {
              title: 'Document Categories',
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
      },
     
     
      {
        path: 'prog',
        component: Layout,
        redirect: '/data/settlement',
        name: 'ProgrammeSettings',
        meta: {
          title: t('Programme'),
          icon: 'mdi:map-legend',
          alwaysShow: true
        },
        children: [
          
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
              hidden: true,
              icon:'material-symbols:settings'

            }
          }, 
        ]
      },

      
      {
        path: 'dashboards',
        component: Layout,
        redirect: '/data/settlement',
        name: 'DashboardSettings',
        meta: {
          title: t('Dashboards'),
          icon: 'mdi:map-legend',
          alwaysShow: true
        },
        children: [
          
  
      {
        path: 'dash',
        component: () => import('@/views/settings/Dashboard.vue'),
        name: 'DynamicDashboards',
        meta: {
          title: 'List',
          hidden: false,
          icon:'material-symbols:settings'
        }
          }, 
          {
            path: 'cards',
            component: () => import('@/views/settings/DashboardCard.vue'),
            name: 'DashboardCards',
            meta: {
              title: 'Cards',
              hidden: false,
              icon:'wpf:statistics'
            }
          }, 
          {
            path: 'sections',
            component: () => import('@/views/settings/DashboardSection.vue'),
            name: 'DashboardSections',
            meta: {
              title: 'Tabs',
              hidden: false,
              icon:'mdi:file-document-edit-outline'
            }
          }, 
    
          {
            path: 'charts',
            component: () => import('@/views/settings/SectionChart.vue'),
            name: 'DashboardSectionCharts',
            meta: {
              title: 'Charts',
              hidden: false,
              icon:'material-symbols:bar-chart-4-bars'
            }
          }, 
    
        ]
      },

     


    ]
  },

  // {
  //   path: '/privacy',
  //   component: () => import('@/views/Users/User.vue'),
  //   name: 'Privacy',
  //   meta: {
  //     title: 'Privacy',
  //     icon: 'material-symbols:settings',
  //     alwaysShow: true
  //   },
  // }
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
        path: 'achievements',
        component: () => import('@/views/Dashboard/Interventions.vue'),
        name: 'InterventionsDashboard',
        meta: {
          title: t('Interventions'),
          noCache: true,
          icon:'fa-solid:hands-helping',
          hidden:true
        }
      },
      {
        path: 'dynamic',
        component: () => import('@/views/Dashboard/Dynamic.vue'),
        name: 'DynamicDashboard',
        meta: {
           title: t('Interventions'),
          noCache: true,
          icon:'material-symbols:dashboard-outline-rounded',

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
      
      {
        path: 'imagery',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/Imagery.vue'),
        name: 'DroneImagery',
        meta: {
          title: 'Imagery',
          hidden: false,
          icon:'mdi:space-station'
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
      title: 'Monitoring/Evaluation',
      icon: 'uis:graph-bar',
      alwaysShow: false
    },
    children: [
 

     
      {
        path: 'reports',
        //component: 'views/Facilities/Water/Water',
        //component: () => import('@/views/Facilities/Water/Water.vue'),
        component: Layout,
        name: 'Reports',
        meta: {
          icon: 'fluent-mdl2:analytics-report',
          title: 'Monitoring'
        },
        children: [
    

          {
            path: 'past',
          //  component: 'views/Indicators/indicator_category_report',
            component: () => import('@/views/Indicators/indicator_category_report.vue'),
            name: 'PastReports',
            meta: {
              title: 'File a Report',
              icon:'mdi:file-document-plus',
            }
          },
        ]
      },

      {
        path: 'evaluation',
        //component: 'views/Facilities/Water/Water',
        component: () => import('@/views/Indicators/evaluation.vue'),
        //component: Layout,
        name: 'Evaluation',
        meta: {
          icon: 'pajamas:issue-type-test-case',
          title: 'Evaluations'
        },
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
  const resetWhiteNameList = ['Redirect', 'Login', 'NoFind', 'Root', 'Reset', 'Logoff', 'Privacy']
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
