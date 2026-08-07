<script setup lang="ts">
import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
// @ts-nocheck
import { ref, reactive, nextTick, computed, onMounted } from 'vue'
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
  ElDialog,
  ElDrawer,
  ElMessage,
  ElRow,
  ElCol,
  ElDivider,
  ElDatePicker,
  ElAlert
} from 'element-plus'
import { ArrowLeft, Plus, Delete, Check, Edit ,Minus, AddLocation } from '@element-plus/icons-vue'
import * as turf from '@turf/turf'
import { GOOGLE_MAPS_API_KEY as googleMapsApiKey } from '@/config/googleMaps'
import { getOneGeo, CreateRecord, getSettlementMapData, updateOneRecord, getSettlementsWithBoundaryGeometry } from '@/api/settlements'
import { 
  countyOptions, 
  settlementOptionsV2,
  LevelOptions,
  regOptions,
  HCFTypeOptions,
  RdClassOptions
} from './common/index'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const isMobile = computed(() => appStore.getMobile)

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

const userSettlementRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'settlement'
  )
})

const userSettlementId = computed(() => {
  return userSettlementRole.value?.user_roles?.settlement_id || null
})

const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

const filteredCountyOptions = computed(() => {
  if (!isCountyRestricted.value || !userCountyId.value) {
    return countyOptions.value || []
  }
  return (countyOptions.value || []).filter((county: any) => 
    county.value === userCountyId.value
  )
})

const router = useRouter()
const route = useRoute()

// Facility type options
const facilityTypes = [
  { label: 'Health Facility', value: 'health', model: 'health_facility', geometryType: 'point' },
  { label: 'School/Education', value: 'education', model: 'education_facility', geometryType: 'point' },
  { label: 'Water Point', value: 'water', model: 'water_point', geometryType: 'point' },
  { label: 'Piped Water', value: 'pipedwater', model: 'piped_water', geometryType: 'line' },
  { label: 'Sewer', value: 'sewer', model: 'sewer', geometryType: 'line' },
  { label: 'Road', value: 'road', model: 'road', geometryType: 'line' },
  { label: 'Railway', value: 'railway', model: 'railway', geometryType: 'line' },
  { label: 'Powerline', value: 'powerline', model: 'powerline', geometryType: 'line' },
  { label: 'Stream', value: 'stream', model: 'stream', geometryType: 'line' },
  { label: 'Police Station', value: 'police', model: 'police_station', geometryType: 'point' },
  { label: 'Community Hall', value: 'communityhall', model: 'community_hall', geometryType: 'point' },
  { label: 'Crime Hotspot', value: 'crimehotspot', model: 'crime_hotspot', geometryType: 'point' },
  { label: 'Dumping Site', value: 'dumpingsite', model: 'dumping_site', geometryType: 'point' },
  { label: 'Floodlight', value: 'floodlight', model: 'floodlight', geometryType: 'point' },
  { label: 'Street Light', value: 'streetlight', model: 'streetlight', geometryType: 'point' },
  { label: 'Mast/Telecommunication', value: 'mast', model: 'mast', geometryType: 'point' },
  { label: 'Road Asset', value: 'roadasset', model: 'road_asset', geometryType: 'point' },
  { label: 'Hazard Zone', value: 'hazardzone', model: 'hazard_zone', geometryType: 'point' },
  { label: 'Other Facility', value: 'other', model: 'other_facility', geometryType: 'point' }
]

// Computed property to check if selected facility type uses lines
const isLineFacility = computed(() => {
  const facilityType = facilityTypes.find(f => f.value === selectedFacilityType.value)
  return facilityType?.geometryType === 'line'
})

// Computed property to filter facility types based on current geometry
const filteredFacilityTypes = computed(() => {
  // If no geometry is placed, show all types
  if (!facilityMarker.value && !facilityPolyline.value && !facilityForm.geom) {
    return facilityTypes
  }
  
  // If a point marker is placed, only show point facilities
  if (facilityMarker.value || (facilityForm.geom && facilityForm.geom.type === 'Point')) {
    return facilityTypes.filter(f => f.geometryType === 'point')
  }
  
  // If a line is drawn, only show line facilities
  if (facilityPolyline.value || (facilityForm.geom && (facilityForm.geom.type === 'LineString' || facilityForm.geom.type === 'MultiLineString'))) {
    return facilityTypes.filter(f => f.geometryType === 'line')
  }
  
  return facilityTypes
})

// Step management
const currentStep = ref(0)
const steps = [
  { title: 'Settlement', description: '' },
  { title: 'Mark on Map', description: '' }
]

// Step 1: Settlement Selection
const selectedCounty = ref<any>(null)
const selectedSettlement = ref<any>(null)
const filteredSettlements = ref<any[]>([])
const checkingGeometry = ref(false)
const settlementGeometryCache = ref<Map<number, boolean>>(new Map())

// Step 2: Map
const map = ref<any>(null)
const settlementPolygon = ref<any>(null)
const facilityMarker = ref<any>(null)
const facilityPolyline = ref<any>(null) // For line facilities
const drawingManager = ref<any>(null) // For line drawing
const existingFacilityMarkers = ref<Map<number, any>>(new Map())
const existingFacilityPolylines = ref<Map<number, any>>(new Map())
const settlementGeo = ref<any>(null)
const facilityGeometry = ref<any>(null)
const mapContainer = ref<HTMLDivElement | null>(null)
const markerPlacementMode = ref(false)
const lineDrawingMode = ref(false)
const mapClickListener = ref<any>(null)

// Fly to coordinates state
const flyDialogVisible = ref(false)
const flyToCoordsInput = ref('')
const flyMarker = ref<any>(null)

// Drawer state
const drawerVisible = ref(false)
const selectedFacilityType = ref<string>('')
const formRef = ref<FormInstance>()

// Editing state
const isEditingMode = ref(false)
const editingFacilityId = ref<number | null>(null)
const editingFacilityModel = ref<string>('')

// Unified form with all fields
const facilityForm = reactive({
  // Common fields
  name: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  geom: null,
  area: null, // Area in square meters (for polygons)
  
  // Health Facility fields
  facility_number: '',
  level: '',
  registration_status: '',
  ownership_type: '',
  owner: '',
  land_ownership: '',
  land_title_available: '',
  land_parcel_size: null,
  condition: '',
  num_inpatient: null,
  outpatient_visits_per_day: null,
  maternity_deliveries_per_day: null,
  antenatal_immunizations_per_day: null,
  general_beds: null,
  maternity_beds: null,
  pediatric_beds: null,
  total_beds: null,
  occupancy_rate: null,
  number_doctors: null,
  number_clinical_officers: null,
  number_pharmacists: null,
  number_nurses: null,
  number_midwives: null,
  number_other_staff: null,
  services_offered: '',
  referral_destinations: '',
  referral_distance_km: null,
  referrals_per_day: null,
  has_ambulance: '',
  source_of_drugs: '',
  common_ailments: '',
  source_of_patients: '',
  challenges: '',
  respondent_name: '',
  respondent_phone: '',
  distance_meters: null,
  
  // Education fields
  registration_number: '',
  education_category: [],
  ownership_details: '',
  boarding_type: '',
  land_ownership_status: '',
  enrolled_boys_count: null,
  enrolled_girls_count: null,
  student_source: '',
  male_teachers_count: null,
  female_teachers_count: null,
  classroom_count: null,
  classroom_condition: '',
  boys_toilets_count: null,
  girls_toilets_count: null,
  handwashing_stations_count: null,
  toilet_condition: '',
  fees_paid_by_students: '',
  term_1_fees_amount: null,
  term_2_fees_amount: null,
  term_3_fees_amount: null,
  dropout_count: null,
  dropout_reasons: '',
  retention_efforts: '',
  retention_efforts_reasons: '',
  sanitary_pads_provision: '',
  sanitary_pads_provider: '',
  sanitary_pads_bins: '',
  teaching_aids_available: '',
  boreholes_count: null,
  water_tanks_count: null,
  permanent_classrooms_count: null,
  bom_teachers_count: null,
  compound_fence_status: '',
  school_challenges: '',
  parcel_has_title: '',
  parcel_size_hectares: null,
  efforts_for_student_retention: '',
  additional_comments: '',
  distance_in_meters: null,
  
  // Water Point fields
  type: '',
  capacity: '',
  depth: null,
  catchment: '',
  price: null,
  availability: '',
  name_of_provider: '',
  cost_of_20_litre_jerrican: null,
  
  // Piped Water fields
  number_connections: 0,
  
  // Sewer fields
  pipe_type: '',
  pipe_size: '',
  provider: '',
  provider_category: '',
  number_of_connections: 0,
  
  // Road fields
  rdNum: '',
  rdClass: '',
  rdReserve: 0,
  surfaceType: '',
  surfaceCondition: '',
  traffic: '',
  direction: '',
  drainage: '',
  drainageCondition: '',
  width: 0,
  length: null, // Computed length in meters
  
  // Other Facility fields
  type: '',

  // Railway fields
  number_of_tracks: null,
  reserve_width_m: null,
  traffic_railway: '',
  reserve_encroached: '',
  rail_tracks_condition: '',
  reserve_condition: '',
  
  // Powerline fields
  pl_phases: '',
  pl_type_of_supply: '',
  
  // Stream fields
  stream_width: null,
  
  // Police Station fields
  pc_type: '',
  pc_number_of_officers: null,
  pc_number_of_vehicles: null,
  pc_condition: '',
  
  // Community Hall fields
  community_hall_use: '',
  community_hall_usage_fee: null,
  community_hall_condition: '',
  community_hall_ownership: '',
  community_hall_owner: '',
  
  // Crime Hotspot fields
  ch_crime_type: '',
  ch_frequency: '',
  ch_crime_target: '',
  ch_offender_type: '',
  ch_time_of_day: '',
  ch_num_victims: null,
  
  // Dumping Site fields
  ds_type: '',
  ds_status: '',
  ds_type_of_waste: '',
  ds_year_established: null,
  
  // Floodlight fields
  floodlight_condition: '',
  floodlight_rating_watts: null,
  floodlight_height_meters: null,
  floodlight_date_installed: null,
  floodlight_sponsor_owner_type: '',
  floodlight_sponsor_owner: '',
  
  // Street Light fields
  streetlight_road_name: '',
  streetlight_type: '',
  streetlight_condition: '',
  
  // Mast fields
  mast_tc_type: '',
  mast_tc_condition: '',
  
  // Road Asset fields
  road_asset_type: '',
  road_asset_condition: '',
  road_id: null,
  
  // Hazard Zone fields
  hazard_zone_place_name: '',
  hazard_zone_hazard_type: '',
  hazard_zone_nature: '',
  hazard_zone_number_of_affected_persons: null,
  hazard_zone_frequency_of_occurrence: '',
  hazard_zone_damage_cost: null,
  hazard_zone_comment: ''
})

const formRules = reactive({
  name: [{ required: true, message: 'Facility name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }]
})

// Option arrays
const conditionOptions = [
  { value: 'Under construction ', label: 'Under construction ' },
  { value: 'Broken/not in use', label: 'Broken/not in use' },
  { value: 'Operational ', label: 'Operational ' },
  { value: 'Decomissioned', label: 'Decomissioned' }
]

const ownershipOptions = [
  { value: 'government', label: 'Government' },
  { value: 'ngo', label: 'CBO/NGO' },
  { value: 'individual', label: 'Individual' },
  { value: 'community', label: 'Community' }
]

const waterPointTypeOptions = [
  { value: 'kiosk', label: 'Water Kiosk' },
  { value: 'public_tap', label: 'Public Tap' },
  { value: 'borehole', label: 'Borehole' },
  { value: 'spring', label: 'Spring' },
  { value: 'well', label: 'Dug Well' }
]

const availabilityOptions = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Twice_a_week', label: 'Twice a week' },
  { value: 'Once_a_week', label: 'Once a week' },
  { value: 'Rarely', label: 'Rarely' }
]

const pipeTypeOptions = [
  { label: 'Plastic', value: 'plastic' },
  { label: 'Concrete', value: 'concrete' },
  { label: 'Cast-Iron', value: 'cast_iron' }
]

const surfaceTypeOptions = [
  { label: 'Asphalt', value: 'asphalt' },
  { label: 'Surface Dressing', value: 'surface_dressing' },
  { label: 'Gravel', value: 'gravel' },
  { label: 'Earth', value: 'earth' },
  { label: 'Jointed Concrete', value: 'concrete_jt' },
  { label: 'Concrete Blocks', value: 'concrete_bl' },
  { label: 'Reinforced Concrete', value: 'concrete_rein' },
  { label: 'Brick', value: 'brick' },
  { label: 'Cobble stone road', value: 'set_stone' },
  { label: 'Unimproved road with tyre tracks visible', value: 'track' },
  { label: 'Other(Rater to provide description and Photo)', value: 'other' }
]

const drainageTypeOptions = [
  { label: 'One Side', value: 'One Side' },
  { label: 'Both Sides', value: 'Both Sides' }
]

const trafficOptions = [
  { label: 'Busy', value: 'busy' },
  { label: 'Used', value: 'used' },
  { label: 'Rare', value: 'rare' }
]

const directionOptions = [
  { label: 'One Way', value: 'One Way' },
  { label: 'Two Way', value: 'Two Way' }
]

// Health Facility Options
const LevelOptionsLocal = LevelOptions || []
const regOptionsLocal = regOptions || [
  { label: 'Unregistered', value: 'unregistred' },
  { label: 'Registered', value: 'registered' },
  { label: 'Awaiting Registration', value: 'awaiting_registration' }
]
const HCFTypeOptionsLocal = HCFTypeOptions || []
const conditionFacilityOptions = [
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Critical', value: 'Critical' }
]
const yesNoOptions = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
  { label: "I don't know", value: 'unknown' }
]
const yesNoPlainOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
]
const tenancyOptions = [
  { label: 'Rented', value: 'rented' },
  { label: 'Owned', value: 'owned' }
]

