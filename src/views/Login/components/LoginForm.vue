<script setup lang="ts">
import { reactive, ref, unref, watch } from 'vue'
import { Form } from '@/components/Form'
import { useI18n } from '@/hooks/web/useI18n'
import { ElButton, ElCheckbox, ElLink, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus'
import { useForm } from '@/hooks/web/useForm'
import { loginApi, getTestRoleApi, getAdminRoleApi } from '@/api/login'
import { useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { UserType } from '@/api/login/types'
import { useValidator } from '@/hooks/web/useValidator'
import { activateUserApi, updateUserApi, resetUserPassword } from '@/api/users'

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
  username: '',
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
    field: 'tool',
    colProps: {
      span: 24
    }
  },
  {
    field: 'login',
    colProps: {
      span: 24
    }
  },
  {
    field: 'other',
    component: 'Divider',
    label: t('login.otherLogin'),
    componentProps: {
      contentPosition: 'center'
    }
  },
  {
    field: 'otherIcon',
    colProps: {
      span: 24
    }
  }
])

const iconSize = 30

const remember = ref(false)

const { register, elFormRef, methods } = useForm()

const loading = ref(false)

const iconColor = '#999'

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
  const formRef = unref(elFormRef)
  await formRef?.validate(async (isValid) => {
    if (isValid) {
      loading.value = true
      const { getFormData } = methods
      const formData = await getFormData<UserType>()

      try {
        const res = await loginApi(formData)
        console.log('After Login', res)
        const selUserDetails = (({ name, roles,data }) => ({ name, roles,data  }))(res);
        if (selUserDetails) {
          wsCache.set(appStore.getUserInfo, selUserDetails)
          // 是否使用动态路由

          appStore.dynamicRouter = true    // felix to edit 
          console.log("Dynamic router--->", appStore.getDynamicRouter)
          if (appStore.getDynamicRouter) {


            getRole(res)
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
        loading.value = false
      }
    }
  })
}


const getRole = async (authenitcatedUser) => {

  const { getFormData } = methods
  const formData = await getFormData<UserType>()
  console.log('authenitcatedUser', authenitcatedUser)

// use the user details to set paths to see 
  if (authenitcatedUser.roles.includes("admin") ||authenitcatedUser.roles.includes("kisip_staff")    ) {
    formData.role = 'admin'
  } else if (authenitcatedUser.roles.includes("county_admin")) {
    formData.role = 'admin'
  } else {
    formData.role = 'test'

  }

 

  const params = {
    // roleName: formData.username
    roleName:  formData.role
  }
  // admin - 模拟后端过滤菜单
  // test - 模拟前端过滤菜单
  formData.permissions = ['*.*.*']
 
 // const color = d.y >= 70 ? "green" : (d.y < 50 ? "red" : "yellow");


  const res =formData.role === 'admin' ? await getAdminRoleApi(params) : await getTestRoleApi(params)
  if (res) {
    const { wsCache } = useCache()
    const routers = res.data || []
    wsCache.set('roleRouters', routers)
    console.log("  formData.role >>", formData.role)


    formData.role === 'admin'
      ? await permissionStore.generateRoutes('admin', routers).catch(() => { })
      : await permissionStore.generateRoutes('test', routers).catch(() => { })

    permissionStore.getAddRouters.forEach((route) => {
      addRoute(route as RouteRecordRaw) // 动态添加可访问路由表
    })
    permissionStore.setIsAddRouters(true)
    push({ path: redirect.value || permissionStore.addRouters[0].path })
  }
}


const toRegister = () => {
  emit('to-register')
}

const reset = () => {
  resetUserPassword(form)
}
</script>

<template>
  <Form :schema="schema" :rules="rules" label-position="top" hide-required-asterisk size="large"
    class="dark:(border-1 border-[var(--el-border-color)] border-solid)" @register="register">
    <template #title>
      <h2 class="text-2xl font-bold text-center w-[100%]">{{ t('login.login') }}</h2>
    </template>

    <template #tool>
      <div class="flex justify-between items-center w-[100%]">
        <ElCheckbox v-model="remember" :label="t('login.remember')" size="small" />
        <ElLink type="primary" @click="dialogFormVisible = true" :underline="false">{{ t('Forgot Password') }}</ElLink>
      </div>
    </template>

    <template #login>
      <div class="w-[100%]">
        <ElButton :loading="loading" type="primary" class="w-[100%]" @click="signIn">
          {{ t('login.login') }}
        </ElButton>
      </div>
      <div class="w-[100%] mt-15px">
        <ElButton class="w-[100%]" @click="toRegister">
          {{ t('login.register') }}
        </ElButton>
      </div>
    </template>

    <template #otherIcon>
      <div class="flex justify-between w-[100%]">
        <Icon icon="ant-design:github-filled" :size="iconSize" class="cursor-pointer anticon" :color="iconColor" />
        <Icon icon="ant-design:wechat-filled" :size="iconSize" class="cursor-pointer anticon" :color="iconColor" />
        <Icon icon="ant-design:alipay-circle-filled" :size="iconSize" :color="iconColor"
          class="cursor-pointer anticon" />
        <Icon icon="ant-design:weibo-circle-filled" :size="iconSize" :color="iconColor"
          class="cursor-pointer anticon" />
      </div>
    </template>
  </Form>

  <el-dialog v-model="dialogFormVisible" title="Please enter the username used during registration">
    <el-form :model="form">


      <el-form-item label="Username" :label-width="formLabelWidth">
        <el-input v-model="form.username" autocomplete="off" />
      </el-form-item>

    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogFormVisible = false">Cancel</el-button>
        <el-button type="primary" @click="reset">
          Reset
        </el-button>
      </span>
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
</style>