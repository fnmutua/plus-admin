<template>
  <BaseLayout>
    <div class="landing-container">
      <el-container class="main-container">
        <el-main class="main-content">
          <div class="hero">
            <el-row justify="center">
              <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
                <div class="hero-content">
                  <div class="hero-text">
                    <h1 class="main-title">Welcome to KeSMIS</h1>
                    <h3 class="subtitle">Kenya Slum Management Information System</h3>

                    <p class="description">
                      This is the national geodatabase for slums and informal settlements across Kenya. It provides a centralized platform for real-time data collection, storage, and visualization.
                    </p>

                    <div class="cta-buttons">
                      <el-button
                        type="primary"
                        :icon="Lock"
                        size="large"
                        class="login-btn"
                        @click="navigateTo('get-started')"
                      >
                        Login
                      </el-button>
                      <el-button
                        type="info"
                        size="large"
                        :icon="More"
                        class="more-btn"
                        @click="navigateTo('about')"
                      >
                        Learn More
                      </el-button>
                    </div>
                  </div>

                  <el-row :gutter="20" class="stats-grid">
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                      <el-card shadow="hover" class="stat-card">
                        <div class="stat-icon">
                          <Icon icon="tabler:map-2" />
                        </div>
                        <div class="stat-value">{{ NumSettlements }}</div>
                        <div class="stat-label">Settlements</div>
                      </el-card>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                      <el-card shadow="hover" class="stat-card">
                        <div class="stat-icon">
                          <Icon icon="mdi:account-group" />
                        </div>
                        <div class="stat-value">{{ AvgSize }}</div>
                        <div class="stat-label">People living in Slums</div>
                      </el-card>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                      <el-card shadow="hover" class="stat-card">
                        <div class="stat-icon">
                          <Icon icon="fa-solid:road" />
                        </div>
                        <div class="stat-value">{{ TotalProjs }}</div>
                        <div class="stat-label">Intervention Projects</div>
                      </el-card>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="6">
                      <el-card shadow="hover" class="stat-card">
                        <div class="stat-icon">
                          <Icon icon="vaadin:family" />
                        </div>
                        <div class="stat-value">{{ avgHHSize }}</div>
                        <div class="stat-label">Avg. Household Size</div>
                      </el-card>
                    </el-col>
                  </el-row>
                  
                  <el-card class="grievance-section" shadow="hover">
                    <div class="grievance-content">
                      <div class="grievance-icon">
                        <Icon icon="mdi:file-document-edit" />
                      </div>
                      <p class="grievance-message">
                        If you have a grievance against the KISIP project or its actors, you can
                        <el-button plain link class="grievance-link" @click="navigateTo('grm')">file a grievance</el-button>,
                        send us an email at
                        <a href="mailto:kisip2info@housingandurban.go.ke" class="grievance-link">kisip2info@housingandurban.go.ke</a>,
                        or call our helpline at
                        <a href="tel:0800724349" class="grievance-link">0800 724 349</a>.
                      </p>
                    </div>
                  </el-card>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-main>
      </el-container>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ElButton,
  ElCol,
  ElRow,
  ElMain,
  ElContainer,
  ElCard,
} from 'element-plus';
import BaseLayout from './BaseLayout.vue';
import { Lock, More } from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary';

const router = useRouter();

const navigateTo = (page: string) => {
  switch (page) {
    case 'get-started':
      router.push('/login');
      break;
    case 'grm':
      router.push('/grm');
      break;
    case 'about':
      router.push('/about');
      break;
    default:
      router.push('/');
      break;
  }
};

const NumSettlements = ref(0);
const AvgSize = ref(0);
const TotalProjs = ref(0);
const avgHHSize = ref(0);

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
    NumSettlements.value = summary[0].count;
  } catch (error) {
    console.error('Error fetching settlement count:', error);
  }
};

const avgSizeSettlements = async () => {
  const formData = {
    model: 'settlement',
    summaryField: 'area',
    summaryFunction: 'AVG',
    groupFields: [],
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
  };
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const summary = response.Total;
    AvgSize.value = summary[0].AVG.toFixed(0);
  } catch (error) {
    console.error('Error fetching average area:', error);
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
    TotalProjs.value = summary[0].count;
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
    avgHHSize.value = parseFloat(summary[0].AVG).toFixed(0);
  } catch (error) {
    console.error('Error fetching average household size:', error);
  }
};

getNumberOFSettlements();
avgSizeSettlements();
NumOfProjects();
AvgHHSize();
</script>

