<template>
  <div class="module-settings-container">
    <ElCard class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>SMS Settings</h2>
          <p class="subtitle">Configure SMS balance, alerts, and workflow notification toggles</p>
        </div>
      </template>

      <div v-loading="loading" class="settings-content">
        <ElTabs v-model="activeTab" class="settings-tabs">
          <!-- SMS Balance Tab -->
          <ElTabPane label="SMS Balance" name="balance">
            <div class="balance-tab">
              <div class="balance-card">
                <div class="balance-card-header">
                  <div>
                    <h3 class="balance-title">Advanta bulk SMS credits</h3>
                    <p class="balance-description">
                      Check remaining credits and configure daily low-balance alerts for support users.
                    </p>
                  </div>
                  <ElButton type="primary" :loading="smsBalanceLoading" @click="fetchSmsBalance">
                    Check balance
                  </ElButton>
                </div>

                <div class="balance-result">
                  <span class="balance-result-label">Credits remaining</span>
                  <span v-if="smsBalance != null" class="balance-result-value">
                    {{ smsBalance.toLocaleString() }}
                  </span>
                  <span v-else class="balance-result-placeholder">—</span>
                  <ElTag
                    v-if="smsBalance != null"
                    :type="smsBalanceLow ? 'danger' : 'success'"
                    size="small"
                    effect="plain"
                  >
                    {{ smsBalanceLow ? 'Low' : 'OK' }}
                  </ElTag>
                </div>
                <p v-if="smsBalanceCheckedAt" class="balance-meta">
                  Last checked: {{ smsBalanceCheckedAt }}
                </p>
              </div>

              <div class="balance-card alert-settings-card">
                <h3 class="balance-title">Low balance alerts</h3>
                <p class="balance-description">
                  When enabled, KeSMIS checks the balance daily and emails/SMSs support users if credits fall below the threshold.
                </p>

                <div class="alert-form">
                  <div class="alert-form-row">
                    <span class="alert-form-label">Enable alerts</span>
                    <ElSwitch
                      v-model="balanceAlertForm.enabled"
                      active-text="ON"
                      inactive-text="OFF"
                    />
                  </div>

                  <div class="alert-form-row">
                    <span class="alert-form-label">Alert threshold (credits)</span>
                    <ElInputNumber
                      v-model="balanceAlertForm.threshold"
                      :min="1"
                      :step="50"
                      controls-position="right"
                      style="width: 180px"
                    />
                  </div>

                  <div class="alert-form-row">
                    <span class="alert-form-label">Daily check time</span>
                    <ElTimePicker
                      v-model="balanceAlertForm.sendTime"
                      format="HH:mm"
                      value-format="HH:mm"
                      placeholder="08:00"
                      style="width: 180px"
                    />
                  </div>

                  <div class="alert-form-row">
                    <span class="alert-form-label">Timezone</span>
                    <ElInput v-model="balanceAlertForm.timezone" disabled style="width: 220px" />
                  </div>
                </div>
              </div>
            </div>
          </ElTabPane>

          <!-- Grievances Tab -->
          <ElTabPane label="Grievances" name="grievances">
            <div class="settings-list">
              <div
                v-for="setting in grievanceSettings"
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
                  <p v-else class="setting-description text-muted">
                    No description available
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
              
              <div v-if="grievanceSettings.length === 0" class="empty-state">
                <ElEmpty description="No grievance settings found" />
              </div>
            </div>
          </ElTabPane>

          <!-- Incidents Tab -->
          <ElTabPane label="Incidents" name="incidents">
            <div class="settings-list">
              <div
                v-for="setting in incidentSettings"
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
                  <p v-else class="setting-description text-muted">
                    No description available
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
              
              <div v-if="incidentSettings.length === 0" class="empty-state">
                <ElEmpty description="No incident settings found" />
              </div>
            </div>
          </ElTabPane>

          <!-- Other Settings Tab -->
          <ElTabPane label="Other Settings" name="other">
            <div class="settings-list">
              <div
                v-for="setting in otherSettings"
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
                  <p v-else class="setting-description text-muted">
                    No description available
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
              
              <div v-if="otherSettings.length === 0" class="empty-state">
                <ElEmpty description="No other settings found" />
              </div>
            </div>
          </ElTabPane>
        </ElTabs>

        <div v-if="settings.length === 0 && !loading" class="empty-state">
          <ElEmpty description="No settings found" />
        </div>
      </div>

      <div class="card-footer">
        <ElButton
          type="primary"
          :loading="saving"
          @click="saveAllSettings"
        >
          Save All Changes
        </ElButton>
        <ElButton @click="refreshSettings">Refresh</ElButton>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElCard,
  ElSwitch,
  ElTag,
  ElButton,
  ElEmpty,
  ElMessage,
  ElTabs,
  ElTabPane,
  ElInputNumber,
  ElTimePicker,
  ElInput,
} from 'element-plus'
import { getAllSettings, bulkUpdateSettings, getSmsBalance, type ModuleSetting } from '@/api/settings'

const SMS_BALANCE_MODULE = 'sms_balance_alert'

