<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElButton, ElInput, ElMessage, ElSelect, ElOption, ElDrawer, ElDivider,ElCard, ElSwitch, ElCheckbox, ElBadge } from 'element-plus'
import { Icon } from '@iconify/vue'
import { askAIDocument, getAIProviders, getAIModels, processExistingDocumentsWithAI } from '@/api/ai'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()
const showAdminButtons = ref(appStore.getAdminButtons)

// Chat state
const chatMessages = ref<any[]>([])
const currentQuestion = ref('')
const isProcessing = ref(false)
const sessionId = ref('default')
const expandedSources = ref(new Set())
const chatContainer = ref<HTMLElement>()

// AI Configuration
const aiConfigDrawer = ref(false)
const aiConfig = reactive({
  provider: 'ollama',
  model: 'llama2'
})

const aiProviders = ref<any[]>([])
const availableModels = ref<any[]>([])

// Process existing documents functionality
const isProcessingExisting = ref(false)
const forceReprocess = ref(false)

// Load AI configuration
const loadAIConfig = () => {
  const saved = localStorage.getItem('aiConfig')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      Object.assign(aiConfig, config)
    } catch (error) {
      console.error('Error loading AI config:', error)
    }
  }
  fetchAIProviders()
}

const saveAIConfig = () => {
  try {
    localStorage.setItem('aiConfig', JSON.stringify(aiConfig))
  } catch (error) {
    console.error('Error saving AI config:', error)
  }
}

// Fetch providers and models
const fetchAIProviders = async () => {
  try {
    const response = await getAIProviders()
    if (response.success && response.data) {
      aiProviders.value = response.data
      if (aiProviders.value.length > 0 && !aiProviders.value.find(p => p.id === aiConfig.provider)) {
        aiConfig.provider = aiProviders.value[0].id
      }
      await fetchAIModels()
    } else {
      setDefaultProviders()
    }
  } catch (error) {
    console.error('Error fetching AI providers:', error)
    setDefaultProviders()
  }
}

const fetchAIModels = async () => {
  try {
    const response = await getAIModels()
    if (response.success && response.data) {
      availableModels.value = response.data.filter(model => model.provider === aiConfig.provider)
      if (availableModels.value.length > 0 && !availableModels.value.find(m => m.id === aiConfig.model)) {
        aiConfig.model = availableModels.value[0].id
      }
    } else {
      setDefaultModels()
    }
  } catch (error) {
    console.error('Error fetching AI models:', error)
    setDefaultModels()
  }
}

const setDefaultProviders = () => {
  aiProviders.value = [
    { id: 'ollama', name: 'Ollama (Local)', description: 'Local AI models', isAvailable: true },
    { id: 'xai', name: 'X-AI (Grok)', description: 'Grok GPT models', isAvailable: true },
    { id: 'openai', name: 'OpenAI', description: 'OpenAI GPT models', isAvailable: true }
  ]
  setDefaultModels()
}

const setDefaultModels = () => {
  const defaultModels = {
    ollama: [ 'mistral','llama3.2:1b','gemma3n','llama3.2:3b', 'phi'],
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    xai: ['grok-3-mini-fast', 'grok-3-mini', 'grok-3', 'grok-beta', 'grok-4-0709']
  }
  availableModels.value = (defaultModels[aiConfig.provider as keyof typeof defaultModels] || []).map(model => ({
    id: model,
    name: model,
    provider: aiConfig.provider,
    maxTokens: 4000,
    isAvailable: true
  }))
  
  if (availableModels.value.length > 0 && !availableModels.value.find(m => m.id === aiConfig.model)) {
    aiConfig.model = availableModels.value[0].id
  }
}

const handleProviderChange = () => {
  fetchAIModels()
  saveAIConfig()
}

const handleModelChange = () => {
  saveAIConfig()
}

