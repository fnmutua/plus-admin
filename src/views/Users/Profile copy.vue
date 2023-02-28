<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, DeleteRecord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSwitch, ElSelect, ElDialog, ElPopconfirm, ElFormItem, ElForm, ElInput, MessageParamsWithType } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  Edit,
  User,
  Plus,
  Download,
  Delete,
  Filter,
  InfoFilled,
  MessageBox
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider, ELRow } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { activateUserApi, updateUserApi, getUserListApi, getMyProfile } from '@/api/users'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'




const { wsCache } = useCache()
const appStore = useAppStoreWithOut()



const userInfo = wsCache.get(appStore.getUserInfo)


// Hide buttons if not admin 
const showAdminButtons = ref(false)

if (userInfo.roles.includes("admin")) {
  showAdminButtons.value = true
}



const { push } = useRouter()





const model = 'users'


//// ------------------parameters -----------------------////


const { t } = useI18n()











const userDetails = ref()
const userName = ref('')
const avatar = ref('')
const email = ref('')
const getMyProfileDetails = async () => {
  const formData = {}

  formData.model = model
  formData.id = 1


  //-------------------------
  //console.log(formData)
  const res = await getMyProfile(formData)

  console.log('getMyProfile', res)
  userDetails.value = res.data[0]
  userName.value = res.data[0].name
  avatar.value = res.data[0].avatar
  email.value = res.data[0].email

  console.log(userDetails)

}

getMyProfileDetails()



</script>

<template>
  <ContentWrap :title="t('Profile')">




    <el-card :body-style="{ padding: '0px' }">
      <img :src="avatar" class="image" />
      <div style="padding: 14px">
        <span> {{ userName }} </span>
      </div>
      <div style="padding: 14px">
        <span> {{ email }} </span>
      </div>
    </el-card>





  </ContentWrap>
</template>




<style>
.user-profile {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.user-picture {
  width: 200px;
  height: 200px;
  margin: 20px;
}

.user-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>