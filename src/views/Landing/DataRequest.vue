<template>
  <BaseLayout>
    <div class="dr-page">
      <div class="dr-container">
        <!-- Header -->
        <div class="dr-header">
          <img src="/logo.png" alt="Ministry logo" class="dr-logo" @error="(e: any) => e.target.style.display='none'" />
          <h1 class="dr-title">National Geodatabase of Slums and Informal Settlements</h1>
          <h2 class="dr-subtitle">Data Request Form</h2>
          <p class="dr-instructions">
            Complete this form and submit electronically. You will receive a reference code upon submission.
            For assistance contact the KeSMIS support team.
          </p>
        </div>

        <!-- Success state -->
        <el-result
          v-if="submitted"
          icon="success"
          title="Request Submitted"
          :sub-title="`Your reference code is: ${referenceCode}`"
        >
          <template #extra>
            <p class="success-note">Please keep your reference code for follow-up. Our team will review your request and contact you via the email provided.</p>
            <el-button type="primary" @click="router.push('/landing')">Return to Home</el-button>
            <el-button @click="resetForm">Submit Another Request</el-button>
          </template>
        </el-result>

        <el-form
          v-else
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="dr-form"
        >
          <!-- Section 1: Requester Details -->
          <el-card class="dr-card" shadow="never">
            <template #header>
              <div class="card-header">
                <Icon icon="mdi:account-details" width="20" />
                <span>Details of Requester</span>
              </div>
            </template>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="Full Name" prop="name">
                  <el-input v-model="form.name" placeholder="Enter your full name" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="Organization" prop="organization">
                  <el-input v-model="form.organization" placeholder="Organization / institution" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="Position / Title" prop="position">
                  <el-input v-model="form.position" placeholder="Your role or title" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="Work Area in Organization">
                  <el-input v-model="form.work_area" placeholder="e.g. Research, GIS, Policy" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="Email Address" prop="email">
                  <el-input v-model="form.email" type="email" placeholder="your@email.com" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="Daytime Telephone" prop="phone">
                  <el-input v-model="form.phone" placeholder="+254 7XX XXX XXX" />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="Mailing Address">
                  <el-input v-model="form.mailing_address" placeholder="P.O. Box or street address" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>

          <!-- Section 2: Data Request Details -->
          <el-card class="dr-card" shadow="never">
            <template #header>
              <div class="card-header">
                <Icon icon="mdi:database-search" width="20" />
                <span>Details of Data Requested</span>
              </div>
            </template>

            <el-row :gutter="16">
              <el-col :xs="24">
                <el-form-item label="Description of Data Requested" prop="data_description">
                  <el-input
                    v-model="form.data_description"
                    type="textarea"
                    :rows="3"
                    placeholder="Describe the specific data elements and attributes you need"
                  />
                </el-form-item>
              </el-col>

              <el-col :xs="24">
                <el-form-item label="Intended Use of the Data" prop="intended_use">
                  <el-input
                    v-model="form.intended_use"
                    type="textarea"
                    :rows="3"
                    placeholder="Describe the purpose for which the data will be used"
                  />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="12">
                <el-form-item label="Data Classification">
                  <el-checkbox-group v-model="form.data_classification" class="classification-group">
                    <el-checkbox label="Aggregated" value="Aggregated" />
                    <el-checkbox label="Anonymized" value="Anonymized" />
                    <el-checkbox label="Personal Data" value="Personal Data" />
                    <el-checkbox label="Sensitive / Highly Sensitive" value="Sensitive/Highly Sensitive" />
                  </el-checkbox-group>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="12">
                <el-form-item label="Geographic Scope">
                  <el-select v-model="form.geographic_scope" placeholder="Select scope" style="width:100%">
                    <el-option label="National" value="National" />
                    <el-option label="Specific County" value="County" />
                    <el-option label="Specific Sub-county" value="Sub-county" />
                    <el-option label="Other" value="Other" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :xs="24">
                <el-form-item label="How Will the Data Be Used?">
                  <el-input
                    v-model="form.how_data_used"
                    type="textarea"
                    :rows="2"
                    placeholder="Describe the intended application or analysis"
                  />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="12">
                <el-form-item label="Will the Data Be Shared Further?">
                  <el-radio-group v-model="form.data_shared">
                    <el-radio :value="true">Yes</el-radio>
                    <el-radio :value="false">No</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>

              <el-col v-if="form.data_shared" :xs="24" :sm="12">
                <el-form-item label="If Yes, Provide Sharing Details">
                  <el-input
                    v-model="form.sharing_details"
                    type="textarea"
                    :rows="2"
                    placeholder="Who will the data be shared with and for what purpose"
                  />
                </el-form-item>
              </el-col>

              <el-col :xs="24">
                <el-form-item label="Dissemination Plan">
                  <el-input
                    v-model="form.dissemination_plan"
                    type="textarea"
                    :rows="2"
                    placeholder="e.g. public report, conference, journal article, internal use only"
                  />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="12">
                <el-form-item label="Will Data Be Made Public?">
                  <el-select v-model="form.data_made_public" placeholder="Select" style="width:100%">
                    <el-option label="Yes – as provided" value="Yes - as provided" />
                    <el-option label="Yes – in modified form" value="Yes - modified form" />
                    <el-option label="No" value="No" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="12">
                <el-form-item label="How Did You Hear of KeSMIS?">
                  <el-select v-model="form.heard_about" placeholder="Select" style="width:100%">
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
          </el-card>

          <!-- Section 3: Declaration -->
          <el-card class="dr-card" shadow="never">
            <template #header>
              <div class="card-header">
                <Icon icon="mdi:file-sign" width="20" />
                <span>Declaration</span>
              </div>
            </template>

            <el-alert
              type="info"
              :closable="false"
              show-icon
              class="declaration-alert"
            >
              <template #default>
                I confirm that the data will only be used for the stated purpose and in compliance with the
                <strong>Kenya Data Protection Act, 2019</strong>.
              </template>
            </el-alert>

            <el-row :gutter="16" style="margin-top: 16px;">
              <el-col :xs="24" :sm="12">
                <el-form-item label="Your Name (Declaration)" prop="declaration_name">
                  <el-input v-model="form.declaration_name" placeholder="Full name as declaration" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="Date">
                  <el-date-picker
                    v-model="form.declaration_date"
                    type="date"
                    placeholder="Select date"
                    style="width:100%"
                    format="DD/MM/YYYY"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item prop="agreed">
                  <el-checkbox v-model="form.agreed">
                    I confirm the above declaration and agree to the terms of data use
                  </el-checkbox>
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>

          <!-- Submit -->
          <div class="dr-actions">
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              :disabled="!form.agreed"
              @click="handleSubmit"
            >
              <Icon icon="mdi:send" width="18" style="margin-right:6px" />
              Submit Request
            </el-button>
            <el-button size="large" @click="router.push('/landing')">Cancel</el-button>
          </div>
        </el-form>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElMessage,
  ElResult,
  ElButton,
  ElForm,
  ElFormItem,
  ElCard,
  ElRow,
  ElCol,
  ElInput,
  ElCheckboxGroup,
  ElCheckbox,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio,
  ElAlert,
  ElDatePicker
} from 'element-plus'
import { Icon } from '@iconify/vue'
import { submitDataRequest } from '@/api/data-request'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const submitted = ref(false)
const referenceCode = ref('')