/** Managed on System Settings — do not show or bulk-save from Module (SMS) settings */
const isSystemSettingModule = (module?: string | null) => {
  if (!module || typeof module !== 'string') return false
  return module.startsWith('rate_limit_') || module.startsWith('auth_')
}

const loading = ref(false)
const saving = ref(false)
const smsBalanceLoading = ref(false)
const smsBalance = ref<number | null>(null)
const smsBalanceLow = ref(false)
const smsBalanceCheckedAt = ref('')
const settings = ref<Array<ModuleSetting & { saving?: boolean }>>([])
const activeTab = ref('balance')

const balanceAlertForm = reactive({
  enabled: true,
  threshold: 500,
  sendTime: '08:00',
  timezone: 'Africa/Nairobi',
})

// Default SMS module settings
const defaultSettings = [
  {
    module: 'sms_grievance_county',
    enabled: true,
    description: 'Enable/disable SMS notifications for grievances at county level'
  },
  {
    module: 'sms_grievance_national',
    enabled: true,
    description: 'Enable/disable SMS notifications for grievances at national level'
  },
  {
    module: 'sms_incident_county',
    enabled: true,
    description: 'Enable/disable SMS notifications for incidents at county level'
  },
  {
    module: 'sms_incident_national',
    enabled: true,
    description: 'Enable/disable SMS notifications for incidents at national level'
  },
  {
    module: 'sms_auth',
    enabled: true,
    description: 'Enable/disable SMS notifications for authentication (OTP, registration, etc.)'
  },
  {
    module: 'sms_user',
    enabled: true,
    description: 'Enable/disable SMS notifications for user management (activation, deactivation)'
  },
  {
    module: 'sms_feedback',
    enabled: true,
    description: 'Enable/disable SMS notifications for feedback module'
  },
  {
    module: 'sms_data_request',
    enabled: true,
    description: 'Enable/disable SMS notifications to support officers for new data requests'
  },
  {
    module: SMS_BALANCE_MODULE,
    enabled: true,
    description: 'Daily low bulk SMS balance check — notifies support users when credits fall below threshold',
    config_value: JSON.stringify({
      threshold: 500,
      hour: 8,
      minute: 0,
      timezone: 'Africa/Nairobi',
    }),
  },
]

const parseBalanceAlertConfig = (configValue?: string | null) => {
  if (!configValue) return null
  try {
    const parsed = JSON.parse(configValue)
    const threshold = Number(parsed.threshold)
    const hour = Number(parsed.hour)
    const minute = Number(parsed.minute)
    return {
      threshold: Number.isFinite(threshold) && threshold > 0 ? threshold : 500,
      sendTime: `${String(Number.isFinite(hour) ? hour : 8).padStart(2, '0')}:${String(Number.isFinite(minute) ? minute : 0).padStart(2, '0')}`,
      timezone: parsed.timezone ? String(parsed.timezone) : 'Africa/Nairobi',
    }
  } catch {
    return null
  }
}

const syncBalanceAlertFormFromSettings = () => {
  const row = settings.value.find((s) => s.module === SMS_BALANCE_MODULE)
  if (!row) return
  balanceAlertForm.enabled = row.enabled !== false
  const parsed = parseBalanceAlertConfig(row.config_value)
  if (parsed) {
    balanceAlertForm.threshold = parsed.threshold
    balanceAlertForm.sendTime = parsed.sendTime
    balanceAlertForm.timezone = parsed.timezone
  }
}

const applyBalanceAlertFormToSettings = () => {
  let row = settings.value.find((s) => s.module === SMS_BALANCE_MODULE)
  if (!row) {
    row = {
      module: SMS_BALANCE_MODULE,
      enabled: true,
      description: defaultSettings.find((s) => s.module === SMS_BALANCE_MODULE)?.description,
      config_value: null,
      saving: false,
    }
    settings.value.push(row)
  }

  const [hourStr, minuteStr] = String(balanceAlertForm.sendTime || '08:00').split(':')
  const hour = Number.parseInt(hourStr, 10)
  const minute = Number.parseInt(minuteStr, 10)

  row.enabled = balanceAlertForm.enabled
  row.config_value = JSON.stringify({
    threshold: balanceAlertForm.threshold,
    hour: Number.isFinite(hour) ? hour : 8,
    minute: Number.isFinite(minute) ? minute : 0,
    timezone: balanceAlertForm.timezone || 'Africa/Nairobi',
  })
}

