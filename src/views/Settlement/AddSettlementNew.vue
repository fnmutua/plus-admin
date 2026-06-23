<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, nextTick, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'


declare global {
  interface Window {
    google: any
  }
}
import {
  ElButton,
  ElSelect,
  ElOption,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElDrawer,
  ElMessage,
  ElMessageBox,
  ElUpload,
  ElDialog,
  ElRow,
  ElCol,
  ElDivider,
  ElAlert,
  ElCheckbox,
  ElCheckboxGroup,
  ElRadio,
  ElRadioGroup,
  ElPopover,
  ElCollapse,
  ElCollapseItem,
  ElIcon
} from 'element-plus'
import { ArrowLeft, Check, Plus, Delete, UploadFilled, Back, Edit,ArrowRight, QuestionFilled } from '@element-plus/icons-vue'
import * as turf from '@turf/turf'
import { getOneGeo, getSettlementListByCounty, getOneSettlement } from '@/api/settlements'
import { fetchOvertureBuildings, createOvertureStructures } from '@/api/settlements-overture'
import { getVulnerabilityMatrix, computeVulnerabilityScore } from '@/api/settings'
import { CreateRecord, updateOneRecord, duplicatePreCheck } from '@/api/settlements'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { useSettlementLocation } from '@/composables/useSettlementLocation'
import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
import { useGoogleMapsPolygonDraw } from '@/composables/useGoogleMapsPolygonDraw'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import type { FormInstance } from 'element-plus'
import shortid from 'shortid'
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import proj4 from 'proj4'
import {
  booleanToYesNo,
  resolvePlanningSurveyFromRecord,
  prepareSettlementFormForApi,
  surveyStatusOptionsForPlanning,
  validateSettlementAttributes,
} from '@/utils/validateSettlementAttributes'
import { normalizeLocationId } from '@/utils/settlementEditNavigation'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const isMobile = computed(() => appStore.getMobile)

const router = useRouter()
const route = useRoute()

