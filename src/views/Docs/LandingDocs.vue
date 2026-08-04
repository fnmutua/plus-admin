<template>
  <div class="docs-page">
    <el-card class="docs-card" shadow="never">
      <h1 class="docs-title">Landing Page</h1>
      <p class="docs-intro">
        The landing page is the public entry point into the Kenya Slum Management Information System (KeSMIS).
        From here users can see what the system does, sign in, and access public services such as grievances,
        incidents and the settlement register.
      </p>

      <section class="docs-section">
        <h2>Purpose</h2>
        <p>
          The purpose of the landing page is to introduce KeSMIS and provide clear entry points for both
          members of the public and authorized users. It highlights the main modules (settlements, GRM,
          incidents, climate assessments, projects and monitoring) and directs users to the correct workflow.
        </p>
      </section>

      <section class="docs-section">
        <h2>Hero section</h2>
        <p>
          The hero section contains the system name, a short description and key feature highlights, together
          with three primary action buttons:
        </p>
        <ul>
          <li>
            <strong>Sign in / Dashboard</strong> – opens the login page if the user is not logged in, or takes
            the user to the main dashboard if already authenticated.
          </li>
          <li>
            <strong>File a Grievance</strong> – opens the public Form for submitting a grievance related to
            KISIP, SUD, KENSUP and other programme projects.
          </li>
          <li>
            <strong>Incident Report</strong> – opens the public incident reporting Form for accidents or
            incidents affecting informal settlements or project areas.
          </li>
        </ul>
      </section>

      <section class="docs-section">
        <h2>Top navigation</h2>
        <p>
          The top navigation bar on the landing page exposes public links without requiring a login. The exact
          wording may vary slightly, but typically includes:
        </p>
        <ul>
          <li><strong>Dashboard</strong> – shortcut to the internal system for authorized users.</li>
          <li><strong>Grievances</strong> – information about the GRM module and a link to file a grievance.</li>
          <li><strong>Incidents</strong> – information and link for incident reporting.</li>
          <li><strong>Settlement Register</strong> – public register to browse and search informal settlements.</li>
          <li><strong>FAQs</strong> – frequently asked questions about KeSMIS.</li>
          <li><strong>About</strong> – background information on the system and programmes.</li>
          <li><strong>Contact</strong> – contact form and details for the system administrators.</li>
          <li><strong>Privacy</strong> – privacy policy and data protection information.</li>
        </ul>
      </section>

      <section class="docs-section">
        <h2>Display mode</h2>
        <p>
          The landing page (and the rest of the system) supports day and dark modes. The theme switcher lets
          users toggle between a light and dark appearance. The chosen mode is remembered until changed again.
        </p>
      </section>

      <section class="docs-section">
        <h2>Settlement register</h2>
        <p>
          Further down the landing page, a settlement register component allows users to:
        </p>
        <ul>
          <li>Search for informal settlements by name.</li>
          <li>Filter by county, subcounty and ward.</li>
          <li>View basic information such as name, population and location.</li>
          <li>Open a map view of selected settlements.</li>
        </ul>
      </section>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElCard } from 'element-plus';
</script>

<style scoped>
.docs-page {
  max-width: 960px;
  margin: 24px auto;
  padding: 0 16px 32px;
}

.docs-card {
  border-radius: 8px;
}

.docs-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
}

.docs-intro {
  margin-bottom: 20px;
  color: var(--el-text-color-regular);
}

.docs-section {
  margin-top: 20px;
}

.docs-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.docs-section p {
  margin-bottom: 8px;
  color: var(--el-text-color-regular);
}

.docs-section ul {
  padding-left: 20px;
  margin: 4px 0 0;
}

.docs-section li {
  margin: 4px 0;
}
</style>

