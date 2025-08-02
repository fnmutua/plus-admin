<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElButton, ElInput, ElMessage, ElSelect, ElOption, ElDialog, ElDivider, ElBadge, ElOptionGroup } from 'element-plus'
import { Icon } from '@iconify/vue'
import { askAIDocument, getAIProviders, getAIModels, processExistingDocumentsWithAI } from '@/api/ai'
import { useAppStore } from '@/store/modules/app'
import { getFile } from '@/api/summary'
   
const appStore = useAppStore()

// Modal state
const visible = ref(false)

// Chat state
const chatMessages = ref<any[]>([])
const currentQuestion = ref('')
const isProcessing = ref(false)
const sessionId = ref('default')
const expandedSources = ref(new Set())
const chatContainer = ref<HTMLElement>()

const groupedModels = [
  {
    label: 'ollama',
    disabled:false,
    options: [
      {
        id: 'mistral',
        name: 'mistral',
      },
      {
        id: 'gemma3n',
        name: 'gemma3n',
      },
      {
        id: 'gemma3:1b',
        name: 'gemma3:1b',
      },
      {
        id: 'deepseek-r1:1.5b',
        name: 'deepseek-r1:1.5',
      },
      {
        id: 'llama3.2:1b',
        name: 'llama3.2:1b',
      },
    ],
  },
  {
    label: 'xai',
    disabled:true,
    options: [
      {
        id: 'grok-3-mini-fast',
        name: 'grok-3-mini-fast',
      },
      {
        id: 'grok-3-mini',
        name: 'grok-3-m ini',
      },
      {
        id: 'grok-3',
        name: 'grok-3',
      },
      {
        id: 'grok-4-0709',
        name: 'grok-4-0709',
      },
    ],
  },
  {
    label: 'openai',
    options: [
      {
        id: 'o4-mini',
        name: 'o4-mini',
      },
      {
        id: 'gpt-4.1-mini',
        name: 'gpt-4.1-mini',
      },
      {
        id: 'o3',
        name: 'o3',
      },
      {
        id: 'gpt-4.1',
        name: 'gpt-4.1',
      },
    ],
  },
]

// AI Configuration
const aiConfig = reactive({
  provider: groupedModels[0].label,
  model: groupedModels[0].options[0].id
})

 
 
 
 

 

 

// Process existing documents functionality
const isProcessingExisting = ref(false)
 
// Load AI configuration
const loadAIConfig = () => {
  const saved = localStorage.getItem('aiConfig')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      Object.assign(aiConfig, config)
    } catch (error) {
      console.error('Error loading AI config:', error)
      // Fallback to first group and model
      aiConfig.provider = groupedModels[0].label
      aiConfig.model = groupedModels[0].options[0].id
    }
  } else {
    // Set default to first group and model
    aiConfig.provider = groupedModels[0].label
    aiConfig.model = groupedModels[0].options[0].id
  }
}

const saveAIConfig = () => {
  try {
    localStorage.setItem('aiConfig', JSON.stringify(aiConfig))
  } catch (error) {
    console.error('Error saving AI config:', error)
  }
}

 
 
 
 

 

 

// Handle model change
const handleModelChange = () => {
  // Find which group the selected model belongs to and update provider
  for (const group of groupedModels) {
    const foundModel = group.options.find(option => option.id === aiConfig.model)
    if (foundModel) {
      aiConfig.provider = group.label
      break
    }
  }
  saveAIConfig()
}

 
 
 
 

 

// Chat functions
const sendQuestion = async () => {
  if (!currentQuestion.value.trim() || isProcessing.value) return

  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: currentQuestion.value,
    timestamp: new Date()
  }

  chatMessages.value.push(userMessage)
  const question = currentQuestion.value
  currentQuestion.value = ''
  isProcessing.value = true

  try {
    const response = await askAIDocument({
      question,
      sessionId: sessionId.value,
      provider: aiConfig.provider,
      model: aiConfig.model
    })

    console.log('AI Response:', response) // Debug log

    if (response.success) {
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.answer || response.data?.answer || 'No response received',
        timestamp: new Date(),
        sources: response.sources || response.data?.sources || [],
        tokens: response.tokens || response.data?.tokens || 0,
        provider: aiConfig.provider,
        model: aiConfig.model
      }
      chatMessages.value.push(aiMessage)
    } else {
      ElMessage.error(response.message || 'Failed to get AI response')
    }
  } catch (error: any) {
    console.error('Error asking AI:', error)
    
    // Format error message from backend
    let errorMessage = 'An error occurred while processing your request.'
    
    if (error.response?.data?.details) {
      errorMessage = error.response.data.details
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    // Add error message to chat
    const errorMessageObj = {
      id: Date.now() + 1,
      type: 'ai',
      content: `❌ **Error**: ${errorMessage}`,
      timestamp: new Date(),
      provider: aiConfig.provider,
      model: aiConfig.model,
      isError: true
    }
    chatMessages.value.push(errorMessageObj)
    
    // Show toast notification
    ElMessage.error(errorMessage)
  } finally {
    isProcessing.value = false
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }
}

