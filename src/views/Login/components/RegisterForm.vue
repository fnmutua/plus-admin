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
import { bottom } from '@popperjs/core'

interface Params {
  pageIndex?: number
  pageSize?: number
}
const emit = defineEmits(['to-login'])

const { register, elFormRef, methods } = useForm()

const { t } = useI18n()
const countiesOptions = ref([])


const getTableList = async () => {

  const formData = {}
  formData.model = 'county'



  await getCountyAuth({}).then((response) => {
    console.log('List of counties:', response)
    //tableDataList.value = response.data
    var cnty = response.data

    loading.value = false

    cnty.forEach(function (arrayItem) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })

    // Add one option for non county persons 

    var national = {}
    national.value = "0"
    national.label = 'Not Applicable'
    countiesOptions.value.push(national)
    // sort by value
    countiesOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

getTableList()
console.log('tableDataList:', countiesOptions)

const { required } = useValidator()


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
    label: t('Username'),
    value: '',
    component: 'Input',
    colProps: {
      span: 24
    },
    componentProps: {
      placeholder: t('username')
    }
  },
  {
    field: 'email',
    label: t('Email'),
    value: '',
    component: 'Input',
    colProps: {
      span: 24
    },
    componentProps: {
      placeholder: t('login.usernamePlaceholder'),
      style: {
        width: '100%',
        paddingTop: '10px'

      },
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
        width: '100%',
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
      value: countiesOptions.value[47], // Set the default value here

      style: {
        width: '100%',
        paddingTop: '10px'

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


const passwordValidator = async (rule, value) => {
  console.log('Validate password')
  if (value === '') {
    return Promise.reject('Please enter the password.');
  } else if (value.length < 8 || value.length > 20) {
    return Promise.reject('The password must be between 8 and 20 characters long.');
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(value)) {
    return Promise.reject('Required: at least one uppercase letter, one lowercase letter, one digit, and one special character.');
  } else {
    return Promise.resolve();
  }
};

function validateName(rule: any, value: any, callback: any) {
  if (value && value.trim().split(/\s+/g).length < 2) {
    callback(new Error('Name should have at least two names, each at least 3 characters long'))
  } else {
    const words = value.trim().split(/\s+/g)
    const hasInvalidWord = words.some(word => word.length < 3)
    if (hasInvalidWord) {
      callback(new Error('Each name should be at least 3 characters long'))
    } else {
      callback()
    }
  }
}

function validateEmail(rule, value, callback) {
  if (!value) {
    callback(new Error('Email is required'));
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      callback(new Error('Invalid email format'));
    } else {
      callback();
    }
  }
}


function validateUsername(rule, value, callback) {
  if (!value) {
    callback(new Error('Username is required'));
  } else {
    const usernameRegex = /^[a-z0-9]{5,}$/i;
    if (!usernameRegex.test(value)) {
      callback(new Error('Lowercase letters and/or numbers, no special characters,no space and  at least 5 characters long.'));
    } else {
      callback();
    }
  }
}



const rules: FormRules = {
  name: [
    { required: true, message: 'Name is required' },
    { validator: validateName, message: 'Required  at least two names, each at least 3 characters long' }
  ],

  username:[{ validator: validateUsername, trigger: 'blur' }  ], 
  email:[{ validator: validateEmail, trigger: 'blur' }  ], 
  password: [{ validator: passwordValidator, trigger: 'blur' }],
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
        formData.email = formData.email.trim()
        formData.username = formData.username.trim()
        formData.name = formData.name.trim()

        formData.role = ['public']   // remember to change to public // 14 - general user with limited views
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
:schema="schema" :rules="rules" label-position="side" hide-required-asterisk size="large"
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