// Education Facility Options
const categoryOptions = [
  { label: 'Pre-Primary 1 and 2 (PP1 and PP2)', value: 'pre_primary' },
  { label: 'Lower Primary (Grade 1-3 )', value: 'lower_primary' },
  { label: 'Upper Primary (Grade 4-6)', value: 'upper_primary' },
  { label: 'Junior School (Grade 7-9 )', value: 'junior_school' },
  { label: 'Senior School(Grade 10-12)', value: 'senior_school' },
  { label: 'Technical Vocational Education and Training(TVET)', value: 'tvet' }
]
const boardingTypeOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Boarding', value: 'boarding' },
  { label: 'Both', value: 'both' }
]

// Road Options
const RdClassOptionsLocal = RdClassOptions || []

// Railway Options
const railwayTrafficOptions = [
  { label: 'Busy', value: 'busy' },
  { label: 'Used', value: 'used' },
  { label: 'Rare', value: 'rare' }
]

const reserveConditionOptions = [
  { label: 'Fenced', value: 'Fenced ' },
  { label: 'Open', value: 'Open ' },
  { label: 'Bushy', value: 'Bushy ' },
  { label: 'Cleared', value: 'Cleared ' }
]

// Powerline Options
const powerlinePhaseOptions = [
  { label: 'Single phase', value: 'single' },
  { label: '3-Phase', value: '3-phase' }
]

const powerlineSupplyOptions = [
  { label: 'High Voltage', value: 'hv' },
  { label: 'Medium Voltage', value: 'mv' },
  { label: 'Low Voltage', value: 'lv' }
]

// Police Station Options
const policeTypeOptions = [
  { label: 'Police Post', value: 'police_post' },
  { label: 'Police Station', value: 'police_station' },
  { label: 'Chiefs Camp', value: 'chief_camp' }
]

// Crime Hotspot Options
const crimeTypeOptions = [
  { label: 'Theft', value: 'theft' },
  { label: 'Burglary', value: 'burglary' },
  { label: 'Mugging', value: 'mugging' },
  { label: 'Murder', value: 'murder' },
  { label: 'Assault', value: 'assault' },
  { label: 'Rape', value: 'rape' },
  { label: 'Child_Abduction', value: 'child_abduction' },
  { label: 'Child_Abuse', value: 'child_abuse' },
  { label: 'Terrorism', value: 'terrorism' },
  { label: 'Armed_Robbery', value: 'armed_robbery' }
]

const frequencyOptions = [
  { label: 'Always', value: 'Always' },
  { label: 'Very Often', value: 'Very_Often' },
  { label: 'Sometimes', value: 'Sometimes' },
  { label: 'Rarely', value: 'Rarely' }
]

const crimeTargetOptions = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Youth', value: 'youth' },
  { label: 'Children', value: 'children' },
  { label: 'People with Disability', value: 'pwd' },
  { label: 'The Elderly', value: 'elderly' }
]

const timeOfDayOptions = [
  { label: 'Morning', value: 'morning' },
  { label: 'During the Day', value: 'during_Day' },
  { label: 'Evening/Afternoon', value: 'evening' },
  { label: 'Late Night', value: 'late_night' }
]

// Dumping Site Options
const dumpingSiteTypeOptions = [
  { label: 'Official', value: 'official' },
  { label: 'Unofficial', value: 'unofficial' },
  { label: 'Temporary', value: 'temporary' }
]

const wasteTypeOptions = [
  { label: 'Domestic', value: 'domestic' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Medical', value: 'medical' },
  { label: 'Mixture of Wastes', value: 'mix' }
]

// Road Asset Options
const roadAssetTypeOptions = [
  { label: 'Bridge', value: 'Bridge' },
  { label: 'Culvert', value: 'Culvert' },
  { label: 'Bus Stop', value: 'Bus_Stop' },
  { label: 'Boda Shed', value: 'Boda_Shed' },
  { label: 'Streetlights', value: 'Streetlights ' }
]

// Hazard Zone Options
const hazardNatureOptions = [
  { label: 'Past/Current', value: 'Past' },
  { label: 'Potential', value: 'Potential' }
]

const hazardConditionOptions = [
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Critical', value: 'Critical' }
]

// Check if settlement has valid geometry (using cache)
const checkSettlementGeometry = async (settlementId: number): Promise<boolean> => {
  if (settlementGeometryCache.value.has(settlementId)) {
    return settlementGeometryCache.value.get(settlementId) || false
  }
  // This function is now only used for cache lookup
  // The actual checking is done via batch endpoint
  return false
}

// Handle county selection
const handleCountyChange = async (countyId: any) => {
  selectedSettlement.value = null
  filteredSettlements.value = []
  
  if (!countyId) return

  if (isCountyRestricted.value && userCountyId.value && countyId !== userCountyId.value) {
    ElMessage.error('You can only select facilities in your assigned county')
    selectedCounty.value = userCountyId.value
    return
  }

  checkingGeometry.value = true
  
  try {
    let countySettlements = (settlementOptionsV2.value || []).filter((item: any) => item.county_id === countyId)
    
    if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
      countySettlements = countySettlements.filter((item: any) => item.value === userSettlementId.value)
    }
    
    // Use batch endpoint to quickly get settlements with boundary geometry
    const settlementIds = countySettlements.map((s: any) => s.value)
    
    if (settlementIds.length === 0) {
      filteredSettlements.value = []
      checkingGeometry.value = false
      return
    }
    
    const res = await getSettlementsWithBoundaryGeometry({ 
      settlement_ids: settlementIds 
    })
    
    if (res.code === '0000' && res.data) {
      const validSettlementIds = new Set(res.data)
      
      // Cache the results
      settlementIds.forEach((id: number) => {
        settlementGeometryCache.value.set(id, validSettlementIds.has(id))
      })
      
      // Filter settlements to only those with valid geometry
      filteredSettlements.value = countySettlements.filter((settlement: any) => 
        validSettlementIds.has(settlement.value)
      )
      
      if (filteredSettlements.value.length === 0) {
        ElMessage.warning('No settlements with boundary geometry found for this county')
      }
    } else {
      console.error('Failed to fetch settlements with boundary geometry')
      ElMessage.error('Failed to filter settlements')
      filteredSettlements.value = []
    }
  } catch (error) {
    console.error('Error filtering settlements:', error)
    ElMessage.error('Failed to filter settlements')
    filteredSettlements.value = []
  } finally {
    checkingGeometry.value = false
  }
}

// Handle settlement selection and proceed to map
const handleSettlementChange = async (settlementId: any) => {
  if (!settlementId) return

  // Clear existing facilities when settlement changes
  clearExistingFacilities()

  try {
    const formData = {
      model: 'settlement',
      id: settlementId
    }
    const res = await getOneGeo(formData)

    if (res.data[0]?.json_build_object?.features) {
      let  feature = res.data[0].json_build_object.features[0]
      const geometryType = feature.geometry?.type

      if (geometryType === 'Point' || geometryType === 'MultiPoint') {
        ElMessage.error('This settlement has point geometry. Please select a settlement with boundary geometry (Polygon).')
        return
      }

      settlementGeo.value = res.data[0].json_build_object
      
      // Extract location fields from GeoJSON feature properties (most reliable source)
       feature = res.data[0].json_build_object.features[0]
      const settlementProperties = feature.properties || {}
      
      // Update form with settlement data - prioritize GeoJSON properties, fallback to settlementOptionsV2
      const settlement = (settlementOptionsV2.value || []).find((s: any) => s.value === settlementId)
      
      facilityForm.settlement_id = settlementId
      facilityForm.county_id = settlementProperties.county_id || settlement?.county_id || selectedCounty.value || ''
      facilityForm.subcounty_id = settlementProperties.subcounty_id || settlement?.subcounty_id || ''
      facilityForm.ward_id = settlementProperties.ward_id || settlement?.ward_id || ''
      
      // Validate that all required location fields are present
      if (!facilityForm.county_id) {
        ElMessage.error('Settlement county information is missing')
        return
      }
      if (!facilityForm.subcounty_id) {
        ElMessage.warning('Settlement subcounty information is missing. Please ensure the settlement has a subcounty assigned.')
      }
      if (!facilityForm.ward_id) {
        ElMessage.warning('Settlement ward information is missing. Please ensure the settlement has a ward assigned.')
      }
      
      // Move to step 2: Map
      currentStep.value = 1
      await nextTick()
      await initializeMap()
    } else {
      ElMessage.error('Settlement has no boundary geometry')
    }
  } catch (error) {
    console.error('Error loading settlement geometry:', error)
    ElMessage.error('Failed to load settlement boundary')
  }
}

// Initialize Google Maps with settlement boundary
const initializeMap = async () => {
  if (!mapContainer.value) return

  await nextTick()

  try {
  await loadGoogleMapsApi()

    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded properly')
    }

    let center = { lat: 1.137451, lng: 37.137343 }
    let zoom = 8

    if (settlementGeo.value) {
      const bounds = turf.bbox(settlementGeo.value)
      center = {
        lat: (bounds[1] + bounds[3]) / 2,
        lng: (bounds[0] + bounds[2]) / 2
      }
      zoom = 13
    }

    map.value = new window.google.maps.Map(mapContainer.value, {
      center: center,
      zoom: zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: false,
      disableDoubleClickZoom: true
    })

    // Add settlement boundary
    if (settlementGeo.value) {
      const features = settlementGeo.value.features
      if (features && features.length > 0) {
        const feature = features[0]
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          const paths = feature.geometry.type === 'Polygon'
            ? feature.geometry.coordinates[0].map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0]
              }))
            : feature.geometry.coordinates[0][0].map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0]
              }))

          settlementPolygon.value = new window.google.maps.Polygon({
            paths: paths,
            strokeColor: '#3388ff',
            strokeOpacity: 1.0,
            strokeWeight: 3,
            fillColor: '#3388ff',
            fillOpacity: 0.1,
            map: map.value,
            clickable: false,
            draggable: false
          })

          const bounds = new window.google.maps.LatLngBounds()
          paths.forEach((path: any) => {
            bounds.extend(path)
          })
          map.value.fitBounds(bounds)
        }
      }
    }

    // Function to place marker at clicked location
    const placeMarker = (event: any) => {
      if (!markerPlacementMode.value) return

      const position = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      }

      // Check if point is inside settlement polygon
      if (settlementPolygon.value && settlementGeo.value) {
        let isInside = false
        
        if (window.google?.maps?.geometry?.poly?.containsLocation) {
          isInside = window.google.maps.geometry.poly.containsLocation(
            event.latLng,
            settlementPolygon.value
          )
        } else {
          const point = turf.point([position.lng, position.lat])
          const polygon = turf.polygon(
            settlementGeo.value.features[0].geometry.coordinates
          )
          isInside = turf.booleanPointInPolygon(point, polygon)
        }
        
        if (!isInside) {
          ElMessage.warning('Please place the marker inside the settlement boundary')
          return
        }
      }

      // Remove existing marker if any
      if (facilityMarker.value) {
        facilityMarker.value.setMap(null)
      }

      // Create new marker
      facilityMarker.value = new window.google.maps.Marker({
        position: position,
        map: map.value,
        draggable: true,
        title: 'Click to open form',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        },
        zIndex: 1000
      })

      // Create Point geometry
      const geometry = {
        type: 'Point',
        coordinates: [position.lng, position.lat],
        crs: { type: 'name', properties: { name: 'EPSG:4326' } }
      }

      facilityGeometry.value = geometry
      facilityForm.geom = geometry

      // Add click listener to open drawer
      facilityMarker.value.addListener('click', () => {
        // Ensure geometry is synced with marker position
        const currentPosition = facilityMarker.value.getPosition()
        if (currentPosition) {
          facilityForm.geom = {
            type: 'Point',
            coordinates: [currentPosition.lng(), currentPosition.lat()],
            crs: { type: 'name', properties: { name: 'EPSG:4326' } }
          }
          facilityGeometry.value = facilityForm.geom
        }
        drawerVisible.value = true
      })

      // Listen for marker drag
      facilityMarker.value.addListener('dragend', (dragEvent: any) => {
        const newPosition = {
          lat: dragEvent.latLng.lat(),
          lng: dragEvent.latLng.lng()
        }
        
        if (settlementPolygon.value && settlementGeo.value) {
          let isInside = false
          
          if (window.google?.maps?.geometry?.poly?.containsLocation) {
            isInside = window.google.maps.geometry.poly.containsLocation(
              dragEvent.latLng,
              settlementPolygon.value
            )
          } else {
            const point = turf.point([newPosition.lng, newPosition.lat])
            const polygon = turf.polygon(
              settlementGeo.value.features[0].geometry.coordinates
            )
            isInside = turf.booleanPointInPolygon(point, polygon)
          }
          
          if (!isInside) {
            ElMessage.warning('Marker must remain inside the settlement boundary')
            facilityMarker.value.setPosition({
              lat: facilityGeometry.value.coordinates[1],
              lng: facilityGeometry.value.coordinates[0]
            })
            return
          }
        }
        
        facilityGeometry.value = {
          type: 'Point',
          coordinates: [newPosition.lng, newPosition.lat],
          crs: { type: 'name', properties: { name: 'EPSG:4326' } }
        }
        facilityForm.geom = facilityGeometry.value
      })

      // Disable placement mode and open drawer
      markerPlacementMode.value = false
      
      // If a line facility type was selected but we placed a point, reset selection
      if (selectedFacilityType.value) {
        const facilityType = facilityTypes.find(f => f.value === selectedFacilityType.value)
        if (facilityType?.geometryType === 'line') {
          selectedFacilityType.value = ''
        }
      }
      
      drawerVisible.value = true
    }

    mapClickListener.value = map.value.addListener('click', placeMarker)
    map.value.addListener('dblclick', placeMarker)

    // Initialize DrawingManager for line facilities (will be activated when needed)
    // Use a helper function to initialize DrawingManager when the library is ready
    const initDrawingManager = async () => {
      // Wait for drawing library to be available
      let retries = 0
      const maxRetries = 20
      while ((!window.google?.maps?.drawing?.DrawingManager) && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }
      
      if (window.google?.maps?.drawing?.DrawingManager) {
        try {
          drawingManager.value = new window.google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: false,
            polylineOptions: {
              strokeColor: '#ff0000',
              strokeWeight: 4,
              strokeOpacity: 1.0
            }
          })
          drawingManager.value.setMap(map.value)
          
          // Listen for polyline completion
          window.google.maps.event.addListener(
            drawingManager.value,
            'overlaycomplete',
            (event: any) => {
              if (event.type === window.google.maps.drawing.OverlayType.POLYLINE) {
                const polyline = event.overlay
                facilityPolyline.value = polyline

                // Convert Google Maps Polyline to GeoJSON
                const path = polyline.getPath()
                const coordinates: number[][] = []
                
                path.forEach((latLng: any) => {
                  coordinates.push([latLng.lng(), latLng.lat()])
                })

                // Determine geometry type based on facility type
                let geometry: any
                if (selectedFacilityType.value === 'pipedwater' || 
                    selectedFacilityType.value === 'powerline' || 
                    selectedFacilityType.value === 'railway') {
                  // These use MultiLineString
                  geometry = {
                    type: 'MultiLineString',
                    coordinates: [coordinates],
                    crs: { type: 'name', properties: { name: 'EPSG:4326' } }
                  }
                } else {
                  // Roads, sewers, streams use LineString
                  geometry = {
                    type: 'LineString',
                    coordinates: coordinates,
                    crs: { type: 'name', properties: { name: 'EPSG:4326' } }
                  }
                }

                facilityGeometry.value = geometry
                facilityForm.geom = geometry

                // Calculate length in meters (always calculate for line geometries)
                const length = turf.length({ type: 'LineString', coordinates }, { units: 'meters' })
                const lengthRounded = Math.round(length * 100) / 100 // Round to 2 decimal places
                console.log('Line length:', lengthRounded, 'meters')
                
                // Always store length when a line is drawn (will be used for roads, sewers, piped water)
                facilityForm.length = lengthRounded

                // Disable drawing mode
                drawingManager.value?.setDrawingMode(null)
                lineDrawingMode.value = false

                // Add click listener to open drawer
                polyline.addListener('click', () => {
                  drawerVisible.value = true
                })

                // If a point facility type was selected but we drew a line, reset selection
                if (selectedFacilityType.value) {
                  const facilityType = facilityTypes.find(f => f.value === selectedFacilityType.value)
                  if (facilityType?.geometryType === 'point') {
                    selectedFacilityType.value = ''
                  }
                }
                
                // Open drawer
                drawerVisible.value = true
              }
            }
          )
          return true
        } catch (error) {
          console.error('Error initializing DrawingManager:', error)
          drawingManager.value = null
          return false
        }
      }
      console.warn('Drawing library not loaded after waiting. DrawingManager will be initialized when needed.')
      return false
    }
    
    // Initialize DrawingManager asynchronously (don't block map initialization)
    initDrawingManager().catch(error => {
      console.error('Error initializing DrawingManager:', error)
    })
  } catch (error) {
    console.error('Error initializing Google Maps:', error)
    ElMessage.error('Failed to load map')
  }
  
  // Load existing facilities after map is initialized
  if (selectedSettlement.value) {
    await loadExistingFacilities()
  }
}

