<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElButton, ElCard, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElCheckbox, ElSwitch, ElRow, ElCol, ElMessage } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { InputPassword } from '@/components/InputPassword'
import { registerApi, getCountyAuth } from '@/api/register'
import { VueTelInput } from 'vue-tel-input' // local registration
import 'vue-tel-input/vue-tel-input.css'

interface CountyOption {
  value: string | number
  label: string
}

interface RegistrationFormData {
  name: string
  username: string
  email: string
  password: string
  county_id: string | number
  phone: string            // raw value in the input
  phone_e164?: string      // normalized (E.164) from vue-tel-input validation
  agree_terms: boolean
  role?: string[]
  location_level?: string
  location_id?: string | number
  location_field?: string
}

const emit = defineEmits(['to-login'])
const { t } = useI18n()

const formRef = ref<InstanceType<typeof ElForm> | null>(null)
const loading = ref(false)

const countiesOptions = ref<CountyOption[]>([])

const formData = ref<RegistrationFormData>({
  name: '',
  username: '',
  email: '',
  password: '',
  county_id: '',
  phone: '',
  phone_e164: '',
  agree_terms: false
})

// vue-tel-input validation state
const phoneIsValid = ref(false)

// Fetch counties
const getTableList = async () => {
  try {
    loading.value = true
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
    loading.value = false
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
  county_id: [{ required: true, message: 'County is required', trigger: 'change' }],
  agree_terms: [
    {
      validator: (_: any, value: boolean, cb: any) => {
        if (value !== true) return cb(new Error('You must agree to the terms of the Privacy Policy'))
        cb()
      },
      trigger: 'change'
    }
  ],
  // Phone validation - use vue-tel-input validation with fallback
  phone: [
    { required: true, message: 'Phone number is required', trigger: ['blur', 'change'] },
    {
      validator: (_: any, value: string, cb: any) => {
        // First check if vue-tel-input validation passed
        if (phoneIsValid.value) {
          return cb()
        }
        
        // Fallback validation if vue-tel-input validation failed
        if (!value || value.trim() === '') {
          return cb(new Error('Phone number is required'))
        }
        
        // Basic international format check (starts with + and has digits, spaces allowed)
        const cleanPhone = value.trim().replace(/\s/g, '') // Remove all spaces
        const phoneRegex = /^\+[1-9]\d{1,14}$/
        if (!phoneRegex.test(cleanPhone)) {
          return cb(new Error('Enter a valid international phone number (e.g., +254721770339)'))
        }
        
        cb()
      },
      trigger: ['blur', 'change']
    }
  ]
}

// vue-tel-input props
const telProps = {
  mode: 'international',                 // always show international format
  autoDefaultCountry: 'KE',              // default to Kenya
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
     showDialCodeInSelection:false,                // Enable country search
    searchPlaceholder: 'Search countries...'  // Custom search placeholder
  }
} as const

// Handle validate event from vue-tel-input
function onPhoneValidate(payload: any) {
  console.log('Phone validation payload:', payload)
  // payload example: { number: { input: '+2547...', international: '+254 7...', e164: '+2547...' }, isValid: true, country: {...} }
  phoneIsValid.value = !!payload?.isValid
  formData.value.phone_e164 = payload?.number?.e164 || ''
  console.log('Phone validation state:', phoneIsValid.value, 'E164:', formData.value.phone_e164)
}

const loginRegister = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      // Trim basic strings
      formData.value.email = formData.value.email.trim()
      formData.value.username = formData.value.username.trim()
      formData.value.name = formData.value.name.trim()

      // Initial roles & location metadata
      formData.value.role = ['public']
      formData.value.location_level = 'county'
      formData.value.location_id = formData.value.county_id
      formData.value.location_field = 'county_id'

      // Use E.164 format from vue-tel-input if available and valid
      if (phoneIsValid.value && formData.value.phone_e164) {
        formData.value.phone = formData.value.phone_e164
      } else {
        // Fallback to cleaned raw value (remove spaces)
        formData.value.phone = formData.value.phone.trim().replace(/\s/g, '')
      }

      const payload: RegistrationFormData = { ...formData.value }
      const res = await registerApi(payload as any)
      console.log('After Register:', res)
      ElMessage.success('Registration successful')
    } catch (e) {
      console.error('Registration error:', e)
      ElMessage.error('Registration failed')
    } finally {
      loading.value = false
    }
  })
}