const clearChatHistory = () => {
  // Cancel any ongoing request
  isProcessing.value = false
  
  // Clear chat messages
  chatMessages.value = []
  sessionId.value = 'default'
  
  // Clear current question
  currentQuestion.value = ''
  
  ElMessage.success('Chat history cleared')
}

const toggleSources = (index: number) => {
  if (expandedSources.value.has(index)) {
    expandedSources.value.delete(index)
  } else {
    expandedSources.value.add(index)
  }
}

const formatTimestamp = (timestamp: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Process existing documents functionality
const processExistingDocuments = async () => {
  isProcessingExisting.value = true
  try {
    const response = await processExistingDocumentsWithAI({ 
      processAll: true
    })
    
    if (response.success) {
      ElMessage.success('AI processing started successfully')
    } else {
      ElMessage.error(response.message || 'Failed to start AI processing')
    }
  } catch (error) {
    console.error('Error processing existing documents:', error)
    ElMessage.error('Error: ' + (error instanceof Error ? error.message : String(error)))
  } finally {
    isProcessingExisting.value = false
  }
}

// Handle Enter key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendQuestion()
  }
}

// Expose methods for parent component
const openModal = () => {
  visible.value = true
  loadAIConfig()
}

const closeModal = () => {
  visible.value = false
}

const downloadFile = async (filename: string, format: string) => {
  try {
    ElMessage.info(`Starting download: ${filename}`)
    let fname = filename
    if (!/\.\w+$/.test(filename) && format) {
      fname = filename + '.' + format
    }
    const formData: any = { filename: fname, responseType: 'blob' }
    const response = await getFile(formData)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fname)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success(`Download completed: ${fname}`)
  } catch (error) {
    console.error('Error downloading file:', error)
    ElMessage.error('Download failed.')
  }
}

defineExpose({
  openModal,
  closeModal
})

onMounted(() => {
  loadAIConfig()
})

watch(chatMessages, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
});

const isMobile = computed(() => appStore.getMobile || window.innerWidth <= 768)
const dialogWidth = computed(() => isMobile.value ? '100%' : '50%')
</script>

<template>
  <el-dialog
    v-model="visible"
    title="KeSMIS AI Assistant"
    :width="dialogWidth"
    :before-close="closeModal"
    class="ai-assistant-dialog"
    top="4vh"
  >
    <!-- Custom header with model selector -->
    <template #header>
      <div class="dialog-header">
        <span>KeSMIS AI Assistant</span>
        <el-divider direction="vertical" class="header-divider" />
        <div class="model-selector-container">
          <label class="model-label">Model:</label>
          <el-select 
            v-model="aiConfig.model" 
            placeholder="Model" 
            class="header-model-select"
            @change="handleModelChange"
            size="small"
          >
            <el-option-group
              v-for="group in groupedModels"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="model in group.options"
                :key="model.id"
                :label="model.name"
                :disabled="group.disabled"
                :value="model.id"
              />
            </el-option-group>
          </el-select>
        </div>
      </div>
    </template>

    <div class="ai-assistant-container">
      <!-- Chat Messages -->
      <div class="chat-layout">
        <!-- Scrollable Messages Area -->
        <div ref="chatContainer" class="chat-messages">
          <div v-if="chatMessages.length === 0" class="welcome-message">
            <h3>Welcome to KeSMIS AI Assistant</h3>
             
            <!-- Centered Input Area for Empty State -->
            <div class="centered-input-container">
              <div class="input-wrapper">
                <el-input
                  v-model="currentQuestion"
                  placeholder="Ask me anything about KeSMIS, settlements, projects, or documents..."
                  type="textarea"
                  :rows="3"
                  :autosize="{ minRows: 3, maxRows: 6 }"
                  @keydown="handleKeyDown"
                  :disabled="isProcessing"
                  class="centered-chat-input"
                />
                <el-button 
                  v-if="currentQuestion.trim()"
                  @click="sendQuestion" 
                  type="primary" 
                  :disabled="isProcessing"
                  class="send-button-inside"
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
                <div class="message-text" :class="{ error: message.isError }" v-html="message.content.replace(/\n/g, '<br>')"></div>
                
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
                        <el-button
                          v-if="!(document as any).filename.toLowerCase().endsWith('.json')"
                          type="text"
                          size="small"
                          style="margin-left: 10px; color: #409eff; font-size: 13px; vertical-align: middle;"
                          :title="`Download ${ (document as any).filename }`"
                          @click="downloadFile((document as any).filename, (document as any).fileType)"
                        >
                          <Icon icon="material-symbols:download" width="16" style="margin-right: 2px;" />
                          Download
                        </el-button>
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

        <!-- Fixed Input Area (only show when there are messages) -->
        <div v-if="chatMessages.length > 0" class="chat-input-container">
          <div class="input-wrapper">
            <el-input
              v-model="currentQuestion"
              placeholder="Ask me anything about KeSMIS, settlements, projects, or documents..."
              type="textarea"
              :rows="4"
              :autosize="{ minRows: 3, maxRows: 6 }"
              @keydown="handleKeyDown"
              :disabled="isProcessing"
              class="chat-input"
            />
            <el-button 
              v-if="currentQuestion.trim()"
              @click="sendQuestion" 
              type="primary" 
              :disabled="isProcessing"
              class="send-button-inside"
              :loading="isProcessing"
            >
              <Icon v-if="!isProcessing" icon="material-symbols:send" width="16" />
            </el-button>
          </div>
          <div class="input-footer">
            <span class="input-hint">Press Enter to send, Shift+Enter for new line</span>
            <el-button @click="clearChatHistory" type="warning" plain size="small" class="clear-chat-btn">
              <Icon icon="material-symbols:clear-all" width="14" style="margin-right: 4px;" />
              Clear Chat
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
/* Grok-inspired typography and styling */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.ai-assistant-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.ai-assistant-container {
  display: flex;
  height: 75vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.chat-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  width: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--el-bg-color);
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-regular);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.welcome-message h3 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.welcome-message p {
  margin: 0 0 40px 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  max-width: 500px;
}

