<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import {
  ElDrawer, ElInput, ElButton, ElSelect, ElOption, ElOptionGroup,
  ElMessage, ElTooltip
} from 'element-plus'
import { Icon } from '@iconify/vue'
import { askAIDocument, getAIProviders, getAIModels, clearAISession } from '@/api/ai'
import { useDocHelp } from '@/hooks/web/useDocHelp'
import { DOC_SECTION_AI_ASSISTANT } from '@/config/docsRouteMap'
import { getFile } from '@/api/summary'
import { useAppStore } from '@/store/modules/app'
import type { AISource } from '@/api/ai/types'

const appStore = useAppStore()

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: AISource[]
  tokens?: number
  provider?: string
  model?: string
  retrieval?: string
  /** Set only when the embedding call itself failed. */
  vectorError?: string | null
  /** Misspellings mapped to indexed words, e.g. kichecko -> kicheko. */
  corrections?: Array<{ term: string; corrected: string }>
  isError?: boolean
  stopped?: boolean
}

/* ------------------------------------------------------------------ state */

const visible = ref(false)
const wide = ref(false)

// Contextual help: the panel has no route of its own, so the help icon opens
// the assistant's documentation section directly.
const openHelp = useDocHelp(DOC_SECTION_AI_ASSISTANT)
const messages = ref<ChatMessage[]>([])
const draft = ref('')
const isProcessing = ref(false)
const scroller = ref<HTMLElement>()
const composer = ref()
const expandedSources = ref<Set<number>>(new Set())
const copiedId = ref<number | null>(null)

/** Present only while a question is in flight; aborting it stops the model. */
let inFlight: AbortController | null = null
const wasStopped = ref(false)
/** Set when the stop came from a reset, where a "Stopped" note would land in
 *  the new, empty thread and make no sense to the reader. */
let discardStopNotice = false

const newSessionId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const sessionId = ref(newSessionId())

const isMobile = computed(() => appStore.getMobile || window.innerWidth <= 768)
// Wider than before: answers now contain tables, and 560px wrapped every row.
const drawerSize = computed(() => (isMobile.value ? '100%' : wide.value ? '1100px' : '720px'))

/* -------------------------------------------------------------- model picker */

interface ModelOption { id: string; name: string }
interface ModelGroup { label: string; provider: string; options: ModelOption[] }

const groupedModels = ref<ModelGroup[]>([])
const modelsLoading = ref(false)
const serverDefault = reactive({ provider: '', model: '' })
const aiConfig = reactive({ provider: '', model: '' })

const findGroupFor = (modelId: string) =>
  groupedModels.value.find((group) => group.options.some((option) => option.id === modelId))

const saveAIConfig = () => {
  try {
    localStorage.setItem('aiConfig', JSON.stringify(aiConfig))
  } catch {
    /* private mode — the server default still applies */
  }
}

const reconcileSelection = () => {
  const saved = findGroupFor(aiConfig.model)
  if (aiConfig.model && saved) {
    aiConfig.provider = saved.provider
    return
  }

  const preferred = findGroupFor(serverDefault.model)
  const group = preferred || groupedModels.value[0]

  if (group) {
    aiConfig.provider = group.provider
    aiConfig.model = preferred ? serverDefault.model : group.options[0].id
  } else {
    // Nothing to pick from: send nothing and let the server decide.
    aiConfig.provider = ''
    aiConfig.model = ''
  }
  saveAIConfig()
}

const loadModels = async () => {
  modelsLoading.value = true
  try {
    const providers = await getAIProviders()
    serverDefault.provider = providers.active?.chat || ''
    serverDefault.model = providers.active?.model || ''

    const usable = (providers.data || []).filter((provider) => provider.isAvailable && provider.chat)

    const groups = await Promise.all(
      usable.map(async (provider) => {
        const models = await getAIModels(provider.id).catch(() => ({ data: [] }))
        return {
          label: provider.name,
          provider: provider.id,
          options: (models.data || []).map((model) => ({ id: model.id, name: model.name }))
        } as ModelGroup
      })
    )

    groupedModels.value = groups.filter((group) => group.options.length > 0)
  } catch (error) {
    console.error('Could not load AI providers:', error)
    groupedModels.value = []
  } finally {
    modelsLoading.value = false
    reconcileSelection()
  }
}

