<template>
  <div class="climate-assessment-container">
    <ElCard class="assessment-card">
      <template #header>
        <div class="card-header">
          <div class="header-top">
            <ElButton text type="primary" @click="goBack">
              <ElIcon><ArrowLeft /></ElIcon>
              Back
            </ElButton>
            <h2>Climate Risk & Vulnerability Assessment (Tool B)</h2>
            <ElButton type="info" plain :icon="InfoFilled" @click="infoDrawerOpen = true">
              Score Interpretation
            </ElButton>
          </div>
          <p v-if="contextName" class="context-name">{{ contextName }}</p>
        </div>
      </template>

      <div v-loading="loading" class="assessment-content">
        <template v-if="assessment">
          <ElTabs v-model="activeTab" type="border-card" class="assessment-tabs">
            <ElTabPane name="overall" :label="overallTabLabel">
              <div class="tab-content overall-score-content">
                <div class="scores-grid" v-if="assessment.vulnerability_rating">
                  <ElRow :gutter="16">
                    <ElCol :span="6">
                      <div class="score-card score-card-hazard" role="button" tabindex="0" @click="activeTab = 'hazard'" @keydown.enter="activeTab = 'hazard'">
                        <ElIcon class="score-icon"><Lightning /></ElIcon>
                        <span class="score-label">Hazard</span>
                        <span class="score-value">{{ assessment.hazard_score ?? '–' }}</span>
                      </div>
                    </ElCol>
                    <ElCol :span="6">
                      <div class="score-card score-card-exposure" role="button" tabindex="0" @click="activeTab = 'exposure'" @keydown.enter="activeTab = 'exposure'">
                        <ElIcon class="score-icon"><Location /></ElIcon>
                        <span class="score-label">Exposure</span>
                        <span class="score-value">{{ assessment.exposure_score ?? '–' }}</span>
                      </div>
                    </ElCol>
                    <ElCol :span="6">
                      <div class="score-card score-card-sensitivity" role="button" tabindex="0" @click="activeTab = 'sensitivity'" @keydown.enter="activeTab = 'sensitivity'">
                        <ElIcon class="score-icon"><TrendCharts /></ElIcon>
                        <span class="score-label">Sensitivity</span>
                        <span class="score-value">{{ assessment.sensitivity_score ?? '–' }}</span>
                      </div>
                    </ElCol>
                    <ElCol :span="6">
                      <div class="score-card score-card-adaptive" role="button" tabindex="0" @click="activeTab = 'adaptive_capacity'" @keydown.enter="activeTab = 'adaptive_capacity'">
                        <ElIcon class="score-icon"><SetUp /></ElIcon>
                        <span class="score-label">Adaptive Capacity</span>
                        <span class="score-value">{{ assessment.adaptive_capacity_score ?? '–' }}</span>
                      </div>
                    </ElCol>
                  </ElRow>
                  <div class="rating-section">
                    <ElTag :type="ratingType" size="large" class="rating-tag">
                      <ElIcon class="rating-icon"><WarningFilled /></ElIcon>
                      Vulnerability: {{ overallScore != null ? overallScore : '—' }}{{ assessment.vulnerability_rating ? ` (${formatVulnerabilityRating(assessment.vulnerability_rating)})` : '' }}
                    </ElTag>
                  </div>
                </div>
                <p v-else class="score-placeholder">
                  Complete the questionnaire and click "Save & Compute Scores" to see the overall assessment.
                </p>
              </div>
            </ElTabPane>
            <ElTabPane
              v-for="dim in dimensions"
              :key="dim"
              :name="dim"
              :label="tabLabels[dim]"
            >
              <div class="tab-content">
                <ElCollapse v-model="activeCategoryByTab[dim]" accordion>
                    <ElCollapseItem
                      v-for="cat in (questionsConfig?.[dim]?.categories || [])"
                      :key="cat.key"
                      :name="cat.key"
                    >
                      <template #title>
                        <span class="collapse-title">{{ cat.label }}</span>
                        <span class="collapse-count">
                          {{ answeredCount(dim, cat) }}/{{ (cat.questions || []).length }}
                        </span>
                      </template>
                      <div class="questions-compact">
                        <div
                          v-for="q in (cat.questions || [])"
                          :key="q.key"
                          class="question-inline"
                        >
                          <div class="q-text">
                            <span class="q-label">{{ q.label }}</span>
                            <span v-if="q.hint" class="q-hint">{{ q.hint }}</span>
                          </div>
                          <ElSelect
                            v-model="responses[dim][q.key]"
                            placeholder="Select"
                            clearable
                            size="small"
                            class="q-select"
                            @change="debouncedSave"
                          >
                            <ElOption
                              v-for="(_, opt) in q.answers"
                              :key="opt"
                              :label="opt"
                              :value="opt"
                            />
                          </ElSelect>
                        </div>
                      </div>
                    </ElCollapseItem>
                  </ElCollapse>
              </div>
            </ElTabPane>
          </ElTabs>
          <div class="assessment-actions">
            <ElButton type="primary" :loading="saving" @click="saveAssessment">
              Save & Compute Scores
            </ElButton>
            <ElButton v-if="assessment.status === 'draft'" @click="markCompleted">
              Mark Completed
            </ElButton>
          </div>
        </template>
        <ElEmpty v-else-if="!loading" description="Assessment not found" />
      </div>
    </ElCard>

    <ElDrawer
      v-model="infoDrawerOpen"
      title="Score Interpretation"
      direction="rtl"
      size="400px"
    >
      <div class="info-content">
        <div class="info-section">
          <h3 class="info-heading">
            <ElIcon><InfoFilled /></ElIcon>
            How to Interpret the Scores
          </h3>
          <p class="info-intro">
            KISIP Tool B uses a 0–100 scale for each dimension. Higher scores generally indicate greater climate risk, except for Adaptive Capacity (see below).
          </p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon hazard"><Lightning /></ElIcon>
            Hazard (0–100)
          </h4>
          <p>Measures the severity and frequency of climate hazards (temperature extremes, precipitation, droughts, flooding, etc.). <strong>Higher = more severe/frequent hazards.</strong></p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon exposure"><Location /></ElIcon>
            Exposure (0–100)
          </h4>
          <p>Measures how much the community and its assets (livelihoods, health, housing, water, environment) are exposed to climate impacts. <strong>Higher = greater exposure.</strong></p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon sensitivity"><TrendCharts /></ElIcon>
            Sensitivity (0–100)
          </h4>
          <p>Measures how susceptible the community is to climate impacts (e.g. dependence on subsistence farming, grazing, fishing). <strong>Higher = more sensitive.</strong></p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon adaptive"><SetUp /></ElIcon>
            Adaptive Capacity (0–100)
          </h4>
          <p>Measures the community’s ability to cope and adapt (e.g. crop diversification, animal rescue, overfishing controls). <strong>Higher = lower capacity</strong> (more vulnerable). This dimension uses inverted scoring: “Yes” to good mechanisms = 0, “No” = 3.</p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon rating"><WarningFilled /></ElIcon>
            Vulnerability Rating
          </h4>
          <p>The overall rating is the average of the four dimension scores:</p>
          <ul class="info-list">
            <li><strong>Low</strong> (0–33): Lower vulnerability</li>
            <li><strong>Medium</strong> (34–66): Moderate vulnerability</li>
            <li><strong>High</strong> (67–100): Higher vulnerability</li>
          </ul>
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElCard,
  ElButton,
  ElIcon,
  ElTabs,
  ElTabPane,
  ElDrawer,
  ElCollapse,
  ElCollapseItem,
  ElTag,
  ElSelect,
  ElOption,
  ElRow,
  ElCol,
  ElEmpty,
  ElMessage
} from 'element-plus'
import { ArrowLeft, Lightning, Location, TrendCharts, SetUp, WarningFilled, InfoFilled } from '@element-plus/icons-vue'
import {
  getQuestions,
  getAssessment,
  createAssessment,
  updateAssessment,
  listAssessments,
  type ClimateAssessment,
  type AssessmentQuestions
} from '@/api/climate-assessment'