const LOCATION_FETCH_TIMEOUT_MS = 15000

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out — please retry`)), ms)
    })
  ])

const {
  countyOptions,
  countyRefList,
  subcountyOptions,
  countiesLoading,
  countiesError,
  wardsLoading,
  wardsError,
  loadCounties,
  loadSubcounties,
  loadWardsForCounty,
  peekWardsCache,
  loadSubcountiesForCounty
} = useSettlementLocation()

let countyWardLoadSeq = 0
let wardGeoLoadSeq = 0

const abortWardGeoLoad = () => {
  wardGeoLoadSeq++
  wardGeoLoading.value = false
}

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

// Check if user should be restricted to their county
const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

// Filtered county options based on user's location restriction
const filteredCountyOptions = computed(() => {
  if (!isCountyRestricted.value || !userCountyId.value) {
    return countyOptions.value || []
  }
  return (countyOptions.value || []).filter((county: any) => 
    county.value === userCountyId.value
  )
})

// Step management
const currentStep = ref(route.query.id ? 1 : 0)

// Step 1: Location Selection - County and Ward
const selectedCounty = ref<any>(null)
const selectedWard = ref<any>(null)
const filteredWards = ref<any[]>([])
const wardGeoLoading = ref(false)
const wardAvgHouseholdSize = ref<number | null>(null)
const checkingGeometry = ref(false)
const isSaving = ref(false)

// Step 2: Map
const map = ref<any>(null)
const wardPolygon = ref<any[]>([])
const settlementPolygon = ref<any>(null)
const settlementMarker = ref<any>(null)
const wardGeo = ref<any>(null)
const settlementGeometry = ref<any>(null)
const mapContainer = ref<HTMLDivElement | null>(null)
const drawnPolygons = ref<any[]>([])
const polygonDraw = useGoogleMapsPolygonDraw()
const drawPointCount = polygonDraw.pointCount
const isEditMode = ref(!!route.query.id)
const editingSettlementId = ref<number | null>(null)
const isDrawingMode = ref(false)
const flyMarker = ref<any>(null)
const mapLoading = ref(false)
const mapError = ref<string | null>(null)
const drawReady = ref(false)

// Neighboring settlements
const neighboringSettlements = ref<any[]>([])
const neighboringSettlementLabels = ref<any[]>([])
const currentZoom = ref(8)
const MIN_ZOOM_FOR_LABELS = 16 // Hide labels when zoom is below this level

// Step 3: Form Drawer
const drawerVisible = ref(false)
const formRef = ref<FormInstance>()
const flyDialogVisible = ref(false)
const flyToCoordsInput = ref('')
const settlementForm = reactive({
  name: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  settlement_type: '',
  population: null as number | null,
  pop_male: null as number | null,
  pop_female: null as number | null,
  area: '',
  description: null,
  geom: null,
  id: '',
  dist_trunk: null,
  dist_town: null,
  parcel_no: null,
  parcel_owner: null,
  rim_no: null,
  isApproved: 'Pending',
  isActive: true,
  code: '',
  surveyed: null,
  land_status: null,
  planning_status: null as string | null,
  survey_status: null as string | null,
  parcel_owner_type: null,
  pop_density: null,
  landuse: [],
  near_river: null,
  on_wayleave: null,
  on_road_reserve: null,
  structure_types: [],
  development: [],
  typical_building_materials: [],
  avg_dist_between: null,
  electricity_availability: null,
  piped_water_availability: null,
  encumbrance: null,
  num_households: null,
  avg_household_size: null,
  median_household_income: null,
  plot_ownership_ratio: null,
  plot_tenant_ratio: null,
  avg_rent: null,
  main_env_hazards: null,
  general_location: null,
  density_typology: null,
  profiling_status: 'NOT_PROFILED',
  is_qualified: true,
  comments: null,
  climate_region: null,
  soil_type: null,
  land_cover: null,
  altitude_range: null,
  proximity_to_river: null,
  proximity_to_flood_plain: null,
  vulnerability_total_score: null,
  vulnerability_rating: null
})

// Which section of the drawer form is expanded
const activeFormSection = ref<'basic' | 'location' | 'parcel' | 'physical' | 'socio' | 'vulnerability'>('basic')

type SectionKey = 'basic' | 'location' | 'parcel' | 'physical' | 'socio' | 'vulnerability'

const sectionFields: Record<SectionKey, (keyof typeof settlementForm)[]> = {
  basic: ['name', 'settlement_type', 'area', 'population', 'pop_male', 'pop_female', 'description'],
  location: ['county_id', 'ward_id'],
  parcel: ['parcel_no', 'parcel_owner', 'parcel_owner_type', 'rim_no', 'planning_status', 'survey_status'],
  physical: [
    'landuse',
    'density_typology',
    'on_wayleave',
    'on_road_reserve',
    'structure_types',
    'development',
    'typical_building_materials',
    'avg_dist_between',
    'dist_town',
    'dist_trunk',
    'electricity_availability',
    'piped_water_availability'
  ],
  socio: [
    'encumbrance',
    'num_households',
    'avg_household_size',
    'median_household_income',
    'plot_ownership_ratio',
    'plot_tenant_ratio',
    'avg_rent',
    'main_env_hazards',
    'general_location'
  ],
  vulnerability: [
    'climate_region',
    'soil_type',
    'land_cover',
    'altitude_range',
    'proximity_to_river',
    'proximity_to_flood_plain',
    'profiling_status',
    'is_qualified',
    'comments'
  ]
}

const sectionLabels: Record<SectionKey, string> = {
  basic: 'Basic information',
  location: 'Location',
  parcel: 'Parcel information',
  physical: 'Physical characteristics',
  socio: 'Socio-economic profile',
  vulnerability: 'Vulnerability & profiling'
}

const getSectionCompletion = (section: SectionKey): 'none' | 'partial' | 'full' => {
  const fields = sectionFields[section]
  const total = fields.length
  if (!total) return 'none'
  let filled = 0
  fields.forEach((key) => {
    const value = settlementForm[key]
    if (Array.isArray(value)) {
      if (value.length > 0) filled++
    } else if (value !== null && value !== '' && value !== undefined) {
      filled++
    }
  })
  if (filled === 0) return 'none'
  if (filled === total) return 'full'
  return 'partial'
}

const getSectionStatusClass = (section: SectionKey) => {
  const status = getSectionCompletion(section)
  if (status === 'full') return 'section-header--full'
  if (status === 'partial') return 'section-header--partial'
  return 'section-header--none'
}

const formRules = computed(() => {
  const core = {
    name: [{ required: true, message: 'Settlement name is required', trigger: 'blur' }],
    county_id: [{ required: true, message: 'County is required', trigger: 'blur' }],
    ward_id: [{ required: true, message: 'Ward is required', trigger: 'blur' }],
    settlement_type: [{ required: true, message: 'Settlement type is required', trigger: 'change' }],
  }
  if (isEditMode.value) {
    return core
  }
  return {
    ...core,
    climate_region: [{ required: true, message: 'Region (climate) is required', trigger: 'change' }],
    soil_type: [{ required: true, message: 'Soil type is required', trigger: 'change' }],
    land_cover: [{ required: true, message: 'Land cover is required', trigger: 'change' }],
    altitude_range: [{ required: true, message: 'Altitude range is required', trigger: 'change' }],
    proximity_to_river: [{ required: true, message: 'Proximity to river is required', trigger: 'change' }],
    proximity_to_flood_plain: [{ required: true, message: 'Proximity to flood plain is required', trigger: 'change' }],
  }
})

const validationFieldSection: Partial<Record<string, SectionKey>> = {
  name: 'basic',
  settlement_type: 'basic',
  county_id: 'location',
  ward_id: 'location',
  climate_region: 'vulnerability',
  soil_type: 'vulnerability',
  land_cover: 'vulnerability',
  altitude_range: 'vulnerability',
  proximity_to_river: 'vulnerability',
  proximity_to_flood_plain: 'vulnerability',
}

const focusFirstValidationError = (fields: Record<string, unknown> | undefined) => {
  if (!fields) return
  const firstKey = Object.keys(fields)[0]
  const section = firstKey ? validationFieldSection[firstKey] : undefined
  if (section) {
    activeFormSection.value = section
  }
}

// Settlement type options
const settlementTypeOptions = [
  { label: 'Slum', value: 'slum' },
  { label: 'Informal Settlement', value: 'Informal Settlement' }
]

// Yes/No options
const yesNoOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
]

const yesNoUnknownOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Unknown', value: 'Unknown' }
]

const parcelOwnershipOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Community', value: 'community' }
]

// Land status — one choice per axis (planning + survey)
const planningStatusOptions = [
  { label: 'Planned', value: 'Planned' },
  { label: 'Unplanned', value: 'Unplanned' }
]

// Landuse options matching SQL normalized values (supports multiple selection)
const landuseOptions = [
  { label: 'Mixed', value: 'Mixed' },
  { label: 'Residential', value: 'Residential' },
  { label: 'Commercial', value: 'Commercial' },
  { label: 'Industrial', value: 'Industrial' },
  { label: 'Educational', value: 'Educational' },
  { label: 'Public Purpose', value: 'Public Purpose' },
  { label: 'Public Utility', value: 'Public Utility' },
  { label: 'Transportation', value: 'Transportation' },
  { label: 'Agricultural', value: 'Agricultural' },
  { label: 'Undeveloped', value: 'Undeveloped' },
  { label: 'Conservation', value: 'Conservation' },
  { label: 'Other', value: 'Other' }
]

const parcelOwnerTypeOptions = [
  { label: 'Private', value: 'Private' },
  { label: 'Public', value: 'Public' },
  { label: 'Community', value: 'Community' },
  { label: 'Communal', value: 'Communal' },
  { label: 'Mixed', value: 'Mixed' },
  { label: 'Unknown', value: 'Unknown' }
]

// Density-based slum typology (National Slum Upgrading and Prevention Strategy 2024-2034).
// Categorisation is informed by the built-up ratio (built-up area / total settlement area).
const densityTypologyOptions = [
  { label: 'Low Density', value: 'LOW DENSITY' },
  { label: 'Medium Density', value: 'MEDIUM DENSITY' },
  { label: 'High Density', value: 'HIGH DENSITY' }
]

// Vulnerability assessment options (from vulnerability_matrix, fallback from KISIP Tool A)
const vulnerabilityOptions = ref<Record<string, { label: string; value: string }[]>>({
  climate_region: [],
  soil_type: [],
  land_cover: [],
  altitude_range: [],
  proximity_to_river: [],
  proximity_to_flood_plain: []
})

const computedScore = ref<{ total_score: number | null; rating: string | null } | null>(null)

/** Rating tag type: red (HIGH), amber (MEDIUM), green (LOW) - matches Vulnerability Settings */
const vulnerabilityRatingType = computed(() => {
  const r = computedScore.value?.rating ?? settlementForm.vulnerability_rating
  return r === 'HIGH' ? 'danger' : r === 'MEDIUM' ? 'warning' : 'success'
})

const VULNERABILITY_FALLBACK: Record<string, string[]> = {
  climate_region: ['Af>Tropical', 'Am> Tropical', 'Aw> Tropical', 'BSh> Arid', 'BSk> Arid', 'BWh> Arid', 'Cfa> Temperate', 'Cfb> Temperate', 'Csb> Temperate', 'Cwa> Temperate', 'Cwb> Temperate'],
  soil_type: ['Clay', 'Sand', 'Loam', 'Rock'],
  land_cover: ['Bare Land', 'Natural Terrestrial Vegetation', 'Agricultural Land', 'Water-bodies'],
  altitude_range: ['<750', 'Between 751-1800', '>1800'],
  proximity_to_river: ['<2000', 'Between 2001-5999', '>6000'],
  proximity_to_flood_plain: ['<4500', 'Between 4501-6000', '>6000']
}

const structureTypesOptions = [
  { label: 'Permanent', value: 'Permanent' },
  { label: 'Semi-permanent', value: 'Semi-permanent' },
  { label: 'Temporary', value: 'Temporary' }
]

const levelDevtOptions = [
  { label: 'Single Storey', value: 'singleStorey' },
  { label: 'Multi Storey', value: 'multiStorey' }
]

const buildingMaterialsOptions = [
  { label: 'Stone/Blocks', value: 'Stone/Blocks' },
  { label: 'Mud', value: 'Mud' },
  { label: 'Timber/Wood', value: 'Timber/Wood' },
  { label: 'Iron sheets', value: 'Iron sheets' },
  { label: 'Earth', value: 'Earth' },
  { label: 'Cement', value: 'Cement' },
  { label: 'Tiles', value: 'Tiles' },
  { label: 'Grass', value: 'Grass' },
  { label: 'Plastic/Polythene', value: 'Plastic/Polythene' },
  { label: 'Concrete/Slab', value: 'Concrete/Slab' },
  { label: 'Terrazzo', value: 'Terrazzo' },
  { label: 'Other', value: 'Other' }
]

// Enforce planning/survey rules; sync legacy land_status + surveyed
watch(
  [() => settlementForm.planning_status, () => settlementForm.survey_status],
  () => {
    if (settlementForm.planning_status === 'Unplanned') {
      settlementForm.survey_status = 'Unsurveyed'
    }
    const planning = settlementForm.planning_status
    const survey = settlementForm.survey_status
    if (!planning && !survey) {
      settlementForm.land_status = null
      settlementForm.surveyed = null
      return
    }
    if (planning && survey) {
      settlementForm.land_status = `${planning}, ${survey}`
      settlementForm.surveyed = survey === 'Surveyed' ? 'Yes' : 'No'
    } else {
      settlementForm.land_status = null
      settlementForm.surveyed = null
    }
  }
)

const availableSurveyStatusOptions = computed(() =>
  surveyStatusOptionsForPlanning(settlementForm.planning_status)
)

// Computed subcounty display name (inferred from ward)
const subcountyDisplayName = computed(() => {
  if (!settlementForm.subcounty_id) return ''
  const sc = (subcountyOptions.value || []).find((s: any) => s.value === settlementForm.subcounty_id)
  return sc ? sc.label : `Subcounty ID: ${settlementForm.subcounty_id}`
})

// Handle county change in the drawer form (doesn't navigate to map)
const handleDrawerCountyChange = async (countyId: any) => {
  // Clear ward and subcounty
  settlementForm.ward_id = ''
  settlementForm.subcounty_id = ''
  selectedWard.value = null
  
  if (!countyId) {
    settlementForm.county_id = ''
    filteredWards.value = []
    return
  }
  
  settlementForm.county_id = countyId
  selectedCounty.value = countyId
  
  // Load wards for this county (keep step on drawer-only county edits)
  await handleCountyChange(countyId, { resetStep: false })
}

// Handle ward change in the drawer form (infers subcounty, doesn't navigate)
const handleDrawerWardChange = async (wardId: any) => {
  if (!wardId) {
    settlementForm.ward_id = ''
    settlementForm.subcounty_id = ''
    wardAvgHouseholdSize.value = null
    return
  }

  settlementForm.ward_id = wardId
  selectedWard.value = wardId

  const ward = filteredWards.value.find((w: any) => String(w.value) === String(wardId))
  applyWardSubcountyToForm(ward)
  loadWardAvgHouseholdSizeDeferred(wardId)
}

const applyWardSubcountyToForm = (ward: any) => {
  if (ward?.subcounty_id) {
    settlementForm.subcounty_id = ward.subcounty_id
    return
  }
  const subcounty = (subcountyOptions.value || []).find(
    (sc: any) => String(sc.county_id) === String(selectedCounty.value)
  )
  if (subcounty) {
    settlementForm.subcounty_id = subcounty.value
  }
}

const loadWardAvgHouseholdSizeDeferred = (wardId: any) => {
  void fetchWardAvgHouseholdSize(wardId).then((avg) => {
    if (String(settlementForm.ward_id) === String(wardId) || String(selectedWard.value) === String(wardId)) {
      wardAvgHouseholdSize.value = avg
      if (avg != null && settlementForm.avg_household_size == null) {
        settlementForm.avg_household_size = avg
      }
    }
  })
}

const retryLoadCounties = async () => {
  try {
    await loadCounties(true)
    ElMessage.success('Counties loaded')
  } catch {
    ElMessage.error(countiesError.value || 'Failed to load counties')
  }
}

const retryLoadWards = async () => {
  if (!selectedCounty.value) return
  const loadSeq = ++countyWardLoadSeq
  try {
    const wards = await loadWardsForCounty(selectedCounty.value, true)
    if (loadSeq !== countyWardLoadSeq) return
    filteredWards.value = wards
    if (!wards.length) {
      ElMessage.warning('No wards found for this county')
    }
  } catch {
    if (loadSeq !== countyWardLoadSeq) return
    ElMessage.error(wardsError.value || 'Failed to load wards')
  }
}

const retryMapLoad = async () => {
  drawReady.value = false
  await initializeMap()
}

const onSettlementPolygonComplete = (polygon: any) => {
  if (!isEditMode.value && wardPolygon.value && wardPolygon.value.length > 0) {
    const isWithin = checkPolygonWithinWard(polygon)
    if (!isWithin) {
      polygon.setMap(null)
      ElMessage.error('Settlement must be drawn within the ward boundary!')
      return
    }
  }

  drawnPolygons.value.forEach(p => p.setMap(null))
  drawnPolygons.value = []
  drawnPolygons.value.push(polygon)
  polygon.setOptions({ zIndex: 1000000 })
  polygon.setEditable(true)

  const paths = polygon.getPath()
  const coordinates: number[][] = []
  paths.forEach((latLng: any) => {
    coordinates.push([latLng.lng(), latLng.lat()])
  })

  if (coordinates.length > 0) {
    const firstCoord = coordinates[0]
    if (coordinates[coordinates.length - 1][0] !== firstCoord[0] ||
        coordinates[coordinates.length - 1][1] !== firstCoord[1]) {
      coordinates.push([firstCoord[0], firstCoord[1]])
    }
  }

  const geom = {
    type: 'Polygon',
    coordinates: [coordinates]
  }

  settlementGeometry.value = geom
  settlementForm.geom = geom

  const areaHectares = calculateAreaInHectares(geom)
  if (areaHectares !== null) {
    settlementForm.area = areaHectares
  }

  polygon.getPath().addListener('set_at', () => updatePolygonGeometry(polygon))
  polygon.getPath().addListener('insert_at', () => updatePolygonGeometry(polygon))
  polygon.getPath().addListener('remove_at', () => updatePolygonGeometry(polygon))
  polygon.addListener('click', () => {
    drawerVisible.value = true
  })

  ElMessage.success('Settlement boundary drawn successfully!')
  void onSettlementGeometryReady(geom)
  scheduleNeighboringSettlementsRefresh()

  stopPolygonDrawing()

  nextTick(() => {
    if (isMobile.value) {
      setTimeout(() => {
        drawerVisible.value = true
      }, 300)
    } else {
      drawerVisible.value = true
    }
  })
}

const enableDrawTools = () => {
  if (!map.value || !window.google?.maps) return false
  drawReady.value = true
  return true
}

const startPolygonDrawing = () => {
  if (!map.value || !drawReady.value) return false
  const started = polygonDraw.startDrawing(map.value, onSettlementPolygonComplete)
  if (started) isDrawingMode.value = true
  return started
}

const stopPolygonDrawing = () => {
  polygonDraw.stopDrawing()
  isDrawingMode.value = false
}

const finishPolygonDrawing = () => {
  if (!polygonDraw.finishDrawing()) {
    ElMessage.warning('Add at least 3 points on the map, then finish the polygon')
  }
}

const waitForMapIdle = (mapInstance: any, maxMs = 6000) =>
  new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const timeoutId = setTimeout(finish, maxMs)
    window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
      clearTimeout(timeoutId)
      finish()
    })
    requestAnimationFrame(() => {
      window.google.maps.event.trigger(mapInstance, 'resize')
    })
  })

const destroyMapInstance = () => {
  stopPolygonDrawing()
  clearOvertureBuildingLayers()
  wardPolygon.value.forEach(p => { if (p) p.setMap(null) })
  wardPolygon.value = []
  drawnPolygons.value.forEach(p => { if (p) p.setMap(null) })
  drawnPolygons.value = []
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
  }
  if (settlementMarker.value) {
    settlementMarker.value.setMap(null)
    settlementMarker.value = null
  }
  if (map.value) {
    window.google?.maps?.event?.clearInstanceListeners(map.value)
    map.value = null
  }
  drawReady.value = false
}

// Restore county, ward, subcounty on edit load without clearing drawer fields.
const applyLocationFromRecord = async (
  countyId: unknown,
  wardId?: unknown,
  subcountyId?: unknown
) => {
  const county = normalizeLocationId(countyId)
  if (!county) return

  const ward = normalizeLocationId(wardId)
  const subcounty = normalizeLocationId(subcountyId)

  selectedCounty.value = county
  settlementForm.county_id = county

  if (subcounty) {
    settlementForm.subcounty_id = subcounty
  }

  const loadSeq = ++countyWardLoadSeq
  wardsError.value = null

  const cachedWards = peekWardsCache(county)
  filteredWards.value = cachedWards.length ? cachedWards : []

  void loadSubcountiesForCounty(county)

  try {
    const wards = await loadWardsForCounty(county)
    if (loadSeq !== countyWardLoadSeq) return
    filteredWards.value = wards
  } catch (error) {
    if (loadSeq !== countyWardLoadSeq) return
    console.error('Error fetching wards:', error)
    if (!filteredWards.value.length) {
      ElMessage.error(wardsError.value || 'Failed to load wards for this county')
    }
  }

  if (ward) {
    settlementForm.ward_id = ward
    selectedWard.value = ward
    const wardRow = filteredWards.value.find((w: any) => String(w.value) === String(ward))
    if (wardRow) {
      applyWardSubcountyToForm(wardRow)
    } else if (subcounty) {
      settlementForm.subcounty_id = subcounty
    }
  }
}

// Handle county selection
const handleCountyChange = async (countyId: any, options?: { resetStep?: boolean }) => {
  const loadSeq = ++countyWardLoadSeq
  abortWardGeoLoad()

  selectedWard.value = null
  settlementForm.ward_id = ''
  settlementForm.subcounty_id = ''
  filteredWards.value = []
  wardsError.value = null
  wardGeo.value = null

  if (options?.resetStep !== false && currentStep.value !== 0) {
    currentStep.value = 0
    mapLoading.value = false
    mapError.value = null
    drawReady.value = false
  }

  if (!countyId) return

  // Enforce county restriction
  if (isCountyRestricted.value && userCountyId.value && String(countyId) !== String(userCountyId.value)) {
    ElMessage.error('You can only select settlements in your assigned county')
    selectedCounty.value = userCountyId.value
    return
  }

  // Show cached wards immediately when switching back to a county
  const cachedWards = peekWardsCache(countyId)
  if (cachedWards.length) {
    filteredWards.value = cachedWards
  }

  void loadGoogleMapsApi().catch(() => {})
  void loadSubcountiesForCounty(countyId)

  try {
    const wards = await loadWardsForCounty(countyId)
    if (loadSeq !== countyWardLoadSeq) return

    filteredWards.value = wards
    if (wards.length === 0) {
      ElMessage.warning('No wards found for this county')
    }
  } catch (error) {
    if (loadSeq !== countyWardLoadSeq) return
    console.error('Error fetching wards:', error)
    if (!filteredWards.value.length) {
      ElMessage.error(wardsError.value || 'Failed to load wards for this county')
    }
  }
}

// Handle ward selection and proceed to map
const handleWardChange = async (wardId: any) => {
  if (!wardId) {
    abortWardGeoLoad()
    wardGeo.value = null
    settlementForm.ward_id = ''
    return
  }

  const loadSeq = ++wardGeoLoadSeq
  wardGeoLoading.value = true
  let readyForMap = false

  try {
    const res = await withTimeout(
      getOneGeo({ model: 'ward', id: wardId, silent: true }),
      LOCATION_FETCH_TIMEOUT_MS,
      'Ward boundary'
    )

    if (loadSeq !== wardGeoLoadSeq) return

    const ward = filteredWards.value.find((w: any) => String(w.value) === String(wardId))
    if (!ward) {
      selectedWard.value = null
      ElMessage.warning('Selected ward is not available for this county')
      return
    }

    if (res.data[0]?.json_build_object?.features) {
      const feature = res.data[0].json_build_object.features[0]
      const geometryType = feature.geometry?.type

      if (geometryType === 'Point' || geometryType === 'MultiPoint') {
        ElMessage.error('This ward has point geometry. Please select a ward with boundary geometry (Polygon).')
        selectedWard.value = null
        return
      }

      wardGeo.value = res.data[0].json_build_object
      settlementForm.ward_id = wardId
      settlementForm.county_id = selectedCounty.value
      applyWardSubcountyToForm(ward)
      loadWardAvgHouseholdSizeDeferred(wardId)
      readyForMap = true
    } else {
      ElMessage.error('Ward has no boundary geometry')
      selectedWard.value = null
    }
  } catch (error) {
    if (loadSeq !== wardGeoLoadSeq) return
    console.error('Error loading ward geometry:', error)
    ElMessage.error(error?.message || 'Failed to load ward boundary')
    selectedWard.value = null
    wardGeo.value = null
  } finally {
    if (loadSeq === wardGeoLoadSeq) {
      wardGeoLoading.value = false
    }
  }

  if (!readyForMap || loadSeq !== wardGeoLoadSeq) return

  currentStep.value = 1
  await nextTick()

  if (loadSeq !== wardGeoLoadSeq) {
    currentStep.value = 0
    return
  }

  await initializeMap(() => loadSeq !== wardGeoLoadSeq)

  if (loadSeq !== wardGeoLoadSeq) {
    currentStep.value = 0
  }
}

// Initialize Google Maps with ward boundary (for new) or settlement boundary (for edit)
const initializeMap = async (isStale = () => false) => {
  if (isStale()) return

  mapLoading.value = true
  mapError.value = null
  drawReady.value = false
  destroyMapInstance()

  await nextTick()
  await nextTick()

  if (isStale()) return
  if (!mapContainer.value) {
    mapError.value = 'Map container is not ready'
    return
  }

  try {
    await withTimeout(loadGoogleMapsApi(), LOCATION_FETCH_TIMEOUT_MS, 'Google Maps')
    if (isStale()) return

    if (!window.google?.maps) {
      throw new Error('Google Maps API not loaded properly')
    }

    let center = { lat: 1.137451, lng: 37.137343 }
    let zoom = 8

    if (isEditMode.value && settlementGeometry.value) {
      if (settlementGeometry.value.type === 'Point') {
        center = {
          lat: settlementGeometry.value.coordinates[1],
          lng: settlementGeometry.value.coordinates[0]
        }
        zoom = 15
      } else {
        const bounds = turf.bbox(settlementGeometry.value)
        center = {
          lat: (bounds[1] + bounds[3]) / 2,
          lng: (bounds[0] + bounds[2]) / 2
        }
        zoom = 15
      }
    } else if (wardGeo.value?.features?.length) {
      const bounds = turf.bbox(wardGeo.value)
      center = {
        lat: (bounds[1] + bounds[3]) / 2,
        lng: (bounds[0] + bounds[2]) / 2
      }
      zoom = 13
    }

    map.value = new window.google.maps.Map(mapContainer.value, {
      center,
      zoom,
      mapTypeId: window.google.maps.MapTypeId.SATELLITE,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      disableDoubleClickZoom: true
    })

    window.google.maps.event.addListener(map.value, 'maptypeid_changed', () => {
      setTimeout(() => {
        if (settlementPolygon.value) settlementPolygon.value.setOptions({ zIndex: 1000000 })
        if (settlementMarker.value) settlementMarker.value.setOptions({ zIndex: 2000 })
        wardPolygon.value.forEach(poly => poly?.setOptions({ zIndex: 1000000 }))
        drawnPolygons.value.forEach(poly => poly?.setOptions({ zIndex: 1000000 }))
      }, 150)
    })

    window.google.maps.event.addListener(map.value, 'zoom_changed', () => {
      if (map.value) {
        currentZoom.value = map.value.getZoom() || 8
        updateNeighborLabelVisibility()
      }
    })

    await waitForMapIdle(map.value)
    if (isStale()) return

    if (!enableDrawTools()) {
      throw new Error('Map failed to initialize drawing tools')
    }

    if (isEditMode.value && settlementGeometry.value) {
      if (wardGeo.value) {
        loadWardBoundary()
      }
      loadSettlementBoundary()
    } else if (wardGeo.value) {
      loadWardBoundary()
    }

    currentZoom.value = map.value.getZoom() || 8

    requestAnimationFrame(() => {
      if (map.value && window.google?.maps) {
        window.google.maps.event.trigger(map.value, 'resize')
      }
    })
  } catch (error: any) {
    if (isStale()) return
    console.error('Error initializing Google Maps:', error)
    mapError.value = error?.message || 'Failed to load map'
    drawReady.value = false
    ElMessage.error(mapError.value)
  } finally {
    mapLoading.value = false
  }
}


const loadWardBoundary = () => {
  if (!map.value || !wardGeo.value) return

  try {
    const features = wardGeo.value.features
    if (features && features.length > 0) {
      const feature = features[0]
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        // Clear existing ward polygons
        wardPolygon.value.forEach(p => {
          if (p) p.setMap(null)
        })
        wardPolygon.value = []

        const bounds = new window.google.maps.LatLngBounds()

        if (feature.geometry.type === 'Polygon') {
          // Single Polygon - create one polygon
          const paths = feature.geometry.coordinates[0].map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          }))

          const polygon = new window.google.maps.Polygon({
            paths: paths,
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 3,
            fillColor: '#000000',
            fillOpacity: 0,
            map: map.value,
            clickable: false,
            draggable: false,
            zIndex: 1000000
          })

          wardPolygon.value.push(polygon)

          // Add to bounds
          paths.forEach((path: any) => {
            bounds.extend(path)
          })
        } else if (feature.geometry.type === 'MultiPolygon') {
          // MultiPolygon - create a polygon for each polygon in the MultiPolygon
          feature.geometry.coordinates.forEach((polygonCoords: number[][][]) => {
            // Each polygon in MultiPolygon has its own coordinates array
            // The first array is the outer ring
            const paths = polygonCoords[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }))

            const polygon = new window.google.maps.Polygon({
              paths: paths,
              strokeColor: '#000000',
              strokeOpacity: 1.0,
              strokeWeight: 3,
              fillColor: '#000000',
              fillOpacity: 0,
              map: map.value,
              clickable: false,
              draggable: false,
              zIndex: 1000000
            })

            wardPolygon.value.push(polygon)

            // Add to bounds
            paths.forEach((path: any) => {
              bounds.extend(path)
            })
          })
        }

        // Fit map to all ward bounds
        if (!bounds.isEmpty()) {
          map.value.fitBounds(bounds)
        }
        
        // Load neighboring settlements after ward boundary is loaded (non-blocking)
        scheduleNeighboringSettlementsRefresh(800)
      }
    }
  } catch (error) {
    console.error('Error loading ward boundary:', error)
  }
}

// Fetch neighboring settlements for the ward - simplified: just get all settlements in the ward
const getNeighborWardId = () => selectedWard.value || settlementForm.ward_id || null

const scheduleNeighboringSettlementsRefresh = (delayMs = 400) => {
  window.setTimeout(async () => {
    if (!map.value || !window.google?.maps) return
    try {
      await waitForMapIdle(map.value, 5000)
    } catch {
      // still attempt fetch if idle wait fails
    }
    await fetchNeighboringSettlementsForWard(true)
  }, delayMs)
}

const fetchNeighboringSettlementsForWard = async (silent = false) => {
  const wardId = getNeighborWardId()
  if (!wardId || !map.value || !window.google?.maps) {
    if (!silent) {
      console.log('⚠️ No ward selected or map not ready for neighboring settlements')
    }
    return 0
  }

  try {
    if (!silent) {
      console.log('🔄 Fetching settlements for ward...')
    }
    
    // Get all settlements in this ward using filters
    const formData = {
      limit: 1000, // Get all settlements in the ward
      page: 1,
      curUser: 1,
      model: 'settlement',
      filters: ['ward_id'],
      filterValues: [[wardId]],
      returnAll: true // Get all results, not just one page
    }
    
    const res = await getSettlementListByCounty(formData)
    
    const settlements = res.data || []
    
    if (!Array.isArray(settlements) || settlements.length === 0) {
      if (!silent) {
        console.log('ℹ️ No settlements found in this ward')
      }
      return 0
    }
    
    // Get geometries for all settlements (exclude the one currently being edited)
    const settlementIds = settlements
      .map((s: any) => s.id)
      .filter((id: any) => {
        if (id == null) return false
        if (editingSettlementId.value != null && Number(id) === Number(editingSettlementId.value)) {
          return false
        }
        return true
      })
    
    if (settlementIds.length === 0) {
      if (!silent) {
        console.log('ℹ️ No valid settlement IDs found')
      }
      return 0
    }
    
    // Fetch geometries for these settlements
    const geoPromises = settlementIds.map(async (id: number) => {
      try {
        const geoRes = await getOneGeo({
          model: 'settlement',
          id: String(id)
        })
        if (geoRes.data[0]?.json_build_object?.features?.[0]) {
          const feature = geoRes.data[0].json_build_object.features[0]
          return {
            id: id,
            name: settlements.find((s: any) => s.id === id)?.name || 'Unnamed',
            geom: feature.geometry
          }
        }
        return null
      } catch (error) {
        console.warn(`Error fetching geometry for settlement ${id}:`, error)
        return null
      }
    })
    
    const settlementsWithGeo = (await Promise.all(geoPromises)).filter(s => s !== null)
    
    if (settlementsWithGeo.length === 0) {
      if (!silent) {
        console.log('ℹ️ No settlements with geometry found')
      }
      return 0
    }

    // Clear existing neighboring settlements
    neighboringSettlements.value.forEach(polyline => {
      if (polyline) polyline.setMap(null)
    })
    neighboringSettlements.value = []
    
    neighboringSettlementLabels.value.forEach(marker => {
      if (marker) marker.setMap(null)
    })
    neighboringSettlementLabels.value = []

    for (const settlement of settlementsWithGeo) {
      // Check if settlement has geometry
      if (!settlement.geom) {
        continue
      }

      // Check if geometry is Polygon or MultiPolygon
      const geomType = settlement.geom.type
      if (geomType !== 'Polygon' && geomType !== 'MultiPolygon') {
        continue
      }

      // Process polygon geometry
      let coordinates = settlement.geom.coordinates
      if (geomType === 'MultiPolygon') {
        coordinates = coordinates.flat()
      }

      coordinates.forEach((polygonCoordinates: number[][]) => {
        const paths = polygonCoordinates.map((coord: number[]) => {
          const [lng, lat] = coord
          return { lat, lng }
        }).filter((path: { lng: number; lat: number }) => isFinite(path.lng) && isFinite(path.lat))

        if (paths.length > 0) {
          // Add a light filled polygon for better visibility on satellite imagery
          const fillPolygon = new window.google.maps.Polygon({
            paths: paths,
            fillColor: '#FF69B4',
            fillOpacity: 0.15, // Light fill that's visible on satellite imagery
            strokeColor: 'transparent', // No stroke on fill polygon
            strokeWeight: 0,
            map: map.value,
            zIndex: 400, // Behind the dotted outline
            clickable: false
          })
          
          // Use polyline for dotted pink outline (close the path by adding first point at end)
          const closedPath = [...paths, paths[0]]
          const polyline = new window.google.maps.Polyline({
            path: closedPath,
            strokeColor: '#FF69B4',
            strokeOpacity: 0.7,
            strokeWeight: 2,
            // Create dotted pattern using icons - larger, more prominent pink dots
            icons: [{
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 2.5,
                fillColor: '#FF69B4',
                fillOpacity: 0.6, // More visible dots
                strokeColor: '#FF69B4',
                strokeWeight: 1.5
              },
              offset: '0%',
              repeat: '12px'
            }],
            map: map.value,
            zIndex: 500, // Above the fill polygon
            clickable: false
          })
          
          // Store both the fill polygon and the outline polyline
          neighboringSettlements.value.push(fillPolygon)
          neighboringSettlements.value.push(polyline)

          // Calculate centroid for label (only once per settlement, not per polygon)
          if (neighboringSettlementLabels.value.findIndex(l => l.properties?.id === settlement.id) === -1) {
            try {
              const geomFeature = {
                type: 'Feature',
                geometry: settlement.geom
              }
              const centroidPoint = turf.centroid(geomFeature)
              const [lng, lat] = centroidPoint.geometry.coordinates
              const settlementName = settlement.name || 'Unnamed'
              
              // Create text-only marker with HTML content for text wrapping
              // Split long names into multiple lines (max 20 chars per line)
              const maxCharsPerLine = 20
              const words = settlementName.split(' ')
              const lines: string[] = []
              let currentLine = ''
              
              words.forEach(word => {
                if ((currentLine + word).length <= maxCharsPerLine) {
                  currentLine = currentLine ? `${currentLine} ${word}` : word
                } else {
                  if (currentLine) lines.push(currentLine)
                  currentLine = word
                }
              })
              if (currentLine) lines.push(currentLine)
              
              const wrappedText = lines.join('\n')
              
              const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: currentZoom.value >= MIN_ZOOM_FOR_LABELS ? map.value : null,
                // Use transparent icon to hide default marker
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>
                  `),
                  scaledSize: new window.google.maps.Size(1, 1),
                  anchor: new window.google.maps.Point(0.5, 0.5)
                },
                // Label with wrapped text (newlines in label text)
                label: {
                  text: wrappedText,
                  color: '#FF69B4',
                  fontSize: '12px',
                  fontWeight: '500'
                },
                zIndex: 1000,
                clickable: false
              })
              
              marker.properties = {
                id: settlement.id,
                name: settlementName
              }
              
              neighboringSettlementLabels.value.push(marker)
            } catch (error) {
              console.warn(`Error calculating centroid for settlement ${settlement.id}:`, error)
            }
          }
        }
      })
    }

    const count = neighboringSettlements.value.length
    if (!silent) {
      console.log(`✅ Loaded ${count} settlements from ward`)
    }
    return count
  } catch (error: any) {
    if (!silent) {
      if (error?.response?.data?.message) {
        console.error('❌ Error fetching settlements for ward:', error.response.data.message)
      } else if (error?.message) {
        console.error('❌ Error fetching settlements for ward:', error.message)
      } else {
        console.error('❌ Error fetching settlements for ward:', error)
      }
    }
    return 0
  }
}

