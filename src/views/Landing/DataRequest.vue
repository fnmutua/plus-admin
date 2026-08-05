<template>
  <BaseLayout>
    <div class="gok-dr">
      <div class="gok-container gok-dr__shell">
        <!-- Success -->
        <div v-if="submitted" class="gok-dr__success">
          <div class="gok-dr__success-icon" aria-hidden="true">
            <Icon icon="mdi:check-decagram" width="52" height="52" />
          </div>
          <h1 class="gok-dr__title">Request submitted</h1>
          <p class="gok-dr__ref-label">Your reference code</p>
          <p class="gok-dr__ref-code">{{ referenceCode }}</p>
          <p class="gok-dr__lead">
            Keep this code for follow-up. An acknowledgment has been sent to your email (check spam if
            needed). When materials are ready, you may receive a secure download link.
          </p>
          <div class="gok-dr__nav gok-dr__nav--center">
            <button type="button" class="gok-dr__btn gok-dr__btn--ghost" @click="resetForm">
              Submit another
            </button>
            <button type="button" class="gok-dr__btn gok-dr__btn--primary" @click="router.push('/landing')">
              Return home
            </button>
          </div>
        </div>

        <template v-else>
          <header class="gok-dr__header">
            <p class="gok-eyebrow">Public data access</p>
            <h1 class="gok-dr__title">Data request</h1>
            <p class="gok-dr__lead">
              Submit electronically and keep the reference code you receive.
            </p>
          </header>

          <el-steps
            :active="active"
            finish-status="success"
            class="gok-dr__steps"
            aria-label="Data request steps"
          >
            <el-step title="Requester" />
            <el-step title="Data" />
            <el-step title="Usage" />
            <el-step title="Declare" />
          </el-steps>

          <el-form
            ref="formRef"
            :model="form"
            :rules="currentStepRules"
            label-position="top"
            class="gok-dr__form"
            size="default"
          >
            <!-- Step 0: Requester -->
            <el-row v-if="active === 0" :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="Full name" prop="name">
                  <el-input v-model="form.name" placeholder="Enter your full name" />
                </el-form-item>
                <el-form-item label="Organization" prop="organization">
                  <el-input v-model="form.organization" placeholder="Organization / institution" />
                </el-form-item>
                <el-form-item label="Position / title" prop="position">
                  <el-input v-model="form.position" placeholder="Your role or title" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="Work area">
                  <el-input v-model="form.work_area" placeholder="e.g. Research, GIS, Policy" />
                </el-form-item>
                <el-form-item label="Email" prop="email">
                  <el-input v-model="form.email" type="email" placeholder="your@email.com" />
                </el-form-item>
                <el-form-item label="Daytime telephone" prop="phone">
                  <el-input v-model="form.phone" placeholder="+254 7XX XXX XXX" />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Step 1: What data -->
            <el-row v-if="active === 1" :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="Description of data requested" prop="data_description">
                  <el-input
                    v-model="form.data_description"
                    type="textarea"
                    :rows="2"
                    placeholder="Specific data elements and attributes needed"
                  />
                </el-form-item>
                <el-form-item label="Intended use" prop="intended_use">
                  <el-input
                    v-model="form.intended_use"
                    type="textarea"
                    :rows="2"
                    placeholder="Purpose for which the data will be used"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="Data classification">
                  <div class="gok-dr__flags">
                    <el-checkbox-group v-model="form.data_classification">
                      <el-checkbox label="Aggregated" value="Aggregated" />
                      <el-checkbox label="Anonymized" value="Anonymized" />
                      <el-checkbox label="Personal Data" value="Personal Data" />
                      <el-checkbox label="Sensitive / Highly Sensitive" value="Sensitive/Highly Sensitive" />
                    </el-checkbox-group>
                  </div>
                </el-form-item>
                <el-form-item label="Geographic scope">
                  <el-select v-model="form.geographic_scope" placeholder="Select scope" style="width: 100%">
                    <el-option label="National" value="National" />
                    <el-option label="Specific County" value="County" />
                    <el-option label="Specific Sub-county" value="Sub-county" />
                    <el-option label="Other" value="Other" />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="requiresCountyDetails" label="County" prop="requested_county">
                  <el-select
                    v-model="form.requested_county"
                    placeholder="Select county"
                    style="width: 100%"
                    filterable
                    :loading="countiesLoading"
                    @change="onRequestedCountyChange"
                  >
                    <el-option
                      v-for="county in countyOptions"
                      :key="county.value"
                      :label="county.label"
                      :value="county.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="requiresSubcountyDetails" label="Subcounty" prop="requested_subcounty">
                  <el-select
                    v-model="form.requested_subcounty"
                    placeholder="Select subcounty"
                    style="width: 100%"
                    filterable
                    :loading="subcountiesLoading"
                    :disabled="!form.requested_county"
                  >
                    <el-option
                      v-for="subcounty in subcountyOptions"
                      :key="subcounty.value"
                      :label="subcounty.label"
                      :value="subcounty.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Step 2: Use & sharing -->
            <el-row v-if="active === 2" :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="How will the data be used?">
                  <el-input
                    v-model="form.how_data_used"
                    type="textarea"
                    :rows="2"
                    placeholder="Intended application or analysis"
                  />
                </el-form-item>
                <el-form-item label="Will the data be shared further?">
                  <el-radio-group v-model="form.data_shared">
                    <el-radio :value="true">Yes</el-radio>
                    <el-radio :value="false">No</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item v-if="form.data_shared" label="Sharing details">
                  <el-input
                    v-model="form.sharing_details"
                    type="textarea"
                    :rows="2"
                    placeholder="Who and for what purpose"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="Dissemination plan">
                  <el-input
                    v-model="form.dissemination_plan"
                    type="textarea"
                    :rows="2"
                    placeholder="e.g. public report, journal, internal use"
                  />
                </el-form-item>
                <el-form-item label="Made public?">
                  <el-select v-model="form.data_made_public" placeholder="Select" style="width: 100%">
                    <el-option label="Yes – as provided" value="Yes - as provided" />
                    <el-option label="Yes – in modified form" value="Yes - modified form" />
                    <el-option label="No" value="No" />
                  </el-select>
                </el-form-item>
                <el-form-item label="How did you hear of KeSMIS?">
                  <el-select v-model="form.heard_about" placeholder="Select" style="width: 100%">
                    <el-option label="Government Website" value="Government Website" />
                    <el-option label="Colleague / Referral" value="Colleague/Referral" />
                    <el-option label="Conference / Workshop" value="Conference/Workshop" />
                    <el-option label="Internet Search" value="Internet Search" />
                    <el-option label="Social Media" value="Social Media" />
                    <el-option label="Other" value="Other" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Step 3: Declaration -->
            <el-row v-if="active === 3" :gutter="20">
              <el-col :span="24">
                <div class="gok-dr__declare">
                  <p>
                    I confirm that the data will only be used for the stated purpose and in compliance with the
                    <strong>Kenya Data Protection Act, 2019</strong>.
                  </p>
                </div>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="Your name (declaration)" prop="declaration_name">
                  <el-input v-model="form.declaration_name" placeholder="Full name as declaration" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="Date">
                  <el-date-picker
                    v-model="form.declaration_date"
                    type="date"
                    style="width: 100%"
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                    disabled
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item prop="agreed">
                  <el-checkbox v-model="form.agreed">
                    I confirm the above declaration and agree to the terms of data use
                  </el-checkbox>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="gok-dr__nav">
              <div class="gok-dr__nav-left">
                <button
                  v-if="active > 0"
                  type="button"
                  class="gok-dr__btn gok-dr__btn--ghost"
                  @click="prev"
                >
                  Previous
                </button>
              </div>
              <div class="gok-dr__nav-right">
                <button type="button" class="gok-dr__btn gok-dr__btn--ghost" @click="router.push('/landing')">
                  Cancel
                </button>
                <button
                  v-if="active < 3"
                  type="button"
                  class="gok-dr__btn gok-dr__btn--primary"
                  @click="next"
                >
                  Next
                </button>
                <button
                  v-else
                  type="button"
                  class="gok-dr__btn gok-dr__btn--primary"
                  :disabled="loading || !form.agreed"
                  @click="handleSubmit"
                >
                  {{ loading ? 'Submitting…' : 'Submit request' }}
                </button>
              </div>
            </div>
          </el-form>
        </template>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElMessage,
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
  ElInput,
  ElCheckboxGroup,
  ElCheckbox,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio,
  ElDatePicker,
  ElStep,
  ElSteps,
} from 'element-plus'
import type { FormRules } from 'element-plus'
import { Icon } from '@iconify/vue'
import { submitDataRequest } from '@/api/data-request'
import { getCountyAuth, getSubCountyAuth } from '@/api/register'
import BaseLayout from './BaseLayout.vue'

