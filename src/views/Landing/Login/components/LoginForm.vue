<script setup lang="ts">
import { reactive, ref, unref, watch } from 'vue'
import { Form } from '@/components/Form'
import { useI18n } from '@/hooks/web/useI18n'
import { ElButton, ElLink,  ElDialog, ElForm, ElFormItem, ElInput,FormInstance,ElMessage, ElTooltip,ElCard } from 'element-plus'
import { useForm } from '@/hooks/web/useForm'
import { loginApi } from '@/api/login'
import { useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { UserType } from '@/api/login/types'
import { useValidator } from '@/hooks/web/useValidator'
import { resetUserPassword,setUserFeedback, getUserPermissions } from '@/api/users'
import { uuid } from 'vue-uuid'
import { Icon } from '@iconify/vue';



const { required } = useValidator()
 
const emit = defineEmits(['to-register'])

const appStore = useAppStore()

const permissionStore = usePermissionStore()

const { currentRoute, addRoute, push } = useRouter()

const { wsCache } = useCache()

const { t } = useI18n()

const rules = {
  username: [required()],
  password: [required()]
}

const dialogFormVisible = ref(false)
const formLabelWidth = '140px'

const form = reactive({
  email: '',
})


const toPrivacy= () => {
  push({
         name: 'Privacy'
    })
}

const feedback = reactive({
  name: '',
  email: '',
  message: '',
  phone: '',
  code:''
})


const schema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: {
      span: 24
    }
  },
  {
    field: 'username',
    label: t('login.username'),
    value: '',
    component: 'Input',
    colProps: {
      span: 24
    },
    componentProps: {
      placeholder: t('login.usernamePlaceholder')
    }
  },
  {
    field: 'password',
    label: t('login.password'),
    value: '',
    component: 'InputPassword',
    colProps: {
      span: 24
    },
    componentProps: {
      style: {
        width: '100%'
      },
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'login',
    colProps: {
      span: 24
    }
  },
  {
    field: 'tool',
    colProps: {
      span: 24
    }
  },
])

