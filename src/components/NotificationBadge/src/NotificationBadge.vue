<script setup lang="ts">
import { Icon } from '@/components/Icon'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'
import { ElButton, ElSelect, ElMessage, ElBadge, ElDropdown, ElDropdownItem } from 'element-plus'

import {
  Message,
} from '@element-plus/icons-vue'
import { CaretBottom } from '@element-plus/icons-vue'
import { getSummarybyField, getSummarybyFieldSimple, getSummarybyFieldNested } from '@/api/summary'
import { ref, reactive, h } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const { getPrefixCls } = useDesign()
const { push } = useRouter()

const prefixCls = getPrefixCls('NotificationBadge')

defineProps({
  color: propTypes.string.def('')
})

const handleCommand = (command: string | number | object) => {
  //ElMessage(`click on item ${command}`)

  if (command == 'Reports') {
    push({
      path: '/mne/new',
      name: 'NewReports'
    })
  } else if (command == 'Accounts') {
    push({
      path: '/users/new',
      name: 'NewAccounts'
    })

  }

}

const newReports = ref()
const activeDot = ref(false)
const getNewReports = async () => {
  const formData = {}
  formData.model = 'indicator_category_report'
  formData.summaryFunction = 'count'
  formData.summaryField = 'status'
  formData.summaryFieldValue = 'New'
formData.cache_key = 'xgetNewReports'

  // Directbeneficisaries 
  await getSummarybyFieldSimple(formData)
    .then(response => {
      var results = response.Total
      console.log('Count New Reports..........', response)
      newReports.value = results[0].count
      if (results[0].count > 0) {
        activeDot.value = true
      }
    });


}

const newAccounts = ref()
const getNewAccounts = async () => {
  const formData = {}
  formData.model = 'users'
  formData.summaryFunction = 'count'
  formData.summaryField = 'isactive'
  formData.summaryFieldValue = 'false'
  formData.cache_key = 'getNewAccounts'

  // Directbeneficisaries 
  await getSummarybyFieldSimple(formData)
    .then(response => {
      var results = response.Total
      console.log('Count New newAccounts..........', results[0].count)
      newAccounts.value = results[0].count
      if (results[0].count > 0) {
        activeDot.value = true
      }
    });

}
const showBadge = ref(false)
console.log("userInfo-------x---------", userInfo)
if (userInfo.roles.includes("admin") || (userInfo.roles.includes("sud_staff")) || (userInfo.roles.includes("kisip_staff")) || (userInfo.roles.includes("national_monitoring"))) {
  showBadge.value = true
} else {
  showBadge.value = false

}


getNewReports()
getNewAccounts()



</script>

<template>
  <div :class="prefixCls">

    <el-badge v-show="showBadge" :is-dot="activeDot">
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="el-dropdown-link">
          <Icon icon="material-symbols:circle-notifications-rounded" color="white" :size="18" />

        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="Reports" class="clearfix">
              New Reports
              <el-badge class="mark" :value="newReports" />
            </el-dropdown-item>
            <el-dropdown-item command="Accounts" class="clearfix">
              New Accounts
              <el-badge class="mark" :value="newAccounts" />
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-badge>

  </div>
</template>

<style scoped>
.item {
  margin-top: 10px;
  margin-right: 40px;
}

.el-dropdown {
  margin-top: 0.1rem;
}
</style>