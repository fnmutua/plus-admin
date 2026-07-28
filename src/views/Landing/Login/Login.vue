<script setup lang="ts">
import { computed, reactive, ref, unref, watch } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { ElButton, ElForm, ElFormItem, ElInput, ElTabs, ElTabPane, FormInstance, ElMessage, ElMessageBox, ElLink, ElDialog } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import { loginApi, guestLoginApi } from '@/api/login'
import { useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { UserType } from '@/api/login/types'
import { useValidator } from '@/hooks/web/useValidator'
import { getUserPermissions, resetUserPassword } from '@/api/users'
import { validateKenyanPhone } from '@/utils/phoneValidation'
import BaseLayout from './../BaseLayout.vue'
import { finishLoginNavigation } from '@/utils/bootstrapNavigation'

const { required } = useValidator()
const appStore = useAppStore()
const permissionStore = usePermissionStore()
const { currentRoute, addRoute, push } = useRouter()
const { wsCache } = useCache()
const { t } = useI18n()

const loginFormRef = ref<FormInstance>()
const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [required()],
  password: [required()]
}

const loginLoading = ref(false)
const guestLoading = ref(false)
const redirect = ref<string>('')

const forgotPasswordDialog = ref(false)
const resetPasswordTab = ref<'email' | 'phone'>('email')
const resetPasswordForm = reactive({
  email: '',
  phone: ''
})
const resetPasswordFormRef = ref<FormInstance>()
const resetPasswordLoading = ref(false)

