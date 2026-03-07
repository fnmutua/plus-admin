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
              <template v-if="group.subgroups">
                <template v-for="sub in group.subgroups" :key="sub.id">
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
                      <button
                        v-for="item in sub.children"
                        :key="item.id"
                        :class="['nav-item', 'nav-item-nested', { active: activeSection === item.id }]"
                        @click="selectSection(item.id)"
                      >
                        {{ item.label }}
                      </button>
                    </div>
                  </Transition>
                </template>
              </template>
              <button
                v-for="item in group.children"
                :key="item.id"
                :class="['nav-item', { active: activeSection === item.id }]"
                @click="selectSection(item.id)"
              >
                {{ item.label }}
              </button>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useHead } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import landingPageImg from '@/assets/documentation/landing_page.png'
import actionButtonsImg from '@/assets/documentation/action-buttons.png'
import topNavigationImg from '@/assets/documentation/top_navigation.png'
import fileGrievanceBtnImg from '@/assets/documentation/File a Grievance button.png'
import grievanceFormImg from '@/assets/documentation/multi-step greivnace form.png'
import incidentBtnImg from '@/assets/documentation/incident button.png'
import incidentFormImg from '@/assets/documentation/incident form.png'
import homeDashboardImg from '@/assets/documentation/home-dashbaord.png'
import statusDashboardImg from '@/assets/documentation/status-dashabord.png'
import statusFilterBtnImg from '@/assets/documentation/status-dashabord-filter-button.png'
import statusFilterResultsImg from '@/assets/documentation/status-dashabord-filter-results.png'
import statusChartDownloadImg from '@/assets/documentation/status-dashabord-chart-download.png'
import statusSectionsTabsImg from '@/assets/documentation/status-dashabord-sections-tabs.png'
import settlementsMapImg from '@/assets/documentation/Settlements Map1.png'
import settlementsMapFilterImg from '@/assets/documentation/Settlements Map-filter.png'
import settlementsMapInteractImg from '@/assets/documentation/Settlements Map-interacting.png'
import projectsMapImg from '@/assets/documentation/projects-map1.png'
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
import settlementSearchImg from '@/assets/documentation/settleemnt-search.png'
import settlementFilterImg from '@/assets/documentation/settleemnt-filter.png'
import settlementRegisterImg from '@/assets/documentation/settlement_register .png'
import settlementRegisterMapImg from '@/assets/documentation/settlement_register map .png'
import aboutKisipImg from '@/assets/documentation/about kisip.png'
import modeSwitchImg from '@/assets/documentation/mode switch.png'
import registerImg from '@/assets/documentation/regsiter.png'
import signinBtnImg from '@/assets/documentation/signin button.png'
import loginImg from '@/assets/documentation/login.png'
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
import importGis1Img from '@/assets/documentation/import-gis-1.png'
import importGis2DestImg from '@/assets/documentation/import-gis-2-destination-table.png'
import importGis2MatchImg from '@/assets/documentation/import-gis-2-matchfields.png'
import importGis2ReviewImg from '@/assets/documentation/import-gis-2-review+import.png'
import formDetail1Img from '@/assets/documentation/forn-detail-1.png'
import formDetail2MapImg from '@/assets/documentation/forn-detail-2-map.png'
import formDetail3ChartImg from '@/assets/documentation/forn-detail-3-chart.png'
import formDetail4DownloadImg from '@/assets/documentation/forn-detail-4-downlaod-atatchment.png'
interface NavPage {
  id: string
  label: string
  content: string
}

interface NavSubGroup {
  id: string
  label: string
  icon?: string
  children: NavPage[]
}

interface NavGroup {
  id: string
  label: string
  icon: string
  adminOnly?: boolean
  children: NavPage[]
  subgroups?: NavSubGroup[]
}