// Update neighbor label visibility based on zoom level
const updateNeighborLabelVisibility = () => {
  if (!map.value) return
  
  const shouldShow = currentZoom.value >= MIN_ZOOM_FOR_LABELS
  neighboringSettlementLabels.value.forEach(marker => {
    if (marker) {
      marker.setMap(shouldShow ? map.value : null)
    }
  })
}

const loadSettlementBoundary = () => {
  if (!map.value || !settlementGeometry.value) return

  try {
    const geom = settlementGeometry.value
    
    // Handle Point geometry
    if (geom.type === 'Point') {
      const [lng, lat] = geom.coordinates
      const position = { lat, lng }
      
      // Remove existing marker if any
      if (settlementMarker.value) {
        settlementMarker.value.setMap(null)
        settlementMarker.value = null
      }
      
      // Create draggable marker
      settlementMarker.value = new window.google.maps.Marker({
        position: position,
        map: map.value,
        draggable: true,
        clickable: true,
        title: 'Settlement Location',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
        },
        zIndex: 2000
      })
      
      // Center map on marker
      map.value.setCenter(position)
      map.value.setZoom(15)
      
      // Listen for marker drag end to update geometry
      settlementMarker.value.addListener('dragend', () => {
        const newPosition = settlementMarker.value.getPosition()
        const newGeom = {
          type: 'Point',
          coordinates: [newPosition.lng(), newPosition.lat()]
        }
        settlementGeometry.value = newGeom
        settlementForm.geom = newGeom
      })
      
      // Add click listener to open drawer when marker is clicked
      settlementMarker.value.addListener('click', () => {
        drawerVisible.value = true
      })
      
      // Open drawer
      drawerVisible.value = true
      
      scheduleNeighboringSettlementsRefresh()
    } 
    // Handle Polygon and MultiPolygon geometry
    else if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      const paths = geom.type === 'Polygon'
        ? geom.coordinates[0].map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          }))
        : geom.coordinates[0][0].map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          }))

      settlementPolygon.value = new window.google.maps.Polygon({
        paths: paths,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        fillColor: '#FF0000',
        fillOpacity: 0.2,
        map: map.value,
        clickable: true,
        editable: true,
        draggable: false,
        zIndex: 1000000
      })

      // Fit map to settlement bounds
      const bounds = new window.google.maps.LatLngBounds()
      paths.forEach((path: any) => {
        bounds.extend(path)
      })
      map.value.fitBounds(bounds)

      // Listen for geometry changes
      settlementPolygon.value.getPath().addListener('set_at', () => updatePolygonGeometry(settlementPolygon.value))
      settlementPolygon.value.getPath().addListener('insert_at', () => updatePolygonGeometry(settlementPolygon.value))
      settlementPolygon.value.getPath().addListener('remove_at', () => updatePolygonGeometry(settlementPolygon.value))

      // Add click listener to open drawer when polygon is clicked
      settlementPolygon.value.addListener('click', () => {
        drawerVisible.value = true
      })

      // Open drawer
      drawerVisible.value = true
      
      scheduleNeighboringSettlementsRefresh()
    }
  } catch (error) {
    console.error('Error loading settlement boundary:', error)
  }
}

const checkPolygonWithinWard = (polygon: any): boolean => {
  if (!wardPolygon.value || wardPolygon.value.length === 0 || !wardGeo.value) return true

  try {
    const paths = polygon.getPath()
    let allInside = true

    paths.forEach((latLng: any) => {
      const point = new window.google.maps.LatLng(latLng.lat(), latLng.lng())
      // For MultiPolygon, check if point is inside ANY of the ward polygons
      let isInside = false
      for (const wardPoly of wardPolygon.value) {
        if (window.google.maps.geometry.poly.containsLocation(point, wardPoly)) {
          isInside = true
          break
        }
      }
      if (!isInside) {
        allInside = false
      }
    })

    return allInside
  } catch (error) {
    console.error('Error checking polygon within ward:', error)
    return true // Allow if check fails
  }
}

