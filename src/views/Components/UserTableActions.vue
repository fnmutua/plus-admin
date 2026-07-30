<template>
  <el-dropdown trigger="click" placement="bottom-end">
    <el-button
      v-if="!isMobile"
      type="primary"
      size="small"
      :icon="Setting"
      circle
    />
    <el-button v-else link size="small">
      <el-icon><Setting /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <template v-if="showActivate">
          <PermissionWrapper v-if="showAdminButtons" :permissions="['user:activate']">
            <el-dropdown-item
              :disabled="activateLoading || activateDisabled"
              @click="handleActivate"
            >
              <el-icon><Switch /></el-icon>
              <span style="margin-left: 8px;">{{ row.isactive ? 'Deactivate' : 'Activate' }}</span>
            </el-dropdown-item>
          </PermissionWrapper>
          <el-dropdown-item v-else disabled>
            <el-icon><Switch /></el-icon>
            <span style="margin-left: 8px;">Activate/Deactivate</span>
          </el-dropdown-item>
        </template>

        <PermissionWrapper :permissions="['user:update']">
          <el-dropdown-item @click="emit('edit')">
            <el-icon><Edit /></el-icon>
            <span style="margin-left: 8px;">Edit/Roles</span>
          </el-dropdown-item>
        </PermissionWrapper>

        <PermissionWrapper v-if="showForceLogout" :permissions="['user:update']">
          <el-dropdown-item @click="emit('forceLogout')" divided>
            <el-icon><SwitchButton /></el-icon>
            <span style="margin-left: 8px;">Force Logout</span>
          </el-dropdown-item>
        </PermissionWrapper>

        <el-dropdown-item
          v-if="showResetPassword"
          :disabled="(!row.email && !row.phone) || resetPasswordLoading"
          :divided="!showForceLogout"
          @click="emit('resetPassword')"
        >
          <Icon icon="material-symbols:lock-reset" />
          <span style="margin-left: 8px;">Reset Password</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { ElButton, ElIcon, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import { Setting, Edit, Switch, SwitchButton } from '@element-plus/icons-vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'

const props = defineProps({
  row: {
    type: Object,
    required: true,
  },
  showAdminButtons: {
    type: Boolean,
    default: true,
  },
  activateLoading: {
    type: Boolean,
    default: false,
  },
  resetPasswordLoading: {
    type: Boolean,
    default: false,
  },
  showActivate: {
    type: Boolean,
    default: true,
  },
  showForceLogout: {
    type: Boolean,
    default: true,
  },
  showResetPassword: {
    type: Boolean,
    default: true,
  },
  activateDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['activate', 'edit', 'forceLogout', 'resetPassword'])

const isMobile = computed(() => window.innerWidth <= 768)

const handleActivate = () => {
  if (props.activateLoading || !props.showAdminButtons || props.activateDisabled) return
  emit('activate')
}
</script>
