<template>
  <div class="system-settings-container">
    <ElCard class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>System Settings</h2>
          <p class="subtitle">Control security limits and other system-wide behaviour (root administrator only)</p>
        </div>
      </template>

      <div v-loading="loading" class="settings-content">
        <ElTabs v-model="activeTab" class="settings-tabs">
          <ElTabPane label="Security" name="security">
            <p class="tab-intro">
              Toggle protections on or off. Changes apply within about 30 seconds without restarting the server.
            </p>
            <div class="settings-list">
              <div
                v-for="setting in toggleSettings"
                :key="setting.id || setting.module"
                class="setting-item"
              >
                <div class="setting-info">
                  <div class="setting-header">
                    <h3 class="setting-title">{{ formatModuleName(setting.module) }}</h3>
                    <ElTag :type="setting.enabled ? 'success' : 'info'" size="small">
                      {{ setting.enabled ? 'Enabled' : 'Disabled' }}
                    </ElTag>
                  </div>
                  <p v-if="setting.description" class="setting-description">
                    {{ setting.description }}
                  </p>
                </div>
                <div class="setting-action">
                  <ElSwitch
                    v-model="setting.enabled"
                    :loading="setting.saving"
                    active-text="ON"
                    inactive-text="OFF"
                    @change="handleToggle(setting)"
                  />
                </div>
              </div>

              <div v-if="toggleSettings.length === 0" class="empty-state">
                <ElEmpty description="No security settings found" />
              </div>
            </div>

            <div v-if="maxDevicesSetting" class="setting-item setting-item--numeric">
              <div class="setting-info">
                <div class="setting-header">
                  <h3 class="setting-title">Max login sessions per user</h3>
                  <ElTag type="info" size="small">
                    {{ maxDevicesValue === 0 ? 'Unlimited' : `${maxDevicesValue} devices` }}
                  </ElTag>
                </div>
                <p class="setting-description">
                  {{ maxDevicesSetting.description }}
                </p>
              </div>
              <div class="setting-action setting-action--numeric">
                <ElSwitch
                  v-model="maxDevicesSetting.enabled"
                  active-text="Limit ON"
                  inactive-text="Unlimited"
                />
                <ElInputNumber
                  v-model="maxDevicesValue"
                  :min="0"
                  :max="50"
                  :step="1"
                  :disabled="!maxDevicesSetting.enabled"
                  controls-position="right"
                />
              </div>
            </div>
          </ElTabPane>
        </ElTabs>
      </div>

      <div class="card-footer">
        <ElButton type="primary" :loading="saving" @click="saveAllSettings">
          Save All Changes
        </ElButton>
        <ElButton @click="refreshSettings">Refresh</ElButton>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElCard, ElSwitch, ElTag, ElButton, ElEmpty, ElMessage, ElTabs, ElTabPane, ElInputNumber } from 'element-plus'
import { getSystemSettings, bulkUpdateSystemSettings, type ModuleSetting } from '@/api/settings'

const loading = ref(false)
const saving = ref(false)
const settings = ref<Array<ModuleSetting & { saving?: boolean }>>([])
const activeTab = ref('security')
const maxDevicesValue = ref(5)

const SYSTEM_SETTING_PREFIX = 'rate_limit_'
const AUTH_MAX_DEVICES_MODULE = 'auth_max_devices'

const defaultSettings: ModuleSetting[] = [
  {
    module: 'rate_limit_login',
    enabled: true,
    description:
      'Brute-force protection on login endpoints: max 10 attempts per IP every 15 minutes (/api/auth/signin, /api/auth/guest, /api/app/signin).'
  },
  {
    module: 'rate_limit_otp',
    enabled: true,
    description:
      'OTP guessing protection on mobile verify: max 5 attempts per IP every 10 minutes (/api/app/verify).'
  },
  {
    module: AUTH_MAX_DEVICES_MODULE,
    enabled: true,
    config_value: '5',
    description:
      'Maximum simultaneous logged-in devices per user. Re-login on the same device replaces that session. Set to 0 or turn off the limit for unlimited sessions. Changes apply within about 30 seconds.'
  }
]

