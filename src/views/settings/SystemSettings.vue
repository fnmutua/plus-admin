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
          </ElTabPane>

          <ElTabPane label="Auth" name="auth">
            <p class="tab-intro">
              Configure login and guest token lifetimes. Changes apply within about 30 seconds without restarting
              the server.
            </p>

            <div class="settings-list">
              <div v-if="jwtExpiresSetting" class="setting-item setting-item--numeric">
                <div class="setting-info">
                  <div class="setting-header">
                    <h3 class="setting-title">Login session / token expiry</h3>
                    <ElTag type="info" size="small">
                      {{ jwtExpiresHours }} hour{{ jwtExpiresHours === 1 ? '' : 's' }}
                    </ElTag>
                  </div>
                  <p class="setting-description">
                    {{ jwtExpiresSetting.description }}
                  </p>
                </div>
                <div class="setting-action setting-action--numeric">
                  <ElSwitch
                    v-model="jwtExpiresSetting.enabled"
                    active-text="Custom"
                    inactive-text="Env default"
                  />
                  <ElInputNumber
                    v-model="jwtExpiresHours"
                    :min="1"
                    :max="720"
                    :step="1"
                    :disabled="!jwtExpiresSetting.enabled"
                    controls-position="right"
                  />
                  <span class="field-hint">hours</span>
                </div>
              </div>

              <div v-if="guestExpiresSetting" class="setting-item setting-item--numeric">
                <div class="setting-info">
                  <div class="setting-header">
                    <h3 class="setting-title">Guest session expiry</h3>
                    <ElTag type="info" size="small">
                      {{ guestExpiresHours }} hour{{ guestExpiresHours === 1 ? '' : 's' }}
                    </ElTag>
                  </div>
                  <p class="setting-description">
                    {{ guestExpiresSetting.description }}
                  </p>
                </div>
                <div class="setting-action setting-action--numeric">
                  <ElSwitch
                    v-model="guestExpiresSetting.enabled"
                    active-text="Custom"
                    inactive-text="Default (2h)"
                  />
                  <ElInputNumber
                    v-model="guestExpiresHours"
                    :min="1"
                    :max="24"
                    :step="1"
                    :disabled="!guestExpiresSetting.enabled"
                    controls-position="right"
                  />
                  <span class="field-hint">hours</span>
                </div>
              </div>

              <div v-if="!jwtExpiresSetting && !guestExpiresSetting" class="empty-state">
                <ElEmpty description="No auth settings found" />
              </div>
            </div>
          </ElTabPane>

          <ElTabPane label="Sessions" name="sessions">
            <p class="tab-intro">
              Control active sessions, device limits, and inactivity logout. Token renewal uses a sliding window while
              the app is open. Changes apply within about 30 seconds without restarting the server.
            </p>

            <div class="settings-list">
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

              <div v-if="idleEnforcementSetting" class="setting-item">
                <div class="setting-info">
                  <div class="setting-header">
                    <h3 class="setting-title">Inactivity logout</h3>
                    <ElTag :type="idleEnforcementSetting.enabled ? 'success' : 'info'" size="small">
                      {{ idleEnforcementSetting.enabled ? 'Enabled' : 'Disabled' }}
                    </ElTag>
                  </div>
                  <p class="setting-description">
                    {{ idleEnforcementSetting.description }}
                  </p>
                </div>
                <div class="setting-action">
                  <ElSwitch
                    v-model="idleEnforcementSetting.enabled"
                    active-text="ON"
                    inactive-text="OFF"
                  />
                </div>
              </div>

              <div v-if="idleEnforcementSetting" class="nested-settings">
                <div v-if="idleLogoutSetting" class="setting-item setting-item--numeric setting-item--nested">
                  <div class="setting-info">
                    <div class="setting-header">
                      <h3 class="setting-title">Idle logout timeout</h3>
                      <ElTag type="info" size="small">
                        {{ idleLogoutMinutes }} min
                      </ElTag>
                    </div>
                    <p class="setting-description">
                      {{ idleLogoutSetting.description }}
                    </p>
                  </div>
                  <div class="setting-action setting-action--numeric">
                    <ElInputNumber
                      v-model="idleLogoutMinutes"
                      :min="5"
                      :max="480"
                      :step="5"
                      :disabled="!idleEnforcementSetting.enabled"
                      controls-position="right"
                    />
                    <span class="field-hint">minutes</span>
                  </div>
                </div>

                <div v-if="idleWarningSetting" class="setting-item setting-item--numeric setting-item--nested">
                  <div class="setting-info">
                    <div class="setting-header">
                      <h3 class="setting-title">Idle warning before logout</h3>
                      <ElTag type="info" size="small">
                        {{ idleWarningMinutes }} min
                      </ElTag>
                    </div>
                    <p class="setting-description">
                      {{ idleWarningSetting.description }}
                    </p>
                  </div>
                  <div class="setting-action setting-action--numeric">
                    <ElInputNumber
                      v-model="idleWarningMinutes"
                      :min="1"
                      :max="60"
                      :step="1"
                      :disabled="!idleEnforcementSetting.enabled"
                      controls-position="right"
                    />
                    <span class="field-hint">minutes before logout</span>
                  </div>
                </div>

                <div v-if="idleRenewalSetting" class="setting-item setting-item--numeric setting-item--nested">
                  <div class="setting-info">
                    <div class="setting-header">
                      <h3 class="setting-title">Activity window for session renewal</h3>
                      <ElTag type="info" size="small">
                        {{ idleRenewalMinutes }} min
                      </ElTag>
                    </div>
                    <p class="setting-description">
                      {{ idleRenewalSetting.description }}
                    </p>
                  </div>
                  <div class="setting-action setting-action--numeric">
                    <ElInputNumber
                      v-model="idleRenewalMinutes"
                      :min="1"
                      :max="60"
                      :step="1"
                      :disabled="!idleEnforcementSetting.enabled"
                      controls-position="right"
                    />
                    <span class="field-hint">minutes</span>
                  </div>
                </div>
              </div>

              <div
                v-if="!maxDevicesSetting && !idleEnforcementSetting"
                class="empty-state"
              >
                <ElEmpty description="No session settings found" />
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
const jwtExpiresHours = ref(24)
const guestExpiresHours = ref(2)
const idleLogoutMinutes = ref(30)
const idleWarningMinutes = ref(5)
const idleRenewalMinutes = ref(5)

