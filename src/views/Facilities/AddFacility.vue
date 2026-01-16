<script setup lang="ts">
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
  ElDrawer,
  ElMessage,
  ElSteps,
  ElStep,
  ElRow,
  ElCol,
  ElDivider,
  ElDatePicker,
  ElAlert,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
} from 'element-plus'
import { ArrowLeft, Plus, Delete, Check, MoreFilled } from '@element-plus/icons-vue'
import * as turf from '@turf/turf'
import { getOneGeo } from '@/api/settlements'
import { CreateRecord } from '@/api/settlements'
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

const hasNationalAccess = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.user_roles?.location_level === 'national'
  ) || false
})

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

// Drawer state
const drawerVisible = ref(false)
const selectedFacilityType = ref<string>('')
const formRef = ref<FormInstance>()

// Unified form with all fields
const facilityForm = reactive({
  // Common fields
  name: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  geom: null,
  
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
  frequency: '',
  type_waste: '',
  cost_per_use: null,
  number_stances: null,
  number_staff: null,
  number_phases: '',
  size_reserve: null,
  rating: '',
  number_vehicles: null,
  date_install: null,
  height: null,
  hazard: ''
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

// Check if settlement has valid geometry
const checkSettlementGeometry = async (settlementId: number): Promise<boolean> => {
  if (settlementGeometryCache.value.has(settlementId)) {
    return settlementGeometryCache.value.get(settlementId) || false
  }

  try {
    const formData = {
      model: 'settlement',
      id: settlementId
    }
    const res = await getOneGeo(formData)

    if (res.data[0]?.json_build_object?.features?.length > 0) {
      const feature = res.data[0].json_build_object.features[0]
      const geometryType = feature.geometry?.type
      const hasValidGeometry = geometryType === 'Polygon' || geometryType === 'MultiPolygon'
      settlementGeometryCache.value.set(settlementId, hasValidGeometry)
      return hasValidGeometry
    }
    
    settlementGeometryCache.value.set(settlementId, false)
    return false
  } catch (error) {
    console.error(`Error checking geometry for settlement ${settlementId}:`, error)
    settlementGeometryCache.value.set(settlementId, false)
    return false
  }
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
    
    const geometryChecks = await Promise.all(
      countySettlements.map(async (settlement: any) => {
        const hasValidGeometry = await checkSettlementGeometry(settlement.value)
        return { settlement, hasValidGeometry }
      })
    )
    
    filteredSettlements.value = geometryChecks
      .filter(({ hasValidGeometry }) => hasValidGeometry)
      .map(({ settlement }) => settlement)
    
    if (filteredSettlements.value.length === 0) {
      ElMessage.warning('No settlements with boundary geometry found for this county')
    }
  } catch (error) {
    console.error('Error filtering settlements:', error)
    ElMessage.error('Failed to filter settlements')
  } finally {
    checkingGeometry.value = false
  }
}

// Handle settlement selection and proceed to map
const handleSettlementChange = async (settlementId: any) => {
  if (!settlementId) return

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
    const { Loader } = await import('@googlemaps/js-api-loader')
    const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'
    
    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
      libraries: ['drawing', 'geometry', 'places'],
      region: 'KE',
      language: 'en'
    })

    await loader.load()

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
          if (selectedFacilityType.value === 'pipedwater') {
            // Piped water uses MultiLineString
            geometry = {
              type: 'MultiLineString',
              coordinates: [coordinates],
              crs: { type: 'name', properties: { name: 'EPSG:4326' } }
            }
          } else {
            // Roads and sewers use LineString
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
  } catch (error) {
    console.error('Error initializing Google Maps:', error)
    ElMessage.error('Failed to load map')
  }
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
const enableLineDrawing = () => {
  if (!drawingManager.value || !window.google) {
    ElMessage.error('Map not initialized. Please wait for the map to load.')
    return
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
  lineDrawingMode.value = true
  drawingManager.value.setDrawingMode(window.google.maps.drawing.OverlayType.POLYLINE)
  ElMessage.info('Click on the map to start drawing. Double-click to finish the line.')
}

// Delete marker
const deleteMarker = () => {
  if (facilityMarker.value) {
    // Remove all event listeners
    if (window.google && window.google.maps) {
      window.google.maps.event.clearInstanceListeners(facilityMarker.value)
    }
    // Remove from map
    facilityMarker.value.setMap(null)
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

// Reset form
const resetForm = () => {
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
        } else if (selectedFacilityType.value === 'other') {
          Object.assign(formDataToSubmit, {
            type: facilityForm.type,
            condition: facilityForm.condition,
            frequency: facilityForm.frequency,
            type_waste: facilityForm.type_waste,
            cost_per_use: facilityForm.cost_per_use,
            number_stances: facilityForm.number_stances,
            number_staff: facilityForm.number_staff,
            number_phases: facilityForm.number_phases,
            size_reserve: facilityForm.size_reserve,
            rating: facilityForm.rating,
            number_vehicles: facilityForm.number_vehicles,
            date_install: (facilityForm.date_install && facilityForm.date_install !== 'Invalid date' && facilityForm.date_install !== null && facilityForm.date_install !== '' && !isNaN(Date.parse(facilityForm.date_install))) ? facilityForm.date_install : null,
            height: facilityForm.height,
            ownership_type: facilityForm.ownership_type,
            hazard: facilityForm.hazard,
            owner: facilityForm.owner
          })
        }

        const res = await CreateRecord(formDataToSubmit)
        
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
          // Reset form but keep facility type selected for next entry
          resetForm()
          drawerVisible.value = false
          // Keep selectedFacilityType so user can add another facility of same type
          markerPlacementMode.value = false
        } else {
          ElMessage.error('Failed to create facility')
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
      if (settlementPolygon.value) {
        settlementPolygon.value.setMap(null)
        settlementPolygon.value = null
      }
      map.value = null
      settlementGeo.value = null
      facilityGeometry.value = null
      facilityForm.geom = null
      markerPlacementMode.value = false
    }
  } else {
    router.back()
  }
}

