<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch, reactive, ref } from 'vue'
import {
  
ElButton, ElDivider, ElTimeline, ElTimelineItem, ElCol, ElRow, ElCheckbox, ElInput, ElOptionGroup, ElForm, ElFormItem, ElUpload, ElMessage,
  ElCard, ElTabs, ElTabPane, ElTable, ElTableColumn, ElTooltip, ElDialog, ElSelect, ElOption, ElDescriptions,
  ElDescriptionsItem, ElText, ElDatePicker, ElPopconfirm, ElStep, ElSteps, FormRules, ElSelectV2, ElInputNumber, ElSwitch, ElPagination, ElTag, ElIcon, ElTransfer,
  ElCollapseTransition,
} from 'element-plus'
// Locally
import { logGrievanceAction, updateGrievanceStatus } from '@/api/grievance'
import { uuid } from 'vue-uuid'
import { getSettlementListByCounty, getLinkedDocuments, unlinkDocument } from '@/api/settlements'
import type { RouteLocationNormalizedLoaded, RouterLinkProps } from 'vue-router'

import { getOneGeo } from '@/api/settlements'

import { Icon } from '@iconify/vue';
import {
  Download, UploadFilled, Edit, Back, CircleCloseFilled, Position, Delete, Loading
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
const canManageDisbursements = computed(() => isSuperAdmin.value || hasPerm('disbursement:create'))

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
const inlineComponentOptions = ref<Array<{ label: string; value: number }>>([])

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
    limit: 200,
    page: 1,
    model: 'programme',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: [],
  } as any)

  inlineProgrammeOptions.value = ((res as any).data || []).map((p: any) => ({
    value: Number(p.id),
    label: p.acronym ? `${p.title} (${p.acronym})` : (p.title || `Programme ${p.id}`),
  }))
}

async function loadInlineComponentOptions(programmeId: number | null | undefined) {
  inlineComponentOptions.value = []
  if (programmeId == null) return

  const res = await getSettlementListByCounty({
    limit: 200,
    page: 1,
    model: 'component',
    searchField: 'title',
    searchKeyword: '',
    filters: ['programme_id'],
    filterValues: [[programmeId]],
    associated_multiple_models: [],
  } as any)

  inlineComponentOptions.value = ((res as any).data || []).map((c: any) => ({
    value: Number(c.id),
    label: c.title || c.acronym || `Component ${c.id}`,
  }))
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

  await loadInlineComponentOptions(resolveProgrammeId(data))
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
      await loadInlineComponentOptions(programmeId)

      let componentId = Number(data.component_id)
      if (!inlineComponentOptions.value.some((opt) => opt.value === componentId)) {
        componentId = inlineComponentOptions.value[0]?.value ?? 0
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
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = []



  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)

  projectDisbursements.value = res.data



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
  await loadInlineComponentOptions(resolveProgrammeId(res.data))
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
    const response = await getFile(formData);
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

// Calculate hours worked  
const calculateHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return '-'
  const start = new Date(clockIn)
  const end = new Date(clockOut)
  const hours = (end - start) / (1000 * 60 * 60)
  return hours.toFixed(2) + ' hrs'
}

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









const AddDisbursementTeamDialog = ref(false)
const DisbursementFormRef = ref()

const AddDisbursement = async () => {
  AddDisbursementTeamDialog.value = true
}




// do not use same name with ref
const DisbursementForm = ref({
  project_id: route.params.id,
  amount: null,
  disbursement_date: new Date(),
  certificate: null,
  description: null,
  code: shortid.generate()
})





const DisbursementRules = ({

  amount: [
    { required: true, message: 'Amount is required', trigger: 'blur' },
  ],

  description: [
    { required: true, message: 'Description is required', trigger: 'blur' },
  ],

  certificate: [
    { required: true, message: 'IPC certificate is required', trigger: 'blur' },
  ],
})

const disbursementAmountInput = ref('')

const handleDisbursementAmountInput = (value: string) => {
  const sanitized = value.replace(/,/g, '').replace(/[^\d.]/g, '')
  const dotIndex = sanitized.indexOf('.')
  const intPart = dotIndex >= 0 ? sanitized.slice(0, dotIndex) : sanitized
  const decPart = dotIndex >= 0 ? sanitized.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2) : ''

  if (sanitized === '') {
    disbursementAmountInput.value = ''
    DisbursementForm.value.amount = null
    return
  }

  const numericString = decPart ? `${intPart}.${decPart}` : intPart
  const parsed = numericString === '' || numericString === '.' ? null : Number(numericString)
  DisbursementForm.value.amount = parsed !== null && !Number.isNaN(parsed) ? parsed : null

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  disbursementAmountInput.value = decPart ? `${formattedInt}.${decPart}` : formattedInt
}

watch(AddDisbursementTeamDialog, (open) => {
  if (!open) return
  const amount = DisbursementForm.value.amount
  disbursementAmountInput.value =
    amount != null && amount !== '' && !Number.isNaN(Number(amount))
      ? formatAmountDisplay(amount)
      : ''
})




const updateDisbursement = async () => {

  DisbursementFormRef.value.validate(async (valid: boolean) => {

    if (valid) {
      console.log('submit!')

      DisbursementForm.value.model = 'disbursement'

      const res = await CreateRecord(DisbursementForm.value)


      projectTeamData.value.push(res.data)
      getprojectDisbursements(route.params.id)





    } else {
      console.log('error submit!')
    }


  })


}