const route = useRoute()
const router = useRouter()

const dimensions = ['hazard', 'exposure', 'sensitivity', 'adaptive_capacity']

const loading = ref(false)
const saving = ref(false)
const assessment = ref<ClimateAssessment | null>(null)
const questionsConfig = ref<AssessmentQuestions | null>(null)
const activeTab = ref<string>('overall')
const infoDrawerOpen = ref(false)
const activeCategoryByTab = ref<Record<string, string>>({
  hazard: '',
  exposure: '',
  sensitivity: '',
  adaptive_capacity: ''
})

const formatVulnerabilityRating = (r: string | null | undefined) =>
  r ? String(r).toUpperCase() : ''

const overallScore = computed(() => {
  const a = assessment.value
  if (!a) return null
  const raw = [
    a.hazard_score,
    a.exposure_score,
    a.sensitivity_score,
    a.adaptive_capacity_score
  ]
  const valid: number[] = []
  for (const s of raw) {
    const n = typeof s === 'number' ? s : (s != null && s !== '' ? Number(s) : NaN)
    if (typeof n === 'number' && !Number.isNaN(n)) valid.push(n)
  }
  if (valid.length === 0) return null
  const avg = valid.reduce((sum, s) => sum + s, 0) / valid.length
  return Math.round(avg * 100) / 100
})

