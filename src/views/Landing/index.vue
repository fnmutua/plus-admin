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
                    <h2 class="subtitle">Kenya Slum Management Information System</h2>

                    <p class="description">
                      This is the national geodatabase for slums and informal settlements across Kenya. It provides a centralized platform for real-time data collection, storage, and visualization to support urban planning and development initiatives across the country.
                    </p>

                    <div class="cta-buttons">
                      <el-button
                        type="primary"
                        :icon="Lock"
                        size="large"
                        class="login-btn"
                        @click="navigateTo('get-started')"
                      >
                        Get Started
                      </el-button>
                      <el-button
                        type="warning"
                        size="large"
                        class="login-btn"
                        @click="router.push('/grm')"
                      >
                        File a Grievance
                      </el-button>
                      <el-button
                        type="success"
                        size="large"
                        class="login-btn"
                        @click="router.push('/incidents')"
                      >
                        Report Incident
                      </el-button>
                    </div>
                  </div>

                  <section class="stats-section" aria-label="System Statistics">
                    <h2 class="visually-hidden">KeSMIS System Statistics</h2>
                    <el-row :gutter="10" class="stats-grid">
                      <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <article class="stat-card">
                          <div class="stat-icon" aria-hidden="true">
                            <Icon icon="tabler:map-2" />
                          </div>
                          <div class="stat-value" aria-label="Number of settlements">{{ NumSettlements }}</div>
                          <div class="stat-label">Slums/Informal settlements</div>
                        </article>
                      </el-col>
                      <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <article class="stat-card">
                          <div class="stat-icon" aria-hidden="true">
                            <Icon icon="mdi:account-group" />
                          </div>
                          <div class="stat-value" aria-label="Population in slums">{{ Population }}</div>
                          <div class="stat-label">People living in Slums</div>
                        </article>
                      </el-col>
                      <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <article class="stat-card">
                          <div class="stat-icon" aria-hidden="true">
                            <Icon icon="fa-solid:road" />
                          </div>
                          <div class="stat-value" aria-label="Total projects">{{ TotalProjs }}</div>
                          <div class="stat-label">Intervention Projects</div>
                        </article>
                      </el-col>
                      <el-col :xs="24" :sm="12" :md="8" :lg="6">
                        <article class="stat-card">
                          <div class="stat-icon" aria-hidden="true">
                            <Icon icon="vaadin:family" />
                          </div>
                          <div class="stat-value" aria-label="Average household size">{{ avgHHSize }}</div>
                          <div class="stat-label">Avg. Household Size</div>
                        </article>
                      </el-col>
                    </el-row>
                  </section>
                </div>
              </el-col>
            </el-row>
          </div>

          <section class="grievance-section" aria-label="Grievance Reporting">
            <el-row justify="center">
              <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
                <div class="grievance-content">
                  <h2 class="visually-hidden">Report a Grievance</h2>
                  <p class="grievance-message">
                    If you have a grievance against the KISIP project or its actors, you can
                    <el-button plain link class="grievance-link" @click="navigateTo('grm')" aria-label="File a grievance online">file a grievance</el-button>, or call our toll free helpline at
                    <a href="tel:0800724349" class="grievance-link" aria-label="Call toll free helpline">0800 724 349</a> free of charge.
                  </p>
                </div>
              </el-col>
            </el-row>
          </section>
        </el-main>
      </el-container>
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
  ElMain,
  ElContainer,
} from 'element-plus';
import BaseLayout from './BaseLayout.vue';
import { Lock } from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary';
import { useHead } from '@unhead/vue'

