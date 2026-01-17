<template>
  <BaseLayout>
    <div class="landing-page">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <el-row :gutter="40" align="middle">
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <div class="hero-content">
                <h1 class="hero-title">
                  Kenya Slum Management Information System
                </h1>
                
                <p class="hero-description">
                  KeSMIS is the national geodatabase and information management system for slums and informal settlements across Kenya. 
                </p>
                
                <ul class="hero-features">
                  <li>
                    <Icon icon="mdi:check-circle" class="feature-icon" />
                    <span>National geodatabase for slums and informal settlements</span>
                  </li>
                  <li>
                    <Icon icon="mdi:check-circle" class="feature-icon" />
                    <span>Electronic Grievance Redress Mechanism (e-GRM)</span>
                  </li>
                  <li>
                    <Icon icon="mdi:check-circle" class="feature-icon" />
                    <span>Project accidents and incidents reporting</span>
                  </li>
                  <li>
                    <Icon icon="mdi:check-circle" class="feature-icon" />
                    <span>Project monitoring and reporting</span>
                  </li>
                  <li>
                    <Icon icon="mdi:check-circle" class="feature-icon" />
                    <span>Real-time data collection and analysis</span>
                  </li>
                </ul>
                
                <div class="hero-cta">
                      <el-button
                        type="primary"
                        size="large"
                        :icon="isLoggedIn ? Monitor : Lock"
                        @click="navigateTo('get-started')"
                        class="cta-primary"
                      >
                        {{ isLoggedIn ? 'Dashboard' : 'Sign in' }}
                      </el-button>
                      <el-button
                        size="large"
                        @click="navigateTo('grm')"
                        class="cta-secondary"
                      >
                        <Icon icon="uiw:message" class="button-icon" />
                        File a Grievance
                      </el-button>
                      <el-button
                        size="large"
                        @click="navigateTo('incident')"
                        class="cta-secondary"
                      >
                        <Icon icon="mdi:alert-circle" class="button-icon" />
                        Incident Report
                      </el-button>
                    </div>
                  </div>
            </el-col>
            
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
              <div class="hero-preview">
                <el-card class="preview-card" shadow="hover">
                  <div class="preview-dashboard">
                    <!-- Fake Sidebar -->
                    <div class="preview-sidebar">
                      <div class="sidebar-item active"></div>
                      <div class="sidebar-item"></div>
                      <div class="sidebar-item"></div>
                      <div class="sidebar-item"></div>
                          </div>
                    
                    <!-- Fake Content Area -->
                    <div class="preview-content">
                      <div class="preview-header">
                        <div class="header-line"></div>
                        <div class="header-line short"></div>
                      </div>
                      <div class="preview-table">
                        <div class="table-row"></div>
                        <div class="table-row"></div>
                        <div class="table-row"></div>
                        <div class="table-row"></div>
                      </div>
                      <div class="preview-chart-container">
                        <el-carousel 
                          :interval="4000" 
                          :height="'180px'"
                          indicator-position="none"
                          arrow="never"
                          class="chart-carousel"
                        >
                          <el-carousel-item>
                            <div class="preview-chart">
                              <div class="chart-bar" style="height: 60%"></div>
                              <div class="chart-bar" style="height: 80%"></div>
                              <div class="chart-bar" style="height: 45%"></div>
                              <div class="chart-bar" style="height: 90%"></div>
                              <div class="chart-bar" style="height: 70%"></div>
                            </div>
                          </el-carousel-item>
                          <el-carousel-item>
                            <div class="preview-chart pie-chart">
                              <div class="pie-chart-container">
                                <svg
                                  viewBox="0 0 100 100"
                                  class="pie-svg"
                                >
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#00DC82"
                                    stroke-width="10"
                                    stroke-dasharray="70.7 282.6"
                                    stroke-dashoffset="0"
                                    transform="rotate(-90 50 50)"
                                  />
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#409EFF"
                                    stroke-width="10"
                                    stroke-dasharray="70.7 282.6"
                                    stroke-dashoffset="-70.7"
                                    transform="rotate(-90 50 50)"
                                  />
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#E6A23C"
                                    stroke-width="10"
                                    stroke-dasharray="70.7 282.6"
                                    stroke-dashoffset="-141.4"
                                    transform="rotate(-90 50 50)"
                                  />
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#F56C6C"
                                    stroke-width="10"
                                    stroke-dasharray="70.7 282.6"
                                    stroke-dashoffset="-212.1"
                                    transform="rotate(-90 50 50)"
                                  />
                                </svg>
                              </div>
                            </div>
                          </el-carousel-item>
                        </el-carousel>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
                      </el-col>
          </el-row>
                          </div>
      </section>

      <!-- Features Section -->
      <section id="features" ref="featuresSection" class="features-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">System Capabilities</h2>
            <p class="section-subtitle">
              Comprehensive tools for managing informal settlements, tracking projects, and processing grievances
            </p>
          </div>
          
          <el-row :gutter="32" class="features-grid">
            <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8" v-for="feature in features" :key="feature.id">
              <el-card 
                class="feature-card"
                shadow="hover">
                <div class="feature-icon-wrapper">
                  <Icon :icon="feature.icon" class="feature-icon-large" />
                </div>
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
              </el-card>
                      </el-col>
          </el-row>
                          </div>
      </section>

      <!-- Why This System Section -->
      <section class="why-section" ref="whySection">
        <div class="section-container">
          <el-row :gutter="40" align="middle">
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
              <div class="why-content">
                <h2 class="section-title">About KISIP</h2>
                <p class="why-description">
                  KeSMIS is implemented under the Kenya Informal Settlements Improvement Project (KISIP), 
                  a government initiative aimed at improving living conditions in informal settlements across Kenya. 
                  The system supports evidence-based planning and decision-making for urban development interventions.
                </p>
                <ul class="why-list">
                  <li>
                    <Icon icon="mdi:shield-check" class="list-icon" />
                    <span>Compliant with government data security and privacy standards</span>
                  </li>
                  <li>
                    <Icon icon="mdi:account-group" class="list-icon" />
                    <span>Multi-stakeholder access for national, county, and project teams</span>
                  </li>
                  <li>
                    <Icon icon="mdi:map-marker-multiple" class="list-icon" />
                    <span>Standardized geospatial data collection and management</span>
                  </li>
                  <li>
                    <Icon icon="mdi:chart-line" class="list-icon" />
                    <span>Performance monitoring and evaluation reporting</span>
                  </li>
                </ul>
              </div>
                      </el-col>
            
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
              <div class="stats-stack">
                <div class="stat-item">
                  <div class="stat-number">{{ NumSettlements }}+</div>
                  <div class="stat-text">Informal Settlements</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ Population }}+</div>
                  <div class="stat-text">Residents Recorded</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ TotalProjs }}+</div>
                  <div class="stat-text">KISIP Projects</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">24/7</div>
                  <div class="stat-text">System Availability</div>
                </div>
              </div>
                      </el-col>
                    </el-row>
        </div>
                  </section>

      <!-- How It Works Section -->
      <section id="how-it-works" ref="howItWorksSection" class="how-it-works-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">System Access</h2>
            <p class="section-subtitle">
              Access the system through authorized user accounts
            </p>
                </div>
          
          <el-row :gutter="24" class="steps-grid">
            <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6" v-for="(step, index) in steps" :key="step.id">
              <el-card 
                class="step-card"
                shadow="hover">
                <div class="step-number">{{ index + 1 }}</div>
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-description">{{ step.description }}</p>
              </el-card>
              </el-col>
            </el-row>
          </div>
      </section>

      <!-- Grievance Hero Section -->
      <section id="grievances" class="grievance-hero-section">
        <div class="hero-container">
          <el-row :gutter="40" align="middle">
            <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14">
              <div class="hero-content">
                <h2 class="hero-title">
                  Electronic Grievance Redress Mechanism
                </h2>
                <p class="hero-description">
                  Submit, track, and resolve grievances related to KISIP projects and activities through our transparent and accessible platform.
                </p>
                <ul class="hero-features">
                  <li>
                    <Icon icon="mdi:check-circle" class="feature-icon" />
                    <span>Submit grievances online or via toll-free helpline</span>
                  </li>
                  <li>
                    <Icon icon="mdi:check-circle" class="feature-icon" />
                    <span>Track your grievance status in real-time</span>
                  </li>
                  <li>
                    <Icon icon="mdi:check-circle" class="feature-icon" />
                    <span>Confidential and secure grievance handling</span>
                  </li>
                  <li>
                    <Icon icon="mdi:check-circle" class="feature-icon" />
                    <span>Timely response and resolution</span>
                  </li>
                </ul>
                <div class="hero-cta">
                  <el-button
                    type="primary"
                    size="large"
                    @click="navigateTo('grm')"
                    class="cta-primary"
                  >
                    <Icon icon="uiw:message" class="button-icon" />
                    File a Grievance
                  </el-button>
                  <el-button
                    size="large"
                    @click="navigateTo('grm')"
                    class="cta-secondary"
                  >
                    <Icon icon="mdi:clipboard-text-search" class="button-icon" />
                    Check Status
                  </el-button>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="24" :md="10" :lg="10" :xl="10">
              <div class="hero-visual">
                <el-card class="info-card" shadow="hover">
                  <div class="info-content">
                    <Icon icon="mdi:phone-in-talk" class="info-icon" />
                    <h3>Toll-Free Helpline</h3>
                    <p class="helpline-number">
                      <a href="tel:0800724349">0800 724 349</a>
                    </p>
                    <p class="helpline-text">Available during working hours for grievance submissions</p>
                  </div>
                </el-card>
              </div>
            </el-col>
          </el-row>
        </div>
      </section>

      <!-- CTA Strip -->
      <section ref="ctaSection" class="cta-strip">
        <div class="cta-container">
          <h2 class="cta-title">Access the System</h2>
          <p class="cta-description">
            Authorized users can access KeSMIS to manage settlement data, process grievances, and monitor KISIP project activities.
          </p>
          <el-button
            type="primary"
            size="large"
            :icon="Monitor"
            @click="navigateTo('get-started')"
            class="cta-button"
          >
            Open Dashboard
          </el-button>
        </div>
      </section>


    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCache } from '@/hooks/web/useCache';
