<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { ref, reactive } from 'vue'
import {
  ElButton, ElDialog,
  ElInput, ElForm, ElFormItem, ElPopconfirm, ElText, ElMessage, FormInstance, FormRules
} from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { checkUser, deleteAccount } from '@/api/users'
import { useRouter } from 'vue-router'
import BaseLayout from '@/views/Landing/BaseLayout.vue'

const { t } = useI18n()
const router = useRouter()

interface RuleForm {
  username: string
  phone: string
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<RuleForm>({
  username: '',
  phone: ''
})

const dialogVisible = ref(false)
const loading = ref(false)
const rules = reactive<FormRules<RuleForm>>({
  username: [{ required: true, message: 'Registered Username/Email', trigger: 'blur' }],
  phone: [{ required: true, message: 'Registered phone', trigger: 'blur' }]
})

const foundUser = ref()
const onSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      try {
        loading.value = true
        const res = await checkUser(ruleForm)
        foundUser.value = res.user
        dialogVisible.value = true
      } catch (error: any) {
        ElMessage.error(error?.message || 'User not found. Please check your credentials.')
      } finally {
        loading.value = false
      }
    }
  })
}

const otp = ref('')

const onDeleteAccount = async () => {
  try {
    loading.value = true
    const formData: any = {
      user_id: foundUser.value.id,
      otp: otp.value
    }
    await deleteAccount(formData)
    ElMessage.success('Account deleted successfully')
    dialogVisible.value = false
    router.push('/login')
  } catch (error: any) {
    ElMessage.error(error?.message || 'Failed to delete account. Please try again.')
  } finally {
    loading.value = false
  }
}

const onLogin = () => {
  router.push('/login')
}

const results = [
  { title: 'Permanent Data Removal', text: 'All your personal details, saved preferences, mapped and submitted data, activity history associated with the account will be erased from our systems. This data cannot be recovered once deletion is complete.' },
  { title: 'Access Termination', text: 'You will lose access to all features and services provided by the account, including access via the Slum Mapper app.' },
  { title: 'Irreversibility', text: 'The deletion process is irreversible. If you decide to use the system again in the future, you will need to create a new account and start fresh.' }
]
</script>

<template>
  <BaseLayout>
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <!-- Header -->
          <div class="auth-header">
            <h1 class="auth-title">{{ t('Delete Account') }}</h1>
            <p class="auth-subtitle">
              Deleting your account is a permanent action that removes your personal data, account information, and access to our services. Once the account is deleted, the following will happen:
            </p>
          </div>

          <!-- Warning List -->
          <div class="warning-list">
            <div v-for="(item, index) in results" :key="index" class="warning-item">
              <span class="warning-number">{{ index + 1 }}.</span>
              <div class="warning-content">
                <strong class="warning-title">{{ item.title }}</strong>
                <p class="warning-text">{{ item.text }}</p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="rules"
            class="auth-form"
            label-position="top"
            size="large"
            hide-required-asterisk
          >
            <div class="form-fields">
              <el-form-item prop="username" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">Username</span>
                </template>
                <el-input
                  v-model="ruleForm.username"
                  placeholder="Enter your registered username or email"
                  class="auth-input"
                  clearable
                />
              </el-form-item>

              <el-form-item prop="phone" class="form-field-item" label-position="top">
                <template #label>
                  <span class="form-label">Phone</span>
                </template>
                <el-input
                  v-model="ruleForm.phone"
                  placeholder="Enter your registered phone number"
                  class="auth-input"
                  clearable
                />
              </el-form-item>
            </div>

            <div class="auth-actions">
              <el-popconfirm
                confirm-button-text="Yes"
                cancel-button-text="No"
                :icon="InfoFilled"
                width="350px"
                icon-color="red"
                title="Are you sure you want to delete your account? This action cannot be undone."
                @confirm="onSubmit(ruleFormRef)"
              >
                <template #reference>
                  <ElButton
                    :loading="loading"
                    type="danger"
                    class="delete-button"
                    block
                  >
                    <span v-if="!loading">Delete Account</span>
                    <span v-else>Processing...</span>
                  </ElButton>
                </template>
              </el-popconfirm>

              <div class="auth-footer">
                <p class="footer-text">
                  Changed your mind?
                  <ElButton
                    :underline="false"
                    class="footer-link"
                    type="primary"
                    link
                    @click="onLogin"
                  >
                    Sign in
                  </ElButton>
                </p>
              </div>
            </div>
          </el-form>
        </div>
      </div>
    </div>

    <!-- OTP Dialog -->
    <el-dialog
      v-model="dialogVisible"
      title="Authentication"
      width="420px"
      :close-on-click-modal="false"
      class="otp-dialog"
    >
      <div class="dialog-content">
        <p class="dialog-description">
          Please enter the OTP code sent to your registered phone number.
        </p>
        
        <el-form label-position="top">
          <el-form-item label="OTP Code">
            <el-input
              v-model="otp"
              placeholder="Enter OTP code"
              class="auth-input"
              clearable
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false">
            Cancel
          </ElButton>
          <ElButton
            type="danger"
            :loading="loading"
            @click="onDeleteAccount"
            class="confirm-delete-button"
          >
            Confirm Delete
          </ElButton>
        </div>
      </template>
    </el-dialog>
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
  max-width: 500px;
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
  line-height: 1.6;
}