// Load existing facilities for the settlement
const loadExistingFacilities = async () => {
  if (!selectedSettlement.value || !map.value) return
  
  try {
    console.log('🔄 Loading existing facilities for settlement:', selectedSettlement.value)
    const res = await getSettlementMapData({ settlementId: String(selectedSettlement.value) })
    
    if (!res?.data) {
      console.log('No facility data received')
      return
    }
    
    const mapData = res.data
    console.log('✅ Received facility data:', Object.keys(mapData))
    
    // Icon mapping for different facility types
    const iconMap: Record<string, string> = {
      health_facility: 'icons/hospital-2.png',
      education_facility: 'icons/school.png',
      water_point: 'icons/waterdrop.png',
      mast: 'icons/tower.png',
      streetlight: 'icons/lighthouse-2.png',
      dumping_site: 'icons/landfill.png',
      hazard_zone: 'icons/caution.png',
      community_project: 'icons/country.png',
      community_hall: 'icons/communitycentre.png',
      police_station: 'icons/police.png',
      crime_hotspot: 'icons/theft.png',
      floodlight: 'icons/lighthouse-2.png',
      road_asset: 'icons/road.png',
      other_facility: 'icons/amphitheater.png'
    }
    
    // Line styles for linear facilities
    const lineStyles: Record<string, any> = {
      road: { strokeColor: 'red', strokeWeight: 3, strokeOpacity: 1 },
      powerline: { strokeColor: 'green', strokeWeight: 3, strokeOpacity: 1 },
      sewer: { strokeColor: '#4B0082', strokeWeight: 3, strokeOpacity: 1 },
      piped_water: { strokeColor: '#00BFFF', strokeWeight: 3, strokeOpacity: 1 },
      railway: { strokeColor: '#8B4513', strokeWeight: 4, strokeOpacity: 1 },
      stream: { strokeColor: '#1E90FF', strokeWeight: 2, strokeOpacity: 0.8 }
    }
    
    // Process point facilities
    const pointModels = ['health_facility', 'education_facility', 'water_point', 'streetlight', 
                        'crime_hotspot', 'community_project', 'community_hall', 'police_station', 
                        'mast', 'dumping_site', 'hazard_zone', 'floodlight', 'road_asset', 'other_facility']
    
    pointModels.forEach(model => {
      if (mapData[model]?.features?.length) {
        mapData[model].features.forEach((feature: any) => {
          if (feature.geometry?.type === 'Point') {
            const [lng, lat] = feature.geometry.coordinates
            const position = { lat, lng }
            const iconUrl = iconMap[model] || 'icons/amphitheater.png'
            
            const marker = new window.google.maps.Marker({
              position: position,
              map: map.value,
              icon: {
                url: iconUrl,
                scaledSize: new window.google.maps.Size(30, 30),
                anchor: new window.google.maps.Point(15, 15)
              },
              title: feature.properties?.name || model,
              zIndex: 500
            })
            
            // Add click listener to edit facility
            marker.addListener('click', () => {
              editExistingFacility(feature, model, 'point')
            })
            
            existingFacilityMarkers.value.set(feature.properties?.id || feature.id, marker)
          }
        })
      }
    })
    
    // Process linear facilities
    const lineModels = ['road', 'powerline', 'sewer', 'piped_water', 'railway', 'stream']
    
    lineModels.forEach(model => {
      if (mapData[model]?.features?.length) {
        mapData[model].features.forEach((feature: any) => {
          if (feature.geometry?.type === 'LineString' || feature.geometry?.type === 'MultiLineString') {
            const lines = feature.geometry.type === 'LineString' 
              ? [feature.geometry.coordinates] 
              : feature.geometry.coordinates
            
            lines.forEach((line: number[][]) => {
              const path = line.map(([lng, lat]) => ({ lat, lng }))
              const style = lineStyles[model] || { strokeColor: '#999999', strokeWeight: 3, strokeOpacity: 0.8 }
              
              const polyline = new window.google.maps.Polyline({
                path: path,
                map: map.value,
                ...style,
                zIndex: 500
              })
              
              // Add click listener to edit facility
              polyline.addListener('click', () => {
                editExistingFacility(feature, model, 'line')
              })
              
              // Store possibly multiple polylines per facility id (for MultiLineString)
              const key = feature.properties?.id || feature.id
              const existing = existingFacilityPolylines.value.get(key)
              if (Array.isArray(existing)) {
                existing.push(polyline)
                existingFacilityPolylines.value.set(key, existing)
              } else if (existing) {
                existingFacilityPolylines.value.set(key, [existing, polyline])
              } else {
                existingFacilityPolylines.value.set(key, [polyline])
              }
            })
          }
        })
      }
    })
    
    console.log(`✅ Loaded ${existingFacilityMarkers.value.size} point facilities and ${existingFacilityPolylines.value.size} linear facilities`)
  } catch (error) {
    console.error('Error loading existing facilities:', error)
    ElMessage.warning('Failed to load some existing facilities')
  }
}

// Edit existing facility
const editExistingFacility = (feature: any, model: string, geometryType: 'point' | 'line') => {
  const properties = feature.properties || {}
  const facilityId = properties.id || feature.id
  
  // Determine facility type from model
  const facilityTypeMap: Record<string, string> = {
    health_facility: 'health',
    education_facility: 'education',
    water_point: 'water',
    piped_water: 'pipedwater',
    sewer: 'sewer',
    road: 'road',
    railway: 'railway',
    powerline: 'powerline',
    stream: 'stream',
    police_station: 'police',
    community_hall: 'communityhall',
    crime_hotspot: 'crimehotspot',
    dumping_site: 'dumpingsite',
    floodlight: 'floodlight',
    streetlight: 'streetlight',
    mast: 'mast',
    road_asset: 'roadasset',
    hazard_zone: 'hazardzone',
    other_facility: 'other'
  }
  
  selectedFacilityType.value = facilityTypeMap[model] || ''
  isEditingMode.value = true
  editingFacilityId.value = facilityId
  editingFacilityModel.value = model
  
  // Populate form with existing data
  // First, copy all matching properties
  Object.keys(facilityForm).forEach(key => {
    if (properties[key] !== undefined && properties[key] !== null) {
      facilityForm[key] = properties[key]
    }
  })
  
  // Map database field names to form field names for new facilities
  if (model === 'railway') {
    facilityForm.name = properties.Name_Place_name || properties.name || ''
    facilityForm.number_of_tracks = properties.Number_of_Tracks
    facilityForm.reserve_width_m = properties.Reserve_Width_m
    facilityForm.traffic_railway = properties.Traffic
    facilityForm.reserve_encroached = properties.reserve_encroached
    facilityForm.rail_tracks_condition = properties.Rail_tracks_Condition
    facilityForm.reserve_condition = properties.Reserve_Condition
  } else if (model === 'powerline') {
    facilityForm.name = properties.PL_Name || properties.name || ''
    facilityForm.pl_phases = properties.PL_Phases
    facilityForm.pl_type_of_supply = properties.PL_Type_of_Supply
  } else if (model === 'stream') {
    facilityForm.stream_width = properties.width
  } else if (model === 'police_station') {
    facilityForm.name = properties.PC_Name || properties.name || ''
    facilityForm.pc_type = properties.PC_Type
    facilityForm.pc_number_of_officers = properties.PC_Number_of_Officers
    facilityForm.pc_number_of_vehicles = properties.PC_Number_of_Vehicles
    facilityForm.pc_condition = properties.PC_Condition
  } else if (model === 'community_hall') {
    facilityForm.name = properties.community_hall_name || properties.name || ''
    facilityForm.community_hall_use = properties.use
    facilityForm.community_hall_usage_fee = properties.usage_fee
    facilityForm.community_hall_condition = properties.condition
    facilityForm.community_hall_ownership = properties.ownership
    facilityForm.community_hall_owner = properties.owner
  } else if (model === 'crime_hotspot') {
    facilityForm.name = properties.CH_Name || properties.name || ''
    facilityForm.ch_crime_type = properties.CH_Crime_Type
    facilityForm.ch_frequency = properties.CH_Frequency
    facilityForm.ch_crime_target = properties.CH_Crime_Target
    facilityForm.ch_offender_type = properties.CH_Offender_Type
    facilityForm.ch_time_of_day = properties.CH_Time_of_Day
    facilityForm.ch_num_victims = properties.CH_num_victims
  } else if (model === 'dumping_site') {
    facilityForm.name = properties.DS_Name || properties.name || ''
    facilityForm.ds_type = properties.DS_Type
    facilityForm.ds_status = properties.DS_Status
    facilityForm.ds_type_of_waste = properties.DS_Type_of_Waste
    facilityForm.ds_year_established = properties.DS_Year_Established
  } else if (model === 'floodlight') {
    facilityForm.name = properties.Place_name || properties.name || ''
    facilityForm.floodlight_condition = properties.Condition
    facilityForm.floodlight_rating_watts = properties.Rating_Watts
    facilityForm.floodlight_height_meters = properties.Height_Meters
    facilityForm.floodlight_date_installed = properties.Date_Installed
    facilityForm.floodlight_sponsor_owner_type = properties.Sponsor_Owner_Type
    facilityForm.floodlight_sponsor_owner = properties.Sponsor_Owner
  } else if (model === 'streetlight') {
    facilityForm.streetlight_road_name = properties.road_name || ''
    facilityForm.streetlight_type = properties.type
    facilityForm.streetlight_condition = properties.condition
    facilityForm.name = properties.road_name || properties.name || ''
  } else if (model === 'mast') {
    facilityForm.name = properties.TC_Name || properties.name || ''
    facilityForm.mast_tc_type = properties.TC_Type
    facilityForm.mast_tc_condition = properties.TC_Condition
  } else if (model === 'road_asset') {
    facilityForm.road_asset_type = properties.asset_type
    facilityForm.road_asset_condition = properties.asset_condition
    facilityForm.road_id = properties.road_id
  } else if (model === 'hazard_zone') {
    facilityForm.name = properties.place_name || properties.name || ''
    facilityForm.hazard_zone_place_name = properties.place_name
    facilityForm.hazard_zone_hazard_type = properties.hazard_type
    facilityForm.hazard_zone_nature = properties.nature
    facilityForm.hazard_zone_number_of_affected_persons = properties.number_of_affected_persons
    facilityForm.hazard_zone_frequency_of_occurrence = properties.frequency_of_occurrence
    facilityForm.hazard_zone_damage_cost = properties.damage_cost
    facilityForm.hazard_zone_comment = properties.comment
  }
  
  // Set geometry
  if (geometryType === 'point' && feature.geometry?.type === 'Point') {
    const [lng, lat] = feature.geometry.coordinates
    facilityForm.geom = {
      type: 'Point',
      coordinates: [lng, lat],
      crs: { type: 'name', properties: { name: 'EPSG:4326' } }
    }
    
    // Create or update marker
    if (facilityMarker.value) {
      facilityMarker.value.setMap(null)
    }
    facilityMarker.value = new window.google.maps.Marker({
      position: { lat, lng },
      map: map.value,
      draggable: true,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      zIndex: 1000
    })
    
    // Add drag listener
    facilityMarker.value.addListener('dragend', (dragEvent: any) => {
      const newPosition = {
        lat: dragEvent.latLng.lat(),
        lng: dragEvent.latLng.lng()
      }
      facilityForm.geom = {
        type: 'Point',
        coordinates: [newPosition.lng, newPosition.lat],
        crs: { type: 'name', properties: { name: 'EPSG:4326' } }
      }
    })
  } else if (geometryType === 'line' && (feature.geometry?.type === 'LineString' || feature.geometry?.type === 'MultiLineString')) {
    const lines = feature.geometry.type === 'LineString' 
      ? [feature.geometry.coordinates] 
      : feature.geometry.coordinates
    
    if (lines.length > 0) {
      const path = lines[0].map(([lng, lat]) => ({ lat, lng }))

      // Remove any existing editable polyline
      if (facilityPolyline.value) {
        facilityPolyline.value.setMap(null)
      }

      // Remove the original stored polyline(s) for this facility (so only the editable one remains)
      if (facilityId && existingFacilityPolylines.value.has(facilityId)) {
        const originals = existingFacilityPolylines.value.get(facilityId)
        if (Array.isArray(originals)) {
          originals.forEach((pl: any) => {
            if (pl) {
              try {
                pl.setMap(null)
              } catch (e) {
                // ignore
              }
            }
          })
        } else if (originals) {
          try {
            originals.setMap(null)
          } catch (e) {
            // ignore
          }
        }
        existingFacilityPolylines.value.delete(facilityId)
      }

      facilityPolyline.value = new window.google.maps.Polyline({
        path: path,
        map: map.value,
        strokeColor: '#ff0000',
        strokeWeight: 4,
        strokeOpacity: 1.0,
        editable: true,
        zIndex: 1000
      })
      
      // Click editable line to reopen attributes drawer (without resetting geometry)
      facilityPolyline.value.addListener('click', () => {
        drawerVisible.value = true
      })

      // Update geometry when polyline vertices are edited
      const editPath = facilityPolyline.value.getPath()
      editPath.addListener('set_at', () => updatePolylineGeometry())
      editPath.addListener('insert_at', () => updatePolylineGeometry())
      editPath.addListener('remove_at', () => updatePolylineGeometry())
      
      // Set initial geometry
      updatePolylineGeometry()
    }
  }
  
  drawerVisible.value = true
}

