<script setup lang="ts">
import { computed, reactive, ref, unref, watch } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { ElButton, ElLink, ElDialog, ElForm, ElFormItem, ElInput, ElTabs, ElTabPane, FormInstance, ElMessage, ElTooltip } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import { loginApi } from '@/api/login'
import { useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { UserType } from '@/api/login/types'
import { useValidator } from '@/hooks/web/useValidator'
import { resetUserPassword, setUserFeedback, getUserPermissions } from '@/api/users'
import { validateKenyanPhone } from '@/utils/phoneValidation'
import { uuid } from 'vue-uuid'
import { Icon } from '@iconify/vue';

const { required } = useValidator()
 
const emit = defineEmits(['to-register'])

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

const dialogFormVisible = ref(false)
const resetPasswordLoading = ref(false)
const resetPasswordTab = ref<'email' | 'phone'>('email')
const resetPasswordFormRef = ref<FormInstance>()
const resetPasswordForm = reactive({
  email: '',
  phone: ''
})

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

const toPrivacy = () => {
  push({
    name: 'Privacy'
  })
}

const feedback = reactive({
  name: '',
  email: '',
  message: '',
  phone: '',
  code: ''
})

const dialogFeedback = ref()

const loginLoading = ref(false)
const guestLoading = ref(false)
const feedbackLoading = ref(false)

const redirect = ref<string>('')

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)

// 登录
const signIn = async () => {
  appStore.dynamicRouter = true
  const formRef = unref(loginFormRef)
  await formRef?.validate(async (isValid) => {
    if (isValid) {
      loginLoading.value = true
      const formData: UserType = {
        username: loginForm.username,
        password: loginForm.password
      } as UserType
      try {
        const res = await loginApi(formData)
        console.log('After Login', res)
        const selUserDetails = (({ id, name, roles, data, county_id, avatar, phone, photo }) => ({ id, name, roles, data, county_id, avatar, phone, photo }))(res);
        if (selUserDetails) {
          wsCache.set(appStore.getUserInfo, selUserDetails)
          const userDeatilsAfterLogin = wsCache.get(appStore.getUserInfo)

          // Set admin flag in localStorage for cross-tab access (e.g. docs page)
          const userRoles = Array.isArray(selUserDetails.roles) ? selUserDetails.roles : []
          const roleNames = userRoles.map((r: any) => r?.name)
          const hasAdminRole = roleNames.some((n: string) => ['root_admin', 'super_admin', 'admin'].includes(n))
          console.log('[Login] Setting kesmis_is_admin flag. roleNames:', roleNames, 'hasAdminRole:', hasAdminRole)
          try {
            localStorage.setItem('kesmis_is_admin', hasAdminRole ? '1' : '0')
            console.log('[Login] kesmis_is_admin saved:', localStorage.getItem('kesmis_is_admin'))
          } catch (e) {
            console.error('[Login] Failed to save kesmis_is_admin:', e)
          }

          console.log("----userDeatilsAfterLogin----", userDeatilsAfterLogin)

          if (appStore.getDynamicRouter) {
            getRole(userDeatilsAfterLogin, formData)
          } else {
            await permissionStore.generateRoutes('none').catch(() => { })
            permissionStore.getAddRouters.forEach((route) => {
              addRoute(route as RouteRecordRaw)
            })
            permissionStore.setIsAddRouters(true)
            push({ path: redirect.value || permissionStore.addRouters[0].path })
          }
        }
      } finally {
        loginLoading.value = false
      }
    }
  })
}
 
 

