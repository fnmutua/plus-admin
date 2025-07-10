<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getDocumentRepository } from '@/api/settlements'
import { ElButton, ElRow, ElCol, ElCard, ElTable, ElTableColumn, ElCheckbox, ElPagination, ElTag,
  ElInput, ElMessage, ElSelect, ElOption, ElDrawer } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { useCache } from '@/hooks/web/useCache'
import { deleteDocument } from '@/api/settlements'
import moment from "moment"
import { getFile } from '@/api/summary'
import { askAIDocument, getAIProviders, getAIModels, processExistingDocumentsWithAI } from '@/api/ai'
import { useAppStore } from '@/store/modules/app'
import TableActions from '@/views/Components/TableActions.vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'

// Type definitions
interface UserRole {
  user_roles: {
    location_level: string
    county_id?: number
    settlement_id?: number
    location_id?: number
  }
  name: string
}

interface ProcessedRole {
  role: string
  model: string
  field: string | null
  fieldvalue: number | null
}

interface UserInfo {
  id: number
  roles: UserRole[]
}

interface Document {
  id: number
  name: string
  category: string
  format: string
  size: number
  location: string
  protectedFile: boolean
  createdBy: number
  createdAt: string
  updatedAt: string
  deletable?: boolean
  document_type?: {
    id: number
    type: string
    group: string
  }
  settlement?: {
    id: number
    name: string
    county?: {
      id: number
      name: string
    }
  }
  user?: {
    id: number
    name: string
  }
}

interface CategoryCounts {
  [group: string]: {
    [type: string]: number
  }
}

interface ChatMessage {
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  sources?: any[]
  tokens?: number
}

interface AIProvider {
  id: string
  name: string
  description: string
  isAvailable: boolean
}

interface AIModel {
  id: string
  name: string
  provider: string
  maxTokens: number
  isAvailable: boolean
}

interface FormData {
  [key: string]: any
}

const router = useRouter()
const { wsCache } = useCache()
const appStore = useAppStore()
const userInfo: UserInfo = wsCache.get(appStore.getUserInfo)
const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

// User role processing
const processedRoles: ProcessedRole[] = userInfo.roles.map((role: UserRole) => {
  let field: string | null = null
  let fieldvalue: number | null = null

  if (role.user_roles.location_level === "county") {
    field = "county_id"
    fieldvalue = role.user_roles.county_id || null
  } else if (role.user_roles.location_level === "settlement") {
    field = "settlement_id"
    fieldvalue = role.user_roles.settlement_id || null
  } else if (role.user_roles.location_level === "national" || role.user_roles.location_level === null) {
    return {
      role: role.name,
      model: "national",
      field: null,
      fieldvalue: null
    }
  } else {
    field = "location_id"
    fieldvalue = role.user_roles.location_id || null
  }

  return {
    role: role.name,
    model: role.user_roles.location_level,
    field: field,
    fieldvalue: fieldvalue
  }
}).filter(role => role !== null) as ProcessedRole[]

const isSuperAdmin = userInfo.roles.some(role => role.name === "super_admin")
const roles_filters = isSuperAdmin ? [] : processedRoles.filter(role => role.model !== "national").map(role => ({
  role: role.role,
  field: role.field,
  value: role.fieldvalue
}))

// Action buttons based on permissions
const action_buttons = ref<string[]>([])
if (showAdminButtons.value) {
  action_buttons.value = ['edit', 'delete', 'preview', 'download']
} else if (showEditButtons.value) {
  action_buttons.value = ['edit', 'preview', 'download']
} else {
  action_buttons.value = ['preview', 'download']
}

// Reactive data
const loading = ref(false)
const loadingText = ref('Loading documents...')
const canCancel = ref(false)
const searchTerm = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalDocs = ref(0)
const documents = ref<Document[]>([])
const categoryCounts = ref<CategoryCounts>({})
const totalDocuments = ref(0)
const selectedCategories = ref(new Set<string>())
const currentlyFiltered = ref(false)

