<template>
  <BaseLayout>
    <div class="gok-grm" id="community-issue-form">
      <div class="gok-container gok-grm__shell">
        <header class="gok-grm__header">
          <p class="gok-eyebrow">Community reporting</p>
          <h1 class="gok-grm__title">Report a settlement issue</h1>
          <p class="gok-grm__lead">
            Report maintenance or service problems in your settlement — water, sanitation, roads, waste,
            safety, and more. You will receive a reference code and can track progress online.
          </p>
          <p class="gok-grm__lead gok-grm__lead--secondary">
            For formal complaints about programme delivery, use the
            <router-link to="/grm" class="gok-inline-link">grievance form</router-link>
            instead.
          </p>
        </header>

        <el-steps v-if="!submitted" :active="activeStep" finish-status="success" class="gok-grm__steps" align-center>
          <el-step title="Location & contact" />
          <el-step title="Issue details" />
        </el-steps>

        <el-card v-if="submitted" class="gok-success-card" shadow="never">
          <h2>Thank you — your report was received</h2>
          <p>
            Reference code: <strong>{{ submittedCode }}</strong>
          </p>
          <p v-if="submittedPhone" class="gok-grm__hint">
            We sent an SMS confirmation to your phone if the number was valid.
          </p>
          <div class="gok-success-actions">
            <el-button type="primary" @click="goToTracking">Track this report</el-button>
            <el-button @click="resetAndFileAnother">Report another issue</el-button>
            <el-button text @click="router.push('/landing')">Back to home</el-button>
          </div>
        </el-card>

        <el-form
          v-else
          ref="formRef"
          :model="form"
          :rules="rules"
          class="gok-grm__form"
          label-position="top"
          @submit.prevent
        >
          <div v-show="activeStep === 0">
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="County" prop="county_id">
                  <el-select
                    v-model="form.county_id"
                    filterable
                    placeholder="Select county"
                    style="width: 100%"
                    @change="onCountyChange"
                  >
                    <el-option
                      v-for="county in countyOptions"
                      :key="county.id"
                      :label="county.name"
                      :value="county.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="Settlement" prop="settlement_id">
                  <el-select
                    v-model="form.settlement_id"
                    filterable
                    placeholder="Select settlement"
                    style="width: 100%"
                    :disabled="!form.county_id"
                    :loading="settlementsLoading"
                  >
                    <el-option
                      v-for="settlement in settlementOptions"
                      :key="settlement.id"
                      :label="settlement.name"
                      :value="settlement.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="Your name" prop="reporter_name">
                  <el-input v-model="form.reporter_name" placeholder="Full name" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="Your phone" prop="reporter_phone">
                  <el-input v-model="form.reporter_phone" placeholder="2547XXXXXXXX" maxlength="12" />
                  <p class="gok-grm__hint">Used for SMS updates on this report.</p>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div v-show="activeStep === 1">
            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="Issue type" prop="issue_type">
                  <el-select v-model="form.issue_type" placeholder="Select type" style="width: 100%">
                    <el-option
                      v-for="item in issueTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="Severity" prop="severity">
                  <el-select v-model="form.severity" placeholder="Select severity" style="width: 100%">
                    <el-option
                      v-for="item in severityOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="Describe the issue" prop="description">
                  <el-input
                    v-model="form.description"
                    type="textarea"
                    :rows="5"
                    maxlength="2000"
                    show-word-limit
                    placeholder="What is wrong, where exactly, and how it affects residents?"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="gok-grm__nav">
            <div class="gok-grm__nav-left">
              <router-link to="/community-issues" class="gok-grm__btn gok-grm__btn--ghost">
                Track existing report
              </router-link>
            </div>
            <div class="gok-grm__nav-right">
              <button
                v-if="activeStep > 0"
                type="button"
                class="gok-grm__btn gok-grm__btn--ghost"
                @click="activeStep -= 1"
              >
                Back
              </button>
              <button
                v-if="activeStep < 1"
                type="button"
                class="gok-grm__btn gok-grm__btn--primary"
                @click="nextStep"
              >
                Next
              </button>
              <button
                v-else
                type="button"
                class="gok-grm__btn gok-grm__btn--primary"
                :disabled="submitting"
                @click="submitReport"
              >
                {{ submitting ? 'Submitting…' : 'Submit report' }}
              </button>
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElButton,
  ElCard,
  ElCol,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRow,
  ElSelect,
  ElStep,
  ElSteps,
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useHead } from '@unhead/vue'
import BaseLayout from './BaseLayout.vue'
import {
  getPublicRegisterCounties,
  getPublicRegisterSettlements,
} from '@/api/register-public'
import {
  createPublicCommunityIssue,
  getPublicCommunityIssueMetadata,
} from '@/api/community'
import {
  COMMUNITY_ISSUE_SEVERITIES,
  COMMUNITY_ISSUE_TYPES,
  normalizeIssueTypeOptions,
  normalizeSeverityOptions,
} from '@/constants/communityIssue'