const getRole = async (authenticatedUser: any, formData: UserType) => {
  console.log('authenticatedUser roles', authenticatedUser);

  // Get wsCache at the top of the function
  const { wsCache } = useCache();

  // Fetch user permissions from backend
  try {
    const permissionsRes = await getUserPermissions(authenticatedUser.id);
    if (permissionsRes.data && Array.isArray(permissionsRes.data)) {
      formData.permissions = permissionsRes.data;
      // Update cached user info with permissions
      const updatedUserInfo = { ...authenticatedUser, permissions: permissionsRes.data };
      wsCache.set(appStore.getUserInfo, updatedUserInfo);
      console.log('User permissions fetched and stored:', permissionsRes.data);
    } else {
      // Fallback to default permissions if API fails
      formData.permissions = ['*.*.*'];
      const updatedUserInfo = { ...authenticatedUser, permissions: ['*.*.*'] };
      wsCache.set(appStore.getUserInfo, updatedUserInfo);
      console.log('Using fallback permissions');
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    // Fallback to default permissions if API fails
    formData.permissions = ['*.*.*'];
    const updatedUserInfo = { ...authenticatedUser, permissions: ['*.*.*'] };
    wsCache.set(appStore.getUserInfo, updatedUserInfo);
    console.log('Using fallback permissions due to error');
  }

  // Define the role hierarchy (lower index means higher priority)
  const roleHierarchy = {
    'super_admin': 1,
    'admin': 2,
    'grm': 2,
    'staff': 3,
    'consultant': 4,
    'public': 5 // Default or fallback role
  };

  // Initialize variables to track the highest role and its level
  let highestRole = 'public';
  let highestLevel = 'settlement';

  // Process each role to find the highest one based on the hierarchy
  authenticatedUser.roles.forEach((roleObj) => {

    console.log('roleObj >>',roleObj)
    const roleName = roleObj.name;
    const roleLevel = roleObj.user_roles.location_level;

    if (roleHierarchy[roleName] < roleHierarchy[highestRole]) {
      highestRole = roleName;
      highestLevel = roleLevel;
    }

   



  });

  switch (highestRole) {

    case 'root_admin':
        appStore.setAdminButtons(true);
        appStore.setEditButtons(true);
        appStore.setAdmin(true);
        console.log('root_admin role processed');

        break;



      case 'super_admin':
        appStore.setAdminButtons(true);
        appStore.setEditButtons(true);
        appStore.setAdmin(true);
        console.log('super_admin role processed');

        break;

      case 'admin':
        appStore.setAdminButtons(true);
        appStore.setEditButtons(true);
        console.log('admin role processed');

        break;

      case 'staff':
        appStore.setAdminButtons(true);
        appStore.setEditButtons(true);
        console.log("is user getEditButtons?--->", appStore.getEditButtons);
        console.log('Staff role processed');
        break;

      case 'consultant':
        appStore.setAdminButtons(true);
        appStore.setEditButtons(true);
        console.log('Consultant role processed');
        break;

      default:
        break;
    }

  // Expose admin flag to localStorage for cross-tab use (e.g. docs page)
  const isAdminRole = ['root_admin', 'super_admin', 'admin'].includes(highestRole)
  try { localStorage.setItem('kesmis_is_admin', isAdminRole ? '1' : '0') } catch {}

  // Assign the highest role and level to the formData
  formData.role = highestRole;
  formData.level = highestLevel;

  console.log('<<>>', highestRole,highestLevel,appStore.getAdminButtons)

  // Generate and collect routes based on the highest role and level
  let routers = [];
  await permissionStore.generateRoutes(formData.role, formData.level).catch(() => {});
  routers = [...new Set(permissionStore.getAddRouters.map(route => route as RouteRecordRaw))];

  // Cache the role's routers (wsCache already declared at top)
  wsCache.set('roleRouters', routers);

  console.log("formData.role >>", formData.role);
 
  // Dynamically add accessible routes
  routers.forEach((route) => {
    addRoute(route);
  });

  permissionStore.setIsAddRouters(true);
  // Redirect guest/public users to /dashboard/national
  if (highestRole === 'public') {
    push({ path: '/dashboard/national' });
    return;
  }
  push({ path: redirect.value || routers[0].path });
};

// Add guest login function
const guestLogin = async () => {
  guestLoading.value = true;
  try {
    loginForm.username = 'guest';
    loginForm.password = 'Guest@123';
    await signIn();
  } finally {
    guestLoading.value = false;
  }
};

// toRegister is handled by parent component via emit

const reset = async () => {
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
    await resetUserPassword(payload as any)
    ElMessage.success('Password reset instructions have been sent. Check your email and/or phone.')
    dialogFormVisible.value = false
    resetPasswordForm.email = ''
    resetPasswordForm.phone = ''
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || 'Failed to send reset instructions. Please try again.')
  } finally {
    resetPasswordLoading.value = false
  }
}



 

