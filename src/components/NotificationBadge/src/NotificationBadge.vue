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
  }

}

const newReports = ref()

const getNewReports = async () => {
  const formData = {}
  formData.model = 'indicator_category_report'
  formData.summaryFunction = 'count'
  formData.summaryField = 'status'
  formData.summaryFieldValue = 'New'

  // Directbeneficisaries 
  await getSummarybyFieldSimple(formData)
    .then(response => {
      var results = response.Total
      console.log('Count New Reports..........', results[0].count)
      newReports.value = results[0].count
    });


}
getNewReports()


</script>

<template>
  <div :class="prefixCls">

    <el-badge is-dot>
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
              <el-badge class="mark" :value="3" />
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