const SYSTEM_SETTING_PREFIX = 'rate_limit_'
const AUTH_MAX_DEVICES_MODULE = 'auth_max_devices'
const AUTH_JWT_EXPIRES_MODULE = 'auth_jwt_expires_seconds'
const AUTH_GUEST_EXPIRES_MODULE = 'auth_guest_expires_seconds'
const AUTH_IDLE_ENFORCEMENT_MODULE = 'auth_idle_enforcement'
const AUTH_IDLE_LOGOUT_MODULE = 'auth_idle_logout_seconds'
const AUTH_IDLE_WARNING_MODULE = 'auth_idle_warning_seconds'
const AUTH_IDLE_RENEWAL_MODULE = 'auth_idle_renewal_threshold_seconds'

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
    module: AUTH_JWT_EXPIRES_MODULE,
    enabled: true,
    config_value: '86400',
    description:
      'How long a login session and JWT remain valid before expiring. While the app is open, the session is extended on each activity check. Falls back to JWT_EXPIRES_IN_SECONDS in .env when disabled.'
  },
  {
    module: AUTH_GUEST_EXPIRES_MODULE,
    enabled: true,
    config_value: '7200',
    description:
      'How long a guest (public) login session remains valid. Guest sessions are not extended by the normal session guard.'
  },
  {
    module: AUTH_MAX_DEVICES_MODULE,
    enabled: true,
    config_value: '5',
    description:
      'Maximum simultaneous logged-in devices per user. Re-login on the same device replaces that session. Set to 0 or turn off the limit for unlimited sessions.'
  },
  {
    module: AUTH_IDLE_ENFORCEMENT_MODULE,
    enabled: true,
    description:
      'Log users out after a period of inactivity and show a stay-logged-in prompt before logout.'
  },
  {
    module: AUTH_IDLE_LOGOUT_MODULE,
    enabled: true,
    config_value: '1800',
    description:
      'Total inactivity time before the user is logged out automatically.'
  },
  {
    module: AUTH_IDLE_WARNING_MODULE,
    enabled: true,
    config_value: '300',
    description:
      'How long before idle logout to show the stay-logged-in prompt.'
  },
  {
    module: AUTH_IDLE_RENEWAL_MODULE,
    enabled: true,
    config_value: '300',
    description:
      'Only extend the server session if the user was active within this recent window.'
  }
]

