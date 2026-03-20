<script setup lang="ts">
import { ref, onMounted, watch, reactive } from 'vue'
import { ElButton, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElCheckbox, ElMessage, ElLink, FormInstance } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { InputPassword } from '@/components/InputPassword'
import { registerApi, getCountyAuth } from '@/api/register'
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'
import { useRouter } from 'vue-router'
import BaseLayout from '../../BaseLayout.vue'

interface CountyOption {
  value: string | number
  label: string
}

interface RegistrationFormData {
  name: string
  username: string
  email: string
  password: string
  organization_name: string
  county_id: string | number
  phone: string
  phone_e164?: string
  country_name?: string
  country?: string
  agree_terms: boolean
  role?: string[]
  location_level?: string
  location_id?: string | number
  location_field?: string
  access_reason?: string
  data_use_description?: string
}

const { push } = useRouter()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)

const countiesOptions = ref<CountyOption[]>([])
const loadingCounties = ref(false)

const formData = reactive<RegistrationFormData>({
  name: '',
  username: '',
  email: '',
  password: '',
  organization_name: '',
  county_id: '',
  phone: '',
  phone_e164: '',
  country_name: '',
  country: '',
  agree_terms: true,
  access_reason: '',
  data_use_description: ''
})

const accessReasonOptions = [
  { value: 'research', label: 'Research' },
  { value: 'journalism', label: 'Journalism' },
  { value: 'ngo_cso', label: 'NGO / CSO Work' },
  { value: 'academic', label: 'Academic Study' },
  { value: 'government', label: 'Government / Public Sector' },
  { value: 'personal', label: 'Personal Interest' },
  { value: 'other', label: 'Other' }
]

// vue-tel-input validation state
const phoneIsValid = ref(false)
const isKenya = ref(false)
const phoneTouched = ref(false)

// Fetch counties
const getTableList = async () => {
  try {
    loadingCounties.value = true
    const response = await getCountyAuth({ model: 'county' } as any)
    const cnty = (response as any).data ?? []
    countiesOptions.value = cnty.map((item: any) => ({
      value: item.id,
      label: item.name
    }))
    countiesOptions.value.push({ value: '0', label: 'Not Applicable' })
    countiesOptions.value.sort((a, b) => Number(a.value) - Number(b.value))
  } catch (error) {
    console.error('Error fetching counties:', error)
  } finally {
    loadingCounties.value = false
  }
}
onMounted(getTableList)

