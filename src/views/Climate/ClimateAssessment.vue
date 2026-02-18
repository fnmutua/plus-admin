<template>
  <div class="climate-assessment-container">
    <ElCard class="assessment-card">
      <template #header>
        <div class="card-header">
          <div class="header-top">
            <ElButton type="primary" plain :icon="Back" size="small" style="margin-right: 10px;" @click="goBack">
              Back
            </ElButton>
            <h2>Climate Risk & Vulnerability Assessment (Tool B)</h2>
            <ElButton type="info" plain :icon="InfoFilled" @click="infoDrawerOpen = true">
              Score Interpretation
            </ElButton>
          </div>
          <p v-if="countyName || settlementName || assessorName" class="context-name">
            County: {{ countyName || '—' }} | Settlement: {{ settlementName || '—' }} | Assessor: {{ assessorName || '—' }}
          </p>
        </div>
      </template>

      <div v-loading="loading" class="assessment-content">
        <template v-if="assessment">
          <ElTabs v-model="activeTab" type="border-card" class="assessment-tabs">
            <!-- How To tab (first) -->
            <ElTabPane name="howto" label="Instructions">
              <div class="tab-content methodology-content">
                <h3 class="method-heading">
                  <ElIcon><Document /></ElIcon>
                  KISIP Tool B — Scoring Methodology
                </h3>
                <p class="method-intro">
                  This assessment follows the <strong>KISIP RVAT (Risk &amp; Vulnerability Assessment Tool)</strong> Excel methodology.
                  Every question is scored on a <strong>1 – 3 scale</strong>. The final Vulnerability and Risk ratings are computed
                  from cross-dimensional formulas described below.
                </p>

                <!-- Scale -->
                <div class="method-section">
                  <h4 class="method-subheading">Per-Question Scoring Scale</h4>
                  <ElTable :data="scaleTableData" border size="small" class="method-table">
                    <ElTableColumn prop="score" label="Score" width="80" align="center" />
                    <ElTableColumn prop="meaning" label="Meaning" />
                  </ElTable>
                  <p class="method-note">
                    <strong>Note:</strong> Adaptive Capacity uses <em>inverted</em> polarity —
                    <strong>3 = Good</strong> capacity (positive), <strong>1 = Poor</strong> capacity. All other dimensions treat 3 as the most severe/exposed/sensitive.
                  </p>
                </div>

                <!-- Dimensions -->
                <div class="method-section">
                  <h4 class="method-subheading">Dimension Scores</h4>
                  <p>Each dimension score is the <strong>simple average</strong> of all per-question scores within that dimension (range 1.00 – 3.00).</p>
                  <ElTable :data="dimensionTableData" border size="small" class="method-table">
                    <ElTableColumn prop="dimension" label="Dimension" width="180" />
                    <ElTableColumn prop="formula" label="Formula" />
                    <ElTableColumn prop="interpretation" label="Interpretation" />
                  </ElTable>
                </div>

                <!-- Vulnerability -->
                <div class="method-section">
                  <h4 class="method-subheading">
                    <ElIcon class="method-icon vuln"><WarningFilled /></ElIcon>
                    Vulnerability
                  </h4>
                  <div class="method-formula-box">
                    <code>Vulnerability = AVG(Sensitivity) − AVG(Adaptive Capacity)</code>
                  </div>
                  <p>Range: <strong>−2</strong> to <strong>+2</strong>. A negative value means adaptive capacity outweighs sensitivity (good). A positive value means the community is vulnerable.</p>
                  <ElTable :data="vulnThresholdData" border size="small" class="method-table">
                    <ElTableColumn prop="rating" label="Rating" width="120" align="center" />
                    <ElTableColumn prop="range" label="Score Range" width="160" align="center" />
                    <ElTableColumn prop="meaning" label="Meaning" />
                  </ElTable>
                  <p class="method-note">
                    <strong>Category-level vulnerability</strong> is also computed per sub-category:<br />
                    <code>Category Vulnerability = AVG(Sensitivity<sub>cat</sub>) − AVG(Adaptive Capacity<sub>cat</sub>)</code>
                  </p>
                </div>

                <!-- Risk -->
                <div class="method-section">
                  <h4 class="method-subheading">
                    <ElIcon class="method-icon risk"><WarningFilled /></ElIcon>
                    Risk
                  </h4>
                  <div class="method-formula-box">
                    <code>Risk = AVG(Hazard) + ( Exposure × NormVuln ) / 3</code>
                  </div>
                  <p>where <code>NormVuln = (Vulnerability + 3) / 2</code>, which normalises the −2…+2 vulnerability range into a 0.5…2.5 positive multiplier.</p>
                  <ElTable :data="riskThresholdData" border size="small" class="method-table">
                    <ElTableColumn prop="rating" label="Rating" width="120" align="center" />
                    <ElTableColumn prop="range" label="Score Range" width="160" align="center" />
                    <ElTableColumn prop="meaning" label="Meaning" />
                  </ElTable>
                  <p class="method-note">
                    <strong>Category-level risk</strong> = AVERAGE of all subcategory risk scores.
                  </p>
                </div>

                <!-- Recommendations -->
                <div class="method-section">
                  <h4 class="method-subheading">Flagging &amp; Recommendations</h4>
                  <p>
                    Subcategories rated <ElTag type="danger" size="small">High</ElTag> are automatically flagged on the
                    Responses sheet. The Excel recommends addressing these through:
                  </p>
                  <ul class="method-list">
                    <li><strong>Planning</strong> — integrate findings into settlement/county planning</li>
                    <li><strong>Designs</strong> — climate-proof infrastructure designs for the settlement</li>
                    <li><strong>Community Development Plan</strong> — community-level adaptation and resilience actions</li>
                  </ul>
                </div>

                <!-- Workflow -->
                <div class="method-section">
                  <h4 class="method-subheading">Workflow</h4>
                  <ol class="method-list">
                    <li>Complete all questions across <strong>Hazard</strong>, <strong>Exposure</strong>, <strong>Sensitivity</strong>, and <strong>Adaptive Capacity</strong> tabs.</li>
                    <li>Click <strong>"Save &amp; Compute Scores"</strong> — the system calculates dimension averages, vulnerability, and risk.</li>
                    <li>Review the <strong>Overall</strong> tab for summary scores and ratings.</li>
                    <li>Address any <ElTag type="danger" size="small">High</ElTag> rated dimensions through appropriate planning interventions.</li>
                  </ol>
                </div>
              </div>
            </ElTabPane>

            <!-- Dimension tabs -->
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

            <!-- Overall Score tab -->
            <ElTabPane name="overall" :label="overallTabLabel">
              <div class="tab-content overall-score-content">
                <div class="scores-grid" v-if="assessment.vulnerability_rating || assessment.risk_rating">
                  <ElRow :gutter="12">
                    <ElCol :xs="12" :sm="12" :md="6">
                      <div :class="['score-card', 'score-card-hazard', scoreLevel('hazard', assessment.hazard_score)]" role="button" tabindex="0" @click="activeTab = 'hazard'" @keydown.enter="activeTab = 'hazard'">
                        <ElStatistic :value="dimScoreNum(assessment.hazard_score)" :precision="2">
                          <template #title>
                            <ElIcon class="score-icon"><Lightning /></ElIcon>
                            <span>Hazard</span>
                          </template>
                          <template #suffix>
                            <span class="score-range">/ 3</span>
                          </template>
                        </ElStatistic>
                        <span class="score-range-line"><span class="range-best">1 best</span> · <span class="range-worst">3 worst</span></span>
                      </div>
                    </ElCol>
                    <ElCol :xs="12" :sm="12" :md="6">
                      <div :class="['score-card', 'score-card-exposure', scoreLevel('exposure', assessment.exposure_score)]" role="button" tabindex="0" @click="activeTab = 'exposure'" @keydown.enter="activeTab = 'exposure'">
                        <ElStatistic :value="dimScoreNum(assessment.exposure_score)" :precision="2">
                          <template #title>
                            <ElIcon class="score-icon"><Location /></ElIcon>
                            <span>Exposure</span>
                          </template>
                          <template #suffix>
                            <span class="score-range">/ 3</span>
                          </template>
                        </ElStatistic>
                        <span class="score-range-line"><span class="range-best">1 best</span> · <span class="range-worst">3 worst</span></span>
                      </div>
                    </ElCol>
                    <ElCol :xs="12" :sm="12" :md="6">
                      <div :class="['score-card', 'score-card-sensitivity', scoreLevel('sensitivity', assessment.sensitivity_score)]" role="button" tabindex="0" @click="activeTab = 'sensitivity'" @keydown.enter="activeTab = 'sensitivity'">
                        <ElStatistic :value="dimScoreNum(assessment.sensitivity_score)" :precision="2">
                          <template #title>
                            <ElIcon class="score-icon"><TrendCharts /></ElIcon>
                            <span>Sensitivity</span>
                          </template>
                          <template #suffix>
                            <span class="score-range">/ 3</span>
                          </template>
                        </ElStatistic>
                        <span class="score-range-line"><span class="range-best">1 best</span> · <span class="range-worst">3 worst</span></span>
                      </div>
                    </ElCol>
                    <ElCol :xs="12" :sm="12" :md="6">
                      <div :class="['score-card', 'score-card-adaptive', scoreLevel('adaptive_capacity', assessment.adaptive_capacity_score)]" role="button" tabindex="0" @click="activeTab = 'adaptive_capacity'" @keydown.enter="activeTab = 'adaptive_capacity'">
                        <ElStatistic :value="dimScoreNum(assessment.adaptive_capacity_score)" :precision="2">
                          <template #title>
                            <ElIcon class="score-icon"><SetUp /></ElIcon>
                            <span>Adaptive Capacity</span>
                          </template>
                          <template #suffix>
                            <span class="score-range">/ 3</span>
                          </template>
                        </ElStatistic>
                        <span class="score-range-line"><span class="range-best">3 best</span> · <span class="range-worst">1 worst</span></span>
                      </div>
                    </ElCol>
                  </ElRow>
                  <ElRow :gutter="12" class="rating-row">
                    <ElCol :xs="24" :sm="12">
                      <div class="rating-section">
                        <span class="rating-title">Vulnerability</span>
                        <ElTag :type="vulnRatingType" size="large" class="rating-tag">
                          <ElIcon class="rating-icon"><WarningFilled /></ElIcon>
                          {{ formatRatingValue(assessment.vulnerability_score) }}{{ assessment.vulnerability_rating ? ` (${formatRatingLabel(assessment.vulnerability_rating)})` : '' }}
                        </ElTag>
                        <span class="rating-desc">AVG(Sensitivity) − AVG(Adaptive Capacity)</span>
                      </div>
                    </ElCol>
                    <ElCol :xs="24" :sm="12">
                      <div class="rating-section">
                        <span class="rating-title">Risk</span>
                        <ElTag :type="riskRatingType" size="large" class="rating-tag">
                          <ElIcon class="rating-icon"><WarningFilled /></ElIcon>
                          {{ formatRatingValue(assessment.risk_score) }}{{ assessment.risk_rating ? ` (${formatRatingLabel(assessment.risk_rating)})` : '' }}
                        </ElTag>
                        <span class="rating-desc">Hazard + (Exposure × NormVuln) / 3</span>
                      </div>
                    </ElCol>
                  </ElRow>
                </div>
                <p v-else class="score-placeholder">
                  Complete the questionnaire and click "Save & Compute Scores" to see the overall assessment.
                </p>
              </div>
            </ElTabPane>

            <!-- Documentation tab -->
            <ElTabPane name="docs" label="Documentation">
              <div class="tab-content">
                <div class="docs-header-row">
                  <ElInput
                    v-model="docsSearch"
                    placeholder="Search documents..."
                    clearable
                    size="small"
                    style="max-width: 260px;"
                  />
                </div>

                <!-- Upload dialog component -->
                <div v-if="docsUploadComponent">
                  <component
                    :is="docsUploadComponent"
                    v-bind="docsUploadProps"
                    @upload-complete="handleDocsUploadComplete"
                  />
                </div>

                <!-- Documents list -->
                <div class="docs-list-wrapper">
                  <div v-if="docsLoading" class="docs-loading">
                    <ElIcon class="docs-loading-icon"><Loading /></ElIcon>
                    <span>Loading documents...</span>
                  </div>
                  <div v-else-if="docsError" class="docs-error">
                    <ElIcon class="docs-error-icon"><WarningFilled /></ElIcon>
                    <span>{{ docsError }}</span>
                  </div>
                  <div v-else-if="!docsListData.documents?.length">
                    <ElEmpty description="No documentation uploaded yet." />
                  </div>
                  <div v-else-if="docsListComponent">
                    <component
                      :is="docsListComponent"
                      :data="docsListViewData"
                      docmodel="document"
                      field="climate_assessment_id"
                      :hide-import="true"
                    />
                  </div>
                </div>

                <div class="docs-footer-row">
                  <ElButton type="info" plain @click="openDocsUpload">
                    Upload Documentation
                  </ElButton>
                </div>
              </div>
            </ElTabPane>
          </ElTabs>
          <div v-if="canSave" class="assessment-actions">
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
            KISIP Tool B uses a <strong>1–3 scale</strong> for each dimension, following the RVAT Excel methodology. Each answer maps to 1 (Low), 2 (Medium), or 3 (High). Vulnerability and Risk are computed from cross-dimensional formulas.
          </p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon hazard"><Lightning /></ElIcon>
            Hazard (1–3)
          </h4>
          <p>Average severity and frequency of climate hazards (temperature, precipitation, droughts, flooding, storms, pollution, etc.). <strong>3 = severe/frequent hazards, 1 = low.</strong></p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon exposure"><Location /></ElIcon>
            Exposure (1–3)
          </h4>
          <p>How much the community and its assets (livelihoods, health, housing, water, environment, institutions) are exposed to climate impacts. <strong>3 = high exposure, 1 = low.</strong></p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon sensitivity"><TrendCharts /></ElIcon>
            Sensitivity (1–3)
          </h4>
          <p>How susceptible the community is to climate impacts (dependence on subsistence farming, health risks, infrastructure fragility). <strong>3 = highly sensitive, 1 = low.</strong></p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon adaptive"><SetUp /></ElIcon>
            Adaptive Capacity (1–3)
          </h4>
          <p>The community's ability to cope and adapt (crop diversification, early warning, DRM plans, financial buffers). <strong>3 = good capacity, 1 = poor capacity.</strong> This dimension is positively scored — higher is better.</p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon rating"><WarningFilled /></ElIcon>
            Vulnerability
          </h4>
          <p><code>Vulnerability = AVG(Sensitivity) − AVG(Adaptive Capacity)</code></p>
          <p>Range: −2 to +2. Negative means adaptive capacity outweighs sensitivity.</p>
          <ul class="info-list">
            <li><strong>Low</strong> (≤ −0.6): Good capacity, low sensitivity</li>
            <li><strong>Medium</strong> (−0.6 to +0.6): Moderate vulnerability</li>
            <li><strong>High</strong> (≥ +0.6): Sensitivity outweighs capacity</li>
          </ul>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon risk"><WarningFilled /></ElIcon>
            Risk
          </h4>
          <p><code>Risk = AVG(Hazard) + (Exposure × NormVuln) / 3</code></p>
          <p>where <code>NormVuln = (Vulnerability + 3) / 2</code></p>
          <ul class="info-list">
            <li><strong>Low</strong> (≤ 2.17): Lower overall climate risk</li>
            <li><strong>Medium</strong> (2.17 – 3.83): Moderate risk</li>
            <li><strong>High</strong> (≥ 3.83): High climate risk</li>
          </ul>
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
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
  ElMessage,
  ElStatistic,
  ElTable,
  ElTableColumn
} from 'element-plus'
import { Back, Lightning, Location, TrendCharts, SetUp, WarningFilled, InfoFilled, Document, Loading } from '@element-plus/icons-vue'
import {
  getQuestions,
  getAssessment,
  createAssessment,
  updateAssessment,
  listAssessments,
  type ClimateAssessment,
  type AssessmentQuestions
} from '@/api/climate-assessment'
import { getSettlementListByCounty } from '@/api/settlements'

