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
interface NavPage {
  id: string
  label: string
  content: string
}

interface NavGroup {
  id: string
  label: string
  icon: string
  adminOnly?: boolean
  children: NavPage[]
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
    label: 'Landing Page',
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
            <li>Enable the public to <strong>file grievances</strong> and <strong>report incidents</strong> related to KISIP / KENSUP projects through transparent, accessible channels</li>
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
          <p>KeSMIS is a web-based application accessible from any modern browser on desktop, tablet or mobile. The system supports light and dark display modes, is available 24/7, and integrates with ODK Central for mobile field data collection. SlumMapper extends this with native mobile apps for offline-capable field operations.</p>
        `
      },
      {
        id: 'overview',
        label: 'Landing Page Overview',
        content: `
          <p>The landing page is the public entry point to KeSMIS. It is accessible to everyone &mdash; no login is required. The page is designed to introduce the system and give public users quick access to key services.</p>
          <h2>What can you do from the landing page?</h2>
          <p>Without signing in, any visitor can:</p>
          <ul>
            <li><strong>File a grievance</strong> related to KISIP / KENSUP projects through a guided multi-step form</li>
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
          <table><thead><tr><th>Link</th><th>Where it goes</th><th>Login required?</th></tr></thead><tbody>
            <tr><td><strong>Dashboard</strong></td><td>If logged in, opens the internal Status dashboard. If not, opens the login page.</td><td>Yes (redirects to login)</td></tr>
            <tr><td><strong>Grievances</strong></td><td>Scrolls to the Grievance Redress section of the landing page, with buttons to file a new grievance or check an existing one.</td><td>No</td></tr>
            <tr><td><strong>Incidents</strong></td><td>Opens the public incident reporting page with tabs for filing a new incident and looking up an existing one.</td><td>No</td></tr>
            <tr><td><strong>Settlement Register</strong></td><td>Scrolls down to the interactive settlement search and map section.</td><td>No</td></tr>
            <tr><td><strong>FAQs</strong></td><td>Opens the Frequently Asked Questions page covering common queries about the system and KISIP.</td><td>No</td></tr>
            <tr><td><strong>About</strong></td><td>Opens the About page with background on KISIP, KENSUP, and the implementing agencies.</td><td>No</td></tr>
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
          <h2>How to file a grievance</h2>
          <ol>
            <li>Click the <strong>File a Grievance</strong> button (either in the hero section or in the GRM section)</li>
            <li>You will be taken to a multi-step form. Fill in your personal details &mdash; name (or "Anonymous" for anonymity), gender, age bracket, national ID, phone number, and email</li>
            <li>Select the <strong>county</strong> and <strong>project phase</strong> (KISIP 1 or KISIP 2), then choose the <strong>settlement</strong> related to your complaint</li>
            <li>Describe the <strong>nature and details</strong> of the complaint, and optionally attach supporting documents or photographs</li>
            <li>Review your submission on the final step and click <strong>Submit</strong></li>
            <li>You will receive a <strong>tracking code</strong> &mdash; save it to check the status of your grievance later using the <strong>Check Status</strong> button</li>
          </ol>
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
          <h2>How to sign in</h2>
          <ol>
            <li>Click the <strong>Sign in</strong> button on the hero section, or the <strong>Sign in</strong> link on the top navigation bar</li>
            <li>You will be taken to the <strong>login page</strong></li>
            <li>Enter your <strong>email address</strong> and <strong>password</strong></li>
            <li>Click <strong>Sign in</strong> to authenticate</li>
            <li>On success you will be redirected to the <strong>Status Dashboard</strong></li>
          </ol>
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
        `
      },
      {
        id: 'dash-home',
        label: 'Home',
        content: `
          <p>The <strong>Home</strong> dashboard is your personal workspace. It greets you with a time-based message (Good Morning / Afternoon / Evening) and shows a summary of your contributions.</p>
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
          <p>Click the <strong>filter icon</strong> (visible in the tags/header bar) to open a filter drawer on the right side. The drawer contains:</p>
          <ul>
            <li><strong>County</strong> &mdash; multi-select dropdown; choose one or more counties to filter all cards and charts</li>
            <li><strong>Constituency (Sub-county)</strong> &mdash; multi-select dropdown; options cascade from the selected counties</li>
          </ul>
          <p>Click <strong>Confirm</strong> to apply the filters. All stat cards and charts on the page will update to reflect only the selected areas. Click <strong>Cancel</strong> to close without applying.</p>
          <p>When filters are active, the chart subtitles update to show which county or sub-county is being viewed.</p>

