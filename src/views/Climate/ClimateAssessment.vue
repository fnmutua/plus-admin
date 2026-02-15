<template>
  <div class="climate-assessment-container">
    <ElCard class="assessment-card">
      <template #header>
        <div class="card-header">
          <ElButton v-if="assessmentId" text type="primary" @click="goBack">
            <ElIcon><ArrowLeft /></ElIcon>
            Back
          </ElButton>
          <h2>Climate Risk & Vulnerability Assessment (KISIP Tool B)</h2>
          <p v-if="contextName" class="context-name">{{ contextName }}</p>
        </div>
      </template>

      <div v-loading="loading" class="assessment-content">
        <template v-if="assessment">
          <div class="scores-summary" v-if="assessment.vulnerability_rating">
            <ElRow :gutter="16">
              <ElCol :span="6">
                <div class="score-box">
                  <span class="score-label">Hazard</span>
                  <span class="score-value">{{ assessment.hazard_score ?? '–' }}</span>
                </div>
              </ElCol>
              <ElCol :span="6">
                <div class="score-box">
                  <span class="score-label">Exposure</span>
                  <span class="score-value">{{ assessment.exposure_score ?? '–' }}</span>
                </div>
              </ElCol>
              <ElCol :span="6">
                <div class="score-box">
                  <span class="score-label">Sensitivity</span>
                  <span class="score-value">{{ assessment.sensitivity_score ?? '–' }}</span>
                </div>
              </ElCol>
              <ElCol :span="6">
                <div class="score-box">
                  <span class="score-label">Adaptive Capacity</span>
                  <span class="score-value">{{ assessment.adaptive_capacity_score ?? '–' }}</span>
                </div>
              </ElCol>
            </ElRow>
            <div class="rating-badge">
              <ElTag
                :type="ratingType"
                size="large"
              >
                Vulnerability: {{ assessment.vulnerability_rating }}
              </ElTag>
            </div>
          </div>

          <ElTabs v-model="activeTab" type="border-card">
            <ElTabPane
              v-for="dim in dimensions"
              :key="dim"
              :label="questionsConfig?.[dim]?.label || dim"
              :name="dim"
            >
              <div
                v-for="cat in (questionsConfig?.[dim]?.categories || [])"
                :key="cat.key"
                class="category-section"
              >
                <h4 class="category-title">{{ cat.label }}</h4>
                <div
                  v-for="q in (cat.questions || [])"
                  :key="q.key"
                  class="question-row"
                >
                  <div class="question-label">{{ q.label }}</div>
                  <div v-if="q.hint" class="question-hint">{{ q.hint }}</div>
                  <ElSelect
                    v-model="responses[dim][q.key]"
                    placeholder="Select answer"
                    clearable
                    class="answer-select"
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
            </ElTabPane>
          </ElTabs>

          <div class="card-footer">
            <ElButton type="primary" :loading="saving" @click="saveAssessment">
              Save & Compute Scores
            </ElButton>
            <ElButton v-if="assessment.status === 'draft'" @click="markCompleted">
              Mark as Completed
            </ElButton>
          </div>
        </template>
        <ElEmpty v-else-if="!loading" description="Assessment not found" />
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElCard,
  ElButton,
  ElIcon,
  ElTabs,
  ElTabPane,
  ElTag,
  ElSelect,
  ElOption,
  ElRow,
  ElCol,
  ElEmpty,
  ElMessage
} from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
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

const loading = ref(false)
const saving = ref(false)
const assessment = ref<ClimateAssessment | null>(null)
const questionsConfig = ref<AssessmentQuestions | null>(null)
const activeTab = ref('hazard')

const assessmentId = computed(() => {
  const id = route.params.assessmentId
  return id ? Number(id) : null
})

const settlementId = computed(() => {
  const id = route.params.id ?? route.params.settlementId
  return id ? Number(id) : null
})

const dimensions = ['hazard', 'exposure', 'sensitivity', 'adaptive_capacity']

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

const ratingType = computed(() => {
  const r = assessment.value?.vulnerability_rating?.toUpperCase()
  if (r === 'HIGH') return 'danger'
  if (r === 'MEDIUM') return 'warning'
  return 'success'
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

onMounted(async () => {
  await loadQuestions()
  await loadOrCreateAssessment()
})
</script>

<style scoped>
.climate-assessment-container {
  padding: 16px;
}
.assessment-card {
  max-width: 900px;
  margin: 0 auto;
}
.card-header h2 {
  margin: 8px 0 4px;
  font-size: 1.25rem;
}
.context-name {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}
.scores-summary {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
.score-box {
  text-align: center;
  padding: 8px;
}
.score-label {
  display: block;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}
.score-value {
  font-size: 1.25rem;
  font-weight: 600;
}
.rating-badge {
  margin-top: 12px;
  text-align: center;
}
.category-section {
  margin-bottom: 24px;
}
.category-title {
  margin: 0 0 12px;
  font-size: 1rem;
  color: var(--el-text-color-primary);
}
.question-row {
  margin-bottom: 16px;
}
.question-label {
  font-weight: 500;
  margin-bottom: 4px;
}
.question-hint {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.answer-select {
  width: 100%;
  max-width: 400px;
}
.card-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color);
}
</style>
