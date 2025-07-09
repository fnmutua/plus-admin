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
  provider: 'xai',
  model: 'grok-3-mini-fast'
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
    { id: 'xai', name: 'X-AI (Grok)', description: 'Grok GPT models', isAvailable: true },
    { id: 'openai', name: 'OpenAI', description: 'OpenAI GPT models', isAvailable: true },
    { id: 'ollama', name: 'Ollama (Local)', description: 'Local AI models', isAvailable: true }
  ]
  setDefaultModels()
}

const setDefaultModels = () => {
  const defaultModels = {
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    anthropic: ['claude-3-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    ollama: ['llama2', 'mistral', 'codellama', 'neural-chat'],
    xai: ['grok-3-mini-fast', 'grok-3-mini', 'grok-3', 'grok-beta', 'grok-pro']
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
        timestamp: new Date()
      })
    } else if (response.success && response.data && response.data.answer) {
      chatMessages.value.push({
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.answer,
        sources: response.data.sources || [],
        tokens: response.data.tokens || 0,
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
      processAll: true,
      forceReprocess: forceReprocess.value 
    })
    
    if (response.success) {
      const data = response.data || response
      const message = `AI processing completed! Processed: ${data.processed}, Failed: ${data.failed}, Already Processed: ${data.alreadyProcessed || 0}`
      ElMessage.success(message)
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
                    }, {}))" 
                    :key="document.filename" 
                    class="source-document"
                  >
                    <div class="source-header">
                      <strong>{{ document.filename }}</strong>
                      <div class="source-badges">
                        <el-badge v-if="document.maxSimilarity > 0" :value="`${(document.maxSimilarity * 100).toFixed(1)}%`" class="similarity-badge" />
                        <el-badge :value="`${document.chunks.length} chunks`" class="chunks-badge" />
                      </div>
                    </div>
                    <div v-if="document.chunks[0].preview" class="source-preview">
                      {{ document.chunks[0].preview }}
                    </div>
                    <div class="source-meta">
                      <span v-if="document.fileSize">Size: {{ formatFileSize(parseInt(document.fileSize)) }}</span>
                      <span v-if="document.fileType"> • Type: {{ document.fileType.toUpperCase() }}</span>
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
.chat-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  max-height: calc(100vh - 200px);
}

.chat-card :deep(.el-card__header) {
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
  background: #fafbfc;
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-content .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-header-content .header-right {
  display: flex;
  gap: 8px;
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
  padding: 24px;
  min-height: 0;
  max-height: calc(100vh - 280px);
}

.welcome-message {
  text-align: center;
  padding: 60px 20px;
  color: #606266;
}

.welcome-message h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.welcome-message p {
  margin: 0 0 32px 0;
  font-size: 16px;
  line-height: 1.6;
}

.message-container {
  margin-bottom: 24px;
}

.message {
  display: flex;
  gap: 16px;
  max-width: 100%;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 56px);
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.message-author {
  font-weight: 600;
  color: #303133;
}

.message-text {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  line-height: 1.6;
  color: #303133;
  font-size: 14px;
}

.user-message .message-text {
  background: #409eff;
  color: white;
}

.message-sources {
  margin-top: 12px;
}

.sources-toggle {
  color: #409eff;
  font-size: 12px;
  padding: 4px 8px;
}

.sources-content {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.source-document {
  background: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 3px solid #409eff;
}

.source-document:last-child {
  margin-bottom: 0;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.source-badges {
  display: flex;
  gap: 8px;
}

.similarity-badge {
  background: #e9ecef;
  color: #606266;
}

.chunks-badge {
  background: #f0f9ff;
  color: #0369a1;
}

.source-preview {
  color: #606266;
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.source-meta {
  font-size: 11px;
  color: #909399;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-input-container {
  background: white;
  border-top: 1px solid #e9ecef;
  padding: 20px 24px;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  border: 1px solid #e9ecef;
  padding: 12px 16px;
  font-size: 14px;
  resize: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.chat-input :deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.send-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.input-footer {
  margin: 8px 0 0;
  text-align: center;
}

.input-hint {
  font-size: 12px;
  color: #909399;
}

.config-content {
  padding: 20px;
}

.config-section {
  margin-bottom: 24px;
}

.config-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
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
  color: #606266;
  font-weight: 500;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #606266;
}

.info-value {
  font-size: 14px;
  color: #303133;
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