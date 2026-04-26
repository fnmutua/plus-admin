import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout} from '@/utils/routerHelper'
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
    path: '/docs',
    component: () => import('@/views/Landing/Docs.vue'),
    name: 'DocsLanding',
    meta: {
      hidden: true,
      title: 'Documentation',
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
    path: '/data-request',
    component: () => import('@/views/Landing/DataRequest.vue'),
    name: 'DataRequest',
    meta: {
      hidden: true,
      title: 'Data Request',
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
    path: '/dr-share/:token',
    component: () => import('@/views/Landing/DataRequestSharePublic.vue'),
    name: 'DataRequestShare',
    meta: {
      hidden: true,
      title: 'Data Request Download',
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
    path: '/register',
    component: () => import('@/views/Landing/Register/Register.vue'),
    name: 'Register',
    meta: {
      hidden: true,
      title: t('router.register'),
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
        component: () => import('@/views/Dashboard/LandingMapOptimized.vue'),
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
        component: () => import('@/views/Dashboard/ProjectMapOptimized.vue'),
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
      permissions: ['settlement:read'],
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
              icon:'material-symbols:format-list-bulleted-rounded',
              permissions: ['settlement:read'],
            }
          },
          {
            path: 'climate-assessments',
            component: () => import('@/views/Climate/ClimateAssessmentList.vue'),
            name: 'ClimateAssessmentList',
            meta: {
              title: 'Assessments',
              icon: 'mdi:earth',
              permissions: ['climate_assessment:read'],
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
              noCache: true,
              permissions: ['settlement:create'],
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
              title: 'AddSettX',
              permissions: ['settlement:create'],
            }
          },
          {
            path: 'addnew',
            component: () => import('@/views/Settlement/AddSettlementNew.vue'),
            name: 'AddSettlementNew',
            meta: {
              hidden: true,
              props: true,
              icon:'bi:house-add',
              title: 'Add Settlement',
              permissions: ['settlement:create'],
            }
          }, 
          {
            path: ':id/climate-assessment',
            component: () => import('@/views/Climate/ClimateAssessment.vue'),
            name: 'ClimateAssessmentSettlement',
            meta: { hidden: true, title: 'Climate Risk & Vulnerability Assessment' }
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
              title: 'Households',
              permissions: ['households:read']
            }
          },
          
          {
            path: 'hh/all',
            component: () => import('@/views/Household/households.vue'),
            name: 'AllHouseholds',
            props: {
              name: String
            },
            meta: {
              hidden: false,
              icon:'mdi:house-circle',
              permissions: ['households:read'],
              title: 'xHouseholds'
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
              title: 'Add Household',
              permissions: ['households:create']
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
             permissions: ['grievance:read'],
           },
           children: [ 


              {
              path: 'sec',
              component: () => import('@/views/Grievances/SEC.vue'),
              name: 'SEC',
              meta: {
                title: 'SEC',
                icon:'fluent:people-team-16-filled',
                permissions: ['grievance:read'],
              },
             },
            
             {
              path: 'grc',
              component: () => import('@/views/Grievances/GRC.vue'),
             name: 'GRCView',
             meta: {
               title: 'GRC',
               icon:'fluent:people-checkmark-20-filled',
               permissions: ['grievance:read'],
             }
            },
            
            {
              path: 'secgrc',
              component: () => import('@/views/Grievances/SEC_V2.vue'),
              name: 'sec_grc',
              meta: {
                title: 'SEC/GRC',
                hidden: false,
                icon:'fluent:people-team-16-filled',
                permissions: ['grievance:read'],
              },
             },
           ]
          
          },
        ]
      },
      {
        path: 'facilities',
        component: Layout,
        redirect: '/facilities/all',
        name: 'Facilities',
        meta: {
          hidden: false,
          permissions: ['facility:read'],
          title: 'Facilities',
          icon:'ic:outline-local-convenience-store',
          alwaysShow: false
        },
        children: [
          {
            path: 'add',
            component: () => import('@/views/Facilities/AddFacility.vue'),
            name: 'AddFacility',
            meta: {
              hidden: false,
              icon: 'ph:shield-plus-bold',
              title: 'Add Facility',
              noCache: true,
              permissions: ['facility:create'],
            }
          },
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
      /// Social Amenities -----------------------
      {
        path: 'social-amenities',
        component: () => import('@/views/Facilities/Social/SocialAmenities.vue'),
        redirect: '/facilities/social-amenities/health',
        name: 'SocialAmenities',
        meta: {
          icon: 'mdi:account-group-outline',
          title: 'Social Amenities'
        },
        children: [
          {
            path: 'health',
            component: () => import('@/views/Facilities/Health/Health.vue'),
            name: 'Health',
            meta: { icon: 'uis:hospital-symbol', title: 'Health' }
          },
          { path: 'health/add', component: () => import('@/views/Facilities/Health/AddX.vue'), name: 'AddhealthX', meta: { hidden: true, title: 'Add', noCache: true, permissions: ['facility:create'] } },
          { path: 'health/addNew', component: () => import('@/views/Facilities/Health/AddHealthNew.vue'), name: 'AddHealthNew', meta: { hidden: true, title: 'Add Health Facility', noCache: true, permissions: ['facility:create'] } },
          { path: 'health/map/:id', component: () => import('@/views/Facilities/Health/HealthMap.vue'), name: 'HealthFacilityMap', meta: { hidden: true, props: true, title: 'Facility Map' } },
          { path: 'health/details/:id', component: () => import('@/views/Facilities/Health/HealthFacilityDetails.vue'), name: 'HealthFacilityDetails', meta: { hidden: true, props: true, title: 'Facility Profile' } },

          /// Education -----------------------
          {
            path: 'edu',
            component: () => import('@/views/Facilities/Education/Education.vue'),
            name: 'Education',
            meta: { icon: 'material-symbols:school-rounded', title: 'Education' }
          },
          { path: 'edu/add', component: () => import('@/views/Facilities/Education/Add.vue'), name: 'AddEducation', meta: { hidden: true, title: 'Add', noCache: true, permissions: ['facility:create'] } },
          { path: 'edu/addX', component: () => import('@/views/Facilities/Education/AddX.vue'), name: 'AddEducationX', meta: { hidden: true, title: 'Add', props: true, noCache: true, permissions: ['facility:create'] } },
          { path: 'edu/addNew', component: () => import('@/views/Facilities/Education/AddEducationNew.vue'), name: 'AddEducationNew', meta: { hidden: true, title: 'Add Education Facility', noCache: true, permissions: ['facility:create'] } },
          { path: 'edu/map/:id', component: () => import('@/views/Facilities/Education/SchoolMap.vue'), name: 'EducationFacilityMap', meta: { hidden: true, props: true, title: 'School Map' } },
          { path: 'edu/details/:id', component: () => import('@/views/Facilities/Education/EducationFacilityDetails.vue'), name: 'EducationFacilityDetails', meta: { hidden: true, props: true, title: 'School Profile' } },

          /// Community Hall -----------------------
          {
            path: 'community-hall',
            component: () => import('@/views/Facilities/Others/CommunityHall.vue'),
            name: 'SocialCommunityHall',
            meta: { title: 'Hall', icon: 'mdi:home-group' }
          },
          { path: 'community-hall/details/:id', component: () => import('@/views/Facilities/Others/CommunityHallDetails.vue'), name: 'CommunityHallDetails', meta: { hidden: true, props: true, title: 'Community Hall Profile' } },
          /// Community Projects -----------------------
          {
            path: 'community-projects',
            component: () => import('@/views/Facilities/Others/CommunityProjects.vue'),
            name: 'SocialCommunityProjects',
            meta: { title: 'Projects', icon: 'mdi:account-group' }
          },
          { path: 'community-projects/details/:id', component: () => import('@/views/Facilities/Others/CommunityProjectDetails.vue'), name: 'CommunityProjectDetails', meta: { hidden: true, props: true, title: 'Community Project Profile' } },
          /// Police -----------------------
          {
            path: 'police',
            component: () => import('@/views/Facilities/Others/Police.vue'),
            name: 'SocialPolice',
            meta: { title: 'Police', icon: 'mdi:police-badge' }
          },
          { path: 'police/details/:id', component: () => import('@/views/Facilities/Others/PoliceDetails.vue'), name: 'PoliceDetails', meta: { hidden: true, props: true, title: 'Police Station Profile' } }
        ]
      },

      /// Infrastructure -----------------------
      {
        path: 'infrastructure',
        component: () => import('@/views/Facilities/Infrastructure/Infrastructure.vue'),
        redirect: '/facilities/infrastructure/road',
        name: 'Infrastructure',
        meta: {
          icon: 'mdi:domain',
          title: 'Infrastructure'
        },
        children: [
          /// Roads -----------------------
          {
            path: 'road',
            component: () => import('@/views/Facilities/Roads/Roads.vue'),
            name: 'Road',
            meta: { icon: 'hugeicons:road-wayside', title: 'Roads' }
          },
          { path: 'road/add', component: () => import('@/views/Facilities/Roads/AddRoadNew.vue'), name: 'AddRoadX', meta: { hidden: true, title: 'Add', noCache: true, permissions: ['facility:create'] } },
          { path: 'road/details/:id', component: () => import('@/views/Facilities/Roads/RoadFacilityDetails.vue'), name: 'RoadsDetails', meta: { hidden: true, props: true, title: 'Road Profile' } },
          { path: 'road/map/:id', component: () => import('@/views/Facilities/Roads/RoadMap.vue'), name: 'RoadMap', meta: { hidden: true, props: true, title: 'Road Map' } },

          /// Road Assets -----------------------
          { path: 'roadasset', component: () => import('@/views/Facilities/Roads/Assets.vue'), name: 'RoadAsset', meta: { icon: 'game-icons:arch-bridge', hidden: true, title: 'Road Structures' } },
          { path: 'roadasset/add', component: () => import('@/views/Facilities/Roads/AddAssetX.vue'), name: 'AddRoadStructure', meta: { hidden: true, title: 'Add', noCache: true, permissions: ['facility:create'] } },

          /// Water -----------------------
          {
            path: 'water',
            component: () => import('@/views/Facilities/Water/Water.vue'),
            name: 'Water',
            meta: { icon: 'ic:sharp-water-drop', title: 'Water' },
            children: [
              { path: 'wp', component: () => import('@/views/Facilities/Water/Water.vue'), name: 'WaterPoint', meta: { hidden: false, icon: 'ic:sharp-water-drop', title: 'Water Points', noCache: true } },
              { path: 'wp/add', component: () => import('@/views/Facilities/Water/AddX.vue'), name: 'AddWaterPoint', meta: { hidden: true, title: 'Add', noCache: true, icon: 'ant-design:plus-square-filled', permissions: ['facility:create'] } },
              { path: 'pipedwater', component: () => import('@/views/Facilities/PipedWater/PipedWater.vue'), name: 'PipedWater', meta: { icon: 'game-icons:tap', title: 'Piped Water' } },
              { path: 'pipedwater/add', component: () => import('@/views/Facilities/PipedWater/AddPipedWaterNew.vue'), name: 'PipedWaterAddX', meta: { icon: 'ic:sharp-water-drop', title: 'Add Piped Water', hidden: true, permissions: ['facility:create'] } },
              { path: 'pipedwater/details/:id', component: () => import('@/views/Facilities/PipedWater/PipedWaterFacilityDetails.vue'), name: 'PipedWaterFacilityDetails', meta: { hidden: true, props: true, title: 'Scheme Profile' } },
              { path: 'water/map/:id', component: () => import('@/views/Facilities/Water/WaterMap.vue'), name: 'WaterMap', meta: { hidden: true, icon: 'ant-design:plus-square-filled', props: true, title: 'Water Point Map' } },
              { path: 'water/details/:id', component: () => import('@/views/Facilities/Water/WaterFacilityDetails.vue'), name: 'WaterDetails', meta: { hidden: true, props: true, title: 'Water Point Profile' } },
              { path: 'water/addNew', component: () => import('@/views/Facilities/Water/AddWaterNew.vue'), name: 'AddWaterNew', meta: { hidden: true, title: 'Add Water Point', noCache: true, permissions: ['facility:create'] } },
              { path: 'sewer', component: () => import('@/views/Facilities/Sewer/Sewer.vue'), name: 'Sewer', meta: { icon: 'ph:toilet-fill', title: 'Sewer' } },
              { path: 'sewer/add', component: () => import('@/views/Facilities/Sewer/AddSewerNew.vue'), name: 'AddSewer', meta: { hidden: true, title: 'Add', noCache: true, icon: 'ant-design:plus-square-filled', permissions: ['facility:create'] } },
              { path: 'sewer/map/:id', component: () => import('@/views/Facilities/Sewer/SewerMap.vue'), name: 'SewerMap', meta: { hidden: true, props: true, title: 'Road Map', icon: 'ant-design:plus-square-filled' } },
              { path: 'sewer/details/:id', component: () => import('@/views/Facilities/Sewer/SewerFacilityDetails.vue'), name: 'SewerFacilityDetails', meta: { hidden: true, props: true, title: 'Sewer Profile' } }
            ]
          },

          /// Lighting -----------------------
          {
            path: 'lighting',
            component: () => import('@/views/Facilities/Lighting/Lighting.vue'),
            redirect: '/facilities/infrastructure/lighting/powerline',
            name: 'Lighting',
            meta: { icon: 'mdi:lightbulb-on', title: 'Lighting' },
            children: [
              { path: 'powerline', component: () => import('@/views/Facilities/Lighting/Powerline.vue'), name: 'LightingPowerline', meta: { title: 'Powerline', icon: 'mdi:transmission-tower' } },
              { path: 'highmast', component: () => import('@/views/Facilities/Lighting/Highmast.vue'), name: 'LightingHighmast', meta: { title: 'FloodLights', icon: 'mdi:light-flood-down' } },
              { path: 'streetlight', component: () => import('@/views/Facilities/Lighting/Streetlight.vue'), name: 'LightingStreetlight', meta: { title: 'Streetlights', icon: 'mdi:lightbulb-outline' } }
            ]
          },

          /// Railway -----------------------
          {
            path: 'railway',
            component: () => import('@/views/Facilities/Others/Railway.vue'),
            name: 'InfrastructureRailway',
            meta: { icon: 'mdi:train', title: 'Railway' }
          },
          /// Telecom -----------------------
          {
            path: 'mast',
            component: () => import('@/views/Facilities/Others/Mast.vue'),
            name: 'InfrastructureMast',
            meta: { icon: 'mdi:tower-fire', title: 'Telecom' }
          }
        ]
      },

      /// Others -----------------------
      {
        path: 'others',
        component: () => import('@/views/Facilities/Others/Others.vue'),
        redirect: '/facilities/others/crime-hotspots',
        name: 'Others',
        meta: {
          icon: 'zondicons:location-park',
          title: 'Others'
        },
        children: [
          { path: 'crime-hotspots', component: () => import('@/views/Facilities/Others/CrimeHotspots.vue'), name: 'OthersCrimeHotspots', meta: { title: 'Crime', icon: 'mdi:alert-octagon' } },
          { path: 'hazards', component: () => import('@/views/Facilities/Others/Hazards.vue'), name: 'OthersHazards', meta: { title: 'Hazards', icon: 'mdi:hazard-lights' } },
          { path: 'other/details/:id', component: () => import('@/views/Facilities/Other/OtherFacilityDetails.vue'), name: 'OtherFacilityDetails', meta: { hidden: true, props: true, title: 'Facility Profile' } }
        ]
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
          permissions: ['collector:read'],
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
          permissions: ['collector:read'],
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
          permissions: ['data:import'],
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
              hidden:  true,

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
            path: 'collector',
        //    component: 'views/ImportData/excel',
            component: () => import('@/views/ImportData/Collector.vue'),
            name: 'Integration',
            meta: {
              title: 'Integration',
              hidden:  true,
              icon: 'icon-park-solid:api',
              permissions: ['collector:read']

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
      permissions: ['activity:read'],
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
         permissions: ['activity:read'],
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
          permissions: ['indicator_category_report:read'],
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
              permissions: ['indicator_category_report:read'],

            }
          },
          {
            path: 'config',
         //   component: 'views/Indicators/indicator_category',
            component: () => import('@/views/Indicators/indicator_category.vue'),
            name: 'IndicatorConfigs',
            meta: {
              title: 'Configuration',
              permissions: ['indicator_category_report:read'],
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
            permissions: ['category:read'],
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
              permissions: ['indicator_category_report:read'],
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
              permissions: ['indicator_category_report:read'],
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
              permissions: ['post_evaluation:read'],
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
              permissions: ['post_evaluation:create'],
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
          permissions: ['beneficiary:read'],
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
      permissions: ['document:read'],
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
          permissions: ['document:read'],
          icon:'bi:clipboard2-data-fill'
        }
      },

      {
        path: 'import',
    //    component: 'views/ImportData/excel',
        component: () => import('@/views/ImportData/Document.vue'),
        name: 'ImportDocuments',
        meta: {
          title: 'Import',
          icon: 'mdi:file-upload-outline',
          permissions: ['document:upload']
        }
      },
      
      // {
      //   path: 'ai-chat',
      //   component: () => import('@/views/AI/DocumentChat.vue'),
      //   name: 'DocumentAIChat',
      //   meta: {
      //     title: 'AI Chat',
      //     hidden: false,
      //     role: ['root_admin','admin', 'super_admin', 'monitoring', 'staff'  ] ,
      //     icon:'material-symbols:smart-toy'
      //   }
      // },
      
      // {
      //   path: 'cleanup',
      // //  component: 'views/Users/County',
      //   component: () => import('@/views/Repository/DeleteDocuments.vue'),
      //   name: 'RepositoryCleanup',
      //   meta: {
      //     title: 'Cleanup',
      //     hidden: false,
      //      role: ['root_admin','admin', 'super_admin' ] ,
      //     icon:'fluent:delete-32-filled'
      //   }
      // },


     
      {
        path: 'imagery',
      //  component: 'views/Users/County',
        component: () => import('@/views/Repository/Imagery.vue'),
        name: 'DroneImagery',
        meta: {
          title: 'Imagery',
          hidden: false,
          permissions: ['document:read'],
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
          permissions: ['document:update'],
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
      permissions: ['article:read'],
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
          title: 'Add Article',
          permissions: ['article:create'],
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
      permissions: ['grievance:read'],
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
          permissions: ['grievance:read'],

        }
       },

       {
        path: 'referred',
        component: () => import('@/views/Grievances/Referred.vue'),
        name: 'ReferredGrievances',
        meta: {
          title: 'Referred Grievances',
          icon:'oui:security-signal',
          permissions: ['grievance:read'],

        }
       },

       {
        path: 'gbv',
        component: () => import('@/views/Grievances/GBV.vue'),
       name: 'xGBVGrievances',
       meta: {
         title: 'GBV',
         icon:'ph:gender-intersex-bold',
         permissions: ['gbv:read'],
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
          permissions: ['grievance:read'],
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
          permissions: ['gbv:read'],
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
      permissions: ['incident:read'],
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
          permissions: ['incident:read'],
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
      permissions: ['intervention:read'],

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
      permissions: ['user:read'],

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
          permissions: ['user:read'],
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
          permissions: ['user:read'],
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
          permissions: ['user:read'],
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
          permissions: ['user:read'],
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
          permissions: ['user:create'],

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
      permissions: ['project:read'],


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
          icon:'material-symbols:add-circle-rounded',
          permissions: ['project:create']
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
      permissions: ['settings:read'],


    },
    children: [
      {
        path: 'module-settings',
        name: 'ModuleSettings',
        component: () => import('@/views/settings/ModuleSettings.vue'),
        meta: {
          title: 'SMS Settings',
          icon: 'material-symbols:settings',
          permissions: ['settings:update']
        }
      },
      {
        path: 'climate-settings',
        name: 'ClimateSettings',
        component: () => import('@/views/settings/VulnerabilitySettings.vue'),
        meta: {
          title: 'Climate Settings',
          icon: 'mdi:earth',
          permissions: ['settings:update']
        }
      },
      {
        path: 'population-settings',
        name: 'PopulationSettings',
        component: () => import('@/views/settings/PopulationSettings.vue'),
        meta: {
          title: 'Population Settings',
          icon: 'mdi:account-group',
          permissions: ['settings:update']
        }
      },
      {
        path: 'page-visits',
        name: 'PageVisits',
        component: () => import('@/views/settings/PageVisits.vue'),
        meta: {
          title: 'Page Visits',
          icon: 'mdi:chart-line',
          permissions: ['logs:read']
        }
      },
      {
        path: 'common',
        component: Layout,
        redirect: '/data/settlement',
        name: 'CommonSettings',
        meta: {
          title: t('Common'),
          icon: 'mdi:map-legend',
          permissions: ['settings:read'],
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
          permissions: ['programme:read'],
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
            permissions: ['programme:read'],


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
          permissions: ['dashboard:read'],
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
          permissions: ['county:read'],
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
              permissions: ['county:read']
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
              permissions: ['subcounty:read']
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
              permissions: ['ward:read']
            }
          },
          {
            path: 'locator',
            component: () => import('@/views/settings/adminunits/AdminUnitLocator.vue'),
            name: 'AdminUnitLocator',
            meta: {
              title: 'Map Locator',
              hidden: false,
              icon: 'mdi:map-search',
              permissions: ['county:read']
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
      permissions: ['admin:all'],

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
          permissions: ['roles:read']
        }
      },
      
      {
        path: 'data-requests',
        component: () => import('@/views/Admin/DataRequests.vue'),
        name: 'AdminDataRequests',
        meta: {
          title: 'Data Requests',
          hidden: false,
          icon: 'mdi:database-arrow-right',
          permissions: ['data_request:read']
        }
      },
      {
        path: 'data-requests/:id',
        component: () => import('@/views/Admin/DataRequestDetail.vue'),
        name: 'AdminDataRequestDetail',
        meta: {
          title: 'Data Request Detail',
          hidden: true,
          noCache: true,
          permissions: ['data_request:read']
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
          permissions: ['feedback:read']
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
          permissions: ['user:read', 'user:update']
        }
      }, 



    ]
  },

  {
    path: '/documentation',
    component: Layout,
    name: 'DocumentationNav',
    meta: {
      title: 'Documentation',
      icon: 'mdi:book-open-page-variant',
    },
    children: [
      {
        path: '',
        component: { render: () => null },
        name: 'Documentation',
        meta: {
          title: 'Documentation',
          icon: 'mdi:book-open-page-variant',
        }
      }
    ]
  },

  {
    path: '/data-request-form',
    component: Layout,
    name: 'DataRequestFormNav',
    meta: {
      title: 'Data Request',
      icon: 'mdi:database-arrow-right',
    },
    children: [
      {
        path: '',
        component: { render: () => null },
        name: 'DataRequestForm',
        meta: {
          title: 'Data Request',
          icon: 'mdi:database-arrow-right',
        }
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

// Add router guard to handle /api-docs route
router.beforeEach((to, from, next) => {
  if (to.path === '/api-docs') {
    // Force a full page reload so the backend serves Swagger UI
    window.location.href = '/api-docs';
  } else if (to.path === '/documentation') {
    // Open documentation in a new tab and stay on current page
    window.open('/#/docs', '_blank');
    next(false);
  } else if (to.path === '/data-request-form') {
    next({ path: '/data-request', replace: true });
  } else {
    next();
  }
});

export const resetRouter = (): void => {
  const resetWhiteNameList = ['Redirect', 'Login', 'Register', 'NoFind', 'Root', 'Reset', 'Logoff', 
    'Privacy', 'Contact','Landing','FAQs','About','GRM','DeleteAccount','docs']
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