const router = useRouter()
const formRef = ref()
const active = ref(0)
const loading = ref(false)
const submitted = ref(false)
const referenceCode = ref('')
const countiesLoading = ref(false)
const subcountiesLoading = ref(false)
const countyOptions = ref<Array<{ value: number; label: string }>>([])
const subcountyOptions = ref<Array<{ value: number; label: string }>>([])
const lastSubcountyCountyId = ref<number | undefined>(undefined)

const defaultForm = () => ({
  name: '',
  organization: '',
  position: '',
  work_area: '',
  email: '',
  phone: '',
  data_description: '',
  intended_use: '',
  data_classification: [] as string[],
  geographic_scope: '',
  requested_county: undefined as number | undefined,
  requested_subcounty: undefined as number | undefined,
  how_data_used: '',
  data_shared: undefined as boolean | undefined,
  sharing_details: '',
  dissemination_plan: '',
  data_made_public: '',
  heard_about: '',
  declaration_name: '',
  declaration_date: new Date().toISOString().slice(0, 10),
  agreed: false,
})

const form = reactive(defaultForm())
const isCountyScope = (scope: string) => scope === 'County'
const isSubcountyScope = (scope: string) =>
  scope === 'Sub-county' || scope === 'Subcounty' || scope === 'Sub County'
