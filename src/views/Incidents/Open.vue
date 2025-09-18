<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElCard, ElTable, ElTableColumn, ElPagination, ElButton, ElInput, ElDialog, ElDrawer, ElForm, ElFormItem, ElDatePicker, ElTimePicker, ElSelect, ElOption, ElTag, ElTimeline, ElTimelineItem, ElMessageBox, ElMessage, ElCheckboxGroup, ElCheckbox, ElRow, ElCol, ElTabs, ElTabPane, ElCollapse, ElCollapseItem, ElUpload } from 'element-plus'
import { getIncidents, createIncident, updateIncident, deleteIncident, getIncidentHistory } from '@/api/incident'
import { getIncidentDocuments, downloadIncidentFile } from '@/api/incident'
import { uploadIncidentDocuments } from '@/api/incident'
import { uuid } from 'vue-uuid'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')

const dialog = ref(false)
const form = ref<any>({})
const reportDrawer = ref(false)
const reportForm = ref<any>({})
const reportActive = ref(0)
const reportFormRef = ref<any>(null)
const historyDrawer = ref(false)
const historyList = ref<any[]>([])
const selectedIncident = ref<any>(null)
const historyActiveTab = ref('details')
const activeCollapseItems = ref(['basic'])
const editDrawer = ref(false)
const editForm = ref<any>({})
const active = ref(0)
const editFormRef = ref<any>(null)


// Action dialog variables
const showActionDialog = ref(false)
const newAction = ref({ action: "", responsible: "", priority: "", due_date: "" })
const actionDialogRef = ref<any>(null)

// Status update dialog variables
const showStatusDialog = ref(false)
const statusForm = ref({ status: "", action_taken: "" })
const statusDialogRef = ref<any>(null)
const selectedIncidentForStatus = ref<any>(null)

// Save functionality
const saving = ref(false)

// Mobile detection
const isMobile = ref(false)

// Documentation state
const docsLoading = ref(false)
const docs = ref<any[]>([])

// Upload state
const reportFiles = ref<any[]>([])
const editFiles = ref<any[]>([])

// Computed drawer sizes
const editDrawerSize = computed(() => isMobile.value ? '100%' : '50%')
const historyDrawerSize = computed(() => isMobile.value ? '100%' : '30%')
const reportDrawerSize = computed(() => isMobile.value ? '100%' : '50%')

// Step titles
const stepTitles = [
  'Incident Details',
  'Worker Details', 
  'Categories',
  'Causes',
  'Narrative',
  'Actions',
  'Prepared By'
]

// Form data arrays and options
const incidentTypes = [
  "Hazards","Environmental Impact","Near Miss","Occupational Personal Injury",
  "Non-Occupational Incident / Accident","Occupational Disease","Vehicle Incident/ Accident",
  "Fatality","Non worker incident (Traffic Accident Away)"
]

const mechanisms = [
  "Loss of Containment", "Assault", "Radiation", "Fire/Explosion", "Unsafe Act",
  "Plant /Vehicle Operation", "Pollution /Environment", "Mechanical lifting",
  "Structural / Foundation", "Slip/ Trip/fall", "Lifting/ crane operation",
  "Waterborne", "Falling from height", "Manual handling", "Hazardous Substances exposure",
  "Falling/flying objects", "Using Machineries", "Driving", "Unsafe Condition",
  "Radiation", "Electrical", "Using Hand tools"
]

const indirectCauses = [
  "Inadequate Mental / Physical capacity", "Inadequate Design / Engineering",
  "Inadequate knowledge/skills", "Inadequate Procedures", "Stress",
  "Inadequate Tools / Equipment", "Inadequate Supervision", "Inadequate Instructions.",
  "Improper Motivation", "Inadequate Planning / Organization.", "Disregard of Instruction.",
  "Inadequate Supervision.", "Inadequate appreciation of situation", "Inadequate Training",
  "Fatigue / illness", "Inadequate Maintenance / Inspection", "Others (specify)",
  "Inadequate judgement involving KPLC wire)"
]

const directCauses = [
  "Failure in Communication", "Inadequate PPEs", "Failure to follow Rules/ Regulations",
  "Defective / damaged Tools and Equipment", "Failure to wear PPEs", "Inadequate CPEs",
  "Failure to wear RPEs", "Inadequate warning / Safety devices", "Improve manual handling",
  "Poor housekeeping", "Improve Vehicle Operation", "Inadequate/ miss use of Tools/ Equipment",
  "Failure to properly observe warnings", "Failure to properly observe Safety devices",
  "Wet / Uneven floor / Ground", "Misuse of Tool, Equipment and Plants",
  "Inadequate Access and Egress", "Others", "Accident involving the hanging kplc wire",
  "Weak old structures with shallow foundations"
]

const activities = [
  "Using portable Tools/Equipment", "Grinding", "Breaking connection",
  "Operating Plant / Machineries", "Electrical work", "Manual lifting/handling",
  "Assembling /Dismantling", "Welding / Cutting with torch", "Movement of Equipment",
  "Handling hazardous substances", "Inspection, Examination, Radiography",
  "Others (refiling of water bowser)", "Climbing / Descending", "Cleaning",
  "Working / Walking on same level", "Painting", "Driving", "Digging",
  "Working at height (above 2 M)", "Draining/ flushing"
]

const rootCauses = [
  "Management commitment", "Inspection / Audit", "Recruitment Procedures",
  "Training", "Planning", "Communication", "Design", "Standards",
  "Housekeeping", "Failure in organization", "Others (specify)"
]

const severityLevels = [
  "Minor","Major","Lost time injury","Fatality",
  "Restricted to work cases","Medical treatment cases","First Aid Case"
]

const statusOptions = [
  { label: "Open", value: "open" },
  { label: "Under Investigation", value: "under_investigation" },
  { label: "Action Required", value: "action_required" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" }
]

const fetchList = async () => {
  loading.value = true
  try {
    const res: any = await getIncidents({ page: page.value, pageSize: pageSize.value, keyword: keyword.value })
    list.value = res.data || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}


// Report drawer functions
const openReportDrawer = async () => {
  reportForm.value = { 
    occurred_date: new Date(), 
    reported_date: new Date(),
    // Initialize arrays
    incident_types: [],
    mechanisms: [],
    indirect_causes: [],
    direct_causes: [],
    activity_leading: [],
    root_cause: [],
    actions_to_avoid: []
  }
  reportActive.value = 0
  reportDrawer.value = true
}

const submit = async () => {
  const res: any = await createIncident(form.value)
  if (res && res.code === '0000') {
    dialog.value = false
    fetchList()
    ElMessage.success('Incident created successfully')
  }
}

const openEditDrawer = (row: any) => {
  editForm.value = { ...row }
  // Initialize arrays if they don't exist
  editForm.value.incident_types = editForm.value.incident_types || []
  editForm.value.mechanisms = editForm.value.mechanisms || []
  editForm.value.indirect_causes = editForm.value.indirect_causes || []
  editForm.value.direct_causes = editForm.value.direct_causes || []
  editForm.value.activity_leading = editForm.value.activity_leading || []
  editForm.value.root_cause = editForm.value.root_cause || []
  editForm.value.actions_to_avoid = editForm.value.actions_to_avoid || []
  active.value = 0
  editDrawer.value = true
}

const submitEdit = async () => {
  const res: any = await updateIncident(editForm.value)
  if (res && res.code === '0000') {
    // Upload any selected documents for edit
    if (editFiles.value && editFiles.value.length) {
      await uploadDocuments(editForm.value.id || res.data?.id, editFiles.value)
      editFiles.value = []
    }
    editDrawer.value = false
    fetchList()
    ElMessage.success('Incident updated successfully')
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this incident?', 'Warning', {
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    
    const res: any = await deleteIncident({ id: row.id })
    if (res && res.code === '0000') {
      fetchList()
      ElMessage.success('Incident deleted successfully')
    }
  } catch (error) {
    // User cancelled
  }
}

const openHistoryDrawer = async (row: any) => {
  selectedIncident.value = row
  try {
    const res: any = await getIncidentHistory({ incident_id: row.id })
    if (res && res.code === '0000') {
      historyList.value = res.data || []
      historyDrawer.value = true
      historyActiveTab.value = 'details'
      // lazy load docs
      docs.value = []
      docsLoading.value = false
    }
  } catch (error) {
    ElMessage.error('Failed to fetch incident history')
  }
}

const getActionColor = (action: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const colors: { [key: string]: 'success' | 'warning' | 'info' | 'primary' | 'danger' } = {
    created: 'success',
    updated: 'primary',
    deleted: 'danger',
    status_changed: 'warning'
  }
  return colors[action] || 'info'
}

const getSeverityColor = (severity: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const colors: { [key: string]: 'success' | 'warning' | 'info' | 'primary' | 'danger' } = {
    'Minor': 'success',
    'Major': 'warning',
    'Lost time injury': 'danger',
    'Fatality': 'danger',
    'Restricted to work cases': 'warning',
    'Medical treatment cases': 'warning',
    'First Aid Case': 'info'
  }
  return colors[severity] || 'info'
}

const getPriorityColor = (priority: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const colors: { [key: string]: 'success' | 'warning' | 'info' | 'primary' | 'danger' } = {
    'High': 'danger',
    'Medium': 'warning',
    'Low': 'success'
  }
  return colors[priority] || 'info'
}

const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const colors: { [key: string]: 'success' | 'warning' | 'info' | 'primary' | 'danger' } = {
    'open': 'danger',
    'under_investigation': 'warning',
    'action_required': 'warning',
    'in_progress': 'primary',
    'resolved': 'success',
    'closed': 'info'
  }
  return colors[status] || 'info'
}

const getStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    'open': 'Open',
    'under_investigation': 'Under Investigation',
    'action_required': 'Action Required',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed'
  }
  return labels[status] || status || 'Open'
}