const route = useRoute()
const router = useRouter()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userPermissions = computed(() => {
  const info = wsCache.get(appStore.getUserInfo)
  return (info?.permissions ?? []) as string[]
})
const canSave = computed(() => {
  const perms = userPermissions.value
  return perms.length > 0 && (perms[0] === '*.*.*' || perms.includes('climate_assessment:update'))
})

const dimensions = ['hazard', 'exposure', 'sensitivity', 'adaptive_capacity']

/* ── Static table data for the Methodology tab ── */
const scaleTableData = [
  { score: '1', meaning: 'Low — minimal severity, exposure, sensitivity, or poor adaptive capacity' },
  { score: '2', meaning: 'Medium — moderate level' },
  { score: '3', meaning: 'High — severe / frequent (or Good adaptive capacity for AC)' }
]
const dimensionTableData = [
  { dimension: 'Hazard', formula: 'AVG of all hazard questions', interpretation: '3 = severe hazards, 1 = low' },
  { dimension: 'Exposure', formula: 'AVG of all exposure questions', interpretation: '3 = high exposure, 1 = low' },
  { dimension: 'Sensitivity', formula: 'AVG of all sensitivity questions', interpretation: '3 = highly sensitive, 1 = low' },
  { dimension: 'Adaptive Capacity', formula: 'AVG of all AC questions', interpretation: '3 = good capacity (positive), 1 = poor' }
]
const vulnThresholdData = [
  { rating: 'Low', range: '≤ −0.6', meaning: 'Adaptive capacity outweighs sensitivity — community is resilient' },
  { rating: 'Medium', range: '−0.6 to +0.6', meaning: 'Moderate vulnerability — some gaps in adaptive capacity' },
  { rating: 'High', range: '≥ +0.6', meaning: 'Sensitivity outweighs capacity — community is vulnerable' }
]
const riskThresholdData = [
  { rating: 'Low', range: '≤ 2.17', meaning: 'Lower overall climate risk' },
  { rating: 'Medium', range: '2.17 – 3.83', meaning: 'Moderate climate risk' },
  { rating: 'High', range: '≥ 3.83', meaning: 'High climate risk — immediate attention needed' }
]

