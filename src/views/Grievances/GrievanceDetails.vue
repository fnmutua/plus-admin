 
<script setup lang="ts">
import { onMounted, reactive, computed, watch, nextTick } from 'vue'
import {
  ElButton, ElTimeline, ElTimelineItem, ElCol, ElRow, ElForm, ElFormItem, ElInput, ElUpload, ElMessage,ElPopconfirm, ElText,
  ElCard, ElTabs, ElTabPane, ElTable, ElTableColumn, ElTooltip, ElDialog, ElSelect, ElOption, ElIcon, ElCollapse, ElCollapseItem, ElSwitch, ElDatePicker, ElDrawer, ElMessageBox, ElTag, ElAlert,
} from 'element-plus'
// Locally
import { getOneGrievance } from '@/api/grievance'
import { uploadGrievanceDocuments, logGrievanceAction, getActionFile, updateGrievanceStatus, sendOverdueReminder,
  updateGrievance, sendAcknowledgement, deleteCascade,revertGrievanceHistory,getGrievanceHistoryByGrievanceId, confirmGrievanceResolution} from '@/api/grievance'
import { uuid } from 'vue-uuid'


import { Icon } from '@iconify/vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import {
  Download, CaretRight, Check, Close, Lock, Notification, Microphone,Delete,Edit,ArrowLeft,RefreshLeft,
  ArrowRight, Document, Plus, Paperclip, InfoFilled, CircleCheck, UploadFilled,
} from '@element-plus/icons-vue'

import {
  getOneGeo,
  getOneSettlement,
  getSettlementListByCounty,
  getfilteredGeo
} from '@/api/settlements'
import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import type { UploadUserFile } from 'element-plus'

import { getSettlementGRMUsers, getCountyGRMUsers, getNationalGRMUsers } from '@/api/users'


import { ref } from 'vue'

import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useRoute } from 'vue-router'
import { Back } from '@element-plus/icons-vue'

import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'

import {
  signupGRM
} from '@/api/register'


import {
  getTimelineReport
} from '@/api/grievance'
import { validateInternationalPhone } from '@/utils/phoneValidation'







const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const isMobile = computed(() => appStore.getMobile)
 
const isSuperAdmin = ref(userInfo.roles.some(role => role.name === "super_admin"));

console.log('userInfo',isSuperAdmin.value)

function getLocationLevels(user) {
  // Check if the 'roles' array exists and has data
  if (user && user.roles && Array.isArray(user.roles)) {
    // Extract the location_level from each role
    return user.roles.map(role => role.user_roles.location_level).filter(level => level); // Filter to remove null/undefined values
  }
  return []; // Return an empty array if no roles exist
}


const current_user_roles = getLocationLevels(userInfo)

console.log('current_user_roles', current_user_roles)

// Check if user is national GRM (can confirm resolutions)
const isNationalGRM = computed(() => {
  return isSuperAdmin.value || current_user_roles.includes('national') || current_user_roles.includes(null)
})

const activeName = ref('details')
// Resolve, Escalate, Documentation 

const route = useRoute()

const Grievance = ref(
  {
    'code': null,
    'complainant': null,
    'telephone': null,
    'county': null,
    'settlement': null,
    'nature': null,
    'is_GBV': null,
    'description': null,
    'status': null,
    'plea': null,
    'date_reported': null,
    'date_logged': null
  }
)



const GrievanceDocuments = ref([])

const GrievanceLogs = ref([])
const GrievanceNotifications = ref([])

//// ------------------parameters -----------------------////

//const associated_Model = ''
const associated_multiple_models = ['county', 'settlement', 'grievance_document', 'grievance_notification', {
  "name": "grievance_log",
  "nestedAssociations": ["users", "grievance_document"]
}]

const formattedLabels = {}
const formatLabel = async (key) => {
  // Convert key to string and replace underscores with spaces
  let formattedKey = String(key).replace(/_/g, ' ');

  // Convert formattedKey to proper case
  formattedKey = formattedKey.replace(/\b\w/g, char => char.toUpperCase());

  console.log('formattedKey', formattedKey)
  return formattedKey;
};


function formatSentence(text) {


  // Replace underscores with spaces
  let formattedText = String(text).replace(/_/g, ' ');

  // Capitalize the first letter
  formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);

  // Ensure proper punctuation and spacing
  // This is a basic example; you might need more complex rules based on requirements
  formattedText = formattedText.replace(/(\.\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

  return formattedText;
}


const button_label = ref()
const button_color = ref()
const button_icon = ref()
const button_disabled = ref(true)

const statusDictionary = [
  { value: 'Sorting', label: 'Sorting', supportedBy: ['Sorting'] },
  { value: 'Investigation', label: 'Investigate Grievance', supportedBy: ['Sorting', 'Investigation', 'Under Review', 'Escalated', 'Referred', 'Returned'] },
  { value: 'Under Review', label: 'Under Review (in progress)', supportedBy: ['Sorting', 'Investigation', 'Under Review', 'Escalated', 'Referred', 'Returned'] },
  { value: 'Escalated', label: 'Escalate', supportedBy: ['Sorting', 'Investigation', 'Under Review', 'Escalated', 'Referred', 'Resolved', 'Returned'] },
  { value: 'Resolved', label: 'Resolve Grievance', supportedBy: ['Sorting', 'Investigation', 'Under Review', 'Escalated', 'Referred', 'Resolved', 'Returned'] },
  { value: 'Rejected', label: 'Reject Grievance', supportedBy: ['Sorting', 'Investigation', 'Under Review', 'Escalated', 'Referred', 'Returned'] },
  { value: 'In Court', label: 'In Court', supportedBy: ['Resolved'] },
  { value: 'Referred', label: 'Refer Grievance', supportedBy: ['Sorting', 'Investigation', 'Under Review', 'Escalated', 'Referred', 'Closed', 'Returned'] },
  { value: 'ExternalReferral', label: 'Refer to External Agency', supportedBy: ['Escalated', 'Referred', 'Resolved', 'Closed', 'Returned'] },
  { value: 'Returned', label: 'Send Back', supportedBy: ['Escalated', 'Referred'] },
  { value: 'Closed', label: 'Close Grievance', supportedBy: ['Resolved', 'Closed'] },
]

const StatusOptions = ref(statusDictionary.map(({ value, label }) => ({ value, label })))

const yesNoOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

const disableFutureDates = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}



const showActionButton=ref(true)

const FullGrievanceData=ref()

const showRefferalField=ref(false)
const shouldShowReminder=ref(false)

// Computed properties for form visibility
const isResolvedStatus = computed(() => form.value.new_status === 'Resolved')
const isReferredStatus = computed(() => form.value.new_status === 'Referred')
const isExternalReferralStatus = computed(() => form.value.new_status === 'ExternalReferral')
const showAgreementFields = computed(() => isResolvedStatus.value && form.value.agreement_reached === true)
const showDisagreementFields = computed(() => isResolvedStatus.value && form.value.agreement_reached === false)

// Dynamic labels based on status
const actionLabel = computed(() => {
  const status = form.value.new_status
  if (!status) return 'Describe the Action Taken'
  
  const labels: Record<string, string> = {
    'Resolved': 'Describe the Resolution Action',
    'Closed': 'Describe the Closure Details',
    'Escalated': 'Describe the Escalation Reason',
    'Referred': 'Describe the Referral Details',
    'ExternalReferral': 'Describe the External Referral Details',
    'Investigation': 'Describe the Investigation Action',
    'Under Review': 'Describe the Review Action',
    'Returned': 'Describe the Return Reason',
    'Rejected': 'Describe the Rejection Reason',
    'Sorting': 'Describe the Sorting Action',
  }
  return labels[status] || 'Describe the Action Taken'
})

const actionPlaceholder = computed(() => {
  const status = form.value.new_status
  if (!status) return 'Describe the action taken for this status update'
  
  const placeholders: Record<string, string> = {
    'Resolved': 'Describe the resolution action taken and how the grievance was resolved',
    'Closed': 'Describe why the grievance is being closed and any final notes',
    'Escalated': 'Describe why the grievance is being escalated and to which level',
    'Referred': 'Describe why the grievance is being referred and what action is expected',
    'ExternalReferral': 'Describe the external referral details and reason for referral',
    'Investigation': 'Describe the investigation action being taken',
    'Under Review': 'Describe the review action and current status',
    'Returned': 'Describe why the grievance is being returned and what needs to be addressed',
    'Rejected': 'Describe the reason for rejection',
    'Sorting': 'Describe the sorting action and initial assessment',
  }
  return placeholders[status] || 'Describe the action taken for this status update'
})

const sectionTitle = computed(() => {
  const status = form.value.new_status
  if (!status) return 'Action Details'
  
  const titles: Record<string, string> = {
    'Resolved': 'Resolution Details',
    'Closed': 'Closure Details',
    'Escalated': 'Escalation Details',
    'Referred': 'Referral Details',
    'ExternalReferral': 'External Referral Details',
    'Investigation': 'Investigation Details',
    'Under Review': 'Review Details',
    'Returned': 'Return Details',
    'Rejected': 'Rejection Details',
    'Sorting': 'Sorting Details',
  }
  return titles[status] || 'Action Details'
})

// Confirmation dialog state
const showConfirmationDialog = ref(false)
const confirmationForm = ref({
  grievance_id: null,
  confirmation_level: '',
  confirmation_notes: ''
})

// Check if grievance can be confirmed
const canConfirmGrievance = computed(() => {
  if (!FullGrievanceData.value) return false
  return isNationalGRM.value && 
         FullGrievanceData.value.status === 'Resolved' && 
         ['settlement', 'county'].includes(FullGrievanceData.value.current_level) &&
         !FullGrievanceData.value.confirmed_by_national_grm
})

// Check if grievance is awaiting confirmation
const isAwaitingConfirmation = computed(() => {
  if (!FullGrievanceData.value) return false
  return FullGrievanceData.value.status === 'Resolved' && 
         ['settlement', 'county'].includes(FullGrievanceData.value.current_level) &&
         !FullGrievanceData.value.confirmed_by_national_grm
})

// Get resolution-related documents
const getResolutionDocuments = computed(() => {
  if (!FullGrievanceData.value || !GrievanceLogs.value || !Array.isArray(GrievanceLogs.value)) return []
  
  // Find the resolution action log
  const resolutionLog = (GrievanceLogs.value as any[]).find((log: any) => 
    log.action_type === 'Resolved' || log.new_status === 'Resolved'
  )
  
  if (!resolutionLog || !(resolutionLog as any).id) return []
  
  const resolutionLogId = (resolutionLog as any).id
  
  // Get documents associated with the resolution action
  const resolutionDocs = (GrievanceDocuments.value as any[]).filter((doc: any) => 
    doc.action_id === resolutionLogId
  )
  
  // Also check nested documents in the log and deduplicate by id
  if ((resolutionLog as any).grievance_documents && Array.isArray((resolutionLog as any).grievance_documents) && (resolutionLog as any).grievance_documents.length > 0) {
    const nestedDocs = (resolutionLog as any).grievance_documents
    const existingIds = new Set(resolutionDocs.map((doc: any) => doc.id).filter((id: any) => id != null))
    
    // Only add nested documents that don't already exist in resolutionDocs
    const uniqueNestedDocs = nestedDocs.filter((doc: any) => !doc.id || !existingIds.has(doc.id))
    
    return [...resolutionDocs, ...uniqueNestedDocs]
  }
  
  return resolutionDocs
})

// Open confirmation dialog
const openConfirmationDialog = () => {
  if (!FullGrievanceData.value) return
  confirmationForm.value = {
    grievance_id: FullGrievanceData.value.id,
    confirmation_level: FullGrievanceData.value.current_level || '',
    confirmation_notes: ''
  }
  showConfirmationDialog.value = true
}

// Confirm grievance resolution
const handleConfirmResolution = async () => {
  if (!confirmationForm.value.grievance_id || !confirmationForm.value.confirmation_level) {
    ElMessage({
      message: 'Please provide all required information',
      type: 'warning'
    })
    return
  }

  try {
    // Backend will automatically close the grievance and send SMS
    const res = await confirmGrievanceResolution(confirmationForm.value)
    
    ElMessage({
      message: (res as any).message || 'Grievance resolution confirmed and closed successfully',
      type: 'success'
    })

    showConfirmationDialog.value = false
    
    // Refresh the grievance data
    await processGrievance()
  } catch (error: any) {
    console.error('Error confirming resolution:', error)
    ElMessage({
      message: error.response?.data?.message || 'Failed to confirm resolution',
      type: 'error'
    })
  }
}
 

const processGrievance = async() => { 
  const id = route.params.id
  const formData = {}
  formData.associated_multiple_models = associated_multiple_models
  formData.id = id

  const res = await getOneGrievance(formData)
  console.log('FullGrievanceData', res.data)
    loading.value=false

  FullGrievanceData.value=res.data
  shouldShowReminder.value= new Date(res.data.status_expiry_date) < new Date();
  console.log(  'shouldShowReminder.value', getStageDuration(res.data.status))

  // Get the Details of the Grievance
  Grievance.value.id = id
  Grievance.value.code = res.data.code
  Grievance.value.complainant = res.data.name
  Grievance.value.telephone = res.data.phone
  Grievance.value.county = res.data.county?.name || '-'
  Grievance.value.settlement = res.data.settlement?.name || '-'
  Grievance.value.nature = res.data.nature
  Grievance.value.is_GBV = res.data.isgbv
  Grievance.value.description = res.data.description
  Grievance.value.status = res.data.status
  Grievance.value.date_reported = res.data.date_reported
  Grievance.value.date_logged = res.data.date_logged
  Grievance.value.plea = res.data.plea
  Grievance.value.current_level = res.data.current_level
  Grievance.value.resolution = res.data.resolution || null


  // Hide action button if:
  // 1. Status is Closed or In Court
  // 2. Status is Resolved AND current_level is settlement or county (resolved by settlement/county GRM)
  //    - Once resolved by settlement/county GRM, no further actions should be allowed for non-national users
  //    - National GRM can still see the action button to close or perform other actions
  //    - Only national GRM can confirm the resolution (via separate confirmation button)
  if(Grievance.value.status =='Closed' || Grievance.value.status =='In Court' ) {
   showActionButton.value=false
  } else if(Grievance.value.status =='Resolved' && ['settlement', 'county'].includes(Grievance.value.current_level) && !isNationalGRM.value) {
   // Hide button for non-national users when resolved at settlement/county level
   showActionButton.value=false
  } else {
    showActionButton.value=true
  }

  console.log('res.data.current_level', res.data.current_level)
  console.log('current_user_roles', current_user_roles)

  // Determine if user can act on this grievance based on their role level
  // National GRM can act on all levels (national, county, settlement)
  // County GRM can act on county-level and settlement-level grievances
  // Settlement GRM can act on settlement-level grievances only
  const userHasNationalRole = current_user_roles.includes('national') || isSuperAdmin.value
  const userHasCountyRole = current_user_roles.includes('county')
  const userHasSettlementRole = current_user_roles.includes('settlement')
  const grievanceLevel = res.data.current_level

  let canAct = false

  if (userHasNationalRole) {
    // National GRM can act on all levels
    canAct = true
    console.log('National GRM - can act on all levels')
  } else if (userHasCountyRole && (grievanceLevel === 'county' || grievanceLevel === 'settlement')) {
    // County GRM can act on county-level and settlement-level grievances
    canAct = true
    console.log('County GRM - can act on county-level and settlement-level grievances')
  } else if (userHasSettlementRole && grievanceLevel === 'settlement') {
    // Settlement GRM can act on settlement-level grievances only
    canAct = true
    console.log('Settlement GRM - can act on settlement-level grievances')
  } else {
    canAct = false
    console.log('User role does not have permission for this grievance level')
  }

  button_disabled.value = !canAct 

  const currentStatus = Grievance.value.status

  const permitted = statusDictionary.filter(option => option.supportedBy.includes(currentStatus))
  const allowCurrentStatus = ['Escalated', 'Referred'].includes(String(currentStatus))
  StatusOptions.value = permitted
    .filter(({ value }) => allowCurrentStatus || value !== currentStatus)
    .map(({ value, label }) => ({ value, label }))

  if (currentStatus === 'Sorting') {
    button_label.value = 'Review and Sort';
    button_color.value = 'primary';
    button_icon.value = 'icon-park-solid:sort';
  } else if (currentStatus == 'Investigation') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';
  } else if (currentStatus == 'Under Review') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';
  } else if (currentStatus == 'Escalated') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';
  } else if (currentStatus == 'Referred') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';
  } else if (currentStatus == 'ExternalReferral') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';
  } else if (currentStatus == 'In Court') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';
  } else if (currentStatus == 'Closed') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';
  } else if (currentStatus == 'Resolved') {
    button_label.value = 'Review/Close grievance';
    button_color.value = 'success';
    button_icon.value = 'typcn:tick';
  } else {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';
  }

  if (['county', 'national'].includes(String(Grievance.value.current_level))) {
    showRefferalField.value = true
  } else {
    showRefferalField.value = false
  }

  if (!StatusOptions.value.some(opt => opt.value === 'ExternalReferral')) {
    StatusOptions.value.push({
      value: 'ExternalReferral',
      label: 'Refer to External Agency',
    })
  }

  if (Grievance.value.current_level === 'national') {
    StatusOptions.value = StatusOptions.value.filter(option =>
      option.value !== 'Escalated' && option.value !== 'Referred'
    )
    if (!StatusOptions.value.some(opt => opt.value === 'Returned')) {
      StatusOptions.value.push({
        value: 'Returned',
        label: 'Send Back to County',
      })
    }
  } else if (Grievance.value.current_level === 'county') {
    if (!StatusOptions.value.some(opt => opt.value === 'Returned')) {
      StatusOptions.value.push({
        value: 'Returned',
        label: 'Send Back to Settlement',
      })
    }
  } else {
    StatusOptions.value = StatusOptions.value.filter(opt => opt.value !== 'Returned')
  }


  // if(res.data.status=='Escalated'){
  //   action.value='Escalated'
  // }
  // else if (res.data.status=='Resolved')  {
  //   action.value=='Resolve'
  // }



  for (const key in Grievance.value) {
    formattedLabels[key] = await formatLabel(key);
  }

  console.log('formattedLabels.value', formattedLabels)
  // Get the Greivance Documents 
  GrievanceDocuments.value = res.data.grievance_documents || []
  GrievanceLogs.value = res.data.grievance_logs || []
  GrievanceNotifications.value = res.data.grievance_notifications || []

  console.log('Grievance.value', Grievance.value)
  console.log('GrievanceDocuments.value', GrievanceDocuments.value)
  console.log('GrievanceLogs.value', GrievanceLogs.value)
  console.log('GrievanceNotifications.value', GrievanceNotifications.value)


}

