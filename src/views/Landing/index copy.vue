<template>
  <BaseLayout>
    <div class="landing-container">
      <div class="hero">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="main-title">Welcome to KeSMIS</h1>
            <h2 class="subtitle">Kenya Slum Management Information System</h2>

            <p class="description">
              This is the national geodatabase for slums and informal settlements across Kenya. It provides a centralized
              platform for real-time data collection, storage, and visualization, supporting evidence-based
              decision-making in urban planning, policy formulation, and development initiatives.
            </p>

            <div class="cta-buttons">
              <el-button type="primary" :icon="Lock" size="large" class="login-btn" @click="navigateTo('get-started')">
                Login
              </el-button>
              <el-button type="info" size="large" :icon="More" class="more-btn" @click="navigateTo('about')">
                Learn More
              </el-button>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">🏘️</div>
              <div class="stat-value">{{ NumSettlements }}</div>
              <div class="stat-label">Total Settlements</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📏</div>
              <div class="stat-value">{{ AvgSize }}</div>
              <div class="stat-label">Avg. Settlement Size</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🏗️</div>
              <div class="stat-value">{{ TotalProjs }}</div>
              <div class="stat-label">Active Projects</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-value">{{ avgHHSize }}</div>
              <div class="stat-label">Avg. Household Size</div>
            </div>
          </div>

          <div class="grievance-section">
            <div class="grievance-content">
              <div class="grievance-icon">📝</div>
              <p class="grievance-message">
                If you have a grievance against the KISIP project or its actors, you can
                <el-button plain link class="grievance-link" @click="navigateTo('grm')">file a grievance</el-button>,
                send us an email at
                <a href="mailto:kisip2info@housingandurban.go.ke" class="grievance-link">kisip2info@housingandurban.go.ke</a>,
                or call our helpline at
                <a href="tel:0800724349" class="grievance-link">0800 724 349</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElButton, ElCol, ElRow, ElStatistic, ElDivider, ElIcon, ElCard } from "element-plus";
import BaseLayout from './BaseLayout.vue';
import { StarFilled, Lock, ChatDotRound, More } from '@element-plus/icons-vue'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'

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

const NumSettlements = ref(0)
const AvgSize = ref(0)
const TotalProjs = ref(0)
const avgHHSize = ref(0)

const getNumberOFSettlements = async () => {
  const formData = {
    model: 'settlement',
    summaryField: "id",
    summaryFunction: "count",
    groupFields: [],
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
  };
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData)
    const summary = response.Total
    NumSettlements.value = summary[0].count
  } catch (error) {
    console.error('Error fetching project_activity:', error);
  }
};

const avgSizeSettlements = async () => {
  const formData = {
    model: 'settlement',
    summaryField: "area",
    summaryFunction: "AVG",
    groupFields: [],
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
  };
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData)
    const summary = response.Total
    let are = summary[0].AVG
    AvgSize.value = are.toFixed(0)
  } catch (error) {
    console.error('Error fetching project_activity:', error);
  }
};

const NumOfProjects = async () => {
  const formData = {
    model: 'project',
    summaryField: "id",
    summaryFunction: "count",
    groupFields: [],
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
  };
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData)
    const summary = response.Total
    TotalProjs.value = summary[0].count
  } catch (error) {
    console.error('Error fetching project_activity:', error);
  }
};

const AvgHHSize = async () => {
  const formData = {
    model: 'households',
    summaryField: "hh_size",
    summaryFunction: "AVG",
    groupFields: [],
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
  };
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData)
    const summary = response.Total
    let hh = parseFloat(summary[0].AVG)
    avgHHSize.value = hh.toFixed(0)
  } catch (error) {
    console.error('Error fetching project_activity:', error);
  }
};

getNumberOFSettlements()
avgSizeSettlements()
NumOfProjects()
AvgHHSize()
</script>

<style scoped>
.landing-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  padding: 3rem 2rem;
}

.hero {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.8s ease-out;
}

.hero-content {
  max-width: 1000px;
  margin: 0 auto;
}

.hero-text {
  text-align: center;
  margin-bottom: 4rem;
}

.main-title {
  font-size: 4rem;
  font-weight: 800;
  color: var(--el-color-primary);
  margin-bottom: 1rem;
  line-height: 1.2;
  background: linear-gradient(45deg, var(--el-color-primary), #2c5282);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: slideUp 0.8s ease-out;
}

.subtitle {
  font-size: 2rem;
  color: var(--el-text-color-primary);
  margin-bottom: 1.5rem;
  font-weight: 500;
  animation: slideUp 0.8s ease-out 0.2s backwards;
}

.description {
  font-size: 1.2rem;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  margin-bottom: 3rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  animation: slideUp 0.8s ease-out 0.4s backwards;
}

.cta-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 3rem;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 2rem;
  margin: 4rem 0;
  animation: slideUp 0.8s ease-out 0.8s backwards;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--el-color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.1rem;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.grievance-section {
  background: linear-gradient(135deg, #e6f4ea 0%, #f0f7ff 100%);
  padding: 2rem;
  border-radius: 16px;
  margin-top: 3rem;
  animation: slideUp 0.8s ease-out 1s backwards;
}

.grievance-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.grievance-icon {
  font-size: 3rem;
  flex-shrink: 0;
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

@media (max-width: 768px) {
  .landing-container {
    padding: 2rem 1rem;
  }

  .main-title {
    font-size: 2.5rem;
  }
  
  .subtitle {
    font-size: 1.5rem;
  }

  .description {
    font-size: 1.1rem;
  }

  .cta-buttons {
    flex-direction: column;
    gap: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .grievance-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
}
</style> 