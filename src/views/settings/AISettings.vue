<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  ElCard, ElTabs, ElTabPane, ElSwitch, ElSelect, ElOption, ElInput,
  ElInputNumber, ElButton, ElTag, ElMessage, ElMessageBox, ElAlert, ElEmpty, ElTooltip
} from 'element-plus'
import { Icon } from '@iconify/vue'
import {
  getAISettings, updateAISettings, getAIHealth, getAIModels, getAIStats, reindexDocuments
} from '@/api/ai'
import type { AISetting, AIHealth, AIStats, AIProvider, AISettingChange } from '@/api/ai/types'

const loading = ref(true)
const saving = ref(false)
const activeTab = ref('chat')

const settings = ref<AISetting[]>([])
const providers = ref<AIProvider[]>([])
const health = ref<AIHealth | null>(null)
const stats = ref<AIStats | null>(null)

/** Edited copy, keyed by setting. Compared against `settings` to find changes. */
const draft = reactive<Record<string, { value: any; overridden: boolean }>>({})

/** Model names per provider, fetched live so the dropdown matches reality. */
const modelOptions = reactive<Record<string, string[]>>({})
const modelsLoading = reactive<Record<string, boolean>>({})

/**
 * Provider and model are picked straight from a dropdown — no Env/Custom
 * switch. Choosing a value is the whole interaction; the environment value is
 * still reachable through the "Use environment value" link.
 */
const DIRECT_KEYS = ['ai_provider', 'ai_embed_provider', 'ai_model', 'ai_embed_model']
const isDirect = (key: string) => DIRECT_KEYS.includes(key)

/** Which provider setting governs each model setting. */
const PROVIDER_OF: Record<string, string> = {
  ai_model: 'ai_provider',
  ai_embed_model: 'ai_embed_provider'
}

const GROUPS: { name: string; label: string; icon: string; hint: string }[] = [
  { name: 'chat', label: 'Chat', icon: 'material-symbols:forum-outline',
    hint: 'Which service answers questions, and how.' },
  { name: 'embeddings', label: 'Embeddings', icon: 'material-symbols:polyline-outline',
    hint: 'How document text is turned into vectors. Changing these requires reindexing.' },
  { name: 'retrieval', label: 'Retrieval', icon: 'material-symbols:search',
    hint: 'How much context each answer is built from.' },
  { name: 'indexing', label: 'Indexing', icon: 'material-symbols:database-outline',
    hint: 'How documents are split before being stored.' },
  { name: 'general', label: 'General', icon: 'material-symbols:tune',
    hint: 'Service-wide switches.' }
]

const groupOf = (name: string) => settings.value.filter((setting) => setting.group === name)

const changed = computed(() =>
  settings.value.filter((setting) => {
    const edit = draft[setting.key]
    if (!edit) return false
    if (edit.overridden !== setting.overridden) return true
    return edit.overridden && String(edit.value) !== String(setting.value)
  })
)

const needsReindex = computed(() => changed.value.some((setting) => setting.requiresReindex))

const providerLabel = (id: string) => providers.value.find((p) => p.id === id)?.name || id

/** A provider the server holds no key for cannot be selected. */
const providerUnavailable = (id: string) =>
  providers.value.some((p) => p.id === id && !p.isAvailable)

/** Credential settings are edited separately: one key at a time, write-only. */
const credentialSettings = computed(() => settings.value.filter((setting) => setting.type === 'secret'))
const keyDraft = reactive<Record<string, string>>({})
const keySaving = reactive<Record<string, boolean>>({})

const saveKey = async (setting: AISetting) => {
  const value = (keyDraft[setting.key] || '').trim()
  if (!value) return

  await writeKey(setting, { value, overridden: true }, 'Key saved')
  keyDraft[setting.key] = ''
}

/** Drop the stored key and go back to the environment variable. */
const useEnvKey = async (setting: AISetting) => {
  try {
    await ElMessageBox.confirm(
      `The key in ${setting.envVar} will be used instead.`,
      `Use the environment key for ${setting.label}?`,
      { type: 'warning', confirmButtonText: 'Use environment key' }
    )
  } catch {
    return
  }
  await writeKey(setting, { overridden: false }, 'Stored key removed')
}

