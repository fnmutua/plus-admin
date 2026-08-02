<template>

  <!-- Mobile overlay -->
  <div 
    v-if="isMobile && filtersVisible" 
    class="mobile-overlay"
    @click="filtersVisible = false"
  ></div>

  <!-- Filters panel -->
  <div
    v-if="filtersVisible"
    class="floating-collapse"
    :class="{ 'mobile-open': filtersVisible && isMobile, 'mobile-closed': !filtersVisible && isMobile }"
  >
    <el-collapse v-model="activeCollapse">
      <el-collapse-item name="filters">
        <template #title>
          <div class="filter-header">
            <Icon icon="mdi:filter-variant" width="20" class="filter-icon" />
            <span>Filters</span>
          </div>
        </template>
        <div class="filters-wrapper">
          <el-tabs v-model="activeFilterTab" class="filter-tabs">
            <el-tab-pane label="Component" name="component">
              <div class="filters-container">
                <el-tree-select
                  v-model="implementer"
                  :data="programmeTreeData"
                  multiple
                  show-checkbox
                  filterable
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  default-expand-all
                  node-key="value"
                  value-key="value"
                  :props="{ label: 'label', children: 'children', value: 'value' }"
                  placeholder="Filter by Programme"
                  class="filter-select compact-select"
                  teleported
                  :popper-options="selectPopperOptions"
                  popper-class="filter-select-dropdown"
                />
                <el-tree-select
                  v-model="component"
                  :data="componentTreeData"
                  multiple
                  show-checkbox
                  filterable
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  default-expand-all
                  node-key="value"
                  value-key="value"
                  :props="{ label: 'label', children: 'children', value: 'value' }"
                  placeholder="Filter by Component"
                  :disabled="implementer.length === 0"
                  class="filter-select compact-select"
                  teleported
                  :popper-options="selectPopperOptions"
                  popper-class="filter-select-dropdown"
                />
              </div>
            </el-tab-pane>
            <el-tab-pane label="Admin" name="admin">
              <div class="filters-container">
                <el-tree-select
                  v-model="locationSelection"
                  :data="locationTreeData"
                  multiple
                  show-checkbox
                  filterable
                  :clearable="!isCountyRestricted"
                  :disabled="isCountyRestricted"
                  collapse-tags
                  collapse-tags-tooltip
                  default-expand-all
                  node-key="value"
                  value-key="value"
                  :props="{ label: 'label', children: 'children', value: 'value' }"
                  placeholder="Filter by County / Subcounty"
                  class="filter-select compact-select"
                  teleported
                  :popper-options="selectPopperOptions"
                  popper-class="filter-select-dropdown"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
          <el-button @click="resetFilters" class="reset-button compact-button">Reset Filters</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>

  <div id="map" class="map"></div>

  <!-- AI loading overlay -->
  <Transition name="ai-overlay-fade">
    <div v-if="mapLoading" class="ai-loading-overlay">
      <div class="ai-loading-box">
        <div class="ai-spinner">
          <div class="ai-ring ai-ring-1"></div>
          <div class="ai-ring ai-ring-2"></div>
          <div class="ai-ring ai-ring-3"></div>
          <Icon icon="material-symbols:map" width="36" class="ai-center-icon" />
        </div>
        <p class="ai-loading-title">
          Analysing {{ mapFilterContext || 'Kenya' }} data
        </p>
        <p class="ai-loading-wait">Please wait…</p>
        <Transition name="ai-msg-fade" mode="out-in">
          <p :key="aiMapMsgIndex" class="ai-loading-msg">{{ aiMapMessages[aiMapMsgIndex] }}</p>
        </Transition>
        <div class="ai-dots">
          <span v-for="(_, i) in aiMapMessages" :key="i" :class="['ai-dot', { active: i === aiMapMsgIndex }]"></span>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Project Details Drawer -->
  <el-drawer
    v-model="drawerVisible"
    title="Project Location Details"
    direction="rtl"
    :size="drawerSize"
    :before-close="handleDrawerClose"
  >
    <div v-if="projectDetails.projectTitle" class="project-details">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Project Title">
          {{ projectDetails.projectTitle }}
        </el-descriptions-item>
        <el-descriptions-item label="Contract Code">
          {{ projectDetails.projectCode }}
        </el-descriptions-item>
        <el-descriptions-item label="Locations">
          <div v-if="projectLocationsList.length" class="project-locations-list-wrap">
            <ul class="project-locations-list">
              <li
                v-for="loc in visibleDrawerLocations"
                :key="loc.id"
                :class="{ 'is-selected': String(loc.id) === String(selectedProjectLocationId) }"
              >
                <Icon
                  v-if="locationHasGeoPoint(loc)"
                  icon="mdi:map-marker"
                  class="location-geo-marker"
                  title="Pinned map location"
                />
                {{ formatDrawerLocationLabel(loc) }}
              </li>
            </ul>
            <el-button
              v-if="projectLocationsList.length > drawerLocationsPreviewLimit && !drawerLocationsExpanded"
              link
              type="primary"
              class="project-locations-toggle"
              @click="drawerLocationsExpanded = true"
            >
              Show all ({{ projectLocationsList.length }})
            </el-button>
            <el-button
              v-else-if="projectLocationsList.length > drawerLocationsPreviewLimit && drawerLocationsExpanded"
              link
              type="primary"
              class="project-locations-toggle"
              @click="drawerLocationsExpanded = false"
            >
              Show less
            </el-button>
          </div>
          <span v-else class="project-locations-empty">No locations configured</span>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="projectDetails.project" class="additional-details">
        <h4 style="margin-top: 20px; margin-bottom: 10px;">Additional Project Information</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item v-if="projectDetails.project.description" label="Description">
            {{ projectDetails.project.description }}
          </el-descriptions-item>
          <el-descriptions-item v-if="projectDetails.project.start_date" label="Start Date">
            {{ projectDetails.project.start_date }}
          </el-descriptions-item>
          <el-descriptions-item v-if="projectDetails.project.end_date" label="End Date">
            {{ projectDetails.project.end_date }}
          </el-descriptions-item>
          <el-descriptions-item v-if="projectDetails.project.status" label="Status">
            {{ projectDetails.project.status }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="isSettlement" class="settlement-actions" style="margin-top: 20px;">
        <el-button 
          type="primary" 
          @click="goToSettlementDetails"
          style="width: 100%;"
        >
          View Settlement Details
        </el-button>
      </div>
    </div>

    <template v-if="canViewProjectDetails && projectDetails.projectId" #footer>
      <el-button
        type="primary"
        style="width: 100%;"
        @click="goToProjectDetails"
      >
        View Project Details
      </el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, type Ref } from 'vue'