const resetPasswordRules = computed(() => ({
  email: [
    { required: true, message: 'Please enter your email address', trigger: 'blur' },
    { type: 'email' as const, message: 'Please enter a valid email address', trigger: ['blur', 'change'] }
  ],
  phone: [
    { required: true, message: 'Please enter your phone number', trigger: 'blur' },
    {
        validator: (_: unknown, value: string, callback: (err?: Error) => void) => {
          if (!value) return callback()
          let normalized = value.replace(/[\s\-\(\)\.]/g, '')
          if (normalized.startsWith('254')) normalized = '+' + normalized
          else if (normalized.startsWith('0')) normalized = '+254' + normalized.slice(1)
          else if (normalized.startsWith('7') && normalized.length === 9) normalized = '+254' + normalized
          const result = validateKenyanPhone(normalized)
        if (!result.isValid) {
          callback(new Error(result.error || 'Invalid phone number'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'change']
    }
  ]
}))

const handleForgotPassword = async () => {
  const formRef = unref(resetPasswordFormRef)
  const field = resetPasswordTab.value
  const val = (field === 'email' ? resetPasswordForm.email : resetPasswordForm.phone || '').trim()
  if (!val) {
    ElMessage.warning(`Please enter your ${field === 'email' ? 'email address' : 'phone number'}`)
    return
  }
  try {
    await formRef?.validateField(field)
  } catch {
    return
  }
  resetPasswordLoading.value = true
  try {
    const payload = field === 'email' ? { email: val } : { phone: val }
    const response = await resetUserPassword(payload as any)
    const message = response?.data?.message || response?.message || 'Password reset instructions have been sent.'
    ElMessage.success(message)
    forgotPasswordDialog.value = false
    resetPasswordForm.email = ''
    resetPasswordForm.phone = ''
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || 'Failed to send reset instructions. Please try again.')
  } finally {
    resetPasswordLoading.value = false
  }
}

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)

const getRole = async (authenticatedUser: any, formData: UserType) => {
  console.log('authenticatedUser roles', authenticatedUser)
  const { wsCache } = useCache()

  try {
    const permissionsRes = await getUserPermissions(authenticatedUser.id)
    if (permissionsRes.data && Array.isArray(permissionsRes.data)) {
      ;(formData as any).permissions = permissionsRes.data
      const updatedUserInfo = { ...authenticatedUser, permissions: permissionsRes.data }
      wsCache.set(appStore.getUserInfo, updatedUserInfo)
    } else {
      ;(formData as any).permissions = ['*.*.*']
      const updatedUserInfo = { ...authenticatedUser, permissions: ['*.*.*'] }
      wsCache.set(appStore.getUserInfo, updatedUserInfo)
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    ;(formData as any).permissions = ['*.*.*']
    const updatedUserInfo = { ...authenticatedUser, permissions: ['*.*.*'] }
    wsCache.set(appStore.getUserInfo, updatedUserInfo)
  }

  if (finishLoginNavigation(redirect.value || '/dashboard/national')) return

  const roleHierarchy = {
    'super_admin': 1,
    'admin': 2,
    'grm': 2,
    'staff': 3,
    'consultant': 4,
    'public': 5
  }

  let highestRole = 'public'
  let highestLevel = 'settlement'

  authenticatedUser.roles.forEach((roleObj: any) => {
    const roleName = roleObj.name
    const roleLevel = roleObj.user_roles.location_level
    if (roleHierarchy[roleName] < roleHierarchy[highestRole]) {
      highestRole = roleName
      highestLevel = roleLevel
    }
  })

  switch (highestRole) {
    case 'root_admin':
      appStore.setAdminButtons(true)
      appStore.setEditButtons(true)
      appStore.setAdmin(true)
      break
    case 'super_admin':
      appStore.setAdminButtons(true)
      appStore.setEditButtons(true)
      appStore.setAdmin(true)
      break
    case 'admin':
      appStore.setAdminButtons(true)
      appStore.setEditButtons(true)
      break
    case 'staff':
      appStore.setAdminButtons(true)
      appStore.setEditButtons(true)
      break
    case 'consultant':
      appStore.setAdminButtons(true)
      appStore.setEditButtons(true)
      break
  }

  ;(formData as any).role = highestRole
  ;(formData as any).level = highestLevel

  // Update admin flag after precise role determination
  const isAdmin = ['root_admin', 'super_admin', 'admin'].includes(highestRole)
  try { localStorage.setItem('kesmis_is_admin', isAdmin ? '1' : '0') } catch {}
  console.log('[Login] kesmis_is_admin set to', isAdmin ? '1' : '0', 'for role', highestRole)

  let routers: RouteRecordRaw[] = []
  const cachedUser = wsCache.get(appStore.getUserInfo)
  const userPermissions: string[] = Array.isArray(cachedUser?.permissions) ? cachedUser.permissions : []
  await permissionStore.generateRoutes((formData as any).role, (formData as any).level, userPermissions).catch(() => {})
  routers = [...new Set(permissionStore.getAddRouters.map(route => route as RouteRecordRaw))]

  wsCache.set('roleRouters', routers)

  routers.forEach((route) => {
    addRoute(route)
  })

  permissionStore.setIsAddRouters(true)
  if (highestRole === 'public') {
    push({ path: '/dashboard/national' })
    return
  }
  push({ path: redirect.value || routers[0].path })
}

const signIn = async () => {
  ;(appStore as any).dynamicRouter = true
  const formRef = unref(loginFormRef)
  await formRef?.validate(async (isValid) => {
    if (isValid) {
      loginLoading.value = true
      const formData = {
        username: loginForm.username,
        password: loginForm.password
      } as any
      try {
        const res: any = await loginApi(formData)
        const selUserDetails = (({ id, name, roles, data, county_id, avatar, phone, photo }) => 
          ({ id, name, roles, data, county_id, avatar, phone, photo }))(res)
        if (selUserDetails) {
          wsCache.set(appStore.getUserInfo, selUserDetails)
          const userDeatilsAfterLogin = wsCache.get(appStore.getUserInfo)

          // Set admin flag in localStorage for cross-tab access (e.g. docs page)
          const userRoles = Array.isArray(selUserDetails.roles) ? selUserDetails.roles : []
          const hasAdminRole = userRoles.some((r: any) => ['root_admin', 'super_admin', 'admin'].includes(r?.name))
          try { localStorage.setItem('kesmis_is_admin', hasAdminRole ? '1' : '0') } catch {}

          if (appStore.getDynamicRouter) {
            getRole(userDeatilsAfterLogin, formData)
          } else {
            if (finishLoginNavigation(redirect.value || '/dashboard/national')) return
            await permissionStore.generateRoutes('none', 'settlement').catch(() => { })
            permissionStore.getAddRouters.forEach((route) => {
              addRoute(route as RouteRecordRaw)
            })
            permissionStore.setIsAddRouters(true)
            push({ path: redirect.value || permissionStore.addRouters[0].path })
          }
        }
      } catch (error: any) {
        const code = error?.response?.data?.code
        const msg = error?.response?.data?.message
        const devices = error?.response?.data?.activeDevices
        if (code === 'DEVICE_LIMIT_REACHED') {
          const deviceList = Array.isArray(devices) && devices.length
            ? devices.map((d: any) =>
                `${d.deviceLabel || 'Device'}${d.ipAddress ? ` (${d.ipAddress})` : ''}`
              ).join('<br/>')
            : ''
          await ElMessageBox.alert(
            deviceList
              ? `${msg}<br/><br/><strong>Active sessions:</strong><br/>${deviceList}`
              : (msg || 'Too many active devices. Sign out elsewhere first.'),
            'Device limit reached',
            { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: 'OK' }
          )
        } else {
          ElMessage.error(msg || error?.message || 'Login failed. Please check your credentials.')
        }
      } finally {
        loginLoading.value = false
      }
    }
  })
}

const guestLogin = async () => {
  guestLoading.value = true
  try {
    const res: any = await guestLoginApi()
    const selUserDetails = (({ id, name, roles, data, county_id, avatar, phone, photo }) =>
      ({ id, name, roles, data, county_id, avatar, phone, photo }))(res)
    if (selUserDetails) {
      // Use permissions embedded in the guest response — no separate getUserPermissions call needed
      const guestPermissions: string[] = Array.isArray(res.permissions) ? res.permissions : []
      wsCache.set(appStore.getUserInfo, { ...selUserDetails, permissions: guestPermissions })

      try { localStorage.setItem('kesmis_is_admin', '0') } catch {}
      appStore.setAdminButtons(false)
      appStore.setEditButtons(false)

      await permissionStore.generateRoutes('public', 'national', guestPermissions).catch(() => {})
      permissionStore.getAddRouters.forEach((route) => {
        addRoute(route as RouteRecordRaw)
      })
      permissionStore.setIsAddRouters(true)
      push({ path: '/dashboard/national' })
    }
  } catch (error: any) {
    ElMessage.error(error?.message || 'Guest access is unavailable. Please try again later.')
  } finally {
    guestLoading.value = false
  }
}

const toRegister = () => {
  push({ name: 'Register' })
}
</script>

<template>
      <BaseLayout>
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <!-- Header -->
          <div class="auth-header">
            <h1 class="auth-title">Welcome back</h1>
            <p class="auth-subtitle">Sign in to your account to continue</p>
          </div>

          <!-- Form -->
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="rules"
            class="auth-form"
            label-position="top"
            size="large"
            hide-required-asterisk
            @submit.prevent="signIn"
          >
            <div class="form-fields">
              <el-form-item prop="username" class="form-field-item">
                <template #label>
                  <span class="form-label">Username, Email, or Phone</span>
                </template>
              <el-input
                v-model="loginForm.username"
                placeholder="Enter your username, email, or phone number"
                class="auth-input"
                autocomplete="username"
                clearable
              />
              </el-form-item>

              <el-form-item prop="password" class="form-field-item">
                <template #label>
                  <div class="form-label-row">
                    <span class="form-label">{{ t('login.password') }}</span>
                    <ElLink 
                      :underline="false" 
                      class="forgot-link"
                      @click="forgotPasswordDialog = true"
                    >
                      Forgot password?
                    </ElLink>
        </div>
                </template>
                <InputPassword
                  v-model="loginForm.password"
                  :placeholder="t('login.passwordPlaceholder')"
                  class="auth-input"
                  autocomplete="current-password"
                />
              </el-form-item>
           </div>

            <div class="auth-actions">
              <ElButton
                type="primary"
                :loading="loginLoading"
                class="auth-button"
                native-type="submit"
                block
              >
                <span v-if="!loginLoading">Sign in</span>
                <span v-else>Signing in...</span>
              </ElButton>

              <div class="divider">
                <span>or</span>
          </div>

              <ElButton
                :loading="guestLoading"
                class="guest-button"
                @click="guestLogin"
                block
              >
                Continue as Guest
              </ElButton>
            </div>
          </el-form>

          <!-- Footer -->
          <div class="auth-footer">
            <p class="footer-text">
              Don't have an account?
              <ElLink 
                :underline="false" 
                class="footer-link"
                @click="toRegister"
              >
                Sign up
              </ElLink>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Forgot Password Dialog -->
    <el-dialog
      v-model="forgotPasswordDialog"
      title="Reset Password"
      width="420px"
      :close-on-click-modal="false"
      class="forgot-password-dialog"
      @closed="resetPasswordForm.email = ''; resetPasswordForm.phone = ''"
    >
      <div class="dialog-content">
        <p class="dialog-description">
          Enter your email or phone number and we'll send you instructions to reset your password.
        </p>

        <el-form
          ref="resetPasswordFormRef"
          :model="resetPasswordForm"
          :rules="resetPasswordRules"
          label-position="top"
          @submit.prevent="handleForgotPassword"
        >
          <el-tabs v-model="resetPasswordTab" class="reset-tabs">
            <el-tab-pane label="Email" name="email">
              <el-form-item   prop="email">
                <el-input
                  v-model="resetPasswordForm.email"
                  type="email"
                  placeholder="e.g. user@example.com"
                  class="auth-input"
                  autocomplete="email"
                  clearable
                />
              </el-form-item>
            </el-tab-pane>
            <el-tab-pane label="Phone" name="phone">
              <el-form-item   prop="phone">
                <el-input
                  v-model="resetPasswordForm.phone"
                  placeholder="+254712345678, 0712345678, or 712345678"
                  class="auth-input"
                  autocomplete="tel"
                  clearable
                />
              </el-form-item>
            </el-tab-pane>
          </el-tabs>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="forgotPasswordDialog = false">
            Cancel
          </ElButton>
          <ElButton
            type="primary"
            :loading="resetPasswordLoading"
            @click="handleForgotPassword"
            class="auth-button"
          >
            Send Reset Link
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
  max-width: 420px;
  position: relative;
  z-index: 1;
}

.auth-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem;
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
  margin-bottom: 1.25rem;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
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
  gap: 0.875rem;
  margin-bottom: 0;
}