const overallTabLabel = computed(() => {
  const r = assessment.value?.vulnerability_rating
  const score = overallScore.value
  if (score != null && r) return `Overall Score (${score} – ${formatVulnerabilityRating(r)})`
  if (r) return `Overall Score (${formatVulnerabilityRating(r)})`
  if (score != null) return `Overall Score (${score})`
  return 'Overall Score'
})

const ratingType = computed(() => {
  const r = assessment.value?.vulnerability_rating?.toUpperCase()
  if (r === 'HIGH') return 'danger'
  if (r === 'MEDIUM') return 'warning'
  return 'success'
})

const tabLabels = computed(() => {
  const labels: Record<string, string> = {}
  const a = assessment.value
  for (const dim of dimensions) {
    const label = questionsConfig.value?.[dim]?.label || dim
    const scoreKey = `${dim}_score` as keyof ClimateAssessment
    const score = a?.[scoreKey]
    const numScore = typeof score === 'number' ? score : (score != null ? Number(score) : null)
    if (numScore != null && !Number.isNaN(numScore)) {
      labels[dim] = `${label} (${numScore})`
    } else {
      labels[dim] = label
    }
  }
  return labels
})

const answeredCount = (dim: string, cat: { questions?: Array<{ key: string }> }) => {
  const qs = cat.questions || []
  return qs.filter(q => responses.value[dim]?.[q.key] != null && responses.value[dim][q.key] !== '').length
}

const assessmentId = computed(() => {
  const id = route.params.assessmentId
  return id ? Number(id) : null
})

const settlementId = computed(() => {
  const id = route.params.id ?? route.params.settlementId
  return id ? Number(id) : null
})

const responses = ref<Record<string, Record<string, string>>>({
  hazard: {},
  exposure: {},
  sensitivity: {},
  adaptive_capacity: {}
})

const contextName = computed(() => {
  if (assessment.value?.settlement) {
    return `${assessment.value.settlement.name} (${assessment.value.settlement.code})`
  }
  return ''
})

let saveTimeout: ReturnType<typeof setTimeout> | null = null
const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => saveAssessment(), 800)
}

const loadQuestions = async () => {
  try {
    const res = await getQuestions()
    if (res.code === '0000') questionsConfig.value = res.data
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load questions')
  }
}