// Chat functions
const sendQuestion = async () => {
  if (!currentQuestion.value.trim() || isProcessing.value) return
  
  const question = currentQuestion.value.trim()
  
  // Add user message
  chatMessages.value.push({
    id: Date.now(),
    type: 'user',
    content: question,
    timestamp: new Date()
  })
  
  currentQuestion.value = ''
  isProcessing.value = true
  
  // Scroll to bottom
  await nextTick()
  scrollToBottom()
  
  try {
    const response = await askAIDocument({
      question,
      sessionId: sessionId.value,
      provider: aiConfig.provider,
      model: aiConfig.model
    })
    
    if (response.success && response.answer) {
      chatMessages.value.push({
        id: Date.now() + 1,
        type: 'ai',
        content: response.answer,
        sources: response.sources || [],
        tokens: response.tokens || 0,
        provider: aiConfig.provider,
        model: aiConfig.model,
        timestamp: new Date()
      })
    } else if (response.success && response.data && response.data.answer) {
      chatMessages.value.push({
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.answer,
        sources: response.data.sources || [],
        tokens: response.data.tokens || 0,
        provider: aiConfig.provider,
        model: aiConfig.model,
        timestamp: new Date()
      })
    } else {
      const errorMessage = response.message || response.error || 'Unknown error occurred'
      chatMessages.value.push({
        id: Date.now() + 1,
        type: 'ai',
        content: `Error: ${errorMessage}`,
        timestamp: new Date()
      })
    }
  } catch (error) {
    console.error('Error in sendQuestion:', error)
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred'
    chatMessages.value.push({
      id: Date.now() + 1,
      type: 'ai',
      content: `Error: ${errorMessage}`,
      timestamp: new Date()
    })
  } finally {
    isProcessing.value = false
    await nextTick()
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const clearChatHistory = () => {
  chatMessages.value = []
  ElMessage.success('Chat history cleared')
}

const processExistingDocuments = async () => {
  isProcessingExisting.value = true
  try {
    const response = await processExistingDocumentsWithAI({ 
      processAll: true
    })
    
    if (response.success) {
      ElMessage.success('AI processing completed successfully!')
    } else {
      ElMessage.error(response.message || 'Failed to start AI processing')
    }
  } catch (error) {
    console.error('Error processing existing documents:', error)
    ElMessage.error('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    isProcessingExisting.value = false
  }
}

const formatTimestamp = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString()
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const toggleSources = (messageIndex: number) => {
  if (expandedSources.value.has(messageIndex)) {
    expandedSources.value.delete(messageIndex)
  } else {
    expandedSources.value.add(messageIndex)
  }
}

const openAIConfig = () => {
  aiConfigDrawer.value = true
}

// Handle Enter key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendQuestion()
  }
}

onMounted(() => {
  loadAIConfig()
})
</script>

<template>
  <!-- Chat Messages -->

   <el-card>
    <template #header>
      <div class="card-header-content">
        <div class="header-left">
          <Icon icon="hugeicons:ai-brain-02" width="20" color="#409eff" />
          <span class="header-title">KeSMIS AI Assistant</span>
        </div>
        <div class="header-right">
          <el-button @click="openAIConfig" type="primary" plain size="small">
            <Icon icon="material-symbols:settings" width="14" style="margin-right: 4px;" />
            Settings
          </el-button>
          <el-button @click="clearChatHistory" type="warning" plain size="small">
            <Icon icon="material-symbols:clear-all" width="14" style="margin-right: 4px;" />
            Clear Chat
          </el-button>
        </div>
      </div>
    </template>

    <div class="chat-layout">
      <!-- Scrollable Messages Area -->
      <div ref="chatContainer" class="chat-messages">
        <div v-if="chatMessages.length === 0" class="welcome-message">
          <h3>Welcome to KeSMIS AI Assistant</h3>
          <p>Ask me anything about Slums and informal settlements in Kenya! I'll use semantic search to find the most relevant information.</p>
        </div>

        <div v-for="(message, index) in chatMessages" :key="message.id" class="message-container">
          <div :class="['message', message.type === 'user' ? 'user-message' : 'ai-message']">
            <div class="message-avatar">
              <Icon 
                :icon="message.type === 'user' ? 'material-symbols:person' : 'mingcute:mic-ai-fill'" 
                width="24" 
                :color="message.type === 'user' ? '#409eff' : '#67c23a'" 
              />
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-author">{{ message.type === 'user' ? 'You' : 'AI Assistant' }}</span>
                <span class="message-time">{{ formatTimestamp(message.timestamp) }}</span>
                <span v-if="message.tokens" class="message-tokens">{{ message.tokens }} tokens</span>
                <span v-if="message.type === 'ai' && message.provider" class="message-provider">{{ message.provider }} / {{ message.model }}</span>
              </div>
              <div class="message-text" v-html="message.content.replace(/\n/g, '<br>')"></div>
              
              <!-- Sources -->
              <div v-if="message.sources && message.sources.length > 0" class="message-sources">
                <el-button 
                  @click="toggleSources(index)" 
                  type="text" 
                  size="small"
                  class="sources-toggle"
                >
                  <Icon 
                    :icon="expandedSources.has(index) ? 'material-symbols:expand-less' : 'material-symbols:expand-more'" 
                    width="16" 
                    style="margin-right: 4px;"
                  />
                  📚 Sources ({{ new Set(message.sources.map((s: any) => s.filename)).size }} documents)
                </el-button>
                
                <div v-if="expandedSources.has(index)" class="sources-content">
                  <div
                    v-for="document in Object.values(message.sources.reduce((acc: any, source: any) => {
                      if (!acc[source.filename]) {
                        acc[source.filename] = {
                          filename: source.filename,
                          chunks: [],
                          maxSimilarity: 0,
                          fileSize: source.fileSize,
                          fileType: source.fileType
                        };
                      }
                      acc[source.filename].chunks.push(source);
                      if (source.similarity && parseFloat(source.similarity) > acc[source.filename].maxSimilarity) {
                        acc[source.filename].maxSimilarity = parseFloat(source.similarity);
                      }
                      return acc;
                    }, {})) as any" 
                    :key="(document as any).filename" 
                    class="source-document"
                  >
                    <div class="source-header">
                      <strong>{{ (document as any).filename }}</strong>
                      <div class="source-badges">
                        <el-badge v-if="(document as any).maxSimilarity > 0" :value="`${((document as any).maxSimilarity * 100).toFixed(1)}%`" class="similarity-badge" />
                        <el-badge :value="`${(document as any).chunks.length} chunks`" class="chunks-badge" />
                      </div>
                    </div>
                    <div v-if="(document as any).chunks[0].preview" class="source-preview">
                      {{ (document as any).chunks[0].preview }}
                    </div>
                    <div class="source-meta">
                      <span v-if="(document as any).fileSize">Size: {{ formatFileSize(parseInt((document as any).fileSize)) }}</span>
                      <span v-if="(document as any).fileType"> • Type: {{ (document as any).fileType.toUpperCase() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isProcessing" class="message-container">
          <div class="message ai-message">
            <div class="message-avatar">
              <Icon icon="ri:mic-ai-line" width="24" color="#67c23a" />
            </div>
            <div class="message-content">
              <div class="loading-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>Analyzing data and documents...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed Input Area -->
      <div class="chat-input-container">
        <div class="input-wrapper">
          <el-input
            v-model="currentQuestion"
            placeholder="Ask a question about your documents..."
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 4 }"
            @keydown="handleKeyDown"
            :disabled="isProcessing"
            class="chat-input"
          />
          <el-button 
            @click="sendQuestion" 
            type="primary" 
            :disabled="!currentQuestion.trim() || isProcessing"
            class="send-button"
            :loading="isProcessing"
          >
            <Icon v-if="!isProcessing" icon="material-symbols:send" width="16" />
          </el-button>
        </div>
        <div class="input-footer">
          <span class="input-hint">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  </el-card>

  <!-- AI Configuration Drawer -->
  <el-drawer
    v-model="aiConfigDrawer"
    direction="rtl"
    size="400px"
    :before-close="() => aiConfigDrawer = false"
  >
    <template #header>
      <h3>🤖 AI Configuration</h3>
    </template>
    
    <div class="config-content">
      <div class="config-section">
        <h4>Provider & Model</h4>
        <div class="config-row">
          <label>AI Provider:</label>
          <el-select 
            v-model="aiConfig.provider" 
            placeholder="Provider" 
            style="width: 100%" 
            @change="handleProviderChange"
          >
            <el-option
              v-for="provider in aiProviders"
              :key="provider.id"
              :label="provider.name"
              :value="provider.id"
            />
          </el-select>
        </div>
        
        <div class="config-row">
          <label>Model:</label>
          <el-select 
            v-model="aiConfig.model" 
            placeholder="Model" 
            style="width: 100%"
            @change="handleModelChange"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </div>
      </div>

      <el-divider />

      <div v-if="showAdminButtons" class="config-section">
        <h4>Document Processing</h4>
        <div class="config-row">
          <label>Force Reprocess:</label>
          <el-switch v-model="forceReprocess" />
        </div>
        
        <el-button 
          type="warning" 
          style="width: 100%; margin-top: 16px;"
          :loading="isProcessingExisting"
          @click="processExistingDocuments"
        >
          <Icon icon="material-symbols:bolt" width="18" style="margin-right: 8px;" />
          Process All Existing Documents with AI
        </el-button>
      </div>

      <el-divider />

      <div class="config-section">
        <h4>Chat Information</h4>
        <div class="info-item">
          <span class="info-label">Session ID:</span>
          <span class="info-value">{{ sessionId }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Messages:</span>
          <span class="info-value">{{ chatMessages.length }}</span>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
/* Grok-inspired typography and styling */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.chat-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  max-height: calc(100vh - 200px);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.chat-card :deep(.el-card__header) {
  padding: 20px 32px;
  border-bottom: 1px solid var(--el-border-color-light);
   backdrop-filter: blur(10px);
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-content .header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: -0.025em;
}

.card-header-content .header-right {
  display: flex;
  gap: 12px;
}

.chat-card :deep(.el-card__body) {
  padding: 0;
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
 }

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  min-height: 0;
  max-height: calc(100vh - 280px);
 }

.welcome-message {
  text-align: center;
  padding: 80px 20px;
  color: var(--el-text-color-regular);
}

.welcome-message h3 {
  margin: 0 0 20px 0;
  color: var(--el-text-color-primary);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.welcome-message p {
  margin: 0 0 40px 0;
  font-size: 18px;
  line-height: 1.7;
  font-weight: 400;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.message-container {
  margin-bottom: 32px;
}

.message {
  display: flex;
  gap: 20px;
  max-width: 100%;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
   display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.message-content {
  flex: 1;
  max-width: calc(100% - 64px);
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.message-author {
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: -0.01em;
}

.message-tokens {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}

.message-provider {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 500;
  background: rgba(64, 158, 255, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.message-text {
   padding: 20px 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  line-height: 1.7;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 400;
  letter-spacing: -0.01em;
  border: 1px solid var(--el-border-color-lighter);
}

.user-message .message-text {
  background: var(--el-color-primary);
  color: white;
  border: none;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.message-sources {
  margin-top: 16px;
}

.sources-toggle {
  color: #3b82f6;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.sources-toggle:hover {
  background: rgba(59, 130, 246, 0.1);
}

.sources-content {
  margin-top: 16px;
  padding: 20px;
   border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.source-document {
  padding: 16px 20px;
  border-radius: 10px;
  margin-bottom: 12px;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.source-document:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.source-document:last-child {
  margin-bottom: 0;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.source-badges {
  display: flex;
  gap: 10px;
}

.similarity-badge {
  background: #f1f5f9;
  color: #475569;
  font-weight: 500;
}

.chunks-badge {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 500;
}

.source-preview {
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 10px;
  font-weight: 400;
}

.source-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 400;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid var(--el-border-color-lighter);
}

.typing-dots {
  display: flex;
  gap: 6px;
}

.typing-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-input-container {
  border-top: 1px solid var(--el-border-color-light);
  padding: 24px 32px; 
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.input-wrapper {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 16px;
  border: 2px solid var(--el-border-color-light);
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 400;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  resize: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.chat-input :deep(.el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.send-button {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
}

.send-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.input-footer {
  margin: 12px 0 0;
  text-align: center;
}

.input-hint {
  font-size: 13px;
  color: var(--el-text-color-regular);
  font-weight: 400;
  letter-spacing: -0.01em;
}

.config-content {
  padding: 20px;
}

.config-section {
  margin-bottom: 24px;
}

.config-section h4 {
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.config-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.config-row label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.info-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 768px) {
  .chat-layout {
    height: calc(100vh - 160px);
    max-height: calc(100vh - 160px);
  }
  
  .chat-card :deep(.el-card__body) {
    height: calc(100vh - 160px);
  }
  
  .chat-messages {
    padding: 16px;
    max-height: calc(100vh - 240px);
  }
  
  .chat-input-container {
    padding: 16px;
  }
  
  .input-wrapper {
    gap: 8px;
  }
  
  .send-button {
    width: 44px;
    height: 44px;
  }
}
</style> 