<script setup lang="ts">
import { Form } from '@/components/Form'
import { reactive, ref, unref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useForm } from '@/hooks/web/useForm'
import { ElButton, ElInput, FormRules } from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { UserType } from '@/api/register/types'
import { registerApi } from '@/api/register'
import { getCountyListApi } from '@/api/counties'
import { CountyType } from '@/api/counties/types'

interface Params {
  pageIndex?: number
  pageSize?: number
}
const emit = defineEmits(['to-login'])

const { register, elFormRef, methods } = useForm()

const { t } = useI18n()
const countiesOptions = []

let tableDataList = ref<CountyType[]>([])

const getTableList = async (params?: Params) => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 5,
      curUser: 1, // Id for logged in user
      model: 'county',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var cnty = response.data

    loading.value = false

    cnty.forEach(function (arrayItem) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      //  console.log(countyOpt)
      countiesOptions.push(countyOpt)
    })
  })
}
getTableList()
console.log('tableDataList:', countiesOptions)

const { required } = useValidator()
const RoleOptions = [
  {
    value: 'county_staff',
    label: 'County Staff'
  },
  {
    value: 'kisip_staff',
    label: 'KISIP/SUD staff'
  },
  {
    value: 'partner_staff',
    label: 'Partner staff (WB, AfDB)'
  },
  {
    value: 'consultant',
    label: 'Consultant staff'
  },
  {
    value: 'public',
    label: 'Public/Other'
  }
]

const schema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: {
      span: 24
    }
  },
  {
    field: 'name',
    label: t('Name'),
    value: '',
    component: 'Input',
    colProps: {
      span: 24
    },
    componentProps: {
      placeholder: t('Name')
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
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'check_password',
    label: t('login.checkPassword'),
    value: '',
    component: 'InputPassword',
    colProps: {
      span: 24
    },
    componentProps: {
      style: {
        width: '100%'
      },
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },

  {
    field: 'role',
    label: t('Role'),
    component: 'Select',
    colProps: {
      span: 24
    },
    componentProps: {
      multiple:true,
      options: RoleOptions,
      style: {
        width: '100%'
      },
      slots: {
        suffix: true,
        prefix: true
      }
    }
  },
  {
    field: 'county_id',
    label: t('County'),
    component: 'Select',
    colProps: {
      span: 24
    },
    componentProps: {
      options: countiesOptions,
      style: {
        width: '100%'
      },
      slots: {
        suffix: true,
        prefix: true
      }
    }
  },

  {
    field: 'register',
    colProps: {
      span: 24
    }
  }
])

const rules: FormRules = {
  username: [required()],
  password: [required()],
  check_password: [required()],
  count_id: [required()]
}

const toLogin = () => {
  emit('to-login')
}

const loading = ref(false)

const loginRegister = async () => {
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
        formData.email = formData.username.trim()
        formData.username = formData.username.trim()
       // formData.role = [formData.role]   // convert the user roles to an array

        const res = await registerApi(formData)
        console.log('After Registre', res)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <Form
    :schema="schema"
    :rules="rules"
    label-position="side"
    hide-required-asterisk
    size="large"
    class="dark:(border-1 border-[var(--el-border-color)] border-solid)"
    @register="register"
  >
    <template #title>
      <h2 class="text-2xl font-bold text-center w-[100%]">{{ t('login.register') }}</h2>
    </template>

    <template #register>
      <div class="w-[100%]">
        <ElButton type="primary" class="w-[100%]" :loading="loading" @click="loginRegister">
          {{ t('login.register') }}
        </ElButton>
      </div>
      <div class="w-[100%] mt-15px">
        <ElButton class="w-[100%]" @click="toLogin">
          {{ t('login.hasUser') }}
        </ElButton>
      </div>
    </template>
  </Form>
</template>