import { useAppStoreWithOut } from '@/store/modules/app';
import {
  ElButton,
  ElCol,
  ElRow,
  ElCard,
  ElCarousel,
  ElCarouselItem,
} from 'element-plus';
import BaseLayout from './BaseLayout.vue';
import { Lock, Monitor } from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary';
import { useHead } from '@unhead/vue'

useHead({
  title: 'KeSMIS | Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'Kenya Slum Management Information System (KeSMIS) - National geodatabase for slums and informal settlements across Kenya. Real-time data collection, storage, and visualization platform for urban planning and development.' },
  ]
})

const router = useRouter();
const { wsCache } = useCache();
const appStore = useAppStoreWithOut();

const isLoggedIn = computed(() => !!wsCache.get(appStore.getUserInfo));

// Section refs for scroll navigation
const featuresSection = ref<HTMLElement | null>(null);
const whySection = ref<HTMLElement | null>(null);
const howItWorksSection = ref<HTMLElement | null>(null);
const ctaSection = ref<HTMLElement | null>(null);

// Format numbers with K, M notation
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const navigateTo = (page: string) => {
  switch (page) {
    case 'get-started':
      if (isLoggedIn.value) {
        router.push('/dashboard/national');
      } else {
        router.push('/login');
      }
      break;
    case 'grm':
      router.push('/grm');
      break;
    case 'incident':
      router.push('/incidents');
      break;
    case 'docs':
      router.push('/docs');
      break;
    case 'about':
      router.push('/about');
      break;
    case 'faq':
      router.push('/faqs');
      break;
    default:
      router.push('/');
      break;
  }
};

