<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getDocumentRepository } from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'
import { ElButton, ElRow, ElCol,ElDialog, ElCard, ElTable, ElTableColumn, ElCheckbox, ElPagination, ElTag,ElForm,ElFormItem,
  ElInput, ElMessage, ElSelect, ElOption, ElDrawer } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useCache } from '@/hooks/web/useCache'
import { deleteDocument, updateOneRecord } from '@/api/settlements'
import moment from "moment"
import { getFile } from '@/api/summary'
import { askAIDocument, getAIProviders, getAIModels, processExistingDocumentsWithAI } from '@/api/ai'
import { useAppStore } from '@/store/modules/app'
import TableActions from '@/views/Components/TableActions.vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
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
  permissions?: string[]
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

// Get user permissions
const userPermissions = userInfo.permissions || []

// Action buttons based on user permissions
const action_buttons = ref<string[]>([])

// Check permissions and set action buttons
const setActionButtons = () => {
  const buttons: string[] = []
  
  // Always allow preview/download for all users
  buttons.push('preview', 'download')
  
  // Check for edit permission
  if (userPermissions.includes('document:update') || userPermissions.includes('*.*.*')) {
    buttons.push('edit')
  }
  
  // Check for delete permission
  if (userPermissions.includes('document:delete') || userPermissions.includes('*.*.*')) {
    buttons.push('delete')
  }
  
  action_buttons.value = buttons
  console.log('action_buttons', action_buttons.value)
}

// Initialize action buttons
setActionButtons()

// Reactive data
const loading = ref(false)
const loadingText = ref('Loading documents...')
const canCancel = ref(false)
const searchTerm = ref('')
const currentPage = ref(1)
const pageSize = ref(10) // Default, will be adjusted based on screen size
const totalDocs = ref(0)
const documents = ref<Document[]>([])
const categoryCounts = ref<CategoryCounts>({})
const totalDocuments = ref(0)
const selectedCategories = ref(new Set<string>())
const currentlyFiltered = ref(false)
const selectedDocuments = ref<Set<number>>(new Set())
const drawerSearchTerm = ref('')

// Mobile responsiveness
const isMobile = computed(() => appStore.getMobile)
const dialogWidth = ref(isMobile.value ? "90%" : "25%")
const actionColumnWidth = ref(isMobile.value ? "75px" : "160px")

// Responsive page size based on screen height
const getResponsivePageSize = () => {
  const screenHeight = window.innerHeight
  if (screenHeight < 768) { // Mobile and small tablets
    return 5
  } else if (screenHeight < 1024) { // Medium screens
    return 10
  } else { // Larger screens
    return 15
  }
}

// Initialize page size based on screen size
const initializePageSize = () => {
  pageSize.value = getResponsivePageSize()
}

// Handle window resize
const handleResize = () => {
  const newPageSize = getResponsivePageSize()
  if (newPageSize !== pageSize.value) {
    pageSize.value = newPageSize
    currentPage.value = 1 // Reset to first page when changing page size
    loadDocumentRepository()
  }
}

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
      sortOrder: 'DESC', // Ensure latest uploads appear first
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