.form-field-item {
  margin-bottom: 0 !important;
  width: 100%;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.375rem;
  line-height: 1.4;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 0.375rem;
}

.forgot-link {
  font-size: 0.8125rem;
  color: #00DC82;
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
  white-space: nowrap;
}

.forgot-link:hover {
  color: #00B86B;
}

:deep(.el-form-item) {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

:deep(.el-form-item__label) {
  padding: 0;
  margin-bottom: 0.375rem;
  line-height: 1.4;
  width: 100%;
  text-align: left;
}

:deep(.el-form-item.is-required .el-form-item__label::before) {
  display: none;
}

:deep(.el-form-item__content) {
  width: 100%;
  margin-left: 0 !important;
}

:deep(.el-form-item__error) {
  font-size: 0.75rem;
  margin-top: 0.375rem;
  padding-left: 0;
  line-height: 1.4;
  position: static;
}

/* Modern Input Fields */
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

/* Password Input */
:deep(.input-password) {
  width: 100%;
}

:deep(.input-password .el-input) {
  width: 100%;
  font-size: 0.9375rem;
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
  font-size: 0.9375rem;
  line-height: 1.5;
}

/* Actions */
.auth-actions {
  margin-top: 1rem;
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

.divider {
  display: flex;
  align-items: center;
  margin: 0.75rem 0;
  text-align: center;
  width: 100%;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.divider span {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.guest-button {
  height: 40px;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  transition: all 0.15s ease;
  width: 100%;
  margin-top: 0;
}

.guest-button:hover {
  background: var(--bg-secondary);
  border-color: #00DC82;
  color: #00DC82;
}

.guest-button:active {
  transform: translateY(0);
}

/* Footer */
.auth-footer {
  text-align: center;
  padding-top: 1rem;
  margin-top: 1rem;
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
@media (max-width: 640px) {
  .auth-page {
    padding: 1rem;
  }

  .auth-card {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
  }

  .auth-title {
    font-size: 1.5rem;
  }
}

/* Forgot Password Dialog */
.forgot-password-dialog :deep(.el-dialog__header) {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.forgot-password-dialog :deep(.el-dialog__title) {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.forgot-password-dialog :deep(.el-dialog__body) {
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

.forgot-password-dialog .reset-tabs :deep(.el-tabs__content) {
  padding: 0;
}
.forgot-password-dialog .reset-tabs :deep(.el-tabs__header) {
  margin-bottom: 1rem;
}

.forgot-password-dialog :deep(.el-form-item) {
  margin-bottom: 0;
}

.forgot-password-dialog :deep(.el-form-item__label) {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  padding: 0;
}

.forgot-password-dialog :deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 0 14px;
  height: 44px;
  background: transparent;
  border: 1px solid var(--border-color);
  transition: all 0.15s ease;
  box-shadow: none;
  width: 100%;
}

.forgot-password-dialog :deep(.el-input__wrapper:hover) {
  border-color: var(--el-border-color-hover);
}

.forgot-password-dialog :deep(.el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.08);
  background: transparent;
}

.forgot-password-dialog :deep(.el-form-item__error) {
  font-size: 0.8125rem;
  margin-top: 0.5rem;
  padding-left: 0;
}

.forgot-password-dialog .dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

.forgot-password-dialog .dialog-footer .el-button {
  height: 40px;
  padding: 0 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.forgot-password-dialog .dialog-footer .auth-button {
  background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%);
  border: none;
}

.forgot-password-dialog .dialog-footer .auth-button:hover {
  background: linear-gradient(135deg, #00B86B 0%, #00A155 100%);
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

.dark-mode :deep([class*="input-password"] .el-input) {
  background: transparent !important;
}

.dark-mode :deep([class*="input-password"] .el-input__wrapper.is-filled) {
  background: transparent !important;
}
</style>