// Update polyline geometry when edited
const updatePolylineGeometry = () => {
  if (!facilityPolyline.value) return
  
  const path = facilityPolyline.value.getPath()
  const coordinates: number[][] = []
  
  path.forEach((latLng: any) => {
    coordinates.push([latLng.lng(), latLng.lat()])
  })
  
  if (selectedFacilityType.value === 'pipedwater' || selectedFacilityType.value === 'powerline' || selectedFacilityType.value === 'railway') {
    facilityForm.geom = {
      type: 'MultiLineString',
      coordinates: [coordinates],
      crs: { type: 'name', properties: { name: 'EPSG:4326' } }
    }
  } else {
    facilityForm.geom = {
      type: 'LineString',
      coordinates: coordinates,
      crs: { type: 'name', properties: { name: 'EPSG:4326' } }
    }
  }
  
  // Recalculate length
  const length = turf.length({ type: 'LineString', coordinates }, { units: 'meters' })
  facilityForm.length = Math.round(length * 100) / 100
}

// Enable marker placement mode
const enableMarkerPlacement = () => {
  // Disable line drawing if active
  if (lineDrawingMode.value && drawingManager.value && window.google) {
    drawingManager.value.setDrawingMode(null)
    lineDrawingMode.value = false
  }
  markerPlacementMode.value = true
  ElMessage.info('Click on the map to place the marker inside the settlement boundary')
}

// Enable line drawing mode
const enableLineDrawing = async () => {
  if (!map.value || !window.google || !window.google.maps) {
    ElMessage.error('Map not initialized. Please wait for the map to load.')
    return
  }
  
  // Wait for Drawing library to be available (with retry)
  let retries = 0
  const maxRetries = 10
  while ((!window.google.maps.drawing || !window.google.maps.drawing.DrawingManager) && retries < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 100))
    retries++
  }
  
  // Check if Drawing library is loaded after waiting
  if (!window.google.maps.drawing || !window.google.maps.drawing.DrawingManager) {
    ElMessage.error('Drawing library not loaded. Please wait a moment and try again.')
    return
  }
  
  // Initialize drawingManager if it doesn't exist
  if (!drawingManager.value) {
    try {
      drawingManager.value = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polylineOptions: {
          strokeColor: '#ff0000',
          strokeWeight: 4,
          strokeOpacity: 1.0
        }
      })
      drawingManager.value.setMap(map.value)
      
      // Listen for polyline completion
      window.google.maps.event.addListener(
        drawingManager.value,
        'overlaycomplete',
        (event: any) => {
          if (event.type === window.google.maps.drawing.OverlayType.POLYLINE) {
            const polyline = event.overlay
            facilityPolyline.value = polyline

            // Convert Google Maps Polyline to GeoJSON
            const path = polyline.getPath()
            const coordinates: number[][] = []
            
            path.forEach((latLng: any) => {
              coordinates.push([latLng.lng(), latLng.lat()])
            })

            // Determine geometry type based on facility type
            let geometry: any
            if (selectedFacilityType.value === 'pipedwater' || 
                selectedFacilityType.value === 'powerline' || 
                selectedFacilityType.value === 'railway') {
              // These use MultiLineString
              geometry = {
                type: 'MultiLineString',
                coordinates: [coordinates],
                crs: { type: 'name', properties: { name: 'EPSG:4326' } }
              }
            } else {
              // Roads, sewers, streams use LineString
              geometry = {
                type: 'LineString',
                coordinates: coordinates,
                crs: { type: 'name', properties: { name: 'EPSG:4326' } }
              }
            }

            facilityGeometry.value = geometry
            facilityForm.geom = geometry

            // Calculate length
            const length = turf.length({ type: 'LineString', coordinates }, { units: 'meters' })
            facilityForm.length = Math.round(length * 100) / 100

            // Disable drawing mode
            drawingManager.value?.setDrawingMode(null)
            lineDrawingMode.value = false

            // Add click listener to open drawer
            polyline.addListener('click', () => {
              drawerVisible.value = true
            })

            // If a point facility type was selected but we drew a line, reset selection
            if (selectedFacilityType.value) {
              const facilityType = facilityTypes.find(f => f.value === selectedFacilityType.value)
              if (facilityType?.geometryType === 'point') {
                selectedFacilityType.value = ''
              }
            }
            
            // Listen for vertex edits on the polyline path
            const editPath = polyline.getPath()
            editPath.addListener('set_at', () => updatePolylineGeometry())
            editPath.addListener('insert_at', () => updatePolylineGeometry())
            editPath.addListener('remove_at', () => updatePolylineGeometry())
            
            // Open drawer
            drawerVisible.value = true
          }
        }
      )
    } catch (error) {
      console.error('Error initializing DrawingManager:', error)
      ElMessage.error('Failed to initialize drawing tools. Please refresh the page.')
      return
    }
  }
  
  // Ensure drawingManager is attached to the map
  if (drawingManager.value.getMap() !== map.value) {
    drawingManager.value.setMap(map.value)
  }
  
  // Disable marker placement if active
  if (markerPlacementMode.value) {
    markerPlacementMode.value = false
    if (mapClickListener.value) {
      window.google.maps.event.removeListener(mapClickListener.value)
      mapClickListener.value = null
    }
  }
  
  // Enable polyline drawing mode
  try {
    lineDrawingMode.value = true
    drawingManager.value.setDrawingMode(window.google.maps.drawing.OverlayType.POLYLINE)
    ElMessage.info('Click on the map to start drawing. Double-click to finish the line.')
  } catch (error) {
    console.error('Error enabling line drawing:', error)
    ElMessage.error('Failed to enable line drawing. Please try again.')
    lineDrawingMode.value = false
  }
}