useHead({
  title: 'KeSMIS | Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'Kenya Slum Management Information System (KeSMIS) - National geodatabase for slums and informal settlements across Kenya. Real-time data collection, storage, and visualization platform for urban planning and development.' },
    { name: 'keywords', content: 'Kenya slums, informal settlements, urban planning, KISIP, geodatabase, slum management, data collection, Kenya housing, urban development, settlement mapping' },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph tags (for WhatsApp, Facebook, LinkedIn)
    { property: 'og:title', content: 'KeSMIS |  Kenya Slum Management Information System' },
    { property: 'og:description', content: 'National geodatabase for slums and informal settlements across Kenya. Real-time data collection, storage, and visualization platform.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke' },
    { property: 'og:image', content: 'https://kesmis.go.ke/logo.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'KeSMIS - Kenya Slum Management Information System' },
    { name: 'twitter:description', content: 'National geodatabase for slums and informal settlements across Kenya. Real-time data collection and visualization platform.' },
    { name: 'twitter:image', content: 'https://kesmis.go.ke/twitter-card.jpg' },
    { name: 'twitter:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    
    // Additional meta tags for better SEO
    { name: 'theme-color', content: '#684035' },
    { name: 'msapplication-TileColor', content: '#684035' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'format-detection', content: 'telephone=no' }
  ]
})


 

const router = useRouter();
const { wsCache } = useCache();
const appStore = useAppStoreWithOut();

const isLoggedIn = computed(() => !!wsCache.get(appStore.getUserInfo));


// Function to format numbers with K, M notation
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
    case 'about':
      router.push('/about');
      break;
    case 'faq':
      router.push('/faq');
      break;
    default:
      router.push('/');
      break;
  }
};

const NumSettlements = ref('0');
const Population = ref('0');
const TotalProjs = ref('0');
const avgHHSize = ref('0');

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
/* 1. Make entire page scrollable, but remove horizontal overflow */
.landing-container {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* smooth scrolling on iOS */
}

/* 2. Ensure the Element container also scrolls vertically if needed */
.main-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 1rem 1.5rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
}

/* 3. HERO SECTION LAYOUT */
.hero {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.8s ease-out;
  flex-shrink: 0;
  padding: 1.5rem 0;
}

.hero-content {
  max-width: 1300px;
  margin: 0 auto;
}

.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-carousel {
  width: 100%;
  max-width: 500px;
}

.carousel-image {
  position: relative;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.carousel-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 2rem 1rem 1rem;
  text-align: center;
}

.image-overlay h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.image-overlay p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

/* HERO TEXT */
.hero-text {
  text-align: center;
  margin-bottom: 1.5rem;
}

.main-title {
  font-size: 3.2rem;
  font-weight: 800;
  color: var(--el-color-primary);
  margin-bottom: 2.5rem;
  line-height: 1.1;
  animation: slideUp 0.8s ease-out;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 1.4rem;
  color: var(--el-text-color-primary);
  margin-bottom: 2.5rem;
  font-weight: 500;
  animation: slideUp 0.8s ease-out 0.2s backwards;
  text-align: center;
}

.description {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  margin-bottom: 3rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  animation: slideUp 0.8s ease-out 0.4s backwards;
  text-align: center;
  font-weight: 400;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  animation: slideUp 0.8s ease-out 0.6s backwards;
  flex-wrap: wrap;
}

.login-btn {
  padding: 1rem 2rem;
  font-size: 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  font-weight: 600;
  min-width: 160px;
  min-height: 50px;
}

.login-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  background-color: var(--el-color-primary-dark-2);
}

.api-btn {
  margin-left: 1rem;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.api-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

/* 4. STATS GRID (using Element Row/Col) */
.stats-grid {
  margin: 2rem auto;
  animation: slideUp 0.8s ease-out 0.8s backwards;
  max-width: 1200px;
  display: flex;
  justify-content: center;
  align-items: stretch;
}

.stat-card {
  height: 100%;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e8eaed;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  margin: 0.5rem;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: #684035;
  box-shadow: 0 20px 40px rgba(104, 64, 53, 0.15);
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
  background: linear-gradient(135deg, rgba(104, 64, 53, 0.15), rgba(104, 64, 53, 0.1));
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #684035;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(104, 64, 53, 0.1), rgba(104, 64, 53, 0.05));
  border-radius: 50%;
  transition: all 0.3s ease;
}

.stat-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 0.95rem;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.3;
}

