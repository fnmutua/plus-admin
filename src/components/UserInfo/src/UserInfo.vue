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
const userInfo = wsCache.get(appStore.getUserInfo)

console.log('Profile-Pic',userInfo )


const loginOut = () => {
  ElMessageBox.confirm(t('common.loginOutMessage'), t('common.reminder'), {
    confirmButtonText: t('common.ok'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  })
    .then(async () => {
      const res = await loginOutApi().catch(() => { })
      if (res) {
        wsCache.clear()
        tagsViewStore.delAllViews()
        resetRouter() // 重置静态路由表
        replace('/')
      }
    })
    .catch(() => { })
}

const toDocument = () => {
  window.open('https://element-plus-admin-doc.cn/')
}


const viewProfile = () => {

  push({

    name: 'userProfile'
  })

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
          <div @click="viewProfile">{{ t('Profile') }}</div>
        </ElDropdownItem>
        <ElDropdownItem divided>
          <div @click="loginOut">{{ t('common.loginOut') }}</div>
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>