const dialogFeedback = ref()
const { register, elFormRef, methods } = useForm()

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
  const formRef = unref(elFormRef)
  await formRef?.validate(async (isValid) => {
    if (isValid) {
      loginLoading.value = true
      const { getFormData } = methods
      const formData = await getFormData<UserType>()
      try {
        const res = await loginApi(formData)
        console.log('After Login', res)
        const selUserDetails = (({ id, name, roles, data, county_id, avatar, phone, photo }) => ({ id, name, roles, data, county_id ,avatar, phone,  photo}))(res);
        if (selUserDetails) {
          wsCache.set(appStore.getUserInfo, selUserDetails)
          // 是否使用动态路由
          const userDeatilsAfterLogin = wsCache.get(appStore.getUserInfo)

          console.log("----userDeatilsAfterLogin----", userDeatilsAfterLogin)

        
          if (appStore.getDynamicRouter) {


             getRole(userDeatilsAfterLogin)

             
          } else {
            //getRole() // temp 
            await permissionStore.generateRoutes('none').catch(() => { })
            permissionStore.getAddRouters.forEach((route) => {
              addRoute(route as RouteRecordRaw) // 动态添加可访问路由表
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
 
 

const getRole = async (authenticatedUser) => {
  const { getFormData } = methods;
  const formData = await getFormData<UserType>();
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
    // Step 1: Update the schema values
    const usernameField = schema.find(item => item.field === 'username');
    const passwordField = schema.find(item => item.field === 'password');
    
    if (usernameField && passwordField) {
      usernameField.value = 'guest';
      passwordField.value = 'Guest@123';
      
      // Disable the input fields
      if (usernameField.componentProps) {
        usernameField.componentProps.disabled = true;
      }
      if (passwordField.componentProps) {
        passwordField.componentProps.disabled = true;
      }
    }

    // Step 2: Update the form model directly
    const { getFormData } = methods;
    const formData = await getFormData<UserType>();
    formData.username = 'guest';
    formData.password = 'Guest@123';

    // Step 3: Submit using the existing signIn function which will handle routing
    await signIn();
  } finally {
    guestLoading.value = false;
  }
};

const toRegister = () => {
  emit('to-register')
}

const reset = () => {
  resetUserPassword(form)
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
  <el-card class="login-card">
    <Form
      :schema="schema"
      :rules="rules"
      label-position="top"
      hide-required-asterisk
      size="large"
      class="border-solid"
      @register="register"
    >
      <template #title>
        <h2 class="text-2xl font-bold text-center w-[100%]">{{ t('login.login') }}</h2>
      </template>

      <template #login>
        <div class="w-[100%] flex gap-2">
          <ElButton :loading="loginLoading" type="primary" class="flex-1" @click="signIn">
            {{ t('login.login') }}
          </ElButton>
          <ElButton :loading="guestLoading" type="info" class="flex-1" @click="guestLogin">
            Login as Guest
          </ElButton>
        </div>
        <div class="w-[100%] mt-15px">
          <ElButton class="w-[100%]" @click="toRegister">
            {{ t('login.register') }}
          </ElButton>
        </div>
      </template>

      <template #tool>
        <div class="flex justify-between items-center w-[100%]">
          <div>
            <ElLink @click="dialogFormVisible = true" :underline="false" class="text-sm text-gray-600 hover:text-primary">
              {{ t('Forgot Password') }}
            </ElLink>
          </div>
          
          <div class="flex items-center gap-2">
            <el-tooltip content="Send us feedback or report an issue" placement="top">
              <el-button 
                type="info" 
                size="small"
                class="feedback-btn"
                @click="dialogFeedback = true"
              >
                <Icon icon="fluent:person-feedback-32-regular" class="mr-1" />
                Feedback
              </el-button>
            </el-tooltip>

            <el-tooltip content="View our privacy policy and data protection information" placement="top">
              <el-button 
                type="info" 
                size="small"
                class="privacy-btn"
                @click="toPrivacy"
              >
                <Icon icon="material-symbols:privacy-tip-outline" class="mr-1" />
                Privacy
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>
    </Form>
  </el-card>

  <el-dialog
    title="Please Enter your Email"
    v-model="dialogFormVisible"
    width="25%"
    :center="true"
  >
    <el-form :model="form">
      <el-row>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Email" prop="email">
            <el-input v-model="form.email"/>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div style="text-align: center">
      <el-button @click="dialogFormVisible = false">Cancel</el-button>
      <el-button type="primary" @click="reset">Submit</el-button>
    </div>
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
:deep(.anticon) {
  &:hover {
    color: var(--el-color-primary) !important;
  }
}
</style>

<style scoped>
.el-button--text {
  margin-right: 15px;
}

.el-select {
  width: 300px;
}

.el-input {
  width: 300px;
}

.dialog-footer button:first-child {
  margin-right: 10px;
}

.feedback-btn,
.privacy-btn {
  transition: all 0.3s ease;
  border-radius: 6px;
  font-size: 12px;
  padding: 6px 12px;
}

.feedback-btn:hover,
.privacy-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feedback-dialog .el-dialog__body {
  padding: 20px 24px;
}

.feedback-dialog .el-form-item {
  margin-bottom: 16px;
}

.feedback-dialog .el-form-item__label {
  font-weight: 500;
  color: #333;
}

.feedback-dialog .el-input__inner,
.feedback-dialog .el-textarea__inner {
  border-radius: 6px;
}

.feedback-dialog .el-textarea__inner {
  resize: vertical;
  min-height: 80px;
}

/* Login card background styling */
.login-card {
  background: transparent !important;
  border: 1px solid var(--el-border-color);
  box-shadow: none;
}

/* Input field styling */
:deep(.el-input__wrapper) {
  background: transparent !important;
  border: 1px solid var(--el-border-color);
  box-shadow: none !important;
}

:deep(.el-input__wrapper:hover) {
  background: transparent !important;
  border-color: var(--el-border-color-hover);
}

:deep(.el-input__wrapper.is-focus) {
  background: transparent !important;
  border-color: var(--el-color-primary);
  box-shadow: none !important;
}
</style>