const formatModuleName = (module: string): string => {
  const labels: Record<string, string> = {
    rate_limit_login: 'Login rate limit',
    rate_limit_otp: 'OTP rate limit',
    auth_max_devices: 'Max login sessions per user',
    auth_jwt_expires_seconds: 'Login session / token expiry',
    auth_guest_expires_seconds: 'Guest session expiry',
    auth_idle_enforcement: 'Inactivity logout',
    auth_idle_logout_seconds: 'Idle logout timeout',
    auth_idle_warning_seconds: 'Idle warning before logout',
    auth_idle_renewal_threshold_seconds: 'Activity window for session renewal'
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

const jwtExpiresSetting = computed(() =>
  settings.value.find((s) => s.module === AUTH_JWT_EXPIRES_MODULE)
)

const guestExpiresSetting = computed(() =>
  settings.value.find((s) => s.module === AUTH_GUEST_EXPIRES_MODULE)
)

const idleEnforcementSetting = computed(() =>
  settings.value.find((s) => s.module === AUTH_IDLE_ENFORCEMENT_MODULE)
)

const idleLogoutSetting = computed(() =>
  settings.value.find((s) => s.module === AUTH_IDLE_LOGOUT_MODULE)
)

const idleWarningSetting = computed(() =>
  settings.value.find((s) => s.module === AUTH_IDLE_WARNING_MODULE)
)

const idleRenewalSetting = computed(() =>
  settings.value.find((s) => s.module === AUTH_IDLE_RENEWAL_MODULE)
)

const secondsToHours = (raw: string | null | undefined, fallbackHours: number) => {
  const parsed = parseInt(String(raw ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackHours
  return Math.max(1, Math.round(parsed / 3600))
}

const hoursToSeconds = (hours: number) => String(Math.max(1, Math.round(hours)) * 3600)

const secondsToMinutes = (raw: string | null | undefined, fallbackMinutes: number) => {
  const parsed = parseInt(String(raw ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMinutes
  return Math.max(1, Math.round(parsed / 60))
}

const minutesToSeconds = (minutes: number) => String(Math.max(1, Math.round(minutes)) * 60)

const syncAuthValuesFromSettings = () => {
  const maxSetting = settings.value.find((s) => s.module === AUTH_MAX_DEVICES_MODULE)
  const parsedMax = parseInt(String(maxSetting?.config_value ?? '5'), 10)
  maxDevicesValue.value = Number.isNaN(parsedMax) ? 5 : parsedMax

  const jwtSetting = settings.value.find((s) => s.module === AUTH_JWT_EXPIRES_MODULE)
  jwtExpiresHours.value = secondsToHours(jwtSetting?.config_value, 24)

  const guestSetting = settings.value.find((s) => s.module === AUTH_GUEST_EXPIRES_MODULE)
  guestExpiresHours.value = secondsToHours(guestSetting?.config_value, 2)

  const idleLogout = settings.value.find((s) => s.module === AUTH_IDLE_LOGOUT_MODULE)
  idleLogoutMinutes.value = secondsToMinutes(idleLogout?.config_value, 30)

  const idleWarning = settings.value.find((s) => s.module === AUTH_IDLE_WARNING_MODULE)
  idleWarningMinutes.value = secondsToMinutes(idleWarning?.config_value, 5)

  const idleRenewal = settings.value.find((s) => s.module === AUTH_IDLE_RENEWAL_MODULE)
  idleRenewalMinutes.value = secondsToMinutes(idleRenewal?.config_value, 5)
}

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
      syncAuthValuesFromSettings()
    } else {
      ElMessage.error(response.message || 'Failed to load settings')
    }
  } catch (error) {
    console.error('Error loading system settings:', error)
    ElMessage.error('Failed to load settings')
    settings.value = defaultSettings.map((s) => ({ ...s, saving: false }))
    syncAuthValuesFromSettings()
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

const saveAllSettings = async () => {
  saving.value = true
  try {
    const maxSetting = maxDevicesSetting.value
    if (maxSetting) {
      maxSetting.config_value = maxSetting.enabled
        ? String(maxDevicesValue.value)
        : '0'
    }

    const jwtSetting = jwtExpiresSetting.value
    if (jwtSetting && jwtSetting.enabled) {
      jwtSetting.config_value = hoursToSeconds(jwtExpiresHours.value)
    }

    const guestSetting = guestExpiresSetting.value
    if (guestSetting && guestSetting.enabled) {
      guestSetting.config_value = hoursToSeconds(guestExpiresHours.value)
    }

    const idleLogout = idleLogoutSetting.value
    if (idleLogout) {
      idleLogout.config_value = minutesToSeconds(idleLogoutMinutes.value)
    }

    const idleWarning = idleWarningSetting.value
    if (idleWarning) {
      idleWarning.config_value = minutesToSeconds(idleWarningMinutes.value)
    }

    const idleRenewal = idleRenewalSetting.value
    if (idleRenewal) {
      idleRenewal.config_value = minutesToSeconds(idleRenewalMinutes.value)
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

.field-hint {
  font-size: 12px;
  color: #909399;
}

.setting-item--numeric {
  margin-top: 0;
}

.nested-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: -4px 0 4px 24px;
  padding-left: 16px;
  border-left: 2px solid #e4e7ed;
}

.setting-item--nested {
  margin-top: 0;
}

.setting-item--nested .setting-title {
  font-size: 15px;
  font-weight: 500;
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