/* 5. STATS SECTION */
.stats-section {
  margin: 2rem 0;
  animation: slideUp 0.8s ease-out 0.8s backwards;
}

/* Dark mode for stats cards */
.dark-mode .stat-card {
  background: #2c2c2c;
  border-color: #3a3a3a;
  color: #e8eaed;
}

.dark-mode .stat-card:hover {
  background: linear-gradient(135deg, #2c2c2c 0%, #363636 100%);
  border-color: #684035;
}

.dark-mode .stat-value {
  color: #ffffff;
}

.dark-mode .stat-label {
  color: #b0b3b8;
}

.dark-mode .stat-icon {
  color: #684035;
  background: linear-gradient(135deg, rgba(104, 64, 53, 0.2), rgba(104, 64, 53, 0.1));
}

.dark-mode .main-title {
  color: #ffffff;
}

.dark-mode .subtitle {
  color: #d1d5db;
}

.dark-mode .description {
  color: #cbd5f5;
}

.dark-mode .section-header h2 {
  color: #ffffff;
}

.dark-mode .section-header p {
  color: #d1d5db;
}

.dark-mode .feature-card {
  border-color: #3a3a3a;
  background: #2c2c2c;
}

.dark-mode .feature-card h3 {
  color: #ffffff;
}

.dark-mode .feature-card p {
  color: #e2e8f0;
}

.dark-mode .api-text h2 {
  color: #ffffff;
}

.dark-mode .api-text p,
.dark-mode .api-features li {
  color: #d1d5db;
}

.dark-mode .grievance-message {
  color: #e8eaed;
}

.dark-mode .grievance-link {
  color: #66d9a3;
}

.dark-mode .grievance-link:hover {
  color: #7ef0bb;
}

/* 6. FEATURES SECTION */
.features-section {
  margin: 4rem 0;
  animation: slideUp 0.8s ease-out 1s backwards;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--el-color-primary);
  margin-bottom: 1rem;
}

.section-header p {
  font-size: 1.2rem;
  color: var(--el-text-color-regular);
  max-width: 600px;
  margin: 0 auto;
}

.feature-card {
  text-align: center;
  padding: 2rem 1.5rem;
  height: 100%;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-lighter);
  background: transparent;
  box-shadow: none !important;
  border-radius: 12px;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: var(--el-color-primary);
  display: flex;
  justify-content: center;
  align-items: center;
}

.feature-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 1rem;
}

.feature-card p {
  font-size: 1rem;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

/* 7. API SECTION */
.api-section {
  margin: 4rem 0;
  animation: slideUp 0.8s ease-out 1.2s backwards;
}

.api-card {
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
  border: none;
  border-radius: 16px;
  overflow: hidden;
}

.api-content {
  display: flex;
  align-items: center;
  gap: 3rem;
  padding: 2rem;
}

.api-text {
  flex: 1;
}

.api-text h2 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--el-color-primary);
  margin-bottom: 1rem;
}

.api-text p {
  font-size: 1.1rem;
  color: var(--el-text-color-regular);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.api-features {
  list-style: none;
  padding: 0;
  margin-bottom: 2rem;
}

.api-features li {
  font-size: 1rem;
  color: var(--el-text-color-regular);
  margin-bottom: 0.5rem;
  padding-left: 0;
}

.api-docs-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 600;
}

