<script setup lang="ts">
import { reactive, ref, unref, watch } from 'vue'
import { Form } from '@/components/Form'
import { useI18n } from '@/hooks/web/useI18n'
import { ElButton } from 'element-plus'
import { useForm } from '@/hooks/web/useForm'

import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { UserType } from '@/api/login/types'
import { useValidator } from '@/hooks/web/useValidator'
import { updateUserPass } from '@/api/users'
import { useRoute } from 'vue-router'
import type { FormInstance } from 'element-plus'

const { required } = useValidator()
const route = useRoute()

const emit = defineEmits(['to-register'])

const appStore = useAppStore()

const permissionStore = usePermissionStore()

const { currentRoute, addRoute, push } = useRouter()


const { t } = useI18n()
const ruleFormRef = ref<FormInstance>()



const rules = {
  username: [required()],
  password: [required()],
  rptpassword: [required()],

}




console.log('Rules-->', rules)

const schema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: {
      span: 24
    }
  },
  {
    field: 'password',
    label: t('New Password'),
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
    field: 'rptpassword',
    label: t('Repeat New Password'),
    value: '',
    component: 'InputPassword',
    colProps: {
      span: 24
    },
    componentProps: {
      style: {
        width: '100%'
      },
      placeholder: t('Confirm Password')
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

])


const { register, elFormRef, methods } = useForm()

const loading = ref(false)


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



const goToLogin = () => {
  push({
    path: '/login',
    name: 'Login'
  })

}
const reset = () => {

  const formRef = unref(elFormRef)
  formRef?.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        //  toLogin()
        const { getFormData } = methods
        const formData = await getFormData<UserType>()

        console.log("Formdata------>", formData)
        console.log('ValidForm', formData)
        formData.password = formData.password.trim()
        // formData.role = [formData.role]   // convert the user roles to an array
        formData.token = route.params.token[0]

        await updateUserPass(formData)
          .then((response) => {
            console.log(response);
            // expected output: "Success!"
            push({
              path: '/login',
              name: 'Login'
            })
          })
          .catch(() => {
            push({
              path: '/login',
              name: 'Login'
            })
          })
      } finally {
        loading.value = false
      }
    }
  })


}
</script>

<template>
  <Form :schema="schema" :rules="rules" label-position="top" hide-required-asterisk size="large"
    class="dark:(border-1 border-[var(--el-border-color)] border-solid)" @register="register">
    <template #title>
      <h2 class="text-2xl font-bold text-center w-[100%]">{{ t('Reset Password') }}</h2>
    </template>



    <template #login>
      <div class="w-[100%]  mb-5">
        <ElButton :loading="loading" type="primary" class="w-[100%]" @click="reset">
          {{ t('Update') }}
        </ElButton>
      </div>
      <div class="w-[100%]">
        <ElButton :loading="loading" type="link" class="w-[100%]" @click="goToLogin">
          {{ t('Login') }}
        </ElButton>
      </div>


    </template>


  </Form>

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