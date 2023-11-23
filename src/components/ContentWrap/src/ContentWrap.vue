<script setup lang="ts">
import { ElCard, ElTooltip, ElButton } from 'element-plus'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

import {
  Position,
  Back,
  Plus,
  Download,
  Filter,
   Edit,
  InfoFilled,Search,TopRight,
  Delete
} from '@element-plus/icons-vue'

import { useRouter } from 'vue-router'

 
const router = useRouter()


const goBack = () => {
  // Add your logic to handle the back action
  // For example, you can use Vue Router to navigate back
  if (router) {
    // Use router.back() to navigate back
    router.back()
  } else {
    console.warn('Router instance not available.')
  }

}
const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('content-wrap')

defineProps({
  title: propTypes.string.def(''),
  message: propTypes.string.def('')
})
</script>

<template>
  <ElCard :class="[prefixCls]" shadow="never">
    <template v-if="title" #header>

 
        <div class="flex items-center">
        <div class="max-w-200px">
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
        </div>

        <span class="text-14px font-700">{{ title }}</span>
        <ElTooltip v-if="message" effect="dark" placement="right">
          <template #content>
            <div class="max-w-200px">{{ message }}</div>
          </template>
          <Icon class="ml-5px" icon="bi:question-circle-fill" :size="14" />
        </ElTooltip>
      </div>
    </template>
    <div class="full-height">
      <slot></slot>
    </div>
  </ElCard>
</template>

<style scoped>
.full-height {
  height: 75vh; /* Set the height to 75% of the viewport height */
  overflow: auto; /* Add scrollbars if content exceeds viewport height */
}
</style>

