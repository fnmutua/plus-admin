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
                        type="success"
                        size="large"
                        class="login-btn"
                        @click="router.push('/incidents')"
                        style="margin-left:8px;"
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
import { ref, computed, onMounted } from 'vue';
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

// SEO Meta Tags Setup
onMounted(() => {
  // Set document title
  document.title = 'KeSMIS - Kenya Slum Management Information System | KISIP';
  
  // Create and add meta tags
  const metaTags = [
    { name: 'description', content: 'Kenya Slum Management Information System (KeSMIS) - National geodatabase for slums and informal settlements across Kenya. Real-time data collection, storage, and visualization platform for urban planning and development.' },
    { name: 'keywords', content: 'Kenya slums, informal settlements, urban planning, KISIP, geodatabase, slum management, data collection, Kenya housing, urban development, settlement mapping' },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'KeSMIS - Kenya Slum Management Information System' },
    { property: 'og:description', content: 'National geodatabase for slums and informal settlements across Kenya. Real-time data collection, storage, and visualization platform.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke' },
    { property: 'og:image', content: 'https://kesmis.go.ke/og-image.jpg' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'KeSMIS - Kenya Slum Management Information System' },
    { name: 'twitter:description', content: 'National geodatabase for slums and informal settlements across Kenya. Real-time data collection and visualization platform.' },
    { name: 'twitter:image', content: 'https://kesmis.go.ke/twitter-card.jpg' },
    { name: 'theme-color', content: '#684035' },
    { name: 'msapplication-TileColor', content: '#684035' }
  ];

  metaTags.forEach(tag => {
    const meta = document.createElement('meta');
    if (tag.name) {
      meta.setAttribute('name', tag.name);
    }
    if (tag.property) {
      meta.setAttribute('property', tag.property);
    }
    meta.setAttribute('content', tag.content);
    document.head.appendChild(meta);
  });

  // Add canonical link
  const canonicalLink = document.createElement('link');
  canonicalLink.setAttribute('rel', 'canonical');
  canonicalLink.setAttribute('href', 'https://kesmis.go.ke');
  document.head.appendChild(canonicalLink);

  // Add JSON-LD structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KeSMIS - Kenya Slum Management Information System",
    "description": "National geodatabase for slums and informal settlements across Kenya",
    "url": "https://kesmis.go.ke",
    "publisher": {
      "@type": "Organization",
      "name": "Kenya Informal Settlements Improvement Project (KISIP)",
      "url": "https://kesmis.go.ke",
      "logo": "https://kesmis.go.ke/logo.png"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://kesmis.go.ke/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  });
  document.head.appendChild(script);
});

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
  min-height: 90vh;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* smooth scrolling on iOS */
}

/* 2. Ensure the Element container also scrolls vertically if needed */
.main-container {
  width: 100%;
  min-height: 90vh;
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
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--el-color-primary);
  margin-bottom: 2rem;
  line-height: 1.2;
  animation: slideUp 0.8s ease-out;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--el-text-color-primary);
 margin-bottom: 2rem;
  font-weight: 500;
  animation: slideUp 0.8s ease-out 0.2s backwards;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--el-text-color-regular);
 margin-bottom: 1.5rem;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
  animation: slideUp 0.8s ease-out 0.4s backwards;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  animation: slideUp 0.8s ease-out 0.6s backwards;
}

.login-btn {
  padding: 0.8rem 1.5rem;
  font-size: 0.8rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-weight: 600;
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
  margin: 0.2rem 0;
  animation: slideUp 0.8s ease-out 0.8s backwards;
  max-width: 1400px;
}

.stat-card {
  height: 80%;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-lighter);
  background: transparent;
  box-shadow: none !important;
  border-radius: 8px;
  padding: 0.3rem;
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1) !important;
}

.stat-icon {
  font-size: 1.8rem;
  margin-bottom: 0.2rem;
  color: var(--el-color-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.9;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--el-color-primary);
  margin-bottom: 0.1rem;
  opacity: 0.95;
}

.stat-label {
  font-size: 1rem;
  color: var(--el-text-color-regular);
  font-weight: 500;
  opacity: 0.85;
}

/* 5. STATS SECTION */
.stats-section {
  margin: 2rem 0;
  animation: slideUp 0.8s ease-out 0.8s backwards;
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
  .main-content {
    padding: 0.8rem;
  }

  .hero {
    padding: 1rem 0;
  }

  .hero-visual {
    margin-top: 2rem;
  }

  .image-carousel {
    max-width: 100%;
  }

  .main-title {
    font-size: 2.2rem;
    margin-bottom: 1.5rem;
  }

  .subtitle {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }

  .description {
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 1rem;
    padding: 0 0.5rem;
  }

  .cta-buttons {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0 1rem;
    margin-bottom: 1.5rem;
  }

  .login-btn, .api-btn {
    width: 100%;
    padding: 0.7rem;
    font-size: 0.9rem;
    margin-left: 0;
  }

  .stats-grid {
    margin: 0.5rem 0;
  }

  .stat-card {
    padding: 0.3rem;
    margin-bottom: 0.5rem;
  }

  .stat-icon {
    font-size: 1.2rem;
    margin-bottom: 0.2rem;
  }

  .stat-value {
    font-size: 1.3rem;
    margin-bottom: 0.01rem;
  }

  .stat-label {
    font-size: 0.9rem;
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
    padding: 0.3rem 0;
    position: relative;
    z-index: 1;
  }

  .grievance-message {
    font-size: 0.9rem;
    line-height: 1.4;
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
    padding: 0.5rem;
    max-height: 90vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .main-title {
    font-size: 1.8rem;
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .description {
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 1rem;
    padding: 0;
  }

  .stat-card {
    padding: 0.4rem;
  }

  .stat-value {
    font-size: 1.6rem;
  }

  .stat-label {
    font-size: 0.9rem;
  }
 

  .grievance-message {
    font-size: 0.9rem;
    line-height: 1.3;
  }
}
</style>