// Mobile responsiveness
const isMobile = computed(() => appStore.getMobile)
const dialogWidth = ref(isMobile.value ? "90%" : "25%")
const actionColumnWidth = ref(isMobile.value ? "75px" : "160px")

// AI Configuration
const aiConfigDrawer = ref(false)
const filterDrawer = ref(false)
const aiConfig = reactive({
  provider: 'openai',
  model: 'gpt-3.5-turbo'
})

const aiProviders = ref<AIProvider[]>([])
const availableModels = ref<AIModel[]>([])
const chatMessages = ref<ChatMessage[]>([])
const currentQuestion = ref('')
const isProcessing = ref(false)
const sessionId = ref('default')
const expandedSources = ref(new Set<number>())

// Process existing documents functionality
const isProcessingExisting = ref(false)
const forceReprocess = ref(false)

const { t } = useI18n()

// Format functions
const formatEndDate = (data: any) => {
  return moment(data.createdAt).format('lll')
}

const formatText = (str: string | number) => {
  const stringValue = String(str)
  const formatted = stringValue.replace(/_/g, ' ')
  return formatted.toLowerCase().replace(/\b(\w)/g, function (match, firstLetter) {
    return firstLetter.toUpperCase()
  })
}

// Main data loading function
const loadDocumentRepository = async (params: any = {}) => {
  loading.value = true
  loadingText.value = 'Loading documents...'
  canCancel.value = true

  try {
    const requestData = {
      page: currentPage.value,
      limit: pageSize.value,
      searchTerm: searchTerm.value || undefined,
      categoryFilter: selectedCategories.value.size > 0 ? Array.from(selectedCategories.value) : undefined,
      userFilters: roles_filters.length > 0 ? roles_filters : undefined,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      ...params
    }

    console.log('loadDocumentRepository - requestData:', requestData);

    const response = await getDocumentRepository(requestData)
    
    // Handle both possible response structures
    const responseData = (response as any).data || (response as any).results || response
    
    if ((response as any).success && responseData) {
      documents.value = responseData.documents || []
      categoryCounts.value = responseData.categoryCounts || {}
      totalDocuments.value = responseData.totalDocuments || 0
      totalDocs.value = responseData.pagination?.totalItems || 0
      
      // Add deletable property based on permissions
      documents.value.forEach(doc => {
        doc.deletable = doc.createdBy === userInfo.id || showAdminButtons.value
      })

      // Ensure pagination is valid
      if (totalDocs.value < pageSize.value) {
        currentPage.value = 1
      }
    } else {
      ElMessage.error('Failed to load documents')
      documents.value = []
      totalDocs.value = 0
    }
  } catch (error) {
    console.error('Error loading documents:', error)
    ElMessage.error('Failed to load documents')
    documents.value = []
    totalDocs.value = 0
  } finally {
    loading.value = false
    canCancel.value = false
  }
}

// Search handler
const handleSearch = async () => {
  currentPage.value = 1
  currentlyFiltered.value = !!searchTerm.value || selectedCategories.value.size > 0
  await loadDocumentRepository()
}

// Category filter handlers
const handleCategoryToggle = (categoryId: string) => {
  const newSet = new Set(selectedCategories.value)
  if (newSet.has(categoryId)) {
    newSet.delete(categoryId)
  } else {
    newSet.add(categoryId)
  }
  selectedCategories.value = newSet
}

const applyFilters = async () => {
  console.log('applyFilters - selectedCategories:', Array.from(selectedCategories.value));
  currentPage.value = 1
  currentlyFiltered.value = selectedCategories.value.size > 0 || !!searchTerm.value
  await loadDocumentRepository()
  filterDrawer.value = false
}

// Clear filters
const clearFilters = async () => {
  searchTerm.value = ''
  selectedCategories.value = new Set<string>()
  currentPage.value = 1
  currentlyFiltered.value = false
  await loadDocumentRepository()
}

// Pagination handler
const handlePageChange = async (newPage: number) => {
  currentPage.value = newPage
  await loadDocumentRepository()
}

