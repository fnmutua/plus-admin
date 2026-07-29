<template>
  <div :class="['overview-wrap', { 'is-mobile': isMobile }]">
    <el-card class="intro-card">
      <h2 class="intro-title">How M&amp;E reporting fits together</h2>
      <p class="intro-sub">One route, set up in order — each step needs the one before it to exist.</p>
    </el-card>

    <div class="route-row">
      <div v-for="(step, i) in routeSteps" :key="step.name" class="route-item">
        <el-card class="route-card" @click="goTo(step.route)">
          <Icon :icon="step.icon" :size="26" class="route-icon" />
          <h3>{{ step.name }}</h3>
          <p class="route-desc">{{ step.desc }}</p>
        </el-card>
        <Icon v-if="i < routeSteps.length - 1" icon="mdi:arrow-right-thin" :size="24" class="route-arrow" />
      </div>
    </div>

    <el-card class="worked-example-card">
      <h3>Worked example</h3>
      <div class="example-flow">
        <div class="example-step">
          <span class="example-label">Project</span>
          <span class="example-value">"Mukuru Tenure Regularisation"</span>
        </div>
        <Icon icon="mdi:arrow-right-thin" :size="20" class="example-arrow" />
        <div class="example-step">
          <span class="example-label">Activity</span>
          <span class="example-value">"Community Training"</span>
        </div>
        <Icon icon="mdi:arrow-right-thin" :size="20" class="example-arrow" />
        <div class="example-step">
          <span class="example-label">Indicator</span>
          <span class="example-value">"Beneficiaries"</span>
        </div>
        <Icon icon="mdi:arrow-right-thin" :size="20" class="example-arrow" />
        <div class="example-step">
          <span class="example-label">Indicator Category</span>
          <span class="example-value">"Beneficiaries" × "Trained"</span>
        </div>
        <Icon icon="mdi:arrow-right-thin" :size="20" class="example-arrow" />
        <div class="example-step">
          <span class="example-label">Report</span>
          <span class="example-value">Q2 2026 — amount: 42, status: Approved</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElCard } from 'element-plus'
import { Icon } from '@/components/Icon'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'

const router = useRouter()
const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)

// Real chain: project_activity links Project↔Activity, indicator_category then
// attaches an Indicator to that Activity. One route, not a fork.
const routeSteps = [
  { name: 'Project', route: '__firstProject__', icon: 'mdi:briefcase-outline', desc: 'The initiative everything else sits under.' },
  { name: 'Activity', route: 'ProgrammeActivity', icon: 'icon-park-outline:activity-source', desc: 'A unit of implementation work within the Project.' },
  { name: 'Indicator', route: 'Indicators', icon: 'cil:gauge', desc: 'The subject being counted — e.g. "Beneficiaries", not yet qualified.' },
  { name: 'Indicator Category', route: 'IndicatorConfigs', icon: 'material-symbols:settings', desc: 'Pairs the Indicator with a qualifying category (e.g. "Trained") and binds it to this Activity — now reportable.' },
  { name: 'Report', route: 'NewReports', icon: 'mdi:file-document-plus', desc: 'The periodic value someone submits, New → Approved.' },
]

// /subprogrammes is built at login time (see store/modules/permission.ts,
// ensureSubprogrammesRoute) into a live root-programme → child-programme →
// component tree, e.g. /subprogrammes/slumupgrading/inf/schools. There's no
// static "project list" page — this walks the already-registered routes to
// the first real leaf instead of hardcoding one programme's path.
const goToFirstProject = () => {
  const candidates = router
    .getRoutes()
    .filter((r) => r.path.startsWith('/subprogrammes/') && r.name)

  if (!candidates.length) {
    router.push('/subprogrammes')
    return
  }

  const maxDepth = Math.max(...candidates.map((r) => r.path.split('/').length))
  const leaf = candidates.find((r) => r.path.split('/').length === maxDepth)
  router.push({ name: leaf!.name })
}

const goTo = (name: string) => {
  if (name === '__firstProject__') {
    goToFirstProject()
    return
  }
  router.push({ name })
}
</script>

<style scoped>
.overview-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px;
}

.intro-card :deep(.el-card__body) {
  padding: 24px 28px;
}

.intro-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
}

.intro-sub {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  max-width: 720px;
}

.route-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.is-mobile .route-row {
  flex-direction: column;
  align-items: stretch;
}

.route-item {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 4px;
}

.is-mobile .route-item {
  flex-direction: column;
}

.route-card {
  flex: 1;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.route-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.route-card :deep(.el-card__body) {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  text-align: center;
}

.route-icon {
  color: var(--el-color-primary);
  margin-bottom: 2px;
}

.route-card h3 {
  margin: 0;
  font-size: 14px;
}

.route-desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.route-arrow {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.is-mobile .route-arrow {
  transform: rotate(90deg);
}

.worked-example-card h3 {
  margin: 0 0 14px;
  font-size: 15px;
}

.example-flow {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.example-step {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 14px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  min-width: 180px;
}

.example-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.example-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.example-arrow {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}
</style>
