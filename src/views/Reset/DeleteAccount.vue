<script setup lang="ts">
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { useI18n } from '@/hooks/web/useI18n'
import { underlineToHump } from '@/utils'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { ref, reactive } from 'vue'
import {
  ElButton, ElDialog,
  ElInput, ElForm, ElFormItem, ElPopconfirm, ElText, ElScrollbar
} from 'element-plus'

import type { ComponentSize, FormInstance, FormRules } from 'element-plus'
import { checkUser, deleteAccount } from '@/api/users'
import {
  Position, View, Plus, User, TopRight, Briefcase, Download, Delete, Edit,
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading, UploadFilled
} from '@element-plus/icons-vue'

import { useRouter } from 'vue-router';

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('login')

const appStore = useAppStore()

const { t } = useI18n()

const accDelete = ref(true)

interface RuleForm {
  username: string
  phone: string

}
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<RuleForm>({
  username: '',
  phone: '',

})

const dialogVisible = ref(false)
const rules = reactive<FormRules<RuleForm>>({
  username: [{ required: true, message: 'Registered Username/Email', trigger: 'blur' },],
  phone: [{ required: true, message: 'Registered phone', trigger: 'blur' },],
})


const foundUser = ref()
const onSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      console.log('submit!')

      const res = await checkUser(ruleForm)
      console.log(res)

      foundUser.value = res.user
      dialogVisible.value = true

    } else {
      console.log('error submit!', fields)
    }
  })
}

const otp = ref(null)

const onDeleteAccount = async () => {

  const formData = {}
  formData.user_id = foundUser.value.id
  formData.otp = otp.value

  console.log(otp.value)
  const res = await deleteAccount(formData)

  console.log(res)



}

const router = useRouter();

const onLogin = async () => {

  console.log('login')
  router.push('/login');
}


const results =[
{ title: "Permanent Data Removal", text: "All your personal details, saved preferences,mapped and submitted data,  activity history associated with the account will be erased from our systems. This data cannot be recovered once deletion is complete." },
        { title: "Access Termination", text: "You will lose access to all features and services provided by the account, including  access via the Slum Mapper app." },
        { title: "Irreversibility", text: "The deletion process is irreversible. If you decide to the system again in the future, you will need to create a new account and start fresh." },
 
]


</script>

<template>
  <div :class="prefixCls" class="h-[100%] relative <xl:bg-v-dark <sm:px-10px <xl:px-10px <md:px-10px">
    <div class="relative h-full flex mx-auto">
      <div :class="`${prefixCls}__left flex-1 bg-gray-500 bg-opacity-20 relative p-30px <xl:hidden`">
        <div class="flex justify-center items-center h-[calc(100%-60px)]">
          <TransitionGroup appear tag="div" enter-active-class="animate__animated animate__bounceInLeft">
            <!-- <img src="@/assets/svgs/login-box-bg.svg" key="1" alt="" class="w-350px" /> -->
            <img src="@/assets/svgs/logo_animates.svg" key="1" alt="" class="w-350px" />

            <div class="text-2xl text-white text-center" key="2">{{
              t('Kenya Slum Management Information System')
            }}</div>
          </TransitionGroup>
        </div>
      </div>
      <div class="flex-1 p-30px <sm:p-10px dark:bg-v-dark relative">
        <div class="flex justify-between items-center text-white @2xl:justify-end @xl:justify-end">
          <div class="flex items-center @2xl:hidden @xl:hidden">
            <img src="@/assets/imgs/logo.png" alt="" class="w-48px h-48px mr-10px" />
            <span class="text-20px font-bold">{{ underlineToHump(appStore.getTitle) }}</span>
          </div>

          <div class="flex justify-end items-center space-x-10px">
            <ThemeSwitch />
          </div>
        </div>

        <div v-if="accDelete">

          <div>
            <el-scrollbar style="margin-top: 10px;" height="auto">
            <h2 class="text-2xl font-bold text-center w-[100%]">{{ t('Delete Account') }}</h2>

            <el-text class="w-500px " >
              Deleting your account is a permanent action that removes your personal data, account information, and
              access to our services. Once the account is deleted, the following will happen:
            </el-text>

      
              <div v-for="(item, index) in results" :key="index" class="scrollbar-demo-item">
                <ElText>
                  {{ index + 1 }}. <b>{{ item.title }}</b> {{ item.text }}
                </ElText>
              </div>
        


            <el-form :model="ruleForm" label-width="auto" style="width: 100% ; margin-top:50px " :rules="rules"
              ref="ruleFormRef">
              <el-form-item label="Username" prop="username" label-position="top">
                <el-input style="width: 100%" v-model="ruleForm.username" />
              </el-form-item>

              <el-form-item label="Phone" style="width: 100%" prop="phone" label-position="top">
                <el-input style="width: 100%" v-model="ruleForm.phone" />
              </el-form-item>


              <el-form-item>
                <!-- <el-button style="width: 100%" type="primary" @click="onSubmit(ruleFormRef)">Submit</el-button> -->

                <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" width="350px"
                  icon-color="red" title="Are you sure you want to delete your account? This action cannot be undone."
                  @confirm="onSubmit(ruleFormRef)">

                  <template #reference>
                    <el-button style="width: 100%" type="danger">Submit</el-button>
                  </template>
                </el-popconfirm>


              </el-form-item>


              <el-form-item>
                <el-button style="width: 100%" type="primary" @click="onLogin()">Login</el-button>


              </el-form-item>


            </el-form>
          </el-scrollbar>
          </div>

        </div>
      </div>
    </div>
  </div>


  <el-dialog v-model="dialogVisible" title="Authentication" width="500">
    <span> OTP</span>
    <el-input v-model="otp" style="width: 100%" placeholder="Please input the code send to the registered number" />


    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>

        <el-button type="primary" @click="onDeleteAccount">
          Confirm
        </el-button>






      </div>
    </template>
  </el-dialog>

</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-login';

.@{prefix-cls} {
  &__left {
    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      background-image: url('@/assets/svgs/login-bg.svg');
      background-position: center;
      background-repeat: no-repeat;
      content: '';
    }
  }
}
</style>

<style>
.scrollbar-demo-item {
  margin-bottom: 10px; /* Adjust spacing between items */
}
</style>