import { ElButton, ElTreeSelect, ElMessage, ElDrawer, ElDescriptions, ElDescriptionsItem, ElCollapse, ElCollapseItem, ElTabs, ElTabPane } from 'element-plus'
import { Icon } from '@iconify/vue'
import mapboxgl from "mapbox-gl"
import 'mapbox-gl/dist/mapbox-gl.css'
import * as turf from '@turf/turf'
import { useAppStore, useAppStoreWithOut } from '@/store/modules/app'
import {
  getOptimizedProjectLocations,
  getBatchGeometries,
  getCountiesList,
  getSubcountiesList,
  getProgrammesList,
  getComponentsList
} from '@/api/project-locations-optimized'
import { getProjectMapBundle } from '@/api/dashboard/bundle'
import { normalizeFeatureCollection } from '@/utils/normalizeGeoJson'
import { getOneSettlement, getSettlementListByCounty } from '@/api/settlements'
import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import { hasPermission } from '@/utils/documentPermissions'
import { debounce } from '@/utils/debounce'
import {
  buildProgrammeTreeSelectData,
  buildSortedProgrammeTree,
} from '@/utils/programmeComponentTree'
import {
  getProgrammeDescendantIds,
  type ProgrammeRecord,
} from '@/utils/programmeValidation'

// User and role setup
const appStore = useAppStore()
const router = useRouter()
const { wsCache } = useCache()
const appStoreWithOut = useAppStoreWithOut()
const userInfo = wsCache.get(appStoreWithOut.getUserInfo)

// User location-based filtering
const isSuperAdmin = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.name === 'super_admin' || role.name === 'root_admin'
  ) || false
})

const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles))

const userCountyRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'county'
  )
})

const userCountyId = computed(() => {
  return userCountyRole.value?.user_roles?.county_id || null
})

const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

// Map and data refs
const map = ref<mapboxgl.Map | null>(null)
const mapLoading = ref(false)
const mapLoadingText = ref('Loading map....')
const isDarkMode = computed(() => appStore.getIsDark)

// ── AI loading overlay ────────────────────────────────────────────────────────
const mapFilterContext = computed(() => {
  const summarize = (labels: string[], max = 3) => {
    if (!labels.length) return ''
    if (labels.length <= max) return labels.join(', ')
    return `${labels.slice(0, max).join(', ')} (+${labels.length - max} more)`
  }
  if (subcounty.value?.length) {
    const labels = subCountyOptions.value.filter(s => subcounty.value.includes(s.value as any)).map(s => s.label)
    return summarize(labels)
  }
  if (county.value?.length) {
    const labels = countyOptions.value.filter(c => county.value.includes(c.value as any)).map(c => c.label)
    return summarize(labels)
  }
  return ''
})

const aiMapMessages = computed(() => {
  const loc = mapFilterContext.value || 'Kenya'
  return [
    `Loading project locations for ${loc}…`,
    `Rendering project boundaries in ${loc}…`,
    `Fetching geospatial project data for ${loc}…`,
    `Mapping infrastructure projects in ${loc}…`,
    `Clustering project data across ${loc}…`,
    `Joining project records with map layers for ${loc}…`,
    `Drawing project zones in ${loc}…`,
    `Loading satellite overlay for ${loc}…`,
    `Rendering project coverage for ${loc}…`,
    `Almost ready — finalising map for ${loc}…`,
  ]
})
const aiMapMsgIndex = ref(0)
let aiMapMsgTimer: ReturnType<typeof setInterval> | null = null

watch(mapLoading, (loading) => {
  if (loading) {
    aiMapMsgIndex.value = 0
    aiMapMsgTimer = setInterval(() => {
      aiMapMsgIndex.value = (aiMapMsgIndex.value + 1) % aiMapMessages.value.length
    }, 2800)
  } else {
    if (aiMapMsgTimer) { clearInterval(aiMapMsgTimer); aiMapMsgTimer = null }
  }
})

// Collapse state — closed by default on all screen sizes
const activeCollapse = ref<string[]>([])
const activeFilterTab = ref('component')
const selectPopperOptions = { strategy: 'fixed' as const }

// Mobile filter visibility
const filtersVisible = ref(false)
const isMobile = ref(window.innerWidth <= 768)

// Store filter control reference
const filterControlRef = ref<mapboxgl.IControl | null>(null)

// Update mobile state on resize
const updateMobileState = () => {
  isMobile.value = window.innerWidth <= 768
  // Keep control on both desktop and mobile, just adjust filter panel behavior
  if (!isMobile.value && filtersVisible.value) {
    // On desktop, filters panel stays visible (floating), no need to close
  }
}

// Toggle filters (works for both desktop and mobile)
const toggleFilters = () => {
  filtersVisible.value = !filtersVisible.value
  if (filtersVisible.value) {
    activeCollapse.value = ['filters']
  } else if (!isMobile.value) {
    activeCollapse.value = []
  }
}

