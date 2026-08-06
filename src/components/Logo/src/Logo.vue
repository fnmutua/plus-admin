<script setup lang="ts">
import { ref, watch, computed, onMounted, unref } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { INSTITUTION } from '@/views/Landing/config/landing.config'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('logo')

const appStore = useAppStore()

const show = ref(true)

const title = computed(() => appStore.getTitle)

const layout = computed(() => appStore.getLayout)

const collapse = computed(() => appStore.getCollapse)

const isDark = computed(() => appStore.getIsDark)

/** KeSMIS icon mark — white on dark sidebar / dark theme, colour otherwise */
const logoSrc = computed(() => {
  const useWhite = layout.value === 'classic' || isDark.value
  return useWhite ? INSTITUTION.logoMarkSrcWhite : INSTITUTION.logoMarkSrc
})

const logoImgClass = computed(() =>
  layout.value === 'classic'
    ? 'logo-img logo-img--sidebar'
    : 'logo-img logo-img--default'
)

onMounted(() => {
  if (unref(collapse)) show.value = false
})

watch(
  () => collapse.value,
  (collapse: boolean) => {
    if (unref(layout) === 'topLeft' || unref(layout) === 'cutMenu') {
      show.value = true
      return
    }
    if (!collapse) {
      setTimeout(() => {
        show.value = !collapse
      }, 400)
    } else {
      show.value = !collapse
    }
  }
)

watch(
  () => layout.value,
  (layout) => {
    if (layout === 'top' || layout === 'cutMenu') {
      show.value = true
    } else {
      if (unref(collapse)) {
        show.value = false
      } else {
        show.value = true
      }
    }
  }
)
</script>

<template>
  <router-link
:class="[
    prefixCls,
    layout !== 'classic' ? `${prefixCls}__Top` : '',
    'flex !h-[var(--logo-height)] items-center cursor-pointer pl-8px relative',
    'dark:bg-[var(--el-bg-color)]'
  ]" to="/">
    <img
      :src="logoSrc"
      :alt="INSTITUTION.systemName"
      :class="logoImgClass"
    />
    <div
v-if="show" :class="[
      'ml-10px text-16px font-700',
      {
        'text-[var(--logo-title-text-color)]': layout === 'classic',
        'text-[var(--top-header-text-color)]':
          layout === 'topLeft' || layout === 'top' || layout === 'cutMenu'
      }
    ]">
      {{ title }}
    </div>
  </router-link>
</template>

<style scoped>
.logo-img {
  object-fit: contain;
  flex-shrink: 0;
}

.logo-img--default {
  height: calc(var(--logo-height) - 10px);
  width: calc(var(--logo-height) - 10px);
}

.logo-img--sidebar {
  height: calc(var(--logo-height) - 8px);
  width: calc(var(--logo-height) - 8px);
}
</style>
