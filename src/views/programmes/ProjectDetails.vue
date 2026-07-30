<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch, reactive, ref } from 'vue'
import {
  
ElButton, ElDivider, ElTimeline, ElTimelineItem, ElCol, ElRow, ElCheckbox, ElInput, ElOptionGroup, ElForm, ElFormItem, ElUpload, ElMessage,
  ElCard, ElTabs, ElTabPane, ElTable, ElTableColumn, ElTooltip, ElDialog, ElDrawer, ElSelect, ElOption, ElDescriptions,
  ElDescriptionsItem, ElText, ElDatePicker, ElPopconfirm, ElStep, ElSteps, FormRules, ElSelectV2, ElInputNumber, ElSwitch, ElPagination, ElTag, ElIcon, ElTransfer,
  ElCollapseTransition, ElEmpty, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessageBox,
} from 'element-plus'
// Locally
import { logGrievanceAction, updateGrievanceStatus } from '@/api/grievance'
import { uuid } from 'vue-uuid'
import { getSettlementListByCounty, getLinkedDocuments, unlinkDocument } from '@/api/settlements'
import { uploadIpcDocuments, downloadIpcDocument } from '@/api/ipc'
import type { RouteLocationNormalizedLoaded, RouterLinkProps } from 'vue-router'

import { getOneGeo } from '@/api/settlements'

import { Icon } from '@iconify/vue';
import {
  Download, UploadFilled, Edit, Back, CircleCloseFilled, Position, Delete, Loading,
  Close, Plus, Setting, ArrowLeft, ArrowRight, Check,
} from '@element-plus/icons-vue'

import { getCountyListApi, } from '@/api/counties'

import { uploadFilesBatch } from '@/api/settlements'
import { addTask, getTasks, getNestedTasks, batchImport, deleteTask, getClockInHistory } from '@/api/project'

import {
  getOneSettlement
} from '@/api/settlements'

import { updateOneRecord, BatchImportUpsert, deleteDocument } from '@/api/settlements'
import {
  searchByKeyWord
} from '@/api/settlements'

import { CreateRecord, DeleteRecord } from '@/api/settlements'
import type { UploadProps, UploadUserFile } from 'element-plus'


import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";


import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useRoute } from 'vue-router'

import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'


import * as turf from '@turf/turf'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getFile } from '@/api/summary'
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import shortid from 'shortid';
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import UploadShareDialog from '@/views/Components/UploadShareDialog.vue'
import ProjectFormDrawer from '@/views/Intervention/Project/ProjectFormDrawer.vue'
import InlineEditableDescriptions from '@/views/Settlement/components/InlineEditableDescriptions.vue'
import {
  formatProgrammeSelectLabel,
  formatComponentSelectLabel,
  formatProgrammeComponentSelectLabel,
} from '@/views/Intervention/Project/common/index.ts'
import { getProgrammePathLabels } from '@/utils/programmeComponentTree'
import { useDesign } from '@/hooks/web/useDesign'

import type { FormInstance } from 'element-plus'
import { getModelSpecs, getUniqueFieldValues } from '@/api/fields'

import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';

const mobileBreakpoint = 768
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= mobileBreakpoint : false)

const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth <= mobileBreakpoint
}

const projectDialogWidth = computed(() => (isMobile.value ? 'calc(100% - 32px)' : '480px'))
const projectFormDialogWidth = computed(() => (isMobile.value ? 'calc(100% - 32px)' : '500px'))
const projectWideDialogWidth = computed(() => (isMobile.value ? '100%' : '50%'))
const projectNarrowDialogWidth = computed(() => (isMobile.value ? 'calc(100% - 32px)' : '400px'))
const projectUploadDialogWidth = computed(() => (isMobile.value ? 'calc(100% - 32px)' : '25%'))
 



const mapboxToken =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = mapboxToken



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

// Role checking setup
const isSuperAdmin = ref(
  userInfo.roles?.some((role: any) => role.name === "super_admin" || role.name === "root_admin")
)
// National scope alone must not grant staff powers: guest/public use national + role "public".
const isNationalStaff = computed(() => {
  return userInfo?.roles?.some((role: any) => {
    if (role.user_roles?.location_level !== 'national') return false
    const n = role.name
    if (n === 'public' || n === 'guest' || n === 'donor') return false
    return true
  }) || false
})

function getUserPerms(): string[] {
  const p = userInfo?.permissions
  return Array.isArray(p) ? p : []
}

function hasPerm(perm: string): boolean {
  const perms = getUserPerms()
  return perms.includes('*.*.*') || perms.includes(perm)
}

const canEditProjectMeta = computed(() => isSuperAdmin.value || hasPerm('project:update'))
const canCreateProjectLocation = computed(() => isSuperAdmin.value || hasPerm('project_location:create'))
const canUpdateProjectLocation = computed(() => isSuperAdmin.value || hasPerm('project_location:update'))
const canManageProjectScope = computed(() => isSuperAdmin.value || hasPerm('project:update'))
const canCreateActivity = computed(() => isSuperAdmin.value || hasPerm('activity:create'))
const canAddMonitoringReport = computed(
  () => isSuperAdmin.value || hasPerm('programme_implementation:create')
)
const canUploadProjectDocument = computed(() => isSuperAdmin.value || hasPerm('document:upload'))
const canManageProjectTeam = computed(() => isSuperAdmin.value || hasPerm('project_team:create'))
const canManageProjectContractors = computed(() => isSuperAdmin.value || hasPerm('project_contractor:create'))
const canManageDocumentTypes = computed(() => isSuperAdmin.value || hasPerm('document_type:create'))
const canManageDisbursements = computed(() => isSuperAdmin.value || hasPerm('disbursement:create'))
const showClockInTab = false

// Process user roles for permission checking
let processedRoles: any[] = []
if (userInfo.roles) {
  processedRoles = userInfo.roles.map((role: any) => {
    const level = role.user_roles?.location_level;
    return {
      role: role.name,
      model: level,
      field: level === 'county' ? 'county_id' : level === 'settlement' ? 'settlement_id' : null,
      fieldvalue: level === 'county' ? role.user_roles?.county_id : level === 'settlement' ? role.user_roles?.settlement_id : null
    };
  }).filter((role: any) => role !== null);
}

// Permission checking functions
const canUserDeleteProject = (project: any): boolean => {
  // Return false if project is undefined or null
  if (!project) {
    return false;
  }

  // Super admins and root admins can delete any project
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any project
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global project:delete permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project:delete')) {
    // If the project has a createdBy field, check if the current user created it
    const projectCreatedBy = project.createdBy || project.created_by;
    if (projectCreatedBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin and the project is in their county
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole && countyRole.user_roles?.county_id) {
      // Check if project has locations in the user's county
      if (project.project_locations && Array.isArray(project.project_locations)) {
        return project.project_locations.some((loc: any) => loc.county_id === countyRole.user_roles.county_id);
      }
      // Fallback: check if project has county_id directly
      if (project.county_id === countyRole.user_roles.county_id) {
        return true;
      }
    }
  }
  return false;
}

const canUserDeleteDocument = (document: any): boolean => {
  // Return false if document is undefined or null
  if (!document) {
    return false;
  }

  // Super admins and root admins can delete any document
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any document
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global document:delete permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('document:delete')) {
    // If the document has a createdBy field, check if the current user created it
    if (document.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin and the document is in their county
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole && countyRole.user_roles?.county_id) {
      // If the document is associated with a settlement, check the settlement's county_id
      if (document.settlement?.county_id === countyRole.user_roles.county_id) {
        return true;
      }
      // If the document is associated with a project, check project locations
      if (document.project?.project_locations && Array.isArray(document.project.project_locations)) {
        return document.project.project_locations.some((loc: any) => loc.county_id === countyRole.user_roles.county_id);
      }
    }
  }
  return false;
}

const canUserUnlinkDocument = (document: any): boolean => {
  // Return false if document is undefined or null
  if (!document) {
    return false;
  }

  // Super admins and root admins can unlink any linked document
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can unlink any linked document
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has permission to update/manage documents
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('document:update') || userPermissions.includes('document:delete')) {
    // If the document has a createdBy field, check if the current user created it
    if (document.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin and the document is in their county
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole && countyRole.user_roles?.county_id) {
      // If the document is associated with a settlement, check the settlement's county_id
      if (document.settlement?.county_id === countyRole.user_roles.county_id) {
        return true;
      }
      // If the document is associated with a project, check project locations
      if (document.project?.project_locations && Array.isArray(document.project.project_locations)) {
        return document.project.project_locations.some((loc: any) => loc.county_id === countyRole.user_roles.county_id);
      }
    }
  }
  return false;
}

const canUserDeleteProjectLocation = (location: any): boolean => {
  // Return false if location is undefined or null
  if (!location) {
    return false;
  }

  // Super admins and root admins can delete any location
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any location
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project_location:delete')) {
    // If the location has a createdBy field, check if the current user created it
    if (location.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin and the location is in their county
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole && countyRole.user_roles?.county_id) {
      if (location.county_id === countyRole.user_roles.county_id) {
        return true;
      }
    }
  }
  return false;
}

const canUserDeleteTeamMember = (member: any): boolean => {
  // Super admins and root admins can delete any team member
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any team member
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project_team:delete')) {
    // If the member has a createdBy field, check if the current user created it
    if (member.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole) {
      return true; // County admins can delete team members in their projects
    }
  }
  return false;
}

const canUserDeleteContractor = (contractor: any): boolean => {
  // Super admins and root admins can delete any contractor
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any contractor
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project_contractor:delete')) {
    // If the contractor has a createdBy field, check if the current user created it
    if (contractor.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole) {
      return true; // County admins can delete contractors in their projects
    }
  }
  return false;
}

const canUserDeleteDisbursement = (disbursement: any): boolean => {
  // Super admins and root admins can delete any disbursement
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any disbursement
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('disbursement:delete')) {
    // If the disbursement has a createdBy field, check if the current user created it
    if (disbursement.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole) {
      return true; // County admins can delete disbursements in their projects
    }
  }
  return false;
}

const canUserEditDisbursement = (disbursement: any): boolean => {
  if (isSuperAdmin.value) return true
  if (isNationalStaff.value) return true

  const userPermissions = userInfo.permissions || []
  if (userPermissions.includes('*.*.*') || userPermissions.includes('disbursement:update')) {
    if (disbursement.createdBy === userInfo.id) return true

    const countyRole = userInfo.roles.find(
      (role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin',
    )
    if (countyRole) return true
  }
  return canManageDisbursements.value
}

const canUserDeleteTask = (task: any): boolean => {
  // Super admins and root admins can delete any task
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any task
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project_task:delete')) {
    // If the task has a createdBy field, check if the current user created it
    if (task.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole) {
      return true; // County admins can delete tasks in their projects
    }
  }
  return false;
}




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
    'date_reported': null
  }
)



const projectDocuments = ref([])
const projectDocumentsTotal = ref(0)

const projectLogs = ref([])

// Pagination state for Locations tab
const locationCurrentPage = ref(1)
const locationPageSize = ref(5)

// Pagination state for Documentation tab
const docsCurrentPage = ref(1)
const docsPageSize = ref(10)
const documentsLoading = ref(false)

//// ------------------parameters -----------------------////

//const associated_Model = ''


// Exclude documents from the initial project load; fetch documents separately by project id
const associated_multiple_models = ['county', 'subcounty', 'ward', 'component', 'programme', 'project_team', 'project_contractor', 'project_location']
const nested_models = [] // no nested documents on initial load

function formatSentence(text) {
  // Replace underscores and periods with spaces
  let formattedText = String(text).replace(/[_\.]/g, ' ');

  // Capitalize the first letter of each word
  formattedText = formattedText
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Trim any leading or trailing spaces
  formattedText = formattedText.trim();

  // Remove extra spaces between words
  formattedText = formattedText.replace(/\s+/g, ' ');

  return formattedText;
}

const dashDisplay = (v: unknown) =>
  v === null || v === undefined || v === '' ? '—' : v

const isDateOnlyString = (v: unknown) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())

const parseDisplayDate = (v: unknown): Date | null => {
  if (v === null || v === undefined || v === '') return null
  const d = v instanceof Date ? v : new Date(v as string)
  return Number.isNaN(d.getTime()) ? null : d
}

const formatDateDisplay = (v: unknown) => {
  const d = parseDisplayDate(v)
  if (!d) return v === null || v === undefined || v === '' ? '—' : String(v)
  const useUtc = isDateOnlyString(v)
  const day = String(useUtc ? d.getUTCDate() : d.getDate()).padStart(2, '0')
  const month = String(useUtc ? d.getUTCMonth() + 1 : d.getMonth() + 1).padStart(2, '0')
  const year = useUtc ? d.getUTCFullYear() : d.getFullYear()
  return `${day}/${month}/${year}`
}

const formatDateTimeDisplay = (v: unknown) => {
  const d = parseDisplayDate(v)
  if (!d) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const formatDateForInput = (v: unknown) => {
  const d = parseDisplayDate(v)
  if (!d) return ''
  const useUtc = isDateOnlyString(v)
  const day = String(useUtc ? d.getUTCDate() : d.getDate()).padStart(2, '0')
  const month = String(useUtc ? d.getUTCMonth() + 1 : d.getMonth() + 1).padStart(2, '0')
  const year = useUtc ? d.getUTCFullYear() : d.getFullYear()
  return `${year}-${month}-${day}`
}

const formatCostDisplay = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return `KSh. ${n.toLocaleString()}`
}

const formatAmountDisplay = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const normalizeImplementationScope = (scope: unknown) =>
  String(scope || '').trim().toLowerCase()

const descriptionSchema = [
  { field: 'title', label: 'Title' },
  { field: 'project_code', label: 'Contract No.' },
  { field: 'programme_id', label: 'Programme', span: 2 },
  { field: 'component_id', label: 'Component', span: 2 },
  { field: 'description', label: 'Description' },
]

const implementationSchema = [
  { field: 'status', label: 'Status' },
  { field: 'implementation_scope', label: 'Implementation Level' },
]

const scheduleSchema = [
  { field: 'start_date', label: 'Commencement Date' },
  { field: 'end_date', label: 'Completion Date' },
  { field: 'cost', label: 'Total Project Cost' },
]

const metadataSchema = [
  { field: 'createdBy', label: 'Created by' },
  { field: 'createdAt', label: 'Created' },
  { field: 'updatedAt', label: 'Last updated' },
]

const readonlyInlineDescription: string[] = []
const readonlyInlineMetadata = ['createdBy', 'createdAt', 'updatedAt']
const inlineTextareaFields = ['title', 'description']
const inlineClampFields = ['description']
const inlineNumberFields = ['cost']
const inlineDateFields = ['start_date', 'end_date']
const inlineSelectFields = ['status', 'implementation_scope']
const inlineDescriptionSelectFields = ['programme_id', 'component_id']

const inlineProgrammeOptions = ref<Array<{ label: string; value: number }>>([])
const inlineProgrammeRecords = ref<Array<Record<string, any>>>([])
const inlineComponentOptions = ref<Array<{ label: string; value: number; programmeId?: number }>>([])

const projectInlineSelectOptions = computed(() => ({
  status: [
    { label: 'Planned', value: 'Planned' },
    { label: 'Ongoing', value: 'Ongoing' },
    { label: 'Suspended', value: 'Suspended' },
    { label: 'Completed', value: 'Completed' },
  ],
  implementation_scope: [
    { label: 'National', value: 'national' },
    { label: 'County', value: 'county' },
    { label: 'Subcounty', value: 'subcounty' },
    { label: 'Ward', value: 'ward' },
    { label: 'Settlement', value: 'settlement' },
  ],
  programme_id: inlineProgrammeOptions.value,
  component_id: inlineComponentOptions.value,
}))

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('descriptions')

const collapsedSections = reactive({
  description: false,
  implementation: true,
  schedule: true,
  metadata: true,
})

const inlineSavingField = ref<string | null>(null)

const canEditProjectInline = computed(
  () => showEditButtons.value && canEditProjectMeta.value,
)

const projectProfile = reactive({
  title: '',
  project_code: '',
  programme_id: null as number | null,
  component_id: null as number | null,
  description: '',
  status: '',
  implementation_scope: '',
  start_date: '',
  end_date: '',
  cost: null as number | null,
})

function resolveProgrammeId(data: Record<string, any> | null | undefined): number | null {
  if (!data) return null
  const id =
    data.programme?.id ?? data.component?.programme_id ?? data.component?.programme?.id
  return id != null && id !== '' ? Number(id) : null
}

async function loadInlineProgrammeOptions() {
  if (inlineProgrammeOptions.value.length > 0) return

  const res = await getSettlementListByCounty({
    limit: 500,
    page: 1,
    model: 'programme',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: [],
  } as any)

  inlineProgrammeRecords.value = (res as any).data || []
  inlineProgrammeOptions.value = inlineProgrammeRecords.value.map((p: any) => ({
    value: Number(p.id),
    label: formatProgrammeSelectLabel(p),
  }))
}

async function loadInlineComponentOptions() {
  if (inlineComponentOptions.value.length > 0) return

  await loadInlineProgrammeOptions()

  const res = await getSettlementListByCounty({
    limit: 500,
    page: 1,
    model: 'component',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: [],
  } as any)

  inlineComponentOptions.value = ((res as any).data || [])
    .map((component: any) => {
      const componentProgrammeId = Number(component.programme_id ?? component.programme?.id)
      const programmePath = getProgrammePathLabels(
        componentProgrammeId,
        inlineProgrammeRecords.value
      )
      const componentLabel = formatComponentSelectLabel(component)
      return {
        value: Number(component.id),
        programmeId: componentProgrammeId,
        label: formatProgrammeComponentSelectLabel(programmePath, componentLabel),
      }
    })
    .filter((option) => !Number.isNaN(option.value))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function getInlineComponentsForProgramme(programmeId: number) {
  return inlineComponentOptions.value.filter((option) => option.programmeId === programmeId)
}

async function refreshProjectProgrammeComponent(data: Record<string, any>) {
  if (!data?.component_id) return

  const compRes = await getOneSettlement({
    model: 'component',
    id: data.component_id,
    assocModel: 'programme',
  } as any)

  if (compRes?.data) {
    data.component = compRes.data
    if (compRes.data.programme) {
      data.programme = compRes.data.programme
    } else if (compRes.data.programme_id) {
      const progRes = await getOneSettlement({
        model: 'programme',
        id: compRes.data.programme_id,
      } as any)
      if (progRes?.data) data.programme = progRes.data
    }
  }

  await loadInlineComponentOptions()
}

function resolveComponentTitle(data: Record<string, any> | null | undefined) {
  const component = data?.component
  if (!component) return null
  return component.title || component.acronym || component.name || null
}

function resolveProgrammeTitle(data: Record<string, any> | null | undefined) {
  return data?.programme?.title || data?.component?.programme?.title || null
}

async function enrichProjectProgrammeComponent(data: Record<string, any> | null | undefined) {
  if (!data?.component_id) return

  const hasComponent = Boolean(resolveComponentTitle(data))
  const hasProgramme = Boolean(resolveProgrammeTitle(data))
  if (hasComponent && hasProgramme) return

  try {
    const compRes = await getOneSettlement({
      model: 'component',
      id: data.component_id,
      assocModel: 'programme',
    } as any)
    if (!compRes?.data) return

    if (!hasComponent) data.component = compRes.data
    if (!hasProgramme && compRes.data.programme) {
      data.programme = compRes.data.programme
    } else if (!hasProgramme && compRes.data.programme_id) {
      const progRes = await getOneSettlement({
        model: 'programme',
        id: compRes.data.programme_id,
      } as any)
      if (progRes?.data) data.programme = progRes.data
    }
  } catch {
    // Non-fatal; description fields fall back to em dash.
  }
}

function syncProjectProfileFromData(data: Record<string, any> | null | undefined) {
  if (!data) return
  projectProfile.title = data.title ?? ''
  projectProfile.project_code = data.project_code || data.code || ''
  projectProfile.programme_id = resolveProgrammeId(data)
  projectProfile.component_id =
    data.component_id != null && data.component_id !== ''
      ? Number(data.component_id)
      : null
  projectProfile.description = data.description ?? ''
  projectProfile.status = data.status ?? ''
  projectProfile.implementation_scope = normalizeImplementationScope(data.implementation_scope) || ''
  projectProfile.start_date = formatDateForInput(data.start_date)
  projectProfile.end_date = formatDateForInput(data.end_date)
  const costNum = data.cost != null && data.cost !== '' ? Number(data.cost) : null
  projectProfile.cost = costNum != null && Number.isFinite(costNum) ? costNum : null
}

function buildInlineProjectPayload(field: string, value: unknown) {
  const d = projectFullData.value
  if (!d) throw new Error('Project not loaded')
  return {
    model: 'project',
    id: d.id,
    title: d.title,
    project_code: d.project_code ?? d.code,
    code: d.code,
    component_id: d.component_id,
    implementation_id: d.implementation_id,
    status: d.status,
    description: d.description,
    start_date: d.start_date,
    end_date: d.end_date,
    cost: d.cost,
    implementation_scope: d.implementation_scope,
    sourceFunding: d.sourceFunding,
    [field]: value,
  }
}

async function saveProjectInline(payload: { field: string; value: unknown }) {
  if (!canEditProjectInline.value) {
    ElMessage.warning('You do not have permission to edit this project.')
    return
  }

  const { field, value } = payload
  const data = projectFullData.value
  if (!data?.id) return

  let apiValue: unknown = value
  if (field === 'cost') {
    if (value === '' || value == null) {
      apiValue = null
    } else {
      const n = Number(value)
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
        ElMessage.error('Enter a valid whole-number cost in KSh')
        return
      }
      apiValue = n
    }
  }

  if (field === 'start_date' || field === 'end_date') {
    apiValue = value === '' || value == null ? null : value
    const start =
      field === 'start_date' ? (apiValue as string) : formatDateForInput(data.start_date)
    const end =
      field === 'end_date' ? (apiValue as string) : formatDateForInput(data.end_date)
    if (start && end && new Date(start) > new Date(end)) {
      ElMessage.error('Completion date must be after commencement date')
      return
    }
  }

  if (field === 'title' && (apiValue == null || String(apiValue).trim() === '')) {
    ElMessage.error('Project title is required')
    return
  }

  if (field === 'project_code' && (apiValue == null || String(apiValue).trim() === '')) {
    ElMessage.error('Contract number is required')
    return
  }

  if (field === 'component_id') {
    const componentId = Number(apiValue)
    if (!componentId) {
      ElMessage.error('Component is required')
      return
    }
    apiValue = componentId
  }

  if (field === 'programme_id') {
    const programmeId = Number(apiValue)
    if (!programmeId) {
      ElMessage.error('Programme is required')
      return
    }

    try {
      inlineSavingField.value = field
      await loadInlineComponentOptions()
      const componentsForProgramme = getInlineComponentsForProgramme(programmeId)

      let componentId = Number(data.component_id)
      if (!componentsForProgramme.some((opt) => opt.value === componentId)) {
        componentId = componentsForProgramme[0]?.value ?? 0
      }
      if (!componentId) {
        ElMessage.error('No component available under this programme')
        return
      }

      await updateOneRecord(buildInlineProjectPayload('component_id', componentId) as any)
      data.component_id = componentId
      await refreshProjectProgrammeComponent(data)
      syncProjectProfileFromData(data)
      ElMessage.success('Saved')
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Could not save project'
      ElMessage.error(message)
    } finally {
      inlineSavingField.value = null
    }
    return
  }

  try {
    inlineSavingField.value = field
    await updateOneRecord(buildInlineProjectPayload(field, apiValue) as any)

    data[field] = apiValue
    if (field === 'project_code') {
      data.project_code = apiValue
    }
    if (field === 'title') {
      project_title.value = apiValue as string
    }
    if (field === 'implementation_scope') {
      const scope = normalizeImplementationScope(apiValue)
      implementation_scope.value = scope || 'settlement'
      isNationalProject.value = scope === 'national'
    }
    if (field === 'component_id') {
      data.component_id = apiValue
      await refreshProjectProgrammeComponent(data)
    }

    syncProjectProfileFromData(data)
    ElMessage.success('Saved')
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Could not save project'
    ElMessage.error(message)
  } finally {
    inlineSavingField.value = null
  }
}

const projectMetadata = reactive({
  createdBy: '—',
  createdAt: '—',
  updatedAt: '—',
})

async function resolveCreatedByDisplay(data: Record<string, any> | null | undefined) {
  if (!data) return '—'
  const creatorUser = data.users ?? data.user
  if (creatorUser && typeof creatorUser === 'object') {
    const name = creatorUser.name != null ? String(creatorUser.name).trim() : ''
    const email = creatorUser.email != null ? String(creatorUser.email).trim() : ''
    return name || email || '—'
  }

  const createdById = data.createdBy
  if (createdById == null || createdById === '') return '—'

  try {
    const res = await getOneSettlement({ model: 'users', id: createdById } as any)
    const user = (res as any)?.data
    if (user?.name || user?.email) {
      return String(user.name || user.email)
    }
  } catch {
    // Fall back to numeric id when user lookup fails.
  }

  return String(createdById)
}

async function loadProjectMetadata(data: Record<string, any> | null | undefined) {
  projectMetadata.createdBy = await resolveCreatedByDisplay(data)
  projectMetadata.createdAt = formatDateTimeDisplay(data?.createdAt ?? data?.created_at)
  projectMetadata.updatedAt = formatDateTimeDisplay(data?.updatedAt ?? data?.updated_at)
}


const activityOptions = ref([])

const sortedActivityOptions = computed(() =>
  [...activityOptions.value].sort((a, b) =>
    String(a.title || a.label || '').localeCompare(String(b.title || b.label || ''), undefined, {
      sensitivity: 'base',
    })
  )
)

const DocTypes = ref([])
const DocTypesFiltered = ref([])
const DocTypesAll = ref([])
const DocCategories= ref([])
const getDocumentTypes = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'document_type',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response) => {
    //tableDataList.value = response.data
    var ret = response.data
    console.log('filterOptions---Docypes-x', response.data)
    DocCategories.value=response.data

    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cur);
      return acc;
    }, {});

    //console.log(nestedData.Map)
    for (let property in nestedData) {
      let opts = nestedData[property];
      var doc = {}
      doc.label = property
      doc.options = []

      opts.forEach(function (arrayItem) {
        let opt = {}
        opt.value = arrayItem.id
        opt.label = arrayItem.type
        doc.options.push(opt)

      })
      //    console.log('doc, ', doc)

      DocTypes.value.push(doc)
      DocTypesFiltered.value.push(doc)
      DocTypesAll.value.push(doc)


    }

  })


  //DocTypes.value = DocTypesFiltered.value


console.log(  'DocCategories.value',  DocCategories.value)

}

const documentCategoryOptions = ref<Array<{ value: number; label: string; group: string }>>([])

const loadDocumentCategories = async () => {
  try {
    const response = await getCountyListApi({
      params: {
        pageIndex: 1,
        limit: 1000,
        curUser: 1,
        model: 'document_category',
        searchField: 'title',
        searchKeyword: '',
        sort: 'ASC',
      },
    })
    documentCategoryOptions.value = ((response as any).data || []).map((item: any) => ({
      value: Number(item.id),
      label: String(item.title || item.name || item.id),
      group: String(item.title || item.name || 'Other'),
    }))
  } catch (error) {
    console.error('Error loading document categories:', error)
    documentCategoryOptions.value = []
  }
}

function appendDocumentTypeOption(record: { id: number; type: string; group?: string | null }) {
  const groupLabel = String(record.group || 'Other').trim() || 'Other'
  const ensureGroup = (collection: typeof DocTypes.value) => {
    let group = collection.find((entry: any) => entry.label === groupLabel)
    if (!group) {
      group = { label: groupLabel, options: [] }
      collection.push(group)
    }
    const opt = { value: Number(record.id), label: String(record.type) }
    if (!group.options.some((entry: any) => entry.value === opt.value)) {
      group.options.push(opt)
    }
  }
  ensureGroup(DocTypes.value)
  ensureGroup(DocTypesFiltered.value)
  ensureGroup(DocTypesAll.value)
}


const getActivities = async () => {

  const formData = {}
  formData.model = 'activity'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = '' 
  formData.returnAll = true
  formData.excludeGeom = false
  formData.associated_multiple_models = []

  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  const res = await searchByKeyWord(formData)

  console.log("res.data", res.data)

  if (res.data && res.data.length > 0) {
    activityOptions.value = res.data.map(item => ({
      value: item.id,
      id: item.id,
      label: item.title,
      title: item.title,
      code: item.code,

    }));

  }


}


const contractorOptions = ref([])



const getContractors = async (project_id) => {

  const formData = {}
  formData.model = 'contractor'
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = []



  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)



  if (res.data && res.data.length > 0) {
    contractorOptions.value = res.data.map(item => ({
      value: item.id,
      id: item.id,
      label: item.name,
      name: item.name,
      code: item.code,

    }));

  }

}



const getProjecteam = async (project_id) => {

  const formData = {}
  formData.model = 'project_team'
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = []



  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)

  projectTeamData.value = res.data
  syncTeamRolesFromMembers(res.data)



}


const getProjecContractors = async (project_id) => {

  const formData = {}
  formData.model = 'project_contractor'
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = []



  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)

  projectContractors.value = res.data



}



const getprojectDisbursements = async (project_id) => {

  const formData = {}
  formData.model = 'disbursement'
  formData.excludeGeom = false
  formData.associated_multiple_models = []
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]
  // Bust any cached list so ledger / IPC refs stay current after saves
  formData.cache_key = `disbursement_${project_id}_${Date.now()}`

  const res = await getSettlementListByCounty(formData)

  projectDisbursements.value = res.data || []
  await loadIpcDocuments()
}










