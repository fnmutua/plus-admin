<script setup lang="ts">
import { LoginForm, RegisterForm } from './components'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { LocaleDropdown } from '@/components/LocaleDropdown'
import { useI18n } from '@/hooks/web/useI18n'
import { underlineToHump } from '@/utils'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { ref } from 'vue'
import { ElDivider, ElTabs, ElTabPane, ElContainer, ElMain, ElAside, ElMenu, ElMenuItem, ElSubMenu, ElButton } from 'element-plus'
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
  <el-menu  class="el-menu-demo" mode="horizontal"  >
    <el-menu-item index="1">
  <span style="font-weight: bold; font-size: 24px;">Kenya Slum Information System Privacy Policy</span>
</el-menu-item>
  </el-menu>

  <el-tabs tab-position="left" style="height: 700px;  " class="demo-tabs">
    <el-tab-pane label="Introduction"> 
       Advanced Geospatial Solutions operates the Kenya Slum information System( the"System") and the SlumMapper (the "App"). This page informs you of our policies regarding the collection, use, and disclosure of personal information we receive from users of the App.
    </el-tab-pane>

    <el-tab-pane label=" Personal Information">We may ask you to provide certain personally identifiable information that
      can be used to contact or identify you. Personally identifiable information may include, but is not limited to, your name, email, and phone number ("Personal Information")</el-tab-pane>

    <el-tab-pane label="Usage Data">
      <p>We may also collect information that your mobile device sends whenever you use our App ("Usage Data").This Usage Data may include information such as your device's Internet Protocol ("IP") address, device  type, operating system version, the pages of our App that you visit, the time and date of your visit, the  time spent on those pages, and other statistics. We do not plan to access IMEI or any other device identifiable information.</p>
    </el-tab-pane>

    <el-tab-pane label="Use of Information">We may use your Personal Information and Usage Data to provide and improve the App. By using the App, you agree to the collection and use of information in accordance with this policy. We may collect and analyze  Usage Data to monitor the usage of the App, troubleshoot technical issues, and improve the overall user experience.</el-tab-pane>

    <el-tab-pane label="Disclosure of Information">We may only disclose your Personal Information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).</el-tab-pane>

    <el-tab-pane label="Security">The security of your Personal Information is important to us. We strive to implement and maintain reasonable security measures to protect against unauthorized access, alteration, disclosure, or  destruction of your Personal Information.</el-tab-pane>
   
    <el-tab-pane label="Links to Other Websites">Our App may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.</el-tab-pane>

    <el-tab-pane label="Children's Privacy">Our App does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally  identifiable information from Children. If you are a parent or guardian and you are aware that your Child has provided us with Personal Information, please contact us. If we become aware that we have collected  Personal Information from a Child without verification of parental consent, we will take steps to remove that information from our servers.</el-tab-pane>
 
 
    <el-tab-pane label="Right to Erasure"> <p>The user reserves the right to have their data deleted from the system at any given time. Should a user desire so, write us an email requesting for data deletion through  <a  href="mailto:info@ags.co.ke">info@ags.co.ke</a></p>
</el-tab-pane>
 
    <el-tab-pane label="Changes to This Privacy Policy"><p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p></el-tab-pane>
    <el-tab-pane label="Contact Us"> <p>If you have any questions about this Privacy Policy, please contact us at <a
      href="mailto:info@ags.co.ke">info@ags.co.ke</a>.</p></el-tab-pane>
 
      <el-tab-pane label="Back" @click="toLogin">
  <el-button type="primary">Go to the System</el-button>
</el-tab-pane>  </el-tabs>
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

.scrollable-container {
  overflow: auto;
  height: 100%;
  /* Adjust the desired height */
}

.scrollable-content {
  /* Set a minimum width to ensure horizontal scrolling works */
  min-width: 100%;
}

.italic {
  font-style: italic;
}
</style>


<style>
.demo-tabs>.el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 20px;
  font-weight: 400;
}

.demo-tabs .el-tabs__item {
      font-size: 20px;
    }

.el-tabs--right .el-tabs__content,
.el-tabs--left .el-tabs__content {
  height: 100%;
}
</style>