// Delete marker
const deleteMarker = () => {
  if (facilityMarker.value) {
    const marker = facilityMarker.value
    const markerPosition = marker.getPosition()
    
    // Hide marker first
    try {
      marker.setVisible(false)
    } catch (e) {
      // Ignore if marker is already removed
    }
    
    // Remove all event listeners
    if (window.google && window.google.maps) {
      try {
        window.google.maps.event.clearInstanceListeners(marker)
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Remove from map - multiple attempts
    try {
      marker.setMap(null)
      // Force removal
      if (marker.getMap()) {
        marker.setMap(null)
      }
    } catch (e) {
      console.error('Error removing marker:', e)
    }
    
    // If editing, also check existingFacilityMarkers
    if (isEditingMode.value && editingFacilityId.value) {
      const existingMarker = existingFacilityMarkers.value.get(editingFacilityId.value)
      if (existingMarker) {
        try {
          existingMarker.setMap(null)
          existingFacilityMarkers.value.delete(editingFacilityId.value)
        } catch (e) {
          // Ignore errors
        }
      }
    }
    
    // Clear the reference
    facilityMarker.value = null
  }
  
  // Clear geometry
  facilityForm.geom = null
  facilityGeometry.value = null
  drawerVisible.value = false
  markerPlacementMode.value = false
  // Don't reset selectedFacilityType - allow reopening
}

// Delete polyline
const deleteLine = () => {
  if (facilityPolyline.value) {
    // Remove all event listeners
    if (window.google && window.google.maps) {
      window.google.maps.event.clearInstanceListeners(facilityPolyline.value)
    }
    // Remove from map
    facilityPolyline.value.setMap(null)
    facilityPolyline.value = null
  }
  // Clear geometry
  facilityForm.geom = null
  facilityGeometry.value = null
  drawerVisible.value = false
  lineDrawingMode.value = false
  if (drawingManager.value && window.google) {
    drawingManager.value.setDrawingMode(null)
  }
  // Don't reset selectedFacilityType - allow reopening
}

// Close drawer (but keep facility type selected for reopening)
const closeDrawer = () => {
  drawerVisible.value = false
  // Don't reset marker or facility type - allow reopening
  markerPlacementMode.value = false
  // Reset editing mode when closing drawer
  if (isEditingMode.value) {
    isEditingMode.value = false
    editingFacilityId.value = null
    editingFacilityModel.value = ''
    // Clear the editing marker/polyline
    if (facilityMarker.value) {
      facilityMarker.value.setMap(null)
      facilityMarker.value = null
    }
    if (facilityPolyline.value) {
      facilityPolyline.value.setMap(null)
      facilityPolyline.value = null
    }
    facilityForm.geom = null
    resetForm()
  }
}

// Hide drawer but keep editing / geometry so user can adjust vertices on map
const hideDrawerForVertexEdit = () => {
  drawerVisible.value = false
  if (facilityPolyline.value && window.google?.maps) {
    try {
      facilityPolyline.value.setEditable(true)
    } catch (e) {
      console.warn('Failed to ensure editable polyline for vertex editing', e)
    }
  }
}

// Fly to coordinates
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

// Open drawer (can be called to reopen after closing)
const openDrawer = () => {
  if (facilityMarker.value || facilityForm.geom) {
    drawerVisible.value = true
  } else {
    ElMessage.warning('Please place a marker on the map first')
  }
}

// Handle dropdown menu commands
const handleMenuCommand = (command: string) => {
  switch (command) {
    case 'add-point':
      enableMarkerPlacement()
      break
    case 'delete-point':
      deleteMarker()
      break
    case 'draw-line':
      enableLineDrawing()
      break
    case 'delete-line':
      deleteLine()
      break
  }
}

// Clear existing facilities from map
const clearExistingFacilities = () => {
  // Clear markers
  existingFacilityMarkers.value.forEach((marker) => {
    if (window.google?.maps) {
      window.google.maps.event.clearInstanceListeners(marker)
    }
    marker.setMap(null)
  })
  existingFacilityMarkers.value.clear()
  
  // Clear polylines
  existingFacilityPolylines.value.forEach((polylines) => {
    if (Array.isArray(polylines)) {
      polylines.forEach((polyline: any) => {
        if (!polyline) return
        if (window.google?.maps) {
          window.google.maps.event.clearInstanceListeners(polyline)
        }
        polyline.setMap(null)
      })
    } else if (polylines) {
      if (window.google?.maps) {
        window.google.maps.event.clearInstanceListeners(polylines)
      }
      polylines.setMap(null)
    }
  })
  existingFacilityPolylines.value.clear()
}

// Reset form
const resetForm = () => {
  // Reset editing state
  isEditingMode.value = false
  editingFacilityId.value = null
  editingFacilityModel.value = ''
  // Store location fields before reset
  const savedSettlementId = facilityForm.settlement_id
  const savedCountyId = facilityForm.county_id
  const savedSubcountyId = facilityForm.subcounty_id
  const savedWardId = facilityForm.ward_id
  
  Object.keys(facilityForm).forEach(key => {
    if (key === 'settlement_id' || key === 'county_id' || key === 'subcounty_id' || key === 'ward_id') {
      // Skip location fields - will be set below
      return
    }
    if (Array.isArray(facilityForm[key])) {
      facilityForm[key] = []
    } else if (typeof facilityForm[key] === 'number') {
      facilityForm[key] = 0
    } else {
      facilityForm[key] = ''
    }
  })
  facilityForm.geom = null
  
  // Restore location fields from selected settlement or saved values
  facilityForm.settlement_id = selectedSettlement.value || savedSettlementId || ''
  facilityForm.county_id = selectedCounty.value || savedCountyId || ''
  
  // Try to get from settlement options first
  const settlement = filteredSettlements.value.find(s => s.value === selectedSettlement.value) || 
                     (settlementOptionsV2.value || []).find((s: any) => s.value === selectedSettlement.value)
  if (settlement) {
    facilityForm.subcounty_id = settlement.subcounty_id || savedSubcountyId || ''
    facilityForm.ward_id = settlement.ward_id || savedWardId || ''
  } else {
    // Fallback to saved values
    facilityForm.subcounty_id = savedSubcountyId || ''
    facilityForm.ward_id = savedWardId || ''
  }
  
  // If still missing, try to get from GeoJSON properties
  if ((!facilityForm.subcounty_id || !facilityForm.ward_id) && settlementGeo.value?.features?.[0]?.properties) {
    const props = settlementGeo.value.features[0].properties
    if (!facilityForm.subcounty_id && props.subcounty_id) {
      facilityForm.subcounty_id = props.subcounty_id
    }
    if (!facilityForm.ward_id && props.ward_id) {
      facilityForm.ward_id = props.ward_id
    }
  }
}

// Submit form
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!facilityForm.geom && !facilityGeometry.value) {
        if (isLineFacility.value) {
          ElMessage.error('Please draw the line on the map')
        } else {
          ElMessage.error('Please mark the facility location on the map')
        }
        return
      }

      if (!selectedFacilityType.value) {
        ElMessage.error('Please select a facility type')
        return
      }

      // For roads, ensure length is calculated from geometry if not already set
      if (selectedFacilityType.value === 'road') {
        if (!facilityForm.length || facilityForm.length === null) {
          // Try to recalculate from geometry if available
          if (facilityForm.geom && (facilityForm.geom.type === 'LineString' || facilityForm.geom.type === 'MultiLineString')) {
            const coords = facilityForm.geom.type === 'LineString' 
              ? facilityForm.geom.coordinates 
              : facilityForm.geom.coordinates[0]
            const length = turf.length({ type: 'LineString', coordinates: coords }, { units: 'meters' })
            facilityForm.length = Math.round(length * 100) / 100
          } else {
            ElMessage.error('Road length is required. Please draw a line on the map first.')
            return
          }
        }
      }

      try {
        const facilityType = facilityTypes.find(ft => ft.value === selectedFacilityType.value)
        if (!facilityType) {
          ElMessage.error('Invalid facility type')
          return
        }

        // Ensure geometry is set
        if (!facilityForm.geom && facilityGeometry.value) {
          facilityForm.geom = facilityGeometry.value
        }

        // Enforce county restriction
        if (isCountyRestricted.value && userCountyId.value) {
          if (facilityForm.county_id && facilityForm.county_id !== userCountyId.value) {
            ElMessage.error('You can only create facilities in your assigned county')
            return
          }
          facilityForm.county_id = userCountyId.value
        }

        // Enforce settlement restriction
        if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
          if (facilityForm.settlement_id && facilityForm.settlement_id !== userSettlementId.value) {
            ElMessage.error('You can only create facilities in your assigned settlement')
            return
          }
          facilityForm.settlement_id = userSettlementId.value
          if (userCountyId.value) {
            facilityForm.county_id = userCountyId.value
          }
        }

        // Ensure all location fields are set - re-fetch from settlement if missing
        if (!facilityForm.county_id || !facilityForm.subcounty_id || !facilityForm.ward_id) {
          try {
            const settlement = (settlementOptionsV2.value || []).find((s: any) => s.value === facilityForm.settlement_id)
            if (settlement) {
              if (!facilityForm.county_id && settlement.county_id) {
                facilityForm.county_id = settlement.county_id
              }
              if (!facilityForm.subcounty_id && settlement.subcounty_id) {
                facilityForm.subcounty_id = settlement.subcounty_id
              }
              if (!facilityForm.ward_id && settlement.ward_id) {
                facilityForm.ward_id = settlement.ward_id
              }
            }
            
            // If still missing, try to get from GeoJSON
            if (settlementGeo.value?.features?.[0]?.properties) {
              const props = settlementGeo.value.features[0].properties
              if (!facilityForm.county_id && props.county_id) {
                facilityForm.county_id = props.county_id
              }
              if (!facilityForm.subcounty_id && props.subcounty_id) {
                facilityForm.subcounty_id = props.subcounty_id
              }
              if (!facilityForm.ward_id && props.ward_id) {
                facilityForm.ward_id = props.ward_id
              }
            }
          } catch (error) {
            console.error('Error fetching settlement location data:', error)
          }
        }

        // Final validation - ensure all required location fields are present
        if (!facilityForm.settlement_id) {
          ElMessage.error('Settlement is required')
          return
        }
        if (!facilityForm.county_id) {
          ElMessage.error('County is required')
          return
        }
        if (!facilityForm.subcounty_id) {
          ElMessage.error('Subcounty is required. Please ensure the settlement has a subcounty assigned.')
          return
        }
        if (!facilityForm.ward_id) {
          ElMessage.error('Ward is required. Please ensure the settlement has a ward assigned.')
          return
        }

        // Prepare form data - only include fields relevant to the selected facility type
        const formDataToSubmit: any = {
          name: facilityForm.name,
          settlement_id: facilityForm.settlement_id,
          county_id: facilityForm.county_id,
          subcounty_id: facilityForm.subcounty_id,
          ward_id: facilityForm.ward_id,
          geom: facilityForm.geom,
          model: facilityType.model,
          code: uuid.v4(),
          isApproved: 'Pending',
          created_by: userInfo.id
        }

        // Add type-specific fields
        if (selectedFacilityType.value === 'health') {
          Object.assign(formDataToSubmit, {
            facility_number: facilityForm.facility_number,
            level: facilityForm.level,
            registration_status: facilityForm.registration_status,
            ownership_type: facilityForm.ownership_type,
            owner: facilityForm.owner,
            land_ownership: facilityForm.land_ownership,
            land_title_available: facilityForm.land_title_available,
            land_parcel_size: facilityForm.land_parcel_size,
            condition: facilityForm.condition,
            num_inpatient: facilityForm.num_inpatient,
            outpatient_visits_per_day: facilityForm.outpatient_visits_per_day,
            maternity_deliveries_per_day: facilityForm.maternity_deliveries_per_day,
            antenatal_immunizations_per_day: facilityForm.antenatal_immunizations_per_day,
            general_beds: facilityForm.general_beds,
            maternity_beds: facilityForm.maternity_beds,
            pediatric_beds: facilityForm.pediatric_beds,
            total_beds: facilityForm.total_beds,
            occupancy_rate: facilityForm.occupancy_rate,
            number_doctors: facilityForm.number_doctors,
            number_clinical_officers: facilityForm.number_clinical_officers,
            number_pharmacists: facilityForm.number_pharmacists,
            number_nurses: facilityForm.number_nurses,
            number_midwives: facilityForm.number_midwives,
            number_other_staff: facilityForm.number_other_staff,
            services_offered: facilityForm.services_offered,
            referral_destinations: facilityForm.referral_destinations,
            referral_distance_km: facilityForm.referral_distance_km,
            referrals_per_day: facilityForm.referrals_per_day,
            has_ambulance: facilityForm.has_ambulance,
            source_of_drugs: facilityForm.source_of_drugs,
            common_ailments: facilityForm.common_ailments,
            source_of_patients: facilityForm.source_of_patients,
            challenges: facilityForm.challenges,
            respondent_name: facilityForm.respondent_name,
            respondent_phone: facilityForm.respondent_phone,
            distance_meters: facilityForm.distance_meters
          })
        } else if (selectedFacilityType.value === 'education') {
          Object.assign(formDataToSubmit, {
            registration_number: facilityForm.registration_number,
            education_category: Array.isArray(facilityForm.education_category) 
              ? facilityForm.education_category.join(',') 
              : facilityForm.education_category || '',
            registration_status: facilityForm.registration_status,
            ownership_type: facilityForm.ownership_type,
            ownership_details: facilityForm.ownership_details,
            boarding_type: facilityForm.boarding_type,
            land_ownership_status: facilityForm.land_ownership_status,
            respondent_name: facilityForm.respondent_name,
            respondent_phone: facilityForm.respondent_phone,
            enrolled_boys_count: facilityForm.enrolled_boys_count,
            enrolled_girls_count: facilityForm.enrolled_girls_count,
            student_source: facilityForm.student_source,
            male_teachers_count: facilityForm.male_teachers_count,
            female_teachers_count: facilityForm.female_teachers_count,
            classroom_count: facilityForm.classroom_count,
            classroom_condition: facilityForm.classroom_condition,
            boys_toilets_count: facilityForm.boys_toilets_count,
            girls_toilets_count: facilityForm.girls_toilets_count,
            handwashing_stations_count: facilityForm.handwashing_stations_count,
            toilet_condition: facilityForm.toilet_condition,
            fees_paid_by_students: facilityForm.fees_paid_by_students,
            term_1_fees_amount: facilityForm.term_1_fees_amount,
            term_2_fees_amount: facilityForm.term_2_fees_amount,
            term_3_fees_amount: facilityForm.term_3_fees_amount,
            dropout_count: facilityForm.dropout_count,
            dropout_reasons: facilityForm.dropout_reasons,
            retention_efforts: facilityForm.retention_efforts,
            retention_efforts_reasons: facilityForm.retention_efforts_reasons,
            sanitary_pads_provision: facilityForm.sanitary_pads_provision,
            sanitary_pads_provider: facilityForm.sanitary_pads_provider,
            sanitary_pads_bins: facilityForm.sanitary_pads_bins,
            teaching_aids_available: facilityForm.teaching_aids_available,
            boreholes_count: facilityForm.boreholes_count,
            water_tanks_count: facilityForm.water_tanks_count,
            permanent_classrooms_count: facilityForm.permanent_classrooms_count,
            bom_teachers_count: facilityForm.bom_teachers_count,
            compound_fence_status: facilityForm.compound_fence_status,
            school_challenges: facilityForm.school_challenges,
            parcel_has_title: facilityForm.parcel_has_title,
            parcel_size_hectares: facilityForm.parcel_size_hectares,
            efforts_for_student_retention: facilityForm.efforts_for_student_retention,
            additional_comments: facilityForm.additional_comments,
            distance_in_meters: facilityForm.distance_in_meters
          })
        } else if (selectedFacilityType.value === 'water') {
          Object.assign(formDataToSubmit, {
            type: facilityForm.type,
            capacity: facilityForm.capacity,
            depth: facilityForm.depth,
            ownership_type: facilityForm.ownership_type,
            owner: facilityForm.owner,
            catchment: facilityForm.catchment,
            price: facilityForm.price,
            condition: facilityForm.condition,
            availability: facilityForm.availability,
            name_of_provider: facilityForm.name_of_provider,
            cost_of_20_litre_jerrican: facilityForm.cost_of_20_litre_jerrican
          })
        } else if (selectedFacilityType.value === 'pipedwater') {
          Object.assign(formDataToSubmit, {
            ownership_type: facilityForm.ownership_type,
            owner: facilityForm.owner,
            condition: facilityForm.condition,
            number_connections: facilityForm.number_connections
          })
        } else if (selectedFacilityType.value === 'sewer') {
          Object.assign(formDataToSubmit, {
            pipe_type: facilityForm.pipe_type,
            pipe_size: facilityForm.pipe_size,
            provider: facilityForm.provider,
            provider_category: facilityForm.provider_category,
            condition: facilityForm.condition,
            number_of_connections: facilityForm.number_of_connections
          })
        } else if (selectedFacilityType.value === 'road') {
          // Validate and recalculate length for roads if not already set
          if (!facilityForm.length || facilityForm.length === null) {
            // Try to recalculate from geometry if available
            if (facilityForm.geom && (facilityForm.geom.type === 'LineString' || facilityForm.geom.type === 'MultiLineString')) {
              const coords = facilityForm.geom.type === 'LineString' 
                ? facilityForm.geom.coordinates 
                : facilityForm.geom.coordinates[0]
              const length = turf.length({ type: 'LineString', coordinates: coords }, { units: 'meters' })
              facilityForm.length = Math.round(length * 100) / 100
            } else {
              ElMessage.error('Road length is required. Please draw a line on the map first.')
              return
            }
          }
          
          Object.assign(formDataToSubmit, {
            rdNum: facilityForm.rdNum,
            rdClass: facilityForm.rdClass,
            rdReserve: facilityForm.rdReserve,
            surfaceType: facilityForm.surfaceType,
            surfaceCondition: facilityForm.surfaceCondition,
            traffic: facilityForm.traffic,
            direction: facilityForm.direction,
            drainage: facilityForm.drainage,
            drainageCondition: facilityForm.drainageCondition,
            width: facilityForm.width,
            length: facilityForm.length
          })
        } else if (selectedFacilityType.value === 'railway') {
          Object.assign(formDataToSubmit, {
            Name_Place_name: facilityForm.name,
            Number_of_Tracks: facilityForm.number_of_tracks,
            Reserve_Width_m: facilityForm.reserve_width_m,
            Traffic: facilityForm.traffic_railway,
            reserve_encroached: facilityForm.reserve_encroached,
            Rail_tracks_Condition: facilityForm.rail_tracks_condition,
            Reserve_Condition: facilityForm.reserve_condition
          })
        } else if (selectedFacilityType.value === 'powerline') {
          Object.assign(formDataToSubmit, {
            PL_Name: facilityForm.name,
            PL_Phases: facilityForm.pl_phases,
            PL_Type_of_Supply: facilityForm.pl_type_of_supply
          })
        } else if (selectedFacilityType.value === 'stream') {
          Object.assign(formDataToSubmit, {
            width: facilityForm.stream_width
          })
        } else if (selectedFacilityType.value === 'police') {
          Object.assign(formDataToSubmit, {
            PC_Name: facilityForm.name,
            PC_Type: facilityForm.pc_type,
            PC_Number_of_Officers: facilityForm.pc_number_of_officers,
            PC_Number_of_Vehicles: facilityForm.pc_number_of_vehicles,
            PC_Condition: facilityForm.pc_condition
          })
        } else if (selectedFacilityType.value === 'communityhall') {
          Object.assign(formDataToSubmit, {
            community_hall_name: facilityForm.name,
            use: facilityForm.community_hall_use,
            usage_fee: facilityForm.community_hall_usage_fee,
            condition: facilityForm.community_hall_condition,
            ownership: facilityForm.community_hall_ownership,
            owner: facilityForm.community_hall_owner
          })
        } else if (selectedFacilityType.value === 'crimehotspot') {
          Object.assign(formDataToSubmit, {
            CH_Name: facilityForm.name,
            CH_Crime_Type: facilityForm.ch_crime_type,
            CH_Frequency: facilityForm.ch_frequency,
            CH_Crime_Target: facilityForm.ch_crime_target,
            CH_Offender_Type: facilityForm.ch_offender_type,
            CH_Time_of_Day: facilityForm.ch_time_of_day,
            CH_num_victims: facilityForm.ch_num_victims
          })
        } else if (selectedFacilityType.value === 'dumpingsite') {
          Object.assign(formDataToSubmit, {
            DS_Name: facilityForm.name,
            DS_Type: facilityForm.ds_type,
            DS_Status: facilityForm.ds_status,
            DS_Type_of_Waste: facilityForm.ds_type_of_waste,
            DS_Year_Established: facilityForm.ds_year_established
          })
        } else if (selectedFacilityType.value === 'floodlight') {
          Object.assign(formDataToSubmit, {
            Place_name: facilityForm.name,
            Condition: facilityForm.floodlight_condition,
            Rating_Watts: facilityForm.floodlight_rating_watts,
            Height_Meters: facilityForm.floodlight_height_meters,
            Date_Installed: facilityForm.floodlight_date_installed,
            Sponsor_Owner_Type: facilityForm.floodlight_sponsor_owner_type,
            Sponsor_Owner: facilityForm.floodlight_sponsor_owner
          })
        } else if (selectedFacilityType.value === 'streetlight') {
          Object.assign(formDataToSubmit, {
            road_name: facilityForm.streetlight_road_name,
            type: facilityForm.streetlight_type,
            condition: facilityForm.streetlight_condition
          })
        } else if (selectedFacilityType.value === 'mast') {
          Object.assign(formDataToSubmit, {
            TC_Name: facilityForm.name,
            TC_Type: facilityForm.mast_tc_type,
            TC_Condition: facilityForm.mast_tc_condition
          })
        } else if (selectedFacilityType.value === 'roadasset') {
          Object.assign(formDataToSubmit, {
            asset_type: facilityForm.road_asset_type,
            asset_condition: facilityForm.road_asset_condition
          })
        } else if (selectedFacilityType.value === 'hazardzone') {
          Object.assign(formDataToSubmit, {
            place_name: facilityForm.hazard_zone_place_name || facilityForm.name,
            hazard_type: facilityForm.hazard_zone_hazard_type,
            nature: facilityForm.hazard_zone_nature,
            number_of_affected_persons: facilityForm.hazard_zone_number_of_affected_persons,
            frequency_of_occurrence: facilityForm.hazard_zone_frequency_of_occurrence,
            damage_cost: facilityForm.hazard_zone_damage_cost,
            comment: facilityForm.hazard_zone_comment
          })
        } else if (selectedFacilityType.value === 'other') {
          Object.assign(formDataToSubmit, {
            type: facilityForm.type,
            condition: facilityForm.condition,
            ownership_type: facilityForm.ownership_type,
            owner: facilityForm.owner,
            // other_facility's column is `createdBy`; the shared payload only sets `created_by`,
            // which Sequelize drops for this model.
            createdBy: userInfo.id
          })
        }

        let res
        if (isEditingMode.value && editingFacilityId.value) {
          // Update existing facility
          formDataToSubmit.id = editingFacilityId.value
          res = await updateOneRecord(formDataToSubmit)
          
          if (res.code === '0000') {
            ElMessage.success('Facility updated successfully')
            // Reload existing facilities to reflect changes
            await clearExistingFacilities()
            await loadExistingFacilities()
            // Reset form and editing state
            resetForm()
            isEditingMode.value = false
            editingFacilityId.value = null
            editingFacilityModel.value = ''
            drawerVisible.value = false
            markerPlacementMode.value = false
          } else {
            ElMessage.error('Failed to update facility')
          }
        } else {
          // Create new facility
          res = await CreateRecord(formDataToSubmit)
          
          if (res.code === '0000') {
            ElMessage.success('Facility created successfully')
            // Add marker to map
            if (facilityMarker.value && facilityForm.geom) {
              facilityMarker.value.setIcon({
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(35, 35)
              })
              facilityMarker.value.setDraggable(false)
              facilityMarker.value.setZIndex(1)
            }
            // Reload existing facilities to show the new one
            await clearExistingFacilities()
            await loadExistingFacilities()
            // Reset form but keep facility type selected for next entry
            resetForm()
            drawerVisible.value = false
            // Keep selectedFacilityType so user can add another facility of same type
            markerPlacementMode.value = false
          } else {
            ElMessage.error('Failed to create facility')
          }
        }
      } catch (error) {
        console.error('Error saving facility:', error)
        ElMessage.error('Failed to save facility')
      }
    }
  })
}