/* Warning List */
.warning-list {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
}

.warning-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.warning-item:last-child {
  margin-bottom: 0;
}

.warning-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ef4444;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.25rem;
}

.warning-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
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

/* Input styling */
.auth-input {
  width: 100%;
}

:deep(.el-input) {
  width: 100%;
  font-size: 0.9375rem;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 0 14px;
  height: 44px;
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
  font-size: 0.9375rem;
  line-height: 1.5;
  padding: 0;
}

:deep(.el-input__suffix) {
  right: 14px;
}

/* Actions */
.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

.delete-button {
  height: 44px;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.15s ease;
  width: 100%;
  margin-bottom: 0;
}

.delete-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.delete-button:active {
  transform: translateY(0);
}

/* Footer */
.auth-footer {
  text-align: center;
  padding-top: 1.25rem;
  margin-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.footer-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.footer-link {
  font-weight: 600;
  margin-left: 0.25rem;
  transition: color 0.2s;
}

/* OTP Dialog */
.otp-dialog :deep(.el-dialog__header) {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.otp-dialog :deep(.el-dialog__title) {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.otp-dialog :deep(.el-dialog__body) {
  padding: 1.5rem;
}

.dialog-content {
  width: 100%;
}

.dialog-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.otp-dialog :deep(.el-form-item) {
  margin-bottom: 0;
}

.otp-dialog :deep(.el-form-item__label) {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  padding: 0;
}

.otp-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 0 14px;
  height: 44px;
  background: transparent;
  border: 1px solid var(--border-color);
  transition: all 0.15s ease;
  box-shadow: none;
  width: 100%;
}

.otp-dialog :deep(.el-input__wrapper:hover) {
  border-color: var(--el-border-color-hover);
}

.otp-dialog :deep(.el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.08);
  background: transparent;
}

.otp-dialog :deep(.el-form-item__error) {
  font-size: 0.8125rem;
  margin-top: 0.5rem;
  padding-left: 0;
}

.otp-dialog .dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

.otp-dialog .dialog-footer .el-button {
  height: 40px;
  padding: 0 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.confirm-delete-button {
  background: #ef4444;
  border: none;
}

.confirm-delete-button:hover {
  background: #dc2626;
}

/* Responsive */
@media (max-width: 640px) {
  .auth-page {
    padding: 1rem;
  }

  .auth-card {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }

  .auth-title {
    font-size: 1.5rem;
  }

  .warning-list {
    padding: 1rem;
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

.dark-mode :deep(.el-input__wrapper:not(.is-disabled)) {
  background: transparent !important;
}

.dark-mode :deep(.el-input__wrapper.is-disabled) {
  background: transparent !important;
}

.dark-mode :deep(.el-input__wrapper.is-focus) {
  background: transparent !important;
}

.dark-mode .warning-list {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}
</style>
