<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getDocumentRepository, getDocumentUploaders } from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'
import { ElButton, ElRow, ElCol,ElDialog, ElCard, ElTable, ElTableColumn, ElCheckbox, ElPagination, ElTag,ElForm,ElFormItem,
  ElInput, ElMessage, ElSelect, ElOption, ElDrawer, ElDivider,ElUpload, ElTabs, ElTabPane, ElDatePicker } from 'element-plus'
import { Document, Loading } from '@element-plus/icons-vue'
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
import { uploadFilesBatch, checkFilesExist } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import { searchByKeyWord } from '@/api/settlements'

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
  downloadCount: number
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
  // Clear existing buttons first
  action_buttons.value = []
    // Check for delete permission - only use specific document:delete permission
    if (userPermissions.includes('document:delete')) {
    action_buttons.value.push('delete')
  }
  // Always allow preview/download for all users
  action_buttons.value.push('preview', 'download')
  
  // Check for edit permission
  if (userPermissions.includes('document:update')) {
    action_buttons.value.push('edit')
  }
  

  
  console.log('action_buttons', action_buttons.value)
  console.log('userPermissions', userPermissions)
}

// Initialize action buttons
setActionButtons()

// Watch for changes in user permissions and update action buttons
watch(() => userPermissions, () => {
  setActionButtons()
}, { immediate: true })

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
const selectedUploaders = ref(new Set<string>())
const currentlyFiltered = ref(false)
const selectedDocuments = ref<Set<number>>(new Set())
const drawerSearchTerm = ref('')
const uploaderCounts = ref<{ [key: string]: { id: number, name: string, count: number } }>({})
const activeFilterTab = ref('category')
const uploadersLoading = ref(false)

// Tab management
const activeTab = ref('documents')

// Sort options
const sortOption = ref('date') // 'date' or 'popularity'

// Date filter variables
const dateRange = ref<[Date, Date] | null>(null)
const selectedDateRange = ref('')
const customDateRange = ref<[Date, Date] | null>(null)

// Note: Using customDateRange directly for the date picker