/* Centered Input Container */
.centered-input-container {
  width: 95%;
  max-width: 900px;
  margin: 0 auto;
}

.centered-chat-input {
  width: 100%;
  position: relative;
}

.centered-chat-input :deep(.el-textarea__inner) {
  border-radius: 16px;
  resize: none;
  padding: 16px 20px;
  padding-right: 60px;
  font-size: 16px;
  line-height: 1.5;
  min-height: 120px;
  border: 1px solid var(--el-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.centered-chat-input :deep(.el-textarea__inner:focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.centered-input-container .input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 12px;
  width: 100%;
  position: relative;
}

.send-button-inside {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  transition: all 0.2s ease;
}

.send-button-inside:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.model-select-inside {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 120px;
  z-index: 10;
}

.model-select-inside :deep(.el-input__wrapper) {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.model-select-inside :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

.model-select-inside :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.model-select-inside :deep(.el-select-dropdown) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.model-select-inside :deep(.el-select-dropdown__item) {
  padding: 8px 16px;
  font-size: 14px;
}

.model-select-inside :deep(.el-select-dropdown__item:hover) {
  background-color: var(--el-color-primary-light-9);
}

.model-select-inside :deep(.el-select-dropdown__item.is-selected) {
  background-color: var(--el-color-primary);
  color: white;
}

.centered-input-container .input-footer {
  text-align: center;
}

.centered-input-container .input-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.message-container {
  margin-bottom: 24px;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.message-author {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.message-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.message-tokens {
  font-size: 12px;
  color: var(--el-color-info);
  background: var(--el-color-info-light-9);
  padding: 2px 6px;
  border-radius: 4px;
}

.message-provider {
  font-size: 12px;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  padding: 2px 6px;
  border-radius: 4px;
}

.message-text {
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.message-text.error {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid var(--el-color-danger);
}

.message-sources {
  margin-top: 12px;
}

.sources-toggle {
  color: var(--el-color-primary);
  font-size: 14px;
}

.sources-content {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.source-document {
  margin-bottom: 12px;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
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

.similarity-badge :deep(.el-badge__content) {
  background: var(--el-color-success);
}

.chunks-badge :deep(.el-badge__content) {
  background: var(--el-color-info);
}

.source-preview {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  line-height: 1.5;
}

.source-meta {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input-container {
  padding: 20px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  display: flex;
  justify-content: center;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  position: relative;
  width: 80%;
  max-width: 800px;
}

.chat-input {
  flex: 1;
  position: relative;
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 16px;
  resize: none;
  padding: 12px 16px;
  padding-right: 60px;
  font-size: 16px;
  line-height: 1.5;
  min-height: 120px;
}

.send-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  padding: 0;
}

.input-footer {
  margin-top: 8px;
  text-align: center;
}

.input-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.clear-chat-btn {
  margin-left: 10px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .ai-assistant-container {
    flex-direction: column;
    height: 80vh;
  }
  
  .chat-layout {
    width: 100%;
  }
}

.centered-input-container, .input-wrapper {
  width: 95% !important;
  max-width: 95% !important;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-model-select {
  width: 150px;
}

.header-model-select :deep(.el-input__wrapper) {
  border-radius: 6px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
}

.header-model-select :deep(.el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

.header-model-select :deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.model-selector-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
  white-space: nowrap;
}

.header-divider {
  margin: 0 16px;
  height: 20px;
}

.header-divider :deep(.el-divider__text) {
  background: transparent;
}
</style> 