const updatePolygonGeometry = (polygon: any) => {
  if (!polygon) return

  try {
    const paths = polygon.getPath()
    const coordinates: number[][] = []
    
    paths.forEach((latLng: any) => {
      coordinates.push([latLng.lng(), latLng.lat()])
    })

    // Close the polygon
    if (coordinates.length > 0) {
      const firstCoord = coordinates[0]
      if (coordinates[coordinates.length - 1][0] !== firstCoord[0] || 
          coordinates[coordinates.length - 1][1] !== firstCoord[1]) {
        coordinates.push([firstCoord[0], firstCoord[1]])
      }
    }

    const geom = {
      type: 'Polygon',
      coordinates: [coordinates]
    }

    settlementGeometry.value = geom
    settlementForm.geom = geom

    // Calculate area in hectares
    const areaHectares = calculateAreaInHectares(geom)
    if (areaHectares !== null) {
      settlementForm.area = areaHectares
    }

    scheduleOvertureRefreshForGeometry(geom)
  } catch (error) {
    console.error('Error updating polygon geometry:', error)
  }
}


// Toggle drawing mode
const toggleDrawingMode = () => {
  if (mapLoading.value) {
    ElMessage.info('Map is still loading — please wait')
    return
  }
  if (!drawReady.value || !map.value) {
    ElMessage.warning(mapError.value || 'Drawing tools are not ready. Use Retry on the map panel.')
    return
  }

  if (isDrawingMode.value) {
    stopPolygonDrawing()
  } else {
    startPolygonDrawing()
    ElMessage.info('Click to add points. Double-click anywhere on the map to finish.')
  }
}

// Delete drawn shape function
const deleteDrawnShape = () => {
  let hasDeleted = false
  
  // Exit drawing mode if active
  if (isDrawingMode.value) {
    stopPolygonDrawing()
  }
  
  // Delete drawn polygons
  if (drawnPolygons.value.length > 0) {
    drawnPolygons.value.forEach(p => {
      p.setMap(null)
    })
    drawnPolygons.value = []
    hasDeleted = true
  }
  
  // Delete settlement polygon (for edit mode)
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
    hasDeleted = true
  }
  
  // Delete settlement marker (for point geometry)
  if (settlementMarker.value) {
    settlementMarker.value.setMap(null)
    settlementMarker.value = null
    hasDeleted = true
  }
  
  // Clear geometry data
  if (hasDeleted) {
    settlementGeometry.value = null
    settlementForm.geom = null
    settlementForm.area = null
    clearOvertureBuildingLayers()
    drawerVisible.value = false
    ElMessage.success('Settlement boundary deleted')
  } else {
    ElMessage.info('No shape to delete')
  }
}

// Fly to coordinates provided as "lat, lon"
const flyToCoordinates = () => {
  const raw = (flyToCoordsInput.value || '').trim()
  if (!raw) {
    ElMessage.error('Enter coordinates as "lat, lon"')
    return
  }

  // Allow comma or whitespace separated
  const parts = raw.replace(/[\s;]+/g, ',').split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) {
    ElMessage.error('Enter coordinates as "lat, lon" (e.g., -1.2921, 36.8219)')
    return
  }

  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    ElMessage.error('Invalid numbers. Use "lat, lon" (e.g., -1.2921, 36.8219)')
    return
  }

  if (!map.value || !window.google?.maps) {
    ElMessage.error('Map not ready yet')
    return
  }

  const target = new window.google.maps.LatLng(lat, lng)
  map.value.panTo(target)
  const targetZoom = 16
  if (typeof map.value.getZoom === 'function') {
    const currentZoom = map.value.getZoom()
    map.value.setZoom(Math.max(currentZoom || targetZoom, targetZoom))
  } else {
    map.value.setZoom(targetZoom)
  }

  // Drop/update a blue marker at the target
  try {
    if (flyMarker.value) {
      flyMarker.value.setMap(null)
    }
    flyMarker.value = new window.google.maps.Marker({
      position: target,
      map: map.value,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new window.google.maps.Size(40, 40),
      },
      title: `Lat: ${lat}, Lng: ${lng}`,
      zIndex: 2000,
    })
  } catch (e) {
    console.warn('Failed to place fly-to marker', e)
  }

  flyDialogVisible.value = false
}

// Submit form
const submitForm = async () => {
  if (!formRef.value || isSaving.value) return

  try {
    await formRef.value.validate()
  } catch (fields) {
    focusFirstValidationError(fields as Record<string, unknown>)
    ElMessage.error('Please complete all required fields before saving.')
    return
  }

  isSaving.value = true
  try {
    if (!settlementForm.geom && !settlementGeometry.value) {
      ElMessage.error('Please draw the settlement boundary or place a marker on the map')
      return
    }

    const allSections: SectionKey[] = ['basic', 'location', 'parcel', 'physical', 'socio', 'vulnerability']
    const incompleteSections = allSections.filter((s) => getSectionCompletion(s) !== 'full')

    if (incompleteSections.length > 0) {
      const names = incompleteSections.map((s) => `• ${sectionLabels[s]}`).join('\n')
      try {
        await ElMessageBox.confirm(
          `Some sections are not fully filled:\n\n${names}\n\nYou can still save now, or click Cancel to go back and complete more details.`,
          'Incomplete sections',
          {
            confirmButtonText: 'Save anyway',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )
      } catch {
        return
      }
    }

    const attrCheck = validateSettlementAttributes(settlementForm)
    if (!attrCheck.valid) {
      ElMessage.error(attrCheck.errors.join(' '))
      return
    }
    if (attrCheck.warnings.length > 0) {
      try {
        await ElMessageBox.confirm(
          `${attrCheck.warnings.join('\n\n')}\n\nSave anyway?`,
          'Data warnings',
          {
            confirmButtonText: 'Save anyway',
            cancelButtonText: 'Go back',
            type: 'warning'
          }
        )
      } catch {
        return
      }
    }

    if (!settlementForm.geom && settlementGeometry.value) {
      settlementForm.geom = settlementGeometry.value
    }

    settlementForm.model = 'settlement'
    if (route.params.domain) {
      settlementForm.component_id = route.params.domain
    }

    const formDataToSubmit = prepareSettlementFormForApi({
      ...settlementForm,
      structure_types: Array.isArray(settlementForm.structure_types)
        ? settlementForm.structure_types.join(', ')
        : settlementForm.structure_types || '',
      development: Array.isArray(settlementForm.development)
        ? settlementForm.development.join(', ')
        : settlementForm.development || '',
      typical_building_materials: Array.isArray(settlementForm.typical_building_materials)
        ? settlementForm.typical_building_materials.join(', ')
        : settlementForm.typical_building_materials || '',
      landuse: Array.isArray(settlementForm.landuse)
        ? settlementForm.landuse.join(', ')
        : settlementForm.landuse || '',
      climate_region: settlementForm.climate_region || null,
      soil_type: settlementForm.soil_type || null,
      land_cover: settlementForm.land_cover || null,
      altitude_range: settlementForm.altitude_range || null,
      proximity_to_river: settlementForm.proximity_to_river || null,
      proximity_to_flood_plain: settlementForm.proximity_to_flood_plain || null,
      vulnerability_total_score: (computedScore.value?.total_score ?? settlementForm.vulnerability_total_score) ?? null,
      vulnerability_rating: (computedScore.value?.rating ?? settlementForm.vulnerability_rating) || null
    })

    if (isEditMode.value && editingSettlementId.value) {
      const formData = {
        ...formDataToSubmit,
        id: editingSettlementId.value,
        model: 'settlement'
      }

      const res = await updateOneRecord(formData, { silent: true })
      const ok = String(res?.code ?? '') === '0000'

      if (ok) {
        const settlementId = editingSettlementId.value
        const shouldImportStructures = updateStructuresFromOverture.value

        ElMessage.success('Settlement updated successfully')
        clearFormAndGeometry()
        sessionStorage.setItem('navigatingFromEdit', 'true')
        router.push({ name: 'List' })

        if (shouldImportStructures) {
          void importOvertureStructuresAfterSave(settlementId, { replaceAll: true })
        }
      } else {
        ElMessage.error(res?.message || 'Failed to update settlement')
      }
    } else {
      formDataToSubmit.isApproved = 'Pending'
      formDataToSubmit.createdBy = userInfo.id
      formDataToSubmit.code = shortid.generate()
      formDataToSubmit.checkFields = ['name', 'county_id']

      try {
        await duplicatePreCheck(formDataToSubmit)

        const res = await CreateRecord(formDataToSubmit)

        if (String(res?.code ?? '') === '0000') {
          await importOvertureStructuresAfterSave(resolveSettlementIdFromCreateResponse(res))
          ElMessage.success('Settlement created successfully')
          clearFormAndGeometry()
          router.push({ name: 'List' })
        } else {
          ElMessage.error('Failed to create settlement')
        }
      } catch (error: any) {
        if (error.response?.data?.duplicates) {
          const duplicates = error.response.data.duplicates
          const duplicateMsg = duplicates.map((dup: any, idx: number) =>
            `${idx + 1}. ${Object.entries(dup).map(([k, v]) => `${k}: ${v || 'N/A'}`).join(', ')}`
          ).join('\n')

          try {
            await ElMessageBox.confirm(
              `${error.response.data.message}\n\nDuplicates found:\n${duplicateMsg}`,
              'Warning',
              {
                confirmButtonText: 'Proceed to Create',
                cancelButtonText: 'Cancel',
                type: 'warning',
                dangerouslyUseHTMLString: false
              }
            )
            const createRes = await CreateRecord(formDataToSubmit)
            if (String(createRes?.code ?? '') === '0000') {
              await importOvertureStructuresAfterSave(
                resolveSettlementIdFromCreateResponse(createRes)
              )
              ElMessage.success('Settlement created successfully')
              clearFormAndGeometry()
              router.push({ name: 'List' })
            } else {
              ElMessage.error('Failed to create settlement')
            }
          } catch {
            // User cancelled duplicate override
          }
        } else {
          throw error
        }
      }
    }
  } catch (error: any) {
    console.error('Error saving settlement:', error)
    ElMessage.error(error?.response?.data?.message || 'Failed to save settlement')
  } finally {
    isSaving.value = false
  }
}

// Go back to previous step
const goBack = () => {
  if (currentStep.value > 0) {
    abortWardGeoLoad()
    currentStep.value--
    if (currentStep.value === 0) {
      // Clean up map
      if (wardPolygon.value && wardPolygon.value.length > 0) {
        wardPolygon.value.forEach(p => {
          if (p) p.setMap(null)
        })
        wardPolygon.value = []
      }
      if (settlementPolygon.value) {
        settlementPolygon.value.setMap(null)
        settlementPolygon.value = null
      }
      if (settlementMarker.value) {
        settlementMarker.value.setMap(null)
        settlementMarker.value = null
      }
      drawnPolygons.value.forEach(p => p.setMap(null))
      drawnPolygons.value = []
      
      // Clean up neighboring settlements
      neighboringSettlements.value.forEach(polyline => {
        if (polyline) polyline.setMap(null)
      })
      neighboringSettlements.value = []
      neighboringSettlementLabels.value.forEach(marker => {
        if (marker) marker.setMap(null)
      })
      neighboringSettlementLabels.value = []
      
      stopPolygonDrawing()
      map.value = null
      wardGeo.value = null
      settlementGeometry.value = null
      settlementForm.geom = null
      mapLoading.value = false
      mapError.value = null
      drawReady.value = false
    }
  } else {
    router.back()
  }
}

// Close drawer
const closeDrawer = () => {
  drawerVisible.value = false
}

const populationLoading = ref(false)
const climateLoading = ref(false)
const overtureBuildingsLoading = ref(false)
const overtureBuildingCount = ref<number | null>(null)
const overtureBuildingLayers = ref<any[]>([])
const overtureBuildingsGeojson = ref<GeoJSON.FeatureCollection | null>(null)
/** Edit mode only: when checked, replace all structures with Overture footprints on save. */
const updateStructuresFromOverture = ref(false)

const clearOvertureBuildingLayers = () => {
  overtureBuildingLayers.value.forEach((layer) => {
    if (layer) layer.setMap(null)
  })
  overtureBuildingLayers.value = []
  overtureBuildingCount.value = null
  overtureBuildingsGeojson.value = null
}

let overtureGeometryRefreshTimer: ReturnType<typeof setTimeout> | null = null

/** Re-fetch Overture footprints when settlement boundary changes (debounced). */
const scheduleOvertureRefreshForGeometry = (geometry: any) => {
  if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) return
  if (overtureGeometryRefreshTimer) {
    clearTimeout(overtureGeometryRefreshTimer)
  }
  overtureGeometryRefreshTimer = setTimeout(() => {
    overtureGeometryRefreshTimer = null
    void refreshOvertureMapPreview(geometry, { showMessage: false })
  }, 700)
}

const renderOvertureBuildingsOnMap = (geojson: GeoJSON.FeatureCollection) => {
  overtureBuildingLayers.value.forEach((layer) => {
    if (layer) layer.setMap(null)
  })
  overtureBuildingLayers.value = []
  if (!map.value || !window.google?.maps || !geojson?.features?.length) return

  const addPolygonPaths = (paths: Array<{ lat: number; lng: number }>) => {
    const poly = new window.google.maps.Polygon({
      paths,
      strokeColor: '#00ACC1',
      strokeOpacity: 0.85,
      strokeWeight: 1,
      fillColor: '#00ACC1',
      fillOpacity: 0.3,
      map: map.value,
      clickable: false,
      zIndex: 600,
    })
    overtureBuildingLayers.value.push(poly)
  }

  for (const feature of geojson.features) {
    const geom = feature.geometry
    if (!geom) continue
    if (geom.type === 'Polygon') {
      addPolygonPaths(geom.coordinates[0].map(([lng, lat]) => ({ lat, lng })))
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates) {
        addPolygonPaths(polygon[0].map(([lng, lat]) => ({ lat, lng })))
      }
    }
  }
}

const fetchOvertureBuildingsForSettlement = async (geometry: any) => {
  if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
    clearOvertureBuildingLayers()
    return null
  }
  overtureBuildingsLoading.value = true
  try {
    const res = await fetchOvertureBuildings(geometry)
    if (String(res.code) !== '0000') return null
    overtureBuildingCount.value = res.count ?? 0
    overtureBuildingsGeojson.value =
      res.geojson?.features?.length ? res.geojson : null
    if (res.geojson?.features?.length) {
      renderOvertureBuildingsOnMap(res.geojson)
    }
    return res
  } catch (e) {
    console.warn('Overture buildings unavailable:', e)
    return null
  } finally {
    overtureBuildingsLoading.value = false
  }
}

// Fetch average household size for a ward from the households dataset
const fetchWardAvgHouseholdSize = async (wardId: any): Promise<number | null> => {
  try {
    const res = await getSummarybyFieldFromMultipleIncludes({
      model: 'households',
      summaryField: 'households.hh_size',
      summaryFunction: 'AVG',
      assoc_models: [],
      groupFields: [],
      filterField: ['ward_id'],
      filterValue: [[wardId]],
      filterOperator: ['or']
    })
    const avg = res?.Total?.[0]?.AVG
    return avg != null ? parseFloat(avg) : null
  } catch {
    return null
  }
}

