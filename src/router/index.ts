import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout, getParentLayout, } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'

 
const { t } = useI18n()

 

export const constantRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/landing',
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
        name: 'xRedirect',
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
    path: '/landing',
    component: () => import('@/views/Landing/index.vue'),
    name: 'Landing',
    meta: {
      hidden: true,
      title: 'Home',
      noTagsView: true
    }
  },
  {
    path: '/incidents',
    component: () => import('@/views/Landing/Incidents.vue'),
    name: 'IncidentsLanding',
    meta: {
      hidden: true,
      title: 'Incidents',
      noTagsView: true
    }
  },
  {
    path: '/about',
    component: () => import('@/views/Landing/about.vue'),
    name: 'About',
    meta: {
      hidden: true,
      title: 'About',
      noTagsView: true
    }
  },
  {
    path: '/grm',
    component: () => import('@/views/Landing/grm.vue'),
    name: 'GRM',
    meta: {
      hidden: true,
      title: 'Grievances',
      noTagsView: true
    }
  },

 
  {
    path: '/status/:id',
    component: () => import('@/views/Grievances/GrievanceDetailsPublic.vue'),
    name: 'GrievanceStatus',
    meta: {
      hidden: true,
      title: 'Grievance Status',
      icon:'pajamas:status',
      noCache: true
    }
  },
  {
    path: '/incidents/:id',
    component: () => import('@/views/Incidents/IncidentDetailsPublic.vue'),
    name: 'IncidentStatus',
    meta: {
      hidden: true,
      title: 'Incident Status',
      icon:'pajamas:status',
      noCache: true
    }
  },
  {
    path: '/share/:token',
    component: () => import('@/views/Repository/SharedDocumentsPublic.vue'),
    name: 'SharedDocuments',
    meta: {
      hidden: true,
      title: 'Shared Documents',
      icon:'material-symbols:share',
      noCache: true
    }
  },

  {
    path: '/privacy',
    component: () => import('@/views/Landing/Privacy.vue'),
    name: 'Privacy',
    meta: {
      hidden: true,
      title: 'Privacy',
      noTagsView: true
    }
  },
  {
    path: '/contact',
    component: () => import('@/views/Landing/Contact.vue'),
    name: 'Contact',
    meta: {
      hidden: true,
      title: 'Contact',
      noTagsView: true
    }
  },

  {
    path: '/faqs',
    component: () => import('@/views/Landing/FAQs.vue'),
    name: 'FAQs',
    meta: {
      hidden: true,
      title: 'FAQs',
      noTagsView: true
    }
  },

  {
    path: '/delete',
    component: () => import('@/views/Reset/DeleteAccount.vue'),
    name: 'DeleteAccount',
    meta: {
      hidden: true,
      title: t('Delete Account'),
      noTagsView: true
    }
  },
 

  {
    path: '/login',
    component: () => import('@/views/Landing/Login/Login.vue'),
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

 
 
]
 
 