const formatModuleName = (module: string): string => {
  return module
    .replace(/sms_/g, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Grievance settings
const grievanceSettings = computed(() => {
  return settings.value.filter(s => s.module.startsWith('sms_grievance_'))
})

// Incident settings
const incidentSettings = computed(() => {
  return settings.value.filter(s => s.module.startsWith('sms_incident_'))
})

// Other settings (SMS auth, user, feedback, etc.) — excludes grievances, incidents, balance, system auth
const otherSettings = computed(() => {
  return settings.value.filter(s => {
    const module = s.module || ''
    return !module.startsWith('sms_grievance_') &&
           !module.startsWith('sms_incident_') &&
           module !== 'sms_grievance' &&
           module !== 'sms_incident' &&
           module !== SMS_BALANCE_MODULE &&
           !isSystemSettingModule(module)
  })
})

const loadSettings = async () => {
  loading.value = true
  try {
    const response = await getAllSettings()
    if (response.code === '0000') {
      // If no settings exist, initialize with defaults
      if (response.data.length === 0) {
        settings.value = defaultSettings.map(s => ({ ...s, saving: false }))
      } else {
        const apiSettings = response.data.filter(
          (s) => !isSystemSettingModule(s.module)
        )
        const existingModules = new Set(apiSettings.map(s => s.module))
        const missingDefaults = defaultSettings.filter(s => !existingModules.has(s.module))
        settings.value = [
          ...apiSettings.map(s => ({ ...s, saving: false })),
          ...missingDefaults.map(s => ({ ...s, saving: false }))
        ]
      }
      syncBalanceAlertFormFromSettings()
    } else {
      ElMessage.error(response.message || 'Failed to load settings')
    }
  } catch (error: any) {
    console.error('Error loading settings:', error)
    ElMessage.error('Failed to load settings')
    // Show defaults on error
    settings.value = defaultSettings.map(s => ({ ...s, saving: false }))
    syncBalanceAlertFormFromSettings()
  } finally {
    loading.value = false
  }
}

const handleToggle = async (setting: ModuleSetting & { saving?: boolean }) => {
  // Mark as saving
  setting.saving = true
  
  try {
    // Update immediately for better UX
    // The actual save will happen on "Save All Changes"
    ElMessage.success(`${formatModuleName(setting.module)} ${setting.enabled ? 'enabled' : 'disabled'}`)
  } catch (error: any) {
    console.error('Error toggling setting:', error)
    // Revert on error
    setting.enabled = !setting.enabled
    ElMessage.error('Failed to update setting')
  } finally {
    setting.saving = false
  }
}

const saveAllSettings = async () => {
  saving.value = true
  try {
    applyBalanceAlertFormToSettings()

    const settingsToSave = settings.value
      .filter((s) => !isSystemSettingModule(s.module))
      .map(s => ({
      module: s.module,
      enabled: s.enabled,
      description: s.description,
      ...(s.config_value != null ? { config_value: s.config_value } : {}),
    }))
    
    const response = await bulkUpdateSettings(settingsToSave)
    if (response.code === '0000') {
      ElMessage.success('All settings saved successfully')
      // Reload to get updated data
      await loadSettings()
    } else {
      ElMessage.error(response.message || 'Failed to save settings')
    }
  } catch (error: any) {
    console.error('Error saving settings:', error)
    ElMessage.error('Failed to save settings')
  } finally {
    saving.value = false
  }
}

const refreshSettings = () => {
  loadSettings()
}

const fetchSmsBalance = async () => {
  smsBalanceLoading.value = true
  try {
    const response = await getSmsBalance()
    if (response.code === '0000' && response.data) {
      smsBalance.value = response.data.balance
      smsBalanceLow.value = response.data.low
      if (response.data.threshold != null) {
        balanceAlertForm.threshold = response.data.threshold
      }
      if (response.data.sendTime) {
        balanceAlertForm.sendTime = response.data.sendTime
      }
      if (response.data.timezone) {
        balanceAlertForm.timezone = response.data.timezone
      }
      if (typeof response.data.alertEnabled === 'boolean') {
        balanceAlertForm.enabled = response.data.alertEnabled
      }
      smsBalanceCheckedAt.value = new Date().toLocaleString()
      if (response.data.low) {
        ElMessage.warning(`Bulk SMS credits are low (${response.data.balance.toLocaleString()} remaining)`)
      } else {
        ElMessage.success(`${response.data.balance.toLocaleString()} credits remaining`)
      }
    } else {
      ElMessage.error(response.message || 'Failed to fetch SMS balance')
    }
  } catch (error: any) {
    console.error('Error fetching SMS balance:', error)
    ElMessage.error(error?.response?.data?.message || error?.message || 'Failed to fetch SMS balance')
  } finally {
    smsBalanceLoading.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="less">
.module-settings-container {
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

.balance-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.balance-card {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.balance-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.balance-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.balance-description {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.balance-result {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.balance-result-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.balance-result-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.balance-result-placeholder {
  font-size: 28px;
  color: #c0c4cc;
}

.balance-meta {
  margin: 10px 0 0;
  font-size: 12px;
  color: #909399;
}

.alert-settings-card {
  background: #fff;
}

.alert-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.alert-form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.alert-form-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  min-width: 180px;
}

.settings-content {
  min-height: 200px;
}

.settings-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }

  :deep(.el-tabs__item) {
    font-size: 15px;
    font-weight: 500;
    padding: 0 24px;
  }

  :deep(.el-tabs__content) {
    padding: 0;
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

  &.text-muted {
    color: #909399;
    font-style: italic;
  }
}

.setting-action {
  display: flex;
  align-items: center;
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
  .balance-card-header,
  .alert-form-row {
    flex-direction: column;
    align-items: flex-start;
  }

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