/** Split total population into male/female using the selected county's census sex ratio. */
const applyCountySexSplit = async (total: number) => {
  const countyId = settlementForm.county_id
  if (!countyId || !Number.isFinite(total) || total <= 0) return

  let county = countyRefList.value?.find((c) => String(c.id) === String(countyId)) as {
    id?: number | string
    pop_male?: number
    pop_female?: number
    pop_total?: number
  } | undefined

  let refMale = Number(county?.pop_male)
  let refFemale = Number(county?.pop_female)

  if (!Number.isFinite(refMale) || !Number.isFinite(refFemale) || refMale + refFemale <= 0) {
    try {
      const res = await getOneSettlement({ model: 'county', id: String(countyId) } as any)
      const row = (res as any)?.data ?? res
      if (row) {
        refMale = Number(row.pop_male)
        refFemale = Number(row.pop_female)
        if (county) {
          county.pop_male = row.pop_male
          county.pop_female = row.pop_female
          county.pop_total = row.pop_total
        }
      }
    } catch (e) {
      console.warn('Could not load county sex ratio:', e)
    }
  }

  const refTotal = Number(county?.pop_total) || refMale + refFemale
  if (!Number.isFinite(refTotal) || refTotal <= 0) return
  if (!Number.isFinite(refMale) || !Number.isFinite(refFemale)) return

  const popMale = Math.round(total * (refMale / refTotal))
  settlementForm.pop_male = popMale
  settlementForm.pop_female = total - popMale
}

const ensureWardAvgHouseholdSize = async (): Promise<number | null> => {
  if (wardAvgHouseholdSize.value != null && Number.isFinite(wardAvgHouseholdSize.value)) {
    return wardAvgHouseholdSize.value
  }
  const wardId = settlementForm.ward_id || selectedWard.value
  if (!wardId) return null
  const avg = await fetchWardAvgHouseholdSize(wardId)
  if (avg != null) {
    wardAvgHouseholdSize.value = avg
  }
  return avg
}

const applyPopulationTotals = async (
  total: number,
  options?: { avgHouseholdSize?: number | null; message?: string }
) => {
  const population = Math.round(total / 100) * 100
  settlementForm.population = population
  const ppb = options?.avgHouseholdSize ?? wardAvgHouseholdSize.value
  if (ppb != null && Number.isFinite(ppb)) {
    settlementForm.avg_household_size = ppb
  }
  await applyCountySexSplit(population)
  if (options?.message) {
    ElMessage.success(options.message.replace('{population}', population.toLocaleString()))
  }
}

const fetchOpenBuildingsPopulation = async (geometry: any, ppb?: number | null) => {
  const feature: any = { type: 'Feature', geometry }
  const url = new URL('https://kesmis.go.ke/estimate_population')
  const personsPerBuilding = ppb ?? wardAvgHouseholdSize.value
  if (personsPerBuilding != null && Number.isFinite(personsPerBuilding)) {
    url.searchParams.set('persons_per_building', String(personsPerBuilding))
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feature),
  })
  if (!res.ok) return null
  return res.json()
}

// Auto-fill population from building-based population estimation service (Open Buildings)
const fetchPopulationEstimate = async (geometry: any) => {
  try {
    const ppb = await ensureWardAvgHouseholdSize()
    const data = await fetchOpenBuildingsPopulation(geometry, ppb)
    if (data?.estimated_population != null) {
      const hhLabel =
        data.persons_per_building != null
          ? ` × ${Number(data.persons_per_building).toFixed(2)} avg HH size`
          : ''
      await applyPopulationTotals(data.estimated_population, {
        avgHouseholdSize: data.persons_per_building ?? ppb,
        message: `Population estimated (Open Buildings fallback): {population} (${data.buildings} buildings${hhLabel})`,
      })
      return data
    }
    ElMessage.warning('Open Buildings could not estimate population for this boundary.')
    return data
  } catch (e) {
    console.warn('Population estimation service unavailable:', e)
    ElMessage.error('Population estimation service unavailable.')
    return null
  }
}

/** Overture map preview only — never changes population. */
const refreshOvertureMapPreview = async (
  geometry: any,
  options: { showMessage?: boolean } = {}
) => {
  const showMessage = options.showMessage !== false
  const overture = await fetchOvertureBuildingsForSettlement(geometry)
  const overtureCount = Number(overture?.count) || 0
  if (showMessage && overtureCount > 0) {
    ElMessage.info(`Overture: ${overtureCount} building footprint${overtureCount === 1 ? '' : 's'} shown on map (cyan).`)
  }
  return overture
}

/** Population estimate from Overture / Open Buildings — manual button or create-mode auto only. */
const applyPopulationEstimateFromBuildings = async (geometry: any) => {
  populationLoading.value = true
  try {
    const ppb = await ensureWardAvgHouseholdSize()

    const overture = await fetchOvertureBuildingsForSettlement(geometry)
    const overtureCount = Number(overture?.count) || 0

    if (overtureCount > 0 && ppb != null && Number.isFinite(ppb)) {
      const total = overtureCount * ppb
      await applyPopulationTotals(total, {
        avgHouseholdSize: ppb,
        message: `Population estimated from Overture: {population} (${overtureCount} buildings × ${ppb.toFixed(2)} avg HH size)`,
      })
      return
    }

    if (overtureCount > 0 && ppb == null) {
      ElMessage.info('Ward average household size unavailable — trying Open Buildings estimate.')
    }

    await fetchPopulationEstimate(geometry)
  } finally {
    populationLoading.value = false
  }
}

/** After boundary draw/upload: preview only in edit; climate + population in create. */
const onSettlementGeometryReady = async (geometry: any) => {
  if (isEditMode.value) {
    await refreshOvertureMapPreview(geometry)
    return
  }

  fetchClimateData(geometry)
  await applyPopulationEstimateFromBuildings(geometry)
}

const resolveSettlementIdFromCreateResponse = (res: any): number | null => {
  const raw = res?.data?.id ?? res?.data?.dataValues?.id ?? res?.id
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
}

const importOvertureStructuresAfterSave = async (
  settlementId: number | string | null | undefined,
  options?: { replaceAll?: boolean }
) => {
  const id = Number(settlementId)
  if (!Number.isFinite(id) || id <= 0) {
    console.warn('[Overture structures] skipped import: invalid settlement id', settlementId)
    return
  }

  try {
    const res = await createOvertureStructures(
      id,
      overtureBuildingsGeojson.value,
      { replaceAll: options?.replaceAll === true }
    )
    if (String(res.code) !== '0000') return

    if ((res.created ?? 0) > 0) {
      ElMessage.success(
        `Created ${res.created} structure record${res.created === 1 ? '' : 's'} from Overture footprints`
      )
    } else if ((res.total ?? 0) > 0) {
      ElMessage.info('Overture footprints found but no new structure records were created.')
    } else {
      ElMessage.info('No Overture building footprints found for this settlement boundary.')
    }
  } catch (e) {
    console.warn('Overture structure import failed:', e)
    ElMessage.warning('Settlement saved, but structure import from Overture failed.')
  }
}

const onManualPopulationFetch = async () => {
  const geom = settlementForm.geom || settlementGeometry.value
  if (!geom) {
    ElMessage.error('Please draw or select settlement geometry before estimating population')
    return
  }
  if (!settlementForm.ward_id && !selectedWard.value) {
    ElMessage.warning('Select a ward first — average household size is needed for the estimate.')
  }
  await applyPopulationEstimateFromBuildings(geom)
}

// Auto-fill vulnerability fields from climate service using geometry centroid
const fetchClimateData = async (geometry: any) => {
  climateLoading.value = true
  try {
    const feature = { type: 'Feature', geometry }
    const centroid = turf.centroid(feature)
    const [lon, lat] = centroid.geometry.coordinates

    const res = await fetch('https://kesmis.go.ke/climate/intersect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon })
    })
    if (!res.ok) return

    console.log(res)
    const data = await res.json()
    const mapped = data?.mapped
    if (!mapped) return

    if (mapped.soil_type)               settlementForm.soil_type = mapped.soil_type
    if (mapped.climate_region)          settlementForm.climate_region = mapped.climate_region
    if (mapped.land_cover)              settlementForm.land_cover = mapped.land_cover
    if (mapped.altitude_range)          settlementForm.altitude_range = mapped.altitude_range
    if (mapped.proximity_to_river)      settlementForm.proximity_to_river = mapped.proximity_to_river
    if (mapped.proximity_to_flood_plain) settlementForm.proximity_to_flood_plain = mapped.proximity_to_flood_plain

    ElMessage.success('Climate & vulnerability attributes auto-filled')
  } catch (e) {
    console.warn('Climate service unavailable:', e)
  } finally {
    climateLoading.value = false
  }
}

const onManualClimateFetch = async () => {
  const geom = settlementForm.geom || settlementGeometry.value
  if (!geom) {
    ElMessage.error('Please draw or select settlement geometry before running climate auto-fill')
    return
  }

  await fetchClimateData(geom)
}

// Calculate area in hectares from GeoJSON geometry
// turf.area() returns area in square meters (m²)
// 1 hectare = 10,000 square meters
const calculateAreaInHectares = (geometry: any): number | null => {
  try {
    if (!geometry || !geometry.type || !geometry.coordinates) {
      console.error('Invalid geometry for area calculation')
      return null
    }

    // Point geometry has no area
    if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
      return null
    }

    // Ensure geometry is in GeoJSON format
    const geom = {
      type: geometry.type,
      coordinates: geometry.coordinates
    }

    // turf.area() calculates area on a sphere (Earth's surface) in square meters
    // It uses the WGS84 ellipsoid for accurate calculations
    const areaSquareMeters = turf.area(geom)
    
    // Convert square meters to hectares (1 hectare = 10,000 m²)
    const areaHectares = areaSquareMeters / 10000
    
    // Return rounded to 4 decimal places for precision
    return parseFloat(areaHectares.toFixed(4))
  } catch (error) {
    console.error('Error calculating area:', error)
    return null
  }
}

// Clear form and geometry
const clearFormAndGeometry = () => {
  // Reset form to initial values
  Object.assign(settlementForm, {
    name: '',
    county_id: '',
    subcounty_id: '',
    ward_id: '',
    settlement_type: '',
    population: null,
    pop_male: null,
    pop_female: null,
    area: '',
    description: null,
    geom: null,
    id: '',
    dist_trunk: null,
    dist_town: null,
    parcel_no: null,
    parcel_owner: null,
    rim_no: null,
    isApproved: 'Pending',
    isActive: true,
    code: '',
    surveyed: null,
    land_status: null,
    planning_status: null,
    survey_status: null,
    parcel_owner_type: null,
    pop_density: null,
    landuse: [],
    near_river: null,
    on_wayleave: null,
    on_road_reserve: null,
    structure_types: [],
    development: [],
    typical_building_materials: [],
    avg_dist_between: null,
    electricity_availability: null,
    piped_water_availability: null,
    encumbrance: null,
    num_households: null,
    avg_household_size: null,
    median_household_income: null,
    plot_ownership_ratio: null,
    plot_tenant_ratio: null,
    avg_rent: null,
    main_env_hazards: null,
    general_location: null,
    density_typology: null,
    comments: null,
    climate_region: null,
    soil_type: null,
    land_cover: null,
    altitude_range: null,
  proximity_to_river: null,
  proximity_to_flood_plain: null,
  vulnerability_total_score: null,
  vulnerability_rating: null
  })
  
  // Clear geometry
  settlementGeometry.value = null
  
  // Remove polygons and markers from map
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
  }
  if (settlementMarker.value) {
    settlementMarker.value.setMap(null)
    settlementMarker.value = null
  }
  drawnPolygons.value.forEach(p => p.setMap(null))
  drawnPolygons.value = []
  
  // Clear ward polygons
  if (wardPolygon.value && wardPolygon.value.length > 0) {
    wardPolygon.value.forEach(p => {
      if (p) p.setMap(null)
    })
    wardPolygon.value = []
  }
  
  // Clean up neighboring settlements
  neighboringSettlements.value.forEach(polyline => {
    if (polyline) polyline.setMap(null)
  })
  neighboringSettlements.value = []
  neighboringSettlementLabels.value.forEach(marker => {
    if (marker) marker.setMap(null)
  })
  neighboringSettlementLabels.value = []
  
  // Close drawer
  drawerVisible.value = false
  
  // Reset to step 0
  currentStep.value = 0
  
  // Clear location selections
  selectedCounty.value = null
  selectedWard.value = null
  filteredWards.value = []
  wardGeo.value = null
  wardAvgHouseholdSize.value = null
  
  // Reset edit mode
  isEditMode.value = false
  editingSettlementId.value = null
  
  
  // Reset form validation
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// Handle file upload for geometry
const handleUploadGeo = async (uploadFile: any) => {
  const fileType = uploadFile.name.split('.').pop()?.toLowerCase()
  const rfile = uploadFile.raw
  
  if (!rfile) {
    ElMessage.error('File not found')
    return
  }
  
  let reader = new FileReader()
  
  if (fileType === 'geojson' || fileType === 'json') {
    reader.onload = (event: any) => readJsonFile(event)
    reader.readAsText(rfile)
  } else if (fileType === 'zip' || fileType === 'kml' || fileType === 'kmz') {
    readShapefile(rfile)
  } else {
    ElMessage.error('Only GeoJSON, KML, KMZ or zipped shapefiles are supported')
  }
}

const readJsonFile = (event: any) => {
  let str = event.target.result
  let json = JSON.parse(str)
  
  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"
  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null
  
  if (crsProp && crsProp.includes('EPSG')) {
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
  }
  
  // Handle different EPSG codes (same as AddX.vue)
  if (epsgCode == 21037) {
    sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs"
  } else if (epsgCode == 21097) {
    sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs"
  } else if (epsgCode == 21036) {
    sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs"
  } else if (epsgCode == 21096) {
    sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs"
  } else {
    sourceProj = "+proj=longlat +datum=WGS84 +no_defs"
  }
  
  proj4.defs("SOURCE_CRS", sourceProj)
  proj4.defs("WGS84", targetProj)
  
  if (json.features && json.features.length != 1) {
    ElMessage.warning('Please upload a file with only one feature. This one has ' + json.features.length + ' features')
    return
  }
  
  const geometry = json.features[0].geometry
  
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
    ElMessage.error(`Geometry type "${geometry.type}" is not supported. Only Polygon or MultiPolygon geometries are accepted.`)
    return
  }
  
  // Transform coordinates
  if (geometry.type === "Polygon") {
    geometry.coordinates[0] = geometry.coordinates[0].map((coordinate: number[]) => {
      return proj4("SOURCE_CRS", "WGS84", coordinate)
    })
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon: number[][][]) => {
      polygon[0] = polygon[0].map((coordinate: number[]) => {
        return proj4("SOURCE_CRS", "WGS84", coordinate)
      })
    })
  }
  
  let geom = {
    type: geometry.type,
    coordinates: geometry.coordinates
  }
  
  settlementGeometry.value = geom
  settlementForm.geom = geom
  void onSettlementGeometryReady(geom)

  // Calculate area
  try {
    const areaSquareMeters = turf.area(geom)
    const areaHectares = areaSquareMeters / 10000
    settlementForm.area = parseFloat(areaHectares.toFixed(4))
  } catch (error) {
    console.error('Error calculating area:', error)
  }
  
  // Update map
  if (map.value) {
    // Remove existing polygons and markers
    if (settlementPolygon.value) {
      settlementPolygon.value.setMap(null)
      settlementPolygon.value = null
    }
    if (settlementMarker.value) {
      settlementMarker.value.setMap(null)
      settlementMarker.value = null
    }
    drawnPolygons.value.forEach(p => p.setMap(null))
    drawnPolygons.value = []
    
    // Load new geometry
    loadSettlementBoundary()
    
    // Open drawer to fill in details (for create mode)
    if (!isEditMode.value) {
      nextTick(() => {
        drawerVisible.value = true
      })
    }
    
    // Close upload dialog on successful load
    showUploadDialog.value = false
    ElMessage.success('Boundary loaded successfully')
  }
}