const formatValue = (value: any) => {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return value || 'N/A'
}

// Date formatting function
const formatDateTime = (dateString: string) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}-${month}-${year} ${hours}:${minutes}`
  } catch (error) {
    return 'N/A'
  }
}

// Step navigation functions
const nextStep = async () => {
  try {
    await editFormRef.value?.validate()
    active.value++
  } catch {
    ElMessage.error('Please fill required fields')
  }
}

const prevStep = () => {
  active.value--
}

// Arrow navigation functions
const goToPrevStep = async () => {
  if (active.value > 0) {
    try {
      await editFormRef.value?.validate()
      active.value--
    } catch {
      ElMessage.error('Please fill required fields before going back')
    }
  }
}

const goToNextStep = async () => {
  if (active.value < stepTitles.length - 1) {
    try {
      await editFormRef.value?.validate()
      active.value++
    } catch {
      ElMessage.error('Please fill required fields')
    }
  }
}

// Report drawer navigation functions
const reportNextStep = async () => {
  try {
    await reportFormRef.value?.validate()
    reportActive.value++
  } catch {
    ElMessage.error('Please fill required fields')
  }
}

const reportPrevStep = () => {
  reportActive.value--
}

const reportGoToPrevStep = async () => {
  if (reportActive.value > 0) {
    try {
      await reportFormRef.value?.validate()
      reportActive.value--
    } catch {
      ElMessage.error('Please fill required fields before going back')
    }
  }
}

const reportGoToNextStep = async () => {
  if (reportActive.value < stepTitles.length - 1) {
    try {
      await reportFormRef.value?.validate()
      reportActive.value++
    } catch {
      ElMessage.error('Please fill required fields')
    }
  }
}

// Validation rules for each step
const validationRules = {
  step0: {
    occurred_date: [{ required: true, message: 'Occurred Date is required', trigger: 'change' }],
    occurred_time: [{ required: true, message: 'Occurred Time is required', trigger: 'change' }],
    location_text: [{ required: true, message: 'Location is required', trigger: 'blur' }],
    reported_by: [{ required: true, message: 'Reported By is required', trigger: 'blur' }],
    reporter_phone: [{ required: true, message: 'Reporter Phone is required', trigger: 'blur' }]
  },
  step1: {
    worker_name: [{ required: true, message: 'Worker Name is required', trigger: 'blur' }],
    designation: [{ required: true, message: 'Designation is required', trigger: 'blur' }],
    site_supervisor: [{ required: true, message: 'Site Supervisor is required', trigger: 'blur' }],
    department: [{ required: true, message: 'Department is required', trigger: 'blur' }]
  },
  step2: {
    incident_types: [{ required: true, message: 'Select at least 1 Incident Type', trigger: 'change' }],
    mechanisms: [{ required: true, message: 'Select at least 1 Mechanism', trigger: 'change' }],
    indirect_causes: [{ required: true, message: 'Select at least 1 Indirect Cause', trigger: 'change' }],
    activity_leading: [{ required: true, message: 'Select at least 1 Activity', trigger: 'change' }]
  },
  step3: {
    direct_causes: [{ required: true, message: 'Select at least 1 Direct Cause', trigger: 'change' }],
    root_cause: [{ required: true, message: 'Select at least 1 Root Cause', trigger: 'change' }]
  },
  step4: {
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    consequences: [{ required: true, message: 'Consequences are required', trigger: 'blur' }],
    immediate_action: [{ required: true, message: 'Immediate Action is required', trigger: 'blur' }],
    severity: [{ required: true, message: 'Severity is required', trigger: 'change' }]
  },
  step5: {
    actions_to_avoid: [{ required: true, message: 'Add at least one Action to Avoid', trigger: 'change' }]
  },
  step6: {
    prepared_by_name: [{ required: true, message: 'Prepared By is required', trigger: 'blur' }],
    prepared_by_job_title: [{ required: true, message: 'Job Title is required', trigger: 'blur' }]
  }
}

const currentStepRules = computed(() => validationRules[`step${active.value}`] || {})
const reportCurrentStepRules = computed(() => validationRules[`step${reportActive.value}`] || {})

// Report form submit function
const submitReport = async () => {
  try {
    await reportFormRef.value?.validate()
    saving.value = true
    
    // Prepare form data with proper field types
    const formData = { ...reportForm.value }
    
    // Remove code field - backend will generate it
    delete formData.code
    
    // Set system-generated dates
    formData.reported_date = new Date().toISOString().split("T")[0]
    formData.reported_time = new Date().toLocaleTimeString()
    formData.prepared_by_date = new Date().toISOString().split("T")[0]
    
    // Ensure occurred_date is properly formatted
    if (formData.occurred_date instanceof Date) {
      formData.occurred_date = formData.occurred_date.toISOString().split("T")[0]
    }
    
    // Ensure all array fields are properly initialized
    formData.incident_types = formData.incident_types || []
    formData.mechanisms = formData.mechanisms || []
    formData.indirect_causes = formData.indirect_causes || []
    formData.direct_causes = formData.direct_causes || []
    formData.activity_leading = formData.activity_leading || []
    formData.root_cause = formData.root_cause || []
    formData.actions_to_avoid = formData.actions_to_avoid || []
    
    // Ensure string fields are not null/undefined
    formData.location_text = formData.location_text || ''
    formData.worker_name = formData.worker_name || ''
    formData.designation = formData.designation || ''
    formData.site_supervisor = formData.site_supervisor || ''
    formData.department = formData.department || ''
    formData.description = formData.description || ''
    formData.consequences = formData.consequences || ''
    formData.immediate_action = formData.immediate_action || ''
    formData.severity = formData.severity || ''
    formData.prepared_by_name = formData.prepared_by_name || ''
    formData.prepared_by_job_title = formData.prepared_by_job_title || ''
    formData.reported_by = formData.reported_by || ''
    formData.reporter_phone = formData.reporter_phone || ''
    
    const res: any = await createIncident(formData)
    if (res && res.code === '0000') {
      // Upload any selected documents for new incident
      if (reportFiles.value && reportFiles.value.length) {
        await uploadDocuments(res.data?.id, reportFiles.value)
        reportFiles.value = []
      }
      reportDrawer.value = false
      fetchList()
      ElMessage.success('Incident reported successfully')
    } else {
      ElMessage.error('Failed to report incident')
    }
  } catch (error) {
    console.error('Report submission error:', error)
    ElMessage.error('Please fill required fields before submitting')
  } finally {
    saving.value = false
  }
}

// Action dialog validation rules
const actionDialogRules = {
  action: [{ required: true, message: 'Action is required', trigger: 'blur' }],
  responsible: [{ required: true, message: 'Responsible is required', trigger: 'blur' }],
  priority: [{ required: true, message: 'Priority is required', trigger: 'change' }],
  due_date: [{ required: true, message: 'Due Date is required', trigger: 'change' }]
}

// Status update validation rules
const statusUpdateRules = {
  status: [{ required: true, message: 'Status is required', trigger: 'change' }],
  action_taken: [{ required: true, message: 'Action taken is required', trigger: 'blur' }]
}

// Action management functions
const addActionRow = () => {
  newAction.value = { action: "", responsible: "", priority: "", due_date: "" }
  showActionDialog.value = true
}

const confirmAddAction = async () => {
  try {
    await actionDialogRef.value?.validate()
  } catch (e) {
    ElMessage.error("Please fill all required fields")
    return
  }
  
  // Determine which form is active based on which drawer is open
  if (editDrawer.value) {
    if (!editForm.value.actions_to_avoid) {
      editForm.value.actions_to_avoid = []
    }
    editForm.value.actions_to_avoid.push({ ...newAction.value })
  } else if (reportDrawer.value) {
    if (!reportForm.value.actions_to_avoid) {
      reportForm.value.actions_to_avoid = []
    }
    reportForm.value.actions_to_avoid.push({ ...newAction.value })
  }
  
  newAction.value = { action: "", responsible: "", priority: "", due_date: "" }
  showActionDialog.value = false
}

const removeAction = (index: number) => {
  if (editForm.value.actions_to_avoid) {
    editForm.value.actions_to_avoid.splice(index, 1)
  }
}

// Report form action management functions
const removeReportAction = (index: number) => {
  if (reportForm.value.actions_to_avoid) {
    reportForm.value.actions_to_avoid.splice(index, 1)
  }
}

// Status update functions
const openStatusDialog = (row: any) => {
  selectedIncidentForStatus.value = row
  statusForm.value = {
    status: row.status || 'open',
    action_taken: ''
  }
  showStatusDialog.value = true
}

const submitStatusUpdate = async () => {
  try {
    await statusDialogRef.value?.validate()
    saving.value = true
    
    const updateData = {
      id: selectedIncidentForStatus.value.id,
      status: statusForm.value.status,
      action_taken: statusForm.value.action_taken
    }
    
    const res: any = await updateIncident(updateData)
    if (res && res.code === '0000') {
      showStatusDialog.value = false
      fetchList()
      ElMessage.success('Status updated successfully')
    } else {
      ElMessage.error('Failed to update status')
    }
  } catch (error) {
    ElMessage.error('Please fill required fields')
  } finally {
    saving.value = false
  }
}


// Save current step function
const saveCurrentStep = async () => {
  try {
    await editFormRef.value?.validate()
    saving.value = true
    
    const res: any = await updateIncident(editForm.value)
    if (res && res.code === '0000') {
      ElMessage.success('Progress saved successfully')
      fetchList() // Refresh the list to show updated data
    } else {
      ElMessage.error('Failed to save progress')
    }
  } catch (error) {
    ElMessage.error('Please fill required fields before saving')
  } finally {
    saving.value = false
  }
}

// Mobile detection setup
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  fetchList()
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

// Documentation functions
const fetchIncidentDocuments = async () => {
  if (!selectedIncident.value) return
  docsLoading.value = true
  try {
    const res: any = await getIncidentDocuments({ incident_id: selectedIncident.value.id })
    if (res && res.code === '0000') {
      docs.value = res.data || []
    }
  } catch (e) {
    ElMessage.error('Failed to load documents')
  } finally {
    docsLoading.value = false
  }
}

const downloadDoc = async (doc: any) => {
  try {
    const res: any = await downloadIncidentFile({ filename: doc.name })
    const blob = new Blob([res as any])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('Download failed')
  }
}

const uploadDocuments = async (incidentId: number, files: any[]) => {
  if (!files || files.length === 0) return true
  try {
    const formData = new FormData()
    for (const f of files) {
      const raw = f.raw || f
      if (!raw) continue
      // file binary
      formData.append('files', raw)
      // metadata per file (append for each file, backend supports arrays)
      const name: string = f.name || raw.name || ''
      const ext = name.includes('.') ? name.split('.').pop() as string : ''
      const sizeMb = raw.size ? (raw.size / 1024 / 1024).toFixed(2) : ''
      formData.append('format', ext)
      formData.append('incident_id', String(incidentId))
      formData.append('type', 'Supporting Documentation')
      formData.append('protected_file', 'true')
      formData.append('size', String(sizeMb))
      formData.append('code', uuid.v4())
    }

    const res: any = await uploadIncidentDocuments(formData)
    if (res && res.code === '0000') {
      ElMessage.success('Documents uploaded')
      return true
    }
    ElMessage.error('Failed to upload documents')
    return false
  } catch (e) {
    ElMessage.error('Upload error')
    return false
  }
}

// PDF generation function
const generatePDF = async (incidentData: any) => {
  try {
    ElMessage.info('Generating PDF report...')
    
    // Use provided incident data or fallback to selectedIncident
    const incident = incidentData || selectedIncident.value
    if (!incident) {
      throw new Error('No incident data available')
    }
    
    // Ensure documents and history are loaded
    if (docs.value.length === 0) {
      await fetchIncidentDocuments()
    }
    if (historyList.value.length === 0) {
      const res: any = await getIncidentHistory({ incident_id: incident.id })
      if (res && res.code === '0000') {
        historyList.value = res.data || []
      }
    }
    
    const documents = docs.value || []
    const history = historyList.value || []
    
    // Create PDF
    const doc = new jsPDF()
    
    // Set up fonts and colors
    // Get primary color from CSS variables
    const getPrimaryColor = () => {
      const root = document.documentElement
      const primaryColor = getComputedStyle(root).getPropertyValue('--el-color-primary').trim()
      
      if (primaryColor) {
        // Convert hex to RGB
        const hex = primaryColor.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        return [r, g, b]
      }
      
      // Fallback to default primary color
      return [64, 158, 255] // Element Plus default blue
    }
    
    const primaryColor = getPrimaryColor()
    const lightGray = [236, 240, 241] // #ecf0f1
    
    // Helper function to format dates
    const formatDate = (date: any) => {
      if (!date) return 'N/A'
      const d = new Date(date)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}-${month}-${year}`
    }
    
    // Helper function to format time
    const formatTime = (time: any) => {
      if (!time) return 'N/A'
      
      let hours, minutes, ampm
      
      // If it's an ISO datetime string, extract just the time part
      if (typeof time === 'string' && time.includes('T')) {
        const date = new Date(time)
        hours = date.getHours()
        minutes = String(date.getMinutes()).padStart(2, '0')
      }
      // If it's already in HH:MM format, convert to 12-hour
      else if (typeof time === 'string' && time.includes(':')) {
        const [h, m] = time.split(':')
        hours = parseInt(h, 10)
        minutes = m.padStart(2, '0')
      }
      // For Date objects, extract time
      else if (time instanceof Date) {
        hours = time.getHours()
        minutes = String(time.getMinutes()).padStart(2, '0')
      }
      else {
        return time
      }
      
      // Convert to 12-hour format with AM/PM
      let hour12 = hours
      if (hours === 0) {
        hour12 = 12
        ampm = 'AM'
      } else if (hours < 12) {
        hour12 = hours
        ampm = 'AM'
      } else if (hours === 12) {
        hour12 = 12
        ampm = 'PM'
      } else {
        hour12 = hours - 12
        ampm = 'PM'
      }
      
      return `${hour12}:${minutes} ${ampm}`
    }
    
    // Helper function to format datetime
    const formatDateTime = (date: any) => {
      if (!date) return 'N/A'
      const d = new Date(date)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = d.getHours()
      const minutes = String(d.getMinutes()).padStart(2, '0')
      
      let hour12 = hours
      let ampm = 'AM'
      
      if (hours === 0) {
        hour12 = 12
        ampm = 'AM'
      } else if (hours < 12) {
        hour12 = hours
        ampm = 'AM'
      } else if (hours === 12) {
        hour12 = 12
        ampm = 'PM'
      } else {
        hour12 = hours - 12
        ampm = 'PM'
      }
      
      return `${day}-${month}-${year} ${hour12}:${minutes} ${ampm}`
    }
    
    // Helper function to add text with styling
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const { fontSize = 10, fontStyle = 'normal', color = [0, 0, 0], align = 'left' } = options
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', fontStyle)
      doc.setTextColor(color[0], color[1], color[2])
      doc.text(text, x, y, { align })
    }

    // Helper function to add line
    const addLine = (x1: number, y1: number, x2: number, y2: number, color = [0, 0, 0], width = 0.5) => {
      doc.setDrawColor(color[0], color[1], color[2])
      doc.setLineWidth(width)
      doc.line(x1, y1, x2, y2)
    }

    // Helper function to add rectangle
    const addRect = (x: number, y: number, width: number, height: number, fillColor: number[] | null = null, strokeColor = [0, 0, 0]) => {
      if (fillColor) {
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
        doc.rect(x, y, width, height, 'F')
      }
      doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2])
      doc.rect(x, y, width, height)
    }

    // Header
    addRect(10, 10, 190, 25, primaryColor)
    addText('INCIDENT REPORT', 105, 20, { fontSize: 16, fontStyle: 'bold', color: [255, 255, 255], align: 'center' })
    addText('Second Kenya Informal Settlement Project - KISIP 2', 105, 26, { fontSize: 10, color: [255, 255, 255], align: 'center' })
    
    // Incident Code and Status
    let yPos = 45
    addText(`Incident Code: ${incident.code || 'N/A'}`, 15, yPos, { fontSize: 12, fontStyle: 'bold', color: primaryColor })
    
    // Status badge
    const statusColor = getPDFStatusColor(incident.status)
    const statusText = getPDFStatusLabel(incident.status)
    addText('Status: ', 120, yPos, { fontSize: 12, fontStyle: 'bold' })
    addText(statusText, 140, yPos, { fontSize: 12, fontStyle: 'bold', color: statusColor })
    
    yPos += 15

    // Basic Information Section
    addText('BASIC INFORMATION', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
    addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
    yPos += 10

    const basicInfo = [
      ['Occurred Date:', formatDate(incident.occurred_date)],
      ['Occurred Time:', formatTime(incident.occurred_time)],
      ['Reported Date:', formatDate(incident.reported_date)],
      ['Location:', incident.location_text || 'N/A'],
      ['Severity:', incident.severity || 'N/A'],
      ['Reported By:', incident.reported_by || 'N/A'],
      ['Reporter Phone:', incident.reporter_phone || 'N/A']
    ]

    basicInfo.forEach(([label, value]) => {
      addText(label, 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      addText(value, 80, yPos, { fontSize: 10 })
      yPos += 6
    })

    yPos += 5

    // Worker Details Section
    addText('WORKER DETAILS', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
    addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
    yPos += 10

    const workerInfo = [
      ['Worker Name:', incident.worker_name || 'N/A'],
      ['Designation:', incident.designation || 'N/A'],
      ['Site Supervisor:', incident.site_supervisor || 'N/A'],
      ['Department:', incident.department || 'N/A']
    ]

    workerInfo.forEach(([label, value]) => {
      addText(label, 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      addText(value, 80, yPos, { fontSize: 10 })
      yPos += 6
    })

    yPos += 5

    // Check if we need a new page for incident details (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Incident Categories Section
    addText('INCIDENT DETAILS', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
    addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
    yPos += 10

    // Incident Types
    if (incident.incident_types && incident.incident_types.length > 0) {
      addText('Incident Types:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.incident_types.forEach((type: string) => {
        addText(`• ${type}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    // Mechanisms
    if (incident.mechanisms && incident.mechanisms.length > 0) {
      addText('Mechanisms:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.mechanisms.forEach((mechanism: string) => {
        addText(`• ${mechanism}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    // Causes
    if (incident.direct_causes && incident.direct_causes.length > 0) {
      addText('Direct Causes:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.direct_causes.forEach((cause: string) => {
        addText(`• ${cause}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    if (incident.indirect_causes && incident.indirect_causes.length > 0) {
      addText('Indirect Causes:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.indirect_causes.forEach((cause: string) => {
        addText(`• ${cause}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    if (incident.root_cause && incident.root_cause.length > 0) {
      addText('Root Causes:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.root_cause.forEach((cause: string) => {
        addText(`• ${cause}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Check if we need a new page for narrative (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Narrative Section
    addText('NARRATIVE', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
    addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
    yPos += 10

    if (incident.description) {
      addText('Description:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      const descriptionLines = doc.splitTextToSize(incident.description, 170)
      doc.text(descriptionLines, 20, yPos)
      yPos += descriptionLines.length * 4 + 5
    }

    if (incident.consequences) {
      addText('Consequences:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      const consequencesLines = doc.splitTextToSize(incident.consequences, 170)
      doc.text(consequencesLines, 20, yPos)
      yPos += consequencesLines.length * 4 + 5
    }

    if (incident.immediate_action) {
      addText('Immediate Action:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      const actionLines = doc.splitTextToSize(incident.immediate_action, 170)
      doc.text(actionLines, 20, yPos)
      yPos += actionLines.length * 4 + 5
    }

    // Check if we need a new page for actions (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Actions to Avoid Section
    if (incident.actions_to_avoid && incident.actions_to_avoid.length > 0) {
      addText('ACTIONS TO AVOID', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
      addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
      yPos += 10

      // Create table for actions
      const actionsData = incident.actions_to_avoid.map((action: any, index: number) => [
        index + 1,
        action.action || 'N/A',
        action.responsible || 'N/A',
        action.priority || 'N/A',
        action.due_date || 'N/A'
      ])

      autoTable(doc, {
        head: [['#', 'Action', 'Responsible', 'Priority', 'Due Date']],
        body: actionsData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: primaryColor as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: lightGray as [number, number, number] },
        margin: { left: 15, right: 15 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Check if we need a new page for documents (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Documents Section
    if (documents && documents.length > 0) {
      addText('ATTACHED DOCUMENTS', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
      addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
      yPos += 10

      const docsData = documents.map((doc: any, index: number) => [
        index + 1,
        doc.name || 'N/A',
        doc.type || 'N/A',
        doc.format || 'N/A',
        doc.size ? `${doc.size} MB` : 'N/A'
      ])

      autoTable(doc, {
        head: [['#', 'File Name', 'Type', 'Format', 'Size']],
        body: docsData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: primaryColor as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: lightGray as [number, number, number] },
        margin: { left: 15, right: 15 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Check if we need a new page for history (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // History Section
    if (history && history.length > 0) {
      addText('CHANGE HISTORY', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
      addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
      yPos += 10

      const historyData = history.slice(0, 10).map((item: any, index: number) => [
        index + 1,
        item.action || 'N/A',
        item.changed_by_name || item.changedByName || 'System',
        formatDateTime(item.createdAt),
        item.change_reason || item.field_name || 'N/A'
      ])

      autoTable(doc, {
        head: [['#', 'Action', 'Changed By', 'Date', 'Details']],
        body: historyData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: primaryColor as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: lightGray as [number, number, number] },
        margin: { left: 15, right: 15 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      
      // Footer separator line
      addLine(10, 275, 200, 275, [200, 200, 200], 0.5)
      
      // Footer content
      addText(`Page ${i} of ${pageCount}`, 105, 285, { fontSize: 9, color: [64, 64, 64], align: 'center' })
      addText(`Generated on ${formatDateTime(new Date())}`, 15, 285, { fontSize: 9, color: [64, 64, 64] })
      addText('KeSMIS - Incident Management System', 15, 290, { fontSize: 8, color: [102, 102, 102] })
    }

    // Save the PDF
    doc.save(`incident-report-${incident.code}.pdf`)
    
    ElMessage.success('PDF report downloaded successfully')
  } catch (e) {
    console.error('PDF generation error:', e)
    ElMessage.error('Failed to generate PDF report')
  }
}

 
// Helper functions for PDF generation
const getPDFStatusColor = (status: string): [number, number, number] => {
  const colors: { [key: string]: [number, number, number] } = {
    'open': [231, 76, 60],
    'under_investigation': [243, 156, 18],
    'action_required': [243, 156, 18],
    'in_progress': [52, 152, 219],
    'resolved': [39, 174, 96],
    'closed': [149, 165, 166]
  }
  return colors[status] || [149, 165, 166]
}

const getPDFStatusLabel = (status: string) => {
  const labels: { [key: string]: string } = {
    'open': 'Open',
    'under_investigation': 'Under Investigation',
    'action_required': 'Action Required',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed'
  }
  return labels[status] || status || 'Open'
}

watch(historyActiveTab, (v) => {
  if (v === 'docs') {
    fetchIncidentDocuments()
  }
})
</script>

<template>
  <ElCard>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
      <ElInput v-model="keyword" placeholder="Search by code, description, location" style="max-width:320px" @change="fetchList" />
      <ElButton type="primary" @click="fetchList">Search</ElButton>
      <ElButton type="success" @click="openReportDrawer">Report Incident</ElButton>
    </div>
    <ElTable :data="list" v-loading="loading" >
      <ElTableColumn prop="code" label="Code" width="140" />
      <ElTableColumn prop="occurred_date" label="Occurred" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.occurred_date) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="reported_date" label="Reported" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.reported_date) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="worker_name" label="Worker" />
      <ElTableColumn prop="location_text" label="Location" />
      <ElTableColumn prop="severity" label="Severity" width="120" />
      <ElTableColumn prop="status" label="Status" width="140">
        <template #default="{ row }">
          <ElTag :type="getStatusColor(row.status)">
            {{ getStatusLabel(row.status) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="description" label="Brief" />
      <ElTableColumn label="Actions" width="580" fixed="right">
        <template #default="{ row }">
          <ElButton size="small" @click="openEditDrawer(row)">Edit</ElButton>
          <ElButton size="small" type="warning" @click="openStatusDialog(row)">Status</ElButton>
          <ElButton size="small" type="info" @click="openHistoryDrawer(row)">History</ElButton>
          <ElButton size="small" type="success" @click="generatePDF(row)">PDF</ElButton>
          <ElButton size="small" type="danger" @click="handleDelete(row)">Delete</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <ElPagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="prev, pager, next, sizes" @current-change="fetchList" @size-change="fetchList" style="margin-top:10px;" />
  </ElCard>


  <ElDialog v-model="dialog" title="Report Incident" width="60%">
    <ElForm :model="form" label-position="top">
      <ElFormItem label="Code">
        <ElInput v-model="form.code" disabled />
      </ElFormItem>
      <ElFormItem label="Occurred Date">
        <ElDatePicker v-model="form.occurred_date" type="date" />
      </ElFormItem>
      <ElFormItem label="Occurred Time">
        <ElInput v-model="form.occurred_time" />
      </ElFormItem>
      <ElFormItem label="Location">
        <ElInput v-model="form.location_text" />
      </ElFormItem>
      <ElFormItem label="Worker Name">
        <ElInput v-model="form.worker_name" />
      </ElFormItem>
      <ElFormItem label="Severity">
        <ElSelect v-model="form.severity" placeholder="Select">
          <ElOption label="Minor" value="Minor" />
          <ElOption label="Major" value="Major" />
          <ElOption label="Lost time injury" value="LTI" />
          <ElOption label="Fatality" value="Fatality" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Brief Description">
        <ElInput type="textarea" v-model="form.description" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialog=false">Cancel</ElButton>
      <ElButton type="primary" @click="submit">Submit</ElButton>
    </template>
  </ElDialog>

  <!-- Edit Drawer -->
  <ElDrawer 
    v-model="editDrawer" 
    title="Edit Incident" 
    :size="editDrawerSize"
    direction="rtl"
    :with-header="true"
    :close-on-click-modal="false"
  >
    <div class="drawer-content">
      <!-- Step Header with Navigation -->
      <div class="step-header">
        <ElButton 
          @click="goToPrevStep" 
          :disabled="active === 0"
          type="text" 
          class="step-nav-btn prev-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </ElButton>
        
        <div class="step-title">
          <span class="step-number">{{ active + 1 }}</span>
          <span class="step-text">{{ stepTitles[active] }}</span>
        </div>
        
        <ElButton 
          @click="goToNextStep" 
          :disabled="active === stepTitles.length - 1"
          type="text" 
          class="step-nav-btn next-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </ElButton>
      </div>

      <ElForm 
        :model="editForm" 
        :rules="currentStepRules"
        ref="editFormRef"
        label-position="top"
        class="edit-form"
      >
        <!-- Step 0: Incident Details -->
        <div v-if="active === 0" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem label="Code" prop="code">
        <ElInput v-model="editForm.code" disabled />
      </ElFormItem>
              <ElFormItem label="Occurred Date" prop="occurred_date">
        <ElDatePicker v-model="editForm.occurred_date" type="date" />
      </ElFormItem>
              <ElFormItem label="Occurred Time" prop="occurred_time">
                <ElTimePicker v-model="editForm.occurred_time" />
      </ElFormItem>
              <ElFormItem label="Location" prop="location_text">
        <ElInput v-model="editForm.location_text" />
      </ElFormItem>
              <ElFormItem label="Reported By" prop="reported_by">
                <ElInput v-model="editForm.reported_by" />
              </ElFormItem>
              <ElFormItem label="Reporter Phone" prop="reporter_phone">
                <ElInput v-model="editForm.reporter_phone" placeholder="2547XXXXXXXX" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 1: Worker Details -->
        <div v-if="active === 1" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem label="Worker Name" prop="worker_name">
        <ElInput v-model="editForm.worker_name" />
      </ElFormItem>
              <ElFormItem label="Designation" prop="designation">
                <ElInput v-model="editForm.designation" />
              </ElFormItem>
              <ElFormItem label="Site Supervisor" prop="site_supervisor">
                <ElInput v-model="editForm.site_supervisor" />
              </ElFormItem>
              <ElFormItem label="Department" prop="department">
                <ElInput v-model="editForm.department" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 2: Categories -->
        <div v-if="active === 2" class="form-step">
          <ElRow :gutter="20">
            <!-- Incident Types Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Incident Types</div>
                </template>
                <ElFormItem prop="incident_types">
                  <ElCheckboxGroup v-model="editForm.incident_types">
                    <ElRow :gutter="10">
                      <ElCol v-for="i in incidentTypes" :key="i" :span="24">
                        <ElCheckbox :label="i" class="checkbox-item">{{ i }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>

            <!-- Mechanism Causing Incident Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Mechanism Causing Incident</div>
                </template>
                <ElFormItem prop="mechanisms">
                  <ElCheckboxGroup v-model="editForm.mechanisms">
                    <ElRow :gutter="10">
                      <ElCol v-for="m in mechanisms" :key="m" :span="24">
                        <ElCheckbox :label="m" class="checkbox-item">{{ m }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>

            <!-- Indirect Causes Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Indirect Causes</div>
                </template>
                <ElFormItem prop="indirect_causes">
                  <ElCheckboxGroup v-model="editForm.indirect_causes">
                    <ElRow :gutter="10">
                      <ElCol v-for="p in indirectCauses" :key="p" :span="24">
                        <ElCheckbox :label="p" class="checkbox-item">{{ p }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>

            <!-- Activity Leading to Incident Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Activity Leading to Incident</div>
                </template>
                <ElFormItem prop="activity_leading">
                  <ElCheckboxGroup v-model="editForm.activity_leading">
                    <ElRow :gutter="10">
                      <ElCol v-for="a in activities" :key="a" :span="24">
                        <ElCheckbox :label="a" class="checkbox-item">{{ a }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 3: Causes -->
        <div v-if="active === 3" class="form-step">
          <ElRow :gutter="20">
            <!-- Direct Causes Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Direct Causes</div>
                </template>
                <ElFormItem prop="direct_causes">
                  <ElCheckboxGroup v-model="editForm.direct_causes">
                    <ElRow :gutter="10">
                      <ElCol v-for="j in directCauses" :key="j" :span="24">
                        <ElCheckbox :label="j" class="checkbox-item">{{ j }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>

            <!-- Root Cause Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Root Cause</div>
                </template>
                <ElFormItem prop="root_cause">
                  <ElCheckboxGroup v-model="editForm.root_cause">
                    <ElRow :gutter="10">
                      <ElCol v-for="a in rootCauses" :key="a" :span="24">
                        <ElCheckbox :label="a" class="checkbox-item">{{ a }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 4: Narrative -->
        <div v-if="active === 4" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem label="Description" prop="description">
                <ElInput type="textarea" :rows="3" v-model="editForm.description" />
              </ElFormItem>
              <ElFormItem label="Consequences" prop="consequences">
                <ElInput type="textarea" :rows="3" v-model="editForm.consequences" />
              </ElFormItem>
              <ElFormItem label="Immediate Action" prop="immediate_action">
                <ElInput type="textarea" :rows="3" v-model="editForm.immediate_action" />
              </ElFormItem>
              <ElFormItem label="Severity" prop="severity">
                <ElSelect v-model="editForm.severity" placeholder="Select severity">
                  <ElOption v-for="s in severityLevels" :key="s" :label="s" :value="s" />
        </ElSelect>
      </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 5: Actions -->
        <div v-if="active === 5" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem prop="actions_to_avoid">
                <div class="table-scroll">
                  <ElTable :data="editForm.actions_to_avoid || []" style="width:100%" class="actions-table">
                    <ElTableColumn prop="action" label="Action" />
                    <ElTableColumn prop="responsible" label="Responsible" />
                    <ElTableColumn prop="priority" label="Priority" />
                    <ElTableColumn prop="due_date" label="Due Date" />
                    <ElTableColumn label="Operations">
                      <template #default="{ $index }">
                        <ElButton type="danger" size="small" @click="removeAction($index)">Remove</ElButton>
                      </template>
                    </ElTableColumn>
                  </ElTable>
                </div>
                <ElButton type="primary" @click="addActionRow" style="margin-top: 10px;">Add Action</ElButton>
      </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 6: Prepared By -->
        <div v-if="active === 6" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem label="Prepared By" prop="prepared_by_name">
                <ElInput v-model="editForm.prepared_by_name" />
              </ElFormItem>
              <ElFormItem label="Job Title" prop="prepared_by_job_title">
                <ElInput v-model="editForm.prepared_by_job_title" />
              </ElFormItem>
              <ElFormItem label="Attach Documents">
                <ElUpload
                  v-model:file-list="editFiles"
                  :auto-upload="false"
                  multiple
                  :limit="10"
                  :on-exceed="() => ElMessage.warning('File limit reached')"
                >
                  <ElButton type="primary">Select Files</ElButton>
                </ElUpload>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>
    </ElForm>
    </div>

    <template #footer>
      <div class="steps-navigation">
        <div class="nav-left">
          <ElButton v-if="active > 0" @click="prevStep" type="primary" class="nav-button">
            <i class="fas fa-chevron-left"></i> Previous
          </ElButton>
        </div>
        
        <div class="nav-center">
          <ElButton 
            @click="saveCurrentStep" 
            type="warning" 
            class="nav-button save-button"
            :loading="saving"
            :disabled="saving"
          >
            <i class="fas fa-save"></i> Save Progress
          </ElButton>
        </div>
        
        <div class="nav-right">
          <ElButton v-if="active < 6" type="primary" @click="nextStep" class="nav-button">
            Next <i class="fas fa-chevron-right"></i>
          </ElButton>
          <ElButton v-if="active === 6" type="success" @click="submitEdit" class="nav-button">
            <i class="fas fa-check"></i> Final Update
          </ElButton>
          <ElButton @click="editDrawer=false" class="nav-button cancel-button">Cancel</ElButton>
        </div>
      </div>
    </template>
  </ElDrawer>

  <!-- Report Incident Drawer -->
  <ElDrawer 
    v-model="reportDrawer" 
    title="Report Incident" 
    :size="reportDrawerSize"
    direction="rtl"
    :with-header="true"
    :close-on-click-modal="false"
  >
    <div class="drawer-content">
      <!-- Step Header with Navigation -->
      <div class="step-header">
        <ElButton 
          @click="reportGoToPrevStep" 
          :disabled="reportActive === 0"
          type="text" 
          class="step-nav-btn prev-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </ElButton>
        
        <div class="step-title">
          <span class="step-number">{{ reportActive + 1 }}</span>
          <span class="step-text">{{ stepTitles[reportActive] }}</span>
        </div>
        
        <ElButton 
          @click="reportGoToNextStep" 
          :disabled="reportActive === stepTitles.length - 1"
          type="text" 
          class="step-nav-btn next-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </ElButton>
      </div>

      <ElForm 
        :model="reportForm" 
        :rules="reportCurrentStepRules"
        ref="reportFormRef"
        label-position="top"
        class="edit-form"
      >
        <!-- Step 0: Incident Details -->
        <div v-if="reportActive === 0" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem label="Occurred Date" prop="occurred_date">
                <ElDatePicker v-model="reportForm.occurred_date" type="date" />
              </ElFormItem>
              <ElFormItem label="Occurred Time" prop="occurred_time">
                <ElTimePicker v-model="reportForm.occurred_time" />
              </ElFormItem>
              <ElFormItem label="Location" prop="location_text">
                <ElInput v-model="reportForm.location_text" />
              </ElFormItem>
              <ElFormItem label="Reported By" prop="reported_by">
                <ElInput v-model="reportForm.reported_by" />
              </ElFormItem>
              <ElFormItem label="Reporter Phone" prop="reporter_phone">
                <ElInput v-model="reportForm.reporter_phone" placeholder="2547XXXXXXXX" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 1: Worker Details -->
        <div v-if="reportActive === 1" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem label="Worker Name" prop="worker_name">
                <ElInput v-model="reportForm.worker_name" />
              </ElFormItem>
              <ElFormItem label="Designation" prop="designation">
                <ElInput v-model="reportForm.designation" />
              </ElFormItem>
              <ElFormItem label="Site Supervisor" prop="site_supervisor">
                <ElInput v-model="reportForm.site_supervisor" />
              </ElFormItem>
              <ElFormItem label="Department" prop="department">
                <ElInput v-model="reportForm.department" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 2: Categories -->
        <div v-if="reportActive === 2" class="form-step">
          <ElRow :gutter="20">
            <!-- Incident Types Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Incident Types</div>
                </template>
                <ElFormItem prop="incident_types">
                  <ElCheckboxGroup v-model="reportForm.incident_types">
                    <ElRow :gutter="10">
                      <ElCol v-for="i in incidentTypes" :key="i" :span="24">
                        <ElCheckbox :label="i" class="checkbox-item">{{ i }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>

            <!-- Mechanism Causing Incident Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Mechanism Causing Incident</div>
                </template>
                <ElFormItem prop="mechanisms">
                  <ElCheckboxGroup v-model="reportForm.mechanisms">
                    <ElRow :gutter="10">
                      <ElCol v-for="m in mechanisms" :key="m" :span="24">
                        <ElCheckbox :label="m" class="checkbox-item">{{ m }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>

            <!-- Indirect Causes Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Indirect Causes</div>
                </template>
                <ElFormItem prop="indirect_causes">
                  <ElCheckboxGroup v-model="reportForm.indirect_causes">
                    <ElRow :gutter="10">
                      <ElCol v-for="p in indirectCauses" :key="p" :span="24">
                        <ElCheckbox :label="p" class="checkbox-item">{{ p }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>

            <!-- Activity Leading to Incident Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Activity Leading to Incident</div>
                </template>
                <ElFormItem prop="activity_leading">
                  <ElCheckboxGroup v-model="reportForm.activity_leading">
                    <ElRow :gutter="10">
                      <ElCol v-for="a in activities" :key="a" :span="24">
                        <ElCheckbox :label="a" class="checkbox-item">{{ a }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 3: Causes -->
        <div v-if="reportActive === 3" class="form-step">
          <ElRow :gutter="20">
            <!-- Direct Causes Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Direct Causes</div>
                </template>
                <ElFormItem prop="direct_causes">
                  <ElCheckboxGroup v-model="reportForm.direct_causes">
                    <ElRow :gutter="10">
                      <ElCol v-for="j in directCauses" :key="j" :span="24">
                        <ElCheckbox :label="j" class="checkbox-item">{{ j }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>

            <!-- Root Cause Card -->
            <ElCol :span="24">
              <ElCard class="category-card" shadow="hover">
                <template #header>
                  <div class="card-header">Root Cause</div>
                </template>
                <ElFormItem prop="root_cause">
                  <ElCheckboxGroup v-model="reportForm.root_cause">
                    <ElRow :gutter="10">
                      <ElCol v-for="a in rootCauses" :key="a" :span="24">
                        <ElCheckbox :label="a" class="checkbox-item">{{ a }}</ElCheckbox>
                      </ElCol>
                    </ElRow>
                  </ElCheckboxGroup>
                </ElFormItem>
              </ElCard>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 4: Narrative -->
        <div v-if="reportActive === 4" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem label="Description" prop="description">
                <ElInput type="textarea" :rows="3" v-model="reportForm.description" />
              </ElFormItem>
              <ElFormItem label="Consequences" prop="consequences">
                <ElInput type="textarea" :rows="3" v-model="reportForm.consequences" />
              </ElFormItem>
              <ElFormItem label="Immediate Action" prop="immediate_action">
                <ElInput type="textarea" :rows="3" v-model="reportForm.immediate_action" />
              </ElFormItem>
              <ElFormItem label="Severity" prop="severity">
                <ElSelect v-model="reportForm.severity" placeholder="Select severity">
                  <ElOption v-for="s in severityLevels" :key="s" :label="s" :value="s" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 5: Actions -->
        <div v-if="reportActive === 5" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem prop="actions_to_avoid">
                <div class="table-scroll">
                  <ElTable :data="reportForm.actions_to_avoid || []" style="width:100%" class="actions-table">
                    <ElTableColumn prop="action" label="Action" />
                    <ElTableColumn prop="responsible" label="Responsible" />
                    <ElTableColumn prop="priority" label="Priority" />
                    <ElTableColumn prop="due_date" label="Due Date" />
                    <ElTableColumn label="Operations">
                      <template #default="{ $index }">
                        <ElButton type="danger" size="small" @click="removeReportAction($index)">Remove</ElButton>
                      </template>
                    </ElTableColumn>
                  </ElTable>
                </div>
                <ElButton type="primary" @click="addActionRow" style="margin-top: 10px;">Add Action</ElButton>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <!-- Step 6: Prepared By -->
        <div v-if="reportActive === 6" class="form-step">
          <ElRow :gutter="16">
            <ElCol :span="24">
              <ElFormItem label="Prepared By" prop="prepared_by_name">
                <ElInput v-model="reportForm.prepared_by_name" />
              </ElFormItem>
              <ElFormItem label="Job Title" prop="prepared_by_job_title">
                <ElInput v-model="reportForm.prepared_by_job_title" />
              </ElFormItem>
              <ElFormItem label="Attach Documents">
                <ElUpload
                  v-model:file-list="reportFiles"
                  :auto-upload="false"
                  multiple
                  :limit="10"
                  :on-exceed="() => ElMessage.warning('File limit reached')"
                >
                  <ElButton type="primary">Select Files</ElButton>
                </ElUpload>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>
      </ElForm>
    </div>

    <template #footer>
      <div class="steps-navigation">
        <div class="nav-left">
          <ElButton v-if="reportActive > 0" @click="reportPrevStep" type="primary" class="nav-button">
            <i class="fas fa-chevron-left"></i> Previous
          </ElButton>
        </div>
        
        <div class="nav-center">
          <!-- No save progress for new incidents -->
        </div>
        
        <div class="nav-right">
          <ElButton v-if="reportActive < 6" type="primary" @click="reportNextStep" class="nav-button">
            Next <i class="fas fa-chevron-right"></i>
          </ElButton>
          <ElButton v-if="reportActive === 6" type="success" @click="submitReport" class="nav-button">
            <i class="fas fa-check"></i> Submit Report
          </ElButton>
          <ElButton @click="reportDrawer=false" class="nav-button cancel-button">Cancel</ElButton>
        </div>
      </div>
    </template>
  </ElDrawer>

  <!-- History Drawer -->
  <ElDrawer 
    v-model="historyDrawer" 
    title="Incident Details & History" 
    :size="historyDrawerSize"
    direction="rtl"
    :with-header="true"
    :close-on-click-modal="false"
  >
    <div v-if="selectedIncident">
      <ElTabs v-model="historyActiveTab" type="card">
        <!-- Details Tab -->
        <ElTabPane label="Incident Details" name="details">
          <div class="incident-details">
            <!-- Basic Info -->
            <ElCollapse v-model="activeCollapseItems" accordion>
              <ElCollapseItem title="Basic Information" name="basic">
                <div class="detail-section">
                  <div class="detail-row">
                    <span class="detail-label">Code:</span>
                    <span class="detail-value">{{ selectedIncident.code }}</span>
    </div>
                  <div class="detail-row">
                    <span class="detail-label">Occurred Date:</span>
                    <span class="detail-value">{{ formatDateTime(selectedIncident.occurred_date) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Reported Date:</span>
                    <span class="detail-value">{{ formatDateTime(selectedIncident.reported_date) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">{{ selectedIncident.location_text || 'N/A' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Severity:</span>
                    <span class="detail-value">
                      <ElTag :type="getSeverityColor(selectedIncident.severity)">
                        {{ selectedIncident.severity || 'N/A' }}
                      </ElTag>
                    </span>
                  </div>
                </div>
              </ElCollapseItem>

              <!-- Worker Details -->
              <ElCollapseItem title="Worker Details" name="worker">
                <div class="detail-section">
                  <div class="detail-row">
                    <span class="detail-label">Worker Name:</span>
                    <span class="detail-value">{{ selectedIncident.worker_name || 'N/A' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Designation:</span>
                    <span class="detail-value">{{ selectedIncident.designation || 'N/A' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Site Supervisor:</span>
                    <span class="detail-value">{{ selectedIncident.site_supervisor || 'N/A' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Department:</span>
                    <span class="detail-value">{{ selectedIncident.department || 'N/A' }}</span>
                  </div>
                </div>
              </ElCollapseItem>

              <!-- Incident Categories -->
              <ElCollapseItem title="Incident Details" name="categories">
                <div class="detail-section">
                  <div class="detail-row" v-if="selectedIncident.incident_types && selectedIncident.incident_types.length">
                    <span class="detail-label">Incident Types:</span>
                    <div class="detail-value">
                      <ElTag v-for="type in selectedIncident.incident_types" :key="type" style="margin-right: 8px; margin-bottom: 4px;">
                        {{ type }}
                      </ElTag>
                    </div>
                  </div>
                  <div class="detail-row" v-if="selectedIncident.mechanisms && selectedIncident.mechanisms.length">
                    <span class="detail-label">Mechanisms:</span>
                    <div class="detail-value">
                      <ElTag v-for="mechanism in selectedIncident.mechanisms" :key="mechanism" style="margin-right: 8px; margin-bottom: 4px;">
                        {{ mechanism }}
                      </ElTag>
                    </div>
                  </div>
                  <div class="detail-row" v-if="selectedIncident.indirect_causes && selectedIncident.indirect_causes.length">
                    <span class="detail-label">Indirect Causes:</span>
                    <div class="detail-value">
                      <ElTag v-for="cause in selectedIncident.indirect_causes" :key="cause" style="margin-right: 8px; margin-bottom: 4px;">
                        {{ cause }}
                      </ElTag>
                    </div>
                  </div>
                  <div class="detail-row" v-if="selectedIncident.direct_causes && selectedIncident.direct_causes.length">
                    <span class="detail-label">Direct Causes:</span>
                    <div class="detail-value">
                      <ElTag v-for="cause in selectedIncident.direct_causes" :key="cause" style="margin-right: 8px; margin-bottom: 4px;">
                        {{ cause }}
                      </ElTag>
                    </div>
                  </div>
                  <div class="detail-row" v-if="selectedIncident.root_cause && selectedIncident.root_cause.length">
                    <span class="detail-label">Root Causes:</span>
                    <div class="detail-value">
                      <ElTag v-for="cause in selectedIncident.root_cause" :key="cause" style="margin-right: 8px; margin-bottom: 4px;">
                        {{ cause }}
                      </ElTag>
                    </div>
                  </div>
                </div>
              </ElCollapseItem>

              <!-- Narrative -->
              <ElCollapseItem title="Narrative" name="narrative">
                <div class="detail-section">
                  <div class="detail-row">
                    <span class="detail-label">Description:</span>
                    <div class="detail-value">{{ selectedIncident.description || 'N/A' }}</div>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Consequences:</span>
                    <div class="detail-value">{{ selectedIncident.consequences || 'N/A' }}</div>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Immediate Action:</span>
                    <div class="detail-value">{{ selectedIncident.immediate_action || 'N/A' }}</div>
                  </div>
                </div>
              </ElCollapseItem>

              <!-- Actions -->
              <ElCollapseItem title="Actions to Avoid" name="actions" v-if="selectedIncident.actions_to_avoid && selectedIncident.actions_to_avoid.length">
                <div class="detail-section">
                  <div v-for="(action, index) in selectedIncident.actions_to_avoid" :key="index" class="action-item">
                    <div class="action-header">
                      <strong>Action {{ index + 1 }}:</strong>
                      <ElTag :type="getPriorityColor(action.priority)">{{ action.priority }}</ElTag>
                    </div>
                    <div class="action-details">
                      <div><strong>Action:</strong> {{ action.action }}</div>
                      <div><strong>Responsible:</strong> {{ action.responsible }}</div>
                      <div><strong>Due Date:</strong> {{ action.due_date }}</div>
                    </div>
                  </div>
                </div>
              </ElCollapseItem>

              <!-- Prepared By -->
              <ElCollapseItem title="Prepared By" name="prepared">
                <div class="detail-section">
                  <div class="detail-row">
                    <span class="detail-label">Prepared By:</span>
                    <span class="detail-value">{{ selectedIncident.prepared_by_name || 'N/A' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Job Title:</span>
                    <span class="detail-value">{{ selectedIncident.prepared_by_job_title || 'N/A' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Prepared Date:</span>
                    <span class="detail-value">{{ formatDateTime(selectedIncident.prepared_by_date) }}</span>
                  </div>
                </div>
              </ElCollapseItem>
            </ElCollapse>
          </div>
        </ElTabPane>

        <!-- History Tab -->
        <ElTabPane label="History" name="history">
          <div class="history-content">
    <ElTimeline>
      <ElTimelineItem
        v-for="(item, index) in historyList"
        :key="index"
        :timestamp="new Date(item.createdAt).toLocaleString()"
        :type="getActionColor(item.action)"
      >
        <template #default>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <ElTag :type="getActionColor(item.action)">{{ item.action.toUpperCase() }}</ElTag>
              <span v-if="item.changed_by_name" style="font-weight: bold;">by {{ item.changed_by_name }}</span>
            </div>
            
            <div v-if="item.field_name" style="margin-bottom: 4px;">
              <strong>Field:</strong> {{ item.field_name }}
            </div>
            
            <div v-if="item.old_value && item.new_value" style="margin-bottom: 4px;">
              <div><strong>From:</strong> {{ formatValue(item.old_value) }}</div>
              <div><strong>To:</strong> {{ formatValue(item.new_value) }}</div>
            </div>
            
            <div v-if="item.change_reason" style="margin-bottom: 4px;">
              <strong>Reason:</strong> {{ item.change_reason }}
            </div>
            
            <div v-if="item.ip_address" style="font-size: 12px; color: #666;">
              IP: {{ item.ip_address }}
            </div>
          </div>
        </template>
      </ElTimelineItem>
    </ElTimeline>
          </div>
        </ElTabPane>

        <!-- Documentation Tab -->
        <ElTabPane label="Documentation" name="docs">
          <div class="history-content">
            <div v-if="docsLoading">Loading documents...</div>
            <div v-else>
              <ElTable :data="docs" style="width:100%">
                <ElTableColumn prop="name" label="File Name" />
                <ElTableColumn prop="type" label="Type" width="140" />
                <ElTableColumn prop="size" label="Size" width="120" />
                <ElTableColumn label="Actions" width="160">
                  <template #default="{ row }">
                    <ElButton size="small" type="primary" @click="downloadDoc(row)">Download</ElButton>
                  </template>
                </ElTableColumn>
              </ElTable>
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
    </div>
    
    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px;">
        <ElButton type="success" @click="generatePDF(selectedIncident)" :disabled="!selectedIncident">
          <i class="fas fa-file-pdf"></i> Download PDF Report
        </ElButton>
        <ElButton @click="historyDrawer=false">Close</ElButton>
      </div>
    </template>
  </ElDrawer>

  <!-- Action Dialog -->
  <ElDialog 
    v-model="showActionDialog" 
    title="Add Action" 
    :width="'500px'"
    :close-on-click-modal="false"
  >
    <ElForm 
      :model="newAction" 
      :rules="actionDialogRules" 
      label-position="top" 
      ref="actionDialogRef"
    >
      <ElFormItem label="Action" prop="action">
        <ElInput v-model="newAction.action" placeholder="Enter action to be taken" />
      </ElFormItem>
      <ElFormItem label="Responsible" prop="responsible">
        <ElInput v-model="newAction.responsible" placeholder="Enter responsible person" />
      </ElFormItem>
      <ElFormItem label="Priority" prop="priority">
        <ElSelect v-model="newAction.priority" placeholder="Select priority">
          <ElOption label="High" value="High" />
          <ElOption label="Medium" value="Medium" />
          <ElOption label="Low" value="Low" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Due Date" prop="due_date">
        <ElDatePicker v-model="newAction.due_date" type="date" placeholder="Select due date" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="showActionDialog = false">Cancel</ElButton>
      <ElButton type="primary" @click="confirmAddAction">Add Action</ElButton>
    </template>
  </ElDialog>

  <!-- Status Update Dialog -->
  <ElDialog 
    v-model="showStatusDialog" 
    title="Update Incident Status" 
    :width="'500px'"
    :close-on-click-modal="false"
  >
    <div v-if="selectedIncidentForStatus" style="margin-bottom: 16px; padding: 12px; background-color: #f5f7fa; border-radius: 6px;">
      <strong>Incident:</strong> {{ selectedIncidentForStatus.code }}<br/>
      <strong>Description:</strong> {{ selectedIncidentForStatus.description }}
    </div>
    
    <ElForm 
      :model="statusForm" 
      :rules="statusUpdateRules" 
      label-position="top" 
      ref="statusDialogRef"
    >
      <ElFormItem label="Status" prop="status">
        <ElSelect v-model="statusForm.status" placeholder="Select status" style="width: 100%;">
          <ElOption 
            v-for="option in statusOptions" 
            :key="option.value" 
            :label="option.label" 
            :value="option.value" 
          />
        </ElSelect>
      </ElFormItem>
      
      <ElFormItem label="Action Taken" prop="action_taken">
        <ElInput 
          type="textarea" 
          :rows="3" 
          v-model="statusForm.action_taken" 
          placeholder="Describe the action taken to address this incident"
        />
      </ElFormItem>
    </ElForm>
    
    <template #footer>
      <ElButton @click="showStatusDialog = false">Cancel</ElButton>
      <ElButton 
        type="primary" 
        @click="submitStatusUpdate"
        :loading="saving"
        :disabled="saving"
      >
        Update Status
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
/* Drawer Styles */
.el-drawer__body {
  padding: 10px 20px 20px 20px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f5f7fa;
}

/* Drawer title styling */
.el-drawer__header {
  padding: 20px 24px;
  border-bottom: 2px solid #e4e7ed;
  background-color: #f8f9fa;
}

.el-drawer__title {
  font-size: 24px !important;
  font-weight: 700 !important;
  color: #2c3e50 !important;
  margin: 0 !important;
  line-height: 1.2 !important;
}

.drawer-content {
  padding: 10px 0;
}

/* Form spacing in drawer */
.el-form {
  padding: 0 20px;
}

.el-form-item {
  margin-bottom: 16px;
}

/* Timeline styling in history drawer */
.el-timeline {
  padding-left: 20px;
}

.el-timeline-item__content {
  padding-left: 20px;
}

/* Responsive drawer sizes */
@media (max-width: 768px) {
  .el-drawer {
    width: 100% !important;
  }
}

/* Step-based form styles */
.form-step {
  padding: 10px 0;
}

/* Step Header Styles */
.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  margin-bottom: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
}

.step-text {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
}

.step-nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.step-nav-btn:hover:not(:disabled) {
  background-color: #409eff;
  color: white;
}

.step-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.prev-btn {
  margin-right: auto;
}

.next-btn {
  margin-left: auto;
}

.edit-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

/* Category Cards Styling */
.category-card {
  margin-bottom: 20px;
  height: fit-content;
}

.card-header {
  font-weight: 700;
  font-size: 18px;
  color: #2c3e50;
}

.checkbox-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  margin-right: 0;
}

.checkbox-item .el-checkbox__label {
  font-size: 14px;
  line-height: 1.4;
  padding-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-word;
}

.checkbox-item .el-checkbox {
  display: inline-flex;
  align-items: flex-start;
}

.checkbox-item .el-checkbox__input {
  margin-top: 2px;
}

/* Steps navigation */
.steps-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px;
  border-top: 1px solid #e4e7ed;
}

.nav-left, .nav-center, .nav-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-center {
  flex: 1;
  justify-content: center;
}

.nav-button {
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
}

.save-button {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: white;
}

.save-button:hover {
  background-color: #d4922b;
  border-color: #d4922b;
}

.cancel-button {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.cancel-button:hover {
  background-color: #f78989;
  border-color: #f78989;
}

.nav-button i {
  font-size: 14px;
}

/* Table scroll for actions */
.table-scroll {
  width: 100%;
  overflow-x: auto;
}

.actions-table {
  min-width: 600px;
}

/* Custom scrollbar for form */
.edit-form::-webkit-scrollbar {
  width: 6px;
}

.edit-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.edit-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.edit-form::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media (max-width: 768px) {
  .steps-navigation {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .nav-left, .nav-center, .nav-right {
    justify-content: center;
    width: 100%;
  }
  
  .nav-center {
    order: 1;
  }
  
  .nav-left {
    order: 2;
  }
  
  .nav-right {
    order: 3;
  }
  
  .nav-button {
    flex: 1;
    margin: 0;
    min-width: 100px;
    height: 44px;
    font-size: 16px;
  }
  
  .save-button {
    order: -1;
    margin-bottom: 8px;
  }
  
  /* Mobile step header */
  .step-header {
    padding: 8px 16px;
    margin-bottom: 12px;
  }
  
  .step-text {
    font-size: 16px;
  }
  
  .step-number {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
  
  .step-nav-btn {
    width: 32px;
    height: 32px;
  }
}

/* History Drawer Styles */
.incident-details {
  padding: 16px 0;
}

.detail-section {
  padding: 16px;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.detail-label {
  font-weight: 600;
  color: #606266;
  min-width: 140px;
  margin-right: 16px;
  flex-shrink: 0;
}

.detail-value {
  color: #303133;
  flex: 1;
  word-break: break-word;
}

.action-item {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

.action-details div {
  margin-bottom: 4px;
}

.history-content {
  padding: 16px 0;
}

/* Collapse customization */
.el-collapse-item__header {
  font-weight: 700;
  font-size: 16px;
  color: #2c3e50;
}

.el-collapse-item__content {
  padding: 0;
}

/* Tabs customization */
.el-tabs__header {
  margin-bottom: 16px;
}

.el-tabs__item {
  font-weight: 500;
}
</style>