const defaultForm = () => ({
  name: '',
  organization: '',
  position: '',
  work_area: '',
  mailing_address: '',
  email: '',
  phone: '',
  data_description: '',
  intended_use: '',
  data_classification: [] as string[],
  geographic_scope: '',
  how_data_used: '',
  data_shared: undefined as boolean | undefined,
  sharing_details: '',
  dissemination_plan: '',
  data_made_public: '',
  heard_about: '',
  declaration_name: '',
  declaration_date: '',
  agreed: false
})

const form = reactive(defaultForm())

const rules = {
  name: [{ required: true, message: 'Full name is required', trigger: 'blur' }],
  organization: [{ required: true, message: 'Organization is required', trigger: 'blur' }],
  position: [{ required: true, message: 'Position / title is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email', trigger: 'blur' }
  ],
  phone: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],
  data_description: [{ required: true, message: 'Data description is required', trigger: 'blur' }],
  intended_use: [{ required: true, message: 'Intended use is required', trigger: 'blur' }],
  declaration_name: [{ required: true, message: 'Declaration name is required', trigger: 'blur' }],
  agreed: [
    {
      validator: (_: any, value: boolean, callback: Function) => {
        if (!value) callback(new Error('You must confirm the declaration'))
        else callback()
      },
      trigger: 'change'
    }
  ]
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const payload = { ...form }
    delete (payload as any).agreed

    const res = await submitDataRequest(payload)
    referenceCode.value = res.results?.reference || ''
    submitted.value = true
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
}
</script>

<style scoped>
.dr-page {
  height: calc(100vh - 70px);
  overflow-y: auto;
  background: var(--el-bg-color-page, #f5f7fa);
  padding: 32px 16px 64px;
  box-sizing: border-box;
}

.dr-container {
  max-width: 860px;
  margin: 0 auto;
}

.dr-header {
  text-align: center;
  margin-bottom: 32px;
}

.dr-logo {
  height: 80px;
  margin-bottom: 16px;
}

.dr-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.dr-subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: var(--el-color-primary);
  margin: 0 0 12px;
}

.dr-instructions {
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.dr-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dr-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--el-text-color-primary);
}

.classification-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.declaration-alert {
  margin-bottom: 4px;
}

.dr-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 8px 0;
}

.success-note {
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
  margin-bottom: 16px;
  text-align: center;
}

@media (max-width: 600px) {
  .dr-actions {
    flex-direction: column-reverse;
  }
  .dr-actions .el-button {
    width: 100%;
  }
}
</style>