const readShapefile = async (file: File) => {
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {
      if (geojson.length != 1) {
        ElMessage.warning('Please upload a file with only one feature. This one has ' + geojson.length + ' features')
        return
      }
      
      const geometryType = geojson[0].geometry.type
      
      if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
        ElMessage.error(`Geometry type "${geometryType}" is not supported. Only Polygon or MultiPolygon geometries are accepted.`)
        return
      }
      
      let geomX = {
        type: geometryType,
        coordinates: geojson[0].geometry.coordinates,
      }
      
      settlementGeometry.value = geomX
      settlementForm.geom = geomX
      void onSettlementGeometryReady(geomX)

      // Calculate area in hectares
      const areaHectares = calculateAreaInHectares(geomX)
      if (areaHectares !== null) {
        settlementForm.area = areaHectares
      }

      // Update map
      if (map.value) {
        if (settlementPolygon.value) {
          settlementPolygon.value.setMap(null)
          settlementPolygon.value = null
        }
        if (settlementMarker.value) {
          settlementMarker.value.setMap(null)
          settlementMarker.value = null
        }
        drawnPolygons.value.forEach(p => p.setMap(null))
        drawnPolygons.value = []
        loadSettlementBoundary()
        
        // Update delete button state
        // Open drawer to fill in details (for create mode)
        if (!isEditMode.value) {
          nextTick(() => {
            drawerVisible.value = true
          })
        }
        
        // Close upload dialog on successful load
        showUploadDialog.value = false
        ElMessage.success('Boundary loaded successfully')
      }
    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid files. Check your zipped file to contain (.shp, .dbf and .prj) or a proper kml/kmz')
    })
}

const showUploadDialog = ref(false)
const fileList = ref([])

const handleUploadClick = () => {
  console.log('Upload clicked')
  showUploadDialog.value = true
  console.log('Show upload dialog', showUploadDialog.value)
}

// Compute vulnerability score when attributes change
watch(
  () => [
    settlementForm.climate_region,
    settlementForm.soil_type,
    settlementForm.land_cover,
    settlementForm.altitude_range,
    settlementForm.proximity_to_river,
    settlementForm.proximity_to_flood_plain
  ],
  async (vals) => {
    const hasAll = vals.every((v) => v && String(v).trim())
    if (!hasAll) {
      computedScore.value = null
      return
    }
    try {
      const res = await computeVulnerabilityScore({
        climate_region: settlementForm.climate_region,
        soil_type: settlementForm.soil_type,
        land_cover: settlementForm.land_cover,
        altitude_range: settlementForm.altitude_range,
        proximity_to_river: settlementForm.proximity_to_river,
        proximity_to_flood_plain: settlementForm.proximity_to_flood_plain
      })
      if (res.code === '0000') {
        computedScore.value = res.data
      } else {
        computedScore.value = null
      }
    } catch {
      computedScore.value = null
    }
  },
  { deep: true }
)

// Load vulnerability matrix options for dropdowns
const loadVulnerabilityOptions = async () => {
  const fallback = Object.fromEntries(
    Object.entries(VULNERABILITY_FALLBACK).map(([k, vals]) => [
      k,
      vals.map((v) => ({ label: v, value: v }))
    ])
  )
  try {
    const res = await getVulnerabilityMatrix()
    if (res.code === '0000' && res.data?.length) {
      const grouped: Record<string, { label: string; value: string }[]> = {}
      for (const row of res.data) {
        const t = row.attribute_type
        if (!grouped[t]) grouped[t] = []
        grouped[t].push({ label: row.attribute_value, value: row.attribute_value })
      }
      vulnerabilityOptions.value = { ...fallback, ...grouped }
    } else {
      vulnerabilityOptions.value = fallback
    }
  } catch {
    vulnerabilityOptions.value = fallback
  }
}

// Initialize on mount
onMounted(async () => {
  try {
    await Promise.all([loadCounties(), loadSubcounties()])
  } catch {
    ElMessage.error(countiesError.value || 'Failed to load counties')
  }

  await loadVulnerabilityOptions()
  // Check if editing (route has id)
  const settlementId = route.query.id
  
  if (settlementId) {
    editingSettlementId.value = Number(settlementId)

    // Location ids from list/details edit click (immediate, before API)
    const routeCounty = route.query.county_id
    const routeSubcounty = route.query.subcounty_id
    const routeWard = route.query.ward_id
    if (routeCounty) {
      await applyLocationFromRecord(routeCounty, routeWard, routeSubcounty)
    }
    
    try {
      const form = {
        model: 'settlement',
        id: String(settlementId)
      }
      
      const res = await getOneSettlement(form as any)
      const curData = res.data
      
      // Populate form
      Object.assign(settlementForm, curData)

      if (curData.population != null && curData.population !== '') {
        settlementForm.population = Number(curData.population)
      }
      if (curData.pop_male != null && curData.pop_male !== '') {
        settlementForm.pop_male = Number(curData.pop_male)
      }
      if (curData.pop_female != null && curData.pop_female !== '') {
        settlementForm.pop_female = Number(curData.pop_female)
      }

      // Boolean DB fields -> yes/no for form selects
      settlementForm.near_river = booleanToYesNo(curData.near_river)
      settlementForm.on_wayleave = booleanToYesNo(curData.on_wayleave)
      settlementForm.on_road_reserve = booleanToYesNo(curData.on_road_reserve)
      settlementForm.electricity_availability = booleanToYesNo(curData.electricity_availability)
      settlementForm.piped_water_availability = booleanToYesNo(curData.piped_water_availability)
      
      // Convert comma-separated strings back to arrays for checkbox groups
      if (curData.structure_types && typeof curData.structure_types === 'string') {
        settlementForm.structure_types = curData.structure_types.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      } else if (!curData.structure_types) {
        settlementForm.structure_types = []
      }
      
      if (curData.development && typeof curData.development === 'string') {
        settlementForm.development = curData.development.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      } else if (!curData.development) {
        settlementForm.development = []
      }
      
      if (curData.typical_building_materials && typeof curData.typical_building_materials === 'string') {
        settlementForm.typical_building_materials = curData.typical_building_materials.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      } else if (!curData.typical_building_materials) {
        settlementForm.typical_building_materials = []
      }
      
      const parsed = resolvePlanningSurveyFromRecord(curData)
      settlementForm.planning_status = parsed.planning
      settlementForm.survey_status = parsed.survey
      
      // Parse landuse from string to array
      if (curData.landuse && typeof curData.landuse === 'string') {
        settlementForm.landuse = curData.landuse.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      } else if (!curData.landuse) {
        settlementForm.landuse = []
      }
      
      // Set location from saved record (county, ward, subcounty)
      await applyLocationFromRecord(
        curData.county_id,
        curData.ward_id,
        curData.subcounty_id
      )
      
      // Load settlement geometry
      if (curData.geom) {
        settlementGeometry.value = curData.geom
        settlementForm.geom = curData.geom
        
        // Calculate area in hectares
        const areaHectares = calculateAreaInHectares(curData.geom)
        if (areaHectares !== null) {
          settlementForm.area = areaHectares
        }

        void refreshOvertureMapPreview(curData.geom, { showMessage: false })
      }
      
      // Get ward geometry for context
      if (curData.ward_id) {
        const wardRes = await withTimeout(
          getOneGeo({ model: 'ward', id: String(curData.ward_id) }),
          LOCATION_FETCH_TIMEOUT_MS,
          'Ward boundary'
        )
        if (wardRes.data[0]?.json_build_object?.features) {
          wardGeo.value = wardRes.data[0].json_build_object
        }
      }

      // Move directly to map step
      currentStep.value = 1
      await nextTick()
      await initializeMap()

      if (curData.ward_id) {
        loadWardAvgHouseholdSizeDeferred(curData.ward_id)
      }
    } catch (error) {
      console.error('Error loading settlement:', error)
      ElMessage.error('Failed to load settlement data')
    }
  } else {
    // New settlement - check if county is pre-selected from route
    const routeCountyId = route.query.county_id
    if (routeCountyId) {
      selectedCounty.value = Array.isArray(routeCountyId) ? routeCountyId[0] : routeCountyId
      await handleCountyChange(selectedCounty.value)
    } else if (isCountyRestricted.value && userCountyId.value) {
      selectedCounty.value = userCountyId.value
      await handleCountyChange(userCountyId.value)
    }
  }
})
</script>