// Page size handler
const handlePageSizeChange = async (newPageSize: number) => {
  pageSize.value = newPageSize
  currentPage.value = 1 // Reset to first page when changing page size
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

// Batch download function
const batchDownload = async () => {
  if (selectedDocuments.value.size === 0) {
    ElMessage.warning('Please select documents to download')
    return
  }

  try {
    const selectedDocs = documents.value.filter(doc => selectedDocuments.value.has(doc.id))
    
    for (const doc of selectedDocs) {
      await downloadFile(doc)
      // Add a small delay between downloads to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    ElMessage.success(`Downloaded ${selectedDocs.length} document(s)`)
    selectedDocuments.value.clear()
  } catch (error) {
    console.error('Error in batch download:', error)
    ElMessage.error('Failed to download some documents')
  }
}

// Download all documents function
const downloadAllDocuments = async () => {
  try {
    ElMessage.info('Starting download of all documents...')
    
    // Get all documents without pagination
    const requestData = {
      page: 1,
      limit: 10000, // Large limit to get all documents
      searchTerm: searchTerm.value || undefined,
      categoryFilter: selectedCategories.value.size > 0 ? Array.from(selectedCategories.value) : undefined,
      userFilters: roles_filters.length > 0 ? roles_filters : undefined,
      sortBy: 'createdAt',
      sortOrder: 'DESC' // Ensure latest uploads appear first
    }

    const response = await getDocumentRepository(requestData)
    const responseData = (response as any).data || (response as any).results || response
    
    if ((response as any).success && responseData) {
      const allDocs = responseData.documents || []
      
      if (allDocs.length === 0) {
        ElMessage.warning('No documents found to download')
        return
      }
      
      ElMessage.info(`Downloading ${allDocs.length} documents...`)
      
      for (const doc of allDocs) {
        await downloadFile(doc)
        // Add a small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      ElMessage.success(`Downloaded all ${allDocs.length} document(s)`)
    } else {
      ElMessage.error('Failed to load documents for download')
    }
  } catch (error) {
    console.error('Error in download all documents:', error)
    ElMessage.error('Failed to download all documents')
  }
}

// Select all documents
const selectAllDocuments = () => {
  if (selectedDocuments.value.size === documents.value.length) {
    selectedDocuments.value.clear()
  } else {
    documents.value.forEach(doc => selectedDocuments.value.add(doc.id))
  }
}

// Handle table selection change
const handleSelectionChange = (selection: Document[]) => {
  selectedDocuments.value = new Set(selection.map(doc => doc.id))
}

// Edit document functionality
const documentForm = reactive({
  id: null,
  name: '',
  category: undefined as number | undefined, // This will be the document type/category (Report, Checklist, etc.)
  parent_id: undefined as number | undefined, // This will be the specific parent ID (settlement, facility, etc.)
  format: '',
  document_type_id: undefined as number | undefined // This will be the document type (Report, Checklist, etc.)
})

const docCategories = ref<any[]>([])
const docTypes = ref<any[]>([])
const docGroups = ref<any[]>([])
const documentName = ref('')
const dialogVisible = ref(false)

// Upload options for nested group structure
const uploadOptions = [
  {
    label: 'Settlement',
    options: [
      { value: 'settlement', label: 'Settlements' },
      { value: 'project', label: 'Projects' }
    ]
  },
  {
    label: 'Households',
    options: [
      { value: 'beneficiary', label: 'Beneficiaries' }
    ]
  },
  {
    label: 'Facilities',
    options: [
      { value: 'health_facility', label: 'Health' },
      { value: 'education_facility', label: 'Education' },
      { value: 'road', label: 'Roads' },
      { value: 'road_asset', label: 'Structures(roads)' },
      { value: 'water_point', label: 'Water' },
      { value: 'sewer', label: 'Sewer' },
      { value: 'other_facility', label: 'Other' }
    ]
  },
  {
    label: 'Indicators',
    options: [
      { value: 'indicator_category_report', label: 'M&E Reports' }
    ]
  },
  {
    label: 'Contracts',
    options: [
      { value: 'contractor', label: 'Contract Documents' }
    ]
  },
  {
    label: 'Others',
    options: [
      { value: 'other_documents', label: 'Other Documents' }
    ]
  }
]

const theParentModel = ref()
const parentOptions = ref<any[]>([])
const document_field = ref('')
const hide_parent = ref(false)
const disable_submit = ref(true)
const parentTitle = ref("Parent (selected)")
const parentLoading = ref(false)

const getparentOptions = async () => {
  parentLoading.value = true
  parentOptions.value = []
  
  try {
    const res = await getListWithoutGeo({
      params: {
        pageIndex: 1,
        limit: 1000,
        curUser: 1, // Id for logged in user
        model: theParentModel.value, //model 
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC'
      }
    }).then((response: { data: any }) => {
      // console.log('Received response:', response)
      //tableDataList.value = response.data
      var ret = response.data

      ret.forEach(function (arrayItem: any) {
        var countyOpt: any = {}
        countyOpt.value = parseInt(arrayItem.id) // Ensure it's an integer
        console.log(arrayItem)

        if (arrayItem.contract_number) {
          countyOpt.label = arrayItem.contract_number
        }
        else if (arrayItem.name) {
          countyOpt.label = arrayItem.name  
        }
        else {
          countyOpt.label = arrayItem.title  
        }
        console.log(countyOpt)
        parentOptions.value.push(countyOpt)
      })
    })
  } catch (error) {
    console.error('Error loading parent options:', error)
    ElMessage.error('Failed to load parent options')
  } finally {
    parentLoading.value = false
  }
}

const handleSelectType = async (type: string) => {
  theParentModel.value = type
  console.log('Selected.....>', type)

  disable_submit.value = false
  if (type === 'settlement') {
    document_field.value = 'settlement_id'
    parentTitle.value = "Settlement"
    getparentOptions()
  }
  else if (type === 'beneficiary') {
    document_field.value = 'beneficiary_id'
    parentTitle.value = "Beneficiary"
    getparentOptions()
  }
  else if (type === 'project') {
    document_field.value = 'project_id'
    parentTitle.value = "Project"
    getparentOptions()
  }
  else if (type === 'contractor') {
    document_field.value = 'contractor_id'
    parentTitle.value = "Contract"
    getparentOptions()
  }
  else if (type === 'health_facility') {
    document_field.value = 'health_facility_id'
    parentTitle.value = "Health Facility"
    getparentOptions()
  }
  else if (type === 'education_facility') {
    document_field.value = 'education_facility_id'
    parentTitle.value = "Education Facility"
    getparentOptions()
  }
  else if (type === 'road') {
    document_field.value = 'road_id'
    parentTitle.value = "Road"
    getparentOptions()
  }
  else if (type === 'road_asset') {
    document_field.value = 'road_asset_id'
    parentTitle.value = "Asset"
    getparentOptions()
  }
  else if (type === 'water_point') {
    document_field.value = 'water_point_id'
    parentTitle.value = "Water Point"
    getparentOptions()
  }
  else if (type === 'sewer') {
    document_field.value = 'sewer_id'
    parentTitle.value = "Sewer"
    getparentOptions()
  }
  else if (type === 'other_facility') {
    document_field.value = 'other_facility_id'
    parentTitle.value = "Other Facility"
    getparentOptions()
  }
  else if (type === 'indicator_category_report') {
    document_field.value = 'indicator_category_report'
    parentTitle.value = "M&E Report"
    getparentOptions()
  }
  else if (type === 'other_documents') {
    hide_parent.value = true
  }

  console.log(theParentModel.value)
}

const editDocument = (data: Document) => {
  console.log('Edit', data)

  // Reset form state
  theParentModel.value = null
  parentOptions.value = []
  document_field.value = ''
  hide_parent.value = false
  disable_submit.value = true
  parentTitle.value = "Parent (selected)"

  // Copy all properties from data to documentForm
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (key === "name") {
        // If the property name is "name" and contains a dot, strip the text after the dot
        const propertyName = (data as any)[key].split('.')[0];
        console.log(propertyName)
        documentForm['name'] = (data as any)[key].split('.')[0];
      } else {
        (documentForm as any)[key] = (data as any)[key];
      }
    }
  }

  console.log('documentForm', documentForm)
  documentName.value = "Editing: " + data.name

  dialogVisible.value = true

  // Load document types from database
  getDocumentTypes()
}

const handleClose = () => {
  dialogVisible.value = false
}

const getDocumentTypes = async () => {
  try {
    const response = await getListWithoutGeo({
      params: {
        curUser: 1,
        model: 'document_type',
        associated_multiple_models: ['document_category'],
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC'
      }
    });

    console.log('Doc Types', response.data)
    docTypes.value = response.data

    // Populate docCategories for the dropdown
    docCategories.value = response.data.map(item => ({
      value: item.id,
      label: item.type
    }))

    response.data.forEach(item => {
      let documentCategory = item.document_category;
      let existingEntry = docGroups.value.find(entry => entry.id === documentCategory.id);

      if (!existingEntry) {
        docGroups.value.push({
          id: documentCategory.id,
          title: documentCategory.title
        });
      }
    });

    console.log('Doc docGroups', docGroups.value)

  } catch (error) {
    console.error('Error fetching document types:', error);
  }
}

const handleSubmitData = async () => {
  try {
    // Update the document with the new nested structure
    const result = "/data/uploads/" + documentForm.name + '.' + documentForm.format;  
    (documentForm as any).edited_name = documentForm.name + '.' + documentForm.format;
    (documentForm as any).model = 'document';
    (documentForm as any).document_field = document_field.value;
    (documentForm as any).theParentModel = theParentModel.value;
    
    // Set the parent_id based on the selected parent
    if (documentForm.parent_id) {
      (documentForm as any)[document_field.value] = parseInt(documentForm.parent_id.toString());
    }
    
    // Set the category to the selected document type
    if (documentForm.category) {
      (documentForm as any).category = parseInt(documentForm.category.toString());
    }
    
    await updateOneRecord(documentForm as any)
 
    dialogVisible.value = false;
    ElMessage.success('Document updated successfully');
    
    // Reload the documents to reflect changes
    await loadDocumentRepository();
  } catch (error) {
    console.error('Error updating document:', error);
    ElMessage.error('Failed to update document');
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

// File icon helper function
const getFileIcon = (format: string) => {
  const fileType = format.toLowerCase()
  
  switch (fileType) {
    case 'pdf':
      return 'vscode-icons:file-type-pdf2'
    case 'doc':
    case 'docx':
      return 'vscode-icons:file-type-word2'
    case 'xls':
    case 'xlsx':
      return 'vscode-icons:file-type-excel2'
    case 'ppt':
    case 'pptx':
      return 'vscode-icons:file-type-powerpoint2'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'vscode-icons:file-type-image'
    case 'txt':
      return 'vscode-icons:file-type-text'
    case 'zip':
    case 'rar':
    case '7z':
      return 'vscode-icons:file-type-zip'
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return 'vscode-icons:file-type-video'
    case 'mp3':
    case 'wav':
    case 'flac':
      return 'vscode-icons:file-type-audio'
    case 'dwg':
    case 'dxf':
      return 'vscode-icons:file-type-cad'
    case 'csv':
      return 'vscode-icons:file-type-csv'
    case 'json':
      return 'vscode-icons:file-type-json'
    case 'xml':
      return 'vscode-icons:file-type-xml'
    case 'html':
    case 'htm':
      return 'vscode-icons:file-type-html'
    case 'css':
      return 'vscode-icons:file-type-css'
    case 'js':
      return 'vscode-icons:file-type-js'
    case 'ts':
      return 'vscode-icons:file-type-typescript-official'
    case 'py':
      return 'vscode-icons:file-type-python'
    case 'java':
      return 'vscode-icons:file-type-java'
    case 'cpp':
    case 'c':
      return 'vscode-icons:file-type-cpp'
    case 'sql':
      return 'vscode-icons:file-type-sql'
    case 'md':
      return 'vscode-icons:file-type-markdown'
    default:
      return 'vscode-icons:file-type-document'
  }
}



// Initialize
onMounted(async () => {
  initializePageSize() // Initialize page size based on screen size
  loadAIConfig()
  await loadDocumentRepository()
  window.addEventListener('resize', handleResize) // Add event listener for resize
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Helper function to get document type name from ID
const getDocumentTypeNameFromId = (typeId: string) => {
  const doc = documents.value.find(doc => doc['document_type.id'] === parseInt(typeId))
  return doc ? doc['document_type.type'] : `Type ${typeId}`
}

// Filtered category counts for drawer
const filteredCategoryCounts = computed(() => {
  if (!drawerSearchTerm.value) {
    return categoryCounts.value
  }
  
  const filtered: CategoryCounts = {}
  const searchLower = drawerSearchTerm.value.toLowerCase()
  
  Object.entries(categoryCounts.value).forEach(([groupName, types]) => {
    const filteredTypes: { [key: string]: any } = {}
    
    Object.entries(types).forEach(([typeId, typeData]) => {
      const typeName = typeof typeData === 'object' && typeData !== null ? (typeData as any).name : getDocumentTypeNameFromId(typeId)
      if (typeName.toLowerCase().includes(searchLower) || groupName.toLowerCase().includes(searchLower)) {
        filteredTypes[typeId] = typeData
      }
    })
    
    if (Object.keys(filteredTypes).length > 0) {
      filtered[groupName] = filteredTypes
    }
  })
  
  return filtered
})


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
        Filter By Category
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
            <Icon icon="mingcute:mic-ai-fill" width="16" style="margin-right: 4px;" />
            KesMIS-AI Chat 
          </el-button>
        </el-col>
      </el-row>
    </div>
    
    <!-- Selection Controls -->
    <div v-if="selectedDocuments.size > 0" style="margin: 10px 0; padding: 10px; background-color: #f5f7fa; border-radius: 4px;">
      <el-row :gutter="16" align="middle">
        <el-col :span="12">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 14px; color: #606266;">
              {{ selectedDocuments.size }} document(s) selected
            </span>
          </div>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button 
            @click="batchDownload" 
            type="primary" 
            size="small"
          >
            <Icon icon="material-symbols:download" width="16" style="margin-right: 4px;" />
            Download Selected ({{ selectedDocuments.size }})
          </el-button>
          <el-button 
            @click="selectedDocuments.clear()" 
            type="info" 
            plain 
            size="small"
            style="margin-left: 8px;"
          >
            <Icon icon="material-symbols:clear" width="16" style="margin-right: 4px;" />
            Clear Selection
          </el-button>
        </el-col>
      </el-row>
    </div>
    
    <!-- Download All Button -->
    <!-- <div v-if="totalDocs > 0" style="margin: 10px 0;">
      <el-button 
        @click="downloadAllDocuments" 
        type="success" 
        plain 
        size="small"
      >
        <Icon icon="material-symbols:download" width="16" style="margin-right: 4px;" />
        Download All ({{ totalDocs }})
      </el-button>
    </div> -->

    <!-- Documents Table -->
    <el-table 
      :data="documents" 
      style="width: 100%" 
      size="small" 
      class="thin-rows-table" 
      border 
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <!-- Selection Column -->
      <el-table-column type="selection" width="55" />
      
      <el-table-column label="#" type="index" width="50">
        <template #default="{ $index }">
          <span>{{ ($index + 1) + ((currentPage - 1) * pageSize) }}</span>
        </template>
      </el-table-column>
                      <el-table-column prop="name" label="Title">
                  <template #default="{ row }">
                    <div class="file-icon clickable-file" @click="downloadFile(row)">
                      <Icon :icon="getFileIcon(row.format)" width="20" />
                      <span class="file-link">{{ row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="settlement.name" label="Settlement" />
      <el-table-column prop="createdAt" label="Date" :formatter="formatEndDate" />
                 <el-table-column prop="user.name" label="User" />
                <el-table-column prop="size" label="Size(Mb)" />
      <el-table-column label="Actions" :width="actionColumnWidth">
        <template #default="{ row }">
          <PermissionWrapper :permissions="action_buttons.length > 0 ? ['document:read'] : []">
            <TableActions 
              :item="row" 
              :buttons="action_buttons" 
              @edit="editDocument" 
              @delete="removeDocument" 
              @preview="viewDocument" 
             
            />
          </PermissionWrapper>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-wrapper" v-if="totalDocs > 0">
      <div class="pagination-controls">
        <div class="page-size-selector">
          <span class="page-size-label">Show:</span>
          <el-select 
            v-model="pageSize" 
            size="small" 
            style="width: 80px; margin-left: 8px;"
            @change="handlePageSizeChange"
          >
            <el-option label="5" :value="5" />
            <el-option label="8" :value="8" />
            <el-option label="10" :value="10" />
            <el-option label="25" :value="25" />
            <el-option label="50" :value="50" />
            <el-option label="100" :value="100" />
          </el-select>
          <span class="page-size-label" style="margin-left: 8px;">per page</span>
        </div>
        
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          background
          small
          layout="total, prev, pager, next, jumper"
          :total="totalDocs"
          @current-change="handlePageChange"
        />
      </div>
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
      
      <div style="padding: 10px;">
        <!-- Search Input -->
        <div class="drawer-search">
          <el-input
            v-model="drawerSearchTerm"
            placeholder="Search document types..."
            clearable
            size="small"
          >
            <template #prefix>
              <Icon icon="material-symbols:search" width="16" />
            </template>
          </el-input>
        </div>
        
        <div v-if="Object.keys(filteredCategoryCounts).length > 0" class="filter-drawer-content">
          <div v-for="(types, groupName) in filteredCategoryCounts" :key="groupName" class="filter-group">
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

    <!-- Edit Document Drawer -->
    <el-drawer
      v-model="dialogVisible"
      direction="rtl"
      size="500px"
      :before-close="handleClose"
    >
      <template #header>
        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0;">{{ documentName }}</h3>
        </div>
      </template>
      
      <div style="padding: 24px;">
        <el-form :model="documentForm" label-width="auto" style="max-width: 600px">
          <el-form-item label="Document name">
            <el-input v-model="documentForm.name" />
          </el-form-item>
          
          <el-form-item label="Document Parent">
            <el-select v-model="theParentModel" placeholder="Select Parent" @change="handleSelectType">
              <el-option-group
                v-for="group in uploadOptions"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="item in group.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-option-group>
            </el-select>
          </el-form-item>

          <el-form-item v-if="!hide_parent" :label="parentTitle">
            <el-select
filterable clearable
              v-model="documentForm.parent_id" 
              placeholder="please select your parent"
              v-loading="parentLoading"
              :loading="parentLoading"
            >
              <el-option
                v-for="item in parentOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Document category">
            <el-select v-model="documentForm.category" placeholder="Select  document category">
              <el-option v-for="item in docCategories" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="File format">
            <el-input v-model="documentForm.format" disabled />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSubmitData" :disabled="disable_submit">Save Changes</el-button>
            <el-button @click="dialogVisible = false">Cancel</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>

  
  </el-card>
</template>

<style scoped>
/* Filter Drawer Styles */
.drawer-search {
  margin-bottom: 16px;
}

.filter-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-group {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.filter-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.filter-group-title {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.filter-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filter-checkbox-item {
  padding: 2px 0;
}

.filter-checkbox {
  width: 100%;
}

.checkbox-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 2px 0;
}

.checkbox-label {
  font-size: 13px;
  color: #303133;
  flex: 1;
}

.checkbox-badge {
  margin-left: 6px;
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

/* File icon styles */
.file-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon .iconify {
  flex-shrink: 0;
}

/* Clickable file styles */
.clickable-file {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-file:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 4px 8px;
  margin: -4px -8px;
}

.file-link {
  color: #409eff;
  text-decoration: none;
  transition: color 0.2s ease;
}

.file-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* Table row hover effect */
.el-table__body tr:hover > td {
  background-color: #f5f7fa !important;
}

.pagination-wrapper {
  margin-top: 20px;
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-size-selector {
  display: flex;
  align-items: center;
}

.page-size-label {
  font-size: 14px;
  color: #606266;
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

/* Edit Document Form Styles */
.edit-document-form {
  .el-form-item {
    margin-bottom: 24px;
  }
  
  .el-form-item__label {
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }
  
  .el-form-item.is-required .el-form-item__label::before {
    color: #f56c6c;
  }
  
  .el-input,
  .el-select {
    .el-input__wrapper {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .el-input__wrapper:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
    
    .el-input__wrapper.is-focus {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }
  
  .el-divider {
    margin: 32px 0 24px 0;
    
    .el-divider__text {
      background-color: #f5f7fa;
      padding: 0 16px;
      font-size: 14px;
    }
  }
}

/* Spinner animation for AI processing */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>