const getLocations = async (
  project_id,
  page = locationCurrentPage.value,
  size = locationPageSize.value
) => {

  const formData = {}
  formData.model = 'project_location'
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = ['county', 'subcounty', 'ward', 'settlement']



  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]
  if (page && size) {
    formData.page = page
    formData.limit = size
  }

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)

  const incoming = res.data || []
  if (page && page > 1 && Array.isArray(projectLocations.value)) {
    const existingIds = new Set(projectLocations.value.map((loc: any) => loc.id))
    const merged = [
      ...projectLocations.value,
      ...incoming.filter((loc: any) => !existingIds.has(loc.id))
    ]
    projectLocations.value = merged
  } else {
    projectLocations.value = incoming
  }
  projectLocationsTotal.value = res.total ?? projectLocations.value.length


  console.log('Locations:', project_id, res)

}

 

const getProjectDocuments = async (
  field,
  fieldValue,
  options: { paginate?: boolean; page?: number; size?: number } = {}
) => {
  const paginate = options.paginate !== false
  const page = options.page ?? docsCurrentPage.value
  const size = options.size ?? docsPageSize.value

  const formData: any = {}
  formData.model = 'document'
  formData.excludeGeom = false
  formData.associated_multiple_models = []

  // - multiple filters -------------------------------------
  formData.filters = [field]
  formData.filterValues = [fieldValue]
  if (paginate) {
    formData.page = page
    formData.limit = size
  }

  try {
    const res = await getSettlementListByCounty(formData as any)

    const resAny: any = res as any
    const docsData = resAny?.data || []
    const totalFromApi =
      resAny?.total ??
      resAny?.totalCount ??
      resAny?.count ??
      resAny?.results?.total ??
      resAny?.results?.totalCount ??
      resAny?.results?.count ??
      resAny?.pagination?.total ??
      resAny?.meta?.total
    projectDocumentsTotal.value = totalFromApi ?? docsData.length

    const enrichedDocs = docsData.map((doc: any) => {
      const match = DocCategories.value.find((item: any) => item.id == doc.category)
      if (match) {
        doc.type = match.type
      }
      // Set deletable property based on permissions
      doc.deletable = canUserDeleteDocument(doc)
      return doc
    })

    // When paginating, append to existing docs to keep earlier pages in memory.
    if (paginate && page > 1 && Array.isArray(projectDocuments.value)) {
      const existingIds = new Set(projectDocuments.value.map((doc: any) => doc.id))
      const merged = [
        ...projectDocuments.value,
        ...enrichedDocs.filter((doc: any) => !existingIds.has(doc.id))
      ]
      projectDocuments.value = merged
    } else if (paginate) {
      projectDocuments.value = enrichedDocs
    }

    return enrichedDocs || [] // Return the result data or an empty array if no data
  } catch (error) {
    console.error('Error fetching project documents:', error)
    return [] // Return an empty array if there is an error
  }
};

const refreshProjectDocuments = async (page?: number) => {
  documentsLoading.value = true
  try {
    if (page != null) {
      docsCurrentPage.value = page
    }
    await getProjectDocuments(
      'project_id',
      [project_id.value],
      { paginate: true, page: docsCurrentPage.value, size: docsPageSize.value }
    )
    try {
      const linkedRes: any = await getLinkedDocuments({
        entity_type: 'project',
        entity_id: Number(project_id.value),
      })
      if (linkedRes?.data?.length) {
        const existingIds = new Set((projectDocuments.value as any[]).map((d: any) => d.id))
        const extras = linkedRes.data
          .filter((d: any) => !existingIds.has(d.id))
          .map((d: any) => ({ ...d, _isLinked: true, deletable: false }))
        if (extras.length) {
          projectDocuments.value = [...(projectDocuments.value as any[]), ...extras]
          projectDocumentsTotal.value = (projectDocumentsTotal.value || 0) + extras.length
        }
      }
    } catch {
      // non-fatal
    }
  } finally {
    documentsLoading.value = false
  }
}


const indicatorReports = ref([])
const getIndicatorCategoryReports = async (projectId) => {

  const model = 'indicator_category_report'
  const associated_multiple_models = ['document', 'project', 'county', 'subcounty', 'ward', 'users', 'indicator_category']
  //const nested_models = ['indicator_category', 'indicator'] // The mother, then followed by the child
  const nested_models = ['activity', 'project']  // The mother, then followed by the child



  const formData = {}
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.excludeGeom = false
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[projectId]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', projectId)
  //indicatorReports.value = res.data
  res.data.forEach(item => indicatorReports.value.push(item));

  const indicatorReportIds = res.data.map(item => item.id);
  console.log('indicatorReportIds',indicatorReportIds)

 const reportDocs = await getProjectDocuments('report_id', indicatorReportIds, { paginate: false })

      
      // Check if the documents from reportDocs already exist in projectDocuments.value
      const uniqueReportDocs = reportDocs.filter(doc => {
        // Check if the document's ID already exists in projectDocuments.value
        return !projectDocuments.value.some(existingDoc => existingDoc.id === doc.id);
      });

      // Push only the unique documents that don't exist yet
      if (uniqueReportDocs.length > 0) {
        projectDocuments.value.push(...uniqueReportDocs);
        console.log('Updated projectDocuments:', projectDocuments.value);
      } else {
        console.log('No new documents to add.');
      }

 

}

const AddDialogVisible = ref(false)
const showSubmitBtn = ref(false)

const AddReport = () => {
  AddDialogVisible.value = true
  console.log('addign report')
  showSubmitBtn.value = true
}

const ShowLocationAddDialog = ref(false)
const AddLocation = () => {
  ShowLocationAddDialog.value = true

}




const projectFullData = ref<Record<string, any>>()

const projectStatusTagType = computed(() => {
  const s = String(projectFullData.value?.status || '').toLowerCase()
  if (s === 'completed') return 'success'
  if (s === 'ongoing') return 'primary'
  if (s === 'suspended') return 'warning'
  if (s === 'planned') return 'info'
  return 'info'
})

const indicatorsOptions = ref([])
const indicatorsOptionsFiltered = ref([])

const getIndicatorNames = async () => {
  console.log('getIndicatorNames >>>>>>>>>>>>>>>>>>>>>>>>>>>>');

  const formData = {
    curUser: 1,
    model: 'indicator_category',
    searchField: 'name',
    searchKeyword: '',
    assocModel: '',
    filters: [],
    filterValues: [],
    associated_multiple_models: ['project', 'category', 'indicator'],
    nested_models: ['activity', 'project'],
  };

  const res = await getSettlementListByCounty(formData);
  console.log('indicator_category Response:', res);

  res.data.forEach((arrayItem) => {
    // console.log('=====>', arrayItem);

    const opt = {
      value: arrayItem.id,
      label: `${arrayItem.indicator_name} | ${arrayItem.category.category}`,
      title: arrayItem.category.title,
      activity_id: arrayItem.activity ? arrayItem.activity.id : null,
      unit: arrayItem.indicator.unit,
    };

    //  console.log(opt)
    // Collect only output indicators
    ///if (arrayItem.indicator_level === 'activity') {
    indicatorsOptions.value.push(opt);
    indicatorsOptionsFiltered.value.push(opt);
    //  }


  });


};




const getProjectActivityIndicators = async (activity_ids) => {
  const formData = {}

  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------


  formData.filters = ['activity_id']
  formData.filterValues = [activity_ids]


  formData.associated_multiple_models = ['indicator']

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('This Project  Idnicator configs', res.data)
  return res.data
}

const getProjectProjectOutcomeIndicators = async () => {
  const formData = {}

  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------


  formData.filters = ['indicator_level']
  formData.filterValues = ['project']


  formData.associated_multiple_models = ['indicator']

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('This Project  level  indicaors', res.data)
  return res.data
}

const getProjectActivities = async (project_id) => {
  const formData = {
    model: 'project_activity',
    searchField: 'title',
    searchKeyword: '',
    filters: ['project_id'],
    filterValues: [[project_id]],
    associated_multiple_models: [],
  };

  const res = await getSettlementListByCounty(formData);

  console.log('This Project Activiies...:', res.data);

  // Return an array of ids
  const activityIds = res.data.map(activity => activity.activity_id);

  return activityIds;
};



const changeProject = async (project: any) => {


  ruleForm.project_location_id = null
  ruleForm.project_id = project


  let project_activities = []
  let sel_indicators = []
  let outcome_indicators = []

  console.log('changeProject', project)




  project_activities = await getProjectActivities(project)
  projectScopeChecked.value = project_activities
  sel_indicators = await getProjectActivityIndicators(project_activities)

  console.log('project_activities', project_activities)




  outcome_indicators = await getProjectProjectOutcomeIndicators()

  console.log('outcome_indicators', outcome_indicators)




  console.log('sel_indicators', sel_indicators)



  console.log('outcome_indicators', outcome_indicators)


  // Merging the two arrays
  const merged_indicators = [...sel_indicators, ...outcome_indicators];

  console.log('merged_indicators', merged_indicators)

  const transformedArray = merged_indicators.map(item => {
    //  console.log(item)
    return {
      label: item.indicator.name + ' ' + item.category_title,
      value: item.id,
      project_id: item.project_id,
      unit: item.indicator.unit,
      activity_id: item.activity_id,
     };
  });

  indicatorsOptionsFiltered.value = transformedArray

  console.log('transformedArray', transformedArray)








}



const projectGeom = ref()
const projectScope = ref()
const projectTeamData = ref()
const projectContractors = ref()
const projectLocations = ref([])
const projectLocationsTotal = ref(0)
const projectDisbursements = ref()

// Clock-in related data
const clockInHistory = ref([])
const clockDateRange = ref([]) // [startDate, endDate]
const clockMonth = ref(null)   // single month
const downloadClockLoading = ref(false)

// Format YYYY-MM-DD
const formatYMD = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const project_title = ref()
const isLoading = ref(false)
const project_id = ref(route.params.id)


const implementation_scope = ref('settlement')
const isNationalProject = ref(false)
const programme_implementation_id = ref()

const projectTabStorageKey = (id: string | string[]) => `projectActiveTab:${id}`

// Allow deep-linking to a specific tab, e.g. /prj/169?tab=map
const activeName = ref(
  typeof route.query.tab === 'string' && route.query.tab ? route.query.tab : 'details'
)

const loadProjectDetails = async (id: string | string[]) => {
  isLoading.value = true
  project_id.value = id
  const formData: Record<string, any> = {}
  formData.model = 'project'
  formData.id = id
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  const res = await getOneSettlement(formData)

  await enrichProjectProgrammeComponent(res.data)
  await loadInlineProgrammeOptions()
  await loadInlineComponentOptions()
  projectFullData.value = res.data
  project_title.value = projectFullData.value?.title
  syncProjectProfileFromData(res.data)
  await loadProjectMetadata(res.data)
  projectDocuments.value = []
  projectDocumentsTotal.value =
    res.data?.total_documents ??
    res.data?.documents?.length ??
    projectDocuments.value.length
  projectScope.value = res.data.activities
  projectTeamData.value = res.data.project_teams
  await loadSharedTeamRoles()
  syncTeamRolesFromMembers(res.data.project_teams)
  projectContractors.value = res.data.project_contractors

  const scope = normalizeImplementationScope(res.data?.implementation_scope)
  implementation_scope.value = scope || 'settlement'
  isNationalProject.value = scope === 'national'

  programme_implementation_id.value = res.data.implementation_id

  await getDocumentTypes()
  await loadDocumentCategories()

  getActivities()
  getContractors(id)
  await getLocations(id, locationCurrentPage.value, locationPageSize.value)
  getProjecteam(id)
  getProjecContractors(id)
  projectDocuments.value = await getProjectDocuments(
    'project_id',
    [id],
    { paginate: true, page: docsCurrentPage.value, size: docsPageSize.value }
  )

  try {
    const linkedRes: any = await getLinkedDocuments({ entity_type: 'project', entity_id: Number(id) })
    if (linkedRes?.data?.length) {
      const existingIds = new Set((projectDocuments.value as any[]).map((d: any) => d.id))
      const extras = linkedRes.data
        .filter((d: any) => !existingIds.has(d.id))
        .map((d: any) => ({ ...d, _isLinked: true, deletable: false }))
      if (extras.length) {
        projectDocuments.value = [...(projectDocuments.value as any[]), ...extras]
        projectDocumentsTotal.value = (projectDocumentsTotal.value || 0) + extras.length
      }
    }
  } catch {
    // non-fatal
  }

  getprojectDisbursements(id)
  getIndicatorCategoryReports(id)

  ruleForm.subcounty_id = projectFullData.value.subcounty_id
  ruleForm.ward_id = projectFullData.value.ward_id
  ruleForm.county_id = projectFullData.value.county_id

  getIndicatorNames()
  projectGeom.value = res.data
  isLoading.value = false

  changeProject(id)

  const savedTab = localStorage.getItem(projectTabStorageKey(id))
  if (savedTab) {
    activeName.value = savedTab
  } else if (typeof route.query.tab === 'string' && route.query.tab) {
    activeName.value = route.query.tab
  }
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
  loadProjectDetails(route.params.id)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadProjectDetails(newId)
    }
  }
)






const sortedprojectLogs = computed(() => {
  return projectLogs.value.slice().sort((a, b) => new Date(b.date_actioned) - new Date(a.date_actioned));
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
  date_actioned: null,
  prev_status: null,
  new_status: null,
  fileList: [],
});




const dialogFormVisible = ref(false)
const handlePreview = (file) => {
  console.log('Preview:', file);
};

const handleRemove = (file, fileList) => {
  console.log('Remove:', file, fileList);
};

const beforeRemove = () => {
  return true;
};

const handleExceed = () => {
  ElMessage.warning('You can only upload up to 3 files.');
};



const validateFileUploads = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('Please input the password'))
  } else {
    if (form.value.fileList.length == 0) {
      console.log("Error,", form.value)
      callback(new Error('Please upload at least one document'));
    }
    callback()
  }
}




const dynamicFormRef = ref<FormInstance>()



const uploadFiles = async (action_id, grievance_id) => {
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

  //const res =  await uploadprojectDocuments(formData)

  console.log("Docuemnts Uploaded", res)




}

const viewLoading = ref(false)
const downloadingDocId = ref<number | null>(null)

const downloadFile = async (data) => {
  console.log(data);
  viewLoading.value = true;
  downloadingDocId.value = data.id || null
  const formData: Record<string, unknown> = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  const isIpcDoc = data.disbursement_id != null

  window.addEventListener('beforeunload', () => {
    if (viewLoading.value) {
      console.log('Download has started.');
      viewLoading.value = false;
    }
  });

  try {
    const response = isIpcDoc
      ? await downloadIpcDocument(formData as { filename?: string; doc_id?: number })
      : await getFile(formData);
    console.log(response);

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', data.name);
    document.body.appendChild(link);
    link.click();
    viewLoading.value = false;
    downloadingDocId.value = null
  } catch (error) {
    ElMessage.error('Failed');
    viewLoading.value = false;
    downloadingDocId.value = null
  }
};




let nmap; // Declare the map variable outside the function for scope

 



const icon = ref(`<button>  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)

const showSatellite = ref(false)

const toggleFloatingDiv = async (nmap) => {
  showSatellite.value = !showSatellite.value;
  console.log('Show Satellite', showSatellite.value);

  // Get the map style
  let style = nmap.getStyle();

  // Get all layers
  let allLayers = style.layers;

  // Log all layers to the console
  console.log('before ', allLayers);



  if (!showSatellite.value) {
    console.log('Remove Satellte');


    if (nmap.getLayer('Satellite')) {
      nmap.removeLayer('Satellite');
      nmap.removeSource('Satellite');

    }


  } else {

    console.log('Add Satellte');

    if (nmap.getLayer('Satellite')) {
      nmap.removeLayer('Satellite');
      nmap.removeSource('Satellite');

    } else {

      icon.value = `<button>  <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-satellite" fill="#f20707"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>650</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g fill="#fb0e0e"> <path d="M12.495,5.893 C12.832,6.231 14.184,4.877 13.847,4.541 L10.864,1.557 C10.526,1.219 9.174,2.573 9.51,2.909 L12.495,5.893 L12.495,5.893 Z" class="si-glyph-fill"> </path> <path d="M3.288,10.897 C3.072,10.68 2.597,10.802 2.23,11.168 C1.863,11.536 1.742,12.009 1.959,12.228 L3.233,13.501 C3.45,13.719 3.922,13.597 4.289,13.23 C4.658,12.864 4.779,12.388 4.562,12.172 L3.288,10.897 L3.288,10.897 Z" class="si-glyph-fill"> </path> <rect transform="translate(2.240100, 2.131300) rotate(-44.991897) translate(-2.240100, -2.131300) " x="-0.25987605" y="1.13130958" width="4.96295245" height="1.95398128" class="si-glyph-fill"> </rect> <path d="M12.088,8.374 L10.657,9.802 L9.918,9.063 L11.543,7.439 C11.814,7.168 11.81,6.723 11.531,6.447 L9.031,3.948 C8.757,3.673 8.314,3.67 8.043,3.939 L6.419,5.564 L5.684,4.829 L7.113,3.401 L5.718,2.007 L2.221,5.503 L3.614,6.897 L5.028,5.484 L5.763,6.219 L4.134,7.849 C3.864,8.12 3.866,8.564 4.141,8.838 L6.641,11.336 C6.917,11.612 7.363,11.617 7.632,11.346 L9.262,9.717 L10.001,10.456 L8.585,11.869 L9.967,13.25 L13.464,9.753 L12.088,8.374 L12.088,8.374 Z" class="si-glyph-fill"> </path> <rect transform="translate(13.426200, 12.673100) rotate(-45.056720) translate(-13.426200, -12.673100) " x="10.9262228" y="11.6731091" width="4.96795479" height="1.97998198" class="si-glyph-fill"> </rect> </g> </g> </g></svg> </button>`

      nmap.addLayer(
        {
          id: 'Satellite',
          source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
          type: "raster"
        },
        'country-label'
      );
    }



  }

  // Get the map style
  style = nmap.getStyle();

  // Get all layers
  allLayers = style.layers;

  // Log all layers to the console
  console.log('after', allLayers);

}

function toFeatureCollection(array) {

  console.log(array)
  return {
    type: "FeatureCollection",
    features: array.map(item => ({
      type: "Feature",
      geometry: JSON.parse(JSON.stringify(item.geom)), // remove Proxy/reactivity
      properties: Object.fromEntries(
        Object.entries(item).filter(([key]) => key !== "geom")
      )
    }))
  };
}




const locationsGeometry = ref()

// Computed data for paginated Locations
const paginatedProjectLocations = computed(() => {
  const list = Array.isArray(projectLocations.value) ? projectLocations.value : []
  const start = (locationCurrentPage.value - 1) * locationPageSize.value
  const end = start + locationPageSize.value
  return list.slice(start, end)
})

// Computed data for paginated Documentation
const paginatedProjectDocuments = computed(() => {
  const list = Array.isArray(projectDocuments.value) ? projectDocuments.value : []
  const start = (docsCurrentPage.value - 1) * docsPageSize.value
  const end = start + docsPageSize.value
  return list.slice(start, end)
})

// Pagination handlers
const handleLocationPageChange = async (page: number) => {
  locationCurrentPage.value = page
  await getLocations(project_id.value, page, locationPageSize.value)
}

const handleLocationSizeChange = async (size: number) => {
  locationPageSize.value = size
  locationCurrentPage.value = 1
  await getLocations(project_id.value, locationCurrentPage.value, size)
}

const handleDocsPageChange = async (page: number) => {
  docsCurrentPage.value = page
  await getProjectDocuments(
    'project_id',
    [project_id.value],
    { paginate: true, page, size: docsPageSize.value }
  )
}

const handleDocsSizeChange = async (size: number) => {
  docsPageSize.value = size
  docsCurrentPage.value = 1
  await getProjectDocuments(
    'project_id',
    [project_id.value],
    { paginate: true, page: docsCurrentPage.value, size }
  )
}

// Utility to compute running index across pages
const rowNumber = (index: number, page: number, size: number) => {
  return (page - 1) * size + index + 1
}

const handleTabClick = async (tab) => {
  localStorage.setItem(projectTabStorageKey(route.params.id), tab.props.name);

  if (tab.props.name === 'map') {
    // Delay the loadMap function
    locationsGeometry.value = toFeatureCollection(projectLocations.value)

    setTimeout(() => {
      loadAllLocationsMap(locationsGeometry.value); // Load map after a brief delay
    }, 500); // Delay in milliseconds (500 ms = 0.5 seconds)
  }

  if (tab.props.name === 'Scope') {
    projectScopeChecked.value = projectScope.value.map(activity => activity.id);

  }

  if (tab.props.name === 'documents') {
    await refreshProjectDocuments()
  }

  if (tab.props.name === 'disbursement') {
    await getprojectDisbursements(route.params.id)
  }

  if (tab.props.name === 'clockin') {
    getProjectClockIns(route.params.id);
  }
};

const addMoreDocuments = ref(false)

function resetUploadDialog() {
  morefileList.value = []
  documentCategory.value = undefined
  showUpload.value = false
  protectedFile.value = false
  loadingPosting.value = false
}

function toggleComponent() {
  resetUploadDialog()
  addMoreDocuments.value = true
}



const count = ref(0)
const morefileList = ref([])
const documentCategory = ref()

const showUpload = ref(false)

const handleSelect = async (selected) => {
  showUpload.value = true
}

const protectedFile = ref(false)


const loadingPosting = ref(false)


const submitMoreDocuments = async () => {
  if (!documentCategory.value) {
    ElMessage.error('Select a document type')
    return
  }

  if (morefileList.value.length === 0) {
    ElMessage.error('Select at least one file!')
    return
  }

  loadingPosting.value = true

  try {
    const formData = new FormData()

    for (let i = 0; i < morefileList.value.length; i++) {
      const file = morefileList.value[i]
      formData.append('model', 'project')
      formData.append('createdBy', userInfo.id)
      formData.append('files', file.raw)
      formData.append('format', file.name.split('.').pop())
      formData.append('category', documentCategory.value)
      formData.append('field_id', 'project_id')
      formData.append('protected', String(protectedFile.value))
      formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2))
      formData.append('code', uuid.v4())
      formData.append('project_id', String(route.params.id))
    }

    const res = await uploadFilesBatch(formData)

    if (res.code !== '0000') {
      ElMessage.error(res.message || 'Upload failed. Please try again.')
      return
    }

    ElMessage.success(
      morefileList.value.length > 1
        ? `${morefileList.value.length} documents uploaded successfully`
        : 'Document uploaded successfully'
    )

    addMoreDocuments.value = false
    resetUploadDialog()

    activeName.value = 'documents'
    await refreshProjectDocuments(1)
  } catch (error) {
    console.error('Document upload failed:', error)
    ElMessage.error('Failed to upload documents. Please try again.')
  } finally {
    loadingPosting.value = false
  }
}


const deleteRow = (index: number) => {
  projectScope.value.splice(index, 1)
}

const projectScopeChecked = ref([])

const selectedScopeActivityIds = computed(() => {
  const checked = projectScopeChecked.value
  return Array.isArray(checked) ? checked : []
})

const scopeTransferData = computed(() =>
  sortedActivityOptions.value.map((activity) => ({
    key: activity.id,
    label: String(activity.title || activity.label || 'Untitled activity'),
  }))
)

const selectedScopeCount = computed(() => selectedScopeActivityIds.value.length)
const totalScopeCount = computed(() => sortedActivityOptions.value.length)

const scopeActionButtonCount = computed(
  () => (canManageProjectScope.value ? 1 : 0) + (canCreateActivity.value ? 1 : 0)
)

const scopeActionColSpan = computed(() => (scopeActionButtonCount.value > 1 ? 12 : 24))

const updateChanges = async () => {
  // Assuming projectScope.value is an array of objects with an 'id' property
  //projectFullData.value.activities = projectScope.value.map(activity => activity.id);
  projectFullData.value.activities = projectScopeChecked.value;


  projectFullData.value.model = 'project'
  const res = await updateOneRecord(projectFullData.value)
  console.log('updated project Activties', res)
}


const ShowActivityAddDialog = ref(false)
const activitySubmitting = ref(false)




const activityFormRef = ref<FormInstance>()
const activityForm = reactive({
  title: '',
  shortTitle: '',
})

const activityFormRules = reactive<FormRules>({
  title: [
    { required: true, message: 'Please provide a title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' },
  ],
  shortTitle: [
    { required: true, message: 'Please provide a short title', trigger: 'blur' },
    { min: 2, message: 'Length should be at least 2 characters', trigger: 'blur' },
  ],
})

const openAddActivityDialog = () => {
  activityForm.title = ''
  activityForm.shortTitle = ''
  ShowActivityAddDialog.value = true
}

const closeAddActivityDialog = () => {
  ShowActivityAddDialog.value = false
  activityForm.title = ''
  activityForm.shortTitle = ''
  activityFormRef.value?.resetFields()
}

const submitNewActivity = async () => {
  if (!activityFormRef.value || activitySubmitting.value) return
  await activityFormRef.value.validate(async (valid) => {
    if (!valid) return
    activitySubmitting.value = true
    try {
      const payload = {
        model: 'activity',
        title: activityForm.title.trim(),
        shortTitle: activityForm.shortTitle.trim(),
        code: shortid.generate(),
      }
      const res = await CreateRecord(payload)
      const created = (res as any)?.data ?? res
      ElMessage.success('Activity added successfully')
      closeAddActivityDialog()
      await getActivities()
      if (created?.id != null && canManageProjectScope.value) {
        const checked = Array.isArray(projectScopeChecked.value) ? projectScopeChecked.value : []
        if (!checked.includes(created.id)) {
          projectScopeChecked.value = [...checked, created.id]
        }
      }
    } catch (error) {
      console.error('Failed to add activity:', error)
      ElMessage.error('Failed to add activity')
    } finally {
      activitySubmitting.value = false
    }
  })
}


// do not use same name with ref
const teamForm = ref({
  project_id: route.params.id,
  name: '',
  phone: '',
  role: '',
  email: null,
  code: shortid.generate()

})

function validateEmail(rule, value, callback) {
  if (!value) {
    callback(new Error('Email is required'));
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      callback(new Error('Invalid email format'));
    } else {
      callback();
    }
  }
}


const rules = ({
  name: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
    { min: 3, message: 'Length should be atleast 3 characters', trigger: 'blur' },
  ],

  phone: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
    { min: 9, message: 'Length should be at least 9 characters', trigger: 'blur' },
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' }, // Added email validation
  ],

  role: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
  ],
})


const AddTeamDialog = ref(false)

const DEFAULT_TEAM_ROLES = [
  'Project Manager',
  'Regional Lead',
  'CDH',
  'Clerk of Works',
  'Team Leader',
  'Resident Engineer (RE)',
  'Assistant Resident Engineer (ARE)',
  'Roads Engineer',
  'Materials Engineer',
  'Water & Sanitation Engineer',
  'Electrical Engineer',
  'Surveyor Engineer',
  'Environmental Expert',
  'Sociologist / Community / Resettlement Expert',
  'Socio-Economist',
  'Procurement and Contract Management Expert',
  'Works Inspector',
  'CAD Technician',
  'Laboratory Technicians',
  'Office Administrator',
  'Chainmen',
  'Other',
] as const

const sharedTeamRoles = ref<string[]>([])

async function loadSharedTeamRoles() {
  try {
    const res = await getUniqueFieldValues({ model: 'project_team', selectedField: 'role' })
    const rows = (res as any)?.data || []
    sharedTeamRoles.value = rows
      .map((row: { value?: unknown; label?: unknown }) => String(row.value ?? row.label ?? '').trim())
      .filter(Boolean)
  } catch {
    // Non-fatal; defaults still apply.
  }
}