useHead({
  title: 'Report a community issue | KeSMIS',
  meta: [
    {
      name: 'description',
      content:
        'Report maintenance and service issues in Kenyan informal settlements — water, sanitation, roads, waste, and safety.',
    },
  ],
})

const router = useRouter()
const formRef = ref<FormInstance>()
const activeStep = ref(0)
const submitting = ref(false)
const submitted = ref(false)
const submittedCode = ref('')
const submittedId = ref<number | null>(null)
const submittedPhone = ref('')

const countyOptions = ref<Array<{ id: number; name: string }>>([])
const settlementOptions = ref<Array<{ id: number; name: string }>>([])
const settlementsLoading = ref(false)
const issueTypeOptions = ref<Array<{ value: string; label: string }>>([...COMMUNITY_ISSUE_TYPES])
const severityOptions = ref<Array<{ value: string; label: string }>>([...COMMUNITY_ISSUE_SEVERITIES])

const form = ref({
  county_id: undefined as number | undefined,
  settlement_id: undefined as number | undefined,
  reporter_name: '',
  reporter_phone: '',
  issue_type: '',
  description: '',
  severity: 'medium',
})

const rules: FormRules = {
  county_id: [{ required: true, message: 'County is required', trigger: 'change' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'change' }],
  reporter_name: [{ required: true, message: 'Your name is required', trigger: 'blur' }],
  reporter_phone: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],
  issue_type: [{ required: true, message: 'Issue type is required', trigger: 'change' }],
  description: [
    { required: true, message: 'Description is required', trigger: 'blur' },
    { min: 10, message: 'Please provide more detail', trigger: 'blur' },
  ],
  severity: [{ required: true, message: 'Severity is required', trigger: 'change' }],
}

watch(
  () => form.value.reporter_phone,
  (value) => {
    if (!value) return
    let sanitized = String(value).replace(/\D/g, '')
    if (sanitized.startsWith('0')) sanitized = `254${sanitized.slice(1)}`
    if (sanitized.startsWith('7') && sanitized.length <= 9) sanitized = `254${sanitized}`
    form.value.reporter_phone = sanitized.slice(0, 12)
  }
)

async function loadMetadata() {
  issueTypeOptions.value = [...COMMUNITY_ISSUE_TYPES]
  severityOptions.value = [...COMMUNITY_ISSUE_SEVERITIES]

  try {
    const res = await getPublicCommunityIssueMetadata()
    issueTypeOptions.value = normalizeIssueTypeOptions(res?.issueTypes)
    severityOptions.value = normalizeSeverityOptions(res?.severities)
  } catch (error) {
    console.warn('[CommunityIssueReport] metadata load failed', error)
  }
}

async function loadCounties() {
  try {
    const res = await getPublicRegisterCounties()
    countyOptions.value = (res?.data || []).map((item) => ({
      id: item.id,
      name: item.name,
    }))
  } catch {
    countyOptions.value = []
  }
}

async function onCountyChange() {
  form.value.settlement_id = undefined
  settlementOptions.value = []
  if (!form.value.county_id) return

  settlementsLoading.value = true
  try {
    const res = await getPublicRegisterSettlements({
      county_id: form.value.county_id,
      limit: 2000,
      page: 1,
    })
    const rows = res?.data || res?.documents || res?.results || []
    settlementOptions.value = (Array.isArray(rows) ? rows : []).map((item: any) => ({
      id: item.id,
      name: item.name,
    }))
  } catch {
    settlementOptions.value = []
  } finally {
    settlementsLoading.value = false
  }
}