/**
 * Revoke: clear the credential and keep the environment variable from filling
 * the gap, which is what you want when a key has leaked and the deployment
 * still has it in its environment.
 */
const revokeKey = async (setting: AISetting) => {
  const extra = setting.envConfigured
    ? ` The key in ${setting.envVar} will be ignored, not used as a fallback.`
    : ''

  try {
    await ElMessageBox.confirm(
      `This provider will stop answering questions until a new key is saved here.${extra}`
        + ' Revoke it in the provider\'s own console as well — this only stops this application using it.',
      `Revoke ${setting.label}?`,
      { type: 'warning', confirmButtonText: 'Revoke', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }
  await writeKey(setting, { revoked: true }, 'Key revoked')
}

/** Allow the environment key to be used again after a revoke. */
const unrevokeKey = (setting: AISetting) =>
  writeKey(setting, { overridden: false }, 'Revocation lifted')

async function writeKey(setting: AISetting, change: Partial<AISettingChange>, done: string) {
  keySaving[setting.key] = true
  try {
    const response = await updateAISettings([{ key: setting.key, ...change }])
    if (response.success) {
      ElMessage.success(`${setting.label}: ${done.toLowerCase()}`)
      await load()
    }
  } catch (error: any) {
    ElMessage.error(error?.message || 'Could not change the credential')
  } finally {
    keySaving[setting.key] = false
  }
}

const seedDraft = () => {
  for (const setting of settings.value) {
    draft[setting.key] = { value: setting.value, overridden: setting.overridden }
  }
}

const load = async () => {
  loading.value = true
  try {
    const [settingsResponse, healthResponse] = await Promise.all([
      getAISettings(),
      getAIHealth().catch(() => null)
    ])

    if (settingsResponse.success && settingsResponse.data) {
      settings.value = settingsResponse.data.settings
      providers.value = settingsResponse.data.providers
      seedDraft()
    }
    if (healthResponse?.success) health.value = healthResponse.data ?? null

    // Non-blocking extras.
    getAIStats().then((r) => { if (r.success) stats.value = r.data ?? null }).catch(() => {})
    loadModelsFor(String(draft.ai_provider?.value ?? ''))
    loadModelsFor(String(draft.ai_embed_provider?.value ?? ''))
  } catch (error) {
    console.error('Failed to load AI settings:', error)
    ElMessage.error('Could not load AI settings')
  } finally {
    loading.value = false
  }
}

const loadModelsFor = async (provider: string, force = false) => {
  if (!provider) return
  if (modelOptions[provider] && !force) return

  modelsLoading[provider] = true
  try {
    const response = await getAIModels(provider)
    modelOptions[provider] = (response.data || []).map((model) => model.id)
  } catch {
    modelOptions[provider] = []
  } finally {
    modelsLoading[provider] = false
  }
}

const providerValue = (modelKey: string) => String(draft[PROVIDER_OF[modelKey]]?.value ?? '')

/** Models on offer for a model setting, driven by its provider's current draft value. */
const modelsFor = (modelKey: string): string[] => {
  const list = modelOptions[providerValue(modelKey)] || []
  const current = String(draft[modelKey]?.value ?? '')
  // Ollama reports "llama3.2:latest" while the environment may say "llama3.2".
  // Keep the configured value selectable rather than showing an empty box.
  return current && !list.includes(current) ? [current, ...list] : list
}

const modelsPending = (modelKey: string) => Boolean(modelsLoading[providerValue(modelKey)])

/** Re-query after an `ollama pull`, without reloading the page. */
const refreshModels = (modelKey: string) => loadModelsFor(providerValue(modelKey), true)

const onProviderChange = (providerKey: string) => {
  const provider = String(draft[providerKey]?.value ?? '')
  draft[providerKey].overridden = true
  loadModelsFor(provider)

  // The previously chosen model belongs to the old provider; clear it so the
  // user cannot save a pairing the provider will reject.
  const modelKey = Object.keys(PROVIDER_OF).find((key) => PROVIDER_OF[key] === providerKey)
  if (modelKey && draft[modelKey]) {
    draft[modelKey].value = ''
    draft[modelKey].overridden = true
  }
}

const onModelChange = (modelKey: string) => {
  draft[modelKey].overridden = true
}

const revert = (setting: AISetting) => {
  draft[setting.key] = { value: setting.envValue, overridden: false }
  // Reverting a provider changes which model list applies; reverting a model
  // does not, so only provider keys trigger a refetch.
  if (setting.values) loadModelsFor(String(setting.envValue))
}

const save = async () => {
  if (!changed.value.length) return

  // Switching provider clears the model; saving that blank would be rejected
  // by the server, so catch it here with a message that points at the field.
  const blank = changed.value.find(
    (setting) => isDirect(setting.key) && !String(draft[setting.key].value ?? '').trim()
  )
  if (blank) {
    ElMessage.warning(`Choose a value for "${blank.label}" before saving`)
    return
  }

  if (needsReindex.value) {
    const confirmed = await ElMessageBox.confirm(
      'These changes alter how documents are turned into vectors. Existing vectors '
      + 'will no longer match and searches will fall back to keyword results until '
      + 'you reindex. Continue?',
      'Reindex required',
      { confirmButtonText: 'Save anyway', cancelButtonText: 'Cancel', type: 'warning' }
    ).catch(() => false)
    if (!confirmed) return
  }

  saving.value = true
  try {
    const payload: AISettingChange[] = changed.value.map((setting) => {
      const edit = draft[setting.key]
      return edit.overridden
        ? { key: setting.key, value: edit.value, overridden: true }
        : { key: setting.key, overridden: false }
    })

    const response = await updateAISettings(payload)
    if (response.success && response.data) {
      settings.value = response.data.settings
      health.value = response.data.health
      seedDraft()
      ElMessage.success('AI settings saved — applied immediately, no restart needed')
    } else {
      ElMessage.error(response.message || 'Could not save settings')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || 'Could not save settings')
  } finally {
    saving.value = false
  }
}

const discard = () => {
  seedDraft()
  ElMessage.info('Changes discarded')
}

const reindexing = ref(false)
const runReindex = async (force: boolean) => {
  reindexing.value = true
  try {
    // The shared axios interceptor already toasts the server message, which is
    // more specific than anything added here ("Indexing 3 document(s)…").
    await reindexDocuments({ processAll: true, force })
  } catch (error: any) {
    ElMessage.error(error?.message || 'Could not queue indexing')
  } finally {
    reindexing.value = false
  }
}

const refreshHealth = async () => {
  try {
    const response = await getAIHealth()
    if (response.success) {
      health.value = response.data ?? null
      ElMessage.success('Health refreshed')
    }
  } catch {
    ElMessage.error('Could not reach the AI service')
  }
}

onMounted(load)
</script>

<template>
  <div class="ai-settings">
    <ElCard class="settings-card">
      <template #header>
        <div class="card-header">
          <div>
            <h2>AI Settings</h2>
            <p class="subtitle">
              Control which model answers questions and how documents are indexed.
              Changes apply immediately — no restart.
            </p>
          </div>
          <ElButton :loading="loading" text @click="load">
            <Icon icon="material-symbols:refresh" /> Reload
          </ElButton>
        </div>
      </template>

      <!-- Live status strip: the fastest way to see if anything is broken. -->
      <div v-if="health" class="status-strip">
        <div class="status-item" :class="health.database.connected ? 'ok' : 'bad'">
          <Icon :icon="health.database.connected ? 'material-symbols:check-circle' : 'material-symbols:error'" />
          <div>
            <span class="status-label">Vector database</span>
            <span class="status-value">
              {{ health.database.connected ? 'Connected' : 'Unreachable' }}
              <template v-if="health.database.connected">
                · {{ health.database.vectorSearchEnabled ? 'vector search on' : 'keyword only' }}
              </template>
            </span>
          </div>
        </div>

        <div class="status-item" :class="health.chat.ok ? 'ok' : 'bad'">
          <Icon :icon="health.chat.ok ? 'material-symbols:check-circle' : 'material-symbols:error'" />
          <div>
            <span class="status-label">Chat</span>
            <span class="status-value">{{ health.chat.provider }} / {{ health.chat.model }}</span>
          </div>
        </div>

        <div class="status-item" :class="health.embeddings.ok ? 'ok' : 'bad'">
          <Icon :icon="health.embeddings.ok ? 'material-symbols:check-circle' : 'material-symbols:error'" />
          <div>
            <span class="status-label">Embeddings</span>
            <span class="status-value">
              {{ health.embeddings.provider }} / {{ health.embeddings.model }} ({{ health.embeddings.dimensions }}d)
            </span>
          </div>
        </div>

        <div v-if="stats" class="status-item neutral">
          <Icon icon="material-symbols:database-outline" />
          <div>
            <span class="status-label">Index</span>
            <span class="status-value">
              {{ stats.documents }} docs · {{ stats.chunks }} chunks · {{ stats.embeddings }} vectors
            </span>
          </div>
        </div>

        <ElButton size="small" text @click="refreshHealth">Re-check</ElButton>
      </div>

      <ElAlert
        v-if="health && !health.database.connected"
        type="error"
        show-icon
        :closable="false"
        class="status-alert"
        title="The vector database is unreachable"
        :description="health.database.error || 'Check AI_DB_* in the environment.'"
      />
      <ElAlert
        v-else-if="health && !health.embeddings.ok"
        type="warning"
        show-icon
        :closable="false"
        class="status-alert"
        title="Embeddings are unavailable — answers fall back to keyword search"
        :description="health.embeddings.error || ''"
      />

      <div v-loading="loading" class="settings-body">
        <ElTabs v-model="activeTab">
          <ElTabPane v-for="group in GROUPS" :key="group.name" :name="group.name">
            <template #label>
              <span class="tab-label"><Icon :icon="group.icon" /> {{ group.label }}</span>
            </template>

            <p class="tab-hint">{{ group.hint }}</p>

            <div v-if="groupOf(group.name).length === 0" class="empty">
              <ElEmpty description="Nothing to configure here" />
            </div>

            <div
              v-for="setting in groupOf(group.name)"
              :key="setting.key"
              class="setting-row"
              :class="{ 'is-overridden': draft[setting.key]?.overridden }"
            >
              <div class="setting-info">
                <div class="setting-title">
                  {{ setting.label }}
                  <ElTag v-if="draft[setting.key]?.overridden" size="small" type="warning" effect="plain">
                    Custom
                  </ElTag>
                  <ElTag v-else size="small" type="info" effect="plain">Environment</ElTag>
                  <ElTag v-if="setting.requiresReindex" size="small" type="danger" effect="plain">
                    Needs reindex
                  </ElTag>
                </div>
                <p class="setting-description">{{ setting.description }}</p>
                <p class="setting-env">
                  Environment value: <code>{{ String(setting.envValue) }}</code>
                </p>
              </div>

              <div class="setting-control">
                <!-- Provider and model are chosen directly from a dropdown.
                     No Env/Custom switch: picking a value is the whole action. -->
                <template v-if="isDirect(setting.key)">
                  <ElSelect
                    v-if="setting.type === 'enum'"
                    v-model="draft[setting.key].value"
                    size="small"
                    class="control-input"
                    @change="onProviderChange(setting.key)"
                  >
                    <ElOption
                      v-for="option in setting.values || []"
                      :key="option"
                      :value="option"
                      :label="providerLabel(option)"
                      :disabled="providerUnavailable(option)"
                    >
                      <span>{{ providerLabel(option) }}</span>
                      <span v-if="providerUnavailable(option)" class="option-note">no API key</span>
                    </ElOption>
                  </ElSelect>

                  <!-- The 10 newest models the provider serves. An older or
                       unlisted name can still be typed in, which Ollama needs
                       when a model has been pulled but not listed yet. -->
                  <ElSelect
                    v-else
                    v-model="draft[setting.key].value"
                    size="small"
                    class="control-input"
                    filterable
                    allow-create
                    default-first-option
                    :loading="modelsPending(setting.key)"
                    :placeholder="modelsPending(setting.key) ? 'Loading…' : 'Select a model'"
                    :no-data-text="modelsPending(setting.key)
                      ? 'Loading…'
                      : `No models available from ${providerLabel(providerValue(setting.key))}`"
                    @change="onModelChange(setting.key)"
                  >
                    <ElOption
                      v-for="model in modelsFor(setting.key)"
                      :key="model"
                      :value="model"
                      :label="model"
                    />
                  </ElSelect>

                  <ElTooltip v-if="!setting.values" content="Refresh list" placement="top">
                    <ElButton
                      size="small"
                      text
                      :loading="modelsPending(setting.key)"
                      @click="refreshModels(setting.key)"
                    >
                      <Icon icon="material-symbols:refresh" />
                    </ElButton>
                  </ElTooltip>
                </template>

                <!-- Everything else keeps the Env/Custom switch: falling back to
                     the deployment default is a meaningful choice for tuning. -->
                <template v-else>
                  <ElSwitch
                    v-if="draft[setting.key]"
                    v-model="draft[setting.key].overridden"
                    size="small"
                    active-text="Custom"
                    inactive-text="Env"
                  />

                  <template v-if="draft[setting.key]?.overridden">
                    <ElSwitch
                      v-if="setting.type === 'boolean'"
                      v-model="draft[setting.key].value"
                    />

                    <ElInputNumber
                      v-else-if="setting.type === 'int' || setting.type === 'number'"
                      v-model="draft[setting.key].value"
                      size="small"
                      controls-position="right"
                      :min="setting.min ?? undefined"
                      :max="setting.max ?? undefined"
                      :step="setting.type === 'number' ? 0.05 : 1"
                      :precision="setting.type === 'number' ? 2 : 0"
                    />

                    <ElInput
                      v-else
                      v-model="draft[setting.key].value"
                      size="small"
                      class="control-input"
                    />
                  </template>

                  <span v-else class="effective-value">{{ String(setting.value) }}</span>
                </template>

                <ElButton
                  v-if="draft[setting.key]?.overridden"
                  size="small"
                  text
                  title="Use the environment value"
                  @click="revert(setting)"
                >
                  Reset
                </ElButton>
              </div>
            </div>
          </ElTabPane>
        </ElTabs>

        <div class="credentials">
          <h3>Provider credentials</h3>
          <p class="tab-hint">
            A key set here is encrypted before it is stored and is never sent back to this
            page — only a masked hint. Leave a field empty to keep using the environment
            variable. Ollama needs no key.
          </p>

          <div class="credential-list">
            <div v-for="setting in credentialSettings" :key="setting.key" class="credential-row">
              <div class="credential-head">
                <Icon
                  :icon="setting.configured ? 'material-symbols:check-circle' : 'material-symbols:cancel'"
                  :class="setting.configured ? 'ok-icon' : 'bad-icon'"
                />
                <strong>{{ setting.label }}</strong>
                <el-tag v-if="setting.revoked" size="small" type="danger">Revoked</el-tag>
                <el-tag v-else-if="setting.overridden" size="small" type="warning">Stored here</el-tag>
                <el-tag v-else-if="setting.configured" size="small" type="info">
                  From {{ setting.envVar }}
                </el-tag>
                <span v-else class="credential-note">Not configured</span>
                <span v-if="setting.hint" class="credential-note">{{ setting.hint }}</span>
              </div>

              <p class="credential-note">{{ setting.description }}</p>

              <el-alert
                v-if="setting.revoked"
                type="error"
                :closable="false"
                show-icon
                title="Revoked here"
                :description="setting.envConfigured
                  ? 'This provider is disabled and the environment key is ignored. Save a new key, or allow the environment key again.'
                  : 'This provider is disabled until a new key is saved.'"
              />

              <el-alert
                v-if="setting.storable === false"
                type="warning"
                :closable="false"
                show-icon
                title="This server cannot store keys: set SETTINGS_ENCRYPTION_KEY and restart."
              />

              <div v-else class="credential-actions">
                <el-input
                  v-model="keyDraft[setting.key]"
                  type="password"
                  show-password
                  clearable
                  :placeholder="setting.configured ? 'Enter a new key to replace the current one' : 'Paste the API key'"
                  style="max-width: 420px"
                  @keyup.enter="saveKey(setting)"
                />
                <el-button
                  type="primary"
                  :disabled="!(keyDraft[setting.key] || '').trim()"
                  :loading="keySaving[setting.key]"
                  @click="saveKey(setting)"
                >
                  Save key
                </el-button>
                <el-button
                  v-if="setting.overridden && !setting.revoked && setting.envConfigured"
                  :loading="keySaving[setting.key]"
                  @click="useEnvKey(setting)"
                >
                  Use {{ setting.envVar }}
                </el-button>
                <el-button
                  v-if="setting.configured"
                  type="danger"
                  plain
                  :loading="keySaving[setting.key]"
                  @click="revokeKey(setting)"
                >
                  Revoke
                </el-button>
                <el-button
                  v-if="setting.revoked && setting.envConfigured"
                  :loading="keySaving[setting.key]"
                  @click="unrevokeKey(setting)"
                >
                  Allow {{ setting.envVar }} again
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="maintenance">
          <h3>Index maintenance</h3>
          <p class="tab-hint">
            Indexing runs in the background. Reindex after changing the embedding model
            or dimensions, otherwise existing vectors are ignored.
          </p>
          <div class="maintenance-actions">
            <ElButton :loading="reindexing" @click="runReindex(false)">
              Index new documents
            </ElButton>
            <ElButton type="warning" plain :loading="reindexing" @click="runReindex(true)">
              Reindex everything
            </ElButton>
          </div>
        </div>
      </div>

      <div v-if="changed.length" class="save-bar">
        <span class="save-count">
          {{ changed.length }} unsaved change{{ changed.length === 1 ? '' : 's' }}
          <ElTag v-if="needsReindex" size="small" type="danger" effect="plain">reindex required</ElTag>
        </span>
        <div>
          <ElButton text @click="discard">Discard</ElButton>
          <ElButton type="primary" :loading="saving" @click="save">Save changes</ElButton>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
.ai-settings {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.status-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.status-item :deep(svg) {
  font-size: 18px;
  flex-shrink: 0;
}

.status-item.ok :deep(svg) { color: var(--el-color-success); }
.status-item.bad :deep(svg) { color: var(--el-color-danger); }
.status-item.neutral :deep(svg) { color: var(--el-text-color-secondary); }

.status-label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
}

.status-value {
  display: block;
  font-weight: 500;
}

.status-alert {
  margin-bottom: 16px;
}

.tab-label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.tab-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.setting-row {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.setting-row:last-child { border-bottom: none; }

.setting-info { flex: 1; min-width: 0; }

.setting-title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}

.setting-description {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.setting-env {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.setting-env code,
.tab-hint code {
  padding: 1px 5px;
  font-size: 12px;
  background: var(--el-fill-color);
  border-radius: 4px;
}

.setting-control {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
  min-height: 32px;
}

.control-input { width: 220px; }

.effective-value {
  font-family: var(--el-font-family-monospace, monospace);
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.option-note {
  float: right;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.credentials,
.maintenance {
  padding-top: 20px;
  margin-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.credentials h3,
.maintenance h3 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
}

.credential-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.credential-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.credential-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.credential-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.credential-head :deep(svg) { font-size: 18px; }
.ok-icon { color: var(--el-color-success); }
.bad-icon { color: var(--el-text-color-placeholder); }

.credential-note {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.maintenance-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.save-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 20px -20px -20px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color);
}

.save-count {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .setting-row { flex-direction: column; gap: 12px; }
  .setting-control { width: 100%; flex-wrap: wrap; }
  .control-input { width: 100%; }
}
</style>