const isAdmin = computed(() => {
  try {
    return localStorage.getItem('kesmis_is_admin') === '1'
  } catch {
    return false
  }
})

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
          <img src="${registerImg}" alt="Registration form" class="docs-screenshot" />
          <h2>How to register</h2>
          <ol>
            <li>Click the <strong>Sign in</strong> button on the landing page hero section or top navigation bar</li>
            <li>On the login page, click the <strong>Register</strong> link</li>
            <li>Fill in the registration form with the following details:</li>
          </ol>
          <table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Full Name</strong></td><td>Your full name as it should appear in the system.</td></tr>
            <tr><td><strong>Username</strong></td><td>A unique username you will use alongside your email to identify your account.</td></tr>
            <tr><td><strong>Email</strong></td><td>A valid email address. This will be used for login and password recovery.</td></tr>
            <tr><td><strong>Password</strong></td><td>A secure password for your account.</td></tr>
            <tr><td><strong>Organisation</strong></td><td>The organisation you belong to (e.g. Kenya Red Cross Society, county government, etc.).</td></tr>
            <tr><td><strong>Phone</strong></td><td>Your phone number with country code. An international phone input is provided.</td></tr>
            <tr><td><strong>County</strong></td><td>Your county (shown for Kenyan phone numbers). Select "Not Applicable" if not county-based.</td></tr>
          </tbody></table>
          <ol start="4">
            <li>Check the <strong>terms and conditions</strong> checkbox</li>
            <li>Click <strong>Register</strong> to submit your application</li>
          </ol>
          <h2>What happens after registration?</h2>
          <ul>
            <li>Your registration is submitted for <strong>administrator review</strong></li>
            <li>An administrator will approve your account and assign you a <strong>role</strong> that determines which modules and data you can access</li>
            <li>You will receive a notification once your account is activated</li>
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
            <li>On success you will be redirected to the <strong>Status Dashboard</strong></li>
          </ol>
          <img src="${loginImg}" alt="Login page" class="docs-screenshot" />
          <h2>Forgot your password?</h2>
          <p>Click the <strong>Forgot password</strong> link on the login page. Enter your registered email address and a password reset link will be sent to you via email. Follow the link to set a new password.</p>
          <h2>After signing in</h2>
          <p>Once authenticated:</p>
          <ul>
            <li>The landing page hero button changes from <strong>"Sign in"</strong> to <strong>"Dashboard"</strong></li>
            <li>Clicking it takes you directly to the internal <strong>Status Dashboard</strong></li>
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
    adminOnly: true,
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
              <p>All columns are sortable. Click a column header to sort ascending or descending.</p>

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
          <p>The importer accepts the following geospatial file types:</p>
          <table><thead><tr><th>Format</th><th>Extension</th><th>Notes</th></tr></thead><tbody>
            <tr><td>GeoJSON</td><td><code>.json</code>, <code>.geojson</code></td><td>Must be a valid FeatureCollection. CRS is assumed WGS 84 (EPSG:4326).</td></tr>
            <tr><td>Shapefile (zipped)</td><td><code>.zip</code></td><td>The ZIP archive must contain the <code>.shp</code>, <code>.shx</code>, <code>.dbf</code> and optionally <code>.prj</code> files.</td></tr>
            <tr><td>KML</td><td><code>.kml</code></td><td>Google Earth markup format.</td></tr>
            <tr><td>KMZ</td><td><code>.kmz</code></td><td>Compressed KML archive.</td></tr>
          </tbody></table>
          <blockquote>All uploaded files are automatically validated. If the file contains no valid features or is malformed, an error message is displayed and the wizard does not advance.</blockquote>

          <h2>Step 1 — Upload File</h2>
          <p>Click the <strong>Upload File</strong> button and select a file from your computer (or drag-and-drop). Once the file is parsed successfully, a confirmation message shows the number of features found (e.g. <em>"Shapefile loaded successfully! 142 features found."</em>) and the wizard moves to Step 2.</p>

          <h2>Step 2 — Select Destination Table</h2>
          <img class="docs-screenshot" src="${importGis2DestImg}" alt="Import GIS Data — Select destination table" />
          <p>Choose which KeSMIS entity the imported features should be stored as. The available destination tables are:</p>
          <table><thead><tr><th>Category</th><th>Tables</th></tr></thead><tbody>
            <tr><td><strong>Core</strong></td><td>Projects, Settlements, Parcels, Structures</td></tr>
            <tr><td><strong>Infrastructure</strong></td><td>Roads, Road Assets, Sewer, Piped Water, Railway, Powerline, Streetlight, Floodlights</td></tr>
            <tr><td><strong>Social Amenities</strong></td><td>Health Facility, School, Water Point, Police Station, Community Hall, Community Project</td></tr>
            <tr><td><strong>Environment</strong></td><td>Hazard Zones, Crime Hotspots, Dumping, Telcom Mast</td></tr>
          </tbody></table>
          <p>After selecting a table, the system fetches the corresponding database field definitions from the server. If the source data contains a <code>pcode</code> property, the importer automatically resolves parent entities (county, sub-county, ward or settlement) so that imported features are correctly linked to the administrative hierarchy.</p>

          <h2>Step 3 — Match Fields</h2>
          <img class="docs-screenshot" src="${importGis2MatchImg}" alt="Import GIS Data — Match fields" />
          <p>This step presents a two-column mapping table listing every property found in the source file alongside a dropdown of available database columns. The system uses <strong>fuzzy matching</strong> to suggest initial mappings automatically &mdash; for example, a source field named <code>settlement_name</code> will be matched to the database column <code>name</code>.</p>
          <ul>
            <li>Each database column can only be mapped once; already-mapped columns are greyed out in other dropdowns</li>
            <li>Use the <strong>Search fields</strong> box at the top to quickly filter the list when working with many properties</li>
            <li>Unmapped source fields (dropdown left blank) are excluded from the import</li>
          </ul>

          <h2>Step 4 — Review &amp; Import</h2>
          <img class="docs-screenshot" src="${importGis2ReviewImg}" alt="Import GIS Data — Review and import" />
          <p>Before committing, the wizard shows a JSON preview of the remapped data. You can preview <strong>1, 5 or 10</strong> sample records to verify the mappings are correct.</p>
          <ul>
            <li>Click <strong>Import</strong> to submit all features to the database</li>
            <li>Click <strong>Back</strong> to return to the field-matching step and adjust mappings</li>
            <li>Click <strong>Reset</strong> to discard everything and start over from Step 1</li>
          </ul>
          <p>On completion, a success notification displays the number of imported features. If some features fail validation (e.g. missing required fields), a detailed error log is shown listing each failed feature and the reason, while successfully validated features are still imported.</p>

          <blockquote>Geometry coordinates with a Z (altitude) component are automatically stripped to 2D (X, Y) before storage, ensuring compatibility with the KeSMIS spatial database.</blockquote>
        `
      }
    ]
  },
  {
    id: 'mne',
    label: 'M&E',
    icon: 'mdi:chart-bar',
    children: [
      {
        id: 'mne-overview',
        label: 'Overview',
        content: `
          <p>The <strong>Monitoring &amp; Evaluation</strong> module tracks programme performance using structured indicators, activities, and evaluation reports.</p>
        `
      },
      {
        id: 'mne-activities',
        label: 'Activities',
        content: `
          <p>Activities track programme-level tasks and milestones. Each activity is linked to a programme and can have associated indicators and timelines.</p>
        `
      },
      {
        id: 'mne-framework',
        label: 'Framework & Indicators',
        content: `
          <p>The M&amp;E framework is built around a hierarchy of:</p>
          <ul>
            <li><strong>Indicators</strong> &mdash; measurable metrics (e.g. "Number of settlements mapped")</li>
            <li><strong>Configuration</strong> &mdash; target values, reporting periods, and data sources</li>
            <li><strong>Categories</strong> &mdash; groupings of related indicators</li>
          </ul>
        `
      },
      {
        id: 'mne-reports',
        label: 'Reports & Evaluations',
        content: `
          <p>Under <strong>Monitoring</strong>, authorised users can:</p>
          <ul>
            <li>Submit new indicator reports with current values</li>
            <li>View past reports and track indicator trends over time</li>
            <li>Create and manage evaluations (mid-term, end-term, etc.)</li>
          </ul>
        `
      },
      {
        id: 'mne-beneficiaries',
        label: 'Beneficiaries',
        content: `
          <p>The beneficiary module captures data about individuals and communities that benefit from programme interventions &mdash; e.g. infrastructure improvements, tenure regularisation, and community-based projects.</p>
        `
      }
    ]
  },
  {
    id: 'grm',
    label: 'Grievance Redress (GRM)',
    icon: 'mdi:message-alert-outline',
    children: [
      {
        id: 'grm-overview',
        label: 'Overview',
        content: `
          <p>The <strong>Grievance Redress Mechanism</strong> allows the public to submit complaints and feedback related to KISIP programmes. Grievances are tracked through their full lifecycle from intake to resolution.</p>
        `
      },
      {
        id: 'grm-grievances',
        label: 'Grievances',
        content: `
          <p>Grievances submitted through the public form or by staff are listed here. Key actions include:</p>
          <ul>
            <li>Viewing open and referred grievances</li>
            <li>Assigning grievances to GRC members</li>
            <li>Updating status (acknowledged, under review, resolved, rejected)</li>
            <li>Adding internal notes and communication logs</li>
          </ul>
        `
      },
      {
        id: 'grm-gbv',
        label: 'GBV Cases',
        content: `
          <p><strong>Gender-Based Violence (GBV)</strong> cases follow a specialised workflow with stricter access controls. Only users with the <code>gbv</code> role can access these records to protect victim confidentiality.</p>
        `
      }
    ]
  },
  {
    id: 'incidents',
    label: 'Incidents',
    icon: 'mdi:alert-decagram-outline',
    children: [
      {
        id: 'incidents-overview',
        label: 'Overview',
        content: `
          <p>The <strong>Incidents</strong> module captures reports of accidents, disasters or other events affecting informal settlements and project areas. Incidents can be filed publicly via the landing page or internally by staff.</p>
          <p>Each incident record includes location, type, severity, affected population and follow-up actions.</p>
        `
      }
    ]
  },
  {
    id: 'repository',
    label: 'Repository',
    icon: 'mdi:folder-multiple-outline',
    children: [
      {
        id: 'repo-documents',
        label: 'Documents',
        content: `
          <p>The document repository stores project-related files tagged by category and settlement. Users can:</p>
          <ul>
            <li>Browse and search documents</li>
            <li>Upload new files with metadata</li>
            <li>Share documents via secure links</li>
          </ul>
        `
      },
      {
        id: 'repo-imagery',
        label: 'Drone Imagery',
        content: `
          <p>High-resolution satellite and drone imagery for mapped settlements. Imagery layers can be overlaid on settlement maps.</p>
        `
      },
      {
        id: 'repo-shares',
        label: 'Document Shares',
        content: `
          <p>Manage shared document links. Each share generates a unique token URL that can be sent to external stakeholders without requiring a KeSMIS login.</p>
        `
      }
    ]
  },
  {
    id: 'media',
    label: 'Media',
    icon: 'mdi:play-circle-outline',
    children: [
      {
        id: 'media-overview',
        label: 'Overview',
        content: `
          <p>The Media module centralises multimedia content for the system:</p>
          <table><thead><tr><th>Section</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Videos</strong></td><td>Uploaded videos related to programme activities and events.</td></tr>
            <tr><td><strong>Live Streams</strong></td><td>Embedded live stream links for programme events.</td></tr>
            <tr><td><strong>Articles</strong></td><td>News articles and press releases.</td></tr>
          </tbody></table>
        `
      }
    ]
  },
  {
    id: 'users',
    label: 'Users & Access',
    icon: 'mdi:shield-account-outline',
    adminOnly: true,
    children: [
      {
        id: 'users-overview',
        label: 'User Management',
        content: `
          <p>User management is organised into views based on user type:</p>
          <table><thead><tr><th>View</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>All</strong></td><td>Full list of all system users.</td></tr>
            <tr><td><strong>Admin</strong></td><td>Administrator accounts with elevated privileges.</td></tr>
            <tr><td><strong>GRM</strong></td><td>Users assigned to grievance redress.</td></tr>
            <tr><td><strong>Support</strong></td><td>Support and technical staff.</td></tr>
            <tr><td><strong>New</strong></td><td>Recently registered accounts pending approval.</td></tr>
          </tbody></table>
        `
      },
      {
        id: 'users-roles',
        label: 'Roles & Permissions',
        content: `
          <p>KeSMIS uses a <strong>role-based access control</strong> model with granular permissions. Each role defines which modules and actions a user can access.</p>
          <h2>Standard roles</h2>
          <ul>
            <li><strong>Root Admin / Super Admin</strong> &mdash; full system access</li>
            <li><strong>Admin</strong> &mdash; manage users, settlements and data</li>
            <li><strong>Staff</strong> &mdash; data entry and viewing</li>
            <li><strong>Monitoring</strong> &mdash; M&amp;E focused access</li>
            <li><strong>GRM</strong> &mdash; grievance management</li>
            <li><strong>GBV</strong> &mdash; restricted GBV case access</li>
            <li><strong>Consultant</strong> &mdash; read-focused access for external consultants</li>
            <li><strong>Support</strong> &mdash; technical support staff</li>
          </ul>
          <p>Administrators can create custom roles and assign specific permissions per module (e.g. <code>climate_assessment:read</code>, <code>collector:read</code>).</p>
        `
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'mdi:cog-outline',
    adminOnly: true,
    children: [
      {
        id: 'settings-overview',
        label: 'Overview',
        content: `
          <p>The <strong>Settings</strong> module allows administrators to configure system-wide parameters. It is divided into sub-sections:</p>
          <table><thead><tr><th>Section</th><th>Description</th></tr></thead><tbody>
            <tr><td><strong>Common</strong></td><td>Categories, evaluation types, contractors, document categories/types.</td></tr>
            <tr><td><strong>Programme</strong></td><td>Programmes, components, implementation phases, project types.</td></tr>
            <tr><td><strong>Dashboards</strong></td><td>Dynamic dashboard configuration &mdash; cards, tabs, charts.</td></tr>
            <tr><td><strong>Admin Units</strong></td><td>Counties, sub-counties and wards hierarchy.</td></tr>
            <tr><td><strong>SMS Settings</strong></td><td>SMS gateway configuration for notifications.</td></tr>
            <tr><td><strong>Climate Settings</strong></td><td>Vulnerability scoring parameters and thresholds.</td></tr>
          </tbody></table>
        `
      }
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: 'mdi:shield-lock-outline',
    adminOnly: true,
    children: [
      {
        id: 'admin-overview',
        label: 'Overview',
        content: `
          <p>The <strong>Admin</strong> section provides super-admin tools:</p>
          <ul>
            <li><strong>Roles</strong> &mdash; create and manage roles with granular permissions</li>
            <li><strong>Feedback</strong> &mdash; view in-app user feedback submissions</li>
            <li><strong>Logs</strong> &mdash; audit trail of system actions</li>
            <li><strong>Page Visits</strong> &mdash; analytics on which pages are most visited</li>
          </ul>
        `
      }
    ]
  }
]

const navGroups = computed(() =>
  allNavGroups.filter(g => !g.adminOnly || isAdmin.value)
)

function getAllGroupPages(g: NavGroup): NavPage[] {
  const pages: NavPage[] = []
  if (g.subgroups) {
    for (const sub of g.subgroups) {
      pages.push(...sub.children)
    }
  }
  pages.push(...g.children)
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
  if (group.children.some(c => c.id === activeSection.value)) return true
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

onMounted(() => window.addEventListener('resize', closeSidebarOnResize))
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
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
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