// Go back to previous step
const goBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    if (currentStep.value === 0) {
      // Clean up map
      if (mapClickListener.value) {
        window.google?.maps?.event?.removeListener(mapClickListener.value)
        mapClickListener.value = null
      }
      if (facilityMarker.value) {
        facilityMarker.value.setMap(null)
        facilityMarker.value = null
      }
      if (facilityPolyline.value) {
        facilityPolyline.value.setMap(null)
        facilityPolyline.value = null
      }
      if (settlementPolygon.value) {
        settlementPolygon.value.setMap(null)
        settlementPolygon.value = null
      }
      map.value = null
      settlementGeo.value = null
      facilityGeometry.value = null
      facilityForm.geom = null
      markerPlacementMode.value = false
      lineDrawingMode.value = false
      // area measurement removed
    }
  } else {
    router.back()
  }
}

// Preload settlement from query parameters
onMounted(async () => {
  const routeCountyId = route.query.county_id
  const routeSettlementId = route.query.settlement_id
  
  // Wait for settlementOptionsV2 to be loaded (with timeout)
  let retries = 0
  const maxRetries = 10
  while ((!settlementOptionsV2.value || settlementOptionsV2.value.length === 0) && retries < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 100))
    retries++
  }
  
  if (routeCountyId) {
    selectedCounty.value = Array.isArray(routeCountyId) ? parseInt(routeCountyId[0]) : parseInt(routeCountyId as string)
    await handleCountyChange(selectedCounty.value)
    if (routeSettlementId) {
      selectedSettlement.value = Array.isArray(routeSettlementId) ? parseInt(routeSettlementId[0]) : parseInt(routeSettlementId as string)
      await handleSettlementChange(selectedSettlement.value)
    }
  } else if (isCountyRestricted.value && userCountyId.value) {
    selectedCounty.value = userCountyId.value
    await handleCountyChange(userCountyId.value)
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    const settlement = (settlementOptionsV2.value || []).find((s: any) => s.value === userSettlementId.value)
    if (settlement && settlement.county_id) {
      selectedCounty.value = settlement.county_id
      await handleCountyChange(settlement.county_id)
      selectedSettlement.value = userSettlementId.value
      await handleSettlementChange(userSettlementId.value)
    }
  }
})
</script>