<template>
  <div class="add-settlement-container">
    <el-card>
      <!-- Header -->
      <template #header>
        <div class="header-content">
 
          <el-button type="primary" plain :icon="Back" @click="goBack" class="back-button">
            Back
          </el-button>

          <h2 class="header-title">{{ isEditMode ? 'EditSettlement' : 'Add Settlement' }}</h2>
          <div class="header-actions">
            <el-button 
              v-if="currentStep === 1 && isDrawingMode" 
              type="success"
              :icon="Check" 
              @click="finishPolygonDrawing" 
              size="small"
              :circle="isMobile"
              class="draw-button"
            >
              <span class="draw-text">Finish</span>
            </el-button>
            <el-button 
              v-if="currentStep === 1" 
              :type="isDrawingMode ? 'success' : 'default'"
              :icon="Edit" 
              @click="toggleDrawingMode" 
              size="small"
              :circle="isMobile"
              :disabled="mapLoading || !drawReady"
              :loading="mapLoading"
              class="draw-button"
            >
              <span class="draw-text">Draw</span>
            </el-button>
            <el-button 
              v-if="currentStep === 1" 
              type="info" 
              :icon="Plus" 
              @click="flyDialogVisible = true" 
              size="small"
              :circle="isMobile"
              class="draw-button"
            >
              <span class="draw-text">Fly to coords</span>
            </el-button>
            <el-button 
              v-if="currentStep === 1 && (drawnPolygons.length > 0 || settlementPolygon || settlementMarker)" 
              type="danger" 
              :icon="Delete" 
              @click="deleteDrawnShape" 
              size="small"
              :circle="isMobile"
              class="delete-button"
            >
              <span class="delete-text">Delete</span>
            </el-button>
            <el-button 
              v-if="currentStep === 1" 
              type="primary" 
              :icon="UploadFilled" 
              @click="handleUploadClick" 
              size="small"
              :circle="isMobile"
              class="upload-button"
            >
              <span class="upload-text">Upload boundary file</span>
            </el-button>
          </div>
        </div>
      </template>

      <!-- Step 1: Location Selection - County and Ward (skip in edit mode) -->
      <div v-if="currentStep === 0 && !isEditMode" class="step-content">
        <el-alert
          v-if="countiesError"
          type="error"
          :title="countiesError"
          show-icon
          :closable="false"
          class="mb-12px"
        >
          <el-button size="small" type="primary" plain @click="retryLoadCounties">Retry counties</el-button>
        </el-alert>
        <el-alert
          v-if="wardsError"
          type="warning"
          :title="wardsError"
          show-icon
          :closable="false"
          class="mb-12px"
        >
          <el-button size="small" type="primary" plain @click="retryLoadWards">Retry wards</el-button>
        </el-alert>
        <el-form label-width="150px" label-position="left">
          <el-row :gutter="20">
            <el-col :span="24" :md="12">
              <el-form-item label="County" required>
                <el-select
                  v-model="selectedCounty"
                  :placeholder="countiesLoading ? 'Loading counties...' : 'Select County'"
                  filterable
                  clearable
                  :loading="countiesLoading"
                  :disabled="isCountyRestricted || countiesLoading"
                  @change="handleCountyChange"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in filteredCountyOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <div v-if="isCountyRestricted" style="font-size: 12px; color: #909399; margin-top: 5px;">
                  You are restricted to your assigned county
                </div>
              </el-form-item>
            </el-col>

            <el-col :span="24" :md="12">
              <el-form-item label="Ward" required>
                <el-select
                  v-model="selectedWard"
                  :placeholder="wardsLoading ? 'Loading wards...' : wardGeoLoading ? 'Loading ward boundary...' : !selectedCounty ? 'Select county first' : 'Select Ward'"
                  filterable
                  clearable
                  :loading="wardsLoading || wardGeoLoading"
                  :disabled="!selectedCounty || wardsLoading"
                  @change="handleWardChange"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in filteredWards"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <div
            style="
              font-size: 13px;
              color: #606266;
              margin-top: 16px;
              padding: 12px 14px;
              border: 1px dashed #dcdfe6;
              border-radius: 6px;
              background-color: #f9fafc;
            "
          >
            <div style="font-weight: 500; margin-bottom: 6px;">How to Add a new settlement</div>
            <ul style="padding-left: 0; margin: 0; list-style: none;">
              <li style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 2px;">
                <el-icon :size="14" style="margin-top: 2px; color: #67c23a;"><Check /></el-icon>
                <span>Select the <strong>County</strong> where the settlement is located.</span>
              </li>
              <li style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 2px;">
                <el-icon :size="14" style="margin-top: 2px; color: #67c23a;"><Check /></el-icon>
                <span>Then select the <strong>Ward</strong>; this determines which ward boundary will load on the map.</span>
              </li>
              <li style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 2px;">
                <el-icon :size="14" style="margin-top: 2px; color: #409eff;"><ArrowRight /></el-icon>
                <span>After you pick a ward, the wizard will automatically move to the map step so you can draw or place the settlement inside the selected ward.</span>
              </li>
              <li style="display: flex; align-items: flex-start; gap: 6px;">
                <el-icon :size="14" style="margin-top: 2px; color: #909399;"><Edit /></el-icon>
                <span>After you finish drawing, the detailed settlement form will open in the side drawer.</span>
              </li>
            </ul>
          </div>
        </el-form>
      </div>

      <!-- Step 2: Map with Drawing Tools -->
      <div v-show="currentStep === 1" class="step-content map-step">
        <el-alert
          v-if="mapError"
          type="error"
          :title="mapError"
          show-icon
          :closable="false"
          class="mb-8px"
        >
          <el-button size="small" type="primary" plain @click="retryMapLoad">Retry map</el-button>
        </el-alert>
        <div v-if="mapLoading" class="map-status-banner">Loading map…</div>
        <div v-else-if="isDrawingMode" class="map-status-banner map-status-banner--drawing">
          Drawing: {{ drawPointCount }} point{{ drawPointCount === 1 ? '' : 's' }} — click to add corners, double-click to finish
        </div>
        <div v-else-if="overtureBuildingCount != null && overtureBuildingCount > 0" class="map-status-banner map-status-banner--overture">
          Overture: {{ overtureBuildingCount }} building{{ overtureBuildingCount === 1 ? '' : 's' }} (cyan) · Ward neighbors in pink
        </div>
        <div v-else-if="drawReady" class="map-status-banner map-status-banner--ready">Map ready — click Draw, then outline the settlement on the map</div>
        <div ref="mapContainer" class="map-container"></div>
      </div>
    </el-card>

    <!-- Step 3: Form Drawer (opens after drawing polygon or clicking existing polygon) -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEditMode ? 'Edit Settlement Details' : 'New Settlement Details'"
      :size="isMobile ? '100%' : '720px'"
      direction="rtl"
      :before-close="closeDrawer"
      :append-to-body="true"
      class="settlement-form-drawer"
    >
      <el-form
        ref="formRef"
        :model="settlementForm"
        :rules="formRules"
        label-width="180px"
        label-position="left"
      >
        <el-collapse v-model="activeFormSection" accordion>
          <!-- 1. Basic Information -->
          <el-collapse-item name="basic">
            <template #title>
              <div :class="['section-header', getSectionStatusClass('basic')]">
                Basic Information
              </div>
            </template>

            <el-form-item label="Settlement Name" prop="name">
              <el-input v-model="settlementForm.name" placeholder="Enter settlement name" />
            </el-form-item>

            <el-form-item label="Settlement Type" prop="settlement_type">
              <el-select v-model="settlementForm.settlement_type" placeholder="Select settlement type" filterable style="width: 100%">
                <el-option
                  v-for="item in settlementTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Area (Hectares)">
              <el-input-number v-model="settlementForm.area" :min="0" :precision="4" style="width: 100%" :disabled="true" />
              <div style="font-size: 12px; color: #909399; margin-top: 5px;">
                Area is automatically calculated from the drawn boundary
              </div>
            </el-form-item>

            <el-form-item label="Population">
              <el-input-number v-model="settlementForm.population" :min="0" style="width: 100%" />
              <div class="population-estimate-block">
                <el-button
                  type="primary"
                  plain
                  class="population-estimate-btn"
                  @click.stop="onManualPopulationFetch"
                  :loading="populationLoading || overtureBuildingsLoading"
                  :disabled="(!settlementForm.geom && !settlementGeometry) || populationLoading || overtureBuildingsLoading"
                >
                  Click to estimate population
                </el-button>
                <div v-if="overtureBuildingCount != null" class="population-overture-hint">
                  Overture building footprints: {{ overtureBuildingCount }}
                  <span v-if="overtureBuildingsLoading"> (loading…)</span>
                </div>
                <div class="population-help-row">
                  <el-popover placement="right" :width="360" trigger="hover">
                    <template #default>
                      <div class="vulnerability-help-popover">
                        <p class="text-sm font-medium mb-2">Population is estimated from buildings inside the boundary.</p>
                        <ul class="text-xs space-y-2">
                          <li><strong>Primary — Overture Maps</strong> — Building footprints from Overture are counted and shown in cyan on the map.</li>
                          <li><strong>Fallback — Open Buildings</strong> — If Overture finds none, point counts from Google Open Buildings are used.</li>
                          <li><strong>Formula</strong> — <em>population = buildings × persons per building</em> (ward average household size when available).</li>
                        </ul>
                        <p class="text-xs mt-2 text-gray-500">In edit mode, population is not auto-estimated — use the button above. After save, Overture footprints can be imported as structure records.</p>
                      </div>
                    </template>
                    <template #reference>
                      <el-icon class="cursor-help text-gray-500" :size="16"><QuestionFilled /></el-icon>
                    </template>
                  </el-popover>
                </div>
              </div>
            </el-form-item>

            <el-form-item label="Male population">
              <el-input-number v-model="settlementForm.pop_male" :min="0" style="width: 100%" />
            </el-form-item>

            <el-form-item label="Female population">
              <el-input-number v-model="settlementForm.pop_female" :min="0" style="width: 100%" />
              <div style="font-size: 12px; color: #909399; margin-top: 5px;">
                Optional. When population is estimated, male and female are split using the selected county's census sex ratio.
              </div>
            </el-form-item>

            <el-form-item label="Description">
              <el-input v-model="settlementForm.description" type="textarea" :rows="3" placeholder="Enter description" />
            </el-form-item>
          </el-collapse-item>

          <!-- 2. Location -->
          <el-collapse-item name="location">
            <template #title>
              <div :class="['section-header', getSectionStatusClass('location')]">
                Location
              </div>
            </template>

        <el-form-item label="County" prop="county_id">
          <el-select
            v-model="settlementForm.county_id"
            :placeholder="countiesLoading ? 'Loading counties...' : 'Select County'"
            filterable
            clearable
            :loading="countiesLoading"
            :disabled="isCountyRestricted || countiesLoading"
            @change="handleDrawerCountyChange"
            style="width: 100%"
          >
            <el-option
              v-for="item in filteredCountyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div v-if="isCountyRestricted" style="font-size: 12px; color: #909399; margin-top: 5px;">
            You are restricted to your assigned county
          </div>
        </el-form-item>

        <el-form-item label="Ward" prop="ward_id">
          <el-select
            v-model="settlementForm.ward_id"
            :placeholder="wardsLoading ? 'Loading wards...' : (!settlementForm.county_id ? 'Select county first' : 'Select Ward')"
            filterable
            clearable
            :disabled="!settlementForm.county_id || wardsLoading"
            :loading="wardsLoading"
            @change="handleDrawerWardChange"
            style="width: 100%"
          >
            <el-option
              v-for="item in filteredWards"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>


        <el-form-item label="Subcounty">
          <el-input :model-value="subcountyDisplayName" disabled placeholder="Auto-inferred from ward" style="width: 100%" />
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            Automatically determined from the selected ward
          </div>
        </el-form-item>
          </el-collapse-item>

          <!-- 3. Parcel Information -->
          <el-collapse-item name="parcel">
            <template #title>
              <div :class="['section-header', getSectionStatusClass('parcel')]">
                Parcel Information
              </div>
            </template>

        <el-form-item label="Parcel Number">
          <el-input v-model="settlementForm.parcel_no" placeholder="Enter parcel number" />
        </el-form-item>

        <el-form-item label="Parcel Owner">
          <el-input v-model="settlementForm.parcel_owner" placeholder="Enter parcel owner name" />
        </el-form-item>

        <el-form-item label="Parcel Owner Type">
          <el-select v-model="settlementForm.parcel_owner_type" placeholder="Select parcel owner type" filterable style="width: 100%">
            <el-option
              v-for="item in parcelOwnerTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="RIM/Survey Plan">
          <el-input v-model="settlementForm.rim_no" placeholder="Enter RIM/Survey Plan number" />
        </el-form-item>

        <el-form-item label="Planning Status">
          <el-radio-group v-model="settlementForm.planning_status">
            <el-radio
              v-for="item in planningStatusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Survey Status">
          <el-radio-group
            v-model="settlementForm.survey_status"
            :disabled="!settlementForm.planning_status"
          >
            <el-radio
              v-for="item in availableSurveyStatusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
          <div
            v-if="settlementForm.planning_status === 'Unplanned'"
            style="margin-top: 6px; color: var(--el-text-color-secondary); font-size: 12px;"
          >
            Unplanned settlements cannot be surveyed.
          </div>
          <div
            v-else-if="!settlementForm.planning_status"
            style="margin-top: 6px; color: var(--el-text-color-secondary); font-size: 12px;"
          >
            Select planning status first.
          </div>
        </el-form-item>
          </el-collapse-item>

          <!-- 4. Physical Characteristics -->
          <el-collapse-item name="physical">
            <template #title>
              <div :class="['section-header', getSectionStatusClass('physical')]">
                Physical Characteristics
              </div>
            </template>

        <el-form-item label="Pre-Dominant Landuse">
          <el-select 
            v-model="settlementForm.landuse" 
            placeholder="Select landuse" 
            filterable 
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="item in landuseOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <template #label>
            <span class="inline-flex items-center gap-1">
              Density Typology
              <el-popover placement="right" :width="420" trigger="hover">
                <template #default>
                  <div class="vulnerability-help-popover">
                    <p class="text-sm font-medium mb-2">
                      Density-based slum typology per the
                      <em>National Slum Upgrading and Prevention Strategy 2024 - 2034</em>.
                      Categorisation is informed by the built-up ratio
                      (built-up area / total settlement area):
                    </p>
                    <ul class="text-xs space-y-2">
                      <li><strong>Low Density</strong> — built-up ratio &lt; 60%. Densely configured structures mostly found in small urban areas and market centres. Ample potential for in-situ upgrading.</li>
                      <li><strong>Medium Density</strong> — built-up ratio 60% - 80%. Densely configured structures mostly found in medium-sized urban areas and municipalities. Some potential for in-situ upgrading.</li>
                      <li><strong>High Density</strong> — built-up ratio &gt; 80%. Found in major urban areas (e.g. Nairobi, Mombasa, Nakuru, Kisumu), mainly in old inner-city areas. In-situ upgrading is challenged by limited servicing space (drainage, water, sewerage) and contested tenure between structure owners and the predominant tenant population.</li>
                    </ul>
                  </div>
                </template>
                <template #reference>
                  <el-icon class="cursor-help text-gray-500" :size="14"><QuestionFilled /></el-icon>
                </template>
              </el-popover>
            </span>
          </template>
          <el-select
            v-model="settlementForm.density_typology"
            placeholder="Select density typology"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in densityTypologyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="On Utility Way-leave?">
          <el-select v-model="settlementForm.on_wayleave" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="On Road Reserve?">
          <el-select v-model="settlementForm.on_road_reserve" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Types of Structures">
          <el-checkbox-group v-model="settlementForm.structure_types">
            <el-checkbox
              v-for="item in structureTypesOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="Level of Development">
          <el-checkbox-group v-model="settlementForm.development">
            <el-checkbox
              v-for="item in levelDevtOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="Typical Building Materials">
          <el-checkbox-group v-model="settlementForm.typical_building_materials">
            <el-checkbox
              v-for="item in buildingMaterialsOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="Distance Between Structures (M)">
          <el-input-number v-model="settlementForm.avg_dist_between" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Distance to Urban Center (Km)">
          <el-input-number v-model="settlementForm.dist_town" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Distance to Trunk Road (Km)">
          <el-input-number v-model="settlementForm.dist_trunk" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Electricity Availability">
          <el-select v-model="settlementForm.electricity_availability" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Piped Water Availability">
          <el-select v-model="settlementForm.piped_water_availability" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
          </el-collapse-item>

          <!-- 5. Socio-Economic Information -->
          <el-collapse-item name="socio">
            <template #title>
              <div :class="['section-header', getSectionStatusClass('socio')]">
                Socio-Economic Information
              </div>
            </template>

        <el-form-item label="Court Cases/Claims?">
          <el-select v-model="settlementForm.encumbrance" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoUnknownOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Number of Households">
          <el-input-number v-model="settlementForm.num_households" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Average Household Size">
          <el-input-number v-model="settlementForm.avg_household_size" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Median Household Income">
          <el-input-number v-model="settlementForm.median_household_income" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Plot Ownership Ratio">
          <el-input-number v-model="settlementForm.plot_ownership_ratio" :min="0" :max="1" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Plot Tenant Ratio">
          <el-input-number v-model="settlementForm.plot_tenant_ratio" :min="0" :max="1" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Average Rent">
          <el-input-number v-model="settlementForm.avg_rent" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Main Environmental Hazards">
          <el-input v-model="settlementForm.main_env_hazards" type="textarea" :rows="3" placeholder="Enter environmental hazards" />
        </el-form-item>

        <el-form-item label="General Location">
          <el-input v-model="settlementForm.general_location" placeholder="Enter general location" />
        </el-form-item>
          </el-collapse-item>

          <!-- 6. Vulnerability & Profiling -->
          <el-collapse-item name="vulnerability">
            <template #title>
              <div :class="['section-header', getSectionStatusClass('vulnerability')]">
                Vulnerability & Profiling
              </div>
            </template>

        <el-divider content-position="left">
          <span class="inline-flex items-center gap-1">
            Vulnerability Assessment
            <el-popover placement="right" :width="420" trigger="hover">
              <template #default>
                <div class="vulnerability-help-popover">
                  <p class="text-sm font-medium mb-2">Each attribute contributes to the vulnerability score (KISIP Tool A). Below are simple explanations for each region type:</p>
                  <ul class="text-xs space-y-2">
                    <li>
                      <strong>Region</strong> — Köppen climate classification with simple descriptions:
                      <ul class="mt-1 ml-4 list-disc space-y-1">
                        <li><strong>Af</strong> – Tropical rainforest: hot and wet all year.</li>
                        <li><strong>Am</strong> – Tropical monsoon: very wet season, short dry season.</li>
                        <li><strong>Aw</strong> – Tropical savanna: hot with distinct wet and dry seasons.</li>
                        <li><strong>BSh</strong> – Hot semi‑arid: very hot and quite dry.</li>
                        <li><strong>BSk</strong> – Cold semi‑arid: dry with colder winters.</li>
                        <li><strong>BWh</strong> – Hot desert: extremely hot and very dry.</li>
                        <li><strong>Cfa</strong> – Humid subtropical: hot, humid summers and mild winters.</li>
                        <li><strong>Cfb</strong> – Marine west coast: mild and wet most of the year.</li>
                        <li><strong>Csb</strong> – Warm‑summer Mediterranean: warm, dry summers and mild, wetter winters.</li>
                        <li><strong>Cwa</strong> – Monsoon‑influenced subtropical: hot, wet summers and cool, drier winters.</li>
                        <li><strong>Cwb</strong> – Subtropical highland: cooler due to altitude with wet summers and dry winters.</li>
                      </ul>
                      <div class="mt-1">
                        Options in the dropdown: {{ (vulnerabilityOptions.climate_region || []).map(o => o.label).join(', ') || '—' }}
                      </div>
                    </li>
                    <li><strong>Soil Type</strong> — Affects erosion and drainage. Options: {{ (vulnerabilityOptions.soil_type || []).map(o => o.label).join(', ') || '—' }}</li>
                    <li><strong>Land Cover</strong> — Surface type affecting runoff. Options: {{ (vulnerabilityOptions.land_cover || []).map(o => o.label).join(', ') || '—' }}</li>
                    <li><strong>Altitude Range (m)</strong> — Elevation bands. Options: {{ (vulnerabilityOptions.altitude_range || []).map(o => o.label).join(', ') || '—' }}</li>
                    <li><strong>Proximity to River (m)</strong> — Distance to nearest river. Options: {{ (vulnerabilityOptions.proximity_to_river || []).map(o => o.label).join(', ') || '—' }}</li>
                    <li><strong>Proximity to Flood Plain (m)</strong> — Distance to flood plain. Options: {{ (vulnerabilityOptions.proximity_to_flood_plain || []).map(o => o.label).join(', ') || '—' }}</li>
                  </ul>
                  <p class="text-xs mt-2 text-gray-500">Fill all 6 to compute the score. Ratings: LOW (green), MEDIUM (amber), HIGH (red).</p>
                </div>
              </template>
              <template #reference>
                <el-icon class="cursor-help text-gray-500" :size="16"><QuestionFilled /></el-icon>
              </template>
            </el-popover>
          </span>
        </el-divider>

        <div class="mb-3">
          <el-button
            type="success"
            plain
            size="small"
            @click.stop="onManualClimateFetch"
            :loading="climateLoading"
            :disabled="(!settlementForm.geom && !settlementGeometry) || climateLoading"
          >
            Click to Auto-fill vulnerability from climate data
          </el-button>
        </div>

        <el-form-item label="Region" prop="climate_region" required>
          <el-select v-model="settlementForm.climate_region" placeholder="Select region" filterable clearable style="width: 100%">
            <el-option
              v-for="item in vulnerabilityOptions.climate_region"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Soil Type" prop="soil_type" required>
          <el-select v-model="settlementForm.soil_type" placeholder="Select soil type" filterable clearable style="width: 100%">
            <el-option
              v-for="item in vulnerabilityOptions.soil_type"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Land Cover" prop="land_cover" required>
          <el-select v-model="settlementForm.land_cover" placeholder="Select land cover" filterable clearable style="width: 100%">
            <el-option
              v-for="item in vulnerabilityOptions.land_cover"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Altitude Range (m)" prop="altitude_range" required>
          <el-select v-model="settlementForm.altitude_range" placeholder="Select altitude range" filterable clearable style="width: 100%">
            <el-option
              v-for="item in vulnerabilityOptions.altitude_range"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Proximity to River (m)" prop="proximity_to_river" required>
          <el-select v-model="settlementForm.proximity_to_river" placeholder="Select proximity to river" filterable clearable style="width: 100%">
            <el-option
              v-for="item in vulnerabilityOptions.proximity_to_river"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Proximity to Flood Plain (m)" prop="proximity_to_flood_plain" required>
          <el-select v-model="settlementForm.proximity_to_flood_plain" placeholder="Select proximity to flood plain" filterable clearable style="width: 100%">
            <el-option
              v-for="item in vulnerabilityOptions.proximity_to_flood_plain"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Vulnerability Score">
          <template v-if="computedScore || settlementForm.vulnerability_total_score != null">
            <div class="vulnerability-score-display" :class="`rating-${(computedScore?.rating ?? settlementForm.vulnerability_rating)?.toLowerCase()}`">
              <el-input :model-value="String(computedScore?.total_score ?? settlementForm.vulnerability_total_score ?? '—')" disabled style="width: 80px; margin-right: 8px" />
              <el-tag
                v-if="(computedScore?.rating ?? settlementForm.vulnerability_rating)"
                :type="vulnerabilityRatingType"
                size="small"
              >
                {{ computedScore?.rating ?? settlementForm.vulnerability_rating }}
              </el-tag>
            </div>
          </template>
          <span v-else style="font-size: 13px; color: #909399;">Fill all 6 attributes above to compute</span>
        </el-form-item>

        <el-form-item label="Profiling Status">
          <el-select v-model="settlementForm.profiling_status" placeholder="Select profiling status">
            <el-option label="Not Profiled" value="NOT_PROFILED" />
            <el-option label="Partially Profiled" value="PARTIALLY_PROFILED" />
            <el-option label="Profiled" value="PROFILED" />
          </el-select>
        </el-form-item>

        <el-form-item label="Qualified">
          <el-select v-model="settlementForm.is_qualified" placeholder="Select qualification status">
            <el-option label="Yes" :value="true" />
            <el-option label="No" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item label="Comments/Remarks">
          <el-input v-model="settlementForm.comments" type="textarea" :rows="3" placeholder="Enter comments" />
        </el-form-item>
        </el-collapse-item>
        </el-collapse>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <div v-if="isEditMode" class="drawer-footer-options">
            <el-checkbox v-model="updateStructuresFromOverture">
              Replace all structures with Overture building footprints
            </el-checkbox>
            <div class="drawer-footer-hint">
              When checked, existing structures for this settlement are removed and replaced from the current boundary.
            </div>
          </div>
          <div class="drawer-footer-actions">
            <el-button @click="closeDrawer" :disabled="isSaving">Cancel</el-button>
            <el-button
              type="primary"
              native-type="button"
              :loading="isSaving"
              :disabled="isSaving"
              @click="submitForm"
              :icon="Check"
            >
              {{ isSaving ? (isEditMode ? 'Updating…' : 'Saving…') : (isEditMode ? 'Update Settlement' : 'Save Settlement') }}
            </el-button>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- Fly to coordinates dialog -->
    <el-dialog
      v-model="flyDialogVisible"
      title="Fly to Coordinates"
      width="360px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="flyToCoordsInput"
        placeholder="Enter lat, lon (e.g., -1.2921, 36.8219)"
        clearable
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="flyDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="flyToCoordinates">Fly</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Upload Dialog -->
    <el-dialog 
      v-model="showUploadDialog" 
      title="Upload GeoJSON/Shapefile/KML/KMZ" 
      :width="isMobile ? '90%' : '400px'"
      :close-on-click-modal="false"
      class="upload-dialog">
      <el-upload
        v-model:file-list="fileList"
        class="upload-demo"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
        :auto-upload="false"
        :show-file-list="true"
        :on-change="handleUploadGeo"
        :limit="1">
        <template #trigger>
          <el-button type="primary" :size="isMobile ? 'default' : 'default'" class="upload-select-button">
            <el-icon><UploadFilled /></el-icon>
            <span class="upload-button-text">Select File</span>
          </el-button>
        </template>
        <template #tip>
          <div class="el-upload__tip">
            Supported formats: GeoJSON (.geojson, .json), Shapefile (.zip), KML (.kml), KMZ (.kmz)
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false" :size="isMobile ? 'default' : 'default'">Close</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.vulnerability-score-display {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 4px solid #e4e7ed;
  background: #fafafa;
}