function getDifferences(before, after, parentKey = '') {
  const differences = [];

  // Handle null or undefined inputs
  if (!before || !after) {
    return differences;
  }

  for (const key in before) {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof before[key] === 'object' && before[key] !== null) {
      if (Array.isArray(before[key])) {
        // Compare arrays deeply
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key] || [])) {
          differences.push({
            field: currentKey,
            before: before[key].join(', '),
            after: (after[key] || []).join(', '),
          });
        }
      } else {
        // Recursively compare nested objects
        differences.push(...getDifferences(before[key], after[key] || {}, currentKey));
      }
    } else {
      // Compare primitive values
      if (before[key] !== after[key]) {
        differences.push({
          field: currentKey,
          before: before[key] || '',
          after: after[key] || '',
        });
      }
    }
  }

  return differences;
}



const editHistory = ref([])

// Track reverted records persistently (survives database refreshes)
const revertedRecordsMap = ref<Record<number, {
  is_reverted: boolean;
  reverted_at: string;
  reverted_by: number;
  reverted_by_user: { id: number; name: string };
}>>({})

// Computed property to check if a record is reverted
const isReverted = (record) => {
  if (!record || !record.id) return false;
  
  // First check our persistent frontend tracking map
  if (revertedRecordsMap.value[record.id]) {
    return true;
  }
  
  // Then check multiple possible field names for revert status from database
  const isRevertedCheck = 
    record.is_reverted === true || 
    record.is_reverted === 1 ||
    record.reverted === true ||
    record.reverted === 1 ||
    !!record.reverted_at ||
    !!record.revertedAt ||
    !!record.reverted_by ||
    !!record.revertedBy ||
    !!record.reverted_by_user ||
    !!record.revertedByUser ||
    false;
  
  // Debug logging
  if (isRevertedCheck) {
    console.log('Record is reverted:', record.id, {
      is_reverted: record.is_reverted,
      reverted_at: record.reverted_at || record.revertedAt,
      reverted_by: record.reverted_by || record.revertedBy,
      reverted_by_user: record.reverted_by_user || record.revertedByUser
    });
  }
  
  return isRevertedCheck;
}

// Get revert information for display
const getRevertInfo = (record) => {
  if (!record || !record.id) return { reverted: false };
  
  // First check our persistent frontend tracking map
  if (revertedRecordsMap.value[record.id]) {
    const revertData = revertedRecordsMap.value[record.id];
    return {
      reverted: true,
      revertedAt: revertData.reverted_at,
      revertedBy: revertData.reverted_by_user?.name || 'System',
    }
  }
  
  // Then check database fields
  if (isReverted(record)) {
    return {
      reverted: true,
      revertedAt: record.reverted_at || record.revertedAt || record.reverted_at,
      revertedBy: 
        record.reverted_by_user?.name || 
        record.revertedByUser?.name ||
        record.reverted_by_user ||
        record.revertedByUser ||
        record.reverted_by ||
        record.revertedBy ||
        'System',
    }
  }
  return { reverted: false }
}

// Get action type for history records: Edit or Delete
const getHistoryActionType = (record) => {
  if (!record) return 'Edit';
  
  // First check backend's change_type field (primary source)
  if (record.change_type) {
    const changeType = String(record.change_type).trim();
    if (changeType === 'Delete' || changeType.toLowerCase() === 'delete') {
      return 'Delete';
    }
    // If it's not Delete, check if it's explicitly Edit
    if (changeType === 'Edit' || changeType.toLowerCase() === 'edit') {
      return 'Edit';
    }
    // For other types like 'Referred', treat as Edit
    return 'Edit';
  }
  
  // Fallback: check other possible field names
  if (record.action_type && typeof record.action_type === 'string') {
    const at = record.action_type.toLowerCase();
    if (at.includes('delete')) return 'Delete';
  }
  if (record.operation && String(record.operation).toLowerCase() === 'delete') {
    return 'Delete';
  }
  
  // Heuristic fallback: if after is empty and before had values, likely a delete
  try {
    const before = record?.changes?.before || {};
    const after = record?.changes?.after || {};
    if (Object.keys(before).length > 0 && Object.keys(after).length === 0) {
      return 'Delete';
    }
  } catch (e) {}
  
  // Default to Edit
  return 'Edit';
}

const getHistoryActionTagType = (actionType) => {
  return actionType === 'Delete' ? 'danger' : 'info';
}

const getGrievanceHistory = async (grievance_id) => {
  try {
    const model = 'grievance_history'

    const formData = {}
    formData.model = model
    formData.grievance_id = grievance_id

    //-Search field--------------------------------------------
    formData.searchField = 'name'
    formData.excludeGeom = false
    formData.associated_multiple_models = ['users', 'reverted_by_user']

    //--Single Filter -----------------------------------------

    // - multiple filters -------------------------------------
    formData.filters = ['grievance_id']
    formData.filterValues = [[grievance_id]]

    //formData.cache_key = 'SeacrchByKey_' + search_string.value

    //-------------------------
    console.log("formData", formData)
    //console.log(formData)
    const res = await getGrievanceHistoryByGrievanceId(formData)

    console.log('Greivance History collected........', res.data)
    const rawHistory = res.data || [];

    // Process the differences for nested properties
    editHistory.value = rawHistory.map((record) => {
      const changes = record.changes || {};
      const differences = getDifferences(changes.before || {}, changes.after || {});
      
      // If database has revert status but we don't have it in our map, add it
      if (!revertedRecordsMap.value[record.id] && 
          (record.is_reverted || record.reverted_at || record.reverted_by || record.reverted_by_user)) {
        revertedRecordsMap.value[record.id] = {
          is_reverted: true,
          reverted_at: record.reverted_at || record.revertedAt || new Date().toISOString(),
          reverted_by: record.reverted_by || record.revertedBy || userInfo.id,
          reverted_by_user: record.reverted_by_user || record.revertedByUser || {
            id: record.reverted_by || record.revertedBy || userInfo.id,
            name: record.reverted_by_user?.name || record.revertedByUser?.name || 'System'
          }
        };
      }
      
      // Merge with frontend persistent revert state if it exists
      const frontendRevertState = revertedRecordsMap.value[record.id];
      const mergedRecord = frontendRevertState 
        ? {
            ...record,
            ...frontendRevertState,
          }
        : record;
      
      // Debug: Log revert status for each record
      console.log('Processing history record:', record.id, {
        is_reverted: mergedRecord.is_reverted,
        reverted_at: mergedRecord.reverted_at,
        reverted_by: mergedRecord.reverted_by,
        reverted_by_user: mergedRecord.reverted_by_user,
        hasFrontendState: !!frontendRevertState,
        allKeys: Object.keys(mergedRecord)
      });
      
      const revertInfo = getRevertInfo(mergedRecord);
      
      return {
        ...mergedRecord,
        differences,
        revertInfo,
      };
    });
    
    // Log summary of revert status
    const revertedCount = editHistory.value.filter(r => isReverted(r)).length;
    console.log(`History loaded: ${editHistory.value.length} records, ${revertedCount} reverted`);
  } catch (error) {
    console.warn('No grievance history found or error occurred:', error);
    editHistory.value = [];
  }
}

const grmUsers=ref([])
const grmUsersLoading=ref(false)
const getGRMUsers = async () => {
  grmUsersLoading.value = true

  try {
    const allUsersMap = new Map<number | string, any>()
    const limit = 10000

    // 1) Get settlement GRM users if settlement_id exists
    if (FullGrievanceData.value.settlement_id) {
      try {
        console.log('Getting settlement GRM users --->', { settlement_id: FullGrievanceData.value.settlement_id })
        const settlementRes = await getSettlementGRMUsers({
          settlement_id: FullGrievanceData.value.settlement_id,
          limit,
          page: 1
        })
        console.log('After getting settlement GRM users', settlementRes)
        const settlementUsers = Array.isArray(settlementRes.data) ? settlementRes.data : []
        settlementUsers.forEach((user: any) => {
          if (user && user.id != null && !allUsersMap.has(user.id)) {
            allUsersMap.set(user.id, user)
          }
        })
      } catch (err) {
        console.warn('Error fetching settlement GRM users:', err)
      }
    }

    // 2) Get county GRM users if county_id exists
    if (FullGrievanceData.value.county_id) {
      try {
        console.log('Getting county GRM users --->', { county_id: FullGrievanceData.value.county_id })
        const countyRes = await getCountyGRMUsers({
          county_id: FullGrievanceData.value.county_id,
          limit,
          page: 1
        })
        console.log('After getting county GRM users', countyRes)
        const countyUsers = Array.isArray(countyRes.data) ? countyRes.data : []
        countyUsers.forEach((user: any) => {
          if (user && user.id != null && !allUsersMap.has(user.id)) {
            allUsersMap.set(user.id, user)
          }
        })
      } catch (err) {
        console.warn('Error fetching county GRM users:', err)
      }
    }

    // 3) Get national GRM users (no IDs required)
    try {
      console.log('Getting national GRM users --->')
      const nationalRes = await getNationalGRMUsers({ limit, page: 1 })
      console.log('After getting national GRM users', nationalRes)
      const nationalUsers = Array.isArray(nationalRes.data) ? nationalRes.data : []
      nationalUsers.forEach((user: any) => {
        if (user && user.id != null && !allUsersMap.has(user.id)) {
          allUsersMap.set(user.id, user)
        }
      })
    } catch (err) {
      console.warn('Error fetching national GRM users:', err)
    }

    const allUsers = Array.from(allUsersMap.values())

    // Helper to infer officer level from API response
    const getOfficerLevel = (user: any): 'settlement' | 'county' | 'national' => {
      // Priority 1: Check explicit location_level fields in user_roles array
      // user_roles can be an array, so check all roles
      let explicitLevel: string | null = null
      if (Array.isArray(user?.user_roles)) {
        const grmRole = user.user_roles.find((role: any) => role.roleid === 4 || role.role?.id === 4)
        explicitLevel = grmRole?.location_level || grmRole?.user_roles?.location_level || null
      } else if (user?.user_roles?.location_level) {
        explicitLevel = user.user_roles.location_level
      } else if (user?.location_level) {
        explicitLevel = user.location_level
      }
      
      if (explicitLevel === 'settlement') return 'settlement'
      if (explicitLevel === 'county') return 'county'
      if (explicitLevel === 'national') return 'national'
      
      // Priority 2: Check if user has settlement_id
      // This indicates they are a Settlement GRM Officer
      if (user.settlement_id) {
        return 'settlement'
      }
      
      // Priority 3: Check if user has county_id but no settlement_id (county level)
      if (user.county_id && !user.settlement_id) {
        return 'county'
      }
      
      // Priority 4: Check if user has no county_id and no settlement_id (could be national)
      if (!user.settlement_id && !user.county_id) {
        return 'national'
      }
      
      // Default: any officer without a clear level is settlement
      return 'settlement'
    }

    const getOfficerRoleLabel = (level: string): string => {
      if (level === 'settlement') return 'Settlement GRM Officer'
      if (level === 'county') return 'County GRM Officer'
      if (level === 'national') return 'National GRM Officer'
      return 'GRM Officer'
    }

    // Enrich officers with inferred level and friendly label
    const enrichedUsers = allUsers.map((user: any) => {
      const level = getOfficerLevel(user)
      const roleLabel = getOfficerRoleLabel(level)
      return {
        raw: user,
        level,
        label: `${user.name} (${roleLabel})`,
        value: user.id,
      }
    })

    // Show everyone we found (settlement, county, national)
    grmUsers.value = enrichedUsers.map((u) => ({
      label: u.label,
      value: u.value,
    }))
  } finally {
    grmUsersLoading.value = false
  }
}
const currentUser = wsCache.get(appStore.getUserInfo)

const loading =ref(false)
onMounted(async () => {
  loading.value=true
  await processGrievance()
  await getGRMUsers()
  await getGrievanceHistory(route.params.id)
  loading.value=false

})


// Computed property to transform grievance object into an array for el-table
const grievanceData = computed(() => {
  const data = Object.keys(Grievance.value).map(key => {
    let value: string
    if (key === 'resolution') {
      value = Grievance.value[key] || 'N/A'
    } else if (key === 'date_reported' || key === 'date_logged') {
      const raw = Grievance.value[key]
      value =
        raw !== null && raw !== undefined && raw !== ''
          ? formatDate(raw)
          : 'N/A'
    } else {
      value =
        Grievance.value[key] !== null && Grievance.value[key] !== undefined
          ? formatSentence(Grievance.value[key])
          : 'N/A'
    }

    return {
    label: formatSentence(key),
      value: value
    };
  });
  
  // Add resolution field if it exists in FullGrievanceData (even if not in Grievance.value)
  if (FullGrievanceData.value?.resolution) {
    // Check if resolution already exists in the data array
    const resolutionIndex = data.findIndex(item => item.label.toLowerCase() === 'resolution');
    if (resolutionIndex !== -1) {
      // Update existing resolution entry
      data[resolutionIndex].value = FullGrievanceData.value.resolution;
    } else {
      // Add resolution entry
      data.push({
        label: 'Resolution',
        value: FullGrievanceData.value.resolution
      });
    }
  }
  
  return data;
});


 

const sortedGrievanceLogs = computed(() => {
  if (!GrievanceLogs.value || !Array.isArray(GrievanceLogs.value)) {
    return [];
  }
  
  return GrievanceLogs.value
    .map(log => ({
      ...log,
      action_type: log.action_type === "Escalated"
        ? log.current_level === "county" 
          ? "Escalated to county team for resolution" 
          : log.current_level === "national" 
            ? "Escalated to National team for resolution" 
            : log.action_type
        : log.action_type === "Returned"
          ? log.current_level === "county"
            ? "Returned to county team for review"
            : log.current_level === "settlement"
              ? "Returned to settlement GRC team for review"
              : log.action_type
          : log.action_type
    }))
    .slice()
    .sort((a, b) => new Date(b.date_actioned) - new Date(a.date_actioned));
});







