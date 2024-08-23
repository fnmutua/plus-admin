<script setup lang="ts">
import { LoginForm, RegisterForm } from './components'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { LocaleDropdown } from '@/components/LocaleDropdown'
import { useI18n } from '@/hooks/web/useI18n'
import { underlineToHump } from '@/utils'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { ref } from 'vue'
import BaseLayout from './../BaseLayout.vue';

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('login')

const appStore = useAppStore()

const { t } = useI18n()

const isLogin = ref(true)

const toRegister = () => {
  isLogin.value = false
}

const toLogin = () => {
  isLogin.value = true
}

</script>

<template>
      <BaseLayout>
        <div class="hero"> 
   <div :class="prefixCls" class="h-[100%] relative <xl <sm:px-10px <xl:px-10px <md:px-10px">
    <div class="relative h-full flex mx-auto">
      
      <div class="flex-1 p-30px <sm:p-10px   relative">
        <div class="flex justify-between items-center text-white @2xl:justify-end @xl:justify-end">
        

         
        </div>
        <Transition appear enter-active-class="animate__animated animate__bounceInRight">
          <div v-if="isLogin" 
            class="h-full flex items-center m-auto w-[100%] @2xl:max-w-500px @xl:max-w-500px @md:max-w-500px @lg:max-w-500px">
            <LoginForm   class="p-20px h-auto m-auto <xl:(rounded-3xl light:bg-white)"
              @to-register="toRegister" />
           </div>
        </Transition>


        <Transition appear enter-active-class="animate__animated animate__bounceInRight">
          <div v-if="!isLogin">
    
            <RegisterForm  class="p-20px h-auto m-auto <xl:(rounded-3xl light:bg-white)" @to-login="toLogin" />
          </div>
        </Transition>



      </div>
    </div>
  </div>
</div>
</BaseLayout>
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


.hero {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  padding: 100px 20px;
    background-size: cover;
  background-position: center;
   height: 80vh;
}
</style>