export const adminRoutes: AppRouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/home',
    name: 'Dashboard',
    meta: {
      title: t('Dashboards'),
      icon: 'ant-design:dashboard-filled',
      alwaysShow: true,
      // we have removed roles here to make it public
     },
 

    children: [
      {
        path: 'home',
        component: () => import('@/views/Dashboard/Workplace.vue'),
        name: 'LandingPage',
        meta: {
          title: t('Home'),
          noCache: true,
          icon:'ion:home',
          affix: false,
          hidden: true,

        }
      }, 
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
      {
        path: 'map',
        component: () => import('@/views/Dashboard/LandingMap.vue'),
        name: 'LandingMap',
        meta: {
          title: t('Map'),
          noCache: true,
          icon:'game-icons:kenya',
          affix: true,
          hidden: false,

        }
      }, 

      {
        path: 'prjmap',
        component: () => import('@/views/Dashboard/ProjectMap.vue'),
        name: 'ProjectMap',
        meta: {
          title: t('Projects'),
          noCache: true,
          icon:'ep:map-location',
          affix: true,
          hidden: false,

        }
      }, 

    
    ]
  },
  {
    path: '/data',
    component: Layout,
    redirect: '/data/settlement',
    name: 'xSettlements',
    meta: {
      title: t('Data'),
      icon: 'mdi:map-legend',
      alwaysShow: true,
 
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
          alwaysShow: true,
 
        },
        children: [
    
          {
            path: 'list',
            component: () => import('@/views/Settlement/Sett.vue'),
            name: 'List',
            meta: {
              title: 'Settlements',
              affix: true,
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
              hidden: true,
              icon:'mdi:house-circle',
              title: 'Households'
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
              icon:'bi:people-fill',
                            hidden: true,

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
          },
          {
            path: 'committees',
            component: Layout,
            name: 'Committees',
           meta: {
             title: 'Community',
             icon:'fluent:people-team-add-20-filled',
             role: ['root_admin', 'admin', 'super_admin', 'monitoring'  ,'staff' ,'monitoring','grm'] ,
             locationLevel:['national','county' ],
    
           },
           children: [ 

            {
              path: 'secgrc',
              component: () => import('@/views/Grievances/SEC_V2.vue'),
              name: 'sec_grc',
              meta: {
                title: 'SEC/GRC',
                hidden: true,
                icon:'fluent:people-team-16-filled',
                role: ['root_admin','admin', 'super_admin', 'monitoring' , 'staff' ,'monitoring','grm'] ,
                locationLevel:['national','county' ],
    
              },
             },

              {
              path: 'sec',
              component: () => import('@/views/Grievances/SEC.vue'),
              name: 'SEC',
              meta: {
                title: 'SEC',
                icon:'fluent:people-team-16-filled',
                role: ['root_admin','admin', 'super_admin', 'monitoring'  ,'staff' ,'monitoring','grm'] ,
                locationLevel:['national','county','settlement'],
    
              },
             },
            
             {
              path: 'grc',
              component: () => import('@/views/Grievances/GRC.vue'),
             name: 'GRCView',
             meta: {
               title: 'GRC',
               icon:'fluent:people-checkmark-20-filled',
               role: ['root_admin','admin', 'super_admin', 'monitoring' , 'staff' ,'monitoring','grm'] ,
               locationLevel:['national','county','settlement'],
      
             }
            },
           ]
          
          },
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
            component: () => import('@/views/Facilities/Water/AddX.vue'),
            name: 'AddWaterPoint',
            meta: { hidden: true, title: 'Add', noCache: true, icon: 'ant-design:plus-square-filled' }
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
                  component: () => import('@/views/Facilities/Sewer/AddX.vue'),
                  name: 'AddSewer',
                  meta: { hidden: true, title: 'Add', noCache: true, icon: 'ant-design:plus-square-filled' }
                },
                {
                  path: 'sewer/map/:id',
                  component: () => import('@/views/Facilities/Sewer/SewerMap.vue'),
                  name: 'SewerMap',
                  meta: { hidden: true, props: true, title: 'Road Map', icon: 'ant-design:plus-square-filled' }
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
        path: 'survey',
    //    component: 'views/ImportData/excel',
        component: () => import('@/views/ImportData/Surveys.vue'),

        name: 'Surveys',
        meta: {
          title: 'Surveys',
          icon: 'carbon:report',
          role: ['root_admin','admin', 'super_admin', 'staff'] ,
          locationLevel:['national'],

        }
      },
      
      {
        path: ':projectId/:xmlFormId/:form_name',
        component: () => import('@/views/ImportData/surveyDetails.vue'),
        name: 'SurveyDetails',
        meta: {
          hidden: true,
          title: 'Survey Details',
          icon:'ion:document-attach',
          role: ['root_admin','admin', 'super_admin', 'staff'  ] ,
          locationLevel:['national' ],
          noCache: true
        }
      },


      {
        path: 'data',
        component: Layout,
        redirect: '/data/import',
        name: 'Data',
        meta: {
          title: 'Import',
          icon: 'mdi:database-plus',
          role: ['root_admin','admin', 'super_admin', 'staff','monitoring'   ] ,
          locationLevel:['national','county','settlement'],

          alwaysShow: false
        },
        children: [
          {
            path: 'list',
           // component: 'views/ImportData/list',
            component: () => import('@/views/ImportData/list.vue'),
    
            name: 'ImportData',
            meta: {
              title: 'Excel',
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
            component: () => import('@/views/ImportData/excel.vue'),
    
            name: 'Fuzzy',
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
              title: 'Import GIS Data',
              icon: 'mdi:file-location-outline',
            }
          },
          {
            path: 'docs',
        //    component: 'views/ImportData/excel',
            component: () => import('@/views/ImportData/Document.vue'),
            name: 'ImportDocuments',
            meta: {
              title: 'Import Documents',
              icon: 'mdi:file-upload-outline',
            }
          },

          {
            path: 'collector',
        //    component: 'views/ImportData/excel',
            component: () => import('@/views/ImportData/Collector.vue'),
            name: 'Integration',
            meta: {
              title: 'Integration',
              hidden:  true,
              icon: 'icon-park-solid:api',
              role: ['root_admin','admin', 'super_admin',  'staff' ]

            }
          },

        ]
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
      role: ['root_admin','admin', 'super_admin', 'monitoring'  ,'staff' ,'monitoring'] ,
      locationLevel:['national','county' ],

      alwaysShow: false
    },
    children: [

       {
        path: 'activity',
        component: () => import('@/views/Indicators/Activity.vue'),
       name: 'ProgrammeActivity',
       meta: {
         title: 'Activities',
         icon:'icon-park-outline:activity-source',
         role: ['root_admin','admin', 'super_admin', 'monitoring'  ,'staff' ] ,
         locationLevel:['national','county' ],
       }
       },
         {
        path: 'framework',
        //component: 'views/Facilities/Water/Water',
        //component: () => import('@/views/Facilities/Water/Water.vue'),
        component: Layout,
        name: 'IdnicatorConfig',
        meta: {
          icon: 'icon-park-solid:dashboard-car',
          role: ['root_admin','admin', 'super_admin', 'monitoring' , 'staff' ] ,
          locationLevel:['national'  ],

          title: 'Framework'
        },
        children: [
          {
            path: 'indicators',
         //   component: 'views/Indicators/indicator',
            component: () => import('@/views/Indicators/indicator.vue'),
            name: 'Indicators',
            meta: {
              title: 'Indicators',
              hidden: false,
              icon:'cil:gauge',
              role: ['root_admin','admin', 'super_admin', 'monitoring' , 'staff' ] ,
              locationLevel:['national'  ],

            }
          },
          {
            path: 'config',
         //   component: 'views/Indicators/indicator_category',
            component: () => import('@/views/Indicators/indicator_category.vue'),
            name: 'IndicatorConfigs',
            meta: {
              title: 'Configuration',
              role: ['root_admin','admin', 'super_admin', 'monitoring' , 'staff' ] ,
              locationLevel:['national'  ],

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
            role: ['root_admin','admin', 'super_admin', 'monitoring' , 'staff' ] ,
            locationLevel:['national'  ],

            hidden:true
          }
          },
        
        ]
      },
     
 
      {
        path: 'reports',
 
        component: Layout,
        name: 'Reports',
        meta: {
          icon: 'ic:baseline-monitor-heart',
          title: 'Monitoring'
        },
        children: [
          {
            path: 'new',
          //  component: 'views/Indicators/indicator_category_report',
            component: () => import('@/views/Indicators/indicator_category_report_new.vue'),
            name: 'NewReports',
            meta: {
              title: 'Reports(New)',
              role: ['root_admin','admin', 'super_admin', 'monitoring' ,'staff' ] ,
              locationLevel:['national'  ],

              icon:'carbon:result-new',
            }
          },

          {
            path: 'past',
          //  component: 'views/Indicators/indicator_category_report',
            component: () => import('@/views/Indicators/indicator_category_report.vue'),
            name: 'PastReports',
            meta: {
              title: 'Reports',
              locationLevel:['national'  ],
              role: ['root_admin','admin', 'super_admin', 'monitoring'  ,'staff' ] ,

              icon:'mdi:file-document-plus',
            }
          },

          {
            path: 'all',
          //  component: 'views/Indicators/indicator_category_report',
            component: () => import('@/views/Evaluation/All.vue'),
            name: 'All',
            meta: {
              title: 'Evaluations',
               role: ['root_admin','admin', 'super_admin', 'monitoring', 'staff' ] ,

              icon:'solar:list-check-bold',
            }
          },
          {
            path: 'add',
          //  component: 'views/Indicators/indicator_category_report',
            component: () => import('@/views/Evaluation/AddX.vue'),
            name: 'AddEvaluation',
            meta: {
              title: 'Add Evaluation',
              hidden: true,
               role: ['root_admin','admin', 'super_admin', 'monitoring' ,'staff' ] ,

              icon:'mdi:file-document-plus',
            }
          },
        ]
      },
 
 

      {
        path: 'ben',
     //   component: 'views/Indicators/indicator_category',
        component: () => import('@/views/Indicators/Beneficiary.vue'),
        name: 'BeneficiaryConfigs',
        meta: {
          title: 'Beneficiaries',
          icon:'ph:users-fill',
          role: ['root_admin','admin', 'super_admin', 'monitoring', 'staff' ] ,

          hidden: false
        }
      },

    ]
  },
  
  {
    path: '/repo',
    component: Layout,
    redirect: '/repo/open',
    name: 'Repository',
    meta: {
      title: 'Repository',
      icon: 'material-symbols:home-storage-rounded',
      role: ['root_admin','admin', 'super_admin', 'monitoring' ,'consultant','staff' ,'monitoring'] ,
      locationLevel:['national','county','settlement'],
      alwaysShow: false
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
          role: ['root_admin','admin', 'super_admin', 'monitoring', 'staff'  ] ,

          icon:'bi:clipboard2-data-fill'
        }
      },
      
      {
        path: 'ai-chat',
        component: () => import('@/views/AI/DocumentChat.vue'),
        name: 'DocumentAIChat',
        meta: {
          title: 'AI Chat',
          hidden: false,
          role: ['root_admin','admin', 'super_admin', 'monitoring', 'staff'  ] ,
          icon:'material-symbols:smart-toy'
        }
      },
      
      {
        path: 'cleanup',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/DeleteDocuments.vue'),
        name: 'RepositoryCleanup',
        meta: {
          title: 'Cleanup',
          hidden: false,
           role: ['root_admin','admin', 'super_admin' ] ,
          icon:'fluent:delete-32-filled'
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
          role: ['root_admin','admin', 'super_admin', 'monitoring','grm','staff' ] ,
          icon:'mdi:space-station'

        }
      },
      
      {
        path: 'shares',
        component: () => import('@/views/Repository/SharedDocumentsList.vue'),
        name: 'DocumentShares',
        meta: {
          title: 'Document Shares',
          hidden: false,
          role: ['root_admin','admin', 'super_admin', 'monitoring', 'staff' ] ,
          icon:'material-symbols:share'
        }
      },

    


    ]

  },


  {
    path: '/media',
    component: Layout,
    redirect: '/data/slums',
    name: 'Media',
    meta: {
      title: 'Media',
      icon: 'ion:radio-button-on-outline',
      role: [ 'root_admin','super_admin', 'admin' ] ,
      locationLevel:['national','county','settlement'],
      alwaysShow: false
    },
    children: [
      {
        path: 'video',
      //  component: 'views/Users/County',
        component: () => import('@/views/Media/Media.vue'),
        name: 'Video',
        meta: {
          title: 'Video',
          hidden: false,
 
          icon:'tabler:video-filled'
        }
      },
      {
        path: 'live-streams',
        component: () => import('@/views/Media/Live.vue'),
        name: 'LiveStreams',
        meta: {
          title: 'Live Streams',
          hidden: false,
          icon:'material-symbols:live-tv'
        }
      },
      {
        path: 'articles',
      //  component: 'views/Users/County',
        component: () => import('@/views/Media/Article.vue'),
        name: 'Articles',
        meta: {
          title: 'Articles',
          hidden: false,
          icon:'lucide:newspaper'
        }
      },

      {
        path: 'addx',
        component: () => import('@/views/Media/AddX.vue'),
        name: 'AddArticleX',
        meta: {
          hidden: true,
          props: true,
          icon:'bi:house-add',
          title: 'Add Article'
        }
      }, 

    ]
  
  },



  {
    path: '/grm',
    component: Layout,
    redirect: '/grv/open',
    name: 'Grievances',
    meta: {
      title: 'GRM',
      icon: 'hugeicons:complaint',
      role: [ 'root_admin','super_admin', 'grm','gbv','admin', 'staff'] ,
      locationLevel:['national','county','settlement'],
      alwaysShow: false
    },
    children: [

       {
        path: 'grv',
        component: () => import('@/views/Grievances/Open.vue'),
        name: 'OpenGrievances',
        meta: {
          title: 'Grievances',
          icon:'oui:security-signal',
          role: [ 'root_admin','super_admin', 'grm','gbv','admin', 'staff'] ,
          locationLevel:['national','county','settlement'],

        }
       },

       {
        path: 'referred',
        component: () => import('@/views/Grievances/Referred.vue'),
        name: 'ReferredGrievances',
        meta: {
          title: 'Referred Grievances',
          icon:'oui:security-signal',
          role: [ 'root_admin','super_admin', 'grm','gbv','admin', 'staff'] ,
          locationLevel:['national','county','settlement'],

        }
       },

       {
        path: 'gbv',
        component: () => import('@/views/Grievances/GBV.vue'),
       name: 'xGBVGrievances',
       meta: {
         title: 'GBV',
         icon:'ph:gender-intersex-bold',
         role: [ 'root_admin', 'super_admin', 'gbv' ] ,
         locationLevel:['national','county','settlement'],
       }
       },


         
      //  {
      //   path: 'resolved',
      //   component: () => import('@/views/Grievances/Resolved.vue'),
      //  name: 'ResolvedGrievances',
      //  meta: {
      //    title: 'Resolved',
      //    icon:'oui:security-signal-resolved',
      //    role: [  'super_admin', 'grm' ] ,
      //    locationLevel:['national','county','settlement'],

      //  }
      //  },


      //  {
      //   path: 'rejectedxz',
      //   component: () => import('@/views/Grievances/RejectedGRV.vue'),
      //  name: 'RejectedGrievances',
      //  meta: {
      //    title: 'Rejected',
      //    icon:'oui:security-signal-detected',
      //    role: [  'super_admin', 'grm' ] ,
      //    locationLevel:['national','county','settlement'],

      //  }
      //  },

       


       {
        path: ':id',
        component: () => import('@/views/Grievances/GrievanceDetails.vue'),
        name: 'GrievanceDetails',
        meta: {
          hidden: true,
          title: 'Grievance Details',
          icon:'ion:document-attach',
          role: [ 'root_admin','super_admin', 'grm','gbv','admin', 'staff'] ,
          locationLevel:['national','county','settlement'],

          noCache: true
        }
      },
  
      {
        path: ':id',
        component: () => import('@/views/Grievances/GBVGrievanceDetails.vue'),
        name: 'GBVGrievanceDetails',
        meta: {
          hidden: true,
          title: 'GBV Grievance Details',
          icon:'ion:document-attach',
          role: [ 'root_admin', 'super_admin', 'gbv' ] ,
          locationLevel:['national','county','settlement'],
          noCache: true
        }
      },
      
   


    ]
  },

  {
    path: '/inc',
    component: Layout,
    redirect: '/inc/open',
    name: 'Incidents',
    meta: {
      title: 'Incidents',
      icon: 'mdi:alert-decagram',
      role: [ 'root_admin','super_admin', 'admin', 'staff' ],
      locationLevel:['national','county','settlement'],
      alwaysShow: false
    },
    children: [
      {
        path: 'open',
        component: () => import('@/views/Incidents/Open.vue'),
        name: 'OpenIncidents',
        meta: {
          title: 'Incidents',
          icon:'mdi:alert',
          role: [ 'root_admin','super_admin','admin','staff' ],
          locationLevel:['national','county','settlement']
        }
      }
    ]
  },
  // {
  //   path: '/gbv',
  //   component: Layout,
  //   redirect: '/gbv/open',
  //   name: 'GBV',
  //   meta: {
  //     title: 'GBV Grievances',
  //     icon: 'hugeicons:complaint',
  //     role: [ 'super_admin',  'gbv'] ,
  //     locationLevel:['national','county','settlement'],
  //     alwaysShow: false
  //   },
  //   children: [ 
  //     //  {
  //     //   path: 'open',
  //     //   component: () => import('@/views/Grievances/GBV.vue'),
  //     //  name: 'GBVGrievances',
  //     //  meta: {
  //     //    title: 'GBV',
  //     //    icon:'ph:gender-intersex-bold',
  //     //    role: [  'super_admin', 'gbv' ] ,
  //     //    locationLevel:['national','county','settlement'],
  //     //  }
  //     //  },

  //      {
  //       path: ':id',
  //       component: () => import('@/views/Grievances/GBVGrievanceDetails.vue'),
  //       name: 'GBVGrievanceDetails',
  //       meta: {
  //         hidden: true,
  //         title: 'GBV Grievance Details',
  //         icon:'ion:document-attach',
  //         role: [  'super_admin', 'gbv' ] ,
  //         locationLevel:['national','county','settlement'],
  //         noCache: true
  //       }
  //     },

  //   ]
  // },

  {
    path: '/interventions',
    component: Layout,
    redirect: '/interventions/tenure',
    name: 'Interventions',
    meta: {
      title: 'Interventions',
      icon: 'mdi:office-building-marker-outline',
      hidden: true,
      role: ['root_admin','admin', 'super_admin', 'monitoring','staff' ,'monitoring'] ,
      locationLevel:['national'],

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
      alwaysShow: true,
      role: ['root_admin','admin', 'super_admin', 'admin',],
      locationLevel:['national'],

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
          icon: 'teenyicons:users-outline',
           role: ['root_admin','admin', 'super_admin'   ] 
 
        }
      },
      {
        path: 'admin',
       // component: 'views/Users/User',
        component: () => import('@/views/Users/AdminUsers.vue'),
        name: 'AdminStaff',
        meta: {
          title: 'Admin',
          hidden: false,
          icon: 'mdi:shield-user',
           role: ['root_admin', 'super_admin'   ] 

        }
      },
      

      {
        path: 'grm',
       // component: 'views/Users/User',
        component: () => import('@/views/Users/GrmUsers.vue'),
        name: 'GRM_Staff',
        meta: {
          title: 'GRM',
          hidden: false,
          icon: 'flowbite:user-headset-solid',
           role: ['root_admin','admin', 'super_admin'   ] 

        }
      },
      
      {
        path: 'support',
       // component: 'views/Users/User',
        component: () => import('@/views/Users/SupportUsers.vue'),
        name: 'Support_Staff',
        meta: {
          title: 'Support',
          hidden: false,
          icon: 'mdi:account-cog',
           role: ['root_admin','admin', 'super_admin'   ] 

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
          icon: 'grommet-icons:user-new',
        //  role: ['admin', 'super_admin'  ] 
        role: ['root_admin','admin', 'super_admin',   ] ,
        locationLevel:['national'],

        }
      },
      // {
      //   path: 'grc',
      //   component: () => import('@/views/Grievances/GRC.vue'),
      //  name: 'GRC',
      //  meta: {
      //    title: 'GRC',
      //    icon:'fluent:people-checkmark-20-filled',
      //    role: ['admin', 'super_admin', 'monitoring' , 'staff' ,'monitoring','grm'] ,
      //    locationLevel:['national','county','settlement'],

      //  }
      // },
      // {
      //   path: 'profile',
      //   component: () => import('@/views/Users/Profile.vue'),
      //   name: 'userProfile',
      //   meta: {
      //     title: 'Profile',
      //     hidden: false,
      //     icon:'pajamas:profile'
      //   }
      // }, 

   

    ]
  },
 

 
  {
    path: '/prj',
    component: Layout,
    //redirect: '/settings',
    name: 'Projects',
    meta: {
      title: 'Projects',
      hidden: true,
      icon: 'material-symbols:settings',
      alwaysShow: false,
      role: ['root_admin','admin', 'super_admin' ,'staff'  ] ,
      locationLevel:['national','county'],


    },
    children: [
      {
        path: ':id',
        component: () => import('@/views/programmes/ProjectDetails.vue'),
        name: 'ProjectDetails',
        meta: {
          hidden: true,
          title: 'Project Details',
          icon:'ion:document-attach',
       //   noCache: true
        }
      },
      {
        path: 'add/:domain',
        name: 'AddProject',
        component: () => import('@/views/Intervention/Project/AddX.vue'),
        meta: {
          title: 'Add Project',
          hidden: true,
          props: true,
          icon:'material-symbols:add-circle-rounded'
        },
   
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
      alwaysShow: true,
      role: ['root_admin','admin', 'super_admin' ,'staff'  ] ,
      locationLevel:['national' ],


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
          role: ['root_admin','admin', 'super_admin' ,'staff'  ] ,

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
            path: 'contractor',
          //  component: 'views/Users/County',
            component: () => import('@/views/settings/Contractor.vue'),
            name: 'SettingsContractor',
            meta: {
              title: 'Contractor',
              hidden: false,
              icon:'mdi:construction'

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
          role: ['root_admin','admin', 'super_admin'   ] ,

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
            icon:'material-symbols:settings',
            role: ['root_admin','admin', 'super_admin' ,'staff'  ] ,


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
            path: 'impl',
          //  component: 'views/Users/County',
            component: () => import('@/views/settings/Implementation.vue'),
            name: 'ProgrammeImplementation',
            meta: {
              title: 'Implementation',
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

          // {
          //   path: ':id',
          //   component: () => import('@/views/programmes/ProjectDetails.vue'),
          //   name: 'ProjectDetails',
          //   meta: {
          //     hidden: true,
          //     title: 'Project Details',
          //     icon:'ion:document-attach',
          //     noCache: true
          //   }
          // },

          
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
          role: ['root_admin','admin', 'super_admin'   ] ,

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
            component: () => import('@/views/settings/DashboardChart.vue'),
            name: 'DashboardSectionCharts',
            meta: {
              title: 'Charts',
              hidden: false,
              icon:'material-symbols:bar-chart-4-bars'
            }
          }, 
    
        ]
      },
      
      {
        path: 'adminunits',
        component: Layout,
        redirect: '/settings/adminunits/counties',
        name: 'AdminUnits',
        meta: {
          title: 'Admin Units',
          icon: 'mdi:map-marker-multiple',
          role: ['root_admin', 'super_admin'],
          alwaysShow: true
        },
        children: [
          {
            path: 'counties',
            component: () => import('@/views/settings/adminunits/County.vue'),
            name: 'Counties',
            meta: {
              title: 'Counties',
              hidden: false,
              icon: 'mdi:map-marker',
              role: ['root_admin', 'super_admin']
            }
          },
          {
            path: 'subcounties',
            component: () => import('@/views/settings/adminunits/Subcounty.vue'),
            name: 'Subcounties',
            meta: {
              title: 'Subcounties',
              hidden: false,
              icon: 'mdi:map-marker-outline',
              role: ['root_admin', 'super_admin']
            }
          },
          {
            path: 'wards',
            component: () => import('@/views/settings/adminunits/Ward.vue'),
            name: 'Wards',
            meta: {
              title: 'Wards',
              hidden: false,
              icon: 'mdi:map-marker-radius',
              role: ['root_admin', 'super_admin']
            }
          }
        ]
      },      

    ]
  },

  {
    path: '/admin',
    component: Layout,
     name: 'Admin',
    meta: {
      title: t('Admin'),
      icon: 'ant-design:dashboard-filled',
      // we have removed roles here to make it public
      role: ['root_admin','super_admin'] ,
      locationLevel:['national']

     },
 

    children: [
      {
        path: 'roles',
        component: () => import('@/views/Users/Role.vue'),
        name: 'Roles',
        meta: {
          title: t('Roles'),
          noCache: true,
          icon:'ic:round-bubble-chart',
          affix: false,
          hidden: false,
          role: ['root_admin','super_admin'],
          permissions: ['roles:manage']
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
          icon: 'fluent:person-feedback-48-filled',
         role: ['root_admin','admin', 'super_admin'],
     locationLevel:['national'],
          permissions: ['feedback:manage']
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
          icon: 'arcticons:auditor',
     //     role: [ 'super_admin'   ] 
          role: [ 'root_admin','super_admin'],
          permissions: ['logs:read']
        }
      }, 
    ]
  },
 
 
  {
    path: '/me',
    component: Layout,
    redirect: '/mne/indicator',
    name: 'MyPages',
    meta: {
      title: 'My Space',
      icon: 'wpf:usershield',
      alwaysShow: true,
      role: ['root_admin','admin', 'super_admin', 'admin', 'staff','grm', 'gbv', 'monitoring','consultant','support'],
      locationLevel:['national','county'],

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
          icon:'pajamas:profile',
          role: ['root_admin','admin', 'super_admin', 'admin', 'staff','grm', 'gbv', 'monitoring','consultant','support'],

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

// Add router guard to handle /api-docs route
router.beforeEach((to, from, next) => {
  if (to.path === '/api-docs') {
    // Force a full page reload so the backend serves Swagger UI
    window.location.href = '/api-docs';
  } else {
    next();
  }
});

export const resetRouter = (): void => {
  const resetWhiteNameList = ['Redirect', 'Login', 'NoFind', 'Root', 'Reset', 'Logoff', 
    'Privacy', 'Contact','Landing','FAQs','About','GRM','DeleteAccount']
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
