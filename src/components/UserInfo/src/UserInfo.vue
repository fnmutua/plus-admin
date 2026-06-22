<script setup lang="ts">
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessageBox,ElAvatar, ElBadge, ElButton } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { useCache } from '@/hooks/web/useCache'
import { resetRouter } from '@/router'
import { useRouter } from 'vue-router'
import { loginOutApi } from '@/api/login'
import { useDesign } from '@/hooks/web/useDesign'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useAppStoreWithOut } from '@/store/modules/app'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { useDictStoreWithOut } from '@/store/modules/dict'
import { useLocaleStoreWithOut } from '@/store/modules/locale'
import { Share } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue';
import { UserFilled } from '@element-plus/icons-vue'

const { push } = useRouter()




const tagsViewStore = useTagsViewStore()

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('user-info')

const { t } = useI18n()

const { wsCache } = useCache()

const { replace } = useRouter()



const appStore = useAppStoreWithOut()
const permissionStore = usePermissionStoreWithOut()
const dictStore = useDictStoreWithOut()
const localeStore = useLocaleStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

console.log('Profile-Pic',userInfo )


const loginOut = () => {
  ElMessageBox.confirm(t('common.loginOutMessage'), t('common.reminder'), {
    confirmButtonText: t('common.ok'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  })
    .then(async () => {
      // Provide required data for loginOutApi
      const userId = userInfo && userInfo.id ? userInfo.id : null;
      console.log('UserInfo....', userId)
      
      // Call logout API (but continue even if it fails)
      try {
        await loginOutApi({ userId });
      } catch (error) {
        console.error('Logout API call failed:', error);
        // Continue with logout even if API fails
      }
      
      // Clear all storage first
      wsCache.clear()
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear Cache storage (browser Cache API)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear dynamic routes first (before resetting store)
      permissionStore.clearDynamicRoutes()
      
      // Reset all Pinia stores to clear in-memory state
      tagsViewStore.$reset()
      appStore.$reset()
      permissionStore.$reset()
      dictStore.$reset()
      localeStore.$reset()
      
      // Clear tags view manually (in case $reset doesn't clear it properly)
      tagsViewStore.delAllViews()
      
      // Reset router to clear dynamic routes
      resetRouter()
      
      // Navigate to home/login page
      replace('/')
    })
    .catch(() => { })
}

 

const viewProfile = () => {

  push({

    name: 'userProfile'
  })

}

const goHome = () => {
  push({ name: 'LandingPage' })
}

</script>

<template>
  <ElDropdown :class="prefixCls" trigger="click">
    <div class="flex items-center">


      <!-- <img src="@/assets/imgs/user.png" alt="" class="w-[calc(var(--logo-height)-25px)] rounded-[50%]" /> -->
      <!-- <Avatar :src="userInfo.avatar" :alt="userInfo.name"   /> -->
     
     <el-avatar  v-if="userInfo.avatar" :src="userInfo.avatar"  />
     <el-avatar v-else  :icon="UserFilled" />



      <span class="<lg:hidden text-14px pl-[5px] text-[var(--top-header-text-color)]">{{ userInfo.name }}</span>
    </div>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem>
          <div @click="goHome">{{ t('Home') }}</div>
        </ElDropdownItem>
        <ElDropdownItem>
          <div @click="viewProfile">{{ t('Profile') }}</div>
        </ElDropdownItem>
        <ElDropdownItem divided>
          <div @click="loginOut">{{ t('common.loginOut') }}</div>
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>