const handleModelChange = () => {
  const group = findGroupFor(aiConfig.model)
  if (group) aiConfig.provider = group.provider
  saveAIConfig()
}

const loadAIConfig = async () => {
  try {
    const saved = localStorage.getItem('aiConfig')
    if (saved) Object.assign(aiConfig, JSON.parse(saved))
  } catch (error) {
    console.error('Discarding unreadable saved AI config:', error)
  }
  await loadModels()
}

/* ------------------------------------------------------------- rendering */

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] as string
  ))

/**
 * Minimal, safe formatting. The text is escaped first and only then given
 * structure, so a model that emits HTML cannot inject it into the page.
 */
const inline = (text: string) => {
  let html = text
  // The model puts <br> inside table cells to stack filenames. Everything was
  // escaped first, so this restores that one tag and nothing else.
  html = html.replace(/&lt;br\s*\/?&gt;/gi, '<br>')
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  // Citation filenames the prompt asks the model to emit, e.g. [report.pdf]
  html = html.replace(
    /\[([^\]\n]+\.(?:pdf|docx|doc|csv|tsv|txt|md|json|xml|zip|xlsx|png|jpg))\]/gi,
    '<span class="cite">$1</span>'
  )
  return html
}

const tableRow = (line: string) =>
  line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())

/** A row of dashes under the header, which is what makes a block a table. */
const isTableDivider = (line = '') => /^\s*\|?[\s:-]*-[\s|:-]*\|?\s*$/.test(line) && line.includes('-')

/**
 * Minimal, safe formatting. The text is escaped first and only then given
 * structure, so a model that emits HTML cannot inject it into the page.
 *
 * Tables and lists are rendered because the answers are full of them: a list
 * of nine counties and their strategy documents reads as a table and as raw
 * pipe characters otherwise.
 */
const render = (raw: string) => {
  const escaped = escapeHtml(raw)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => `\u0000PRE${btoa(unescape(encodeURIComponent(code.replace(/\n$/, ''))))}\u0000`)

  const lines = escaped.split('\n')
  const out: string[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null

  const closeList = () => {
    if (!list) return
    out.push(`<${list.type}>${list.items.map((item) => `<li>${item}</li>`).join('')}</${list.type}>`)
    list = null
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    // table: a header row, a divider, then rows until a non-table line
    if (line.includes('|') && isTableDivider(lines[i + 1])) {
      closeList()
      const header = tableRow(line)
      const body: string[][] = []
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        body.push(tableRow(lines[i]))
        i += 1
      }
      i -= 1

      out.push(
        '<table class="answer-table"><thead><tr>'
        + header.map((cell) => `<th>${inline(cell)}</th>`).join('')
        + '</tr></thead><tbody>'
        + body.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')
        + '</tbody></table>'
      )
      continue
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)

    if (bullet || numbered) {
      const type = bullet ? 'ul' : 'ol'
      if (!list || list.type !== type) {
        closeList()
        list = { type, items: [] }
      }
      list.items.push(inline((bullet || numbered)![1]))
      continue
    }

    closeList()
    if (line.trim()) out.push(`<p>${inline(line)}</p>`)
  }

  closeList()

  return out.join('')
    .replace(/\u0000PRE([A-Za-z0-9+/=]+)\u0000/g, (_m, code) => `<pre><code>${decodeURIComponent(escape(atob(code)))}</code></pre>`)
}