const toLogin = () => emit('to-login')
</script>

<template>
  <el-card class="register-card">
                   <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="left"
        hide-required-asterisk
        class="register-form dark:(border-1 border-[var(--el-border-color)] border-solid) mb-5"
      >
      <h2 class="text-2xl font-bold text-center w-[100%] mb-6">{{ t('login.register') }}</h2>

      <el-form-item label="Full Name" prop="name">
        <el-input v-model="formData.name" placeholder="e.g. Jane Wanjiku" />
      </el-form-item>

      <el-form-item label="Username" prop="username">
        <el-input v-model="formData.username" placeholder="e.g. janewanjiku" />
      </el-form-item>

      <el-form-item label="Email" prop="email">
        <el-input v-model="formData.email" type="email" placeholder="name@example.com" />
      </el-form-item>

      <el-form-item label="Password" prop="password">
        <InputPassword v-model="formData.password" />
      </el-form-item>

      <el-form-item label="County" prop="county_id">
        <el-select v-model="formData.county_id" filterable placeholder="Select county" style="width: 100%">
          <el-option
            v-for="opt in countiesOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Phone" prop="phone">
        <!-- vue-tel-input handles flags, dial code & validation -->
        <VueTelInput
          v-model="formData.phone"
          v-bind="telProps"
          @validate="onPhoneValidate"
        />
      </el-form-item>

            <el-form-item prop="agree_terms">
        <template #label>
          <span>
            Agree to terms of the 
            <a 
              href="/privacy-policy" 
              target="_blank" 
              class="text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              privacy policy
            </a>
          </span>
        </template>
        <el-checkbox v-model="formData.agree_terms" />
        <template #error="{ error }">
          <div class="el-form-item__error">{{ error }}</div>
        </template>
      </el-form-item>
 
      <div class="w-[100%]">
        <el-button type="primary" class="w-[100%]" :loading="loading" @click="loginRegister">
          {{ t('login.register') }}
        </el-button>
      </div>
      <div class="w-[100%] mt-2">
        <el-button class="w-[100%]" @click="toLogin">
          {{ t('login.hasUser') }}
        </el-button>
      </div>
    </el-form>
  </el-card>
</template>

<style scoped>
/* Card sizing and layout */
.register-card {
  min-width: 480px;
  max-width: 600px;
  margin: 0 auto;
}

.register-form {
  padding: 20px 0;
}

.el-form-item {
  margin-bottom: 24px;
}

.el-form-item:last-child {
  margin-bottom: 0;
}

/* Form label styling */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* Input styling */
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

/* Error message styling - make errors more visible */
:deep(.el-form-item__error) {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  position: static;
  margin-top: 4px;
  margin-left: 0;
  text-align: left;
  padding-left: 0;
}

/* Custom styling for vue-tel-input to match Element Plus theme */
:deep(.vue-tel-input) {
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  transition: border-color 0.2s;
  width: 100%;
}

:deep(.vue-tel-input:focus-within) {
  border-color: var(--el-color-primary);
}

:deep(.vue-tel-input .vti__dropdown) {
  border: none;
  background: transparent;
  border-right: 1px solid var(--el-border-color);
  border-radius: 4px 0 0 4px;
}

:deep(.vue-tel-input .vti__input) {
  border: none;
  background: transparent;
  border-radius: 0 4px 4px 0;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
}

:deep(.vue-tel-input .vti__dropdown-list) {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.vue-tel-input .vti__dropdown-item) {
  padding: 8px 12px;
  cursor: pointer;
}

:deep(.vue-tel-input .vti__dropdown-item:hover) {
  background-color: var(--el-fill-color-light);
}

:deep(.vue-tel-input .vti__dropdown-item.selected) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* Button styling */
:deep(.el-button) {
  height: 40px;
  font-weight: 500;
}

/* Checkbox styling */
:deep(.el-checkbox) {
  margin-top: 0;
}

:deep(.el-checkbox__label) {
  color: transparent;
}

/* Country option styles for custom country renders */
.country-option {
  display: flex;
  align-items: center;
  gap: 8px;
}
.flag { font-size: 1.2em; }
.country-name { flex: 1; }
.dial-code { color: var(--el-text-color-secondary); }

/* Responsive adjustments */
@media (max-width: 768px) {
  .register-card {
    min-width: 100%;
    margin: 0 16px;
  }
  
  .register-form {
    padding: 16px 0;
  }
}
</style>