async function nextStep() {
  if (!formRef.value) return
  const step0Fields = ['county_id', 'settlement_id', 'reporter_name', 'reporter_phone']
  try {
    for (const field of step0Fields) {
      await formRef.value.validateField(field)
    }
    activeStep.value += 1
  } catch {
    ElMessage.warning('Please complete the required fields')
  }
}

async function submitReport() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('Please complete all required fields')
    return
  }

  submitting.value = true
  try {
    const res: any = await createPublicCommunityIssue({
      county_id: form.value.county_id,
      settlement_id: form.value.settlement_id,
      reporter_name: form.value.reporter_name.trim(),
      reporter_phone: form.value.reporter_phone.trim(),
      issue_type: form.value.issue_type,
      description: form.value.description.trim(),
      severity: form.value.severity,
    })

    submittedId.value = res?.data?.id ?? null
    submittedCode.value = res?.data?.code || ''
    submittedPhone.value = form.value.reporter_phone
    submitted.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || 'Could not submit your report. Please try again.')
  } finally {
    submitting.value = false
  }
}

function goToTracking() {
  if (submittedId.value) {
    router.push(`/community-issues/${submittedId.value}`)
    return
  }
  router.push('/community-issues')
}

function resetAndFileAnother() {
  submitted.value = false
  submittedCode.value = ''
  submittedId.value = null
  activeStep.value = 0
  form.value = {
    county_id: undefined,
    settlement_id: undefined,
    reporter_name: '',
    reporter_phone: '',
    issue_type: '',
    description: '',
    severity: 'medium',
  }
  settlementOptions.value = []
  formRef.value?.clearValidate()
}

onMounted(async () => {
  await Promise.all([loadMetadata(), loadCounties()])
})
</script>

<style scoped>
.gok-grm {
  padding: 2rem 0 3rem;
  background: var(--gok-grey, #f4f6f8);
  min-height: 60vh;
}

.gok-grm__shell {
  max-width: 920px;
  margin: 0 auto;
  background: var(--gok-white, #fff);
  border: 1px solid var(--gok-border, #e2e8f0);
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
}

.gok-grm__header {
  margin-bottom: 1.5rem;
}

.gok-grm__title {
  margin: 0.35rem 0 0.75rem;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--gok-charcoal, #1e293b);
}

.gok-grm__lead {
  margin: 0;
  color: var(--gok-muted, #64748b);
  line-height: 1.55;
}

.gok-grm__lead--secondary {
  margin-top: 0.75rem;
  font-size: 0.9375rem;
}

.gok-inline-link {
  color: var(--gok-green, #00a651);
  font-weight: 600;
  text-decoration: none;
}

.gok-inline-link:hover {
  text-decoration: underline;
}

.gok-grm__steps {
  margin-bottom: 1.5rem;
}

.gok-grm__hint {
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  color: var(--gok-muted, #64748b);
}

.gok-grm__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gok-border, #e2e8f0);
  flex-wrap: wrap;
}

.gok-grm__nav-left,
.gok-grm__nav-right {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.gok-grm__btn {
  appearance: none;
  border-radius: 8px;
  padding: 0.65rem 1.1rem;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.gok-grm__btn--primary {
  border: 1px solid var(--gok-green, #00a651);
  background: var(--gok-green, #00a651);
  color: #fff;
}

.gok-grm__btn--primary:hover:not(:disabled) {
  background: var(--gok-green-dark, #008c44);
}

.gok-grm__btn--primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.gok-grm__btn--ghost {
  border: 1px solid var(--gok-border, #e2e8f0);
  background: transparent;
  color: var(--gok-charcoal, #1e293b);
}

.gok-grm__btn--ghost:hover {
  border-color: var(--gok-green, #00a651);
  color: var(--gok-green, #00a651);
}

.gok-success-card {
  text-align: center;
  padding: 1rem 0.5rem 0.25rem;
  border: none;
}

.gok-success-card h2 {
  margin: 0 0 0.75rem;
  font-size: 1.35rem;
}

.gok-success-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1.25rem;
}

@media (max-width: 640px) {
  .gok-grm__shell {
    padding: 1.25rem;
  }

  .gok-grm__nav {
    flex-direction: column;
    align-items: stretch;
  }

  .gok-grm__nav-left,
  .gok-grm__nav-right {
    width: 100%;
    justify-content: stretch;
  }

  .gok-grm__btn {
    flex: 1;
  }
}
</style>