// Preload settlement from query parameters
onMounted(async () => {
  const routeCountyId = route.query.county_id
  const routeSettlementId = route.query.settlement_id
  
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
          <el-button :icon="ArrowLeft" @click="goBack" text size="small">Back</el-button>
           <el-steps :active="currentStep" finish-status="success" class="header-steps" :class="{ 'hide-on-mobile': isMobile }">
            <el-step
              v-for="(step, index) in steps"
              :key="index"
              :title="step.title"
              :description="step.description"
            />
          </el-steps>
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
        <div class="map-controls">
          <!-- Desktop: Show all buttons -->
          <div class="map-controls-buttons desktop-controls">
            <!-- Point controls - always visible -->
            <el-button 
              type="primary" 
              @click="enableMarkerPlacement" 
              size="small" 
              :disabled="markerPlacementMode">
              <el-icon style="margin-right: 5px;"><Plus /></el-icon>
              Add Point
            </el-button>
            <el-button 
              v-if="facilityMarker"
              type="danger" 
              @click="deleteMarker" 
              size="small">
              <el-icon style="margin-right: 5px;"><Delete /></el-icon>
              Delete Point
            </el-button>
            
            <!-- Line controls - always visible -->
            <el-button 
              type="success" 
              @click="enableLineDrawing" 
              size="small" 
              :disabled="lineDrawingMode">
              <el-icon style="margin-right: 5px;"><Plus /></el-icon>
              Draw Line
            </el-button>
            <el-button 
              v-if="facilityPolyline"
              type="warning" 
              @click="deleteLine" 
              size="small">
              <el-icon style="margin-right: 5px;"><Delete /></el-icon>
              Delete Line
            </el-button>
          </div>
          
          <!-- Mobile: Show dropdown menu -->
          <el-dropdown 
            class="mobile-controls" 
            trigger="click" 
            placement="bottom-end"
            @command="handleMenuCommand">
            <el-button 
              type="primary" 
              size="small" 
              circle
              :icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  command="add-point" 
                  :disabled="markerPlacementMode">
                  <el-icon><Plus /></el-icon>
                  <span style="margin-left: 8px;">Add Point</span>
                </el-dropdown-item>
                <el-dropdown-item 
                  v-if="facilityMarker"
                  command="delete-point" 
                  divided>
                  <el-icon><Delete /></el-icon>
                  <span style="margin-left: 8px;">Delete Point</span>
                </el-dropdown-item>
                <el-dropdown-item 
                  command="draw-line" 
                  :disabled="lineDrawingMode">
                  <el-icon><Plus /></el-icon>
                  <span style="margin-left: 8px;">Draw Line</span>
                </el-dropdown-item>
                <el-dropdown-item 
                  v-if="facilityPolyline"
                  command="delete-line" 
                  divided>
                  <el-icon><Delete /></el-icon>
                  <span style="margin-left: 8px;">Delete Line</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- Status messages -->
          <div class="map-controls-messages hide-messages-on-mobile">
            <div v-if="facilityMarker" class="status-message">
              Click the marker to open the form
            </div>
            <div v-if="facilityPolyline" class="status-message">
              Click the line to open the form
            </div>
            <div v-if="lineDrawingMode" class="status-message status-message-active">
              Click to start drawing. Double-click to finish.
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Form Drawer (opens after placing marker) -->
    <el-drawer
      v-model="drawerVisible"
      title="Add Facility"
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
            <el-form-item label="Frequency">
              <el-input v-model="facilityForm.frequency" placeholder="Enter frequency" />
            </el-form-item>
            <el-form-item label="Type of Waste">
              <el-input v-model="facilityForm.type_waste" placeholder="Enter type of waste" />
            </el-form-item>
            <el-form-item label="Cost per Use">
              <el-input-number v-model="facilityForm.cost_per_use" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Number of Stances">
              <el-input-number v-model="facilityForm.number_stances" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Number of Staff">
              <el-input-number v-model="facilityForm.number_staff" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Number of Phases">
              <el-input v-model="facilityForm.number_phases" placeholder="Enter number of phases" />
            </el-form-item>
            <el-form-item label="Size Reserve">
              <el-input-number v-model="facilityForm.size_reserve" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Rating">
              <el-input v-model="facilityForm.rating" placeholder="Enter rating" />
            </el-form-item>
            <el-form-item label="Number of Vehicles">
              <el-input-number v-model="facilityForm.number_vehicles" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Date Installed">
              <el-date-picker
                v-model="facilityForm.date_install"
                type="date"
                placeholder="Select date"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="Height">
              <el-input-number v-model="facilityForm.height" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="Ownership Type">
              <el-select v-model="facilityForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
                <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Hazard">
              <el-input v-model="facilityForm.hazard" placeholder="Enter hazard information" />
            </el-form-item>
            <el-form-item label="Owner/Operator">
              <el-input v-model="facilityForm.owner" placeholder="Enter owner/operator" />
            </el-form-item>
          </template>
        </template>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="closeDrawer">Cancel</el-button>
          <el-button 
            v-if="selectedFacilityType"
            type="primary" 
            @click="submitForm" 
            :icon="Check">
            Save Facility
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.add-facility-container {
  padding: 20px;
}

.add-facility-container :deep(.el-card__body) {
  padding: 10px 20px;
}

.header-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  padding: 0;
}

.header-content h2 {
  margin: 0;
  font-size: 18px;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-steps {
  flex: 1;
  min-width: 0;
}

.hide-on-mobile {
  display: none;
}

.step-content {
  padding: 10px 0;
  min-height: 400px;
}

.map-step {
  position: relative;
}

.map-container {
  width: 100%;
  height: 520px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  position: relative;
}

.map-step {
  position: relative;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: calc(100% - 20px);
  background: var(--el-bg-color);
  padding: 10px;
  border-radius: 6px;
  box-shadow: var(--el-box-shadow);
  border: 1px solid var(--el-border-color-lighter);
  pointer-events: auto;
}

.map-controls-buttons {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.desktop-controls {
  display: flex;
}

.mobile-controls {
  display: none;
}

.map-controls-messages {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.status-message {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  align-self: center;
  text-align: right;
}

.status-message-active {
  color: var(--el-color-primary);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .map-container {
    height: 340px;
  }

  .step-content {
    min-height: 300px;
  }

  .hide-on-mobile {
    display: none !important;
  }

  .map-controls {
    top: auto;
    bottom: 10px;
    left: 10px;
    right: auto;
    padding: 8px;
    gap: 6px;
  }

  .desktop-controls {
    display: none !important;
  }

  .mobile-controls {
    display: block !important;
  }

  .hide-messages-on-mobile {
    display: none !important;
  }

  .map-controls-messages {
    justify-content: center;
    text-align: center;
    gap: 4px;
    margin-top: 4px;
  }

  .status-message {
    font-size: 10px;
    width: 100%;
    text-align: center;
  }
}
</style>