const teamRoles = computed(() => {
  const merged = [...DEFAULT_TEAM_ROLES, ...sharedTeamRoles.value]
  return [...new Set(merged.map((r) => r.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
})

const teamRoleOptions = computed(() =>
  teamRoles.value.map((role) => ({ label: role, value: role })),
)

function rememberTeamRole(role: unknown) {
  const trimmed = String(role || '').trim()
  if (!trimmed || teamRoles.value.includes(trimmed)) return
  sharedTeamRoles.value = [...sharedTeamRoles.value, trimmed]
}

function syncTeamRolesFromMembers(members: Array<{ role?: unknown }> | null | undefined) {
  for (const member of members || []) {
    rememberTeamRole(member?.role)
  }
}

const AddTeam = async () => {
  await loadSharedTeamRoles()
  AddTeamDialog.value = true
}



const ruleFormRef = ref<FormInstance>()

const updateTeam = async () => {

  ruleFormRef.value.validate(async (valid: boolean) => {

    if (valid) {
      console.log('submit!')

      teamForm.value.model = 'project_team'

      const res = await CreateRecord(teamForm.value)

      rememberTeamRole(teamForm.value.role)
      projectTeamData.value.push(res.data)
      await loadSharedTeamRoles()
      AddTeamDialog.value = false




    } else {
      console.log('error submit!')
    }


  })


}

const RemoveTeamMember = async (row) => {
  if (!canUserDeleteTeamMember(row)) {
    ElMessage({
      message: 'You do not have permission to delete this team member. Only Super Admins, National Staff, or the County Admin who created this team member can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  let formData = {}
  formData.id = row.id
  formData.model = 'project_team'

  await DeleteRecord(formData);



  // remove the deleted object from array list 
  let index = projectTeamData.value.indexOf(row);
  if (index !== -1) {
    projectTeamData.value.splice(index, 1);
  }





}




// Fetch clock-in history for the project
const getProjectClockIns = async (project_id, params = {}) => {
  try {
    const res = await getClockInHistory({ project_id, ...params })
    clockInHistory.value = res.data || []
    console.log('Clock-in history:', clockInHistory.value)
  } catch (error) {
    console.error('Error fetching clock-in history:', error)
  }
}

// Format date and time
const formatDateTime = (dateString: unknown) => formatDateTimeDisplay(dateString)

// Apply filters (date range or month) to reload clock-ins
const applyClockFilters = () => {
  const params = {}

  if (clockDateRange.value && clockDateRange.value.length === 2 && clockDateRange.value[0] && clockDateRange.value[1]) {
    params.start_date = formatYMD(clockDateRange.value[0])
    params.end_date = formatYMD(clockDateRange.value[1])
  } else if (clockMonth.value) {
    const d = new Date(clockMonth.value)
    const first = new Date(d.getFullYear(), d.getMonth(), 1)
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    params.start_date = formatYMD(first)
    params.end_date = formatYMD(last)
  }

  getProjectClockIns(route.params.id, params)
}

const clearClockFilters = () => {
  clockDateRange.value = []
  clockMonth.value = null
  getProjectClockIns(route.params.id)
}

// Clock-in map preview
const clockDialogMap = ref(false)
const clockMapGeom = ref()

const openClockMap = (row) => {
  clockMapGeom.value = null
  if (row && row.geom) {
    clockMapGeom.value = { geom: row.geom }
  }
  // Fallback: if geom missing, try lat/lon if present
  if (!clockMapGeom.value && row && row.longitude && row.latitude) {
    clockMapGeom.value = {
      geom: {
        type: 'Point',
        coordinates: [Number(row.longitude), Number(row.latitude)]
      }
    }
  }
  if (!clockMapGeom.value) return
  clockDialogMap.value = true
  setTimeout(loadClockMap, 100)
}

const closeClockMap = () => {
  clockDialogMap.value = false
}

const loadClockMap = () => {
  try {
    const centroid = turf.centroid(clockMapGeom.value.geom)
    const mapCenter = centroid.geometry.coordinates
    const nmap = new mapboxgl.Map({
      container: 'clockMapContainer',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: mapCenter,
      zoom: 12,
    })

    nmap.on('load', () => {
      // Add base layers
      nmap.addLayer({
        id: 'Satellite',
        source: { type: 'raster', url: 'mapbox://mapbox.satellite', tileSize: 256 },
        type: 'raster',
      })
      nmap.addLayer({
        id: 'Streets',
        source: { type: 'raster', url: 'mapbox://mapbox.streets', tileSize: 256 },
        type: 'raster',
      })
      nmap.setLayoutProperty('Satellite', 'visibility', 'none')

      // Render point/line/polygon
      const geometryType = clockMapGeom.value.geom?.type
      if (geometryType === 'Point') {
        nmap.addLayer({
          id: 'clock-point',
          type: 'circle',
          source: { type: 'geojson', data: clockMapGeom.value.geom },
          paint: { 'circle-color': 'red', 'circle-radius': 6 },
          filter: ['==', '$type', 'Point'],
        })

        const coords = clockMapGeom.value.geom.coordinates
        const lat = coords[1].toFixed(5)
        const lng = coords[0].toFixed(5)
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>Clock-in</h3><p>(${lat}, ${lng})</p>`)
        new mapboxgl.Marker().setLngLat(coords).setPopup(popup).addTo(nmap).togglePopup()
      } else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
        nmap.addLayer({
          id: 'clock-polygon',
          type: 'line',
          source: { type: 'geojson', data: clockMapGeom.value.geom },
          paint: { 'line-color': 'red', 'line-width': 2 },
          filter: ['in', '$type', 'Polygon'],
        })
        const bounds = turf.bbox(clockMapGeom.value.geom)
        nmap.fitBounds(bounds, { padding: 40, animate: true })
      } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
        nmap.addLayer({
          id: 'clock-line',
          type: 'line',
          source: { type: 'geojson', data: clockMapGeom.value.geom },
          paint: { 'line-color': 'red', 'line-width': 3 },
          filter: ['in', '$type', 'LineString'],
        })
        const bounds = turf.bbox(clockMapGeom.value.geom)
        nmap.fitBounds(bounds, { padding: 40, animate: true })
      }

      nmap.addControl(new mapboxgl.NavigationControl(), 'top-left')
      nmap.resize()
    })
  } catch (e) {
    console.error('Map load error', e)
  }
}


/// contratcor 

// COntractor 

const AddContractorTeamDialog = ref(false)
const contractorFormRef = ref()

const AddContractorTeam = async () => {
  await loadSharedContractorRoles()
  AddContractorTeamDialog.value = true
}



// do not use same name with ref
const contractorForm = ref({
  project_id: route.params.id,
  contractor_id: null,
  role: null,
  scope: '',
  name: null,
  code: shortid.generate()
})

// contractior RUles 

const contractorRules = ({
  contractor_id: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
  ],

  role: [
    { required: true, message: 'Role is required', trigger: 'blur' },
  ],


  scope: [
    { required: true, message: 'Scope is required', trigger: 'blur' },
  ],
})









const IPC_PAYMENT_TYPES = [
  { label: 'IPC', value: 'ipc' },
  { label: 'Final', value: 'final' },
  { label: 'Retention', value: 'retention' },
] as const

const PAYMENT_TYPES = [
  ...IPC_PAYMENT_TYPES,
  { label: 'Advance', value: 'advance' },
] as const

function isAdvanceDisbursementRow(row: Record<string, unknown>) {
  const pt = String(row.payment_type || 'ipc').toLowerCase()
  const cert = String(row.certificate || '').trim().toLowerCase()
  return pt === 'advance' || cert === 'advance'
}

const IPC_STATUSES = [
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Paid', value: 'paid' },
] as const

function parseMoney(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0
  const n = Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function disbursementPaymentLabel(type: unknown) {
  const t = String(type || 'ipc').toLowerCase()
  return PAYMENT_TYPES.find((p) => p.value === t)?.label || String(type || 'IPC')
}

function ipcStatusTagType(status: unknown): 'info' | 'success' | 'warning' | 'primary' {
  const s = String(status || '').toLowerCase()
  if (s === 'paid') return 'success'
  if (s === 'approved') return 'primary'
  if (s === 'draft') return 'info'
  return 'warning'
}

const sortedProjectDisbursements = computed(() =>
  [...(projectDisbursements.value || [])].sort((a, b) => {
    const da = new Date(a.disbursement_date || 0).getTime()
    const db = new Date(b.disbursement_date || 0).getTime()
    if (da !== db) return da - db
    return Number(a.id || 0) - Number(b.id || 0)
  }),
)

const disbursementLedger = computed(() => {
  const contract = parseMoney(projectFullData.value?.cost)
  let cumulative = 0
  let advanceGranted = 0
  let advanceRecovered = 0

  return sortedProjectDisbursements.value.map((row) => {
    const gross = parseMoney(row.amount)
    cumulative += gross
    const pctOfContract = contract > 0 ? (cumulative / contract) * 100 : null

    const isAdvanceGrant = isAdvanceDisbursementRow(row)
    let advanceRecoveredThisRow = 0

    if (isAdvanceGrant) {
      advanceGranted += parseMoney(row.advance_amount ?? row.amount)
    } else {
      advanceRecoveredThisRow = parseMoney(row.advance_recovered)
      advanceRecovered += advanceRecoveredThisRow
    }

    const advanceBalance = Math.max(0, advanceGranted - advanceRecovered)

    return {
      ...row,
      gross,
      cumulative,
      pctOfContract,
      isAdvanceGrant,
      advanceRecoveredThisRow,
      advanceBalance,
    }
  })
})

const ipcDisbursementSubTab = ref('ipcs')

const ipcLedgerRows = computed(() => {
  const contract = parseMoney(projectFullData.value?.cost)
  const advanceGranted = ipcSummary.value.advanceGranted
  let cumulative = 0
  let advanceRecoveredRunning = 0

  return sortedProjectDisbursements.value
    .filter((row) => !isAdvanceDisbursementRow(row))
    .map((row) => {
      const gross = parseMoney(row.amount)
      cumulative += gross
      const advanceRecoveredThisRow = parseMoney(row.advance_recovered)
      advanceRecoveredRunning += advanceRecoveredThisRow
      const advanceBalance = Math.max(0, advanceGranted - advanceRecoveredRunning)
      const contractBalanceAfter = contract > 0 ? Math.max(0, contract - cumulative) : null
      const pctOfContract = contract > 0 ? (cumulative / contract) * 100 : null
      return {
        ...row,
        gross,
        cumulative,
        contractBalanceAfter,
        pctOfContract,
        isAdvanceGrant: false,
        advanceRecoveredThisRow,
        advanceBalance,
      }
    })
})

const advanceLedgerRows = computed(() =>
  sortedProjectDisbursements.value
    .filter((row) => isAdvanceDisbursementRow(row))
    .map((row) => ({
      ...row,
      gross: parseMoney(row.advance_amount ?? row.amount),
      isAdvanceGrant: true,
    })),
)

const ipcSummary = computed(() => {
  const contract = parseMoney(projectFullData.value?.cost)
  const rows = sortedProjectDisbursements.value
  let paidGross = 0
  let advanceGranted = 0
  let advanceRecovered = 0
  let ipcCount = 0

  for (const row of rows) {
    const gross = parseMoney(row.amount)
    paidGross += gross
    const pt = String(row.payment_type || 'ipc').toLowerCase()
    const cert = String(row.certificate || '').trim().toLowerCase()
    if (pt === 'ipc') ipcCount += 1
    if (pt === 'advance' || cert === 'advance') {
      advanceGranted += parseMoney(row.advance_amount ?? row.amount)
    }
    if (pt !== 'advance' && cert !== 'advance') {
      advanceRecovered += parseMoney(row.advance_recovered)
    }
  }

  const advanceOutstanding = Math.max(0, advanceGranted - advanceRecovered)
  const balance = contract > 0 ? contract - paidGross : null
  const pctPaid = contract > 0 ? (paidGross / contract) * 100 : null
  const nextIpcNo = ipcCount + 1

  return {
    contract,
    paidGross,
    balance,
    pctPaid,
    advanceGranted,
    advanceRecovered,
    advanceOutstanding,
    ipcCount,
    nextIpcNo,
    overContract: contract > 0 && paidGross > contract,
  }
})

const locationProgressRows = computed(() =>
  (projectLocations.value || []).map((loc: Record<string, any>) => ({
    id: loc.id,
    name:
      loc.location_name ||
      loc.settlement?.name ||
      loc.ward?.name ||
      loc.subcounty?.name ||
      `Location ${loc.id}`,
    progress:
      loc.physical_progress_pct != null && loc.physical_progress_pct !== ''
        ? Number(loc.physical_progress_pct)
        : null,
    commencement_date: loc.commencement_date || null,
    revised_completion_date: loc.revised_completion_date || null,
  })),
)

const averageLocationProgress = computed(() => {
  const vals = locationProgressRows.value
    .map((r) => r.progress)
    .filter((v): v is number => v != null && Number.isFinite(v))
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
})

const showDisbursementLocationPanel = computed(
  () => !isNationalProject.value && locationProgressRows.value.length > 0,
)

const IPC_DOCUMENT_TYPE = 'Other'

type IpcUploadFile = UploadUserFile & { docType?: string }

const disbursementDocumentsById = ref<Record<number, any[]>>({})

async function loadIpcDocuments() {
  const projectId = route.params.id
  const rows = projectDisbursements.value || []
  if (!rows.length) {
    disbursementDocumentsById.value = {}
    return
  }

  const formData: Record<string, unknown> = {
    model: 'ipc_document',
    excludeGeom: false,
    associated_multiple_models: [],
    filters: ['project_id'],
    filterValues: [[projectId]],
    cache_key: `ipc_document_${projectId}_${Date.now()}`,
  }

  try {
    const res: any = await getSettlementListByCounty(formData)
    const docs = Array.isArray(res?.data) ? res.data : []
    const map: Record<number, any[]> = {}
    for (const row of rows) {
      if (!row?.id) continue
      map[row.id] = docs.filter(
        (doc: { disbursement_id?: number }) =>
          Number(doc.disbursement_id) === Number(row.id),
      )
    }
    disbursementDocumentsById.value = map
  } catch (error) {
    console.error('Failed to load IPC documents', error)
    disbursementDocumentsById.value = {}
  }
}

function buildIpcLocationProgressSnapshot() {
  return {
    captured_at: new Date().toISOString(),
    average_progress_pct: ipcLocationProgressAverage.value,
    locations: ipcLocationProgress.value.map((loc) => ({
      project_location_id: loc.id,
      name: loc.name,
      progress_pct: loc.progress,
    })),
  }
}

type IpcLocationProgressRow = {
  id: number
  name: string
  progress: number | null
}

const ipcLocationProgress = ref<IpcLocationProgressRow[]>([])

const ipcLocationProgressAverage = computed(() => {
  const vals = ipcLocationProgress.value
    .map((r) => r.progress)
    .filter((v): v is number => v != null && Number.isFinite(v))
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
})

function compareDisbursementToReference(
  candidate: { disbursement_date?: unknown; id?: unknown },
  reference: { disbursement_date?: unknown; id?: number | null },
) {
  const da = new Date(candidate.disbursement_date || 0).getTime()
  const db = new Date(reference.disbursement_date || 0).getTime()
  if (da !== db) return da - db
  const cid = Number(candidate.id || 0)
  const rid = reference.id != null ? Number(reference.id) : Number.MAX_SAFE_INTEGER
  return cid - rid
}

function getIpcProgressReference() {
  if (ipcEditingId.value) {
    return {
      disbursement_date: DisbursementForm.value.disbursement_date,
      id: ipcEditingId.value,
    }
  }
  return {
    disbursement_date: DisbursementForm.value.disbursement_date || new Date(),
    id: null as number | null,
  }
}

function computeIpcProgressBounds(
  reference: { disbursement_date?: unknown; id?: number | null },
  excludeId?: number | null,
) {
  const floorByLocationId = new Map<number, number>()
  const ceilingByLocationId = new Map<number, number>()

  for (const disbursement of sortedProjectDisbursements.value) {
    if (excludeId && Number(disbursement.id) === Number(excludeId)) continue

    const order = compareDisbursementToReference(disbursement, reference)
    if (order === 0) continue

    const locations = (
      (disbursement.location_progress_snapshot as {
        locations?: Array<{ project_location_id?: number; progress_pct?: number | null }>
      } | null)?.locations || []
    )

    for (const loc of locations) {
      const locId = Number(loc.project_location_id)
      const pct = loc.progress_pct != null ? Number(loc.progress_pct) : null
      if (!locId || pct == null || !Number.isFinite(pct)) continue

      if (order < 0) {
        floorByLocationId.set(locId, Math.max(floorByLocationId.get(locId) ?? 0, pct))
      } else {
        const prevCeiling = ceilingByLocationId.get(locId)
        ceilingByLocationId.set(locId, prevCeiling == null ? pct : Math.min(prevCeiling, pct))
      }
    }
  }

  return { floorByLocationId, ceilingByLocationId }
}

const ipcProgressBounds = computed(() =>
  computeIpcProgressBounds(getIpcProgressReference(), ipcEditingId.value),
)

function ipcLocationProgressFloor(locationId: number) {
  return ipcProgressBounds.value.floorByLocationId.get(locationId) ?? 0
}

function ipcLocationProgressCeiling(locationId: number) {
  const ceiling = ipcProgressBounds.value.ceilingByLocationId.get(locationId)
  return ceiling != null && Number.isFinite(ceiling) ? ceiling : 100
}

function ipcPriorDisbursement(row: Record<string, unknown>) {
  const idx = sortedProjectDisbursements.value.findIndex(
    (entry) => Number(entry.id) === Number(row.id),
  )
  if (idx <= 0) return null
  return sortedProjectDisbursements.value[idx - 1]
}

function ipcPriorSnapshotAverage(row: Record<string, unknown>) {
  const prior = ipcPriorDisbursement(row)
  return prior ? ipcLocationSnapshotAverage(prior) : null
}

function ipcPriorSiteProgress(row: Record<string, unknown>, locationId: number) {
  const prior = ipcPriorDisbursement(row)
  if (!prior) return null
  const locations = (
    (prior.location_progress_snapshot as {
      locations?: Array<{ project_location_id?: number; progress_pct?: number | null }>
    } | null)?.locations || []
  )
  const match = locations.find((loc) => Number(loc.project_location_id) === Number(locationId))
  return match?.progress_pct != null && Number.isFinite(Number(match.progress_pct))
    ? Number(match.progress_pct)
    : null
}

function setIpcLocationProgress(id: number, progress: number | null) {
  let next = progress
  if (next != null && Number.isFinite(next)) {
    const floor = ipcLocationProgressFloor(id)
    const ceiling = ipcLocationProgressCeiling(id)
    if (next < floor) {
      ElMessage.warning(`Progress cannot go below ${floor.toFixed(1)}% (prior IPC)`)
      next = floor
    } else if (next > ceiling) {
      ElMessage.warning(`Progress cannot exceed ${ceiling.toFixed(1)}% (later IPC)`)
      next = ceiling
    }
  }

  ipcLocationProgress.value = ipcLocationProgress.value.map((row) =>
    row.id === id ? { ...row, progress: next } : row,
  )
}

function validateIpcLocationProgress(): boolean {
  if (!showDisbursementLocationPanel.value) return true

  for (const loc of ipcLocationProgress.value) {
    if (loc.progress == null || !Number.isFinite(loc.progress)) continue

    const floor = ipcLocationProgressFloor(loc.id)
    const ceiling = ipcLocationProgressCeiling(loc.id)

    if (loc.progress + 0.001 < floor) {
      ElMessage.error(
        `${loc.name}: progress must be at least ${floor.toFixed(1)}% based on earlier IPC order`,
      )
      return false
    }

    if (loc.progress > ceiling + 0.001) {
      ElMessage.error(
        `${loc.name}: progress cannot exceed ${ceiling.toFixed(1)}% — a later IPC already recorded higher progress`,
      )
      return false
    }
  }

  const priorAverage = (() => {
    const reference = getIpcProgressReference()
    let maxPrior: number | null = null
    for (const disbursement of sortedProjectDisbursements.value) {
      if (ipcEditingId.value && Number(disbursement.id) === Number(ipcEditingId.value)) continue
      if (compareDisbursementToReference(disbursement, reference) >= 0) continue
      const avg = ipcLocationSnapshotAverage(disbursement)
      if (avg != null) maxPrior = maxPrior == null ? avg : Math.max(maxPrior, avg)
    }
    return maxPrior
  })()

  const currentAverage = ipcLocationProgressAverage.value
  if (
    priorAverage != null &&
    currentAverage != null &&
    currentAverage + 0.001 < priorAverage
  ) {
    ElMessage.error(
      `Average site progress must be at least ${priorAverage.toFixed(1)}% to match earlier IPC order`,
    )
    return false
  }

  return true
}

async function persistIpcLocationProgress() {
  if (!ipcLocationProgress.value.length) return

  const maxByLocationId = new Map<number, number>()
  for (const disbursement of sortedProjectDisbursements.value) {
    if (ipcEditingId.value && Number(disbursement.id) === Number(ipcEditingId.value)) continue
    const locations = (
      (disbursement.location_progress_snapshot as {
        locations?: Array<{ project_location_id?: number; progress_pct?: number | null }>
      } | null)?.locations || []
    )
    for (const loc of locations) {
      const locId = Number(loc.project_location_id)
      const pct = loc.progress_pct != null ? Number(loc.progress_pct) : null
      if (!locId || pct == null || !Number.isFinite(pct)) continue
      maxByLocationId.set(locId, Math.max(maxByLocationId.get(locId) ?? 0, pct))
    }
  }

  for (const row of ipcLocationProgress.value) {
    if (row.progress == null || !Number.isFinite(row.progress)) continue
    maxByLocationId.set(row.id, Math.max(maxByLocationId.get(row.id) ?? 0, row.progress))
  }

  await Promise.all(
    [...maxByLocationId.entries()].map(([id, progress]) =>
      updateOneRecord({
        model: 'project_location',
        id,
        physical_progress_pct: progress,
      } as any),
    ),
  )

  for (const [id, progress] of maxByLocationId.entries()) {
    const loc = (projectLocations.value as any[]).find((l) => l.id === id)
    if (loc) loc.physical_progress_pct = progress
  }
}

function ipcLocationSnapshotRows(row: Record<string, unknown>) {
  const snap = row.location_progress_snapshot as {
    locations?: Array<{
      project_location_id?: number
      name?: string
      progress_pct?: number | null
    }>
  } | null
  return Array.isArray(snap?.locations) ? snap.locations : []
}

function ipcLocationSnapshotAverage(row: Record<string, unknown>) {
  const snap = row.location_progress_snapshot as { average_progress_pct?: number | null } | null
  if (snap?.average_progress_pct != null && Number.isFinite(Number(snap.average_progress_pct))) {
    return Number(snap.average_progress_pct)
  }
  const rows = ipcLocationSnapshotRows(row)
  const vals = rows
    .map((loc) => loc.progress_pct)
    .filter((v): v is number => v != null && Number.isFinite(Number(v)))
    .map(Number)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function ipcLocationSnapshotProgressPct(row: Record<string, unknown>) {
  const avg = ipcLocationSnapshotAverage(row)
  if (avg == null || !Number.isFinite(avg)) return null
  return Math.min(100, Math.max(0, Math.round(avg * 10) / 10))
}

function ipcHasSiteProgress(row: Record<string, unknown>) {
  return ipcLocationSnapshotRows(row).length > 0
}

function initIpcLocationProgressFromRow(row?: Record<string, unknown>) {
  const reference = row
    ? { disbursement_date: row.disbursement_date, id: Number(row.id) }
    : { disbursement_date: DisbursementForm.value.disbursement_date, id: null as number | null }
  const { floorByLocationId } = computeIpcProgressBounds(
    reference,
    row ? Number(row.id) : null,
  )

  const snapshotLocations = row
    ? ((row.location_progress_snapshot as { locations?: Array<{
        project_location_id?: number
        name?: string
        progress_pct?: number | null
      }> } | null)?.locations || [])
    : []

  ipcLocationProgress.value = locationProgressRows.value.map((loc) => {
    const snap = snapshotLocations.find(
      (entry) => Number(entry.project_location_id) === Number(loc.id),
    )
    const floor = floorByLocationId.get(loc.id) ?? 0
    const snapProgress =
      snap?.progress_pct != null && snap.progress_pct !== '' ? Number(snap.progress_pct) : null
    let progress = row
      ? (snapProgress ?? loc.progress ?? floor)
      : Math.max(floor, loc.progress ?? 0, 0)
    if (progress != null && progress < floor) progress = floor
    return {
      id: loc.id,
      name: loc.name,
      progress,
    }
  })
}

const ipcEditingId = ref<number | null>(null)
const isEditingIpc = computed(() => ipcEditingId.value != null)
const ipcDrawerMode = ref<'ipc' | 'advance'>('ipc')
const isAdvanceDrawer = computed(() => ipcDrawerMode.value === 'advance')

const ipcDrawerTitle = computed(() => {
  if (isAdvanceDrawer.value) {
    return isEditingIpc.value ? 'Edit advance payment' : 'Record advance payment'
  }
  return isEditingIpc.value ? 'Edit IPC disbursement' : 'Add IPC disbursement'
})

const ipcDrawerSubtitle = computed(() => {
  if (isAdvanceDrawer.value) {
    return 'One-off early payment — no site progress required'
  }
  return isEditingIpc.value
    ? 'Update payment, advance recovery, site progress, or document'
    : 'IPC payment with optional advance recovery, progress & document'
})

const ipcSubmitLabel = computed(() => {
  if (isAdvanceDrawer.value) {
    return isEditingIpc.value ? 'Save advance' : 'Record advance'
  }
  return isEditingIpc.value ? 'Save changes' : 'Submit IPC'
})

const ipcEditingDocuments = computed(() => {
  if (!ipcEditingId.value) return []
  return disbursementDocumentsById.value[ipcEditingId.value] || []
})

const AddDisbursementTeamDialog = ref(false)

const IPC_DRAWER_STEPS = [
  { title: 'Payment', description: 'Amount, recovery & status' },
  { title: 'Details', description: 'Progress & document' },
  { title: 'Review', description: 'Confirm & submit' },
] as const

const ADVANCE_DRAWER_STEPS = [
  { title: 'Payment', description: 'Amount & date' },
  { title: 'Review', description: 'Confirm & submit' },
] as const

const activeIpcDrawerSteps = computed(() =>
  isAdvanceDrawer.value ? ADVANCE_DRAWER_STEPS : IPC_DRAWER_STEPS,
)

const ipcDrawerLastStep = computed(() => (isAdvanceDrawer.value ? 1 : 2))

const ipcDrawerStep = ref(0)
const ipcSaving = ref(false)
const DisbursementFormRef = ref()
const ipcFileList = ref<IpcUploadFile[]>([])

const defaultDisbursementForm = () => ({
  id: undefined as number | undefined,
  project_id: route.params.id,
  amount: null as number | null,
  disbursement_date: new Date(),
  certificate: '',
  description: '',
  payment_type: 'ipc',
  status: 'submitted',
  advance_amount: null as number | null,
  advance_recovered: null as number | null,
  code: shortid.generate(),
})

const DisbursementForm = ref(defaultDisbursementForm())

const resetIpcDrawer = () => {
  ipcDrawerStep.value = 0
  ipcDrawerMode.value = 'ipc'
  ipcEditingId.value = null
  ipcFileList.value = []
  ipcLocationProgress.value = []
  DisbursementForm.value = defaultDisbursementForm()
  disbursementAmountInput.value = ''
  disbursementAdvanceRecoveredInput.value = ''
}

const openIpcDrawer = async (mode: 'ipc' | 'advance' = 'ipc') => {
  await getprojectDisbursements(route.params.id)
  resetIpcDrawer()
  ipcDrawerMode.value = mode
  DisbursementForm.value.payment_type = mode === 'advance' ? 'advance' : 'ipc'
  if (mode === 'advance') {
    DisbursementForm.value.certificate = 'Advance'
    DisbursementForm.value.advance_recovered = null
  } else {
    initIpcLocationProgressFromRow()
    DisbursementForm.value.certificate = `IPC ${ipcSummary.value.nextIpcNo}`
  }
  AddDisbursementTeamDialog.value = true
}

const openIpcDrawerForEdit = async (row: Record<string, unknown>) => {
  if (!canUserEditDisbursement(row)) {
    ElMessage.warning('You do not have permission to edit this disbursement.')
    return
  }

  await getprojectDisbursements(route.params.id)
  resetIpcDrawer()
  ipcEditingId.value = Number(row.id)
  ipcDrawerMode.value = isAdvanceDisbursementRow(row) ? 'advance' : 'ipc'

  DisbursementForm.value = {
    id: Number(row.id),
    project_id: route.params.id,
    amount: parseMoney(row.amount),
    disbursement_date: row.disbursement_date ? new Date(String(row.disbursement_date)) : new Date(),
    certificate: String(row.certificate || ''),
    description: String(row.description || ''),
    payment_type: String(row.payment_type || 'ipc'),
    status: String(row.status || 'submitted'),
    advance_amount:
      row.advance_amount != null && row.advance_amount !== ''
        ? parseMoney(row.advance_amount)
        : null,
    advance_recovered:
      row.advance_recovered != null && row.advance_recovered !== ''
        ? parseMoney(row.advance_recovered)
        : null,
    code: String(row.code || shortid.generate()),
  }

  if (ipcDrawerMode.value === 'ipc') {
    initIpcLocationProgressFromRow(row)
  }
  AddDisbursementTeamDialog.value = true
}

const AddDisbursement = () => openIpcDrawer('ipc')

const AddAdvancePayment = () => openIpcDrawer('advance')

const handleIpcDrawerClose = (done?: () => void) => {
  AddDisbursementTeamDialog.value = false
  resetIpcDrawer()
  done?.()
}

const handleIpcFileChange: UploadProps['onChange'] = (uploadFile) => {
  const file = uploadFile as IpcUploadFile
  file.docType = IPC_DOCUMENT_TYPE
}

const uploadIpcFiles = async (disbursementId: number) => {
  if (!ipcFileList.value.length) return

  const formData = new FormData()
  for (const file of ipcFileList.value) {
    if (!file?.raw) continue
    formData.append('files', file.raw)
    formData.append('format', file.name.split('.').pop() || '')
    formData.append('disbursement_id', String(disbursementId))
    formData.append('project_id', String(route.params.id))
    formData.append('protected_file', 'true')
    formData.append('type', file.docType || IPC_DOCUMENT_TYPE)
    formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2))
  }

  await uploadIpcDocuments(formData)
}

const validateIpcStepFields = (fields: string[]): Promise<boolean> =>
  new Promise((resolve) => {
    const form = DisbursementFormRef.value
    if (!form || !fields.length) {
      resolve(true)
      return
    }
    let pending = fields.length
    let allValid = true
    for (const field of fields) {
      form.validateField(field, (valid: boolean) => {
        if (!valid) allValid = false
        pending -= 1
        if (pending === 0) resolve(allValid)
      })
    }
  })

const showIpcAdvanceColumns = computed(
  () => ipcSummary.value.advanceGranted > 0 || ipcSummary.value.advanceRecovered > 0,
)

const showAdvanceRecoveryField = computed(
  () =>
    !isAdvanceDrawer.value &&
    ipcSummary.value.advanceGranted > 0 &&
    ipcSummary.value.advanceOutstanding > 0,
)

const ipcAdvanceOutstandingForForm = computed(() => {
  if (!ipcEditingId.value) return ipcSummary.value.advanceOutstanding
  const editingRow = sortedProjectDisbursements.value.find(
    (r) => Number(r.id) === Number(ipcEditingId.value),
  )
  return (
    ipcSummary.value.advanceOutstanding + parseMoney(editingRow?.advance_recovered)
  )
})

const validateIpcAdvanceStep = (): boolean => {
  if (isAdvanceDrawer.value) return true

  const advanceRecovered = parseMoney(DisbursementForm.value.advance_recovered)
  // Fresh entry with no recovery on this certificate — skip balance checks
  if (advanceRecovered <= 0) {
    DisbursementForm.value.advance_recovered = null
    return true
  }

  const gross = parseMoney(DisbursementForm.value.amount)
  const { advanceGranted } = ipcSummary.value
  const editingRow = ipcEditingId.value
    ? sortedProjectDisbursements.value.find((r) => Number(r.id) === Number(ipcEditingId.value))
    : null
  const priorRecoveredOnRow = parseMoney(editingRow?.advance_recovered)
  const advanceOutstanding =
    ipcSummary.value.advanceOutstanding + (ipcEditingId.value ? priorRecoveredOnRow : 0)

  if (advanceGranted <= 0) {
    ElMessage.error('No advance has been granted on this project to recover')
    return false
  }

  if (advanceOutstanding <= 0) {
    ElMessage.error('Advance has already been fully recovered on this project')
    return false
  }

  if (gross > 0 && advanceRecovered > gross) {
    ElMessage.error('Advance recovered cannot exceed the gross amount')
    return false
  }

  if (advanceRecovered > advanceOutstanding) {
    ElMessage.error('Advance recovered exceeds outstanding advance balance')
    return false
  }

  return true
}

const validateIpcStep = async (step: number): Promise<boolean> => {
  switch (step) {
    case 0: {
      if (isAdvanceDrawer.value) {
        const valid = await validateIpcStepFields(['disbursement_date', 'amount', 'description'])
        return valid
      }
      const valid = await validateIpcStepFields([
        'payment_type',
        'certificate',
        'disbursement_date',
        'amount',
      ])
      if (!valid) return false
      return validateIpcAdvanceStep()
    }
    case 1: {
      if (isAdvanceDrawer.value) return true
      const valid = await validateIpcStepFields(['description'])
      if (!valid) return false
      return validateIpcLocationProgress()
    }
    default:
      return true
  }
}

const validateIpcPaymentStep = async (): Promise<boolean> => {
  for (let step = 0; step < ipcDrawerLastStep.value; step += 1) {
    const valid = await validateIpcStep(step)
    if (!valid) {
      ipcDrawerStep.value = step
      return false
    }
  }
  return true
}

const showIpcNextButton = computed(() => ipcDrawerStep.value < ipcDrawerLastStep.value)
const showIpcSubmitButton = computed(() => ipcDrawerStep.value === ipcDrawerLastStep.value)

function handleIpcStepClick(index: number) {
  if (index < 0 || index > ipcDrawerLastStep.value || index > ipcDrawerStep.value) return
  ipcDrawerStep.value = index
}

const ipcNextStep = async () => {
  const valid = await validateIpcStep(ipcDrawerStep.value)
  if (!valid) return

  if (ipcDrawerStep.value < ipcDrawerLastStep.value) {
    ipcDrawerStep.value += 1
  }
}

const ipcPrevStep = () => {
  if (ipcDrawerStep.value > 0) {
    ipcDrawerStep.value -= 1
  }
}

const ipcOptions = computed(() => {
  const existing = (projectDisbursements.value || [])
    .map((row: { certificate?: unknown }) => String(row.certificate || '').trim())
    .filter(Boolean)
  return [...new Set(existing)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
})

const disbursementRules = computed(() => ({
  amount: [{ required: true, message: 'Amount is required', trigger: 'blur' }],
  description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
  payment_type: [{ required: true, message: 'Payment type is required', trigger: 'change' }],
  disbursement_date: [{ required: true, message: 'Payment date is required', trigger: 'change' }],
  certificate: isAdvanceDrawer.value
    ? []
    : [{ required: true, message: 'IPC reference is required', trigger: 'blur' }],
}))

const disbursementAmountInput = ref('')
const disbursementAdvanceRecoveredInput = ref('')

function handleDisbursementMoneyInput(
  value: string,
  target: 'amount' | 'advance_recovered',
) {
  const sanitized = value.replace(/,/g, '').replace(/[^\d.]/g, '')
  const dotIndex = sanitized.indexOf('.')
  const intPart = dotIndex >= 0 ? sanitized.slice(0, dotIndex) : sanitized
  const decPart =
    dotIndex >= 0 ? sanitized.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2) : ''

  if (sanitized === '') {
    if (target === 'amount') {
      disbursementAmountInput.value = ''
      DisbursementForm.value.amount = null
    } else {
      disbursementAdvanceRecoveredInput.value = ''
      DisbursementForm.value.advance_recovered = null
    }
    return
  }

  const numericString = decPart ? `${intPart}.${decPart}` : intPart
  const parsed = numericString === '' || numericString === '.' ? null : Number(numericString)
  const nextVal = parsed !== null && !Number.isNaN(parsed) ? parsed : null
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formatted = decPart ? `${formattedInt}.${decPart}` : formattedInt

  if (target === 'amount') {
    DisbursementForm.value.amount = nextVal
    disbursementAmountInput.value = formatted
  } else {
    DisbursementForm.value.advance_recovered = nextVal
    disbursementAdvanceRecoveredInput.value = formatted
  }
}

watch(
  () => DisbursementForm.value.disbursement_date,
  () => {
    if (!AddDisbursementTeamDialog.value || !showDisbursementLocationPanel.value) return
    ipcLocationProgress.value = ipcLocationProgress.value.map((loc) => {
      const floor = ipcLocationProgressFloor(loc.id)
      const ceiling = ipcLocationProgressCeiling(loc.id)
      let progress = loc.progress
      if (progress != null && progress < floor) progress = floor
      if (progress != null && progress > ceiling) progress = ceiling
      return { ...loc, progress }
    })
  },
)

watch(
  () => DisbursementForm.value.payment_type,
  (type) => {
    if (isAdvanceDrawer.value) return
    if (type === 'ipc' && !DisbursementForm.value.certificate && !isEditingIpc.value) {
      DisbursementForm.value.certificate = `IPC ${ipcSummary.value.nextIpcNo}`
    }
  },
)

watch(AddDisbursementTeamDialog, (open) => {
  if (!open) return
  const amount = DisbursementForm.value.amount
  disbursementAmountInput.value =
    amount != null && amount !== '' && !Number.isNaN(Number(amount))
      ? formatAmountDisplay(amount)
      : ''
  const adv = DisbursementForm.value.advance_recovered
  disbursementAdvanceRecoveredInput.value =
    adv != null && adv !== '' && !Number.isNaN(Number(adv)) ? formatAmountDisplay(adv) : ''
})

const updateDisbursement = async () => {
  const valid = await validateIpcPaymentStep()
  if (!valid) return

  const gross = parseMoney(DisbursementForm.value.amount)
  const advanceRecovered = parseMoney(DisbursementForm.value.advance_recovered)
  const paymentType = isAdvanceDrawer.value
    ? 'advance'
    : (DisbursementForm.value.payment_type || 'ipc')

  const payload: Record<string, unknown> = {
    ...DisbursementForm.value,
    model: 'disbursement',
    amount: gross,
    advance_amount: paymentType === 'advance' ? gross : null,
    advance_recovered: paymentType === 'advance' ? null : advanceRecovered || null,
    location_progress_snapshot:
      !isAdvanceDrawer.value && showDisbursementLocationPanel.value
        ? buildIpcLocationProgressSnapshot()
        : null,
  }

  if (paymentType === 'advance') {
    payload.certificate = 'Advance'
    payload.payment_type = 'advance'
  }

  ipcSaving.value = true
  try {
    if (!isAdvanceDrawer.value && showDisbursementLocationPanel.value) {
      await persistIpcLocationProgress()
    }

    if (isEditingIpc.value && ipcEditingId.value) {
      payload.id = ipcEditingId.value
      await updateOneRecord(payload as any)
      if (ipcFileList.value.length) {
        await uploadIpcFiles(ipcEditingId.value)
      }
      await getprojectDisbursements(route.params.id)
      handleIpcDrawerClose()
      ElMessage.success(
        isAdvanceDrawer.value ? 'Advance payment updated' : 'IPC disbursement updated',
      )
      return
    }

    const res: any = await CreateRecord(payload as any)
    const saved = res?.data
    if (saved?.id && ipcFileList.value.length) {
      await uploadIpcFiles(Number(saved.id))
    }
    await getprojectDisbursements(route.params.id)
    handleIpcDrawerClose()
    ElMessage.success(
      paymentType === 'advance' ? 'Advance payment recorded' : 'IPC disbursement saved',
    )
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || 'Could not save disbursement')
  } finally {
    ipcSaving.value = false
  }
}








const contract_roles = ['Main Contractor', 'Subcontractor', 'Consultant', 'Other'] as const

const sharedContractorRoles = ref<string[]>([])

async function loadSharedContractorRoles() {
  try {
    const res = await getUniqueFieldValues({ model: 'project_contractor', selectedField: 'role' })
    const rows = (res as any)?.data || []
    sharedContractorRoles.value = rows
      .map((row: { value?: unknown; label?: unknown }) => String(row.value ?? row.label ?? '').trim())
      .filter(Boolean)
  } catch {
    // Non-fatal; defaults still apply.
  }
}

const contractorRoleOptions = computed(() => {
  const merged = [...contract_roles, ...sharedContractorRoles.value]
  return [...new Set(merged.map((role) => role.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
})

function rememberContractorRole(role: unknown) {
  const trimmed = String(role || '').trim()
  if (!trimmed || contractorRoleOptions.value.includes(trimmed)) return
  sharedContractorRoles.value = [...sharedContractorRoles.value, trimmed]
}

function contractorRoleTagType(role: unknown): 'primary' | 'success' | 'warning' | 'info' {
  const r = String(role || '').toLowerCase()
  if (r === 'main contractor') return 'primary'
  if (r === 'subcontractor') return 'success'
  if (r === 'consultant') return 'warning'
  return 'info'
}


const updateContractor = async () => {

  contractorFormRef.value.validate(async (valid: boolean) => {

    if (valid) {
      console.log('submit!')

      contractorForm.value.model = 'project_contractor'

      const res = await CreateRecord(contractorForm.value)

      rememberContractorRole(contractorForm.value.role)
      projectContractors.value.push(res.data)
      await loadSharedContractorRoles()
      AddContractorTeamDialog.value = false
    } else {
      console.log('error submit!')
    }


  })


}


const RemoveContractor = async (row) => {
  if (!canUserDeleteContractor(row)) {
    ElMessage({
      message: 'You do not have permission to delete this contractor. Only Super Admins, National Staff, or the County Admin who created this contractor can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  let formData = {}
  formData.id = row.id
  formData.model = 'project_contractor'

  await DeleteRecord(formData);



  // remove the deleted object from array list 
  let index = projectContractors.value.indexOf(row);
  if (index !== -1) {
    projectContractors.value.splice(index, 1);
  }

}




const RemoveDocument = async (row) => {
  if (!canUserDeleteDocument(row)) {
    ElMessage({
      message: 'You do not have permission to delete this document. Only Super Admins, National Staff, or the County Admin who created this document can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  // Use the cascading delete endpoint: it removes dependent document_link /
  // document_share_item rows before deleting the document row itself, so it
  // doesn't fail when the document is linked to other entities.
  let formData = {}
  formData.filesToDelete = [row]

  await deleteDocument(formData);



  // remove the deleted object from array list
  let index = projectDocuments.value.indexOf(row);
  if (index !== -1) {
    projectDocuments.value.splice(index, 1);
  }

}


const handleUnlinkDocument = async (row: any) => {
  if (!canUserUnlinkDocument(row)) {
    ElMessage({
      message: 'You do not have permission to unlink this document.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }
  const pid = Number(route.params.id)
  if (!pid || !row.id) return
  try {
  await unlinkDocument({ document_id: row.id, entity_type: 'project', entity_id: pid })
    projectDocuments.value = (projectDocuments.value as any[]).filter((d: any) => d.id !== row.id)
    ElMessage.success('Document unlinked from this project')
  } catch {
    ElMessage.error('Failed to unlink document')
  }
}

const handleIpcLedgerAction = async (command: string, row: any) => {
  if (command === 'edit') {
    await openIpcDrawerForEdit(row)
    return
  }

  if (command === 'delete') {
    try {
      const docCount = (disbursementDocumentsById.value[row.id] || []).length
      await ElMessageBox.confirm(
        docCount
          ? `Remove this disbursement and ${docCount} attached IPC document(s)?`
          : 'Remove this disbursement from the ledger?',
        'Confirm',
        { type: 'warning', confirmButtonText: 'Remove', cancelButtonText: 'Cancel' },
      )
      await RemoveDisbursement(row)
    } catch {
      // cancelled
    }
  }
}

const RemoveDisbursement = async (row) => {
  if (!canUserDeleteDisbursement(row)) {
    ElMessage({
      message: 'You do not have permission to delete this disbursement. Only Super Admins, National Staff, or the County Admin who created this disbursement can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  const formData: Record<string, unknown> = {
    id: row.id,
    model: 'disbursement',
    cascade: true,
  }

  try {
    await DeleteRecord(formData as any)
    await getprojectDisbursements(route.params.id)
    ElMessage.success('Disbursement removed')
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || 'Could not remove disbursement')
  }
}



const handleSelectContractor = async (selected) => {
  const selectedContractor = contractorOptions.value.filter(item => item.id == selected);

  contractorForm.value.name = selectedContractor[0].name
  console.log(contractorForm.value)
}



// ASdd Missing Contractot

const showAddNewContractor = ref(false)
const showAddNewDocumentType = ref(false)
const showAddNewTeamRole = ref(false)

const onAddOption = () => {
  showAddNewContractor.value = true
}

const onAddDocumentTypeOption = () => {
  showAddNewDocumentType.value = true
}

const onAddTeamRoleOption = () => {
  newTeamRoleForm.value.role = ''
  showAddNewTeamRole.value = true
}

const NewDocumentTypeForm = ref({
  type: '',
  category_id: null as number | null,
  group: '',
  code: shortid.generate(),
})

const NewDocumentTypeRef = ref()
const newTeamRoleForm = ref({ role: '' })
const NewTeamRoleRef = ref()

const newDocumentTypeRules = {
  category_id: [{ required: true, message: 'Please select a category', trigger: 'change' }],
  type: [{ required: true, message: 'Please enter a document type', trigger: 'blur' }],
}

const newTeamRoleRules = {
  role: [{ required: true, message: 'Please enter a role', trigger: 'blur' }],
}

const handleNewDocumentTypeCategory = (categoryId: number | null) => {
  const selected = documentCategoryOptions.value.find((item) => item.value === categoryId)
  NewDocumentTypeForm.value.group = selected?.group || selected?.label || ''
}

const createNewDocumentType = async () => {
  NewDocumentTypeRef.value?.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      const payload = {
        ...NewDocumentTypeForm.value,
        model: 'document_type',
        type: String(NewDocumentTypeForm.value.type || '').trim(),
        code: shortid.generate(),
      }
      const res = await CreateRecord(payload)
      const created = (res as any)?.data
      if (!created?.id) return

      appendDocumentTypeOption({
        id: Number(created.id),
        type: String(created.type || payload.type),
        group: created.group || payload.group,
      })
      documentCategory.value = Number(created.id)
      showUpload.value = true
      showAddNewDocumentType.value = false
      NewDocumentTypeForm.value = {
        type: '',
        category_id: null,
        group: '',
        code: shortid.generate(),
      }
      ElMessage.success('Document type registered')
    } catch (error) {
      console.error('Error creating document type:', error)
      ElMessage.error('Failed to register document type')
    }
  })
}

const createNewTeamRole = async () => {
  NewTeamRoleRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    const trimmed = String(newTeamRoleForm.value.role || '').trim()
    if (!trimmed) return
    rememberTeamRole(trimmed)
    teamForm.value.role = trimmed
    showAddNewTeamRole.value = false
    newTeamRoleForm.value.role = ''
    ElMessage.success('Role added — save the team member to keep it')
  })
}

// do not use same name with ref
const NewContractorForm = ref({
  name: null,
  contact_person: null,
  email: null,
  address: null,
  phone: '',
  code: shortid.generate()
})




const NewContractorRef = ref()
const ruleFormRules = ({
  name: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
  ],

  phone: [
    { required: true, message: 'Phone is required', trigger: 'blur' },
  ],
  contact_person: [
    { required: true, message: 'Contact Person is required', trigger: 'blur' },
  ],

  address: [
    { required: true, message: 'Address is required', trigger: 'blur' },
  ],

  email: [
    { required: true, message: 'Please enter an email address', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: ['blur', 'change'] }
  ],

})


const createNewContractor = async () => {

  NewContractorRef.value.validate(async (valid: boolean) => {

    if (valid) {
      console.log('submit!')

      NewContractorForm.value.model = 'contractor'

      const res = await CreateRecord(NewContractorForm.value)

      console.log(res.data)

      if (res.data) {
        let new_cont = {}
        new_cont.value = res.data.id
        new_cont.id = res.data.id
        new_cont.label = res.data.name
        new_cont.name = res.data.name
        new_cont.code = res.data.code

        contractorOptions.value.push(new_cont)
        contractorForm.value.contractor_id = res.data.id
        contractorForm.value.name = res.data.name
      }
      /*  contractorOptions.value = 
         contractorOptions.value = res.data.map(item => ({
           value: item.id,
           id: item.id,
           label: item.name,
           name: item.name,
           code: item.code,
           
         })); */




      showAddNewContractor.value = false


    } else {
      console.log('error submit!')
    }


  })


}


const projectFormDrawerVisible = ref(false)
const projectFormComponentId = ref<string | number | null>(null)
const projectFormProjectId = ref<string | number | null>(null)
const projectFormMode = ref<'add' | 'edit'>('edit')

const editProject = () => {
  const data = projectFullData.value
  if (!data?.id) {
    ElMessage.warning('Project data is not loaded yet')
    return
  }
  const domain = data.component_id
  if (!domain) {
    ElMessage.warning('Cannot edit project: missing component')
    return
  }
  projectFormMode.value = 'edit'
  projectFormProjectId.value = data.id
  projectFormComponentId.value = domain
  projectFormDrawerVisible.value = true
}

const onProjectFormSaved = async () => {
  projectFormDrawerVisible.value = false
  const id = project_id.value ?? route.params.id
  if (id) {
    await loadProjectDetails(id)
  }
}


// Reactive state
const tasks = ref([]);
const dialogVisible = ref(false);
const taskForm = ref({
  project_id: null,
  parentTaskId: null, // Added for parent task selection
  parentTaskPath: [],
  progress: 0,
  status: 'Pending',
  startDate: null,
  endDate: null,
  createdBy: userInfo.id,
  username: userInfo.name,
  code: null,

});
const selectedTask = ref(null);
const expandedRows = ref([]);

const parentTasks = ref([]); // To hold the available parent tasks
const parentTasksOptions = ref([]); // To hold the available parent tasks



function buildNestedTasks(tasks) {
  const taskMap = new Map();

  // Step 1: Prepare task entries and add to the map
  tasks.forEach((task) => {
    taskMap.set(task.id, {
      value: task.id,
      label: task.name,
      children: [],
      startDate: task.startDate,
      endDate: task.endDate,
      progress: task.progress,
      status: task.status,
      time_spent: task.time_spent,
    });
  });

  const nestedTasks = [];

  // Step 2: Assign children based on parentTaskId
  tasks.forEach((task) => {
    const taskEntry = taskMap.get(task.id);
    if (task.parentTaskId) {
      const parentTask = taskMap.get(task.parentTaskId);
      if (parentTask) {
        parentTask.children.push(taskEntry); // Add to parent's children
      }
    } else {
      nestedTasks.push(taskEntry); // Add to top-level if no parent
    }
  });

  return nestedTasks;
}


// Fetch available parent tasks
const fetchParentTasks = async (id) => {
  try {
    // const response = await axios.get('/api/tasks'); // Assuming the API endpoint returns tasks
    const response = await getTasks({ 'project_id': id })
    //   tasks.value=response.data
    console.log('fetchParentTasks', response.data)
    parentTasks.value = response.data

    parentTasksOptions.value = buildNestedTasks(response.data);

    console.log('parentTasksOptions.value', parentTasksOptions.value)

    // parentTasks.value = response.data.filter(task => task.id); // Adjust this as per your API response
  } catch (error) {
    console.error('Failed to fetch parent tasks', error);
  }
};












const disableParent = ref(false)

const AddEditTask = async () => {
  disableParent.value = false
  taskForm.value.parentTaskId = null

  console.log('dialogVisible', dialogVisible.value)
  dialogVisible.value = true
  taskForm.value.project_id = projectFullData.value.id
  fetchParentTasks(projectFullData.value.id)

};

const AddSubTask = async (parent) => {
  // disableParent.value = true

  console.log('dialogVisible', dialogVisible.value)
  dialogVisible.value = true
  taskForm.value.project_id = projectFullData.value.id
  taskForm.value.parentTaskId = parent
  fetchParentTasks(projectFullData.value.id)

};



// Toggle row expansion for subtasks
const toggleRowExpansion = (row) => {
  const index = expandedRows.value.indexOf(row);
  if (index === -1) {
    expandedRows.value.push(row);
  } else {
    expandedRows.value.splice(index, 1);
  }
};

// Check if a row is expanded
const isRowExpanded = (row) => {
  return expandedRows.value.includes(row);
};

// Edit task (open dialog with task details)
const editTask = (task) => {
  selectedTask.value = task;
  taskForm.value.progress = task.progress;
  taskForm.value.status = task.status;
  dialogVisible.value = true;
};

// Submit the task update
const submitTask = async () => {

  console.log(taskForm.value)

  taskForm.value.code = shortid.generate()
  taskForm.value.model = 'project_task'

  try {
    //await axios.put(`/api/tasks/${selectedTask.value.id}`, taskForm);
    await addTask(taskForm.value)
    //fetchTasks(); // Refresh the tasks list
    dialogVisible.value = false; // Close the dialog
  } catch (error) {
    console.error('Failed to update task', error);
  }
};


// Recursive function to find the path for a given task ID
function findPathById(options, targetId, path = []) {
  for (const option of options) {
    //console.log('option>>',option, "ccc", targetId)
    const currentPath = [...path, option.value];

    // Check if this option matches the target ID
    if (option.value == targetId) {
      return currentPath;
    }

    // If children exist, search recursively
    if (option.children) {
      const result = findPathById(option.children, targetId, currentPath);
      if (result) return result;
    }
  }
  return null; // Return null if the path is not found
}

const hasChildren = ref(true)
// Check if a task has children by looking for it in the options array
const checkChildren = (taskId) => {
  const findTask = (options) => {
    for (const option of options) {

      console.log('option of options', option)
      if (option.value === taskId) {
        return option.children && option.children.length > 0;
      }
      if (option.children) {
        const result = findTask(option.children);
        if (result) return result;
      }
    }
    return false;
  };
  return findTask(parentTasksOptions.value);
};


// Edit task handler
const handleEdit = async (task) => {
  console.log('Edit task:', task);
  // Implement the logic to open the edit form/modal here
  taskForm.value.id = task.id;
  taskForm.value.project_id = task.project_id;
  taskForm.value.progress = task.progress;
  taskForm.value.name = task.name;
  taskForm.value.status = task.status;
  taskForm.value.startDate = task.startDate;
  taskForm.value.endDate = task.endDate;
  taskForm.value.parentTaskId = task.parentTaskId;
  dialogVisible.value = true;



  hasChildren.value = await checkChildren(task.id)

  console.log('hasChildren.value', hasChildren.value)



  fetchParentTasks(task.project_id)


  // Get the path to the parent task ID
  const path = findPathById(parentTasksOptions.value, task.parentTaskId);
  taskForm.value.parentTaskPath = path || []; // Set path or empty array if not found
  console.log('Edit task path:', path);

};




// Delete task handler
const handleDelete = async (row) => {
  if (!canUserDeleteTask(row)) {
    ElMessage({
      message: 'You do not have permission to delete this task. Only Super Admins, National Staff, or the County Admin who created this task can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  console.log('Delete task:', row);
  // You can prompt for confirmation and delete the record
  // Implement the actual delete logic here (e.g., API call)

  const formData = {}
  formData.model = 'project_task'
  formData.id = row.id

  await deleteTask(formData)

  // Check if it's a subtask (it has a parentTaskId)
  if (row.parentTaskId !== null) {
    // Find the parent task that contains this subtask
    const parentTask = tasks.value.find(task => task.id === row.parentTaskId);

    if (parentTask && parentTask.Subtasks) {
      // Filter out the specific subtask from the parent's subtasks array
      parentTask.Subtasks = parentTask.Subtasks.filter(subtask => subtask.id !== row.id);
      console.log(`Subtask ${row.id} removed from Parent Task ${parentTask.id}`);
    }
  } else {
    // If it's a parent task, delete the parent task entirely
    tasks.value = tasks.value.filter(task => task.id !== row.id);
    console.log(`Parent Task ${row.id} and its subtasks removed`);
  }

};

const generateNewId = () => {
  const ids = tasks.value.flatMap(task => [task.id, ...task.subtasks.map(subtask => subtask.id)]);
  return Math.max(...ids) + 1;
};

const handleClone = (row) => {
  console.log('Cloning task or subtask:', row);

  // Create a new task or subtask with a unique id
  const newId = generateNewId();
  const clonedItem = { ...row, id: newId, name: `${row.name} (Cloned)` };

  // Check if it's a subtask
  if (row.parentTaskId !== null) {
    // Find the parent task and add the cloned subtask
    const parentTask = tasks.value.find(task => task.id === row.parentTaskId);
    if (parentTask && parentTask.Subtasks) {
      parentTask.Subtasks.push(clonedItem);
      console.log(`Subtask ${row.id} cloned to Subtask ${newId}`);
    }
  } else {
    // It's a parent task, so add the cloned task to the main tasks array
    clonedItem.Subtasks = clonedItem.Subtasks.map(subtask => ({
      ...subtask,
      id: generateNewId(),
      parentTaskId: newId,
      name: `${subtask.name} (Cloned)`
    }));
    tasks.value.push(clonedItem);
    console.log(`Parent Task ${row.id} cloned to Parent Task ${newId}`);
  }

  console.log('Updated tasks:', tasks.value);
};

const uploadDialog = ref(false)
const field_set = ref([])

const uploadData = async () => {
  uploadDialog.value = true
  console.log('Uploading data.......')
  var formData = {}
  formData.model = 'project_task'
  await getModelSpecs(formData).then((response) => {
    console.log(response.data)
    field_set.value = response.data
  })

}


function convertStringArraysToProperArrays(data) {
  return data.map(item => {
    const newItem = { ...item }; // Create a shallow copy of the object

    for (const key in newItem) {
      if (newItem.hasOwnProperty(key)) {
        const value = newItem[key];

        // Check if the value is a string and can be parsed as an array
        if (typeof value === 'string') {
          try {
            const parsedValue = JSON.parse(value);

            if (Array.isArray(parsedValue)) {
              newItem[key] = parsedValue;
            }
          } catch (e) {
            // Handle any JSON parsing errors
            console.error(`Error parsing string to array for key ${key}:`, e);
          }
        }
      }
    }


    // Assuming 'latitude' and 'longitude' are the keys for lat/lon
    if (newItem.latitude && newItem.longitude) {
      newItem.geom = {
        type: "Point",  // You can adjust the type if necessary
        coordinates: [newItem.longitude, newItem.latitude]  // Note: GeoJSON uses [lon, lat]
      };
    }

    return newItem;
  });
}

const ImportProjectTasks = async () => {

  //console.log('deleted_locations',deleted_locations)
  var form = {}
  form.model = 'project_task'

  const dta = convertStringArraysToProperArrays(parsedData.value)
  console.log('dta', dta)


  form.data = dta
  console.log('formData', form)

  const results = await batchImport(form)

  console.log('batchImport', results.insertedDocuments)



}


const handleCsvUpload = async (file) => {

  if (file.raw) {
    parseCSV(file.raw);
  }
}

const parsedData = ref([])

const parseCSV = async (file) => {
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (result) => {
      parsedData.value = result.data;

      console.log('parsedData.value', parsedData.value)
      //  ImportProjects()
      ImportProjectTasks()
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
    },
  });
}


const handleDownload = async () => {

  const data = field_set.value
  const fileName = 'task_template'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}


const DeleteProject = async (id) => {
  const project = projectFullData.value;
  if (!canUserDeleteProject(project)) {
    ElMessage({
      message: 'You do not have permission to delete this project. Only Super Admins, National Staff, or the County Admin who created this project can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  let formData = {};
  formData.id = id;
  formData.model = 'project';

  try {
    await DeleteRecord(formData);

    // Delete documents only if there are any documents to delete
    if (projectDocuments.value.length > 0) {
      formData.filesToDelete = projectDocuments.value;
      await deleteDocument(formData);
    }

    ElMessage({
      message: 'Project deleted successfully!',
      type: 'success',
      duration: 3000,
    });

    goBack();
  } catch (error) {
    ElMessage({
      message: 'Failed to delete the project. Please try again.',
      type: 'error',
      duration: 3000,
    });
  }
};

const items = [
  {
    title: 'A. PRELIMINARIES',
    icon: 'ic:baseline-plus',
    children: [
      { title: 'Site Handover', icon: 'vscode-icons:file-type-typescript' },
      { title: 'Mobilisation', icon: 'vscode-icons:file-type-typescript' },
      { title: 'Site Establishment - Hoarding, site office, site storage etc', icon: 'vscode-icons:file-type-typescript' },


    ],
  },
  {
    title: 'B. RELOCATION OF EXISTING SEWERLINE',
    children: [
      {
        title: 'Home',
        icon: 'lucide:folder',
        children: [
          { title: 'Card.vue', icon: 'vscode-icons:file-type-vue' },
          { title: 'Button.vue', icon: 'vscode-icons:file-type-vue' },
        ],
      },
    ],
  },
  {


    title: 'C. MARKET BUILDING',
    children: [
      {
        title: 'Concrete Works',
        icon: 'lucide:folder',
        children: [
          { title: 'Basement 2 Slab', icon: 'vscode-icons:file-type-vue' },
          { title: 'Columns', icon: 'vscode-icons:file-type-vue' },
        ],
      },
    ],
  },
  { title: 'app.vue', icon: 'vscode-icons:file-type-vue' },
  { title: 'nuxt.config.ts', icon: 'vscode-icons:file-type-nuxt' },
]



const handleChange = (value) => {
  console.log(value)
  taskForm.value.parentTaskId = value[value.length - 1]; // Only store the last item
  console.log('Last selected value:', taskForm.value.parentTaskId);


}

const props1 = {
  checkStrictly: true,
}


const onClose = () => {
  console.log('Dialog closed');
  // Clear or reset the form when the dialog is closed

  hasChildren.value = true
  dialogVisible.value = false
};



// Method to validate progress and ensure it stays within the range
const validateProgress = () => {
  if (taskForm.value.progress < 0) {
    taskForm.value.progress = 0;
  } else if (taskForm.value.progress > 100) {
    taskForm.value.progress = 100;
  }
};


const tableRowClassName = (data) => {

  if (data.row.status == 'Rejected') {
    return 'danger-row'
  }
  if (data.row.status == 'Approved') {
    return 'success-row'
  }

  return ''
}

function formatDate(dateString: unknown) {
  return formatDateDisplay(dateString)
}


function getQuarter(date = new Date()) {
  return Math.floor(date.getMonth() / 3 + 1);
}
/// here to File a report (m&E)

const ReportRuleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  //indicator_category_id: null,
  indicator_category_id: [],
  indicators: [],
  baseline: 0,
  target: 0,
  project_id: route.params.id,
  project_location_id: null,
  activity_id: null,
  programme_implementation_id: null,
  settlement_id: null,
  subcounty_id: null,
  ward_id: null,
  county_id: null,
  region_id: null,
  period: getQuarter,
  date: new Date(),
  progress: 0,
  amount: 0,
  files: '',
  project_status: '',
  disbursement: 0,
  userId: userInfo.id,
  code: '',
  cumDisbursement: 0,
  cumProgress: 0,
  prevAmount: 0,
  cumAmount: 0,
  comments: '',
  units: 'Quantity',
  qualitative: '',
  cumUnits: 'Cumulative(qty)'
})

const ReportRules = reactive<FormRules>({
  project_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  project_location_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],


  activity_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  indicator_category_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],




  amount: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  date: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],


})




const changeIndicator = async (indicator_category_id: any) => {
  ruleForm.indicator_category_id = indicator_category_id

  console.log('Filtre indicatorsOptionsFiltered', indicatorsOptionsFiltered)

  var filtredOptions = indicatorsOptionsFiltered.value.filter(function (el) {
    return el.value == indicator_category_id
  });


  // ruleForm.project_id = filtredOptions[0].project_id
  ruleForm.activity_id = filtredOptions[0].activity_id



  console.log("Filtered Indicators", filtredOptions[0])
  ruleForm.units = "Quantity(" + filtredOptions[0].unit + ")"
  ruleForm.cumUnits = "Cumulative(" + filtredOptions[0].unit + ")"

  ruleForm.baseline = filtredOptions[0].baseline
  //ruleForm.target = filtredOptions[0].target

  //ruleForm.indicator_category_title = filtredOptions[0].category_title

  getCumulativeProgress(indicator_category_id)
}


const activeStep = ref(0)

const nextStep = async () => {
  console.log(ruleFormRef.value)
  await ReportRuleFormRef.value?.validate((valid) => {
    if (valid) {
      if (activeStep.value < 3) {
        activeStep.value++
      }
    }
  })


}



const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--;
  }
}





const firstReport = ref(true)

const getCumulativeProgress = async () => {

  var filters = ['userId', 'indicator_category_id', 'county_id', 'subcounty_id', 'ward_id', 'project_id',
  ]

  var filterValues = [[userInfo.id], [ruleForm.indicator_category_id], [ruleForm.county_id], [ruleForm.subcounty_id], [ruleForm.ward_id],
  [ruleForm.project_id]]  // remember to change here!

  console.log(ruleForm.value)




  console.log('filters', filters)
  console.log('filterValues', filterValues)
  const formData = {}
  formData.limit = 100
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'indicator_category_report'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = []

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = []

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)


  console.log('yaay. Got last reports', res.data)
  if (res.data.length == 0) {
    firstReport.value = true
  } else {
    firstReport.value = false
  }

  function getLatestReport(dataList) {
    if (dataList.length === 0) {
      return null;
    }

    // Find the latest ID using reduce function
    const latestID = dataList.reduce((prevObj, currentObj) => (currentObj.id > prevObj.id ? currentObj : prevObj)).id;

    // Find the object with the latest ID
    const objectWithLatestID = dataList.find((obj) => obj.id === latestID);

    // Return the object with the latest ID
    return objectWithLatestID;
  }


  // Get the object with the latest date
  const objectWithLatestDate = getLatestReport(res.data);
  console.log('objectWithLatestDate', objectWithLatestDate);

  // ruleForm.cumProgress = parseInt(objectWithLatestDate.cumProgress)
  // ruleForm.cumDisbursement = parseInt(objectWithLatestDate.cumDisbursement)
  ruleForm.cumAmount = parseFloat(objectWithLatestDate.cumAmount)
  ruleForm.cumProgress = parseFloat(objectWithLatestDate.cumProgress)
  ruleForm.prevAmount = parseFloat(objectWithLatestDate.amount)

  ruleForm.target = parseFloat(objectWithLatestDate.target)

  console.log('cumProgress ats tart', ruleForm);

}





const fileUploadList = ref<UploadUserFile[]>([])

// Function to empty all fields in ruleForm
function emptyRuleForm() {
  for (const key in ruleForm) {
    ruleForm[key] = null;
  }
}

 

const disableIndicator = ref(false)

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      console.log('Form validation failed:', fields);
      return;
    }

    const submittedReportIds = [];

    for (const indicator of ruleForm.indicators) {
      // Calculate new cumulative amount
     
      const updatedCumAmount = (indicator.cumAmount || 0) + (indicator.amount || 0);

      // Calculate progress = 100 * (cumAmount / target)
      const progress = isFinite(updatedCumAmount / (indicator.target || 1))
        ? ((updatedCumAmount / indicator.target) * 100).toFixed(2)
        : '0.00';

      const reportPayload = {
        model: 'indicator_category_report',
        period: getQuarter(),
        code: uuid.v4(),
        userId: userInfo.id,
        project_id: project_id.value,
        project_location_id: ruleForm.project_location_id,
        indicator_category_id: indicator.value,
        amount: indicator.amount || 0,
        baseline: indicator.baseline || 0,
        target: indicator.target || 0,
        date: indicator.date || new Date(),
        cumAmount: updatedCumAmount,
        cumProgress: progress,
        progress:progress,
        comments: ruleForm.comments,
        programme_implementation_id: programme_implementation_id.value,
        settlement_id: ruleForm.settlement_id,
        county_id: ruleForm.county_id,
        subcounty_id: ruleForm.subcounty_id,
        ward_id: ruleForm.ward_id,
        activity_id: indicator.activity_id,
        qualitative: indicator.qualitative,
        geom: ruleForm.geom,
  
 
      };

      console.log('reportPayload>>',reportPayload)

      // Submit individual indicator report
      const report = await CreateRecord(reportPayload);
      //console.log(`Report created for indicator ${indicator.label}: ID ${report.data.id} :${report.data}`);

 
      submittedReportIds.push(report.data.id);
       console.log('After push:', indicatorReports.value);
 
       
    }

    // Upload files for each created report
    if (submittedReportIds.length && fileUploadList.value.length) {
      for (const reportId of submittedReportIds) {
        const formData = new FormData();

        fileUploadList.value.forEach((file) => {
          formData.append('files', file.raw);
          formData.append('format', file.name.split('.').pop());
          formData.append('field_id', 'report_id');
          formData.append('category', 56);   // 56 is montiroing reports
          formData.append('report_id', parseInt(reportId));
          formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2));
          formData.append('createdBy', userInfo.id);
          formData.append('protected', false);
        });

        formData.append('code', uuid.v4());

        const uploaded = await uploadFilesBatch(formData);
        console.log(`Files uploaded for report ID ${reportId}:`, uploaded.data);
      }
    }


    AddDialogVisible.value = false;
    handleClose();


  //  emptyRuleForm();
 

  });


 
};



const DeleteProjectLocation = (data) => {
  if (!canUserDeleteProjectLocation(data.row)) {
    ElMessage({
      message: 'You do not have permission to delete this project location. Only Super Admins, National Staff, or the County Admin who created this location can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  console.log('----->', data)
  let formData = {}
  formData.id = data.row.id
  formData.model = 'project_location'

  DeleteRecord(formData)


  // remove the deleted object from array list 
  let index = projectLocations.value.indexOf(data.row);
  if (index !== -1) {
    projectLocations.value.splice(index, 1);
  }

}

// const locationOptions = ref([])
// const loading = ref(false)



 
const loading = ref(false)
const locationOptions = ref([])
const firstLoad = ref(true)

const remoteMethod = async (keyword) => {
  loading.value = true
  let model = implementation_scope.value

  // Dynamically assign associated models
  const associatedModels = model === 'settlement'
    ? ['county', 'subcounty', 'ward']
    : model === 'subcounty'
      ? ['county']
      : model === 'ward'
        ? ['subcounty', 'county']
        : []

  const formData = {
    model: model,
    searchField: 'name',
    searchKeyword: firstLoad.value ? '' : keyword, // only empty search on first load
    excludeGeom: false,
    excludeGeomAssoc: true,
    associated_multiple_models: associatedModels,
    filters: [],
    filterValues: [],
    limit: 50, // Limit to first 10 records
    offset: 0
  }

  try {
    const res = await searchByKeyWord(formData)

    if (res.data && res.data.length > 0) {
      locationOptions.value = res.data.map(item => {
        const base = {
          value: item.id,
          label: item.name,
          name: item.name,
          geom: item.geom,
          implementer:programme_implementation_id.value
        }

        if (model === 'settlement') {
          return {
            ...base,
            settlement_id: item.id,
            county: item.county?.name,
            subcounty: item.subcounty?.name,
            ward: item.ward?.name,
            county_id: item.county?.id,
            subcounty_id: item.subcounty?.id,
            ward_id: item.ward?.id
          }
        } else if (model === 'subcounty') {
          return {
            ...base,
            county: item.county?.name,
            county_id: item.county?.id
          }
        } else if (model === 'ward') {
          return {
            ...base,
            subcounty: item.subcounty?.name,
            county: item.county?.name,
            subcounty_id: item.subcounty?.id,
            county_id: item.county?.id
          }
        } else {
          return base
        }
      })
    }

    firstLoad.value = false // Disable first load flag after first run
    
  } catch (error) {
    console.error("Search error:", error)
  }

  loading.value = false
}


const extra_locations = ref([])


const SaveLocation = async () => {
  var form = {};
  form.model = 'project_location';

  console.log('project_id', project_id.value);
  console.log('locations', extra_locations.value);

  const location_objects = [];

  // Loop through each extra location to build location objects
  for (let i = 0; i < extra_locations.value.length; i++) {
    console.log(extra_locations.value[i]);

    let obj = {};
    obj.project_id = project_id.value;
    obj.implementer = extra_locations.value[i].implementer;
    
    // Check if the location is for settlement, county, subcounty, or ward and assign accordingly
    if (implementation_scope.value == 'settlement') {
      obj.settlement_id = extra_locations.value[i].value;
      obj.ward_id = extra_locations.value[i].ward_id;
      obj.subcounty_id = extra_locations.value[i].subcounty_id;
      obj.county_id = extra_locations.value[i].county_id;
      obj.location_type = 'settlement';
      obj.location_name = extra_locations.value[i].name;
      obj.geom = extra_locations.value[i].geom;
   

      
    } else if (implementation_scope.value == 'county') {
      // If it's a county, only include county_id
      obj.county_id = extra_locations.value[i].value;
      obj.location_type = 'county';
      obj.location_name = extra_locations.value[i].name;
      obj.geom = extra_locations.value[i].geom;
    } else if (implementation_scope.value == 'subcounty') {      // If it's a subcounty, only include subcounty_id and related county
      obj.subcounty_id = extra_locations.value[i].value;
      obj.county_id = extra_locations.value[i].county_id; // Ensure county_id is linked
      obj.location_type = 'subcounty';
      obj.location_name = extra_locations.value[i].name;
      obj.geom = extra_locations.value[i].geom;
    } else if (implementation_scope.value == 'ward') {
      // If it's a ward, only include ward_id and related subcounty, county
      obj.ward_id = extra_locations.value[i].value;
      obj.subcounty_id = extra_locations.value[i].subcounty_id; // Ensure subcounty_id is linked
      obj.county_id = extra_locations.value[i].county_id; // Ensure county_id is linked

      obj.location_type = 'ward';
      obj.location_name = extra_locations.value[i].name;
      obj.geom = extra_locations.value[i].geom;
    }

    location_objects.push(obj);
    console.log('obj', obj);
  }

  form.data = location_objects;
  console.log('formData', form);

  // Call BatchImportUpsert function to process the data
  const loc_res = await BatchImportUpsert(form);
  console.log('loc_res', loc_res);

  // After processing, update locations and reset the selection options
  await getLocations(project_id.value, locationCurrentPage.value, locationPageSize.value);

  // Empty the locations and reset other states
  extra_locations.value = [];
  locationOptions.value = [];
};



const dialogMap = ref(false)





const openMapDialog = async (data) => {
  projectGeom.value = null
  console.log(data)

  const projLocFormData = {}
  projLocFormData.model = 'project_location'
  projLocFormData.id = data.row.id
  projLocFormData.assocModel='ward'
 
  const res = await getOneSettlement(projLocFormData)

     console.log(res.data)

 // const proj_geom = prj_res.data[0].json_build_object
  //var proj_centroid = turf.centroid(res.data.geom);
 // console.log('centroid', proj_centroid)
  projectGeom.value = res.data

  console.log('  projectGeom.value', projectGeom.value)

  // Check if res.data.geom is null, and if so, fall back to res.data.ward.geom
if (!res.data.geom) {
  projectGeom.value.geom = res.data.ward.geom;
}


  dialogMap.value = true




  setTimeout(loadMap, 100); // delay for the dialog to fully load
  //loadMap()
}



const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    line_string: true,
    polygon: true,
    trash: true
  },

})

 
const handleSaveClick = async () => { 

 
  projectGeom.value.model = 'project_location'
  console.log(projectGeom.value)

 updateOneRecord(projectGeom.value)
}
 


function addHomeButton(map) {
  class HomeButton {
    onAdd(map) {
      const div = document.createElement("div");
      div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
      div.id = "save-button";

      // Use a nice outlined save icon (Heroicons style)
      div.innerHTML = `
        <button style="background: none; border: none; padding: 6px; cursor: pointer;" title="Save Location">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </button>
      `;


    


      div.addEventListener("contextmenu", (e) => e.preventDefault());
      div.addEventListener("click", () => {
        handleSaveClick(); // Call your function
      });

      return div;
    }
  }

  const homeButton = new HomeButton();
  map.addControl(homeButton, "bottom-left");
}




const loadMap = () => {

  let centroid = turf.centroid(projectGeom.value.geom)
  console.log(centroid.geometry.coordinates)
  
  var mapCenter = centroid.geometry.coordinates;

  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter, // starting position
    zoom: 12,
  });



  nmap.on("load", () => {
    nmap.addLayer({
      id: "Satellite",
      source: { type: "raster", url: "mapbox://mapbox.satellite", tileSize: 256 },
      type: "raster",
    });

    nmap.addLayer({
      id: "Streets",
      source: { type: "raster", url: "mapbox://mapbox.streets", tileSize: 256 },
      type: "raster",
    });

    nmap.setLayoutProperty("Satellite", "visibility", "none");

    const layers = [
      {
        id: "Satellite",
        title: "Satellite",
        visibility: "none",
        type: "base",
      },
      {
        id: "Streets",
        title: "Streets",
        visibility: "none",
        type: "base",
      },
    ];

    // Function to determine the geometry type and add corresponding layers
    const addLayerBasedOnGeometry = (nmap, projectGeom) => {
      // Check the geometry type
      console.log('projectGeom.value.geom',projectGeom.value.geom)
      const geometryType = projectGeom.value.geom?.type;
      console.log('geometryType', geometryType)

      if (geometryType) {
        // Add point layer if geometry is a point
        if (geometryType === 'Point') {
          nmap.addLayer({
            id: 'point-layer',
            type: 'circle',
            source: {
              type: 'geojson',
              data: projectGeom.value.geom,
            },
            paint: {
              'circle-color': 'red',
              'circle-radius': 6,
            },
            filter: ['==', '$type', 'Point'],
          });


            // Create a new popup
            const coords = projectGeom.value.geom.coordinates;
                const lat = coords[1].toFixed(5);
                const lng = coords[0].toFixed(5);

                const project_popup = new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`<h3>Project Location</h3><p> (${lat}, ${lng})</p>`);



            // Add marker to the map
            // Create a new marker and set its position
            const proj_marker = new mapboxgl.Marker()
              .setLngLat(projectGeom.value.geom.coordinates) // Set the marker position using the GeoJSON coordinates
              .addTo(nmap); // Add the marker to the map

        // Attach the popup to the marker
        proj_marker.setPopup(project_popup).togglePopup(); // Automatically open the popup when the marker is added to the map



        }

        // Add polygon layer as outline if geometry is a polygon or multipolygon
        if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
          nmap.addLayer({
            id: 'polygon-layer',
            type: 'line', // Display as line for the polygon outline
            source: {
              type: 'geojson',
              data: projectGeom.value.geom,
            },
            paint: {
              'line-color': 'red', // Outline color
              'line-width': 2, // Outline width
            },
            filter: ['in', '$type', 'Polygon' ], // Include Polygon and MultiPolygon
          });


           // Fit map to bounds of the FeatureCollection
              const bounds = turf.bbox(projectGeom.value.geom); // [minX, minY, maxX, maxY]
              nmap.fitBounds(bounds, {
                padding: 40,
                animate: true,
              });


        }

        // Add line layer if geometry is a LineString or MultiLineString
        if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
          nmap.addLayer({
            id: 'line-layer',
            type: 'line',
            source: {
              type: 'geojson',
              data: projectGeom.value.geom,
            },
            paint: {
              'line-color': 'red', // Line color
              'line-width': 3, // Line width
            },
            filter: ['in', '$type', 'LineString'], // Include LineString (you can omit this if you're using a pure LineString GeoJSON)
          });

          // Fit map to bounds of the line
          const bounds = turf.bbox(projectGeom.value.geom); // [minX, minY, maxX, maxY]
          nmap.fitBounds(bounds, {
            padding: 40,
            animate: true,
          });
        }



        // Add project location layer (also point layer as in your initial code)
        if (geometryType === 'Point') {
          nmap.addLayer({
            id: 'project-layer',
            type: 'circle',
            source: {
              type: 'geojson',
              data: projectGeom.value.geom,
            },
            paint: {
              'circle-color': 'blue', // Change the color for project layer
              'circle-radius': 8, // Slightly larger radius for project location
            },
            filter: ['==', '$type', 'Point'],
          });
        }
      }
    };

    // Example usage (ensure 'nmap' and 'projectGeom' are properly defined)
    addLayerBasedOnGeometry(nmap, projectGeom);


  
  
   



    console.log(nmap)

    nmap.addControl(new MapboxLayerSwitcherControl(layers));

    const nav = new mapboxgl.NavigationControl();
    nmap.addControl(nav, "top-left");
    nmap.addControl(draw, 'top-left');




    nmap.resize();







  });




  
  function updateRuleform(feature) {
    // do something with the new marker feature
    var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
    feature.geometry.crs = crs
    console.log('----feature', feature);



    projectGeom.value.geom = feature.geometry
    console.log(projectGeom.value)
 
  

  }

  // listen for the draw.create event
  nmap.on('draw.create', function (e) {
    // check if the new feature is a marker
    // if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    //  }
  });


  // listen for the draw.se event
  nmap.on('draw.update', function (e) {
    // check if the new feature is a marker
    //if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    // }
  });

  // Listen for the draw.delete event
  nmap.on('draw.delete', function (event) {
    // Get the IDs of the deleted features
    var deletedFeatureIds = event.features.map(function (feature) {
      return feature.id;
    });

    // Remove the corresponding layers from the map
    deletedFeatureIds.forEach(function (id) {
      nmap.removeLayer(id);
    });


     




  });

 



  

  addHomeButton(nmap)



};





const closeMap = () => {

  dialogMap.value = false
}

const loadAllLocationsMap = (featureCollection) => {
  const centroid = turf.centroid(featureCollection);
  const mapCenter = centroid.geometry.coordinates;

  const nmap = new mapboxgl.Map({
    container: "mapContainerAll",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter,
    zoom: 5,
  });

  nmap.on("load", () => {
    // Add base layers
    nmap.addLayer({
      id: "Satellite",
      source: { type: "raster", url: "mapbox://mapbox.satellite", tileSize: 256 },
      type: "raster",
    });

    nmap.addLayer({
      id: "Streets",
      source: { type: "raster", url: "mapbox://mapbox.streets", tileSize: 256 },
      type: "raster",
    });

    nmap.setLayoutProperty("Satellite", "visibility", "none");

    // Add FeatureCollection as a source
    nmap.addSource("project-data", {
      type: "geojson",
      data: featureCollection,
    });

    // Add layers for each feature type

    // Points layer
    nmap.addLayer({
      id: 'points',
      type: 'circle',
      source: 'project-data',
      paint: {
        'circle-color': 'red',
        'circle-radius': 6,
      },
      filter: ['==', '$type', 'Point'],
    });

    // Polygons layer (fill and outline)
    nmap.addLayer({
      id: 'polygons-fill',
      type: 'fill',
      source: 'project-data',
      paint: {
        'fill-color': 'rgba(0, 0, 255, 0.01)', // More transparent fill
        'fill-outline-color': 'red', // Outline color
      },
      filter: ['==', '$type', 'Polygon'],
    });

    nmap.addLayer({
      id: 'polygons-outline',
      type: 'line',
      source: 'project-data',
      paint: {
        'line-color': 'red',
        'line-width': 2,
      },
      filter: ['==', '$type', 'Polygon'],
    });

    // Fit map to bounds of the FeatureCollection
    const bounds = turf.bbox(featureCollection); // [minX, minY, maxX, maxY]
    nmap.fitBounds(bounds, {
      padding: 40,
      animate: true,
    });

    // Add controls
    nmap.addControl(new mapboxgl.NavigationControl(), "top-left");
    nmap.resize();
  });

  // Handle click events for different layers
  nmap.on('click', 'points', (e) => {
    const feature = e.features[0];
    //const coordinates = feature.geometry.coordinates.slice();

    const centroid = turf.centroid(feature);
    const coordinates = centroid.geometry.coordinates;
    console.log('coordinates', coordinates)

    const properties = feature.properties;

    let popupContent = `<h4>Location Details</h4>`;
    popupContent += `<strong>Location:</strong> ${properties['location_name']}, ${properties['location_type']} `;



    new mapboxgl.Popup({ offset: 25 })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(nmap);
  });

  nmap.on('click', 'polygons-fill', (e) => {
    const feature = e.features[0];
    // const coordinates = feature.geometry.coordinates[0]; // Polygons have an array of coordinates
    const properties = feature.properties;


    const centroid = turf.centroid(feature);
    const coordinates = centroid.geometry.coordinates;
    console.log('coordinates', coordinates)


    let popupContent = `<strong><h4>Location Details</h4></strong>`;
    popupContent += `<li><strong>Location:</strong> ${properties['location_name']}, ${properties['location_type']} </li>`;


    new mapboxgl.Popup({ offset: 25 })
      .setLngLat(coordinates) // Set popup at the first coordinate of the polygon
      .setHTML(popupContent)
      .addTo(nmap);
  });


  // Remove the popup when mouse leaves the feature
  nmap.on('mouseleave', 'points', (e) => {
    if (e.target.popup) e.target.popup.remove();
  });

  nmap.on('mouseleave', 'polygons-fill', (e) => {
    if (e.target.popup) e.target.popup.remove();
  });



  function addInfo(map) {
    class LayerButton {
      onAdd(map) {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.innerHTML = icon.value;
        div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => toggleFloatingDiv(nmap));

        return div;
      }
    }
    const lryButton = new LayerButton();
    nmap.addControl(lryButton, "top-right");
  }
  addInfo(nmap)

};


function disabledFutureDates(date) {
  const today = new Date();
  return date.getTime() > today.getTime(); // Disable dates after today
}


const getSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];

  const advanceTotal = data.reduce((sum, row) => sum + parseMoney(row.advance_recovered), 0);
  const lastRow = data.length ? data[data.length - 1] : null;
  const { advanceGranted, advanceOutstanding } = ipcSummary.value;

  columns.forEach((column, index) => {
    if (column.type === 'expand' || !column.property) {
      sums[index] = '';
      return;
    }

    if (column.property === 'certificate') {
      sums[index] = 'Total';
    } else if (column.property === 'gross' || column.property === 'amount') {
      sums[index] =
        lastRow?.contractBalanceAfter != null
          ? formatCostDisplay(lastRow.contractBalanceAfter)
          : '';
    } else if (
      column.property === 'advanceBalance'
      || column.property === 'advance_recovered'
      || column.property === 'advanceRecoveredThisRow'
    ) {
      sums[index] =
        advanceGranted > 0 || advanceTotal > 0
          ? formatCostDisplay(advanceOutstanding)
          : '';
    } else if (column.property === 'cumulative') {
      sums[index] =
        lastRow?.cumulative != null ? formatCostDisplay(lastRow.cumulative) : '';
    } else {
      sums[index] = '';
    }
  });

  return sums;
};

const getAdvanceSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  const total = data.reduce((sum, row) => sum + parseMoney(row.gross ?? row.amount), 0)

  columns.forEach((column, index) => {
    if (!column.property) {
      sums[index] = ''
      return
    }
    if (column.property === 'description') {
      sums[index] = 'Total'
    } else if (column.property === 'gross' || column.property === 'amount') {
      sums[index] = formatCostDisplay(total)
    } else {
      sums[index] = ''
    }
  })

  return sums
}


const changeLocation = async (location: any) => {
  console.log('changeLocation', location)

  const selected_location = projectLocations.value.find(
    (item) => item.id === location
  );

  console.log('selected_location', selected_location)


  // A project_location row only has its own county/subcounty/ward FKs populated when
  // location_type matches that level; for a settlement-level location, fall back to the
  // settlement's own hierarchy (nested by the backend alongside project_location).
  ruleForm.county_id = selected_location.county_id ?? selected_location.settlement?.county?.id ?? null
  ruleForm.subcounty_id = selected_location.subcounty_id ?? selected_location.settlement?.subcounty?.id ?? null
  ruleForm.ward_id = selected_location.ward_id ?? selected_location.settlement?.ward?.id ?? null
  ruleForm.settlement_id = selected_location.settlement_id
  ruleForm.geom = selected_location.geom
  //ruleForm.project_location_id = location.id


  console.log('changeLocationruleForm', ruleForm)

}



function handleIndicatorsChange(selectedIds) {
  const selectedIndicators = indicatorsOptionsFiltered.value.filter(opt =>
    selectedIds.includes(opt.value)
  ); 

 console.log('selectedIds',selectedIds)

  ruleForm.indicators = selectedIndicators.map(ind => ({
    ...ind,
    amount: null,
    baseline: null,
    target: null,
    date: new Date(),
    cumProgress: null
  }));


  console.log('ruleForm.indicators',ruleForm.indicators)
}


const handleCancel = () => {
  disableIndicator.value = false
  AddDialogVisible.value = false
}



const handleClose = () => {

console.log("Closing the dialoig")
// showSubmitBtn.value = true
// //showEditSaveButton.value = false
// ruleForm.indicator_category_id = []
// ruleForm.date = null
// ruleForm.amount = null
// ruleForm.ward_id = null
// ruleForm.location = []
// ruleForm.indicators = []

// // /formHeader.value = 'Add M&E Report'
AddDialogVisible.value = false

}


function formatLocation(item) {
  if (item.settlement) {
    return [
      item.ward?.name,
      item.subcounty?.name,
      item.county?.name
    ].filter(Boolean).join(', ')
  } 
  else if (item.ward) {
    return [
      item.subcounty?.name,
      item.county?.name
    ].filter(Boolean).join(', ')
  } else if (item.subcounty) {
    return item.county?.name || ''
  } else {
    return '' // For county or if everything's missing
  }
}

</script>

<template>
  <el-card v-loading="isLoading">
    <!-- Header Section -->
    <template #header>
      <div class="card-header" :class="{ 'card-header--mobile': isMobile }">
        <div class="card-header-main">
          <el-button
            v-if="isMobile"
            type="primary"
            plain
            circle
            :icon="Back"
            aria-label="Back"
            @click="goBack"
            class="back-button"
          />
          <el-button
            v-else
            type="primary"
            plain
            :icon="Back"
            @click="goBack"
            class="back-button"
          >
            Back
          </el-button>
          <div class="project-title-wrap">
            <div class="project-title-row">
              <h1 class="project-title">
                {{ project_title || 'Project Details' }}
              </h1>
              <div
                v-if="projectFullData"
                class="project-header-tags project-header-tags--prominent"
                role="group"
                aria-label="Project status"
              >
                <el-tag v-if="projectFullData.status" :type="projectStatusTagType" effect="plain" size="small">
                  {{ projectFullData.status }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <el-tooltip v-if="showEditButtons && canEditProjectMeta && isMobile" content="Edit project" placement="top">
            <el-button type="success" :icon="Edit" plain circle class="edit-button" @click="editProject" />
          </el-tooltip>
          <el-button
            v-else-if="showEditButtons && canEditProjectMeta"
            type="success"
            :icon="Edit"
            plain
            class="edit-button"
            @click="editProject"
          >
            Edit Project
          </el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="activeName" type="border-card" class="demo-tabs" tab-position="top" @tab-click="handleTabClick">
      <el-tab-pane label="Project Details" name="details">
        <div v-if="isLoading" class="profile-tab-panel__loading">
          <div class="profile-tab-panel__spinner">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>Loading project profile...</p>
          </div>
        </div>
        <div v-show="!isLoading" class="profile-tab-panel__content project-details-sections">
          <div v-if="canUserDeleteProject(projectFullData)" class="project-details-actions">
            <el-popconfirm
              width="300"
              title="Are you sure to delete this project?"
              @confirm="DeleteProject(projectFullData.id)"
            >
              <template #reference>
                <el-button type="danger" plain>
                  <Icon icon="material-symbols:delete" style="margin-right: 5px;" />
                  Delete Project
                </el-button>
              </template>
            </el-popconfirm>
          </div>

          <div
            :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']"
          >
            <div
              :class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
              @click="collapsedSections.description = !collapsedSections.description"
            >
              <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
                Description
              </div>
              <Icon :icon="collapsedSections.description ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsedSections.description" :class="[`${prefixCls}-content`, 'p-10px']">
                <InlineEditableDescriptions
                  :data="projectProfile"
                  :schema="descriptionSchema"
                  :editable="canEditProjectInline"
                  :readonly-fields="readonlyInlineDescription"
                  :textarea-fields="inlineTextareaFields"
                  :clamp-fields="inlineClampFields"
                  :select-options="projectInlineSelectOptions"
                  :select-fields="inlineDescriptionSelectFields"
                  :saving-field="inlineSavingField"
                  :column="isMobile ? 1 : 2"
                  @save="saveProjectInline"
                />
              </div>
            </ElCollapseTransition>
          </div>

          <div
            :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']"
          >
            <div
              :class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
              @click="collapsedSections.implementation = !collapsedSections.implementation"
            >
              <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
                Implementation
              </div>
              <Icon :icon="collapsedSections.implementation ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsedSections.implementation" :class="[`${prefixCls}-content`, 'p-10px']">
                <InlineEditableDescriptions
                  :data="projectProfile"
                  :schema="implementationSchema"
                  :editable="canEditProjectInline"
                  :select-options="projectInlineSelectOptions"
                  :select-fields="inlineSelectFields"
                  :saving-field="inlineSavingField"
                  :column="isMobile ? 1 : 2"
                  @save="saveProjectInline"
                />
              </div>
            </ElCollapseTransition>
          </div>

          <div
            :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']"
          >
            <div
              :class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
              @click="collapsedSections.schedule = !collapsedSections.schedule"
            >
              <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
                Schedule & Budget
              </div>
              <Icon :icon="collapsedSections.schedule ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsedSections.schedule" :class="[`${prefixCls}-content`, 'p-10px']">
                <InlineEditableDescriptions
                  :data="projectProfile"
                  :schema="scheduleSchema"
                  :editable="canEditProjectInline"
                  :number-fields="inlineNumberFields"
                  :date-fields="inlineDateFields"
                  :saving-field="inlineSavingField"
                  :column="isMobile ? 1 : 2"
                  @save="saveProjectInline"
                />
              </div>
            </ElCollapseTransition>
          </div>

          <div
            :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']"
          >
            <div
              :class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
              @click="collapsedSections.metadata = !collapsedSections.metadata"
            >
              <div :class="[`${prefixCls}-header__title`, 'relative text-base font-medium ml-10px']">
                Record metadata
              </div>
              <Icon :icon="collapsedSections.metadata ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsedSections.metadata" :class="[`${prefixCls}-content`, 'p-10px']">
                <InlineEditableDescriptions
                  :data="projectMetadata"
                  :schema="metadataSchema"
                  :editable="false"
                  :readonly-fields="readonlyInlineMetadata"
                  :column="1"
                />
              </div>
            </ElCollapseTransition>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="!isNationalProject" label="Locations" name="Locations">
        <el-button v-if="canCreateProjectLocation" @click="AddLocation" style="margin-left :5px;margin-bottom :5px; " plain>
          <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add Location
        </el-button>


        <el-table :data="paginatedProjectLocations" border>
          <el-table-column label="#" width="70">
            <template #default="{ $index }">
              {{ rowNumber($index, locationCurrentPage, locationPageSize) }}
            </template>
          </el-table-column>

          <el-table-column label="County" prop="county.name" />
          <el-table-column label="Subcounty" prop="subcounty.name" />
          <el-table-column label="Ward" prop="ward.name" />
          <el-table-column label="Settlement" prop="settlement.name" />

          <el-table-column label="Actions" width="280">
            <template #default="scope">
              <el-button v-if="canUpdateProjectLocation" size="small" :icon="Position" @click="openMapDialog(scope)" type="primary" plain>
                Edit Location 
              </el-button>

              <el-button 
                v-if="canUserDeleteProjectLocation(scope.row)"
                size="small" type="danger" :icon="Delete" @click="DeleteProjectLocation(scope)" plain>
                Delete
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <ElPagination
          v-if="projectLocations && projectLocations.length"
          :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
          v-model:currentPage="locationCurrentPage"
          v-model:page-size="locationPageSize"
          :page-sizes="[5, 10, 20, 50, 100]"
          :total="projectLocationsTotal"
          :background="true"
          class="mt-3"
          @size-change="handleLocationSizeChange"
          @current-change="handleLocationPageChange"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
        />

   
        <el-dialog
          v-model="ShowLocationAddDialog"
          title="Add Project Location"
          :width="projectFormDialogWidth"
          :draggable="!isMobile"
          append-to-body
          align-center
          class="project-details-dialog"
          :class="{ 'project-details-dialog--mobile': isMobile }"
          :before-close="handleCloseAdd"
        >
          <div class="location-add-dialog-body">
            <el-select
              id="location-select"
              v-model="extra_locations"
              multiple
              filterable
              remote
              reserve-keyword
              :loading="loading"
              :placeholder="'Search ' + implementation_scope"
              :remote-method="remoteMethod"
              :size="isMobile ? 'large' : 'default'"
              class="location-add-dialog-select"
            >
              <el-option v-for="item in locationOptions" :key="item.id" :label="item.label" :value="item">
                <div class="location-option-row">
                  <span class="location-option-label">{{ item.label }}</span>
                  <span class="location-option-meta">
                    {{ item.ward ? item.ward + ', ' : '' }}{{ item.subcounty ? item.subcounty + ', ' : '' }}{{ item.county }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </div>
          <template #footer>
            <div
              class="project-details-dialog-footer"
              :class="{ 'project-details-dialog-footer--mobile': isMobile }"
            >
              <el-button :size="isMobile ? 'large' : 'default'" @click="ShowLocationAddDialog = false">
                Cancel
              </el-button>
              <el-button :size="isMobile ? 'large' : 'default'" type="primary" @click="SaveLocation">
                <Icon icon="ic:round-save" style="margin-right: 6px;" />
                Save
              </el-button>
            </div>
          </template>
        </el-dialog>



        <el-dialog
          v-model="dialogMap"
          :width="projectWideDialogWidth"
          :fullscreen="isMobile"
          :draggable="!isMobile"
          append-to-body
          align-center
          class="project-details-dialog project-details-map-dialog"
          :class="{ 'project-details-dialog--mobile': isMobile, 'project-details-map-dialog--mobile': isMobile }"
          :before-close="closeMap"
          :show-close="false"
        >
          <template #header="{ titleId, titleClass }">
            <div class="my-header" :class="{ 'my-header--mobile': isMobile }">
              <div class="my-header-titles">
                <h4 :id="titleId" :class="titleClass">Project Location</h4>
                <h2 class="map-status-text">{{ locationStatus }}</h2>
              </div>
              <el-button type="danger" :icon="CircleCloseFilled" :size="isMobile ? 'large' : 'default'" @click="closeMap">
                Close Map
              </el-button>
            </div>
          </template>
          <div id="mapContainer" class="basemap" :class="{ 'basemap--mobile': isMobile }"></div>
        </el-dialog>


      </el-tab-pane>




      <el-tab-pane v-if="!isNationalProject && projectLocations.length > 0" label="Map" name="map">
        <div id="mapContainerAll" class="basemap"></div>
      </el-tab-pane>



      <el-tab-pane label="Scope" name="Scope">
        <div class="project-scope-panel">
          <el-row :gutter="8" class="project-scope-toolbar" align="middle">
            <el-col
              :xs="isMobile && scopeActionButtonCount > 0 ? 14 : 24"
              :md="14"
              :lg="16"
            >
              <div class="project-scope-summary" :class="{ 'project-scope-summary--mobile': isMobile }">
                <span class="project-scope-summary-count">
                  {{ selectedScopeCount }} of {{ totalScopeCount }} in scope
                </span>
                <span v-if="canManageProjectScope && !isMobile" class="project-scope-summary-hint">
                  Move activities between panels, then save changes.
                </span>
              </div>
            </el-col>
            <el-col
              v-if="scopeActionButtonCount > 0"
              :xs="isMobile ? 10 : 24"
              :md="10"
              :lg="8"
              class="project-scope-actions-col"
            >
              <div v-if="isMobile" class="project-scope-mobile-actions">
                <el-tooltip v-if="canManageProjectScope" content="Save changes" placement="top">
                  <el-button type="success" plain circle class="project-scope-icon-btn" @click="updateChanges">
                    <Icon icon="ic:round-save" width="22" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="canCreateActivity" content="Add activity" placement="top">
                  <el-button type="primary" plain circle class="project-scope-icon-btn" @click="openAddActivityDialog">
                    <Icon icon="material-symbols:add" width="22" />
                  </el-button>
                </el-tooltip>
              </div>
              <el-row v-else :gutter="8" justify="end">
                <el-col v-if="canManageProjectScope" :xs="scopeActionColSpan" :sm="scopeActionColSpan">
                  <el-button class="project-scope-action-btn" type="success" plain @click="updateChanges">
                    <Icon icon="ic:round-save" style="color: green; margin-right: 5px;" size="24" />
                    Save Changes
                  </el-button>
                </el-col>
                <el-col v-if="canCreateActivity" :xs="scopeActionColSpan" :sm="scopeActionColSpan">
                  <el-button class="project-scope-action-btn" type="primary" plain @click="openAddActivityDialog">
                    <Icon icon="material-symbols:add" style="color: green; margin-right: 5px;" size="20" />
                    Add Activity
                  </el-button>
                </el-col>
              </el-row>
            </el-col>
          </el-row>

          <div v-if="sortedActivityOptions.length === 0" class="project-scope-empty">
            <p>No activities available.</p>
            <el-tooltip v-if="canCreateActivity && isMobile" content="Add activity" placement="top">
              <el-button type="primary" plain circle @click="openAddActivityDialog">
                <Icon icon="material-symbols:add" width="22" />
              </el-button>
            </el-tooltip>
            <el-button v-else-if="canCreateActivity" type="primary" plain @click="openAddActivityDialog">
              <Icon icon="material-symbols:add" style="margin-right: 5px;" />
              Add Activity
            </el-button>
          </div>

          <template v-else>
            <el-transfer
              v-model="projectScopeChecked"
              :data="scopeTransferData"
              :props="{ key: 'key', label: 'label' }"
              :titles="['Available', 'Selected']"
              filterable
              filter-placeholder="Search activities"
              :disabled="!canManageProjectScope"
              :class="['project-scope-transfer', { 'project-scope-transfer--mobile': isMobile }]"
            />
          </template>
        </div>
      </el-tab-pane>

      <el-dialog
        v-model="ShowActivityAddDialog"
        title="Add Activity"
        :width="projectDialogWidth"
        :draggable="!isMobile"
        append-to-body
        align-center
        destroy-on-close
        class="project-details-dialog"
        :class="{ 'project-details-dialog--mobile': isMobile }"
        @close="closeAddActivityDialog"
      >
        <el-form
          ref="activityFormRef"
          :model="activityForm"
          :rules="activityFormRules"
          label-position="top"
          class="project-details-form"
          @submit.prevent="submitNewActivity"
        >
          <el-form-item label="Title" prop="title">
            <el-input
              v-model="activityForm.title"
              placeholder="Activity title"
              :size="isMobile ? 'large' : 'default'"
              autofocus
            />
          </el-form-item>
          <el-form-item label="Short Title" prop="shortTitle">
            <el-input
              v-model="activityForm.shortTitle"
              placeholder="Short title"
              :size="isMobile ? 'large' : 'default'"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div
            class="project-details-dialog-footer"
            :class="{ 'project-details-dialog-footer--mobile': isMobile }"
          >
            <el-button
              :size="isMobile ? 'large' : 'default'"
              :disabled="activitySubmitting"
              @click="closeAddActivityDialog"
            >
              Cancel
            </el-button>
            <el-button
              type="primary"
              :size="isMobile ? 'large' : 'default'"
              :loading="activitySubmitting"
              @click="submitNewActivity"
            >
              Add Activity
            </el-button>
          </div>
        </template>
      </el-dialog>



      <el-tab-pane label="Monitoring" name="Indicator">
        <el-card>

          <el-button v-if="canAddMonitoringReport" @click="AddReport" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add Report/Achievement
          </el-button>

          <el-table :data="indicatorReports" border :row-class-name="tableRowClassName" ref="tableRef">
            <el-table-column label="#" width="80" prop="id" sortable>
              <template #default="scope">
                <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
                  <span>{{ scope.row.id }}</span>
                  <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Indicator  " width="400" sortable>
              <template #default="{ row }">
                <div>
                  <span> {{ row.indicator_category.indicator_name }} {{ row.indicator_category.category_title }} </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Date" prop="date" sortable>
              <template #default="scope">
                {{ formatDate(scope.row.date) }}
              </template>
            </el-table-column>
            <!-- <el-table-column label="Amount" prop="amount" sortable /> -->

         
        <el-table-column label="Qty/Status" sortable>
            <template #default="{ row }">
              <span v-if="row.qualitative !== null">
                {{ row.qualitative === 'Yes' ? 'Yes' : 'No' }}
              </span>
              <span v-else>
                {{ row.amount }}
              </span>
            </template>
          </el-table-column>



            <el-table-column label="Amount (cumulutaive)" prop="cumAmount" sortable />
            <el-table-column label="Status" prop="status" sortable>
              <template #default="scope">
                <div v-if="scope.row.status === 'Rejected'">
                  <el-tooltip :content="'Reason for rejection: ' + scope.row.reject_msg" placement="top">
                    <span>{{ scope.row.status }}</span>
                  </el-tooltip>
                </div>
                <div v-else>
                  <span>{{ scope.row.status }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="Documentation" name="documents">
        <el-card v-loading="documentsLoading">
          <el-table :data="paginatedProjectDocuments" style="width: 100%">
            <el-table-column label="#" width="70">
              <template #default="{ $index }">
                {{ rowNumber($index, docsCurrentPage, docsPageSize) }}
              </template>
            </el-table-column>
            <el-table-column label="Name">
              <template #default="{ row }">
                {{ row.name }}
                <el-tag v-if="row._isLinked" size="small" type="info" style="margin-left:6px;">Linked</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type" />
            <el-table-column prop="createdAt" label="Uploaded">
              <template #default="{ row }">
                {{ formatDateDisplay(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="Size (MB)">
              <template #default="{ row }">
                {{
                  row.size
                    ? Number(row.size).toFixed(2)
                    : (row.raw?.size ? (row.raw.size / 1024 / 1024).toFixed(2) : '—')
                }}
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="" :width="isMobile ? 132 : undefined" align="center">
              <template #default="scope">
                <div class="doc-table-actions">
                  <el-tooltip
                    :content="downloadingDocId === scope.row.id ? 'Downloading…' : 'Download'"
                    placement="top"
                    :disabled="!isMobile"
                  >
                    <el-button
                      plain
                      :circle="isMobile"
                      :size="isMobile ? 'small' : 'default'"
                      :loading="downloadingDocId === scope.row.id"
                      :disabled="downloadingDocId === scope.row.id"
                      @click="downloadFile(scope.row)"
                    >
                      <Icon icon="fa-solid:download" :style="isMobile ? undefined : 'margin-right: 5px;'" />
                      <template v-if="!isMobile">
                        <span v-if="downloadingDocId === scope.row.id">Downloading…</span>
                        <span v-else>Download</span>
                      </template>
                    </el-button>
                  </el-tooltip>

                  <el-tooltip v-if="canUserDeleteDocument(scope.row)" content="Remove" placement="top" :disabled="!isMobile">
                    <el-button
                      plain
                      type="danger"
                      :circle="isMobile"
                      :size="isMobile ? 'small' : 'default'"
                      @click="RemoveDocument(scope.row)"
                    >
                      <Icon icon="material-symbols-light:delete-outline" :style="isMobile ? undefined : 'margin-right: 5px;'" />
                      <span v-if="!isMobile">Remove</span>
                    </el-button>
                  </el-tooltip>

                  <el-popconfirm
                    v-if="canUserUnlinkDocument(scope.row)"
                    title="Unlink this document from this project? The document will not be deleted."
                    confirm-button-text="Unlink"
                    cancel-button-text="Cancel"
                    @confirm="handleUnlinkDocument(scope.row)"
                  >
                    <template #reference>
                      <span class="doc-action-trigger">
                        <el-button
                          plain
                          type="warning"
                          :circle="isMobile"
                          :size="isMobile ? 'small' : 'default'"
                          :title="isMobile ? 'Unlink' : undefined"
                          aria-label="Unlink"
                        >
                          <Icon icon="mdi:link-off" :style="isMobile ? undefined : 'margin-right: 5px;'" />
                          <span v-if="!isMobile">Unlink</span>
                        </el-button>
                      </span>
                    </template>
                  </el-popconfirm>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <ElPagination
            v-if="projectDocuments && projectDocuments.length"
            :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
            v-model:currentPage="docsCurrentPage"
            v-model:page-size="docsPageSize"
            :page-sizes="[5, 10, 20, 50, 100]"
            :total="projectDocumentsTotal"
            :background="true"
            class="mt-3"
            @size-change="handleDocsSizeChange"
            @current-change="handleDocsPageChange"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
          />
          <div v-if="canUploadProjectDocument" class="project-docs-actions">
            <el-tooltip content="Upload" placement="top" :disabled="!isMobile">
              <el-button plain :circle="isMobile" @click="toggleComponent()">
                <Icon icon="fa-solid:upload" :style="isMobile ? undefined : 'margin-right: 10px'" />
                <span v-if="!isMobile">Upload</span>
              </el-button>
            </el-tooltip>
            <UploadShareDialog entity-type="project" :entity-id="project_id" />
          </div>
        </el-card>

      </el-tab-pane>


      <el-tab-pane label="Team" name="team">
        <el-card>
          <el-button v-if="canManageProjectTeam" @click="AddTeam" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add Team
          </el-button>
          <el-table :data="projectTeamData" style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="phone" label="Phone" />
            <el-table-column prop="email" label="Email" />
            <el-table-column prop="role" label="Role" />
            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button 
                  v-if="canUserDeleteTeamMember(scope.row)"
                  plain type="danger" @click="RemoveTeamMember(scope.row)">
                  <Icon icon="material-symbols-light:delete-outline" style="  margin-right: 5px;" />
                  Remove
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

      </el-tab-pane>

      <el-tab-pane v-if="showClockInTab" label="Clock-In" name="clockin">
        <el-card>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap;">
            <el-date-picker
              v-model="clockDateRange"
              type="daterange"
              range-separator="to"
              start-placeholder="Start date"
              end-placeholder="End date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="applyClockFilters"
            />

            <el-date-picker
              v-model="clockMonth"
              type="month"
              placeholder="Select month"
              format="YYYY-MM"
              value-format="YYYY-MM"
              @change="applyClockFilters"
            />

            <el-button plain type="primary" @click="applyClockFilters">Apply</el-button>
            <el-button plain @click="clearClockFilters">Clear</el-button>

            <DownloadCustom
              :data="clockInHistory"
              model="project_clockin"
              :associated_models="['project','project_team','project_location']"
              :loading="downloadClockLoading"
              @download-start="downloadClockLoading = true"
              @download-end="downloadClockLoading = false"
                      :filters="filters"
                      :filter-values="filterValues"
/>
          </div>

          <el-table :data="clockInHistory" style="width: 100%" border>
            <el-table-column type="index" width="50" label="#" />
            <el-table-column label="Name" width="180">
              <template #default="scope">
                {{ scope.row.teamMember?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="Role" width="150">
              <template #default="scope">
                {{ scope.row.teamMember?.role || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="Site" width="200">
              <template #default="scope">
                {{ scope.row.projectLocation?.location_name || '-' }}
              </template>
            </el-table-column>
              <el-table-column label="Map" width="100">
                <template #default="scope">
                  <el-button size="small" type="primary" plain @click="openClockMap(scope.row)">
                    <Icon icon="mdi:map" style="margin-right: 4px;" />
                    Map
                  </el-button>
                </template>
              </el-table-column>
            <el-table-column label="Clock In Time" width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.clock_in_time) }}
              </template>
            </el-table-column>
            <el-table-column label="Status" width="120">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'active'" type="success">Active</el-tag>
                <el-tag v-else-if="scope.row.status === 'completed'" type="info">Completed</el-tag>
                <el-tag v-else type="warning">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Hours Worked" width="120">
              <template #default="scope">
                {{ scope.row.total_hours ? scope.row.total_hours + ' hrs' : '—' }}
              </template>
            </el-table-column>
            <el-table-column label="Notes" min-width="200">
              <template #default="scope">
                {{ scope.row.notes || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
        <el-dialog
          v-model="clockDialogMap"
          :width="projectWideDialogWidth"
          :fullscreen="isMobile"
          :draggable="!isMobile"
          append-to-body
          align-center
          class="project-details-dialog project-details-map-dialog"
          :class="{ 'project-details-dialog--mobile': isMobile, 'project-details-map-dialog--mobile': isMobile }"
          :before-close="closeClockMap"
          :show-close="false"
        >
          <template #header="{ titleId, titleClass }">
            <div class="my-header" :class="{ 'my-header--mobile': isMobile }">
              <h4 :id="titleId" :class="titleClass">Clock-in Location</h4>
              <el-button type="danger" :icon="CircleCloseFilled" :size="isMobile ? 'large' : 'default'" @click="closeClockMap">
                Close Map
              </el-button>
            </div>
          </template>
          <div id="clockMapContainer" class="basemap" :class="{ 'basemap--mobile': isMobile }"></div>
        </el-dialog>
      </el-tab-pane>


      <el-tab-pane label="Contractors & Consultants" name="contractor">
        <el-card>

          <el-button v-if="canManageProjectContractors" @click="AddContractorTeam" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add contractor / consultant
          </el-button>
          <el-table :data="projectContractors" style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="role" label="Role" min-width="140">
              <template #default="{ row }">
                <el-tag v-if="row.role" :type="contractorRoleTagType(row.role)" effect="plain" size="small">
                  {{ row.role }}
                </el-tag>
                <span v-else>—</span>
              </template>
            </el-table-column>
            <el-table-column prop="scope" label="Scope" />

            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button 
                  v-if="canUserDeleteContractor(scope.row)"
                  plain type="danger" @click="RemoveContractor(scope.row)">
                  <Icon icon="material-symbols-light:delete-outline" style="  margin-right: 5px;" />
                  Remove
                </el-button>


              </template>
            </el-table-column>

          </el-table>
        </el-card>

      </el-tab-pane>


      <el-tab-pane label="IPC / Disbursements" name="disbursement">
        <el-card class="ipc-disbursements-card">
          <div class="ipc-summary-compact">
            <div class="ipc-summary-compact__metrics">
              <span class="ipc-metric">
                <span class="ipc-metric__label">Contract</span>
                <strong class="ipc-metric__value">
                  {{ ipcSummary.contract > 0 ? formatCostDisplay(ipcSummary.contract) : '—' }}
                </strong>
              </span>
              <span class="ipc-metric">
                <span class="ipc-metric__label">Paid</span>
                <strong class="ipc-metric__value">
                  {{ formatCostDisplay(ipcSummary.paidGross) }}
                </strong>
                <small v-if="ipcSummary.pctPaid != null">({{ ipcSummary.pctPaid.toFixed(1) }}%)</small>
              </span>
              <span class="ipc-metric ipc-metric--balance">
                <span class="ipc-metric__label">Total left</span>
                <strong class="ipc-metric__value ipc-metric__value--balance">
                  {{
                    ipcSummary.balance != null
                      ? formatCostDisplay(Math.max(0, ipcSummary.balance))
                      : '—'
                  }}
                </strong>
              </span>
              <span v-if="showIpcAdvanceColumns" class="ipc-metric">
                <span class="ipc-metric__label">Advance outstanding</span>
                <strong class="ipc-metric__value">
                  {{ formatCostDisplay(ipcSummary.advanceOutstanding) }}
                </strong>
              </span>
              <span
                v-if="showDisbursementLocationPanel && averageLocationProgress != null"
                class="ipc-metric"
              >
                <span class="ipc-metric__label">Site progress</span>
                <strong class="ipc-metric__value">{{ averageLocationProgress.toFixed(1) }}%</strong>
              </span>
            </div>
            <el-progress
              v-if="showDisbursementLocationPanel && averageLocationProgress != null"
              :percentage="Math.min(100, Math.round(averageLocationProgress))"
              :stroke-width="6"
              :show-text="false"
              class="ipc-summary-compact__bar ipc-summary-compact__bar--progress"
            />
            <el-progress
              v-if="ipcSummary.contract > 0 && ipcSummary.pctPaid != null"
              :percentage="Math.min(100, Math.round(ipcSummary.pctPaid))"
              :status="ipcSummary.overContract ? 'exception' : ipcSummary.pctPaid >= 100 ? 'success' : undefined"
              :stroke-width="6"
              :show-text="false"
              class="ipc-summary-compact__bar"
            />
          </div>

          <el-alert
            v-if="ipcSummary.overContract"
            type="warning"
            show-icon
            :closable="false"
            class="ipc-summary-alert ipc-summary-alert--compact"
            title="Payments exceed contract sum."
          />

          <el-tabs v-model="ipcDisbursementSubTab" class="ipc-inner-tabs">
            <el-tab-pane label="IPCs" name="ipcs">
              <div class="ipc-table-section">
                <div v-if="canManageDisbursements" class="ipc-toolbar">
                  <el-button
                    plain
                    :size="isMobile ? 'large' : 'default'"
                    @click="AddDisbursement"
                  >
                    <Icon icon="material-symbols:add" style="color: green;" />
                    Add IPC disbursement
                  </el-button>
                </div>

                <el-table
                  :data="ipcLedgerRows"
                  row-key="id"
                  class="ipc-ledger-table"
                  style="width: 100%"
                  border
                  stripe
                  show-summary
                  :summary-method="getSummaries"
                >
            <el-table-column type="expand" width="40">
              <template #default="{ row }">
                <div class="ipc-nested-detail">
                  <div
                    v-if="ipcHasSiteProgress(row)"
                    class="ipc-nested-progress ipc-nested-progress--expand"
                  >
                    <p class="ipc-nested-detail__heading">
                      Site progress at this IPC
                      <small v-if="ipcLocationSnapshotAverage(row) != null">
                        · {{ ipcLocationSnapshotAverage(row)?.toFixed(1) }}% avg
                        <template v-if="ipcPriorSnapshotAverage(row) != null">
                          (+{{
                            Math.max(
                              0,
                              (ipcLocationSnapshotAverage(row) || 0) - (ipcPriorSnapshotAverage(row) || 0),
                            ).toFixed(1)
                          }}%)
                        </template>
                      </small>
                    </p>
                    <div
                      v-for="(loc, idx) in ipcLocationSnapshotRows(row)"
                      :key="idx"
                      class="ipc-nested-progress-site"
                    >
                      <div class="ipc-nested-progress-site__head">
                        <span class="ipc-nested-progress-site__name">{{ loc.name || 'Site' }}</span>
                        <strong class="ipc-nested-progress-site__pct">
                          {{ loc.progress_pct != null ? `${Number(loc.progress_pct).toFixed(1)}%` : '—' }}
                          <small
                            v-if="
                              loc.project_location_id != null
                                && ipcPriorSiteProgress(row, Number(loc.project_location_id)) != null
                                && loc.progress_pct != null
                            "
                            class="ipc-nested-progress-site__delta"
                          >
                            +{{
                              Math.max(
                                0,
                                Number(loc.progress_pct)
                                  - (ipcPriorSiteProgress(row, Number(loc.project_location_id)) || 0),
                              ).toFixed(1)
                            }}%
                          </small>
                        </strong>
                      </div>
                      <el-progress
                        v-if="loc.progress_pct != null && Number.isFinite(Number(loc.progress_pct))"
                        :percentage="Math.min(100, Math.max(0, Number(loc.progress_pct)))"
                        :stroke-width="8"
                        :show-text="false"
                      />
                    </div>
                  </div>

                  <div
                    v-if="(disbursementDocumentsById[row.id] || []).length"
                    class="ipc-nested-docs"
                    :class="{ 'ipc-nested-docs--after-progress': ipcHasSiteProgress(row) }"
                  >
                    <p class="ipc-nested-detail__heading">Documents</p>
                    <div
                      v-for="doc in disbursementDocumentsById[row.id]"
                      :key="doc.id"
                      class="ipc-nested-doc-row"
                    >
                      <span class="ipc-nested-doc-row__name">{{ doc.name }}</span>
                      <el-button type="primary" link size="small" @click="downloadFile(doc)">
                        <Icon icon="material-symbols:download" />
                        Download
                      </el-button>
                    </div>
                  </div>

                  <div
                    v-if="
                      !(disbursementDocumentsById[row.id] || []).length
                        && !ipcHasSiteProgress(row)
                    "
                    class="ipc-nested-docs ipc-nested-docs--empty"
                  >
                    No documents or site progress recorded for this IPC
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="certificate" label="IPC / Ref" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tooltip :disabled="!row.description" :content="row.description" placement="top">
                  <span class="ipc-ref-cell">
                    <el-tag
                      v-if="String(row.payment_type || 'ipc').toLowerCase() !== 'ipc'"
                      size="small"
                      effect="plain"
                      class="ipc-ref-cell__type"
                    >
                      {{ disbursementPaymentLabel(row.payment_type).slice(0, 3) }}
                    </el-tag>
                    <span class="ipc-ref-cell__ref">{{ row.certificate || '—' }}</span>
                    <el-tag
                      size="small"
                      :type="ipcStatusTagType(row.status)"
                      effect="plain"
                      class="ipc-ref-cell__status"
                    >
                      {{ row.status || 'submitted' }}
                    </el-tag>
                    <span
                      v-if="(disbursementDocumentsById[row.id] || []).length"
                      class="ipc-ref-cell__doc"
                      :title="`${(disbursementDocumentsById[row.id] || []).length} attached document${(disbursementDocumentsById[row.id] || []).length === 1 ? '' : 's'}`"
                      aria-label="Has attachments"
                    >
                      <Icon icon="material-symbols:attach-file" width="14" />
                    </span>
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="disbursement_date" label="Date" min-width="112">
              <template #default="{ row }">
                {{ formatDateDisplay(row.disbursement_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="gross" label="Gross (KES)" align="right" min-width="128">
              <template #default="{ row }">
                <div>{{ formatCostDisplay(row.gross) }}</div>
                <div v-if="row.contractBalanceAfter != null" class="ipc-table-sub">
                  Balance {{ formatCostDisplay(row.contractBalanceAfter) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column
              v-if="showIpcAdvanceColumns"
              prop="advanceRecoveredThisRow"
              label="Advance recovery"
              align="right"
              min-width="128"
            >
              <template #default="{ row }">
                <template v-if="row.advanceRecoveredThisRow > 0 || row.advanceBalance > 0">
                  <div>
                    {{
                      row.advanceRecoveredThisRow > 0
                        ? formatCostDisplay(row.advanceRecoveredThisRow)
                        : '—'
                    }}
                  </div>
                  <div v-if="row.advanceBalance > 0" class="ipc-table-sub">
                    Balance {{ formatCostDisplay(row.advanceBalance) }}
                  </div>
                </template>
                <span v-else>—</span>
              </template>
            </el-table-column>
            <el-table-column prop="cumulative" label="Cumulative (KES)" align="right" min-width="120">
              <template #default="{ row }">
                <div>{{ formatCostDisplay(row.cumulative) }}</div>
                <div v-if="row.pctOfContract != null" class="ipc-table-sub">
                  {{ row.pctOfContract.toFixed(1) }}%
                </div>
              </template>
            </el-table-column>
            <el-table-column
              v-if="showDisbursementLocationPanel"
              prop="physical_progress"
              label="Progress"
              min-width="108"
              align="center"
            >
              <template #default="{ row }">
                <el-tooltip
                  v-if="ipcLocationSnapshotProgressPct(row) != null"
                  :content="
                    ipcPriorSnapshotAverage(row) != null
                      ? `+${Math.max(0, (ipcLocationSnapshotAverage(row) || 0) - (ipcPriorSnapshotAverage(row) || 0)).toFixed(1)}% since prior IPC — expand for sites`
                      : 'Expand row for site breakdown'
                  "
                  placement="top"
                >
                  <div class="ipc-progress-cell">
                    <span class="ipc-progress-cell__value">
                      {{ ipcLocationSnapshotProgressPct(row)?.toFixed(1) }}%
                    </span>
                    <el-progress
                      :percentage="ipcLocationSnapshotProgressPct(row) || 0"
                      :stroke-width="5"
                      :show-text="false"
                      class="ipc-progress-cell__bar"
                    />
                    <small
                      v-if="ipcLocationSnapshotRows(row).length > 1"
                      class="ipc-progress-cell__sites"
                    >
                      {{ ipcLocationSnapshotRows(row).length }} sites
                    </small>
                  </div>
                </el-tooltip>
                <span v-else class="ipc-progress-cell__empty">—</span>
              </template>
            </el-table-column>
            <el-table-column
              fixed="right"
              label=""
              width="72"
              align="center"
              class-name="ipc-col-actions"
            >
              <template #default="{ row }">
                <div class="ipc-row-actions">
                  <el-dropdown
                    v-if="canUserEditDisbursement(row) || canUserDeleteDisbursement(row)"
                    trigger="click"
                    placement="bottom-end"
                    @command="(cmd) => handleIpcLedgerAction(cmd, row)"
                  >
                    <el-button type="primary" :icon="Setting" circle aria-label="Actions" />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-if="canUserEditDisbursement(row)" command="edit">
                          <el-icon><Edit /></el-icon>
                          <span class="ipc-dropdown-item-label">Edit</span>
                        </el-dropdown-item>
                        <el-dropdown-item v-if="canUserDeleteDisbursement(row)" command="delete">
                          <el-icon><Delete /></el-icon>
                          <span class="ipc-dropdown-item-label">Remove</span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </template>
            </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="Advances" name="advances">
              <div class="ipc-table-section">
                <div v-if="canManageDisbursements" class="ipc-toolbar">
                  <el-button
                    plain
                    :size="isMobile ? 'large' : 'default'"
                    @click="AddAdvancePayment"
                  >
                    <Icon icon="material-symbols:add" style="color: var(--el-color-warning);" />
                    Add Advance
                  </el-button>
                </div>

                <el-table
                  :data="advanceLedgerRows"
                  row-key="id"
                  class="ipc-ledger-table ipc-ledger-table--advances"
                  style="width: 100%"
                  border
                  stripe
                  show-summary
                  :summary-method="getAdvanceSummaries"
                >
                  <el-table-column prop="disbursement_date" label="Date" min-width="112">
                    <template #default="{ row }">
                      {{ formatDateDisplay(row.disbursement_date) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="description" label="Description" min-width="160" show-overflow-tooltip>
                    <template #default="{ row }">
                      {{ row.description || 'Advance payment' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="gross" label="Amount (KES)" align="right" min-width="120">
                    <template #default="{ row }">
                      {{ formatCostDisplay(row.gross) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="Status" min-width="100" align="center">
                    <template #default="{ row }">
                      <el-tag size="small" :type="ipcStatusTagType(row.status)" effect="plain">
                        {{ row.status || 'submitted' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="" width="48" align="center">
                    <template #default="{ row }">
                      <span
                        v-if="(disbursementDocumentsById[row.id] || []).length"
                        class="ipc-ref-cell__doc"
                        :title="`${(disbursementDocumentsById[row.id] || []).length} document(s)`"
                      >
                        <Icon icon="material-symbols:attach-file" width="14" />
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    fixed="right"
                    label=""
                    width="72"
                    align="center"
                    class-name="ipc-col-actions"
                  >
                    <template #default="{ row }">
                      <div class="ipc-row-actions">
                        <el-dropdown
                          v-if="canUserEditDisbursement(row) || canUserDeleteDisbursement(row)"
                          trigger="click"
                          placement="bottom-end"
                          @command="(cmd) => handleIpcLedgerAction(cmd, row)"
                        >
                          <el-button type="primary" :icon="Setting" circle aria-label="Actions" />
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item v-if="canUserEditDisbursement(row)" command="edit">
                                <el-icon><Edit /></el-icon>
                                <span class="ipc-dropdown-item-label">Edit</span>
                              </el-dropdown-item>
                              <el-dropdown-item v-if="canUserDeleteDisbursement(row)" command="delete">
                                <el-icon><Delete /></el-icon>
                                <span class="ipc-dropdown-item-label">Remove</span>
                              </el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>

      </el-tab-pane>



      <el-tab-pane label="Timeline" name="timeline">

        <el-timeline style="max-width: 100%;">
          <el-timeline-item
            v-for="(log, index) in sortedprojectLogs"
            :key="index"
            placement="top"
            :timestamp="formatDateTimeDisplay(log.date_actioned)"
            timestamp-class="timestamp-class"
          >
            <el-card
class="custom-card" shadow="hover" :class="log.action_type == 'Resolved' ? 'success-background' :
          log.action_type == 'Escalated' ? 'warning-background' :
            log.action_type == 'Closed' ? 'closed-background' :
              log.action_type == 'Referred' ? 'referred-background' :
                'info-background'
          ">
              <el-row align="middle" :gutter="20">
                <!-- Icon in the first 1/4 of the card -->
                <el-col :xs="24" :sm="24" :md="24" :lg="2">
                  <Icon v-if="log.action_type == 'Resolved'" icon="fluent-mdl2:completed-solid" width="60" />
                  <Icon v-if="log.action_type == 'Escalated'" icon="streamline:dangerous-zone-sign-solid" width="60" />
                  <Icon v-if="log.action_type == 'Reported'" icon="fluent-mdl2:report-warning" width="60" />
                  <Icon v-if="log.action_type == 'Referred'" icon="mdi:justice" width="60" />
                  <Icon v-if="log.action_type == 'Closed'" icon="fluent:lock-closed-20-filled" width="60" />

                </el-col>

                <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14" :gutter="10">
                  <p class="action-header">{{ log.action_type }} </p>
                  <p class="action-body">{{ log.action ? log.action : 'None' }}</p>
                  <p class="action-footer">By: {{ log.user ? log.user.name : 'System' }}</p>
                </el-col>

                <el-col v-if="log.grievance_documents.length > 0" :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
                  <p class="documents-header">Documentation </p>

                  <p v-for="(doc, docIndex) in log.grievance_documents" :key="docIndex">
                    <el-tooltip :content="doc.name" placement="top" :disabled="!isMobile">
                      <el-button
                        @click="downloadFile(doc)"
                        :link="!isMobile"
                        :plain="isMobile"
                        :circle="isMobile"
                        type="primary"
                        :size="isMobile ? 'small' : 'small'"
                        :icon="Download"
                      >
                        <span v-if="!isMobile">{{ doc.name }}</span>
                      </el-button>
                    </el-tooltip>
                  </p>
                </el-col>

              </el-row>
            </el-card>
          </el-timeline-item>


        </el-timeline>

      </el-tab-pane>

 

    </el-tabs>
  </el-card>

 



  <el-dialog
    v-model="addMoreDocuments"
    title="Upload Documents"
    :width="projectUploadDialogWidth"
    :draggable="!isMobile"
    append-to-body
    align-center
    class="project-details-dialog"
    :class="{ 'project-details-dialog--mobile': isMobile }"
    v-loading="loadingPosting"
    element-loading-text="Uploading documents..."
    :close-on-click-modal="!loadingPosting"
    :close-on-press-escape="!loadingPosting"
    :show-close="!loadingPosting"
    @closed="resetUploadDialog"
  >
    <el-select
      class="dialog-select"
      v-model="documentCategory"
      placeholder="Select Type"
      clearable
      filterable
      :size="isMobile ? 'large' : 'default'"
      style="margin-bottom:10px; width: 100%;"
      @change="handleSelect"
    >
      <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
        <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
      </el-option-group>
      <template v-if="canManageDocumentTypes" #footer>
        <el-button text bg size="small" @click="onAddDocumentTypeOption">
          Register new document type
        </el-button>
      </template>
    </el-select>

    <div class="dialog-upload">
      <el-upload
        ref="upload"
        v-if="showUpload"
        v-model:file-list="morefileList"
        multiple
        :limit="10"
        :on-exceed="onExceeed"
        :auto-upload="false"
      >
        <el-button class="full-width" type="primary" :icon="UploadFilled" :size="isMobile ? 'large' : 'default'">
          Select File(s)
        </el-button>
      </el-upload>
    </div>

    <el-tooltip
      class="box-item"
      effect="dark"
      content="Only the Owner and Admin can view Private documents"
      placement="right-end"
    >
      <el-checkbox v-model="protectedFile" :size="isMobile ? 'large' : 'default'">Private File</el-checkbox>
    </el-tooltip>

    <div v-if="loadingPosting" class="dialog-progress">
      <el-progress :stroke-width="20" :show-text="false" :percentage="100" :indeterminate="true" />
      <p class="upload-status-text">
        <el-icon class="is-loading" style="margin-right: 6px;"><Loading /></el-icon>
        Uploading, please wait...
      </p>
    </div>

    <template #footer>
      <div
        class="project-details-dialog-footer"
        :class="{ 'project-details-dialog-footer--mobile': isMobile }"
      >
        <el-button :size="isMobile ? 'large' : 'default'" :disabled="loadingPosting" @click="addMoreDocuments = false">
          Cancel
        </el-button>
        <el-button
          type="primary"
          :size="isMobile ? 'large' : 'default'"
          :loading="loadingPosting"
          :disabled="loadingPosting"
          @click="submitMoreDocuments()"
        >
          {{ loadingPosting ? 'Uploading...' : 'Confirm' }}
        </el-button>
      </div>
    </template>
  </el-dialog>



  <el-dialog
    v-model="AddTeamDialog"
    title="Add Project Team"
    :width="projectFormDialogWidth"
    :draggable="!isMobile"
    append-to-body
    align-center
    destroy-on-close
    class="project-details-dialog"
    :class="{ 'project-details-dialog--mobile': isMobile }"
  >
    <el-form
      :model="teamForm"
      label-width="auto"
      style="max-width: 600px"
      label-position="top"
      ref="ruleFormRef"
      :rules="rules"
      class="project-details-form"
    >
      <el-form-item label="Role" prop="role">
        <el-select-v2
          v-model="teamForm.role"
          :options="teamRoleOptions"
          filterable
          allow-create
          default-first-option
          clearable
          placeholder="Search or type a role"
          :size="isMobile ? 'large' : 'default'"
          style="width: 100%;"
          @change="rememberTeamRole"
        />
        <p class="contractor-role-hint">
          Shared across all users. Search the list, type a new role, or register one below.
        </p>
        <el-button
          v-if="canManageProjectTeam"
          text
          bg
          size="small"
          style="margin-top: 8px;"
          @click="onAddTeamRoleOption"
        >
          Register new role
        </el-button>
      </el-form-item>

      <el-form-item label="Name" prop="name">
        <el-input v-model="teamForm.name" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>
      <el-form-item label="Phone" prop="phone">
        <el-input v-model="teamForm.phone" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>

      <el-form-item label="Email" prop="email">
        <el-input v-model="teamForm.email" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div
        class="project-details-dialog-footer"
        :class="{ 'project-details-dialog-footer--mobile': isMobile }"
      >
        <el-button :size="isMobile ? 'large' : 'default'" @click="AddTeamDialog = false">Cancel</el-button>
        <el-button :size="isMobile ? 'large' : 'default'" type="primary" @click="updateTeam">
          <Icon icon="ic:round-save" style="margin-right: 6px;" />
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>


  <el-dialog
    v-model="AddContractorTeamDialog"
    title="Add contractor or consultant"
    :width="projectFormDialogWidth"
    :draggable="!isMobile"
    append-to-body
    align-center
    destroy-on-close
    class="project-details-dialog"
    :class="{ 'project-details-dialog--mobile': isMobile }"
  >
    <el-form
      :model="contractorForm"
      label-width="auto"
      style="max-width: 600px"
      label-position="top"
      ref="contractorFormRef"
      :rules="contractorRules"
      class="project-details-form"
    >
      <el-form-item label="Role" prop="role">
        <el-select-v2
          v-model="contractorForm.role"
          :options="contractorRoleOptions.map((role) => ({ label: role, value: role }))"
          filterable
          allow-create
          default-first-option
          clearable
          placeholder="Search or type a role"
          :size="isMobile ? 'large' : 'default'"
          style="width: 100%;"
          @change="rememberContractorRole"
        />
        <p class="contractor-role-hint">
          Includes main contractor, subcontractor, consultant, and other roles. Type to add a new one.
        </p>
      </el-form-item>

      <el-form-item label="Firm" prop="contractor">
        <el-select
          v-model="contractorForm.contractor_id"
          placeholder="Select firm"
          filterable
          :size="isMobile ? 'large' : 'default'"
          style="width: 100%;"
          :onChange="handleSelectContractor"
        >
          <el-option v-for="cont in contractorOptions" :key="cont" :label="cont.label" :value="cont.id" />
          <template #footer>
            <el-button text bg size="small" @click="onAddOption">
              Register new firm
            </el-button>
          </template>
        </el-select>
      </el-form-item>

      <el-form-item label="Scope of work" prop="scope">
        <el-input v-model="contractorForm.scope" placeholder="Brief description of assigned work" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div
        class="project-details-dialog-footer"
        :class="{ 'project-details-dialog-footer--mobile': isMobile }"
      >
        <el-button :size="isMobile ? 'large' : 'default'" @click="AddContractorTeamDialog = false">Cancel</el-button>
        <el-button :size="isMobile ? 'large' : 'default'" type="primary" @click="updateContractor">
          <Icon icon="ic:round-save" style="margin-right: 6px;" />
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>




  <el-dialog
    v-model="showAddNewContractor"
    title="Register new firm"
    :width="projectFormDialogWidth"
    :draggable="!isMobile"
    append-to-body
    align-center
    destroy-on-close
    class="project-details-dialog"
    :class="{ 'project-details-dialog--mobile': isMobile }"
  >
    <el-form
      :model="NewContractorForm"
      label-width="auto"
      style="max-width: 600px"
      label-position="top"
      ref="NewContractorRef"
      :rules="ruleFormRules"
      class="project-details-form"
    >
      <el-form-item label="Firm name" prop="name">
        <el-input v-model="NewContractorForm.name" placeholder="Contractor or consultant company name" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>

      <el-form-item label="Contact Person" prop="contact_person">
        <el-input v-model="NewContractorForm.contact_person" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>

      <el-form-item label="Email" prop="email">
        <el-input v-model="NewContractorForm.email" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>

      <el-form-item label="Phone" prop="phone">
        <el-input v-model="NewContractorForm.phone" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>

      <el-form-item label="Address" prop="address">
        <el-input v-model="NewContractorForm.address" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div
        class="project-details-dialog-footer"
        :class="{ 'project-details-dialog-footer--mobile': isMobile }"
      >
        <el-button :size="isMobile ? 'large' : 'default'" @click="showAddNewContractor = false">Cancel</el-button>
        <el-button :size="isMobile ? 'large' : 'default'" type="primary" @click="createNewContractor">
          <Icon icon="ic:round-save" style="margin-right: 6px;" />
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>



  <el-dialog
    v-model="showAddNewDocumentType"
    title="Register new document type"
    :width="projectFormDialogWidth"
    :draggable="!isMobile"
    append-to-body
    align-center
    destroy-on-close
    class="project-details-dialog"
    :class="{ 'project-details-dialog--mobile': isMobile }"
  >
    <el-form
      :model="NewDocumentTypeForm"
      label-width="auto"
      style="max-width: 600px"
      label-position="top"
      ref="NewDocumentTypeRef"
      :rules="newDocumentTypeRules"
      class="project-details-form"
    >
      <el-form-item label="Category" prop="category_id">
        <el-select
          v-model="NewDocumentTypeForm.category_id"
          filterable
          placeholder="Select category group"
          :size="isMobile ? 'large' : 'default'"
          style="width: 100%;"
          @change="handleNewDocumentTypeCategory"
        >
          <el-option
            v-for="item in documentCategoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Document type" prop="type">
        <el-input
          v-model="NewDocumentTypeForm.type"
          placeholder="e.g. Inception report, Bill of quantities"
          :size="isMobile ? 'large' : 'default'"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div
        class="project-details-dialog-footer"
        :class="{ 'project-details-dialog-footer--mobile': isMobile }"
      >
        <el-button :size="isMobile ? 'large' : 'default'" @click="showAddNewDocumentType = false">Cancel</el-button>
        <el-button :size="isMobile ? 'large' : 'default'" type="primary" @click="createNewDocumentType">
          <Icon icon="ic:round-save" style="margin-right: 6px;" />
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>



  <el-dialog
    v-model="showAddNewTeamRole"
    title="Register new team role"
    :width="projectFormDialogWidth"
    :draggable="!isMobile"
    append-to-body
    align-center
    destroy-on-close
    class="project-details-dialog"
    :class="{ 'project-details-dialog--mobile': isMobile }"
  >
    <el-form
      :model="newTeamRoleForm"
      label-width="auto"
      style="max-width: 600px"
      label-position="top"
      ref="NewTeamRoleRef"
      :rules="newTeamRoleRules"
      class="project-details-form"
    >
      <el-form-item label="Role" prop="role">
        <el-input
          v-model="newTeamRoleForm.role"
          placeholder="e.g. Project Manager, M&amp;E Officer"
          :size="isMobile ? 'large' : 'default'"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div
        class="project-details-dialog-footer"
        :class="{ 'project-details-dialog-footer--mobile': isMobile }"
      >
        <el-button :size="isMobile ? 'large' : 'default'" @click="showAddNewTeamRole = false">Cancel</el-button>
        <el-button :size="isMobile ? 'large' : 'default'" type="primary" @click="createNewTeamRole">
          <Icon icon="ic:round-save" style="margin-right: 6px;" />
          Use role
        </el-button>
      </div>
    </template>
  </el-dialog>



  <el-dialog
    v-model="uploadDialog"
    title="Import Document"
    :width="projectNarrowDialogWidth"
    :draggable="!isMobile"
    append-to-body
    align-center
    class="project-details-dialog"
    :class="{ 'project-details-dialog--mobile': isMobile }"
    @close="uploadDialog = false"
  >
    <p class="import-document-text">
      To upload data on projects, use this
      <button @click="handleDownload" class="template-link">template</button>
      , then upload it below.
    </p>

    <el-upload
      class="upload-demo"
      :on-change="handleCsvUpload"
      drag
      :auto-upload="false"
      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    >
      <div class="el-upload__text">
        Drop file here or <em>click to upload</em>
      </div>
    </el-upload>

    <template #footer>
      <div
        class="project-details-dialog-footer"
        :class="{ 'project-details-dialog-footer--mobile': isMobile }"
      >
        <el-button :size="isMobile ? 'large' : 'default'" @click="uploadDialog = false">Cancel</el-button>
        <el-button :size="isMobile ? 'large' : 'default'" type="primary" @click="uploadData">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>





  <el-dialog
    v-model="AddDialogVisible"
    title="File a Report"
    :width="projectWideDialogWidth"
    :fullscreen="isMobile"
    :draggable="!isMobile"
    append-to-body
    align-center
    class="project-details-dialog project-details-report-dialog"
    :class="{ 'project-details-dialog--mobile': isMobile, 'project-details-report-dialog--mobile': isMobile }"
    @close="AddDialogVisible = false"
  >
  <el-steps
    :active="activeStep"
    align-center
    finish-status="success"
    :direction="isMobile ? 'vertical' : 'horizontal'"
    class="project-report-steps"
    style="margin-bottom: 20px;"
  >
    <el-step title="Project Details" />
    <el-step title="Indicator Selection" />
    <el-step title="Input Values" />
    <el-step title="Submit" />
  </el-steps>

  <el-form ref="ReportRuleFormRef" :model="ruleForm" :rules="rules" label-width="100px" label-position="top">
    <!-- Step 0 -->
    <el-row v-if="activeStep === 0" :gutter="20">
      <el-col :span="24">
        

        <el-form-item v-if="!isNationalProject" label="Location" prop="project_location_id">
          <el-select   v-model="ruleForm.project_location_id" value-key="id" placeholder="Select" @change="changeLocation" style="width: 100%;">
            <el-option v-for="item in projectLocations" :key="item.id" :label="item.location_name" :value="item.id">
              <div style="display: flex; align-items: center;">
                <span style="flex: 1; text-align: left;">{{ item.location_name }}</span>
                <!-- <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 12px; text-align: right;">
                  {{ item.ward.name }}, {{ item.subcounty.name }}, {{ item.county.name }}
                </span> -->
                <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 12px; text-align: right;">
                      {{ formatLocation(item) }}
                    </span>



              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Step 1 -->
    <el-row v-if="activeStep === 1" :gutter="20">
      <el-col :span="24">
        <el-form-item label="Indicators" prop="indicator_category_id">
          <el-select-v2
            v-model="ruleForm.indicator_category_id"
            multiple
            filterable
            :options="indicatorsOptionsFiltered"
            placeholder="Select one or more indicators"
            style="width: 100%;"
            @change="handleIndicatorsChange"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Step 2 -->
    <el-row v-if="activeStep === 2" :gutter="20">
      <el-col :span="24">
        <el-table :data="ruleForm.indicators" style="width: 100%;" border>
          <el-table-column label="Indicator" prop="label" />
          <!-- <el-table-column label="Amount">
            <template #default="{ row }">
              <el-input-number min="0"  v-model="row.amount" style="width: 100%;" />
            </template>
          </el-table-column> -->

          <el-table-column>
            <template #header>
              <span v-if="ruleForm.indicators.some(i => i.unit === 'Yes/No')">Status</span>
              <span v-else>Amount</span>
            </template>
            <template #default="{ row }">
              <template v-if="row.unit === 'Yes/No'">
                <el-switch
                  v-model="row.qualitative"
                  active-value="Yes"
                  inactive-value="No"
                />
              </template>
              <template v-else>
                <el-input-number
                  min="0"
                  v-model="row.amount"
                  style="width: 100%;"
                />
              </template>
            </template>
          </el-table-column>



         
          <el-table-column label="Date">
            <template #default="{ row }">
              <el-date-picker  v-model="row.date" type="date" placeholder="Pick a day" style="width: 100%;" :disabled-date="disabledFutureDates" />
            </template>
          </el-table-column>

       
        </el-table>
      </el-col>
    </el-row>

    <!-- Step 3 -->
    <el-row v-if="activeStep === 3" :gutter="20">
      <el-col :span="24">
        <el-form-item label="Comments" prop="comments">
          <el-input v-model="ruleForm.comments" type="textarea" placeholder="Do you have any comments?" />
        </el-form-item>

        <el-upload
          v-model:file-list="fileUploadList"
          class="upload-demo"
          action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
          multiple
          :on-preview="handlePreview"
          :on-remove="handleRemove"
          :before-remove="beforeRemove"
          :limit="3"
          :auto-upload="false"
          :on-exceed="handleExceed"
        >
          <el-button type="primary" :icon="UploadFilled"> Documentation</el-button>
        </el-upload>
      </el-col>
    </el-row>
  </el-form>

  <!-- Footer -->
  <template #footer>
    <div
      class="project-details-dialog-footer project-details-report-footer"
      :class="{ 'project-details-dialog-footer--mobile': isMobile, 'project-details-report-footer--mobile': isMobile }"
    >
      <el-button
        :size="isMobile ? 'large' : 'default'"
        :icon="ArrowLeft"
        @click="prevStep"
        :disabled="activeStep === 0"
      >
        Previous
      </el-button>
      <el-button
        class="step-btn-next"
        :size="isMobile ? 'large' : 'default'"
        :icon="ArrowRight"
        :disabled="disableIndicator"
        @click="nextStep"
        v-if="activeStep < 3"
      >
        Next
      </el-button>
      <el-button :size="isMobile ? 'large' : 'default'" @click="handleCancel">Cancel</el-button>
      <el-button
        v-if="showSubmitBtn && activeStep === 3"
        :size="isMobile ? 'large' : 'default'"
        type="primary"
        @click="submitForm(ReportRuleFormRef)"
      >
        Submit
      </el-button>
      <el-button
        v-if="showEditSaveButton && activeStep === 3"
        :size="isMobile ? 'large' : 'default'"
        type="primary"
        @click="editForm(ruleFormRef)"
      >
        Save
      </el-button>
    </div>
  </template>
</el-dialog>




  <el-drawer
    v-model="AddDisbursementTeamDialog"
    direction="rtl"
    :size="isMobile ? '100%' : '45%'"
    :show-close="false"
    :close-on-click-modal="false"
    :before-close="handleIpcDrawerClose"
    class="ipc-drawer"
    destroy-on-close
  >
    <template #header>
      <div class="ipc-drawer-header">
        <div class="ipc-drawer-header__content">
          <div class="ipc-drawer-header__icon">
            <el-icon :size="isMobile ? 20 : 24">
              <Edit v-if="isEditingIpc" />
              <Plus v-else />
            </el-icon>
          </div>
          <div>
            <h3>{{ ipcDrawerTitle }}</h3>
            <p v-if="!isMobile">{{ ipcDrawerSubtitle }}</p>
          </div>
        </div>
        <el-button type="danger" size="small" @click="handleIpcDrawerClose">
          <Icon icon="material-symbols:close" class="el-icon--left" />
          Close
        </el-button>
      </div>
    </template>

    <div class="ipc-drawer-body">
      <div class="ipc-steps-wrapper">
        <el-steps
          :active="ipcDrawerStep"
          finish-status="success"
          align-center
          class="ipc-form-steps"
        >
          <el-step
            v-for="(step, index) in activeIpcDrawerSteps"
            :key="index"
            :title="isMobile ? `Step ${index + 1}` : step.title"
            :description="isMobile ? '' : step.description"
            @click="handleIpcStepClick(index)"
          />
        </el-steps>
      </div>
      <el-divider class="ipc-steps-divider" />

      <div class="ipc-button-container">
        <div class="ipc-button-container-actions">
          <el-button
            v-if="ipcDrawerStep > 0"
            type="primary"
            :icon="ArrowLeft"
            @click="ipcPrevStep"
          >
            Previous
          </el-button>
          <el-button
            v-if="showIpcNextButton"
            type="primary"
            class="step-btn-next"
            :icon="ArrowRight"
            @click="ipcNextStep"
          >
            Next
          </el-button>
          <el-button
            v-if="showIpcSubmitButton"
            type="success"
            :icon="Check"
            :loading="ipcSaving"
            @click="updateDisbursement"
          >
            {{ ipcSubmitLabel }}
          </el-button>
        </div>
      </div>

      <el-form
        :model="DisbursementForm"
        label-position="top"
        ref="DisbursementFormRef"
        :rules="disbursementRules"
        class="ipc-drawer-form"
      >
        <!-- Step 0: Payment -->
        <div v-if="ipcDrawerStep === 0" class="ipc-form-step">
          <!-- Advance: one-off early payment -->
          <template v-if="isAdvanceDrawer">
            <p class="contractor-role-hint contractor-role-hint--compact ipc-step-intro">
              Early advance payment before IPCs. No site progress is recorded here — recover this advance on later IPCs.
            </p>
            <el-row :gutter="10">
              <el-col :xs="24" :sm="12">
                <el-form-item label="Payment date" prop="disbursement_date">
                  <el-date-picker
                    v-model="DisbursementForm.disbursement_date"
                    :disabled-date="disabledFutureDates"
                    style="width: 100%;"
                    size="default"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="Advance amount (KSh)" prop="amount">
                  <el-input
                    :model-value="disbursementAmountInput"
                    inputmode="decimal"
                    placeholder="0"
                    style="width: 100%;"
                    size="default"
                    @update:model-value="(v) => handleDisbursementMoneyInput(v, 'amount')"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Description" prop="description">
              <el-input
                v-model="DisbursementForm.description"
                type="textarea"
                :rows="2"
                placeholder="Reason for advance (e.g. mobilisation)"
                style="width: 100%;"
                size="default"
              />
            </el-form-item>
            <el-form-item label="Status" prop="status">
              <el-select v-model="DisbursementForm.status" style="width: 100%;" size="default">
                <el-option v-for="opt in IPC_STATUSES" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Supporting document (optional)">
              <el-upload
                v-model:file-list="ipcFileList"
                :auto-upload="false"
                :on-change="handleIpcFileChange"
                :limit="1"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              >
                <el-button type="primary" :icon="UploadFilled" size="small">
                  {{ isEditingIpc && ipcEditingDocuments.length ? 'Replace file' : 'Select file' }}
                </el-button>
              </el-upload>
            </el-form-item>
          </template>

          <!-- IPC: payment with optional advance recovery -->
          <template v-else>
          <el-form-item label="Payment type" prop="payment_type">
            <el-select v-model="DisbursementForm.payment_type" style="width: 100%;" size="default">
              <el-option v-for="opt in IPC_PAYMENT_TYPES" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="IPC / Reference" prop="certificate">
            <el-select-v2
              v-model="DisbursementForm.certificate"
              :options="ipcOptions.map((ipc) => ({ label: ipc, value: ipc }))"
              filterable
              allow-create
              default-first-option
              clearable
              placeholder="Search or enter IPC number"
              size="default"
              style="width: 100%;"
            />
          </el-form-item>

          <el-row :gutter="10">
            <el-col :xs="24" :sm="12">
              <el-form-item label="Payment date" prop="disbursement_date">
                <el-date-picker
                  v-model="DisbursementForm.disbursement_date"
                  :disabled-date="disabledFutureDates"
                  style="width: 100%;"
                  size="default"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="Gross amount (KSh)" prop="amount">
                <el-input
                  :model-value="disbursementAmountInput"
                  inputmode="decimal"
                  placeholder="0"
                  style="width: 100%;"
                  size="default"
                  @update:model-value="(v) => handleDisbursementMoneyInput(v, 'amount')"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item
            v-if="showAdvanceRecoveryField"
            label="Advance recovery on this IPC (KSh)"
          >
            <el-input
              :model-value="disbursementAdvanceRecoveredInput"
              inputmode="decimal"
              placeholder="0"
              style="width: 100%;"
              size="default"
              @update:model-value="(v) => handleDisbursementMoneyInput(v, 'advance_recovered')"
            />
            <p class="contractor-role-hint contractor-role-hint--compact">
              Deducts from advance paid early. Outstanding before this IPC: {{ formatCostDisplay(ipcAdvanceOutstandingForForm) }}
            </p>
          </el-form-item>

          <el-form-item label="Status" prop="status">
            <el-select v-model="DisbursementForm.status" style="width: 100%;" size="default">
              <el-option v-for="opt in IPC_STATUSES" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          </template>
        </div>

        <!-- Step 1: IPC details (progress & document) -->
        <div v-if="ipcDrawerStep === 1 && !isAdvanceDrawer" class="ipc-form-step">
          <el-form-item label="Description" prop="description">
            <el-input
              v-model="DisbursementForm.description"
              type="textarea"
              :rows="2"
              placeholder="Payment period or works covered"
              style="width: 100%;"
              size="default"
            />
          </el-form-item>

          <div v-if="showDisbursementLocationPanel" class="ipc-dialog-locations ipc-dialog-locations--inline">
            <p class="contractor-role-hint contractor-role-hint--compact ipc-step-intro">
              Site progress (cumulative)
              <template v-if="ipcLocationProgressAverage != null">
                · {{ ipcLocationProgressAverage.toFixed(1) }}% avg
              </template>
              · {{ ipcLocationProgress.length }} site{{ ipcLocationProgress.length === 1 ? '' : 's' }}
            </p>
            <div class="ipc-dialog-locations__scroll">
              <div
                v-for="loc in ipcLocationProgress"
                :key="loc.id"
                class="ipc-location-row ipc-location-row--compact"
              >
                <span class="ipc-location-row__name" :title="loc.name">{{ loc.name }}</span>
                <el-tooltip
                  :disabled="ipcLocationProgressFloor(loc.id) <= 0"
                  :content="`Min ${ipcLocationProgressFloor(loc.id).toFixed(1)}% from earlier IPC`"
                  placement="top"
                >
                  <el-input-number
                    :model-value="loc.progress ?? undefined"
                    :min="ipcLocationProgressFloor(loc.id)"
                    :max="ipcLocationProgressCeiling(loc.id)"
                    :precision="2"
                    :controls="false"
                    placeholder="%"
                    size="small"
                    class="ipc-location-row__input"
                    @change="(val) => setIpcLocationProgress(
                      loc.id,
                      val == null || val === '' ? null : Number(val),
                    )"
                  />
                </el-tooltip>
                <span class="ipc-location-row__suffix">%</span>
              </div>
            </div>
          </div>

          <el-form-item label="Supporting document">
            <el-upload
              v-model:file-list="ipcFileList"
              :auto-upload="false"
              :on-change="handleIpcFileChange"
              :limit="1"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <el-button type="primary" :icon="UploadFilled" size="small">
                {{ isEditingIpc && ipcEditingDocuments.length ? 'Replace file' : 'Select file' }}
              </el-button>
            </el-upload>
            <p
              v-if="isEditingIpc && ipcEditingDocuments.length && !ipcFileList.length"
              class="contractor-role-hint contractor-role-hint--compact"
            >
              Current: {{ ipcEditingDocuments[0]?.name }}
            </p>
          </el-form-item>
        </div>

        <!-- Review -->
        <div v-if="ipcDrawerStep === ipcDrawerLastStep" class="ipc-form-step">
          <el-descriptions :column="1" border size="small" class="ipc-review">
            <el-descriptions-item v-if="!isAdvanceDrawer" label="Payment type">
              {{ disbursementPaymentLabel(DisbursementForm.payment_type) }}
            </el-descriptions-item>
            <el-descriptions-item v-if="isAdvanceDrawer" label="Payment">
              Advance (early payment)
            </el-descriptions-item>
            <el-descriptions-item v-if="!isAdvanceDrawer" label="IPC / Ref">
              {{ DisbursementForm.certificate || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Date">
              {{ formatDateDisplay(DisbursementForm.disbursement_date) }}
            </el-descriptions-item>
            <el-descriptions-item :label="isAdvanceDrawer ? 'Advance amount' : 'Gross amount'">
              {{ formatAmountDisplay(DisbursementForm.amount) }}
            </el-descriptions-item>
            <el-descriptions-item
              v-if="!isAdvanceDrawer && parseMoney(DisbursementForm.advance_recovered) > 0"
              label="Advance recovery"
            >
              {{ formatAmountDisplay(DisbursementForm.advance_recovered) }}
            </el-descriptions-item>
            <el-descriptions-item label="Status">
              {{ DisbursementForm.status }}
            </el-descriptions-item>
            <el-descriptions-item label="Description">
              {{ DisbursementForm.description || '—' }}
            </el-descriptions-item>
            <el-descriptions-item v-if="!isAdvanceDrawer && showDisbursementLocationPanel" label="Site progress">
              {{
                ipcLocationProgressAverage != null
                  ? `${ipcLocationProgressAverage.toFixed(1)}% average across ${ipcLocationProgress.length} site(s)`
                  : '—'
              }}
            </el-descriptions-item>
            <el-descriptions-item label="Document">
              {{
                ipcFileList.length
                  ? (ipcFileList[0]?.name || 'New file attached')
                  : ipcEditingDocuments.length
                    ? ipcEditingDocuments[0]?.name
                    : 'None attached'
              }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-form>
    </div>
  </el-drawer>









  <ProjectFormDrawer
    v-model:visible="projectFormDrawerVisible"
    :component-id="projectFormComponentId"
    :project-id="projectFormProjectId"
    :mode="projectFormMode"
    :component-title="projectFullData?.component?.acronym || projectFullData?.component?.title"
    @saved="onProjectFormSaved"
  />

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

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  color: var(--card-header-color, #333);
  background-color: var(--card-header-bg, #f9f9f9);
  padding: 12px 14px;
  border-radius: 5px;
}

.card-header-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.card-header-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.back-button {
  flex-shrink: 0;
  margin-top: 2px;
}

.project-title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.project-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  width: 100%;
}

.project-title {
  flex: 1 1 12rem;
  min-width: 0;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
}

.project-scope-transfer {
  width: 100%;
  display: flex;
  justify-content: center;
}

.project-scope-transfer :deep(.el-transfer) {
  display: flex;
  width: 100%;
  max-width: 720px;
}

.project-scope-transfer :deep(.el-transfer-panel) {
  width: min(100%, 320px);
  flex: 1 1 240px;
}

.project-scope-transfer :deep(.el-transfer-panel__body) {
  height: 280px;
}

.project-scope-transfer :deep(.el-transfer-panel__item.el-checkbox) {
  margin-right: 0;
}

.project-scope-transfer :deep(.el-transfer-panel__item.el-checkbox .el-checkbox__label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-scope-transfer--mobile,
.project-scope-transfer--mobile :deep(.el-transfer) {
  display: block;
  max-width: none;
}

.project-scope-transfer--mobile :deep(.el-transfer) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.project-scope-transfer--mobile :deep(.el-transfer-panel) {
  width: 100%;
  flex: none;
}

.project-scope-transfer--mobile :deep(.el-transfer-panel__body) {
  height: 11rem;
}

.project-scope-transfer--mobile :deep(.el-transfer__buttons) {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 0;
}

.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(2)),
.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(4)) {
  margin-left: 0;
}

.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(1) .el-icon),
.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(1) svg),
.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(3) .el-icon),
.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(3) svg) {
  transform: rotate(90deg);
}

.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(2) .el-icon),
.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(2) svg),
.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(4) .el-icon),
.project-scope-transfer--mobile :deep(.el-transfer__button:nth-child(4) svg) {
  transform: rotate(-90deg);
}

.demo-tabs :deep(.el-tabs__content) {
  padding: 8px 16px 16px;
}

.project-scope-panel {
  margin: 0;
}

.project-scope-toolbar {
  margin-top: 0 !important;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.project-scope-actions-col {
  display: flex;
  justify-content: flex-end;
}

.project-scope-mobile-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  min-height: 40px;
}

.project-scope-icon-btn {
  flex-shrink: 0;
}

.project-scope-summary--mobile {
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.project-scope-action-btn {
  width: 100%;
}

@media (max-width: 768px) {
  .demo-tabs :deep(.el-tabs__content) {
    padding: 8px 12px 12px;
  }

  .project-scope-toolbar {
    margin-bottom: 8px;
    padding-bottom: 6px;
  }

  .project-scope-summary-count {
    font-size: 13px;
    line-height: 1.35;
  }

  .project-scope-actions-col {
    margin-top: 0;
  }
}

@media (min-width: 769px) {
  .project-scope-actions-col .project-scope-action-btn {
    width: auto;
    min-width: 140px;
  }
}

.project-scope-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.project-scope-summary-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.project-scope-summary-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.project-scope-empty {
  padding: 12px 5px;
  color: var(--el-text-color-secondary);
}

.project-scope-empty p {
  margin: 0 0 10px;
}

.step-btn-next {
  flex-direction: row-reverse;
  gap: 6px;
}

.step-btn-next :deep(.el-icon + span) {
  margin-left: 0;
}

.project-details-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.project-details-dialog-footer--mobile {
  width: 100%;
}

.project-details-dialog-footer--mobile .el-button {
  flex: 1;
  margin: 0;
  min-height: 44px;
}

.project-details-dialog--mobile :deep(.el-dialog) {
  max-width: calc(100vw - 32px);
  margin: 16px auto;
}

.project-details-dialog--mobile :deep(.el-dialog__header) {
  padding: 16px 16px 8px;
}

.project-details-dialog--mobile :deep(.el-dialog__body) {
  padding: 8px 16px 4px;
}

.project-details-dialog--mobile :deep(.el-dialog__footer) {
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
}

.project-details-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.contractor-role-hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.ipc-disbursements-card {
  width: 100%;
}

.ipc-disbursements-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
}

.ipc-summary-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.ipc-summary-compact__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  align-items: baseline;
}

.ipc-metric {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.ipc-metric__label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--el-text-color-secondary);
}

.ipc-metric__value {
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.01em;
}

.ipc-metric__value--balance {
  color: var(--el-color-primary);
}

.ipc-metric--balance {
  padding: 2px 8px;
  margin: -2px -8px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
}

.ipc-ledger-table :deep(.el-table__body .el-table__cell.is-right .cell) {
  font-variant-numeric: tabular-nums;
}

.ipc-ledger-table :deep(.el-table__footer-wrapper .cell:not(:empty)) {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.ipc-ledger-table :deep(.el-table__footer-wrapper td.el-table__cell) {
  background: var(--el-fill-color-light);
  border-top: 2px solid var(--el-border-color);
}

.ipc-metric small {
  font-weight: 500;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.ipc-summary-compact__bar {
  margin: 0;
}

.ipc-summary-compact__bar--progress {
  margin-top: 4px;
}

.ipc-summary-compact__bar--progress :deep(.el-progress-bar__outer) {
  background-color: var(--el-color-success-light-7);
}

.ipc-summary-compact__bar--progress :deep(.el-progress-bar__inner) {
  background-color: var(--el-color-success);
}

.ipc-summary-alert--compact {
  margin: 0;
  padding: 6px 10px;
}

.ipc-table-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.ipc-inner-tabs :deep(.el-tabs__header) {
  margin-bottom: 8px;
}

.ipc-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
  width: 100%;
}

.ipc-ledger-table {
  width: 100%;
}

.ipc-ledger-table :deep(.el-table),
.ipc-ledger-table :deep(.el-table__inner-wrapper),
.ipc-ledger-table :deep(.el-table__header-wrapper),
.ipc-ledger-table :deep(.el-table__body-wrapper) {
  width: 100% !important;
}

.ipc-ledger-table :deep(.el-table__header colgroup col),
.ipc-ledger-table :deep(.el-table__body colgroup col) {
  min-width: 0;
}

.ipc-ledger-table :deep(.el-table__header table),
.ipc-ledger-table :deep(.el-table__body table) {
  table-layout: fixed;
  width: 100%;
}

.ipc-ledger-table :deep(.el-table__body-wrapper) {
  max-height: min(52vh, 520px);
  overflow-y: auto;
}

.ipc-table-sub {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
}

.ipc-ref-cell {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
}

.ipc-ref-cell__ref {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ipc-ref-cell__type {
  flex-shrink: 0;
  padding: 0 4px;
  height: 18px;
}

.ipc-ref-cell__status {
  flex-shrink: 0;
  padding: 0 5px;
  height: 18px;
  text-transform: capitalize;
}

.ipc-ref-cell__doc {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  color: var(--el-color-info);
  line-height: 1;
  cursor: default;
}

.ipc-nested-detail {
  padding: 4px 12px 10px 48px;
}

.ipc-nested-detail__heading {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.ipc-nested-detail__heading small {
  font-weight: normal;
  text-transform: none;
  letter-spacing: normal;
}

.ipc-nested-docs {
  padding: 0;
}

.ipc-nested-progress {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.ipc-nested-progress--expand {
  margin-bottom: 4px;
}

.ipc-nested-docs--after-progress {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.ipc-nested-progress-site {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.ipc-nested-progress-site:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.ipc-nested-progress-site__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ipc-nested-progress-site__name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ipc-nested-progress-site__pct {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-success);
}

.ipc-progress-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 72px;
  padding: 2px 0;
}

.ipc-progress-cell__value {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.ipc-progress-cell__bar {
  width: 100%;
}

.ipc-progress-cell__sites {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
}

.ipc-progress-cell__empty {
  color: var(--el-text-color-placeholder);
}

.ipc-nested-progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  font-size: 13px;
}

.ipc-nested-docs--empty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.ipc-nested-doc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.ipc-nested-doc-row:last-child {
  border-bottom: none;
}

.ipc-nested-doc-row__type {
  flex-shrink: 0;
  width: 140px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.ipc-nested-doc-row__name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ipc-collapsible {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}

.ipc-collapsible__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  user-select: none;
}

.ipc-collapsible__head small {
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.ipc-docs-table {
  width: 100%;
  border-top: 1px solid var(--el-border-color-lighter);
}

.ipc-doc-tooltip-line {
  line-height: 1.4;
}

.ipc-row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 40px;
}

.ipc-ledger-table :deep(.ipc-col-actions .cell) {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
  padding-left: 8px;
  padding-right: 8px;
}

.ipc-dropdown-item-icon {
  margin-right: 8px;
  vertical-align: middle;
}

.ipc-dropdown-item-label {
  margin-left: 8px;
}

.ipc-location-panel {
  margin-bottom: 4px;
}

.ipc-location-panel__body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ipc-location-avg {
  font-weight: normal;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.ipc-location-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ipc-location-row__name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
}

.ipc-location-row__input {
  width: 100px;
}

.ipc-location-row__suffix {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ipc-no-docs {
  color: var(--el-text-color-placeholder);
}

.ipc-dialog-locations {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ipc-dialog-locations--inline {
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.ipc-dialog-locations--inline .ipc-step-intro {
  margin-bottom: 8px;
}

.ipc-dialog-location {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.ipc-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ipc-drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.ipc-drawer-header h3 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.ipc-drawer-header p {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ipc-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ipc-drawer-header__content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.ipc-drawer-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.ipc-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ipc-steps-wrapper {
  margin-bottom: 0;
}

.ipc-steps-divider {
  margin: 6px 0 0;
}

.ipc-form-steps {
  width: 100%;
}

.ipc-form-steps :deep(.el-step__title) {
  font-size: 13px;
  line-height: 1.3;
}

.ipc-form-steps :deep(.el-step__description) {
  font-size: 11px;
  line-height: 1.3;
  padding-right: 4px;
}

.ipc-form-steps :deep(.el-step__head) {
  cursor: pointer;
}

.ipc-form-steps :deep(.el-step.is-wait .el-step__head) {
  cursor: default;
}

.ipc-button-container {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  padding: 4px 0 6px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ipc-button-container-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

.ipc-drawer-form {
  flex: 1;
}

.ipc-drawer-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.ipc-drawer-form :deep(.el-form-item__label) {
  margin-bottom: 2px;
  padding-bottom: 0;
  line-height: 1.25;
  font-size: 13px;
}

.ipc-form-step {
  padding-top: 0;
}

.ipc-step-intro {
  margin: 0 0 4px;
}

.contractor-role-hint--compact {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.3;
}

.ipc-dialog-locations--inline {
  margin-bottom: 8px;
  padding: 6px 8px;
}

.ipc-dialog-locations--inline .ipc-step-intro {
  margin-bottom: 4px;
}

.ipc-dialog-locations__scroll {
  max-height: min(200px, 36vh);
  overflow-y: auto;
  padding-right: 2px;
}

.ipc-dialog-locations__scroll::-webkit-scrollbar {
  width: 5px;
}

.ipc-dialog-locations__scroll::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: var(--el-border-color);
}

.ipc-location-row {
  gap: 6px;
  padding: 1px 0;
}

.ipc-location-row--compact {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  min-height: 28px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.ipc-location-row--compact:last-child {
  border-bottom: none;
}

.ipc-location-row--stacked {
  flex-direction: column;
  align-items: stretch;
  padding: 4px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.ipc-location-row--stacked:last-child {
  border-bottom: none;
}

.ipc-location-row__main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ipc-location-row__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.2;
}

.ipc-location-row__input {
  width: 72px;
  flex-shrink: 0;
}

.ipc-location-row__hint {
  margin: 0 0 0 2px;
}

.ipc-nested-progress-site__delta {
  margin-left: 4px;
  font-size: 10px;
  font-weight: 500;
  color: var(--el-color-success);
}

.ipc-nested-doc-row {
  gap: 8px;
  padding: 4px 0;
}

.ipc-nested-doc-row__type {
  display: none;
}

.ipc-file-types {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.ipc-file-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.ipc-file-type-row__name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ipc-review {
  width: 100%;
}

.location-add-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-add-dialog-select {
  width: 100%;
}

.location-option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-option-label {
  flex: 1;
  text-align: left;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-option-meta {
  flex: 2;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: right;
}

.project-details-dialog--mobile .location-option-row {
  flex-direction: column;
  align-items: flex-start;
}

.project-details-dialog--mobile .location-option-meta {
  text-align: left;
  font-size: 12px;
}

.import-document-text {
  margin: 0 0 12px;
  line-height: 1.5;
}

.project-details-report-footer {
  flex-wrap: wrap;
}

.project-details-report-footer--mobile {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.project-details-report-footer--mobile .el-button {
  margin: 0;
  min-height: 44px;
}

.project-details-report-dialog--mobile :deep(.el-dialog__body) {
  padding: 12px 16px;
}

.project-details-map-dialog--mobile :deep(.el-dialog__body) {
  padding: 0 12px 12px;
}

.project-details-map-dialog--mobile .basemap--mobile {
  height: calc(100vh - 140px);
  min-height: 280px;
}

.map-status-text {
  color: green;
  font-style: italic;
  margin: 4px 0 0;
  font-size: 14px;
}

.dialog-upload {
  margin-bottom: 10px;
}

.dialog-upload .full-width {
  width: 100%;
}

.dialog-progress {
  margin-top: 12px;
}

.upload-status-text {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.project-header-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.project-header-tags.project-header-tags--prominent :deep(.el-tag) {
  --el-tag-font-size: clamp(12px, var(--el-font-size-base), 14px);
  font-size: var(--el-tag-font-size);
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: 2px;
}

:deep(.el-card__header) {
  padding: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.profile-tab-panel__loading {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.project-details-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-details-sections :deep(.v-descriptions-header__title) {
  position: relative;
}

.project-details-sections :deep(.v-descriptions-header__title)::after {
  position: absolute;
  top: 3px;
  left: -10px;
  width: 4px;
  height: 70%;
  background: var(--el-color-primary);
  content: '';
}

.project-details-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}

.profile-tab-panel__spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-secondary);
}

:root {
  --card-header-color: #333;
  --card-header-bg: #f9f9f9;
}

[data-theme="dark"] {
  --card-header-color: #ddd;
  --card-header-bg: #222;
}

@media (max-width: 768px) {
  .card-header,
  .card-header--mobile {
    align-items: flex-start;
    padding: 10px 12px;
    gap: 8px;
  }

  .card-header-main {
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .back-button {
    margin-top: 0;
  }

  .project-title-wrap {
    gap: 4px;
  }

  .project-title-row {
    gap: 6px;
  }

  .project-title {
    flex: 1 1 100%;
    font-size: 0.95rem;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .project-header-tags {
    gap: 4px;
  }

  .project-header-tags.project-header-tags--prominent :deep(.el-tag) {
    --el-tag-font-size: 11px;
    height: auto;
    padding: 2px 7px;
  }

  .header-actions {
    margin-left: 0;
    padding-top: 0;
  }

  .ipc-summary-compact__metrics {
    gap: 6px 12px;
  }

  .ipc-ledger-table :deep(.el-table__body-wrapper) {
    max-height: 40vh;
  }

  .project-scope-transfer :deep(.el-transfer) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    max-width: none;
  }

  .project-scope-transfer :deep(.el-transfer-panel) {
    width: 100%;
    flex: none;
  }

  .project-scope-transfer :deep(.el-transfer-panel__body) {
    height: 11rem;
  }

  .project-scope-transfer :deep(.el-transfer__buttons) {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    padding: 0;
  }

  .project-scope-transfer :deep(.el-transfer__button:nth-child(2)),
  .project-scope-transfer :deep(.el-transfer__button:nth-child(4)) {
    margin-left: 0;
  }

  .project-scope-transfer :deep(.el-transfer__button:nth-child(1) .el-icon),
  .project-scope-transfer :deep(.el-transfer__button:nth-child(1) svg),
  .project-scope-transfer :deep(.el-transfer__button:nth-child(3) .el-icon),
  .project-scope-transfer :deep(.el-transfer__button:nth-child(3) svg) {
    transform: rotate(90deg);
  }

  .project-scope-transfer :deep(.el-transfer__button:nth-child(2) .el-icon),
  .project-scope-transfer :deep(.el-transfer__button:nth-child(2) svg),
  .project-scope-transfer :deep(.el-transfer__button:nth-child(4) .el-icon),
  .project-scope-transfer :deep(.el-transfer__button:nth-child(4) svg) {
    transform: rotate(-90deg);
  }
}

.dialog-progress {
  margin-top: 12px;
}

.upload-status-text {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
}

/* Custom styling for documents container */
.documents-container {
  margin-top: 20px;
}

.project-docs-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.doc-table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: nowrap;
}

.doc-action-trigger {
  display: inline-flex;
  vertical-align: middle;
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
  font-size: 1rem;
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




.info-background {
  background-color: rgba(204, 229, 255, 0.4);
  /* Light blue with 80% opacity */
  color: #004085;
  /* Dark blue text */
  padding: 10px;
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

.timestamp-class {
  font-weight: bold;
  /* Example: Make it bold */
  color: #6c757d;
  /* Example: Set color */
  font-size: 14px;
  /* Example: Adjust font size */
  /* Add any additional styles as needed */
}
</style>



<style scoped>
.basemap {
  width: 100%;
  height: 65vh;
}

.basemap--mobile {
  height: calc(100vh - 140px);
  min-height: 280px;
}


.template-link {
  text-decoration: underline;
  color: #409EFF;
  /* Optional: change link color */
}
</style>

<style scoped>
.task-card {
  margin-bottom: 20px;
}

.task-card-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #ffffff56;
}

.task-card-item .task-name {
  margin-bottom: 10px;
  font-weight: lighter;
}

.task-card-item .task-details {
  margin-left: 10px;
  line-height: 1.6;
}


.bold-task {
  font-weight: bold;
}
</style>



<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}

.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.my-header--mobile {
  flex-direction: column;
  align-items: stretch;
}

.my-header--mobile .el-button {
  width: 100%;
}

.my-header-titles {
  min-width: 0;
}
</style>