const loading = ref(false)
const saving = ref(false)
const assessment = ref<ClimateAssessment | null>(null)
const questionsConfig = ref<AssessmentQuestions | null>(null)
const activeTab = ref<string>('howto')
const infoDrawerOpen = ref(false)
const activeCategoryByTab = ref<Record<string, string>>({
  hazard: '',
  exposure: '',
  sensitivity: '',
  adaptive_capacity: ''
})

const formatRatingLabel = (r: string | null | undefined) =>
  r ? String(r).charAt(0).toUpperCase() + String(r).slice(1).toLowerCase() : ''

/** Numeric value for ElStatistic (returns 0 when no score yet) */
const dimScoreNum = (score: number | string | null | undefined): number => {
  if (score == null || score === '') return 0
  const n = typeof score === 'number' ? score : Number(score)
  return Number.isNaN(n) ? 0 : n
}

const formatRatingValue = (score: number | string | null | undefined) => {
  if (score == null || score === '') return '—'
  const n = typeof score === 'number' ? score : Number(score)
  return Number.isNaN(n) ? '—' : n.toFixed(2)
}

const overallTabLabel = computed(() => {
  const rr = assessment.value?.risk_rating
  if (rr) {
    const upper = String(rr).toUpperCase()
    if (upper === 'MEDIUM' || upper === 'HIGH') {
      return `Overall (Risk: ${formatRatingLabel(rr)})`
    }
  }
  return 'Overall Score'
})