// Data
const NumSettlements = ref('0');
const Population = ref('0');
const TotalProjs = ref('0');
const avgHHSize = ref('0');

const features = [
  {
    id: 1,
    icon: 'mdi:database',
    title: 'Settlement Data Management',
    description: 'Comprehensive geodatabase for recording and managing data on informal settlements, households, and infrastructure facilities.'
  },
  {
    id: 2,
    icon: 'mdi:map',
    title: 'Geographic Information System',
    description: 'Spatial data visualization and mapping capabilities for settlement boundaries, infrastructure locations, and project sites.'
  },
  {
    id: 3,
    icon: 'mdi:file-document-multiple',
    title: 'Electronic Grievance Redress',
    description: 'Integrated e-GRM system for receiving, tracking, and managing grievances related to KISIP projects and activities.'
  },
  {
    id: 4,
    icon: 'mdi:chart-box',
    title: 'Project Monitoring & Reporting',
    description: 'Dashboards and reporting tools for tracking project progress, outcomes, and performance indicators across all projects.'
  },
  {
    id: 5,
    icon: 'mdi:account-key',
    title: 'Multi-Level Access Control',
    description: 'Role-based access management supporting national, county, and project-level users with appropriate permissions and controls.'
  },
  {
    id: 6,
    icon: 'mdi:cloud-sync',
    title: 'Data Collection & Synchronization',
    description: 'Mobile and web-based data collection tools with real-time synchronization capabilities for efficient field operations.'
  }
];