const requiresCountyDetails = computed(
  () => isCountyScope(form.geographic_scope) || isSubcountyScope(form.geographic_scope)
)
const requiresSubcountyDetails = computed(() => isSubcountyScope(form.geographic_scope))

const stepFields: string[][] = [
  ['name', 'organization', 'position', 'email', 'phone'],
  ['data_description', 'intended_use', 'requested_county', 'requested_subcounty'],
  [],
  ['declaration_name', 'agreed'],
]

const allRules: FormRules = {
  name: [{ required: true, message: 'Full name is required', trigger: 'blur' }],
  organization: [{ required: true, message: 'Organization is required', trigger: 'blur' }],
  position: [{ required: true, message: 'Position / title is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email' as const, message: 'Enter a valid email', trigger: 'blur' },
  ],
  phone: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],
  data_description: [{ required: true, message: 'Data description is required', trigger: 'blur' }],
  intended_use: [{ required: true, message: 'Intended use is required', trigger: 'blur' }],
  requested_county: [
    {
      validator: (_: any, value: number | undefined, callback: Function) => {
        if (requiresCountyDetails.value && !value) {
          callback(new Error('County is required for this geographic scope'))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
  requested_subcounty: [
    {
      validator: (_: any, value: number | undefined, callback: Function) => {
        if (requiresSubcountyDetails.value && !value) {
          callback(new Error('Subcounty is required for this geographic scope'))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
  declaration_name: [{ required: true, message: 'Declaration name is required', trigger: 'blur' }],
  agreed: [
    {
      validator: (_: any, value: boolean, callback: Function) => {
        if (!value) callback(new Error('You must confirm the declaration'))
        else callback()
      },
      trigger: 'change',
    },
  ],
}

const currentStepRules = computed(() => {
  const fields = stepFields[active.value] || []
  const rules: FormRules = {}
  for (const key of fields) {
    if (allRules[key]) rules[key] = allRules[key]
  }
  return rules
})

const loadCounties = async () => {
  countiesLoading.value = true
  try {
    const response: any = await getCountyAuth({ model: 'county' } as any)
    const data = response?.data || []
    countyOptions.value = data
      .map((county: any) => ({ value: Number(county.id), label: String(county.name) }))
      .sort((a: { value: number }, b: { value: number }) => a.value - b.value)
  } catch {
    ElMessage.error('Failed to load counties.')
    countyOptions.value = []
  } finally {
    countiesLoading.value = false
  }
}

const loadSubcounties = async (countyId: number | undefined) => {
  if (countyId === lastSubcountyCountyId.value) return
  lastSubcountyCountyId.value = countyId

  subcountyOptions.value = []
  form.requested_subcounty = undefined

  if (!countyId) return

  subcountiesLoading.value = true
  try {
    const response: any = await getSubCountyAuth({ county: countyId } as any)
    const data = Array.isArray(response) ? response : response?.data || []
    subcountyOptions.value = data
      .map((subcounty: any) => ({ value: Number(subcounty.id), label: String(subcounty.name) }))
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label))
  } catch {
    ElMessage.error('Failed to load subcounties.')
    subcountyOptions.value = []
  } finally {
    subcountiesLoading.value = false
  }
}

const onRequestedCountyChange = (countyId: number | undefined) => {
  void loadSubcounties(countyId)
}

watch(
  () => form.geographic_scope,
  (scope) => {
    if (!isCountyScope(scope) && !isSubcountyScope(scope)) {
      form.requested_county = undefined
      form.requested_subcounty = undefined
      subcountyOptions.value = []
      lastSubcountyCountyId.value = undefined
      return
    }
    if (isCountyScope(scope)) {
      form.requested_subcounty = undefined
    }
  }
)

onMounted(() => {
  void loadCounties()
})

const focusFirstInvalidField = async () => {
  await nextTick()
  const firstErrorItem = document.querySelector('.gok-dr__form .el-form-item.is-error')
  if (!firstErrorItem) return
  firstErrorItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const focusTarget = firstErrorItem.querySelector(
    'input, textarea, [tabindex]:not([tabindex="-1"]), .el-select__wrapper, .el-checkbox'
  ) as HTMLElement | null
  focusTarget?.focus()
}

const next = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    await focusFirstInvalidField()
    return
  }
  if (active.value < 3) active.value += 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const prev = () => {
  if (active.value > 0) active.value -= 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    await focusFirstInvalidField()
    return
  }

  loading.value = true
  try {
    const payload = { ...form }
    delete (payload as any).agreed

    const res = await submitDataRequest(payload)
    referenceCode.value = res.results?.reference || ''
    submitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || 'Failed to submit request. Please try again.')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, defaultForm())
  submitted.value = false
  referenceCode.value = ''
  active.value = 0
}
</script>

<style scoped>
.gok-dr {
  padding: 1.5rem 0 2.25rem;
  background: var(--gok-grey, #f5f7f6);
  color: var(--gok-charcoal, #212121);
  font-family: var(--gok-font, 'Montserrat', sans-serif);
}

.gok-dr__shell {
  max-width: 56rem;
  margin: 0 auto;
  background: var(--gok-panel, #fff);
  border: 1px solid var(--gok-border, #e3e8e5);
  border-radius: 12px;
  box-shadow: var(--gok-shadow, 0 10px 28px rgba(0, 0, 0, 0.06));
  padding: 1.15rem 1.25rem 1rem;
}

.gok-dr__header {
  margin-bottom: 0.85rem;
}

.gok-dr__title {
  margin: 0 0 0.3rem;
  font-size: clamp(1.25rem, 2.2vw, 1.55rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--gok-charcoal, #212121);
}

.gok-dr__lead {
  margin: 0;
  max-width: 40rem;
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--gok-muted, #5f6368);
}

.gok-dr__steps {
  margin: 0 0 1rem;
  padding: 0.65rem 0.75rem 0.55rem;
  background: var(--gok-grey, #f5f7f6);
  border-radius: 8px;
  border: 1px solid var(--gok-border, #e3e8e5);
}

.gok-dr__steps :deep(.el-step__title) {
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.25;
  max-width: none;
  white-space: nowrap;
  color: var(--gok-muted, #5f6368);
}

.gok-dr__steps :deep(.el-step__title.is-process),
.gok-dr__steps :deep(.el-step__title.is-finish) {
  color: var(--gok-green, #00843d);
}

.gok-dr__steps :deep(.el-step__description) {
  display: none;
}

.gok-dr__steps :deep(.el-step__icon) {
  width: 26px;
  height: 26px;
  font-size: 12px;
  border-width: 2px;
}

.gok-dr__steps :deep(.el-step__icon-inner) {
  font-weight: 700;
}

.gok-dr__steps :deep(.el-step__head.is-process),
.gok-dr__steps :deep(.el-step__head.is-finish) {
  color: var(--gok-green, #00843d);
  border-color: var(--gok-green, #00843d);
}

.gok-dr__steps :deep(.el-step__head.is-process .el-step__icon),
.gok-dr__steps :deep(.el-step__head.is-finish .el-step__icon) {
  background: var(--gok-green, #00843d);
  border-color: var(--gok-green, #00843d);
  color: #fff;
}

.gok-dr__steps :deep(.el-step__head.is-wait) {
  color: var(--gok-muted, #8a968e);
  border-color: var(--gok-border, #e3e8e5);
}

.gok-dr__steps :deep(.el-step__line) {
  background-color: var(--gok-border, #e3e8e5);
}

.gok-dr__steps :deep(.el-step.is-horizontal .el-step__line) {
  top: 13px;
}

.gok-dr__steps :deep(.el-step__main) {
  white-space: nowrap;
}

.gok-dr__form :deep(.el-form-item) {
  margin-bottom: 0.75rem;
}

.gok-dr__form :deep(.el-form-item__label) {
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--gok-charcoal, #212121);
  margin-bottom: 0.2rem !important;
  line-height: 1.25;
}

.gok-dr__flags {
  padding: 0.55rem 0.7rem;
  background: var(--gok-grey, #f5f7f6);
  border: 1px solid var(--gok-border, #e3e8e5);
  border-radius: 8px;
}

.gok-dr__flags :deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.gok-dr__declare {
  padding: 0.7rem 0.85rem;
  margin-bottom: 0.5rem;
  background: var(--gok-green-soft, #e8f5ee);
  border: 1px solid color-mix(in srgb, var(--gok-green, #00843d) 28%, transparent);
  border-radius: 8px;
  color: var(--gok-charcoal, #212121);
  font-size: 0.85rem;
  line-height: 1.4;
}

.gok-dr__declare p {
  margin: 0;
}

.gok-dr__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
  margin-top: 0.25rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--gok-border, #e3e8e5);
}

.gok-dr__nav--center {
  justify-content: center;
  border-top: 0;
  padding-top: 1rem;
}

.gok-dr__nav-left,
.gok-dr__nav-right {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.gok-dr__btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.5rem 0.9rem;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.gok-dr__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.gok-dr__btn--primary {
  background: var(--gok-green, #00843d);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 132, 61, 0.25);
}

.gok-dr__btn--primary:hover:not(:disabled) {
  background: var(--gok-green-dark, #006b32);
}

.gok-dr__btn--ghost {
  background: transparent;
  border-color: var(--gok-border, #e3e8e5);
  color: var(--gok-charcoal, #212121);
}

.gok-dr__btn--ghost:hover {
  border-color: var(--gok-green, #00843d);
  color: var(--gok-green, #00843d);
  background: var(--gok-green-soft, #e8f5ee);
}

.gok-dr__success {
  text-align: center;
  padding: 0.35rem 0 0.15rem;
}

.gok-dr__success-icon {
  color: var(--gok-green, #00843d);
  margin-bottom: 0.5rem;
}

.gok-dr__ref-label {
  margin: 0.75rem 0 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gok-muted, #5f6368);
}

.gok-dr__ref-code {
  margin: 0 0 0.75rem;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--gok-green, #00843d);
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  word-break: break-all;
}

.gok-dr__success .gok-dr__lead {
  margin: 0 auto;
  max-width: 32rem;
}

.gok-dr :deep(.el-input__wrapper),
.gok-dr :deep(.el-textarea__inner),
.gok-dr :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  background: var(--gok-panel, #fff);
}

.gok-dr :deep(.el-input__wrapper) {
  border: 1px solid var(--gok-border, #e3e8e5);
  min-height: 34px;
  padding-top: 0;
  padding-bottom: 0;
}

.gok-dr :deep(.el-input__wrapper:hover),
.gok-dr :deep(.el-textarea__inner:hover) {
  border-color: var(--gok-green, #00843d);
}

.gok-dr :deep(.el-input__wrapper.is-focus),
.gok-dr :deep(.el-textarea__inner:focus) {
  border-color: var(--gok-green, #00843d);
  box-shadow: 0 0 0 2px rgba(0, 132, 61, 0.15);
}

.gok-dr :deep(.el-textarea__inner) {
  border: 1px solid var(--gok-border, #e3e8e5);
  font-family: inherit;
  padding: 0.45rem 0.65rem;
}

.gok-dr :deep(.el-checkbox__input.is-checked .el-checkbox__inner),
.gok-dr :deep(.el-radio__input.is-checked .el-radio__inner) {
  background: var(--gok-green, #00843d);
  border-color: var(--gok-green, #00843d);
}

.gok-dr :deep(.el-checkbox__label),
.gok-dr :deep(.el-radio__label) {
  color: var(--gok-charcoal, #212121);
  font-weight: 500;
  white-space: normal;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .gok-dr {
    padding: 1rem 0 1.5rem;
  }

  .gok-dr__shell {
    border-radius: 10px;
    padding: 1rem 0.9rem 0.9rem;
  }

  .gok-dr__nav {
    flex-direction: column;
    align-items: stretch;
  }

  .gok-dr__nav-left,
  .gok-dr__nav-right {
    width: 100%;
  }

  .gok-dr__btn {
    flex: 1;
    justify-content: center;
  }

  .gok-dr__steps :deep(.el-step__title) {
    font-size: 0.68rem;
  }
}

</style>
