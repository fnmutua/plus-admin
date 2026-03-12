<template>
  <div class="docs-layout">
    <!-- Sidebar -->
    <aside class="docs-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <img src="@/assets/imgs/1logo.png" alt="KeSMIS" class="sidebar-logo" />
        <span class="sidebar-title">KeSMIS Docs</span>
      </div>
      <nav class="sidebar-nav">
        <template v-for="group in navGroups" :key="group.id">
          <button
            class="nav-group-toggle"
            :class="{ expanded: expandedGroups.has(group.id), 'has-active': groupHasActive(group.id) }"
            @click="toggleGroup(group.id)"
          >
            <Icon :icon="group.icon" class="nav-group-icon" />
            <span class="nav-group-label">{{ group.label }}</span>
            <Icon icon="mdi:chevron-right" class="nav-chevron" />
          </button>
          <Transition name="collapse">
            <div v-show="expandedGroups.has(group.id)" class="nav-group-children">
              <template v-for="item in group.children" :key="item.id">
                <button
                  v-if="canSee(item.roles)"
                  :class="['nav-item', { active: activeSection === item.id }]"
                  @click="selectSection(item.id)"
                >
                  {{ item.label }}
                </button>
              </template>
              <template v-if="group.subgroups">
                <template v-for="sub in group.subgroups" :key="sub.id">
                  <template v-if="canSee(sub.roles)">
                    <button
                      class="nav-subgroup-toggle"
                      :class="{ expanded: expandedGroups.has(sub.id), 'has-active': subgroupHasActive(sub) }"
                      @click="toggleGroup(sub.id)"
                    >
                      <Icon v-if="sub.icon" :icon="sub.icon" class="nav-subgroup-icon" />
                      <span class="nav-subgroup-label">{{ sub.label }}</span>
                      <Icon icon="mdi:chevron-right" class="nav-chevron sub-chevron" />
                    </button>
                    <Transition name="collapse">
                      <div v-show="expandedGroups.has(sub.id)" class="nav-subgroup-children">
                        <template v-for="item in sub.children" :key="item.id">
                          <button
                            v-if="canSee(item.roles)"
                            :class="['nav-item', 'nav-item-nested', { active: activeSection === item.id }]"
                            @click="selectSection(item.id)"
                          >
                            {{ item.label }}
                          </button>
                        </template>
                      </div>
                    </Transition>
                  </template>
                </template>
              </template>
            </div>
          </Transition>
        </template>
      </nav>
      <div class="sidebar-footer">
        <a href="/#/landing" class="sidebar-back">
          <Icon icon="mdi:arrow-left" />
          Back to KeSMIS
        </a>
      </div>
    </aside>

    <!-- Mobile top bar -->
    <header class="docs-mobile-header">
      <button class="hamburger" @click="sidebarOpen = !sidebarOpen">
        <Icon icon="mdi:menu" />
      </button>
      <span class="mobile-title">KeSMIS Docs</span>
    </header>

    <!-- Overlay for mobile sidebar -->
    <div v-if="sidebarOpen" class="docs-overlay" @click="sidebarOpen = false"></div>

    <!-- Main content -->
    <main ref="mainRef" class="docs-main">
      <article class="docs-article">
        <div class="docs-breadcrumb">
          <span>Docs</span>
          <Icon icon="mdi:chevron-right" class="breadcrumb-sep" />
          <span>{{ activeGroupLabel }}</span>
          <Icon icon="mdi:chevron-right" class="breadcrumb-sep" />
          <span class="breadcrumb-current">{{ currentPage?.label }}</span>
        </div>
        <h1 class="docs-page-title">{{ currentPage?.label }}</h1>
        <div class="docs-body" v-html="currentPage?.content"></div>
      </article>

      <!-- Page navigation -->
      <nav class="docs-page-nav">
        <button v-if="prevPage" class="page-nav-btn prev" @click="selectSection(prevPage.id)">
          <Icon icon="mdi:arrow-left" class="nav-arrow" />
          <span class="nav-dir">Previous</span>
          <span class="nav-label">{{ prevPage.label }}</span>
        </button>
        <span v-else></span>
        <button v-if="nextPage" class="page-nav-btn next" @click="selectSection(nextPage.id)">
          <Icon icon="mdi:arrow-right" class="nav-arrow" />
          <span class="nav-dir">Next</span>
          <span class="nav-label">{{ nextPage.label }}</span>
        </button>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import landingPageImg from '@/assets/documentation/landing_page.png'
import actionButtonsImg from '@/assets/documentation/action-buttons.png'
import topNavigationImg from '@/assets/documentation/top_navigation.png'
import fileGrievanceBtnImg from '@/assets/documentation/File a Grievance button.png'
import grievanceFormImg from '@/assets/documentation/multi-step greivnace form.png'
import incidentBtnImg from '@/assets/documentation/incident button.png'
import incidentFormImg from '@/assets/documentation/incident form.png'
import incidentListingImg from '@/assets/documentation/incident-listing.png'
import incidentSearchImg from '@/assets/documentation/incident-search.png'
import incidentEditImg from '@/assets/documentation/incident-edit.png'
import incidentManagementButtonsImg from '@/assets/documentation/incident-management-buttons.png'
import incidentPdfImg from '@/assets/documentation/incident-pdf.png'
import incidentAddImg from '@/assets/documentation/incident-add.png'
import incidentAddButtonImg from '@/assets/documentation/incident-add-button.png'
import homeDashboardImg from '@/assets/documentation/home-dashbaord.png'
import mapChartImg from '@/assets/documentation/map-chart.png'
import statusDashboardImg from '@/assets/documentation/status-dashabord.png'
import statusFilterBtnImg from '@/assets/documentation/status-dashabord-filter-button.png'
import statusFilterResultsImg from '@/assets/documentation/status-dashabord-filter-results.png'
import statusChartDownloadImg from '@/assets/documentation/status-dashabord-chart-download.png'
import statusSectionsTabsImg from '@/assets/documentation/status-dashabord-sections-tabs.png'
import settlementsMapImg from '@/assets/documentation/Settlements Map1.png'
import settlementsMapFilterImg from '@/assets/documentation/Settlements Map-filter.png'
import settlementsMapInteractImg from '@/assets/documentation/Settlements Map-interacting.png'
import projectsMapImg from '@/assets/documentation/projects-map1.png'
import projectsListingImg from '@/assets/documentation/projects-listing.png'
import projectsAddFormImg from '@/assets/documentation/projects-add-from.png'
import projectsDetailsInfoImg from '@/assets/documentation/projects-details-info.png'
import projectsDetailsLocationImg from '@/assets/documentation/projects-details-lcoation.png'
import projectsDetailsMapImg from '@/assets/documentation/projects-details-map.png'
import projectsDetailsScopeImg from '@/assets/documentation/projects-details-scope.png'
import projectsDetailsReportsImg from '@/assets/documentation/projects-details-repotrs.png'
import projectsDetailsReportsAdd2Img from '@/assets/documentation/projects-details-repotrs-add2.png'
import settlementAdd1Img from '@/assets/documentation/settleemnt-add1.png'
import settlementAdd2CountyImg from '@/assets/documentation/settleemnt-add2-select-county-ward.png'
import settlementAdd2DrawImg from '@/assets/documentation/settleemnt-add2-draw-boundary.png'
import settlementAdd3FillImg from '@/assets/documentation/settleemnt-add3-fill-details.png'
import settlementAdd3SavedImg from '@/assets/documentation/settleemnt-add3-saved-new.png'
import settlementApproveImg from '@/assets/documentation/settleemnt-add3-saved-approve.png'
import settlementEditImg from '@/assets/documentation/settleemnt-edit1.png'
import settlementDecommissionImg from '@/assets/documentation/settleemnt-decommison.png'
import settlementMergeImg from '@/assets/documentation/settleemnt-merge.png'
import settlementDeleteImg from '@/assets/documentation/settleemnt-delete.png'
import settlementDownloadExcelImg from '@/assets/documentation/settleemnt-downlaod-excel.png'
import settlementDownloadFieldsImg from '@/assets/documentation/settleemnt-downlaod-excel-select-fields.png'
import settlementDownloadGeoImg from '@/assets/documentation/settleemnt-downlaod-geojson.png'
import settlementListingImg from '@/assets/documentation/settleemnt-listing.png'
import settlementListingActionsImg from '@/assets/documentation/settleemnt-listing-actions.png'
import settlementListingViewMapImg from '@/assets/documentation/settleemnt-listing-actions-viewonmap.png'
import settlementSearchImg from '@/assets/documentation/settleemnt-search.png'
import settlementFilterImg from '@/assets/documentation/settleemnt-filter.png'
import settlementRegisterImg from '@/assets/documentation/settlement_register .png'
import settlementRegisterMapImg from '@/assets/documentation/settlement_register map .png'
import settlementDetailsProfileImg from '@/assets/documentation/settlement-details-profile.png'
import settlementDetailsLocationImg from '@/assets/documentation/settlement-details-location.png'
import settlementDetailsDocumentsImg from '@/assets/documentation/settlement-details-documents.png'
import settlementDetailsProjectsImg from '@/assets/documentation/settlement-details-projects.png'
import settlementDetailsHouseholdsImg from '@/assets/documentation/settlement-details-housholds.png'
import settlementDetailsClimateImg from '@/assets/documentation/settlement-details-climate-risks.png'
import settlementDetailsHistoryImg from '@/assets/documentation/settlement-details-history.png'
import aboutKisipImg from '@/assets/documentation/about kisip.png'
import modeSwitchImg from '@/assets/documentation/mode switch.png'
import registerImg from '@/assets/documentation/regsiter.png'
import signinBtnImg from '@/assets/documentation/signin button.png'
import loginImg from '@/assets/documentation/login.png'
import loginSignupImg from '@/assets/documentation/login - SIGNUP.png'
import loginSuccessRedirectImg from '@/assets/documentation/login - success-redirect.png'
import climateOverviewImg from '@/assets/documentation/climate-0verview.png'
import climateStartImg from '@/assets/documentation/climate-start.png'
import climateInfoImg from '@/assets/documentation/climate-questionaire-info.png'
import climateHazardsImg from '@/assets/documentation/climate-questionaire-hazards.png'
import climateExposureImg from '@/assets/documentation/climate-questionaire-exposure.png'
import climateSensitivityImg from '@/assets/documentation/climate-questionaire-sensitiivuty.png'
import climateAdaptiveImg from '@/assets/documentation/climate-questionaire-adtapive-cpacity.png'
import climateOverallRiskImg from '@/assets/documentation/climate-questionaire-overal-risk.png'
import climateRecommendationsImg from '@/assets/documentation/climate-questionaire-recoemdnation.png'
import facilitiesListingImg from '@/assets/documentation/facilities-listing.png'
import facilitiesAdd1Img from '@/assets/documentation/facilities-add1.png'
import facilitiesAddMarkerImg from '@/assets/documentation/facilities-add-marker.png'
import facilitiesFillFormImg from '@/assets/documentation/facilities-fill-form.png'
import facilitiesViewMapImg from '@/assets/documentation/facilities-view-map.png'
import facilitiesViewMap2Img from '@/assets/documentation/facilities-view-map2.png'
import facilitiesDeleteImg from '@/assets/documentation/facilities-delete.png'
import householdsImg from '@/assets/documentation/households.png'
import secListImg from '@/assets/documentation/SEC-list.png'
import secAddImg from '@/assets/documentation/SEC-add.png'
import grcListImg from '@/assets/documentation/GRC-list.png'
import grcAddImg from '@/assets/documentation/GRC-add.png'
import surveyListingImg from '@/assets/documentation/survey-listing.png'
import repoListingImg from '@/assets/documentation/repository-listing.png'
import repoFilterImg from '@/assets/documentation/repository-filter.png'
import repoDownloadImg from '@/assets/documentation/repository-dwonload.png'
import repoUpload1Img from '@/assets/documentation/repository-uplaod1.png'
import repoUpload2Img from '@/assets/documentation/repository-uplaod2.png'
import repoBulkUploadImg from '@/assets/documentation/repository-bulk-uplaod.png'
import repoShare1Img from '@/assets/documentation/repository-share1.png'
import repoSharesImg from '@/assets/documentation/repository-shares.png'
import importGis1Img from '@/assets/documentation/import-gis-1.png'
import importGis2DestImg from '@/assets/documentation/import-gis-2-destination-table.png'
import importGis2MatchImg from '@/assets/documentation/import-gis-2-matchfields.png'
import importGis2ReviewImg from '@/assets/documentation/import-gis-2-review+import.png'
import meIndicatorListingImg from '@/assets/documentation/ME-indicator-listing.png'
import meIndicatorAdd1Img from '@/assets/documentation/ME-indicator-add1.png'
import meIndicatorAdd2Img from '@/assets/documentation/ME-indicator-add2.png'
import meActivitiesListingImg from '@/assets/documentation/ME-actitities-listing.png'
import meActivitiesAddImg from '@/assets/documentation/ME-actitities-add.png'
import meActivitiesEditDeleteImg from '@/assets/documentation/ME-actitities-edit-delete.png'
import meIndicatorConfigImg from '@/assets/documentation/ME-indicator-config.png'
import meReportsImg from '@/assets/documentation/ME-reports.png'
import meReportsAddImg from '@/assets/documentation/ME-reports-add.png'
import meBeneficiariesListingImg from '@/assets/documentation/ME-benefciaries-listing.png'
import meBeneficiariesAddImg from '@/assets/documentation/ME-benefciaries-add.png'
import formDetail1Img from '@/assets/documentation/forn-detail-1.png'
import formDetail2MapImg from '@/assets/documentation/forn-detail-2-map.png'
import formDetail3ChartImg from '@/assets/documentation/forn-detail-3-chart.png'
import formDetail4DownloadImg from '@/assets/documentation/forn-detail-4-downlaod-atatchment.png'
import grievanceListingImg from '@/assets/documentation/grievance-listing.png'
import grievanceSearchImg from '@/assets/documentation/grievance-search.png'
import grievanceFilter1Img from '@/assets/documentation/grievance-filter1.png'
import grievanceFilter2Img from '@/assets/documentation/grievance-filter12.png'
import grievanceAdd1Img from '@/assets/documentation/grievance-add1.png'
import grievanceAdd2Img from '@/assets/documentation/grievance-add2.png'
import grievanceDetail1Img from '@/assets/documentation/grievance-detail1.png'
import grievanceUpdateImg from '@/assets/documentation/grievance-update.png'
import grievanceResolveFormImg from '@/assets/documentation/grievance-uresolve.png'
import grievancePendingConfirmationImg from '@/assets/documentation/grievance-pendign-confrimation.png'
import grievanceListDownloadImg from '@/assets/documentation/grievance-list-download.png'
import grievanceSendReminderImg from '@/assets/documentation/grievance-send-reminder.png'
import grievanceDetailsDocumentationImg from '@/assets/documentation/grievance-details-documentation.png'
import grievanceDetailsHistoryImg from '@/assets/documentation/grievance-details-history.png'
import grievanceDetailsNotificationsImg from '@/assets/documentation/grievance-details-notifications.png'
import userListingImg from '@/assets/documentation/user-listing.png'
import userActivationImg from '@/assets/documentation/user-activation.png'
import userRolesImg from '@/assets/documentation/user-roles.png'
import userResetPasswordImg from '@/assets/documentation/user-reset-password.png'
import imageryListingImg from '@/assets/documentation/imagery-listing.png'
import videoListingImg from '@/assets/documentation/video-listing.png'
import liveStreamImg from '@/assets/documentation/live-stream.png'
import liveStreamWatchImg from '@/assets/documentation/live-stream-watch.png'
import liveStreamMobile1Img from '@/assets/documentation/live-stream-mobile1.png'
import liveStreamMobile2Img from '@/assets/documentation/live-stream-mobile2.png'
import articlesListingImg from '@/assets/documentation/articles-listing.png'
import articlesAddImg from '@/assets/documentation/articles-add.png'
import imageryView1Img from '@/assets/documentation/imagery-view1.png'
import imageryView2Img from '@/assets/documentation/imagery-view2.png'
import imageryEditImg from '@/assets/documentation/imagery-edit.png'
import imageryAddImg from '@/assets/documentation/imagerey-add.png'
import smsSettings1Img from '@/assets/documentation/sms_settings.png'
import smsSettings2Img from '@/assets/documentation/sms_settings2.png'
import smsSettings3Img from '@/assets/documentation/sms_settings3.png'
import climateScoreImg from '@/assets/documentation/climate-score.png'
import climateWeightsImg from '@/assets/documentation/climate-weights.png'
import programmesComponentsImg from '@/assets/documentation/programmes-components.png'
import documentCategoriesImg from '@/assets/documentation/document-categories.png'
import documentTypesImg from '@/assets/documentation/document-types.png'
import dashboardsListImg from '@/assets/documentation/dashboards-list.png'
import adminCountyListingImg from '@/assets/documentation/admin-county-listing.png'
import adminCountyAddImg from '@/assets/documentation/admin-county-add.png'
import adminCountyEditImg from '@/assets/documentation/admin-county-edit.png'
import adminCountyLocatorImg from '@/assets/documentation/admin-county-lcoator.png'
import dashboardsCardsListImg from '@/assets/documentation/dashboards-cards-list.png'
import dashboardsCardsAddEditButtonsImg from '@/assets/documentation/dashboards-cards-add-edit-buttons.png'
import dashboardsCardsAddEditFormImg from '@/assets/documentation/dashboards-cards-add-edit-form.png'
import dashboardsTabsListImg from '@/assets/documentation/dashboards-tabs-list.png'
import dashboardsTabsFormImg from '@/assets/documentation/dashboards-tabs-form.png'
import dashboardsChartsListingImg from '@/assets/documentation/dashboards-charts-listing.png'
import dashboardsChartsFormImg from '@/assets/documentation/dashboards-charts-form.png'
interface NavPage {
  id: string
  label: string
  content: string
  roles?: string[]
}

interface NavSubGroup {
  id: string
  label: string
  icon?: string
  children: NavPage[]
  roles?: string[]
}

interface NavGroup {
  id: string
  label: string
  icon: string
  roles?: string[]
  children: NavPage[]
  subgroups?: NavSubGroup[]
}

const route = useRoute()
const appStore = useAppStoreWithOut()
const { wsCache } = useCache()

// wsCache reads from sessionStorage which is not reactive — populate via onMounted so
// navGroups re-computes after the user info is read.
const userRoleNames = ref<string[]>([])

function loadUserRoles() {
  try {
    const userInfo = wsCache.get(appStore.getUserInfo)
    userRoleNames.value = userInfo?.roles?.map((r: any) => r.name) ?? []
  } catch {
    userRoleNames.value = []
  }
}

// Returns true when the item has no role restriction, or the user holds at least one required role.
// An empty userRoleNames means the user is not logged in — only unrestricted items are shown.
function canSee(roles?: string[]): boolean {
  if (!roles || roles.length === 0) return true
  return roles.some(r => userRoleNames.value.includes(r))
}

const sidebarOpen = ref(false)
const activeSection = ref('what-is-kesmis')
const expandedGroups = ref<Set<string>>(new Set(['landing']))
const mainRef = ref<HTMLElement | null>(null)