<template>
  <div class="add-facility-container">
    <el-card>
      <!-- Header -->
      <template #header>
        <div class="header-content">
          <el-button type="primary" plain :icon="ArrowLeft" @click="goBack" class="back-button">
            Back
          </el-button>
          <h2 class="header-title">Add Facility</h2>
          <div class="header-actions">
            <template v-if="currentStep === 1">
              <el-button 
                type="primary" 
                :icon="AddLocation"
                @click="enableMarkerPlacement" 
                size="small"
                :disabled="markerPlacementMode"
                :circle="isMobile"
                class="action-button">
                <span class="action-text">Add Point</span>
              </el-button>
              <el-button 
                v-if="facilityMarker"
                type="danger" 
                :icon="Delete"
                @click="deleteMarker" 
                size="small"
                :circle="isMobile"
                class="action-button">
                <span class="action-text">Delete Point</span>
              </el-button>
              <el-button 
                type="success" 
                :icon="Minus"
                @click="enableLineDrawing" 
                size="small"
                :disabled="lineDrawingMode"
                :circle="isMobile"
                class="action-button">
                <span class="action-text">Draw Line</span>
              </el-button>
              <el-button 
                v-if="facilityPolyline"
                type="warning" 
                :icon="Delete"
                @click="deleteLine" 
                size="small"
                :circle="isMobile"
                class="action-button">
                <span class="action-text">Delete Line</span>
              </el-button>
              <el-button 
                v-if="facilityPolyline && !drawerVisible"
                type="info" 
                :icon="Edit"
                @click="drawerVisible = true" 
                size="small"
                :circle="isMobile"
                class="action-button">
                <span class="action-text">Show Attributes</span>
              </el-button>
              <el-button 
                v-if="currentStep === 1" 
                type="info" 
                :icon="Plus" 
                @click="flyDialogVisible = true" 
                size="small"
                :circle="isMobile"
                class="action-button"
              >
                <span class="action-text">Fly to coords</span>
              </el-button>
            </template>
          </div>
        </div>
      </template>

      <!-- Step 1: Settlement Selection -->
      <div v-if="currentStep === 0" class="step-content">
        <el-form label-width="150px" label-position="left">
          <el-row :gutter="20">
            <el-col :span="24" :md="12">
              <el-form-item label="County" required>
                <el-select
                  v-model="selectedCounty"
                  placeholder="Select County"
                  filterable
                  clearable
                  @change="handleCountyChange"
                  :disabled="isCountyRestricted"
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
              <el-form-item label="Settlement" required>
                <el-select
                  v-model="selectedSettlement"
                  placeholder="Select Settlement"
                  filterable
                  clearable
                  :disabled="!selectedCounty || checkingGeometry"
                  :loading="checkingGeometry"
                  @change="handleSettlementChange"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in filteredSettlements"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <div v-if="checkingGeometry" style="font-size: 12px; color: #909399; margin-top: 5px;">
                  Checking settlements with boundary geometry...
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- Step 2: Map with Click to Place Marker -->
      <div v-if="currentStep === 1" class="step-content map-step">
        <div ref="mapContainer" class="map-container"></div>
      </div>
    </el-card>

    <!-- Form Drawer (opens after placing marker) -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEditingMode ? 'Edit Facility' : 'Add Facility'"
      :size="isMobile ? '100%' : '600px'"
      direction="rtl"
      :before-close="closeDrawer"
    >
      <el-form
        ref="formRef"
        :model="facilityForm"
        :rules="formRules"
        label-width="180px"
        label-position="left"
      >
        <!-- Facility Type Selector - Always Visible -->
        <el-form-item label="Facility Type" required>
          <el-select
            v-model="selectedFacilityType"
            placeholder="Select facility type"
            filterable
            :disabled="isEditingMode"
            style="width: 100%"
          >
            <el-option
              v-for="facilityType in filteredFacilityTypes"
              :key="facilityType.value"
              :label="facilityType.label"
              :value="facilityType.value"
            />
          </el-select>
          <div v-if="facilityMarker && !facilityPolyline" style="font-size: 12px; color: #909399; margin-top: 5px;">
            Point facilities only (marker placed)
          </div>
          <div v-if="facilityPolyline && !facilityMarker" style="font-size: 12px; color: #909399; margin-top: 5px;">
            Line facilities only (line drawn)
          </div>
        </el-form-item>

        <!-- Form Fields - Shown after facility type is selected -->
        <template v-if="selectedFacilityType">
          <el-divider content-position="left">Basic Information</el-divider>

          <el-form-item label="Name" prop="name">
            <el-input v-model="facilityForm.name" placeholder="Enter facility name" />
          </el-form-item>

          <!-- Health Facility Fields -->
          <template v-if="selectedFacilityType === 'health'">
            <el-form-item label="Facility Number">
              <el-input v-model="facilityForm.facility_number" placeholder="Enter facility number" />
            </el-form-item>
            <el-form-item label="Level">
              <el-select v-model="facilityForm.level" placeholder="Select level" filterable style="width: 100%">
                <el-option v-for="item in LevelOptionsLocal" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Registration Status">
              <el-select v-model="facilityForm.registration_status" placeholder="Select registration status" filterable style="width: 100%">
                <el-option v-for="item in regOptionsLocal" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Ownership Type">
              <el-select v-model="facilityForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
                <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Owner">
              <el-input v-model="facilityForm.owner" placeholder="Enter owner" />
            </el-form-item>
            <el-form-item label="Land Ownership">
              <el-select v-model="facilityForm.land_ownership" placeholder="Select land ownership" filterable style="width: 100%">
                <el-option v-for="item in tenancyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Land Title Available">
              <el-select v-model="facilityForm.land_title_available" placeholder="Select land title available" filterable style="width: 100%">
                <el-option v-for="item in yesNoOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Land Parcel Size">
              <el-input-number v-model="facilityForm.land_parcel_size" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionFacilityOptions" :key="item.value" :label="item.label" :value="item.value" />
                <el-option label="Very Poor" value="Very Poor" />
              </el-select>
            </el-form-item>
            <el-divider content-position="left">Capacity</el-divider>
            <el-form-item label="Number of Inpatients">
              <el-input-number v-model="facilityForm.num_inpatient" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Outpatient Visits/Day">
              <el-input-number v-model="facilityForm.outpatient_visits_per_day" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Maternity Deliveries/Day">
              <el-input-number v-model="facilityForm.maternity_deliveries_per_day" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Immunizations/Day">
              <el-input-number v-model="facilityForm.antenatal_immunizations_per_day" :min="0" style="width: 100%" />
            </el-form-item>
            <el-divider content-position="left">Beds</el-divider>
            <el-form-item label="General Beds">
              <el-input-number v-model="facilityForm.general_beds" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Maternity Beds">
              <el-input-number v-model="facilityForm.maternity_beds" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Pediatric Beds">
              <el-input-number v-model="facilityForm.pediatric_beds" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Total Beds">
              <el-input-number v-model="facilityForm.total_beds" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Occupancy Rate">
              <el-input-number v-model="facilityForm.occupancy_rate" :min="0" :max="100" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-divider content-position="left">Staff</el-divider>
            <el-form-item label="Number of Doctors">
              <el-input-number v-model="facilityForm.number_doctors" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Number of Clinical Officers">
              <el-input-number v-model="facilityForm.number_clinical_officers" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Number of Pharmacists">
              <el-input-number v-model="facilityForm.number_pharmacists" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Number of Nurses">
              <el-input-number v-model="facilityForm.number_nurses" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Number of Midwives">
              <el-input-number v-model="facilityForm.number_midwives" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Number of Other Staff">
              <el-input-number v-model="facilityForm.number_other_staff" :min="0" style="width: 100%" />
            </el-form-item>
            <el-divider content-position="left">Services & Referrals</el-divider>
            <el-form-item label="Services Offered">
              <el-input v-model="facilityForm.services_offered" type="textarea" :rows="3" placeholder="Enter services offered" />
            </el-form-item>
            <el-form-item label="Referral Destinations">
              <el-input v-model="facilityForm.referral_destinations" type="textarea" :rows="2" placeholder="Enter referral destinations" />
            </el-form-item>
            <el-form-item label="Referral Distance (km)">
              <el-input-number v-model="facilityForm.referral_distance_km" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Referrals per Day">
              <el-input-number v-model="facilityForm.referrals_per_day" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Has Ambulance">
              <el-select v-model="facilityForm.has_ambulance" placeholder="Select has ambulance" filterable style="width: 100%">
                <el-option v-for="item in yesNoPlainOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Source of Drugs">
              <el-input v-model="facilityForm.source_of_drugs" placeholder="Enter source of drugs" />
            </el-form-item>
            <el-form-item label="Common Ailments">
              <el-input v-model="facilityForm.common_ailments" type="textarea" :rows="2" placeholder="Enter common ailments" />
            </el-form-item>
            <el-form-item label="Source of Patients">
              <el-input v-model="facilityForm.source_of_patients" placeholder="Enter source of patients" />
            </el-form-item>
            <el-divider content-position="left">Additional Information</el-divider>
            <el-form-item label="Respondent Name">
              <el-input v-model="facilityForm.respondent_name" placeholder="Enter respondent name" />
            </el-form-item>
            <el-form-item label="Respondent Phone">
              <el-input v-model="facilityForm.respondent_phone" placeholder="Enter respondent phone" />
            </el-form-item>
            <el-form-item label="Distance (Meters)">
              <el-input-number v-model="facilityForm.distance_meters" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Challenges">
              <el-input v-model="facilityForm.challenges" type="textarea" :rows="3" placeholder="Enter challenges" />
            </el-form-item>
          </template>

          <!-- Education Facility Fields -->
          <template v-if="selectedFacilityType === 'education'">
            <el-form-item label="Registration Number">
              <el-input v-model="facilityForm.registration_number" placeholder="Enter registration number" />
            </el-form-item>
            <el-form-item label="Registration Status">
              <el-select v-model="facilityForm.registration_status" placeholder="Select registration status" filterable style="width: 100%">
                <el-option v-for="item in regOptionsLocal" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Education Category">
              <el-select 
                v-model="facilityForm.education_category" 
                placeholder="Select education category(s)" 
                filterable 
                multiple
                collapse-tags
                collapse-tags-tooltip
                style="width: 100%">
                <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Ownership Type">
              <el-select v-model="facilityForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
                <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Ownership Details">
              <el-input v-model="facilityForm.ownership_details" placeholder="Enter ownership details" />
            </el-form-item>
            <el-form-item label="Boarding Type">
              <el-select v-model="facilityForm.boarding_type" placeholder="Select boarding type" filterable style="width: 100%">
                <el-option v-for="item in boardingTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Land Ownership Status">
              <el-select v-model="facilityForm.land_ownership_status" placeholder="Select land ownership status" filterable style="width: 100%">
                <el-option v-for="item in tenancyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Respondent Name">
              <el-input v-model="facilityForm.respondent_name" placeholder="Enter respondent name" />
            </el-form-item>
            <el-form-item label="Respondent Phone">
              <el-input v-model="facilityForm.respondent_phone" placeholder="Enter respondent phone" />
            </el-form-item>
            <el-divider content-position="left">Enrollment</el-divider>
            <el-form-item label="Enrolled Boys Count">
              <el-input-number v-model="facilityForm.enrolled_boys_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Enrolled Girls Count">
              <el-input-number v-model="facilityForm.enrolled_girls_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Student Source">
              <el-input v-model="facilityForm.student_source" placeholder="Enter student source" />
            </el-form-item>
            <el-form-item label="Male Teachers Count">
              <el-input-number v-model="facilityForm.male_teachers_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Female Teachers Count">
              <el-input-number v-model="facilityForm.female_teachers_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="BOM Teachers Count">
              <el-input-number v-model="facilityForm.bom_teachers_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Dropout Count">
              <el-input-number v-model="facilityForm.dropout_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Dropout Reasons">
              <el-input v-model="facilityForm.dropout_reasons" type="textarea" :rows="2" placeholder="Enter dropout reasons" />
            </el-form-item>
            <el-form-item label="Retention Efforts">
              <el-input v-model="facilityForm.retention_efforts" type="textarea" :rows="2" placeholder="Enter retention efforts" />
            </el-form-item>
            <el-form-item label="Retention Efforts Reasons">
              <el-input v-model="facilityForm.retention_efforts_reasons" type="textarea" :rows="2" placeholder="Enter retention efforts reasons" />
            </el-form-item>
            <el-form-item label="Efforts for Student Retention">
              <el-input v-model="facilityForm.efforts_for_student_retention" type="textarea" :rows="2" placeholder="Enter efforts for student retention" />
            </el-form-item>
            <el-divider content-position="left">Fees Information</el-divider>
            <el-form-item label="Do Students Pay Fees?">
              <el-select v-model="facilityForm.fees_paid_by_students" placeholder="Select if students pay fees" filterable style="width: 100%">
                <el-option v-for="item in yesNoPlainOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Term 1 Fees Amount">
              <el-input-number v-model="facilityForm.term_1_fees_amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Term 2 Fees Amount">
              <el-input-number v-model="facilityForm.term_2_fees_amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Term 3 Fees Amount">
              <el-input-number v-model="facilityForm.term_3_fees_amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-divider content-position="left">Facilities</el-divider>
            <el-form-item label="Classroom Count">
              <el-input-number v-model="facilityForm.classroom_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="#Permanent Classrooms">
              <el-input-number v-model="facilityForm.permanent_classrooms_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Classroom Condition">
              <el-select v-model="facilityForm.classroom_condition" placeholder="Select classroom condition" filterable style="width: 100%">
                <el-option v-for="item in conditionFacilityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Boys Toilets Count">
              <el-input-number v-model="facilityForm.boys_toilets_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Girls Toilets Count">
              <el-input-number v-model="facilityForm.girls_toilets_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Toilet Condition">
              <el-select v-model="facilityForm.toilet_condition" placeholder="Select toilet condition" filterable style="width: 100%">
                <el-option v-for="item in conditionFacilityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Handwashing Stations">
              <el-input-number v-model="facilityForm.handwashing_stations_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-divider content-position="left">Menstrual Hygiene Management</el-divider>
            <el-form-item label="Sanitary Pads Provision">
              <el-select v-model="facilityForm.sanitary_pads_provision" placeholder="Select sanitary pads provision" filterable style="width: 100%">
                <el-option v-for="item in yesNoPlainOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Sanitary Pads Provider">
              <el-input v-model="facilityForm.sanitary_pads_provider" placeholder="Enter sanitary pads provider" />
            </el-form-item>
            <el-form-item label="Sanitary Pads Bins">
              <el-select v-model="facilityForm.sanitary_pads_bins" placeholder="Select sanitary pads bins" filterable style="width: 100%">
                <el-option v-for="item in yesNoPlainOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-divider content-position="left">Water and Infrastructure</el-divider>
            <el-form-item label="Boreholes Count">
              <el-input-number v-model="facilityForm.boreholes_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Water Tanks Count">
              <el-input-number v-model="facilityForm.water_tanks_count" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Fenced Compound">
              <el-select v-model="facilityForm.compound_fence_status" placeholder="Select compound fence status" filterable style="width: 100%">
                <el-option v-for="item in yesNoOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Teaching Aids Available">
              <el-select v-model="facilityForm.teaching_aids_available" placeholder="Select teaching aids available" filterable style="width: 100%">
                <el-option v-for="item in yesNoPlainOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-divider content-position="left">Property Information</el-divider>
            <el-form-item label="Parcel Has Title">
              <el-select v-model="facilityForm.parcel_has_title" placeholder="Select parcel has title" filterable style="width: 100%">
                <el-option v-for="item in yesNoOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Parcel Size (Hectares)">
              <el-input-number v-model="facilityForm.parcel_size_hectares" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Distance in Meters">
              <el-input-number v-model="facilityForm.distance_in_meters" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-divider content-position="left">Additional Information</el-divider>
            <el-form-item label="School Challenges">
              <el-input v-model="facilityForm.school_challenges" type="textarea" :rows="3" placeholder="Enter school challenges" />
            </el-form-item>
            <el-form-item label="Additional Comments">
              <el-input v-model="facilityForm.additional_comments" type="textarea" :rows="3" placeholder="Enter additional comments" />
            </el-form-item>
          </template>

          <!-- Water Point Fields -->
          <template v-if="selectedFacilityType === 'water'">
            <el-form-item label="Type">
              <el-select v-model="facilityForm.type" placeholder="Select water point type" filterable style="width: 100%">
                <el-option v-for="item in waterPointTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Capacity">
              <el-input v-model="facilityForm.capacity" placeholder="Enter capacity" />
            </el-form-item>
            <el-form-item label="Depth (Meters)" v-if="facilityForm.type === 'borehole' || facilityForm.type === 'well'">
              <el-input-number v-model="facilityForm.depth" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Ownership Type">
              <el-select v-model="facilityForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
                <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Owner">
              <el-input v-model="facilityForm.owner" placeholder="Enter owner" />
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Availability">
              <el-select v-model="facilityForm.availability" placeholder="Select availability" filterable style="width: 100%">
                <el-option v-for="item in availabilityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Price">
              <el-input-number v-model="facilityForm.price" :min="0" style="width: 100%" />
            </el-form-item>
          </template>

          <!-- Piped Water Fields -->
          <template v-if="selectedFacilityType === 'pipedwater'">
            <el-form-item label="Ownership Type">
              <el-select v-model="facilityForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
                <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Owner">
              <el-input v-model="facilityForm.owner" placeholder="Enter owner" />
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Number of Connections">
              <el-input-number v-model="facilityForm.number_connections" :min="0" style="width: 100%" />
            </el-form-item>
          </template>

          <!-- Sewer Fields -->
          <template v-if="selectedFacilityType === 'sewer'">
            <el-form-item label="Pipe Type">
              <el-select v-model="facilityForm.pipe_type" placeholder="Select pipe type" filterable style="width: 100%">
                <el-option v-for="item in pipeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Pipe Size">
              <el-input v-model="facilityForm.pipe_size" placeholder="Enter pipe size" />
            </el-form-item>
            <el-form-item label="Provider Category">
              <el-select v-model="facilityForm.provider_category" placeholder="Select provider category" filterable style="width: 100%">
                <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Service Provider">
              <el-input v-model="facilityForm.provider" placeholder="Enter service provider" />
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Number of Connections">
              <el-input-number v-model="facilityForm.number_of_connections" :min="0" style="width: 100%" />
            </el-form-item>
          </template>

          <!-- Road Fields -->
          <template v-if="selectedFacilityType === 'road'">
            <el-form-item label="Road Number">
              <el-input v-model="facilityForm.rdNum" placeholder="Enter road number" />
            </el-form-item>
            <el-form-item label="Road Class">
              <el-select v-model="facilityForm.rdClass" placeholder="Select class" filterable style="width: 100%">
                <el-option v-for="item in RdClassOptionsLocal" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Length (Meters)">
              <el-input-number 
                v-if="facilityForm.length !== null && facilityForm.length !== undefined"
                v-model="facilityForm.length" 
                :min="0" 
                :precision="2" 
                :disabled="true"
                style="width: 100%" 
              />
              <el-input 
                v-else
                :value="'No line drawn yet'"
                disabled
                style="width: 100%"
              />
              <div v-if="facilityForm.length !== null && facilityForm.length !== undefined" style="font-size: 12px; color: #909399; margin-top: 5px;">
                Automatically calculated from drawn line
              </div>
            </el-form-item>
            <el-form-item label="Road Width (m)" prop="width">
              <el-input-number v-model="facilityForm.width" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Road Reserve (m)">
              <el-input-number v-model="facilityForm.rdReserve" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Surface Type" prop="surfaceType">
              <el-select v-model="facilityForm.surfaceType" placeholder="Select surface type" filterable style="width: 100%">
                <el-option v-for="item in surfaceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Surface Condition">
              <el-select v-model="facilityForm.surfaceCondition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Traffic">
              <el-select v-model="facilityForm.traffic" placeholder="Select traffic level" filterable style="width: 100%">
                <el-option v-for="item in trafficOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Direction">
              <el-select v-model="facilityForm.direction" placeholder="Select direction" filterable style="width: 100%">
                <el-option v-for="item in directionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Drainage Location">
              <el-select v-model="facilityForm.drainage" placeholder="Select drainage location" filterable style="width: 100%">
                <el-option v-for="item in drainageTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Drainage Condition">
              <el-select v-model="facilityForm.drainageCondition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>

          <!-- Other Facility Fields -->
          <template v-if="selectedFacilityType === 'other'">
            <el-form-item label="Facility Type">
              <el-input v-model="facilityForm.type" placeholder="Enter facility type" />
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionFacilityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Ownership Type">
              <el-select v-model="facilityForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
                <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Owner/Operator">
              <el-input v-model="facilityForm.owner" placeholder="Enter owner/operator" />
            </el-form-item>
          </template>

          <!-- Railway Fields -->
          <template v-if="selectedFacilityType === 'railway'">
            <el-form-item label="Number of Tracks">
              <el-input-number v-model="facilityForm.number_of_tracks" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Reserve Width (m)">
              <el-input-number v-model="facilityForm.reserve_width_m" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Traffic">
              <el-select v-model="facilityForm.traffic_railway" placeholder="Select traffic" filterable style="width: 100%">
                <el-option v-for="item in railwayTrafficOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Reserve Encroached">
              <el-select v-model="facilityForm.reserve_encroached" placeholder="Select reserve encroached" filterable style="width: 100%">
                <el-option v-for="item in yesNoPlainOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Rail Tracks Condition">
              <el-select v-model="facilityForm.rail_tracks_condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Reserve Condition">
              <el-select v-model="facilityForm.reserve_condition" placeholder="Select reserve condition" filterable style="width: 100%">
                <el-option v-for="item in reserveConditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>

          <!-- Powerline Fields -->
          <template v-if="selectedFacilityType === 'powerline'">
            <el-form-item label="Phases">
              <el-select v-model="facilityForm.pl_phases" placeholder="Select phases" filterable style="width: 100%">
                <el-option v-for="item in powerlinePhaseOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Type of Supply">
              <el-select v-model="facilityForm.pl_type_of_supply" placeholder="Select type of supply" filterable style="width: 100%">
                <el-option v-for="item in powerlineSupplyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>

          <!-- Stream Fields -->
          <template v-if="selectedFacilityType === 'stream'">
            <el-form-item label="Width">
              <el-input-number v-model="facilityForm.stream_width" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </template>

          <!-- Police Station Fields -->
          <template v-if="selectedFacilityType === 'police'">
            <el-form-item label="Type">
              <el-select v-model="facilityForm.pc_type" placeholder="Select type" filterable style="width: 100%">
                <el-option v-for="item in policeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Number of Officers">
              <el-input-number v-model="facilityForm.pc_number_of_officers" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Number of Vehicles">
              <el-input v-model="facilityForm.pc_number_of_vehicles" placeholder="Enter number of vehicles" />
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.pc_condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionFacilityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>

          <!-- Community Hall Fields -->
          <template v-if="selectedFacilityType === 'communityhall'">
            <el-form-item label="Use">
              <el-input v-model="facilityForm.community_hall_use" placeholder="Enter use" />
            </el-form-item>
            <el-form-item label="Usage Fee">
              <el-input-number v-model="facilityForm.community_hall_usage_fee" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.community_hall_condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionFacilityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Ownership">
              <el-select v-model="facilityForm.community_hall_ownership" placeholder="Select ownership" filterable style="width: 100%">
                <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Owner">
              <el-input v-model="facilityForm.community_hall_owner" placeholder="Enter owner" />
            </el-form-item>
          </template>

          <!-- Crime Hotspot Fields -->
          <template v-if="selectedFacilityType === 'crimehotspot'">
            <el-form-item label="Crime Type">
              <el-select v-model="facilityForm.ch_crime_type" placeholder="Select crime type" filterable style="width: 100%">
                <el-option v-for="item in crimeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Frequency">
              <el-select v-model="facilityForm.ch_frequency" placeholder="Select frequency" filterable style="width: 100%">
                <el-option v-for="item in frequencyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Crime Target">
              <el-input v-model="facilityForm.ch_crime_target" placeholder="Enter crime target (comma-separated)" />
            </el-form-item>
            <el-form-item label="Offender Type">
              <el-input v-model="facilityForm.ch_offender_type" placeholder="Enter offender type" />
            </el-form-item>
            <el-form-item label="Time of Day">
              <el-input v-model="facilityForm.ch_time_of_day" placeholder="Enter time of day (comma-separated)" />
            </el-form-item>
            <el-form-item label="Number of Victims per Month">
              <el-input-number v-model="facilityForm.ch_num_victims" :min="0" style="width: 100%" />
            </el-form-item>
          </template>

          <!-- Dumping Site Fields -->
          <template v-if="selectedFacilityType === 'dumpingsite'">
            <el-form-item label="Type">
              <el-input v-model="facilityForm.ds_type" placeholder="Enter type" />
            </el-form-item>
            <el-form-item label="Status">
              <el-select v-model="facilityForm.ds_status" placeholder="Select status" filterable style="width: 100%">
                <el-option v-for="item in conditionFacilityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Type of Waste">
              <el-input v-model="facilityForm.ds_type_of_waste" placeholder="Enter type of waste (comma-separated)" />
            </el-form-item>
            <el-form-item label="Year Established">
              <el-date-picker
                v-model="facilityForm.ds_year_established"
                type="year"
                placeholder="Select year"
                style="width: 100%"
                format="YYYY"
                value-format="YYYY"
              />
            </el-form-item>
          </template>

          <!-- Floodlight Fields -->
          <template v-if="selectedFacilityType === 'floodlight'">
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.floodlight_condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Rating (Watts)">
              <el-input-number v-model="facilityForm.floodlight_rating_watts" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Height (Meters)">
              <el-input-number v-model="facilityForm.floodlight_height_meters" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Date Installed">
              <el-date-picker
                v-model="facilityForm.floodlight_date_installed"
                type="month"
                placeholder="Select month"
                style="width: 100%"
                format="YYYY-MM"
                value-format="YYYY-MM"
              />
            </el-form-item>
            <el-form-item label="Sponsor/Owner Type">
              <el-select v-model="facilityForm.floodlight_sponsor_owner_type" placeholder="Select sponsor/owner type" filterable style="width: 100%">
                <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Sponsor/Owner">
              <el-input v-model="facilityForm.floodlight_sponsor_owner" placeholder="Enter sponsor/owner" />
            </el-form-item>
          </template>

          <!-- Street Light Fields -->
          <template v-if="selectedFacilityType === 'streetlight'">
            <el-form-item label="Road Name">
              <el-input v-model="facilityForm.streetlight_road_name" placeholder="Enter road name" />
            </el-form-item>
            <el-form-item label="Type">
              <el-input v-model="facilityForm.streetlight_type" placeholder="Enter type" />
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.streetlight_condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>

          <!-- Mast Fields -->
          <template v-if="selectedFacilityType === 'mast'">
            <el-form-item label="Type">
              <el-input v-model="facilityForm.mast_tc_type" placeholder="Enter type" />
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.mast_tc_condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>

          <!-- Road Asset Fields -->
          <template v-if="selectedFacilityType === 'roadasset'">
            <el-form-item label="Asset Type">
              <el-select v-model="facilityForm.road_asset_type" placeholder="Select asset type" filterable style="width: 100%">
                <el-option v-for="item in roadAssetTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Condition">
              <el-select v-model="facilityForm.road_asset_condition" placeholder="Select condition" filterable style="width: 100%">
                <el-option v-for="item in conditionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>

          <!-- Hazard Zone Fields -->
          <template v-if="selectedFacilityType === 'hazardzone'">
            <el-form-item label="Hazard Type">
              <el-input v-model="facilityForm.hazard_zone_hazard_type" placeholder="Enter hazard type (comma-separated)" />
            </el-form-item>
            <el-form-item label="Nature">
              <el-select v-model="facilityForm.hazard_zone_nature" placeholder="Select nature" filterable style="width: 100%">
                <el-option v-for="item in hazardNatureOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Number of Affected Persons">
              <el-input-number v-model="facilityForm.hazard_zone_number_of_affected_persons" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Frequency of Occurrence">
              <el-select v-model="facilityForm.hazard_zone_frequency_of_occurrence" placeholder="Select frequency" filterable style="width: 100%">
                <el-option v-for="item in frequencyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Damage Cost">
              <el-input-number v-model="facilityForm.hazard_zone_damage_cost" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Comment">
              <el-input v-model="facilityForm.hazard_zone_comment" type="textarea" :rows="3" placeholder="Enter comment" />
            </el-form-item>
          </template>
        </template>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button v-if="facilityPolyline" @click="hideDrawerForVertexEdit">
            Hide to Edit Line
          </el-button>
          <el-button @click="closeDrawer">Cancel</el-button>
          <el-button 
            v-if="selectedFacilityType"
            type="primary" 
            @click="submitForm" 
            :icon="Check">
            {{ isEditingMode ? 'Update Facility' : 'Save Facility' }}
          </el-button>
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
  </div>