const contract_roles = ['Main Contractor', 'Subcontractor', 'Consultant', 'Other'] as const

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

      projectContractors.value.push(res.data)
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

  let formData = {}
  formData.id = row.id
  formData.model = 'disbursement'

  await DeleteRecord(formData);



  // remove the deleted object from array list 
  let index = projectDisbursements.value.indexOf(row);
  if (index !== -1) {
    projectDisbursements.value.splice(index, 1);
  }

}



const handleSelectContractor = async (selected) => {
  const selectedContractor = contractorOptions.value.filter(item => item.id == selected);

  contractorForm.value.name = selectedContractor[0].name
  console.log(contractorForm.value)
}



// ASdd Missing Contractot

const showAddNewContractor = ref(false)

const onAddOption = () => {
  showAddNewContractor.value = true
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

  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = 'Total';
      return;
    }

    if (column.property === 'amount') {
      const total = data.reduce((sum, row) => {
        const value = Number(row[column.property]);
        return isNaN(value) ? sum : sum + value;
      }, 0);
      sums[index] = formatAmountDisplay(total)
    } else {
      sums[index] = '';
    }
  });

  return sums;
};


const changeLocation = async (location: any) => {
  console.log('changeLocation', location)

  const selected_location = projectLocations.value.find(
    (item) => item.id === location
  );

  console.log('selected_location', selected_location)


  ruleForm.county_id = selected_location.county_id
  ruleForm.subcounty_id = selected_location.subcounty_id
  ruleForm.ward_id = selected_location.ward_id
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

      <el-tab-pane label="Clock-In/Out" name="clockin">
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
            <el-table-column label="Clock Out Time" width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.clock_out_time) }}
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
                {{ scope.row.total_hours ? scope.row.total_hours + ' hrs' : calculateHours(scope.row.clock_in_time, scope.row.clock_out_time) }}
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


      <el-tab-pane label="Disbursements" name="disbursement">
        <el-card>

          <el-button v-if="canManageDisbursements" @click="AddDisbursement" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add Disbursement(s)
          </el-button>
          <el-table :data="projectDisbursements" style="width: 100%" show-summary :summary-method="getSummaries">
            <el-table-column type="index" width="100" />
            <el-table-column prop="disbursement_date" label="Date">
              <template #default="{ row }">
                {{ formatDateDisplay(row.disbursement_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="Amount" align="right">
              <template #default="{ row }">
                {{ formatAmountDisplay(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="certificate" label="IPC" />
            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button 
                  v-if="canUserDeleteDisbursement(scope.row)"
                  plain type="danger" @click="RemoveDisbursement(scope.row)">
                  <Icon icon="material-symbols-light:delete-outline" style="  margin-right: 5px;" />
                  Remove
                </el-button>
              </template>
            </el-table-column>
          </el-table>
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
          Shared across all users. Search the list or type a new role — it is saved when you add the team member.
        </p>
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
        <el-select
          v-model="contractorForm.role"
          filterable
          clearable
          placeholder="Search role"
          :size="isMobile ? 'large' : 'default'"
          style="width: 100%;"
        >
          <el-option v-for="role in contract_roles" :key="role" :label="role" :value="role" />
        </el-select>
        <p class="contractor-role-hint">
          Includes main contractor, subcontractor, consultant, and other roles.
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
      <el-button :size="isMobile ? 'large' : 'default'" @click="prevStep" :disabled="activeStep === 0">Previous</el-button>
      <el-button :size="isMobile ? 'large' : 'default'" :disabled="disableIndicator" @click="nextStep" v-if="activeStep < 3">Next</el-button>
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




  <el-dialog
    v-model="AddDisbursementTeamDialog"
    title="Add Disbursement/Payemnt"
    :width="projectFormDialogWidth"
    :draggable="!isMobile"
    append-to-body
    align-center
    destroy-on-close
    class="project-details-dialog"
    :class="{ 'project-details-dialog--mobile': isMobile }"
  >
    <el-form
      :model="DisbursementForm"
      label-width="auto"
      style="max-width: 600px"
      label-position="top"
      ref="DisbursementFormRef"
      :rules="DisbursementRules"
      class="project-details-form"
    >
      <el-form-item label="IPC " prop="certificate">
        <el-input v-model="DisbursementForm.certificate" style="width: 100%;" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>

      <el-form-item label="Description " prop="description">
        <el-input v-model="DisbursementForm.description" style="width: 100%;" :size="isMobile ? 'large' : 'default'" />
      </el-form-item>

      <el-form-item label="Amount" prop="amount">
        <el-input
          :model-value="disbursementAmountInput"
          inputmode="decimal"
          placeholder="0"
          style="width: 100%;"
          :size="isMobile ? 'large' : 'default'"
          @update:model-value="handleDisbursementAmountInput"
        />
      </el-form-item>

      <el-form-item label="Date" prop="disbursement_date">
        <el-date-picker
          v-model="DisbursementForm.disbursement_date"
          :disabled-date="disabledFutureDates"
          style="width: 100%;"
          :size="isMobile ? 'large' : 'default'"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div
        class="project-details-dialog-footer"
        :class="{ 'project-details-dialog-footer--mobile': isMobile }"
      >
        <el-button :size="isMobile ? 'large' : 'default'" @click="AddDisbursementTeamDialog = false">Cancel</el-button>
        <el-button :size="isMobile ? 'large' : 'default'" type="primary" @click="updateDisbursement">
          <Icon icon="ic:round-save" style="margin-right: 6px;" />
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>









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