// File operations
const downloadFile = async (data: Document) => {
  try {
    const formData: FormData = {}
    let fname: string
    const filename = data.name
    if (!/\.\w+$/.test(filename)) {
      fname = filename + '.' + data.format
    } else {
      fname = filename
    }
    formData.filename = fname
    formData.responseType = 'blob'
    
    const response = await getFile(formData)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fname)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error downloading file:', error)
    ElMessage.error('Download failed.')
  }
}

const viewDocument = async (data: Document) => {
  try {
    const formData: FormData = {}
    let fname: string
    const filename = data.name
    if (!/\.\w+$/.test(filename)) {
      fname = filename + '.' + data.format
    } else {
      fname = filename
    }
    formData.filename = fname
    formData.doc_id = data.id
    formData.responseType = 'blob'

    const response = await getFile(formData)
    const blobData = new Blob([response.data], { type: response.headers['content-type'] })
    const url = window.URL.createObjectURL(blobData)
    const newTab = window.open(url, '_blank')
    
    if (!newTab) {
      ElMessage.error('Failed to open the document.')
    }
  } catch (error) {
    console.error('Error viewing document:', error)
    ElMessage.error('Failed to load the document.')
  }
}

const removeDocument = async (data: Document) => {
  try {
    const formData = {
      id: data.id,
      model: 'document',
      filesToDelete: [data.name]
    }
    await deleteDocument(formData as any)
    
    // Remove from local state
    const index = documents.value.findIndex(doc => doc.id === data.id)
    if (index !== -1) {
      documents.value.splice(index, 1)
    }
    
    ElMessage.success('Document deleted successfully')
  } catch (error) {
    console.error('Error deleting document:', error)
    ElMessage.error('Failed to delete document')
  }
}