const formatModuleName = (module: string): string => {
  const labels: Record<string, string> = {
    rate_limit_login: 'Login rate limit',
    rate_limit_otp: 'OTP rate limit',
    auth_max_devices: 'Max login sessions per user'
  }
  if (labels[module]) return labels[module]

  return module
    .replace(/^rate_limit_/, '')
    .replace(/^auth_/, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const isSystemModule = (module: string) =>
  module.startsWith(SYSTEM_SETTING_PREFIX) || module.startsWith('auth_')

const toggleSettings = computed(() =>
  settings.value.filter((s) => s.module.startsWith(SYSTEM_SETTING_PREFIX))
)

const maxDevicesSetting = computed(() =>
  settings.value.find((s) => s.module === AUTH_MAX_DEVICES_MODULE)
)

const loadSettings = async () => {
  loading.value = true
  try {
    const response = await getSystemSettings()
    if (response.code === '0000') {
      const existingModules = new Set(response.data.map((s) => s.module))
      const missingDefaults = defaultSettings.filter((s) => !existingModules.has(s.module))
      settings.value = [
        ...response.data
          .filter((s) => isSystemModule(s.module))
          .map((s) => ({ ...s, saving: false })),
        ...missingDefaults.map((s) => ({ ...s, saving: false }))
      ]
      syncMaxDevicesValueFromSetting()
    } else {
      ElMessage.error(response.message || 'Failed to load settings')
    }
  } catch (error) {
    console.error('Error loading system settings:', error)
    ElMessage.error('Failed to load settings')
    settings.value = defaultSettings.map((s) => ({ ...s, saving: false }))
    syncMaxDevicesValueFromSetting()
  } finally {
    loading.value = false
  }
}

const handleToggle = async (setting: ModuleSetting & { saving?: boolean }) => {
  setting.saving = true
  try {
    ElMessage.success(`${formatModuleName(setting.module)} ${setting.enabled ? 'enabled' : 'disabled'}`)
  } finally {
    setting.saving = false
  }
}

const syncMaxDevicesValueFromSetting = () => {
  const setting = settings.value.find((s) => s.module === AUTH_MAX_DEVICES_MODULE)
  const parsed = parseInt(String(setting?.config_value ?? '5'), 10)
  maxDevicesValue.value = Number.isNaN(parsed) ? 5 : parsed
}

const saveAllSettings = async () => {
  saving.value = true
  try {
    const maxSetting = maxDevicesSetting.value
    if (maxSetting) {
      maxSetting.config_value = maxSetting.enabled
        ? String(maxDevicesValue.value)
        : '0'
    }

    const settingsToSave = settings.value
      .filter((s) => isSystemModule(s.module))
      .map((s) => ({
        module: s.module,
        enabled: s.enabled,
        description: s.description,
        config_value: s.config_value ?? null
      }))

    const response = await bulkUpdateSystemSettings(settingsToSave)
    if (response.code === '0000') {
      ElMessage.success('System settings saved successfully')
      await loadSettings()
    } else {
      ElMessage.error(response.message || 'Failed to save settings')
    }
  } catch (error) {
    console.error('Error saving system settings:', error)
    ElMessage.error('Failed to save settings')
  } finally {
    saving.value = false
  }
}

const refreshSettings = () => {
  loadSettings()
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="less">
.system-settings-container {
  padding: 0;
}

.settings-card {
  width: 100%;
}

.card-header {
  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }

  .subtitle {
    margin: 0;
    color: #909399;
    font-size: 14px;
  }
}

.tab-intro {
  margin: 0 0 16px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.settings-content {
  min-height: 200px;
}

.settings-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
}

.setting-info {
  flex: 1;
  margin-right: 20px;
}

.setting-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.setting-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.setting-description {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.setting-action {
  display: flex;
  align-items: center;
}

.setting-action--numeric {
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.setting-item--numeric {
  margin-top: 8px;
}

.card-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .setting-info {
    margin-right: 0;
    width: 100%;
  }

  .setting-action {
    width: 100%;
    justify-content: flex-end;
  }

  .card-footer {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
