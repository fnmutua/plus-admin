import type { AppRouteRecordRaw } from 'vue-router'

export const publicRoutes: AppRouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/landing',
    name: 'Root',
    meta: {
      hidden: true
    }
  },
  {
    path: '/redirect/:path(.*)',
    component: () => import('@/views/Redirect/Redirect.vue'),
    name: 'xRedirect',
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
    path: '/settlements',
    component: () => import('@/views/Landing/LandingMapExplorer.vue'),
    name: 'SettlementExplorer',
    meta: {
      hidden: true,
      title: 'Settlement explorer',
      noTagsView: true
    }
  },
  {
    path: '/projects',
    component: () => import('@/views/Landing/LandingMapExplorer.vue'),
    name: 'ProjectExplorer',
    meta: {
      hidden: true,
      title: 'Project explorer',
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
    path: '/community-issue',
    component: () => import('@/views/Landing/CommunityIssueReport.vue'),
    name: 'CommunityIssueReport',
    meta: {
      hidden: true,
      title: 'Report community issue',
      noTagsView: true,
      public: true,
    },
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
    path: '/community-issues',
    component: () => import('@/views/Community/CommunityIssuePublic.vue'),
    name: 'CommunityIssueTrack',
    meta: {
      hidden: true,
      title: 'Community Issue Status',
      noCache: true,
      public: true,
    },
  },
  {
    path: '/community-issues/:id',
    component: () => import('@/views/Community/CommunityIssuePublic.vue'),
    name: 'CommunityIssuePublic',
    meta: {
      hidden: true,
      title: 'Community Issue Status',
      noCache: true,
      public: true,
    },
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
    path: '/regional-report',
    component: () => import('@/views/Public/RegionalReportPublic.vue'),
    name: 'RegionalReportPublic',
    meta: {
      hidden: true,
      title: 'Regional Progress Report',
      noTagsView: true
    }
  },
  {
    path: '/upload-share/:token',
    component: () => import('@/views/Public/UploadSharePublic.vue'),
    name: 'UploadSharePublic',
    meta: {
      hidden: true,
      title: 'Upload Documents',
      icon:'material-symbols:upload',
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
    path: '/dr-clarify/:token',
    component: () => import('@/views/Landing/DataRequestClarifyPublic.vue'),
    name: 'DataRequestClarify',
    meta: {
      hidden: true,
      title: 'Data Request Clarifications',
      noCache: true,
      public: true
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
    path: '/terms-of-data-use',
    component: () => import('@/views/Landing/TermsOfDataUse.vue'),
    name: 'TermsOfDataUse',
    meta: {
      hidden: true,
      title: 'Terms of Data Use',
      noTagsView: true,
      public: true
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
      title: 'Delete Account',
      noTagsView: true
    }
  },
 

  {
    path: '/login',
    component: () => import('@/views/Landing/Login/Login.vue'),
    name: 'Login',
    meta: {
      hidden: true,
      title: 'Login',
      noTagsView: true
    }
  },

  {
    path: '/register',
    component: () => import('@/views/Landing/Register/Register.vue'),
    name: 'Register',
    meta: {
      hidden: true,
      title: 'Register',
      noTagsView: true
    }
  },

  {
    path: '/logoff',
    component: () => import('@/views/Reset/Reset.vue'),
    name: 'Logoff',
    meta: {
      hidden: true,
      title: 'Logoff',
      noTagsView: true
    }
  },




  {
    path: '/reset/:token(.*)*',
    component: () => import('@/views/Reset/Reset.vue'),
    name: 'Reset',
    meta: {
      hidden: true,
      title: 'Reset',
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

  // Catch-all fallback for unmatched paths (e.g. /subprogrammes/<id>/<id> when the
  // dynamic programme/component API hasn't registered the route yet, or any typo'd URL).
  // Renders the existing 404 view directly rather than redirecting, so the original
  // URL is preserved through the dynamic-registration phase in src/permission.ts —
  // the more-specific dynamic route, when added via router.addRoute(), takes priority.
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/Error/404.vue'),
    name: 'CatchAll',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  },
]
