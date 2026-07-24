<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElButton, ElDrawer } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import ProjectAddForm from '@/views/Intervention/Project/AddX.vue'

const props = defineProps<{
  visible: boolean
  componentId: string | number | null
  projectId?: string | number | null
  mode?: 'add' | 'edit'
  componentTitle?: string | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: [projectId: string | number]
}>()

const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)

const componentInfo = ref<{ title?: string; acronym?: string | null }>({})

const formSessionKey = computed(() =>
  props.visible
    ? `${props.mode ?? 'add'}-${props.projectId ?? 'new'}-${props.componentId ?? 'none'}`
    : 'closed'
)

watch(
  () => [props.visible, props.componentTitle] as const,
  ([visible, title]) => {
    if (!visible) {
      componentInfo.value = {}
      return
    }
    if (title) {
      componentInfo.value = { title }
    }
  },
  { immediate: true }
)

const componentLabel = computed(() => {
  const { acronym, title } = componentInfo.value
  return acronym || title || props.componentTitle || ''
})

const drawerTitle = computed(() => {
  const action = props.mode === 'edit' ? 'Edit' : 'Add'
  const label = componentLabel.value
  return label ? `${action} ${label} Project` : `${action} Project`
})

const drawerSubtitle = computed(() => {
  const { acronym, title } = componentInfo.value
  if (acronym && title && acronym.trim().toLowerCase() !== title.trim().toLowerCase()) {
    return title
  }
  return ''
})

function onComponentLoaded(payload: { title?: string; acronym?: string | null }) {
  componentInfo.value = {
    title: payload.title ?? componentInfo.value.title,
    acronym: payload.acronym ?? componentInfo.value.acronym,
  }
}

function handleDrawerVisibleChange(visible: boolean) {
  emit('update:visible', visible)
}

function closeDrawer() {
  handleDrawerVisibleChange(false)
}

function onSaved(projectId: string | number) {
  emit('saved', projectId)
  handleDrawerVisibleChange(false)
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :size="isMobile ? '100%' : '45%'"
    direction="rtl"
    destroy-on-close
    :close-on-click-modal="false"
    :show-close="false"
    class="project-form-drawer"
    @update:model-value="handleDrawerVisibleChange"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="project-form-drawer-header">
        <div>
          <h4 :id="titleId" :class="titleClass" class="project-form-drawer-title">
            {{ drawerTitle }}
          </h4>
          <p v-if="drawerSubtitle" class="project-form-drawer-subtitle">{{ drawerSubtitle }}</p>
        </div>
        <el-button type="danger" size="small" @click="close">
          <Icon icon="material-symbols:close" class="el-icon--left" />
          Close
        </el-button>
      </div>
    </template>

    <ProjectAddForm
      v-if="visible && componentId != null && componentId !== ''"
      :key="formSessionKey"
      embedded
      :component-id="componentId"
      :project-id="projectId ?? null"
      @saved="onSaved"
      @close="closeDrawer"
      @component-loaded="onComponentLoaded"
    />
  </el-drawer>
</template>

<style scoped>
.project-form-drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.project-form-drawer-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
}

.project-form-drawer-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

:deep(.project-form-drawer .el-drawer__body) {
  padding-top: 8px;
  overflow-y: auto;
}
</style>
