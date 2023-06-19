<script setup lang="ts">
import { LoginForm, RegisterForm } from './components'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { LocaleDropdown } from '@/components/LocaleDropdown'
import { useI18n } from '@/hooks/web/useI18n'
import { underlineToHump } from '@/utils'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { ref } from 'vue'
import { ElDivider, ElSpace, ElButton } from 'element-plus'
import { useRouter } from 'vue-router'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('login')

const appStore = useAppStore()
const { push } = useRouter()

const { t } = useI18n()

const isLogin = ref(true)

const toRegister = () => {
  isLogin.value = false
}

const toLogin = () => {
  push({
    name: 'Login'
  })
}
</script>

<template>
  <!-- <div :class="prefixCls" class="h-[100%] relative <xl:bg-v-dark <sm:px-10px <xl:px-10px <md:px-10px"> -->
  <div :class="prefixCls" class="h-[100%] relative <xl <sm:px-10px <xl:px-10px <md:px-10px">
    <div class="relative h-full flex mx-auto">
      <div :class="`${prefixCls}__left flex-1 bg-gray-500 bg-opacity-20 relative p-30px <xl:hidden`">
        <div class="flex   h-[calc(100%-60px)]">
          <TransitionGroup appear tag="div" enter-active-class="animate__animated animate__bounceInLeft">

            <div class="text-2xl text-white text-center" key="2">{{
              t('Kenya Slum Information System and Slum Mapper App')
            }}</div>

            <div class="text-1xl text-white text-center" key="2">{{
              t('Privacy Policy')
            }}
            </div>

            <div class="text-white ">

              <p><strong>1. Personal Information</strong></p>
              <p>We may ask you to provide certain personally identifiable information that can be used to contact or
                identify you. Personally identifiable information may include, but is not limited to, your name, email,
                and phone number ("Personal Information").</p>
              <el-space />

              <p><strong>2. Usage Data</strong></p>
              <p>We may also collect information that your mobile device sends whenever you use our App ("Usage Data").
                This Usage Data may include information such as your device's Internet Protocol ("IP") address, device
                type, operating system version, the pages of our App that you visit, the time and date of your visit, the
                time spent on those pages, and other statistics. We do not plan to access IMEI or any other device
                identifiable information.</p>

              <el-space />

              <h3><strong>3. Use of Information</strong></h3>

              <p>We may use your Personal Information and Usage Data to provide and improve the App. By using the App, you
                agree to the collection and use of information in accordance with this policy. We may collect and analyze
                Usage Data to monitor the usage of the App, troubleshoot technical issues, and improve the overall user
                experience.</p>

              <el-space />

              <h3><strong>4. Disclosure of Information</strong></h3>
              <p>We may only disclose your Personal Information if required to do so by law or in response to valid
                requests by public authorities (e.g., a court or a government agency).</p>

              <el-space />

              <h3><strong>5. Security</strong></h3>

              <p>The security of your Personal Information is important to us. We strive to implement and maintain
                reasonable security measures to protect against unauthorized access, alteration, disclosure, or
                destruction of your Personal Information.</p>

              <el-divider />

            </div>



          </TransitionGroup>
        </div>
      </div>
      <div class="flex-1 p-30px <sm:p-10px dark:bg-v-dark relative">
        <div class="flex justify-between items-center text-white @2xl:justify-end @xl:justify-end">
          <div class="flex items-center @2xl:hidden @xl:hidden">
            <img src="@/assets/imgs/logo.png" alt="" class="w-48px h-48px mr-10px" />
            <span class="text-20px font-bold">{{ underlineToHump(appStore.getTitle) }}</span>
          </div>


        </div>
        <Transition appear enter-active-class="animate__animated animate__bounceInRight">


          <div>
            <el-space />

            <h3><strong>6. Links to Other Websites</strong></h3>
            <p>Our App may contain links to other websites that are not operated by us. If you click on a third-party
              link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy
              of every site you visit.</p>
            <el-space />
            <h3><strong>7. Children's Privacy</strong></h3>
            <p>Our App does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally
              identifiable information from Children. If you are a parent or guardian and you are aware that your Child
              has provided us with Personal Information, please contact us. If we become aware that we have collected
              Personal Information from a Child without verification of parental consent, we will take steps to remove
              that information from our servers.</p>
            <el-space />
            <h3><strong>8. Changes to This Privacy Policy</strong></h3>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
            <h3><strong>9. Contact Us</strong></h3>
            <el-space />
            <p>If you have any questions about this Privacy Policy, please contact us at <a
                href="mailto:info@ags.co.ke">info@ags.co.ke</a>.</p>
            <el-divider />
            <el-button type="primary" @click="toLogin" plain>Back</el-button>


          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>@prefix-cls: ~'@{namespace}-login';

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
}</style>