const ruleFormRef = ref<FormInstance>()

const sendFeedback = async (formEl: FormInstance | undefined) => {
  feedback.code = uuid.v4()
  if (!formEl) return
  
  feedbackLoading.value = true
  try {
    await formEl.validate(async (valid, fields) => {
      if (valid) {
        try {
          await setUserFeedback(feedback)
          ElMessage.success('Thank you for your feedback! We\'ll get back to you soon.')
          dialogFeedback.value = false
          // Reset form
          feedback.name = ''
          feedback.email = ''
          feedback.message = ''
          feedback.phone = ''
          feedback.code = ''
        } catch (error) {
          console.error('Error sending feedback:', error)
          ElMessage.error('Failed to send feedback. Please try again later.')
        }
      } else {
        console.log('Form validation failed.')
        ElMessage.error('Please fill in all required fields correctly.')
      }
    })
  } finally {
    feedbackLoading.value = false
  }
}

const feedbackRules = {
  name: [
    { required: true, message: 'Please enter your name', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email' as const, message: 'Please enter a valid email address', trigger: ['blur', 'change'] }
  ],
  message: [
    { required: true, message: 'Please enter a message', trigger: 'blur' }
  ]
}
 







</script>

<template>
  <div class="login-form-container">
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="rules"
      label-position="top"
      hide-required-asterisk
      size="large"
      class="login-form"
    >
      <el-form-item :label="t('login.username')" prop="username">
        <el-input
          v-model="loginForm.username"
          :placeholder="t('login.usernamePlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('login.password')" prop="password">
        <InputPassword
          v-model="loginForm.password"
          :placeholder="t('login.passwordPlaceholder')"
        />
      </el-form-item>

      <div class="button-group">
        <ElButton 
          :loading="loginLoading" 
          type="primary" 
          class="primary-button"
          @click="signIn"
        >
          <Icon icon="mdi:login" class="button-icon" />
          {{ t('login.login') }}
        </ElButton>
        <ElButton 
          :loading="guestLoading" 
          class="guest-button"
          @click="guestLogin"
        >
          <Icon icon="mdi:account-outline" class="button-icon" />
          Continue as Guest
        </ElButton>
      </div>

      <div class="form-footer">
        <ElLink 
          @click="dialogFormVisible = true" 
          :underline="false" 
          class="forgot-password-link"
        >
          <Icon icon="mdi:lock-reset" class="link-icon" />
          {{ t('Forgot Password') }}
        </ElLink>
        
        <div class="footer-actions">
          <el-tooltip content="Send us feedback or report an issue" placement="top">
            <button 
              class="action-button"
              @click="dialogFeedback = true"
            >
              <Icon icon="fluent:person-feedback-32-regular" />
            </button>
          </el-tooltip>

          <el-tooltip content="View our privacy policy" placement="top">
            <button 
              class="action-button"
              @click="toPrivacy"
            >
              <Icon icon="material-symbols:privacy-tip-outline" />
            </button>
          </el-tooltip>
        </div>
      </div>
    </el-form>
  </div>

  <el-dialog
    title="Reset Password"
    v-model="dialogFormVisible"
    width="400px"
    :center="true"
    @closed="resetPasswordForm.email = ''; resetPasswordForm.phone = ''"
  >
    <el-form ref="resetPasswordFormRef" :model="resetPasswordForm" :rules="resetPasswordRules" label-position="top">
      <el-tabs v-model="resetPasswordTab" class="reset-tabs">
        <el-tab-pane label="Email" name="email">
          <el-form-item label="Email address" prop="email">
            <el-input
              v-model="resetPasswordForm.email"
              type="email"
              placeholder="e.g. user@example.com"
              clearable
            />
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane label="Phone" name="phone">
          <el-form-item label="Phone number" prop="phone">
            <el-input
              v-model="resetPasswordForm.phone"
              placeholder="+254712345678, 0712345678, or 712345678"
              clearable
            />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>
    <template #footer>
      <el-button @click="dialogFormVisible = false">Cancel</el-button>
      <el-button type="primary" :loading="resetPasswordLoading" @click="reset">Submit</el-button>
    </template>
  </el-dialog>

  <el-dialog
    title="Send Feedback"
    v-model="dialogFeedback"
    width="400px"
    :center="true"
    class="feedback-dialog"
  >
    <div class="mb-4 text-sm text-gray-600">
      We'd love to hear from you! Send us your feedback, suggestions, or report any issues you've encountered.
    </div>
    
    <el-form :model="feedback" :rules="feedbackRules" ref="ruleFormRef" label-position="top"> 
      <el-form-item label="Your Name" prop="name">
        <el-input v-model="feedback.name" placeholder="Enter your full name"/>
      </el-form-item>
      
      <el-form-item label="Email Address" prop="email">
        <el-input v-model="feedback.email" placeholder="Enter your email address"/>
      </el-form-item>
      
      <el-form-item label="Message" prop="message">
        <el-input 
          v-model="feedback.message" 
          type="textarea" 
          :rows="4"
          placeholder="Tell us about your experience, suggestions, or any issues you've encountered..."
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogFeedback = false">Cancel</el-button>
        <el-button type="primary" @click="sendFeedback(ruleFormRef)" :loading="feedbackLoading">
          Send Feedback
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.reset-tabs :deep(.el-tabs__content) {
  padding: 0;
}
.reset-tabs :deep(.el-tabs__header) {
  margin-bottom: 1rem;
}

.login-form-container {
  width: 100%;
}

.login-form {
  width: 100%;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.primary-button {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%) !important;
  border: none !important;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.primary-button:hover {
  background: linear-gradient(135deg, #00B86B 0%, #00A155 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 220, 130, 0.3);
}

.guest-button {
  width: 100%;
  height: 48px;
  font-size: 0.9375rem;
  font-weight: 500;
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.guest-button:hover {
  background: var(--hover-bg) !important;
  border-color: #00DC82 !important;
  color: #00DC82 !important;
  transform: translateY(-2px);
}

.button-icon {
  font-size: 1.125rem;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.forgot-password-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  text-decoration: none;
}

.forgot-password-link:hover {
  color: #00DC82;
}

.link-icon {
  font-size: 1rem;
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  padding: 0;
}

.action-button:hover {
  background: var(--hover-bg);
  border-color: #00DC82;
  color: #00DC82;
  transform: translateY(-2px);
}

.action-button .iconify {
  font-size: 1.125rem;
}

/* Input field styling */
:deep(.el-input__wrapper) {
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: none !important;
  border-radius: 12px;
  padding: 0 16px;
  height: 48px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--el-border-color-hover) !important;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #00DC82 !important;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.1) !important;
}

:deep(.el-input__inner) {
  color: var(--text-primary);
  font-size: 0.9375rem;
}

:deep(.el-form-item) {
  margin-bottom: 1rem;
}

:deep(.el-form-item__label) {
  padding-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

:deep(.el-form-item__error) {
  color: var(--el-color-danger);
  font-size: 0.8125rem;
  margin-top: 0.5rem;
}

/* Password input styling */
:deep(.el-input-password__wrapper) {
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: none !important;
  border-radius: 12px;
  padding: 0 16px;
  height: 48px;
  transition: all 0.3s ease;
}

:deep(.el-input-password__wrapper:hover) {
  border-color: var(--el-border-color-hover) !important;
}

:deep(.el-input-password__wrapper.is-focus) {
  border-color: #00DC82 !important;
  box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.1) !important;
}

/* Dialog styling */
.dialog-footer button:first-child {
  margin-right: 10px;
}

.feedback-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.feedback-dialog :deep(.el-form-item) {
  margin-bottom: 16px;
}

.feedback-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-primary);
}

.feedback-dialog :deep(.el-input__inner),
.feedback-dialog :deep(.el-textarea__inner) {
  border-radius: 8px;
}

.feedback-dialog :deep(.el-textarea__inner) {
  resize: vertical;
  min-height: 80px;
}

/* Responsive */
@media (max-width: 640px) {
  .form-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .footer-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

/* Dark mode */
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