const steps = [
  {
    id: 1,
    title: 'User Authentication',
    description: 'Access the system using authorized credentials provided by the KISIP project administration team.'
  },
  {
    id: 2,
    title: 'Data Entry & Collection',
    description: 'Record settlement data, household information, and infrastructure details through the system interfaces.'
  },
  {
    id: 3,
    title: 'Grievance Processing',
    description: 'Submit and manage grievances through the electronic Grievance Redress Mechanism (e-GRM) platform.'
  },
  {
    id: 4,
    title: 'Reporting & Analysis',
    description: 'Generate reports, view dashboards, and analyze data for project monitoring and evaluation purposes.'
  }
];


// Fetch data
const getNumberOFSettlements = async () => {
  const formData = {
    model: 'settlement',
    summaryField: 'id',
    summaryFunction: 'count',
    groupFields: [],
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
  };
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const summary = response.Total;
    NumSettlements.value = formatNumber(summary[0].count);
  } catch (error) {
    console.error('Error fetching settlement count:', error);
  }
};

const PopulationSettlements = async () => {
  const formData = {
    model: 'settlement',
    summaryField: 'population',
    summaryFunction: 'SUM',
    groupFields: [],
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
  };
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const summary = response.Total;
    Population.value = formatNumber(summary[0].SUM);
  } catch (error) {
    console.error('Error fetching population:', error);
  }
};

const NumOfProjects = async () => {
  const formData = {
    model: 'project',
    summaryField: 'id',
    summaryFunction: 'count',
    groupFields: [],
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
  };
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const summary = response.Total;
    TotalProjs.value = formatNumber(summary[0].count);
  } catch (error) {
    console.error('Error fetching project count:', error);
  }
};

const AvgHHSize = async () => {
  const formData = {
    model: 'households',
    summaryField: 'hh_size',
    summaryFunction: 'AVG',
    groupFields: [],
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
  };
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const summary = response.Total;
    avgHHSize.value = parseFloat(summary[0].AVG).toFixed(1);
  } catch (error) {
    console.error('Error fetching average household size:', error);
  }
};

getNumberOFSettlements();
PopulationSettlements();
NumOfProjects();
AvgHHSize();
</script>

<style scoped>
/* Landing Page Container */
.landing-page {
  width: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: visible;
  height: auto;
}

/* Hide scrollbar but keep scrolling functionality */
.landing-page::-webkit-scrollbar {
  display: none;
}

.landing-page {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

/* Smooth scrolling for all sections */
.landing-page section {
  scroll-margin-top: 90px;
}

/* Section Container */
.section-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Hero Section */
.hero-section {
  padding: 4rem 0 3rem;
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.hero-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero-content {
  animation: fadeInUp 0.6s ease-out;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 20px;
}

.badge-icon {
  font-size: 1rem;
}

.hero-content {
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  text-align: left;
}

.title-accent {
  background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  max-width: 600px;
  text-align: left;
}

.hero-features {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
  align-items: flex-start;
}

.hero-features li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
  color: var(--text-primary);
}

.feature-icon {
  font-size: 1.25rem;
  color: #00DC82;
  flex-shrink: 0;
}

.hero-cta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
}

.cta-primary {
  padding: 0.875rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  background: #00DC82 !important;
  border-color: #00DC82 !important;
  color: white !important;
}