/** Group a message's chunk-level sources into one entry per document. */
const groupSources = (sources: AISource[] = []) => {
  const byFile = new Map<string, { filename: string; chunks: number; best: number; preview: string; fileType?: string; fileSize?: number }>()

  for (const source of sources) {
    const existing = byFile.get(source.filename)
    if (existing) {
      existing.chunks += 1
      if (source.similarity > existing.best) {
        existing.best = source.similarity
        existing.preview = source.preview
      }
    } else {
      byFile.set(source.filename, {
        filename: source.filename,
        chunks: 1,
        best: source.similarity,
        preview: source.preview,
        fileType: source.fileType,
        fileSize: source.fileSize
      })
    }
  }

  return [...byFile.values()].sort((a, b) => b.best - a.best)
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${parseFloat((bytes / 1024 ** index).toFixed(1))} ${units[index]}`
}

const formatTime = (value: Date) =>
  new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(value)

/* -------------------------------------------------------------- behaviour */

const scrollToBottom = () => {
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  })
}

watch(messages, scrollToBottom, { deep: true })

const SUGGESTIONS = [
  'Summarise the most recently uploaded document',
  'What key dates and deadlines are mentioned?',
  'Which settlements are referred to in the documents?',
  'What does the latest report cover?'
]

const askSuggestion = (text: string) => {
  draft.value = text
  sendQuestion()
}

const sendQuestion = async () => {
  const question = draft.value.trim()
  if (!question || isProcessing.value) return

  messages.value.push({ id: Date.now(), role: 'user', content: question, timestamp: new Date() })
  draft.value = ''
  isProcessing.value = true
  wasStopped.value = false
  inFlight = new AbortController()
  scrollToBottom()

  try {
    const response = await askAIDocument({
      question,
      sessionId: sessionId.value,
      // Omitted when unset so the server uses its configured default.
      ...(aiConfig.provider ? { provider: aiConfig.provider } : {}),
      ...(aiConfig.model ? { model: aiConfig.model } : {})
    }, inFlight.signal)

    if (response.success) {
      messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources || [],
        tokens: response.tokens || 0,
        provider: response.provider || aiConfig.provider,
        model: response.model || aiConfig.model,
        retrieval: response.retrieval,
        vectorError: (response as any).vectorError ?? null,
        corrections: (response as any).corrections ?? []
      })
    } else {
      throw new Error(response.message || 'The assistant returned no answer')
    }
  } catch (error: any) {
    // A stop is the user getting what they asked for, not a failure.
    if (wasStopped.value || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      if (discardStopNotice) return
      messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Stopped.',
        timestamp: new Date(),
        stopped: true
      })
      return
    }

    const detail = error?.response?.data?.message
      || error?.response?.data?.details
      || error?.message
      || 'Something went wrong'
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: detail,
      timestamp: new Date(),
      isError: true
    })
  } finally {
    inFlight = null
    discardStopNotice = false
    isProcessing.value = false
    scrollToBottom()
  }
}

/**
 * Abort the in-flight request; the server relays it to the model, which stops
 * generating instead of finishing an answer nobody is waiting for.
 * @param silent true when the thread is being cleared, so no notice is shown.
 */
const stopGeneration = (silent = false) => {
  if (!inFlight) return
  wasStopped.value = true
  discardStopNotice = silent
  inFlight.abort()
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendQuestion()
  }
}

const startNewChat = async () => {
  stopGeneration(true)
  isProcessing.value = false
  messages.value = []
  draft.value = ''
  expandedSources.value = new Set()

  // Conversation memory lives on the server, so a new chat has to clear it
  // there too, or the next answer still remembers the old thread.
  try {
    await clearAISession(sessionId.value)
  } catch (error) {
    console.error('Could not clear server-side history:', error)
  }
  sessionId.value = newSessionId()
  nextTick(() => composer.value?.focus())
}

const toggleSources = (id: number) => {
  const next = new Set(expandedSources.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedSources.value = next
}

const copyMessage = async (message: ChatMessage) => {
  try {
    await navigator.clipboard.writeText(message.content)
    copiedId.value = message.id
    setTimeout(() => { if (copiedId.value === message.id) copiedId.value = null }, 1600)
  } catch {
    ElMessage.error('Could not copy to clipboard')
  }
}

const downloadFile = async (filename: string, fileType?: string) => {
  try {
    let name = filename
    if (!/\.\w+$/.test(filename) && fileType) name = `${filename}.${fileType}`
    const response = await getFile({ filename: name, responseType: 'blob' } as any)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
    ElMessage.error('Download failed')
  }
}

const openModal = () => {
  visible.value = true
  loadAIConfig()
  nextTick(() => composer.value?.focus())
}

const closeModal = () => {
  stopGeneration()
  visible.value = false
}

defineExpose({ openModal, closeModal })
</script>

<template>
  <ElDrawer
    v-model="visible"
    :size="drawerSize"
    direction="rtl"
    :with-header="false"
    :close-on-click-modal="true"
    class="ai-drawer"
    @closed="closeModal"
  >
    <div class="ai-shell">
      <!-- ─────────────────────────────── header -->
      <header class="ai-header">
        <div class="ai-brand">
          <span class="ai-mark"><Icon icon="mingcute:ai-fill" /></span>
          <div class="ai-title">
            <strong>KeSMIS Assistant</strong>
            <span class="ai-subtitle">Answers from your indexed documents</span>
          </div>
        </div>

        <div class="ai-actions">
          <ElSelect
            v-model="aiConfig.model"
            size="small"
            class="ai-model-select"
            placeholder="Model"
            :loading="modelsLoading"
            :no-data-text="modelsLoading ? 'Loading…' : 'No models available'"
            @change="handleModelChange"
          >
            <ElOptionGroup
              v-for="group in groupedModels"
              :key="group.provider"
              :label="group.label"
            >
              <ElOption
                v-for="model in group.options"
                :key="model.id"
                :value="model.id"
                :label="model.name"
              />
            </ElOptionGroup>
          </ElSelect>

          <ElTooltip content="New chat" placement="bottom">
            <button class="icon-button" :disabled="!messages.length" @click="startNewChat">
              <Icon icon="material-symbols:add-comment-outline" />
            </button>
          </ElTooltip>

          <ElTooltip content="How this works" placement="bottom">
            <button class="icon-button" @click="openHelp()">
              <Icon icon="material-symbols:help-outline" />
            </button>
          </ElTooltip>

          <ElTooltip :content="wide ? 'Narrow' : 'Widen'" placement="bottom">
            <button v-if="!isMobile" class="icon-button" @click="wide = !wide">
              <Icon :icon="wide ? 'material-symbols:collapse-content' : 'material-symbols:expand-content'" />
            </button>
          </ElTooltip>

          <ElTooltip content="Close" placement="bottom">
            <button class="icon-button" @click="closeModal">
              <Icon icon="material-symbols:close" />
            </button>
          </ElTooltip>
        </div>
      </header>

      <!-- ─────────────────────────────── transcript -->
      <div ref="scroller" class="ai-scroll">
        <div v-if="!messages.length" class="ai-empty">
          <span class="empty-mark"><Icon icon="mingcute:ai-fill" /></span>
          <h2>How can I help?</h2>
          <p>
            Ask about settlements, facilities, projects or any document that has been
            indexed. Answers cite the files they come from.
          </p>
          <div class="suggestions">
            <button
              v-for="suggestion in SUGGESTIONS"
              :key="suggestion"
              class="suggestion"
              @click="askSuggestion(suggestion)"
            >
              <span>{{ suggestion }}</span>
              <Icon icon="material-symbols:arrow-forward" />
            </button>
          </div>
        </div>

        <div v-else class="ai-thread">
          <template v-for="message in messages" :key="message.id">
            <!-- user turn: right-aligned bubble -->
            <div v-if="message.role === 'user'" class="turn turn--user">
              <div class="bubble">{{ message.content }}</div>
            </div>

            <!-- assistant turn: full width, no bubble -->
            <div v-else class="turn turn--assistant">
              <span class="turn-avatar" :class="{ 'is-error': message.isError }">
                <Icon :icon="message.isError ? 'material-symbols:error-outline' : 'mingcute:ai-fill'" />
              </span>

              <div class="turn-body">
                <div
                  class="prose"
                  :class="{ 'is-error': message.isError }"
                  v-html="render(message.content)"
                ></div>

                <!-- Spelling corrections, the way a search engine reports them. -->
                <div v-if="message.corrections?.length" class="corrected">
                  <Icon icon="material-symbols:spellcheck" />
                  Searched for
                  <template v-for="(fix, i) in message.corrections" :key="fix.term">
                    <strong>{{ fix.corrected }}</strong><template v-if="i < message.corrections.length - 1">, </template>
                  </template>
                </div>

                <!-- Retrieval quality is surfaced, not hidden. Only an actual
                     embedding failure is a warning; a keyword-only answer is
                     weaker but not broken. -->
                <div v-if="message.vectorError" class="degraded">
                  <Icon icon="material-symbols:warning-outline" />
                  Semantic search failed ({{ message.vectorError }}) — this used word matching only.
                </div>
                <div v-else-if="message.retrieval === 'keyword' || message.retrieval === 'terms'" class="degraded">
                  <Icon icon="material-symbols:info-outline" />
                  Matched on words only — no semantically similar passages were found.
                </div>

                <div v-if="message.sources?.length" class="sources">
                  <button class="sources-toggle" @click="toggleSources(message.id)">
                    <Icon
                      :icon="expandedSources.has(message.id)
                        ? 'material-symbols:keyboard-arrow-down'
                        : 'material-symbols:chevron-right'"
                    />
                    {{ groupSources(message.sources).length }}
                    source{{ groupSources(message.sources).length === 1 ? '' : 's' }}
                  </button>

                  <div v-if="expandedSources.has(message.id)" class="source-list">
                    <div
                      v-for="source in groupSources(message.sources)"
                      :key="source.filename"
                      class="source"
                    >
                      <div class="source-head">
                        <Icon icon="material-symbols:description-outline" />
                        <span class="source-name" :title="source.filename">{{ source.filename }}</span>
                        <span class="source-score">{{ (source.best * 100).toFixed(0) }}%</span>
                        <button
                          v-if="source.fileType !== 'record'"
                          class="icon-button icon-button--tiny"
                          title="Download"
                          @click="downloadFile(source.filename, source.fileType)"
                        >
                          <Icon icon="material-symbols:download" />
                        </button>
                      </div>
                      <p class="source-preview">{{ source.preview }}</p>
                      <div class="source-meta">
                        <span>{{ source.chunks }} excerpt{{ source.chunks === 1 ? '' : 's' }}</span>
                        <span v-if="source.fileSize"> · {{ formatFileSize(source.fileSize) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="turn-foot">
                  <button class="foot-action" @click="copyMessage(message)">
                    <Icon :icon="copiedId === message.id ? 'material-symbols:check' : 'material-symbols:content-copy-outline'" />
                    {{ copiedId === message.id ? 'Copied' : 'Copy' }}
                  </button>
                  <span class="foot-meta">{{ formatTime(message.timestamp) }}</span>
                  <span v-if="message.model" class="foot-meta">{{ message.model }}</span>
                  <span v-if="message.tokens" class="foot-meta">{{ message.tokens }} tokens</span>
                </div>
              </div>
            </div>
          </template>

          <div v-if="isProcessing" class="turn turn--assistant">
            <span class="turn-avatar"><Icon icon="mingcute:ai-fill" /></span>
            <div class="turn-body">
              <div class="dots"><span ></span><span ></span><span ></span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─────────────────────────────── composer -->
      <footer class="ai-composer">
        <div class="composer-box" :class="{ 'is-busy': isProcessing }">
          <ElInput
            ref="composer"
            v-model="draft"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 8 }"
            :disabled="isProcessing"
            resize="none"
            placeholder="Ask about your documents…"
            @keydown="handleKeyDown"
          />
          <!-- While generating, the same control becomes Stop. One button in
               one place, so there is never a send and a stop competing. -->
          <button
            v-if="isProcessing"
            class="send send--stop"
            title="Stop generating"
            aria-label="Stop generating"
            @click="stopGeneration"
          >
            <Icon icon="material-symbols:stop-rounded" />
          </button>
          <button
            v-else
            class="send"
            :disabled="!draft.trim()"
            title="Send"
            aria-label="Send"
            @click="sendQuestion"
          >
            <Icon icon="material-symbols:arrow-upward" />
          </button>
        </div>
        <p class="composer-hint">
          <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line.
          Answers come only from indexed documents and can be wrong — check the sources.
        </p>
      </footer>
    </div>
  </ElDrawer>
</template>

<style scoped>
/* Palette is derived from Element Plus tokens so light and dark both work. */
.ai-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

/* ── header ───────────────────────────────────────────────── */
.ai-header {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ai-brand {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.ai-mark {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 18px;
  color: #fff;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 9px;
}

.ai-title {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.ai-title strong { font-size: 14px; font-weight: 600; }

.ai-subtitle {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
}

.ai-model-select { width: 150px; }

.icon-button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 17px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 7px;
  transition: background 0.15s, color 0.15s;
}

.icon-button:hover:not(:disabled) {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.icon-button:disabled { opacity: 0.35; cursor: not-allowed; }
.icon-button--tiny { width: 22px; height: 22px; font-size: 14px; }

/* ── transcript ───────────────────────────────────────────── */
.ai-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.ai-scroll::-webkit-scrollbar { width: 8px; }
.ai-scroll::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 4px;
}

.ai-thread {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 24px 20px 8px;
}

.turn { display: flex; }
.turn--user { justify-content: flex-end; }

.bubble {
  max-width: 82%;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: var(--el-fill-color);
  border-radius: 16px 16px 4px 16px;
}

.turn--assistant { gap: 12px; align-items: flex-start; }

.turn-avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-top: 2px;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 8px;
}

.turn-avatar.is-error {
  background: var(--el-color-danger-light-3);
}

.turn-body { flex: 1; min-width: 0; }

.prose {
  font-size: 14px;
  line-height: 1.68;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.prose.is-error { color: var(--el-color-danger); }

.prose :deep(pre) {
  padding: 12px;
  margin: 10px 0;
  overflow-x: auto;
  font-size: 12.5px;
  white-space: pre;
  background: var(--el-fill-color-darker);
  border-radius: 8px;
}

.prose :deep(code) {
  padding: 1px 5px;
  font-family: var(--el-font-family-monospace, ui-monospace, monospace);
  font-size: 0.9em;
  background: var(--el-fill-color);
  border-radius: 4px;
}

.prose :deep(pre code) { padding: 0; background: none; }

/* Structure of a rendered answer. :deep(), because v-html output carries no
   scoped-style attributes. */
.prose :deep(p) { margin: 6px 0; }

.prose :deep(ul),
.prose :deep(ol) {
  margin: 6px 0;
  padding-left: 20px;
}

.prose :deep(li) { margin: 2px 0; }

.prose :deep(table.answer-table) {
  width: 100%;
  margin: 10px 0;
  border-collapse: collapse;
  font-size: 13px;
}

.prose :deep(table.answer-table th),
.prose :deep(table.answer-table td) {
  padding: 6px 8px;
  text-align: left;
  vertical-align: top;
  border: 1px solid var(--el-border-color-lighter);
}

.prose :deep(table.answer-table th) {
  font-weight: 600;
  background: var(--el-fill-color-light);
}

.prose :deep(table.answer-table tbody tr:nth-child(even)) {
  background: var(--el-fill-color-lighter);
}

.prose :deep(.cite) {
  padding: 1px 6px;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
}

.corrected {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.degraded {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-color-warning);
}

/* ── sources ──────────────────────────────────────────────── */
.sources { margin-top: 12px; }

.sources-toggle {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 8px 4px 4px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
}

.sources-toggle:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.source {
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.source-head {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}

.source-name {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-score {
  flex-shrink: 0;
  padding: 1px 6px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-radius: 20px;
}

.source-preview {
  margin: 6px 0 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.source-meta {
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}

/* ── per-message footer ───────────────────────────────────── */
.turn-foot {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 10px;
  opacity: 0;
  transition: opacity 0.15s;
}

.turn--assistant:hover .turn-foot,
.turn-foot:focus-within { opacity: 1; }

.foot-action {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
}

.foot-action:hover { color: var(--el-text-color-primary); }

.foot-meta {
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}

/* ── empty state ──────────────────────────────────────────── */
.ai-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px 24px;
  text-align: center;
}

.empty-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  font-size: 26px;
  color: #fff;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 14px;
}

.ai-empty h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.ai-empty p {
  max-width: 380px;
  margin: 0 0 24px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 420px;
}

.suggestion {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  font-size: 13px;
  text-align: left;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  transition: border-color 0.15s, background 0.15s;
}

.suggestion:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-color-primary);
}

.suggestion :deep(svg) {
  flex-shrink: 0;
  font-size: 15px;
  color: var(--el-text-color-placeholder);
}

/* ── typing indicator ─────────────────────────────────────── */
.dots { display: inline-flex; gap: 5px; padding: 8px 0; }

.dots span {
  width: 7px;
  height: 7px;
  background: var(--el-text-color-placeholder);
  border-radius: 50%;
  animation: blink 1.3s infinite ease-in-out;
}

.dots span:nth-child(2) { animation-delay: 0.18s; }
.dots span:nth-child(3) { animation-delay: 0.36s; }

@keyframes blink {
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}

@media (prefers-reduced-motion: reduce) {
  .dots span { animation: none; opacity: 0.5; }
}

/* ── composer ─────────────────────────────────────────────── */
.ai-composer {
  flex-shrink: 0;
  padding: 12px 20px 16px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

.composer-box {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 7px 7px 7px 14px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 22px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.composer-box:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}

.composer-box :deep(.el-textarea__inner) {
  padding: 6px 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--el-text-color-primary);
  background: transparent;
  border: none;
  box-shadow: none;
  resize: none;
}

.composer-box :deep(.el-textarea__inner):focus { box-shadow: none; }

.send {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 18px;
  color: var(--el-color-white);
  cursor: pointer;
  background: var(--el-color-primary);
  border: none;
  border-radius: 50%;
  transition: opacity 0.15s, transform 0.1s;
}

.send:hover:not(:disabled) { transform: scale(1.06); }

.send--stop {
  background: var(--el-text-color-primary);
}

.send--stop:hover { transform: scale(1.06); }

.turn--stopped {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12.5px;
  color: var(--el-text-color-placeholder);
}

.turn--stopped :deep(svg) { font-size: 15px; }

.thinking {
  display: flex;
  gap: 14px;
  align-items: center;
}

.stop-inline {
  padding: 2px 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--el-border-color);
  border-radius: 20px;
}

.stop-inline:hover {
  color: var(--el-text-color-primary);
  border-color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
}

.send:disabled {
  color: var(--el-text-color-placeholder);
  cursor: not-allowed;
  background: var(--el-fill-color-dark);
}

.composer-hint {
  margin: 8px 2px 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
}

.composer-hint kbd {
  padding: 0 4px;
  font-family: inherit;
  font-size: 10.5px;
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 3px;
}

@media (max-width: 768px) {
  .ai-thread { padding: 16px 14px 8px; }
  .ai-composer { padding: 10px 14px 14px; }
  .ai-model-select { width: 108px; }
  .ai-subtitle { display: none; }
  .bubble { max-width: 90%; }
  /* Touch devices have no hover, so message actions stay visible. */
  .turn-foot { opacity: 1; }
}
</style>

<style>
.ai-drawer .el-drawer__body {
  padding: 0;
  overflow: hidden;
}
</style>