// Mobile responsiveness
const isMobile = computed(() => appStore.getMobile)
const actionColumnWidth = ref(isMobile.value ? "150px" : "260px")

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
      uploaderFilter: selectedUploaders.value.size > 0 ? Array.from(selectedUploaders.value) : undefined,
      dateFilter: dateRange.value ? {
        startDate: dateRange.value[0].toISOString(),
        endDate: dateRange.value[1].toISOString()
      } : undefined,
      userFilters: roles_filters.length > 0 ? roles_filters : undefined,
      sortBy: sortOption.value === 'popularity' ? 'downloadCount' : 'createdAt',
      sortOrder: 'DESC', // Ensure latest uploads appear first for date, most popular first for popularity
      ...params
    }

    console.log('loadDocumentRepository - requestData:', requestData);

    const response = await getDocumentRepository(requestData)
    
    console.log('API Response:', response)
    console.log('Response type:', typeof response)
    console.log('Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'Not an object')
    console.log('Response.success:', (response as any)?.success)
    console.log('Response.data keys:', (response as any)?.data ? Object.keys((response as any).data) : 'No data object')
    
    // Handle different response structures
    let responseData: any
    let success = false
    
    if (response && typeof response === 'object') {
      // Check if response has a success property
      if ('success' in response) {
        success = Boolean((response as any).success)
        responseData = (response as any).data || (response as any).results || response
      } else if ('data' in response) {
        // Direct data structure
        success = true
        responseData = (response as any).data
      } else if (Array.isArray(response)) {
        // Direct array response
        success = true
        responseData = { documents: response }
      } else {
        // Assume it's the data itself
        success = true
        responseData = response
      }
    }
    
    if (success && responseData) {
      // Handle different possible document array locations
      let allDocuments: Document[] = []
      
      if (responseData.documents && Array.isArray(responseData.documents)) {
        allDocuments = responseData.documents as Document[]
      } else if (responseData.data && Array.isArray(responseData.data)) {
        allDocuments = responseData.data as Document[]
      } else if (Array.isArray(responseData)) {
        allDocuments = responseData as Document[]
      } else if (responseData.results && Array.isArray(responseData.results)) {
        allDocuments = responseData.results as Document[]
      } else {
        // Fallback: check all properties for arrays
        console.log('No standard document array found, checking all properties...')
        console.log('Available response keys:', Object.keys(responseData))
        
        for (const key in responseData) {
          if (Array.isArray(responseData[key])) {
            console.log(`Found array at key "${key}" with length:`, responseData[key].length)
            // Check if this array contains document-like objects
            if (responseData[key].length > 0) {
              const firstItem = responseData[key][0]
              const hasDocumentProperties = firstItem && (
                firstItem.hasOwnProperty('name') || 
                firstItem.hasOwnProperty('filename') || 
                firstItem.hasOwnProperty('format') ||
                firstItem.hasOwnProperty('id')
              )
              
              if (hasDocumentProperties) {
                allDocuments = responseData[key] as Document[]
                console.log('Using array from key:', key, '(verified as documents)')
                break
              } else {
                console.log(`Array at "${key}" doesn't appear to contain documents`)
              }
            }
          }
        }
        
        // If still no documents found, log the full response structure
        if (allDocuments.length === 0) {
          console.warn('No document arrays found in response. Full response structure:')
          console.warn(JSON.stringify(responseData, null, 2))
        }
      }
      
      console.log('Documents received from backend:', allDocuments.length)
      console.log('Sample document:', allDocuments[0])
      console.log('Sample document downloadCount:', allDocuments[0]?.downloadCount)
      console.log('Sample document keys:', allDocuments[0] ? Object.keys(allDocuments[0]) : 'No documents')
      documents.value = allDocuments
      categoryCounts.value = responseData.categoryCounts || {}
      // uploaderCounts now loaded separately via dedicated endpoint
      
      // Keep the original total count for pagination, but update the displayed count
      totalDocuments.value = responseData.totalDocuments || responseData.total || allDocuments.length
      totalDocs.value = responseData.pagination?.totalItems || responseData.totalDocuments || responseData.total || allDocuments.length
      
      console.log('Final documents array length:', documents.value.length)
      console.log('Total docs:', totalDocs.value)
      
      // Add deletable property based on permissions
      documents.value.forEach(doc => {
        doc.deletable = doc.createdBy === userInfo.id || showAdminButtons.value
      })

      // Update action buttons after documents are loaded
      setActionButtons()

      // Load documents based on current tab
      await loadDocumentsByTab()

      // Ensure pagination is valid
      if (totalDocs.value < pageSize.value) {
        currentPage.value = 1
      }
      
      // If current page is beyond the available data, reset to first page
      const maxPage = Math.ceil(totalDocs.value / pageSize.value)
      if (currentPage.value > maxPage && maxPage > 0) {
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

// Uploader filter handlers
const handleUploaderToggle = (uploaderId: string) => {
  const newSet = new Set(selectedUploaders.value)
  if (newSet.has(uploaderId)) {
    newSet.delete(uploaderId)
  } else {
    newSet.add(uploaderId)
  }
  selectedUploaders.value = newSet
}

// Date filter options
const dateRangeOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last7days' },
  { label: 'Last 30 days', value: 'last30days' },
  { label: 'Last 3 months', value: 'last3months' },
  { label: 'Last 6 months', value: 'last6months' },
  { label: 'This year', value: 'thisyear' },
  { label: 'Custom range', value: 'custom' }
]

// Date filter handlers
const handleDateRangeSelect = (value: string) => {
  selectedDateRange.value = value
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (value) {
    case 'today':
      const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      dateRange.value = [today, endOfToday]
      break
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const endOfYesterday = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      dateRange.value = [yesterday, endOfYesterday]
      break
    case 'last7days':
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateRange.value = [sevenDaysAgo, now]
      break
    case 'last30days':
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateRange.value = [thirtyDaysAgo, now]
      break
    case 'last3months':
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      dateRange.value = [threeMonthsAgo, now]
      break
    case 'last6months':
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      dateRange.value = [sixMonthsAgo, now]
      break
    case 'thisyear':
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      dateRange.value = [startOfYear, now]
      break
    case 'custom':
      dateRange.value = customDateRange.value
      break
    default:
      dateRange.value = null
  }
  
  // Debug logging
  if (dateRange.value) {
    console.log('Date range selected:', value)
    console.log('Start date:', dateRange.value[0])
    console.log('End date:', dateRange.value[1])
    console.log('Start ISO:', dateRange.value[0].toISOString())
    console.log('End ISO:', dateRange.value[1].toISOString())
  }
}

const handleCustomDateChange = (dates: [Date, Date] | null) => {
  customDateRange.value = dates
  if (selectedDateRange.value === 'custom') {
    dateRange.value = dates
  }
}

const clearDateFilter = () => {
  selectedDateRange.value = ''
  dateRange.value = null
  customDateRange.value = null
}

const applyFilters = async () => {
  console.log('applyFilters - selectedCategories:', Array.from(selectedCategories.value));
  console.log('applyFilters - selectedUploaders:', Array.from(selectedUploaders.value));
  console.log('applyFilters - dateRange:', dateRange.value);
  if (dateRange.value) {
    console.log('applyFilters - dateRange ISO strings:', {
      startDate: dateRange.value[0].toISOString(),
      endDate: dateRange.value[1].toISOString()
    });
  }
  currentPage.value = 1
  currentlyFiltered.value = selectedCategories.value.size > 0 || selectedUploaders.value.size > 0 || !!dateRange.value || !!searchTerm.value
  await loadDocumentRepository()
  filterDrawer.value = false
}

// Clear filters
const clearFilters = async () => {
  searchTerm.value = ''
  selectedCategories.value = new Set<string>()
  selectedUploaders.value = new Set<string>()
  clearDateFilter()
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

// Sort handler
const handleSortChange = async (newSortOption: string) => {
  sortOption.value = newSortOption
  currentPage.value = 1 // Reset to first page when changing sort
  await loadDocumentRepository()
}

// File operations
const downloadFile = async (data: Document, showMessages = true) => {
  try {
    if (showMessages) {
      ElMessage.info(`Starting download: ${data.name}`)
    }
    
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
    
    if (showMessages) {
      ElMessage.success(`Download completed: ${fname}`)
    }
  } catch (error) {
    console.error('Error downloading file:', error)
    if (showMessages) {
      ElMessage.error('Download failed.')
    }
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
    
    ElMessage.info(`Starting batch download of ${selectedDocs.length} document(s). This may take a while...`)
    
    for (const doc of selectedDocs) {
      await downloadFile(doc, false) // Don't show individual messages
      // Add a small delay between downloads to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    ElMessage.success(`Batch download completed: ${selectedDocs.length} document(s)`)
    selectedDocuments.value.clear()
  } catch (error) {
    console.error('Error in batch download:', error)
    ElMessage.error('Failed to download some documents')
  }
}

// Download all documents function

// Select all documents

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
    if (!theParentModel.value) {
      return
    }

    const associatedModels = theParentModel.value === 'settlement' ? ['county', 'subcounty', 'ward'] :
      ['project', 'contractor', 'road', 'road_asset'].includes(theParentModel.value) ? [] :
      ['county', 'subcounty', 'ward']

    const formData = {
      curUser: 1,
      model: theParentModel.value,
      searchField: theParentModel.value === 'project' ? 'title' : 'name',
      searchKeyword: '',
      excludeGeom: false,
      excludeGeomAssoc: true,
      associated_multiple_models: associatedModels,
      filters: [],
      filterValues: [],
    }

    const response = await searchByKeyWord(formData as any)
    const data = (response as any).data
    
    if (data && data.length > 0) {
      parentOptions.value = data.map((item: any) => ({
        value: item.id,
        label: item.name || item.title || item.contract_number || 'Unknown',
        county: item.county?.name,
        subcounty: item.subcounty?.name,
        ward: item.ward?.name,
        ward_id: item.ward?.id,
        subcounty_id: item.subcounty?.id,
        county_id: item.county?.id,
      }))
    } else {
      ElMessage.warning('No parent options found for the selected entity.')
    }
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



// Chat Functions





// Process existing documents functionality

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
  
  // Set action buttons after component is mounted and DOM is ready
  await nextTick()
  setActionButtons()
  
  await loadDocumentRepository()
  // Load documents based on current tab after loading
  await loadDocumentsByTab()
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

// Computed property to show filtered vs total documents
const displayInfo = computed(() => {
  const filteredCount = documents.value.length
  const totalCount = totalDocs.value
  
  if (filteredCount === totalCount) {
    return `Showing ${filteredCount} documents`
  } else {
    return `Showing ${filteredCount} of ${totalCount} documents`
  }
})

const importDrawerVisible = ref(false)
const importStep = ref(0)
const importFileList = ref<any[]>([])
const importTargetModel = ref('')
const importDocTypes = ref<any[]>([])
const importParentOptions = ref<any[]>([])
const importFileMetadata = ref<any[]>([])
const importFieldMappings = ref<any[]>([])
const importLoading = ref({ upload: false, fetchParents: false, import: false })
const importFieldSearch = ref('')
const importPreviewCount = ref(1)
const importCanImport = ref(true)

const IMPORT_UPLOAD_OPTIONS = [
  { value: 'settlement', label: 'Settlements' },
  { value: 'project', label: 'Projects' },
  { value: 'health_facility', label: 'Health Facilities' },
  { value: 'education_facility', label: 'Education Facilities' },
  { value: 'road', label: 'Roads' },
  { value: 'road_asset', label: 'Road Assets' },
  { value: 'water_point', label: 'Water Points' },
  { value: 'piped_water', label: 'Piped Water' },
  { value: 'sewer', label: 'Sewer' },
  { value: 'other_facility', label: 'Other Facilities' },
  { value: 'other_documents', label: 'Other Documents' },
]
const IMPORT_MODEL_MAPPINGS = {
  settlement: 'settlement_id',
  project: 'project_id',
  education_facility: 'education_facility_id',
  road: 'road_id',
  road_asset: 'road_asset_id',
  water_point: 'water_point_id',
  sewer: 'sewer_id',
  other_facility: 'other_facility_id',
  other_documents: null,
}

// Add file upload handler for import drawer
const importBeforeUpload = (file) => {
  const types = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-zip-compressed',
    'application/vnd.rar',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/tiff',
    'text/csv',
    'text/plain',
    'application/json',
    'application/vnd.geo+json',
    'application/vnd.google-earth.kml+xml',
    'application/vnd.google-earth.kmz',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  const isValidType = types.includes(file.type);
  const isLt50M = file.size / 1024 / 1024 < 5000;
  if (!isValidType) {
    ElMessage.error(`${file.type} file type is not allowed`);
    return false;
  }
  if (!isLt50M) {
    ElMessage.error('File size should not exceed 5GB');
    return false;
  }
  return true;
};

const importHandleFileUpload = (uploadFile) => {
  const file = uploadFile.raw || uploadFile.file;
  if (!file || !importBeforeUpload(file)) return;
  // Prevent duplicates based on name + size
  const exists = importFileList.value.some(f => f.name === file.name && f.size === file.size);
  if (exists) {
    ElMessage.warning(`File ${file.name} already uploaded.`);
    return;
  }
  const currentIndex = importFileList.value.length;
  importFileList.value.push({ ...uploadFile, protected: false, type: '', field_id: '' });
  importFileMetadata.value.push({
    name: file.name,
    type: '',
    format: file.name.split('.').pop() || '',
    size: (file.size / 1024 / 1024).toFixed(2),
    protected: false,
    field_id: ''
  });
  importFieldMappings.value.push({ fileIndex: currentIndex, type: '', field_id: '' });
  ElMessage.success(`File ${file.name} loaded successfully!`);
};

const importHandleSelectModel = async (model: string) => {
  importTargetModel.value = model;
  importParentOptions.value = [];
  const mappedFieldId = IMPORT_MODEL_MAPPINGS[model] || undefined;
  importFieldMappings.value = importFileList.value.map((_, index) => ({
    fileIndex: index,
    type: '',
    field_id: mappedFieldId,
  }));
  if (mappedFieldId) {
    importLoading.value.fetchParents = true;
    try {
      const associatedModels = model === 'settlement' ? ['county', 'subcounty', 'ward'] :
        ['project', 'contractor', 'road', 'road_asset'].includes(model) ? [] :
        ['county', 'subcounty', 'ward'];
      const formData = {
        curUser: 1,
        model: model,
        searchField: model === 'project' ? 'title' : 'name',
        searchKeyword: '',
        excludeGeom: false,
        excludeGeomAssoc: true,
        associated_multiple_models: associatedModels,
        filters: [],
        filterValues: [],
      };
      const response = await searchByKeyWord(formData as any);
      const data = (response as any).data;
      if (data && data.length > 0) {
        importParentOptions.value = data.map((item: any) => ({
          value: item.id,
          label: item.name || item.title || item.contract_number || 'Unknown',
          county: item.county?.name,
          subcounty: item.subcounty?.name,
          ward: item.ward?.name,
          ward_id: item.ward?.id,
          subcounty_id: item.subcounty?.id,
          county_id: item.county?.id,
        }));
      } else {
        ElMessage.warning('No parent options found for the selected entity.');
      }
    } catch (err: any) {
      ElMessage.error(err.message || 'Failed to load parent options');
    } finally {
      importLoading.value.fetchParents = false;
    }
  }
  importStep.value++;
}

// Add docTypes fetch for import drawer
const getImportDocTypes = async () => {
  try {
    const res = await getListWithoutGeo({
      params: {
        pageIndex: 1,
        limit: 100,
        curUser: 1,
        model: 'document_type',
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC',
      },
    });
    const nestedData = res.data.reduce((acc: any, cur: any) => {
      const group = cur.group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push({ value: cur.id, label: cur.type });
      return acc;
    }, {});
    importDocTypes.value = Object.entries(nestedData).map(([label, options]) => ({ label, options }));
  } catch (err) {
    ElMessage.error('Failed to load document types');
  }
}
// Fetch doc types on mount
onMounted(() => { getImportDocTypes(); });

const importFiles = async () => {
  importLoading.value.import = true;
  try {
    // Validate required fields
    for (const mapping of importFieldMappings.value) {
      if (!mapping.type) {
        ElMessage.error('Please select a document type for all files.');
        importLoading.value.import = false;
        return;
      }
      if (importTargetModel.value !== 'other_documents' && !mapping.parent_id) {
        ElMessage.error('Please select a parent entity for all files.');
        importLoading.value.import = false;
        return;
      }
    }
    // Build file metadata
    importFileMetadata.value = importFileList.value.map((file, index) => {
      const mapping = importFieldMappings.value[index];
      const metadata: any = {
        name: file.name,
        type: mapping.type,
        format: file.name.split('.').pop() || '',
        size: (file.size / 1024 / 1024).toFixed(2),
        protected: file.protected || false,
        field_id: mapping.field_id,
      };
      if (mapping.field_id && mapping.parent_id) {
        metadata[mapping.field_id] = mapping.parent_id;
      }
      return metadata;
    });
    // Build FormData
    const formData = new FormData();
    importFileList.value.forEach((file, index) => {
      const metadata = importFileMetadata.value[index];
      formData.append('files', file.raw);
      formData.append('model', 'document');
      formData.append('createdBy', '1'); // Use actual user ID if available
      formData.append('format', metadata.format);
      formData.append('category', metadata.type);
      if (metadata.field_id && metadata[metadata.field_id]) {
        formData.append('field_id', metadata.field_id);
        formData.append(metadata.field_id, metadata[metadata.field_id].toString());
      }
      formData.append('protected', metadata.protected.toString());
      formData.append('size', metadata.size);
      formData.append('code', uuid.v4());
    });
    // Upload
    const response = await uploadFilesBatch(formData as any);
    const resData = (response as any).data || response;
    if (Array.isArray(resData.errors) && resData.errors.length > 0) {
      const errorDetails = resData.errors.map((err: any, idx: number) => {
        const fileIndex = err.index ?? idx;
        const reason = err.detail ?? 'Unknown error';
        return `File ${importFileList.value[fileIndex].name}: ${reason}`;
      }).join('\n');
      ElMessage.error(`Some files failed to import:\n${errorDetails}`);
      importLoading.value.import = false;
      return;
    }
    if (resData.code === '0000') {
      ElMessage.success(`Files imported successfully! ${importFileList.value.length} files imported.`);
      importDrawerVisible.value = false;
      await loadDocumentRepository();
    } else {
      ElMessage.warning(`Imported ${importFileList.value.length - (resData.failedCount || 0)} of ${importFileList.value.length} files successfully.`);
    }
  } catch (err: any) {
    ElMessage.error(err.message || 'Error importing files. Please check the data and try again.');
  } finally {
    importLoading.value.import = false;
  }
}

// Load uploaders function
const loadUploaders = async () => {
  if (Object.keys(uploaderCounts.value).length > 0) {
    return; // Already loaded
  }
  
  uploadersLoading.value = true;
  try {
    const response = await getDocumentUploaders();
    console.log('Uploaders response:', response);
    
    if ((response as any).success && (response as any).data) {
      uploaderCounts.value = (response as any).data.uploaders || {};
      console.log('Loaded uploaders:', uploaderCounts.value);
    } else {
      ElMessage.error('Failed to load uploaders');
    }
  } catch (error) {
    console.error('Error loading uploaders:', error);
    ElMessage.error('Failed to load uploaders');
  } finally {
    uploadersLoading.value = false;
  }
};

// Handle tab change
const handleTabChange2 = (tabName: string) => {
  if (tabName === 'uploader') {
    loadUploaders();
  }
};

const filterDrawerSize = computed(() => isMobile.value ? '100%' : '400px')
const editDrawerSize = computed(() => isMobile.value ? '100%' : '40%')
const importDrawerSize = computed(() => isMobile.value ? '100%' : '40%')

// Tab filtering properties
const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'tif']
const filteredDocuments = ref<Document[]>([])
const filteredPhotos = ref<Document[]>([])

const documentsCount = computed(() => filteredDocuments.value.length)
const photosCount = computed(() => filteredPhotos.value.length)

// Function to load documents based on tab
const loadDocumentsByTab = async () => {
  if (activeTab.value === 'documents') {
    // For documents tab, use the already loaded documents and filter client-side
    filteredDocuments.value = documents.value.filter(doc => {
      let format = doc.format
      if (!format && doc.name) {
        const match = doc.name.match(/\.([^.]+)$/)
        format = match ? match[1] : null
      }
      
      if (!format) {
        return true
      }
      
      const formatLower = format.toLowerCase()
      return !imageFormats.includes(formatLower)
    })
  } else if (activeTab.value === 'photos') {
    // For photos tab, make a server request to get only photo documents
    try {
      loading.value = true
      loadingText.value = 'Loading photos...'
      
      const requestData = {
        page: currentPage.value,
        limit: pageSize.value,
        searchTerm: searchTerm.value || undefined,
        categoryFilter: selectedCategories.value.size > 0 ? Array.from(selectedCategories.value) : undefined,
        uploaderFilter: selectedUploaders.value.size > 0 ? Array.from(selectedUploaders.value) : undefined,
        dateFilter: dateRange.value ? {
          startDate: dateRange.value[0].toISOString(),
          endDate: dateRange.value[1].toISOString()
        } : undefined,
        userFilters: roles_filters.length > 0 ? roles_filters : undefined,
        sortBy: sortOption.value === 'popularity' ? 'downloadCount' : 'createdAt',
        sortOrder: 'DESC',
        formatFilter: imageFormats // Send image formats to server
      }

      console.log('Loading photos with requestData:', requestData)
      const response = await getDocumentRepository(requestData)
      
      // Handle response similar to main loadDocumentRepository function
      let responseData: any
      let success = false
      
      if (response && typeof response === 'object') {
        if ('success' in response) {
          success = Boolean((response as any).success)
          responseData = (response as any).data || (response as any).results || response
        } else if ('data' in response) {
          success = true
          responseData = (response as any).data
        } else if (Array.isArray(response)) {
          success = true
          responseData = { documents: response }
        } else {
          success = true
          responseData = response
        }
      }
      
      if (success && responseData) {
        let allDocuments: Document[] = []
        
        if (responseData.documents && Array.isArray(responseData.documents)) {
          allDocuments = responseData.documents as Document[]
        } else if (responseData.data && Array.isArray(responseData.data)) {
          allDocuments = responseData.data as Document[]
        } else if (Array.isArray(responseData)) {
          allDocuments = responseData as Document[]
        } else if (responseData.results && Array.isArray(responseData.results)) {
          allDocuments = responseData.results as Document[]
        }
        
        filteredPhotos.value = allDocuments
        console.log('Photos loaded from server:', filteredPhotos.value.length)
        console.log('Photo documents:', filteredPhotos.value)
      } else {
        ElMessage.error('Failed to load photos')
        filteredPhotos.value = []
      }
    } catch (error) {
      console.error('Error loading photos:', error)
      ElMessage.error('Failed to load photos')
      filteredPhotos.value = []
    } finally {
      loading.value = false
    }
  }
}

// Photo handling functions
const getPhotoPreview = (photo: Document) => {
  // For now, return a placeholder. In a real implementation, you'd generate a thumbnail URL
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="Arial" font-size="14">
        ${photo.format.toUpperCase()}
      </text>
    </svg>
  `)}`
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="Arial" font-size="12">
        Image not available
      </text>
    </svg>
  `)}`
}

const handleTabChange = async (tabName: string) => {
  activeTab.value = tabName
  // Reset selection when switching tabs
  selectedDocuments.value.clear()
  // Load documents based on the selected tab
  await loadDocumentsByTab()
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
    <div class="controls-container">
      <el-row :gutter="16" class="controls-row">
        <!-- Search Section -->
        <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14" class="search-col">
          <el-input
            v-model="searchTerm"
            placeholder="Search documents by name, settlement, county, format, or uploader..."
            clearable
            @change="handleSearch"
            @clear="clearFilters"
            size="default"
            class="search-input"
          >
            <template #prepend>
              <Icon icon="material-symbols:search" width="16" />
            </template>
            <template #append>
              <el-button @click="handleSearch" type="primary" :loading="loading">
                Search
              </el-button>
            </template>
          </el-input>
        </el-col>
        
        <!-- Action Buttons Section -->
        <el-col :xs="24" :sm="24" :md="10" :lg="10" :xl="10" class="actions-col">
        
          <div class="action-buttons">
            <div class="sort-options">
              <span class="sort-label">Sort by:</span>
              <el-select 
                v-model="sortOption" 
                @change="handleSortChange"
                size="small"
                style="width: 120px;"
              >
                <el-option label="Date" value="date" />
                <el-option label="Popularity" value="popularity" />
              </el-select>
            </div>

            <el-button 
              @click="importDrawerVisible = true" 
              type="success" 
              plain
              class="action-btn"
            >
              <Icon icon="material-symbols:upload" width="16" />
              <span class="btn-text">Upload</span>
            </el-button>
            
            <el-button 
              @click="filterDrawer = true" 
              type="primary" 
              plain
              class="action-btn"
              :class="{ 'active-filter': currentlyFiltered }"
            >
              <Icon icon="material-symbols:filter-list" width="16" />
              <span class="btn-text">Filters</span>
              <el-badge 
                v-if="selectedCategories.size + selectedUploaders.size + (dateRange ? 1 : 0) > 0" 
                :value="selectedCategories.size + selectedUploaders.size + (dateRange ? 1 : 0)" 
                class="filter-badge"
              />
            </el-button>
            
            <el-button 
              @click="clearFilters" 
              type="warning" 
              plain
              class="action-btn clear-btn"
              :disabled="!currentlyFiltered"
              v-if="currentlyFiltered"
            >
              <Icon icon="material-symbols:clear" width="16" />
              <span class="btn-text">Clear</span>
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- Selection Controls -->
    <div v-if="selectedDocuments.size > 0" style="margin: 10px 0; padding: 10px; background-color: #f5f7fa; border-radius: 4px;">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 14px; color: #606266;">
              {{ selectedDocuments.size }} document(s) selected
            </span>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" class="selection-actions">
          <div class="selection-buttons">
            <el-button 
              @click="batchDownload" 
              type="primary" 
              size="small"
              class="selection-button"
            >
              <Icon icon="material-symbols:download" width="16" style="margin-right: 4px;" />
              Download Selected ({{ selectedDocuments.size }})
            </el-button>
            <el-button 
              @click="selectedDocuments.clear()" 
              type="info" 
              plain 
              size="small"
              class="selection-button"
            >
              <Icon icon="material-symbols:clear" width="16" style="margin-right: 4px;" />
              Clear Selection
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div>
 

         <!-- Documents Display Info -->
     <div class="documents-info" style="margin: 10px 0; padding: 8px; background-color: #f0f9ff; border-radius: 4px; border-left: 4px solid #3b82f6;">
       <span style="font-size: 14px; color: #1e40af;">{{ displayInfo }}</span>
     </div>

     <!-- Tabs for Documents and Photos -->
     <el-tabs v-model="activeTab" class="documents-tabs" @tab-change="handleTabChange">
       <!-- Documents Tab -->
       <el-tab-pane label="Documents" name="documents">
         <template #label>
           <span class="tab-label">
             <Icon icon="material-symbols:description" width="16" style="margin-right: 6px;" />
             Documents
             <el-badge v-if="documentsCount > 0" :value="documentsCount" class="tab-badge" />
           </span>
         </template>
         
         <!-- Documents Table -->
         <div v-if="filteredDocuments.length === 0 && !loading" style="text-align: center; padding: 40px; color: #909399;">
           <Icon icon="material-symbols:description" width="48" style="margin-bottom: 16px; opacity: 0.5;" />
           <p>No documents found</p>
         </div>
         
         <el-table 
           v-if="filteredDocuments.length > 0"
           :data="filteredDocuments" 
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
                      <el-table-column prop="name" label="Title" min-width="300" show-overflow-tooltip>
                  <template #default="{ row }">
                    <div class="file-icon clickable-file" @click="downloadFile(row)">
                      <Icon :icon="getFileIcon(row.format)" width="20" />
                      <span class="file-link document-title">{{ row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="settlement.name" label="Settlement" min-width="120" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="Date" :formatter="formatEndDate" min-width="120" />
                 <el-table-column prop="user.name" label="User" min-width="100" show-overflow-tooltip />
                <el-table-column prop="size" label="Size(Mb)" min-width="80" />
                <el-table-column label="Downloads"  prop="downloadCount"  min-width="50" align="center"/>
              
          
      <el-table-column label="Actions" :width="actionColumnWidth">
        <template #default="{ row }">
             <PermissionWrapper :permissions="['document:read', 'document:delete', 'document:create']">
 
            <TableActions 
              :item="row" 
              :buttons="action_buttons" 
              @edit="editDocument" 
              @delete="removeDocument" 
              @preview="viewDocument" 
              @download="downloadFile(row)"
             
            />
          </PermissionWrapper>
        </template>
      </el-table-column>
    </el-table>
       </el-tab-pane>

       <!-- Photos Tab -->
       <el-tab-pane label="Photos" name="photos">
         <template #label>
           <span class="tab-label">
             <Icon icon="material-symbols:photo" width="16" style="margin-right: 6px;" />
             Photos
             <el-badge v-if="photosCount > 0" :value="photosCount" class="tab-badge" />
           </span>
         </template>
         
         <!-- Photos Grid -->
         <div v-if="filteredPhotos.length === 0 && !loading" style="text-align: center; padding: 40px; color: #909399;">
           <Icon icon="material-symbols:photo" width="48" style="margin-bottom: 16px; opacity: 0.5;" />
           <p>No photos found</p>
         </div>
         
         <div v-if="filteredPhotos.length > 0" class="photos-grid">
           <div 
             v-for="photo in filteredPhotos" 
             :key="photo.id" 
             class="photo-card"
             @click="viewDocument(photo)"
           >
             <div class="photo-preview">
               <img 
                 :src="getPhotoPreview(photo)" 
                 :alt="photo.name"
                 class="photo-image"
                 @error="handleImageError"
               />
               <div class="photo-overlay">
                 <Icon icon="material-symbols:visibility" width="20" />
               </div>
             </div>
             <div class="photo-info">
               <div class="photo-name" :title="photo.name">{{ photo.name }}</div>
               <div class="photo-meta">
                 <span class="photo-size">{{ formatFileSize(photo.size) }}</span>
                 <span class="photo-date">{{ formatEndDate(photo) }}</span>
               </div>
               <div class="photo-actions">
                 <el-button size="small" type="primary" plain @click.stop="downloadFile(photo)">
                   <Icon icon="material-symbols:download" width="14" />
                 </el-button>
                 <el-button size="small" type="success" plain @click.stop="viewDocument(photo)">
                   <Icon icon="material-symbols:visibility" width="14" />
                 </el-button>
                    <el-button 
               
                     size="small" 
                     type="danger" 
                     plain 
                     @click.stop="removeDocument(photo)"
                   >
                     <Icon icon="material-symbols:delete" width="14" />
                   </el-button>
                </div>
             </div>
           </div>
         </div>
       </el-tab-pane>
     </el-tabs>

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
      :size="filterDrawerSize"
      :before-close="() => filterDrawer = false"
    >
      <template #header>
        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 12px;">
            <el-button 
              @click="applyFilters" 
              type="primary" 
              size="small"
              :disabled="selectedCategories.size === 0 && selectedUploaders.size === 0 && !dateRange"
            >
              Apply Filters ({{ selectedCategories.size + selectedUploaders.size + (dateRange ? 1 : 0) }})
            </el-button>
            <el-button 
              @click="() => { selectedCategories = new Set(); selectedUploaders = new Set(); clearDateFilter(); }" 
              type="info" 
              plain 
              size="small"
              :disabled="selectedCategories.size === 0 && selectedUploaders.size === 0 && !dateRange"
            >
              Clear Selection
            </el-button>
          </div>
        </div>
      </template>
      
      <div style="padding: 10px;">
        <!-- Filter Tabs -->
        <el-tabs v-model="activeFilterTab" class="filter-tabs" @tab-change="handleTabChange2">
          <!-- By Category Tab -->
          <el-tab-pane label="By Category" name="category">
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
          </el-tab-pane>

          <!-- By Uploader Tab -->
          <el-tab-pane label="By Uploader" name="uploader">
            <div v-if="uploadersLoading" style="text-align: center; padding: 40px 20px;">
              <el-icon class="is-loading" style="font-size: 24px; color: var(--el-color-primary); margin-bottom: 16px;">
                <Loading />
              </el-icon>
              <p style="color: #909399;">Loading uploaders...</p>
            </div>
            
            <div v-else-if="Object.keys(uploaderCounts).length > 0" class="filter-drawer-content">
              <div class="filter-group">
                <div class="filter-checkboxes">
                  <div 
                    v-for="(uploaderData, uploaderId) in uploaderCounts" 
                    :key="uploaderId" 
                    class="filter-checkbox-item"
                  >
                    <el-checkbox 
                      :model-value="selectedUploaders.has(String(uploaderId))"
                      @change="() => handleUploaderToggle(String(uploaderId))"
                      class="filter-checkbox"
                    >
                      <div class="checkbox-content">
                        <span class="checkbox-label">{{ uploaderData.name }}</span>
                        <el-badge 
                          :value="String(uploaderData.count)" 
                          type="info" 
                          class="checkbox-badge"
                        />
                      </div>
                    </el-checkbox>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else style="text-align: center; color: #909399; padding: 40px 20px;">
              <Icon icon="material-symbols:person" width="48" style="margin-bottom: 16px; opacity: 0.5;" />
              <p>No uploaders available</p>
            </div>
          </el-tab-pane>

          <!-- By Time Tab -->
          <el-tab-pane label="By Time" name="time">
            <div class="filter-drawer-content">
              <div class="filter-group">
                <h4 class="filter-group-title">Upload Date Range</h4>
                
                <!-- Predefined Date Ranges -->
                <div class="date-range-options">
                  <el-select 
                    v-model="selectedDateRange" 
                    placeholder="Select a date range"
                    @change="handleDateRangeSelect"
                    style="width: 100%; margin-bottom: 16px;"
                    clearable
                  >
                    <el-option
                      v-for="option in dateRangeOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </div>

                <!-- Custom Date Range Picker -->
                <div v-if="selectedDateRange === 'custom'" class="custom-date-range">
                  <el-date-picker
                    v-model="customDateRange"
                    type="daterange"
                    range-separator="to"
                    start-placeholder="Start date"
                    end-placeholder="End date"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    @change="handleCustomDateChange"
                    style="width: 100%;"
                  />
                </div>

                <!-- Current Filter Display -->
                <div v-if="dateRange" class="current-date-filter">
                  <div class="filter-info">
                    <Icon icon="material-symbols:calendar-today" width="16" style="margin-right: 8px;" />
                    <span class="filter-label">Active Filter:</span>
                  </div>
                  <div class="filter-value">
                    {{ moment(dateRange[0]).format('MMM DD, YYYY') }} - {{ moment(dateRange[1]).format('MMM DD, YYYY') }}
                  </div>
                  <el-button 
                    type="danger" 
                    size="small" 
                    plain 
                    @click="clearDateFilter"
                    style="margin-top: 8px;"
                  >
                    Clear Date Filter
                  </el-button>
                </div>

                <!-- No Filter Message -->
                <div v-if="!dateRange && !selectedDateRange" style="text-align: center; color: #909399; padding: 20px;">
                  <Icon icon="material-symbols:calendar-month" width="48" style="margin-bottom: 16px; opacity: 0.5;" />
                  <p>Select a date range to filter documents by upload date</p>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>

    <!-- Edit Document Drawer -->
    <el-drawer
      v-model="dialogVisible"
      direction="rtl"
      :size="editDrawerSize"
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
              filterable 
              clearable
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
              >
                <div style="display: flex; align-items: center;">
                  <span style="flex: 1; text-align: left;">{{ item.label }}</span>
                  <span v-if="item.county || item.subcounty || item.ward" style="flex: 2; color: var(--el-text-color-secondary); font-size: 13px; text-align: right;">
                    {{ item.ward }}, {{ item.subcounty }}, {{ item.county }}
                  </span>
                </div>
              </el-option>
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

    <el-drawer
      v-model="importDrawerVisible"
      title="Batch Import Documents"
      :size="importDrawerSize"
      direction="rtl"
      :before-close="() => { importDrawerVisible = false }"
    >
      <el-steps :active="importStep" finish-status="success" align-center>
        <el-step title="Upload Files" />
        <el-step title="Select Target Model" />
        <el-step title="Match Fields" />
        <el-step title="Review & Import" />
      </el-steps>
      <div v-if="importStep === 0" class="mt-4">
        <PermissionWrapper :permissions="'document:create'">
          <el-upload
            action=""
            :auto-upload="false"
            :show-file-list="true"
            :on-change="importHandleFileUpload"
            :limit="20"
            :multiple="true"
            accept=".xls,.xlsx,.pdf,.zip,.doc,.docx,.png,.jpg,.csv,.json,.geojson,.ppt,.pptx,.rar,.tif,.txt"
          >
            <el-button type="primary">Upload Files</el-button>
          </el-upload>
        </PermissionWrapper>
        <p class="text-sm text-gray-500 mt-2">Supported formats: .xls, .xlsx, .pdf, .zip, .doc, .docx, .png, .jpg, .csv, .json, .geojson, .ppt, .pptx, .rar, .tif, .txt</p>
      </div>
      <div v-if="importStep === 1" class="mt-4">
        <el-select
          v-model="importTargetModel"
          filterable
          clearable
          placeholder="Select entity to attach the documents to"
          @change="importHandleSelectModel"
          :disabled="importLoading.fetchParents"
        >
          <el-option v-for="item in IMPORT_UPLOAD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div v-if="importStep === 2" class="mt-4">
        <el-input
          v-model="importFieldSearch"
          placeholder="Search files"
          clearable
          class="mb-2"
          aria-label="Search files"
        />
        <div class="max-h-[60vh] overflow-auto border rounded bg-gray-50 p-2">
          <el-table :data="importFieldMappings.filter(mapping => importFileList[mapping.fileIndex]?.name.toLowerCase().includes(importFieldSearch.toLowerCase()))" style="width: 100%">
            <el-table-column label="File Name">
              <template #default="{ row }">
                {{ importFileList[row.fileIndex]?.name }}
              </template>
            </el-table-column>
            <el-table-column label="Document Type">
              <template #default="{ row }">
                <el-select v-model="row.type" placeholder="Select Type" clearable filterable>
                  <el-option-group v-for="group in importDocTypes" :key="group.label" :label="group.label">
                    <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
                  </el-option-group>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column v-if="importTargetModel !== 'other_documents'" label="Parent Entity">
              <template #default="{ row }">
                <el-select
                  v-model="row.parent_id"
                  filterable
                  remote
                  :remote-method="(kw) => {/* optionally implement remote search */}"
                  :loading="importLoading.fetchParents"
                  placeholder="Search parent entity"
                  aria-label="Select parent entity"
                >
                  <el-option
                    v-for="item in importParentOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  >
                    <div style="display: flex; align-items: center;">
                      <span style="flex: 1; text-align: left;">{{ item.label }}</span>
                      <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 13px; text-align: right;">
                        {{ item.ward }}, {{ item.subcounty }}, {{ item.county }}
                      </span>
                    </div>
                  </el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="Protected">
              <template #default="{ row }">
                <el-switch v-model="importFileList[row.fileIndex].protected" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div v-if="importStep === 3" class="mt-4">
        <el-alert
          title="Ready to import. Below is the remapped file metadata."
          type="success"
          aria-label="Import ready"
        />
        <el-select
          v-model="importPreviewCount"
          placeholder="Select number of records to preview"
          class="mt-2"
          aria-label="Select number of records to preview"
        >
          <el-option label="1" :value="1" />
          <el-option label="5" :value="5" />
          <el-option label="10" :value="10" />
        </el-select>
        <div
          v-if="importFileMetadata && importFileMetadata.length"
          class="mt-2 max-h-60 overflow-auto border rounded bg-gray-50 p-2"
        >
          <pre class="text-sm whitespace-pre-wrap">
            {{ JSON.stringify(importFileMetadata.slice(0, importPreviewCount), null, 2) }}
          </pre>
        </div>
        <el-alert v-else title="No files to import." type="warning" class="mt-2" />
        <!-- <div class="mt-4 flex justify-end">
          <el-button type="primary" :loading="importLoading.import" @click="importFiles">Import</el-button>
        </div> -->
      </div>
      <template #footer>
        <el-row :gutter="12" justify="end">
          <el-divider />
          <el-col :xs="24" :sm="8" :md="6" :lg="4" v-if="importStep !== 0">
            <el-button block @click="importStep--">Back</el-button>
          </el-col>
          <el-col :xs="24" :sm="8" :md="6" :lg="4">
            <el-button
              block
              type="primary"
              :loading="importLoading.import && importStep === 3"
              @click="importStep === 3 ? importFiles() : importStep++"
            >
              {{ importStep === 3 ? 'Import' : (importStep === 2 ? 'Review' : 'Next') }}
            </el-button>
          </el-col>
        </el-row>
      </template>
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

.filter-tabs {
  margin-bottom: 16px;
}

.filter-tabs .el-tabs__header {
  margin: 0 0 16px 0;
}

.filter-tabs .el-tabs__nav-wrap::after {
  display: none;
}

.filter-tabs .el-tabs__item {
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
}

.date-range-options {
  margin-bottom: 16px;
}

.custom-date-range {
  margin-bottom: 16px;
}

.current-date-filter {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
}

.filter-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.filter-label {
  color: var(--el-text-color-regular);
}

.filter-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.filter-section-title {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 700;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 8px;
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
  width: 100%;
}

.file-icon .iconify {
  flex-shrink: 0;
}

/* Document title styles */
.document-title {
  flex: 1;
  word-break: break-word;
  line-height: 1.4;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* Sort Options Styles */
.sort-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

/* Responsive Layout Styles */
.action-buttons-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.action-button {
  margin-bottom: 4px;
}

.selection-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.selection-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.selection-button {
  margin-bottom: 4px;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .action-buttons-container {
    justify-content: center;
    margin-top: 8px;
  }
  
  .selection-actions {
    justify-content: center;
    margin-top: 8px;
  }
  
  .selection-buttons {
    justify-content: center;
  }
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

/* Controls Container Styles */
.controls-container {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
}

.controls-row {
  align-items: flex-end;
}

.search-col {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
}

.search-input .el-input__wrapper {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.search-input .el-input__wrapper:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.search-input .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.actions-col {
  margin-bottom: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.action-btn {
  position: relative;
  transition: all 0.3s ease;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.action-btn .btn-text {
  font-weight: 500;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.active-filter {
  background-color: var(--el-color-primary-light-9) !important;
  border-color: var(--el-color-primary) !important;
  color: var(--el-color-primary) !important;
}

.filter-badge {
  position: absolute;
  top: -8px;
  right: -8px;
}

.clear-btn {
  animation: fadeInSlide 0.3s ease;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Mobile Responsive Adjustments */
@media (max-width: 768px) {
  .controls-container {
    padding: 12px;
  }
  
  .action-buttons {
    justify-content: center;
    margin-top: 12px;
  }
  
  .action-btn {
    min-width: 80px;
    flex: 1;
  }
  
  .btn-text {
    display: none;
  }
  
  .search-col, .actions-col {
    margin-bottom: 8px;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-btn {
    width: 100%;
    min-width: unset;
  }
  
  .btn-text {
    display: inline;
  }
}

/* Spinner animation for AI processing */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Documents Tabs Styles */
.documents-tabs {
  margin-top: 20px;
}

.documents-tabs .el-tabs__header {
  margin-bottom: 20px;
}

.documents-tabs .el-tabs__nav-wrap::after {
  display: none;
}

.documents-tabs .el-tabs__item {
  padding: 0 20px;
  font-size: 16px;
  font-weight: 500;
  height: 48px;
  line-height: 48px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-badge {
  margin-left: 8px;
}

/* Photos Grid Styles */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.photo-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e4e7ed;
}

.photo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.photo-preview {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #f5f7fa;
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-card:hover .photo-image {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
}

.photo-card:hover .photo-overlay {
  opacity: 1;
}

.photo-info {
  padding: 16px;
}

.photo-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
  color: #909399;
}

.photo-size {
  font-weight: 500;
}

.photo-date {
  color: #c0c4cc;
}

.photo-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.photo-actions .el-button {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
}

/* Mobile responsive adjustments for photos */
@media (max-width: 768px) {
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 16px 0;
  }
  
  .photo-preview {
    height: 150px;
  }
  
  .photo-info {
    padding: 12px;
  }
  
  .photo-actions {
    flex-direction: column;
    gap: 6px;
  }
  
  .photo-actions .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .photo-preview {
    height: 120px;
  }
}
</style>