// Watch for window resize
const outsideClickHandler = (e: MouseEvent) => {
  if (isMobile.value && filtersVisible.value) {
    const target = e.target as HTMLElement
    const filtersPanel = document.querySelector('.floating-collapse')
    const filterControl = document.querySelector('.filter-control')
    const inSelectDropdown = target.closest('.filter-select-dropdown')
    if (inSelectDropdown) return
    if (filtersPanel && filterControl &&
        !filtersPanel.contains(target) &&
        !filterControl.contains(target)) {
      filtersVisible.value = false
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateMobileState)
  document.addEventListener('click', outsideClickHandler)
}

onUnmounted(() => {
  window.removeEventListener('resize', updateMobileState)
  document.removeEventListener('click', outsideClickHandler)
  map.value?.remove()
})

// Filter refs
const county = ref<number[]>([])
const subcounty = ref<number[]>([])
const implementer = ref<number[]>([])
const component = ref<number[]>([])
const filtersInteractive = ref(false)
let suppressFilterWatch = false

const normalizeNumericIds = (values: unknown): number[] => {
  const list = Array.isArray(values) ? values : values != null && values !== '' ? [values] : []
  return [
    ...new Set(
      list
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
    ),
  ]
}

const withSuppressedFilterWatch = (fn: () => void) => {
  suppressFilterWatch = true
  try {
    fn()
  } finally {
    suppressFilterWatch = false
  }
}

const syncFilterIds = () => {
  const nextImplementer = normalizeNumericIds(implementer.value)
  const nextComponent = normalizeNumericIds(component.value)
  const nextCounty = normalizeNumericIds(county.value)
  const nextSubcounty = normalizeNumericIds(subcounty.value)

  withSuppressedFilterWatch(() => {
    if (JSON.stringify(nextImplementer) !== JSON.stringify(implementer.value)) {
      implementer.value = nextImplementer
    }
    const validComponentIds = new Set(componentOptions.value.map((option) => option.value))
    const filteredComponents = nextComponent.filter((id) => validComponentIds.has(id))
    if (JSON.stringify(filteredComponents) !== JSON.stringify(component.value)) {
      component.value = filteredComponents
    }
    if (JSON.stringify(nextCounty) !== JSON.stringify(county.value)) {
      county.value = nextCounty
    }
    if (JSON.stringify(nextSubcounty) !== JSON.stringify(subcounty.value)) {
      subcounty.value = nextSubcounty
    }
  })
  syncLocationSelectionFromRefs()
}

const drawerLocationsPreviewLimit = 5
const projectLocationsList = ref<any[]>([])
const drawerLocationsExpanded = ref(false)
const selectedProjectLocationId = ref<number | string | null>(null)

const visibleDrawerLocations = computed(() => {
  const list = projectLocationsList.value
  if (drawerLocationsExpanded.value || list.length <= drawerLocationsPreviewLimit) {
    return list
  }
  return list.slice(0, drawerLocationsPreviewLimit)
})

function formatDrawerLocationLabel(location: any): string {
  const storedName = typeof location?.location_name === 'string' ? location.location_name.trim() : ''
  if (storedName) return storedName
  if (location?.settlement?.name) return location.settlement.name
  if (location?.ward?.name) return location.ward.name
  if (location?.subcounty?.name) return location.subcounty.name
  if (location?.county?.name) return location.county.name
  return 'Unknown location'
}

function locationHasGeoPoint(location: any): boolean {
  const geomType = String(location?.geomType || location?.geom?.type || '')
  return geomType === 'Point' || geomType === 'MultiPoint'
}

async function loadProjectLocationsForDrawer(projectId: number | string) {
  try {
    const res = await getSettlementListByCounty({
      model: 'project_location',
      filters: ['project_id'],
      filterValues: [[projectId]],
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward'],
      excludeGeom: true,
      page: 1,
      limit: 500,
    } as any)
    projectLocationsList.value = (res as any).data || []
  } catch (error) {
    console.error('Error loading project locations for drawer:', error)
    projectLocationsList.value = []
  }
}

// Drawer state
const drawerVisible = ref(false)
const projectDetails = ref({
  projectId: null as number | string | null,
  projectTitle: '',
  projectCode: '',
  projectLocationId: '',
  project: {
    description: '',
    start_date: '',
    end_date: '',
    status: ''
  },
  settlementId: null,
  locationType: ''
})

const canViewProjectDetails = computed(() => hasPermission(userInfo, 'project:read'))

// Data refs
const geojson = ref<any>({ type: 'FeatureCollection', features: [] })
const countyGeo = ref<any>(null)
// const subcountyGeo = ref<any>(null) // Reserved for future use

// Options refs
const countyOptions = ref<Array<{value: number, label: string}>>([])
const subCountyOptions = ref<Array<{value: number, label: string, countyId: number}>>([])
const programmeList = ref<ProgrammeRecord[]>([])
const componentOptions = ref<Array<{ value: number; label: string; programmeId: number }>>([])

const resolveProgrammeFilterIds = (selected: number[]): number[] => {
  const ids = new Set<number>()
  normalizeNumericIds(selected).forEach((id) => {
    ids.add(id)
    getProgrammeDescendantIds(id, programmeList.value).forEach((childId) => ids.add(childId))
  })
  return [...ids]
}

const programmeTreeData = computed(() => buildProgrammeTreeSelectData(programmeList.value))

const componentTreeData = computed(() => {
  if (!implementer.value.length) return []

  const allowedProgrammeIds = new Set(resolveProgrammeFilterIds(normalizeNumericIds(implementer.value)))
  const groups: Array<{ value: number; label: string; disabled: boolean; children: Array<{ value: number; label: string }> }> = []

  const walkProgrammes = (nodes: ProgrammeRecord[]) => {
    nodes.forEach((node) => {
      const programmeId = Number(node.id)
      const components = componentOptions.value
        .filter((c) => c.programmeId === programmeId)
        .map((c) => ({ value: c.value, label: c.label }))

      if (components.length && allowedProgrammeIds.has(programmeId)) {
        groups.push({
          value: -programmeId,
          label: String(node.title || node.acronym || programmeId),
          children: components,
        })
      }

      if (node.children?.length) walkProgrammes(node.children)
    })
  }

  walkProgrammes(buildSortedProgrammeTree(programmeList.value))
  return groups
})

const selectedProgrammeIds = computed(() =>
  normalizeNumericIds(implementer.value).length
    ? resolveProgrammeFilterIds(normalizeNumericIds(implementer.value))
    : []
)

const selectedComponentIds = computed(() => normalizeNumericIds(component.value))

const hasAdminLocationFilter = computed(
  () => normalizeNumericIds(county.value).length > 0 || normalizeNumericIds(subcounty.value).length > 0
)

const subcountiesByCountyId = ref(new Map<number, Array<{ value: number; label: string }>>())
const locationSelection = ref<string[]>([])

const parseLocationSelection = (values: unknown) => {
  const list = Array.isArray(values) ? values : []
  const nextCounty: number[] = []
  const nextSubcounty: number[] = []

  list.forEach((entry) => {
    const value = String(entry)
    if (value.startsWith('c:')) {
      const id = Number(value.slice(2))
      if (Number.isFinite(id) && id > 0) nextCounty.push(id)
    } else if (value.startsWith('s:')) {
      const id = Number(value.slice(2))
      if (Number.isFinite(id) && id > 0) nextSubcounty.push(id)
    }
  })

  return {
    county: [...new Set(nextCounty)],
    subcounty: [...new Set(nextSubcounty)],
  }
}

const syncLocationSelectionFromRefs = () => {
  const next = [
    ...normalizeNumericIds(county.value).map((id) => `c:${id}`),
    ...normalizeNumericIds(subcounty.value).map((id) => `s:${id}`),
  ]
  if (JSON.stringify(next) !== JSON.stringify(locationSelection.value)) {
    withSuppressedFilterWatch(() => {
      locationSelection.value = next
    })
  }
}

const refreshSubCountyOptionsFromCache = (restrictToIds?: number[]) => {
  const all: typeof subCountyOptions.value = []
  subcountiesByCountyId.value.forEach((subs, countyId) => {
    subs.forEach((subcountyItem) => {
      if (!restrictToIds?.length || restrictToIds.includes(subcountyItem.value)) {
        all.push({ ...subcountyItem, countyId })
      }
    })
  })
  subCountyOptions.value = all.sort((a, b) => a.value - b.value)
}

const ensureSubcountiesLoaded = async (countyIds: number[], restrictToIds?: number[]) => {
  const missing = countyIds.filter((id) => !subcountiesByCountyId.value.has(id))
  if (missing.length) {
    await Promise.all(
      missing.map(async (countyId) => {
        const res = await getSubcountiesList({
          params: { model: 'subcounty', county_id: countyId },
        })
        let subs = ((res as any).data || []).map((item: any) => ({
          value: item.id,
          label: item.name,
        }))
        if (restrictToIds?.length) {
          const allowed = new Set(restrictToIds)
          subs = subs.filter((subcountyItem: { value: number }) => allowed.has(subcountyItem.value))
        }
        subcountiesByCountyId.value.set(countyId, subs)
      })
    )
  }
  refreshSubCountyOptionsFromCache(restrictToIds)
}

const locationTreeData = computed(() =>
  countyOptions.value.map((countyItem) => ({
    value: `c:${countyItem.value}`,
    label: countyItem.label,
    children: (subcountiesByCountyId.value.get(countyItem.value) || []).map((subcountyItem) => ({
      value: `s:${subcountyItem.value}`,
      label: subcountyItem.label,
    })),
  }))
)

const loadProgrammeOptions = async () => {
  try {
    const res = await getProgrammesList({})
    programmeList.value = Array.isArray(res?.data) ? res.data : []
  } catch (error) {
    console.error('Error loading programmes:', error)
    programmeList.value = []
  }
}

const loadComponentOptions = async () => {
  if (!normalizeNumericIds(implementer.value).length) {
    componentOptions.value = []
    return
  }
  try {
    const res = await getComponentsList({
      params: { programme_ids: resolveProgrammeFilterIds(normalizeNumericIds(implementer.value)).join(',') }
    })
    const rows = Array.isArray(res?.data) ? res.data : []
    componentOptions.value = rows.map((c: any) => ({
      value: c.id,
      label: c.title || c.acronym,
      programmeId: c.programme_id
    }))
  } catch (error) {
    console.error('Error loading components for programme:', error)
    componentOptions.value = []
  }
}

// Mapbox token
const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken

// Create custom filter control for Mapbox
const createFilterControl = (onClick: () => void, isVisible: Ref<boolean>) => {
  class FilterControl implements mapboxgl.IControl {
    private _container: HTMLElement
    private _button: HTMLButtonElement

    constructor() {
      this._container = document.createElement('div')
      this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group filter-control'
      
      this._button = document.createElement('button')
      this._button.className = 'mapboxgl-ctrl-icon filter-control-button'
      this._button.type = 'button'
      this._button.setAttribute('aria-label', 'Toggle Filters')
      this._button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
        </svg>
      `
      
      this._button.addEventListener('click', onClick)
      
      // Watch for visibility changes to update icon
      watch(isVisible, (visible) => {
        if (visible) {
          this._button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          `
          this._button.classList.add('active')
        } else {
          this._button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
          `
          this._button.classList.remove('active')
        }
      }, { immediate: true })
      
      this._container.appendChild(this._button)
    }

    onAdd(_map: mapboxgl.Map): HTMLElement {
      return this._container
    }

    onRemove(): void {
      this._container.parentNode?.removeChild(this._container)
    }

    getDefaultPosition(): string {
      return 'top-right'
    }
  }

  return new FilterControl()
}

// Initialize map
onMounted(() => {
  initializeMap()
})

const initializeMap = () => {
  const mapStyle = isDarkMode.value 
    ? 'mapbox://styles/agspatial/clqcfzcoa00bt01nwhmf465f7' 
    : 'mapbox://styles/mapbox/light-v11'
  
  map.value = new mapboxgl.Map({
    container: 'map',
    style: mapStyle,
    center: [36.799473, -1.264257],
    zoom: 14
  })

  map.value.addControl(new mapboxgl.NavigationControl())
  map.value.addControl(new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
  }))

  // Add custom filter control (works for both desktop and mobile)
  const filterControl = createFilterControl(toggleFilters, filtersVisible)
  map.value.addControl(filterControl, 'top-right')
  filterControlRef.value = filterControl

  // Watch for dark mode changes
  watch(
    () => appStore.getIsDark,
    async (newVal) => {
      if (!map.value) return
      const newStyle = newVal
        ? 'mapbox://styles/agspatial/clqcfzcoa00bt01nwhmf465f7'
        : 'mapbox://styles/mapbox/light-v11'
      
      map.value.setStyle(newStyle)
      map.value.once('styledata', async () => {
        await addProjectLayers()
      })
    }
  )

  map.value.on('load', async () => {
    await initializeMapData()
  })

  // Add click event for project locations
  map.value.on('click', 'projectLocations', async (e: any) => {
    const feature = e.features[0]
    if (feature && feature.properties) {
      await getClickedProjectLocation(feature.properties.id)
    }
  })

  // Change cursor on hover
  map.value.on('mouseenter', 'projectLocations', () => {
    if (map.value) {
      map.value.getCanvas().style.cursor = 'pointer'
    }
  })

  map.value.on('mouseleave', 'projectLocations', () => {
    if (map.value) {
      map.value.getCanvas().style.cursor = ''
    }
  })
}

// Initialize map data
const tryApplyProjectMapBundle = async (): Promise<boolean> => {
  if (isCountyRestricted.value && userCountyId.value) return false
  // National bundle is all locations — programme-scoped users must use live API
  if (!isSuperAdmin.value && !hasNationalAccess.value) return false
  try {
    const bundle = await getProjectMapBundle()
    if (bundle.code !== '0000') return false

    const fc = normalizeFeatureCollection(bundle.projectLocations)
    if (!fc.features.length) {
      console.warn('[project-map] bundle has no project locations, falling back to live API')
      return false
    }

    geojson.value = fc
    countyOptions.value = (bundle.counties || []).map((item: any) => ({
      value: item.id,
      label: item.name,
    }))
    countyGeo.value = normalizeFeatureCollection(bundle.countyGeo)
    return true
  } catch (err) {
    console.warn('[project-map] bundle load failed, falling back to live API', err)
    return false
  }
}

const initializeMapData = async () => {
  try {
    mapLoading.value = true
    mapLoadingText.value = 'Loading data...'

    if (isCountyRestricted.value && userCountyId.value) {
      await loadProgrammeOptions()
      const [, , , countyGeoData] = await Promise.all([
        loadProjectLocations(),
        loadCounties(),
        loadCountyGeo(),
      ])
      county.value = [userCountyId.value]
      syncFilterIds()
      filtersInteractive.value = true
      await handleChangeLocation()
      mapLoading.value = false
      return
    }

    const usedBundle = await tryApplyProjectMapBundle()
    if (usedBundle) {
      await loadProgrammeOptions()
      await addProjectLayers()
      await syncMapBoundaryLayers()
      syncFilterIds()
      filtersInteractive.value = true
      mapLoading.value = false
      return
    }

    // Parallelize initial data loading
    const [, , , countyGeoData] = await Promise.all([
      loadProgrammeOptions(),
      loadProjectLocations(),
      loadCounties(),
      loadCountyGeo()
    ])

    await addProjectLayers()
    await syncMapBoundaryLayers()

    mapLoading.value = false
  } catch (error: any) {
    console.error('Error initializing map:', error)
    ElMessage.error('Failed to load map data')
    mapLoading.value = false
  } finally {
    syncFilterIds()
    filtersInteractive.value = true
  }
}

// Load project locations with server-side filtering
const loadProjectLocations = async (filters?: {
  countyIds?: number[],
  subcountyIds?: number[],
  programmeIds?: number[],
  componentIds?: number[]
}) => {
  try {
    const params: any = {
      model: 'project_location',
      includeCentroids: true,
      includePolygons: false
    }

    // Build filter arrays
    const filterFields: string[] = []
    const filterValues: any[] = []

    // Apply user restrictions first (for county-restricted users)
    if (isCountyRestricted.value && userCountyId.value) {
      filterFields.push('county_id')
      filterValues.push([userCountyId.value])
    } else if (filters?.countyIds && filters.countyIds.length > 0) {
      // Apply county filter for non-restricted users
      filterFields.push('county_id')
      filterValues.push(filters.countyIds)
    }

    // Apply subcounty filter (works for both restricted and non-restricted users)
    if (filters?.subcountyIds && filters.subcountyIds.length > 0) {
      filterFields.push('subcounty_id')
      filterValues.push(filters.subcountyIds)
    }

    // Programme filter — via project → component.programme_id (when no component selected)
    if (filters?.programmeIds && filters.programmeIds.length > 0 && !(filters?.componentIds?.length)) {
      filterFields.push('programme_id')
      filterValues.push(filters.programmeIds)
    }

    // Component filter — via project.component_id (narrows within selected programme(s))
    if (filters?.componentIds && filters.componentIds.length > 0) {
      filterFields.push('component_id')
      filterValues.push(filters.componentIds)
    }

    // Set filters if any were added
    if (filterFields.length > 0) {
      params.filters = filterFields
      params.filterValues = filterValues
    }

    const response = await getOptimizedProjectLocations({ params })
    geojson.value = normalizeFeatureCollection(
      (response as any).results || (response as any).data || response,
    )
    
    return geojson.value
  } catch (error: any) {
    console.error('Error loading project locations:', error)
    ElMessage.error('Failed to load project locations')
    geojson.value = { type: 'FeatureCollection', features: [] }
    return geojson.value
  }
}

// Load counties list
const loadCounties = async () => {
  try {
    const params: any = {
      model: 'county',
      cache_key: 'counties_list_optimized'
    }

    if (isCountyRestricted.value && userCountyId.value) {
      params.filters = ['id']
      params.filterValues = [[userCountyId.value]]
    }

    const response = await getCountiesList({ params })
    countyOptions.value = ((response as any).data || []).map((item: any) => ({
      value: item.id,
      label: item.name
    }))

    await ensureSubcountiesLoaded(countyOptions.value.map((item) => item.value))
    
    return countyOptions.value
  } catch (error: any) {
    console.error('Error loading counties:', error)
    return []
  }
}


// Load county geometries
const loadCountyGeo = async () => {
  try {
    const formData: any = {
      model: 'county',
      cache_key: 'county_geo_optimized'
    }
    
    const res = await getBatchGeometries({ data: formData })
    countyGeo.value = (res as any).data || { type: 'FeatureCollection', features: [] }
    return countyGeo.value
  } catch (error: any) {
    console.error('Error loading county geo:', error)
    return null
  }
}

// Add project layers to map
const addProjectLayers = async () => {
  if (!map.value) return

  const mapData = normalizeFeatureCollection(geojson.value)

  // Update or add source
  if (map.value.getSource('projectLocations')) {
    (map.value.getSource('projectLocations') as mapboxgl.GeoJSONSource).setData(mapData)
  } else {
    map.value.addSource('projectLocations', {
      type: 'geojson',
      data: mapData
    })
  }

  // Add project location points
  if (!map.value.getLayer('projectLocations')) {
    map.value.addLayer({
      id: 'projectLocations',
      type: 'circle',
      source: 'projectLocations',
      paint: {
        'circle-color': 'green',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    })
  }

  // Add labels
  if (!map.value.getLayer('projectLabels')) {
    map.value.addLayer({
      id: 'projectLabels',
      type: 'symbol',
      source: 'projectLocations',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-offset': [0, 1]
      },
      paint: {
        'text-color': 'red',
        'text-halo-color': 'white',
        'text-halo-width': 1
      }
    })
  }

  // Fit bounds if we have features
  if (geojson.value?.features?.length > 0) {
    try {
      const bounds = turf.bbox(geojson.value)
      if (bounds && bounds.length === 4 &&
          isFinite(bounds[0]) && isFinite(bounds[1]) &&
          isFinite(bounds[2]) && isFinite(bounds[3])) {
        // Responsive padding based on screen size
        const isMobile = window.innerWidth <= 768
        const padding = isMobile ? 50 : 20
        map.value.fitBounds(bounds as [number, number, number, number], { padding })
      }
    } catch (error) {
      console.warn('Error fitting bounds:', error)
    }
  }
}

// Add county layer
const clearCountyLayer = () => {
  if (!map.value) return
  if (map.value.getLayer('county')) map.value.removeLayer('county')
  if (map.value.getSource('County')) map.value.removeSource('County')
}

const clearSubcountyLayer = () => {
  if (!map.value) return
  if (map.value.getLayer('Subcounty')) map.value.removeLayer('Subcounty')
  if (map.value.getSource('Subcounty')) map.value.removeSource('Subcounty')
}

const showNationalCountyOutline = () => {
  if (!countyGeo.value) return
  clearSubcountyLayer()
  addCountyLayer(countyGeo.value)
  fitToGeoData(countyGeo.value)
}

const getCountyIdsFromProjects = (): number[] => {
  const ids = new Set<number>()
  geojson.value.features.forEach((feature: any) => {
    const id = Number(feature.properties?.county_id)
    if (Number.isFinite(id) && id > 0) ids.add(id)
  })
  return Array.from(ids)
}

const applyCountyBoundariesFromProjects = async () => {
  clearSubcountyLayer()
  const countyIds = getCountyIdsFromProjects()

  if (!countyIds.length) {
    clearCountyLayer()
    return
  }

  const countyGeos = await loadCountyGeometries(countyIds)
  if (countyGeos?.features?.length) {
    addCountyLayer(countyGeos)
    fitToGeoData(countyGeos)
  } else {
    clearCountyLayer()
  }
}

const applyAdminBoundaryLayers = async () => {
  const countyArray = normalizeNumericIds(county.value)
  const subcountyArray = normalizeNumericIds(subcounty.value)

  if (subcountyArray.length > 0) {
    clearCountyLayer()
    const subcountyGeos = await loadSubcountyGeometries(subcountyArray)
    if (subcountyGeos) {
      addSubcountyLayer(subcountyGeos)
      fitToGeoData(subcountyGeos)
    }
    return
  }

  clearSubcountyLayer()
  if (countyArray.length > 0) {
    const countyGeos = await loadCountyGeometries(countyArray)
    if (countyGeos) {
      addCountyLayer(countyGeos)
      fitToGeoData(countyGeos)
    }
    return
  }

  clearCountyLayer()
}

const syncMapBoundaryLayers = async () => {
  if (hasAdminLocationFilter.value) {
    await applyAdminBoundaryLayers()
    return
  }

  if (geojson.value.features.length > 0) {
    await applyCountyBoundariesFromProjects()
    return
  }

  clearCountyLayer()
  clearSubcountyLayer()

  if (countyGeo.value) {
    showNationalCountyOutline()
  }
}

const addCountyLayer = (geoData: any) => {
  if (!map.value) return

  if (map.value.getSource('County')) {
    (map.value.getSource('County') as mapboxgl.GeoJSONSource).setData(geoData)
  } else {
    map.value.addSource('County', {
      type: 'geojson',
      data: geoData
    })

    const beforeId = map.value.getLayer('projectLabels') ? 'projectLabels' : undefined
    map.value.addLayer({
      id: 'county',
      type: 'line',
      source: 'County',
      paint: {
        'line-color': 'red',
        'line-opacity': 1,
        'line-width': 2
      }
    }, beforeId)
  }
}

// Fit map to given GeoJSON data bounds
const fitToGeoData = (geoData: any) => {
  if (!map.value || !geoData?.features?.length) return
  try {
    const bounds = turf.bbox(geoData)
    if (bounds && bounds.length === 4 &&
        isFinite(bounds[0]) && isFinite(bounds[1]) &&
        isFinite(bounds[2]) && isFinite(bounds[3])) {
      const padding = window.innerWidth <= 768 ? 50 : 20
      map.value.fitBounds(bounds as [number, number, number, number], { padding })
    }
  } catch (error) {
    console.warn('Error fitting bounds:', error)
  }
}

// Debounced admin location change handler
const handleChangeLocation = debounce(async () => {
  if (!map.value || !filtersInteractive.value) return

  syncFilterIds()
  const countyArray = normalizeNumericIds(county.value)
  const subcountyArray = normalizeNumericIds(subcounty.value)

  try {
    mapLoading.value = true
    mapLoadingText.value = 'Loading filtered project locations...'

    if (subcountyArray.length === 0) {
      clearSubcountyLayer()
    }

    await loadProjectLocations({
      countyIds: (!isCountyRestricted.value && countyArray.length > 0) ? countyArray : undefined,
      subcountyIds: subcountyArray.length > 0 ? subcountyArray : undefined,
      programmeIds: selectedProgrammeIds.value.length > 0 ? selectedProgrammeIds.value : undefined,
      componentIds: selectedComponentIds.value.length > 0 ? selectedComponentIds.value : undefined
    })

    await addProjectLayers()
    await syncMapBoundaryLayers()

    mapLoading.value = false
  } catch (error: any) {
    console.error('Error changing location:', error)
    ElMessage.error('Failed to load location data')
    mapLoading.value = false
  }
}, 300)

// Debounced programme change handler — cascades to components then projects
const handleChangeImplementer = debounce(async () => {
  if (!map.value || !filtersInteractive.value) return

  syncFilterIds()
  const programmeArray = normalizeNumericIds(implementer.value)

  withSuppressedFilterWatch(() => {
    component.value = []
  })

  try {
    mapLoading.value = true
    mapLoadingText.value = 'Loading filtered project locations...'

    await loadComponentOptions()

    const validComponentIds = new Set(componentOptions.value.map((o) => o.value))
    withSuppressedFilterWatch(() => {
      component.value = component.value.filter((id) => validComponentIds.has(id))
    })

    const expandedProgrammeIds = programmeArray.length
      ? resolveProgrammeFilterIds(programmeArray)
      : []

    await loadProjectLocations({
      countyIds: normalizeNumericIds(county.value).length > 0 ? normalizeNumericIds(county.value) : undefined,
      subcountyIds: normalizeNumericIds(subcounty.value).length > 0 ? normalizeNumericIds(subcounty.value) : undefined,
      programmeIds: expandedProgrammeIds.length > 0 ? expandedProgrammeIds : undefined,
      componentIds: undefined
    })

    await Promise.all([
      filterCountyOptionsByImplementer(),
      addProjectLayers()
    ])
    await syncMapBoundaryLayers()

    if (programmeArray.length === 0) {
      await loadCounties()
      componentOptions.value = []
    }

    const validCountyIds = new Set(countyOptions.value.map(o => o.value))
    withSuppressedFilterWatch(() => {
      county.value = county.value.filter(id => validCountyIds.has(id))
      subcounty.value = subcounty.value.filter((id) =>
        subCountyOptions.value.some((option) => option.value === id)
      )
    })
    syncLocationSelectionFromRefs()

    await ensureSubcountiesLoaded(
      countyOptions.value.map((item) => item.value),
      programmeArray.length > 0 ? getSubcountyIdsFromProjects() : undefined
    )

    mapLoading.value = false
  } catch (error: any) {
    console.error('Error changing programme:', error)
    ElMessage.error('Failed to load programme data')
    mapLoading.value = false
  }
}, 300)

// Debounced component change handler
const handleChangeComponent = debounce(async () => {
  if (!map.value || !filtersInteractive.value) return

  syncFilterIds()
  const componentArray = selectedComponentIds.value
  const countyArray = normalizeNumericIds(county.value)

  try {
    mapLoading.value = true
    mapLoadingText.value = 'Loading filtered project locations...'

    await loadProjectLocations({
      countyIds: countyArray.length > 0 ? countyArray : undefined,
      subcountyIds: normalizeNumericIds(subcounty.value).length > 0 ? normalizeNumericIds(subcounty.value) : undefined,
      programmeIds: selectedProgrammeIds.value.length > 0 ? selectedProgrammeIds.value : undefined,
      componentIds: componentArray.length > 0 ? componentArray : undefined
    })

    // Cascade: narrow county options to counties containing matching projects
    await Promise.all([
      filterCountyOptionsByImplementer(),
      addProjectLayers()
    ])
    await syncMapBoundaryLayers()

    // Clear any county selections no longer valid after component filter
    const validCountyIds = new Set(countyOptions.value.map(o => o.value))
    withSuppressedFilterWatch(() => {
      county.value = county.value.filter(id => validCountyIds.has(id))
      subcounty.value = subcounty.value.filter((id) =>
        subCountyOptions.value.some((option) => option.value === id)
      )
    })
    syncLocationSelectionFromRefs()

    const subcountyRestriction = getSubcountyIdsFromProjects()
    await ensureSubcountiesLoaded(
      countyOptions.value.map((item) => item.value),
      subcountyRestriction.length > 0 ? subcountyRestriction : undefined
    )

    mapLoading.value = false
  } catch (error: any) {
    console.error('Error changing component:', error)
    ElMessage.error('Failed to load component data')
    mapLoading.value = false
  }
}, 300)

watch(implementer, () => {
  if (suppressFilterWatch || !filtersInteractive.value) return
  handleChangeImplementer()
}, { deep: true })

watch(component, () => {
  if (suppressFilterWatch || !filtersInteractive.value) return
  handleChangeComponent()
}, { deep: true })

watch(locationSelection, (values) => {
  if (suppressFilterWatch || !filtersInteractive.value) return
  const parsed = parseLocationSelection(values)
  withSuppressedFilterWatch(() => {
    county.value = parsed.county
    subcounty.value = parsed.subcounty
  })
  handleChangeLocation()
}, { deep: true })

// Load county geometries in batch
const loadCountyGeometries = async (countyIds: number[]) => {
  try {
    const response = await getBatchGeometries({
      data: {
        model: 'county',
        ids: countyIds
      }
    })
    return (response as any).data || { type: 'FeatureCollection', features: [] }
  } catch (error: any) {
    console.error('Error loading county geometries:', error)
    return null
  }
}

// Load subcounty geometries in batch
const loadSubcountyGeometries = async (subcountyIds: number[]) => {
  try {
    const response = await getBatchGeometries({
      data: {
        model: 'subcounty',
        ids: subcountyIds
      }
    })
    return (response as any).data || { type: 'FeatureCollection', features: [] }
  } catch (error: any) {
    console.error('Error loading subcounty geometries:', error)
    return null
  }
}

// Extract subcounty IDs present in the currently loaded (filtered) project features
const getSubcountyIdsFromProjects = (): number[] => {
  const ids = new Set<number>()
  geojson.value.features.forEach((f: any) => {
    const id = f.properties?.subcounty_id
    if (id != null && typeof id === 'number') ids.add(id)
  })
  return Array.from(ids)
}

// Add subcounty layer
const addSubcountyLayer = (geoData: any) => {
  if (!map.value) return

  if (map.value.getSource('Subcounty')) {
    (map.value.getSource('Subcounty') as mapboxgl.GeoJSONSource).setData(geoData)
  } else {
    map.value.addSource('Subcounty', {
      type: 'geojson',
      data: geoData
    })

    const beforeId = map.value.getLayer('projectLabels') ? 'projectLabels' : undefined
    map.value.addLayer({
      id: 'Subcounty',
      type: 'line',
      source: 'Subcounty',
      paint: {
        'line-color': 'blue',
        'line-opacity': 1,
        'line-width': 1,
        'line-dasharray': [2, 2]
      }
    }, beforeId)
  }
}

// Filter county options based on implementer's project locations
const filterCountyOptionsByImplementer = async () => {
  try {
    // Extract unique county IDs from filtered projects
    const countyIdSet = new Set<number>()
    geojson.value.features.forEach((feature: any) => {
      const id = feature.properties?.county_id
      if (id !== null && id !== undefined && typeof id === 'number') {
        countyIdSet.add(id)
      }
    })
    const countyIds: number[] = Array.from(countyIdSet)
    
    if (countyIds.length === 0) {
      countyOptions.value = []
      return
    }

    // Filter already-loaded county options — no extra API call needed
    const countyIdSet2 = new Set(countyIds)
    countyOptions.value = countyOptions.value.filter(option =>
      countyIdSet2.has(option.value)
    )
  } catch (error: any) {
    console.error('Error filtering county options by implementer:', error)
  }
}

// Reset filters
const resetFilters = async () => {
  filtersInteractive.value = false

  if (isCountyRestricted.value && userCountyId.value) {
    withSuppressedFilterWatch(() => {
      subcounty.value = []
      implementer.value = []
      component.value = []
    })
    componentOptions.value = []
    subCountyOptions.value = []
    county.value = [userCountyId.value]
    syncFilterIds()
    filtersInteractive.value = true
    await handleChangeLocation()
    return
  }

  withSuppressedFilterWatch(() => {
    county.value = []
    subcounty.value = []
    implementer.value = []
    component.value = []
    locationSelection.value = []
  })
  subCountyOptions.value = []
  componentOptions.value = []

  mapLoading.value = true
  mapLoadingText.value = 'Resetting filters...'

  clearSubcountyLayer()

  await loadProjectLocations()
  await addProjectLayers()
  await syncMapBoundaryLayers()

  syncFilterIds()
  filtersInteractive.value = true
  mapLoading.value = false
}

// Get clicked project location details
const getClickedProjectLocation = async (projectLocationId: number) => {
  try {
    const form: any = {
      model: 'project_location',
      id: projectLocationId,
      assocModel: 'project'
    }

    const res = await getOneSettlement(form)
    const projectLocation = (res as any).data || res.results

    const project = projectLocation.project || {}
    const projectCode = project.project_code || 'N/A'
    const projectTitle = project.title || 'Unknown Project'

    selectedProjectLocationId.value = projectLocationId
    drawerLocationsExpanded.value = false

    projectDetails.value = {
      projectId: project.id ?? null,
      projectTitle,
      projectCode,
      projectLocationId: projectLocationId.toString(),
      project: project,
      settlementId: projectLocation.settlement_id,
      locationType: projectLocation.location_type
    }

    if (project.id != null) {
      await loadProjectLocationsForDrawer(project.id)
    } else {
      projectLocationsList.value = []
    }

    drawerVisible.value = true
  } catch (error: any) {
    console.error('Error fetching project location details:', error)
    ElMessage.error('Failed to load project location details')
  }
}

// Handle drawer close
const handleDrawerClose = (done: () => void) => {
  drawerVisible.value = false
  projectLocationsList.value = []
  drawerLocationsExpanded.value = false
  selectedProjectLocationId.value = null
  projectDetails.value = {
    projectId: null,
    projectTitle: '',
    projectCode: '',
    projectLocationId: '',
    project: {
      description: '',
      start_date: '',
      end_date: '',
      status: ''
    },
    settlementId: null,
    locationType: ''
  }
  done()
}

const goToProjectDetails = () => {
  const projectId = projectDetails.value.projectId
  if (!projectId) return
  router.push({
    name: 'ProjectDetails',
    params: { id: projectId }
  })
}

// Navigate to settlement details
const goToSettlementDetails = () => {
  if (projectDetails.value.settlementId) {
    router.push({
      name: 'SettlementDetails',
      params: { id: projectDetails.value.settlementId }
    })
  }
}

// Check if project location is a settlement
const isSettlement = computed(() => {
  return projectDetails.value.settlementId || projectDetails.value.locationType === 'settlement'
})

// Responsive drawer size
const drawerSize = computed(() => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth <= 480) {
      return '90%'
    } else if (window.innerWidth <= 768) {
      return '85%'
    }
  }
  return '400px'
})
</script>

<style scoped>
.floating-collapse {
  position: fixed !important;
  top: 110px;
  left: 255px;
  z-index: 10000 !important;
  background-color: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 130px);
  overflow: visible;
  pointer-events: auto;
}

.dark .floating-collapse {
  background-color: rgba(30, 30, 30, 0.95);
  color: #f0f0f0;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
}

:deep(.el-collapse) {
  border: none;
  margin: 0;
}

:deep(.el-collapse-item__header) {
  border-radius: 8px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  height: 48px;
  line-height: 48px;
  background-color: transparent;
}

:deep(.el-collapse-item__wrap) {
  border: none;
  overflow: visible;
}

:deep(.el-collapse-item__content) {
  padding: 0;
  margin-top: 12px;
  overflow: visible;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  color: #606266;
}

.filters-wrapper {
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  background: var(--el-bg-color);
  overflow: visible;
}

.filter-tabs {
  width: 100%;
  overflow: visible;
}

.filter-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.filter-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0;
}

.filter-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
}

.filter-tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.filter-tabs :deep(.el-tab-pane) {
  overflow: visible;
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
}

.filter-select {
  width: 100% !important;
  position: relative;
  z-index: 1;
}

.filter-select:focus-within {
  z-index: 2;
}

.compact-select :deep(.el-input__wrapper) {
  padding-top: 4px;
  padding-bottom: 4px;
  min-height: 32px;
}

.compact-select :deep(.el-input__inner) {
  height: 24px;
  line-height: 24px;
  font-size: 13px;
}

.compact-select :deep(.el-select__tags) {
  max-width: calc(100% - 24px);
}

.compact-select :deep(.el-tag) {
  max-width: 100%;
}

.compact-button {
  margin-top: 4px;
  padding: 6px 12px;
  font-size: 13px;
}

.reset-button {
  width: 100%;
}

.compact-button {
  padding: 6px 12px;
  font-size: 13px;
}

#map {
  height: 95vh;
  width: 100%;
  position: relative;
  z-index: 1;
}

.project-details {
  padding: 20px;
}

.project-locations-list-wrap {
  width: 100%;
}

.project-locations-list {
  margin: 0;
  padding-left: 18px;
}

.project-locations-list li {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  line-height: 1.4;
}

.location-geo-marker {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: #e6a23c;
}

.project-locations-list li.is-selected {
  color: var(--el-color-primary);
  font-weight: 600;
}

.project-locations-toggle {
  margin-top: 4px;
  padding: 0;
}

.project-locations-empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.additional-details {
  margin-top: 20px;
}

.additional-details h4 {
  color: #409eff;
  font-weight: 600;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .floating-collapse {
    left: 20px;
    top: 80px;
    width: 260px;
    max-width: calc(100vw - 40px);
  }
}

/* Custom filter control styles */
.filter-control {
  margin-top: 10px;
}

.dark .filter-control-button.active {
  background-color: #409eff;
}

/* Mobile styles */
@media (max-width: 768px) {
  .floating-collapse {
    position: fixed !important;
    left: 0;
    top: 0;
    width: 280px;
    max-width: 85vw;
    height: 100vh;
    max-height: 100vh;
    padding: 16px;
    gap: 0;
    z-index: 10001 !important;
    background-color: rgba(255, 255, 255, 0.98);
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .dark .floating-collapse {
    background-color: rgba(30, 30, 30, 0.98);
  }

  .floating-collapse.mobile-open {
    transform: translateX(0);
  }

  .floating-collapse.mobile-closed {
    transform: translateX(-100%);
  }

  /* Mobile overlay */
  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 10000 !important;
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .filters-wrapper {
    padding: 12px;
  }

  .filters-container {
    gap: 12px;
  }

  #map {
    height: calc(100vh - 60px);
    min-height: 400px;
  }

  .project-details {
    padding: 15px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .filter-control-button {
    width: 27px;
    height: 27px;
  }

  .floating-collapse {
    width: 260px;
    max-width: 90vw;
    padding: 12px;
  }

  #map {
    height: calc(100vh - 50px);
  }

  .project-details {
    padding: 10px;
  }
}
</style>

<style>
.el-loading-mask {
  opacity: 0.7;
}

.el-loading-text {
  color: green;
}

.element-loading-text {
  color: green;
}

/* Global styles for select dropdowns to appear on top of filter panel + map */
.el-select-dropdown,
.el-popper.is-pure,
.el-select__popper,
.filter-select-dropdown {
  z-index: 25000 !important;
}

.filter-select-dropdown.el-popper {
  z-index: 25000 !important;
}

.filter-control-button {
  width: 29px;
  height: 29px;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #333333 !important;
  padding: 0 !important;
}

.filter-control-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.filter-control-button.active {
  background-color: #409eff;
  color: white !important;
}

.dark .filter-control-button {
  color: #333333 !important;
}

.dark .filter-control-button.active {
  color: white !important;
}

/* ── AI loading overlay ──────────────────────────────────────────────────────── */
.ai-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.ai-loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 48px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  max-width: 500px;
  text-align: center;
}

.ai-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: ai-spin linear infinite;
}
.ai-ring-1 { width: 80px; height: 80px; border-top-color: #3b82f6; animation-duration: 1.2s; }
.ai-ring-2 { width: 60px; height: 60px; border-top-color: #60a5fa; border-right-color: #60a5fa; animation-duration: 1.8s; animation-direction: reverse; }
.ai-ring-3 { width: 40px; height: 40px; border-top-color: #93c5fd; animation-duration: 2.4s; }

@keyframes ai-spin { to { transform: rotate(360deg); } }

.ai-center-icon { color: #93c5fd !important; position: relative; z-index: 1; }

.ai-loading-title {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  letter-spacing: 0.02em;
}

.ai-loading-wait {
  font-size: 12px;
  color: #64748b;
  margin: -8px 0 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.ai-loading-msg {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  min-height: 36px;
  line-height: 1.6;
  max-width: 320px;
}

.ai-dots { display: flex; gap: 6px; margin-top: 4px; }
.ai-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.3);
  transition: background 0.3s, transform 0.3s;
}
.ai-dot.active { background: #3b82f6; transform: scale(1.3); }

.ai-overlay-fade-enter-active { transition: opacity 0.4s ease; }
.ai-overlay-fade-leave-active { transition: opacity 0.6s ease; }
.ai-overlay-fade-enter-from, .ai-overlay-fade-leave-to { opacity: 0; }

.ai-msg-fade-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.ai-msg-fade-leave-active { transition: opacity 0.2s ease; }
.ai-msg-fade-enter-from { opacity: 0; transform: translateY(6px); }
.ai-msg-fade-leave-to   { opacity: 0; }
</style>
