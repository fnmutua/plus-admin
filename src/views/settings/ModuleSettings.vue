<template>
  <div class="module-settings-container">
    <ElCard class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>Module Settings</h2>
          <p class="subtitle">Enable or disable features for different modules</p>
        </div>
      </template>

      <div v-loading="loading" class="settings-content">
        <ElTabs v-model="activeTab" class="settings-tabs">
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
import { ref, onMounted, computed } from 'vue'
import { ElCard, ElSwitch, ElTag, ElButton, ElEmpty, ElMessage, ElTabs, ElTabPane } from 'element-plus'
import { getAllSettings, bulkUpdateSettings, type ModuleSetting } from '@/api/settings'

const loading = ref(false)
const saving = ref(false)
const settings = ref<Array<ModuleSetting & { saving?: boolean }>>([])
const activeTab = ref('grievances')

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
  }
]

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

// Other settings (auth, user, feedback, etc.) - explicitly excludes grievances and incidents
const otherSettings = computed(() => {
  return settings.value.filter(s => {
    const module = s.module || ''
    // Exclude grievances and incidents - only include other modules
    return !module.startsWith('sms_grievance_') && 
           !module.startsWith('sms_incident_') &&
           module !== 'sms_grievance' &&
           module !== 'sms_incident'
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
        // Merge with defaults to ensure all modules are shown
        const existingModules = new Set(response.data.map(s => s.module))
        const missingDefaults = defaultSettings.filter(s => !existingModules.has(s.module))
        settings.value = [
          ...response.data.map(s => ({ ...s, saving: false })),
          ...missingDefaults.map(s => ({ ...s, saving: false }))
        ]
      }
    } else {
      ElMessage.error(response.message || 'Failed to load settings')
    }
  } catch (error: any) {
    console.error('Error loading settings:', error)
    ElMessage.error('Failed to load settings')
    // Show defaults on error
    settings.value = defaultSettings.map(s => ({ ...s, saving: false }))
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
    const settingsToSave = settings.value.map(s => ({
      module: s.module,
      enabled: s.enabled,
      description: s.description
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