          <h2>Sections (tabs)</h2>
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
          <p>Several export options are available from the Status dashboard:</p>
          <ul>
            <li><strong>Map charts</strong> include an ECharts toolbox in the top-right corner of the chart with:
              <ul>
                <li><strong>Data View</strong> &mdash; see the raw data behind the chart in tabular form</li>
                <li><strong>Restore</strong> &mdash; reset the chart to its default state after zooming or panning</li>
                <li><strong>Save as Image</strong> &mdash; download the chart as a PNG image</li>
              </ul>
            </li>
            <li><strong>Choropleth map</strong> &mdash; click on a county region to view settlement data for that county. A <em>Download Data</em> button appears, letting you download the underlying data as a JSON file with location, value, and timestamp.</li>
          </ul>
          <blockquote>Tip &mdash; Apply county/sub-county filters first, then use Save as Image to capture filtered snapshots for reports and presentations.</blockquote>
        `
      },
      {
        id: 'dash-map',
        label: 'Settlements Map',
        content: `
          <p>The <strong>Map</strong> page shows a full-screen interactive Mapbox map of all informal settlements registered in KeSMIS.</p>
          <h2>Map features</h2>
          <ul>
            <li><strong>Settlement markers</strong> &mdash; each settlement appears as a green circle on the map</li>
            <li><strong>Clustering</strong> &mdash; when zoomed out, nearby settlements are grouped into clusters. Clusters are colour-coded by count (blue &rarr; yellow &rarr; pink). Click a cluster to zoom in and expand it</li>
            <li><strong>Settlement labels</strong> &mdash; settlement names appear as labels when zoomed in</li>
            <li><strong>County boundaries</strong> &mdash; red boundary lines show county limits</li>
            <li><strong>Sub-county boundaries</strong> &mdash; purple boundary lines appear when a sub-county filter is applied</li>
          </ul>

          <h2>Filtering</h2>
          <p>Click the <strong>filter icon</strong> in the top-right map controls to open a floating filter panel:</p>
          <ul>
            <li><strong>County</strong> &mdash; multi-select dropdown to show only settlements in specific counties</li>
            <li><strong>Sub-county</strong> &mdash; multi-select dropdown, options cascade from selected counties</li>
            <li><strong>Reset Filters</strong> &mdash; clears all selections and shows all settlements</li>
          </ul>
          <p>On mobile devices, the filter panel slides in as a drawer with an overlay.</p>