const allNavGroups: NavGroup[] = [
  {
    id: 'landing',
    label: 'Home',
    icon: 'mdi:home-outline',
    children: [
      {
        id: 'what-is-kesmis',
        label: 'What is KeSMIS?',
        content: `
          <p><strong>KeSMIS</strong> (Kenya Slum Management Information System) is the national information management platform for slums and informal settlements across Kenya. It is developed and maintained under the <strong>Kenya Informal Settlements Improvement Project (KISIP)</strong>, a government initiative supported by the World Bank and the French Development Agency (AFD) aimed at improving living conditions in informal settlements.</p>
          <h2>Purpose</h2>
          <p>KeSMIS provides a centralised digital platform to:</p>
          <ul>
            <li>Maintain a <strong>national geodatabase</strong> of all slums and informal settlements, including their locations, boundaries, demographics and linked infrastructure</li>
            <li>Support <strong>evidence-based planning</strong> and decision-making for urban development interventions by national and county governments</li>
            <li>Enable the public to <strong>file grievances</strong> and <strong>report incidents</strong> related to KISIP projects through transparent, accessible channels</li>
            <li>Track <strong>project performance</strong> through a structured Monitoring &amp; Evaluation (M&amp;E) framework with indicators, activities and evaluation reports</li>
            <li>Conduct <strong>climate risk and vulnerability assessments</strong> for informal settlements to inform resilience planning</li>
          </ul>
          <h2>Core modules</h2>
          <table><thead><tr><th>Module</th><th>What it does</th></tr></thead><tbody>
            <tr><td><strong>Settlement Data</strong></td><td>National geodatabase of settlements, households, parcels and facilities (health, education, water, roads, lighting, etc.).</td></tr>
            <tr><td><strong>Dashboard</strong></td><td>Interactive visualisations &mdash; status cards, charts (bar, pie, line, treemap, choropleth map) and filterable analytics.</td></tr>
            <tr><td><strong>GRM</strong></td><td>Electronic Grievance Redress Mechanism &mdash; public grievance submission, tracking, referral, and resolution workflow.</td></tr>
            <tr><td><strong>Incidents</strong></td><td>Public incident reporting for accidents, disasters and safety events affecting settlements or project areas.</td></tr>
            <tr><td><strong>M&amp;E</strong></td><td>Monitoring &amp; Evaluation &mdash; indicators, activities, reports, evaluations and beneficiary tracking.</td></tr>
            <tr><td><strong>Climate Assessment</strong></td><td>Structured questionnaire-based climate risk and vulnerability scoring for settlements.</td></tr>
            <tr><td><strong>Surveys</strong></td><td>Integration with ODK Central for field data collection, with table/map views and attachment downloads.</td></tr>
            <tr><td><strong>Repository</strong></td><td>Document storage, drone imagery, and secure document sharing via token links.</td></tr>
            <tr><td><strong>Media</strong></td><td>Videos, live streams and articles related to programme activities.</td></tr>
            <tr><td><strong>Users &amp; Roles</strong></td><td>Role-based access control with granular permissions per module.</td></tr>
            <tr><td><strong>Settings</strong></td><td>System configuration &mdash; admin units, programmes, dashboard builder, SMS, climate settings.</td></tr>
          </tbody></table>
          <h2>Who uses KeSMIS?</h2>
          <ul>
            <li><strong>General public</strong> &mdash; file grievances, report incidents, browse the settlement register (no login required)</li>
            <li><strong>National-level staff</strong> &mdash; administrators, M&amp;E officers, and programme managers with full system access</li>
            <li><strong>County-level staff</strong> &mdash; county officers with access scoped to their county's data</li>
            <li><strong>GRM officers</strong> &mdash; grievance handling and resolution teams</li>
            <li><strong>Consultants</strong> &mdash; read-focused access for external reviewers and evaluators</li>
            <li><strong>Support staff</strong> &mdash; technical support and system maintenance personnel</li>
          </ul>
          <h2>SlumMapper mobile app</h2>
          <p><strong>SlumMapper</strong> is the companion mobile application for KeSMIS. It allows field workers and community members to map and document informal settlements directly from their phones.</p>
          <h3>Key features</h3>
          <ul>
            <li><strong>Field mapping</strong> &mdash; use GPS to accurately map settlement locations, boundaries and infrastructure</li>
            <li><strong>Data collection</strong> &mdash; capture information about housing conditions, services, facilities and environmental factors</li>
            <li><strong>Offline support</strong> &mdash; collect data without an internet connection; submissions are synchronised automatically once connectivity is restored</li>
            <li><strong>Photo capture</strong> &mdash; attach geotagged photos to submissions as evidence</li>
          </ul>
          <h3>Availability</h3>
          <p>SlumMapper is available for download on <strong>Android</strong> (Google Play Store) and <strong>iOS</strong> (Apple App Store). To use the app you need an account and training on data collection procedures. Contact the KISIP team for access.</p>
          <blockquote>Note &mdash; SlumMapper connects directly to KeSMIS. Data collected in the field is synchronised straight into the system, where it can be viewed in table and map formats from the web dashboard.</blockquote>

          <h2>Technology</h2>
          <p>KeSMIS is a web-based application accessible from any modern browser on desktop, tablet or mobile. The system supports light and dark display modes, is available 24/7, and integrates with <a href="https://collector.kesmis.go.ke/#/" target="_blank">ODK Central</a> for mobile field data collection. SlumMapper extends this with native mobile apps for offline-capable field operations.</p>
        `
      },
      {
        id: 'overview',
        label: 'Landing Page Overview',
        content: `
          <p>The landing page is the public entry point to KeSMIS. It is accessible to everyone &mdash; no login is required. The page is designed to introduce the system and give public users quick access to key services.</p>
          <img src="${landingPageImg}" alt="KeSMIS Landing Page" class="docs-screenshot" />
          <h2>What can you do from the landing page?</h2>
          <p>Without signing in, any visitor can:</p>
          <ul>
            <li><strong>File a grievance</strong> related to KISIP projects through a guided multi-step form</li>
            <li><strong>Report an incident</strong> (accident, disaster, or safety event) affecting informal settlements or project sites</li>
            <li><strong>Browse the Settlement Register</strong> &mdash; search, filter and view a public database of all informal settlements in Kenya, with map visualisation</li>
            <li><strong>Check the status</strong> of a previously submitted grievance or incident using its tracking ID</li>
            <li><strong>Read about KISIP</strong> &mdash; learn about the programme, view live statistics (number of settlements, population, projects) and understand how the system works</li>
            <li><strong>Contact the team</strong>, read the Privacy Policy, or browse FAQs</li>
          </ul>
          <h2>Page layout (top to bottom)</h2>
          <p>The landing page is organised into the following sections as you scroll down:</p>
          <ol>
            <li><strong>Hero section</strong> &mdash; system title, description, feature highlights and primary action buttons</li>
            <li><strong>System Capabilities</strong> &mdash; cards summarising the seven main capabilities (geodatabase, GIS, GRM, M&amp;E, access control, data collection, climate risk)</li>
            <li><strong>About KISIP</strong> &mdash; programme background with live statistics (settlements, population, projects, availability)</li>
            <li><strong>Settlement Register</strong> &mdash; interactive search table with map view</li>
            <li><strong>System Access</strong> &mdash; four-step overview of how authorised users work with the system</li>
            <li><strong>Grievance Redress (e-GRM)</strong> &mdash; dedicated section with File a Grievance and Check Status buttons, plus the toll-free helpline number</li>
            <li><strong>Access the System</strong> &mdash; final call-to-action strip with the Open Dashboard button</li>
            <li><strong>Footer</strong> &mdash; links to Documentation, Privacy Policy, FAQs, About, and Contact</li>
          </ol>
        `
      },
      {
        id: 'hero',
        label: 'Hero Section & Buttons',
        content: `
          <p>The hero section sits at the very top of the landing page. On the left it displays the system name, a short description, and three feature highlights (geodatabase, e-GRM, climate risk). On the right it shows an animated preview of what the internal dashboard looks like &mdash; a rotating carousel of bar charts, pie charts, and a mini map.</p>
          <img src="${actionButtonsImg}" alt="Hero section action buttons" class="docs-screenshot" />
          <h2>Action buttons</h2>
          <p>Below the description are four buttons. These are the primary entry points for any visitor:</p>
          <table><thead><tr><th>Button</th><th>What it does</th></tr></thead><tbody>
            <tr>
              <td><strong>Sign in / Dashboard</strong></td>
              <td>If you are <em>not</em> logged in, this button takes you to the <strong>login page</strong> where you enter your email and password. If you are <em>already</em> logged in, the label changes to <strong>Dashboard</strong> and takes you straight to the internal Status dashboard.</td>
            </tr>
            <tr>
              <td><strong>File a Grievance</strong></td>
              <td>Opens the public <strong>Grievance Form</strong> (no login needed). This is a multi-step wizard:<br/>
                <strong>Step 1 &mdash; Personal Details:</strong> name, gender, age, national ID, phone, email.<br/>
                <strong>Step 2 &mdash; Grievance Details:</strong> county, project phase (KISIP 1 / 2), settlement, and the nature of the complaint.<br/>
                <strong>Step 3 &mdash; Complaint Details:</strong> detailed description, supporting documents or photos.<br/>
                <strong>Step 4 &mdash; Review &amp; Submit:</strong> review all entries and submit. You receive a tracking code to check the status later.
              </td>
            </tr>
            <tr>
              <td><strong>Incident Report</strong></td>
              <td>Opens the public <strong>Incident Reporting Form</strong> (no login needed). This is a seven-step wizard:<br/>
                <strong>Step 1 &mdash; Incident Details:</strong> date, time, county, settlement, location, reporter name, role and phone.<br/>
                <strong>Step 2 &mdash; Incident Details (2):</strong> worker details, contractor, incident type and category.<br/>
                <strong>Step 3 &mdash; Investigation:</strong> investigation details and findings.<br/>
                <strong>Step 4 &mdash; Investigation (2):</strong> additional investigation information.<br/>
                <strong>Step 5 &mdash; Narrative:</strong> full narrative description of the incident.<br/>
                <strong>Step 6 &mdash; Actions:</strong> corrective and preventive actions taken.<br/>
                <strong>Step 7 &mdash; Prepared:</strong> review and submit the report.
              </td>
            </tr>
            <tr>
              <td><strong>Help</strong></td>
              <td>Opens a slide-out panel on the right explaining the purpose of the landing page, how to use the main action buttons, and what the top navigation links do.</td>
            </tr>
          </tbody></table>
          <blockquote>Tip &mdash; You do not need an account to file a grievance or report an incident. These forms are intentionally public so that any affected person can submit directly.</blockquote>
        `
      },
      {
        id: 'top-nav',
        label: 'Top Navigation',
        content: `
          <p>The top navigation bar is always visible at the top of the page. It provides quick links to all public sections without requiring authentication.</p>
          <img src="${topNavigationImg}" alt="Top navigation bar" class="docs-screenshot" />
          <table><thead><tr><th>Link</th><th>Where it goes</th><th>Login required?</th></tr></thead><tbody>
            <tr><td><strong>Dashboard</strong></td><td>If logged in, opens the internal Status dashboard. If not, opens the login page.</td><td>Yes (redirects to login)</td></tr>
            <tr><td><strong>Grievances</strong></td><td>Scrolls to the Grievance Redress section of the landing page, with buttons to file a new grievance or check an existing one.</td><td>No</td></tr>
            <tr><td><strong>Incidents</strong></td><td>Opens the public incident reporting page with tabs for filing a new incident and looking up an existing one.</td><td>No</td></tr>
            <tr><td><strong>Settlement Register</strong></td><td>Scrolls down to the interactive settlement search and map section.</td><td>No</td></tr>
            <tr><td><strong>FAQs</strong></td><td>Opens the Frequently Asked Questions page covering common queries about the system and KISIP.</td><td>No</td></tr>
            <tr><td><strong>About</strong></td><td>Opens the About page with background on KISIP and the implementing agencies.</td><td>No</td></tr>
            <tr><td><strong>Contact</strong></td><td>Opens a contact form and displays the team's contact details.</td><td>No</td></tr>
            <tr><td><strong>Privacy</strong></td><td>Opens the Privacy Policy page explaining data protection practices.</td><td>No</td></tr>
          </tbody></table>
          <p>On the far right of the navigation bar you will also find:</p>
          <ul>
            <li><strong>Day/Dark mode toggle</strong> &mdash; switches the entire site between light and dark themes</li>
            <li><strong>Sign in button</strong> &mdash; takes you to the login page</li>
          </ul>
        `
      },
      {
        id: 'grm-section',
        label: 'Filing a Grievance',
        content: `
          <p>The landing page includes a dedicated <strong>Electronic Grievance Redress Mechanism (e-GRM)</strong> section further down the page. This section highlights four key promises:</p>
          <ul>
            <li>Submit grievances online or via the toll-free helpline <strong>0800 724 349</strong></li>
            <li>Track your grievance status in real-time using your tracking code</li>
            <li>Confidential and secure grievance handling</li>
            <li>Timely response and resolution</li>
          </ul>
          <img src="${fileGrievanceBtnImg}" alt="File a Grievance button on the landing page" class="docs-screenshot" />
          <h2>How to file a grievance</h2>
          <ol>
            <li>Click the <strong>File a Grievance</strong> button (either in the hero section or in the GRM section)</li>
            <li>You will be taken to a multi-step form. Fill in your personal details &mdash; name (or "Anonymous" for anonymity), gender, age bracket, national ID, phone number, and email</li>
            <li>Select the <strong>county</strong> and <strong>project phase</strong> (KISIP 1 or KISIP 2), then choose the <strong>settlement</strong> related to your complaint</li>
            <li>Describe the <strong>nature and details</strong> of the complaint, and optionally attach supporting documents or photographs</li>
            <li>Review your submission on the final step and click <strong>Submit</strong></li>
            <li>You will receive a <strong>tracking code</strong> &mdash; save it to check the status of your grievance later using the <strong>Check Status</strong> button</li>
          </ol>
          <img src="${grievanceFormImg}" alt="Multi-step grievance submission form" class="docs-screenshot" />
          <h2>Checking grievance status</h2>
          <p>Click <strong>Check Status</strong> on the GRM section or navigate directly to the grievance status page. Enter your tracking code to view the current status, any updates from the GRC, and resolution details.</p>
          <blockquote>Note &mdash; You can also call the toll-free helpline <strong>0800 724 349</strong> during working hours to file a grievance by phone or enquire about an existing one.</blockquote>
        `
      },
      {
        id: 'incident-section',
        label: 'Reporting an Incident',
        content: `
          <p>The <strong>Incident Report</strong> button on the hero section opens the public incident reporting page. This allows anyone to report accidents, disasters, or safety events affecting informal settlements or KISIP project areas.</p>
          <img src="${incidentBtnImg}" alt="Incident Report button on the landing page" class="docs-screenshot" />
          <h2>How to report an incident</h2>
          <ol>
            <li>Click the <strong>Incident Report</strong> button on the landing page hero section</li>
            <li>You will be taken to the incident form with two tabs: <strong>File an Incident</strong> (active by default) and a tab for looking up existing incidents</li>
            <li>Fill in the <strong>Incident Details</strong>:
              <ul>
                <li>Date and time the incident occurred</li>
                <li>County and settlement where it happened</li>
                <li>Detailed location description</li>
                <li>Reporter name, role (Consultant, Contractor, SEC, Victim, etc.), and phone number</li>
              </ul>
            </li>
            <li>Provide worker and contractor information if the incident occurred on a project site</li>
            <li>Select the <strong>incident type and category</strong></li>
            <li>Complete the investigation details, narrative, and corrective actions sections</li>
            <li>Review and submit the report</li>
          </ol>
          <img src="${incidentFormImg}" alt="Incident reporting form" class="docs-screenshot" />
          <h2>Incident types</h2>
          <p>Common incident categories include:</p>
          <ul>
            <li>Construction site accidents</li>
            <li>Flooding or natural disaster events</li>
            <li>Fire outbreaks in informal settlements</li>
            <li>Infrastructure damage or collapse</li>
            <li>Environmental hazards</li>
          </ul>
          <blockquote>Tip &mdash; Provide as much detail as possible, including the exact location and any witnesses. This helps the team investigate and respond quickly.</blockquote>
        `
      },
      {
        id: 'settlement-register',
        label: 'Settlement Register',
        content: `
          <p>The <strong>Settlement Register</strong> is an interactive public section embedded in the landing page. It provides access to the national database of slums and informal settlements without requiring a login.</p>
          <img src="${settlementRegisterImg}" alt="Settlement Register list view" class="docs-screenshot" />
          <h2>Searching for settlements</h2>
          <ol>
            <li>Type a settlement name in the <strong>search box</strong> and click <strong>Search</strong> (or press Enter)</li>
            <li>Alternatively, use the <strong>filter dropdowns</strong> to narrow results by County, Sub-county, and Ward (each dropdown becomes active after the one above is selected)</li>
            <li>Click <strong>Reset</strong> to clear all filters and start fresh</li>
          </ol>
          <h2>List view (table)</h2>
          <p>The default view displays results in a table with the following columns:</p>
          <ul>
            <li><strong>Name</strong> &mdash; official or commonly used name of the settlement</li>
            <li><strong>Population</strong> &mdash; estimated number of residents</li>
            <li><strong>County</strong> &mdash; the county the settlement belongs to</li>
            <li><strong>Sub-county</strong> &mdash; the sub-county</li>
            <li><strong>Ward</strong> &mdash; the ward</li>
            <li><strong>View on map</strong> &mdash; a link that switches to the Map tab and zooms to that settlement</li>
          </ul>
          <p>Results are paginated. Use the pagination controls at the bottom to navigate between pages.</p>
          <h2>Map view</h2>
          <img src="${settlementRegisterMapImg}" alt="Settlement Register map view" class="docs-screenshot" />
          <p>Switch to the <strong>Map</strong> tab to visualise settlements geographically:</p>
          <ul>
            <li>Select a county (or search by name) to load settlement markers on the map</li>
            <li>Click a marker or boundary polygon to see a popup with basic details (name, population, county)</li>
            <li>Use the map control in the corner to switch between <strong>Streets</strong> and <strong>Satellite</strong> basemaps</li>
            <li>Zoom and pan to explore different areas</li>
          </ul>
          <h2>Vulnerability scoring</h2>
          <p>Some settlements display a <strong>vulnerability rating</strong> (LOW, MEDIUM, HIGH). This is based on the KISIP Tool A climate vulnerability assessment, indicating the settlement's exposure to climate-related risks such as floods, droughts, and landslides. The rating helps prioritise resilience planning.</p>
          <h2>Help button</h2>
          <p>Click the <strong>Help</strong> button next to the filters to open a dialog that explains how to use the list, map and vulnerability features in detail.</p>
          <blockquote>Note &mdash; For full access to detailed settlement data, household records, and facility information, you need to register for an account and sign in to the system.</blockquote>
        `
      },
      {
        id: 'about-kisip',
        label: 'About KISIP & Statistics',
        content: `
          <p>Below the hero section, the landing page presents background information about the <strong>Kenya Informal Settlements Improvement Project (KISIP)</strong>:</p>
          <img src="${aboutKisipImg}" alt="About KISIP section" class="docs-screenshot" />
          <ul>
            <li>KeSMIS is implemented under KISIP, a government initiative to improve living conditions in informal settlements across Kenya</li>
            <li>The system supports evidence-based planning and decision-making for urban development interventions</li>
            <li>Compliant with government data security and privacy standards</li>
            <li>Multi-stakeholder access for national, county, and project teams</li>
            <li>Standardised geospatial data collection and management</li>
            <li>Performance monitoring and evaluation reporting</li>
          </ul>
          <h2>Live statistics</h2>
          <p>Alongside the KISIP description, the page shows four real-time statistics pulled from the database:</p>
          <table><thead><tr><th>Statistic</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Informal Settlements</strong></td><td>Total number of settlements registered in KeSMIS.</td></tr>
            <tr><td><strong>Residents Recorded</strong></td><td>Combined population across all registered settlements.</td></tr>
            <tr><td><strong>KISIP Projects</strong></td><td>Total number of active KISIP projects.</td></tr>
            <tr><td><strong>24/7</strong></td><td>System availability &mdash; the platform is accessible around the clock.</td></tr>
          </tbody></table>
        `
      },
      {
        id: 'display-mode',
        label: 'Display Mode',
        content: `
          <p>KeSMIS supports <strong>light</strong> and <strong>dark</strong> themes. A toggle switch is available in the top navigation bar header.</p>
          <img src="${modeSwitchImg}" alt="Day and dark mode toggle" class="docs-screenshot" />
          <ul>
            <li>Click the sun/moon icon to switch between day and dark modes</li>
            <li>Your preference is saved in the browser and persists across sessions until you change it</li>
            <li>The theme applies to the entire landing page including the navigation, forms, and settlement register</li>
          </ul>
          <blockquote>Tip &mdash; Dark mode is useful in low-light environments to reduce eye strain.</blockquote>
        `
      },
      {
        id: 'register',
        label: 'Creating an Account',
        content: `
          <p>Before you can access the internal KeSMIS dashboard you need a user account. You can register for one directly from the landing page.</p>
          <h2>How to create an account</h2>
          <ol>
            <li>Click the <strong>Sign in</strong> button on the landing page hero section or the top navigation bar</li>
          </ol>
          <img src="${signinBtnImg}" alt="Sign in button on the landing page" class="docs-screenshot" />
          <ol start="2">
            <li>You will be taken to the <strong>login page</strong>. Instead of signing in, click the <strong>Sign Up</strong> (or <strong>Register</strong>) button/link on the login page</li>
          </ol>
          <img src="${loginSignupImg}" alt="Login page with Sign Up link" class="docs-screenshot" />
          <ol start="3">
            <li>You will be taken to the <strong>registration page</strong>. Fill in the form with the following details:</li>
          </ol>
          <img src="${registerImg}" alt="Registration form" class="docs-screenshot" />
          <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Full Name</strong></td><td>Your full name as it should appear in the system.</td></tr>
            <tr><td><strong>Username</strong></td><td>A unique username you will use alongside your email to identify your account.</td></tr>
            <tr><td><strong>Email</strong></td><td>A valid email address. This will be used for login and password recovery.</td></tr>
            <tr><td><strong>Password</strong></td><td>Must be 8&ndash;20 characters and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (e.g. <code>!</code> <code>@</code> <code>#</code> <code>$</code>).</td></tr>
            <tr><td><strong>Organisation</strong></td><td>The organisation you belong to (e.g. Kenya Red Cross Society, county government, etc.).</td></tr>
            <tr><td><strong>Phone</strong></td><td>Your phone number with country code. An international phone input is provided.</td></tr>
            <tr><td><strong>County</strong></td><td>Your county (shown for Kenyan phone numbers). Select "Not Applicable" if not county-based.</td></tr>
          </tbody></table>
          <ol start="5">
            <li>Check the <strong>I agree to the privacy policy</strong> checkbox</li>
            <li>Click <strong>Register</strong> to submit your application</li>
          </ol>
          <h2>What happens after registration?</h2> 
          <ul>
            <li>Your registration is submitted for <strong>administrator review</strong></li>
            <li>An administrator will approve your account and assign you a <strong>role</strong> that determines which modules and data you can access</li>
            <li>You will receive an sms and email notification once your account is activated</li>
            <li>After approval, you can sign in using your email and password</li>
          </ul>
          <blockquote>Note &mdash; Accounts may be deactivated by administrators if found to be in violation of usage policies or misuse of the system.</blockquote>
        `
      },
      {
        id: 'login',
        label: 'Signing In',
        content: `
          <p>Once you have an approved account, you can sign in to access the internal KeSMIS dashboard and all the modules available to your role.</p>
          <img src="${signinBtnImg}" alt="Sign in button on the landing page" class="docs-screenshot" />
          <h2>How to sign in</h2>
          <ol>
            <li>Click the <strong>Sign in</strong> button on the hero section, or the <strong>Sign in</strong> link on the top navigation bar</li>
            <li>You will be taken to the <strong>login page</strong></li>
            <li>Enter your <strong>email address</strong> and <strong>password</strong></li>
            <li>Click <strong>Sign in</strong> to authenticate</li>
            <li>On success you will be redirected to your <strong>home dashboard</strong></li>
          </ol>
          <img src="${loginImg}" alt="Login page" class="docs-screenshot" />
          <img src="${loginSuccessRedirectImg}" alt="Successful login redirect to dashboard" class="docs-screenshot" />
          <h2>Forgot your password?</h2>
          <p>Click the <strong>Forgot password</strong> link on the login page. Enter your registered email address and a password reset link will be sent to you via email. Follow the link to set a new password.</p>
          <h2>After signing in</h2>
          <p>Once authenticated:</p>
          <ul>
            <li>The landing page hero button changes from <strong>"Sign in"</strong> to <strong>"Dashboard"</strong></li>
            <li>Clicking it takes you directly to your <strong>home dashboard</strong></li>
            <li>The sidebar navigation appears with all modules available to your role</li>
            <li>You can access settlements, facilities, surveys, grievances, M&amp;E and all other modules based on your assigned permissions</li>
          </ul>
          <blockquote>Tip &mdash; If you do not yet have an account, see the previous page (<strong>Creating an Account</strong>) for registration instructions.</blockquote>
        `
      }
    ]
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'mdi:view-dashboard-outline',
    children: [
      {
        id: 'dash-overview',
        label: 'Overview',
        content: `
          <p>The <strong>Dashboard</strong> module is the authenticated user's home screen. It is accessible from the sidebar under <strong>Dashboards</strong> and contains four sub-pages:</p>
          <table><thead><tr><th>Page</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Home</strong></td><td>Personal workspace showing your own settlements, projects, documents and recent activity.</td></tr>
            <tr><td><strong>Status</strong></td><td>National-level analytics dashboard with dynamic cards, charts and filterable sections.</td></tr>
            <tr><td><strong>Map</strong></td><td>Interactive Mapbox map of all informal settlements with clustering and filters.</td></tr>
            <tr><td><strong>Projects</strong></td><td>Map-based view of project locations with programme filters and a details drawer.</td></tr>
          </tbody></table>
          <blockquote>Note &mdash; In addition to the default Status dashboard, administrators can configure <strong>custom dashboards</strong> for specific themes or use cases (e.g. a GRM-focused dashboard or a programme-specific view). These appear as additional entries under the Dashboards menu in the sidebar. Custom dashboards use the same cards, tabs and chart types as the Status dashboard but can be tailored to highlight different data sets and metrics.</blockquote>
        `
      },
      {
        id: 'dash-home',
        label: 'Home',
        content: `
          <p>The <strong>Home</strong> dashboard is your personal workspace. It greets you with a time-based message (Good Morning / Afternoon / Evening) and shows a summary of your contributions.</p>
          <img src="${homeDashboardImg}" alt="Home dashboard" class="docs-screenshot" />
          <h2>Summary cards</h2>
          <p>Three stat cards at the top display animated counters for:</p>
          <ul>
            <li><strong>Settlements created by me</strong> &mdash; number of settlements you have personally registered</li>
            <li><strong>Projects created by me</strong> &mdash; number of projects you have created</li>
            <li><strong>Documents uploaded by me</strong> &mdash; number of files you have uploaded to the repository</li>
          </ul>
          <h2>Tabs</h2>
          <p>Below the cards are three tabs:</p>
          <ul>
            <li><strong>Settlements</strong> &mdash; a table of settlements you created, with a <em>View on Map</em> button that navigates to the settlement's map view</li>
            <li><strong>Projects</strong> &mdash; a table of projects you created showing code, title and status</li>
            <li><strong>My Recent Updates</strong> &mdash; a timeline of your recent actions in the system, with timestamps and colour-coded status indicators</li>
          </ul>
          <p>Your profile photo, name, email and "member since" date are displayed in the header area. Click your profile photo to navigate to the profile page.</p>
        `
      },
      {
        id: 'dash-status',
        label: 'Status (National Dashboard)',
        content: `
          <p>The <strong>Status</strong> page is the primary analytics dashboard. It presents a configurable set of summary cards, dynamic tabs and a wide variety of chart types &mdash; all driven by data from the database.</p>
          <img src="${statusDashboardImg}" alt="Status dashboard overview" class="docs-screenshot" />
          <h2>Summary cards</h2>
          <p>At the top of the page, a row of <strong>stat cards</strong> displays key metrics such as:</p>
          <ul>
            <li>Total settlements, households, population</li>
            <li>Open grievances, incidents</li>
            <li>Active projects</li>
            <li>Any other metric configured by the administrator</li>
          </ul>
          <p>Each card shows an icon, a value (large numbers are formatted as <strong>1.2K</strong> or <strong>3.5M</strong>), and a description. Cards are <strong>clickable</strong> &mdash; clicking a card navigates to the relevant module (e.g. clicking "Settlements" takes you to the settlement list).</p>
          <blockquote>Tip &mdash; Cards and their values are fully configurable by administrators under Settings &rarr; Dashboards &rarr; Cards.</blockquote>

          <h2>Filtering</h2>
          <img src="${statusFilterBtnImg}" alt="Filter button on the Status dashboard" class="docs-screenshot" />
          <p>Click the <strong>filter icon</strong> (visible in the tags/header bar) to open a filter drawer on the right side. The drawer contains:</p>
          <ul>
            <li><strong>County</strong> &mdash; multi-select dropdown; choose one or more counties to filter all cards and charts</li>
            <li><strong>Constituency (Sub-county)</strong> &mdash; multi-select dropdown; options cascade from the selected counties</li>
          </ul>
          <p>Click <strong>Confirm</strong> to apply the filters. All stat cards and charts on the page will update to reflect only the selected areas. Click <strong>Cancel</strong> to close without applying.</p>
          <img src="${statusFilterResultsImg}" alt="Filtered dashboard results" class="docs-screenshot" />
          <p>When filters are active, the chart subtitles update to show which county or sub-county is being viewed.</p>

          <h2>Sections (tabs)</h2>
          <img src="${statusSectionsTabsImg}" alt="Dashboard sections and tabs" class="docs-screenshot" />
          <p>Below the cards, the dashboard is organised into <strong>dynamic tabs</strong> (sections). Each tab groups related charts together. Examples might include "Settlements Overview", "GRM Summary", "Infrastructure", etc.</p>
          <p>Tabs are configured by administrators under Settings &rarr; Dashboards &rarr; Tabs. Click a tab to switch between sections. Charts within each section are displayed in a two-column grid layout.</p>

          <h2>Chart types</h2>
          <p>The system supports a rich set of chart visualisations:</p>
          <table><thead><tr><th>Type</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Simple bar</strong></td><td>Vertical bar chart for single-series data (e.g. settlements per county).</td></tr>
            <tr><td><strong>Multi-bar</strong></td><td>Grouped bar chart comparing multiple series side by side.</td></tr>
            <tr><td><strong>Stacked bar</strong></td><td>Stacked bar chart showing composition of values.</td></tr>
            <tr><td><strong>Pie chart</strong></td><td>Circular chart for proportions and percentages.</td></tr>
            <tr><td><strong>Donut chart</strong></td><td>Pie chart with a hollow centre.</td></tr>
            <tr><td><strong>Line chart</strong></td><td>Trend line chart over time or categories.</td></tr>
            <tr><td><strong>Stacked line</strong></td><td>Area/line chart with stacked series.</td></tr>
            <tr><td><strong>Choropleth map</strong></td><td>County-level map of Kenya coloured by data values (e.g. settlement density per county). Supports zoom, pan, and click-to-drill-down.</td></tr>
            <tr><td><strong>Population pyramid</strong></td><td>Horizontal bar chart showing age-gender distribution.</td></tr>
            <tr><td><strong>Treemap</strong></td><td>Rectangular tiles sized by value for hierarchical data.</td></tr>
          </tbody></table>
          <p>Charts are configured under Settings &rarr; Dashboards &rarr; Charts, and assigned to sections.</p>

          <h2>Downloading and exporting</h2>
          <img src="${statusChartDownloadImg}" alt="Chart download options" class="docs-screenshot" />
          <p>Several export options are available from the Status dashboard:</p>
          <ul>
            <li><strong>Map charts</strong> include an ECharts toolbox in the top-right corner of the chart with:
              <img src="${mapChartImg}" alt="Map chart with ECharts toolbox" class="docs-screenshot" />
              <ul>
                <li><strong>Data View</strong> &mdash; see the raw data behind the chart in tabular form</li>
                <li><strong>Restore</strong> &mdash; reset the chart to its default state after zooming or panning</li>
                <li><strong>Save as Image</strong> &mdash; download the chart as a PNG image</li>
              </ul>
            </li>
          </ul>
          <blockquote>Tip &mdash; Apply county/sub-county filters first, then use Save as Image to capture filtered snapshots for reports and presentations.</blockquote>
        `
      },
      {
        id: 'dash-map',
        label: 'Settlements Map',
        content: `
          <p>The <strong>Map</strong> page shows a full-screen interactive Mapbox map of all informal settlements registered in KeSMIS.</p>
          <img src="${settlementsMapImg}" alt="Settlements Map overview" class="docs-screenshot" />
          <h2>Map features</h2>
          <ul>
            <li><strong>Settlement markers</strong> &mdash; each settlement appears as a green circle on the map</li>
            <li><strong>Clustering</strong> &mdash; when zoomed out, nearby settlements are grouped into clusters. Clusters are colour-coded by count (blue &rarr; yellow &rarr; pink). Click a cluster to zoom in and expand it</li>
            <li><strong>Settlement labels</strong> &mdash; settlement names appear as labels when zoomed in</li>
            <li><strong>County boundaries</strong> &mdash; red boundary lines show county limits</li>
            <li><strong>Sub-county boundaries</strong> &mdash; purple boundary lines appear when a sub-county filter is applied</li>
          </ul>

          <h2>Filtering</h2>
          <img src="${settlementsMapFilterImg}" alt="Settlements Map filter panel" class="docs-screenshot" />
          <p>Click the <strong>filter icon</strong> in the top-right map controls to open a floating filter panel:</p>
          <ul>
            <li><strong>County</strong> &mdash; multi-select dropdown to show only settlements in specific counties</li>
            <li><strong>Sub-county</strong> &mdash; multi-select dropdown, options cascade from selected counties</li>
            <li><strong>Reset Filters</strong> &mdash; clears all selections and shows all settlements</li>
          </ul>
          <p>On mobile devices, the filter panel slides in as a drawer with an overlay.</p>

          <h2>Interacting with the map</h2>
          <img src="${settlementsMapInteractImg}" alt="Interacting with the Settlements Map" class="docs-screenshot" />
          <ul>
            <li><strong>Click a settlement point</strong> &mdash; a popup appears showing the settlement name, area and county</li>
            <li><strong>Click the popup</strong> &mdash; navigates to the detailed settlement map page</li>
            <li><strong>Zoom and pan</strong> &mdash; use scroll wheel, pinch gesture or the +/&minus; controls</li>
            <li><strong>Geolocation</strong> &mdash; click the geolocation control to centre the map on your current location</li>
            <li><strong>Streets / Satellite</strong> &mdash; the map style follows the app's day/dark mode setting</li>
          </ul>
          <p>When filters are applied, the map automatically fits its view to show all matching settlements.</p>
          <blockquote>Note &mdash; County-restricted users (e.g. county-level staff) will only see settlements in their assigned county. The county filter will be pre-set and disabled.</blockquote>
        `
      },
      {
        id: 'dash-projects',
        label: 'Projects Map',
        content: `
          <p>The <strong>Projects</strong> page shows a full-screen Mapbox map of all project locations. Unlike the settlements map, project points are <em>not</em> clustered &mdash; each project appears individually as a green marker.</p>
          <img src="${projectsMapImg}" alt="Projects Map overview" class="docs-screenshot" />
          <h2>Filtering</h2>
          <p>Open the floating filter panel from the top-right to narrow the view:</p>
          <ul>
            <li><strong>Programme (Implementer)</strong> &mdash; multi-select dropdown to show only projects from specific programmes (e.g. KISIP 1, KISIP 2)</li>
            <li><strong>County</strong> &mdash; multi-select dropdown; options may be driven by the selected programme</li>
            <li><strong>Sub-county</strong> &mdash; multi-select dropdown, cascading from county selection</li>
            <li><strong>Reset Filters</strong> &mdash; clears all selections</li>
          </ul>

          <h2>Viewing project details</h2>
          <p>Click on any project marker to open a <strong>details drawer</strong> on the right side of the screen. The drawer shows:</p>
          <ul>
            <li>Project title and contract code</li>
            <li>Location and implementer</li>
            <li>Description, start date, end date and status</li>
            <li>A <strong>View Settlement Details</strong> button when the project is linked to a settlement</li>
          </ul>
          <p>The drawer is responsive &mdash; it occupies 400px on desktop and nearly full width on mobile.</p>
          <blockquote>Tip &mdash; Use the Programme filter to compare project locations across different KISIP phases or implementing agencies.</blockquote>
        `
      }
    ]
  },
  {
    id: 'data',
    label: 'Data Management',
    icon: 'mdi:database-outline',
    roles: ['root_admin', 'super_admin', 'admin', 'staff', 'monitoring', 'consultant', 'national_monitoring', 'county_admin'],
    subgroups: [
      {
        id: 'data-settlements',
        label: 'Settlements',
        icon: 'mdi:map-legend',
        children: [
          {
            id: 'data-settlements-overview',
            label: 'Overview',
            content: `
              <p>The <strong>Settlements</strong> module is the core data layer of KeSMIS. It stores the national geodatabase of informal settlements and provides tools for listing, creating, reviewing, editing, exporting and managing the lifecycle of settlement records.</p>
              <h2>Key capabilities</h2>
              <ul>
                <li><strong>Settlement list</strong> &mdash; browse, search and filter all registered settlements across multiple status tabs</li>
                <li><strong>Settlement details</strong> &mdash; view demographics, location map, housing, utilities, facilities, documents, households, vulnerability scores, projects and indicator reports</li>
                <li><strong>Add / Edit</strong> &mdash; register new settlements using a map-first workflow with Google Maps, or update existing records</li>
                <li><strong>Review workflow</strong> &mdash; new settlements are submitted as <em>Pending</em> and require administrator approval before appearing in the approved list</li>
                <li><strong>Decommission &amp; Delete</strong> &mdash; super administrators can decommission, soft-delete, cascade-delete, or merge settlements</li>
                <li><strong>Export</strong> &mdash; download settlement data as Excel or geospatial (GeoJSON) files</li>
              </ul>
            `
          },
          {
            id: 'data-settlements-listing',
            label: 'Listing, Search & Filters',
            content: `
              <p>The settlement list is the main view when you navigate to <strong>Data &rarr; Settlements</strong>. It displays settlements in a paginated table with multiple status tabs.</p>
              <img src="${settlementListingImg}" alt="Settlement listing view" class="docs-screenshot" />
              <h2>Status tabs</h2>
              <p>Settlements are organised into the following tabs based on their lifecycle status:</p>
              <table><thead><tr><th>Tab</th><th>Description</th><th>Who can see it</th></tr></thead><tbody>
                <tr><td><strong>Approved</strong></td><td>Settlements that have been reviewed and approved. This is the default view.</td><td>All users</td></tr>
                <tr><td><strong>New</strong></td><td>Pending settlements awaiting review and approval.</td><td>National staff, super admins, county admins</td></tr>
                <tr><td><strong>Rejected</strong></td><td>Settlements that were reviewed and rejected.</td><td>National staff, super admins</td></tr>
                <tr><td><strong>Duplicates</strong></td><td>Potential duplicate records detected by the system, grouped by county.</td><td>National staff, super admins</td></tr>
                <tr><td><strong>Decommissioned</strong></td><td>Settlements that have been decommissioned (no longer active).</td><td>National staff, super admins, county admins</td></tr>
                <tr><td><strong>Deleted</strong></td><td>Soft-deleted or merged settlements. Can be restored.</td><td>National staff, super admins, county admins</td></tr>
              </tbody></table>

              <h2>Table columns</h2>
              <p>The main table displays the following columns:</p>
              <ul>
                <li><strong>Geom</strong> &mdash; geometry icon indicating whether the settlement has a mapped boundary; a badge appears if roads or facilities are linked</li>
                <li><strong>ID</strong> &mdash; unique settlement ID; an attachment icon appears if documents exist</li>
                <li><strong>Name</strong> &mdash; settlement name</li>
                <li><strong>Location</strong> &mdash; ward, sub-county and county</li>
                <li><strong>Type</strong> &mdash; Slum, Informal Settlement, or Project Location</li>
                <li><strong>Population</strong> &mdash; estimated number of residents</li>
                <li><strong>Area (HA)</strong> &mdash; area in hectares</li>
                <li><strong>Created</strong> &mdash; date the record was last updated</li>
                <li><strong>Code</strong> &mdash; unique code with a copy-to-clipboard button</li>
                <li><strong>Actions</strong> &mdash; dropdown with row-level actions (View on Map, Edit, Delete, Review, Decommission, Merge, Update Location)</li>
              </ul>
              <img src="${settlementListingActionsImg}" alt="Settlement listing row actions" class="docs-screenshot" />
              <p>All columns are sortable. Click a column header to sort ascending or descending.</p>
              <p>Selecting <strong>View on Map</strong> opens the settlement's boundary and linked layers on an interactive map:</p>
              <img src="${settlementListingViewMapImg}" alt="Settlement View on Map" class="docs-screenshot" />

              <h2>Search</h2>
              <img src="${settlementSearchImg}" alt="Settlement search" class="docs-screenshot" />
              <p>Type a settlement name into the <strong>search box</strong> at the top of the list and press Enter or click the search icon. The table updates to show matching results. Clear the search box to reset.</p>

              <h2>Filters</h2>
              <img src="${settlementFilterImg}" alt="Settlement filters" class="docs-screenshot" />
              <p>Use the location filter dropdowns to narrow the list:</p>
              <ul>
                <li><strong>County</strong> &mdash; multi-select; choose one or more counties</li>
                <li><strong>Sub-county</strong> &mdash; multi-select; options appear based on selected counties</li>
                <li><strong>Ward</strong> &mdash; multi-select; options appear based on selected sub-counties</li>
              </ul>
              <p>A <strong>date filter</strong> (calendar icon) lets you filter by date range. Click <strong>Clear</strong> to reset all filters.</p>
              <blockquote>Note &mdash; County-level users only see settlements in their assigned county. The county filter is pre-set and cannot be changed.</blockquote>

              <h2>Pagination</h2>
              <p>Results are paginated with configurable page sizes (5, 10, 15, 20, 50, 100). If the total number of settlements is 100 or fewer, an "All" option is also available. The total count is displayed next to the pagination controls.</p>
            `
          },
          {
            id: 'data-settlements-creating',
            label: 'Adding a Settlement',
            content: `
              <p>To register a new settlement, click the <strong>Add Settlement</strong> button on the settlement list toolbar. This opens a map-first workflow powered by Google Maps.</p>
              <img src="${settlementAdd1Img}" alt="Add Settlement button" class="docs-screenshot" />
              <h2>Step 1 &mdash; Select location</h2>
              <ol>
                <li>Select the <strong>County</strong> from the dropdown</li>
                <li>Select the <strong>Ward</strong> &mdash; wards are loaded based on the selected county</li>
                <li>The map zooms to the selected ward and displays its boundary</li>
              </ol>
              <img src="${settlementAdd2CountyImg}" alt="Select county and ward" class="docs-screenshot" />

              <h2>Step 2 &mdash; Draw the boundary</h2>
              <p>Use the map tools to define the settlement's location:</p>
              <ul>
                <li><strong>Draw polygon</strong> &mdash; click points on the map to draw the settlement boundary. The polygon must be inside the ward boundary</li>
                <li><strong>Place marker</strong> &mdash; drop a point marker if the exact boundary is not yet known</li>
                <li><strong>Upload boundary file</strong> &mdash; import a GeoJSON, zipped Shapefile, KML or KMZ file</li>
                <li><strong>Fly to coordinates</strong> &mdash; enter latitude/longitude to centre the map on a specific location</li>
              </ul>
              <p>Neighbouring settlements already registered in the same ward are shown as pink polygons with labels, so you can avoid overlaps.</p>
              <p>The area in hectares is calculated automatically from the drawn polygon.</p>
              <img src="${settlementAdd2DrawImg}" alt="Draw settlement boundary on map" class="docs-screenshot" />

              <h2>Step 3 &mdash; Fill in the details</h2>
              <p>After drawing the boundary, a side drawer opens with the following sections:</p>
              <img src="${settlementAdd3FillImg}" alt="Fill in settlement details" class="docs-screenshot" />
              <table><thead><tr><th>Section</th><th>Fields</th></tr></thead><tbody>
                <tr><td><strong>Basic Information</strong></td><td>Name, settlement type (Slum / Informal Settlement / Project Location), area, population, description</td></tr>
                <tr><td><strong>Location</strong></td><td>County, ward (pre-filled from Step 1), sub-county (auto-inferred)</td></tr>
                <tr><td><strong>Parcel Information</strong></td><td>Parcel number, owner, owner type, RIM number, surveyed status, land status</td></tr>
                <tr><td><strong>Physical Characteristics</strong></td><td>Population density, land use, proximity to river, wayleave, road reserve, structure types, development type, building materials, distances to town and trunk road, electricity and piped water availability</td></tr>
                <tr><td><strong>Socio-Economic</strong></td><td>Encumbrance, number of households, average household size, median household income, plot ownership and tenancy ratios, average rent, environmental hazards, general location description</td></tr>
                <tr><td><strong>Vulnerability Assessment</strong></td><td>Climate region, soil type, land cover, altitude range, proximity to river and flood plain. A vulnerability score and rating (LOW / MEDIUM / HIGH) are computed automatically</td></tr>
              </tbody></table>

              <h2>Required fields</h2>
              <p>The following fields must be completed before submission: settlement name, county, ward, settlement type, climate region, soil type, land cover, altitude range, proximity to river, and proximity to flood plain. A boundary or marker must also be placed on the map.</p>

              <h2>Duplicate check</h2>
              <p>Before saving, the system checks for existing settlements with the same name in the same county. If a potential duplicate is found, a confirmation dialog appears. You can proceed or cancel.</p>

              <h2>After submission</h2>
              <ul>
                <li>The settlement is saved with a status of <strong>Pending</strong> and assigned a unique code</li>
                <li>It appears in the <strong>New</strong> tab of the settlement list</li>
                <li>An administrator must <strong>review and approve</strong> the settlement before it moves to the Approved tab</li>
              </ul>
              <img src="${settlementAdd3SavedImg}" alt="Settlement saved as pending" class="docs-screenshot" />
            `
          },
          {
            id: 'data-settlements-details',
            label: 'Settlement Details',
            content: `
              <p>Double-click any settlement in the listing table (or click the <strong>More</strong> action button) to open its <strong>Settlement Details</strong> page. This is a comprehensive profile view organised into tabbed sections.</p>

              <h2>Page header</h2>
              <p>The header displays the settlement name, sub-county and county (e.g. <em>"Kibera Settlement, Langata Subcounty, Nairobi County"</em>). Two action buttons are available for authorised users:</p>
              <ul>
                <li><strong>Edit</strong> &mdash; opens the settlement editing form to update any field</li>
                <li><strong>Add Facility</strong> &mdash; navigates to the facility creation wizard, pre-linked to this settlement</li>
              </ul>

              <h2>Profile tab</h2>
              <img class="docs-screenshot" src="${settlementDetailsProfileImg}" alt="Settlement Details — Profile tab" />
              <p>The default tab displays the settlement's full attribute data in collapsible sections:</p>
              <table><thead><tr><th>Section</th><th>Fields</th></tr></thead><tbody>
                <tr><td><strong>Administrative Location</strong></td><td>County, Sub-county, Ward, General Location</td></tr>
                <tr><td><strong>Profile</strong></td><td>Name, Type, Population, Area (Ha), Number of Households, Average Household Size, Land Status, Parcel Owner, Owner Type, Land Use, Development Type, Structure Types, Building Materials, Distance to Town, Distance to Trunk Road, Environmental Hazards</td></tr>
                <tr><td><strong>Housing</strong></td><td>Number of Households, Average Household Size, Structure Types, Development Type, Building Materials, Average Rent, Plot Ownership Ratio, Plot Tenant Ratio</td></tr>
                <tr><td><strong>Utilities</strong></td><td>Electricity Available, Piped Water Available, Median Household Income, On Wayleave, On Road Reserve</td></tr>
              </tbody></table>
              <p>Each section can be collapsed or expanded by clicking its header. A <strong>Download Facts</strong> button generates a PDF report of the settlement profile.</p>

              <h2>Location tab</h2>
              <img class="docs-screenshot" src="${settlementDetailsLocationImg}" alt="Settlement Details — Location tab" />
              <p>Displays an interactive Mapbox map centred on the settlement. The map shows:</p>
              <ul>
                <li>The settlement boundary polygon</li>
                <li>Overlaid layers for facilities, roads, parcels, structures, and other linked spatial data</li>
                <li>Standard map controls (zoom, basemap switch between Streets and Satellite)</li>
              </ul>

              <h2>Documents tab</h2>
              <img class="docs-screenshot" src="${settlementDetailsDocumentsImg}" alt="Settlement Details — Documents tab" />
              <p>A document management area where files associated with the settlement are stored and organised. Features include:</p>
              <ul>
                <li><strong>Search</strong> &mdash; filter documents by name</li>
                <li><strong>Upload</strong> &mdash; authorised users can upload new documents (photos, reports, PDFs, shapefiles, etc.)</li>
                <li><strong>Photos section</strong> &mdash; a dedicated grid of photo thumbnails with click-to-preview</li>
                <li><strong>Grouped documents</strong> &mdash; other files are grouped by category (e.g. Reports, Plans, Maps) in collapsible sections with name, format, size, upload date, and download/delete actions</li>
              </ul>

              <h2>Projects tab</h2>
              <img class="docs-screenshot" src="${settlementDetailsProjectsImg}" alt="Settlement Details — Projects tab" />
              <p>Lists all KISIP projects linked to this settlement in a table with columns for Project Code, Project Title, and Status. Click the action button to navigate to the full project details.</p>

              <h2>Households tab</h2>
              <img class="docs-screenshot" src="${settlementDetailsHouseholdsImg}" alt="Settlement Details — Households tab" />
              <p>Displays households registered under this settlement (visible only to users with household access permissions). Features:</p>
              <ul>
                <li>Paginated table (5, 10, 20, 50, 100 per page)</li>
                <li>Columns: Gender, Age, Household Size</li>
                <li>Export to Excel via the download button</li>
              </ul>

              <h2>Vulnerability tab</h2>
              <img class="docs-screenshot" src="${settlementDetailsClimateImg}" alt="Settlement Details — Vulnerability tab" />
              <p>Shows vulnerability and climate risk assessment scores for the settlement, split into two assessment tools:</p>
              <ul>
                <li><strong>Tool A — GIS-based Vulnerability Assessment</strong> &mdash; displays attributes like Climate Region, Soil Type, Land Cover, Altitude Range, Proximity to River, and Proximity to Flood Plain, along with the computed vulnerability score and rating tag</li>
                <li><strong>Tool B — Climate Risk &amp; Vulnerability Assessment</strong> &mdash; links to the KISIP Tool B questionnaire. If completed, shows four dimension score cards (Hazard, Exposure, Sensitivity, Adaptive Capacity) with colour-coded severity levels and an overall score</li>
              </ul>
              <p>A <strong>Score Interpretation</strong> drawer explains how scores map to Low, Medium, High, and Very High ratings.</p>

              <h2>Indicators tab</h2>
              <p>Tracks M&amp;E indicator reports filed against the settlement. The table shows:</p>
              <ul>
                <li>Indicator name and category</li>
                <li>Date reported, Amount, Cumulative Amount</li>
                <li>Status (Approved, Pending, Rejected &mdash; with tooltip showing rejection reason)</li>
                <li>Attachment icon if supporting documents are linked</li>
              </ul>
              <p>Authorised users can click <strong>File Report</strong> to submit a new indicator report.</p>

              <h2>History tab</h2>
              <img class="docs-screenshot" src="${settlementDetailsHistoryImg}" alt="Settlement Details — History tab" />
              <p>An audit trail of all edits made to the settlement record (visible to users with edit permission). Each row shows the date and the user who made the change. Expand a row to see a field-by-field comparison of <em>Before</em> and <em>After</em> values. A <strong>Revert</strong> button allows administrators to undo a specific edit.</p>

              <h2>Settings tab</h2>
              <p>Available only to super administrators and root administrators. Contains a <strong>Delete Settlement</strong> button with a confirmation prompt. Deleting a settlement soft-deletes it and moves it to the Deleted tab in the listing.</p>
            `
          },
          {
            id: 'data-settlements-management',
            label: 'Management & Lifecycle',
            content: `
              <p>Settlements in KeSMIS follow a defined lifecycle from creation to approval, and can be decommissioned, merged, or deleted by authorised users.</p>
              <h2>Review workflow</h2>
              <p>When a new settlement is submitted, it enters a <strong>Pending</strong> state. Administrators can review it from the <strong>New</strong> tab:</p>
              <ul>
                <li><strong>Approve</strong> &mdash; moves the settlement to the Approved list, making it visible to all users and included in dashboards and reports</li>
                <li><strong>Reject</strong> &mdash; moves the settlement to the Rejected list with a rejection message explaining why. Rejected settlements can be reviewed again</li>
              </ul>
              <img src="${settlementApproveImg}" alt="Review and approve settlement" class="docs-screenshot" />

              <h2>Editing a settlement</h2>
              <p>Click the <strong>Edit</strong> action from the row dropdown (or the Edit button on the settlement details page). This opens the same map-and-drawer form used during creation, pre-filled with existing data. You can update any field, redraw the boundary, or upload a new boundary file.</p>
              <img src="${settlementEditImg}" alt="Edit settlement" class="docs-screenshot" />
              <blockquote>Note &mdash; Edit access is controlled by permissions and location. National staff can edit any settlement. County staff can only edit settlements within their assigned county.</blockquote>

              <h2>Settlement details page</h2>
              <p>Clicking a settlement name opens its details page with the following tabs:</p>
              <table><thead><tr><th>Tab</th><th>Contents</th></tr></thead><tbody>
                <tr><td><strong>Profile</strong></td><td>Administrative location, settlement profile, housing details and utilities &mdash; displayed in collapsible sections</td></tr>
                <tr><td><strong>Location</strong></td><td>Interactive map showing the settlement boundary, facilities and parcels</td></tr>
                <tr><td><strong>Documents</strong></td><td>Photos in a grid view, plus other documents grouped by type (Plans, Reports, etc.). Upload and category editing available with permissions</td></tr>
                <tr><td><strong>Projects</strong></td><td>Intervention projects linked to the settlement, with status indicators</td></tr>
                <tr><td><strong>Households</strong></td><td>Household records with search, pagination and download. Requires household read permission</td></tr>
                <tr><td><strong>Vulnerability</strong></td><td>GIS-based (Tool A) vulnerability scores and climate assessment (Tool B) hazard, exposure, sensitivity and adaptive capacity scores</td></tr>
                <tr><td><strong>Indicators</strong></td><td>Indicator category reports with dates, amounts, cumulative values and attachments</td></tr>
                <tr><td><strong>History</strong></td><td>Edit history log with timestamps. Administrators can revert specific changes</td></tr>
                <tr><td><strong>Settings</strong></td><td>Delete settlement (non-county users with delete permission only)</td></tr>
              </tbody></table>

              <h2>Decommissioning</h2>
              <p>Super administrators can decommission settlements that are no longer active (e.g. upgraded, relocated or absorbed into formal planning).</p>
              <ul>
                <li><strong>Single</strong> &mdash; select <em>Decommission</em> from the row actions dropdown. A dialog prompts for a reason</li>
                <li><strong>Batch</strong> &mdash; select multiple settlements using the checkboxes, then click the <em>Decommission (N selected)</em> button. Enter a reason and confirm</li>
              </ul>
              <p>Decommissioned settlements move to the <strong>Decommissioned</strong> tab and are excluded from active counts and dashboards.</p>
              <img src="${settlementDecommissionImg}" alt="Decommission settlement" class="docs-screenshot" />

              <h2>Merging</h2>
              <p>When two records refer to the same settlement, they can be merged:</p>
              <ul>
                <li>Select exactly <strong>two settlements</strong> using the checkboxes, then click <strong>Merge</strong></li>
                <li>Choose which record to keep as the <strong>primary</strong></li>
                <li>The secondary record is soft-deleted and linked to the primary via a "Merged Into" reference</li>
              </ul>
              <p>Duplicates detected by the system are grouped by county in the <strong>Duplicates</strong> tab, where the same merge flow is available.</p>
              <img src="${settlementMergeImg}" alt="Merge settlements" class="docs-screenshot" />

              <h2>Deleting</h2>
              <ul>
                <li><strong>Soft delete</strong> &mdash; removes the settlement from the active list but retains the record. Available via the row actions dropdown or the Settings tab on the details page</li>
                <li><strong>Cascade delete</strong> &mdash; permanently removes the settlement and all related data (households, facilities, documents, etc.). Super administrators only; available as a batch action</li>
              </ul>
              <p>Soft-deleted and merged settlements appear in the <strong>Deleted</strong> tab and can be <strong>restored</strong> using the Restore button.</p>
              <img src="${settlementDeleteImg}" alt="Delete settlement" class="docs-screenshot" />
            `
          },
          {
            id: 'data-settlements-export',
            label: 'Export & Download',
            content: `
              <p>The settlement list provides two export options, both accessible from the toolbar buttons.</p>
              <h2>Excel export</h2>
              <img src="${settlementDownloadExcelImg}" alt="Excel download button" class="docs-screenshot" />
              <ol>
                <li>Click the <strong>Download</strong> button on the toolbar</li>
                <li>A dialog opens where you can select which fields to include in the export</li>
                <li>Click <strong>Download</strong> to generate an Excel (.xlsx) file</li>
              </ol>
              <img src="${settlementDownloadFieldsImg}" alt="Select fields for Excel export" class="docs-screenshot" />
              <p>The export respects your current filters and search. If you have filtered by county or ward, only matching settlements will be included. Computed fields such as latitude and longitude (derived from geometry) are included when spatial data is available.</p>

              <h2>Geospatial export (GeoJSON)</h2>
              <img src="${settlementDownloadGeoImg}" alt="Geospatial data download" class="docs-screenshot" />
              <ol>
                <li>Click the <strong>Download Geospatial Data</strong> button (requires <code>settlement:downloadGeo</code> permission)</li>
                <li>The system packages all matching settlements (up to 10,000) into a GeoJSON file inside a ZIP archive</li>
                <li>A shareable link is created and automatically copied to your clipboard</li>
                <li>A success dialog confirms the download is ready</li>
              </ol>
              <blockquote>Tip &mdash; Apply county or ward filters before exporting to limit the data to a specific area. This reduces file size and focuses the output on the region you need.</blockquote>
            `
          },
          {
            id: 'data-settlements-households',
            label: 'Households',
            content: `
              <p>The <strong>Households</strong> sub-module records individual household-level data within a settlement. It is accessible from the settlement's details page under the <strong>Households</strong> tab, or from <strong>Data &rarr; Settlements &rarr; Households</strong> in the sidebar.</p>

              <h2>Data privacy</h2>
              <p>KeSMIS <strong>does not store personally identifiable information (PII)</strong> such as names, phone numbers or national ID numbers. Household records contain only non-identifying attributes &mdash; settlement, county, household size and similar aggregate fields &mdash; ensuring compliance with data protection requirements.</p>

              <img class="docs-screenshot" src="${householdsImg}" alt="Households listing" />
              <h2>Listing</h2>
              <p>The households listing displays a paginated table of all household records. The table columns are:</p>
              <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>#</strong></td><td>Row index number</td></tr>
                <tr><td><strong>Gender</strong></td><td>Gender of the household head</td></tr>
                <tr><td><strong>Age</strong></td><td>Age bracket of the household head</td></tr>
                <tr><td><strong>Household Size</strong></td><td>Total number of members in the household</td></tr>
                <tr><td><strong>Settlement</strong></td><td>The settlement the household belongs to</td></tr>
                <tr><td><strong>Actions</strong></td><td><strong>More Details</strong> &mdash; opens a side drawer with the full household record (personal identifiers are excluded)</td></tr>
              </tbody></table>
              <p>Page sizes of 5, 10, 20, 50 or 100 records are available.</p>

              <h2>Filtering</h2>
              <p>Use the filter controls above the table to narrow results:</p>
              <ul>
                <li><strong>County</strong> &mdash; multi-select dropdown to filter by one or more counties</li>
                <li><strong>Settlement</strong> &mdash; multi-select dropdown (cascades from the selected county)</li>
                <li><strong>Gender</strong> &mdash; filter by gender</li>
                <li><strong>Clear</strong> &mdash; resets all filters and reloads the full list</li>
              </ul>
              <p>County-level users automatically see only households within their assigned county.</p>

              <h2>Export to Excel</h2>
              <p>Click the <strong>Download</strong> button in the toolbar to export the current household list to an Excel file. A field-selection dialog lets you choose which columns to include in the export. The exported file reflects any active filters, so you can narrow the data before downloading.</p>
              <p>Since no personal information is stored, exported files are safe to share without additional redaction.</p>

              <blockquote>Tip &mdash; Apply county and settlement filters before exporting to keep the file focused on the area you need.</blockquote>
            `
          }
        ]
      },
      {
        id: 'data-climate',
        label: 'Climate Assessments',
        icon: 'mdi:earth',
        children: [
          {
            id: 'data-climate-overview',
            label: 'Assessment Overview',
            content: `
              <p>The <strong>Climate Risk &amp; Vulnerability Assessment</strong> module (also called <strong>KISIP Tool B</strong>) allows users to assess the climate-related risks and vulnerabilities of individual informal settlements using a structured questionnaire.</p>
          <img class="docs-screenshot" src="${climateOverviewImg}" alt="Climate Assessment list" />
          <h2>Assessment list</h2>
          <p>Navigate to <strong>Data &rarr; Settlements &rarr; Assessments</strong> to view all assessments. The table shows:</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>ID</strong></td><td>Unique assessment identifier</td></tr>
            <tr><td><strong>Settlement</strong></td><td>The settlement being assessed</td></tr>
            <tr><td><strong>County</strong></td><td>County the settlement belongs to</td></tr>
            <tr><td><strong>Status</strong></td><td>Draft (grey) or Completed (green)</td></tr>
            <tr><td><strong>Vulnerability</strong></td><td>Rating tag &mdash; LOW (green), MEDIUM (yellow), or HIGH (red) with the numeric score</td></tr>
            <tr><td><strong>Risk</strong></td><td>Rating tag &mdash; LOW, MEDIUM or HIGH with the numeric score</td></tr>
            <tr><td><strong>Assessed</strong></td><td>Date the assessment was last updated</td></tr>
            <tr><td><strong>Assessor</strong></td><td>Name of the user who conducted the assessment</td></tr>
            <tr><td><strong>Actions</strong></td><td>Preview (view/edit) and Delete</td></tr>
          </tbody></table>

          <h2>Filtering</h2>
          <p>A <strong>county filter</strong> (multi-select) is available for national-level users. County staff see only assessments for their assigned county.</p>

          <h2>Starting a new assessment</h2>
          <ol>
            <li>Click <strong>Start KISIP Tool B Questionnaire</strong> (requires <code>climate_assessment:create</code> permission)</li>
            <li>A dialog appears &mdash; select the <strong>County</strong> and then the <strong>Settlement</strong></li>
            <li>Click <strong>Start</strong> to open the questionnaire for that settlement</li>
          </ol>
          <img class="docs-screenshot" src="${climateStartImg}" alt="Starting a new climate assessment" />

          <h2>Export</h2>
          <p>Click the <strong>Download</strong> button to export the assessment list as an Excel file. A field selection dialog lets you choose which columns to include.</p>
          <blockquote>Tip &mdash; Actions in the list are permission-based. Preview requires <code>climate_assessment:read</code> or <code>update</code>, Delete requires <code>climate_assessment:delete</code>.</blockquote>
        `
      },
      {
        id: 'data-climate-questionnaire',
        label: 'The Questionnaire',
        content: `
          <p>Each climate assessment is a multi-tab questionnaire with four scored dimensions, an overall summary, recommendations, a map view, and a documentation section.</p>
          <img class="docs-screenshot" src="${climateInfoImg}" alt="Climate assessment questionnaire — Instructions tab" />
          <h2>Questionnaire tabs</h2>
          <table><thead><tr><th>Tab</th><th>Purpose</th></tr></thead><tbody>
            <tr><td><strong>Instructions</strong></td><td>Explains the methodology, scoring rules and how to interpret results</td></tr>
            <tr><td><strong>Hazard</strong></td><td>Questions about current climate hazards affecting the settlement</td></tr>
            <tr><td><strong>Exposure</strong></td><td>Questions about the settlement's exposure to those hazards</td></tr>
            <tr><td><strong>Sensitivity</strong></td><td>Questions about how sensitive the settlement and its population are to climate impacts</td></tr>
            <tr><td><strong>Adaptive Capacity</strong></td><td>Questions about the settlement's ability to cope with and adapt to climate change</td></tr>
            <tr><td><strong>Overall Score</strong></td><td>Summary cards showing computed scores for each dimension, plus vulnerability and risk ratings</td></tr>
            <tr><td><strong>Recommendations</strong></td><td>Auto-generated planning, design and community development recommendations based on scores</td></tr>
            <tr><td><strong>Map</strong></td><td>Settlement map showing the assessment location point (if captured in the mobile app)</td></tr>
            <tr><td><strong>Documentation</strong></td><td>Upload and list supporting documents linked to this assessment</td></tr>
          </tbody></table>

          <h2>Answering questions</h2>
          <p>Each dimension (Hazard, Exposure, Sensitivity, Adaptive Capacity) contains multiple <strong>categories</strong>, and each category has several questions. For example, the <strong>Hazard</strong> dimension includes categories like Temperature, Intense Precipitation, Droughts, Flooding, Flash Floods, Storms, Pollution, and others.</p>
          <p>Each question has a dropdown with options scored on a <strong>1&ndash;3 scale</strong>:</p>
          <ul>
            <li><strong>1 &mdash; Low</strong> &mdash; minimal severity or frequency</li>
            <li><strong>2 &mdash; Medium</strong> &mdash; moderate</li>
            <li><strong>3 &mdash; High</strong> &mdash; severe or frequent</li>
          </ul>
          <p>For <strong>Adaptive Capacity</strong>, the scoring is inverted: 3 = good capacity, 1 = poor capacity.</p>
          <p>Categories are collapsible and show a progress counter (e.g. "3/5") indicating how many questions have been answered.</p>

          <h3>Hazard tab</h3>
          <p>Captures the types and severity of climate hazards affecting the settlement &mdash; temperature extremes, precipitation, droughts, flooding, storms, pollution and more.</p>
          <img class="docs-screenshot" src="${climateHazardsImg}" alt="Climate questionnaire — Hazard tab" />

          <h3>Exposure tab</h3>
          <p>Assesses how exposed the settlement's population, livelihoods and infrastructure are to the identified hazards.</p>
          <img class="docs-screenshot" src="${climateExposureImg}" alt="Climate questionnaire — Exposure tab" />

          <h3>Sensitivity tab</h3>
          <p>Evaluates how sensitive the settlement is to climate impacts based on socio-economic conditions, infrastructure quality and population characteristics.</p>
          <img class="docs-screenshot" src="${climateSensitivityImg}" alt="Climate questionnaire — Sensitivity tab" />

          <h3>Adaptive Capacity tab</h3>
          <p>Measures the settlement's ability to cope with and adapt to climate change through institutional support, community resilience and available resources.</p>
          <img class="docs-screenshot" src="${climateAdaptiveImg}" alt="Climate questionnaire — Adaptive Capacity tab" />

          <h2>Exposure categories</h2>
          <p>The Exposure dimension covers six broad areas:</p>
          <ul>
            <li><strong>Livelihoods</strong> &mdash; food security, agriculture, livestock, commerce, water for irrigation/domestic use, access to finance, disaster events</li>
            <li><strong>Health &amp; Safety</strong> &mdash; disease, urban planning, waste management, health services</li>
            <li><strong>Assets &amp; Utilities</strong> &mdash; housing, public facilities, drainage, sanitation, power, water, roads, communication</li>
            <li><strong>Potable Water</strong> &mdash; access, scarcity and quality</li>
            <li><strong>Ecosystem-Based Services (EBS)</strong> &mdash; soil, land cover, vegetation, wetlands, biodiversity, topography</li>
            <li><strong>Institutions</strong> &mdash; early warning, awareness, planning engagement, disaster preparedness, recovery</li>
          </ul>
        `
      },
      {
        id: 'data-climate-scoring',
        label: 'Scoring & Results',
        content: `
          <p>Scores are computed automatically by the system each time you save. Click <strong>Save &amp; Compute Scores</strong> to trigger the calculation, or answers are auto-saved after a short delay.</p>
          <h2>Dimension scores</h2>
          <p>Each dimension score is the <strong>simple average</strong> of all answered questions in that dimension, producing a value between 1.00 and 3.00.</p>

          <h2>Vulnerability score</h2>
          <p>Vulnerability measures how exposed and sensitive the settlement is relative to its ability to cope:</p>
          <p><strong>Vulnerability = Average(Sensitivity) &minus; Average(Adaptive Capacity)</strong></p>
          <p>The result ranges from &minus;2 to +2. A negative score means adaptive capacity outweighs sensitivity (good). A positive score means the settlement is vulnerable.</p>
          <table><thead><tr><th>Rating</th><th>Score range</th><th>Meaning</th></tr></thead><tbody>
            <tr><td><strong>LOW</strong></td><td>&le; &minus;0.6</td><td>Adaptive capacity outweighs sensitivity</td></tr>
            <tr><td><strong>MEDIUM</strong></td><td>&minus;0.6 to +0.6</td><td>Moderate vulnerability</td></tr>
            <tr><td><strong>HIGH</strong></td><td>&ge; +0.6</td><td>Sensitivity significantly outweighs capacity</td></tr>
          </tbody></table>

          <h2>Risk score</h2>
          <p>Risk combines hazard exposure with normalised vulnerability:</p>
          <p><strong>Risk = Average(Hazard) + (Exposure &times; NormVuln) / 3</strong></p>
          <table><thead><tr><th>Rating</th><th>Score range</th><th>Meaning</th></tr></thead><tbody>
            <tr><td><strong>LOW</strong></td><td>&le; 2.17</td><td>Lower overall climate risk</td></tr>
            <tr><td><strong>MEDIUM</strong></td><td>2.17 &ndash; 3.83</td><td>Moderate risk</td></tr>
            <tr><td><strong>HIGH</strong></td><td>&ge; 3.83</td><td>High climate risk</td></tr>
          </tbody></table>

          <h2>Overall Score tab</h2>
          <p>The Overall Score tab displays four colour-coded cards (one per dimension) showing the computed score. Below the cards, large tags display the <strong>Vulnerability</strong> and <strong>Risk</strong> ratings with their numeric scores. Colours follow the traffic-light pattern: green (LOW), yellow (MEDIUM), red (HIGH).</p>
          <img class="docs-screenshot" src="${climateOverallRiskImg}" alt="Climate questionnaire — Overall Score tab" />

          <h2>Recommendations</h2>
          <p>Based on the category-level scores, the system auto-generates recommendations in three areas:</p>
          <ul>
            <li><strong>Planning</strong> &mdash; urban planning and spatial development recommendations</li>
            <li><strong>Design</strong> &mdash; infrastructure and settlement design recommendations</li>
            <li><strong>Community Development Plans</strong> &mdash; community-level resilience actions</li>
          </ul>
          <p>Each recommendation is linked to a specific category and its rating (LOW / MEDIUM / HIGH). Recommendations can be exported as <strong>PDF</strong> or <strong>Excel</strong>.</p>
          <img class="docs-screenshot" src="${climateRecommendationsImg}" alt="Climate questionnaire — Recommendations tab" />

          <h2>Draft vs Completed</h2>
          <ul>
            <li>New assessments start as <strong>Draft</strong> &mdash; you can save, edit and recompute scores as many times as needed</li>
            <li>When satisfied, click <strong>Mark Completed</strong> to finalise the assessment</li>
            <li>Completed assessments cannot be edited further</li>
            <li>Completed results feed into the settlement's vulnerability profile and the national dashboard</li>
          </ul>
          <blockquote>Tip &mdash; Use the Map tab to verify the assessment location, and the Documentation tab to upload supporting evidence such as photos, reports or field notes.</blockquote>
        `
          }
        ]
      },
      {
        id: 'data-facilities',
        label: 'Facilities',
        icon: 'mdi:map-marker-multiple-outline',
        children: [
          {
            id: 'data-facilities-overview',
            label: 'Overview',
            content: `
              <p><strong>Facilities</strong> are physical assets and points of interest mapped within or near informal settlements. They help build a spatial picture of available services, infrastructure and risk areas in each settlement.</p>
              <img class="docs-screenshot" src="${facilitiesListingImg}" alt="Facilities listing page" />
              <p>Facilities are organised into three main categories:</p>

              <h2>Social Amenities</h2>
              <table><thead><tr><th>Facility type</th><th>What is recorded</th></tr></thead><tbody>
                <tr><td><strong>Health facilities</strong></td><td>Name, level (dispensary / health centre / hospital), ownership, registration status, bed counts, staff numbers, services offered, common ailments, referral information</td></tr>
                <tr><td><strong>Education facilities</strong></td><td>School name, education category (ECD / primary / secondary / tertiary), enrolment, number of teachers</td></tr>
                <tr><td><strong>Community halls</strong></td><td>Name, location, condition</td></tr>
                <tr><td><strong>Community projects</strong></td><td>Project name, type, status</td></tr>
                <tr><td><strong>Police stations</strong></td><td>Station name, location</td></tr>
              </tbody></table>

              <h2>Infrastructure</h2>
              <table><thead><tr><th>Facility type</th><th>What is recorded</th></tr></thead><tbody>
                <tr><td><strong>Roads</strong></td><td>Road name, class, surface type, width, traffic volume, drainage condition; road assets (culverts, bridges, etc.)</td></tr>
                <tr><td><strong>Water points</strong></td><td>Name, type, capacity, price per 20 L, availability</td></tr>
                <tr><td><strong>Piped water</strong></td><td>Network name, material, diameter, condition (line geometry)</td></tr>
                <tr><td><strong>Sewer</strong></td><td>Network name, material, diameter, condition (line geometry)</td></tr>
                <tr><td><strong>Lighting</strong></td><td>Powerlines, flood-lights / highmasts, streetlights</td></tr>
                <tr><td><strong>Railway</strong></td><td>Line name, location (line geometry)</td></tr>
                <tr><td><strong>Telecom masts</strong></td><td>Mast name, operator, location</td></tr>
              </tbody></table>

              <h2>Others</h2>
              <table><thead><tr><th>Facility type</th><th>What is recorded</th></tr></thead><tbody>
                <tr><td><strong>Crime hotspots</strong></td><td>Location, description</td></tr>
                <tr><td><strong>Hazard zones</strong></td><td>Location, hazard type</td></tr>
                <tr><td><strong>Dumping sites</strong></td><td>Location, description</td></tr>
              </tbody></table>

              <h2>Listing pages</h2>
              <p>Each facility type has its own listing page accessible from the sidebar under <strong>Data &rarr; Facilities &rarr; [Category] &rarr; [Type]</strong>. All listing pages share a common layout:</p>
              <ul>
                <li><strong>Filters</strong> &mdash; County and Settlement multi-select dropdowns to narrow results. County-level users see only their assigned county's data.</li>
                <li><strong>Search</strong> &mdash; Free-text search by facility name</li>
                <li><strong>Table</strong> &mdash; Columns vary by type but always include name, location hierarchy (settlement, ward, sub-county, county), and type-specific fields</li>
                <li><strong>Pagination</strong> &mdash; Page sizes of 10, 25, 50 or 100 records</li>
                <li><strong>Actions</strong> &mdash; View on Map, Edit (via map drawer) and Delete</li>
              </ul>
              <blockquote>Note &mdash; The data you see is filtered by your role. National-level users see all counties; county staff see only their assigned county and settlements.</blockquote>
            `
          },
          {
            id: 'data-facilities-adding',
            label: 'Adding Facilities',
            content: `
              <p>Adding a new facility follows a <strong>map-first workflow</strong> &mdash; you first locate the settlement on the map, then place the facility marker (or draw a line), and finally fill in the details form.</p>

              <h2>Step 1 &mdash; Select location</h2>
              <ol>
                <li>Navigate to the facility listing page and click the <strong>Add</strong> button (requires the relevant <code>create</code> permission, e.g. <code>health_facility:create</code>)</li>
                <li>Select the <strong>County</strong> from the dropdown</li>
                <li>Select the <strong>Settlement</strong> &mdash; only settlements with a mapped boundary polygon are listed</li>
                <li>The map zooms to the settlement and displays its boundary in red</li>
              </ol>
              <img class="docs-screenshot" src="${facilitiesAdd1Img}" alt="Adding a facility — select county and settlement" />

              <h2>Step 2 &mdash; Mark on map</h2>
              <p>The method depends on the facility geometry:</p>
              <table><thead><tr><th>Geometry</th><th>Facility types</th><th>How to place</th></tr></thead><tbody>
                <tr><td><strong>Point</strong></td><td>Health, Education, Water Point, Police, Community Hall, Crime Hotspot, Dumping Site, Floodlight, Streetlight, Mast, Road Asset, Hazard Zone, Other</td><td>Click <strong>Add Marker</strong>, then click inside the settlement boundary. The marker is draggable &mdash; reposition it if needed.</td></tr>
                <tr><td><strong>Line</strong></td><td>Road, Piped Water, Sewer, Railway, Powerline, Stream</td><td>Use the polyline drawing tool to trace the feature on the map.</td></tr>
              </tbody></table>
              <p>For point facilities, the system validates that the marker falls <strong>inside the settlement boundary</strong>. If it is placed outside, you will be prompted to reposition it.</p>
              <img class="docs-screenshot" src="${facilitiesAddMarkerImg}" alt="Adding a facility — place marker on map" />

              <h2>Step 3 &mdash; Fill details</h2>
              <ol>
                <li>After placing the geometry, a <strong>details form drawer</strong> opens on the right</li>
                <li>Fill in the required fields &mdash; at minimum the <strong>name</strong> is required for all facility types</li>
                <li>Type-specific fields are displayed depending on the facility (e.g. bed counts for health, enrolment for education, road class and surface for roads)</li>
                <li>Click <strong>Save</strong> to create the facility record</li>
              </ol>
              <img class="docs-screenshot" src="${facilitiesFillFormImg}" alt="Adding a facility — fill in details form" />

              <h2>Pre-filling from a settlement</h2>
              <p>If you navigate to "Add Facility" from within a settlement's details page, the county and settlement are automatically pre-selected, saving you a step.</p>

              <blockquote>Tip &mdash; Existing facilities of the same type are shown on the map as blue markers. This helps you avoid duplicates and see spatial context.</blockquote>
            `
          },
          {
            id: 'data-facilities-managing',
            label: 'Managing Facilities',
            content: `
              <p>Once a facility has been created, you can view, edit and delete it from the listing page or the map view.</p>

              <h2>Viewing on the map</h2>
              <p>Click the <strong>View on Map</strong> action in the listing table. A map drawer opens showing:</p>
              <ul>
                <li>The <strong>settlement boundary</strong> as a red dashed polygon</li>
                <li>The <strong>selected facility</strong> at full opacity with a distinct marker</li>
                <li>Other facilities of the same type shown at reduced opacity</li>
                <li>A legend distinguishing the selected facility, other facilities and the settlement boundary</li>
              </ul>
              <img class="docs-screenshot" src="${facilitiesViewMapImg}" alt="Viewing a facility on the map" />
              <img class="docs-screenshot" src="${facilitiesViewMap2Img}" alt="Facility map — marker detail and edit drawer" />

              <h2>Editing a facility</h2>
              <ol>
                <li>Click the facility's marker on the map (or click <strong>View on Map</strong> from the table)</li>
                <li>The <strong>details form drawer</strong> opens with the current values pre-filled</li>
                <li>Modify any fields as needed</li>
                <li>Click <strong>Save</strong> to update the record</li>
              </ol>
              <p>The marker is also <strong>draggable</strong> &mdash; drag it to a new position to update the facility's coordinates.</p>

              <h2>Facility details page</h2>
              <p>Some facility types (Health, Education, Water, Roads, Piped Water, Sewer) have a dedicated <strong>details page</strong> that shows a read-only profile view with organised sections:</p>
              <ul>
                <li><strong>Profile</strong> &mdash; name, type/level, county, ownership, registration status</li>
                <li><strong>Capacity &amp; Staffing</strong> &mdash; type-specific metrics (e.g. beds, doctors, enrolment, teachers)</li>
                <li><strong>Location</strong> &mdash; county, sub-county, ward, settlement</li>
              </ul>

              <h2>Deleting a facility</h2>
              <ol>
                <li>Click the <strong>Delete</strong> action in the table row</li>
                <li>A confirmation dialog appears</li>
                <li>Confirm to permanently remove the facility and any linked documents</li>
              </ol>
              <img class="docs-screenshot" src="${facilitiesDeleteImg}" alt="Deleting a facility — confirmation dialog" />

              <h2>Permissions</h2>
              <p>Actions are permission-gated. The table below lists the key permissions by facility type:</p>
              <table><thead><tr><th>Facility type</th><th>Create</th><th>Update</th><th>Delete</th></tr></thead><tbody>
                <tr><td>Health</td><td><code>health_facility:create</code></td><td><code>health_facility:update</code></td><td><code>health_facility:delete</code></td></tr>
                <tr><td>Education</td><td><code>education_facility:create</code></td><td><code>education_facility:update</code></td><td><code>education_facility:delete</code></td></tr>
                <tr><td>Water Point</td><td><code>water_point:create</code></td><td><code>water_point:update</code></td><td><code>water_point:delete</code></td></tr>
                <tr><td>Road</td><td><code>road:create</code></td><td><code>road:update</code></td><td><code>road:delete</code></td></tr>
                <tr><td>Piped Water</td><td><code>piped_water:create</code></td><td><code>piped_water:update</code></td><td><code>piped_water:delete</code></td></tr>
                <tr><td>Sewer</td><td><code>sewer:create</code></td><td><code>sewer:update</code></td><td><code>sewer:delete</code></td></tr>
                <tr><td>Powerline</td><td><code>powerline:create</code></td><td><code>powerline:update</code></td><td><code>powerline:delete</code></td></tr>
                <tr><td>Other</td><td><code>other_facility:create</code></td><td><code>other_facility:update</code></td><td><code>other_facility:delete</code></td></tr>
              </tbody></table>
              <blockquote>Tip &mdash; If you do not see the Add button or the Delete action, your role does not have the required permission. Contact your administrator to request access.</blockquote>
            `
          }
        ]
      },
      {
        id: 'data-community',
        label: 'Community',
        icon: 'mdi:account-group-outline',
        children: [
          {
            id: 'data-community-sec',
            label: 'SEC (Settlement Executive Committee)',
        content: `
          <p>The <strong>Settlement Executive Committee (SEC)</strong> is the community leadership body elected in each informal settlement. SEC officials represent the settlement residents and play a key role in the upgrading process.</p>
          <img class="docs-screenshot" src="${secListImg}" alt="SEC officials listing" />

          <h2>Listing</h2>
          <p>Navigate to <strong>Community &rarr; SEC</strong> to view all SEC officials. Data is fetched from the ODK Central collector and presented in a grouped table. Each row represents a settlement with its committee, and you can expand it to see individual officials.</p>
          <p>The main table columns are:</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Settlement</strong></td><td>Name of the settlement</td></tr>
            <tr><td><strong>County</strong></td><td>County the settlement belongs to</td></tr>
            <tr><td><strong>Coordinator</strong></td><td>County KISIP coordinator name</td></tr>
            <tr><td><strong>NPCT Rep</strong></td><td>NPCT representative name</td></tr>
            <tr><td><strong>Date</strong></td><td>Date the SEC was formed</td></tr>
          </tbody></table>
          <p>Expand a row to see the full SEC roster with columns: Name, National ID, Gender, Phone, Category, and SEC Position.</p>

          <h2>Filtering &amp; Search</h2>
          <ul>
            <li><strong>County</strong> &mdash; dropdown to filter by county (county-level users see only their assigned county)</li>
            <li><strong>Settlement</strong> &mdash; dropdown that cascades from the selected county</li>
            <li><strong>Search</strong> &mdash; free-text search by name, national ID, phone, position or category</li>
          </ul>

          <h2>Adding SEC Officials</h2>
          <p>Click <strong>Add SEC</strong> to open a drawer form. Fill in the settlement details and add officials with their name, national ID, phone, gender, category and SEC position (e.g. Chairperson, Secretary, Treasurer, Member). You can also add officials to an existing settlement by expanding the row and clicking <strong>Add SEC Official</strong>.</p>
          <img class="docs-screenshot" src="${secAddImg}" alt="Adding SEC officials" />

          <h2>Editing</h2>
          <p>Within an expanded SEC roster, each official row has an <strong>Edit</strong> button. Editing opens a dialog to update the official's position and details.</p>

          <h2>Export</h2>
          <p>Click the <strong>Download</strong> button to export all SEC data to an Excel file. The export includes all officials across all settlements, reflecting any active filters.</p>

          <blockquote>Note &mdash; SEC data is sourced from ODK Central submissions. Adding or editing records updates the underlying ODK submission directly.</blockquote>
        `
      },
      {
        id: 'data-community-grc',
        label: 'GRC (Grievance Redress Committee)',
        content: `
          <p>The <strong>Grievance Redress Committee (GRC)</strong> is a community-level body responsible for first-level grievance resolution within each settlement. GRC members are drawn from the elected SEC and supplemented with additional community members.</p>
          <img class="docs-screenshot" src="${grcListImg}" alt="GRC officials listing" />

          <h2>Listing</h2>
          <p>Navigate to <strong>Community &rarr; GRC</strong> to view all GRC officials. The table columns are:</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Name</strong></td><td>Official's name (sortable)</td></tr>
            <tr><td><strong>Gender</strong></td><td>Gender of the official</td></tr>
            <tr><td><strong>Category</strong></td><td>Category of the official (sortable)</td></tr>
            <tr><td><strong>Position</strong></td><td>GRC position &mdash; Chairman, Secretary or Member (sortable)</td></tr>
            <tr><td><strong>Phone</strong></td><td>Mobile phone number</td></tr>
            <tr><td><strong>Date formed</strong></td><td>Date the GRC was constituted (sortable)</td></tr>
            <tr><td><strong>Location</strong></td><td>Settlement and county</td></tr>
          </tbody></table>
          <h2>Provisioning GRC Accounts</h2>
          <p>GRC secretaries need system accounts so they can log in to the <strong>Grievance Resolution Module</strong> and manage grievances assigned to their settlement. The listing table includes checkboxes to support batch account creation:</p>
          <ol>
            <li>Select one or more GRC officials using the row checkboxes &mdash; only officials who <strong>do not already have an account</strong> can be selected (existing accounts are greyed out)</li>
            <li>Click the <strong>Generate Accounts</strong> button that appears below the table</li>
            <li>The system creates a user account for each selected official using their mobile number as the username, assigns them the <strong>GRM</strong> role, and links them to their settlement</li>
          </ol>
          <p>Once provisioned, GRC secretaries can log in and access grievances filed against their settlement for first-level resolution.</p>

          <h2>Filtering &amp; Search</h2>
          <ul>
            <li><strong>County</strong> &mdash; dropdown filter (county-level users see only their assigned county)</li>
            <li><strong>Settlement</strong> &mdash; dropdown filter</li>
            <li><strong>Position</strong> &mdash; dropdown filter (Chairman, Secretary, Member)</li>
            <li><strong>Search</strong> &mdash; free-text search by name, national ID, phone, county, settlement or position</li>
          </ul>

          <h2>Adding a GRC</h2>
          <img class="docs-screenshot" src="${grcAddImg}" alt="Adding a GRC" />
          <p>Click the <strong>Add GRC</strong> button to open a creation drawer. The process involves:</p>
          <ol>
            <li>Select the <strong>County</strong> and <strong>Settlement</strong></li>
            <li>Pick exactly <strong>2 SEC members</strong> (non-chairpersons) from the settlement's SEC roster to serve as GRC members</li>
            <li>Add <strong>3 new community members</strong> with their name, national ID, phone, gender and GRC position</li>
            <li>Fill in the certification details (returning officer, county KISIP coordinator, NPCT representative)</li>
            <li>Click <strong>Submit</strong> to create the GRC record</li>
          </ol>

          <h2>Export</h2>
          <p>The <strong>Download</strong> component in the toolbar exports the current GRC data to a file. You can export either the current page or all records.</p>

          <blockquote>Note &mdash; GRC data is sourced from ODK Central submissions. County-level users automatically see only GRC officials for their assigned county.</blockquote>
        `
          }
        ]
      }
      ,
      {
        id: 'data-projects',
        label: 'Projects',
        icon: 'mdi:briefcase-outline',
        children: [
          {
            id: 'data-projects-overview',
            label: 'Overview',
            content: `
              <p>The <strong>Projects</strong> module is where all intervention projects are registered, tracked and managed across every programme component. Projects are the primary unit of work in KeSMIS — each one ties a physical intervention to a programme, a set of settlement locations, a contractor, a budget and a timeline.</p>

              <h2>Key capabilities</h2>
              <ul>
                <li><strong>Project listing</strong> &mdash; browse and search all projects filtered by the active programme component</li>
                <li><strong>Add / Edit</strong> &mdash; register new projects using a multi-step form covering identification, location, financials, contractor and schedule</li>
                <li><strong>Locations</strong> &mdash; attach one or more settlement locations to a project; each location is spatially linked and can have its own geometry</li>
                <li><strong>Activities</strong> &mdash; associate planned activities to projects from a pre-defined activity catalogue</li>
                <li><strong>Settlement map</strong> &mdash; click any location in the listing to open a side drawer with the settlement's spatial layers</li>
                <li><strong>Download</strong> &mdash; export the full project dataset including contractor details, admin hierarchy and coordinates to Excel</li>
              </ul>

              <h2>Access context</h2>
              <p>Projects are always accessed <strong>within a programme component</strong>. Navigate to a programme via the sidebar (e.g. <em>Subprogrammes → KISIP2 → Institutional Capacity → CapacityX</em>) to reach the projects listing for that component. The page title and filters automatically reflect the active component.</p>
              <p>Role-based visibility rules apply: county staff see only projects located in their assigned county; settlement staff see only projects in their assigned settlement; national staff and admins see all projects.</p>
            `
          },
          {
            id: 'data-projects-listing',
            label: 'Listing, Search & Filters',
            content: `
              <p>The projects listing is a paginated table showing all projects belonging to the current programme component.</p>

              <img class="docs-screenshot" src="${projectsListingImg}" alt="Projects listing" />

              <h2>Table columns</h2>
              <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>#</strong></td><td>Row index</td></tr>
                <tr><td><strong>Project Title</strong></td><td>Project name. Hover to see a tooltip with status, start date and end date.</td></tr>
                <tr><td><strong>Programme</strong></td><td>Acronym of the parent programme (e.g. KISIP2)</td></tr>
                <tr><td><strong>Implementation</strong></td><td>The implementation phase or stream the project belongs to</td></tr>
                <tr><td><strong>Locations</strong></td><td>Comma-separated list of settlement names. Click a settlement name to open a map drawer for that settlement.</td></tr>
                <tr><td><strong>Action</strong></td><td><strong>More</strong> button — navigates to the full project details page</td></tr>
              </tbody></table>

              <h2>Search &amp; filters</h2>
              <ul>
                <li><strong>Search by Title</strong> &mdash; remote search field; type to filter projects by name</li>
                <li><strong>By Programme</strong> &mdash; multi-select dropdown to filter by implementation stream</li>
                <li><strong>Clear</strong> &mdash; resets all filters while preserving any role-based location restrictions</li>
              </ul>

              <h2>Actions toolbar</h2>
              <ul>
                <li><strong>Back</strong> &mdash; returns to the previous page</li>
                <li><strong>Add Project</strong> (+ icon) &mdash; opens the project creation form (requires <code>project:create</code> permission)</li>
                <li><strong>Download</strong> (green icon) &mdash; exports all current projects to Excel including contractor details, admin hierarchy (county → sub-county → ward → settlement) and centroid coordinates</li>
              </ul>

              <h2>Pagination</h2>
              <p>Supports page sizes of 3, 5, 10, 20, 50 or 100 rows. On mobile, the default page size reduces to 3 rows.</p>
            `
          },
          {
            id: 'data-projects-add',
            label: 'Adding & Editing a Project',
            content: `
              <img class="docs-screenshot" src="${projectsAddFormImg}" alt="Add / Edit project form" />
              <p>Projects are created and edited using a <strong>multi-step wizard</strong>. Click the <strong>+</strong> button in the listing toolbar to open the form. To edit an existing project, click <strong>More</strong> on its row and use the edit option on the details page.</p>

              <h2>Step-by-step walkthrough</h2>
              <p>The wizard guides you through several steps — use the <strong>Next</strong> / <strong>Previous</strong> buttons to navigate, or click a step indicator directly to jump to it. The final step shows a <strong>Submit</strong> button.</p>

              <h2>Step 1 — Project Identification</h2>
              <table><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr></thead><tbody>
                <tr><td><strong>Title</strong></td><td>Text</td><td>Yes</td><td>Full project name</td></tr>
                <tr><td><strong>Programme</strong></td><td>Dropdown</td><td>Yes</td><td>Select the parent programme</td></tr>
                <tr><td><strong>Component</strong></td><td>Tree select</td><td>Yes</td><td>Select the programme component; pre-filled when opening from a component page</td></tr>
                <tr><td><strong>Implementation</strong></td><td>Dropdown</td><td>No</td><td>Implementation phase or stream</td></tr>
                <tr><td><strong>Description</strong></td><td>Textarea</td><td>No</td><td>Narrative description of the project</td></tr>
              </tbody></table>

              <h2>Step 2 — Location</h2>
              <table><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr></thead><tbody>
                <tr><td><strong>County</strong></td><td>Dropdown</td><td>Yes</td><td>Administrative county</td></tr>
                <tr><td><strong>Sub-county</strong></td><td>Dropdown</td><td>Yes</td><td>Filtered by selected county</td></tr>
                <tr><td><strong>Ward</strong></td><td>Dropdown</td><td>Yes</td><td>Filtered by selected sub-county</td></tr>
                <tr><td><strong>Settlement</strong></td><td>Dropdown</td><td>No</td><td>Filtered by selected ward; links the project to a specific settlement</td></tr>
              </tbody></table>
              <blockquote>Additional locations can be added after the project is saved using the <strong>Add Location</strong> dialog on the project details page. Each location can have its own geometry (polygon or point) uploaded as GeoJSON or a zipped shapefile.</blockquote>

              <h2>Step 3 — Financial &amp; Schedule</h2>
              <table><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr></thead><tbody>
                <tr><td><strong>Cost</strong></td><td>Money (KSh.)</td><td>No</td><td>Formatted with comma separators</td></tr>
                <tr><td><strong>Start Date</strong></td><td>Date picker</td><td>No</td><td>Planned project start</td></tr>
                <tr><td><strong>End Date</strong></td><td>Date picker</td><td>No</td><td>Planned project completion</td></tr>
                <tr><td><strong>Status</strong></td><td>Dropdown</td><td>No</td><td>e.g. Planned, Ongoing, Completed</td></tr>
              </tbody></table>

              <h2>Step 4 — Contractor</h2>
              <table><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr></thead><tbody>
                <tr><td><strong>Contractor Name</strong></td><td>Text</td><td>No</td><td>Name of the implementing contractor</td></tr>
                <tr><td><strong>Contractor Phone</strong></td><td>Text</td><td>No</td><td>Contact number</td></tr>
                <tr><td><strong>Contractor Address</strong></td><td>Text</td><td>No</td><td>Physical or postal address</td></tr>
              </tbody></table>

              <h2>Step 5 — Beneficiaries</h2>
              <table><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr></thead><tbody>
                <tr><td><strong>Male Beneficiaries</strong></td><td>Number</td><td>No</td><td>Count of male direct beneficiaries</td></tr>
                <tr><td><strong>Female Beneficiaries</strong></td><td>Number</td><td>No</td><td>Count of female direct beneficiaries</td></tr>
              </tbody></table>

              <blockquote>Tip &mdash; Use the <strong>Help</strong> button (info icon) on any step to launch the guided tour for that step.</blockquote>
            `
          },
          {
            id: 'data-projects-details',
            label: 'Project Details & Tabs',
            content: `
              <p>Click <strong>More</strong> on any project row to open the <strong>Project Details</strong> page. The page is organised into tabs — each tab focuses on a different aspect of the project lifecycle.</p>

              <img class="docs-screenshot" src="${projectsDetailsInfoImg}" alt="Project details — Project Details tab" />

              <h2>Tab 1 — Project Details</h2>
              <p>Displays a structured description card with all core project fields: title, programme, component, implementation, status, cost, start date, end date and description.</p>
              <ul>
                <li><strong>Edit Project</strong> — opens the multi-step form to update any field</li>
                <li><strong>Delete Project</strong> — permanently removes the project (visible only to users with <code>project:delete</code> permission, national staff or super admins)</li>
              </ul>

              <h2>Tab 2 — Locations</h2>
              <img class="docs-screenshot" src="${projectsDetailsLocationImg}" alt="Project details — Locations tab" />
              <p>Lists all settlement locations linked to the project. Each row shows County, Sub-county, Ward and Settlement.</p>
              <ul>
                <li><strong>Add Location</strong> — remote-search settlements by name; each option shows the settlement alongside ward, sub-county and county. Select one or more and save.</li>
                <li><strong>Edit Location</strong> — opens a map dialog to draw or upload a custom boundary (GeoJSON or zipped shapefile) for that specific location. Click Preview before saving.</li>
                <li><strong>Delete</strong> — removes the location link (permission-controlled)</li>
              </ul>
              <blockquote>The Locations tab is hidden for projects with a <em>national</em> implementation scope.</blockquote>

              <h2>Tab 3 — Map</h2>
              <img class="docs-screenshot" src="${projectsDetailsMapImg}" alt="Project details — Map tab" />
              <p>Renders all project location geometries on an interactive Mapbox map with Satellite and Streets base layers. Only visible when the project has at least one location with geometry and the scope is not national.</p>

              <h2>Tab 4 — Scope</h2>
              <img class="docs-screenshot" src="${projectsDetailsScopeImg}" alt="Project details — Scope tab" />
              <p>A checklist of all activities from the activity catalogue. Check or uncheck activities to define which fall within this project's scope, then click <strong>Save Changes</strong> to persist the selection. The scope feeds into M&amp;E reporting — only activities checked here will be available as monitoring indicators for the project.</p>

              <h2>Tab 5 — Monitoring</h2>
              <img class="docs-screenshot" src="${projectsDetailsReportsImg}" alt="Project details — Monitoring tab" />
              <p>Tracks indicator-level progress reports against the project's defined scope. Only visible when the project has at least one location. Each report is tied to an indicator from the M&amp;E framework established in the Scope tab.</p>
              <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Indicator</strong></td><td>Indicator name and category from the monitoring framework</td></tr>
                <tr><td><strong>Date</strong></td><td>Reporting date</td></tr>
                <tr><td><strong>Qty / Status</strong></td><td>Numeric quantity or Yes/No qualitative status depending on the indicator type</td></tr>
                <tr><td><strong>Amount (cumulative)</strong></td><td>Running total across all reports for this indicator</td></tr>
                <tr><td><strong>Status</strong></td><td>Approval status — hover a <em>Rejected</em> entry to see the rejection reason</td></tr>
              </tbody></table>
              <img class="docs-screenshot" src="${meReportsAddImg}" alt="Add monitoring report" />
              <img class="docs-screenshot" src="${projectsDetailsReportsAdd2Img}" alt="Add monitoring report — step 2" />
              <p>Click <strong>Add Report / Achievement</strong> to log a new monitoring entry against a specific indicator.</p>

              <h2>Tab 6 — Documentation</h2>
              <p>Lists all documents attached to the project — Name, Type, Upload date and Size (MB).</p>
              <ul>
                <li><strong>Download</strong> — fetches the file to your device</li>
                <li><strong>Remove</strong> — deletes the document (permission-controlled)</li>
                <li><strong>Upload</strong> button at the bottom — attaches new files to the project</li>
              </ul>

              <h2>Tab 7 — Team</h2>
              <p>Lists project team members with Name, Phone, Email and Role. Click <strong>Add Team</strong> to register a new member. Remove via the <strong>Remove</strong> button (permission-controlled).</p>

              <h2>Tab 8 — Clock-In/Out</h2>
              <p>Records field attendance for team members at project sites. Each entry captures:</p>
              <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Name / Role</strong></td><td>Team member identity and site role</td></tr>
                <tr><td><strong>Site</strong></td><td>Project location where the team member clocked in</td></tr>
                <tr><td><strong>Map</strong></td><td>Opens a mini-map pinpointing the GPS coordinates of the clock-in event</td></tr>
                <tr><td><strong>Clock In / Out Time</strong></td><td>Timestamps of arrival and departure</td></tr>
                <tr><td><strong>Status</strong></td><td>Active (currently on site) or Completed</td></tr>
                <tr><td><strong>Hours Worked</strong></td><td>Calculated duration between clock-in and clock-out</td></tr>
                <tr><td><strong>Notes</strong></td><td>Notes recorded at clock-out</td></tr>
              </tbody></table>
              <p>Filter records by <strong>date range</strong> or <strong>month</strong> and export the full attendance log to Excel via the Download button.</p>

              <h2>Tab 9 — Contractor</h2>
              <p>Lists contractors assigned to the project — Name, Role and Phone. Click <strong>Add Contractor(s)</strong> to link a contractor. Remove via the delete button (permission-controlled).</p>
            `
          },
          {
            id: 'data-projects-download',
            label: 'Downloading Project Data',
            content: `
              <p>Click the green <strong>Download</strong> button in the listing toolbar to export all currently visible projects to an <strong>Excel (.xlsx)</strong> file.</p>

              <h2>Export columns</h2>
              <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Index</strong></td><td>Sequential row number</td></tr>
                <tr><td><strong>Title</strong></td><td>Project name</td></tr>
                <tr><td><strong>Contractor Name / Phone / Address</strong></td><td>Contractor contact details</td></tr>
                <tr><td><strong>Status</strong></td><td>Current project status</td></tr>
                <tr><td><strong>Cost</strong></td><td>Project budget in KSh.</td></tr>
                <tr><td><strong>Start Date / End Date</strong></td><td>Formatted as YYYY-MM-DD</td></tr>
                <tr><td><strong>County / Subcounty / Ward / Settlement</strong></td><td>Full admin hierarchy for each project location</td></tr>
                <tr><td><strong>Latitude / Longitude</strong></td><td>Centroid of the location geometry (6 decimal places)</td></tr>
                <tr><td><strong>Programme / Component</strong></td><td>Parent programme acronym and component title</td></tr>
                <tr><td><strong>Male / Female Beneficiaries</strong></td><td>Beneficiary counts</td></tr>
              </tbody></table>

              <blockquote>Projects with multiple locations are expanded into multiple rows — one row per location — so that every spatial record is represented in the export.</blockquote>

              <h2>File naming</h2>
              <p>The file is named <code>Projects_[componentId]_[YYYY-MM-DD].xlsx</code> and downloaded directly to your browser's default download folder.</p>
            `
          }
        ]
      },
      {
        id: 'data-surveys',
        label: 'Surveys',
        icon: 'mdi:clipboard-text-outline',
        children: [
          {
            id: 'data-surveys-listing',
            label: 'Survey Projects',
            content: `
          <p>The <strong>Surveys</strong> module integrates with <a href="https://collector.kesmis.go.ke/#/" target="_blank"><strong>ODK Central</strong></a> (the field data collector) to display and manage survey submissions collected via mobile devices.</p>

          <img class="docs-screenshot" src="${surveyListingImg}" alt="Survey Projects listing" />

          <h2>Dashboard summary</h2>
          <p>At the top of the page, five summary cards show real-time statistics pulled from the collector:</p>
          <table><thead><tr><th>Card</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Data Collection Projects</strong></td><td>Total number of ODK projects</td></tr>
            <tr><td><strong>Data Collection Forms</strong></td><td>Total number of survey forms across all projects</td></tr>
            <tr><td><strong>Total Submissions</strong></td><td>Combined submission count from all forms</td></tr>
            <tr><td><strong>Latest Submission</strong></td><td>Relative time since the most recent submission (e.g. "3 days ago")</td></tr>
            <tr><td><strong>Total Enumerators</strong></td><td>Number of field enumerators with a download button to export the enumerator list as CSV</td></tr>
          </tbody></table>

          <h2>Project listing</h2>
          <p>Below the summary, a table lists all data collection projects. Each row represents a project and can be <strong>expanded</strong> to reveal its individual forms.</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>#</strong></td><td>Row index</td></tr>
            <tr><td><strong>Category</strong></td><td>Project category / description (sortable)</td></tr>
            <tr><td><strong>Name</strong></td><td>Project name (sortable)</td></tr>
            <tr><td><strong>#Forms</strong></td><td>Number of forms in the project (sortable)</td></tr>
            <tr><td><strong>Latest Submission</strong></td><td>Time since the project's most recent submission (sortable)</td></tr>
          </tbody></table>

          <h2>Filtering &amp; Search</h2>
          <ul>
            <li><strong>Category</strong> &mdash; multi-select dropdown to filter projects by category</li>
            <li><strong>Search</strong> &mdash; free-text search by project name</li>
          </ul>
          <p>Pagination supports page sizes of 5, 10, 15, 20, 50 or 100.</p>
        `
      },
      {
        id: 'data-surveys-details',
        label: 'Form Details',
        content: `
          <p>Expand a project row to see its forms, then <strong>double-click</strong> a form to open the <strong>Form Details</strong> page. This page has three tabs: <strong>Data</strong>, <strong>Map</strong> and <strong>Charts</strong>.</p>

          <h2>Data tab</h2>
          <img class="docs-screenshot" src="${formDetail1Img}" alt="Form Details — Data tab" />
          <p>The Data tab presents all submissions for the selected form in a scrollable virtual table.</p>
          <ul>
            <li><strong>Column selector</strong> &mdash; multi-select dropdown to choose which fields (properties) to display as columns. By default, the first 7 fields are shown.</li>
            <li><strong>Filter By</strong> &mdash; select any visible field, then pick specific values to filter the table</li>
            <li><strong>Pagination</strong> &mdash; page sizes of 5, 10, 15, 20, 50, 100 or 500 records</li>
            <li><strong>Attachments column</strong> &mdash; displays the number of attachments (photos, files) associated with each submission</li>
          </ul>

          <h2>Map tab</h2>
          <img class="docs-screenshot" src="${formDetail2MapImg}" alt="Form Details — Map tab" />
          <p>The Map tab renders all submissions with valid geometry (Point, LineString or Polygon) on a Google Map. Features include:</p>
          <ul>
            <li>Points as markers (clustered for large datasets), lines as polylines, polygons with red dashed outlines and vertex dots</li>
            <li>Click any feature to open an <strong>InfoWindow</strong> popup showing all properties and attachment download links</li>
            <li><strong>Locate Me</strong> button to centre the map on your current GPS position</li>
          </ul>

          <h2>Charts tab</h2>
          <img class="docs-screenshot" src="${formDetail3ChartImg}" alt="Form Details — Charts tab" />
          <p>The Charts tab lets you build quick visualisations from the survey data:</p>
          <ol>
            <li>Select one or more <strong>fields</strong> to analyse</li>
            <li>Choose a <strong>chart type</strong> &mdash; Pie, Bar, Multiple Variable Bar, or Stacked Bar</li>
            <li>Choose a <strong>computation method</strong> &mdash; Count or Proportion (%)</li>
          </ol>
          <p>Charts are rendered automatically and can be saved as images via the chart toolbar.</p>
        `
      },
      {
        id: 'data-surveys-download',
        label: 'Downloading Data & Attachments',
        content: `
          <p>The Surveys module provides multiple ways to download data and attachments. All download actions require the <code>survey:export</code> permission.</p>

          <img class="docs-screenshot" src="${formDetail4DownloadImg}" alt="Downloading data and attachments" />

          <h2>Downloading survey data</h2>
          <p>From the <strong>project listing</strong>, expand a project to see its forms. Each form row has two download buttons:</p>
          <table><thead><tr><th>Button</th><th>Format</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>CSV</strong></td><td>Comma-separated values</td><td>Downloads all submissions for the form as a CSV file</td></tr>
            <tr><td><strong>GeoJSON</strong></td><td>GeoJSON FeatureCollection</td><td>Downloads all submissions with geometry as a GeoJSON file (for use in GIS software)</td></tr>
          </tbody></table>

          <p>From the <strong>Form Details</strong> page (Data tab), an additional <strong>Download</strong> component lets you export the current table view with field selection.</p>

          <h2>Downloading enumerators</h2>
          <p>Click the download button on the <strong>Total Enumerators</strong> summary card to export a CSV listing all enumerators and their assigned projects.</p>

          <h2>Downloading attachments</h2>
          <p>Attachments are photos, documents or other files uploaded by field enumerators alongside their submissions.</p>
          <ul>
            <li><strong>Bulk download</strong> &mdash; click the <strong>Download attachments</strong> button in the Data tab toolbar to download a ZIP file containing attachments for all submissions on the current page</li>
            <li><strong>From the map</strong> &mdash; click a feature, then use the download buttons in the InfoWindow popup</li>
          </ul>
          <blockquote>Note &mdash; Bulk attachment downloads are limited to <strong>100 files at a time</strong>. If the current page exceeds this limit, the system will display a warning. Reduce the page size or apply filters to stay within the limit.</blockquote>
        `
          }
        ]
      }
    ],
    children: [
      {
        id: 'data-import',
        label: 'Import GIS Data',
        content: `
          <p>The <strong>Import GIS Data</strong> module allows administrators and authorised users to bulk-import geospatial datasets directly into KeSMIS. It uses a guided <strong>four-step wizard</strong> to upload a file, select the destination table, map source fields to database columns, and review before committing the import.</p>

          <img class="docs-screenshot" src="${importGis1Img}" alt="Import GIS Data — Upload step" />

          <h2>Supported file formats</h2>
          <table><thead><tr><th>Format</th><th>Extension</th><th>Notes</th></tr></thead><tbody>
            <tr><td>GeoJSON</td><td><code>.json</code>, <code>.geojson</code></td><td>Must be a valid FeatureCollection. CRS is assumed WGS 84 (EPSG:4326).</td></tr>
            <tr><td>Shapefile (zipped)</td><td><code>.zip</code></td><td>ZIP must contain <code>.shp</code>, <code>.shx</code>, <code>.dbf</code> and optionally <code>.prj</code>.</td></tr>
            <tr><td>KML</td><td><code>.kml</code></td><td>Google Earth markup format.</td></tr>
            <tr><td>KMZ</td><td><code>.kmz</code></td><td>Compressed KML archive.</td></tr>
          </tbody></table>
          <blockquote>All uploaded files are automatically validated. If the file contains no valid features or is malformed, an error is shown and the wizard does not advance.</blockquote>

          <h2>Step 1 — Upload File</h2>
          <p>Click <strong>Upload File</strong> and select a file (or drag-and-drop). Once parsed, a confirmation shows the number of features found and the wizard advances to Step 2.</p>

          <h2>Step 2 — Select Destination Table</h2>
          <img class="docs-screenshot" src="${importGis2DestImg}" alt="Import GIS Data — Select destination table" />
          <p>Choose which KeSMIS entity to store the imported features as:</p>
          <table><thead><tr><th>Category</th><th>Tables</th></tr></thead><tbody>
            <tr><td><strong>Core</strong></td><td>Projects, Settlements, Parcels, Structures</td></tr>
            <tr><td><strong>Infrastructure</strong></td><td>Roads, Road Assets, Sewer, Piped Water, Railway, Powerline, Streetlight, Floodlights</td></tr>
            <tr><td><strong>Social Amenities</strong></td><td>Health Facility, School, Water Point, Police Station, Community Hall, Community Project</td></tr>
            <tr><td><strong>Environment</strong></td><td>Hazard Zones, Crime Hotspots, Dumping, Telcom Mast</td></tr>
          </tbody></table>
          <p>If the source data contains a <code>pcode</code> property, the importer automatically resolves parent entities (county, sub-county, ward or settlement) so imported features are correctly linked to the admin hierarchy.</p>

          <h2>Step 3 — Match Fields</h2>
          <img class="docs-screenshot" src="${importGis2MatchImg}" alt="Import GIS Data — Match fields" />
          <p>A two-column mapping table lists every source property alongside a dropdown of available database columns. <strong>Fuzzy matching</strong> pre-fills likely mappings automatically.</p>
          <ul>
            <li>Each database column can only be mapped once — already-mapped columns are greyed out</li>
            <li>Use <strong>Search fields</strong> to filter the list when working with many properties</li>
            <li>Unmapped source fields are excluded from the import</li>
          </ul>

          <h2>Step 4 — Review &amp; Import</h2>
          <img class="docs-screenshot" src="${importGis2ReviewImg}" alt="Import GIS Data — Review and import" />
          <p>A JSON preview shows 1, 5 or 10 sample records to verify mappings before committing.</p>
          <ul>
            <li><strong>Import</strong> — submits all features to the database</li>
            <li><strong>Back</strong> — returns to field-matching to adjust mappings</li>
            <li><strong>Reset</strong> — discards everything and restarts from Step 1</li>
          </ul>
          <p>A success notification shows the number of imported features. Failed features are listed with reasons; successfully validated features are still imported.</p>
          <blockquote>Geometry coordinates with a Z (altitude) component are automatically stripped to 2D before storage.</blockquote>
        `
      }
    ]
  },
  {
    id: 'mne',
    label: 'M&E',
    icon: 'mdi:chart-bar',
    roles: ['root_admin', 'super_admin', 'admin', 'staff', 'monitoring', 'grm', 'consultant', 'national_monitoring', 'county_admin'],
    children: [
      {
        id: 'mne-overview',
        label: 'Overview',
        content: `
          <p>The <strong>Monitoring &amp; Evaluation (M&amp;E)</strong> module tracks programme performance across KISIP using structured indicators, activities, and evaluation reports. It is accessible from the sidebar under <strong>M&amp;E</strong> and is available to users with <code>root_admin</code>, <code>super_admin</code>, <code>admin</code>, <code>monitoring</code>, or <code>staff</code> roles.</p>

          <h2>Module structure</h2>
          <p>The M&amp;E module is organised into four main areas:</p>
          <table><thead><tr><th>Section</th><th>Purpose</th></tr></thead><tbody>
            <tr><td><strong>Activities</strong></td><td>Define programme-level activities that indicators are tracked against</td></tr>
            <tr><td><strong>Framework</strong></td><td>Configure the indicator hierarchy &mdash; indicators, configurations (dimensions), and categories</td></tr>
            <tr><td><strong>Monitoring</strong></td><td>Submit and review indicator reports, track progress, and manage supporting documents</td></tr>
            <tr><td><strong>Beneficiaries</strong></td><td>Track individuals and communities benefiting from programme interventions</td></tr>
          </tbody></table>

          <h2>How it works</h2>
          <ol>
            <li><strong>Define Activities</strong> &mdash; create the programme activities that form the top level of the results framework</li>
            <li><strong>Create Indicators</strong> &mdash; define measurable indicators and link each to an activity</li>
            <li><strong>Configure Dimensions</strong> &mdash; for each indicator, set up one or more configurations (dimensions) specifying the target, baseline, reporting frequency, and linked settlement or project</li>
            <li><strong>Submit Reports</strong> &mdash; periodically report actual values against configured indicators, attach supporting documents, and track progress toward targets</li>
            <li><strong>Evaluate</strong> &mdash; create formal evaluations (mid-term, end-term) that compile indicator data into structured assessment reports</li>
          </ol>
          <p>All M&amp;E data can be exported to Excel. Reports filed at the settlement level also appear on the settlement's <strong>Indicators tab</strong> in the Settlement Details page.</p>
        `
      },
      {
        id: 'mne-activities',
        label: 'Activities',
        content: `
          <p>Activities represent programme-level work streams (e.g. "Settlement Profiling", "Tenure Regularisation", "Infrastructure Development"). They form the top tier of the M&amp;E results framework and serve as the parent grouping for indicators.</p>

          <h2>Activity listing</h2>
          <img class="docs-screenshot" src="${meActivitiesListingImg}" alt="M&E Activities listing" />
          <p>Navigate to <strong>M&amp;E &rarr; Activities</strong> to view the activity table. The listing displays:</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Id</strong></td><td>Auto-generated record identifier</td></tr>
            <tr><td><strong>Short Title</strong></td><td>Abbreviated name used on SlumMapper mobile for brevity when reporting in the field</td></tr>
            <tr><td><strong>Title</strong></td><td>Full descriptive name of the activity</td></tr>
            <tr><td><strong>Code</strong></td><td>System-generated unique code</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit and Delete (permission-gated)</td></tr>
          </tbody></table>
          <p>All columns are sortable. The table is paginated with page sizes of 5, 10, 20, 50, 200 or all records.</p>

          <h2>Searching &amp; filtering</h2>
          <p>Use the <strong>Search Activity</strong> multi-select dropdown to filter by one or more activities. Click the <strong>filter</strong> button to clear all filters and reset the view.</p>

          <h2>Adding an activity</h2>
          <img class="docs-screenshot" src="${meActivitiesAddImg}" alt="M&E Add Activity dialog" />
          <p>Click the <strong>+</strong> button to open the Add Activity dialog. Fill in:</p>
          <ul>
            <li><strong>Title</strong> &mdash; full name of the activity (required, minimum 3 characters)</li>
            <li><strong>Short Title</strong> &mdash; abbreviated name used on SlumMapper mobile for brevity when reporting in the field</li>
          </ul>
          <p>A unique code is auto-generated on submission. The new activity appears immediately in the listing.</p>

          <h2>Editing &amp; deleting</h2>
          <img class="docs-screenshot" src="${meActivitiesEditDeleteImg}" alt="M&E Activity edit and delete actions" />
          <ul>
            <li><strong>Edit</strong> &mdash; click the Edit action to open the dialog pre-filled with the current values. Modify and click <strong>Save</strong>. Requires <code>activity:update</code> permission.</li>
            <li><strong>Delete</strong> &mdash; click the Delete action and confirm in the popup. Requires <code>activity:delete</code> permission.</li>
          </ul>

          <h2>Export</h2>
          <p>Click the <strong>Download</strong> button to export the activity list as an Excel file containing Id, Title, and Code columns.</p>
        `
      },
      {
        id: 'mne-framework',
        label: 'Framework & Indicators',
        content: `
          <p>The <strong>Framework</strong> section under M&amp;E contains the building blocks that define what is measured and how. It is organised into sub-pages accessible from the sidebar: <strong>Indicators</strong>, <strong>Configuration</strong>, and <strong>Category</strong>.</p>

          <h2>Indicators</h2>
          <p>Navigate to <strong>M&amp;E &rarr; Framework &rarr; Indicators</strong> to manage the master list of measurable metrics. Each indicator defines <em>what</em> is being tracked.</p>
          <img class="docs-screenshot" src="${meIndicatorListingImg}" alt="M&E Indicators listing" />

          <h3>Listing</h3>
          <p>The indicator table displays:</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Id</strong></td><td>Auto-generated record identifier</td></tr>
            <tr><td><strong>Title</strong></td><td>Name of the indicator (e.g. "Settlements", "Households", "Roads"). The verb or dimension (e.g. "profiled", "mapped") is added later in Configuration.</td></tr>
            <tr><td><strong>Activity</strong></td><td>The parent activity this indicator belongs to</td></tr>
            <tr><td><strong>Type</strong></td><td>Output or Impact</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit and Delete (permission-gated)</td></tr>
          </tbody></table>
          <p>All columns are sortable. Use the <strong>search bar</strong> to find indicators by name or the <strong>activity filter</strong> to show indicators for a specific activity. Click the filter button to clear all active filters.</p>

          <h3>Adding an indicator</h3>
          <img class="docs-screenshot" src="${meIndicatorAdd1Img}" alt="M&E Add Indicator — form step 1" />
          <p>Click the <strong>+</strong> button to open the Add Indicator dialog. Fill in the following fields:</p>
          <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Level</strong></td><td>Select <em>Activity</em> or <em>Project</em>. This determines whether the indicator is tracked at the activity or project level.</td></tr>
            <tr><td><strong>Activity</strong></td><td>Appears when Level is "Activity". Select the parent activity from the dropdown. You can also create a new activity inline using the <strong>+</strong> button next to the dropdown.</td></tr>
            <tr><td><strong>Title</strong></td><td>The base name of the indicator without the verb/dimension (e.g. "Settlements", "Households", "Roads"). The specific dimension (e.g. "profiled", "mapped", "constructed") is defined separately in Configuration. Required field.</td></tr>
            <tr><td><strong>Type</strong></td><td>Select <em>Output</em> (direct deliverable) or <em>Impact</em> (outcome / longer-term effect)</td></tr>
            <tr><td><strong>Measurement</strong></td><td>How the indicator is quantified: <em>Number</em>, <em>Percent</em>, or <em>Yes/No (true/false)</em></td></tr>
            <tr><td><strong>Unit</strong></td><td>The unit of measurement: Kilometre (Km), Number (No.), Yes/No, Household (HH), or type a custom unit</td></tr>
          </tbody></table>
          <img class="docs-screenshot" src="${meIndicatorAdd2Img}" alt="M&E Add Indicator — form step 2" />
          <p>A unique code (UUID) is auto-generated on submission. The new indicator appears immediately in the listing. A built-in <strong>Help</strong> tour is available to guide you through the form fields.</p>

          <h3>Editing &amp; deleting indicators</h3>
          <ul>
            <li><strong>Edit</strong> &mdash; click the Edit action to reopen the form pre-filled with current values. Modify and click <strong>Save</strong>. Requires <code>indicator:update</code> permission.</li>
            <li><strong>Delete</strong> &mdash; click the Delete action and confirm. Requires <code>indicator:delete</code> permission.</li>
          </ul>

          <h3>Export</h3>
          <p>Click the <strong>Download</strong> button to export the indicator list as an Excel file. A <strong>Download All</strong> option is also available to export the full dataset including associated records.</p>

          <hr/>

          <h2>Configuration (Dimensions)</h2>
          <p>Navigate to <strong>M&amp;E &rarr; Framework &rarr; Configuration</strong> to set up indicator configurations. A configuration links an indicator to a specific context &mdash; defining <em>where</em>, <em>when</em>, and <em>how much</em>.</p>

          <h3>Listing</h3>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Id</strong></td><td>Record identifier</td></tr>
            <tr><td><strong>Activity</strong></td><td>Parent activity</td></tr>
            <tr><td><strong>Indicator</strong></td><td>The indicator being configured</td></tr>
            <tr><td><strong>Dimension</strong></td><td>Category title / dimension label for this configuration</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit and Delete</td></tr>
          </tbody></table>
          <img class="docs-screenshot" src="${meIndicatorConfigImg}" alt="M&E Indicator Configuration listing" />

          <h3>Creating a configuration</h3>
          <p>Click <strong>+</strong> to open the dialog. The form fields are:</p>
          <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Activity</strong></td><td>Select the parent activity</td></tr>
            <tr><td><strong>Indicator</strong></td><td>Select the indicator (list filters based on the chosen activity)</td></tr>
            <tr><td><strong>Category / Dimension</strong></td><td>Select or create the reporting dimension</td></tr>
            <tr><td><strong>Indicator Level</strong></td><td>The scope level for this configuration</td></tr>
            <tr><td><strong>Frequency</strong></td><td>How often reports are expected (e.g. monthly, quarterly, annually)</td></tr>
            <tr><td><strong>Target</strong></td><td>The target value to achieve</td></tr>
            <tr><td><strong>Baseline</strong></td><td>The starting value</td></tr>
            <tr><td><strong>Project</strong></td><td>Optionally link to a specific KISIP project</td></tr>
            <tr><td><strong>Location</strong></td><td>Optionally link to a specific settlement or project area</td></tr>
          </tbody></table>
          <p>A unique code is generated from the combination of indicator, activity, project, and category IDs. Configurations can also be <strong>bulk imported</strong> from Excel using the built-in import wizard (Upload File &rarr; Match Fields &rarr; Review &rarr; Import).</p>

          <h3>Editing &amp; deleting configurations</h3>
          <ul>
            <li><strong>Edit</strong> &mdash; click the Edit action to modify the configuration. Requires <code>indicator_category:update</code> permission.</li>
            <li><strong>Delete</strong> &mdash; click the Delete action and confirm. Requires <code>indicator_category:delete</code> permission.</li>
          </ul>

          <hr/>

          <h2>Categories</h2>
          <p>Categories group related indicators together for organised reporting and dashboard display. They are managed from <strong>M&amp;E &rarr; Framework &rarr; Category</strong>.</p>
        `
      },
      {
        id: 'mne-reports',
        label: 'Reports & Evaluations',
        content: `
          <p>The <strong>Monitoring</strong> section is where indicator data is actually reported and tracked. It contains three sub-pages: <strong>Reports (New)</strong>, <strong>Reports</strong> (past), and <strong>Evaluations</strong>.</p>

          <h2>Submitting reports (New)</h2>
          <p>Navigate to <strong>M&amp;E &rarr; Monitoring &rarr; Reports (New)</strong> to file indicator reports. The listing shows all indicator configurations with their current reporting status:</p>
          <img class="docs-screenshot" src="${meReportsImg}" alt="M&E Reports (New) listing" />
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Indicator</strong></td><td>Name of the indicator</td></tr>
            <tr><td><strong>Category</strong></td><td>Dimension / category title</td></tr>
            <tr><td><strong>Settlement</strong></td><td>The settlement or area the report covers</td></tr>
            <tr><td><strong>Qty / Status</strong></td><td>The reported quantity or current status value</td></tr>
            <tr><td><strong>Progress %</strong></td><td>Percentage progress toward the target</td></tr>
            <tr><td><strong>Date</strong></td><td>Date of the report</td></tr>
            <tr><td><strong>Status</strong></td><td>Approval status (Pending, Approved, Rejected)</td></tr>
            <tr><td><strong>Documents</strong></td><td>Count of attached supporting documents, with a button to view them</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit, Delete, and document management</td></tr>
          </tbody></table>

          <h3>Filing a report</h3>
          <img class="docs-screenshot" src="${meReportsAddImg}" alt="M&E filing a report form" />
          <p>Click the <strong>+</strong> button to open the <strong>Add Report</strong> dialog. Fill in the form in order (each dropdown filters the next):</p>
          <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Project</strong></td><td>Select the KISIP project. Options are filterable.</td></tr>
            <tr><td><strong>Activity</strong></td><td>Select the activity; the list is filtered by the selected project.</td></tr>
            <tr><td><strong>Indicator</strong></td><td>Select the indicator configuration (indicator + dimension). The list is filtered by the selected activity. The chosen configuration determines the settlement/location for the report.</td></tr>
            <tr><td><strong>Date</strong></td><td>Pick the reporting date.</td></tr>
            <tr><td><strong>Quantity</strong></td><td>Enter the reported amount (number).</td></tr>
            <tr><td><strong>Progress %</strong></td><td>Optional. Enter progress toward target (0–100).</td></tr>
            <tr><td><strong>Comments</strong></td><td>Optional. Free-text comments.</td></tr>
          </tbody></table>
          <p>Click <strong>Submit</strong> to save. The report is created in <em>Pending</em> status for review. You can attach supporting documents (photos, PDFs, spreadsheets) to the report after submission via the Documents action in the listing. Once approved, reports linked to a settlement appear on that settlement's <strong>Indicators tab</strong> in Settlement Details.</p>

          <h3>Filtering</h3>
          <p>Filter reports by <strong>county</strong> (multi-select, available to national users), <strong>settlement</strong> (searchable), or <strong>indicator</strong>. County-level users automatically see only reports for their assigned county.</p>

          <h2>Past reports</h2>
          <p>Navigate to <strong>M&amp;E &rarr; Monitoring &rarr; Reports</strong> to view historical reports. This provides a read-only archive of all previously submitted and approved indicator reports with the same column structure. Use this view to track trends and cumulative progress over time.</p>

          <h2>Evaluations</h2>
          <p>Navigate to <strong>M&amp;E &rarr; Monitoring &rarr; Evaluations</strong> to manage formal programme evaluations (e.g. mid-term reviews, end-term assessments, annual reviews).</p>
          <ul>
            <li><strong>View evaluations</strong> &mdash; the listing shows all created evaluations with their title, type, date, and status</li>
            <li><strong>Add evaluation</strong> &mdash; click <strong>Add Evaluation</strong> to create a new evaluation record, selecting the type and providing the assessment narrative</li>
          </ul>
          <p>Evaluations compile indicator data into structured assessment documents that can be exported and shared with stakeholders.</p>

          <h2>Export</h2>
          <p>All report listings can be exported to Excel. Use the <strong>Download</strong> button in the toolbar. A custom field selector lets you choose which columns to include in the export.</p>
        `
      },
      {
        id: 'mne-beneficiaries',
        label: 'Beneficiaries',
        content: `
          <p>The <strong>Beneficiaries</strong> page tracks beneficiary counts per project and location for KISIP programme reporting. Records are stored at project–location level with target and actual numbers by gender.</p>

          <h2>What is tracked</h2>
          <p>Each beneficiary record links a <strong>project</strong> and a <strong>location</strong> (settlement) and stores:</p>
          <ul>
            <li><strong>Project</strong> &mdash; the KISIP project the beneficiaries are reported under</li>
            <li><strong>Settlement (Location)</strong> &mdash; the project location or settlement where beneficiaries are counted</li>
            <li><strong>Target (Female) / Target (Male)</strong> &mdash; planned number of female and male beneficiaries for that project–location</li>
            <li><strong>Actual (Female) / Actual (Male)</strong> &mdash; reported number of female and male beneficiaries reached</li>
            <li><strong>Comments</strong> &mdash; optional notes</li>
          </ul>
          <p>The listing table shows <strong>Project</strong>, <strong>Settlement</strong>, <strong>Female Beneficiaries</strong>, and <strong>Male Beneficiaries</strong> (actual counts). Rows can be expanded for more detail.</p>

          <h2>Listing &amp; management</h2>
          <img class="docs-screenshot" src="${meBeneficiariesListingImg}" alt="M&E Beneficiaries listing" />
          <p>The beneficiary listing is a paginated table with search and filter capabilities. Authorised users can add, edit, and delete beneficiary records. The data can be exported to Excel for external reporting and analysis.</p>

          <h3>Adding a beneficiary record</h3>
          <img class="docs-screenshot" src="${meBeneficiariesAddImg}" alt="M&E Add Beneficiary dialog" />
          <p>Click the <strong>+</strong> button to open the Add Beneficiary dialog. The form has three steps: <strong>Project Details</strong> (select Project and Location/settlement), <strong>Beneficiaries</strong> (enter Target and Actual counts for female and male, plus optional comments), and <strong>Submit</strong>. Location options are filtered by the selected project.</p>

          <blockquote>Note &mdash; Beneficiary data is accessible only to national-level users with <code>root_admin</code>, <code>super_admin</code>, <code>admin</code>, <code>monitoring</code>, or <code>staff</code> roles.</blockquote>
        `
      }
    ]
  },
  {
    id: 'grm',
    label: 'Grievance Redress (GRM)',
    icon: 'mdi:message-alert-outline',
    roles: ['root_admin', 'super_admin', 'admin', 'staff', 'monitoring', 'grm', 'consultant', 'national_monitoring', 'county_admin'],
    children: [
      {
        id: 'grm-overview',
        label: 'Overview',
        content: `
          <p>The <strong>Grievance Redress Mechanism (GRM)</strong> is KeSMIS's end-to-end complaint management system for KISIP programmes. Any member of the public can submit a grievance without logging in &mdash; by phone, online form, or toll-free helpline &mdash; and track its progress using a unique tracking code. Internally, authorised staff receive, review, assign, and resolve grievances through a structured workflow with full audit trail.</p>
          <p>The GRM module is accessible from the sidebar under <strong>GRM</strong>. Access is available to users with <code>root_admin</code>, <code>super_admin</code>, <code>admin</code>, <code>grm</code>, or <code>staff</code> roles.</p>

          <h2>Module structure</h2>
          <table><thead><tr><th>Section</th><th>Purpose</th></tr></thead><tbody>
            <tr><td><strong>Grievances</strong></td><td>Master list of all public complaints &mdash; view, filter, assign, update status, add notes and communication logs, and close cases</td></tr>
            <tr><td><strong>GBV Cases</strong></td><td>Gender-Based Violence cases handled under a restricted, high-confidentiality sub-workflow accessible only to users with the <code>gbv</code> permission</td></tr>
            <tr><td><strong>GRC</strong></td><td>Grievance Redress Committee &mdash; the body responsible for reviewing and resolving grievances; manage committee members here</td></tr>
            <tr><td><strong>SEC</strong></td><td>Settlement Executive Committee &mdash; community-level committees linked to settlements; used for escalation and local resolution</td></tr>
          </tbody></table>

          <h2>Grievance lifecycle</h2>
          <p>Every grievance passes through the following stages:</p>
          <ol>
            <li><strong>Submission</strong> &mdash; the complainant files a grievance via the public landing page form, the toll-free helpline (<strong>0800 724 349</strong>), or directly through a GRM officer on behalf of the complainant</li>
            <li><strong>Intake &amp; Acknowledgement</strong> &mdash; a GRM officer reviews the new submission, confirms receipt, and issues a tracking code to the complainant</li>
            <li><strong>Assignment</strong> &mdash; the grievance is assigned to a GRC member or relevant officer for investigation</li>
            <li><strong>Review &amp; Investigation</strong> &mdash; the assigned officer investigates the complaint, may request additional information, and logs all communications internally</li>
            <li><strong>Resolution</strong> &mdash; the grievance is marked resolved (or rejected with reasons), and the complainant is notified via SMS or phone</li>
            <li><strong>Closure</strong> &mdash; the resolved case is closed and archived with a full audit trail of all actions taken</li>
          </ol>
          <img src="${fileGrievanceBtnImg}" alt="File a Grievance button on the landing page" class="docs-screenshot" />

          <h2>Public submission</h2>
          <p>The public grievance form is a four-step wizard accessible from the KeSMIS landing page without any login:</p>
          <table><thead><tr><th>Step</th><th>Fields collected</th></tr></thead><tbody>
            <tr><td><strong>1 &mdash; Personal Details</strong></td><td>Name (or &ldquo;Anonymous&rdquo;), gender, age bracket, national ID, phone, email</td></tr>
            <tr><td><strong>2 &mdash; Grievance Details</strong></td><td>County, project phase (KISIP 1 / KISIP 2), settlement</td></tr>
            <tr><td><strong>3 &mdash; Complaint Details</strong></td><td>Nature and detailed description of the complaint, supporting documents or photos</td></tr>
            <tr><td><strong>4 &mdash; Review &amp; Submit</strong></td><td>Summary of all entries &mdash; review and confirm before submitting</td></tr>
          </tbody></table>
          <img src="${grievanceFormImg}" alt="Multi-step public grievance submission form" class="docs-screenshot" />
          <p>After submission the complainant receives a <strong>unique tracking code</strong>. They can use the <strong>Check Status</strong> button on the landing page at any time to view the current status and any updates logged by the GRC.</p>

          <h2>Who can access the GRM module?</h2>
          <table><thead><tr><th>Role</th><th>Access level</th></tr></thead><tbody>
            <tr><td><strong>General public</strong></td><td>Can submit grievances and check status &mdash; no login required</td></tr>
            <tr><td><strong>GRM officer / Staff</strong></td><td>Can view, filter, assign, update and resolve all grievances; manage GRC and SEC records</td></tr>
            <tr><td><strong>Admin / Super admin</strong></td><td>Full access including GBV cases, reporting, and configuration</td></tr>
            <tr><td><strong>GBV role</strong></td><td>Additional access to restricted GBV case records</td></tr>
          </tbody></table>

          <blockquote>Tip &mdash; Complainants who prefer not to use the online form can call the toll-free helpline <strong>0800 724 349</strong> during working hours. A GRM officer will file the grievance on their behalf and provide the tracking code.</blockquote>
        `
      },
      {
        id: 'grm-grievances',
        label: 'Grievances',
        content: `
          <p>The <strong>Grievances</strong> page is the main working area for GRM officers and administrators. It lists every complaint received &mdash; from public online submissions, the toll-free helpline, and staff-entered records &mdash; and provides the tools to manage each one through its full lifecycle.</p>
          <p>Navigate here via <strong>GRM &rarr; Grievances</strong> in the sidebar. County-level staff see only grievances from their assigned county; national staff and admins see all counties.</p>

          <h2>Status tabs</h2>
          <img src="${grievanceListingImg}" alt="Grievances listing page" class="docs-screenshot" />
          <p>Clickable status cards at the top of the page each show a live count. Click a card to filter the table to that group:</p>
          <table><thead><tr><th>Status</th><th>Meaning</th><th>Default deadline</th></tr></thead><tbody>
            <tr><td><strong>Received (All)</strong></td><td>All non-deleted grievances &mdash; the default view on page load</td><td>&mdash;</td></tr>
            <tr><td><strong>Sorting</strong></td><td>Received but not yet acted on; pending triage</td><td>7 days</td></tr>
            <tr><td><strong>Under Review</strong></td><td>Actively being investigated; complainant has been notified</td><td>&mdash;</td></tr>
            <tr><td><strong>Escalated</strong></td><td>Moved to a higher level (e.g., SEC &rarr; County GRM &rarr; NPCT)</td><td>14 days</td></tr>
            <tr><td><strong>Referred</strong></td><td>Referred to a specific officer (CPCT/NPCT) or external entity</td><td>&mdash;</td></tr>
            <tr><td><strong>External Referral</strong></td><td>Referred to an external agency outside KISIP for resolution</td><td>&mdash;</td></tr>
            <tr><td><strong>In Court</strong></td><td>The case is pending court determination</td><td>&mdash;</td></tr>
            <tr><td><strong>Resolved</strong></td><td>Corrective action has been recommended or implemented</td><td>21 days</td></tr>
            <tr><td><strong>Closed</strong></td><td>Complainant has accepted the resolution; case archived</td><td>42 days</td></tr>
            <tr><td><strong>Rejected</strong></td><td>Fake, test entry, or does not qualify</td><td>&mdash;</td></tr>
            <tr><td><strong>Deleted</strong></td><td>Soft-deleted records; visible only to national staff with <code>grievance:viewDeleted</code> permission</td><td>&mdash;</td></tr>
          </tbody></table>
          <blockquote>Grievances approaching or past their stage deadline are colour-highlighted in the table as a prompt to act.</blockquote>

          <h2>Table columns</h2>
          <table><thead><tr><th>Column</th><th>Description</th><th>Shown when</th></tr></thead><tbody>
            <tr><td><strong>ID</strong></td><td>System-generated unique identifier</td><td>Always</td></tr>
            <tr><td><strong>Grievance</strong></td><td>Tracking code, complainant name, nature of complaint, and short description. GBV-flagged cases show a lock icon visible only to authorised users</td><td>Always</td></tr>
            <tr><td><strong>Location</strong></td><td>County and settlement the grievance relates to</td><td>Always</td></tr>
            <tr><td><strong>Deadline</strong></td><td>Calculated expiry date for the current status stage</td><td>Always</td></tr>
            <tr><td><strong>Complainant / Reported By</strong></td><td>Complainant name and the staff member who filed the record</td><td>Sorting tab only</td></tr>
            <tr><td><strong>Referred To</strong></td><td>Name and phone of the officer the case was referred to</td><td>Referred tab only</td></tr>
            <tr><td><strong>Date Reported</strong></td><td>Date the grievance was originally filed</td><td>Always</td></tr>
            <tr><td><strong>Date Resolved</strong></td><td>Date marked resolved</td><td>Resolved tab only</td></tr>
            <tr><td><strong>Resolution</strong></td><td>Description of the corrective action taken</td><td>Resolved tab only</td></tr>
            <tr><td><strong>Date Closed</strong></td><td>Date the case was formally closed</td><td>Closed tab only</td></tr>
          </tbody></table>
          <p>Click any row to open the full <strong>Grievance Details</strong> page. Double-clicking a row also navigates there.</p>

          <h2>Searching &amp; filtering</h2>
          <img src="${grievanceSearchImg}" alt="Grievance search bar" class="docs-screenshot" />
          <p>Use the <strong>search bar</strong> at the top to find grievances by tracking code, description, or complainant name. The advanced <strong>Filter</strong> modal adds the following filters:</p>
          <img src="${grievanceFilter1Img}" alt="Grievance filter modal" class="docs-screenshot" />
          <img src="${grievanceFilter2Img}" alt="Grievance filter results" class="docs-screenshot" />
          <ul>
            <li><strong>Category</strong> &mdash; nature/type of complaint (e.g., land, infrastructure, financial)</li>
            <li><strong>County</strong> &mdash; one or multiple counties (national staff); pre-scoped for county staff</li>
            <li><strong>Sub-county</strong> &mdash; cascades from the selected county</li>
            <li><strong>Ward</strong> &mdash; cascades from the selected sub-county</li>
            <li><strong>Project Phase</strong> &mdash; KISIP 1 or KISIP 2</li>
          </ul>
          <p>Active filters appear as removable chips above the table. Use <strong>Clear All</strong> to reset everything, or click individual chip &times; buttons to remove one filter at a time.</p>

          <h2>Adding a grievance (staff)</h2>
          <p>Click <strong>+ Add</strong> to file a grievance on behalf of a walk-in or phone-in complainant. The three-step internal form collects:</p>
          <img src="${grievanceAdd1Img}" alt="Add grievance form step 1" class="docs-screenshot" />
          <img src="${grievanceAdd2Img}" alt="Add grievance form step 2" class="docs-screenshot" />
          <table><thead><tr><th>Step</th><th>Fields</th></tr></thead><tbody>
            <tr><td><strong>1 &mdash; Personal Details</strong></td><td>Name (or &ldquo;Anonymous&rdquo;), gender, age bracket, national ID, phone, email</td></tr>
            <tr><td><strong>2 &mdash; Grievance Details</strong></td><td>County, project phase (KISIP 1 / KISIP 2), settlement, date reported</td></tr>
            <tr><td><strong>3 &mdash; Complaint Details</strong></td><td>Nature of complaint, detailed description, complainant&apos;s plea/request, GBV flag, witness name/phone/statement, supporting documents (PDF/JPG/PNG, max 10 MB each)</td></tr>
          </tbody></table>
          <p>On submission the system: creates the grievance in <em>Sorting</em> status, logs the intake action, uploads attached documents, and sends an <strong>SMS acknowledgement</strong> with the tracking code to the complainant&apos;s phone.</p>

          <h2>Downloading</h2>
          <img src="${grievanceListDownloadImg}" alt="Grievance list download" class="docs-screenshot" />
          <p>Click the <strong>Download</strong> button to export the current view to Excel. A field selector lets you choose exactly which columns to include. The export respects all active filters and your role scope.</p>
        `
      },
      {
        id: 'grm-details',
        label: 'Grievance Details & Actioning',
        content: `
          <p>Clicking any row in the Grievances listing opens the <strong>Grievance Details</strong> page. This is where GRM officers read the full complaint record and take all workflow actions &mdash; sorting, reviewing, escalating, referring, resolving, and closing a grievance.</p>

          <h2>Page overview</h2>
          <img src="${grievanceDetail1Img}" alt="Grievance details page" class="docs-screenshot" />
          <p>The top of the page displays a summary header showing the grievance <strong>tracking code</strong>, current <strong>status badge</strong>, <strong>current level</strong> (settlement / county / national), and an overdue warning if the current stage deadline has passed. The main content is organised into five tabs:</p>
          <table><thead><tr><th>Tab</th><th>What it shows</th></tr></thead><tbody>
            <tr><td><strong>Grievance Details</strong></td><td>Full record: tracking code, complainant name, phone, county, settlement, nature of complaint, GBV flag, description, complainant&apos;s plea, date reported, and resolution (once resolved)</td></tr>
            <tr><td><strong>Supporting Documentation</strong></td><td>All files attached to the grievance &mdash; name, type, upload date, and download button. Staff can also upload additional documents here at any time</td></tr>
            <tr><td><strong>Action Logs</strong></td><td>Chronological timeline of every action taken on the grievance &mdash; who did what, when, and what note they left. Includes any uploaded action documents</td></tr>
            <tr><td><strong>Notifications</strong></td><td>Log of all SMS notifications sent to the complainant, with message content and delivery timestamps</td></tr>
            <tr><td><strong>Settings</strong></td><td>Field-level edit history &mdash; who changed what value and when, with a diff view and revert option for authorised users</td></tr>
          </tbody></table>

          <h3>Supporting Documentation</h3>
          <img src="${grievanceDetailsDocumentationImg}" alt="Grievance details — Supporting Documentation tab" class="docs-screenshot" />
          <p>The <strong>Supporting Documentation</strong> tab lists every file attached to the grievance. Each entry shows the file name, type, upload date, and a download button. In addition to documents attached during submission or actioning, staff can upload further files at any time from this tab &mdash; click <strong>Upload Documents</strong>, select the document type (<em>Supporting Documentation</em>, <em>Acknowledgement</em>, <em>Resolution Document</em>, or <em>Other</em>), choose the file, and save. Allowed formats: images (jpg/png/gif/webp) and documents (pdf/doc/docx/xls/xlsx/ppt/pptx). Maximum file size 10 MB. Executable files are blocked.</p>

          <h3>Action Logs</h3>
          <img src="${grievanceDetailsHistoryImg}" alt="Grievance details — Action Logs tab" class="docs-screenshot" />
          <p>The <strong>Action Logs</strong> tab provides a full chronological audit trail of everything that has happened to the grievance. Each entry records the acting officer, their role and level, the action taken, the date and time, and the narrative note they entered. Documents uploaded during an action (e.g. a resolution form) are also linked here.</p>

          <h3>Notifications</h3>
          <img src="${grievanceDetailsNotificationsImg}" alt="Grievance details — Notifications tab" class="docs-screenshot" />
          <p>The <strong>Notifications</strong> tab logs every SMS sent to the complainant during the lifecycle of the grievance. Each entry shows the message content, the event that triggered it (e.g. intake acknowledgement, status update, resolution), and the delivery timestamp. This tab is useful for confirming that the complainant has been kept informed at each stage.</p>

          <h2>Action button</h2>
          <p>The primary <strong>action button</strong> in the top-right corner opens a slide-out drawer for updating the grievance status. Its label changes to reflect what action is most appropriate for the current status:</p>
          <table><thead><tr><th>Current status</th><th>Button label</th></tr></thead><tbody>
            <tr><td>Sorting</td><td>Review and Sort</td></tr>
            <tr><td>Under Review / Investigation / Escalated / Referred</td><td>Review Status</td></tr>
            <tr><td>Resolved</td><td>Review / Close grievance</td></tr>
            <tr><td>Closed / In Court</td><td>Button hidden &mdash; no further action required</td></tr>
          </tbody></table>
          <p>The button is also hidden for non-national users when a grievance has been <em>Resolved</em> at settlement or county level &mdash; at that point only the national GRM can act (to confirm or close).</p>
          <blockquote>The action button is disabled if the logged-in user&apos;s role level does not match the grievance&apos;s current level. A settlement GRM officer cannot act on a grievance that has been escalated to county level.</blockquote>

          <h2>Status update drawer</h2>
          <img src="${grievanceUpdateImg}" alt="Grievance status update drawer" class="docs-screenshot" />
          <p>The drawer always starts with a <strong>Update Grievance Status</strong> dropdown. The options available depend on the current status &mdash; only valid next-states are shown. After selecting a status, additional fields appear:</p>
          <table><thead><tr><th>New status selected</th><th>Extra fields shown</th></tr></thead><tbody>
            <tr><td><strong>Any status</strong></td><td>Action description (narrative text field explaining the action taken)</td></tr>
            <tr><td><strong>Referred</strong></td><td>Select officer to refer to (filterable dropdown of settlement, county and national GRM officers). An <em>Add Officer</em> inline option lets you add a new officer by name and phone without leaving the drawer</td></tr>
            <tr><td><strong>External Referral</strong></td><td>Name of the external organisation the case is being referred to</td></tr>
            <tr><td><strong>Resolved</strong></td><td>A five-step sub-wizard (see below)</td></tr>
          </tbody></table>

          <h2>Resolving a grievance</h2>
          <img src="${grievanceResolveFormImg}" alt="Grievance resolution wizard" class="docs-screenshot" />
          <p>Marking a grievance <strong>Resolved</strong> opens a five-step wizard inside the drawer. All steps must be completed before the resolution can be submitted:</p>
          <table><thead><tr><th>Step</th><th>Fields</th></tr></thead><tbody>
            <tr><td><strong>1 &mdash; Basic Info</strong></td><td>Was the filer present (Yes/No), was field verification conducted (Yes/No), date of resolution</td></tr>
            <tr><td><strong>2 &mdash; Investigation</strong></td><td>Findings of the field investigation (free text)</td></tr>
            <tr><td><strong>3 &mdash; Agreement</strong></td><td>Was agreement reached (Yes/No). If <em>Yes</em>: agreement details. If <em>No</em>: points of disagreement</td></tr>
            <tr><td><strong>4 &mdash; Documentation</strong></td><td>Download the <strong>Resolution Form Template</strong>, fill and sign it, then upload the signed form. At least one document is <strong>required</strong> before proceeding</td></tr>
            <tr><td><strong>5 &mdash; Action Description</strong></td><td>Written summary of the resolution action taken</td></tr>
          </tbody></table>
          <p>On submission the system: updates the grievance status, logs the resolution action, uploads the resolution document, and sends an <strong>SMS notification</strong> to the complainant. If the resolving user is at <em>settlement</em> or <em>county</em> level, the SMS states the resolution is <em>subject to confirmation by the KISIP National Team</em>. If resolved at national level, the grievance is automatically closed.</p>

          <h2>National GRM confirmation</h2>
          <img src="${grievancePendingConfirmationImg}" alt="Grievance awaiting confirmation" class="docs-screenshot" />
          <p>When a grievance is resolved at settlement or county level and has not yet been confirmed, national GRM users see a separate <strong>Confirm Resolution</strong> button. Clicking it opens a confirmation dialog where the officer enters confirmation notes and confirms the level. On confirmation, the system automatically <strong>closes</strong> the grievance and sends a final SMS to the complainant.</p>

          <h2>Escalation levels</h2>
          <p>When a grievance is escalated or returned, the system moves its <strong>current level</strong> accordingly, which determines which staff can act on it next:</p>
          <table><thead><tr><th>Action</th><th>Performed by</th><th>Grievance moves to</th></tr></thead><tbody>
            <tr><td>Escalate</td><td>Settlement GRM officer</td><td>County level</td></tr>
            <tr><td>Escalate</td><td>County GRM officer</td><td>National level</td></tr>
            <tr><td>Send Back (Returned)</td><td>National GRM officer</td><td>County level</td></tr>
            <tr><td>Send Back (Returned)</td><td>County GRM officer</td><td>Settlement level</td></tr>
          </tbody></table>

          <h2>Sending an overdue reminder</h2>
          <img src="${grievanceSendReminderImg}" alt="Send overdue reminder" class="docs-screenshot" />
          <p>If a grievance has passed its stage deadline, staff can click the <strong>Send Overdue Reminder</strong> button to dispatch an SMS to the complainant acknowledging the delay and reassuring them the case is being actively handled.</p>

          <h2>Supporting Documentation tab</h2>
          <p>In addition to documents attached during submission or actioning, staff can upload further files at any time from this tab. Click <strong>Upload Documents</strong>, select the document type (Supporting Documentation, Acknowledgement, Resolution Document, or Other), choose the file, and save. Allowed formats: images (jpg/png/gif/webp) and documents (pdf/doc/docx/xls/xlsx/ppt/pptx). Maximum file size 10 MB. Executable files are blocked.</p>

          <h2>Settings tab (edit history)</h2>
          <p>The Settings tab shows a table of every field-level edit made to the grievance record, with columns for: changed field, before and after values, action type (Edit or Delete), date edited, and who made the change. Expand any row to see the full diff. Authorised users can click <strong>Revert</strong> on any edit entry to undo that specific change and restore the previous field value.</p>
        `
      },
      {
        id: 'grm-gbv',
        label: 'GBV Cases',
        content: `
          <p><strong>Gender-Based Violence (GBV)</strong> cases are grievances flagged as GBV at the point of submission. They follow the same status workflow as regular grievances but are subject to stricter access controls and data handling rules to protect victim confidentiality.</p>

          <h2>Access control</h2>
          <p>GBV cases are separated from the main grievance listing. Only users assigned the <code>gbv</code> role can view and action GBV records. Regular GRM officers, staff, and county admins do not see GBV cases in their listing. Super admins and root admins have full access.</p>
          <blockquote>The <code>gbv</code> role is an additional permission granted on top of a user&apos;s existing role &mdash; it does not replace it. A county GRM officer must hold both the <code>grm</code> and <code>gbv</code> roles to handle GBV cases at county level.</blockquote>

          <h2>Data redaction</h2>
          <p>For all users except super admins and root admins, the complainant&apos;s <strong>name</strong>, <strong>national ID</strong>, and <strong>phone number</strong> are automatically redacted and displayed as <code>[REDACTED]</code> on GBV cases. This applies even to users with the <code>gbv</code> role. Only super admins can view the full decrypted PII of a GBV complainant.</p>

          <h2>Flagging a case as GBV</h2>
          <p>During grievance submission (Step 3 &mdash; Complaint Details), the intake officer can tick the <strong>GBV</strong> flag. Once saved, the case is routed into the GBV sub-listing and the flag cannot be removed without admin intervention. In the main grievance listing, GBV-flagged cases are hidden from non-GBV users entirely &mdash; they do not appear as redacted rows, they are not shown at all.</p>

          <h2>Workflow</h2>
          <p>GBV cases progress through the same statuses as standard grievances: <em>Sorting &rarr; Under Review &rarr; Investigation &rarr; Resolved &rarr; Closed</em>. The same action drawer, escalation rules, resolution wizard, and national confirmation step all apply. The only differences are who can see and act on the case.</p>

          <h2>Confidentiality guidelines</h2>
          <ul>
            <li>Do not discuss case details outside secure channels</li>
            <li>Do not share the tracking code with anyone other than the complainant</li>
            <li>Upload resolution documents only through the Supporting Documentation tab &mdash; do not send via email or messaging apps</li>
            <li>If a case needs to be referred externally, use the <em>External Referral</em> status and record the organisation name &mdash; do not include complainant PII in the referral notes</li>
          </ul>
        `
      }
    ]
  },
  {
    id: 'incidents',
    label: 'Incidents',
    icon: 'mdi:alert-decagram-outline',
    roles: ['root_admin', 'super_admin', 'admin', 'staff', 'monitoring', 'grm', 'consultant', 'national_monitoring', 'county_admin'],
    children: [
      {
        id: 'incidents-overview',
        label: 'Listing & Overview',
        content: `
          <p>The <strong>Incidents</strong> module captures reports of accidents, disasters, or safety events affecting informal settlements and KISIP project areas. Incidents can be filed publicly via the landing page (no login required) or internally by staff. Each incident is assigned a unique reference code in the format <strong>INC-YYYY-NNNN</strong>.</p>

          <h2>Accessing the listing</h2>
          <img src="${incidentListingImg}" alt="Incidents listing" class="docs-screenshot" />
          <p>Navigate to <strong>Incidents</strong> in the main menu. The listing is a paginated table sorted newest first. Only authenticated users with the appropriate role can access the internal listing. The public can look up an individual incident by its reference code on the landing page without logging in.</p>

          <h2>Columns</h2>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Code</strong></td><td>Unique reference (INC-YYYY-NNNN)</td></tr>
            <tr><td><strong>Reported By</strong></td><td>Name of the person who filed the report</td></tr>
            <tr><td><strong>County / Settlement</strong></td><td>Geographic location of the incident</td></tr>
            <tr><td><strong>Incident Types</strong></td><td>One or more incident categories selected at submission</td></tr>
            <tr><td><strong>Severity</strong></td><td>Severity level assigned to the incident</td></tr>
            <tr><td><strong>Status</strong></td><td>Current workflow status (Open, In Progress, Closed, etc.)</td></tr>
            <tr><td><strong>Date Occurred</strong></td><td>Date and time the incident took place</td></tr>
          </tbody></table>

          <h2>Search and filters</h2>
          <img src="${incidentSearchImg}" alt="Incident search and filters" class="docs-screenshot" />
          <p>Use the <strong>search bar</strong> to filter by keyword across the incident description, reference code, and location text. Use the <strong>County</strong> and <strong>Settlement</strong> filter dropdowns to narrow results by location. All filters can be combined.</p>

          <h2>SMS notifications on submission</h2>
          <p>When a new incident is submitted, the system automatically sends two sets of SMS notifications:</p>
          <ul>
            <li><strong>Reporter acknowledgement</strong> &mdash; an SMS is sent to the reporter&apos;s phone confirming receipt of the report, including the reference code and a public tracking link</li>
            <li><strong>Safeguards team alert</strong> &mdash; all users with the safeguards role receive an SMS with the reference code, location, incident type, severity, and a direct link to the record</li>
          </ul>
        `
      },
      {
        id: 'incidents-reporting',
        label: 'Reporting an Incident',
        content: `
          <img src="${incidentAddButtonImg}" alt="Report Incident button" class="docs-screenshot" />
          <p>Click the <strong>Report Incident</strong> button in the toolbar to open the reporting drawer. The form pre-populates the reporter name, phone, and role from your logged-in account. County-restricted users will have their county locked and can only select settlements within their assigned county.</p>
          <img src="${incidentAddImg}" alt="Report incident form" class="docs-screenshot" />

          <h2>Form steps</h2>
          <p>The form is a seven-step wizard. Each step must pass validation before proceeding. Use the arrow buttons at the top of the drawer to move between steps.</p>
          <table><thead><tr><th>Step</th><th>Fields</th><th>Required</th></tr></thead><tbody>
            <tr><td><strong>1 &mdash; Incident Details</strong></td><td>Date occurred, time occurred, county, settlement, location text, reporter name, reporter role, reporter phone</td><td>All fields required</td></tr>
            <tr><td><strong>2 &mdash; Worker Details</strong></td><td>Worker name, designation, site supervisor, department</td><td>All fields required</td></tr>
            <tr><td><strong>3 &mdash; Categories</strong></td><td>Incident types (multi-select), mechanisms, indirect causes, activity leading to incident</td><td>At least one selection each</td></tr>
            <tr><td><strong>4 &mdash; Causes</strong></td><td>Direct causes, root causes (multi-select checklists)</td><td>At least one selection each</td></tr>
            <tr><td><strong>5 &mdash; Narrative</strong></td><td>Full description, consequences, immediate action taken, severity</td><td>All fields required</td></tr>
            <tr><td><strong>6 &mdash; Actions</strong></td><td>Corrective actions to prevent recurrence &mdash; each entry requires: action description, responsible party, priority (High/Medium/Low), due date</td><td>At least one action required</td></tr>
            <tr><td><strong>7 &mdash; Prepared By</strong></td><td>Preparer name and job title</td><td>Both required</td></tr>
          </tbody></table>

          <h2>After submission</h2>
          <p>On submission the system assigns a unique <strong>INC-YYYY-NNNN</strong> reference code, sends an <strong>SMS acknowledgement</strong> to the reporter&apos;s phone with the code and a public tracking link, and notifies all <strong>safeguards team members</strong> via SMS with the reference code, location, type, severity, and a direct link to the record.</p>
        `
      },
      {
        id: 'incidents-management',
        label: 'Management',
        content: `
          <img src="${incidentManagementButtonsImg}" alt="Incident management action buttons" class="docs-screenshot" />
          <p>Each incident row in the listing has a set of action buttons. On mobile these collapse into a dropdown menu.</p>
          <table><thead><tr><th>Button</th><th>Function</th></tr></thead><tbody>
            <tr><td><strong>Edit</strong></td><td>Opens the multi-step edit drawer pre-filled with the incident&apos;s current data. All fields can be updated. Changes are tracked in the audit history.</td></tr>
            <tr><td><strong>Change Status</strong></td><td>Opens a drawer to update the incident status. A mandatory <em>Action Taken</em> note must be provided. Optionally attach supporting documents to the status update.</td></tr>
            <tr><td><strong>View History</strong></td><td>Opens a side panel showing the full audit trail — every create, edit, and status change — plus a Documents tab listing all attached files with download links.</td></tr>
            <tr><td><strong>Generate PDF</strong></td><td>Generates and downloads a formatted PDF report of the incident including basic info, worker details, causes, narrative, corrective actions, attached documents list, and change history. A QR code linking to the public status page is embedded on the first page.</td></tr>
            <tr><td><strong>Delete</strong></td><td>Permanently deletes the incident after confirmation. All associated documents (including files on disk) and history records are also removed. This action cannot be undone.</td></tr>
          </tbody></table>

          <h2>Incident record fields</h2>
          <table><thead><tr><th>Section</th><th>Fields</th></tr></thead><tbody>
            <tr><td><strong>Reporter</strong></td><td>Reported by, reporter role, reporter phone, date and time reported</td></tr>
            <tr><td><strong>Location</strong></td><td>County, sub-county, ward, settlement, location text, site supervisor, department</td></tr>
            <tr><td><strong>Worker</strong></td><td>Worker name, designation (relevant for project-site incidents)</td></tr>
            <tr><td><strong>Incident</strong></td><td>Date and time occurred, incident types (multi-select), severity, description (full narrative)</td></tr>
            <tr><td><strong>Causes</strong></td><td>Mechanisms, direct causes, indirect causes, activity leading to incident, root causes (all multi-select checklists)</td></tr>
            <tr><td><strong>Consequences &amp; Response</strong></td><td>Consequences of the incident, immediate action taken</td></tr>
            <tr><td><strong>Corrective Actions</strong></td><td>Structured list of actions to avoid recurrence &mdash; each action has a responsible party, priority level, and due date</td></tr>
            <tr><td><strong>Prepared By</strong></td><td>Name, job title, and date of the person preparing the report</td></tr>
          </tbody></table>

          <h2>Updating an incident</h2>
          <img src="${incidentEditImg}" alt="Incident edit form" class="docs-screenshot" />
          <p>Authorised staff can edit any field on the incident record. All changes are tracked in the audit history. If the <strong>status</strong> is being changed, an <strong>Action Taken</strong> narrative is required before saving &mdash; this is enforced by the system and the update will be rejected without it.</p>

          <h2>Status workflow</h2>
          <p>Incidents progress through a status lifecycle. The current status is shown as a badge on the record and in the listing. Changing status opens a prompt for an action note that is logged to the incident history.</p>

          <h2>Documents</h2>
          <p>Supporting documents (photos, reports, forms) can be attached to an incident. Upload files from the documents section on the incident detail page. The system accepts all common image and document formats. Uploaded files are stored securely and can be downloaded or deleted by authorised users.</p>

          <h2>Audit history</h2>
          <p>Every create, update, status change, and deletion is recorded in the incident history. Each history entry captures the action type, the fields changed (with old and new values), the user who made the change, and the timestamp. The history is read-only and cannot be altered.</p>

          <h2>PDF report</h2>
          <img src="${incidentPdfImg}" alt="Incident PDF report" class="docs-screenshot" />
          <p>A formatted PDF report can be generated from the incident detail page. It compiles the full incident record, attached documents list, and audit history into a printable document suitable for safeguards reporting and external submission.</p>

          <h2>Deleting an incident</h2>
          <p>Deleting an incident permanently removes the record along with all associated documents (including physical files on disk) and history entries. This action is irreversible. Only authorised admin users can delete incidents.</p>
        `
      }
    ]
  },
  {
    id: 'repository',
    label: 'Repository',
    icon: 'mdi:folder-multiple-outline',
    roles: ['root_admin', 'super_admin', 'admin', 'staff', 'monitoring', 'grm', 'consultant', 'national_monitoring', 'county_admin'],
    children: [
      {
        id: 'repo-documents',
        label: 'Documents',
        content: `
          <p>The <strong>Documents</strong> page is the central library for all project-related files in KeSMIS. Documents are tagged to settlements, projects and categories, making them searchable and filterable across the entire repository. Navigate here via <strong>Repository &rarr; Documents</strong> in the sidebar.</p>

          <h2>Listing</h2>
          <img src="${repoListingImg}" alt="Document repository listing" class="docs-screenshot" />
          <p>Documents are displayed in a paginated table with the following columns:</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>ID</strong></td><td>System-generated identifier</td></tr>
            <tr><td><strong>Name</strong></td><td>File name as stored in the system</td></tr>
            <tr><td><strong>Type</strong></td><td>Document type category (e.g. Socio Economic Report, Survey Plans, Shapefile)</td></tr>
            <tr><td><strong>Format</strong></td><td>File format (pdf, docx, png, etc.)</td></tr>
            <tr><td><strong>Size (MB)</strong></td><td>File size in megabytes</td></tr>
            <tr><td><strong>Settlement</strong></td><td>The settlement this document is tagged to</td></tr>
            <tr><td><strong>Project</strong></td><td>The project this document is linked to</td></tr>
            <tr><td><strong>Actions</strong></td><td>Download and Delete (admin only)</td></tr>
          </tbody></table>
          <p>The table is paginated with page sizes of 5, 10, 20, 50, 200 or all records.</p>

          <h2>Filtering</h2>
          <img src="${repoFilterImg}" alt="Document repository filters" class="docs-screenshot" />
          <p>Three filter dropdowns sit above the table. Each supports multi-select and is clearable:</p>
          <ul>
            <li><strong>Filter by Type</strong> &mdash; grouped by the five document groups:
              <table><thead><tr><th>Group</th><th>Categories</th></tr></thead><tbody>
                <tr><td><strong>Report</strong></td><td>Socio Economic Report, Basemap Report, Stakeholder Analysis Report, Social Environmental Screening Report, Planning Report, Engineering Survey Report</td></tr>
                <tr><td><strong>Maps</strong></td><td>Survey Plans, Registry Index Maps, Area List, Beacon Certificates</td></tr>
                <tr><td><strong>Data</strong></td><td>Households, Shapefile, Satellite Imagery, Beneficiaries, Other</td></tr>
                <tr><td><strong>Plan</strong></td><td>Local Physical Land Use Development Plan, Social Management Plan, Resettlement Action Plan, Community Development Plan</td></tr>
                <tr><td><strong>Others</strong></td><td>Photo, Ownership Document, Registration Document</td></tr>
              </tbody></table>
            </li>
            <li><strong>Filter by Settlement</strong> &mdash; show only documents tagged to a specific settlement</li>
            <li><strong>Filter by Project</strong> &mdash; show only documents linked to a specific project</li>
          </ul>
          <p>Click the <strong>Filter / Clear</strong> button to reset all filters and return to the full listing.</p>

          <h2>Downloading a document</h2>
          <img src="${repoDownloadImg}" alt="Downloading a document" class="docs-screenshot" />
          <p>Click the <strong>Download</strong> action button on any row to download that file directly to your device. The file is streamed from the server and saved with its original filename.</p>
          <p>To export the <em>listing</em> (metadata only, not the files themselves) as an Excel spreadsheet, click the <strong>Download</strong> toolbar button above the table. The export includes: S/No, Name, Size, Type, Report, Settlement, and Project columns for all currently filtered records.</p>

          <h2>Uploading documents</h2>
          <img src="${repoUpload1Img}" alt="Upload document form step 1" class="docs-screenshot" />
          <img src="${repoUpload2Img}" alt="Upload document form step 2" class="docs-screenshot" />
          <p>Click the <strong>+</strong> (Upload Documents) button to open the upload page. The upload form collects:</p>
          <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Document name</strong></td><td>Display name for the file in the repository</td></tr>
            <tr><td><strong>Document Parent</strong></td><td>The type of entity this document belongs to (e.g. Settlement, Project, Report)</td></tr>
            <tr><td><strong>Parent Entity</strong></td><td>The specific settlement, project or report to tag this document to &mdash; searchable with remote lookup</td></tr>
            <tr><td><strong>Document category</strong></td><td>The category that describes the document content</td></tr>
            <tr><td><strong>File</strong></td><td>The file to upload. Supported formats: <code>.xls .xlsx .pdf .zip .doc .docx .png .jpg .jpeg .csv .json .geojson .ppt .pptx .rar .tif .tiff .txt .kml .kmz .dwg .dxf .dgn</code></td></tr>
          </tbody></table>

          <h2>Bulk import</h2>
          <img src="${repoBulkUploadImg}" alt="Bulk document import wizard" class="docs-screenshot" />
          <p>To upload multiple files at once, use the <strong>Bulk Import</strong> wizard (three steps):</p>
          <ol>
            <li><strong>Select files</strong> &mdash; choose up to 20 files in any supported format</li>
            <li><strong>Select target model</strong> &mdash; choose the entity type to attach the documents to (e.g. Settlement, Project)</li>
            <li><strong>Match fields</strong> &mdash; for each file, assign a <strong>Document Type</strong> and a <strong>Parent Entity</strong> from the searchable dropdown. Use the search bar to filter the file list if uploading many files at once</li>
          </ol>

          <h2>Sharing documents</h2>
          <img src="${repoShare1Img}" alt="Share documents dialog" class="docs-screenshot" />
          <p>Select one or more documents using the row checkboxes and click <strong>Share</strong>. Enter the recipient email addresses and an optional expiry date. The system generates a unique token URL that provides access to the selected documents without requiring a KeSMIS login. See <strong>Document Shares</strong> to manage all active share links.</p>

          <h2>Deleting a document</h2>
          <p>Click the <strong>Delete</strong> action on any row and confirm the prompt. Document deletion is restricted to admin users.</p>
        `
      },
      {
        id: 'repo-shares',
        label: 'Document Shares',
        content: `
          <img src="${repoSharesImg}" alt="Document shares listing" class="docs-screenshot" />
          <p>The <strong>Document Shares</strong> page lists all secure share links that have been generated from the repository. Each link gives external stakeholders access to selected documents via a unique token URL, without requiring a KeSMIS account. Navigate here via <strong>Repository &rarr; Document Shares</strong>.</p>

          <h2>Listing</h2>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>#</strong></td><td>Row index</td></tr>
            <tr><td><strong>Shared By</strong></td><td>The KeSMIS user who created the share link</td></tr>
            <tr><td><strong>Documents</strong></td><td>Names of the files included in the share</td></tr>
            <tr><td><strong>Recipients</strong></td><td>Email addresses the link was shared with</td></tr>
            <tr><td><strong>Shared On</strong></td><td>Date and time the share was created</td></tr>
            <tr><td><strong>Expires</strong></td><td>Expiry date of the link. Links past their expiry date are flagged as <em>expired</em>; links expiring within 24 hours are flagged as <em>expiring soon</em></td></tr>
            <tr><td><strong>Actions</strong></td><td>Copy Link, Revoke, Unrevoke</td></tr>
          </tbody></table>

          <h2>Actions</h2>
          <ul>
            <li><strong>Copy Link</strong> &mdash; copies the full token URL to the clipboard so you can send it manually. Disabled for revoked shares</li>
            <li><strong>Revoke</strong> &mdash; immediately deactivates the share link. Anyone with the URL will no longer be able to access the documents</li>
            <li><strong>Unrevoke</strong> &mdash; re-activates a previously revoked link, making it accessible again</li>
          </ul>
          <blockquote>Tip &mdash; Always set an expiry date when creating share links for external reviewers. Use the Revoke action to instantly cut off access if a link is shared in error.</blockquote>
        `
      },
      {
        id: 'repo-imagery',
        label: 'Drone Imagery',
        content: `
          <p>The <strong>Drone Imagery</strong> module stores and serves high-resolution ECW raster layers (drone surveys, aerial photography, satellite imagery) published through GeoServer. Layers are spatially indexed so they can be filtered by county and previewed directly on an interactive map. Navigate here via <strong>Repository &rarr; Drone Imagery</strong>.</p>

          <h2>Listing</h2>
          <img src="${imageryListingImg}" alt="Imagery listing" class="docs-screenshot" />
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Name</strong></td><td>Unique technical identifier for the layer as stored in GeoServer (e.g. <code>sample_imagery_1</code>)</td></tr>
            <tr><td><strong>Title</strong></td><td>Human-readable display name for the layer</td></tr>
            <tr><td><strong>CRS</strong></td><td>Coordinate Reference System of the layer, displayed as the full label (e.g. <em>Arc 1960 / UTM Zone 37S (EPSG:21037)</em>)</td></tr>
            <tr><td><strong>Actions</strong></td><td>View, Edit, Download, Delete</td></tr>
          </tbody></table>

          <h2>Filtering by county</h2>
          <p>Use the <strong>County</strong> dropdown in the toolbar to restrict the listing to layers whose bounding box spatially intersects with the selected county boundary. The toolbar also shows <em>"Showing X of Y imagery layers"</em> when a county filter is active.</p>
          <ul>
            <li>Users with a county-level role have their county pre-selected and the dropdown is disabled — they only ever see layers relevant to their county.</li>
            <li>National and super-admin users can freely switch between counties or clear the filter to see all layers.</li>
          </ul>

          <h2>Selecting a layer</h2>
          <p>Use the <strong>Imagery</strong> dropdown in the toolbar (or double-click any table row) to open the map preview drawer for that layer. The map auto-fits to the layer's extent.</p>

          <h2>Viewing on the map</h2>
          <img src="${imageryView1Img}" alt="Imagery map view 1" class="docs-screenshot" />
          <img src="${imageryView2Img}" alt="Imagery map view 2" class="docs-screenshot" />
          <p>Clicking <strong>View</strong> in the Actions column (or selecting a layer from the dropdown) opens a right-hand drawer containing a Mapbox map. The layer is served as a WMS tile overlay from the KeSMIS GeoServer workspace. Use the navigation controls in the top-right corner of the map to zoom and pan. The map automatically flies to the layer's bounding box on load.</p>

          <h2>Uploading imagery</h2>
          <img src="${imageryAddImg}" alt="Upload imagery dialog" class="docs-screenshot" />
          <p>Click the <strong>+ Upload</strong> button (requires <em>geoserver:create</em> permission) to open the upload dialog. Only <strong>ECW</strong> files are accepted.</p>
          <table><thead><tr><th>Field</th><th>Notes</th></tr></thead><tbody>
            <tr><td><strong>Coordinate System</strong></td><td>Required. Select the CRS that matches the projection of your ECW file.</td></tr>
            <tr><td><strong>Select Files</strong></td><td>Drag-and-drop or browse. Multiple ECW files may be selected for batch upload.</td></tr>
          </tbody></table>
          <p>Supported coordinate systems:</p>
          <table><thead><tr><th>EPSG Code</th><th>Name</th></tr></thead><tbody>
            <tr><td>EPSG:21036</td><td>Arc 1960 / UTM Zone 36S</td></tr>
            <tr><td>EPSG:21096</td><td>Arc 1960 / UTM Zone 36N</td></tr>
            <tr><td>EPSG:21037</td><td>Arc 1960 / UTM Zone 37S (default)</td></tr>
            <tr><td>EPSG:21097</td><td>Arc 1960 / UTM Zone 37N</td></tr>
            <tr><td>EPSG:32637</td><td>WGS 84 / UTM Zone 37N</td></tr>
            <tr><td>EPSG:32636</td><td>WGS 84 / UTM Zone 36N</td></tr>
            <tr><td>EPSG:32737</td><td>WGS 84 / UTM Zone 37S</td></tr>
            <tr><td>EPSG:32736</td><td>WGS 84 / UTM Zone 36S</td></tr>
            <tr><td>EPSG:4326</td><td>WGS 84 (geographic)</td></tr>
            <tr><td>EPSG:3857</td><td>WGS 84 / Web Mercator</td></tr>
          </tbody></table>
          <p>After clicking <strong>Confirm</strong>, each selected file is published as a separate coverage store in the <em>kisip</em> GeoServer workspace. The layer name is derived from the filename (spaces replaced with underscores, extension removed).</p>

          <h2>Editing a layer</h2>
          <img src="${imageryEditImg}" alt="Edit imagery dialog" class="docs-screenshot" />
          <p>Click <strong>Edit</strong> in the Actions column (requires <em>geoserver:update</em> permission) to update the layer's <strong>Name</strong> and <strong>Coordinate System</strong>. The workspace field is read-only. Changes are applied to the live GeoServer layer immediately.</p>

          <h2>Downloading a layer</h2>
          <p>Click <strong>Download</strong> in the Actions column (requires <em>geoserver:read</em> permission) to export the layer as a GeoTIFF file via WCS GetCoverage. The downloaded file is named <code>{layerName}.tif</code>.</p>
          <blockquote>Note &mdash; Very large imagery layers may be too big to download directly. If this occurs, consult the System Administrator for an offline transfer.</blockquote>

          <h2>Deleting a layer</h2>
          <p>Click <strong>Delete</strong> in the Actions column (requires <em>geoserver:delete</em> permission) to permanently remove the layer from GeoServer. The layer is immediately removed from the listing and the imagery dropdown.</p>

          <h2>Permissions summary</h2>
          <table><thead><tr><th>Action</th><th>Required permission</th></tr></thead><tbody>
            <tr><td>View layer on map</td><td>geoserver:read</td></tr>
            <tr><td>Download layer</td><td>geoserver:read</td></tr>
            <tr><td>Upload new layer</td><td>geoserver:create</td></tr>
            <tr><td>Edit layer details</td><td>geoserver:update</td></tr>
            <tr><td>Delete layer</td><td>geoserver:delete</td></tr>
          </tbody></table>
        `
      }
    ]
  },
  {
    id: 'media',
    label: 'Media',
    icon: 'mdi:play-circle-outline',
    roles: ['root_admin', 'super_admin', 'admin', 'staff', 'monitoring', 'grm', 'consultant', 'national_monitoring', 'county_admin'],
    children: [
      {
        id: 'media-overview',
        label: 'Overview',
        content: `
          <p>The <strong>Media</strong> module centralises multimedia content related to programme activities. It is divided into three sections:</p>
          <table><thead><tr><th>Section</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Videos</strong></td><td>YouTube videos from the official KISIP channel, displayed in an embedded card grid.</td></tr>
            <tr><td><strong>Live Streams</strong></td><td>Real-time WebRTC live streams initiated from field devices, viewable directly in the browser.</td></tr>
            <tr><td><strong>Articles</strong></td><td>News articles, press releases and media coverage — each with a cover photo, description, external link and downloadable attachments.</td></tr>
          </tbody></table>
          <h2>Permissions</h2>
          <p>All authenticated users can view media content. Adding, editing and deleting articles requires administrator or editor access (<code>showAdminButtons</code> permission). Live stream viewing is available to all authenticated users.</p>
        `
      },
      {
        id: 'media-videos',
        label: 'Videos',
        content: `
          <p>The <strong>Videos</strong> page displays YouTube videos published on the official KISIP YouTube channel, fetched automatically via the YouTube Data API v3.</p>

          <h2>Video listing</h2>
          <img src="${videoListingImg}" alt="Video listing" class="docs-screenshot" />
          <p>Videos are displayed in a responsive card grid (3 columns on desktop, 2 on tablet, 1 on mobile). Each card shows:</p>
          <ul>
            <li>An embedded YouTube player (inline preview, 200 px height)</li>
            <li>The publication date and time</li>
            <li>A <strong>View Video</strong> button</li>
          </ul>
          <p>Up to 100 most-recent videos are loaded per page, ordered by upload date (newest first).</p>

          <h2>Viewing a video</h2>
          <p>Clicking <strong>View Video</strong> opens a fullscreen dialog (900 px wide) with an embedded YouTube player at full height (600 px) with autoplay enabled. Close the dialog with the <strong>Close</strong> button or by clicking outside the dialog.</p>

          <h2>Technical notes</h2>
          <ul>
            <li>Videos are sourced from a fixed YouTube channel ID configured in the system.</li>
            <li>The YouTube API key is stored in the <code>VITE_APP_YOUTUBE_API</code> environment variable. If the key is missing or quota is exceeded, the grid will be empty and an error will appear in the browser console.</li>
            <li>No video files are stored on the KeSMIS server — all playback is handled by YouTube's embedded player.</li>
          </ul>
        `
      },
      {
        id: 'media-live',
        label: 'Live Streams',
        content: `
          <p>The <strong>Live Streams</strong> page allows users to watch real-time video streams initiated from field devices (phones or cameras) via WebRTC technology. Streams are coordinated through the KeSMIS signaling server.</p>

          <h2>Stream listing</h2>
          <img src="${liveStreamImg}" alt="Live streams listing" class="docs-screenshot" />

          <h2>Mobile view</h2>
          <img src="${liveStreamMobile1Img}" alt="Live streams on mobile" class="docs-screenshot" />
          <img src="${liveStreamMobile2Img}" alt="Live stream player on mobile" class="docs-screenshot" />

          <h2>Connection workflow</h2>
          <ol>
            <li>The page automatically attempts to connect to the signaling server on load.</li>
            <li>The connection status indicator in the top-right of the page shows <strong>CONNECTED</strong> (green) or <strong>DISCONNECTED</strong> (red).</li>
            <li>If auto-connect fails, click the <strong>Connect to Server</strong> button manually.</li>
            <li>Once connected, the stream list is populated automatically.</li>
            <li>The list refreshes every <strong>30 seconds</strong> while no stream is being watched.</li>
          </ol>

          <h2>Stream listing columns</h2>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Streamer</strong></td><td>Name of the user broadcasting the stream.</td></tr>
            <tr><td><strong>Location</strong></td><td>Ward, Sub-county and County of the stream origin.</td></tr>
            <tr><td><strong>Start Time</strong></td><td>How long ago the stream started (e.g. "5m ago", "2h 10m ago"). Streams older than 24 hours show the full date.</td></tr>
            <tr><td><strong>Stream ID</strong></td><td>Truncated unique identifier for the stream (first 8 characters shown).</td></tr>
            <tr><td><strong>Status</strong></td><td>Current stream state — <em>LIVE</em> (green) for active streams.</td></tr>
            <tr><td><strong>Actions</strong></td><td>A <strong>Watch</strong> button, enabled only when connected to the server.</td></tr>
          </tbody></table>

          <h2>Watching a stream</h2>
          <img src="${liveStreamWatchImg}" alt="Live stream watch view" class="docs-screenshot" />
          <ol>
            <li>Ensure the status shows <strong>CONNECTED</strong>.</li>
            <li>Click <strong>Watch</strong> on any active stream row.</li>
            <li>A video dialog opens with the stream title, streamer name, and a live video player.</li>
            <li>The player uses WebRTC — click the video area if it does not start automatically (required by some browsers as a user-gesture).</li>
            <li>Click <strong>Close</strong> or the dialog X button to stop watching and release the WebRTC connection.</li>
          </ol>

          <h2>Refreshing streams</h2>
          <p>Click the <strong>Refresh Streams</strong> button at any time to manually fetch the latest stream list from the signaling server. Auto-refresh is paused while a stream is being watched to avoid interrupting playback.</p>

          <h2>Technical notes</h2>
          <ul>
            <li>The signaling server is proxied through <code>/stream</code> on the KeSMIS nginx server.</li>
            <li>WebRTC requires a modern browser with WebRTC support (Chrome, Firefox, Edge, Safari 15+).</li>
            <li>Streams are broadcast from the SlumMapper mobile app or compatible devices.</li>
            <li>If the signaling server is unreachable, the stream list will be empty and an error will be shown.</li>
          </ul>
        `
      },
      {
        id: 'media-articles',
        label: 'Articles',
        content: `
          <p>The <strong>Articles</strong> section manages news articles, press releases, blog posts and media coverage related to the KISIP programme. Each article has a cover photo, summary description, an external link and optional downloadable attachments (e.g. newspaper cuttings, PDFs).</p>

          <h2>Article listing</h2>
          <img src="${articlesListingImg}" alt="Articles listing" class="docs-screenshot" />
          <p>Articles are displayed in a responsive card grid (3 columns on desktop, 2 on tablet, 1 on mobile). Each card shows:</p>
          <ul>
            <li><strong>Title</strong> (truncated to 1 line in the card header; hover to see the full title in a popover)</li>
            <li><strong>Cover photo</strong> (150 px tall; fetched from the document store)</li>
            <li><strong>Description</strong> (truncated to 3 lines)</li>
            <li><strong>Read Full Story</strong> link — opens the external article URL in a new tab</li>
            <li><strong>Attachments</strong> — a list of downloadable files attached to the article (e.g. scanned newspaper cuttings)</li>
            <li><strong>Edit</strong> and <strong>Delete</strong> action buttons (admin only)</li>
          </ul>

          <h2>Searching articles</h2>
          <p>Use the search bar at the top to filter articles by title keyword. Type part of a title and the list updates automatically. Click the <strong>Filter (Clear)</strong> button to reset the search and reload all articles.</p>

          <h2>Adding an article</h2>
          <img src="${articlesAddImg}" alt="Add article dialog" class="docs-screenshot" />
          <p>Click the <strong>+</strong> button (admin only) to open the two-step Add Article dialog:</p>
          <h3>Step 1 — Details</h3>
          <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Article Title</strong></td><td>Yes</td><td>Full title of the article or press release.</td></tr>
            <tr><td><strong>Type</strong></td><td>Yes</td><td>Media type — <em>TV</em>, <em>Article</em>, <em>Blog</em>, or <em>Newspaper</em>.</td></tr>
            <tr><td><strong>Link</strong></td><td>No</td><td>URL to the full article online (e.g. newspaper website, blog post).</td></tr>
          </tbody></table>
          <h3>Step 2 — Media</h3>
          <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Description</strong></td><td>Yes</td><td>Summary or body text for the article.</td></tr>
            <tr><td><strong>Cover Photo</strong></td><td>Yes</td><td>A single image file used as the card thumbnail. Accepted formats: any image type (JPEG, PNG, etc.). Limited to 1 file.</td></tr>
            <tr><td><strong>Other Documents</strong></td><td>No</td><td>Additional attachments such as newspaper cuttings, PDFs or supporting files. Multiple files allowed.</td></tr>
          </tbody></table>
          <p>Click <strong>Submit</strong> to save the article. The record is created first, then the cover photo and other documents are uploaded and linked automatically.</p>

          <h2>Editing an article</h2>
          <p>Click the <strong>Edit</strong> (pencil) button on any article card to open the same dialog pre-filled with the article's current data. Update the fields as needed and click <strong>Save</strong>. A new cover photo or additional attachments can be added; existing attachments can be removed individually using the delete icon next to each file in the upload list.</p>

          <h2>Deleting an article</h2>
          <p>Click the <strong>Delete</strong> (bin) button on any article card (admin only) to remove the article and all its associated files permanently.</p>

          <h2>Downloading attachments</h2>
          <p>In the <em>Attachments</em> section of each card, click the file name to download it directly. The file is streamed from the server and saved with its original filename.</p>

          <h2>Guided tour</h2>
          <p>Inside the Add/Edit dialog, click the <strong>Help</strong> (info) button in the footer to launch a step-by-step guided tour that explains each field.</p>
        `
      }
    ]
  },
  {
    id: 'users',
    label: 'Users & Access',
    icon: 'mdi:shield-account-outline',
    roles: ['root_admin', 'super_admin', 'admin'],
    children: [
      {
        id: 'users-listing',
        label: 'User Listing & Filtering',
        content: `
          <p>The <strong>Users</strong> section lists all system users and provides filtering, search, and export tools. Users are organised into sub-views accessible from the top navigation: <em>All</em>, <em>Admin</em>, <em>GRM</em>, <em>Support</em>, and <em>New Accounts</em>.</p>
          <img src="${userListingImg}" alt="User listing" class="docs-screenshot" />

          <h2>Table columns</h2>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>#</strong></td><td>Row number.</td></tr>
            <tr><td><strong>Avatar</strong></td><td>User's profile photo.</td></tr>
            <tr><td><strong>Name</strong></td><td>Full name of the user.</td></tr>
            <tr><td><strong>Username</strong></td><td>Login username.</td></tr>
            <tr><td><strong>Country</strong></td><td>Country of the user.</td></tr>
            <tr><td><strong>Organization</strong></td><td>Organisation affiliation.</td></tr>
            <tr><td><strong>County</strong></td><td>Assigned county.</td></tr>
            <tr><td><strong>Operations</strong></td><td>Activate/deactivate switch and Edit button (permission-gated).</td></tr>
          </tbody></table>

          <h2>Filtering</h2>
          <p>Use the filter bar above the table to narrow results:</p>
          <ul>
            <li><strong>Filter by County</strong> — multi-select dropdown; choose one or more counties to show only users assigned to those counties.</li>
            <li><strong>Search by name, username, email or phone</strong> — remote search field; type to filter results in real time.</li>
            <li><strong>Clear filters</strong> (Filter icon button) — resets all active filters and reloads the full list.</li>
          </ul>

          <h2>Pagination</h2>
          <p>Results are paginated. Use the page size selector (5 / 10 / 20 / 50 / 100 per page) and the page navigation at the bottom of the table. Page changes respect any active filters.</p>

          <h2>Exporting users</h2>
          <p>Click the <strong>Download</strong> (arrow) button in the toolbar to export the current user list to an Excel (.xlsx) file. The export includes: Name, Email, Username, Phone, and County columns. A second <strong>Download All</strong> button exports all records without pagination limits.</p>
        `
      },
      {
        id: 'users-activation',
        label: 'Activation & Deactivation',
        content: `
          <p>User accounts can be enabled or disabled without being deleted. This controls whether a user can log in to KeSMIS.</p>
          <img src="${userActivationImg}" alt="User activation toggle" class="docs-screenshot" />

          <h2>Toggling a user's status</h2>
          <ol>
            <li>Locate the user in the table.</li>
            <li>In the <strong>Operations</strong> column, click the <strong>toggle switch</strong> next to the user's row.</li>
            <li>The switch turns <em>green</em> for active accounts and <em>grey</em> for inactive ones.</li>
            <li>A loading spinner appears on the switch while the change is being saved.</li>
            <li>A success or error message confirms the outcome.</li>
          </ol>

          <h2>Permission required</h2>
          <p>Only users with the <code>user:activate</code> permission can toggle the status. Users without this permission see a disabled (read-only) switch. Attempting to toggle without permission will show an error message.</p>

          <h2>On mobile</h2>
          <p>On small screens the Operations column is replaced by a dropdown menu (chevron icon). Expand it to access the activate/deactivate switch and the Edit action.</p>

          <h2>Effect of deactivation</h2>
          <p>Deactivated users cannot log in. Their data and history remain intact. Reactivating the account restores full access based on their assigned role.</p>
        `
      },
      {
        id: 'users-roles',
        label: 'Rights & Role Allocation',
        content: `
          <p>KeSMIS uses <strong>role-based access control (RBAC)</strong>. Each role carries a set of permissions that determine what a user can see and do across all modules. Roles are managed from the <strong>Roles</strong> page, accessible via the Users section sidebar.</p>
          <img src="${userRolesImg}" alt="Roles and permissions" class="docs-screenshot" />

          <h2>Allocating a role and location to a user</h2>
          <p>Click the <strong>Edit</strong> (pencil) button on any user row to open the User Details dialog. This is where you assign both the user's <strong>role</strong> and their <strong>geographic scope</strong>. Each role assignment has three components: the role itself, the access level, and the specific location tied to that level.</p>

          <h3>Dialog fields</h3>
          <table><thead><tr><th>Field</th><th>Editable</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Name</strong></td><td>Yes</td><td>Full display name of the user.</td></tr>
            <tr><td><strong>Email</strong></td><td>No</td><td>Login email — read-only after registration.</td></tr>
            <tr><td><strong>Username</strong></td><td>No</td><td>System username — read-only after registration.</td></tr>
            <tr><td><strong>Phone</strong></td><td>Yes</td><td>Contact phone number.</td></tr>
            <tr><td><strong>Role</strong></td><td>Yes</td><td>The system role to assign (e.g. Admin, Staff, GRM).</td></tr>
            <tr><td><strong>Level</strong></td><td>Yes</td><td>The geographic scope of the role — National, County, or Settlement. Controls which data the user can access under that role.</td></tr>
            <tr><td><strong>County</strong></td><td>Yes</td><td>Required for County and Settlement levels. Disabled when Level is set to National.</td></tr>
            <tr><td><strong>Settlement</strong></td><td>Yes</td><td>Required for Settlement level only. Disabled until a County is selected and Level is set to Settlement. Type to search by name.</td></tr>
          </tbody></table>

          <h3>Access levels explained</h3>
          <table><thead><tr><th>Level</th><th>Scope</th><th>County required</th><th>Settlement required</th></tr></thead><tbody>
            <tr><td><strong>National</strong></td><td>User can access data across all counties and settlements.</td><td>No</td><td>No</td></tr>
            <tr><td><strong>County</strong></td><td>User is restricted to data within the selected county.</td><td>Yes</td><td>No</td></tr>
            <tr><td><strong>Settlement</strong></td><td>User is restricted to data within a specific settlement inside the selected county.</td><td>Yes</td><td>Yes</td></tr>
          </tbody></table>

          <h3>How to assign a role</h3>
          <ol>
            <li>Select the <strong>Role</strong> from the dropdown in the roles table row.</li>
            <li>Select the <strong>Level</strong> — National, County, or Settlement.</li>
            <li>If County or Settlement level, choose the <strong>County</strong> from the dropdown.</li>
            <li>If Settlement level, type in the <strong>Settlement</strong> field to search and select the specific settlement.</li>
            <li>Click <strong>Confirm</strong> to save. The user's access updates immediately on their next page load.</li>
          </ol>

          <p><em>Note: County-level administrators can only assign roles within their own county and cannot grant National-level access.</em></p>

          <h2>Standard built-in roles</h2>
          <table><thead><tr><th>Role</th><th>Typical access level</th></tr></thead><tbody>
            <tr><td><strong>Admin</strong></td><td>Manage users, settlements, data, and most modules.</td></tr>
            <tr><td><strong>Staff</strong></td><td>Data entry and read access across core modules.</td></tr>
            <tr><td><strong>Monitoring</strong></td><td>M&amp;E-focused access — indicators, reports, beneficiaries.</td></tr>
            <tr><td><strong>GRM</strong></td><td>Grievance intake, updates, resolution workflow.</td></tr>
            <tr><td><strong>GBV</strong></td><td>Restricted access to GBV case records only.</td></tr>
            <tr><td><strong>Consultant</strong></td><td>Read-only access across most modules.</td></tr>
            <tr><td><strong>Support</strong></td><td>Technical support; limited admin tools.</td></tr>
          </tbody></table>
        `
      },
      {
        id: 'users-reset-password',
        label: 'Reset Password',
        content: `
          <p>Administrators can trigger a password reset for any user directly from the user listing. The reset sends instructions to the user's registered email or phone number.</p>
          <img src="${userResetPasswordImg}" alt="Reset password" class="docs-screenshot" />

          <h2>How to reset a user's password</h2>
          <ol>
            <li>Locate the user in any user listing view (All, Admin, GRM, Support, etc.).</li>
            <li>In the <strong>Operations</strong> column, click the <strong>Reset Password</strong> button (key icon).</li>
            <li>A loading spinner appears on the button while the request is being processed.</li>
            <li>A success message confirms that reset instructions have been sent.</li>
          </ol>

          <h2>How the reset is delivered</h2>
          <ul>
            <li>If the user has an <strong>email</strong> address on file, reset instructions are sent to that email.</li>
            <li>If no email is recorded but a <strong>phone number</strong> is available, the reset is sent via SMS.</li>
            <li>The button is disabled if the user has neither an email nor a phone number on record.</li>
          </ul>

          <h2>Permission required</h2>
          <p>Only users with the <code>user:reset_password</code> permission can trigger a reset. The button is hidden or disabled for users without this permission.</p>

          <h2>On mobile</h2>
          <p>On small screens the reset option is listed inside the row's dropdown menu (chevron icon) alongside Edit and Activate actions.</p>
        `
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'mdi:cog-outline',
    roles: ['root_admin', 'super_admin', 'admin'],
    children: [
      {
        id: 'settings-sms',
        label: 'SMS Settings',
        content: `
          <p>The <strong>SMS Settings</strong> section configures the modules and features that send SMS notifications — including grievance updates, OTP verification codes, and system alerts. It is organised into three tabs:</p>

          <h2>Grievances tab</h2>
          <p>Enable or disable SMS notifications triggered by grievance workflow events (e.g. new grievance received, status update, resolution). Toggle the switch next to each event to turn it on or off.</p>
          <img src="${smsSettings1Img}" alt="SMS Settings — Grievances tab" class="docs-screenshot" />

          <h2>Incidents tab</h2>
          <p>Enable or disable SMS alerts for incident reporting events. Each incident-related notification type can be toggled independently.</p>
          <img src="${smsSettings2Img}" alt="SMS Settings — Incidents tab" class="docs-screenshot" />

          <h2>Other Settings tab</h2>
          <p>Additional SMS-related module toggles that do not fall under grievances or incidents. Use this tab to enable or disable miscellaneous notification types.</p>
          <img src="${smsSettings3Img}" alt="SMS Settings — Other Settings tab" class="docs-screenshot" />

          <h2>Saving changes</h2>
          <p>After adjusting toggles across any tab, click <strong>Save All Changes</strong> to persist the configuration. Click <strong>Refresh</strong> to reload the current saved state and discard unsaved changes.</p>
        `
      },
      {
        id: 'settings-climate',
        label: 'Climate Settings',
        content: `
          <p>The <strong>Climate Settings</strong> section controls the scoring matrix used by the Climate Risk Assessment module. It is split into two tabs:</p>

          <h2>Score tab</h2>
          <p>Defines the vulnerability rating bands. Each row in the table represents a rating level with editable <strong>Min Score</strong> and <strong>Max Score</strong> fields. Boundaries are synchronised — the max of one band automatically becomes the min of the next to prevent gaps or overlaps.</p>
          <img src="${climateScoreImg}" alt="Climate Settings — Score tab" class="docs-screenshot" />

          <h2>Matrix Weights tab</h2>
          <p>Sets the weighting scores for individual hazard and vulnerability attributes used in the climate questionnaire. Attributes are grouped into collapsible sections by type:</p>
          <ul>
            <li><strong>Temperature</strong></li>
            <li><strong>Rainfall</strong></li>
            <li><strong>Drought</strong></li>
            <li><strong>Soil Erosion</strong></li>
            <li><strong>Landslide</strong></li>
            <li><strong>Food Insecurity</strong></li>
            <li><strong>Pollution</strong></li>
            <li><strong>Moisture Content</strong></li>
            <li><strong>Flash Floods</strong></li>
            <li><strong>Flooding</strong></li>
          </ul>
          <p>Expand any section to adjust the weight values for that hazard. Higher weights increase the contribution of that factor to the overall vulnerability score.</p>
          <img src="${climateWeightsImg}" alt="Climate Settings — Matrix Weights tab" class="docs-screenshot" />

          <h2>Saving changes</h2>
          <p>Click <strong>Save Changes</strong> to apply the updated matrix. Click <strong>Refresh</strong> to reload the last saved configuration.</p>
        `
      }
    ]
  },
  {
    id: 'configurations',
    label: 'Configurations',
    icon: 'mdi:tune-vertical',
    roles: ['root_admin', 'super_admin', 'admin'],
    children: [
      {
        id: 'config-overview',
        label: 'Overview',
        content: `
          <p><strong>Configurations</strong> covers national-level administrative setup that underpins the entire system. These are typically configured once during system setup and updated infrequently.</p>
          <table><thead><tr><th>Section</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Common</strong></td><td>Document classification — document categories and types.</td></tr>
            <tr><td><strong>Programme</strong></td><td>Defines the intervention project route — programmes, components, and project types build the URL hierarchy used to navigate intervention projects.</td></tr>
            <tr><td><strong>Dashboards</strong></td><td>Dynamic dashboard builder — manage dashboards and their nested cards, sections, and charts.</td></tr>
            <tr><td><strong>Admin Units</strong></td><td>Geographic hierarchy — counties, sub-counties, and wards.</td></tr>
          </tbody></table>
        `
      },
      {
        id: 'config-common',
        label: 'Common',
        content: `
          <p>The <strong>Common</strong> section manages document classification used across the document repository.</p>

          <h2>Document Categories</h2>
          <p>Top-level groupings for the document repository (e.g. Legal, Technical, Financial).</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>#</strong></td><td>Row index.</td></tr>
            <tr><td><strong>Title</strong></td><td>Category name.</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
          </tbody></table>
          <p><strong>Add/Edit:</strong> Enter a <em>Title</em> for the document category.</p>
          <img src="${documentCategoriesImg}" alt="Document Categories configuration" class="docs-screenshot" />

          <h2>Document Types</h2>
          <p>Specific document types nested under a document category (e.g. "Survey Report" under "Technical").</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>ID</strong></td><td>Record ID.</td></tr>
            <tr><td><strong>Type</strong></td><td>Document type name.</td></tr>
            <tr><td><strong>Group</strong></td><td>Parent document category.</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
          </tbody></table>
          <p><strong>Add/Edit fields:</strong></p>
          <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Category</strong></td><td>Select the parent document category from the dropdown.</td></tr>
            <tr><td><strong>Title</strong></td><td>Name of the document type.</td></tr>
          </tbody></table>
          <img src="${documentTypesImg}" alt="Document Types configuration" class="docs-screenshot" />
        `
      },
      {
        id: 'config-programme',
        label: 'Programme',
        content: `
          <p>The <strong>Programme</strong> section is where the <strong>intervention project routes</strong> are defined. At login, the system dynamically builds the navigation tree by fetching Programmes and Components from the API and assembling them into a nested route hierarchy under <code>/subprogrammes</code>. The <strong>Acronym</strong> field on every record is lowercased and used directly as the URL path segment — it is the single most important field to get right.</p>

          <h2>How the route is built</h2>
          <p>The route generation works in two passes:</p>
          <ol>
            <li><strong>Programmes pass</strong> — all programme records are fetched and nested by their <em>Parent</em> relationship, building a tree. Each programme's acronym becomes its route segment.</li>
            <li><strong>Components pass</strong> — all component records are fetched and matched to their parent programme via <code>programme_id</code>, then attached as children of that programme node. Each component's acronym becomes the next route segment and resolves to the <strong>Interventions</strong> listing view.</li>
          </ol>
          <p>The resulting URL pattern is:</p>
          <blockquote><code>/subprogrammes/{programme-acronym}/[{sub-programme-acronym}/]{component-acronym}</code></blockquote>
          <p>For example: a Programme <em>KISIP 2</em> (acronym <code>kisip2</code>), a child programme <em>Institutional Capacity</em> (acronym <code>institutionalcapacity</code>), and a Component <em>Capacity X</em> (acronym <code>capacityx</code>) produces:</p>
          <blockquote><code>/subprogrammes/kisip2/institutionalcapacity/capacityx</code></blockquote>
          <p><strong>Warning:</strong> Changing an acronym after routes are in use will break existing bookmarks and links. Set acronyms carefully before going live.</p>
          <img src="${programmesComponentsImg}" alt="Programmes and Components configuration" class="docs-screenshot" />

          <h2>Programmes</h2>
          <p>Top-level programme definitions. Programme nesting is <strong>unlimited</strong> — any programme can be set as a child of another via the <em>Parent</em> field, and that child can itself have children, and so on. Each level of nesting adds one more segment to the route URL.</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>#</strong></td><td>Row index.</td></tr>
            <tr><td><strong>Title</strong></td><td>Programme name.</td></tr>
            <tr><td><strong>Acronym</strong></td><td>Lowercased to form the URL path segment for this programme level.</td></tr>
            <tr><td><strong>Description</strong></td><td>Brief description.</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
          </tbody></table>
          <p><strong>Add/Edit fields:</strong></p>
          <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Title</strong></td><td>Programme name.</td></tr>
            <tr><td><strong>Parent</strong></td><td>Optional parent programme — nests this programme one level deeper in the route tree.</td></tr>
            <tr><td><strong>Acronym</strong></td><td>Becomes the route segment. Use short, URL-safe values with no spaces.</td></tr>
            <tr><td><strong>Description</strong></td><td>Summary of the programme's purpose.</td></tr>
            <tr><td><strong>Icon</strong></td><td>Icon identifier for display in the navigation menu.</td></tr>
          </tbody></table>

          <h2>Components</h2>
          <p>Components are the <strong>leaf nodes</strong> of the route tree — they are the last segment in the URL and render the Interventions project listing. Each component is matched to its parent programme via <code>programme_id</code> and attached as a child route at login.</p>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>ID</strong></td><td>Record ID.</td></tr>
            <tr><td><strong>Title</strong></td><td>Component name.</td></tr>
            <tr><td><strong>Acronym</strong></td><td>Lowercased to form the final URL segment for this component.</td></tr>
            <tr><td><strong>Programme</strong></td><td>Parent programme this component belongs to.</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
          </tbody></table>
          <p><strong>Add/Edit fields:</strong></p>
          <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Title</strong></td><td>Component name.</td></tr>
            <tr><td><strong>Acronym</strong></td><td>Becomes the route's final path segment. Must be unique within its programme.</td></tr>
            <tr><td><strong>Intervention Area</strong></td><td>Domain this component belongs to (dropdown).</td></tr>
            <tr><td><strong>Programme</strong></td><td>Parent programme (dropdown) — determines where in the route tree this component is attached.</td></tr>
            <tr><td><strong>Icon</strong></td><td>Icon identifier.</td></tr>
          </tbody></table>
        `
      },
      {
        id: 'config-admin-units',
        label: 'Admin Units',
        content: `
          <p>The <strong>Admin Units</strong> section manages the three-level geographic hierarchy — Counties → Sub-counties → Wards — that underpins all location-based filtering, user assignment, and data scoping across the system. These boundaries are used for settlement registration, user assignment, and data filtering throughout the platform. Upload counties first, then sub-counties, then wards — each level depends on the one above being in place.</p>

          <h2>Counties</h2>
          <img src="${adminCountyListingImg}" alt="Counties listing" class="docs-screenshot" />
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>#</strong></td><td>Row index.</td></tr>
            <tr><td><strong>Name</strong></td><td>County name.</td></tr>
            <tr><td><strong>Code</strong></td><td>Official county code.</td></tr>
            <tr><td><strong>Area (km²)</strong></td><td>Calculated automatically from the uploaded GeoJSON boundary.</td></tr>
            <tr><td><strong>Settlements</strong></td><td>Live count of settlements registered within this county.</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
          </tbody></table>

          <h2>Add / Edit a County</h2>
          <img src="${adminCountyAddImg}" alt="Add county form" class="docs-screenshot" />
          <img src="${adminCountyEditImg}" alt="Edit county form" class="docs-screenshot" />
          <p>Click <strong>Add County</strong> or the edit icon on a row. All three fields are required.</p>
          <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Name</strong></td><td>Yes</td><td>Full official county name as it should appear across the system.</td></tr>
            <tr><td><strong>Code</strong></td><td>Yes</td><td>Official numeric or alphanumeric county identifier (e.g. <em>047</em> for Nairobi). Used for data matching and exports.</td></tr>
            <tr><td><strong>Geometry</strong></td><td>Yes</td><td>Upload a GeoJSON file containing the county boundary polygon. The system calculates the area (km²) automatically on save. Ensure the geometry is valid and uses WGS84 coordinates before uploading.</td></tr>
          </tbody></table>
          <blockquote>Note — deleting a county will affect all sub-counties, wards, and settlements linked to it. Ensure any reassignment is done before deleting.</blockquote>

          <h2>Sub-counties</h2>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>#</strong></td><td>Row index.</td></tr>
            <tr><td><strong>Name</strong></td><td>Sub-county name.</td></tr>
            <tr><td><strong>County</strong></td><td>Parent county.</td></tr>
            <tr><td><strong>Code</strong></td><td>Sub-county code.</td></tr>
            <tr><td><strong>Area (km²)</strong></td><td>Calculated automatically from the uploaded GeoJSON boundary.</td></tr>
            <tr><td><strong>Settlements</strong></td><td>Live count of settlements in this sub-county.</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
          </tbody></table>

          <h2>Add / Edit a Sub-county</h2>
          <p>Click <strong>Add Sub-county</strong> or the edit icon on a row. All fields are required. Counties must already exist before sub-counties can be created.</p>
          <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Name</strong></td><td>Yes</td><td>Full official sub-county name as it should appear across the system.</td></tr>
            <tr><td><strong>Code</strong></td><td>Yes</td><td>Official sub-county identifier. Used for data matching and exports.</td></tr>
            <tr><td><strong>County</strong></td><td>Yes</td><td>Parent county (dropdown). The sub-county will be scoped under the selected county for all filtering, reporting, and user assignment throughout the system.</td></tr>
            <tr><td><strong>Geometry</strong></td><td>Yes</td><td>Upload a GeoJSON file containing the sub-county boundary polygon. Area is auto-calculated on save. Ensure the boundary falls within the parent county geometry and uses WGS84 coordinates.</td></tr>
          </tbody></table>
          <blockquote>Note — deleting a sub-county will affect all wards and settlements linked to it. Reassign any dependent records before deleting.</blockquote>

          <h2>Wards</h2>
          <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>#</strong></td><td>Row index.</td></tr>
            <tr><td><strong>Name</strong></td><td>Ward name.</td></tr>
            <tr><td><strong>County</strong></td><td>Parent county.</td></tr>
            <tr><td><strong>Sub-county</strong></td><td>Parent sub-county.</td></tr>
            <tr><td><strong>Code</strong></td><td>Ward code.</td></tr>
            <tr><td><strong>Area (km²)</strong></td><td>Calculated automatically from the uploaded GeoJSON boundary.</td></tr>
            <tr><td><strong>Settlements</strong></td><td>Live count of settlements in this ward.</td></tr>
            <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
          </tbody></table>

          <h2>Add / Edit a Ward</h2>
          <p>Click <strong>Add Ward</strong> or the edit icon on a row. All fields are required. Both the parent county and sub-county must already exist before a ward can be created.</p>
          <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Name</strong></td><td>Yes</td><td>Full official ward name as it should appear across the system.</td></tr>
            <tr><td><strong>Code</strong></td><td>Yes</td><td>Official ward identifier. Used for data matching and exports.</td></tr>
            <tr><td><strong>County</strong></td><td>Yes</td><td>Parent county (dropdown). Selecting a county immediately filters the Sub-county dropdown to only show sub-counties that belong to it — do not skip this step.</td></tr>
            <tr><td><strong>Sub-county</strong></td><td>Yes</td><td>Parent sub-county (dropdown, dependent on the county selection above). The ward will be scoped under the selected sub-county for all filtering, reporting, and settlement registration.</td></tr>
            <tr><td><strong>Geometry</strong></td><td>Yes</td><td>Upload a GeoJSON file containing the ward boundary polygon. Area is auto-calculated on save. Ensure the boundary falls within the parent sub-county geometry and uses WGS84 coordinates.</td></tr>
          </tbody></table>
          <blockquote>Note — deleting a ward will affect settlements registered within it. Reassign any dependent records before deleting.</blockquote>

          <h2>Map Locator</h2>
          <p>The <strong>Map Locator</strong> tool provides a quick way to look up the county, sub-county and ward for any point on the map. Open it from <strong>Settings → Admin Units → Map Locator</strong>.</p>
          <img src="${adminCountyLocatorImg}" alt="Admin unit map locator" class="docs-screenshot" />
          <ul>
            <li><strong>Click on the map</strong> to drop a marker and automatically identify the county, sub-county and ward at that location.</li>
            <li><strong>Search by place name or coordinates</strong> &mdash; type a place name (e.g. <em>“Kisumu CBD”</em>) or coordinates (<code>lat, lon</code>) and press <strong>Enter</strong> or click <strong>Locate</strong> to zoom to that point.</li>
            <li><strong>Popup details</strong> &mdash; a small popup shows the clicked coordinates plus the county, sub-county and ward names and IDs.</li>
            <li><strong>Copy helper</strong> &mdash; use the <em>Copy</em> button in the popup to copy the coordinates and admin-unit details for pasting into other workflows (e.g. SEC, GRC, settlement registration).</li>
          </ul>
        `
      }
    ],
    subgroups: [
      {
        id: 'config-dashboards',
        label: 'Dashboards',
        icon: 'mdi:view-dashboard-outline',
        children: [
          {
            id: 'config-dashboards-list',
            label: 'Dashboards',
            content: `
              <p>The <strong>Dashboards</strong> configuration controls the dynamic dashboards displayed on the home screen. Each dashboard is a named container that groups cards, sections, and charts. Configure the dashboard list here, then use the nested sections to manage its cards, sections, and charts.</p>
              <img src="${dashboardsListImg}" alt="Dashboards listing" class="docs-screenshot" />
              <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>#</strong></td><td>Row index.</td></tr>
                <tr><td><strong>Title</strong></td><td>Dashboard name.</td></tr>
                <tr><td><strong>Description</strong></td><td>Purpose of the dashboard.</td></tr>
                <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
              </tbody></table>
              <h2>Add / Edit a Dashboard</h2>
              <p>Click <strong>Add Dashboard</strong> to create a new one, or the edit icon on any row to modify an existing dashboard. The form fields are:</p>
              <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Title</strong></td><td>The dashboard name as it appears on the navigation tab.</td></tr>
                <tr><td><strong>Type</strong></td><td><em>Intervention</em> — scoped to programme/project data. <em>Status</em> — scoped to settlement and operational status data. This determines which data sources are available when building charts for this dashboard.</td></tr>
                <tr><td><strong>Main</strong></td><td>Marks this dashboard as the default landing dashboard. Only one dashboard should have this enabled at a time.</td></tr>
                <tr><td><strong>Public</strong></td><td>When enabled, the dashboard is visible to all logged-in users regardless of their role. When disabled, visibility is controlled by role permissions.</td></tr>
                <tr><td><strong>Icon</strong></td><td>Iconify icon identifier for the dashboard tab (e.g. <code>mdi:chart-bar</code>).</td></tr>
                <tr><td><strong>Description</strong></td><td>Internal notes describing the dashboard's purpose — not shown to end users.</td></tr>
              </tbody></table>
            `
          },
          {
            id: 'config-dashboards-cards',
            label: 'Cards',
            content: `
              <p><strong>Cards</strong> are the summary statistic tiles displayed in a row at the top of a dashboard. Each card surfaces a single key metric — such as total registered settlements, active projects, or households — giving users an at-a-glance overview before they drill into charts or tables. Cards are linked to a parent dashboard and their values are computed dynamically from live system data.</p>
              <img src="${dashboardsCardsListImg}" alt="Dashboard Cards listing" class="docs-screenshot" />
              <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>ID</strong></td><td>Record ID.</td></tr>
                <tr><td><strong>Dashboard</strong></td><td>Parent dashboard this card belongs to.</td></tr>
                <tr><td><strong>Title</strong></td><td>Card label shown on the dashboard.</td></tr>
                <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
              </tbody></table>
              <h2>Add / Edit a Card</h2>
              <p>Click <strong>Add Card</strong> or the edit icon on an existing row to open the card builder. The form is split into four steps.</p>
              <img src="${dashboardsCardsAddEditButtonsImg}" alt="Dashboard Cards add/edit buttons" class="docs-screenshot" />
              <img src="${dashboardsCardsAddEditFormImg}" alt="Dashboard Cards add/edit form" class="docs-screenshot" />

              <h3>Step 1 — Details</h3>
              <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Dashboard</strong></td><td>Yes</td><td>The parent dashboard this card will appear on.</td></tr>
                <tr><td><strong>Title</strong></td><td>Yes (min 3 chars)</td><td>Label displayed on the card tile. Keep it short and descriptive — e.g. <em>Total Settlements</em>, <em>Active Projects</em>.</td></tr>
                <tr><td><strong>Description</strong></td><td>Yes</td><td>Internal note describing what the card measures.</td></tr>
              </tbody></table>

              <h3>Step 2 — Icon</h3>
              <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Icon</strong></td><td>Yes</td><td>Iconify icon identifier shown on the card tile (e.g. <code>mdi:home-city</code>). Browse available icons at <em>icon-sets.iconify.design</em>.</td></tr>
                <tr><td><strong>Icon Color</strong></td><td>Yes</td><td>Colour applied to the icon. Use the colour picker or enter a hex value.</td></tr>
              </tbody></table>

              <h3>Step 3 — Computation</h3>
              <p>Defines where the card's value comes from. The <strong>Category</strong> field controls which sub-fields appear.</p>
              <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Category</strong></td><td>Yes</td><td><em>Status</em> — pulls data from a system entity (e.g. Settlements, Projects). <em>Indicator</em> — pulls data from M&amp;E indicator records.</td></tr>
                <tr><td><strong>Entity</strong></td><td>Yes (Status only)</td><td>The system model to aggregate (e.g. Settlement, Project, Household). Determines which fields are available for aggregation.</td></tr>
                <tr><td><strong>Aggregation Field</strong></td><td>Yes (Status only)</td><td>The specific field on the entity to aggregate (e.g. <em>id</em> for count, <em>area</em> for sum).</td></tr>
                <tr><td><strong>Select Indicator</strong></td><td>Yes (Indicator only)</td><td>The indicator category whose reported values the card will display.</td></tr>
                <tr><td><strong>Aggregation</strong></td><td>Yes</td><td>How to compute the value — <em>Count</em> (number of records), <em>Sum</em> (total of the field), or <em>Average</em> (mean of the field).</td></tr>
              </tbody></table>

              <h3>Step 4 — Computation Settings</h3>
              <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Computation</strong></td><td>Yes</td><td><em>Absolute</em> — shows the raw computed value. <em>Proportion (%)</em> — expresses the value as a percentage of the total record count.</td></tr>
                <tr><td><strong>Filter</strong></td><td>No</td><td>Toggle on to add one or more conditions that narrow the dataset before computing the card value.</td></tr>
                <tr><td><strong>Filter rows</strong></td><td>No</td><td>Each filter row has three parts: <em>Field</em> (the entity field to filter on), <em>Operation</em> (All / Equal for text fields; All / Less Than / Less Than or Equal / Equal / Greater Than or Equal for numeric fields), and <em>Value</em> (one or more values to match). Multiple rows are combined with AND logic.</td></tr>
              </tbody></table>
              <blockquote>Tip — the order cards appear on the dashboard follows the order they were created. To reorder, delete and recreate them in the desired sequence.</blockquote>
            `
          },
          {
            id: 'config-dashboards-sections',
            label: 'Sections',
            content: `
              <p><strong>Sections</strong> are the tabs displayed beneath the cards on a dashboard. Each section groups a set of charts and appears as a clickable tab label. Users switch between sections to view different chart groups without leaving the dashboard. Sections are linked to a parent dashboard and must be created before charts can be assigned to them.</p>
              <img src="${dashboardsTabsListImg}" alt="Dashboard Sections listing" class="docs-screenshot" />
              <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>ID</strong></td><td>Record ID.</td></tr>
                <tr><td><strong>Dashboard</strong></td><td>Parent dashboard.</td></tr>
                <tr><td><strong>Title</strong></td><td>Tab label shown to users.</td></tr>
                <tr><td><strong>Actions</strong></td><td>Edit, Delete.</td></tr>
              </tbody></table>
              <h2>Add / Edit a Section</h2>
              <p>Click <strong>Add Section</strong> to create a new tab, or the edit icon to rename an existing one. Sections must exist before charts can be assigned to them — always create your sections first when building a new dashboard.</p>
              <img src="${dashboardsTabsFormImg}" alt="Dashboard Sections add/edit form" class="docs-screenshot" />
              <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Dashboard</strong></td><td>The parent dashboard this section belongs to. Sections are scoped to a single dashboard.</td></tr>
                <tr><td><strong>Title</strong></td><td>The tab label shown to users on the dashboard (e.g. <em>Overview</em>, <em>Projects by County</em>, <em>Housing Trends</em>).</td></tr>
              </tbody></table>
              <blockquote>Tip — plan your section tabs before creating charts. Each chart is pinned to one section, so restructuring sections later requires reassigning charts.</blockquote>
            `
          },
          {
            id: 'config-dashboards-charts',
            label: 'Charts',
            content: `
              <p><strong>Charts</strong> are the data visualisations that populate each dashboard section. They are driven by live system data and support multiple chart types. Each chart is assigned to a section and configured through a multi-step form that controls what data is shown, how it is grouped, and how it looks. Charts are the most powerful and flexible part of the dashboard builder — the same underlying data can be sliced in many ways by adjusting the source, axes, filters, and aggregation settings.</p>
              <img src="${dashboardsChartsListingImg}" alt="Dashboard Charts listing" class="docs-screenshot" />
              <table><thead><tr><th>Column</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>ID</strong></td><td>Record ID.</td></tr>
                <tr><td><strong>Chart Name</strong></td><td>Chart title displayed on the dashboard.</td></tr>
                <tr><td><strong>Description</strong></td><td>What the chart shows.</td></tr>
                <tr><td><strong>Actions</strong></td><td>Edit, Delete, Duplicate.</td></tr>
              </tbody></table>
              <h2>Add / Edit a Chart</h2>
              <p>Click <strong>Add Chart</strong> or the edit icon on a row to open the multi-step chart builder. Work through each step in order — later steps depend on selections made in earlier ones.</p>
              <img src="${dashboardsChartsFormImg}" alt="Dashboard Charts configuration form" class="docs-screenshot" />

              <h3>Step 1 — Details</h3>
              <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Dashboard</strong></td><td>Yes</td><td>The parent dashboard this chart belongs to. Determines which sections are available in the next field.</td></tr>
                <tr><td><strong>Dashboard Section</strong></td><td>Yes</td><td>The tab/section within the dashboard where this chart will appear. Sections must be created first — see the Sections page.</td></tr>
                <tr><td><strong>Title</strong></td><td>Yes (min 3 chars)</td><td>Chart heading displayed on the dashboard above the visualisation.</td></tr>
                <tr><td><strong>Description</strong></td><td>Yes</td><td>Internal description of what the chart shows — not displayed to end users.</td></tr>
              </tbody></table>

              <h3>Step 2 — Chart Settings</h3>
              <p>This step controls the data source, chart type, and aggregation. The <strong>Category</strong> field determines which sub-fields are shown.</p>
              <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Category</strong></td><td>Yes</td><td><em>Status</em> — charts data from a system entity (Settlements, Projects, Households, etc.). <em>Intervention</em> — charts data from M&amp;E indicator records linked to programme activities.</td></tr>
                <tr><td><strong>Entity</strong></td><td>Yes (Status only)</td><td>The system model to visualise. The selected entity determines which fields are available for the Field and Filter steps.</td></tr>
                <tr><td><strong>Field</strong></td><td>Yes (Status only)</td><td>The entity field to aggregate or categorise on (e.g. <em>county</em>, <em>status</em>, <em>area</em>).</td></tr>
                <tr><td><strong>Indicators</strong></td><td>Yes (Intervention only)</td><td>One or more M&amp;E indicators whose reported values will be visualised. Multi-select.</td></tr>
                <tr><td><strong>Categorized by selected field</strong></td><td>No</td><td>When checked, the chart breaks down results by the chosen field rather than aggregating to a single value. Enables grouped/stacked views.</td></tr>
                <tr><td><strong>Ignore records with missing data</strong></td><td>No (default: on)</td><td>Excludes records where the selected field has no value. Recommended to keep enabled to avoid skewing results.</td></tr>
                <tr><td><strong>Chart Type</strong></td><td>Yes</td><td>Determines the visual representation. Available options: <em>Simple Bar</em>, <em>Multiple Bar</em>, <em>Stacked Bar (100%)</em>, <em>Stacked Bar (Absolute)</em>, <em>Line Chart</em>, <em>Pie</em>, <em>Donut</em>, <em>Map Chart</em>, <em>Population Pyramid</em>, <em>Word Map</em>. Available types may vary based on the selected entity.</td></tr>
                <tr><td><strong>Aggregation</strong></td><td>Yes</td><td>How to compute the chart values — <em>Count</em> (number of records per category), <em>Sum</em> (total of the field per category), or <em>Average</em> (mean of the field per category).</td></tr>
              </tbody></table>

              <h3>Step 3 — Filters</h3>
              <p>Optionally narrow the dataset before the chart is computed. Filters are only available when an Entity (Status category) has been selected.</p>
              <table><thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead><tbody>
                <tr><td><strong>Filter toggle</strong></td><td>No</td><td>Switch on to reveal the filter table. Switch off to remove all filters and use the full dataset.</td></tr>
                <tr><td><strong>Field</strong></td><td>—</td><td>The entity field to filter on. Selecting a field loads its available values.</td></tr>
                <tr><td><strong>Operation</strong></td><td>—</td><td>For text fields: <em>All</em> or <em>Equal</em>. For numeric/date fields: <em>All</em>, <em>Less Than</em>, <em>Less Than or Equal</em>, <em>Equal</em>, <em>Greater Than or Equal</em>.</td></tr>
                <tr><td><strong>Value</strong></td><td>—</td><td>One or more values to match. Supports multi-select and free-text entry. Multiple filter rows are combined with AND logic — all conditions must be met for a record to be included.</td></tr>
              </tbody></table>
              <blockquote>Tip — use the <strong>Duplicate</strong> button to clone an existing chart as a starting point. This is the fastest way to create multiple similar charts that share the same data source and type but differ in filters or field selection.</blockquote>
            `
          }
        ]
      },
    ]
  }
]

const navGroups = computed(() =>
  allNavGroups.filter(g => canSee(g.roles))
)

function getAllGroupPages(g: NavGroup): NavPage[] {
  const pages: NavPage[] = []
  if (g.subgroups) {
    for (const sub of g.subgroups) {
      if (!canSee(sub.roles)) continue
      pages.push(...sub.children.filter(p => canSee(p.roles)))
    }
  }
  if (g.children) pages.push(...g.children.filter(p => canSee(p.roles)))
  return pages
}

const allPages = computed(() => navGroups.value.flatMap(g => getAllGroupPages(g)))
const currentPage = computed(() => allPages.value.find(p => p.id === activeSection.value) ?? allPages.value[0])
const currentIndex = computed(() => allPages.value.findIndex(p => p.id === activeSection.value))
const prevPage = computed(() => currentIndex.value > 0 ? allPages.value[currentIndex.value - 1] : null)
const nextPage = computed(() => currentIndex.value < allPages.value.length - 1 ? allPages.value[currentIndex.value + 1] : null)

const activeGroupLabel = computed(() => {
  for (const g of navGroups.value) {
    if (g.children.some(c => c.id === activeSection.value)) return g.label
    if (g.subgroups?.some(sub => sub.children.some(c => c.id === activeSection.value))) return g.label
  }
  return ''
})

function groupHasActive(groupId: string) {
  const group = navGroups.value.find(g => g.id === groupId)
  if (!group) return false
  if (group.children?.some(c => c.id === activeSection.value)) return true
  if (group.subgroups?.some(sub => sub.children.some(c => c.id === activeSection.value))) return true
  return false
}

function subgroupHasActive(sub: NavSubGroup) {
  return sub.children.some(c => c.id === activeSection.value)
}

function toggleGroup(id: string) {
  const s = new Set(expandedGroups.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expandedGroups.value = s
}

function selectSection(id: string) {
  activeSection.value = id
  sidebarOpen.value = false
  for (const g of navGroups.value) {
    if (g.children.some(c => c.id === id)) {
      expandedGroups.value = new Set([...expandedGroups.value, g.id])
      break
    }
    if (g.subgroups) {
      for (const sub of g.subgroups) {
        if (sub.children.some(c => c.id === id)) {
          expandedGroups.value = new Set([...expandedGroups.value, g.id, sub.id])
          break
        }
      }
    }
  }
  mainRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const closeSidebarOnResize = () => {
  if (window.innerWidth > 768) sidebarOpen.value = false
}

onMounted(async () => {
  loadUserRoles()
  window.addEventListener('resize', closeSidebarOnResize)
  // Deep-link support: /#/docs?section=grm-grievances
  const target = route.query.section as string | undefined
  if (target) {
    // Wait one tick so navGroups (which depends on userRoleNames) has filtered correctly
    await nextTick()
    selectSection(target)
  }
})
onBeforeUnmount(() => window.removeEventListener('resize', closeSidebarOnResize))

useHead({
  title: 'Documentation | KeSMIS',
  meta: [{ name: 'description', content: 'User documentation for the Kenya Slum Management Information System (KeSMIS).' }]
})
</script>

<style scoped>
/* ---- Layout ---- */
.docs-layout {
  display: flex;
  height: 100dvh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #fff;
  color: #1f2937;
}

/* ---- Sidebar ---- */
.docs-sidebar {
  width: 272px;
  min-width: 272px;
  background: #fbfbfc;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.25s ease;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-logo {
  width: 28px;
  height: 24px;
  object-fit: contain;
}

.sidebar-title {
  font-weight: 700;
  font-size: 15px;
  color: #111827;
  letter-spacing: -0.01em;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px 16px;
}

/* Group toggle */
.nav-group-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-align: left;
  transition: background 0.15s, color 0.15s;
  margin-top: 2px;
}

.nav-group-toggle:hover {
  background: #f3f4f6;
}

.nav-group-toggle.has-active {
  color: #4338ca;
}

.nav-group-icon {
  font-size: 16px;
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-group-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-chevron {
  font-size: 14px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
  opacity: 0.4;
}

.nav-group-toggle.expanded .nav-chevron {
  transform: rotate(90deg);
}

/* Children items */
.nav-group-children {
  overflow: hidden;
}

/* Subgroup toggle */
.nav-subgroup-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 12px 6px 28px;
  border: none;
  background: transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  text-align: left;
  transition: background 0.15s, color 0.15s;
  margin-top: 2px;
}

.nav-subgroup-toggle:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-subgroup-toggle.has-active {
  color: #4338ca;
}

.nav-subgroup-toggle.expanded .sub-chevron {
  transform: rotate(90deg);
}

.nav-subgroup-icon {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-subgroup-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-chevron {
  font-size: 12px;
}

.nav-subgroup-children {
  overflow: hidden;
}

.nav-item-nested {
  padding-left: 52px !important;
}

.nav-item {
  display: block;
  width: 100%;
  padding: 6px 12px 6px 40px;
  border: none;
  background: transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  position: relative;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-item.active {
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4338ca;
}

/* Collapse animation */
.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 500px;
  opacity: 1;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Sidebar footer */
.sidebar-footer {
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
}

.sidebar-back {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s;
}

.sidebar-back:hover {
  color: #4338ca;
}

/* ---- Mobile header ---- */
.docs-mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: #fbfbfc;
  border-bottom: 1px solid #e5e7eb;
  z-index: 90;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
}

.hamburger {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #374151;
  padding: 4px;
}

.mobile-title {
  font-weight: 700;
  font-size: 15px;
  color: #111827;
}

.docs-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
}

/* ---- Main content ---- */
.docs-main {
  flex: 1;
  margin-left: 272px;
  padding: 48px 56px 80px;
  overflow-y: auto;
  height: 100dvh;
}

.docs-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.breadcrumb-sep {
  font-size: 14px;
}

.breadcrumb-current {
  color: #4338ca;
}

.docs-page-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 28px;
  letter-spacing: -0.02em;
  color: #111827;
}

/* ---- Prose ---- */
.docs-body :deep(p) {
  font-size: 15px;
  line-height: 1.75;
  color: #374151;
  margin-bottom: 16px;
}

.docs-body :deep(h2) {
  font-size: 20px;
  font-weight: 700;
  margin: 32px 0 12px;
  color: #111827;
}

.docs-body :deep(ul) {
  padding-left: 24px;
  margin-bottom: 16px;
  list-style-type: disc;
}

.docs-body :deep(ol) {
  padding-left: 24px;
  margin-bottom: 16px;
  list-style-type: decimal;
}

.docs-body :deep(li) {
  font-size: 15px;
  line-height: 1.75;
  color: #374151;
  margin-bottom: 4px;
  list-style: inherit;
  display: list-item;
}

.docs-body :deep(li ul) {
  margin-top: 4px;
  margin-bottom: 8px;
  list-style-type: circle;
}

.docs-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 14px;
}

.docs-body :deep(th) {
  text-align: left;
  padding: 10px 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
}

.docs-body :deep(td) {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.docs-body :deep(blockquote) {
  margin: 16px 0;
  padding: 12px 16px;
  background: #eef2ff;
  border-left: 4px solid #4338ca;
  border-radius: 0 6px 6px 0;
  font-size: 14px;
  color: #374151;
}

.docs-body :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #6366f1;
}

.docs-body :deep(img.docs-screenshot) {
  display: block;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
  margin: 24px 0;
  -webkit-mask-image: linear-gradient(to bottom, #000 85%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 85%, transparent 100%);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.docs-body :deep(img.docs-screenshot:hover) {
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
  -webkit-mask-image: none;
  mask-image: none;
}

/* ---- Prev / Next ---- */
.docs-page-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  gap: 16px;
}

.page-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 14px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  flex: 1;
  max-width: 50%;
  min-width: 0;
}

.page-nav-btn:hover {
  border-color: #4338ca;
  box-shadow: 0 2px 8px rgba(67, 56, 202, 0.08);
}

.page-nav-btn.next {
  align-items: flex-end;
  text-align: right;
}

.nav-arrow {
  font-size: 16px;
  color: #4338ca;
}

.nav-dir {
  font-size: 12px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.nav-label {
  font-size: 14px;
  font-weight: 600;
  color: #4338ca;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .docs-sidebar {
    transform: translateX(-100%);
  }

  .docs-sidebar.open {
    transform: translateX(0);
  }

  .docs-mobile-header {
    display: flex;
  }

  .docs-overlay {
    display: block;
  }

  .docs-main {
    margin-left: 0;
    padding: 68px 20px 60px;
    height: calc(100dvh - 52px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .docs-page-title {
    font-size: 24px;
  }

  .docs-page-nav {
    flex-direction: column;
  }

  .page-nav-btn {
    max-width: 100%;
  }
}
</style>