.cta-primary:hover {
  background: #00B86B !important;
  border-color: #00B86B !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 220, 130, 0.3);
}

.cta-secondary {
  padding: 0.875rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.cta-secondary:hover {
  background: rgba(64, 158, 255, 0.1);
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  transform: translateY(-2px);
}

.button-icon {
  font-size: 1.125rem;
  margin-right: 0.5rem;
}

/* Hero Preview */
.hero-preview {
  animation: fadeInUp 0.6s ease-out 0.2s backwards;
}

.preview-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
}

.preview-card :deep(.el-card__body) {
  padding: 0;
}

.preview-dashboard {
  display: flex;
  height: 400px;
  background: var(--bg-primary);
}

.preview-sidebar {
  width: 60px;
  background: var(--bg-secondary);
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-item {
  width: 100%;
  height: 40px;
  background: var(--border-color);
  border-radius: 8px;
  opacity: 0.5;
}

.sidebar-item.active {
  background: #00DC82;
  opacity: 1;
}

.preview-content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.preview-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.header-line {
  height: 12px;
  background: var(--border-color);
  border-radius: 4px;
  width: 60%;
}

.header-line.short {
  width: 40%;
}

.preview-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.table-row {
  height: 6px;
  background: var(--border-color);
  border-radius: 4px;
  opacity: 0.6;
}

.preview-chart-container {
  margin-top: auto;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.chart-carousel {
  width: 100%;
  height: 100%;
}

.chart-carousel :deep(.el-carousel__container) {
  height: 180px;
}

.chart-carousel :deep(.el-carousel__item) {
  height: 180px;
}

.preview-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  height: 100%;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #00DC82 0%, #00B86B 100%);
  border-radius: 4px 4px 0 0;
  min-height: 30px;
  min-width: 0;
}

/* Pie Chart Styles */
.pie-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 1rem;
  box-sizing: border-box;
}

.pie-chart-container {
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}

.pie-svg {
  width: 100%;
  height: 100%;
  max-width: 150px;
  max-height: 150px;
}

/* Features Section */
.features-section {
  padding: 5rem 0;
  background: var(--bg-primary);
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  margin-top: 3rem;
  margin-bottom: 2rem;
}

.feature-card {
  margin-bottom: 2rem;
  min-height: 200px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  text-align: center;
  padding: 2rem 1.5rem;
}


.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 220, 130, 0.2);
  border-color: #00DC82;
}

.feature-card :deep(.el-card__body) {
  padding: 0;
}

.feature-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.1) 0%, rgba(0, 220, 130, 0.05) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon-large {
  font-size: 2rem;
  color: #00DC82;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.feature-description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Why Section */
.why-section {
  padding: 5rem 0;
  background: var(--bg-secondary);
}

.why-content {
  animation: fadeInLeft 0.6s ease-out;
}

.why-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.why-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.why-list li {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
  font-size: 1rem;
  color: var(--text-primary);
}

.list-icon {
  font-size: 1.5rem;
  color: #00DC82;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.stats-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeInRight 0.6s ease-out;
}

.stat-item {
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  text-align: center;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateX(8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #00DC82;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.stat-text {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* How It Works Section */
.how-it-works-section {
  padding: 5rem 0;
  background: var(--bg-primary);
}

.steps-grid {
  margin-top: 3rem;
}

.steps-grid :deep(.el-col) {
  margin-bottom: 2rem;
}

.step-card {
  height: 100%;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  text-align: center;
  padding: 2rem 1.5rem;
  position: relative;
}

.step-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.step-card :deep(.el-card__body) {
  padding: 0;
}

.step-number {
  width: 48px;
  height: 48px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%);
  color: white;
  border-radius: 50%;
    display: flex;
    align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.step-description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* CTA Strip */
.cta-strip {
  padding: 5rem 0;
  background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%);
  color: white;
  text-align: center;
}

.cta-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cta-description {
  font-size: 1.125rem;
    margin-bottom: 2rem;
  opacity: 0.95;
}

.cta-button {
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  background: white;
  color: #00DC82;
  border: none;
}

.cta-button:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #00B86B;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 220, 130, 0.2);
}


/* Grievance Hero Section */
.grievance-hero-section {
  padding: 5rem 0;
  background: var(--bg-secondary);
}

.grievance-hero-section .hero-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.grievance-hero-section .hero-content {
  animation: fadeInUp 0.6s ease-out;
  text-align: left;
  align-items: flex-start;
}

.grievance-hero-section .hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  text-align: left;
}