          <h2>Interacting with the map</h2>
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
    children: [
      {
        id: 'data-settlements',
        label: 'Settlements',
        content: `
          <p>The <strong>Settlements</strong> module is the core data layer of KeSMIS. It stores the national geodatabase of informal settlements.</p>
          <h2>Key features</h2>
          <ul>
            <li><strong>Settlement list</strong> &mdash; browse, search and filter all registered settlements</li>
            <li><strong>Settlement details</strong> &mdash; view demographics, location, tenure status, and linked facilities</li>
            <li><strong>Households</strong> &mdash; household-level data linked to individual settlements</li>
            <li><strong>Parcels</strong> &mdash; GIS parcel data for mapped settlements</li>
            <li><strong>Add / Edit</strong> &mdash; register new settlements or update existing records</li>
          </ul>
        `
      },
      {
        id: 'data-climate',
        label: 'Climate Assessments',
        content: `
          <p>Climate Risk &amp; Vulnerability Assessments are linked to individual settlements. Each assessment is a structured questionnaire covering:</p>
          <ul>
            <li>Exposure to climate hazards (flooding, drought, landslides, etc.)</li>
            <li>Sensitivity of the settlement and its population</li>
            <li>Adaptive capacity and existing coping mechanisms</li>
          </ul>
          <p>Scores are computed automatically. Assessments can be marked as completed and their results feed into the national dashboard.</p>
          <blockquote>Tip &mdash; The assessment list supports permission-based actions: Preview, Edit and Delete are shown only if the user has the corresponding <code>climate_assessment</code> permissions.</blockquote>
        `
      },
      {
        id: 'data-facilities',
        label: 'Facilities',
        content: `
          <p>Facilities are physical assets mapped within or near settlements. They are organised into three categories:</p>
          <h2>Social Amenities</h2>
          <ul>
            <li>Health facilities</li>
            <li>Education facilities (schools)</li>
            <li>Community halls</li>
            <li>Community projects</li>
            <li>Police stations</li>
          </ul>
          <h2>Infrastructure</h2>
          <ul>
            <li>Roads &amp; road structures</li>
            <li>Water (water points, piped water, sewer)</li>
            <li>Lighting (powerlines, flood-lights, streetlights)</li>
            <li>Railway</li>
            <li>Telecom masts</li>
          </ul>
          <h2>Others</h2>
          <ul>
            <li>Crime hotspots</li>
            <li>Hazard zones</li>
          </ul>
        `
      },
      {
        id: 'data-community',
        label: 'Community',
        content: `
          <p>Community structures linked to settlements:</p>
          <table><thead><tr><th>Committee</th><th>Role</th></tr></thead><tbody>
            <tr><td><strong>SEC</strong></td><td>Settlement Executive Committee &mdash; community leadership body for the settlement.</td></tr>
            <tr><td><strong>GRC</strong></td><td>Grievance Redress Committee &mdash; community-level body responsible for first-level grievance resolution.</td></tr>
          </tbody></table>
        `
      },
      {
        id: 'data-surveys',
        label: 'Surveys',
        content: `
          <p>The <strong>Surveys</strong> module integrates with ODK Central (the data collector) to display field survey submissions.</p>
          <h2>Features</h2>
          <ul>
            <li>View submission data in table and map formats</li>
            <li>Download records as CSV / Excel</li>
            <li>Download submission attachments (photos, documents) as a ZIP file</li>
            <li>Paginate large datasets (up to 500 records per page)</li>
          </ul>
          <blockquote>Note &mdash; Attachment downloads are limited to 100 files at a time. The system will warn you if the selection exceeds this limit.</blockquote>
        `
      },
      {
        id: 'data-import',
        label: 'Import',
        content: `
          <p>Data can be imported into KeSMIS through several channels:</p>
          <ul>
            <li><strong>GIS Import</strong> &mdash; upload shapefiles or GeoJSON to populate spatial layers</li>
            <li><strong>Excel Import</strong> &mdash; bulk upload of settlement or household data via spreadsheets</li>
            <li><strong>Integration</strong> &mdash; API-based integration with the ODK Collector for automated data flow</li>
          </ul>
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
          <p>The <strong>Grievance Redress Mechanism</strong> allows the public to submit complaints and feedback related to KISIP and KENSUP programmes. Grievances are tracked through their full lifecycle from intake to resolution.</p>
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

const allPages = computed(() => navGroups.value.flatMap(g => g.children))
const currentPage = computed(() => allPages.value.find(p => p.id === activeSection.value) ?? allPages.value[0])
const currentIndex = computed(() => allPages.value.findIndex(p => p.id === activeSection.value))
const prevPage = computed(() => currentIndex.value > 0 ? allPages.value[currentIndex.value - 1] : null)
const nextPage = computed(() => currentIndex.value < allPages.value.length - 1 ? allPages.value[currentIndex.value + 1] : null)

const activeGroupLabel = computed(() => {
  for (const g of navGroups.value) {
    if (g.children.some(c => c.id === activeSection.value)) return g.label
  }
  return ''
})

function groupHasActive(groupId: string) {
  const group = navGroups.value.find(g => g.id === groupId)
  return group?.children.some(c => c.id === activeSection.value) ?? false
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
  height: 100vh;
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
  height: 100vh;
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
    height: 100vh;
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