.vulnerability-score-display.rating-high {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.vulnerability-score-display.rating-medium {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.vulnerability-score-display.rating-low {
  border-left-color: #67c23a;
  background: #f0f9eb;
}

.vulnerability-help-popover ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.vulnerability-help-popover li {
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}
.vulnerability-help-popover li:last-child {
  border-bottom: none;
}

.add-settlement-container {
  padding: 8px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  position: relative;
}

.back-button {
  flex: 0 0 auto;
  min-width: fit-content;
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  min-width: fit-content;
  position: relative;
  z-index: 1;
}

/* Desktop: button with icon and text */
.draw-button,
.delete-button,
.upload-button {
  min-width: auto;
  width: auto;
  height: auto;
  padding: 5px 12px;
  border-radius: 4px;
  position: relative;
  z-index: 2;
  cursor: pointer;
}

.draw-button .draw-text,
.delete-button .delete-text,
.upload-button .upload-text {
  display: inline;
  margin-left: 4px;
  pointer-events: none;
}

/* Desktop: ensure text is visible */
@media (min-width: 769px) {
  .draw-button,
  .delete-button,
  .upload-button {
    min-width: auto;
    width: auto;
    height: auto;
    padding: 5px 12px;
    border-radius: 4px;
  }
  
  .draw-button .draw-text,
  .delete-button .delete-text,
  .upload-button .upload-text {
    display: inline;
    margin-left: 4px;
  }
}

/* Reduce el-card header padding */
:deep(.el-card__header) {
  padding: 12px 16px;
}

.step-content {
  padding: 12px 0;
  min-height: 400px;
}

.map-step {
  position: relative;
  padding: 0;
  margin: 0;
}

/* Card body padding */
:deep(.el-card__body) {
  padding: 16px;
}

/* When map step is active, set body padding to 8px */
.add-settlement-container:has(.map-step) :deep(.el-card__body) {
  padding: 8px;
}

.map-container {
  width: 100%;
  height: calc(67vh);
  min-height: 60vh;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  position: relative;
}

.map-status-banner {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.map-status-banner--ready {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.map-status-banner--drawing {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* Ensure Google Maps drawing controls are visible */
:deep(.gmnoprint) {
  z-index: 1000 !important;
}

:deep(.gm-style .gmnoprint) {
  z-index: 1000 !important;
}

/* Customize default Google Maps map type control */
.map-container :deep(.gm-style-mtc) {
  font-size: 12px !important;
}

.map-container :deep(.gm-style-mtc button) {
  font-size: 12px !important;
  padding: 4px 8px !important;
  line-height: 1.2 !important;
}

/* The *second-level* dropdown/list items: "Satellite", "Terrain", etc */
.map-container :deep(.gm-style .gm-style-mtc [role="menu"] [role="menuitem"]),
.map-container :deep(.gm-style .gm-style-mtc [role="menuitem"]) {
  font-size: 12px !important;
  line-height: 1.2 !important;
}

.map-container :deep(.gm-style-mtc div) {
  font-size: 12px !important;
}

/* Customize labels menu dropdown */
.map-container :deep(.gm-style-mtc-bubble) {
  font-size: 11px !important;
}

.map-container :deep(.gm-style-mtc-bubble div) {
  font-size: 11px !important;
}

.map-container :deep(.gm-style-mtc-bubble button) {
  font-size: 11px !important;
  padding: 4px 8px !important;
  line-height: 1.2 !important;
}

.map-container :deep(.gm-style-mtc-bubble-content) {
  font-size: 11px !important;
}

.map-container :deep(.gm-style-mtc-bubble-content div) {
  font-size: 11px !important;
}

.map-container :deep(.gm-style-mtc-bubble-content button) {
  font-size: 11px !important;
  padding: 4px 8px !important;
}

.drawer-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  pointer-events: auto;
}

:deep(.settlement-form-drawer .el-drawer__footer) {
  padding: 0;
  position: relative;
  z-index: 20;
  flex-shrink: 0;
}

:deep(.settlement-form-drawer .el-drawer__body) {
  overflow-y: auto;
}

.drawer-footer-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.drawer-footer-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.drawer-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.population-estimate-block {
  margin-top: 8px;
  width: 100%;
}

.population-estimate-btn {
  width: 100%;
}

.population-overture-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.population-help-row {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
}

.section-header {
  font-weight: 500;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header--full {
  color: #67c23a;
}

.section-header--partial {
  color: #e6a23c;
}

.section-header--none {
  color: #f56c6c;
}

/* Ensure drawer is visible on mobile */
:deep(.el-drawer) {
  z-index: 3000 !important;
}

:deep(.el-drawer__wrapper) {
  z-index: 3000 !important;
}

/* Upload Dialog Styles */
.upload-dialog {
  max-width: 100%;
}

.upload-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.upload-select-button {
  width: 100%;
  justify-content: center;
}

.upload-button-text {
  margin-left: 6px;
}

.upload-demo :deep(.el-upload) {
  width: 100%;
}

.upload-demo :deep(.el-upload-dragger) {
  width: 100%;
}

.upload-demo :deep(.el-upload__tip) {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .add-settlement-container {
    padding: 6px;
  }

  .header-content {
    gap: 4px;
  }

  .header-title {
    font-size: 14px;
  }

  .back-button {
    font-size: 12px;
    padding: 4px 8px;
  }

  .draw-button,
  .delete-button,
  .upload-button {
    min-width: 32px;
    width: 32px;
    height: 32px;
    padding: 0;
    position: relative;
    z-index: 2;
    cursor: pointer;
  }
  
  .draw-button .draw-text,
  .delete-button .delete-text,
  .upload-button .upload-text {
    display: none;
    pointer-events: none;
  }

  :deep(.el-card__header) {
    padding: 8px 12px;
  }

  .map-container {
    height: calc(67vh);
    min-height: 60vh;
  }

  .step-content {
    padding: 8px 0;
    min-height: 300px;
  }

  /* Upload Dialog Mobile Styles */
  .upload-dialog :deep(.el-dialog) {
    margin: 5vh auto !important;
    max-width: 90% !important;
  }

  .upload-dialog :deep(.el-dialog__header) {
    padding: 15px 15px 10px;
  }

  .upload-dialog :deep(.el-dialog__title) {
    font-size: 16px;
    line-height: 1.4;
  }

  .upload-dialog :deep(.el-dialog__body) {
    padding: 15px;
  }

  .upload-dialog :deep(.el-dialog__footer) {
    padding: 10px 15px;
  }

  .upload-select-button {
    width: 100%;
    padding: 10px 16px;
    font-size: 14px;
  }

  .upload-button-text {
    margin-left: 6px;
  }

  .upload-demo :deep(.el-upload__tip) {
    font-size: 11px;
    margin-top: 10px;
    padding: 0 4px;
  }

  .upload-demo :deep(.el-upload-list) {
    margin-top: 10px;
  }

  .upload-demo :deep(.el-upload-list__item) {
    margin-top: 8px;
  }

  /* Map type control mobile styles */
  .map-container :deep(.gm-style-mtc) {
    font-size: 10px !important;
  }

  .map-container :deep(.gm-style-mtc button) {
    font-size: 10px !important;
    padding: 3px 6px !important;
  }

  .map-container :deep(.gm-style-mtc div) {
    font-size: 10px !important;
  }

  /* Labels menu mobile styles */
  .map-container :deep(.gm-style-mtc-bubble) {
    font-size: 10px !important;
  }

  .map-container :deep(.gm-style-mtc-bubble div) {
    font-size: 10px !important;
  }

  .map-container :deep(.gm-style-mtc-bubble button) {
    font-size: 10px !important;
    padding: 3px 6px !important;
  }

  .map-container :deep(.gm-style-mtc-bubble-content) {
    font-size: 10px !important;
  }

  .map-container :deep(.gm-style-mtc-bubble-content div) {
    font-size: 10px !important;
  }

  .map-container :deep(.gm-style-mtc-bubble-content button) {
    font-size: 10px !important;
    padding: 3px 6px !important;
  }

  /* Ensure drawer is visible and properly sized on mobile */
  :deep(.el-drawer) {
    z-index: 3000 !important;
    width: 100% !important;
  }

  :deep(.el-drawer__wrapper) {
    z-index: 3000 !important;
  }

  .drawer-footer {
    padding: 15px;
  }
}
</style>