console.log('sortedGrievanceLogs',sortedGrievanceLogs)


 
const sortedGrievanceNotifications = computed(() => {
  if (!GrievanceNotifications.value || !Array.isArray(GrievanceNotifications.value)) {
    return [];
  }
  
  return GrievanceNotifications.value.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

const router = useRouter()


const goBack = () => {
  // Add your logic to handle the back action
  // For example, you can use Vue Router to navigate back
  if (router) {
    // Use router.back() to navigate back
    router.back()
  } else {
    console.warn('Router instance not available.')
  }


}


const form = ref({
  grievance_id: null,
  action_type: null,
  action_by: null,
  action: null,
  reffered_to: null,
  reffered_to_officer: null,
  date_actioned: null,
  prev_status: null,
  new_status: null,
  fileList: [],
  // resolution additional apramerts 
  resolution_date: null,
  filer_present: true,
  field_verification_conducted: true,
  field_investigations: null,
  agreement_reached: true,
  agreement: null,
  point_disagreement: null,
  issues: null,
});




const dialogFormVisible = ref(false)
const isSubmittingSuccessfully = ref(false)
const isResolutionSubmitting = ref(false)
const showSupportingDocDialog = ref(false)
const isSupportingDocUploading = ref(false)
const supportingDocFileList = ref([])
const supportingDocType = ref('Supporting Documentation')

const documentTypes = [
  { label: 'Supporting Documentation', value: 'Supporting Documentation' },
  { label: 'Acknowledgement', value: 'Acknowledgement' },
  { label: 'Resolution Document', value: 'Resolution Document' },
  { label: 'Other', value: 'Other' }
]
const handlePreview = (file) => {
  console.log('Preview:', file);
};

const handleRemove = (file, fileList) => {
  console.log('Remove:', file, fileList);
  // Trigger validation when files are removed, especially if status is Resolved
  if (dynamicFormRef.value && form.value.new_status === 'Resolved') {
    dynamicFormRef.value.validateField('fileList');
  }
};

const beforeRemove = () => {
  return true;
};

const handleExceed = () => {
  ElMessage.warning('You can only upload up to 3 files.');
};

// File validation: only images and documents, max 10MB, no executables
const beforeUpload = (file: any) => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  const fileSize = file.size;
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();

  // Block executable files
  const blockedExtensions = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'msi', 'dll', 'sh'];
  if (blockedExtensions.includes(fileExtension)) {
    ElMessage.error(`File type .${fileExtension} is not allowed. Please upload only images and documents.`);
    return false;
  }

  // Allow images and documents
  const allowedExtensions = [
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
    // Documents
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp'
  ];

  if (!allowedExtensions.includes(fileExtension)) {
    ElMessage.error(`File type .${fileExtension} is not supported. Please upload images (jpg, png, gif) or documents (pdf, doc, docx, etc.).`);
    return false;
  }

  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    ElMessage.error(`File size exceeds 10MB limit. Current file size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    return false;
  }

  return true;
};



 






const generatePDFform = async (grievance, action) => {
  const formData = {};

  console.log('grievance', grievance)

  if (grievance.status == 'Resolved') {
    // Additional properties based on the provided JSON object
    formData.type = "resolution"

    formData.grievance_id = grievance.id
    formData.code = grievance.code || null; // Grievance code for filename generation
    formData.project_phone = grievance.project_phone || 'Not Available';
    formData.settlement = grievance.settlement || null;
    formData.resolution_date = formatDate(action.resolution_date) || null;
    formData.filer_present = action.filer_present || null;
    formData.field_verification_conducted = action.field_verification_conducted || null;
    formData.agreement_reached = action.agreement_reached || null;
    formData.grc_chairman = action.grc_chairman || 'Not Available';
    formData.complainant = grievance.complainant || null;
    formData.agreement = action.agreement || null;
    formData.issues = action.issues || null;
    formData.field_investigations = action.field_investigations || null;
    formData.point_disagreement = action.point_disagreement || null;
    formData.date = formatDate(Date.now())

    console.log(formData);

    await sendAcknowledgement(formData)



  }







}



function getStageDuration(status) {
    const durations = {
        "Sorting": 7, // 7 days
        "Investigation": 14, // 14 days
        "Escalated": 14 , // 14 days
        "Resolved": 21,  // 21 days
        "Closed": 42,  // 42 days
  
    };
    return (durations[status] || 0) * 24 * 60 * 60 * 1000; // Convert days to milliseconds
}

const resolveActionLevel = () => {
  const level = current_user_roles.find((value) => ['settlement', 'county', 'national'].includes(value))
  return level || form.value.current_level || Grievance.value.current_level || 'settlement'
}

const buildGrievanceLogPayload = (msg: string, finalStatus: string) => ({
  grievance_id: Grievance.value.id,
  action_type: finalStatus,
  action_by: userInfo.id,
  action: msg,
  date_actioned: new Date(),
  prev_status: Grievance.value.status,
  new_status: finalStatus,
  current_level: form.value.current_level || Grievance.value.current_level || 'settlement',
  action_level: resolveActionLevel(),
  resolution_date: form.value.resolution_date,
  filer_present: form.value.filer_present,
  field_verification_conducted: form.value.field_verification_conducted,
  field_investigations: form.value.field_investigations,
  agreement_reached: form.value.agreement_reached,
  agreement: form.value.agreement,
  point_disagreement: form.value.point_disagreement,
  issues: form.value.issues,
  reffered_to: form.value.reffered_to,
  reffered_to_officer: form.value.reffered_to_officer,
})



const dynamicFormRef = ref<FormInstance>()

// Rollback function to revert status update if later steps fail
const rollbackStatusUpdate = async (
  previousStatus: string,
  previousCurrentLevel: string,
  previousStatusDate: Date | string | null,
  previousStatusExpiryDate: Date | string | null
) => {
  try {
    ElMessage({
      message: 'Reverting status update...',
      type: 'warning',
      duration: 2000
    })

    const rollbackData: any = {
      code: Grievance.value.code,
      new_status: previousStatus,
      recipient: Grievance.value.telephone || Grievance.value.phone,
      grievance_id: Grievance.value.id,
      action: 'Status update reverted due to error in subsequent steps',
      current_level: previousCurrentLevel,
      current_status_date: previousStatusDate || new Date(),
      status_expiry_date: previousStatusExpiryDate || new Date(),
      action_by: userInfo.id,
      action_level: resolveActionLevel(),
    }

    if (previousStatus === 'Referred' && Grievance.value.reffered_to_officer) {
      rollbackData.reffered_to_officer = Grievance.value.reffered_to_officer
    }

    await updateGrievanceStatus(rollbackData)
    
    ElMessage({
      message: 'Status has been reverted to previous state',
      type: 'warning',
      duration: 3000
    })
  } catch (rollbackError) {
    console.error('Error during rollback:', rollbackError)
    ElMessage({
      message: 'Failed to revert status. Please contact administrator.',
      type: 'error',
      duration: 5000
    })
    throw rollbackError
  }
}

const submitResolutionForm = async () => {
  const extractApiErrorMessage = (error: any, fallback = 'Request failed') =>
    error?.response?.data?.error ||
    error?.response?.data?.details?.join?.(' ') ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  const isDuplicateDocumentError = (error: any) =>
    error?.response?.status === 409 ||
    error?.response?.data?.code === 'DUPLICATE_GRIEVANCE_DOCUMENT' ||
    error?.isDuplicateDocument === true

  const formInstance = dynamicFormRef

  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      isResolutionSubmitting.value = true
      try {
      form.value.grievance_id = Grievance.value.id
      form.value.action_type = form.value.new_status
      form.value.action_by = userInfo.id  // remember t change 
      form.value.date_actioned = new Date();
      form.value.prev_status = Grievance.value.status
      form.value.action_level = current_user_roles[0] ? current_user_roles[0] : 'settlement'
      //form.value.action =  'testing referral'

      let msg = ''
      if (form.value.new_status == 'Escalated') {
        if (current_user_roles[0] == 'settlement') {
          form.value.current_level = 'county';
          msg = "Your grievance has been escalated to the county.";
        } else {
          form.value.current_level = 'national';
          msg = "Your grievance has been escalated to the national team.";
        }
      } 
      else if (form.value.new_status == 'Returned') {
        if (current_user_roles[0] == 'county') {
          form.value.current_level = 'settlement';
          msg = "Your grievance has been referred to the settlement Grievance Redress team for resolution.";
        } else {
          form.value.current_level = 'county';
          msg = "Your grievance has been referred to the county team for resolution.";
        }
      }
      else if (form.value.new_status == 'Resolved') {
        form.value.current_level = Grievance.value.current_level;
          // Check if user is at national level
          const isNationalLevel = current_user_roles.includes('national') || isSuperAdmin.value;
          if (isNationalLevel) {
            // National GRM resolves - automatically close
            msg = "Your grievance has been resolved and closed. " + form.value.action;
          } else {
            // County or Settlement resolves - subject to confirmation
            msg = "Your grievance has been resolved, subject to confirmation by KISIP National Team. " + form.value.action;
          }
      }
      else if (form.value.new_status == 'Closed') {
        form.value.current_level = Grievance.value.current_level;
        msg = "Your grievance has been closed. " + form.value.action;
      }
      else if (form.value.new_status == 'Referred') {
        form.value.current_level = Grievance.value.current_level;
        msg = "Your grievance has been referred to " + officerLabel.value + " for action. " + form.value.action;
        form.value.action = 'Referred to ' + officerLabel.value +' : ' + form.value.action;
      }
      else {
        form.value.current_level = Grievance.value.current_level;
        msg = form.value.action;
      }

      console.log(form.value.new_status)
      console.log(form.value.current_level)
      console.log(Grievance.value.current_level)

      console.log("checking issue.............",form.value)

      // Store previous state for rollback if needed
      const previousStatus = Grievance.value.status
      const previousCurrentLevel = Grievance.value.current_level
      const previousStatusDate = Grievance.value.current_status_date
      const previousStatusExpiryDate = Grievance.value.status_expiry_date

      // Check if user is at national level for auto-closure
      const isNationalLevel = current_user_roles.includes('national') || isSuperAdmin.value;
      const shouldAutoClose = isNationalLevel && form.value.new_status === 'Resolved';
      const finalStatus = shouldAutoClose ? 'Closed' : form.value.new_status;

      const formData: any = {
        code: Grievance.value.code,
          new_status: finalStatus,
        recipient: Grievance.value.phone,
        grievance_id: Grievance.value.id,
        action: msg,
        current_level: form.value.current_level,
        current_status_date: new Date(),
          status_expiry_date: new Date(Date.now() + getStageDuration(finalStatus)),
        action_by: userInfo.id,
        action_level: current_user_roles[0] ? current_user_roles[0] : 'settlement',
        reffered_to_officer: form.value.reffered_to_officer , // Extract id or set to null
      };

      // Explicitly send resolution field when grievance is resolved
      // Use the action text directly (without the "Your grievance has been resolved. " prefix)
      if (form.value.new_status === 'Resolved') {
          formData.resolution = form.value.action || msg.replace(/^Your grievance has been resolved[^.]*\.\s*/, "");
      }

      const logPayload = buildGrievanceLogPayload(msg, finalStatus)

      // Step 1: Update Status
      console.log('Starting status update...', formData)
      
      let updatedGrievance
      let statusUpdateSuccess = false
      try {
        console.log('Calling updateGrievanceStatus with:', formData)
        updatedGrievance = await updateGrievanceStatus(formData, true)
        console.log('updateGrievanceStatus returned:', updatedGrievance)
        
        // Check if the response indicates success
        if (!updatedGrievance) {
          throw new Error('No response from status update API')
        }
        
        statusUpdateSuccess = true
        
        console.log('Status update successful! Response:', updatedGrievance)
        console.log('About to show success message...')
        
        // Continue to next steps; show one final toast only.
      } catch (error) {
        console.error('Error updating status:', error)
        ElMessage({
          message: 'Failed to update status. Error: ' + (error?.response?.data?.message || error?.message || 'Unknown error'),
          type: 'error',
          duration: 5000
        })
        throw error // Stop execution if status update fails
      }

      // Step 2: Upload Documents (if any)
      // Note: We need action_id for uploads, so we'll create log entry temporarily
      // but only show success message after everything is done
      let actionIdForLogging = null
      let logRes = null
      let uploadSuccess = false
      let loggingSuccess = false
      const hasFiles = form.value.fileList && form.value.fileList.length > 0
      
      try {
        if (hasFiles) {
          try {
            // Create log entry temporarily to get action_id for file uploads
            // We'll show the success message for logging at the end
            const logData = logPayload;
            logRes = await logGrievanceAction(logData, true)
            actionIdForLogging = logRes.data.id
            loggingSuccess = true
            
            await uploadFiles(actionIdForLogging, Grievance.value.id, true)
            uploadSuccess = true
          } catch (error) {
            if (isDuplicateDocumentError(error)) {
              console.warn('Duplicate document blocked during resolution upload:', error)
            } else {
              console.error('Error uploading documents:', error)
            }
            // If upload fails, we need to rollback status and delete the log entry if created
            if (statusUpdateSuccess) {
              await rollbackStatusUpdate(previousStatus, previousCurrentLevel, previousStatusDate, previousStatusExpiryDate)
              if (logRes && logRes.data && logRes.data.id) {
                // Optionally delete the log entry if it was created but upload failed
                // This would require a delete API endpoint
                console.warn('Log entry created but upload failed. Log entry ID:', logRes.data.id)
              }
              const uploadError: any = new Error(`${extractApiErrorMessage(error, 'Document upload failed')}. Status has been reverted.`)
              uploadError.isDuplicateDocument = isDuplicateDocumentError(error)
              throw uploadError
            }
          }
        }

        // Step 3: Log Action (only if not already logged for uploads)
        if (!actionIdForLogging) {
          try {
            const logData = logPayload;
            logRes = await logGrievanceAction(logData, true)
            actionIdForLogging = logRes.data.id
            loggingSuccess = true
          } catch (error) {
            console.error('Error logging action:', error)
            // If logging fails, rollback status update
            if (statusUpdateSuccess) {
              await rollbackStatusUpdate(previousStatus, previousCurrentLevel, previousStatusDate, previousStatusExpiryDate)
              if (uploadSuccess && actionIdForLogging) {
                // Optionally delete uploaded files if logging fails
                console.warn('Files uploaded but logging failed. Action ID:', actionIdForLogging)
              }
              throw new Error('Action logging failed. Status has been reverted.')
            }
          }
        } else {
          // Log was already created for uploads
          loggingSuccess = true
        }
        
        // Ensure we have a valid res object for downstream operations
        const res = logRes || { 
          data: { id: actionIdForLogging || null }, 
          message: 'Grievance status updated successfully' 
        }

        // Success - close drawer immediately
        isSubmittingSuccessfully.value = true
        resetForm()
        dialogFormVisible.value = false

        // Continue with other operations in background
        await processGrievance()

        console.log('Old Grievance.value', Grievance.value)
        console.log('New Grievance.value', updatedGrievance)
 
        // Auto-generation of resolution PDF has been disabled.

        // Final summary message
        let finalMessage = 'Grievance status updated successfully'
        let messageType: 'success' | 'warning' = 'success'
        
        if (hasFiles && uploadSuccess && loggingSuccess) {
          finalMessage = 'Status updated, documents uploaded, and action logged successfully'
        } else if (hasFiles && uploadSuccess && !loggingSuccess) {
          finalMessage = 'Status updated and documents uploaded successfully, but action logging failed'
          messageType = 'warning'
        } else if (hasFiles && !uploadSuccess && loggingSuccess) {
          finalMessage = 'Status updated and action logged successfully, but document upload failed'
          messageType = 'warning'
        } else if (hasFiles && !uploadSuccess && !loggingSuccess) {
          finalMessage = 'Status updated successfully, but document upload and action logging failed'
          messageType = 'warning'
        } else if (!hasFiles && loggingSuccess) {
          finalMessage = 'Status updated and action logged successfully'
        } else if (!hasFiles && !loggingSuccess) {
          finalMessage = 'Status updated successfully, but action logging failed'
          messageType = 'warning'
        }
        
        ElMessage({
          message: finalMessage,
          type: messageType,
          duration: 4000
        })
      } catch (rollbackError: any) {
        // This catch handles rollback errors from Step 2 or Step 3
        console.error('Rollback error:', rollbackError)
        const isDuplicate = isDuplicateDocumentError(rollbackError)
        ElMessage({
          message: extractApiErrorMessage(rollbackError, 'Operation failed and status has been reverted'),
          type: isDuplicate ? 'warning' : 'error',
          duration: 5000
        })
        // Refresh grievance data to reflect reverted state and stop to avoid duplicate error toast
        await processGrievance()
        return
      }
      } catch (error) {
        console.error('Error submitting form:', error)
        ElMessage({
          message: extractApiErrorMessage(error, 'Failed to submit. Please try again.'),
          type: 'error'
        })
      } finally {
        isResolutionSubmitting.value = false
      }
    } else {
      console.log('is Not Valid')
      ElMessage({
        message: 'Please provide all required details',
        type: 'error'
      })    // felix - show message on success request 

    }
  });


};


const uploadFiles = async (action_id, grievance_id, silent = false) => {
  const formData = new FormData();

  // Assuming `fileList` is an array of file objects and `grievance_id` is defined
  for (var i = 0; i < form.value.fileList.length; i++) {
    console.log('------>file', form.value.fileList[i]);
    formData.append('files', form.value.fileList[i].raw);
    formData.append('format', form.value.fileList[i].name.split('.').pop());
    formData.append('grievance_id', grievance_id);
    formData.append('action_id', action_id);
    formData.append('protected_file', true);
    formData.append('size', (form.value.fileList[i].raw.size / 1024 / 1024).toFixed(2));
    formData.append('code', uuid.v4());
  }

  // Printing out the contents of formData
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  const res = await uploadGrievanceDocuments(formData, silent)

  console.log("Docuemnts Uploaded", res)




}

const uploadSupportingDocuments = async () => {
  const extractApiErrorMessage = (error: any, fallback = 'Failed to upload documents. Please try again.') =>
    error?.response?.data?.message || error?.message || fallback
  const isDuplicateDocumentError = (error: any) =>
    error?.response?.status === 409 ||
    error?.response?.data?.code === 'DUPLICATE_GRIEVANCE_DOCUMENT'

  if (!supportingDocFileList.value || supportingDocFileList.value.length === 0) {
    ElMessage({
      message: 'Please select at least one file to upload',
      type: 'warning'
    })
    return
  }

  try {
    isSupportingDocUploading.value = true
    const formData = new FormData()
    const grievance_id = Grievance.value.id

    for (var i = 0; i < supportingDocFileList.value.length; i++) {
      const file = supportingDocFileList.value[i]
      formData.append('files', file.raw)
      formData.append('format', file.name.split('.').pop())
      formData.append('grievance_id', grievance_id)
      formData.append('protected_file', 'true')
      formData.append('type', supportingDocType.value)
      formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2))
      formData.append('code', uuid.v4())
    }

    const res = await uploadGrievanceDocuments(formData)
    console.log("Supporting Documents Uploaded", res)

    ElMessage({
      message: 'Documents uploaded successfully',
      type: 'success'
    })

    // Refresh grievance data to show new documents
    await processGrievance()
    
    // Reset and close dialog
    supportingDocFileList.value = []
    supportingDocType.value = 'Supporting Documentation'
    showSupportingDocDialog.value = false
  } catch (error: any) {
    const isDuplicate = isDuplicateDocumentError(error)
    if (isDuplicate) {
      console.warn('Duplicate supporting document upload blocked:', error?.response?.data || error)
    } else {
      console.error('Error uploading supporting documents:', error)
    }
    ElMessage({
      message: extractApiErrorMessage(error),
      type: isDuplicate ? 'warning' : 'error'
    })
  } finally {
    isSupportingDocUploading.value = false
  }
}

const handleSupportingDocRemove = (file, fileList) => {
  supportingDocFileList.value = fileList
}

const handleSupportingDocExceed = () => {
  ElMessage.warning('Maximum number of files exceeded')
}

const beforeSupportingDocUpload = (file: any) => {
  const isValidType = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('Document must be PDF, Word, or Image format!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('Document size must be smaller than 10MB!')
    return false
  }
  return true
}

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}



const viewLoading = ref(false)

const downloadFile = async (data) => {
  console.log(data);
  viewLoading.value = true;
  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  // Add a flag to track if the download has started


  // Attach a 'beforeunload' event listener to the window
  window.addEventListener('beforeunload', () => {
    if (viewLoading.value) {
      console.log('Download has started.');
      viewLoading.value = false;
    }
  });

  try {
    const response = await getActionFile(formData);
    console.log(response);

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', data.name);
    document.body.appendChild(link);
    link.click();
    viewLoading.value = false;
  } catch (error) {
    ElMessage.error('Failed');
    viewLoading.value = false;
  }
};


const handleDelete = async () => { 
console.log(Grievance.value)

const formData = {}
  formData.model = 'grievance'
  formData.id = Grievance.value.id

  const response = await deleteCascade(formData);

  goBack()
  console.log(response)

}

const getActionClass =   (actionType) => {
  console.log('actionType',actionType)
    if (!actionType) return '';
    if (actionType.includes('Sorting')) return 'sorting-title';
    if (actionType.includes('Resolved')) return 'resolved-title';
    if (actionType.includes('Escalated'))  return 'escalated-title';
    if (actionType.includes('Reported')) return 'reported-title';
    if (actionType.includes('Referred')) return 'referred-title';
    if (actionType.includes('Closed')) return 'closed-title';
    if (actionType.includes('Rejected')) return 'rejected-title';
    if (actionType.includes('Reverted')) return 'reverted-title';
    return '';
  }
  
 
const EditDialogVisible=ref(false)


const countiesOptions=ref([])
const settlementOptions=ref([])

const getCounties = async () => {

const formData = {}
formData.model = 'county'
await getCountyAuth({}).then((response) => {
  console.log('List of counties:', response)
  //tableDataList.value = response.data
  var cnty = response.data

  cnty.forEach(function (arrayItem) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name
    //  console.log(countyOpt)
    countiesOptions.value.push(countyOpt)
  })


  // sort by value
  countiesOptions.value.sort(function (a, b) {
    return a.value - b.value;
  });

})
}


const getSettlementByCounty = async (selectCounty) => {
  // nullify selection after change 
  settlementOptions.value = []
  grmForm.value.settlement_id = null


  console.log("County:", selectCounty)

  const formData = {}
  formData.model = 'settlement'
  await getSettlementByCountyAuth({ county_id: selectCounty }).then((response) => {
    console.log('List of settlement:', response)
    //tableDataList.value = response.data
    var opt = response.data

    opt.forEach(function (arrayItem) {
      var item = {}
      item.value = arrayItem.id
      item.label = arrayItem.name
      item.county_id = arrayItem.county_id
      item.subcounty_id = arrayItem.subcounty_id
      item.ward_id = arrayItem.ward_id

      settlementOptions.value.push(item)
    })


    // sort by value
    settlementOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

const handleSelectSettlement = async (settlementId) => {
  console.log(settlementId)
  const filteredOptions = settlementOptions.value.filter(option => option.value === settlementId);
  console.log(filteredOptions[0].subcounty_id)
  grmForm.value.subcounty_id = filteredOptions[0].subcounty_id
  grmForm.value.ward_id = filteredOptions[0].ward_id

}



const grmForm = ref({
  name: '',
  gender: '',
  age: '',
  national_id: '',
  phone: '',
  email: '',
  county_id: '',
  settlement_id: '',
  address: '',
  nature: '',
  isgbv: false,
  description: '',
  plea: '',
  isInCourt:false,
  self_reported:false,
  reporter_name : userInfo.name,
  reporter_phone:userInfo.phone,
  witness: '',
  witness_phone: '',
  witness_statement: '',
  project_phase: 'KISIP 2',
  date_reported: null as Date | null,
});


const clickEdit = () => {
  getCounties()
  getSettlementByCounty(FullGrievanceData.value.county_id)
console.log(FullGrievanceData.value)
  grmForm.value = {
    name: FullGrievanceData.value.name || '',
    gender: FullGrievanceData.value.gender || '',
    age: FullGrievanceData.value.age || '',
    national_id: FullGrievanceData.value.national_id || '',
    phone: FullGrievanceData.value.phone || '',
    email: FullGrievanceData.value.email || '',
    county_id: FullGrievanceData.value.county_id || '',
    settlement_id: FullGrievanceData.value.settlement_id || '',
    address: FullGrievanceData.value.address || '',
    nature: FullGrievanceData.value.nature || '',
    isgbv: FullGrievanceData.value.isgbv ?? false,
    description: FullGrievanceData.value.description || '',
    plea: FullGrievanceData.value.plea || '',
    isInCourt: FullGrievanceData.value.isInCourt ?? false,
    self_reported: FullGrievanceData.value.self_reported ?? false,
    reporter_name: FullGrievanceData.value.reporter_name || userInfo.name,
    reporter_phone: FullGrievanceData.value.reporter_phone || userInfo.phone,
    witness: FullGrievanceData.value.witness || '',
    witness_phone: FullGrievanceData.value.witness_phone || '',
    witness_statement: FullGrievanceData.value.witness_statement || '',
    project_phase: FullGrievanceData.value.project_phase || 'KISIP 2',
    date_reported: FullGrievanceData.value.date_reported ? new Date(FullGrievanceData.value.date_reported) : null,
   };
  active.value = 0
  fileList.value = []
  EditDialogVisible.value = true
}
 


const saveGrievance = async () => {
  const formInstance = dynamicFormRef

  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      form.value.grievance_id = Grievance.value.id
      form.value.action_type = 'Updated'
      form.value.action_by = userInfo.id
      form.value.date_actioned = new Date();
      form.value.prev_status = Grievance.value.status
      form.value.action_level = current_user_roles[0] ? current_user_roles[0] : 'settlement'
      form.value.current_level = Grievance.value.current_level;
      form.value.new_status = Grievance.value.status;
 
      // Set a meaningful action message describing the edit
      const changedFields = [];
      const fieldLabels = {
        name: 'Name',
        phone: 'Phone',
        email: 'Email',
        county_id: 'County',
        settlement_id: 'Settlement',
        nature: 'Nature of Complaint',
        description: 'Description',
        plea: 'Plea/Request',
        isgbv: 'GBV Status',
        address: 'Address',
        gender: 'Gender',
        age: 'Age',
        national_id: 'National ID',
        date_reported: 'Date Reported',
        project_phase: 'Project Phase'
      };
      
      // Compare key fields
      Object.keys(fieldLabels).forEach(key => {
        const oldValue = FullGrievanceData.value[key];
        const newValue = grmForm.value[key];
        if (oldValue !== newValue && (oldValue || newValue)) {
          changedFields.push(fieldLabels[key]);
        }
      });
      
      const actionMessage = changedFields.length > 0 
        ? `Grievance details updated. Fields modified: ${changedFields.join(', ')}.`
        : 'Grievance details updated.';
      
      form.value.action = actionMessage;
 
      // Log the action 
      const res = await logGrievanceAction(form.value, true)

      // Upload files if any - temporarily set form.value.fileList for upload
      if (fileList.value && fileList.value.length > 0) {
        form.value.fileList = fileList.value
      await uploadFiles(res.data.id, Grievance.value.id, true)
        form.value.fileList = []
      }

      const formData = {}
        formData.code = FullGrievanceData.value.code 
      formData.updatedData = grmForm.value

      // Update the grievance
     await updateGrievance(formData, true)

     await processGrievance()

     EditDialogVisible.value = false

      ElMessage({
        message: res.message || 'Grievance updated successfully',
        type: 'success'
      })
    } else {
      console.log('is Not Valid')
      ElMessage({
        message: 'Please provide all required details',
        type: 'error'
      })
    }
  });
};


const validationRules = ({
  // Validation rules for each step
  step1: {
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    gender: [{ required: true, message: 'Gender is required', trigger: 'change' }],
    age: [{ required: true, message: 'Age is required', trigger: 'change' }],
    national_id: [{ required: true, message: 'National ID is required', trigger: 'blur' }],
    phone: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],
  },

  step2: {
    county_id: [{ required: true, message: 'County is required', trigger: 'change' }],
    settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'change' }],
  },

  step3: {
    nature: [{ required: true, message: 'Nature of complaint is required', trigger: 'change' }],
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    plea: [{ required: true, message: 'Plea/request is required', trigger: 'blur' }],
  },
});



const projectPhaseOptions = [
  { label: 'KISIP 2', value: 'KISIP 2' },
  { label: 'KISIP 1', value: 'KISIP 1' },
]

const ageRanges = [
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: '46-55', label: '46-55' },
  { value: '56-65', label: '56-65' },
  { value: '65+', label: '65+' },
];

const grievanceOptions = [
  { label: 'Land Ownership/Titles', value: 'land_ownership' },
  { label: 'Evictions/Displacement', value: 'evictions' },
  { label: 'Compensation Issues', value: 'compensation' },
  { label: 'Poor Roads/Pathways', value: 'poor_roads' },
  { label: 'Infrastructure', value: 'infrastructure' },
  { label: 'Drainage/Flooding', value: 'drainage_flooding' },
  { label: 'Water Access/Supply', value: 'water_supply' },
  { label: 'Sanitation/Hygiene', value: 'sanitation' },
  { label: 'Electricity/Lighting', value: 'electricity_lighting' },
  { label: 'Waste Management', value: 'waste_management' },
  { label: 'Environmental Issues', value: 'environmental_issues' },
  { label: 'Health/Safety', value: 'health_safety' },
  { label: 'Corruption/Bribery', value: 'corruption' },
  { label: 'Discrimination', value: 'discrimination' },
  { label: 'Gender-Based Violence', value: 'gbv' },
  { label: 'Labour Issues', value: 'labour_issues' },
  { label: 'Information Gap', value: 'information_gap' },
  { label: 'Project Delays', value: 'delays' },
  { label: 'Other', value: 'other' }
];




const currentStepRules = computed(() => {
  const stepRulesKey = `step${active.value + 1}`;
  console.log('stepRulesKey', stepRulesKey)
  return validationRules[stepRulesKey];
});


const active = ref(0);
const resolutionStep = ref(0); // Step counter for resolution form



const next = async () => {
  console.log(grmForm.value)
  const formInstance = dynamicFormRef
  formInstance.value.validate((valid: boolean) => {
    if (valid) {
      console.log(formInstance)
      active.value++;
    }
  });
};

const prev = () => {
  active.value--;
};

const fileList = ref<UploadUserFile[]>([])

const handleCloseEditDialog = (done) => {
  // Check if there are unsaved changes
  const hasChanges = Object.values(grmForm.value).some(val => val !== null && val !== '');
  
  if (hasChanges) {
    ElMessageBox.confirm('You have unsaved changes. Are you sure you want to close?', 'Warning', {
      confirmButtonText: 'Yes, Close',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }).then(() => {
      active.value = 0
      fileList.value = []
      done();
    }).catch(() => {
      // User cancelled, don't close
    });
  } else {
    active.value = 0
    fileList.value = []
    done();
  }
}


const revertLoading = ref<Record<number, boolean>>({})

const RevertEdits = async (data: TableSlotDefault) => {
  try {
    const historyRecord = data.row;
    const changedFields = historyRecord.differences?.map(diff => formatSentence(diff.field)).join(', ') || 'multiple fields';
    
    // Show confirmation dialog
    await ElMessageBox.confirm(
      `Are you sure you want to revert the changes made on ${formatDate(historyRecord.created_at)}? This will restore the previous values for: ${changedFields}.`,
      'Confirm Revert',
      {
        confirmButtonText: 'Yes, Revert',
        cancelButtonText: 'Cancel',
        type: 'warning',
        dangerouslyUseHTMLString: false,
      }
    )

    revertLoading.value[historyRecord.id] = true

    // Step 1: Revert the history
    const revertFormData = {
      model: 'grievance',
      history_id: historyRecord.id,
    };

    const revertRes = await revertGrievanceHistory(revertFormData);
    console.log('Reverts success.....', revertRes.data)
    console.log('Revert response full:', revertRes)
    
    // Store revert status in persistent map (survives database refreshes)
    const revertTimestamp = new Date().toISOString();
    const revertUserInfo = {
      id: userInfo.id,
      name: userInfo.name || 'Current User'
    };
    
    revertedRecordsMap.value[historyRecord.id] = {
      is_reverted: true,
      reverted_at: revertTimestamp,
      reverted_by: userInfo.id,
      reverted_by_user: revertUserInfo
    };
    
    console.log('Stored revert status in persistent map:', revertedRecordsMap.value[historyRecord.id]);
    
    // Immediately update the record in the frontend to show revert status
    const historyIndex = editHistory.value.findIndex(h => h.id === historyRecord.id);
    if (historyIndex !== -1) {
      // Mark as reverted with current user info
      editHistory.value[historyIndex] = {
        ...editHistory.value[historyIndex],
        ...revertedRecordsMap.value[historyRecord.id],
        revertInfo: {
          reverted: true,
          revertedAt: revertTimestamp,
          revertedBy: revertUserInfo.name
        }
      };
      console.log('Updated history record in frontend:', editHistory.value[historyIndex]);
    }
    
    // Step 2: Log the revert action to grievance logs
    const revertLogData = {
      grievance_id: Grievance.value.id,
      action_type: 'Reverted',
      action_by: userInfo.id,
      date_actioned: new Date(),
      prev_status: Grievance.value.status,
      new_status: Grievance.value.status, // Status doesn't change on revert
      action_level: current_user_roles[0] ? current_user_roles[0] : 'settlement',
      current_level: Grievance.value.current_level,
      action: `Reverted edit made on ${formatDate(historyRecord.created_at)} by ${historyRecord.user?.name || 'System'}. Restored previous values for: ${changedFields}.`,
    };

    // Log the revert action to appear in Action Logs timeline
    const logResult = await logGrievanceAction(revertLogData);
    console.log('Revert log result:', logResult)
    
    // Refresh grievance data and logs first to ensure we have latest data
    await processGrievance()
    
    // Wait a bit for the database to update
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Refresh history after revert - fetch with updated data
    await getGrievanceHistory(route.params.id)
    
    // Log the updated history to debug
    console.log('Updated edit history after revert:', editHistory.value)
    console.log('Reverted record check:', editHistory.value.find(h => h.id === historyRecord.id))
    
    ElMessage({
      message: 'Changes have been successfully reverted and logged',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Revert error:', error)
      ElMessage({
        message: 'Failed to revert changes. Please try again.',
        type: 'error',
        duration: 3000
      })
    }
  } finally {
    revertLoading.value[data.row.id] = false
  }
};


const rules = computed(() => ({
  action: [{ required: true, message: "Action is required", trigger: "blur" }],
  reffered_to: isExternalReferralStatus.value
    ? [{ required: true, message: "Name of organization is required", trigger: "blur" }]
    : [],
  reffered_to_officer: isReferredStatus.value
    ? [{ required: true, message: "The officer is required", trigger: "blur" }]
    : [],


  


  new_status: [{ required: true, message: "Status is required", trigger: "blur" }],
  field_investigations: [{ required: true, message: "This is required", trigger: "blur" }],
  agreement_reached: [{ required: true, message: "This is required", trigger: "blur" }],
  field_verification_conducted: [{ required: true, message: "Status is required", trigger: "blur" }],
  filer_present: [{ required: true, message: "This is required", trigger: "blur" }],
  resolution_date: [
    { required: true, message: "Resolution date is required", trigger: "change" },
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback();
          return;
        }

        const selectedDate = new Date(value);
        const today = new Date();
        selectedDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);

        if (selectedDate > today) {
          callback(new Error("Resolution date cannot be in the future"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ],

  fileList: [
    {
      validator: (rule, value, callback) => {
        if (form.value.new_status === "Resolved") {
          if (!value || value.length === 0) {
            callback(new Error("Please upload the signed resolution form"));
          } else {
            callback();
          }
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ]
}));

// Watch for status changes to trigger fileList validation when status becomes "Resolved"
watch(() => form.value.new_status, (newStatus) => {
  // Reset resolution step when status changes
  if (newStatus !== 'Resolved') {
    resolutionStep.value = 0;
  } else {
    // Reset to first step when status becomes Resolved
    resolutionStep.value = 0;
  }
  
  if (newStatus === 'Resolved' && dynamicFormRef.value) {
    // Trigger validation after a short delay to ensure form is updated
    setTimeout(() => {
      dynamicFormRef.value?.validateField('fileList');
    }, 100);
  }
});

// Watch for drawer opening to reset resolution step
watch(() => dialogFormVisible.value, (isOpen) => {
  if (isOpen) {
    resolutionStep.value = 0;
  }
});

const downloadResolutionForm = async () => {
  try {
    const url = new URL(`${import.meta.env.BASE_URL}forms/resolution.docx`, window.location.origin).toString();
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch resolution form');

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'resolution_form_template.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('Resolution form download failed:', error);
    ElMessage.error('Unable to download the resolution form. Please try again.');
  }
};





const sendReminder =async (row) => {

 console.log(row)

 const formData = {}

 formData.grievance_id = row.id;
 formData.action_type = 'Reminder';
 formData.action_by = userInfo.id;
 formData.date_actioned = new Date();
 formData.prev_status = row.status;
 formData.new_status = row.status;
 formData.status = row.status;
 formData.action = "This is a reminder that grievance " + row.code + " is pending resolution and requires your attention. Kindly review and take the necessary action at your earliest convenience to ensure timely resolution.";
 
 formData.current_level = row.current_level;

      console.log("Submitting log...",formData);
     const res = await sendOverdueReminder(formData);

     
  // API Call Example:
  // axios.post("/api/reminder", { grievanceId: row.grievance_id })
};


function convertPhoneNumberX(phoneNumber: string | undefined) {

// console.log(phoneNumber)
let trimmedPhoneNumber = phoneNumber.replace(/\s+/g, '').trim();
console.log(trimmedPhoneNumber.startsWith('0'))


if (trimmedPhoneNumber.startsWith('0')) {
  trimmedPhoneNumber = '254' + trimmedPhoneNumber.slice(1);
}

console.log(trimmedPhoneNumber)
// return trimmedPhoneNumber;
formOfficer.optionPhone = trimmedPhoneNumber

}


function convertPhoneNumber(number) {
  // Remove leading plus sign (+) and any spaces
  number = number.replace(/\+/g, '').trim();

  // Check if the number starts with "254" or "+254"
  if (number.startsWith('254')) {
      // Replace "254" with "0"
      number = '0' + number.substring(3);
  }
  console.log(number)

  return number;
}


const isAdding = ref(false)

const onAddOption = () => {
  isAdding.value = true
}

 


const formOfficer = reactive({
  optionName: '',
  optionPhone: ''
});

const formRef = ref(null);

const onConfirm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      console.log('Submit to create account');

      const formData = {
        username: formOfficer.optionPhone,
        name: formOfficer.optionName,
        phone: formOfficer.optionPhone,
        password: "User@2025",
        role: ["grm"],
        isactive:true,
        location_level: "national",
        location_id: formOfficer.optionPhone,
        location_field: "national"
      };

      signupGRM(formData).then((response) => {
        console.log(response);
        grmUsers.value.push({
          label: `${formOfficer.optionName} (${formOfficer.optionPhone})`,
          value: response.user.id,
        });
        // clear();
      });
    } else {
      console.log("Form validation failed");
    }
  });
};




const clear = () => {
//  optionName.value = ''
  isAdding.value = false
}

// Helper function to reset form to initial state
const resetForm = () => {
      form.value = {
        grievance_id: null,
        action_type: null,
        action_by: null,
        action: null,
        reffered_to: null,
        reffered_to_officer: null,
        date_actioned: null,
        prev_status: null,
        new_status: null,
        fileList: [],
        resolution_date: null,
    filer_present: true,
    field_verification_conducted: true,
        field_investigations: null,
    agreement_reached: true,
    agreement: null,
        point_disagreement: null,
        issues: null,
  }
  resolutionStep.value = 0 // Reset resolution step
  // Clear form validation
  if (dynamicFormRef.value) {
    dynamicFormRef.value.clearValidate()
  }
}

// Resolution step navigation
const nextResolutionStep = async () => {
  const formInstance = dynamicFormRef.value
  if (!formInstance) return
  
  // Check for documentation on Step 3 (Documentation step) - only for resolution status
  if (resolutionStep.value === 3 && isResolvedStatus.value) {
    if (!form.value.fileList || form.value.fileList.length === 0) {
      ElMessageBox.alert(
        'Please upload the signed resolution form before proceeding. Documentation is required for resolution submissions.',
        'Documentation Required',
        {
          confirmButtonText: 'OK',
          type: 'warning'
        }
      )
      return // Stop navigation
    }
  }
  
  // Validate current step fields before proceeding
  const stepFields: Record<number, string[]> = {
    0: ['filer_present', 'field_verification_conducted', 'resolution_date'],
    1: ['field_investigations', 'issues'],
    2: ['agreement_reached'],
    3: [], // fileList is checked separately above
    4: ['action'],
  }
  
  // For step 2, also validate conditional agreement fields
  if (resolutionStep.value === 2) {
    if (form.value.agreement_reached === true) {
      stepFields[2].push('agreement')
    } else if (form.value.agreement_reached === false) {
      stepFields[2].push('point_disagreement')
    }
  }
  
  const fieldsToValidate = stepFields[resolutionStep.value] || []
  
  try {
    if (fieldsToValidate.length > 0) {
      await Promise.all(fieldsToValidate.map(field => formInstance.validateField(field)))
    }
    if (resolutionStep.value < 4) {
      resolutionStep.value++
    }
  } catch (error) {
    // Validation failed, don't proceed
    ElMessage({
      message: 'Please complete all required fields before proceeding',
      type: 'warning'
    })
  }
}

const prevResolutionStep = () => {
  if (resolutionStep.value > 0) {
    resolutionStep.value--
  }
}

const handleDrawerClose = (done) => {
  if (isResolutionSubmitting.value) {
    return
  }
  // If submission was successful, close immediately without confirmation
  if (isSubmittingSuccessfully.value) {
    isSubmittingSuccessfully.value = false
    done();
    return;
  }
  
  // Check if there are unsaved changes
  const hasChanges = form.value.new_status || form.value.action || (form.value.fileList && form.value.fileList.length > 0);
  
  if (hasChanges) {
    ElMessageBox.confirm('You have unsaved changes. Are you sure you want to close?', 'Warning', {
      confirmButtonText: 'Yes, Close',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }).then(() => {
      resetForm()
      done();
    }).catch(() => {
      // User cancelled, don't close
    });
  } else {
    resetForm()
    done();
  }
}


const officerLabel=ref()
const handleOfficerChange = (value) => {
    const selected = grmUsers.value.find(opt => opt.value === value);
    officerLabel.value = selected ? selected.label : '';
  };


  const validateKenyaPhone = (rule, value, callback) => {
        if (!value) {
          callback(new Error("Phone is required"));
          return;
        }
        
        const validation = validateInternationalPhone(value);
        if (!validation.isValid) {
          callback(new Error(validation.error));
          return;
        }
        
        callback();
      };

const OfficerRules = computed(() => ({
  optionName: [
    { required: true, message: "Name is required", trigger: "blur" }
  ],
  optionPhone: [
    { required: true, validator: validateKenyaPhone, trigger: "blur" }
  ]
}));

const handleDownlaod = async () => { 
 
  //const { events = [], grievance_id, type } = req.body;
  console.log (FullGrievanceData.value)

  const logEvents = sortedGrievanceLogs.value.map(log => ({
   date: log.date_actioned,
   settlement: log.action_type,
   event: log.action_type,
   description: (log.action || 'N/A') + (log.user?.name ? '\nBy: ' + log.user.name : '')
}));

 console.log('logEvents',logEvents)

const formData = {}
 formData.grievance_id = FullGrievanceData.value.id
 formData.grievance_code = FullGrievanceData.value.code
  formData.type = "timeline"
  formData.status = FullGrievanceData.value.status
  formData.details = FullGrievanceData.value.description
   formData.events = logEvents
   formData.responseType = 'blob';
 
  
  try {
    const response = await getTimelineReport(formData);
    console.log(response)

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download',  FullGrievanceData.value.code+'.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF', error);
  }
   
  



}

</script>

<template>
  <el-card v-loading="loading">
 
    <template #header>
      <div class="card-header">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>

        {{ Grievance.code }} : {{ Grievance.complainant }}
      </div>


    </template>



    <el-tabs v-model="activeName" type="border-card" class="demo-tabs">
      <el-tab-pane label="Grievance Details" name="details">

        <el-card class="responsive-card details-table-card">
          <!-- Desktop Table View -->
          <el-table
              :data="grievanceData"
              class="grievance-details-table desktop-table"
              style="width: 100%"
              size="small"
              :table-layout="'auto'"
              show-overflow-tooltip
              stripe
            >
              <el-table-column prop="label" label="" :width="isMobile ? 120 : 180" class-name="detail-label-column" :min-width="isMobile ? 100 : 150">
                <template #default="{ row }">
                  <span class="detail-label">{{ row.label }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="value" label="" class-name="detail-value-column" min-width="200">
                <template #default="{ row }">
                  <div class="detail-value" :class="{ 'detail-value-resolution': row.label.toLowerCase() === 'resolution' }">
                    {{ row.value }}
                  </div>
                </template>
              </el-table-column>
            </el-table>

          <!-- Mobile Card View -->
          <div class="mobile-details-list">
            <div 
              v-for="(item, index) in grievanceData" 
              :key="index" 
              class="mobile-detail-item"
              :class="{ 'mobile-detail-resolution': item.label.toLowerCase() === 'resolution' }"
            >
              <div class="mobile-detail-label">{{ item.label }}</div>
              <div class="mobile-detail-value">{{ item.value }}</div>
            </div>
          </div>


  <template #header v-if="showActionButton || Grievance.status === 'Resolved'">
    <div class="dialog-footer">
      <PermissionWrapper :permissions="['grievance:update']">
        <el-tooltip
          content="Close the grievance if all issues have been resolved and complainant satisfied"
          placement="top"
        >
          <el-button
            v-if="Grievance.status !== 'Resolved'"
            :disabled="button_disabled"
            :type="button_color"
            @click="dialogFormVisible = true"
            size="small"
            class="responsive-button"
          >
            <Icon :icon="button_icon" /> {{ button_label }}
          </el-button>
        </el-tooltip>
      </PermissionWrapper>
      <el-button
        v-if="shouldShowReminder && Grievance.status !== 'Resolved'"
        type="warning"
        plain
        @click="sendReminder(FullGrievanceData)"
        size="small"
        class="responsive-button"
      >
        <Icon :icon="'icon-park-outline:remind'" style="margin-right: 10px;" /> Send Reminder
      </el-button>
      <PermissionWrapper :permissions="['grievance:update']">
        <el-button @click="clickEdit" type="success" :icon="Edit" plain size="small" class="responsive-button">Edit</el-button>
      </PermissionWrapper>
      
      <!-- Confirmation Button for National GRM -->
      <el-button
        v-if="canConfirmGrievance"
        type="success"
        @click="openConfirmationDialog"
        size="small"
        class="responsive-button"
      >
        <el-icon><Check /></el-icon>
        Confirm Resolution
      </el-button>
    </div>
  </template>
  
  <!-- Confirmation Status Display -->
  <el-card
    v-if="FullGrievanceData && FullGrievanceData.status === 'Resolved' && ['settlement', 'county'].includes(FullGrievanceData.current_level)"
    class="confirmation-status-card"
    shadow="never"
    :class="FullGrievanceData.confirmed_by_national_grm ? 'confirmation-card confirmed' : 'confirmation-card awaiting'"
  >
    <template #header>
      <div class="confirmation-header">
        <el-icon :size="16" class="confirmation-icon">
          <Check v-if="FullGrievanceData.confirmed_by_national_grm" />
          <Notification v-else />
        </el-icon>
        <span class="confirmation-title">
          {{ FullGrievanceData.confirmed_by_national_grm ? 'Resolution Confirmed' : 'Awaiting National GRM Confirmation' }}
        </span>
      </div>
    </template>
    
    <div v-if="FullGrievanceData.confirmed_by_national_grm" class="confirmation-details">
      <div class="confirmation-detail-item">
        <span class="confirmation-label">Confirmed by:</span>
        <span class="confirmation-value">{{ FullGrievanceData.confirmed_by_user?.name || FullGrievanceData.confirmed_by_user?.username || 'National GRM Officer' }}</span>
      </div>
      <div v-if="FullGrievanceData.date_confirmed_by_national_grm" class="confirmation-detail-item">
        <span class="confirmation-label">Date Confirmed:</span>
        <span class="confirmation-value">{{ formatDate(FullGrievanceData.date_confirmed_by_national_grm) }}</span>
      </div>
      <div v-if="FullGrievanceData.confirmation_notes" class="confirmation-detail-item">
        <span class="confirmation-label">Notes:</span>
        <span class="confirmation-value">{{ FullGrievanceData.confirmation_notes }}</span>
      </div>
    </div>
    <div v-else class="confirmation-awaiting-message">
      This resolution at {{ formatSentence(FullGrievanceData.current_level) }} level is awaiting confirmation by national GRM.
    </div>
  </el-card>
</el-card>


      </el-tab-pane>
      <el-tab-pane label="Supporting Documentation" name="documents">
        <el-card>
          <div style="margin-bottom: 15px;">
            <PermissionWrapper :permissions="['grievance:update']">
              <el-button type="primary" @click="showSupportingDocDialog = true">
                <Icon icon="fa-solid:upload" style="margin-right: 5px;" />
                Upload Documentation
              </el-button>
            </PermissionWrapper>
          </div>
          <el-table :data="GrievanceDocuments" style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="type" label="Type" width="180">
              <template #default="scope">
                <el-tag size="small" type="info">{{ scope.row.type || 'N/A' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="Uploaded" />
            <el-table-column fixed="right" label="">
              <template #default="scope">
                <PermissionWrapper :permissions="['grievance:read']">
                  <el-button type="primary" @click="downloadFile(scope.row)">
                    <Icon icon="fa-solid:download" style="  margin-right: 5px;" />
                    Download
                  </el-button>
                </PermissionWrapper>
              </template>
            </el-table-column>
          </el-table>



        </el-card>

      </el-tab-pane>
      <el-tab-pane label="Action Logs" name="timeline">
        <div class="mb-4">
          <PermissionWrapper :permissions="['grievance:read']">
            <el-button @click="handleDownlaod"  type="primary" :icon="Download"   plain>Download Timeline</el-button>
          </PermissionWrapper>
        </div>
     
        <el-timeline style="max-width: 100%;">
          <el-timeline-item
v-for="(log, index) in sortedGrievanceLogs" :key="index" placement="top" color="green"
            :timestamp="formatDate(log.date_actioned)" timestamp-class="timestamp-class">

            <el-collapse accordion>
              <el-collapse-item :title="log.action_type" :name="log.action_type" :icon="CaretRight">
                <!-- Scoped slot for custom title -->
                <template #title>
                  <span :class="getActionClass(log.action_type)" >
                                <el-icon>
                      <CaretRight />
                    </el-icon>
 

                    {{ log.action_type }}
                  </span>
                </template>

                <el-card
class="notification-custom-card" shadow="hover" :class="log.action_type === 'Resolved' ? 'resolved-background' :
          log.action_type === 'Escalated' ? 'escalated-background' :
            log.action_type === 'Reported' ? 'reported-background' :
              log.action_type === 'Referred' ? 'referred-background' :
                log.action_type === 'Closed' ? 'closed-background' :
                  log.action_type === 'Reverted' ? 'reverted-background' :
                    'info-background'">
                  <div class="notification-container">
                    <el-row align="middle" :gutter="10">
                      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" :gutter="10">
                        <!-- <p class="action-header">{{log.action_type}} </p> -->
                        <p class="action-body"> Comments: {{ log.action ? log.action : 'None' }}</p>
                        <p class="action-footer">By: {{ log.user ? log.user.name : 'System' }}</p>
                      </el-col>

                      <el-col v-if="log.grievance_documents && log.grievance_documents.length > 0" :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
                        <p class="documents-header">Documentation </p>

                        <p v-for="(doc, docIndex) in log.grievance_documents" :key="docIndex">
                          <PermissionWrapper :permissions="['grievance:read']">
                            <el-button @click="downloadFile(doc)" link type="primary" size="small" :icon="Download">{{
          doc.name }}</el-button>
                          </PermissionWrapper>
                        </p>
                      </el-col>
                    </el-row>
                  </div>
                </el-card>
              </el-collapse-item>
            </el-collapse>



          </el-timeline-item>


        </el-timeline>

      </el-tab-pane>


      <el-tab-pane label="Notifications" name="notifications">
        <!-- Mobile Card View -->
        <div v-if="isMobile" class="mobile-notifications-list">
          <div 
            v-for="(notification, index) in sortedGrievanceNotifications" 
            :key="index" 
            class="mobile-notification-card"
            :class="notification.status === 'Success' ? 'mobile-notification-success' : 'mobile-notification-fail'"
          >
            <div class="mobile-notification-header">
              <div class="mobile-notification-status">
                <el-icon class="status-icon success-icon" v-if="notification.status === 'Success'"><Check /></el-icon>
                <el-icon class="status-icon fail-icon" v-else><Close /></el-icon>
                <span class="mobile-notification-date">{{ formatDate(notification.createdAt) }}</span>
              </div>
              <el-tag 
                v-if="notification.status === 'Success'"
                size="small"
                type="success"
                class="mobile-notification-tag"
              >
                {{ notification.status }}
              </el-tag>
            </div>

            <div class="mobile-notification-body">
              <div class="mobile-notification-message">
                {{ notification.message }}
              </div>
              <div class="mobile-notification-meta">
                <div class="meta-row">
                  <span class="meta-label">Phone:</span>
                  <span class="meta-value">{{ notification.recipient }}</span>
                </div>
                <div class="meta-row meta-status-row">
                  <span class="meta-label">Status:</span>
                  <el-tag 
                    v-if="notification.status === 'Success'"
                    size="small"
                    type="success"
                    class="mobile-notification-tag"
                  >
                    {{ notification.status }}
                  </el-tag>
                  <span 
                    v-else 
                    class="meta-value status-text"
                  >
                    {{ notification.status }}
                  </span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Sent By:</span>
                  <span class="meta-value">{{ notification.user ? notification.user.name : 'System' }}</span>
                </div>
              </div>
              <div v-if="notification.reference" class="mobile-notification-reference">
                <span class="meta-label">Reference:</span>
                <span class="meta-value">{{ notification.reference }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Timeline View -->
        <div v-else class="notifications-wrapper">
          <el-timeline class="notifications-timeline">
          <el-timeline-item
              v-for="(notification, index) in sortedGrievanceNotifications" 
              :key="index" 
              placement="top"
              :timestamp="formatDate(notification.createdAt)" 
              timestamp-class="timestamp-class"
              :color="notification.status == 'Success' ? 'green' : 'red'"
              class="notification-timeline-item"
            >
              <el-collapse class="notification-collapse">
                <el-collapse-item 
                  :name="notification.id" 
                  :icon="CaretRight" 
                  :title="notification.id"
                  class="notification-collapse-item"
                >
                <!-- Scoped slot for custom title -->
                <template #title>
                    <div class="notification-title-wrapper">
                      <el-icon 
                        v-if="notification.status === 'Success'" 
                        class="notification-status-icon success-icon"
                      >
                      <Check />
                    </el-icon>
                      <el-icon 
                        v-else 
                        class="notification-status-icon fail-icon"
                      >
                      <Close />
                    </el-icon>
                      <span 
                        class="notification-title-text"
                        :class="notification.status === 'Success' ? 'success-title' : 'fail-title'"
                      >
                    {{ notification.message }}
                  </span>
                    </div>
                </template>

                <el-card
                    class="notification-custom-card" 
                    shadow="hover"
                    :class="notification.status === 'Success' ? 'success-background' : 'closed-background'"
                  >
                  <div class="notification-container">
                      <div class="notification-detail-row">
                        <span class="notification-detail-label">Message:</span>
                        <span class="notification-detail-value">{{ notification.message }}</span>
                      </div>
                      <div class="notification-detail-row">
                        <span class="notification-detail-label">Phone:</span>
                        <span class="notification-detail-value">{{ notification.recipient }}</span>
                      </div>
                      <div class="notification-detail-row">
                        <span class="notification-detail-label">Status:</span>
                        <el-tag 
                          v-if="notification.status === 'Success'"
                          type="success" 
                          size="small"
                          class="notification-status-tag"
                        >
                          {{ notification.status }}
                        </el-tag>
                        <span v-else class="notification-detail-value status-text">
                          {{ notification.status }}
                        </span>
                      </div>
                      <div class="notification-detail-row">
                        <span class="notification-detail-label">Sent By:</span>
                        <span class="notification-detail-value">{{ notification.user ? notification.user.name : 'System' }}</span>
                      </div>
                      <div v-if="notification.reference" class="notification-detail-row">
                        <span class="notification-detail-label">Reference:</span>
                        <span class="notification-detail-value">{{ notification.reference }}</span>
                      </div>
                  </div>
                </el-card>
              </el-collapse-item>
            </el-collapse>
          </el-timeline-item>
        </el-timeline>
        </div>
      </el-tab-pane>


      <el-tab-pane label="Settings" name="settings"  >
 
        <div class="flex justify-end p-2">
          <PermissionWrapper :permissions="['grievance:delete']">
            <el-popconfirm
width="340"
              title="Are you sure you want to delete this grievance?" 
              confirm-button-text="Yes" 
              cancel-button-text="No"
              @confirm="handleDelete"  >
              <template #reference>
                <el-button type="danger" :icon="Delete"   plain>Delete</el-button>
              </template>
            </el-popconfirm>
          </PermissionWrapper>
       </div>
       <el-card v-if="editHistory.length > 0" shadow="never"  >
          
          <el-table 
            :data="editHistory" 
            border 
            ref="tableEditRef" 
            stripe 
            class="history-table"
            :row-class-name="({ row }) => [
              isReverted(row) ? 'reverted-row' : '',
              getHistoryActionType(row) === 'Delete' ? 'no-expand' : ''
            ].filter(Boolean).join(' ')"
          >
            <el-table-column label="Changes" type="expand" width="120">
              <template #default="{ row }">
                <div class="expand-content">
                  <el-table :data="row.differences" border size="small" class="differences-table">
                    <el-table-column prop="field" label="Field" >
                      <template #default="{ row: diff }">
                        <span class="field-name">{{ formatSentence(diff.field) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="before" label="Before" class-name="italic-red" show-overflow-tooltip>
                      <template #default="{ row: diff }">
                        <span class="before-value">{{ diff.before || '(empty)' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="after" label="After" class-name="italic-green" show-overflow-tooltip>
                      <template #default="{ row: diff }">
                        <span class="after-value">{{ diff.after || '(empty)' }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                  
                  <!-- Revert Information -->
                  <el-alert
                    v-if="isReverted(row)"
                    :title="`This edit was reverted on ${formatDate(row.revertInfo?.revertedAt || row.reverted_at)} by ${row.revertInfo?.revertedBy || 'System'}`"
                    type="warning"
                    :closable="false"
                    show-icon
                    style="margin: 10px 0;"
                  />
                </div>
              </template>
            </el-table-column>

            <!-- <el-table-column label="Status" width="120" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="isReverted(row) ? 'warning' : 'success'" 
                  :effect="isReverted(row) ? 'plain' : 'dark'"
                  size="small"
                >
                  <Icon 
                    :icon="isReverted(row) ? 'mdi:undo-variant' : 'mdi:check-circle'" 
                    style="margin-right: 4px;" 
                  />
                  {{ isReverted(row) ? 'Reverted' : 'Active' }}
                </el-tag>
              </template>
            </el-table-column> -->

            <el-table-column label="Action" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getHistoryActionTagType(getHistoryActionType(row))">
                  {{ getHistoryActionType(row) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Date Edited"  width="150" prop="created_at" sortable class-name="td-bold">
              <template #default="scope">
                <div class="date-cell">
                  <Icon icon="mdi:calendar-clock" style="margin-right: 4px; color: #909399;" />
                  {{ formatDate(scope.row.created_at) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Edited By" prop="user.name" sortable class-name="td-bold">
              <template #default="scope">
                <div class="user-cell">
                  <Icon icon="mdi:account" style="margin-right: 4px; color: #909399;" />
                  {{ scope.row.user?.name || 'System' }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Changes Count" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="info">
                  {{ row.differences?.length || 0 }} field(s)
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column fixed="right" label="Actions" align="center">
              <template #default="scope">
                <PermissionWrapper :permissions="['grievance:update']">
                  <el-tooltip 
                    :content="isReverted(scope.row) ? 'This edit has already been reverted' : 'Revert this edit'" 
                    placement="top"
                  >
                    <el-button 
                      type="warning" 
                      :icon="RefreshLeft" 
                      :disabled="isReverted(scope.row) || revertLoading[scope.row.id]"
                      :loading="revertLoading[scope.row.id]"
                      size="small"
                      @click="RevertEdits(scope as TableSlotDefault)" 
                    >
                      {{ revertLoading[scope.row.id] ? 'Reverting...' : 'Revert' }}
                    </el-button>
                  </el-tooltip>
                </PermissionWrapper>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
              
       <el-empty v-else description="No edit history found for this grievance" />

      </el-tab-pane>

    </el-tabs>
  </el-card>


  <el-drawer 
    v-model="dialogFormVisible" 
    direction="rtl" 
    :size="isMobile ? '100%' : '40%'"
    :with-header="false"
    :before-close="handleDrawerClose"
    :close-on-click-modal="!isResolutionSubmitting"
    :close-on-press-escape="!isResolutionSubmitting"
    class="grievance-drawer"
  >
    <!-- Custom Header -->
    <div class="drawer-header">
      <div class="header-content">
        <div class="header-icon">
          <Icon icon="mdi:file-document-edit" :size="isMobile ? 20 : 24" />
        </div>
        <div class="header-text">
          <h3>Grievance Status Update</h3>
          <p v-if="!isMobile">Update the status and details of grievance #{{ Grievance.code }}</p>
        </div>
      </div>
      <el-button 
        type="text" 
        @click="!isResolutionSubmitting && (dialogFormVisible = false)"
        class="close-button"
        :size="isMobile ? 'small' : 'default'"
        :disabled="isResolutionSubmitting"
      >
        <Icon icon="mdi:close" :size="isMobile ? 18 : 20" />
      </el-button>
    </div>

    <div class="drawer-content" v-loading="isResolutionSubmitting" element-loading-text="Submitting update...">
      <el-form :model="form" label-width="auto" ref="dynamicFormRef" :rules="rules" class="grievance-form">

        <!-- Status Selection Section -->
        <div class="form-section">
        <el-form-item label="Update Grievance Status" label-position="top" prop="new_status">
            <el-select v-model="form.new_status" placeholder="Select status" style="width: 100%">
            <el-option v-for="item in StatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        </div>

        <!-- Referral Section -->
        <div v-if="isReferredStatus" class="form-section">
          <el-divider content-position="left">
            <span class="section-title">{{ sectionTitle }}</span>
          </el-divider>
          <el-form-item v-loading="grmUsersLoading" label="Select Officer to Refer To" label-position="top" prop="reffered_to_officer">
          <el-select v-model="form.reffered_to_officer" clearable filterable placeholder="Select Officer" :loading="grmUsersLoading" :disabled="grmUsersLoading" @change="handleOfficerChange" style="width: 100%">
            <el-option
              v-for="item in grmUsers"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
            <template #footer>
              <el-button v-if="!isAdding" text bg size="small" @click="onAddOption">
                Add Officer
              </el-button>
              <template v-else>
                <el-form :model="formOfficer" label-width="0" :rules="OfficerRules" ref="formRef">
                  <el-form-item prop="optionName">
                    <el-input
                      v-model="formOfficer.optionName"
                      class="option-input"
                      placeholder="Name"
                      size="small"
                    />
                  </el-form-item>
                  <el-form-item prop="optionPhone">
                    <el-input
                      v-model="formOfficer.optionPhone"
                      class="option-input"
                      placeholder="Enter phone number (254.....)" 
                      size="small"
                      :onChange="convertPhoneNumberX" 
                    />
                  </el-form-item>
                  <el-form-item>
                      <el-button type="primary" size="small" @click="onConfirm">Confirm</el-button>
                      <el-button size="small" @click="clear">Cancel</el-button>
                  </el-form-item>
                </el-form>
              </template>
            </template>
          </el-select>
        </el-form-item>
        </div>

        <!-- External Referral Section -->
        <div v-if="isExternalReferralStatus" class="form-section">
          <el-divider content-position="left">
            <span class="section-title">{{ sectionTitle }}</span>
          </el-divider>
          <el-form-item label="Name of Organization Case Referred To" label-position="top" prop="reffered_to">
            <el-input type="textarea" :rows="isMobile ? 3 : 2" placeholder="Enter organization name" v-model="form.reffered_to" />
          </el-form-item>
        </div>

        <!-- Resolution Details Section with Steps -->
        <div v-if="isResolvedStatus" class="form-section">
          <el-divider content-position="left">
            <span class="section-title">Describe the Resolution Action</span>
          </el-divider>
          
          <el-steps 
            :active="resolutionStep" 
            finish-status="success" 
            :class="['resolution-steps', { 'resolution-steps--mobile': isMobile }]"
            direction="horizontal"
            :space="isMobile ? 60 : undefined"
          >
            <el-step title="Basic Info" :icon="InfoFilled" />
            <el-step title="Investigation" :icon="Document" />
            <el-step title="Agreement" :icon="CircleCheck" />
            <el-step title="Documentation" :icon="Paperclip" />
            <el-step title="Action Description" :icon="Edit" />
          </el-steps>

          <!-- Step 0: Basic Information -->
          <div v-if="resolutionStep === 0" class="resolution-step-content">
            <el-row :gutter="isMobile ? 0 : 16">
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <el-form-item label="Was Filer Present?" label-position="top" prop="filer_present">
                  <el-select v-model="form.filer_present" placeholder="Select" style="width: 100%" clearable>
                    <el-option v-for="option in yesNoOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>

              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <el-form-item label="Was field verification conducted?" label-position="top" prop="field_verification_conducted">
                  <el-select v-model="form.field_verification_conducted" placeholder="Select" style="width: 100%" clearable>
                    <el-option v-for="option in yesNoOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
            </el-row>

            <el-form-item label="Date of Resolution" label-position="top" prop="resolution_date">
              <el-date-picker
                v-model="form.resolution_date"
                type="date"
                placeholder="Select resolution date"
                style="width: 100%"
                :disabled-date="disableFutureDates"
              />
            </el-form-item>
          </div>

          <!-- Step 1: Investigation & Findings -->
          <div v-if="resolutionStep === 1" class="resolution-step-content">
            <el-form-item label="Findings of Field Investigation" label-position="top" prop="field_investigations">
              <el-input 
                type="textarea" 
                :rows="isMobile ? 4 : 5" 
                placeholder="Describe the findings from the field investigation" 
                v-model="form.field_investigations" 
              />
        </el-form-item>

            <!-- <el-form-item label="Issues" label-position="top" prop="issues">
              <el-input 
                type="textarea" 
                :rows="isMobile ? 4 : 5" 
                placeholder="Describe the issues addressed" 
                v-model="form.issues" 
              />
            </el-form-item> -->
          </div>

          <!-- Step 2: Agreement Details -->
          <div v-if="resolutionStep === 2" class="resolution-step-content">
            <el-form-item label="Was agreement reached on the issues?" label-position="top" prop="agreement_reached">
              <el-select v-model="form.agreement_reached" placeholder="Select" style="width: 100%" clearable>
                <el-option v-for="option in yesNoOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>

            <el-form-item v-if="showAgreementFields" label="Agreement Details" label-position="top" prop="agreement">
              <el-input 
                type="textarea" 
                :rows="isMobile ? 4 : 5" 
                placeholder="Detail the agreement reached" 
                v-model="form.agreement" 
              />
            </el-form-item>

            <el-form-item v-if="showDisagreementFields" label="Points of Disagreement" label-position="top" prop="point_disagreement">
              <el-input 
                type="textarea" 
                :rows="isMobile ? 4 : 5" 
                placeholder="Specify the points of disagreement" 
                v-model="form.point_disagreement" 
              />
        </el-form-item>
          </div>

          <!-- Step 3: Documentation -->
          <div v-if="resolutionStep === 3" class="resolution-step-content">
        <el-form-item 
          label="Upload Documentation" 
          label-position="top"
          prop="fileList"
              :required="true"
        >
              <div class="upload-section">
                <div class="resolution-form-download">
              <el-button 
                type="success" 
                plain 
                size="small"
                :icon="Download"
                @click="downloadResolutionForm"
              >
                Download Resolution Form Template
              </el-button>
                  <el-text type="warning" size="small" class="required-hint">
                <strong>Required:</strong> Please download, fill, sign, and upload the resolution form.
              </el-text>
            </div>
          <el-upload
            class="upload-demo" 
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" 
            multiple
            :on-preview="handlePreview" 
            :on-remove="handleRemove" 
            :before-remove="beforeRemove" 
            :before-upload="beforeUpload"
            :limit="3"
            accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp"
            v-model:file-list="form.fileList" 
            :auto-upload="false" 
            :on-exceed="handleExceed"
              @change="() => { if (dynamicFormRef) dynamicFormRef.value?.validateField('fileList') }"
          >
            <el-button type="primary" plain>
              <Icon icon="basil:file-upload-outline" width="24" /> Upload Documentation
            </el-button>
            <template #tip>
                    <div class="upload-tips">
                      <el-text type="warning" size="small">
                  Please upload the signed resolution form (images: jpg/png/gif, documents: pdf/doc/docx, max 10MB). Executable files (.exe) are not allowed.
                        <strong>Required:</strong> Documentation must be uploaded before proceeding to the next step.
                </el-text>
                    </div>
                  </template>
                </el-upload>
              </div>
            </el-form-item>
          </div>

          <!-- Step 4: Action Description -->
          <div v-if="resolutionStep === 4" class="resolution-step-content">
            <el-form-item :label="actionLabel" label-position="top" prop="action">
              <el-input 
                type="textarea" 
                :rows="isMobile ? 4 : 5" 
                :placeholder="actionPlaceholder" 
                v-model="form.action" 
              />
            </el-form-item>
          </div>

          <!-- Resolution Step Navigation -->
          <div v-if="isResolvedStatus" class="resolution-step-navigation">
            <el-button 
              @click="dialogFormVisible = false"
              :size="isMobile ? 'small' : 'default'"
              :disabled="isResolutionSubmitting"
            >
              Cancel
            </el-button>
            <div class="resolution-step-navigation-right">
              <el-button 
                v-if="resolutionStep > 0" 
                @click="prevResolutionStep"
                :size="isMobile ? 'small' : 'default'"
                :disabled="isResolutionSubmitting"
              >
                Previous
              </el-button>
              <el-button 
                v-if="resolutionStep < 4" 
                type="primary" 
                @click="nextResolutionStep"
                :size="isMobile ? 'small' : 'default'"
                :disabled="isResolutionSubmitting"
              >
                Next
              </el-button>
              <el-button 
                v-if="resolutionStep === 4" 
                type="primary" 
                @click="submitResolutionForm"
                :size="isMobile ? 'small' : 'default'"
                :loading="isResolutionSubmitting"
                :disabled="isResolutionSubmitting"
              >
                Submit
              </el-button>
            </div>
          </div>
        </div>

        <!-- Action Description Section (for non-Resolved statuses) -->
        <div class="form-section" v-if="form.new_status && !isResolvedStatus">
          <el-divider content-position="left">
            <span class="section-title">{{ sectionTitle }}</span>
          </el-divider>
          <el-form-item :label="actionLabel" label-position="top" prop="action">
            <el-input 
              type="textarea" 
              :rows="isMobile ? 4 : 5" 
              :placeholder="actionPlaceholder" 
              v-model="form.action" 
            />
          </el-form-item>
        </div> 

        <!-- Documentation Upload Section (for non-Resolved statuses) -->
        <div v-if="!isResolvedStatus" class="form-section">
          <el-divider content-position="left">
            <span class="section-title">Documentation</span>
          </el-divider>
          <el-form-item 
            label="Upload Documentation" 
            label-position="top"
            prop="fileList"
          >
            <div class="upload-section">
              <el-upload
                class="upload-demo" 
                action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" 
                multiple
                :on-preview="handlePreview" 
                :on-remove="handleRemove" 
                :before-remove="beforeRemove" 
                :before-upload="beforeUpload"
                :limit="3"
                accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp"
                v-model:file-list="form.fileList" 
                :auto-upload="false" 
                :on-exceed="handleExceed"
                @change="() => { if (dynamicFormRef) dynamicFormRef.value?.validateField('fileList') }"
              >
                <el-button type="primary" plain>
                  <Icon icon="basil:file-upload-outline" width="24" /> Upload Documentation
                </el-button>
                <template #tip>
                  <div class="upload-tips">
                    <el-text type="info" size="small">
                  Upload supporting documentation (e.g. minutes, forms, photos) — images: jpg/png/gif, documents: pdf/doc/docx, max 10MB. Executable files (.exe) are not allowed.
                </el-text>
              </div>
            </template>
          </el-upload>
          </div>
        </el-form-item>
        </div>

      </el-form>

      <div class="form-actions" :class="{ 'mobile-actions': isMobile }" v-if="!isResolvedStatus">
        <el-button 
          @click="dialogFormVisible = false"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
          :disabled="isResolutionSubmitting"
        >
          Cancel
        </el-button>
        <el-button 
          type="primary" 
          @click="submitResolutionForm"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
          :loading="isResolutionSubmitting"
          :disabled="isResolutionSubmitting"
        >
          Submit
        </el-button>
      </div>
      <!-- Cancel button is now inside resolution-step-navigation for resolved status -->
    </div>
  </el-drawer>



  <!-- Edit Grievance Drawer -->
  <el-drawer 
    v-model="EditDialogVisible" 
    direction="rtl" 
    :size="isMobile ? '100%' : '50%'"
    :with-header="false"
    :before-close="handleCloseEditDialog"
    class="grievance-drawer"
  >
    <!-- Custom Header -->
    <div class="drawer-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="isMobile ? 20 : 24">
            <Edit />
          </el-icon>
        </div>
        <div class="header-text">
          <h3>Edit Grievance</h3>
          <p v-if="!isMobile">Update grievance #{{ Grievance.code }}</p>
        </div>
      </div>
      <el-button 
        type="text" 
        @click="EditDialogVisible = false"
        class="close-button"
        :size="isMobile ? 'small' : 'default'"
      >
        <el-icon :size="isMobile ? 18 : 20">
          <Close />
        </el-icon>
      </el-button>
    </div>

    <div class="drawer-content">

      <el-steps 
        :active="active" 
        finish-status="success" 
        :class="['drawer-steps', { 'drawer-steps--icons-only': isMobile }]"
        direction="horizontal"
        :space="isMobile ? 80 : undefined"
      >
        <el-step :title="isMobile ? '' : 'Complainant Details'" :icon="Document" />
        <el-step :title="isMobile ? '' : 'Grievance Details'" :icon="InfoFilled" />
        <el-step :title="isMobile ? '' : 'Complaint Details'" :icon="Paperclip" />
        <el-step :title="isMobile ? '' : 'Review & Submit'" :icon="CircleCheck" />
            </el-steps>

            <el-form
        :model="grmForm"
        class="grievance-form"
        label-position="top"
        size="small"
        :rules="currentStepRules"
        ref="dynamicFormRef"
      >
        <!-- Step 1: Complainant Details -->
        <div v-if="active === 0" class="form-step">
          <el-row :gutter="8">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn1" label="Name of Complainant(s)" prop="name">
                <el-input v-model="grmForm.name" type="textarea" :rows="2" placeholder="Enter one or more names (separate by comma). Provide complainant's full name(s) as on National ID. Fill Anonymous for anonymity." />
                    </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
                    <el-form-item id="btn2" label="Gender" prop="gender">
                <el-select v-model="grmForm.gender" placeholder="Select the complainant's gender" style="width: 100%;" filterable>
                        <el-option label="Male" value="male" />
                  <el-option label="Female" value="female" />
                  <el-option label="Other" value="other" />
                      </el-select>
                    </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn3" label="Age Bracket" prop="age">
                <el-select v-model="grmForm.age" placeholder="Select the complainant's age bracket" style="width: 100%;" filterable>
                  <el-option v-for="range in ageRanges" :key="range.value" :label="range.label" :value="range.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
                    <el-form-item id="btn4" label="National ID" prop="national_id">
                <el-input v-model="grmForm.national_id" placeholder="Enter complainant's national ID (required especially for land related complaints)" />
                    </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn5" label="Phone Number" prop="phone">
                      <el-input
                  v-model="grmForm.phone"
                  placeholder="Enter complainant's phone number (254.....) - we will use this to communicate about the complaint status"
                  @input="convertPhoneNumber(grmForm.phone)"
                />
                    </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn7" label="Date Reported" prop="date_reported">
                <el-date-picker
                  v-model="grmForm.date_reported"
                  type="date"
                  placeholder="Select date reported"
                  style="width: 100%;"
                  format="YYYY-MM-DD"
                  :disabled-date="disableFutureDates"
                />
                    </el-form-item>
                  </el-col>
                </el-row>
        </div>

                  <!-- Step 2: Grievance Details -->
        <div v-if="active === 1" class="form-step">
          <el-row :gutter="8">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
                    <el-form-item id="btn10" label="County" prop="county_id">
                      <el-select
                  v-model="grmForm.county_id"
                  placeholder="Select county"
                  style="width: 100%;"
                  filterable
                  @change="getSettlementByCounty(grmForm.county_id)"
                >
                  <el-option
                    v-for="item in countiesOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                      </el-select>
                    </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
                    <el-form-item id="btn10a" label="Project Phase" prop="project_phase">
                      <el-select
                        filterable
                        v-model="grmForm.project_phase"
                        placeholder="Select Project Phase (KISIP 1 or KISIP 2)"
                  style="width: 100%;"
                      >
                        <el-option
                          v-for="item in projectPhaseOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn11" prop="settlement_id">
                <template #label>
                  Settlement
                </template>
                      <el-select
                  v-model="grmForm.settlement_id"
                  placeholder="Select settlement"
                  :disabled="!grmForm.county_id"
                  style="width: 100%;"
                  filterable
                  @change="handleSelectSettlement(grmForm.settlement_id)"
                >
                        <el-option
                    v-for="item in settlementOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                      </el-select>
                    </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn12" label="Physical Address" prop="address">
                <el-input v-model="grmForm.address" placeholder="Enter complainant's physical address (e.g., near XXX Primary school, Plot No. XXX)" />
                    </el-form-item>
                  </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn13" label="Is this a GBV-related complaint?" prop="isgbv">
                <el-select v-model="grmForm.isgbv" placeholder="Select option" style="width: 100%;" filterable>
                  <el-option label="No" :value="false" />
                  <el-option label="Yes" :value="true" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn13a" label="Is this complaint currently in court?" prop="isInCourt">
                <el-select v-model="grmForm.isInCourt" placeholder="Select option" style="width: 100%;" filterable>
                  <el-option label="No" :value="false" />
                  <el-option label="Yes" :value="true" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- Step 3: Complaint Details -->
        <div v-if="active === 2" class="form-step">
          <el-row :gutter="8">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn14" label="Nature of Complaint" prop="nature">
                <el-select v-model="grmForm.nature" placeholder="Select nature" style="width: 100%;" filterable>
                  <el-option
                    v-for="item in grievanceOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                                  </el-select>
                                </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn15" label="Description" prop="description">
                      <el-input
                  type="textarea"
                  v-model="grmForm.description"
                  placeholder="Provide a detailed description"
                  :rows="isMobile ? 3 : 4"
                />
                    </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
                    <el-form-item id="btn16" label="Plea/Request" prop="plea">
                      <el-input
                  type="textarea"
                  v-model="grmForm.plea"
                  placeholder="Enter complainant's plea or request - what action would you like to be taken?"
                  :rows="isMobile ? 3 : 4"
                />
                    </el-form-item>
                  </el-col>
                </el-row>
        </div>

        <!-- Step 4: Review & Submit -->
        <div v-if="active === 3" class="form-step">
          <el-row :gutter="8">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
                    <el-form-item id="btn17" label="Witness Name" prop="witness">
                      <el-input v-model="grmForm.witness" placeholder="Enter witness name" style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn18" label="Witness Phone" prop="witness_phone">
                      <el-input v-model="grmForm.witness_phone" placeholder="Enter witness phone" style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn19" label="Witness Statement" prop="witness_statement">
                      <el-input
            v-model="grmForm.witness_statement" type="textarea" placeholder="Enter witness statement"
                        style="width:90%" />
                    </el-form-item>
                  </el-col>


                  <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">

                    <!-- <el-form-item id="btn17" label="Are you the complainant?" prop="witness">
                      <el-switch
            disabled v-model="grmForm.self_reported" class="ml-2" inline-prompt
                        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="Yes"
                        inactive-text="No" />
                    </el-form-item> -->

                    <el-form-item v-if="!grmForm.self_reported" id="btn18" label="Your Name" prop="reporter_name">
                      <el-input disabled v-model="grmForm.reporter_name" placeholder="Your Name" style="width:90%" />
                    </el-form-item>

                    <el-form-item v-if="!grmForm.self_reported" id="btn19" label="Your Phone" prop="reporter_phone">
                      <el-input
            disabled v-model="grmForm.reporter_phone" type="text" placeholder="Your Phone"
                        style="width:90%" />
                    </el-form-item>



                    <el-upload
            id="btn20" class="upload-demo"
                      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple :on-preview="handlePreview"
                      :on-remove="handleRemove" :before-remove="beforeRemove" :before-upload="beforeUpload" :limit="3" v-model:file-list="fileList"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp"
                      :auto-upload="false" :on-exceed="handleExceed">
                      <el-button type="primary">Upload Supporting Documentation</el-button>
                      <template #tip>
                        <div class="el-upload__tip">Images and documents only (pdf/jpg/png/doc/docx, etc.), max 10MB. Executable files (.exe) are not allowed.</div>
                      </template>
                    </el-upload>





                  </el-col>
                </el-row>
        </div>
            </el-form>

      <!-- Drawer Footer -->
      <div class="drawer-footer" :class="{ 'mobile-footer': isMobile }">
        <el-button 
          id="btn9" 
          v-if="active > 0" 
          @click="prev"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
        >
          Previous
                  </el-button>
                  <el-button
          id="btn7" 
          v-if="active < 3" 
          type="primary" 
          @click="next"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
        >
          Next
        </el-button>
        <el-button 
          id="btn2" 
          v-if="active === 3" 
          type="primary" 
          @click="saveGrievance"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
        >
          Save
        </el-button>
        <el-button 
          @click="EditDialogVisible = false"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
        >
          Cancel
        </el-button>
                 </div>
              </div>
  </el-drawer>

  <!-- Confirmation Dialog -->
  <el-drawer
    v-model="showConfirmationDialog"
    :title="isMobile ? '' : null"
    direction="rtl"
    :size="isMobile ? '100%' : '40%'"
    :with-header="false"
    :destroy-on-close="true"
    class="confirmation-drawer"
  >
    <div class="drawer-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="isMobile ? 20 : 24">
            <Check />
          </el-icon>
        </div>
        <div class="header-text">
          <h3>Confirm Resolution</h3>
        </div>
      </div>
      <el-button type="text" @click="showConfirmationDialog = false" class="close-button">
        <el-icon :size="isMobile ? 18 : 20">
          <Close />
        </el-icon>
      </el-button>
    </div>

    <div class="drawer-body">
    <!-- Grievance Info Section -->
    <div class="grievance-info-section">
      <div class="grievance-code">{{ FullGrievanceData?.code }}</div>
      <div class="grievance-description">{{ FullGrievanceData?.description }}</div>
    </div>

    <el-form :model="confirmationForm" label-position="top" class="confirmation-form">
      <el-form-item label="Confirmation Notes">
        <el-input
          v-model="confirmationForm.confirmation_notes"
          type="textarea"
          :rows="3"
          placeholder="Optional notes"
        />
      </el-form-item>
      
      <!-- Resolution Documents Section -->
      <el-form-item v-if="getResolutionDocuments.length > 0" label="Resolution Documents:">
        <el-card shadow="never" style="width: 100%;">
          <template #header>
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-icon><Document /></el-icon>
              <span>Documents Attached to Resolution ({{ getResolutionDocuments.length }})</span>
            </div>
          </template>
          <el-table :data="getResolutionDocuments" style="width: 100%" size="small" max-height="200">
            <el-table-column type="index" width="50" label="#" />
            <el-table-column prop="name" label="Document Name" min-width="200">
              <template #default="{ row }">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <el-icon><Document /></el-icon>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type" width="150">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ row.type || 'Documentation' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="format" label="Format" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.format?.toUpperCase() || 'N/A' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="Size" width="100">
              <template #default="{ row }">
                <span>{{ row.size ? `${row.size} MB` : 'N/A' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="Uploaded" width="150">
              <template #default="{ row }">
                <span>{{ formatDate(row.createdAt) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  :icon="Download"
                  @click="downloadFile(row)"
                  :loading="viewLoading"
                >
                  Download
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-form-item>
      
      <el-alert
        v-if="getResolutionDocuments.length === 0"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #title>
          No documents attached. Verify resolution before confirming.
        </template>
      </el-alert>
      
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #title>
          Confirming verifies this grievance is properly resolved at {{ formatSentence(confirmationForm.confirmation_level) }} level.
        </template>
      </el-alert>
    </el-form>
    
    <div class="drawer-footer">
      <el-button @click="showConfirmationDialog = false" :size="isMobile ? 'small' : 'default'">Cancel</el-button>
      <el-button type="success" @click="handleConfirmResolution" :size="isMobile ? 'small' : 'default'">
          <el-icon><Check /></el-icon>
          Confirm Resolution
        </el-button>
      </div>
    </div>
  </el-drawer>

  <!-- Supporting Documentation Upload Dialog -->
  <el-dialog
    v-model="showSupportingDocDialog"
    title="Upload Supporting Documentation"
    :width="isMobile ? '95%' : '600px'"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="!isSupportingDocUploading"
  >
    <el-form>
      <el-form-item label="Document Type" label-position="top" required>
        <el-select 
          v-model="supportingDocType" 
          placeholder="Select document type" 
          style="width: 100%"
        >
          <el-option
            v-for="type in documentTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Select Files" label-position="top">
        <el-upload
          v-model:file-list="supportingDocFileList"
          :auto-upload="false"
          :before-upload="beforeSupportingDocUpload"
          :on-remove="handleSupportingDocRemove"
          :on-exceed="handleSupportingDocExceed"
          :limit="10"
          multiple
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            Drop file here or <em>click to upload</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              Supported formats: PDF, Word, Images (JPEG, PNG). Max file size: 10MB. Maximum 10 files.
            </div>
          </template>
        </el-upload>
        <el-text size="small" type="info" style="margin-top: 8px; display: block;">
          Selected files: {{ supportingDocFileList.length }} / 10
        </el-text>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showSupportingDocDialog = false" :disabled="isSupportingDocUploading">Cancel</el-button>
        <el-button
          type="primary"
          @click="uploadSupportingDocuments"
          :loading="isSupportingDocUploading"
          :disabled="supportingDocFileList.length === 0 || !supportingDocType || isSupportingDocUploading"
        >
          {{ isSupportingDocUploading ? 'Uploading...' : 'Upload Documents' }}
        </el-button>
      </span>
    </template>
  </el-dialog>

</template>
<style scoped>
/* Custom styling for details container */
.details-container {
  margin-top: 20px;
}

/* Custom styling for each detail item */
.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 5px;
  border-bottom: 1px solid #eee;
}

/* Label styling */
.label-text {
  font-weight: bold;
  color: #333;

  width: 10%;
  /* Adjust as needed */
}

/* Value styling */
.value {
  width: 90%;
  /* Adjust as needed */

}

/* Ensure spacing between rows */
.el-row {
  margin-top: 20px;
}
 
:root {
  /* Light Mode Variables */
  --card-header-color: #333;
  --card-header-bg: #f9f9f9;
}

[data-theme="dark"] {
  /* Dark Mode Variables */
  --card-header-color: #ddd;
  --card-header-bg: #222;
}

.card-header {
  display: flex;
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--card-header-color);
  background-color: var(--card-header-bg);
  padding: 10px;
  border-radius: 5px;
}

/* Custom styling for documents container */
.documents-container {
  margin-top: 20px;
}

.documents-container ul {
  list-style-type: none;
  padding: 0;
}

.documents-container li {
  margin-bottom: 10px;
}
</style>
<style scoped>
.action-col {
  padding: 10px;
}

.action-header {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #333;
}

.documents-header {
  font-size: 0.95rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #837f7f;
}

.action-body {
  font-size: 1rem;
  font-weight: 200;
  color: #666;
}

.action-footer {
  font-size: 0.98rem;
  margin-top: 2px;
  font-weight: 300;
  color: #2e0dc2;
}

.success-background {
  background-color: rgba(226, 248, 231, 0.4);
  /* Light green with 80% opacity */
  color: #1bd847;
  /* Dark green text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #c3e6cb;
  /* Border color */

}

.warning-background {
  background-color: rgba(255, 243, 205, 0.4);
  /* Light yellow with 80% opacity */
  color: #856404;
  /* Dark yellow text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ffeeba;
  /* Border color */
}

.closed-background {
  background-color: rgba(255, 0, 0, 0.14);
  /* Red with 80% opacity */
  color: #fa0707;
  /* Darker text for contrast */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #fb050552;
  /* Lighter red border */
}

.referred-background {
  background-color: rgba(247, 155, 7, 0.2);
  /* Pink with 20% opacity */
  color: rgb(255, 192, 254);
  /* Same text color */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #d6d6d6;
  /* Lighter pink border */
}

.success-title {
  color: rgb(25, 184, 60)
    /* Same text color */
}

.fail-title {
  color: #f21c26
    /* Same text color */

}

.resolved-title {
  color: #4CAF50;
  /* Green */
}

.sorting-title {
  color: #1b5ef0;
  /* Orange */
}


.escalated-title {
  color: #FF9800;
  /* Orange */
}

.reported-title {
  color: #e412be;
  /* Red */
}


.rejected-title {
  color: #e41212;
  /* Red */
}
.referred-title {
  color: #2196F3;
  /* Blue */
}

.reverted-title {
  color: #FF9800;
  /* Orange */
  font-weight: 500;
}

.resolved-background {
  background-color: rgba(220, 240, 220, 0.4);
  /* Light green with 80% opacity */
  color: #155724;
  /* Dark green text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #c3e6cb;
  /* Border color */
}

.escalated-background {
  background-color: rgba(255, 253, 206, 0.4);
  /* Light yellow with 80% opacity */
  color: #856404;
  /* Dark yellow text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ffeeba;
  /* Border color */
}

.reported-background {
  background-color: rgba(237, 209, 242, 0.4);
  /* Light orange with 80% opacity */
  color: #7d3c98;
  /* Dark orange text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #e412be;
  /* Border color */
}

.referred-background {
  background-color: rgba(224, 240, 255, 0.4);
  /* Light cyan with 80% opacity */
  color: #0c5460;
  /* Dark cyan text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #bee5eb;
  /* Border color */
}

.closed-background {
  background-color: rgba(224, 240, 255, 0.4);
  /* Light cyan with 80% opacity */
  color: #333535;
  /* Dark cyan text */
  padding: 5px;
  border-radius: 5px;
  border: 1px dotted #333535;
  /* Border color */
}

.reverted-background {
  background-color: rgba(255, 243, 224, 0.4);
  /* Light orange with 40% opacity */
  color: #856404;
  /* Dark orange text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ffc107;
  /* Orange border */
}

.info-background {
  background-color: rgba(204, 229, 255, 0.4);
  /* Light blue with 80% opacity */
  color: #004085;
  /* Dark blue text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #b8daff;
  /* Border color */
}


.custom-card {
  padding: 5px;
  /* Reduce padding */
  margin: 5px 0;
  /* Adjust margin as needed */
  min-height: 10px;
  /* Set a minimum height if needed */
}


/* Notifications Styles */
.mobile-notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.mobile-notification-card {
  background-color: var(--el-bg-color);
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 12px 14px;
  border-left: 4px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-notification-success {
  border-left-color: var(--el-color-success);
}

.mobile-notification-fail {
  border-left-color: var(--el-color-danger);
}

.mobile-notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.mobile-notification-status {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.mobile-notification-date {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  line-height: 1.3;
  word-break: break-word;
}

.mobile-notification-tag {
  flex-shrink: 0;
}

.mobile-notification-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-notification-message {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.mobile-notification-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-notification-meta .meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1.4;
}

.mobile-notification-meta .meta-label {
  font-weight: 600;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-right: 4px;
}

.mobile-notification-meta .meta-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.status-text {
  display: block;
  font-size: inherit;
  color: var(--el-text-color-primary);
  word-break: break-word;
  white-space: normal;
}

.mobile-notification-meta div {
  line-height: 1.4;
}

.mobile-notification-reference {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.status-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.status-icon.success-icon {
  color: var(--el-color-success);
}

.status-icon.fail-icon {
  color: var(--el-color-danger);
}

.notifications-wrapper {
  width: 100%;
  padding: 0;
}

.notifications-timeline {
  max-width: 100%;
  padding: 0;
}

.notification-timeline-item {
  margin-bottom: 12px;
}

.notification-collapse {
  width: 100%;
}

.notification-collapse-item {
  width: 100%;
}

.notification-collapse-item :deep(.el-collapse-item__header) {
  justify-content: flex-start;
  text-align: left;
}

.notification-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.notification-status-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.notification-status-icon.success-icon {
  color: #67C23A;
}

.notification-status-icon.fail-icon {
  color: #f56c6c;
}

.notification-title-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  font-size: 14px;
  font-weight: 500;
}

.notification-custom-card {
  padding: 12px;
  margin: 4px 0;
  min-height: auto;
  border-radius: 6px;
}

.notification-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.notification-detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.5;
}

.notification-detail-label {
  font-weight: 600;
  color: var(--el-text-color-regular);
  min-width: 80px;
  flex-shrink: 0;
}

.notification-detail-value {
  color: var(--el-text-color-primary);
  flex: 1;
  word-break: break-word;
  min-width: 0;
}

.notification-status-tag {
  margin-left: 0;
}

.timestamp-class {
  font-weight: 600;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.4;
}

/* Mobile optimizations for notifications */
@media (max-width: 768px) {
  .mobile-notifications-list {
    gap: 10px;
    padding: 6px 2px;
  }

  .mobile-notification-card {
    padding: 12px;
    border-radius: 8px;
  }

  .mobile-notification-date {
    font-size: 11px;
  }

  .mobile-notification-message {
    font-size: 12px;
  }

  .mobile-notification-meta .meta-label,
  .mobile-notification-meta .meta-value,
  .mobile-notification-meta .meta-row,
  .mobile-notification-reference {
    font-size: 11px;
  }

  .status-icon {
  font-size: 14px;
  }

  .notifications-timeline {
    padding: 0 4px;
  }
  
  .notification-timeline-item {
    margin-bottom: 10px;
  }
  
  .timestamp-class {
    font-size: 11px;
    font-weight: 500;
  }
  
  .notification-title-wrapper {
    gap: 6px;
  }
  
  .notification-status-icon {
    font-size: 14px;
  }
  
  .notification-title-text {
    font-size: 12px;
    line-height: 1.3;
  }
  
  .notification-custom-card {
    padding: 10px;
    margin: 2px 0;
  }
  
  .notification-container {
    gap: 6px;
  }
  
  .notification-detail-row {
    font-size: 12px;
    gap: 4px;
    flex-direction: column;
  }
  
  .notification-detail-label {
    min-width: auto;
    font-size: 11px;
    font-weight: 600;
  }
  
  .notification-detail-value {
    font-size: 12px;
    line-height: 1.4;
  }
  
  .notification-status-tag {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  /* Optimize collapse item on mobile */
  .notification-collapse-item :deep(.el-collapse-item__header) {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .notification-collapse-item :deep(.el-collapse-item__content) {
    padding: 8px 12px;
  }
}

@media (max-width: 480px) {
  .mobile-notifications-list {
    gap: 8px;
    padding: 4px 0;
  }

  .mobile-notification-card {
    padding: 10px;
  }

  .mobile-notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .mobile-notification-date {
    font-size: 10px;
  }

  .mobile-notification-message {
    font-size: 11px;
  }

  .mobile-notification-meta .meta-label,
  .mobile-notification-meta .meta-value,
  .mobile-notification-meta .meta-row,
  .mobile-notification-reference {
    font-size: 10px;
  }

  .status-icon {
    font-size: 12px;
  }

  .notifications-timeline {
    padding: 0 2px;
  }
  
  .notification-timeline-item {
    margin-bottom: 8px;
  }
  
  .timestamp-class {
    font-size: 10px;
  }
  
  .notification-title-wrapper {
    gap: 4px;
  }
  
  .notification-status-icon {
    font-size: 12px;
  }
  
  .notification-title-text {
    font-size: 11px;
  }
  
  .notification-custom-card {
    padding: 8px;
    margin: 2px 0;
  }
  
  .notification-container {
    gap: 5px;
  }
  
  .notification-detail-row {
    font-size: 11px;
    gap: 3px;
  }
  
  .notification-detail-label {
    font-size: 10px;
  }
  
  .notification-detail-value {
    font-size: 11px;
  }
  
  .notification-status-tag {
    font-size: 9px;
    padding: 1px 4px;
  }
  
  .notification-collapse-item :deep(.el-collapse-item__header) {
    padding: 6px 8px;
    font-size: 11px;
  }
  
  .notification-collapse-item :deep(.el-collapse-item__content) {
    padding: 6px 8px;
  }
}
</style>




<style scoped>
.notification-card {
  border-radius: 12px;
  /* Rounded corners */
  padding: 20px;
  /* Internal padding */
}

.notification-container {
  display: flex;
  align-items: left;
  flex-direction: column;
  /* Ensures each <p> is on its own line */

}

.notification-icon {
  font-size: 24px;
  margin-right: 10px;
}

.success-message {
  color: #67C23A;
  /* Success color from Element Plus */
  font-weight: 500;
}

.fail-message {
  color: #f21c26;
  /* Success color from Element Plus */
  font-weight: 500;
}


.success-icon {
  font-size: 24px;
  margin-right: 10px;
}
</style>


<style scoped>
/* Apply styles to the internal collapse item header using ::v-deep */
::v-deep .el-collapse-item__header {
  background-color: #f4f4f5;
  /* Custom background color */
  border-radius: 5px;
  /* Round the corners */

}

::v-deep .el-collapse-item__header.is-active {
  border-bottom-color: transparent;
  background-color: #FFFFFF;
  border-radius: 5px;
  /* Round the corners */

}

.option-input {
  width: 100%;
  margin-bottom: 8px;
}

/* Drawer Styles - Mobile Optimized */
.grievance-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Drawer Header Styles */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.drawer-header .header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.drawer-header .header-icon {
  color: #409eff;
  flex-shrink: 0;
}

.drawer-header .header-text {
  min-width: 0;
  flex: 1;
}

.drawer-header .header-text h3 {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
  word-wrap: break-word;
}

.drawer-header .header-text p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.close-button {
  color: #909399;
  flex-shrink: 0;
  padding: 4px;
}

.close-button:hover {
  color: #409eff;
}

/* Drawer Content Styles */
.drawer-content {
  padding: 16px 20px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.drawer-footer {
  position: sticky;
  bottom: 0;
  padding: 12px 16px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.drawer-footer.mobile-footer {
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.drawer-footer.mobile-footer .mobile-button {
  width: 100%;
  margin: 0;
}

.drawer-steps {
  margin-bottom: 20px;
}

.drawer-steps :deep(.el-step__title) {
  font-size: 13px;
  line-height: 1.4;
}

.drawer-steps :deep(.el-step__description) {
  font-size: 12px;
}

.grievance-form {
  margin-top: 0;
  margin-bottom: 20px;
}

.form-step {
  margin-bottom: 16px;
}

/* Form Section Styling */
.form-section {
  margin-bottom: 24px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resolution-form-download {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px;
  background-color: var(--el-color-warning-light-9);
  border-radius: 4px;
  border-left: 3px solid var(--el-color-warning);
}

.required-hint {
  flex: 1;
  min-width: 0;
}

.upload-tips {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

/* Resolution Steps Styling */
.resolution-steps {
  margin-bottom: 24px;
  padding: 16px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
}

.resolution-steps--mobile {
  padding: 12px 8px;
}

.resolution-steps :deep(.el-step__title) {
  font-size: 13px;
  font-weight: 500;
}

.resolution-steps :deep(.el-step__head) {
  width: 32px;
  height: 32px;
}

.resolution-steps :deep(.el-step__icon) {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.resolution-steps :deep(.el-step__line) {
  top: 16px;
}

.resolution-step-content {
  min-height: 200px;
  padding: 16px 0;
}

.resolution-step-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.resolution-step-navigation-right {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

@media (max-width: 768px) {
  .resolution-steps {
    margin-bottom: 16px;
    padding: 10px 4px;
  }
  
  .resolution-steps :deep(.el-step__title) {
    font-size: 11px;
    display: none;
  }
  
  .resolution-steps :deep(.el-step__head) {
    width: 28px;
    height: 28px;
  }
  
  .resolution-steps :deep(.el-step__icon) {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .resolution-steps :deep(.el-step__line) {
    top: 14px;
  }
  
  .resolution-step-content {
    min-height: 150px;
    padding: 12px 0;
  }
  
  .resolution-step-navigation {
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }
  
  .resolution-step-navigation-right {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    margin-left: 0;
  }
  
  .resolution-step-navigation .el-button {
    width: 100%;
  }
}

.grievance-form .el-form-item {
  margin-bottom: 16px;
}

.grievance-form .el-form-item__label {
  font-weight: 500;
  color: #606266;
  margin-bottom: 6px;
  font-size: 13px;
}

.grievance-form .el-input,
.grievance-form .el-select,
.grievance-form .el-date-picker {
  margin-bottom: 0;
}

/* Form Actions */
.form-actions {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 12px 0;
  border-top: 1px solid #e4e7ed;
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  z-index: 10;
  flex-shrink: 0;
}

.form-actions.mobile-actions {
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.form-actions.mobile-actions .mobile-button {
  width: 100%;
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .drawer-header {
    padding: 12px 16px;
  }
  
  .drawer-header .header-content {
    gap: 8px;
  }
  
  .drawer-header .header-text h3 {
    font-size: 16px;
  }
  
  .drawer-header .header-text p {
    font-size: 12px;
  }
  
  .drawer-content {
    padding: 12px 16px;
    height: calc(100vh - 140px);
  }
  
  .drawer-steps {
    margin-bottom: 16px;
  }
  
  .drawer-steps :deep(.el-step__title) {
    font-size: 12px;
  }
  
  .drawer-steps :deep(.el-step__head) {
    width: 24px;
    height: 24px;
  }
  
  .drawer-steps :deep(.el-step__icon) {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
  
  .drawer-steps :deep(.el-step__line) {
    top: 12px;
  }
  
  .grievance-form {
    margin-bottom: 16px;
  }
  
  .form-step {
    margin-bottom: 12px;
  }
  
  .drawer-footer {
    padding: 10px 12px;
    gap: 6px;
  }
  
  .drawer-footer.mobile-footer {
    padding: 10px;
  }
  
  .grievance-form .el-form-item {
    margin-bottom: 14px;
  }
  
  .grievance-form .el-form-item__label {
    font-size: 12px;
    margin-bottom: 4px;
  }
  
  .grievance-form :deep(.el-input__wrapper),
  .grievance-form :deep(.el-textarea__inner),
  .grievance-form :deep(.el-select .el-input__wrapper) {
    padding: 4px 8px;
    min-height: 32px;
  }
  
  .grievance-form :deep(.el-input__inner) {
    height: 30px;
    font-size: 14px;
  }
  
  .grievance-form :deep(.el-textarea__inner) {
    padding: 6px 8px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .form-actions {
    padding: 10px 12px;
    gap: 6px;
  }
  
  .form-actions.mobile-actions {
    padding: 10px;
  }
  
  .form-actions .el-button {
    font-size: 13px;
    padding: 8px 12px;
  }
}

@media (max-width: 480px) {
  .drawer-header {
    padding: 10px 12px;
  }
  
  .drawer-header .header-content {
    gap: 8px;
  }
  
  .drawer-header .header-text h3 {
    font-size: 15px;
  }
  
  .drawer-content {
    padding: 10px 12px;
    height: calc(100vh - 120px);
  }
  
  .drawer-steps {
    margin-bottom: 12px;
  }
  
  .drawer-steps :deep(.el-step__title) {
    font-size: 11px;
  }
  
  .drawer-steps :deep(.el-step__head) {
    width: 20px;
    height: 20px;
  }
  
  .drawer-steps :deep(.el-step__icon) {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }
  
  .drawer-steps :deep(.el-step__line) {
    top: 10px;
  }
  
  .drawer-footer {
    padding: 8px 10px;
    gap: 6px;
  }
  
  .drawer-footer.mobile-footer {
    padding: 8px;
  }
  
  .drawer-footer .el-button {
    font-size: 13px;
    padding: 8px 12px;
  }
  
  .grievance-form .el-form-item {
    margin-bottom: 12px;
  }
  
  .grievance-form .el-form-item__label {
    font-size: 11px;
  }
  
  .grievance-form :deep(.el-input__wrapper),
  .grievance-form :deep(.el-textarea__inner),
  .grievance-form :deep(.el-select .el-input__wrapper) {
    padding: 4px 8px;
    min-height: 30px;
  }
  
  .grievance-form :deep(.el-input__inner) {
    height: 28px;
    font-size: 13px;
  }
  
  .grievance-form :deep(.el-textarea__inner) {
    padding: 5px 8px;
    font-size: 13px;
  }
  
  .form-actions {
    padding: 8px 10px;
  }
  
  .form-actions .el-button {
    font-size: 12px;
    padding: 6px 10px;
  }
}

/* Edit Dialog Mobile Optimization */
.edit-grievance-dialog :deep(.el-dialog__body) {
  padding: 16px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 768px) {
  .edit-grievance-dialog :deep(.el-dialog__body) {
    padding: 12px;
    max-height: calc(100vh - 150px);
  }
  
  .edit-grievance-dialog :deep(.el-dialog__header) {
    padding: 12px 16px;
  }
  
  .edit-grievance-dialog :deep(.el-dialog__title) {
    font-size: 16px;
  }
  
  .edit-grievance-dialog :deep(.el-steps) {
    margin-bottom: 16px;
  }
  
  .edit-grievance-dialog :deep(.el-step__title) {
    font-size: 12px;
  }
  
  .edit-grievance-dialog :deep(.el-step__head) {
    width: 24px;
    height: 24px;
  }
  
  .edit-grievance-dialog :deep(.el-step__icon) {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
}

/* Edit History Styles */
.history-card {
  margin-top: 8px;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.history-table {
  margin-top: 0;
  width: 100%;
}

.history-table .el-table__row {
  transition: all 0.3s ease;
}

.history-table .el-table__row:hover {
  background-color: #f5f7fa;
}

.history-table .el-table__row.reverted-row {
  background-color: #fdf6ec;
  opacity: 0.8;
}

/* Hide expansion icon for Delete rows */
/* Hide expansion UI for Delete rows (deep selector to reach child component DOM) */
::v-deep .history-table .no-expand .el-table__expand-column .el-table__expand-icon {
  display: none !important;
}

/* Disable click on the expand cell for Delete rows */
::v-deep .history-table .no-expand .el-table__expand-column .cell {
  pointer-events: none;
}

.expand-content {
  padding: 0;
  background-color: #fafafa;
}

.field-name {
  font-weight: 500;
  color: #606266;
}

.before-value {
  color: #f56c6c;
  text-decoration: line-through;
  font-style: italic;
}

.after-value {
  color: #67c23a;
  font-weight: 500;
}

.date-cell,
.user-cell {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.italic-red {
  color: #f56c6c;
}

.italic-green {
  color: #67c23a;
}

.td-bold {
  font-weight: 500;
}

/* Responsive adjustments for history table */
@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .history-table {
    font-size: 12px;
  }
}

/* Make card body and inner tables consume full width */
:deep(.history-card .el-card__body) {
  padding-left: 0;
  padding-right: 0;
}

.differences-table {
  width: 100%;
}

/* Confirmation Card Styles - Improved and Dark Mode Friendly */
.confirmation-status-card {
  margin-top: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.confirmation-status-card :deep(.el-card__header) {
  padding: 10px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-page);
}

.confirmation-status-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.confirmation-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.confirmation-icon {
  flex-shrink: 0;
}

.confirmation-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.confirmation-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.confirmation-detail-item {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
}

.confirmation-label {
  font-weight: 500;
  color: var(--el-text-color-regular);
  min-width: 100px;
}

.confirmation-value {
  color: var(--el-text-color-primary);
  flex: 1;
  word-break: break-word;
}

.confirmation-awaiting-message {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  font-style: italic;
}

.confirmation-card {
  border-left: 3px solid;
  border-radius: 6px;
}

.confirmation-card.confirmed {
  border-left-color: var(--el-color-success);
  background-color: var(--el-color-success-light-9);
}

.confirmation-card.confirmed :deep(.el-card__header) {
  background-color: var(--el-color-success-light-9);
}

.confirmation-card.confirmed .confirmation-icon {
  color: var(--el-color-success);
}

.confirmation-card.awaiting {
  border-left-color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
}

.confirmation-card.awaiting :deep(.el-card__header) {
  background-color: var(--el-color-warning-light-9);
}

.confirmation-card.awaiting .confirmation-icon {
  color: var(--el-color-warning);
}

/* Dark mode adjustments */
[data-theme="dark"] .confirmation-card.confirmed {
  background-color: rgba(103, 194, 58, 0.15);
  border-left-color: var(--el-color-success);
}

[data-theme="dark"] .confirmation-card.awaiting {
  background-color: rgba(230, 162, 60, 0.15);
  border-left-color: var(--el-color-warning);
}

/* Details Table Styles - Improved */
.details-table-card {
  border-radius: 8px;
}

.details-table-card :deep(.el-card__body) {
  padding: 12px;
}

/* Desktop Table View */
.grievance-details-table.desktop-table {
  font-size: 13px;
}

.grievance-details-table.desktop-table :deep(.el-table__header) {
  background-color: var(--el-bg-color-page);
}

.grievance-details-table.desktop-table :deep(.el-table__row) {
  transition: background-color 0.2s ease;
}

.grievance-details-table.desktop-table :deep(.el-table__row:hover) {
  background-color: var(--el-fill-color-light);
}

.detail-label-column {
  background-color: var(--el-fill-color-lighter);
}

.detail-label {
  font-weight: 500;
  font-size: 12px;
  color: var(--el-text-color-regular);
  letter-spacing: 0.2px;
}

.detail-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  padding: 2px 0;
}

.detail-value-resolution {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  padding: 4px 0;
}

/* Mobile Card View */
.mobile-details-list {
  display: none;
}

.mobile-detail-item {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  transition: background-color 0.2s ease;
}

.mobile-detail-item:last-child {
  border-bottom: none;
}

.mobile-detail-item:hover {
  background-color: var(--el-fill-color-light);
}

.mobile-detail-label {
  font-weight: 600;
  font-size: 11px;
  color: var(--el-text-color-regular);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  line-height: 1.4;
}

.mobile-detail-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  padding: 0;
}

.mobile-detail-resolution .mobile-detail-value {
  font-size: 12px;
  line-height: 1.6;
  padding: 4px 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .confirmation-header {
    gap: 6px;
  }
  
  .confirmation-title {
    font-size: 12px;
  }
  
  .confirmation-detail-item {
    font-size: 11px;
    flex-direction: column;
    gap: 2px;
  }
  
  .confirmation-label {
    min-width: auto;
  }
  
  /* Hide desktop table on mobile */
  .grievance-details-table.desktop-table {
    display: none;
  }
  
  /* Show mobile card view on mobile */
  .mobile-details-list {
    display: block;
  }
  
  .details-table-card :deep(.el-card__body) {
    padding: 8px;
  }
  
  .mobile-detail-item {
    padding: 10px 8px;
    margin-bottom: 0;
  }
  
  .mobile-detail-label {
    font-size: 10px;
    margin-bottom: 5px;
  }
  
  .mobile-detail-value {
    font-size: 12px;
  }
  
  .mobile-detail-resolution .mobile-detail-value {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .details-table-card :deep(.el-card__body) {
    padding: 6px;
  }
  
  .mobile-detail-item {
    padding: 8px 6px;
  }
  
  .mobile-detail-label {
    font-size: 9px;
    margin-bottom: 4px;
  }
  
  .mobile-detail-value {
    font-size: 11px;
    line-height: 1.4;
  }
  
  .mobile-detail-resolution .mobile-detail-value {
    font-size: 10px;
  }
}

/* Grievance Info Section in Confirmation Dialog */
.grievance-info-section {
  padding: 16px 20px;
  background-color: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 20px;
}

.grievance-code {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.grievance-description {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  word-break: break-word;
}

@media (max-width: 768px) {
  .grievance-info-section {
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  
  .grievance-code {
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .grievance-description {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .grievance-info-section {
    padding: 10px 12px;
    margin-bottom: 12px;
  }
  
  .grievance-code {
    font-size: 13px;
    margin-bottom: 5px;
  }
  
  .grievance-description {
    font-size: 12px;
  }
}
</style>