const ratingTypeForString = (r: string | null | undefined) => {
  const upper = r?.toUpperCase()
  if (upper === 'HIGH') return 'danger'
  if (upper === 'MEDIUM') return 'warning'
  return 'success'
}

const vulnRatingType = computed(() => ratingTypeForString(assessment.value?.vulnerability_rating))
const riskRatingType = computed(() => ratingTypeForString(assessment.value?.risk_rating))

/** Return a severity level class based on dimension score (1-3 scale).
 *  For Adaptive Capacity the polarity is inverted (3 = good). */
const scoreLevel = (dim: string, score: number | string | null | undefined): string => {
  if (score == null || score === '') return ''
  const n = typeof score === 'number' ? score : Number(score)
  if (Number.isNaN(n)) return ''
  const isAC = dim === 'adaptive_capacity'
  if (n >= 2.33) return isAC ? 'level-low' : 'level-high'
  if (n >= 1.67) return 'level-medium'
  return isAC ? 'level-high' : 'level-low'
}

const tabLabels = computed(() => {
  const labels: Record<string, string> = {}
  const a = assessment.value
  for (const dim of dimensions) {
    const label = questionsConfig.value?.[dim]?.label || dim
    const scoreKey = `${dim}_score` as keyof ClimateAssessment
    const score = a?.[scoreKey]
    const numScore = typeof score === 'number' ? score : (score != null ? Number(score) : null)
    if (numScore != null && !Number.isNaN(numScore)) {
      labels[dim] = `${label} (${numScore.toFixed(2)})`
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

const countyName = computed(() => assessment.value?.county?.name ?? '')
const settlementName = computed(() => assessment.value?.settlement?.name ?? '')

const assessorName = computed(() => {
  const a = assessment.value?.assessor
  if (!a) return ''
  return a.name || a.username || a.email || `User #${a.id}`
})

// Documentation upload (linked to the climate assessment)
const docsUploadOpen = ref(false)
const DocsUploadChild = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'))
const docsUploadComponent = ref<any | null>(null)
const docsUploadProps = ref({
  message: 'Climate assessment documentation',
  showDialog: docsUploadOpen,
  data: { id: null as number | null },
  umodel: 'document',
  field: 'climate_assessment_id',
  filterOptions: '' as string | undefined
})

const docsLoading = ref(false)
const docsError = ref('')
const docsListData = ref<{ documents: any[] }>({ documents: [] })
const docsSearch = ref('')
const docsListViewData = computed(() => {
  const q = docsSearch.value.trim().toLowerCase()
  if (!q) return { documents: docsListData.value.documents }
  const filtered = (docsListData.value.documents || []).filter((d: any) =>
    String(d.name || '').toLowerCase().includes(q)
  )
  return { documents: filtered }
})
const DocsListChild = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'))
const docsListComponent = ref<any | null>(null)
const docsLoadedOnce = ref(false)

const loadDocumentation = async () => {
  const aid = assessment.value?.id
  if (!aid) {
    docsError.value = 'Assessment must be saved before loading documentation.'
    docsListData.value = { documents: [] }
    return
  }
  docsLoading.value = true
  docsError.value = ''
  try {
    const formData: any = {
      limit: 1000,
      page: 1,
      curUser: 1,
      model: 'document',
      searchField: 'name',
      searchKeyword: '',
      filters: ['climate_assessment_id'],
      filterValues: [[aid]],
      associated_multiple_models: ['document_type'],
      nested_models: []
    }
    const res: any = await getSettlementListByCounty(formData as any)
    const data = res?.data ?? res?.results ?? []
    docsListData.value = { documents: Array.isArray(data) ? data : [] }
    docsLoadedOnce.value = true
    if (!docsListComponent.value) docsListComponent.value = DocsListChild
  } catch (e: any) {
    console.error('Failed to load documentation for assessment', e)
    docsError.value = e?.message || 'Failed to load documentation'
    docsListData.value = { documents: [] }
  } finally {
    docsLoading.value = false
  }
}

const openDocsUpload = () => {
  const aid = assessment.value?.id
  if (!aid) {
    ElMessage.error('Please save the assessment first to link documents to it.')
    return
  }
  docsUploadProps.value.data = { id: aid }
  docsUploadProps.value.showDialog = true
  docsUploadComponent.value = null
  docsUploadOpen.value = true
  setTimeout(() => {
    docsUploadComponent.value = DocsUploadChild
  }, 100)
}

const handleDocsUploadComplete = async () => {
  await loadDocumentation()
}

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

watch(activeTab, async () => {
  if (activeTab.value === 'docs') {
    if (!docsLoadedOnce.value && !docsLoading.value) {
      await loadDocumentation()
    }
    return
  }
  if (activeTab.value === 'howto' || activeTab.value === 'overall') return
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
.assessor-name {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 0.8rem;
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
  font-size: 1.4rem;
  vertical-align: middle;
  margin-right: 4px;
}
.score-card-hazard .score-icon { color: var(--el-color-warning); }
.score-card-exposure .score-icon { color: var(--el-color-primary); }
.score-card-sensitivity .score-icon { color: var(--el-color-danger); }
.score-card-adaptive .score-icon { color: var(--el-color-success); }

/* ElStatistic overrides inside score cards */
.score-card :deep(.el-statistic__head) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.82rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 2px;
}
.score-card :deep(.el-statistic__content) {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}
.score-card :deep(.el-statistic__number) {
  font-size: 1.65rem;
  font-weight: 700;
}
.score-range {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}
.score-range-line {
  display: block;
  margin-top: 8px;
  font-size: 0.65rem;
  color: var(--el-text-color-placeholder);
  letter-spacing: 0.02em;
}
.range-best {
  color: var(--el-color-success);
  font-weight: 600;
}
.range-worst {
  color: var(--el-color-danger);
  font-weight: 600;
}

/* ── score-level backgrounds ── */
.score-card.level-low {
  background: var(--el-color-success-light-9, #f0f9eb);
  border: 1px solid var(--el-color-success-light-5, #b3e19d);
}
.score-card.level-low :deep(.el-statistic__number) { color: var(--el-color-success); }

.score-card.level-medium {
  background: var(--el-color-warning-light-9, #fdf6ec);
  border: 1px solid var(--el-color-warning-light-5, #f3d19e);
}
.score-card.level-medium :deep(.el-statistic__number) { color: var(--el-color-warning-dark-2, #b88230); }

.score-card.level-high {
  background: var(--el-color-danger-light-9, #fef0f0);
  border: 1px solid var(--el-color-danger-light-5, #fab6b6);
}
.score-card.level-high :deep(.el-statistic__number) { color: var(--el-color-danger); }
.rating-row {
  margin-top: 8px;
}
.rating-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.rating-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.rating-desc {
  font-size: 0.7rem;
  color: var(--el-text-color-secondary);
  font-family: monospace;
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
.info-dim-icon.risk { color: var(--el-color-danger); }
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
  justify-content: space-between;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color);
}

.docs-header-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.docs-list-wrapper {
  margin-top: 8px;
}

.docs-footer-row {
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
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

/* ── Methodology tab ── */
.methodology-content {
  max-width: 100%;
  margin: 0;
  padding: 20px 8px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  font-size: 0.9rem;
}
.method-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.method-heading .el-icon {
  color: var(--el-color-primary);
  font-size: 1.2rem;
}
.method-intro {
  margin: 0 0 24px;
}
.method-section {
  margin-bottom: 28px;
}
.method-section:last-child {
  margin-bottom: 0;
}
.method-subheading {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.method-icon.vuln { color: var(--el-color-warning); }
.method-icon.risk { color: var(--el-color-danger); }
.method-formula-box {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  text-align: center;
}
.method-formula-box code {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--el-color-primary);
}
.method-table {
  margin: 12px 0;
}
.method-note {
  margin-top: 10px;
  padding: 10px 14px;
  background: var(--el-color-info-light-9, #f4f4f5);
  border-left: 3px solid var(--el-color-info);
  border-radius: 4px;
  font-size: 0.85rem;
}
.method-note code {
  font-size: 0.82rem;
  background: rgba(0,0,0,0.04);
  padding: 1px 4px;
  border-radius: 3px;
}
.method-list {
  margin: 8px 0 0;
  padding-left: 22px;
  line-height: 2;
}
.method-section p {
  margin: 0 0 8px;
}
.method-section p:last-child {
  margin-bottom: 0;
}

/* ── Mobile optimisations ── */
@media (max-width: 768px) {
  .score-card {
    padding: 14px 10px;
    border-radius: 10px;
    margin-bottom: 10px;
  }
  .score-card :deep(.el-statistic__number) {
    font-size: 1.35rem;
  }
  .score-card :deep(.el-statistic__head) {
    font-size: 0.75rem;
  }
  .score-icon {
    font-size: 1.15rem;
  }
  .score-range {
    font-size: 0.75rem;
  }
  .score-range-line {
    margin-top: 5px;
    font-size: 0.6rem;
  }
  .overall-score-content {
    padding: 12px 0;
  }
  .scores-grid {
    gap: 12px;
  }
  .rating-row {
    margin-top: 4px;
  }
  .rating-section {
    margin-bottom: 12px;
  }
  .rating-tag {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
  .header-top {
    gap: 8px;
  }
  .card-header h2 {
    font-size: 0.95rem;
  }
  .question-inline {
    flex-direction: column;
    gap: 6px;
  }
  .q-select {
    width: 100%;
  }
  .assessment-actions {
    flex-direction: column;
  }
  .assessment-actions .el-button {
    width: 100%;
  }
  .methodology-content {
    padding: 12px 4px;
    font-size: 0.85rem;
  }
  .method-heading {
    font-size: 1rem;
  }
  .method-formula-box {
    padding: 10px 12px;
  }
  .method-formula-box code {
    font-size: 0.82rem;
  }
  .method-table {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .score-card {
    padding: 12px 8px;
    border-radius: 8px;
  }
  .score-card :deep(.el-statistic__number) {
    font-size: 1.2rem;
  }
  .score-card :deep(.el-statistic__head) {
    font-size: 0.7rem;
    gap: 2px;
  }
  .score-icon {
    font-size: 1rem;
  }
  .card-header h2 {
    font-size: 0.85rem;
  }
  .context-name {
    font-size: 0.75rem;
  }
}
</style>