</template>

<style scoped>
.add-facility-container {
  padding: 6px;
}

.add-facility-container :deep(.el-card__body) {
  padding: 16px;
}

/* When map step is active, set body padding to 8px */
.add-facility-container:has(.map-step) :deep(.el-card__body) {
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
.action-button {
  min-width: auto;
  width: auto;
  height: auto;
  padding: 5px 12px;
  border-radius: 4px;
  position: relative;
  z-index: 2;
  cursor: pointer;
}

.action-button .action-text {
  display: inline;
  margin-left: 4px;
  pointer-events: none;
}

/* Desktop: ensure text is visible */
@media (min-width: 769px) {
  .action-button {
    min-width: auto;
    width: auto;
    height: auto;
    padding: 5px 12px;
    border-radius: 4px;
  }
  
  .action-button .action-text {
    display: inline;
    margin-left: 4px;
  }
}

/* Reduce el-card header padding */
:deep(.el-card__header) {
  padding: 12px 16px;
}

.step-content {
  padding: 10px 0;
  min-height: 400px;
}

.map-step {
  position: relative;
  padding: 0;
  margin: 0;
}

.map-container {
  width: 100%;
  height: 67vh;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  position: relative;
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
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .add-facility-container {
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

  .action-button {
    min-width: 32px;
    width: 32px;
    height: 32px;
    padding: 0;
    position: relative;
    z-index: 2;
    cursor: pointer;
  }
  
  .action-button .action-text {
    display: none;
    pointer-events: none;
  }

  :deep(.el-card__header) {
    padding: 8px 12px;
  }

  .map-container {
    height: 67vh;
  }

  .step-content {
    min-height: 300px;
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
}
</style>
