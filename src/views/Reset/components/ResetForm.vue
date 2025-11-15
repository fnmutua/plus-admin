<script setup lang="ts">
import { reactive, ref, unref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { ElButton, ElForm, ElFormItem, FormInstance, ElMessage, ElLink } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import { useRouter, useRoute } from 'vue-router'
import { updateUserPass } from '@/api/users'
import BaseLayout from '@/views/Landing/BaseLayout.vue'

const route = useRoute()
const { push } = useRouter()
const { t } = useI18n()

const resetFormRef = ref<FormInstance>()
const resetForm = reactive({
  password: '',
  rptpassword: ''
})

const loading = ref(false)

const passwordValidator = async (_rule: any, value: string) => {
  if (!value || value.trim() === '') {
    return Promise.reject('Please enter the password.')
  }

  if (value.length < 8 || value.length > 20) {
    return Promise.reject('The password must be between 8 and 20 characters long.')
  }

  // Updated regex to allow ALL special characters
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]+$/

  if (!passwordRegex.test(value)) {
    return Promise.reject('Required: at least one uppercase letter, one lowercase letter, one digit, and one special character.')
  }

  return Promise.resolve()
}

const passwordMatchValidator = async (_rule: any, value: string) => {
  if (value !== resetForm.password) {
    return Promise.reject('Passwords do not match.')
  }
  return Promise.resolve()
}

const rules = {
  password: [{ validator: passwordValidator, trigger: 'blur' }] as any,
  rptpassword: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    { validator: passwordMatchValidator, trigger: 'blur' }
  ] as any
}

const goToLogin = () => {
  push({
    path: '/login'
  })
}

const reset = async () => {
  const formRef = unref(resetFormRef)
  await formRef?.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        const formData: any = {
          password: resetForm.password.trim(),
          token: route.params.token[0]
        }

        await updateUserPass(formData as any)
        ElMessage.success('Password updated successfully')
            push({
          path: '/login'
        })
      } catch (error: any) {
        ElMessage.error(error?.message || 'Failed to update password. Please try again.')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <BaseLayout>
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <!-- Header -->
          <div class="auth-header">
            <h1 class="auth-title">{{ t('Reset Password') }}</h1>
            <p class="auth-subtitle">Enter your new password below</p>
          </div>

          <!-- Form -->
          <el-form
            ref="resetFormRef"
            :model="resetForm"
            :rules="rules"
            class="auth-form"
            label-position="top"
            size="large"
            hide-required-asterisk
            @submit.prevent="reset"
          >
            <div class="form-fields">
              <el-form-item prop="password" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">{{ t('New Password') }}</span>
    </template>
                <InputPassword
                  v-model="resetForm.password"
                  :placeholder="t('login.passwordPlaceholder')"
                  class="auth-input"
                  autocomplete="new-password"
                />
              </el-form-item>

              <el-form-item prop="rptpassword" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">{{ t('Repeat New Password') }}</span>
                </template>
                <InputPassword
                  v-model="resetForm.rptpassword"
                  placeholder="Confirm your password"
                  class="auth-input"
                  autocomplete="new-password"
                />
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
                <span v-if="!loading">{{ t('Update') }}</span>
                <span v-else>Updating...</span>
              </ElButton>

              <div class="auth-footer">
                <p class="footer-text">
                  Remember your password?
                  <ElLink 
                    :underline="false" 
                    class="footer-link"
                    @click="goToLogin"
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
  max-width: 420px;
  position: relative;
  z-index: 1;
}

.auth-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2.5rem;
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
  text-align: left;
  margin-bottom: 1.75rem;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.01em;
}

.auth-subtitle {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Form */
.auth-form {
  margin-bottom: 0;
  width: 100%;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.form-field-item {
  margin-bottom: 0 !important;
  width: 100%;
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
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

/* Input styling */
:deep(.auth-input) {
  width: 100%;
}

:deep(.auth-input .el-input__wrapper) {
  border-radius: 8px;
  padding: 0 14px;
  height: 44px;
  background: transparent;
  border: 1px solid var(--border-color);
  transition: all 0.15s ease;
  box-shadow: none;
  width: 100%;
}

:deep(.auth-input .el-input__wrapper:hover) {
  border-color: var(--el-border-color-hover);
}

:deep(.auth-input .el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.08);
  background: transparent;
}

:deep(.auth-input input) {
  font-size: 0.9375rem;
  color: var(--text-primary);
}

:deep(.auth-input input::placeholder) {
  color: var(--text-tertiary);
}

:deep(.el-form-item__label) {
  padding: 0;
  margin-bottom: 0.5rem;
  line-height: 1.4;
  width: 100%;
  text-align: left;
}

:deep(.el-form-item.is-required .el-form-item__label::before) {
  display: none;
}

:deep(.el-form-item__error) {
  font-size: 0.8125rem;
  margin-top: 0.5rem;
  padding-left: 0;
  line-height: 1.4;
  position: static;
  color: var(--el-color-error);
}

/* Actions */
.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-button {
  height: 44px;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%);
  border: none;
  transition: all 0.2s ease;
}

.auth-button:hover {
  background: linear-gradient(135deg, #00B86B 0%, #00A155 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.3);
}

.auth-button:active {
  transform: translateY(0);
}

/* Footer */
.auth-footer {
  text-align: center;
  margin-top: 1rem;
}

.footer-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.footer-link {
  color: #00DC82;
  font-weight: 500;
  margin-left: 0.25rem;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #00B86B;
}

/* Responsive */
@media (max-width: 640px) {
  .auth-card {
    padding: 2rem 1.5rem;
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

.dark-mode :deep(.el-input__wrapper:not(.is-disabled)) {
  background: transparent !important;
}

.dark-mode :deep(.input-password .el-input__wrapper:not(.is-disabled)) {
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