// AI Configuration Functions
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
      aiProviders.value = [
        { id: 'xai', name: 'X-AI', description: 'Grok GPT models', isAvailable: true },
        { id: 'openai', name: 'OpenAI', description: 'OpenAI GPT models', isAvailable: true },
        { id: 'ollama', name: 'Ollama (Local)', description: 'Local AI models', isAvailable: true }
      ]
      setDefaultModels()
    }
  } catch (error) {
    console.error('Error fetching AI providers:', error)
    aiProviders.value = [
      { id: 'xai', name: 'X-AI', description: 'Grok GPT models', isAvailable: true },
      { id: 'openai', name: 'OpenAI', description: 'OpenAI GPT models', isAvailable: true },
      { id: 'ollama', name: 'Ollama (Local)', description: 'Local AI models', isAvailable: true }
    ]
    setDefaultModels()
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

const setDefaultModels = () => {
  const defaultModels: { [key: string]: string[] } = {
    openai: ['gpt-3.5-turbo', ' pgt-4', 'gpt-4-turbo'],
    anthropic: ['claude-3-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    ollama: ['llama2', 'mistral', 'codellama', 'neural-chat'],
    xai: ['grok-3-mini-fast', 'grok-3-mini', 'grok-3', 'grok-beta', 'grok-pro']
  }
  availableModels.value = (defaultModels[aiConfig.provider] || []).map(model => ({
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

// Chat Functions
const sendQuestion = async () => {
  if (!currentQuestion.value.trim() || isProcessing.value) return
  
  const question = currentQuestion.value.trim()
  
  chatMessages.value.push({
    type: 'user',
    content: question,
    timestamp: new Date()
  })
  
  currentQuestion.value = ''
  isProcessing.value = true
  
  try {
    const response = await askAIDocument({
      question,
      sessionId: sessionId.value,
      provider: aiConfig.provider,
      model: aiConfig.model
    })
    
    if (response.success && response.answer) {
      chatMessages.value.push({
        type: 'ai',
        content: response.answer || 'No response received from AI',
        sources: response.sources || [],
        tokens:  response.tokens || 0,
        timestamp: new Date()
      })
    } else if (response.success && response.data && response.data.answer) {
      chatMessages.value.push({
        type: 'ai',
        content: response.data.answer || 'No response received from AI',
        sources: response.data.sources || [],
        tokens: response.data.tokens || 0,
        timestamp: new Date()
      })
    } else {
      const errorMessage = response.message || response.error || 'Unknown error occurred'
      chatMessages.value.push({
        type: 'ai',
        content: `Error: ${errorMessage}`,
        timestamp: new Date()
      })
    }
  } catch (error) {
    console.error('Error in sendQuestion:', error)
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred'
    chatMessages.value.push({
      type: 'ai',
      content: `Error: ${errorMessage}`,
      timestamp: new Date()
    })
  } finally {
    isProcessing.value = false
  }
}

const clearChatHistory = () => {
  chatMessages.value = []
  ElMessage.success('Chat history cleared')
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

// Process existing documents functionality
const processExistingDocuments = async () => {
  isProcessingExisting.value = true
  try {
    const response = await processExistingDocumentsWithAI({ 
      processAll: true
    })
    
    if ((response as any).success) {
      const data = (response as any).data || response
      const message = `AI processing completed! Processed: ${(data as any).processed || 0}, Failed: ${(data as any).failed || 0}, Already Processed: ${(data as any).alreadyProcessed || 0}`
      ElMessage.success(message)
    } else {
      ElMessage.error((response as any).message || 'Failed to start AI processing')
    }
  } catch (error: any) {
    console.error('Error processing existing documents:', error)
    ElMessage.error('Error: ' + (error.message || error))
  } finally {
    isProcessingExisting.value = false
  }
}

// Tag type helper function
const getTagType = (groupName: string) => {
  switch (groupName.toLowerCase()) {
    case 'reports':
      return 'primary'
    case 'checklists':
      return 'success'
    case 'maps':
      return 'warning'
    case 'data':
      return 'danger'
    case 'engineering':
      return 'info'
    case 'plans':
      return 'info'
    default:
      return 'info'
  }
}



// Initialize
onMounted(async () => {
  loadAIConfig()
  await loadDocumentRepository()
})

// Helper function to get document type name from ID
const getDocumentTypeNameFromId = (typeId: string) => {
  const doc = documents.value.find(doc => doc['document_type.id'] === parseInt(typeId))
  return doc ? doc['document_type.type'] : `Type ${typeId}`
}
</script>

<template>
  <el-card v-loading="loading" :element-loading-text="loadingText">
    <!-- Card Header -->
    <template #header>
      <div>
        <h3 style="margin: 0;">Document Repository</h3>
      </div>
    </template>

    <!-- Search and Filter Controls -->
    <div style="margin: 5px 0;">
      <el-row :gutter="16">
        <el-col :span="15">
          <el-input
            v-model="searchTerm"
            placeholder="Search documents by name/settlement/county/format/uploader name"
            clearable
            @change="handleSearch"
            @clear="clearFilters"
          >
            <template #append>
              <el-button @click="handleSearch" type="primary">
                <Icon icon="material-symbols:search" width="16" />
              </el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="9">
           
          <el-button 
        @click="filterDrawer = true" 
        type="primary" 
        plain 
        size="small"
        style="margin-right: 8px;"
      >
        <Icon icon="material-symbols:filter-list" width="16" style="margin-right: 4px;" />
        
      </el-button>
      <el-button 
        @click="clearFilters" 
        type="info" 
        plain 
        size="small"
        v-if="currentlyFiltered"
      >
        <Icon icon="material-symbols:clear" width="16" style="margin-right: 4px;" />
        Clear Filters ({{ selectedCategories.size + (searchTerm ? 1 : 0) }})
      </el-button>
          <el-button @click="router.push('/repo/ai-chat')" type="success" plain size="small">
            <Icon icon="material-symbols:smart-toy" width="16" style="margin-right: 4px;" />
            AI Chat Interface
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- Filter Button -->
    <div style="margin-bottom: 20px;">
       
     
    </div>

    <!-- Documents Table -->
    <el-table 
      :data="documents" 
      style="width: 100%" 
      size="small" 
      class="thin-rows-table" 
      border 
      v-loading="loading"
    >
      <el-table-column label="#" type="index" width="50">
        <template #default="{ $index }">
          <span>{{ ($index + 1) + ((currentPage - 1) * pageSize) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="Title" />
      <el-table-column prop="settlement.name" label="Settlement" />
      <el-table-column prop="createdAt" label="Date" :formatter="formatEndDate" />
      <el-table-column prop="user.name" label="User" />
      <el-table-column prop="size" label="Size(Mb)" />
      <el-table-column label="Actions" :width="actionColumnWidth">
        <template #default="{ row }">
          <TableActions 
            :item="row" 
            :buttons="action_buttons" 
            @edit="() => {}" 
            @delete="removeDocument" 
            @preview="viewDocument" 
            @download="downloadFile" 
          />
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-wrapper" v-if="totalDocs > 0">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        background
        small
        layout="prev, pager, next"
        :total="totalDocs"
        @current-change="handlePageChange"
      />
    </div>

    <!-- Filter Drawer -->
    <el-drawer
      v-model="filterDrawer"
      direction="rtl"
      size="400px"
      :before-close="() => filterDrawer = false"
    >
      <template #header>
        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 12px;">
            <el-button 
              @click="applyFilters" 
              type="primary" 
              size="small"
              :disabled="selectedCategories.size === 0"
            >
              Apply Filters ({{ selectedCategories.size }})
            </el-button>
            <el-button 
              @click="selectedCategories = new Set()" 
              type="info" 
              plain 
              size="small"
              :disabled="selectedCategories.size === 0"
            >
              Clear Selection
            </el-button>
          </div>
        </div>
      </template>
      
      <div style="padding: 20px;">
        <div v-if="Object.keys(categoryCounts).length > 0" class="filter-drawer-content">
          <div v-for="(types, groupName) in categoryCounts" :key="groupName" class="filter-group">
            <h4 class="filter-group-title">{{ formatText(groupName) }}</h4>
            <div class="filter-checkboxes">
              <div 
                v-for="(typeData, typeId) in types" 
                :key="typeId" 
                class="filter-checkbox-item"
              >
                <el-checkbox 
                  :model-value="selectedCategories.has(String(typeId))"
                  @change="() => handleCategoryToggle(String(typeId))"
                  class="filter-checkbox"
                >
                  <div class="checkbox-content">
                    <span class="checkbox-label">{{ typeof typeData === 'object' ? (typeData as any).name : getDocumentTypeNameFromId(String(typeId)) }}</span>
                    <el-badge 
                      :value="String(typeof typeData === 'object' ? (typeData as any).count : typeData)" 
                      :type="getTagType(String(groupName))" 
                      class="checkbox-badge"
                    />
                  </div>
                </el-checkbox>
              </div>
            </div>
          </div>
    

        </div>
        
        <div v-else style="text-align: center; color: #909399; padding: 40px 20px;">
          <Icon icon="material-symbols:folder-open" width="48" style="margin-bottom: 16px; opacity: 0.5;" />
          <p>No document types available</p>
        </div>
      </div>
    </el-drawer>

  
  </el-card>
</template>

<style scoped>
/* Filter Drawer Styles */
.filter-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-group {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.filter-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.filter-group-title {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.filter-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-checkbox-item {
  padding: 4px 0;
}

.filter-checkbox {
  width: 100%;
}

.checkbox-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}

.checkbox-label {
  font-size: 14px;
  color: #303133;
  flex: 1;
}

.checkbox-badge {
  margin-left: 8px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
}

/* Table Styles */
.thin-rows-table .el-table__body tr {
  height: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* Prevent horizontal scrolling globally */
:deep(.el-row) {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

:deep(.el-col) {
  padding-left: 6px !important;
  padding-right: 6px !important;
}

/* Spinner animation for AI processing */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>