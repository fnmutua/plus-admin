<script setup lang="ts">
import { Form } from '@/components/Form'
import { reactive, ref, unref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useForm } from '@/hooks/web/useForm'
import { ElButton, ElInput, FormInstance, FormRules } from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { UserType } from '@/api/register/types'
import { registerApi, getCountyAuth } from '@/api/register'
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
const ruleFormRef = ref<FormInstance>()


const getTableList = async (params?: Params) => {

  const formData = {}
  formData.model = 'county'


  const res = await getCountyAuth({}).then((response) => {
    console.log('List of counties:', response)
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

    // Add one option for non county persons 

    var national = {}
    national.value = "0"
    national.label = 'Not Applicable'
    countiesOptions.push(national)
    // sort by value
    countiesOptions.sort(function (a, b) {
      return a.value - b.value;
    });

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
    label: t('email'),
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
  // {
  //   field: 'check_password',
  //   label: t('login.checkPassword'),
  //   value: '',
  //   component: 'InputPassword',
  //   colProps: {
  //     span: 24
  //   },
  //   componentProps: {
  //     style: {
  //       width: '100%'
  //     },
  //     strength: true,
  //     placeholder: t('login.passwordPlaceholder')
  //   }
  // },

  // {
  //   field: 'role',
  //   label: t('Role'),
  //   component: 'Select',
  //   colProps: {
  //     span: 24
  //   },
  //   componentProps: {
  //     multiple: true,
  //     options: RoleOptions,
  //     style: {
  //       width: '100%'
  //     },
  //     slots: {
  //       suffix: true,
  //       prefix: true
  //     }
  //   }
  // },
  {
    field: 'county_id',
    label: t('County'),
    component: 'Select',
    colProps: {
      span: 24
    },
    componentProps: {
      options: countiesOptions,
      filterable: true,

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
  county_id: [required()]
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

        formData.role = ['public'] // 14 - general user with limited views
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
  <Form :schema="schema" :rules="rules" label-position="side" hide-required-asterisk size="large"
    class="dark:(border-1 border-[var(--el-border-color)] border-solid)" @register="register">
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