.grievance-hero-section .hero-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 600px;
  text-align: left;
}

.grievance-hero-section .hero-features {
  align-items: flex-start;
  list-style: none;
  padding: 0;
  margin: 0 0 2.5rem 0;
}

.grievance-hero-section .hero-features li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: var(--text-primary);
}

.grievance-hero-section .hero-cta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
}

.grievance-hero-section .cta-primary,
.grievance-hero-section .cta-secondary {
  padding: 0.875rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.grievance-hero-section .cta-primary {
  background: #00DC82 !important;
  border-color: #00DC82 !important;
  color: white !important;
}

.grievance-hero-section .cta-primary:hover {
  background: #00B86B !important;
  border-color: #00B86B !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 220, 130, 0.3);
}

.grievance-hero-section .cta-secondary {
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
}

.grievance-hero-section .cta-secondary:hover {
  background: rgba(0, 220, 130, 0.1);
  border-color: #00DC82;
  color: #00DC82;
  transform: translateY(-2px);
}

.grievance-hero-section .hero-visual {
  animation: fadeInUp 0.6s ease-out 0.2s backwards;
}

.grievance-hero-section .info-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  text-align: center;
  padding: 2rem;
}

.grievance-hero-section .info-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.grievance-hero-section .info-icon {
  font-size: 4rem;
  color: #00DC82;
  margin-bottom: 0.5rem;
}

.grievance-hero-section .info-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.grievance-hero-section .helpline-number {
  font-size: 2rem;
  font-weight: 800;
  color: #00DC82;
  margin: 0.5rem 0;
}

.grievance-hero-section .helpline-number a {
  color: #00DC82;
  text-decoration: none;
  transition: all 0.3s ease;
}

.grievance-hero-section .helpline-number a:hover {
  color: #00B86B;
  text-decoration: underline;
}

.grievance-hero-section .helpline-text {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}


@media (max-width: 768px) {
  .grievance-hero-section {
    padding: 3rem 0 2rem;
  }

  .grievance-hero-section .hero-title {
    font-size: 2rem;
  }

  .grievance-hero-section .hero-description {
    font-size: 1rem;
  }

  .grievance-hero-section .hero-cta {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 0.75rem;
    width: 100%;
  }

  .grievance-hero-section .cta-primary,
  .grievance-hero-section .cta-secondary {
    width: 100%;
    justify-content: center;
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }

  .grievance-hero-section .info-icon {
    font-size: 3rem;
  }

  .grievance-hero-section .helpline-number {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .grievance-hero-section .hero-cta {
    gap: 0.625rem;
  }

  .grievance-hero-section .cta-primary,
  .grievance-hero-section .cta-secondary {
    padding: 0.875rem 1.25rem;
    font-size: 0.9375rem;
  }
}


/* Legacy animations (for initial load) */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Accessibility */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-section {
    padding: 3rem 0 2rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-description {
    font-size: 1.125rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .section-container {
    padding: 0 1rem;
  }

  .hero-container {
    padding: 0 1rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .preview-dashboard {
    height: 300px;
  }

  .hero-cta {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 0.75rem;
    width: 100%;
    margin-bottom: 2rem;
  }

  .cta-primary,
  .cta-secondary {
    width: 100%;
    justify-content: center;
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .preview-dashboard {
    height: 250px;
  }

  .hero-cta {
    gap: 0.625rem;
    margin-bottom: 2rem;
  }

  .cta-primary,
  .cta-secondary {
    padding: 0.875rem 1.25rem;
    font-size: 0.9375rem;
  }
}

/* Dark Mode Support */
.dark-mode .preview-dashboard {
  background: var(--bg-secondary);
}

.dark-mode .preview-sidebar {
  background: var(--bg-primary);
}

.dark-mode .stat-item {
  background: var(--bg-primary);
}
</style>
