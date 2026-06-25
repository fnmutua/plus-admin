<script setup lang="ts">
import { provide, computed, watch, onMounted } from 'vue'
import { useLocaleStore } from '@/store/modules/locale'
import { useWindowSize } from '@vueuse/core'
import { useAppStore } from '@/store/modules/app'
import { setCssVar } from '@/utils'
import { applyElementPlusSize } from '@/utils/elementPlusSize'
import { useDesign } from '@/hooks/web/useDesign'
import { ElConfigProvider } from 'element-plus'

const { variables } = useDesign()

const appStore = useAppStore()

const size = computed(() => appStore.getCurrentSize)

/** Element Plus only accepts large | default | small — map extraSmall to small. */
const elConfigSize = computed(() => {
  const current = size.value
  return current === 'extraSmall' ? 'small' : current
})

const configGlobal = computed(() => ({ size: elConfigSize.value }))

provide('configGlobal', configGlobal)

// 初始化所有主题色 + 组件尺寸
onMounted(() => {
  appStore.setCssVarTheme()
  applyElementPlusSize(size.value)
})

watch(size, (value) => {
  applyElementPlusSize(value)
})

const { width } = useWindowSize()

// 监听窗口变化
watch(
  () => width.value,
  (width: number) => {
    if (width < 768) {
      !appStore.getMobile ? appStore.setMobile(true) : undefined
      setCssVar('--left-menu-min-width', '0')
      appStore.setCollapse(true)
      appStore.getLayout !== 'classic' ? appStore.setLayout('classic') : undefined
    } else {
      appStore.getMobile ? appStore.setMobile(false) : undefined
      setCssVar('--left-menu-min-width', '64px')
    }
  },
  {
    immediate: true
  }
)

// 多语言相关
const localeStore = useLocaleStore()

const currentLocale = computed(() => localeStore.currentLocale)
</script>

<template>
  <ElConfigProvider
    :namespace="variables.elNamespace"
    :locale="currentLocale.elLocale"
    :message="{ max: 1 }"
    :size="elConfigSize"
  >
    <slot></slot>
  </ElConfigProvider>
</template>