.api-docs-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.api-visual {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.api-code-icon {
  font-size: 8rem;
  color: var(--el-color-primary);
  opacity: 0.3;
}

/* 8. GRIEVANCE SECTION */
.grievance-section {
  animation: slideUp 0.8s ease-out 1.4s backwards;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.3rem 0;
}

.grievance-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.grievance-message {
  font-size: 0.9rem;
  color: var(--el-text-color-primary);
  margin: 0;
  font-weight: 400;
  text-align: center;
}

.grievance-link {
  color: var(--el-color-success);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  white-space: nowrap;
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

/* 7. ACCESSIBILITY */
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

/* 8. RESPONSIVE ADJUSTMENTS */

/* Up to 768px wide (tablets & small desktops) */
@media (max-width: 768px) {
  .landing-container {
    min-height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .main-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    padding: 0.8rem;
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .hero {
    padding: 1rem 0;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .hero-content {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .hero-visual {
    margin-top: 2rem;
  }

  .image-carousel {
    max-width: 100%;
  }

  .main-title {
    font-size: 2.8rem;
    margin-bottom: 2rem;
  }

  .subtitle {
    font-size: 1.3rem;
    margin-bottom: 2rem;
  }

  .description {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
    padding: 0 0.5rem;
  }

  .cta-buttons {
    flex-direction: column;
    gap: 1rem;
    padding: 0 2rem;
    margin-bottom: 2rem;
    align-items: center;
    width: 100%;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .login-btn, .api-btn {
    width: 100%;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    margin-left: 0;
    border-radius: 12px;
    font-weight: 600;
    min-height: 50px;
  }

  .stats-grid {
    margin: 2rem auto;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 0 1rem;
  }

  .stat-card {
    padding: 2rem 1.5rem;
    margin: 0.8rem 0;
    min-height: 160px;
    width: 100%;
    max-width: 350px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .stat-icon {
    font-size: 2.2rem;
    margin-bottom: 1rem;
    width: 55px;
    height: 55px;
  }

  .stat-value {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    font-weight: 800;
  }

  .stat-label {
    font-size: 0.9rem;
    text-align: center;
    line-height: 1.3;
  }

  .section-header h2 {
    font-size: 2rem;
  }

  .section-header p {
    font-size: 1.1rem;
  }

  .feature-card {
    margin-bottom: 1rem;
  }

  .api-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }

  .api-code-icon {
    font-size: 6rem;
  }

  .grievance-section {
    padding: 1rem 0;
    position: relative;
    z-index: 1;
    margin-top: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    backdrop-filter: blur(5px);
  }

  .grievance-message {
    font-size: 0.9rem;
    line-height: 1.4;
    padding: 0 1rem;
  }
}

/* Up to 480px wide (phones) */
@media (max-width: 480px) {
  .landing-container {
    min-height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .main-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    padding: 0.5rem;
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: column;
  }

  .hero {
    flex-shrink: 0;
    padding: 0.5rem 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .hero-content {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .main-title {
    font-size: 2.2rem;
    margin-bottom: 1.5rem;
    line-height: 1.2;
  }

  .subtitle {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }

  .description {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    padding: 0;
  }

  .cta-buttons {
    margin-bottom: 1.5rem;
    padding: 0 1.5rem;
    gap: 0.8rem;
    flex-direction: column;
  }

  .login-btn, .api-btn {
    padding: 0.9rem 1.2rem;
    font-size: 0.95rem;
    min-height: 48px;
    width: 100%;
  }

  .stats-section {
    flex-shrink: 0;
    margin: 2rem 0;
    padding: 0 1rem;
  }

  .stat-card {
    padding: 1.5rem 1rem;
    margin: 0.6rem 0;
    min-height: 140px;
    max-width: 320px;
  }

  .stat-icon {
    font-size: 1.8rem;
    width: 45px;
    height: 45px;
    margin-bottom: 0.8rem;
  }

  .stat-value {
    font-size: 1.8rem;
    margin-bottom: 0.4rem;
  }

  .stat-label {
    font-size: 0.85rem;
    text-align: center;
  }

  .grievance-section {
    flex-shrink: 0;
    margin-top: 1rem;
    padding: 1rem 0;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .grievance-message {
    font-size: 0.9rem;
    line-height: 1.3;
    padding: 0 1rem;
    text-align: center;
  }

  .grievance-link {
    display: inline-block;
    margin: 0 2px;
    padding: 2px 4px;
    background: rgba(76, 175, 80, 0.1);
    border-radius: 4px;
    text-decoration: none;
  }
}
</style>