<style scoped>
/* 1. Make entire page scrollable, but remove horizontal overflow */
.landing-container {
  width: 100%;
  max-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* smooth scrolling on iOS */
}

/* 2. Ensure the Element container also scrolls vertically if needed */
.main-container {
  width: 100%;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: 1rem 2rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 3. HERO SECTION LAYOUT */
.hero {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.8s ease-out;
  padding-bottom: 2rem;
}

.hero-content {
  max-width: 1300px;
  margin: 0 auto;
}

/* HERO TEXT */
.hero-text {
  text-align: center;
  margin-bottom: 2rem;
}

.main-title {
  font-size: 3rem;
  font-weight: 800;
  color: var(--el-color-primary);
  margin-bottom: 0.5rem;
  line-height: 1.2;
  animation: slideUp 0.8s ease-out;
}

.subtitle {
  font-size: 2rem;
  color: var(--el-text-color-primary);
  margin-bottom: 1rem;
  font-weight: 500;
  animation: slideUp 0.8s ease-out 0.2s backwards;
}

.description {
  font-size: 1.2rem;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  animation: slideUp 0.8s ease-out 0.4s backwards;
}

.cta-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 1rem;
  animation: slideUp 0.8s ease-out 0.6s backwards;
}

.login-btn {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.login-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.more-btn {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.more-btn:hover {
  transform: translateY(-3px);
  background-color: var(--el-color-info-light-9);
}

/* 4. STATS GRID (using Element Row/Col) */
.stats-grid {
  margin: 1rem 0;
  animation: slideUp 0.8s ease-out 0.8s backwards;
  max-width: 1400px;
}

.stat-card {
  height: 90%;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-lighter);
  background: transparent;
  box-shadow: none !important;
  border-radius: 8px;
  padding: 1.5rem;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--el-color-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.9;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--el-color-primary);
  margin-bottom: 0.5rem;
  opacity: 0.95;
}

.stat-label {
  font-size: 1.1rem;
  color: var(--el-text-color-regular);
  font-weight: 500;
  opacity: 0.85;
}

/* 5. GRIEVANCE SECTION */
.grievance-section {
   animation: slideUp 0.8s ease-out 1s backwards;
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: none !important;
  border-radius: 8px;
  padding: 0.1rem;
}

.grievance-section:hover {
  border-color: var(--el-color-success-light-5);
}

.grievance-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  flex-wrap: nowrap;
}

.grievance-icon {
  font-size: 3rem;
  flex-shrink: 0;
  color: var(--el-color-success);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.9;
}

.grievance-icon .iconify {
  width: 3rem;
  height: 3rem;
}

.grievance-message {
  font-size: 1.1rem;
  color: var(--el-text-color-regular);
  line-height: 1.8;
  margin: 0;
}

.grievance-link {
  color: var(--el-color-success);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.grievance-link:hover {
  color: var(--el-color-success-dark-2);
  text-decoration: underline;
}

/* 6. ANIMATIONS */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 7. RESPONSIVE ADJUSTMENTS */

/* Up to 768px wide (tablets & small desktops) */
@media (max-width: 768px) {
  .main-content {
    padding: 2rem 2rem;
  }

  .hero {
    padding-bottom: 2rem;
  }

  .main-title {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }

  .subtitle {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .description {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
    padding: 0 0.5rem;
  }

  .cta-buttons {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }

  .login-btn,
  .more-btn {
    width: 100%;
    padding: 0.8rem;
    font-size: 1rem;
  }

  .stats-grid {
    margin: 2rem 0;
  }

  .stat-icon {
    font-size: 2rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .stat-label {
    font-size: 1rem;
  }

  .grievance-section {
    margin-top: 2rem;
  }

  .grievance-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    padding: 0 0.5rem;
  }

  .grievance-icon {
    font-size: 2.5rem;
  }

  .grievance-message {
    font-size: 1rem;
    line-height: 1.6;
  }
}

/* Up to 480px wide (phones) */
@media (max-width: 480px) {
  /* Force the landing-container & main-container to fill viewport */
  .landing-container,
  .main-container {
    max-height: 100vh;
  }

  /* Cap main-content at viewport height so overflow can scroll */
  .main-content {
    padding: 1rem 1.5rem;
    max-height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .main-title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .description {
    font-size: 0.95rem;
    padding: 0;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.6rem;
  }

  .stat-label {
    font-size: 0.9rem;
  }

  /* Make grievance-section scrollable within phone viewport too */
  .grievance-section {
    padding: 1rem;
    max-height: 50vh; /* or adjust as needed */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .grievance-message {
    font-size: 0.95rem;
    line-height: 1.4;
  }
}
</style>