const loadOrCreateAssessment = async () => {
  loading.value = true
  try {
    if (assessmentId.value) {
      const res = await getAssessment(assessmentId.value)
      if (res.code === '0000') {
        assessment.value = res.data
        syncResponsesFromAssessment(res.data)
      }
    } else if (settlementId.value) {
      const listRes = await listAssessments({ settlement_id: settlementId.value })
      if (listRes.code === '0000' && listRes.data?.length) {
        assessment.value = listRes.data[0]
        syncResponsesFromAssessment(listRes.data[0])
      } else {
        const createRes = await createAssessment({ settlement_id: settlementId.value })
        if (createRes.code === '0000') assessment.value = createRes.data
      }
    } else {
      ElMessage.error('Settlement or project location required')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load assessment')
  } finally {
    loading.value = false
  }
}

const syncResponsesFromAssessment = (a: ClimateAssessment) => {
  for (const dim of dimensions) {
    const data = (a as any)[`${dim}_responses`] || {}
    responses.value[dim] = { ...data }
  }
}

const saveAssessment = async () => {
  if (!assessment.value?.id) return
  saving.value = true
  try {
    const res = await updateAssessment(assessment.value.id, {
      hazard_responses: responses.value.hazard,
      exposure_responses: responses.value.exposure,
      sensitivity_responses: responses.value.sensitivity,
      adaptive_capacity_responses: responses.value.adaptive_capacity
    })
    if (res.code === '0000') {
      assessment.value = res.data
      ElMessage.success('Assessment saved')
    } else {
      ElMessage.error(res.message || 'Failed to save')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}

const markCompleted = async () => {
  if (!assessment.value?.id) return
  saving.value = true
  try {
    const res = await updateAssessment(assessment.value.id, { status: 'completed' })
    if (res.code === '0000') {
      assessment.value = res.data
      ElMessage.success('Marked as completed')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to update')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  if (assessment.value?.settlement_id) {
    router.push({ name: 'SettlementDetails', params: { id: String(assessment.value.settlement_id) } })
  } else {
    router.push({ path: '/data/settlement/list' })
  }
}

watch(activeTab, () => {
  if (activeTab.value === 'overall') return
  const cats = questionsConfig.value?.[activeTab.value]?.categories || []
  const firstKey = cats[0]?.key ?? ''
  if (!activeCategoryByTab.value[activeTab.value]) {
    activeCategoryByTab.value[activeTab.value] = firstKey
  }
})

onMounted(async () => {
  await loadQuestions()
  await loadOrCreateAssessment()
  for (const dim of dimensions) {
    const cats = questionsConfig.value?.[dim]?.categories || []
    activeCategoryByTab.value[dim] = cats[0]?.key ?? ''
  }
})
</script>

<style scoped>
.climate-assessment-container {
  width: 100%;
}
.assessment-card {
  width: 100%;
}
.card-header {
  padding-bottom: 8px;
}
.header-top {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.header-top .el-button:last-child {
  margin-left: auto;
}
.card-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}
.context-name {
  margin: 4px 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 0.85rem;
}
.assessment-tabs {
  margin-top: 0;
}
.tab-content {
  padding-top: 12px;
}
.overall-score-content {
  padding: 24px 0;
}
.scores-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.score-card {
  text-align: center;
  padding: 20px 16px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.score-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.score-icon {
  display: block;
  font-size: 2rem;
  margin-bottom: 8px;
}
.score-card-hazard .score-icon { color: var(--el-color-warning); }
.score-card-exposure .score-icon { color: var(--el-color-primary); }
.score-card-sensitivity .score-icon { color: var(--el-color-danger); }
.score-card-adaptive .score-icon { color: var(--el-color-success); }
.score-card .score-label {
  display: block;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
.score-card .score-value {
  font-size: 1.5rem;
  font-weight: 600;
}
.rating-section {
  text-align: center;
}
.rating-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
}
.rating-icon {
  font-size: 1.1rem;
}
.score-placeholder {
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: 24px;
}
.info-content {
  padding: 20px 0;
  max-width: 640px;
}
.info-section {
  margin-bottom: 24px;
}
.info-section:last-child {
  margin-bottom: 0;
}
.info-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 1.1rem;
  font-weight: 600;
}
.info-heading .el-icon {
  color: var(--el-color-primary);
}
.info-intro {
  margin: 0 0 16px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.info-subheading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
}
.info-dim-icon.hazard { color: var(--el-color-warning); }
.info-dim-icon.exposure { color: var(--el-color-primary); }
.info-dim-icon.sensitivity { color: var(--el-color-danger); }
.info-dim-icon.adaptive { color: var(--el-color-success); }
.info-dim-icon.rating { color: var(--el-color-info); }
.info-section p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  font-size: 0.9rem;
}
.info-list {
  margin: 8px 0 0;
  padding-left: 20px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
  font-size: 0.9rem;
}
.assessment-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color);
}
.collapse-title {
  font-weight: 500;
}
.collapse-count {
  margin-left: 8px;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}
.questions-compact {
  padding: 4px 0;
}
.question-inline {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color);
}
.question-inline:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.q-text {
  flex: 1;
  min-width: 0;
}
.q-label {
  display: block;
  font-size: 0.9rem;
  line-height: 1.4;
}
.q-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.q-select {
  flex-shrink: 0;
  width: 180px;
}
</style>