// Validation rules
const rules = {
  name: [
    { required: true, message: 'Name is required', trigger: 'blur' },
    {
      validator: (_: any, value: string, cb: any) => {
        if (!value) return cb(new Error('Name is required'))
        const words = value.trim().split(/\s+/g)
        if (words.length < 2) return cb(new Error('Name should have at least two names, each at least 3 characters long'))
        if (words.some(w => w.length < 3)) return cb(new Error('Each name should be at least 3 characters long'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  username: [
    { required: true, message: 'Username is required', trigger: 'blur' },
    {
      validator: (_: any, value: string, cb: any) => {
        const re = /^[a-z0-9]{5,}$/i
        if (!re.test(value || '')) return cb(new Error('Lowercase letters and/or numbers, no special characters, no space and at least 5 characters long.'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    {
      validator: (_: any, value: string, cb: any) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!re.test(value || '')) return cb(new Error('Invalid email format'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: 'Please enter the password', trigger: 'blur' },
    {
      validator: (_: any, value: string, cb: any) => {
        if (!value || value.trim() === '') return cb(new Error('Please enter the password'))
        if (value.length < 8 || value.length > 20) return cb(new Error('The password must be between 8 and 20 characters long'))
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]+$/
        if (!re.test(value)) return cb(new Error('Required: at least one uppercase letter, one lowercase letter, one digit, and one special character'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  organization_name: [
    { required: true, message: 'Organization name is required', trigger: 'blur' },
    {
      validator: (_: any, value: string, cb: any) => {
        if (!value || value.trim() === '') return cb(new Error('Organization name is required'))
        if (value.trim().length < 2) return cb(new Error('Organization name should be at least 2 characters long'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  county_id: [
    {
      validator: (_: any, value: string | number, cb: any) => {
        if (!isKenya.value) return cb()
        if (value === '' || value === undefined || value === null) {
          return cb(new Error('County is required'))
        }
        cb()
      },
      trigger: 'change'
    }
  ],
  agree_terms: [
    {
      validator: (_: any, value: boolean, cb: any) => {
        if (value !== true) return cb(new Error('You must agree to the terms of the Privacy Policy'))
        cb()
      },
      trigger: 'change'
    }
  ],
  access_reason: [
    { required: true, message: 'Please select a reason for access', trigger: 'change' }
  ],
  data_use_description: [
    { required: true, message: 'Please describe your intended use of the data', trigger: 'blur' },
    {
      validator: (_: any, value: string, cb: any) => {
        if (!value || value.trim().length < 50)
          return cb(new Error('Please provide at least 50 characters describing your intended use'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { required: true, message: 'Phone number is required', trigger: ['blur', 'change'] },
    {
      validator: (_: any, value: string, cb: any) => {
        if (!value || value.trim() === '') {
          return cb(new Error('Phone number is required'))
        }
        
        if (phoneIsValid.value && formData.phone_e164) {
          return cb()
        }
        
        const cleanPhone = value.trim().replace(/\s/g, '')
        const phoneRegex = /^\+[1-9]\d{7,14}$/
        if (!phoneRegex.test(cleanPhone)) {
          return cb(new Error('Enter a valid phone number (e.g., +2547xxxxxxxx)'))
        }
        
        cb()
      },
      trigger: ['blur', 'change']
    }
  ]
}

// vue-tel-input props
const telProps = {
  mode: 'international',
  autoDefaultCountry: 'KE',
  validCharactersOnly: true,
  inputOptions: {
    showDialCode: true,
    placeholder: 'e.g. +254712345678'
  },
  preferredCountries: ['KE', 'UG', 'TZ', 'RW', 'ET', 'US', 'GB', 'IN'],
  dropdownOptions: {
    showFlags: true,
    showCountryCode: true,
    searchable: true,
    showSearchBox: true,
    showDialCodeInSelection: false,
    searchPlaceholder: 'Search countries...'
  }
} as const

// Handle validate event from vue-tel-input
function onPhoneValidate(payload: any) {
  phoneIsValid.value = !!payload?.valid
  formData.phone_e164 = payload?.number || ''
  formData.country_name = payload?.countryCode || ''
  formData.country = payload?.countryCode || ''
  isKenya.value = payload?.country === 'KE' || payload?.countryCode === 'KE'

  if (phoneTouched.value) {
    formRef.value?.validateField('phone')
  }
}

// Handle country change event from vue-tel-input
function onCountryChanged(country: any) {
  const countryCode = country?.iso2 || ''
  formData.country_name = countryCode
  formData.country = countryCode
  isKenya.value = countryCode === 'KE'
}

// When country changes, default county_id appropriately
watch(isKenya, (isKe) => {
  if (!isKe) {
    formData.county_id = '0'
  } else if (formData.county_id === '0') {
    formData.county_id = ''
  }
})

const loginRegister = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      formData.email = formData.email.trim()
      formData.username = formData.username.trim()
      formData.name = formData.name.trim()
      formData.organization_name = formData.organization_name.trim()

      formData.role = ['public']
      formData.location_level = 'county'
      formData.location_id = formData.county_id
      formData.location_field = 'county_id'

      if (phoneIsValid.value && formData.phone_e164) {
        formData.phone = formData.phone_e164
      } else {
        formData.phone = formData.phone.trim().replace(/\s/g, '')
      }

      const payload: RegistrationFormData = { ...formData }
      await registerApi(payload as any)
      ElMessage.success('Registration successful')
      push({ name: 'Login' })
    } catch (e: any) {
      console.error('Registration error:', e)
      ElMessage.error(e?.message || 'Registration failed')
    } finally {
      loading.value = false
    }
  })
}

const toLogin = () => {
  push({ name: 'Login' })
}

const toPrivacy = () => {
  push({ name: 'Privacy' })
}
</script>

<template>
  <BaseLayout>
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <!-- Header -->
          <div class="auth-header">
            <h1 class="auth-title">Create an account</h1>
            <p class="auth-subtitle">Sign up to get started</p>
          </div>

          <!-- Form -->
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            class="auth-form"
            label-position="top"
            size="large"
            hide-required-asterisk
            @submit.prevent="loginRegister"
          >
            <div class="form-fields">
              <el-form-item prop="name" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">Full Name</span>
                </template>
                <el-input
                  v-model="formData.name"
                  placeholder="e.g. Jane Wanjiku"
                  class="auth-input"
                  autocomplete="name"
                  clearable
                />
              </el-form-item>

              <el-form-item prop="username" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">Username</span>
                </template>
                <el-input
                  v-model="formData.username"
                  placeholder="e.g. janewanjiku"
                  class="auth-input"
                  autocomplete="username"
                  clearable
                />
              </el-form-item>

              <el-form-item prop="email" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">Email</span>
                </template>
                <el-input
                  v-model="formData.email"
                  type="email"
                  placeholder="name@example.com"
                  class="auth-input"
                  autocomplete="email"
                  clearable
                />
              </el-form-item>

              <el-form-item prop="password" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">Password</span>
                </template>
                <InputPassword
                  v-model="formData.password"
                  :placeholder="t('login.passwordPlaceholder')"
                  class="auth-input"
                  autocomplete="new-password"
                />
              </el-form-item>

              <el-form-item prop="organization_name" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">Organization</span>
                </template>
                <el-input
                  v-model="formData.organization_name"
                  placeholder="e.g. Kenya Red Cross Society"
                  class="auth-input"
                  clearable
                />
              </el-form-item>

              <el-form-item prop="phone" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">Phone</span>
                </template>
                <VueTelInput
                  v-model="formData.phone"
                  v-bind="telProps"
                  @validate="onPhoneValidate"
                  @country-changed="onCountryChanged"
                  @input="phoneTouched = true"
                  @blur="phoneTouched = true"
                />
              </el-form-item>

              <el-form-item
                v-if="isKenya"
                prop="county_id"
                class="form-field-item"
                label-position="top"
              >
                <template #label>
                  <span class="form-label">County</span>
                </template>
                <el-select
                  v-model="formData.county_id"
                  filterable
                  :loading="loadingCounties"
                  placeholder="Select county"
                  class="auth-select"
                >
                  <el-option
                    v-for="opt in countiesOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item prop="access_reason" class="form-field-item" :class="{ 'form-field-full': !isKenya }" label-position="top">
                <template #label>
                  <span class="form-label">Reason for Access</span>
                </template>
                <el-select
                  v-model="formData.access_reason"
                  placeholder="Select reason"
                  class="auth-select"
                >
                  <el-option
                    v-for="opt in accessReasonOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item prop="data_use_description" class="form-field-item form-field-full" label-position="top">
                <template #label>
                  <span class="form-label">Proposed Use of Data</span>
                </template>
                <el-input
                  v-model="formData.data_use_description"
                  type="textarea"
                  :rows="3"
                  maxlength="150"
                  show-word-limit
                  placeholder="Briefly describe how you intend to use the data (min. 50 characters)"
                  class="auth-input"
                />
              </el-form-item>

              <el-form-item prop="agree_terms" class="form-field-item checkbox-item form-field-full">
                <el-checkbox v-model="formData.agree_terms">
                  <span class="checkbox-label">
                    I agree to the
                    <ElLink
                      :underline="false"
                      class="privacy-link"
                      @click="toPrivacy"
                    >
                      privacy policy
                    </ElLink>
                  </span>
                </el-checkbox>
              </el-form-item>
            </div>

            <div class="auth-actions">
              <ElButton
                type="primary"
                :loading="loading"
                class="auth-button"
                native-type="submit"
                block
              >
                <span v-if="!loading">{{ t('login.register') }}</span>
                <span v-else>Creating account...</span>
              </ElButton>

              <div class="auth-footer">
                <p class="footer-text">
                  Already have an account?
                  <ElLink
                    :underline="false"
                    class="footer-link"
                    @click="toLogin"
                  >
                    Sign in
                  </ElLink>
                </p>
              </div>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--bg-primary);
  position: relative;
}

.auth-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(0, 220, 130, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0, 184, 107, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.auth-container {
  width: 100%;
  max-width: 700px;
  position: relative;
  z-index: 1;
}

.auth-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 10px 40px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.auth-card:hover {
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 20px 60px rgba(0, 0, 0, 0.08);
}

/* Header */
.auth-header {
  text-align: center;
  margin-bottom: 1rem;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.125rem 0;
  letter-spacing: -0.01em;
}

.auth-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Form */
.auth-form {
  margin-bottom: 0;
  width: 100%;
}

.form-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}

.form-field-item {
  margin-bottom: 0 !important;
  width: 100%;
}

.form-field-full {
  grid-column: 1 / -1;
}

:deep(.form-field-item .el-form-item) {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

:deep(.form-field-item .el-form-item__content) {
  width: 100%;
  margin-left: 0 !important;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

:deep(.el-form-item__label) {
  padding: 0;
  margin-bottom: 0.25rem;
  line-height: 1.3;
  width: 100%;
  text-align: left;
}

:deep(.el-form-item.is-required .el-form-item__label::before) {
  display: none;
}

:deep(.el-form-item__error) {
  font-size: 0.75rem;
  margin-top: 0.25rem;
  padding-left: 0;
  line-height: 1.3;
  position: static;
  color: var(--el-color-error);
}

/* Input styling */
.auth-input {
  width: 100%;
}

:deep(.el-input) {
  width: 100%;
  font-size: 0.875rem;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 0 14px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--border-color);
  transition: all 0.15s ease;
  box-shadow: none;
  width: 100%;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--el-border-color-hover);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.08);
  background: transparent;
}

:deep(.el-input__inner) {
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.5;
  padding: 0;
}

:deep(.el-input__suffix) {
  right: 14px;
}

/* Select styling */
.auth-select {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  padding: 0 14px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--border-color);
  transition: all 0.15s ease;
  box-shadow: none;
}

:deep(.el-select .el-input__wrapper:hover) {
  border-color: var(--el-border-color-hover);
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.08);
  background: transparent;
}

/* Password Input */
:deep(.input-password) {
  width: 100%;
}

:deep(.input-password .el-input) {
  width: 100%;
  font-size: 0.875rem;
}

:deep(.input-password .el-input__wrapper) {
  border-radius: 8px;
  padding: 0 14px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--border-color);
  transition: all 0.15s ease;
  box-shadow: none;
  width: 100%;
}

:deep(.input-password .el-input__wrapper:hover) {
  border-color: var(--el-border-color-hover);
}

:deep(.input-password .el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.08);
  background: transparent;
}

:deep(.input-password .el-input__inner) {
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Textarea styling */
:deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 10px 14px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.5;
  transition: all 0.15s ease;
  box-shadow: none;
  resize: vertical;
}

:deep(.el-textarea__inner:hover) {
  border-color: var(--el-border-color-hover);
}

:deep(.el-textarea__inner:focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.08);
  outline: none;
}

.dark-mode :deep(.el-textarea__inner) {
  background: transparent !important;
}

/* vue-tel-input styling */
:deep(.vue-tel-input) {
  border-radius: 8px;
  border: 1px solid var(--border-color) !important;
  background: transparent !important;
  transition: all 0.15s ease;
  width: 100%;
  height: 40px;
}

:deep(.vue-tel-input:focus-within) {
  border-color: #00DC82 !important;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.08) !important;
}

:deep(.vue-tel-input .vti__dropdown) {
  border: none;
  background: transparent !important;
  border-right: 1px solid var(--border-color);
  border-radius: 8px 0 0 8px;
  height: 40px;
}

:deep(.vue-tel-input .vti__input) {
  border: none;
  background: transparent !important;
  border-radius: 0 8px 8px 0;
  padding: 0 14px;
  height: 40px;
  line-height: 40px;
  color: var(--text-primary);
  font-size: 0.875rem;
}

:deep(.vue-tel-input .vti__dropdown-list) {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background-color: var(--card-bg);
  z-index: 2000;
  margin-top: 4px;
}

:deep(.vue-tel-input .vti__dropdown-item) {
  padding: 12px 16px;
  cursor: pointer;
  background-color: var(--card-bg);
  transition: all 0.2s ease;
}

:deep(.vue-tel-input .vti__dropdown-item:hover) {
  background-color: var(--hover-bg);
}

:deep(.vue-tel-input .vti__dropdown-item.selected) {
  background-color: rgba(0, 220, 130, 0.1);
  color: #00DC82;
}

/* Checkbox styling */
.checkbox-item :deep(.el-form-item__content) {
  flex-direction: row;
  align-items: flex-start;
  margin-left: 0 !important;
}

.checkbox-item :deep(.el-form-item__error) {
  margin-left: 0;
}

:deep(.el-checkbox) {
  margin-top: 0;
  margin-bottom: 0;
  display: flex;
  align-items: flex-start;
}

:deep(.el-checkbox__input) {
  margin-top: 2px;
  flex-shrink: 0;
}

:deep(.el-checkbox__label) {
  color: var(--text-primary);
  font-size: 0.8125rem;
  line-height: 1.4;
  margin-left: 8px;
  padding-left: 0;
}

.checkbox-label {
  display: inline;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #00DC82;
  border-color: #00DC82;
}

:deep(.el-checkbox__inner) {
  border-radius: 4px;
  border-color: var(--border-color);
  width: 16px;
  height: 16px;
}

.privacy-link {
  color: #00DC82;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.privacy-link:hover {
  color: #00B86B;
  text-decoration: underline;
}

/* Actions */
.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

.auth-button {
  height: 40px;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%);
  border: none;
  transition: all 0.15s ease;
  width: 100%;
  margin-bottom: 0;
}

.auth-button:hover {
  background: linear-gradient(135deg, #00B86B 0%, #00A155 100%);
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.25);
}

.auth-button:active {
  transform: scale(0.98);
}

/* Footer */
.auth-footer {
  text-align: center;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.footer-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.footer-link {
  font-weight: 600;
  color: #00DC82;
  text-decoration: none;
  margin-left: 0.25rem;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #00B86B;
}

/* Responsive */
@media (max-width: 768px) {
  .auth-container {
    max-width: 420px;
  }

  .form-fields {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .auth-page {
    padding: 1rem;
  }

  .auth-card {
    padding: 1.25rem 1rem;
    border-radius: 16px;
  }

  .auth-title {
    font-size: 1.5rem;
  }
}

/* Dark mode */
.dark-mode .auth-card {
  background: transparent;
  box-shadow: none;
  border: 1px solid var(--border-color);
}

.dark-mode :deep(.el-input__wrapper) {
  background: transparent !important;
}

.dark-mode :deep(.input-password .el-input__wrapper) {
  background: transparent !important;
}

.dark-mode :deep(.el-input__wrapper.is-focus) {
  background: transparent !important;
}

.dark-mode :deep(.input-password .el-input__wrapper.is-focus) {
  background: transparent !important;
}

.dark-mode :deep(.el-select .el-input__wrapper) {
  background: transparent !important;
}

.dark-mode :deep(.vue-tel-input) {
  background: transparent !important;
}

.dark-mode :deep(.el-input__wrapper:not(.is-disabled)) {
  background: transparent !important;
}

.dark-mode :deep(.input-password .el-input__wrapper:not(.is-disabled)) {
  background: transparent !important;
}

.dark-mode :deep(.el-select .el-input__wrapper:not(.is-disabled)) {
  background: transparent !important;
}

.dark-mode :deep(.el-input__wrapper.is-disabled) {
  background: transparent !important;
}

.dark-mode :deep(.input-password) {
  background: transparent !important;
}

.dark-mode :deep(.input-password .el-input) {
  background: transparent !important;
}

.dark-mode :deep(.input-password .el-input__wrapper:hover) {
  background: transparent !important;
}

.dark-mode :deep(.input-password .el-input__wrapper.is-filled) {
  background: transparent !important;
}

.dark-mode :deep([class*="input-password"]) {
  background: transparent !important;
}

.dark-mode :deep([class*="input-password"] .el-input__wrapper) {
  background: transparent !important;
}

.dark-mode :deep([class*="input-password"] .el-input__wrapper.is-filled) {
  background: transparent !important;
}
</style>
